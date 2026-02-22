import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "../database/database.service";
import { AnswerTrainingQuestionDto } from "./dto/answer-training-question.dto";
import { CreateTrainingSessionDto } from "./dto/create-training-session.dto";

interface SessionRow {
  id: string;
  user_id: string;
  mode: "learning" | "discovery" | "review" | "par_coeur" | "rattrapage";
  stop_rule: "fixed_10" | "fixed_custom" | "until_stop";
  target_question_count: number | null;
  ended_at: string | null;
}

@Injectable()
export class TrainingsService {
  constructor(private readonly db: DatabaseService) {}

  async createSession(userId: string, dto: CreateTrainingSessionDto) {
    this.validateStopRule(dto.stopRule, dto.targetQuestionCount);

    return this.db.withTransaction(async (client) => {
      const sessionId = randomUUID();
      const target =
        dto.stopRule === "fixed_10"
          ? 10
          : dto.stopRule === "fixed_custom"
            ? dto.targetQuestionCount ?? null
            : null;

      const firstSessionResult = await client.query<{ is_first: boolean }>(
        `
          SELECT NOT EXISTS (
            SELECT 1
            FROM quiz_sessions qs
            WHERE qs.user_id = $1
              AND qs.started_at >= date_trunc('day', now())
          ) AS is_first
        `,
        [userId]
      );
      const isFirst = firstSessionResult.rows[0]?.is_first ?? false;

      await client.query(
        `
          INSERT INTO quiz_sessions
            (id, user_id, mode, stop_rule, target_question_count, is_first_session_of_day)
          VALUES
            ($1, $2, $3, $4, $5, $6)
        `,
        [sessionId, userId, dto.mode, dto.stopRule, target, isFirst]
      );

      for (const subjectId of dto.subjectIds ?? []) {
        await client.query(
          `
            INSERT INTO quiz_session_subject_filters (session_id, subject_id)
            VALUES ($1, $2)
          `,
          [sessionId, subjectId]
        );
      }

      for (const chapterId of dto.chapterIds ?? []) {
        await client.query(
          `
            INSERT INTO quiz_session_chapter_filters (session_id, chapter_id)
            VALUES ($1, $2)
          `,
          [sessionId, chapterId]
        );
      }

      return {
        id: sessionId,
        mode: dto.mode,
        stopRule: dto.stopRule,
        targetQuestionCount: target,
        isFirstSessionOfDay: isFirst
      };
    });
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    const progressResult = await this.db.query<{ attempts: string; correct: string }>(
      `
        SELECT
          COUNT(*)::text AS attempts,
          COUNT(*) FILTER (WHERE is_correct)::text AS correct
        FROM quiz_answers
        WHERE session_id = $1
      `,
      [sessionId]
    );
    const attempts = Number(progressResult.rows[0]?.attempts ?? 0);
    const correct = Number(progressResult.rows[0]?.correct ?? 0);

    return {
      id: session.id,
      mode: session.mode,
      stopRule: session.stop_rule,
      targetQuestionCount: session.target_question_count,
      endedAt: session.ended_at,
      progress: {
        attempts,
        correct
      }
    };
  }

