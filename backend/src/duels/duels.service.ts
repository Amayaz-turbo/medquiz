import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";
import { AnswerOpenerDto } from "./dto/answer-opener.dto";
import { ChooseSubjectDto } from "./dto/choose-subject.dto";
import { CreateDuelDto } from "./dto/create-duel.dto";
import { DuelRoundAnswerDto } from "./dto/duel-round-answer.dto";
import { JokerRequestDto } from "./dto/joker-request.dto";
import { JokerRespondDto } from "./dto/joker-respond.dto";
import { OpenerDecisionDto } from "./dto/opener-decision.dto";

type DuelStatus = "pending_opener" | "in_progress" | "completed" | "cancelled" | "expired";
type MatchmakingMode = "friend_invite" | "random_free" | "random_level";
type DuelRoundStatus = "awaiting_choice" | "player1_turn" | "player2_turn" | "completed" | "scored_zero";

type Queryable = {
  query: <T>(
    text: string,
    values?: readonly unknown[] | unknown[]
  ) => Promise<{ rows: T[]; rowCount: number }>;
};

interface DuelRow {
  id: string;
  player1_id: string;
  player2_id: string;
  matchmaking_mode: MatchmakingMode;
  status: DuelStatus;
  starter_user_id: string | null;
  current_turn_user_id: string | null;
  current_round_no: number;
  player1_score: number;
  player2_score: number;
  turn_deadline_at: string | null;
  tie_break_played: boolean;
  winner_user_id: string | null;
  win_reason: "score" | "tie_break_speed" | "forfeit" | "timeout" | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

interface DuelOpenerRow {
  id: string;
  duel_id: string;
  question_id: string;
  player1_choice_id: string | null;
  player2_choice_id: string | null;
  player1_correct: boolean | null;
  player2_correct: boolean | null;
  player1_response_time_ms: number | null;
  player2_response_time_ms: number | null;
  winner_user_id: string | null;
  winner_decision: "take_hand" | "leave_hand" | null;
  resolved_at: string | null;
}

interface DuelRoundRow {
  id: string;
  duel_id: string;
  round_no: number;
  offered_subject_1_id: string;
  offered_subject_2_id: string;
  offered_subject_3_id: string;
  chosen_subject_id: string | null;
  chosen_by_user_id: string | null;
  status: DuelRoundStatus;
  player1_done_at: string | null;
  player2_done_at: string | null;
  created_at: string;
}

interface DuelJokerRow {
  id: string;
  duel_id: string;
  requested_by_user_id: string;
  granted_by_user_id: string;
  status: "pending" | "granted" | "rejected" | "expired";
  requested_at: string;
  resolved_at: string | null;
  old_deadline_at: string | null;
  new_deadline_at: string | null;
}

export interface SubjectLite {
  id: string;
  name: string;
}

@Injectable()
export class DuelsService {
  constructor(private readonly db: DatabaseService) {}

  async createDuel(userId: string, dto: CreateDuelDto) {
    const opponentUserId = await this.resolveOpponentUserId(userId, dto);
    if (opponentUserId === userId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "opponentUserId must be different from current user"
      });
    }

