import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
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

      if (question.question_type !== "single_choice") {
        throw new UnprocessableEntityException({
          code: "UNSUPPORTED_QUESTION_TYPE",
          message: "Only single_choice is supported in v1 answer endpoint"
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

      const choiceResult = await client.query<{ is_correct: boolean }>(
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
      const answerOrder = answeredCount + 1;

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
      return {
        isCorrect,
        explanation: question.explanation
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

  async listSubjectStates(userId: string) {
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
              AND q.question_type = 'single_choice'
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
              AND q.question_type = 'single_choice'
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
      "q.question_type = 'single_choice'",
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
