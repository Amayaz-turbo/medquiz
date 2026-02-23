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
import { CreateTrainingSessionDto } from "./dto/create-training-session.dto";

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