    try {
      return await this.db.withTransaction(async (client) => {
        const duelId = randomUUID();
        const openerQuestionId = await this.pickOpenerQuestionId(client);
        const autoAccepted = dto.matchmakingMode !== "friend_invite";

        await client.query(
          `
            INSERT INTO duels
              (id, player1_id, player2_id, matchmaking_mode, status, accepted_at)
            VALUES
              ($1, $2, $3, $4, 'pending_opener', $5)
          `,
          [duelId, userId, opponentUserId, dto.matchmakingMode, autoAccepted ? new Date() : null]
        );

        await client.query(
          `
            INSERT INTO duel_openers (id, duel_id, question_id)
            VALUES ($1, $2, $3)
          `,
          [randomUUID(), duelId, openerQuestionId]
        );

        if (autoAccepted) {
          await this.insertNotification(client, {
            userId: opponentUserId,
            type: "duel_turn",
            payload: {
              duelId,
              reason: "duel_created_random"
            }
          });
        }

        const duel = await this.getDuelForUser(client, duelId, userId);
        return {
          duelId: duel.id,
          status: duel.status
        };
      });
    } catch (error) {
      this.rethrowKnownDuelErrors(error);
      throw error;
    }
  }

  async listDuels(userId: string, status?: DuelStatus) {
    const params: unknown[] = [userId];
    const whereStatus = status ? "AND d.status = $2" : "";
    if (status) {
      params.push(status);
    }

    const result = await this.db.query<{
      id: string;
      status: DuelStatus;
      player1_score: number;
      player2_score: number;
      created_at: string;
      completed_at: string | null;
    }>(
      `
        SELECT
          d.id,
          d.status,
          d.player1_score,
          d.player2_score,
          d.created_at,
          d.completed_at
        FROM duels d
        WHERE (d.player1_id = $1 OR d.player2_id = $1)
          ${whereStatus}
        ORDER BY d.created_at DESC
        LIMIT 100
      `,
      params
    );

    return result.rows.map((row) => ({
      id: row.id,
      status: row.status,
      player1Score: row.player1_score,
      player2Score: row.player2_score,
      createdAt: row.created_at,
      completedAt: row.completed_at
    }));
  }

  async getDuel(userId: string, duelId: string) {
    const duel = await this.getDuelForUser(this.db, duelId, userId);
    const opener = await this.getOpenerRow(this.db, duelId);
    const rounds = await this.getAllRounds(this.db, duelId);

    const jokerUsage = await this.db.query<{
      requested_by_user_id: string;
      status: string;
    }>(
      `
        SELECT requested_by_user_id, status
        FROM duel_jokers
        WHERE duel_id = $1
      `,
      [duelId]
    );

    const pendingJoker = await this.db.query<DuelJokerRow>(
      `
        SELECT
          id,
          duel_id,
          requested_by_user_id,
          granted_by_user_id,
          status,
          requested_at,
          resolved_at,
          old_deadline_at,
          new_deadline_at
        FROM duel_jokers
        WHERE duel_id = $1
          AND status = 'pending'
        ORDER BY requested_at DESC
        LIMIT 1
      `,
      [duelId]
    );

    return {
      id: duel.id,
      status: duel.status,
      matchmakingMode: duel.matchmaking_mode,
      player1Id: duel.player1_id,
      player2Id: duel.player2_id,
      currentRoundNo: duel.current_round_no,
      currentTurnUserId: duel.current_turn_user_id,
      turnDeadlineAt: duel.turn_deadline_at,
      score: {
        player1: duel.player1_score,
        player2: duel.player2_score
      },
      winnerUserId: duel.winner_user_id,
      winReason: duel.win_reason,
      tieBreakPlayed: duel.tie_break_played,
      opener: opener
        ? {
            winnerUserId: opener.winner_user_id,
            winnerDecision: opener.winner_decision,
            resolvedAt: opener.resolved_at
          }
        : null,
      jokers: {
        player1Used: jokerUsage.rows.some((row) => row.requested_by_user_id === duel.player1_id),
        player2Used: jokerUsage.rows.some((row) => row.requested_by_user_id === duel.player2_id),
        pending:
          pendingJoker.rows[0] == null
            ? null
            : {
                id: pendingJoker.rows[0].id,
                requestedByUserId: pendingJoker.rows[0].requested_by_user_id,
                grantedByUserId: pendingJoker.rows[0].granted_by_user_id,
                requestedAt: pendingJoker.rows[0].requested_at
              }
      },
      rounds: rounds.map((row) => ({
        roundNo: row.round_no,
        status: row.status,
        chosenSubjectId: row.chosen_subject_id,
        chosenByUserId: row.chosen_by_user_id,
        player1DoneAt: row.player1_done_at,
        player2DoneAt: row.player2_done_at
      })),
      acceptedAt: duel.accepted_at,
      completedAt: duel.completed_at,
      createdAt: duel.created_at
    };
  }

  async acceptDuel(userId: string, duelId: string) {
    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.matchmaking_mode !== "friend_invite") {
        return { acceptedAt: duel.accepted_at ?? new Date().toISOString() };
      }
      if (duel.player2_id !== userId) {
        throw new UnprocessableEntityException({
          code: "DUEL_ACCEPT_FORBIDDEN",
          message: "Only invited user can accept this duel"
        });
      }
      if (duel.status !== "pending_opener") {
        throw new UnprocessableEntityException({
          code: "DUEL_INVALID_STATUS",
          message: "Duel is not pending opener"
        });
      }

      await client.query(
        `
          UPDATE duels
          SET accepted_at = COALESCE(accepted_at, NOW())
          WHERE id = $1
        `,
        [duelId]
      );

      await this.insertNotification(client, {
        userId: duel.player1_id,
        type: "duel_turn",
        payload: {
          duelId,
          reason: "duel_accepted"
        }
      });

      return { acceptedAt: new Date().toISOString() };
    });
  }

  async declineDuel(userId: string, duelId: string) {
    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.matchmaking_mode !== "friend_invite") {
        throw new UnprocessableEntityException({
          code: "DUEL_DECLINE_NOT_ALLOWED",
          message: "Decline is only allowed for friend_invite duels"
        });
      }
      if (duel.player2_id !== userId) {
        throw new UnprocessableEntityException({
          code: "DUEL_DECLINE_FORBIDDEN",
          message: "Only invited user can decline this duel"
        });
      }
      if (duel.accepted_at) {
        throw new UnprocessableEntityException({
          code: "DUEL_ALREADY_ACCEPTED",
          message: "Accepted duel cannot be declined"
        });
      }
      if (duel.status !== "pending_opener") {
        throw new UnprocessableEntityException({
          code: "DUEL_INVALID_STATUS",
          message: "Duel cannot be declined in current status"
        });
      }

      await client.query(
        `
          UPDATE duels
          SET status = 'cancelled',
              completed_at = NOW(),
              current_turn_user_id = NULL,
              turn_deadline_at = NULL
          WHERE id = $1
        `,
        [duelId]
      );

      await this.insertNotification(client, {
        userId: duel.player1_id,
        type: "duel_finished",
        payload: {
          duelId,
          reason: "declined"
        }
      });

      return {
        duelId,
        status: "cancelled"
      };
    });
  }

  async getOpener(userId: string, duelId: string) {
    await this.getDuelForUser(this.db, duelId, userId);
    const opener = await this.getOpenerRow(this.db, duelId);
    if (!opener) {
      throw new NotFoundException({
        code: "DUEL_OPENER_NOT_FOUND",
        message: "Opener not found"
      });
    }

    const questionResult = await this.db.query<{
      id: string;
      prompt: string;
      explanation: string;
      difficulty: number;
      choices: Array<{ id: string; label: string; position: number }>;
    }>(
      `
        SELECT
          q.id,
          q.prompt,
          q.explanation,
          q.difficulty,
          COALESCE(
            json_agg(
              json_build_object(
                'id', qc.id,
                'label', qc.label,
                'position', qc.position
              )
              ORDER BY qc.position
            ) FILTER (WHERE qc.id IS NOT NULL),
            '[]'::json
          ) AS choices
        FROM questions q
        LEFT JOIN question_choices qc ON qc.question_id = q.id
        WHERE q.id = $1
        GROUP BY q.id
      `,
      [opener.question_id]
    );

    const question = questionResult.rows[0];
    if (!question) {
      throw new NotFoundException({
        code: "DUEL_OPENER_QUESTION_NOT_FOUND",
        message: "Opener question not found"
      });
    }

    return {
      question: {
        id: question.id,
        prompt: question.prompt,
        explanation: question.explanation,
        difficulty: question.difficulty,
        choices: question.choices
      }
    };
  }

  async answerOpener(userId: string, duelId: string, dto: AnswerOpenerDto) {
    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.status !== "pending_opener") {
        throw new UnprocessableEntityException({
          code: "DUEL_INVALID_STATUS",
          message: "Opener can only be answered in pending_opener status"
        });
      }
      if (!duel.accepted_at) {
        throw new UnprocessableEntityException({
          code: "DUEL_NOT_ACCEPTED",
          message: "Duel must be accepted before answering opener"
        });
      }

      const opener = await this.getOpenerRow(client, duelId, true);
      if (!opener) {
        throw new NotFoundException({
          code: "DUEL_OPENER_NOT_FOUND",
          message: "Opener not found"
        });
      }

      const isPlayer1 = duel.player1_id === userId;
      const alreadyAnswered = isPlayer1 ? opener.player1_choice_id : opener.player2_choice_id;
      if (alreadyAnswered) {
        throw new UnprocessableEntityException({
          code: "DUEL_OPENER_ALREADY_ANSWERED",
          message: "Opener already answered by this player"
        });
      }

      const selectedChoice = await client.query<{ is_correct: boolean }>(
        `
          SELECT is_correct
          FROM question_choices
          WHERE id = $1
            AND question_id = $2
          LIMIT 1
        `,
        [dto.selectedChoiceId, opener.question_id]
      );
      if (selectedChoice.rowCount === 0) {
        throw new BadRequestException({
          code: "QUESTION_CHOICE_INVALID",
          message: "Selected choice does not belong to opener question"
        });
      }

      const isCorrect = selectedChoice.rows[0].is_correct;
      if (isPlayer1) {
        await client.query(
          `
            UPDATE duel_openers
            SET player1_choice_id = $2,
                player1_correct = $3,
                player1_response_time_ms = $4
            WHERE duel_id = $1
          `,
          [duelId, dto.selectedChoiceId, isCorrect, dto.responseTimeMs]
        );
      } else {
        await client.query(
          `
            UPDATE duel_openers
            SET player2_choice_id = $2,
                player2_correct = $3,
                player2_response_time_ms = $4
            WHERE duel_id = $1
          `,
          [duelId, dto.selectedChoiceId, isCorrect, dto.responseTimeMs]
        );
      }

      const updatedOpener = await this.getOpenerRow(client, duelId);
      if (!updatedOpener) {
        throw new NotFoundException({
          code: "DUEL_OPENER_NOT_FOUND",
          message: "Opener not found"
        });
      }

      if (
        updatedOpener.player1_choice_id &&
        updatedOpener.player2_choice_id &&
        !updatedOpener.winner_user_id
      ) {
        const winnerUserId = this.resolveOpenerWinnerUserId(duel, updatedOpener);
        await client.query(
          `
            UPDATE duel_openers
            SET winner_user_id = $2,
                resolved_at = NOW()
            WHERE duel_id = $1
          `,
          [duelId, winnerUserId]
        );
      }

      const final = await this.getOpenerRow(client, duelId);
      return {
        answeredBy: userId,
        playerCorrect: isCorrect,
        resolved: Boolean(final?.winner_user_id),
        winnerUserId: final?.winner_user_id ?? null
      };
    });
  }

  async decideOpener(userId: string, duelId: string, dto: OpenerDecisionDto) {
    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.status !== "pending_opener") {
        throw new UnprocessableEntityException({
          code: "DUEL_INVALID_STATUS",
          message: "Opener decision can only be made while duel is pending"
        });
      }

      const opener = await this.getOpenerRow(client, duelId, true);
      if (!opener || !opener.winner_user_id) {
        throw new UnprocessableEntityException({
          code: "DUEL_OPENER_NOT_RESOLVED",
          message: "Opener must be resolved first"
        });
      }
      if (opener.winner_decision) {
        throw new UnprocessableEntityException({
          code: "DUEL_OPENER_DECISION_ALREADY_MADE",
          message: "Opener decision already made"
        });
      }
      if (opener.winner_user_id !== userId) {
        throw new UnprocessableEntityException({
          code: "DUEL_OPENER_DECISION_FORBIDDEN",
          message: "Only opener winner can decide"
        });
      }

      const starterUserId = dto.decision === "take_hand" ? userId : this.getOtherPlayerId(duel, userId);

      await client.query(
        `
          UPDATE duel_openers
          SET winner_decision = $2
          WHERE duel_id = $1
        `,
        [duelId, dto.decision]
      );

      const deadline = this.plusHours(new Date(), 24);
      await client.query(
        `
          UPDATE duels
          SET
            status = 'in_progress',
            starter_user_id = $2,
            current_turn_user_id = $2,
            turn_deadline_at = $3,
            accepted_at = COALESCE(accepted_at, NOW()),
            current_round_no = 1
          WHERE id = $1
        `,
        [duelId, starterUserId, deadline]
      );

      await this.createRoundIfMissing(client, duel, 1, "awaiting_choice");

      await this.insertNotification(client, {
        userId: starterUserId,
        type: "duel_turn",
        payload: {
          duelId,
          reason: "opener_decision_made"
        }
      });

      return {
        duelId,
        starterUserId,
        currentTurnUserId: starterUserId,
        turnDeadlineAt: deadline.toISOString()
      };
    });
  }

  async getCurrentRound(userId: string, duelId: string) {
    const duel = await this.getDuelForUser(this.db, duelId, userId);
    const round = await this.getRound(this.db, duelId, duel.current_round_no);
    if (!round) {
      throw new NotFoundException({
        code: "DUEL_ROUND_NOT_FOUND",
        message: "Current round not found"
      });
    }

    const subjects = await this.getSubjectsByIds(this.db, [
      round.offered_subject_1_id,
      round.offered_subject_2_id,
      round.offered_subject_3_id
    ]);

    return {
      roundNo: round.round_no,
      status: round.status,
      offeredSubjects: [
        subjects.get(round.offered_subject_1_id),
        subjects.get(round.offered_subject_2_id),
        subjects.get(round.offered_subject_3_id)
      ].filter((value): value is SubjectLite => Boolean(value)),
      chosenSubjectId: round.chosen_subject_id,
      currentTurnUserId: duel.current_turn_user_id,
      turnDeadlineAt: duel.turn_deadline_at
    };
  }

  async chooseRoundSubject(userId: string, duelId: string, roundNo: number, dto: ChooseSubjectDto) {
    this.assertRoundNo(roundNo);

    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.status !== "in_progress") {
        throw new UnprocessableEntityException({
          code: "DUEL_INVALID_STATUS",
          message: "Duel is not in progress"
        });
      }
      if (duel.current_turn_user_id !== userId) {
        throw new UnprocessableEntityException({
          code: "DUEL_NOT_YOUR_TURN",
          message: "It is not your turn"
        });
      }
      if (duel.current_round_no !== roundNo) {
        throw new UnprocessableEntityException({
          code: "DUEL_ROUND_MISMATCH",
          message: "roundNo does not match current duel round"
        });
      }

      const round = await this.getRound(client, duelId, roundNo, true);
      if (!round) {
        throw new NotFoundException({
          code: "DUEL_ROUND_NOT_FOUND",
          message: "Round not found"
        });
      }
      if (round.chosen_subject_id) {
        throw new UnprocessableEntityException({
          code: "DUEL_ROUND_SUBJECT_ALREADY_CHOSEN",
          message: "Subject already chosen for this round"
        });
      }
      if (round.status !== "awaiting_choice") {
        throw new UnprocessableEntityException({
          code: "DUEL_ROUND_NOT_AWAITING_CHOICE",
          message: "Round does not accept subject choice now"
        });
      }

      const offered = [
        round.offered_subject_1_id,
        round.offered_subject_2_id,
        round.offered_subject_3_id
      ];
      if (!offered.includes(dto.subjectId)) {
        throw new UnprocessableEntityException({
          code: "DUEL_SUBJECT_NOT_OFFERED",
          message: "Subject is not among offered subjects"
        });
      }

      const turnStatus: DuelRoundStatus = userId === duel.player1_id ? "player1_turn" : "player2_turn";
      await client.query(
        `
          UPDATE duel_rounds
          SET chosen_subject_id = $2,
              chosen_by_user_id = $3,
              status = $4
          WHERE id = $1
        `,
        [round.id, dto.subjectId, userId, turnStatus]
      );

      await this.assignRoundQuestionsFairly(client, duel, round.id, dto.subjectId);

      return {
        roundNo,
        chosenSubjectId: dto.subjectId,
        currentTurnUserId: duel.current_turn_user_id
      };
    });
  }

  async getRoundQuestions(userId: string, duelId: string, roundNo: number) {
    this.assertRoundNo(roundNo);

    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.status !== "in_progress") {
        throw new UnprocessableEntityException({
          code: "DUEL_INVALID_STATUS",
          message: "Duel is not in progress"
        });
      }
      if (duel.current_round_no !== roundNo) {
        throw new UnprocessableEntityException({
          code: "DUEL_ROUND_MISMATCH",
          message: "roundNo does not match current duel round"
        });
      }
      if (duel.current_turn_user_id !== userId) {
        throw new UnprocessableEntityException({
          code: "DUEL_NOT_YOUR_TURN",
          message: "It is not your turn"
        });
      }

      const round = await this.getRound(client, duelId, roundNo, true);
      if (!round) {
        throw new NotFoundException({
          code: "DUEL_ROUND_NOT_FOUND",
          message: "Round not found"
        });
      }
      if (!round.chosen_subject_id) {
        throw new UnprocessableEntityException({
          code: "DUEL_SUBJECT_NOT_CHOSEN",
          message: "Subject must be chosen before fetching questions"
        });
      }

      await this.ensureRoundQuestionsAssigned(client, duel, round);

      const result = await client.query<{
        slot_no: number;
        difficulty_snapshot: number;
        id: string;
        prompt: string;
        explanation: string;
        difficulty: number;
        choices: Array<{ id: string; label: string; position: number }>;
      }>(
        `
          SELECT
            drq.slot_no,
            drq.difficulty_snapshot,
            q.id,
            q.prompt,
            q.explanation,
            q.difficulty,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', qc.id,
                  'label', qc.label,
                  'position', qc.position
                )
                ORDER BY qc.position
              ) FILTER (WHERE qc.id IS NOT NULL),
              '[]'::json
            ) AS choices
          FROM duel_round_questions drq
          JOIN questions q ON q.id = drq.question_id
          LEFT JOIN question_choices qc ON qc.question_id = q.id
          WHERE drq.duel_round_id = $1
            AND drq.user_id = $2
          GROUP BY drq.slot_no, drq.difficulty_snapshot, q.id
          ORDER BY drq.slot_no
        `,
        [round.id, userId]
      );

      return result.rows.map((row) => ({
        slotNo: row.slot_no,
        difficultySnapshot: row.difficulty_snapshot,
        question: {
          id: row.id,
          prompt: row.prompt,
          explanation: row.explanation,
          difficulty: row.difficulty,
          choices: row.choices
        }
      }));
    });
  }

  async submitRoundAnswer(userId: string, duelId: string, roundNo: number, dto: DuelRoundAnswerDto) {
    this.assertRoundNo(roundNo);

    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.status !== "in_progress") {
        throw new UnprocessableEntityException({
          code: "DUEL_INVALID_STATUS",
          message: "Duel is not in progress"
        });
      }
      if (duel.current_round_no !== roundNo) {
        throw new UnprocessableEntityException({
          code: "DUEL_ROUND_MISMATCH",
          message: "roundNo does not match current duel round"
        });
      }
      if (duel.current_turn_user_id !== userId) {
        throw new UnprocessableEntityException({
          code: "DUEL_NOT_YOUR_TURN",
          message: "It is not your turn"
        });
      }

      const round = await this.getRound(client, duelId, roundNo, true);
      if (!round) {
        throw new NotFoundException({
          code: "DUEL_ROUND_NOT_FOUND",
          message: "Round not found"
        });
      }
      if (!round.chosen_subject_id) {
        throw new UnprocessableEntityException({
          code: "DUEL_SUBJECT_NOT_CHOSEN",
          message: "Subject must be chosen before answering"
        });
      }

      await this.ensureRoundQuestionsAssigned(client, duel, round);

      const assigned = await client.query<{
        question_id: string;
      }>(
        `
          SELECT question_id
          FROM duel_round_questions
          WHERE duel_round_id = $1
            AND user_id = $2
            AND slot_no = $3
          LIMIT 1
        `,
        [round.id, userId, dto.slotNo]
      );
      const assignedQuestionId = assigned.rows[0]?.question_id;
      if (!assignedQuestionId) {
        throw new NotFoundException({
          code: "DUEL_QUESTION_ASSIGNMENT_NOT_FOUND",
          message: "Question assignment not found for slot"
        });
      }
      if (assignedQuestionId !== dto.questionId) {
        throw new UnprocessableEntityException({
          code: "DUEL_QUESTION_NOT_IN_SLOT",
          message: "questionId does not match assigned slot"
        });
      }

      const existingAnswer = await client.query<{ id: string }>(
        `
          SELECT id
          FROM duel_answers
          WHERE duel_round_id = $1
            AND user_id = $2
            AND slot_no = $3
          LIMIT 1
        `,
        [round.id, userId, dto.slotNo]
      );
      if (existingAnswer.rowCount > 0) {
        throw new UnprocessableEntityException({
          code: "DUEL_SLOT_ALREADY_ANSWERED",
          message: "This slot is already answered"
        });
      }

      const choice = await client.query<{
        id: string;
        is_correct: boolean;
      }>(
        `
          SELECT id, is_correct
          FROM question_choices
          WHERE id = $1
            AND question_id = $2
          LIMIT 1
        `,
        [dto.selectedChoiceId, dto.questionId]
      );
      if (choice.rowCount === 0) {
        throw new BadRequestException({
          code: "QUESTION_CHOICE_INVALID",
          message: "Selected choice does not belong to question"
        });
      }

      const correctChoiceResult = await client.query<{ id: string }>(
        `
          SELECT id
          FROM question_choices
          WHERE question_id = $1
            AND is_correct = TRUE
          LIMIT 1
        `,
        [dto.questionId]
      );

      const isCorrect = choice.rows[0].is_correct;
      await client.query(
        `
          INSERT INTO duel_answers
            (id, duel_id, duel_round_id, user_id, question_id, selected_choice_id, is_correct, response_time_ms, slot_no)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          randomUUID(),
          duelId,
          round.id,
          userId,
          dto.questionId,
          dto.selectedChoiceId,
          isCorrect,
          dto.responseTimeMs,
          dto.slotNo
        ]
      );

      const answeredCountResult = await client.query<{ c: string }>(
        `
          SELECT COUNT(*)::text AS c
          FROM duel_answers
          WHERE duel_round_id = $1
            AND user_id = $2
        `,
        [round.id, userId]
      );
      const answeredSlots = Number(answeredCountResult.rows[0]?.c ?? "0");
      const remainingSlots = Math.max(0, 3 - answeredSlots);

      if (answeredSlots < 3) {
        return {
          answerResult: {
            isCorrect,
            correctChoiceId: correctChoiceResult.rows[0]?.id ?? null,
            explanation: await this.getQuestionExplanation(client, dto.questionId)
          },
          roundProgress: {
            answeredSlots,
            remainingSlots
          },
          turnCompleted: false
        };
      }

      const completion = await this.completeTurn(client, duel, round, userId);

      return {
        answerResult: {
          isCorrect,
          correctChoiceId: correctChoiceResult.rows[0]?.id ?? null,
          explanation: await this.getQuestionExplanation(client, dto.questionId)
        },
        roundProgress: {
          answeredSlots,
          remainingSlots: 0
        },
        turnCompleted: true,
        ...completion
      };
    });
  }

  async requestJoker(userId: string, duelId: string, dto: JokerRequestDto) {
    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.status !== "in_progress") {
        throw new UnprocessableEntityException({
          code: "DUEL_INVALID_STATUS",
          message: "Joker can only be requested in an active duel"
        });
      }
      if (duel.current_turn_user_id !== userId) {
        throw new UnprocessableEntityException({
          code: "DUEL_NOT_YOUR_TURN",
          message: "Only current turn player can request a joker"
        });
      }

      const jokerId = randomUUID();
      const opponent = this.getOtherPlayerId(duel, userId);

      try {
        await client.query(
          `
            INSERT INTO duel_jokers
              (id, duel_id, requested_by_user_id, granted_by_user_id, status, old_deadline_at)
            VALUES
              ($1, $2, $3, $4, 'pending', $5)
          `,
          [jokerId, duelId, userId, opponent, duel.turn_deadline_at]
        );
      } catch (error) {
        const pgError = this.asPgError(error);
        if (pgError?.code === "23505") {
          throw new UnprocessableEntityException({
            code: "DUEL_JOKER_ALREADY_USED",
            message: "You already used your joker in this duel"
          });
        }
        throw error;
      }

      await this.insertNotification(client, {
        userId: opponent,
        type: "duel_joker_request",
        payload: {
          duelId,
          jokerId,
          reason: dto.reason ?? null
        }
      });

      return {
        jokerId,
        status: "pending"
      };
    });
  }

  async respondJoker(userId: string, duelId: string, jokerId: string, dto: JokerRespondDto) {
    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.status !== "in_progress") {
        throw new UnprocessableEntityException({
          code: "DUEL_INVALID_STATUS",
          message: "Duel is not in progress"
        });
      }

      const joker = await client.query<DuelJokerRow>(
        `
          SELECT
            id,
            duel_id,
            requested_by_user_id,
            granted_by_user_id,
            status,
            requested_at,
            resolved_at,
            old_deadline_at,
            new_deadline_at
          FROM duel_jokers
          WHERE id = $1
            AND duel_id = $2
          LIMIT 1
          FOR UPDATE
        `,
        [jokerId, duelId]
      );
      const row = joker.rows[0];
      if (!row) {
        throw new NotFoundException({
          code: "DUEL_JOKER_NOT_FOUND",
          message: "Joker request not found"
        });
      }
      if (row.granted_by_user_id !== userId) {
        throw new UnprocessableEntityException({
          code: "DUEL_JOKER_RESPONSE_FORBIDDEN",
          message: "Only opponent can respond to this joker"
        });
      }
      if (row.status !== "pending") {
        throw new UnprocessableEntityException({
          code: "DUEL_JOKER_ALREADY_RESOLVED",
          message: "Joker already resolved"
        });
      }

      if (dto.decision === "grant") {
        const base = row.old_deadline_at ?? duel.turn_deadline_at ?? new Date().toISOString();
        const newDeadline = this.plusHours(new Date(base), 24);

        await client.query(
          `
            UPDATE duels
            SET turn_deadline_at = $2
            WHERE id = $1
          `,
          [duelId, newDeadline]
        );

        await client.query(
          `
            UPDATE duel_jokers
            SET status = 'granted',
                resolved_at = NOW(),
                old_deadline_at = COALESCE(old_deadline_at, $2),
                new_deadline_at = $3
            WHERE id = $1
          `,
          [jokerId, base, newDeadline]
        );

        await this.insertNotification(client, {
          userId: row.requested_by_user_id,
          type: "duel_joker_granted",
          payload: {
            duelId,
            jokerId,
            newDeadlineAt: newDeadline.toISOString()
          }
        });

        return {
          jokerId,
          status: "granted",
          newDeadlineAt: newDeadline.toISOString()
        };
      }

      await client.query(
        `
          UPDATE duel_jokers
          SET status = 'rejected',
              resolved_at = NOW(),
              old_deadline_at = COALESCE(old_deadline_at, $2)
          WHERE id = $1
        `,
        [jokerId, duel.turn_deadline_at]
      );

      return {
        jokerId,
        status: "rejected"
      };
    });
  }

  async forfeitDuel(userId: string, duelId: string) {
    return this.db.withTransaction(async (client) => {
      const duel = await this.getDuelForUser(client, duelId, userId, true);
      if (duel.status === "completed" || duel.status === "cancelled" || duel.status === "expired") {
        throw new UnprocessableEntityException({
          code: "DUEL_ALREADY_FINISHED",
          message: "Duel is already finished"
        });
      }

      const winner = this.getOtherPlayerId(duel, userId);
      await client.query(
        `
          UPDATE duels
          SET status = 'completed',
              winner_user_id = $2,
              win_reason = 'forfeit',
              completed_at = NOW(),
              current_turn_user_id = NULL,
              turn_deadline_at = NULL
          WHERE id = $1
        `,
        [duelId, winner]
      );

      await this.insertNotification(client, {
        userId: winner,
        type: "duel_finished",
        payload: {
          duelId,
          reason: "forfeit",
          winnerUserId: winner
        }
      });

      return {
        duelId,
        winnerUserId: winner,
        winReason: "forfeit"
      };
    });
  }

  async expireDueTurns(limit = 100): Promise<{ processed: number; skippedNoRound: number }> {
    const safeLimit = Math.max(1, Math.min(limit, 500));
    const lockKey = 904205;

    const lock = await this.db.query<{ locked: boolean }>(
      `
        SELECT pg_try_advisory_lock($1) AS locked
      `,
      [lockKey]
    );
    if (!lock.rows[0]?.locked) {
      return { processed: 0, skippedNoRound: 0 };
    }

    let processed = 0;
    let skippedNoRound = 0;
    try {
      const dueDuels = await this.db.query<{ id: string }>(
        `
          SELECT id
          FROM duels
          WHERE status = 'in_progress'
            AND current_turn_user_id IS NOT NULL
            AND turn_deadline_at IS NOT NULL
            AND turn_deadline_at <= NOW()
          ORDER BY turn_deadline_at ASC
          LIMIT $1
        `,
        [safeLimit]
      );

      for (const due of dueDuels.rows) {
        const result = await this.db.withTransaction(async (client) => {
          const duel = await this.getDuelById(client, due.id, true);
          if (!duel) {
            return { processed: false, skippedNoRound: true };
          }
          if (
            duel.status !== "in_progress" ||
            !duel.current_turn_user_id ||
            !duel.turn_deadline_at ||
            new Date(duel.turn_deadline_at).getTime() > Date.now()
          ) {
            return { processed: false, skippedNoRound: false };
          }

          const round = await this.getRound(client, duel.id, duel.current_round_no, true);
          if (!round) {
            return { processed: false, skippedNoRound: true };
          }

          const timingOutUserId = duel.current_turn_user_id;
          if (timingOutUserId !== duel.player1_id && timingOutUserId !== duel.player2_id) {
            return { processed: false, skippedNoRound: false };
          }

          const opponent = this.getOtherPlayerId(duel, timingOutUserId);
          const nextDeadline = this.plusHours(new Date(), 24);

          if (!round.chosen_subject_id) {
            await client.query(
              `
                UPDATE duel_rounds
                SET status = 'awaiting_choice'
                WHERE id = $1
              `,
              [round.id]
            );
            await client.query(
              `
                UPDATE duels
                SET current_turn_user_id = $2,
                    turn_deadline_at = $3
                WHERE id = $1
              `,
              [duel.id, opponent, nextDeadline]
            );

            await this.insertNotification(client, {
              userId: opponent,
              type: "duel_turn",
              payload: {
                duelId: duel.id,
                roundNo: round.round_no,
                reason: "timeout_subject_choice"
              }
            });

            return { processed: true, skippedNoRound: false };
          }

          await client.query(
            `
              DELETE FROM duel_answers
              WHERE duel_round_id = $1
                AND user_id = $2
            `,
            [round.id, timingOutUserId]
          );
          await client.query(
            `
              UPDATE duel_rounds
              SET status = 'scored_zero'
              WHERE id = $1
            `,
            [round.id]
          );

          await this.completeTurn(client, duel, round, timingOutUserId);
          return { processed: true, skippedNoRound: false };
        });

        if (result.processed) {
          processed += 1;
        } else if (result.skippedNoRound) {
          skippedNoRound += 1;
        }
      }
    } finally {
      await this.db.query(
        `
          SELECT pg_advisory_unlock($1)
        `,
        [lockKey]
      );
    }

    return { processed, skippedNoRound };
  }

  private async completeTurn(
    client: PoolClient,
    duel: DuelRow,
    round: DuelRoundRow,
    userId: string
  ): Promise<Record<string, unknown>> {
    const userDoneField = userId === duel.player1_id ? "player1_done_at" : "player2_done_at";
    await client.query(
      `
        UPDATE duel_rounds
        SET ${userDoneField} = NOW()
        WHERE id = $1
      `,
      [round.id]
    );

    const updatedRound = await this.getRound(client, duel.id, round.round_no, true);
    if (!updatedRound) {
      throw new NotFoundException({
        code: "DUEL_ROUND_NOT_FOUND",
        message: "Round not found"
      });
    }

    const opponent = this.getOtherPlayerId(duel, userId);
    const bothDone = Boolean(updatedRound.player1_done_at && updatedRound.player2_done_at);

    if (!bothDone) {
      const turnStatus: DuelRoundStatus = opponent === duel.player1_id ? "player1_turn" : "player2_turn";
      const nextDeadline = this.plusHours(new Date(), 24);

      await client.query(
        `
          UPDATE duel_rounds
          SET status = $2
          WHERE id = $1
        `,
        [round.id, turnStatus]
      );

      await client.query(
        `
          UPDATE duels
          SET current_turn_user_id = $2,
              turn_deadline_at = $3
          WHERE id = $1
        `,
        [duel.id, opponent, nextDeadline]
      );

      await this.insertNotification(client, {
        userId: opponent,
        type: "duel_turn",
        payload: {
          duelId: duel.id,
          roundNo: round.round_no,
          reason: "turn_ready"
        }
      });

      return {
        duelStatus: "in_progress",
        currentTurnUserId: opponent,
        turnDeadlineAt: nextDeadline.toISOString(),
        roundCompleted: false
      };
    }

    const roundScore = await client.query<{
      user_id: string;
      score: string;
    }>(
      `
        SELECT user_id, COUNT(*) FILTER (WHERE is_correct)::text AS score
        FROM duel_answers
        WHERE duel_round_id = $1
        GROUP BY user_id
      `,
      [round.id]
    );

    const p1Round = Number(
      roundScore.rows.find((row) => row.user_id === duel.player1_id)?.score ?? "0"
    );
    const p2Round = Number(
      roundScore.rows.find((row) => row.user_id === duel.player2_id)?.score ?? "0"
    );

    await client.query(
      `
        UPDATE duels
        SET player1_score = player1_score + $2,
            player2_score = player2_score + $3
        WHERE id = $1
      `,
      [duel.id, p1Round, p2Round]
    );

    await client.query(
      `
        UPDATE duel_rounds
        SET status = 'completed'
        WHERE id = $1
      `,
      [round.id]
    );

    if (round.round_no < 5) {
      const nextRoundNo = round.round_no + 1;
      const nextStarter = this.getOtherPlayerId(duel, round.chosen_by_user_id ?? userId);

      await this.createRoundIfMissing(client, duel, nextRoundNo, "awaiting_choice");
      const nextDeadline = this.plusHours(new Date(), 24);

      await client.query(
        `
          UPDATE duels
          SET current_round_no = $2,
              current_turn_user_id = $3,
              turn_deadline_at = $4
          WHERE id = $1
        `,
        [duel.id, nextRoundNo, nextStarter, nextDeadline]
      );

      await this.insertNotification(client, {
        userId: nextStarter,
        type: "duel_turn",
        payload: {
          duelId: duel.id,
          roundNo: nextRoundNo,
          reason: "new_round"
        }
      });

      return {
        duelStatus: "in_progress",
        roundCompleted: true,
        nextRoundNo,
        currentTurnUserId: nextStarter,
        turnDeadlineAt: nextDeadline.toISOString()
      };
    }

    const latestDuel = await this.getDuelForUser(client, duel.id, duel.player1_id, true);
    const finish = await this.resolveDuelFinish(client, latestDuel);

    await this.insertNotification(client, {
      userId: duel.player1_id,
      type: "duel_finished",
      payload: {
        duelId: duel.id,
        winnerUserId: finish.winnerUserId,
        winReason: finish.winReason
      }
    });
    await this.insertNotification(client, {
      userId: duel.player2_id,
      type: "duel_finished",
      payload: {
        duelId: duel.id,
        winnerUserId: finish.winnerUserId,
        winReason: finish.winReason
      }
    });

    return {
      duelStatus: "completed",
      roundCompleted: true,
      duelCompleted: true,
      winnerUserId: finish.winnerUserId,
      winReason: finish.winReason,
      finalScore: {
        player1: latestDuel.player1_score,
        player2: latestDuel.player2_score
      }
    };
  }

  private async resolveDuelFinish(client: PoolClient, duel: DuelRow) {
    let winnerUserId = duel.player1_id;
    let winReason: "score" | "tie_break_speed" = "score";
    let tieBreakPlayed = false;

    if (duel.player1_score > duel.player2_score) {
      winnerUserId = duel.player1_id;
      winReason = "score";
    } else if (duel.player2_score > duel.player1_score) {
      winnerUserId = duel.player2_id;
      winReason = "score";
    } else {
      tieBreakPlayed = true;
      winReason = "tie_break_speed";
      const speed = await client.query<{
        user_id: string;
        total_ms: string;
      }>(
        `
          SELECT
            user_id,
            COALESCE(SUM(response_time_ms), 0)::text AS total_ms
          FROM duel_answers
          WHERE duel_id = $1
          GROUP BY user_id
        `,
        [duel.id]
      );

      const p1Ms = Number(speed.rows.find((row) => row.user_id === duel.player1_id)?.total_ms ?? "0");
      const p2Ms = Number(speed.rows.find((row) => row.user_id === duel.player2_id)?.total_ms ?? "0");

      if (p1Ms < p2Ms) {
        winnerUserId = duel.player1_id;
      } else if (p2Ms < p1Ms) {
        winnerUserId = duel.player2_id;
      } else {
        winnerUserId = duel.player1_id < duel.player2_id ? duel.player1_id : duel.player2_id;
      }
    }

    await client.query(
      `
        UPDATE duels
        SET status = 'completed',
            winner_user_id = $2,
            win_reason = $3,
            tie_break_played = $4,
            completed_at = NOW(),
            current_turn_user_id = NULL,
            turn_deadline_at = NULL
        WHERE id = $1
      `,
      [duel.id, winnerUserId, winReason, tieBreakPlayed]
    );

    return {
      winnerUserId,
      winReason
    };
  }

  private async ensureRoundQuestionsAssigned(
    client: PoolClient,
    duel: DuelRow,
    round: DuelRoundRow
  ): Promise<void> {
    const count = await client.query<{ c: string }>(
      `
        SELECT COUNT(*)::text AS c
        FROM duel_round_questions
        WHERE duel_round_id = $1
      `,
      [round.id]
    );
    if (Number(count.rows[0]?.c ?? "0") >= 6) {
      return;
    }

    if (!round.chosen_subject_id) {
      throw new UnprocessableEntityException({
        code: "DUEL_SUBJECT_NOT_CHOSEN",
        message: "Cannot assign round questions before subject selection"
      });
    }

    await this.assignRoundQuestionsFairly(client, duel, round.id, round.chosen_subject_id);
  }

  private async assignRoundQuestionsFairly(
    client: PoolClient,
    duel: DuelRow,
    duelRoundId: string,
    subjectId: string
  ): Promise<void> {
    const existing = await client.query<{ c: string }>(
      `
        SELECT COUNT(*)::text AS c
        FROM duel_round_questions
        WHERE duel_round_id = $1
      `,
      [duelRoundId]
    );
    if (Number(existing.rows[0]?.c ?? "0") >= 6) {
      return;
    }

    const difficultyCounts = await client.query<{
      difficulty: number;
      c: string;
    }>(
      `
        SELECT difficulty, COUNT(*)::text AS c
        FROM questions
        WHERE status = 'published'
          AND question_type = 'single_choice'
          AND subject_id = $1
        GROUP BY difficulty
      `,
      [subjectId]
    );

    const stock = new Map<number, number>();
    for (const row of difficultyCounts.rows) {
      stock.set(row.difficulty, Number(row.c));
    }

    const plan: number[] = [];
    for (let slot = 1; slot <= 3; slot += 1) {
      const candidates = Array.from(stock.entries())
        .filter(([, remaining]) => remaining > 0)
        .map(([difficulty]) => difficulty);

      if (candidates.length === 0) {
        throw new UnprocessableEntityException({
          code: "DUEL_SUBJECT_QUESTION_POOL_TOO_SMALL",
          message: "Not enough questions to build fair round for this subject"
        });
      }

      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      plan.push(picked);
      stock.set(picked, (stock.get(picked) ?? 1) - 1);
    }

    const playerSelections = new Map<string, string[]>();
    playerSelections.set(duel.player1_id, []);
    playerSelections.set(duel.player2_id, []);

    for (let i = 0; i < 3; i += 1) {
      const slotNo = i + 1;
      const difficulty = plan[i];

      for (const userId of [duel.player1_id, duel.player2_id]) {
        const selectedIds = playerSelections.get(userId) ?? [];
        const question = await this.pickQuestionForSlot(
          client,
          subjectId,
          difficulty,
          selectedIds
        );
        selectedIds.push(question.id);
        playerSelections.set(userId, selectedIds);

        await client.query(
          `
            INSERT INTO duel_round_questions
              (id, duel_round_id, user_id, slot_no, question_id, difficulty_snapshot)
            VALUES
              ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (duel_round_id, user_id, slot_no)
            DO UPDATE
            SET
              question_id = EXCLUDED.question_id,
              difficulty_snapshot = EXCLUDED.difficulty_snapshot
          `,
          [randomUUID(), duelRoundId, userId, slotNo, question.id, difficulty]
        );
      }
    }
  }

  private async pickQuestionForSlot(
    client: PoolClient,
    subjectId: string,
    difficulty: number,
    excludedQuestionIds: string[]
  ): Promise<{ id: string }> {
    const params: unknown[] = [subjectId, difficulty, excludedQuestionIds];

    const result = await client.query<{ id: string }>(
      `
        SELECT q.id
        FROM questions q
        WHERE q.status = 'published'
          AND q.question_type = 'single_choice'
          AND q.subject_id = $1
          AND q.difficulty = $2
          AND NOT (q.id = ANY($3::uuid[]))
        ORDER BY random()
        LIMIT 1
      `,
      params
    );

    const question = result.rows[0];
    if (!question) {
      throw new UnprocessableEntityException({
        code: "DUEL_SUBJECT_QUESTION_POOL_TOO_SMALL",
        message: "Not enough questions to build fair round for this subject"
      });
    }

    return question;
  }

  private async getQuestionExplanation(client: PoolClient, questionId: string): Promise<string | null> {
    const q = await client.query<{ explanation: string }>(
      `
        SELECT explanation
        FROM questions
        WHERE id = $1
        LIMIT 1
      `,
      [questionId]
    );
    return q.rows[0]?.explanation ?? null;
  }

  private resolveOpenerWinnerUserId(duel: DuelRow, opener: DuelOpenerRow): string {
    const p1Correct = opener.player1_correct ?? false;
    const p2Correct = opener.player2_correct ?? false;
    const p1Time = opener.player1_response_time_ms ?? Number.MAX_SAFE_INTEGER;
    const p2Time = opener.player2_response_time_ms ?? Number.MAX_SAFE_INTEGER;

    if (p1Correct && !p2Correct) {
      return duel.player1_id;
    }
    if (!p1Correct && p2Correct) {
      return duel.player2_id;
    }
    if (p1Time < p2Time) {
      return duel.player1_id;
    }
    if (p2Time < p1Time) {
      return duel.player2_id;
    }

    return duel.player1_id < duel.player2_id ? duel.player1_id : duel.player2_id;
  }

  private async resolveOpponentUserId(userId: string, dto: CreateDuelDto): Promise<string> {
    if (dto.matchmakingMode === "friend_invite") {
      if (!dto.opponentUserId) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "opponentUserId is required for friend_invite mode"
        });
      }
      return dto.opponentUserId;
    }

    if (dto.opponentUserId) {
      return dto.opponentUserId;
    }

    const sql =
      dto.matchmakingMode === "random_level"
        ? `
          SELECT u.id
          FROM users u
          JOIN user_profiles me ON me.user_id = $1
          LEFT JOIN user_profiles opp ON opp.user_id = u.id
          WHERE u.id <> $1
            AND u.is_active = TRUE
            AND (
              me.year_label IS NULL
              OR opp.year_label IS NULL
              OR me.year_label = opp.year_label
            )
          ORDER BY random()
          LIMIT 1
        `
        : `
          SELECT u.id
          FROM users u
          WHERE u.id <> $1
            AND u.is_active = TRUE
          ORDER BY random()
          LIMIT 1
        `;

    const candidate = await this.db.query<{ id: string }>(sql, [userId]);
    const found = candidate.rows[0]?.id;
    if (!found) {
      throw new NotFoundException({
        code: "NO_RANDOM_OPPONENT_AVAILABLE",
        message: "No random opponent available"
      });
    }
    return found;
  }

  private async pickOpenerQuestionId(client: PoolClient): Promise<string> {
    const result = await client.query<{ id: string }>(
      `
        SELECT q.id
        FROM questions q
        WHERE q.status = 'published'
          AND q.question_type = 'single_choice'
        ORDER BY random()
        LIMIT 1
      `
    );
    const questionId = result.rows[0]?.id;
    if (!questionId) {
      throw new UnprocessableEntityException({
        code: "DUEL_NO_OPENER_QUESTION",
        message: "No published single_choice question available for opener"
      });
    }
    return questionId;
  }

  private async createRoundIfMissing(
    client: PoolClient,
    duel: DuelRow,
    roundNo: number,
    status: DuelRoundStatus
  ): Promise<void> {
    const existing = await client.query<{ id: string }>(
      `
        SELECT id
        FROM duel_rounds
        WHERE duel_id = $1
          AND round_no = $2
        LIMIT 1
      `,
      [duel.id, roundNo]
    );
    if (existing.rowCount > 0) {
      return;
    }

    const subjectIds = await this.pickThreeSubjectIds(client);

    await client.query(
      `
        INSERT INTO duel_rounds
          (id, duel_id, round_no, offered_subject_1_id, offered_subject_2_id, offered_subject_3_id, status)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
      `,
      [randomUUID(), duel.id, roundNo, subjectIds[0], subjectIds[1], subjectIds[2], status]
    );
  }

  private async pickThreeSubjectIds(client: PoolClient): Promise<[string, string, string]> {
    const subjects = await client.query<{ id: string }>(
      `
        SELECT id
        FROM subjects
        WHERE is_active = TRUE
        ORDER BY random()
        LIMIT 3
      `
    );
    if (subjects.rowCount < 3) {
      throw new UnprocessableEntityException({
        code: "DUEL_SUBJECT_POOL_TOO_SMALL",
        message: "At least 3 active subjects are required"
      });
    }

    return [subjects.rows[0].id, subjects.rows[1].id, subjects.rows[2].id];
  }

  private async getSubjectsByIds(
    dbLike: Queryable,
    subjectIds: string[]
  ): Promise<Map<string, SubjectLite>> {
    const result = await dbLike.query<{ id: string; name: string }>(
      `
        SELECT id, name
        FROM subjects
        WHERE id = ANY($1::uuid[])
      `,
      [subjectIds]
    );

    const map = new Map<string, SubjectLite>();
    for (const row of result.rows) {
      map.set(row.id, { id: row.id, name: row.name });
    }
    return map;
  }

  private async getAllRounds(dbLike: Queryable, duelId: string): Promise<DuelRoundRow[]> {
    const result = await dbLike.query<DuelRoundRow>(
      `
        SELECT
          id,
          duel_id,
          round_no,
          offered_subject_1_id,
          offered_subject_2_id,
          offered_subject_3_id,
          chosen_subject_id,
          chosen_by_user_id,
          status,
          player1_done_at,
          player2_done_at,
          created_at
        FROM duel_rounds
        WHERE duel_id = $1
        ORDER BY round_no
      `,
      [duelId]
    );

    return result.rows;
  }

  private async getRound(
    dbLike: Queryable,
    duelId: string,
    roundNo: number,
    forUpdate = false
  ): Promise<DuelRoundRow | null> {
    const lockClause = forUpdate ? "FOR UPDATE" : "";
    const result = await dbLike.query<DuelRoundRow>(
      `
        SELECT
          id,
          duel_id,
          round_no,
          offered_subject_1_id,
          offered_subject_2_id,
          offered_subject_3_id,
          chosen_subject_id,
          chosen_by_user_id,
          status,
          player1_done_at,
          player2_done_at,
          created_at
        FROM duel_rounds
        WHERE duel_id = $1
          AND round_no = $2
        LIMIT 1
        ${lockClause}
      `,
      [duelId, roundNo]
    );

    return result.rows[0] ?? null;
  }

  private async getDuelForUser(
    dbLike: Queryable,
    duelId: string,
    userId: string,
    forUpdate = false
  ): Promise<DuelRow> {
    const lockClause = forUpdate ? "FOR UPDATE" : "";
    const result = await dbLike.query<DuelRow>(
      `
        SELECT
          id,
          player1_id,
          player2_id,
          matchmaking_mode,
          status,
          starter_user_id,
          current_turn_user_id,
          current_round_no,
          player1_score,
          player2_score,
          turn_deadline_at,
          tie_break_played,
          winner_user_id,
          win_reason,
          created_at,
          accepted_at,
          completed_at
        FROM duels
        WHERE id = $1
          AND (player1_id = $2 OR player2_id = $2)
        LIMIT 1
        ${lockClause}
      `,
      [duelId, userId]
    );
    const duel = result.rows[0];
    if (!duel) {
      throw new NotFoundException({
        code: "DUEL_NOT_FOUND",
        message: "Duel not found"
      });
    }
    return duel;
  }

  private async getDuelById(
    dbLike: Queryable,
    duelId: string,
    forUpdate = false
  ): Promise<DuelRow | null> {
    const lockClause = forUpdate ? "FOR UPDATE" : "";
    const result = await dbLike.query<DuelRow>(
      `
        SELECT
          id,
          player1_id,
          player2_id,
          matchmaking_mode,
          status,
          starter_user_id,
          current_turn_user_id,
          current_round_no,
          player1_score,
          player2_score,
          turn_deadline_at,
          tie_break_played,
          winner_user_id,
          win_reason,
          created_at,
          accepted_at,
          completed_at
        FROM duels
        WHERE id = $1
        LIMIT 1
        ${lockClause}
      `,
      [duelId]
    );
    return result.rows[0] ?? null;
  }

  private async getOpenerRow(
    dbLike: Queryable,
    duelId: string,
    forUpdate = false
  ): Promise<DuelOpenerRow | null> {
    const lockClause = forUpdate ? "FOR UPDATE" : "";
    const result = await dbLike.query<DuelOpenerRow>(
      `
        SELECT
          id,
          duel_id,
          question_id,
          player1_choice_id,
          player2_choice_id,
          player1_correct,
          player2_correct,
          player1_response_time_ms,
          player2_response_time_ms,
          winner_user_id,
          winner_decision,
          resolved_at
        FROM duel_openers
        WHERE duel_id = $1
        LIMIT 1
        ${lockClause}
      `,
      [duelId]
    );
    return result.rows[0] ?? null;
  }

  private getOtherPlayerId(duel: DuelRow, userId: string): string {
    return duel.player1_id === userId ? duel.player2_id : duel.player1_id;
  }

  private assertRoundNo(roundNo: number): void {
    if (!Number.isInteger(roundNo) || roundNo < 1 || roundNo > 5) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "roundNo must be an integer in range 1..5"
      });
    }
  }

  private plusHours(base: Date, hours: number): Date {
    return new Date(base.getTime() + hours * 60 * 60 * 1000);
  }

  private async insertNotification(
    client: PoolClient,
    params: {
      userId: string;
      type: "duel_turn" | "duel_joker_request" | "duel_joker_granted" | "duel_finished";
      payload: Record<string, unknown>;
    }
  ): Promise<void> {
    await client.query(
      `
        INSERT INTO notifications (id, user_id, type, payload)
        VALUES ($1, $2, $3, $4::jsonb)
      `,
      [randomUUID(), params.userId, params.type, JSON.stringify(params.payload)]
    );
  }

  private rethrowKnownDuelErrors(error: unknown): void {
    const pgError = this.asPgError(error);
    if (!pgError) {
      return;
    }

    if (
      pgError.code === "P0001" &&
      typeof pgError.message === "string" &&
      pgError.message.includes("cannot have more than 2 active duels")
    ) {
      throw new UnprocessableEntityException({
        code: "FREE_DUEL_LIMIT_REACHED",
        message: "Free users cannot have more than 2 active duels"
      });
    }
  }

  private asPgError(error: unknown): { code?: string; message?: string } | null {
    if (!error || typeof error !== "object") {
      return null;
    }
    return error as { code?: string; message?: string };
  }
}