  async listQuestions(userId: string, sessionId: string, limit = 10) {
    const session = await this.getOwnedSession(userId, sessionId);
    if (session.ended_at) {
      throw new UnprocessableEntityException({
        code: "SESSION_ALREADY_COMPLETED",
        message: "Training session is already completed"
      });
    }

    const safeLimit = Math.max(1, Math.min(limit, 50));
    const whereParts: string[] = [
      "q.status = 'published'",
      "NOT EXISTS (SELECT 1 FROM quiz_answers qa WHERE qa.session_id = $1 AND qa.question_id = q.id)"
    ];
    const values: unknown[] = [sessionId, userId, safeLimit];

    const subjectFilterCount = await this.db.query<{ c: string }>(
      `
        SELECT COUNT(*)::text AS c
        FROM quiz_session_subject_filters
        WHERE session_id = $1
      `,
      [sessionId]
    );
    if (Number(subjectFilterCount.rows[0]?.c ?? 0) > 0) {
      whereParts.push(
        "q.subject_id IN (SELECT subject_id FROM quiz_session_subject_filters WHERE session_id = $1)"
      );
    }

    const chapterFilterCount = await this.db.query<{ c: string }>(
      `
        SELECT COUNT(*)::text AS c
        FROM quiz_session_chapter_filters
        WHERE session_id = $1
      `,
      [sessionId]
    );
    if (Number(chapterFilterCount.rows[0]?.c ?? 0) > 0) {
      whereParts.push(
        "q.chapter_id IN (SELECT chapter_id FROM quiz_session_chapter_filters WHERE session_id = $1)"
      );
    }

    if (session.mode === "discovery") {
      whereParts.push(
        "NOT EXISTS (SELECT 1 FROM user_question_stats uqs WHERE uqs.user_id = $2 AND uqs.question_id = q.id AND uqs.attempts_count > 0)"
      );
    }

    if (session.mode === "review") {
      whereParts.push(
        "EXISTS (SELECT 1 FROM user_question_stats uqs WHERE uqs.user_id = $2 AND uqs.question_id = q.id AND uqs.attempts_count > 0)"
      );
    }

    if (session.mode === "par_coeur") {
      whereParts.push(
        `
        EXISTS (
          SELECT 1
          FROM user_question_stats uqs
          WHERE uqs.user_id = $2
            AND uqs.question_id = q.id
            AND (
              (uqs.attempts_count <= 4 AND uqs.correct_count = uqs.attempts_count AND uqs.attempts_count > 0)
              OR
              (uqs.attempts_count > 4 AND (uqs.correct_count::numeric / uqs.attempts_count) >= 0.8)
            )
        )
        `
      );
    }

    if (session.mode === "rattrapage") {
      whereParts.push(
        `
        EXISTS (
          SELECT 1
          FROM user_question_stats uqs
          WHERE uqs.user_id = $2
            AND uqs.question_id = q.id
            AND uqs.attempts_count > 0
            AND uqs.correct_count < uqs.attempts_count
        )
        `
      );
    }

    const targetQuestionCount = session.target_question_count;
    if (targetQuestionCount !== null) {
      const answeredResult = await this.db.query<{ c: string }>(
        `
          SELECT COUNT(*)::text AS c
          FROM quiz_answers
          WHERE session_id = $1
        `,
        [sessionId]
      );
      const answeredCount = Number(answeredResult.rows[0]?.c ?? 0);
      const remaining = targetQuestionCount - answeredCount;
      if (remaining <= 0) {
        return [];
      }
      values[2] = Math.min(safeLimit, remaining);
    }

    const sql = `
      SELECT
        q.id,
        q.prompt,
        q.explanation,
        q.difficulty,
        q.question_type,
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
      LEFT JOIN question_choices qc
        ON qc.question_id = q.id
      WHERE ${whereParts.join(" AND ")}
      GROUP BY q.id
      ORDER BY random()
      LIMIT $3
    `;

    const result = await this.db.query<{
      id: string;
      prompt: string;
      explanation: string;
      difficulty: number;
      question_type: string;
      choices: Array<{ id: string; label: string; position: number }>;
    }>(sql, values);

    return result.rows.map((row) => ({
      id: row.id,
      prompt: row.prompt,
      explanation: row.explanation,
      difficulty: row.difficulty,
      questionType: row.question_type,
      choices: row.choices
    }));
  }

