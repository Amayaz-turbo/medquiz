import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";
import { env } from "../config/env";
import { AnswerTrainingQuestionDto } from "./dto/answer-training-question.dto";
import { CreateQuestionSubmissionDto } from "./dto/create-question-submission.dto";
import { CreateTrainingSessionDto } from "./dto/create-training-session.dto";
import { ReviewQuestionSubmissionDto } from "./dto/review-question-submission.dto";
import { UpsertTrainingQuestionDto } from "./dto/upsert-training-question.dto";

interface SessionRow {
  id: string;
  user_id: string;
  mode: "learning" | "discovery" | "review" | "par_coeur" | "rattrapage";
  stop_rule: "fixed_10" | "fixed_custom" | "until_stop";
  target_question_count: number | null;
  ended_at: string | null;
}

export interface SubjectStateView {
  id: string;
  code: string;
  name: string;
  chapterCount: number;
  chaptersStarted: number;
  declaredProgressPct: number;
  publishedQuestionCount: number;
  attemptsCount: number;
  correctCount: number;
  successRatePct: number | null;
  questionsToReinforceCount: number;
}

interface DashboardSuggestedAction {
  score: number;
  subjectId: string;
  subjectName: string;
  mode: "learning" | "discovery" | "review" | "par_coeur" | "rattrapage";
  label: string;
}

interface NormalizedAdminQuestionPayload {
  subjectId: string;
  chapterId: string;
  questionType: "single_choice" | "multi_choice" | "open_text";
  prompt: string;
  explanation: string;
  difficulty: number;
  publishNow: boolean;
  choices: Array<{ position: number; label: string; isCorrect: boolean }>;
  acceptedAnswers: Array<{ acceptedAnswerText: string; normalizedAnswerText: string }>;
}

interface QuestionAuthoringInput {
  subjectId: string;
  chapterId: string;
  questionType: "single_choice" | "multi_choice" | "open_text";
  prompt: string;
  explanation: string;
  difficulty: number;
  publishNow?: boolean;
  choices?: Array<{ label: string; isCorrect: boolean }>;
  acceptedAnswers?: string[];
}

export interface AdminQuestionView {
  id: string;
  subjectId: string;
  chapterId: string;
  questionType: "single_choice" | "multi_choice" | "open_text";
  prompt: string;
  explanation: string;
  difficulty: number;
  status: string;
  curriculumScope: string;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  retiredAt: string | null;
  choices: Array<{ id: string; label: string; position: number; isCorrect: boolean }>;
  acceptedAnswers: Array<{
    id: string;
    acceptedAnswerText: string;
    normalizedAnswerText: string;
    createdAt: string;
  }>;
}

type QueryRunner = Pick<DatabaseService, "query"> | PoolClient;

interface ListAdminQuestionsOptions {
  status?: string;
  questionType?: string;
  subjectId?: string;
  chapterId?: string;
  createdBy?: string;
  limit?: number | string;
  offset?: number | string;
}

interface ListQuestionSubmissionsOptions {
  status?: string;
  questionType?: string;
  subjectId?: string;
  chapterId?: string;
  createdBy?: string;
  limit?: number | string;
  offset?: number | string;
}

interface ListSubmissionReviewQueueOptions {
  limit?: number | string;
}

export interface QuestionSubmissionView {
  id: string;
  proposerUserId: string;
  subjectId: string;
  chapterId: string;
  questionType: "single_choice" | "multi_choice" | "open_text";
  prompt: string;
  explanation: string;
  difficulty: number;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  publishedQuestionId: string | null;
  createdAt: string;
  choices: Array<{ id: string; label: string; position: number; isCorrect: boolean }>;
  acceptedAnswers: Array<{
    id: string;
    acceptedAnswerText: string;
    normalizedAnswerText: string;
    createdAt: string;
  }>;
}

export interface SubmissionReviewQueueItem {
  id: string;
  proposerUserId: string;
  subjectId: string;
  chapterId: string;
  questionType: "single_choice" | "multi_choice" | "open_text";
  promptPreview: string;
  difficulty: number;
  createdAt: string;
  qualityScore: number;
  queueScore: number;
  flags: string[];
  duplicateCandidates: Array<{
    sourceType: "question" | "submission";
    sourceId: string;
    similarityScore: number;
    status: string;
    promptPreview: string;
  }>;
}

export interface SubmissionReviewDashboard {
  snapshotAt: string;
  sla: {
    targetHours: number;
    pending: {
      totalCount: number;
      overSlaCount: number;
      withinSlaPct: number;
      oldestPendingHours: number;
    };
    reviewLast7d: {
      reviewedCount: number;
      approvedCount: number;
      rejectedCount: number;
      withinSlaPct: number | null;
      avgReviewHours: number | null;
      p50ReviewHours: number | null;
    };
  };
  pendingBySubject: Array<{
    subjectId: string;
    subjectName: string;
    pendingCount: number;
    overSlaCount: number;
    oldestPendingHours: number;
  }>;
  pendingDistribution: {
    byQuestionType: Array<{
      questionType: "single_choice" | "multi_choice" | "open_text";
      count: number;
    }>;
    byDifficulty: Array<{
      difficulty: number;
      count: number;
    }>;
  };
}

@Injectable()
export class TrainingsService {
  private readonly cfg = env();

  constructor(private readonly db: DatabaseService) {}