  async submitAnswer(userId: string, sessionId: string, dto: AnswerTrainingQuestionDto) {
    const session = await this.getOwnedSession(userId, sessionId);
    if (session.ended_at) {
      throw new UnprocessableEntityException({
        code: "SESSION_ALREADY_COMPLETED",
        message: "Training session is already completed"
      });
    }

    const questionResult = await this.db.query<{
      id: string;
      question_type: string;
      explanation: string;
      subject_id: string;
    }>(
      `
        SELECT id, question_type, explanation, subject_id
        FROM questions
        WHERE id = $1
          AND status = 'published'
        LIMIT 1
      `,
      [dto.questionId]
    );
    const question = questionResult.rows[0];
    if (!question) {
      throw new NotFoundException({
        code: "QUESTION_NOT_FOUND",
        message: "Question not found"
      });
    }

    if (question.question_type !== "single_choice") {
      throw new UnprocessableEntityException({
        code: "UNSUPPORTED_QUESTION_TYPE",
        message: "Only single_choice is supported in v1 answer endpoint"
      });
    }

    const choiceResult = await this.db.query<{ is_correct: boolean }>(
      `
        SELECT is_correct
        FROM question_choices
        WHERE question_id = $1
          AND id = $2
        LIMIT 1
      `,
      [dto.questionId, dto.selectedChoiceId]
    );
    const selected = choiceResult.rows[0];
    if (!selected) {
      throw new BadRequestException({
        code: "QUESTION_CHOICE_INVALID",
        message: "Selected choice does not belong to question"
      });
    }

    const isCorrect = selected.is_correct;
    const hit = isCorrect ? "1" : "0";

    await this.db.withTransaction(async (client) => {
      const answeredCountResult = await client.query<{ c: string }>(
        `
          SELECT COUNT(*)::text AS c
          FROM quiz_answers
          WHERE session_id = $1
        `,
        [sessionId]
      );
      const answerOrder = Number(answeredCountResult.rows[0]?.c ?? 0) + 1;

      await client.query(
        `
          INSERT INTO quiz_answers
            (id, session_id, user_id, question_id, selected_choice_id, is_correct, response_time_ms, answer_order)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          randomUUID(),
          sessionId,
          userId,
          dto.questionId,
          dto.selectedChoiceId,
          isCorrect,
          dto.responseTimeMs ?? null,
          answerOrder
        ]
      );

      const previousStats = await client.query<{ attempts_count: string }>(
        `
          SELECT attempts_count::text
          FROM user_question_stats
          WHERE user_id = $1
            AND question_id = $2
          LIMIT 1
        `,
        [userId, dto.questionId]
      );
      const firstSeen = previousStats.rowCount === 0;

      await client.query(
        `
          INSERT INTO user_question_stats
            (user_id, question_id, attempts_count, correct_count, last_answered_at, last_correct, last_mode, last_3_results)
          VALUES
            ($1, $2, 1, $3, NOW(), $4, $5, $6)
          ON CONFLICT (user_id, question_id)
          DO UPDATE
          SET
            attempts_count = user_question_stats.attempts_count + 1,
            correct_count = user_question_stats.correct_count + EXCLUDED.correct_count,
            last_answered_at = NOW(),
            last_correct = EXCLUDED.last_correct,
            last_mode = EXCLUDED.last_mode,
            last_3_results = RIGHT(COALESCE(user_question_stats.last_3_results, '') || EXCLUDED.last_3_results, 3),
            updated_at = NOW()
        `,
        [
          userId,
          dto.questionId,
          isCorrect ? 1 : 0,
          isCorrect,
          session.mode,
          hit
        ]
      );

      await client.query(
        `
          INSERT INTO user_subject_stats
            (user_id, subject_id, attempts_count, correct_count, questions_seen_count, questions_to_reinforce_count)
          VALUES
            ($1, $2, 1, $3, $4, 0)
          ON CONFLICT (user_id, subject_id)
          DO UPDATE
          SET
            attempts_count = user_subject_stats.attempts_count + 1,
            correct_count = user_subject_stats.correct_count + EXCLUDED.correct_count,
            questions_seen_count = user_subject_stats.questions_seen_count + EXCLUDED.questions_seen_count,
            updated_at = NOW()
        `,
        [userId, question.subject_id, isCorrect ? 1 : 0, firstSeen ? 1 : 0]
      );

      const reinforceResult = await client.query<{ c: string }>(
        `
          SELECT COUNT(*)::text AS c
          FROM user_question_stats uqs
          JOIN questions q ON q.id = uqs.question_id
          WHERE uqs.user_id = $1
            AND q.subject_id = $2
            AND uqs.attempts_count > 0
            AND uqs.correct_count < uqs.attempts_count
        `,
        [userId, question.subject_id]
      );
      const reinforceCount = Number(reinforceResult.rows[0]?.c ?? 0);

      await client.query(
        `
          UPDATE user_subject_stats
          SET questions_to_reinforce_count = $3,
              updated_at = NOW()
          WHERE user_id = $1
            AND subject_id = $2
        `,
        [userId, question.subject_id, reinforceCount]
      );
    });

    return {
      isCorrect,
      explanation: question.explanation
    };
  }

  async completeSession(userId: string, sessionId: string) {
    await this.getOwnedSession(userId, sessionId);

    await this.db.query(
      `
        UPDATE quiz_sessions
        SET ended_at = NOW(),
            ended_reason = COALESCE(ended_reason, 'manual')
        WHERE id = $1
          AND user_id = $2
          AND ended_at IS NULL
      `,
      [sessionId, userId]
    );

    const statsResult = await this.db.query<{ attempts: string; correct: string }>(
      `
        SELECT
          COUNT(*)::text AS attempts,
          COUNT(*) FILTER (WHERE is_correct)::text AS correct
        FROM quiz_answers
        WHERE session_id = $1
      `,
      [sessionId]
    );

    return {
      id: sessionId,
      attempts: Number(statsResult.rows[0]?.attempts ?? 0),
      correct: Number(statsResult.rows[0]?.correct ?? 0),
      endedAt: new Date().toISOString()
    };
  }

  private async getOwnedSession(userId: string, sessionId: string): Promise<SessionRow> {
    const result = await this.db.query<SessionRow>(
      `
        SELECT id, user_id, mode, stop_rule, target_question_count, ended_at
        FROM quiz_sessions
        WHERE id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [sessionId, userId]
    );
    const session = result.rows[0];
    if (!session) {
      throw new NotFoundException({
        code: "SESSION_NOT_FOUND",
        message: "Training session not found"
      });
    }
    return session;
  }

  private validateStopRule(stopRule: string, targetQuestionCount?: number): void {
    if (stopRule === "fixed_10" && targetQuestionCount !== undefined && targetQuestionCount !== 10) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "targetQuestionCount must be 10 when stopRule=fixed_10"
      });
    }
    if (stopRule === "fixed_custom" && (!targetQuestionCount || targetQuestionCount < 1 || targetQuestionCount > 200)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "targetQuestionCount must be 1..200 when stopRule=fixed_custom"
      });
    }
    if (stopRule === "until_stop" && targetQuestionCount !== undefined) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "targetQuestionCount must be omitted when stopRule=until_stop"
      });
    }
  }
}