  async createSession(userId: string, dto: CreateTrainingSessionDto) {
    this.validateStopRule(dto.stopRule, dto.targetQuestionCount);

    return this.db.withTransaction(async (client) => {
      await this.validateSessionFilters(client, dto);

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
    const whereParts = this.buildSessionQuestionWhereParts(session.mode);
    whereParts.push("NOT EXISTS (SELECT 1 FROM quiz_answers qa WHERE qa.session_id = $1 AND qa.question_id = q.id)");
    const values: unknown[] = [sessionId, userId, safeLimit];

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

    return this.db.withTransaction(async (client) => {
      await client.query(
        `
          SELECT id
          FROM quiz_sessions
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
          FOR UPDATE
        `,
        [sessionId, userId]
      );

      const answeredCountResult = await client.query<{ c: string }>(
        `
          SELECT COUNT(*)::text AS c
          FROM quiz_answers
          WHERE session_id = $1
        `,
        [sessionId]
      );
      const answeredCount = Number(answeredCountResult.rows[0]?.c ?? 0);
      if (session.target_question_count !== null && answeredCount >= session.target_question_count) {
        throw new UnprocessableEntityException({
          code: "SESSION_QUESTION_LIMIT_REACHED",
          message: "Session question limit already reached"
        });
      }

      const questionResult = await client.query<{
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

      if (
        question.question_type !== "single_choice" &&
        question.question_type !== "multi_choice" &&
        question.question_type !== "open_text"
      ) {
        throw new UnprocessableEntityException({
          code: "UNSUPPORTED_QUESTION_TYPE",
          message: "Only single_choice, multi_choice and open_text are supported in v1 answer endpoint"
        });
      }

      await this.ensureQuestionEligibleForSession(client, userId, session, dto.questionId);

      const alreadyAnswered = await client.query<{ id: string }>(
        `
          SELECT id
          FROM quiz_answers
          WHERE session_id = $1
            AND question_id = $2
          LIMIT 1
        `,
        [sessionId, dto.questionId]
      );
      if (alreadyAnswered.rowCount > 0) {
        throw new UnprocessableEntityException({
          code: "TRAINING_QUESTION_ALREADY_ANSWERED",
          message: "Question already answered in this session"
        });
      }

      let isCorrect = false;
      let selectedChoiceIds: string[] = [];
      let openTextAnswer: string | null = null;
      let normalizedOpenTextAnswer: string | null = null;
      let openTextExpectedAnswers: string[] = [];

      if (question.question_type === "open_text") {
        openTextAnswer = this.normalizeOpenTextAnswer(dto);
        normalizedOpenTextAnswer = this.normalizeOpenTextValue(openTextAnswer);

        const acceptedAnswersResult = await client.query<{
          accepted_answer_text: string;
          normalized_answer_text: string;
        }>(
          `
            SELECT accepted_answer_text, normalized_answer_text
            FROM question_open_text_answers
            WHERE question_id = $1
            ORDER BY created_at ASC
          `,
          [dto.questionId]
        );
        if (acceptedAnswersResult.rowCount === 0) {
          throw new UnprocessableEntityException({
            code: "QUESTION_CONFIGURATION_INVALID",
            message: "Question has no accepted open-text answers configured"
          });
        }

        openTextExpectedAnswers = acceptedAnswersResult.rows.map((row) => row.accepted_answer_text);
        const accepted = new Set(
          acceptedAnswersResult.rows.map((row) => this.normalizeOpenTextValue(row.normalized_answer_text))
        );
        isCorrect = accepted.has(normalizedOpenTextAnswer);
      } else {
        const choicesResult = await client.query<{ id: string; is_correct: boolean }>(
          `
            SELECT id, is_correct
            FROM question_choices
            WHERE question_id = $1
          `,
          [dto.questionId]
        );
        if (choicesResult.rowCount === 0) {
          throw new UnprocessableEntityException({
            code: "QUESTION_CONFIGURATION_INVALID",
            message: "Question has no available choices"
          });
        }

        selectedChoiceIds =
          question.question_type === "single_choice"
            ? this.normalizeSingleChoiceSelection(dto)
            : this.normalizeMultiChoiceSelection(dto);

        const choiceMap = new Map(choicesResult.rows.map((choice) => [choice.id, choice.is_correct]));
        for (const choiceId of selectedChoiceIds) {
          if (!choiceMap.has(choiceId)) {
            throw new BadRequestException({
              code: "QUESTION_CHOICE_INVALID",
              message: "Selected choice does not belong to question"
            });
          }
        }

        if (question.question_type === "single_choice") {
          isCorrect = choiceMap.get(selectedChoiceIds[0]) ?? false;
        } else {
          const correctChoiceIds = choicesResult.rows
            .filter((choice) => choice.is_correct)
            .map((choice) => choice.id)
            .sort();
          if (correctChoiceIds.length === 0) {
            throw new UnprocessableEntityException({
              code: "QUESTION_CONFIGURATION_INVALID",
              message: "Question has no correct choices configured"
            });
          }

          const normalizedSelected = [...selectedChoiceIds].sort();
          isCorrect =
            normalizedSelected.length === correctChoiceIds.length &&
            normalizedSelected.every((choiceId, index) => choiceId === correctChoiceIds[index]);
        }
      }

      const hit = isCorrect ? "1" : "0";
      const answerOrder = answeredCount + 1;
      const answerId = randomUUID();
      const selectedChoiceIdForAnswer =
        question.question_type === "single_choice" ? selectedChoiceIds[0] : null;

      await client.query(
        `
          INSERT INTO quiz_answers
            (
              id,
              session_id,
              user_id,
              question_id,
              selected_choice_id,
              open_text_answer,
              open_text_answer_normalized,
              is_correct,
              response_time_ms,
              answer_order
            )
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          answerId,
          sessionId,
          userId,
          dto.questionId,
          selectedChoiceIdForAnswer,
          openTextAnswer,
          normalizedOpenTextAnswer,
          isCorrect,
          dto.responseTimeMs ?? null,
          answerOrder
        ]
      );

      if (question.question_type === "multi_choice") {
        for (const choiceId of selectedChoiceIds) {
          await client.query(
            `
              INSERT INTO quiz_answer_multi_choices
                (answer_id, choice_id)
              VALUES
                ($1, $2)
            `,
            [answerId, choiceId]
          );
        }
      }

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
      return {
        isCorrect,
        explanation: question.explanation,
        correction:
          question.question_type === "open_text"
            ? {
                questionType: "open_text",
                evaluationRule: "normalized_exact_match",
                submittedAnswer: openTextAnswer,
                expectedAnswers: openTextExpectedAnswers
              }
            : null
      };
    });
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

  async getDashboard(userId: string) {
    const [globalResult, sessions7dResult, chapterCoverageResult] = await Promise.all([
      this.db.query<{ attempts: string; correct: string; attempts_7d: string }>(
        `
          SELECT
            COUNT(*)::text AS attempts,
            COUNT(*) FILTER (WHERE qa.is_correct)::text AS correct,
            COUNT(*) FILTER (WHERE qa.answered_at >= NOW() - INTERVAL '7 days')::text AS attempts_7d
          FROM quiz_answers qa
          WHERE qa.user_id = $1
        `,
        [userId]
      ),
      this.db.query<{ c: string }>(
        `
          SELECT COUNT(*)::text AS c
          FROM quiz_sessions qs
          WHERE qs.user_id = $1
            AND qs.started_at >= NOW() - INTERVAL '7 days'
        `,
        [userId]
      ),
      this.db.query<{ total_chapters: string; started_chapters: string }>(
        `
          SELECT
            COUNT(*)::text AS total_chapters,
            COUNT(*) FILTER (
              WHERE COALESCE(ucp.declared_progress_pct, 0) > 0
            )::text AS started_chapters
          FROM chapters c
          JOIN subjects s
            ON s.id = c.subject_id
           AND s.is_active = TRUE
          LEFT JOIN user_chapter_progress ucp
            ON ucp.chapter_id = c.id
           AND ucp.user_id = $1
          WHERE c.is_active = TRUE
        `,
        [userId]
      )
    ]);

    const subjectStates = await this.listSubjectStates(userId);

    const attempts = Number(globalResult.rows[0]?.attempts ?? 0);
    const correct = Number(globalResult.rows[0]?.correct ?? 0);
    const attempts7d = Number(globalResult.rows[0]?.attempts_7d ?? 0);
    const sessions7d = Number(sessions7dResult.rows[0]?.c ?? 0);
    const totalChapters = Number(chapterCoverageResult.rows[0]?.total_chapters ?? 0);
    const startedChapters = Number(chapterCoverageResult.rows[0]?.started_chapters ?? 0);

    const successRatePct = attempts > 0 ? Math.round((correct / attempts) * 1000) / 10 : null;
    const chapterCoveragePct =
      totalChapters > 0 ? Math.round((startedChapters / totalChapters) * 1000) / 10 : 0;

    const suggestedActionCandidates: DashboardSuggestedAction[] = [];
    for (const subject of subjectStates) {
      const action = this.buildSuggestedAction(subject);
      if (action) {
        suggestedActionCandidates.push(action);
      }
    }

    const suggestedActions = suggestedActionCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score: _score, ...rest }) => rest);

    return {
      overview: {
        attemptsCount: attempts,
        correctCount: correct,
        successRatePct,
        sessions7dCount: sessions7d,
        attempts7dCount: attempts7d,
        startedChaptersCount: startedChapters,
        totalChaptersCount: totalChapters,
        chapterCoveragePct,
        suggestedMode: this.pickGlobalSuggestedMode(subjectStates, attempts, successRatePct)
      },
      subjects: subjectStates.map((subject) => ({
        ...subject,
        momentumLabel: this.getSubjectMomentumLabel(subject)
      })),
      suggestedActions
    };
  }

  async listSubjectStates(userId: string): Promise<SubjectStateView[]> {
    const result = await this.db.query<{
      id: string;
      code: string;
      name: string;
      chapter_count: string;
      chapters_started: string;
      declared_progress_pct: string;
      published_question_count: string;
      attempts_count: string;
      correct_count: string;
      questions_to_reinforce_count: string;
    }>(
      `
        SELECT
          s.id,
          s.code,
          s.name,
          (
            SELECT COUNT(*)::text
            FROM chapters c
            WHERE c.subject_id = s.id
              AND c.is_active = TRUE
          ) AS chapter_count,
          (
            SELECT COUNT(*)::text
            FROM chapters c
            JOIN user_chapter_progress ucp
              ON ucp.chapter_id = c.id
             AND ucp.user_id = $1
            WHERE c.subject_id = s.id
              AND c.is_active = TRUE
              AND ucp.declared_progress_pct > 0
          ) AS chapters_started,
          (
            SELECT COALESCE(ROUND(AVG(COALESCE(ucp.declared_progress_pct, 0))::numeric, 1), 0)::text
            FROM chapters c
            LEFT JOIN user_chapter_progress ucp
              ON ucp.chapter_id = c.id
             AND ucp.user_id = $1
            WHERE c.subject_id = s.id
              AND c.is_active = TRUE
          ) AS declared_progress_pct,
          (
            SELECT COUNT(*)::text
            FROM questions q
            WHERE q.subject_id = s.id
              AND q.status = 'published'
              AND q.question_type IN ('single_choice', 'multi_choice', 'open_text')
          ) AS published_question_count,
          COALESCE(uss.attempts_count, 0)::text AS attempts_count,
          COALESCE(uss.correct_count, 0)::text AS correct_count,
          COALESCE(uss.questions_to_reinforce_count, 0)::text AS questions_to_reinforce_count
        FROM subjects s
        LEFT JOIN user_subject_stats uss
          ON uss.user_id = $1
         AND uss.subject_id = s.id
        WHERE s.is_active = TRUE
        ORDER BY s.sort_order ASC, s.name ASC
      `,
      [userId]
    );

    return result.rows.map((row) => {
      const attempts = Number(row.attempts_count);
      const correct = Number(row.correct_count);
      const successRatePct = attempts > 0 ? Math.round((correct / attempts) * 1000) / 10 : null;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        chapterCount: Number(row.chapter_count),
        chaptersStarted: Number(row.chapters_started),
        declaredProgressPct: Number(row.declared_progress_pct),
        publishedQuestionCount: Number(row.published_question_count),
        attemptsCount: attempts,
        correctCount: correct,
        successRatePct,
        questionsToReinforceCount: Number(row.questions_to_reinforce_count)
      };
    });
  }

  async listSubjectChapterStates(userId: string, subjectId: string) {
    const subjectResult = await this.db.query<{ id: string; code: string; name: string }>(
      `
        SELECT id, code, name
        FROM subjects
        WHERE id = $1
          AND is_active = TRUE
        LIMIT 1
      `,
      [subjectId]
    );
    const subject = subjectResult.rows[0];
    if (!subject) {
      throw new NotFoundException({
        code: "SUBJECT_NOT_FOUND",
        message: "Subject not found"
      });
    }

    const chaptersResult = await this.db.query<{
      id: string;
      code: string;
      name: string;
      sort_order: number;
      declared_progress_pct: string;
      published_question_count: string;
    }>(
      `
        SELECT
          c.id,
          c.code,
          c.name,
          c.sort_order,
          COALESCE(ucp.declared_progress_pct, 0)::text AS declared_progress_pct,
          (
            SELECT COUNT(*)::text
            FROM questions q
            WHERE q.chapter_id = c.id
              AND q.status = 'published'
              AND q.question_type IN ('single_choice', 'multi_choice', 'open_text')
          ) AS published_question_count
        FROM chapters c
        LEFT JOIN user_chapter_progress ucp
          ON ucp.chapter_id = c.id
         AND ucp.user_id = $1
        WHERE c.subject_id = $2
          AND c.is_active = TRUE
        ORDER BY c.sort_order ASC, c.name ASC
      `,
      [userId, subjectId]
    );

    return {
      subject,
      items: chaptersResult.rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        sortOrder: row.sort_order,
        declaredProgressPct: Number(row.declared_progress_pct),
        publishedQuestionCount: Number(row.published_question_count)
      }))
    };
  }

  async setChapterProgress(userId: string, chapterId: string, declaredProgressPct: number) {
    const chapterResult = await this.db.query<{ id: string; subject_id: string }>(
      `
        SELECT c.id, c.subject_id
        FROM chapters c
        JOIN subjects s ON s.id = c.subject_id
        WHERE c.id = $1
          AND c.is_active = TRUE
          AND s.is_active = TRUE
        LIMIT 1
      `,
      [chapterId]
    );
    const chapter = chapterResult.rows[0];
    if (!chapter) {
      throw new NotFoundException({
        code: "CHAPTER_NOT_FOUND",
        message: "Chapter not found"
      });
    }

    await this.db.query(
      `
        INSERT INTO user_chapter_progress
          (user_id, chapter_id, declared_progress_pct)
        VALUES
          ($1, $2, $3)
        ON CONFLICT (user_id, chapter_id)
        DO UPDATE
        SET declared_progress_pct = EXCLUDED.declared_progress_pct,
            updated_at = NOW()
      `,
      [userId, chapterId, declaredProgressPct]
    );

    return {
      chapterId,
      subjectId: chapter.subject_id,
      declaredProgressPct
    };
  }

  async listOpenTextAcceptedAnswers(userId: string, questionId: string) {
    await this.assertCanManageOpenTextQuestion(userId, questionId);

    const result = await this.db.query<{
      id: string;
      accepted_answer_text: string;
      normalized_answer_text: string;
      created_at: string;
    }>(
      `
        SELECT
          id,
          accepted_answer_text,
          normalized_answer_text,
          created_at
        FROM question_open_text_answers
        WHERE question_id = $1
        ORDER BY created_at ASC
      `,
      [questionId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      acceptedAnswerText: row.accepted_answer_text,
      normalizedAnswerText: row.normalized_answer_text,
      createdAt: row.created_at
    }));
  }

  async addOpenTextAcceptedAnswer(userId: string, questionId: string, acceptedAnswerText: string) {
    await this.assertCanManageOpenTextQuestion(userId, questionId);

    const normalized = this.normalizeOpenTextValue(acceptedAnswerText);
    if (normalized.length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "acceptedAnswerText must contain at least one letter or number"
      });
    }

    const cleanText = acceptedAnswerText.replace(/\s+/g, " ").trim();
    if (cleanText.length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "acceptedAnswerText must not be empty"
      });
    }

    try {
      const result = await this.db.query<{
        id: string;
        accepted_answer_text: string;
        normalized_answer_text: string;
        created_at: string;
      }>(
        `
          INSERT INTO question_open_text_answers
            (id, question_id, accepted_answer_text, normalized_answer_text)
          VALUES
            ($1, $2, $3, $4)
          RETURNING id, accepted_answer_text, normalized_answer_text, created_at
        `,
        [randomUUID(), questionId, cleanText, normalized]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        acceptedAnswerText: row.accepted_answer_text,
        normalizedAnswerText: row.normalized_answer_text,
        createdAt: row.created_at
      };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: "OPEN_TEXT_ACCEPTED_ANSWER_EXISTS",
          message: "This normalized answer already exists for the question"
        });
      }
      throw error;
    }
  }

  async deleteOpenTextAcceptedAnswer(userId: string, questionId: string, answerId: string) {
    await this.assertCanManageOpenTextQuestion(userId, questionId);

    return this.db.withTransaction(async (client) => {
      const existing = await client.query<{ id: string }>(
        `
          SELECT id
          FROM question_open_text_answers
          WHERE id = $1
            AND question_id = $2
          LIMIT 1
          FOR UPDATE
        `,
        [answerId, questionId]
      );
      if (existing.rowCount === 0) {
        throw new NotFoundException({
          code: "OPEN_TEXT_ACCEPTED_ANSWER_NOT_FOUND",
          message: "Accepted answer not found for this question"
        });
      }

      const countResult = await client.query<{ c: string }>(
        `
          SELECT COUNT(*)::text AS c
          FROM question_open_text_answers
          WHERE question_id = $1
        `,
        [questionId]
      );
      const answerCount = Number(countResult.rows[0]?.c ?? 0);
      if (answerCount <= 1) {
        throw new UnprocessableEntityException({
          code: "OPEN_TEXT_MIN_ANSWERS_REQUIRED",
          message: "An open-text question must keep at least one accepted answer"
        });
      }

      await client.query(
        `
          DELETE FROM question_open_text_answers
          WHERE id = $1
            AND question_id = $2
        `,
        [answerId, questionId]
      );

      return {
        deleted: true,
        answerId
      };
    });
  }

  async createQuestionSubmission(
    userId: string,
    dto: CreateQuestionSubmissionDto
  ): Promise<QuestionSubmissionView> {
    const payload = this.parseQuestionAuthoringPayload({
      subjectId: dto.subjectId,
      chapterId: dto.chapterId,
      questionType: dto.questionType,
      prompt: dto.prompt,
      explanation: dto.explanation,
      difficulty: dto.difficulty,
      choices: dto.choices,
      acceptedAnswers: dto.acceptedAnswers
    });

    return this.db.withTransaction(async (client) => {
      await this.assertSubjectChapterActive(client, payload.subjectId, payload.chapterId);

      const submissionId = randomUUID();
      await client.query(
        `
          INSERT INTO question_submissions
            (
              id,
              proposer_user_id,
              subject_id,
              chapter_id,
              question_type,
              prompt,
              explanation,
              difficulty,
              status
            )
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        `,
        [
          submissionId,
          userId,
          payload.subjectId,
          payload.chapterId,
          payload.questionType,
          payload.prompt,
          payload.explanation,
          payload.difficulty
        ]
      );

      await this.replaceSubmissionContent(client, submissionId, payload);
      return this.loadQuestionSubmissionView(client, submissionId);
    });
  }

  async listQuestionSubmissions(userId: string, options: ListQuestionSubmissionsOptions) {
    const status = this.parseSubmissionStatusFilter(options.status);
    const questionType = this.parseAdminQuestionTypeFilter(options.questionType);
    const subjectId = this.parseOptionalUuidFilter(options.subjectId, "subjectId");
    const chapterId = this.parseOptionalUuidFilter(options.chapterId, "chapterId");
    const createdBy = options.createdBy === "all" ? "all" : "me";
    const limit = this.parsePositiveInteger(options.limit, 20, 1, 100, "limit");
    const offset = this.parsePositiveInteger(options.offset, 0, 0, 10_000, "offset");
    const userCanAccessAll = this.canAccessAllSubmissions(userId);
    if (createdBy === "all" && !userCanAccessAll) {
      throw new ForbiddenException({
        code: "TRAINING_SUBMISSION_REVIEW_FORBIDDEN",
        message: "Only reviewers can list all submissions"
      });
    }

    const whereParts: string[] = ["qs.question_type IN ('single_choice', 'multi_choice', 'open_text')"];
    const values: unknown[] = [];
    let index = 1;

    if (status) {
      whereParts.push(`qs.status = $${index}`);
      values.push(status);
      index += 1;
    }
    if (questionType) {
      whereParts.push(`qs.question_type = $${index}`);
      values.push(questionType);
      index += 1;
    }
    if (subjectId) {
      whereParts.push(`qs.subject_id = $${index}`);
      values.push(subjectId);
      index += 1;
    }
    if (chapterId) {
      whereParts.push(`qs.chapter_id = $${index}`);
      values.push(chapterId);
      index += 1;
    }
    if (createdBy === "me" || !userCanAccessAll) {
      whereParts.push(`qs.proposer_user_id = $${index}`);
      values.push(userId);
      index += 1;
    }

    const limitIndex = index;
    values.push(limit);
    index += 1;
    const offsetIndex = index;
    values.push(offset);

    const result = await this.db.query<{
      id: string;
      proposer_user_id: string;
      subject_id: string;
      chapter_id: string;
      question_type: "single_choice" | "multi_choice" | "open_text";
      prompt: string;
      difficulty: number;
      status: "pending" | "approved" | "rejected";
      reviewed_at: string | null;
      published_question_id: string | null;
      created_at: string;
      choice_count: string;
      accepted_answers_count: string;
    }>(
      `
        SELECT
          qs.id,
          qs.proposer_user_id,
          qs.subject_id,
          qs.chapter_id,
          qs.question_type,
          qs.prompt,
          qs.difficulty,
          qs.status,
          qs.reviewed_at,
          qs.published_question_id,
          qs.created_at,
          (
            SELECT COUNT(*)::text
            FROM question_submission_choices qsc
            WHERE qsc.submission_id = qs.id
          ) AS choice_count,
          (
            SELECT COUNT(*)::text
            FROM question_submission_open_text_answers qsoa
            WHERE qsoa.submission_id = qs.id
          ) AS accepted_answers_count
        FROM question_submissions qs
        WHERE ${whereParts.join(" AND ")}
        ORDER BY qs.created_at DESC, qs.id DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      values
    );

    return {
      items: result.rows.map((row) => ({
        id: row.id,
        proposerUserId: row.proposer_user_id,
        subjectId: row.subject_id,
        chapterId: row.chapter_id,
        questionType: row.question_type,
        promptPreview: row.prompt.length > 180 ? `${row.prompt.slice(0, 177)}...` : row.prompt,
        difficulty: row.difficulty,
        status: row.status,
        reviewedAt: row.reviewed_at,
        publishedQuestionId: row.published_question_id,
        createdAt: row.created_at,
        choiceCount: Number(row.choice_count),
        acceptedAnswersCount: Number(row.accepted_answers_count)
      })),
      page: {
        limit,
        offset,
        hasMore: result.rows.length === limit
      }
    };
  }

  async listSubmissionReviewQueue(userId: string, options: ListSubmissionReviewQueueOptions) {
    if (!this.canAccessAllSubmissions(userId)) {
      throw new ForbiddenException({
        code: "TRAINING_SUBMISSION_REVIEW_FORBIDDEN",
        message: "You are not allowed to access review queue"
      });
    }
    const limit = this.parsePositiveInteger(options.limit, 20, 1, 100, "limit");

    const pendingResult = await this.db.query<{
      id: string;
      proposer_user_id: string;
      subject_id: string;
      chapter_id: string;
      question_type: "single_choice" | "multi_choice" | "open_text";
      prompt: string;
      explanation: string;
      difficulty: number;
      created_at: string;
      choice_count: string;
      accepted_answers_count: string;
    }>(
      `
        SELECT
          qs.id,
          qs.proposer_user_id,
          qs.subject_id,
          qs.chapter_id,
          qs.question_type,
          qs.prompt,
          qs.explanation,
          qs.difficulty,
          qs.created_at,
          (
            SELECT COUNT(*)::text
            FROM question_submission_choices qsc
            WHERE qsc.submission_id = qs.id
          ) AS choice_count,
          (
            SELECT COUNT(*)::text
            FROM question_submission_open_text_answers qsoa
            WHERE qsoa.submission_id = qs.id
          ) AS accepted_answers_count
        FROM question_submissions qs
        WHERE qs.status = 'pending'
        ORDER BY qs.created_at ASC
        LIMIT 200
      `
    );

    if (pendingResult.rowCount === 0) {
      return { items: [] as SubmissionReviewQueueItem[] };
    }

    const subjectIds = [...new Set(pendingResult.rows.map((row) => row.subject_id))];
    const chapterIds = [...new Set(pendingResult.rows.map((row) => row.chapter_id))];

    const candidateQuestions = await this.db.query<{
      id: string;
      subject_id: string;
      chapter_id: string;
      question_type: "single_choice" | "multi_choice" | "open_text";
      status: "draft" | "published" | "retired";
      prompt: string;
    }>(
      `
        SELECT id, subject_id, chapter_id, question_type, status, prompt
        FROM questions
        WHERE subject_id = ANY($1::uuid[])
          AND chapter_id = ANY($2::uuid[])
          AND question_type IN ('single_choice', 'multi_choice', 'open_text')
      `,
      [subjectIds, chapterIds]
    );
    const candidateSubmissions = await this.db.query<{
      id: string;
      subject_id: string;
      chapter_id: string;
      question_type: "single_choice" | "multi_choice" | "open_text";
      status: "pending" | "approved" | "rejected";
      prompt: string;
    }>(
      `
        SELECT id, subject_id, chapter_id, question_type, status, prompt
        FROM question_submissions
        WHERE subject_id = ANY($1::uuid[])
          AND chapter_id = ANY($2::uuid[])
          AND status IN ('pending', 'approved')
      `,
      [subjectIds, chapterIds]
    );

    const pendingItems = pendingResult.rows.map((submission) => {
      const normalizedPrompt = this.normalizeOpenTextValue(submission.prompt);
      const promptTokens = this.promptTokens(normalizedPrompt);
      const duplicateCandidates = [
        ...candidateQuestions.rows
          .filter(
            (candidate) =>
              candidate.subject_id === submission.subject_id && candidate.chapter_id === submission.chapter_id
          )
          .map((candidate) => {
            const similarityScore = this.promptSimilarity(normalizedPrompt, promptTokens, candidate.prompt);
            return {
              sourceType: "question" as const,
              sourceId: candidate.id,
              similarityScore,
              status: candidate.status,
              promptPreview: this.promptPreview(candidate.prompt, 140)
            };
          }),
        ...candidateSubmissions.rows
          .filter(
            (candidate) =>
              candidate.id !== submission.id &&
              candidate.subject_id === submission.subject_id &&
              candidate.chapter_id === submission.chapter_id
          )
          .map((candidate) => {
            const similarityScore = this.promptSimilarity(normalizedPrompt, promptTokens, candidate.prompt);
            return {
              sourceType: "submission" as const,
              sourceId: candidate.id,
              similarityScore,
              status: candidate.status,
              promptPreview: this.promptPreview(candidate.prompt, 140)
            };
          })
      ]
        .filter((candidate) => candidate.similarityScore >= 0.55)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 3);

      const flags: string[] = [];
      if (duplicateCandidates.length > 0) {
        flags.push("potential_duplicate");
      }
      if (submission.prompt.replace(/\s+/g, " ").trim().length < 40) {
        flags.push("short_prompt");
      }
      if (submission.explanation.replace(/\s+/g, " ").trim().length < 70) {
        flags.push("short_explanation");
      }
      if (submission.question_type === "open_text" && Number(submission.accepted_answers_count) < 2) {
        flags.push("narrow_open_text_answers");
      }
      if (
        (submission.question_type === "single_choice" || submission.question_type === "multi_choice") &&
        Number(submission.choice_count) !== 4
      ) {
        flags.push("invalid_choice_count");
      }

      const qualityScore = this.computeSubmissionQualityScore({
        prompt: submission.prompt,
        explanation: submission.explanation,
        questionType: submission.question_type,
        choiceCount: Number(submission.choice_count),
        acceptedAnswersCount: Number(submission.accepted_answers_count),
        duplicateTopScore: duplicateCandidates[0]?.similarityScore ?? 0
      });
      const ageHours = Math.max(
        0,
        (Date.now() - new Date(submission.created_at).getTime()) / (1000 * 60 * 60)
      );
      const queueScore = Math.round(
        ((duplicateCandidates[0]?.similarityScore ?? 0) * 60 +
          Math.min(ageHours, 72) * 0.6 +
          (100 - qualityScore) * 0.4) *
          100
      ) / 100;

      return {
        id: submission.id,
        proposerUserId: submission.proposer_user_id,
        subjectId: submission.subject_id,
        chapterId: submission.chapter_id,
        questionType: submission.question_type,
        promptPreview: this.promptPreview(submission.prompt, 180),
        difficulty: submission.difficulty,
        createdAt: submission.created_at,
        qualityScore,
        queueScore,
        flags,
        duplicateCandidates
      } satisfies SubmissionReviewQueueItem;
    });

    const items = pendingItems
      .sort((a, b) => {
        if (b.queueScore !== a.queueScore) {
          return b.queueScore - a.queueScore;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, limit);

    return { items };
  }

  async getSubmissionReviewDashboard(userId: string): Promise<SubmissionReviewDashboard> {
    if (!this.canAccessAllSubmissions(userId)) {
      throw new ForbiddenException({
        code: "TRAINING_SUBMISSION_REVIEW_FORBIDDEN",
        message: "You are not allowed to access review dashboard"
      });
    }

    const targetHours = 48;
    const [pendingStatsResult, reviewStatsResult, pendingBySubjectResult, byTypeResult, byDifficultyResult] =
      await Promise.all([
        this.db.query<{
          pending_count: string;
          pending_over_sla_count: string;
          oldest_pending_hours: number | string | null;
        }>(
          `
            SELECT
              COUNT(*)::text AS pending_count,
              COUNT(*) FILTER (
                WHERE NOW() - qs.created_at > make_interval(hours => $1)
              )::text AS pending_over_sla_count,
              COALESCE(
                MAX(EXTRACT(EPOCH FROM (NOW() - qs.created_at)) / 3600),
                0
              ) AS oldest_pending_hours
            FROM question_submissions qs
            WHERE qs.status = 'pending'
          `,
          [targetHours]
        ),
        this.db.query<{
          reviewed_count: string;
          approved_count: string;
          rejected_count: string;
          reviewed_within_sla_count: string;
          avg_review_hours: number | string | null;
          p50_review_hours: number | string | null;
        }>(
          `
            SELECT
              COUNT(*)::text AS reviewed_count,
              COUNT(*) FILTER (WHERE qs.status = 'approved')::text AS approved_count,
              COUNT(*) FILTER (WHERE qs.status = 'rejected')::text AS rejected_count,
              COUNT(*) FILTER (
                WHERE (qs.reviewed_at - qs.created_at) <= make_interval(hours => $1)
              )::text AS reviewed_within_sla_count,
              AVG(EXTRACT(EPOCH FROM (qs.reviewed_at - qs.created_at)) / 3600) AS avg_review_hours,
              percentile_cont(0.5) WITHIN GROUP (
                ORDER BY EXTRACT(EPOCH FROM (qs.reviewed_at - qs.created_at)) / 3600
              ) AS p50_review_hours
            FROM question_submissions qs
            WHERE qs.reviewed_at IS NOT NULL
              AND qs.status IN ('approved', 'rejected')
              AND qs.reviewed_at >= NOW() - INTERVAL '7 days'
          `,
          [targetHours]
        ),
        this.db.query<{
          subject_id: string;
          subject_name: string;
          pending_count: string;
          over_sla_count: string;
          oldest_pending_hours: number | string | null;
        }>(
          `
            SELECT
              s.id AS subject_id,
              s.name AS subject_name,
              COUNT(*)::text AS pending_count,
              COUNT(*) FILTER (
                WHERE NOW() - qs.created_at > make_interval(hours => $1)
              )::text AS over_sla_count,
              COALESCE(
                MAX(EXTRACT(EPOCH FROM (NOW() - qs.created_at)) / 3600),
                0
              ) AS oldest_pending_hours
            FROM question_submissions qs
            JOIN subjects s
              ON s.id = qs.subject_id
            WHERE qs.status = 'pending'
            GROUP BY s.id, s.name
            ORDER BY COUNT(*) DESC, s.name ASC
            LIMIT 12
          `,
          [targetHours]
        ),
        this.db.query<{
          question_type: "single_choice" | "multi_choice" | "open_text";
          count: string;
        }>(
          `
            SELECT
              qs.question_type,
              COUNT(*)::text AS count
            FROM question_submissions qs
            WHERE qs.status = 'pending'
            GROUP BY qs.question_type
            ORDER BY COUNT(*) DESC, qs.question_type ASC
          `
        ),
        this.db.query<{ difficulty: number; count: string }>(
          `
            SELECT
              qs.difficulty,
              COUNT(*)::text AS count
            FROM question_submissions qs
            WHERE qs.status = 'pending'
            GROUP BY qs.difficulty
            ORDER BY qs.difficulty ASC
          `
        )
      ]);

    const pendingStats = pendingStatsResult.rows[0];
    const reviewStats = reviewStatsResult.rows[0];

    const pendingCount = Number(pendingStats?.pending_count ?? 0);
    const pendingOverSlaCount = Number(pendingStats?.pending_over_sla_count ?? 0);
    const oldestPendingHours = this.toRoundedNumber(pendingStats?.oldest_pending_hours, 2);
    const pendingWithinSlaPct =
      pendingCount > 0
        ? this.toRoundedNumber(((pendingCount - pendingOverSlaCount) / pendingCount) * 100, 1)
        : 100;

    const reviewedCount = Number(reviewStats?.reviewed_count ?? 0);
    const approvedCount = Number(reviewStats?.approved_count ?? 0);
    const rejectedCount = Number(reviewStats?.rejected_count ?? 0);
    const reviewedWithinSlaCount = Number(reviewStats?.reviewed_within_sla_count ?? 0);
    const reviewedWithinSlaPct =
      reviewedCount > 0
        ? this.toRoundedNumber((reviewedWithinSlaCount / reviewedCount) * 100, 1)
        : null;

    return {
      snapshotAt: new Date().toISOString(),
      sla: {
        targetHours,
        pending: {
          totalCount: pendingCount,
          overSlaCount: pendingOverSlaCount,
          withinSlaPct: pendingWithinSlaPct,
          oldestPendingHours
        },
        reviewLast7d: {
          reviewedCount,
          approvedCount,
          rejectedCount,
          withinSlaPct: reviewedWithinSlaPct,
          avgReviewHours:
            reviewedCount > 0 ? this.toRoundedNumber(reviewStats?.avg_review_hours, 2) : null,
          p50ReviewHours:
            reviewedCount > 0 ? this.toRoundedNumber(reviewStats?.p50_review_hours, 2) : null
        }
      },
      pendingBySubject: pendingBySubjectResult.rows.map((row) => ({
        subjectId: row.subject_id,
        subjectName: row.subject_name,
        pendingCount: Number(row.pending_count),
        overSlaCount: Number(row.over_sla_count),
        oldestPendingHours: this.toRoundedNumber(row.oldest_pending_hours, 2)
      })),
      pendingDistribution: {
        byQuestionType: byTypeResult.rows.map((row) => ({
          questionType: row.question_type,
          count: Number(row.count)
        })),
        byDifficulty: byDifficultyResult.rows.map((row) => ({
          difficulty: row.difficulty,
          count: Number(row.count)
        }))
      }
    };
  }

  async getQuestionSubmission(userId: string, submissionId: string): Promise<QuestionSubmissionView> {
    const context = await this.getQuestionSubmissionContext(this.db, submissionId);
    if (context.proposer_user_id !== userId && !this.canAccessAllSubmissions(userId)) {
      throw new ForbiddenException({
        code: "TRAINING_SUBMISSION_REVIEW_FORBIDDEN",
        message: "You are not allowed to access this submission"
      });
    }
    return this.loadQuestionSubmissionView(this.db, submissionId);
  }

  async reviewQuestionSubmission(
    userId: string,
    submissionId: string,
    dto: ReviewQuestionSubmissionDto
  ): Promise<QuestionSubmissionView> {
    const decision = dto.decision;
    const reviewNote = this.normalizeOptionalReviewNote(dto.reviewNote);
    if (decision === "reject" && !reviewNote) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "reviewNote is required when decision=reject"
      });
    }

    return this.db.withTransaction(async (client) => {
      const context = await this.getQuestionSubmissionContext(client, submissionId, true);
      this.assertCanReviewSubmission(userId, context.proposer_user_id);

      if (context.status !== "pending") {
        throw new UnprocessableEntityException({
          code: "QUESTION_SUBMISSION_NOT_PENDING",
          message: "Only pending submissions can be reviewed"
        });
      }

      if (decision === "reject") {
        await client.query(
          `
            UPDATE question_submissions
            SET status = 'rejected',
                reviewed_by_user_id = $2,
                review_note = $3,
                reviewed_at = NOW()
            WHERE id = $1
          `,
          [submissionId, userId, reviewNote]
        );
        await client.query(
          `
            INSERT INTO question_submission_reviews
              (id, submission_id, reviewer_user_id, action, note)
            VALUES
              ($1, $2, $3, 'reject', $4)
          `,
          [randomUUID(), submissionId, userId, reviewNote]
        );
        return this.loadQuestionSubmissionView(client, submissionId);
      }

      const payload = await this.loadNormalizedPayloadFromSubmission(client, submissionId);
      await this.assertSubjectChapterActive(client, payload.subjectId, payload.chapterId);

      const questionId = randomUUID();
      await client.query(
        `
          INSERT INTO questions
            (
              id,
              subject_id,
              chapter_id,
              question_type,
              prompt,
              explanation,
              difficulty,
              status,
              curriculum_scope,
              created_by_user_id
            )
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, 'draft', 'national', $8)
        `,
        [
          questionId,
          payload.subjectId,
          payload.chapterId,
          payload.questionType,
          payload.prompt,
          payload.explanation,
          payload.difficulty,
          context.proposer_user_id
        ]
      );
      await this.replaceQuestionContent(client, questionId, payload);
      await this.publishQuestionInTransaction(client, questionId, payload.questionType, "draft");

      await client.query(
        `
          UPDATE question_submissions
          SET status = 'approved',
              reviewed_by_user_id = $2,
              review_note = $3,
              reviewed_at = NOW(),
              published_question_id = $4
          WHERE id = $1
        `,
        [submissionId, userId, reviewNote, questionId]
      );
      await client.query(
        `
          INSERT INTO question_submission_reviews
            (id, submission_id, reviewer_user_id, action, note)
          VALUES
            ($1, $2, $3, 'approve', $4)
        `,
        [randomUUID(), submissionId, userId, reviewNote]
      );

      return this.loadQuestionSubmissionView(client, submissionId);
    });
  }

  async createAdminQuestion(userId: string, dto: UpsertTrainingQuestionDto): Promise<AdminQuestionView> {
    this.assertCanCreateTrainingQuestion(userId);
    const payload = this.parseQuestionAuthoringPayload(dto);

    return this.db.withTransaction(async (client) => {
      await this.assertSubjectChapterActive(client, payload.subjectId, payload.chapterId);

      const questionId = randomUUID();
      await client.query(
        `
          INSERT INTO questions
            (
              id,
              subject_id,
              chapter_id,
              question_type,
              prompt,
              explanation,
              difficulty,
              status,
              curriculum_scope,
              created_by_user_id
            )
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, 'draft', 'national', $8)
        `,
        [
          questionId,
          payload.subjectId,
          payload.chapterId,
          payload.questionType,
          payload.prompt,
          payload.explanation,
          payload.difficulty,
          userId
        ]
      );

      await this.replaceQuestionContent(client, questionId, payload);

      if (payload.publishNow) {
        await this.publishQuestionInTransaction(client, questionId, payload.questionType, "draft");
      }

      return this.loadAdminQuestionView(client, questionId);
    });
  }

  async getAdminQuestion(userId: string, questionId: string): Promise<AdminQuestionView> {
    const context = await this.getQuestionEditorContext(this.db, questionId);
    this.assertCanManageTrainingQuestion(userId, context.created_by_user_id);
    return this.loadAdminQuestionView(this.db, questionId);
  }

  async listAdminQuestions(userId: string, options: ListAdminQuestionsOptions) {
    const status = this.parseAdminStatusFilter(options.status);
    const questionType = this.parseAdminQuestionTypeFilter(options.questionType);
    const subjectId = this.parseOptionalUuidFilter(options.subjectId, "subjectId");
    const chapterId = this.parseOptionalUuidFilter(options.chapterId, "chapterId");
    const createdBy = options.createdBy === "all" ? "all" : "me";
    const limit = this.parsePositiveInteger(options.limit, 20, 1, 100, "limit");
    const offset = this.parsePositiveInteger(options.offset, 0, 0, 10_000, "offset");
    const userCanAccessAll = this.cfg.trainingContentEditorUserIds.includes(userId);
    if (createdBy === "all" && !userCanAccessAll) {
      throw new ForbiddenException({
        code: "TRAINING_CONTENT_EDITOR_FORBIDDEN",
        message: "Only content editors can list all questions"
      });
    }

    const whereParts: string[] = ["q.question_type IN ('single_choice', 'multi_choice', 'open_text')"];
    const values: unknown[] = [];
    let index = 1;
    if (status) {
      whereParts.push(`q.status = $${index}`);
      values.push(status);
      index += 1;
    }
    if (questionType) {
      whereParts.push(`q.question_type = $${index}`);
      values.push(questionType);
      index += 1;
    }
    if (subjectId) {
      whereParts.push(`q.subject_id = $${index}`);
      values.push(subjectId);
      index += 1;
    }
    if (chapterId) {
      whereParts.push(`q.chapter_id = $${index}`);
      values.push(chapterId);
      index += 1;
    }
    if (createdBy === "me" || !userCanAccessAll) {
      whereParts.push(`q.created_by_user_id = $${index}`);
      values.push(userId);
      index += 1;
    }

    const limitIndex = index;
    values.push(limit);
    index += 1;
    const offsetIndex = index;
    values.push(offset);

    const result = await this.db.query<{
      id: string;
      subject_id: string;
      chapter_id: string;
      question_type: string;
      prompt: string;
      difficulty: number;
      status: string;
      created_by_user_id: string | null;
      updated_at: string;
      published_at: string | null;
      retired_at: string | null;
      choice_count: string;
      correct_choice_count: string;
      accepted_answers_count: string;
    }>(
      `
        SELECT
          q.id,
          q.subject_id,
          q.chapter_id,
          q.question_type,
          q.prompt,
          q.difficulty,
          q.status,
          q.created_by_user_id,
          q.updated_at,
          q.published_at,
          q.retired_at,
          (
            SELECT COUNT(*)::text
            FROM question_choices qc
            WHERE qc.question_id = q.id
          ) AS choice_count,
          (
            SELECT COUNT(*) FILTER (WHERE qc.is_correct)::text
            FROM question_choices qc
            WHERE qc.question_id = q.id
          ) AS correct_choice_count,
          (
            SELECT COUNT(*)::text
            FROM question_open_text_answers qota
            WHERE qota.question_id = q.id
          ) AS accepted_answers_count
        FROM questions q
        WHERE ${whereParts.join(" AND ")}
        ORDER BY q.updated_at DESC, q.id DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      values
    );

    return {
      items: result.rows.map((row) => ({
        id: row.id,
        subjectId: row.subject_id,
        chapterId: row.chapter_id,
        questionType: row.question_type,
        promptPreview: row.prompt.length > 180 ? `${row.prompt.slice(0, 177)}...` : row.prompt,
        difficulty: row.difficulty,
        status: row.status,
        createdByUserId: row.created_by_user_id,
        updatedAt: row.updated_at,
        publishedAt: row.published_at,
        retiredAt: row.retired_at,
        choiceCount: Number(row.choice_count),
        correctChoiceCount: Number(row.correct_choice_count),
        acceptedAnswersCount: Number(row.accepted_answers_count)
      })),
      page: {
        limit,
        offset,
        hasMore: result.rows.length === limit
      }
    };
  }

  async updateAdminQuestion(
    userId: string,
    questionId: string,
    dto: UpsertTrainingQuestionDto
  ): Promise<AdminQuestionView> {
    const payload = this.parseQuestionAuthoringPayload(dto);

    return this.db.withTransaction(async (client) => {
      const context = await this.getQuestionEditorContext(client, questionId, true);
      this.assertCanManageTrainingQuestion(userId, context.created_by_user_id);

      if (payload.questionType !== context.question_type) {
        throw new UnprocessableEntityException({
          code: "QUESTION_TYPE_IMMUTABLE",
          message: "questionType cannot be changed once the question exists"
        });
      }

      await this.assertSubjectChapterActive(client, payload.subjectId, payload.chapterId);

      await client.query(
        `
          UPDATE questions
          SET subject_id = $2,
              chapter_id = $3,
              prompt = $4,
              explanation = $5,
              difficulty = $6,
              curriculum_scope = 'national'
          WHERE id = $1
        `,
        [
          questionId,
          payload.subjectId,
          payload.chapterId,
          payload.prompt,
          payload.explanation,
          payload.difficulty
        ]
      );

      await this.replaceQuestionContent(client, questionId, payload);

      if (payload.publishNow && context.status !== "published") {
        await this.publishQuestionInTransaction(client, questionId, context.question_type, context.status);
      }

      return this.loadAdminQuestionView(client, questionId);
    });
  }

  async publishAdminQuestion(userId: string, questionId: string): Promise<AdminQuestionView> {
    return this.db.withTransaction(async (client) => {
      const context = await this.getQuestionEditorContext(client, questionId, true);
      this.assertCanManageTrainingQuestion(userId, context.created_by_user_id);
      await this.publishQuestionInTransaction(client, questionId, context.question_type, context.status);
      return this.loadAdminQuestionView(client, questionId);
    });
  }

  async retireAdminQuestion(userId: string, questionId: string): Promise<AdminQuestionView> {
    return this.db.withTransaction(async (client) => {
      const context = await this.getQuestionEditorContext(client, questionId, true);
      this.assertCanManageTrainingQuestion(userId, context.created_by_user_id);

      if (context.status !== "retired") {
        await client.query(
          `
            UPDATE questions
            SET status = 'retired',
                retired_at = COALESCE(retired_at, NOW())
            WHERE id = $1
          `,
          [questionId]
        );
      }

      return this.loadAdminQuestionView(client, questionId);
    });
  }

  private normalizeSingleChoiceSelection(dto: AnswerTrainingQuestionDto): string[] {
    if (dto.openTextAnswer !== undefined) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "single_choice does not accept openTextAnswer"
      });
    }
    const combined = [
      ...(dto.selectedChoiceId ? [dto.selectedChoiceId] : []),
      ...(dto.selectedChoiceIds ?? [])
    ];
    const unique = [...new Set(combined)];
    if (unique.length !== 1) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "single_choice requires exactly one selected choice"
      });
    }
    return unique;
  }

  private normalizeMultiChoiceSelection(dto: AnswerTrainingQuestionDto): string[] {
    if (dto.openTextAnswer !== undefined) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "multi_choice does not accept openTextAnswer"
      });
    }
    const combined = [
      ...(dto.selectedChoiceId ? [dto.selectedChoiceId] : []),
      ...(dto.selectedChoiceIds ?? [])
    ];
    const unique = [...new Set(combined)];
    if (unique.length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "multi_choice requires at least one selected choice"
      });
    }
    if (unique.length > 4) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "multi_choice supports at most four selected choices"
      });
    }
    return unique;
  }

  private normalizeOpenTextAnswer(dto: AnswerTrainingQuestionDto): string {
    if (dto.selectedChoiceId || (dto.selectedChoiceIds?.length ?? 0) > 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "open_text does not accept selected choices"
      });
    }

    const raw = dto.openTextAnswer ?? "";
    const collapsed = raw.replace(/\s+/g, " ").trim();
    if (collapsed.length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "open_text requires a non-empty answer"
      });
    }
    return collapsed;
  }

  private normalizeOpenTextValue(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private parseQuestionAuthoringPayload(dto: QuestionAuthoringInput): NormalizedAdminQuestionPayload {
    const prompt = this.normalizeQuestionText(dto.prompt, "prompt", 12, 2000);
    const explanation = this.normalizeQuestionText(dto.explanation, "explanation", 12, 3000);
    const questionType = dto.questionType;
    const publishNow = dto.publishNow === true;

    const rawChoices = Array.isArray(dto.choices) ? dto.choices : [];
    const rawAcceptedAnswers = Array.isArray(dto.acceptedAnswers) ? dto.acceptedAnswers : [];

    if (questionType === "open_text") {
      if (rawChoices.length > 0) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "open_text question does not accept choices"
        });
      }

      if (rawAcceptedAnswers.length === 0) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "open_text question requires at least one accepted answer"
        });
      }

      const acceptedAnswers = rawAcceptedAnswers.map((value, index) => {
        const text = typeof value === "string" ? value : "";
        const acceptedAnswerText = text.replace(/\s+/g, " ").trim();
        if (acceptedAnswerText.length === 0) {
          throw new BadRequestException({
            code: "VALIDATION_ERROR",
            message: `acceptedAnswers[${index}] must not be empty`
          });
        }
        const normalizedAnswerText = this.normalizeOpenTextValue(acceptedAnswerText);
        if (normalizedAnswerText.length === 0) {
          throw new BadRequestException({
            code: "VALIDATION_ERROR",
            message: `acceptedAnswers[${index}] must contain letters or numbers`
          });
        }
        return { acceptedAnswerText, normalizedAnswerText };
      });

      const uniqueNormalized = new Set(acceptedAnswers.map((item) => item.normalizedAnswerText));
      if (uniqueNormalized.size !== acceptedAnswers.length) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "acceptedAnswers must be unique after normalization"
        });
      }

      return {
        subjectId: dto.subjectId,
        chapterId: dto.chapterId,
        questionType,
        prompt,
        explanation,
        difficulty: dto.difficulty,
        publishNow,
        choices: [],
        acceptedAnswers
      };
    }

    if (rawAcceptedAnswers.length > 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Choice-based questions do not accept acceptedAnswers"
      });
    }
    if (rawChoices.length !== 4) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Choice-based questions require exactly 4 choices"
      });
    }

    const choices = rawChoices.map((choice, index) => {
      const label = this.normalizeChoiceLabel(choice?.label, index + 1);
      if (!this.isBoolean(choice?.isCorrect)) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: `choices[${index}].isCorrect must be boolean`
        });
      }
      return {
        position: index + 1,
        label,
        isCorrect: choice.isCorrect
      };
    });

    const uniqueLabels = new Set(choices.map((choice) => this.normalizeOpenTextValue(choice.label)));
    if (uniqueLabels.size !== choices.length) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "choices labels must be unique"
      });
    }

    const correctCount = choices.filter((choice) => choice.isCorrect).length;
    if (questionType === "single_choice" && correctCount !== 1) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "single_choice requires exactly 1 correct choice"
      });
    }
    if (questionType === "multi_choice" && (correctCount < 2 || correctCount > 3)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "multi_choice requires 2 or 3 correct choices"
      });
    }

    return {
      subjectId: dto.subjectId,
      chapterId: dto.chapterId,
      questionType,
      prompt,
      explanation,
      difficulty: dto.difficulty,
      publishNow,
      choices,
      acceptedAnswers: []
    };
  }

  private normalizeQuestionText(value: unknown, field: string, minLength: number, maxLength: number): string {
    const raw = typeof value === "string" ? value : "";
    const normalized = raw.replace(/\s+/g, " ").trim();
    if (normalized.length < minLength) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `${field} must be at least ${minLength} characters`
      });
    }
    if (normalized.length > maxLength) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `${field} must be at most ${maxLength} characters`
      });
    }
    return normalized;
  }

  private normalizeChoiceLabel(value: unknown, position: number): string {
    const raw = typeof value === "string" ? value : "";
    const normalized = raw.replace(/\s+/g, " ").trim();
    if (normalized.length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `choices[${position - 1}].label must not be empty`
      });
    }
    if (normalized.length > 280) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `choices[${position - 1}].label must be at most 280 characters`
      });
    }
    return normalized;
  }

  private assertCanCreateTrainingQuestion(userId: string): void {
    const allowlist = this.cfg.trainingContentEditorUserIds;
    if (allowlist.length === 0) {
      if (this.cfg.nodeEnv === "production") {
        throw new ForbiddenException({
          code: "TRAINING_CONTENT_EDITORS_NOT_CONFIGURED",
          message: "Training content editor allowlist is required in production"
        });
      }
      return;
    }
    if (!allowlist.includes(userId)) {
      throw new ForbiddenException({
        code: "TRAINING_CONTENT_EDITOR_FORBIDDEN",
        message: "You are not allowed to create training questions"
      });
    }
  }

  private assertCanManageTrainingQuestion(userId: string, createdByUserId: string | null): void {
    if (this.cfg.trainingContentEditorUserIds.includes(userId)) {
      return;
    }
    if (createdByUserId === userId) {
      return;
    }
    throw new ForbiddenException({
      code: "TRAINING_CONTENT_EDITOR_FORBIDDEN",
      message: "You are not allowed to manage this training question"
    });
  }

  private canAccessAllSubmissions(userId: string): boolean {
    const allowlist = this.cfg.trainingContentEditorUserIds;
    if (allowlist.length === 0) {
      return this.cfg.nodeEnv !== "production";
    }
    return allowlist.includes(userId);
  }

  private assertCanReviewSubmission(userId: string, proposerUserId: string): void {
    if (!this.canAccessAllSubmissions(userId)) {
      throw new ForbiddenException({
        code: "TRAINING_SUBMISSION_REVIEW_FORBIDDEN",
        message: "You are not allowed to review submissions"
      });
    }
    if (userId === proposerUserId) {
      throw new ForbiddenException({
        code: "SUBMISSION_SELF_REVIEW_FORBIDDEN",
        message: "You cannot review your own submission"
      });
    }
  }

  private async getQuestionEditorContext(
    queryRunner: QueryRunner,
    questionId: string,
    forUpdate = false
  ): Promise<{
    id: string;
    question_type: "single_choice" | "multi_choice" | "open_text";
    status: string;
    created_by_user_id: string | null;
  }> {
    const result = await queryRunner.query<{
      id: string;
      question_type: string;
      status: string;
      created_by_user_id: string | null;
    }>(
      `
        SELECT id, question_type, status, created_by_user_id
        FROM questions
        WHERE id = $1
        ${forUpdate ? "FOR UPDATE" : ""}
        LIMIT 1
      `,
      [questionId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException({
        code: "QUESTION_NOT_FOUND",
        message: "Question not found"
      });
    }
    if (
      row.question_type !== "single_choice" &&
      row.question_type !== "multi_choice" &&
      row.question_type !== "open_text"
    ) {
      throw new UnprocessableEntityException({
        code: "UNSUPPORTED_QUESTION_TYPE",
        message: "Question type is not supported"
      });
    }
    return {
      id: row.id,
      question_type: row.question_type,
      status: row.status,
      created_by_user_id: row.created_by_user_id
    };
  }

  private async getQuestionSubmissionContext(
    queryRunner: QueryRunner,
    submissionId: string,
    forUpdate = false
  ): Promise<{
    id: string;
    proposer_user_id: string;
    status: "pending" | "approved" | "rejected";
  }> {
    const result = await queryRunner.query<{
      id: string;
      proposer_user_id: string;
      status: "pending" | "approved" | "rejected";
    }>(
      `
        SELECT id, proposer_user_id, status
        FROM question_submissions
        WHERE id = $1
        ${forUpdate ? "FOR UPDATE" : ""}
        LIMIT 1
      `,
      [submissionId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException({
        code: "QUESTION_SUBMISSION_NOT_FOUND",
        message: "Question submission not found"
      });
    }
    return row;
  }

  private async loadNormalizedPayloadFromSubmission(
    queryRunner: QueryRunner,
    submissionId: string
  ): Promise<NormalizedAdminQuestionPayload> {
    const submissionResult = await queryRunner.query<{
      id: string;
      subject_id: string;
      chapter_id: string;
      question_type: "single_choice" | "multi_choice" | "open_text";
      prompt: string;
      explanation: string;
      difficulty: number;
    }>(
      `
        SELECT id, subject_id, chapter_id, question_type, prompt, explanation, difficulty
        FROM question_submissions
        WHERE id = $1
        LIMIT 1
      `,
      [submissionId]
    );
    const submission = submissionResult.rows[0];
    if (!submission) {
      throw new NotFoundException({
        code: "QUESTION_SUBMISSION_NOT_FOUND",
        message: "Question submission not found"
      });
    }

    const choicesResult = await queryRunner.query<{
      label: string;
      is_correct: boolean;
      position: number;
    }>(
      `
        SELECT label, is_correct, position
        FROM question_submission_choices
        WHERE submission_id = $1
        ORDER BY position ASC
      `,
      [submissionId]
    );
    const openTextAnswersResult = await queryRunner.query<{
      accepted_answer_text: string;
      created_at: string;
    }>(
      `
        SELECT accepted_answer_text, created_at
        FROM question_submission_open_text_answers
        WHERE submission_id = $1
        ORDER BY created_at ASC
      `,
      [submissionId]
    );

    return this.parseQuestionAuthoringPayload({
      subjectId: submission.subject_id,
      chapterId: submission.chapter_id,
      questionType: submission.question_type,
      prompt: submission.prompt,
      explanation: submission.explanation,
      difficulty: submission.difficulty,
      choices: choicesResult.rows.map((row) => ({
        label: row.label,
        isCorrect: row.is_correct
      })),
      acceptedAnswers: openTextAnswersResult.rows.map((row) => row.accepted_answer_text)
    });
  }

  private async assertSubjectChapterActive(
    queryRunner: QueryRunner,
    subjectId: string,
    chapterId: string
  ): Promise<void> {
    const result = await queryRunner.query<{ id: string }>(
      `
        SELECT c.id
        FROM chapters c
        JOIN subjects s
          ON s.id = c.subject_id
        WHERE c.id = $1
          AND c.subject_id = $2
          AND c.is_active = TRUE
          AND s.is_active = TRUE
        LIMIT 1
      `,
      [chapterId, subjectId]
    );
    if (result.rowCount === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "subjectId/chapterId pair is invalid or inactive"
      });
    }
  }

  private async replaceQuestionContent(
    client: PoolClient,
    questionId: string,
    payload: NormalizedAdminQuestionPayload
  ): Promise<void> {
    await client.query(
      `
        DELETE FROM question_choices
        WHERE question_id = $1
      `,
      [questionId]
    );
    await client.query(
      `
        DELETE FROM question_open_text_answers
        WHERE question_id = $1
      `,
      [questionId]
    );

    if (payload.questionType === "open_text") {
      for (const item of payload.acceptedAnswers) {
        await client.query(
          `
            INSERT INTO question_open_text_answers
              (id, question_id, accepted_answer_text, normalized_answer_text)
            VALUES
              ($1, $2, $3, $4)
          `,
          [randomUUID(), questionId, item.acceptedAnswerText, item.normalizedAnswerText]
        );
      }
      return;
    }

    for (const choice of payload.choices) {
      await client.query(
        `
          INSERT INTO question_choices
            (id, question_id, label, position, is_correct)
          VALUES
            ($1, $2, $3, $4, $5)
        `,
        [randomUUID(), questionId, choice.label, choice.position, choice.isCorrect]
      );
    }
  }

  private async replaceSubmissionContent(
    client: PoolClient,
    submissionId: string,
    payload: NormalizedAdminQuestionPayload
  ): Promise<void> {
    await client.query(
      `
        DELETE FROM question_submission_choices
        WHERE submission_id = $1
      `,
      [submissionId]
    );
    await client.query(
      `
        DELETE FROM question_submission_open_text_answers
        WHERE submission_id = $1
      `,
      [submissionId]
    );

    if (payload.questionType === "open_text") {
      for (const item of payload.acceptedAnswers) {
        await client.query(
          `
            INSERT INTO question_submission_open_text_answers
              (id, submission_id, accepted_answer_text, normalized_answer_text)
            VALUES
              ($1, $2, $3, $4)
          `,
          [randomUUID(), submissionId, item.acceptedAnswerText, item.normalizedAnswerText]
        );
      }
      return;
    }

    for (const choice of payload.choices) {
      await client.query(
        `
          INSERT INTO question_submission_choices
            (id, submission_id, label, position, is_correct)
          VALUES
            ($1, $2, $3, $4, $5)
        `,
        [randomUUID(), submissionId, choice.label, choice.position, choice.isCorrect]
      );
    }
  }

  private async publishQuestionInTransaction(
    client: PoolClient,
    questionId: string,
    questionType: "single_choice" | "multi_choice" | "open_text",
    currentStatus: string
  ): Promise<void> {
    if (currentStatus === "published") {
      return;
    }
    if (currentStatus === "retired") {
      throw new UnprocessableEntityException({
        code: "QUESTION_ALREADY_RETIRED",
        message: "Retired question cannot be published"
      });
    }

    await this.assertQuestionPublishable(client, questionId, questionType);

    await client.query(
      `
        UPDATE questions
        SET status = 'published',
            published_at = COALESCE(published_at, NOW()),
            retired_at = NULL
        WHERE id = $1
      `,
      [questionId]
    );
  }

  private async assertQuestionPublishable(
    queryRunner: QueryRunner,
    questionId: string,
    questionType: "single_choice" | "multi_choice" | "open_text"
  ): Promise<void> {
    if (questionType === "open_text") {
      const answers = await queryRunner.query<{ c: string }>(
        `
          SELECT COUNT(*)::text AS c
          FROM question_open_text_answers
          WHERE question_id = $1
        `,
        [questionId]
      );
      const count = Number(answers.rows[0]?.c ?? 0);
      if (count < 1) {
        throw new UnprocessableEntityException({
          code: "QUESTION_CONFIGURATION_INVALID",
          message: "open_text question must define at least one accepted answer"
        });
      }
      return;
    }

    const choices = await queryRunner.query<{ total: string; correct: string }>(
      `
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE is_correct)::text AS correct
        FROM question_choices
        WHERE question_id = $1
      `,
      [questionId]
    );
    const total = Number(choices.rows[0]?.total ?? 0);
    const correct = Number(choices.rows[0]?.correct ?? 0);
    if (total !== 4) {
      throw new UnprocessableEntityException({
        code: "QUESTION_CONFIGURATION_INVALID",
        message: "Choice-based question must have exactly 4 choices"
      });
    }

    if (questionType === "single_choice" && correct !== 1) {
      throw new UnprocessableEntityException({
        code: "QUESTION_CONFIGURATION_INVALID",
        message: "single_choice question must have exactly one correct choice"
      });
    }
    if (questionType === "multi_choice" && (correct < 2 || correct > 3)) {
      throw new UnprocessableEntityException({
        code: "QUESTION_CONFIGURATION_INVALID",
        message: "multi_choice question must have 2 or 3 correct choices"
      });
    }
  }

  private async loadAdminQuestionView(
    queryRunner: QueryRunner,
    questionId: string
  ): Promise<AdminQuestionView> {
    const questionResult = await queryRunner.query<{
      id: string;
      subject_id: string;
      chapter_id: string;
      question_type: "single_choice" | "multi_choice" | "open_text";
      prompt: string;
      explanation: string;
      difficulty: number;
      status: string;
      curriculum_scope: string;
      created_by_user_id: string | null;
      created_at: string;
      updated_at: string;
      published_at: string | null;
      retired_at: string | null;
    }>(
      `
        SELECT
          id,
          subject_id,
          chapter_id,
          question_type,
          prompt,
          explanation,
          difficulty,
          status,
          curriculum_scope,
          created_by_user_id,
          created_at,
          updated_at,
          published_at,
          retired_at
        FROM questions
        WHERE id = $1
        LIMIT 1
      `,
      [questionId]
    );
    const question = questionResult.rows[0];
    if (!question) {
      throw new NotFoundException({
        code: "QUESTION_NOT_FOUND",
        message: "Question not found"
      });
    }

    const choicesResult = await queryRunner.query<{
      id: string;
      label: string;
      position: number;
      is_correct: boolean;
    }>(
      `
        SELECT id, label, position, is_correct
        FROM question_choices
        WHERE question_id = $1
        ORDER BY position ASC
      `,
      [questionId]
    );
    const acceptedAnswersResult = await queryRunner.query<{
      id: string;
      accepted_answer_text: string;
      normalized_answer_text: string;
      created_at: string;
    }>(
      `
        SELECT id, accepted_answer_text, normalized_answer_text, created_at
        FROM question_open_text_answers
        WHERE question_id = $1
        ORDER BY created_at ASC
      `,
      [questionId]
    );

    return {
      id: question.id,
      subjectId: question.subject_id,
      chapterId: question.chapter_id,
      questionType: question.question_type,
      prompt: question.prompt,
      explanation: question.explanation,
      difficulty: question.difficulty,
      status: question.status,
      curriculumScope: question.curriculum_scope,
      createdByUserId: question.created_by_user_id,
      createdAt: question.created_at,
      updatedAt: question.updated_at,
      publishedAt: question.published_at,
      retiredAt: question.retired_at,
      choices: choicesResult.rows.map((row) => ({
        id: row.id,
        label: row.label,
        position: row.position,
        isCorrect: row.is_correct
      })),
      acceptedAnswers: acceptedAnswersResult.rows.map((row) => ({
        id: row.id,
        acceptedAnswerText: row.accepted_answer_text,
        normalizedAnswerText: row.normalized_answer_text,
        createdAt: row.created_at
      }))
    };
  }

  private async loadQuestionSubmissionView(
    queryRunner: QueryRunner,
    submissionId: string
  ): Promise<QuestionSubmissionView> {
    const submissionResult = await queryRunner.query<{
      id: string;
      proposer_user_id: string;
      subject_id: string;
      chapter_id: string;
      question_type: "single_choice" | "multi_choice" | "open_text";
      prompt: string;
      explanation: string;
      difficulty: number;
      status: "pending" | "approved" | "rejected";
      review_note: string | null;
      reviewed_by_user_id: string | null;
      reviewed_at: string | null;
      published_question_id: string | null;
      created_at: string;
    }>(
      `
        SELECT
          id,
          proposer_user_id,
          subject_id,
          chapter_id,
          question_type,
          prompt,
          explanation,
          difficulty,
          status,
          review_note,
          reviewed_by_user_id,
          reviewed_at,
          published_question_id,
          created_at
        FROM question_submissions
        WHERE id = $1
        LIMIT 1
      `,
      [submissionId]
    );
    const submission = submissionResult.rows[0];
    if (!submission) {
      throw new NotFoundException({
        code: "QUESTION_SUBMISSION_NOT_FOUND",
        message: "Question submission not found"
      });
    }

    const choicesResult = await queryRunner.query<{
      id: string;
      label: string;
      position: number;
      is_correct: boolean;
    }>(
      `
        SELECT id, label, position, is_correct
        FROM question_submission_choices
        WHERE submission_id = $1
        ORDER BY position ASC
      `,
      [submissionId]
    );
    const acceptedAnswersResult = await queryRunner.query<{
      id: string;
      accepted_answer_text: string;
      normalized_answer_text: string;
      created_at: string;
    }>(
      `
        SELECT id, accepted_answer_text, normalized_answer_text, created_at
        FROM question_submission_open_text_answers
        WHERE submission_id = $1
        ORDER BY created_at ASC
      `,
      [submissionId]
    );

    return {
      id: submission.id,
      proposerUserId: submission.proposer_user_id,
      subjectId: submission.subject_id,
      chapterId: submission.chapter_id,
      questionType: submission.question_type,
      prompt: submission.prompt,
      explanation: submission.explanation,
      difficulty: submission.difficulty,
      status: submission.status,
      reviewNote: submission.review_note,
      reviewedByUserId: submission.reviewed_by_user_id,
      reviewedAt: submission.reviewed_at,
      publishedQuestionId: submission.published_question_id,
      createdAt: submission.created_at,
      choices: choicesResult.rows.map((row) => ({
        id: row.id,
        label: row.label,
        position: row.position,
        isCorrect: row.is_correct
      })),
      acceptedAnswers: acceptedAnswersResult.rows.map((row) => ({
        id: row.id,
        acceptedAnswerText: row.accepted_answer_text,
        normalizedAnswerText: row.normalized_answer_text,
        createdAt: row.created_at
      }))
    };
  }

  private isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
  }

  private parseAdminStatusFilter(value: string | undefined): "draft" | "published" | "retired" | null {
    if (!value) {
      return null;
    }
    if (value === "draft" || value === "published" || value === "retired") {
      return value;
    }
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "status must be one of: draft, published, retired"
    });
  }

  private parseSubmissionStatusFilter(
    value: string | undefined
  ): "pending" | "approved" | "rejected" | null {
    if (!value) {
      return null;
    }
    if (value === "pending" || value === "approved" || value === "rejected") {
      return value;
    }
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "status must be one of: pending, approved, rejected"
    });
  }

  private parseAdminQuestionTypeFilter(
    value: string | undefined
  ): "single_choice" | "multi_choice" | "open_text" | null {
    if (!value) {
      return null;
    }
    if (value === "single_choice" || value === "multi_choice" || value === "open_text") {
      return value;
    }
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "questionType must be one of: single_choice, multi_choice, open_text"
    });
  }

  private parseOptionalUuidFilter(value: string | undefined, field: string): string | null {
    if (!value) {
      return null;
    }
    if (!this.isUuidV4(value)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `${field} must be a valid UUID v4`
      });
    }
    return value;
  }

  private parsePositiveInteger(
    value: number | string | undefined,
    defaultValue: number,
    min: number,
    max: number,
    field: string
  ): number {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `${field} must be an integer in range ${min}..${max}`
      });
    }
    return parsed;
  }

  private normalizeOptionalReviewNote(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }
    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized.length > 0 ? normalized : null;
  }

  private promptPreview(value: string, maxLength: number): string {
    const collapsed = value.replace(/\s+/g, " ").trim();
    if (collapsed.length <= maxLength) {
      return collapsed;
    }
    return `${collapsed.slice(0, maxLength - 3)}...`;
  }

  private promptTokens(normalizedPrompt: string): Set<string> {
    return new Set(normalizedPrompt.split(" ").filter((token) => token.length >= 3));
  }

  private promptSimilarity(
    baseNormalizedPrompt: string,
    baseTokens: Set<string>,
    candidatePrompt: string
  ): number {
    const candidateNormalized = this.normalizeOpenTextValue(candidatePrompt);
    if (candidateNormalized.length === 0 || baseNormalizedPrompt.length === 0) {
      return 0;
    }
    if (candidateNormalized === baseNormalizedPrompt) {
      return 1;
    }

    const candidateTokens = this.promptTokens(candidateNormalized);
    if (baseTokens.size === 0 || candidateTokens.size === 0) {
      return 0;
    }
    let intersection = 0;
    for (const token of baseTokens) {
      if (candidateTokens.has(token)) {
        intersection += 1;
      }
    }
    const union = baseTokens.size + candidateTokens.size - intersection;
    if (union <= 0) {
      return 0;
    }

    const jaccard = intersection / union;
    const prefixMatch =
      candidateNormalized.startsWith(baseNormalizedPrompt.slice(0, Math.min(20, baseNormalizedPrompt.length))) ||
      baseNormalizedPrompt.startsWith(candidateNormalized.slice(0, Math.min(20, candidateNormalized.length)))
        ? 0.08
        : 0;
    return Math.min(1, jaccard + prefixMatch);
  }

  private computeSubmissionQualityScore(input: {
    prompt: string;
    explanation: string;
    questionType: "single_choice" | "multi_choice" | "open_text";
    choiceCount: number;
    acceptedAnswersCount: number;
    duplicateTopScore: number;
  }): number {
    let score = 100;
    const promptLength = input.prompt.replace(/\s+/g, " ").trim().length;
    const explanationLength = input.explanation.replace(/\s+/g, " ").trim().length;

    if (promptLength < 40) {
      score -= 15;
    } else if (promptLength < 70) {
      score -= 7;
    } else if (promptLength > 140) {
      score += 2;
    }

    if (explanationLength < 70) {
      score -= 18;
    } else if (explanationLength < 120) {
      score -= 8;
    } else if (explanationLength > 200) {
      score += 3;
    }

    if (input.questionType === "open_text") {
      if (input.acceptedAnswersCount <= 1) {
        score -= 12;
      } else if (input.acceptedAnswersCount >= 3) {
        score += 3;
      }
    } else if (input.choiceCount !== 4) {
      score -= 25;
    }

    if (input.duplicateTopScore >= 0.9) {
      score -= 35;
    } else if (input.duplicateTopScore >= 0.75) {
      score -= 20;
    } else if (input.duplicateTopScore >= 0.6) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private toRoundedNumber(value: unknown, decimals: number): number {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    const factor = 10 ** decimals;
    return Math.round(parsed * factor) / factor;
  }

  private isUuidV4(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private async assertCanManageOpenTextQuestion(userId: string, questionId: string): Promise<void> {
    const questionResult = await this.db.query<{
      id: string;
      question_type: string;
      created_by_user_id: string | null;
    }>(
      `
        SELECT id, question_type, created_by_user_id
        FROM questions
        WHERE id = $1
          AND status = 'published'
        LIMIT 1
      `,
      [questionId]
    );
    const question = questionResult.rows[0];
    if (!question) {
      throw new NotFoundException({
        code: "QUESTION_NOT_FOUND",
        message: "Question not found"
      });
    }
    if (question.question_type !== "open_text") {
      throw new UnprocessableEntityException({
        code: "QUESTION_TYPE_NOT_OPEN_TEXT",
        message: "Question must be open_text"
      });
    }

    const isAllowlisted = this.cfg.openTextEditorUserIds.includes(userId);
    const isOwner = question.created_by_user_id === userId;
    if (!isAllowlisted && !isOwner) {
      throw new ForbiddenException({
        code: "OPEN_TEXT_EDITOR_FORBIDDEN",
        message: "You are not allowed to manage accepted answers for this question"
      });
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }
    const maybe = error as { code?: unknown };
    return maybe.code === "23505";
  }

  private getSubjectMomentumLabel(subject: SubjectStateView): string {
    if (subject.attemptsCount === 0) {
      return "Point de départ";
    }

    if (subject.questionsToReinforceCount > 0) {
      return "À consolider";
    }

    if ((subject.successRatePct ?? 0) >= 80 && subject.declaredProgressPct >= 60) {
      return "Bonne dynamique";
    }

    if ((subject.successRatePct ?? 0) >= 65) {
      return "En progression";
    }

    return "À renforcer progressivement";
  }

  private buildSuggestedAction(subject: SubjectStateView): DashboardSuggestedAction | null {
    if (subject.attemptsCount === 0 && subject.publishedQuestionCount > 0) {
      return {
        score: 300,
        subjectId: subject.id,
        subjectName: subject.name,
        mode: "discovery",
        label: "Démarrer cette matière en mode découverte"
      };
    }

    if (subject.questionsToReinforceCount > 0) {
      return {
        score: 200 + subject.questionsToReinforceCount,
        subjectId: subject.id,
        subjectName: subject.name,
        mode: "rattrapage",
        label: "Consolider les notions déjà rencontrées"
      };
    }

    if (subject.successRatePct !== null && subject.successRatePct >= 80) {
      return {
        score: 120 + subject.successRatePct,
        subjectId: subject.id,
        subjectName: subject.name,
        mode: "par_coeur",
        label: "Stabiliser les acquis avec des questions validées"
      };
    }

    if (subject.attemptsCount > 0) {
      return {
        score: 100 + (100 - (subject.successRatePct ?? 0)),
        subjectId: subject.id,
        subjectName: subject.name,
        mode: "review",
        label: "Revoir les questions déjà travaillées"
      };
    }

    return null;
  }

  private pickGlobalSuggestedMode(
    subjects: SubjectStateView[],
    attemptsCount: number,
    successRatePct: number | null
  ): "learning" | "discovery" | "review" | "par_coeur" | "rattrapage" {
    if (subjects.some((subject) => subject.questionsToReinforceCount > 0)) {
      return "rattrapage";
    }

    if (subjects.some((subject) => subject.attemptsCount === 0 && subject.publishedQuestionCount > 0)) {
      return "discovery";
    }

    if (attemptsCount >= 20 && (successRatePct ?? 0) >= 80) {
      return "par_coeur";
    }

    if (attemptsCount > 0) {
      return "review";
    }

    return "learning";
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

  private buildSessionQuestionWhereParts(mode: SessionRow["mode"]): string[] {
    const whereParts: string[] = [
      "q.status = 'published'",
      "q.question_type IN ('single_choice', 'multi_choice', 'open_text')",
      "$2::uuid IS NOT NULL",
      `(
        NOT EXISTS (SELECT 1 FROM quiz_session_subject_filters ssf WHERE ssf.session_id = $1)
        OR q.subject_id IN (
          SELECT ssf.subject_id
          FROM quiz_session_subject_filters ssf
          WHERE ssf.session_id = $1
        )
      )`,
      `(
        NOT EXISTS (SELECT 1 FROM quiz_session_chapter_filters scf WHERE scf.session_id = $1)
        OR q.chapter_id IN (
          SELECT scf.chapter_id
          FROM quiz_session_chapter_filters scf
          WHERE scf.session_id = $1
        )
      )`
    ];

    if (mode === "discovery") {
      whereParts.push(
        "NOT EXISTS (SELECT 1 FROM user_question_stats uqs WHERE uqs.user_id = $2 AND uqs.question_id = q.id AND uqs.attempts_count > 0)"
      );
    }

    if (mode === "review") {
      whereParts.push(
        "EXISTS (SELECT 1 FROM user_question_stats uqs WHERE uqs.user_id = $2 AND uqs.question_id = q.id AND uqs.attempts_count > 0)"
      );
    }

    if (mode === "par_coeur") {
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

    if (mode === "rattrapage") {
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

    return whereParts;
  }

  private async ensureQuestionEligibleForSession(
    client: PoolClient,
    userId: string,
    session: SessionRow,
    questionId: string
  ): Promise<void> {
    const whereParts = this.buildSessionQuestionWhereParts(session.mode);
    whereParts.push("q.id = $3");
    whereParts.push("NOT EXISTS (SELECT 1 FROM quiz_answers qa WHERE qa.session_id = $1 AND qa.question_id = q.id)");

    const eligibilityResult = await client.query<{ id: string }>(
      `
        SELECT q.id
        FROM questions q
        WHERE ${whereParts.join(" AND ")}
        LIMIT 1
      `,
      [session.id, userId, questionId]
    );

    if (eligibilityResult.rowCount === 0) {
      throw new UnprocessableEntityException({
        code: "QUESTION_NOT_ELIGIBLE_FOR_SESSION",
        message: "Question does not match this session filters or mode"
      });
    }
  }

  private async validateSessionFilters(
    client: PoolClient,
    dto: Pick<CreateTrainingSessionDto, "subjectIds" | "chapterIds">
  ): Promise<void> {
    const subjectIds = dto.subjectIds ?? [];
    const chapterIds = dto.chapterIds ?? [];

    if (subjectIds.length > 0) {
      const subjects = await client.query<{ id: string }>(
        `
          SELECT id
          FROM subjects
          WHERE id = ANY($1::uuid[])
            AND is_active = TRUE
        `,
        [subjectIds]
      );
      if (subjects.rowCount !== subjectIds.length) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "One or more subjectIds are invalid or inactive"
        });
      }
    }

    if (chapterIds.length > 0) {
      const chapters = await client.query<{ id: string }>(
        `
          SELECT id
          FROM chapters
          WHERE id = ANY($1::uuid[])
            AND is_active = TRUE
        `,
        [chapterIds]
      );
      if (chapters.rowCount !== chapterIds.length) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "One or more chapterIds are invalid or inactive"
        });
      }
    }

    if (subjectIds.length > 0 && chapterIds.length > 0) {
      const compatibleChapters = await client.query<{ id: string }>(
        `
          SELECT id
          FROM chapters
          WHERE id = ANY($1::uuid[])
            AND subject_id = ANY($2::uuid[])
        `,
        [chapterIds, subjectIds]
      );
      if (compatibleChapters.rowCount !== chapterIds.length) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "All chapterIds must belong to selected subjectIds"
        });
      }
    }
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
