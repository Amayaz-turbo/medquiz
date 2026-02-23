import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { randomUUID } from "node:crypto";
import * as request from "supertest";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { RequestIdInterceptor } from "../src/common/interceptors/request-id.interceptor";
import { DatabaseService } from "../src/database/database.service";
import {
  IsolatedTestDatabase,
  createIsolatedTestDatabase,
  dropIsolatedTestDatabase,
  seedPublishedSingleChoiceQuestions
} from "./e2e.utils";

interface TestUserSession {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

interface DuelView {
  id: string;
  status: string;
  currentRoundNo: number;
  currentTurnUserId: string | null;
  turnDeadlineAt: string | null;
  rounds: Array<{ roundNo: number; status: string; chosenSubjectId: string | null }>;
  completedAt: string | null;
  winReason: string | null;
}

interface CurrentRoundView {
  roundNo: number;
  chosenSubjectId: string | null;
  offeredSubjects: Array<{ id: string; name: string }>;
}

interface DuelQuestionItem {
  slotNo: number;
  question: {
    id: string;
    choices: Array<{ id: string; label: string; position: number }>;
  };
}

describe("Critical integration flows", () => {
  jest.setTimeout(180_000);
  const metricsToken = "metrics-token-1234567890";

  let app: NestFastifyApplication;
  let db: DatabaseService;
  let duelsService: { expireDueTurns: (limit?: number) => Promise<{ processed: number }> };
  let isolatedDb: IsolatedTestDatabase;

  beforeAll(async () => {
    isolatedDb = await createIsolatedTestDatabase();
    process.env.NODE_ENV = "test";
    process.env.PORT = "18080";
    process.env.DATABASE_URL = isolatedDb.databaseUrl;
    process.env.ACCESS_TOKEN_SECRET = "test-access-secret-very-long";
    process.env.ACCESS_TOKEN_TTL = "15m";
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-very-long";
    process.env.REFRESH_TOKEN_TTL_DAYS = "30";
    process.env.CORS_ORIGIN = "";
    process.env.DUEL_EXPIRATION_JOB_ENABLED = "false";
    process.env.DUEL_EXPIRATION_INTERVAL_SECONDS = "300";
    process.env.METRICS_ENABLED = "true";
    process.env.METRICS_AUTH_TOKEN = metricsToken;
    process.env.SLO_AVAILABILITY_TARGET_PCT = "99.9";
    process.env.SLO_P95_LATENCY_MS = "300";
    process.env.SLO_WINDOW_DAYS = "30";
    process.env.HEALTH_DB_TIMEOUT_MS = "1500";
    process.env.OPEN_TEXT_EDITOR_USER_IDS = "";
    process.env.TRAINING_CONTENT_EDITOR_USER_IDS = "";

    const { AppModule } = await import("../src/app.module");
    const { DuelsService } = await import("../src/duels/duels.service");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new RequestIdInterceptor());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    db = app.get(DatabaseService);
    duelsService = app.get(DuelsService);

    await seedPublishedSingleChoiceQuestions(isolatedDb.databaseUrl);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (isolatedDb) {
      await dropIsolatedTestDatabase(isolatedDb);
    }
  });

  it("exposes liveness, readiness and observability endpoints", async () => {
    const live = await request(app.getHttpServer()).get("/v1/health/live").expect(200);
    expect(live.body.data.status).toBe("ok");

    const ready = await request(app.getHttpServer()).get("/v1/health/ready").expect(200);
    expect(ready.body.data.status).toBe("ok");
    expect(ready.body.data.database).toBe("ok");

    await request(app.getHttpServer()).get("/v1/observability/slo").expect(401);
    await request(app.getHttpServer()).get("/v1/observability/metrics").expect(401);

    const slo = await request(app.getHttpServer())
      .get("/v1/observability/slo")
      .set("Authorization", `Bearer ${metricsToken}`)
      .expect(200);
    expect(slo.body.data.targets.availabilityPct).toBe(99.9);
    expect(typeof slo.body.data.actual.p95LatencyMs).toBe("number");

    const metrics = await request(app.getHttpServer())
      .get("/v1/observability/metrics")
      .set("x-metrics-token", metricsToken)
      .expect(200);
    expect(metrics.headers["content-type"]).toContain("text/plain");
    expect(metrics.text).toContain("http_requests_total");
    expect(metrics.text).toContain("http_request_duration_ms_bucket");
  });

  it("register/login/refresh with token rotation", async () => {
    const registered = await registerUser("Auth Runner");

    const loginResponse = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({
        email: registered.email,
        password: passwordForTests()
      })
      .expect(201);

    const loginAccess = loginResponse.body.data.tokens.accessToken as string;
    const loginRefresh = loginResponse.body.data.tokens.refreshToken as string;
    expect(typeof loginAccess).toBe("string");
    expect(typeof loginRefresh).toBe("string");

    const refreshResponse = await request(app.getHttpServer())
      .post("/v1/auth/refresh")
      .send({
        refreshToken: loginRefresh
      })
      .expect(201);

    const rotatedRefresh = refreshResponse.body.data.tokens.refreshToken as string;
    expect(rotatedRefresh).not.toEqual(loginRefresh);

    await request(app.getHttpServer())
      .post("/v1/auth/refresh")
      .send({
        refreshToken: loginRefresh
      })
      .expect(401);

    const meResponse = await request(app.getHttpServer())
      .get("/v1/auth/me")
      .set("Authorization", `Bearer ${refreshResponse.body.data.tokens.accessToken as string}`)
      .expect(200);

    expect(meResponse.body.data.id).toBe(registered.userId);
    expect(meResponse.body.data.email).toBe(registered.email);
  });

  it("runs a training session and updates chapter progress state", async () => {
    const trainee = await registerUser("Training Player");

    const subjectsState = await request(app.getHttpServer())
      .get("/v1/trainings/state/subjects")
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .expect(200);
    const subjectId = subjectsState.body.data.items[0].id as string;
    expect(subjectId).toBeDefined();

    const chaptersState = await request(app.getHttpServer())
      .get(`/v1/trainings/state/subjects/${subjectId}/chapters`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .expect(200);
    const chapterId = chaptersState.body.data.items[0].id as string;
    expect(chapterId).toBeDefined();

    await request(app.getHttpServer())
      .put(`/v1/trainings/state/chapters/${chapterId}`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({ declaredProgressPct: 35 })
      .expect(200);

    const created = await request(app.getHttpServer())
      .post("/v1/trainings/sessions")
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        mode: "learning",
        stopRule: "fixed_custom",
        targetQuestionCount: 2,
        subjectIds: [subjectId],
        chapterIds: [chapterId]
      })
      .expect(201);
    const sessionId = created.body.data.id as string;

    const nextQuestion = await request(app.getHttpServer())
      .get(`/v1/trainings/sessions/${sessionId}/next-question`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .expect(200);

    const question = nextQuestion.body.data.item as {
      id: string;
      questionType: "single_choice" | "multi_choice" | "open_text";
      choices: Array<{ id: string }>;
    } | null;
    expect(question).not.toBeNull();
    if (question?.questionType !== "open_text") {
      expect(question?.choices.length).toBeGreaterThan(0);
    }

    const answerPayload: {
      questionId: string;
      selectedChoiceId?: string;
      selectedChoiceIds?: string[];
      openTextAnswer?: string;
      responseTimeMs: number;
    } = {
      questionId: question?.id as string,
      responseTimeMs: 1200
    };

    if (question?.questionType === "open_text") {
      answerPayload.openTextAnswer = "Atp";
    } else if (question?.questionType === "multi_choice") {
      const correctChoices = await db.query<{ id: string }>(
        `
          SELECT id
          FROM question_choices
          WHERE question_id = $1
            AND is_correct = TRUE
          ORDER BY position ASC
        `,
        [question.id]
      );
      expect(correctChoices.rowCount).toBeGreaterThan(0);
      answerPayload.selectedChoiceIds = correctChoices.rows.map((row) => row.id);
    } else {
      answerPayload.selectedChoiceId = question?.choices[0].id;
    }

    await request(app.getHttpServer())
      .post(`/v1/trainings/sessions/${sessionId}/answers`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send(answerPayload)
      .expect(201);

    const session = await request(app.getHttpServer())
      .get(`/v1/trainings/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .expect(200);
    expect(session.body.data.progress.attempts).toBe(1);

    const dashboard = await request(app.getHttpServer())
      .get("/v1/trainings/dashboard")
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .expect(200);
    expect(dashboard.body.data.overview.attemptsCount).toBe(1);
    expect(dashboard.body.data.overview.correctCount).toBe(1);
    expect(typeof dashboard.body.data.overview.chapterCoveragePct).toBe("number");
    expect(["learning", "discovery", "review", "par_coeur", "rattrapage"]).toContain(
      dashboard.body.data.overview.suggestedMode
    );
    const dashboardSubject = (
      dashboard.body.data.subjects as Array<{
        id: string;
        declaredProgressPct: number;
        momentumLabel: string;
      }>
    ).find((item) => item.id === subjectId);
    expect(dashboardSubject).toBeDefined();
    expect(typeof dashboardSubject?.momentumLabel).toBe("string");
    expect((dashboard.body.data.suggestedActions as unknown[]).length).toBeGreaterThan(0);

    const chaptersAfter = await request(app.getHttpServer())
      .get(`/v1/trainings/state/subjects/${subjectId}/chapters`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .expect(200);
    const updated = (chaptersAfter.body.data.items as Array<{ id: string; declaredProgressPct: number }>).find(
      (item) => item.id === chapterId
    );
    expect(updated?.declaredProgressPct).toBe(35);
  });

  it("rejects training answers outside session filters", async () => {
    const trainee = await registerUser("Training Scope Guard");
    const subjects = await db.query<{ id: string }>(
      `
        SELECT id
        FROM subjects
        ORDER BY sort_order ASC
        LIMIT 2
      `
    );
    expect(subjects.rows).toHaveLength(2);

    const allowedSubjectId = subjects.rows[0].id;
    const blockedSubjectId = subjects.rows[1].id;

    const blockedQuestion = await db.query<{ question_id: string; choice_id: string }>(
      `
        SELECT
          q.id AS question_id,
          qc.id AS choice_id
        FROM questions q
        JOIN question_choices qc
          ON qc.question_id = q.id
         AND qc.position = 1
        WHERE q.subject_id = $1
          AND q.status = 'published'
          AND q.question_type = 'single_choice'
        ORDER BY q.created_at ASC
        LIMIT 1
      `,
      [blockedSubjectId]
    );
    expect(blockedQuestion.rowCount).toBe(1);

    const created = await request(app.getHttpServer())
      .post("/v1/trainings/sessions")
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        mode: "learning",
        stopRule: "fixed_custom",
        targetQuestionCount: 1,
        subjectIds: [allowedSubjectId]
      })
      .expect(201);
    const sessionId = created.body.data.id as string;

    const rejected = await request(app.getHttpServer())
      .post(`/v1/trainings/sessions/${sessionId}/answers`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        questionId: blockedQuestion.rows[0].question_id,
        selectedChoiceId: blockedQuestion.rows[0].choice_id,
        responseTimeMs: 900
      })
      .expect(422);

    expect(rejected.body.error.code).toBe("QUESTION_NOT_ELIGIBLE_FOR_SESSION");
  });

  it("scores multi_choice training answers with exact-match rule", async () => {
    const trainee = await registerUser("Training Multi Choice");

    const multiQuestion = await db.query<{
      subject_id: string;
      question_id: string;
      correct_choice_ids: string[];
      incorrect_choice_id: string;
    }>(
      `
        SELECT
          q.subject_id,
          q.id AS question_id,
          ARRAY(
            SELECT qc.id
            FROM question_choices qc
            WHERE qc.question_id = q.id
              AND qc.is_correct = TRUE
            ORDER BY qc.position ASC
          ) AS correct_choice_ids,
          (
            SELECT qc.id
            FROM question_choices qc
            WHERE qc.question_id = q.id
              AND qc.is_correct = FALSE
            ORDER BY qc.position ASC
            LIMIT 1
          ) AS incorrect_choice_id
        FROM questions q
        WHERE q.question_type = 'multi_choice'
          AND q.status = 'published'
        ORDER BY q.created_at ASC
        LIMIT 1
      `
    );
    expect(multiQuestion.rowCount).toBe(1);
    const question = multiQuestion.rows[0];
    expect(question.correct_choice_ids.length).toBeGreaterThan(1);

    const correctSession = await request(app.getHttpServer())
      .post("/v1/trainings/sessions")
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        mode: "learning",
        stopRule: "fixed_custom",
        targetQuestionCount: 1,
        subjectIds: [question.subject_id]
      })
      .expect(201);

    const correctAnswer = await request(app.getHttpServer())
      .post(`/v1/trainings/sessions/${correctSession.body.data.id as string}/answers`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        questionId: question.question_id,
        selectedChoiceIds: question.correct_choice_ids,
        responseTimeMs: 850
      })
      .expect(201);
    expect(correctAnswer.body.data.isCorrect).toBe(true);

    const wrongSession = await request(app.getHttpServer())
      .post("/v1/trainings/sessions")
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        mode: "learning",
        stopRule: "fixed_custom",
        targetQuestionCount: 1,
        subjectIds: [question.subject_id]
      })
      .expect(201);

    const wrongAnswer = await request(app.getHttpServer())
      .post(`/v1/trainings/sessions/${wrongSession.body.data.id as string}/answers`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        questionId: question.question_id,
        selectedChoiceIds: [question.correct_choice_ids[0], question.incorrect_choice_id],
        responseTimeMs: 900
      })
      .expect(201);
    expect(wrongAnswer.body.data.isCorrect).toBe(false);
  });

  it("scores open_text training answers with normalized exact match", async () => {
    const trainee = await registerUser("Training Open Text");

    const openQuestion = await db.query<{
      subject_id: string;
      question_id: string;
      accepted_answer_text: string;
    }>(
      `
        SELECT
          q.subject_id,
          q.id AS question_id,
          qota.accepted_answer_text
        FROM questions q
        JOIN question_open_text_answers qota
          ON qota.question_id = q.id
        WHERE q.question_type = 'open_text'
          AND q.status = 'published'
        ORDER BY q.created_at ASC, qota.created_at ASC
        LIMIT 1
      `
    );
    expect(openQuestion.rowCount).toBe(1);
    const question = openQuestion.rows[0];

    const correctSession = await request(app.getHttpServer())
      .post("/v1/trainings/sessions")
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        mode: "learning",
        stopRule: "fixed_custom",
        targetQuestionCount: 1,
        subjectIds: [question.subject_id]
      })
      .expect(201);

    const variantAnswer = `  ${question.accepted_answer_text.toUpperCase()} !!! `;
    const correctAnswer = await request(app.getHttpServer())
      .post(`/v1/trainings/sessions/${correctSession.body.data.id as string}/answers`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        questionId: question.question_id,
        openTextAnswer: variantAnswer,
        responseTimeMs: 780
      })
      .expect(201);
    expect(correctAnswer.body.data.isCorrect).toBe(true);
    expect(correctAnswer.body.data.correction).toBeTruthy();
    expect(correctAnswer.body.data.correction.questionType).toBe("open_text");
    expect(correctAnswer.body.data.correction.evaluationRule).toBe("normalized_exact_match");
    expect(correctAnswer.body.data.correction.submittedAnswer).toBe(variantAnswer.replace(/\s+/g, " ").trim());
    expect(correctAnswer.body.data.correction.expectedAnswers).toContain(question.accepted_answer_text);

    const wrongSession = await request(app.getHttpServer())
      .post("/v1/trainings/sessions")
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        mode: "learning",
        stopRule: "fixed_custom",
        targetQuestionCount: 1,
        subjectIds: [question.subject_id]
      })
      .expect(201);

    const wrongAnswer = await request(app.getHttpServer())
      .post(`/v1/trainings/sessions/${wrongSession.body.data.id as string}/answers`)
      .set("Authorization", `Bearer ${trainee.accessToken}`)
      .send({
        questionId: question.question_id,
        openTextAnswer: "réponse totalement fausse",
        responseTimeMs: 810
      })
      .expect(201);
    expect(wrongAnswer.body.data.isCorrect).toBe(false);
    expect(wrongAnswer.body.data.correction.questionType).toBe("open_text");
    expect((wrongAnswer.body.data.correction.expectedAnswers as unknown[]).length).toBeGreaterThan(0);
  });

  it("manages open_text accepted answers with ownership checks and constraints", async () => {
    const owner = await registerUser("Open Text Owner");
    const outsider = await registerUser("Open Text Outsider");

    const chapterRow = await db.query<{ subject_id: string; chapter_id: string }>(
      `
        SELECT c.subject_id, c.id AS chapter_id
        FROM chapters c
        JOIN subjects s
          ON s.id = c.subject_id
        WHERE c.is_active = TRUE
          AND s.is_active = TRUE
        ORDER BY s.sort_order ASC, c.sort_order ASC
        LIMIT 1
      `
    );
    expect(chapterRow.rowCount).toBe(1);

    const questionId = randomUUID();
    await db.query(
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
            published_at,
            created_by_user_id
          )
        VALUES
          ($1, $2, $3, 'open_text', $4, $5, 2, 'published', NOW(), $6)
      `,
      [
        questionId,
        chapterRow.rows[0].subject_id,
        chapterRow.rows[0].chapter_id,
        "Nommer la molécule énergétique principale",
        "La molécule énergétique principale est ATP.",
        owner.userId
      ]
    );

    const answer1Id = randomUUID();
    const answer2Id = randomUUID();
    await db.query(
      `
        INSERT INTO question_open_text_answers
          (id, question_id, accepted_answer_text, normalized_answer_text)
        VALUES
          ($1, $2, $3, $4),
          ($5, $2, $6, $7)
      `,
      [answer1Id, questionId, "ATP", "atp", answer2Id, "Adenosine triphosphate", "adenosine triphosphate"]
    );

    const outsiderList = await request(app.getHttpServer())
      .get(`/v1/trainings/admin/open-text/questions/${questionId}/accepted-answers`)
      .set("Authorization", `Bearer ${outsider.accessToken}`)
      .expect(403);
    expect(outsiderList.body.error.code).toBe("OPEN_TEXT_EDITOR_FORBIDDEN");

    const ownerList = await request(app.getHttpServer())
      .get(`/v1/trainings/admin/open-text/questions/${questionId}/accepted-answers`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect((ownerList.body.data.items as unknown[]).length).toBe(2);

    const duplicateAnswer = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/open-text/questions/${questionId}/accepted-answers`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ acceptedAnswerText: "  aTp !!! " })
      .expect(409);
    expect(duplicateAnswer.body.error.code).toBe("OPEN_TEXT_ACCEPTED_ANSWER_EXISTS");

    const createdAnswer = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/open-text/questions/${questionId}/accepted-answers`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ acceptedAnswerText: "Molécule énergétique" })
      .expect(201);
    const createdAnswerId = createdAnswer.body.data.id as string;
    expect(createdAnswer.body.data.normalizedAnswerText).toBe("molecule energetique");

    await request(app.getHttpServer())
      .delete(`/v1/trainings/admin/open-text/questions/${questionId}/accepted-answers/${createdAnswerId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/v1/trainings/admin/open-text/questions/${questionId}/accepted-answers/${answer1Id}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);

    const deleteLast = await request(app.getHttpServer())
      .delete(`/v1/trainings/admin/open-text/questions/${questionId}/accepted-answers/${answer2Id}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(422);
    expect(deleteLast.body.error.code).toBe("OPEN_TEXT_MIN_ANSWERS_REQUIRED");
  });

  it("creates, updates and publishes admin training question with ownership guard", async () => {
    const owner = await registerUser("Content Owner");
    const outsider = await registerUser("Content Outsider");

    const chapterRow = await db.query<{ subject_id: string; chapter_id: string }>(
      `
        SELECT c.subject_id, c.id AS chapter_id
        FROM chapters c
        JOIN subjects s
          ON s.id = c.subject_id
        WHERE c.is_active = TRUE
          AND s.is_active = TRUE
        ORDER BY s.sort_order ASC, c.sort_order ASC
        LIMIT 1
      `
    );
    expect(chapterRow.rowCount).toBe(1);
    const subjectId = chapterRow.rows[0].subject_id;
    const chapterId = chapterRow.rows[0].chapter_id;

    const createQuestion = await request(app.getHttpServer())
      .post("/v1/trainings/admin/questions")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: "Quelle molécule transporte principalement l'oxygène dans le sang humain ?",
        explanation: "L'hémoglobine des globules rouges transporte l'oxygène.",
        difficulty: 2,
        publishNow: false,
        choices: [
          { label: "Hémoglobine", isCorrect: true },
          { label: "Albumine", isCorrect: false },
          { label: "Fibrinogène", isCorrect: false },
          { label: "Transferrine", isCorrect: false }
        ]
      })
      .expect(201);
    const questionId = createQuestion.body.data.id as string;
    expect(createQuestion.body.data.status).toBe("draft");
    expect((createQuestion.body.data.choices as unknown[]).length).toBe(4);

    await request(app.getHttpServer())
      .get(`/v1/trainings/admin/questions/${questionId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);

    const outsiderUpdate = await request(app.getHttpServer())
      .put(`/v1/trainings/admin/questions/${questionId}`)
      .set("Authorization", `Bearer ${outsider.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: "Prompt outsider",
        explanation: "Explication outsider",
        difficulty: 2,
        choices: [
          { label: "A", isCorrect: true },
          { label: "B", isCorrect: false },
          { label: "C", isCorrect: false },
          { label: "D", isCorrect: false }
        ]
      })
      .expect(403);
    expect(outsiderUpdate.body.error.code).toBe("TRAINING_CONTENT_EDITOR_FORBIDDEN");

    const updated = await request(app.getHttpServer())
      .put(`/v1/trainings/admin/questions/${questionId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: "Quelle protéine transporte principalement l'oxygène dans le sang ? (version mise à jour)",
        explanation: "L'hémoglobine fixe l'oxygène et assure son transport sanguin.",
        difficulty: 3,
        choices: [
          { label: "Hémoglobine", isCorrect: true },
          { label: "Albumine", isCorrect: false },
          { label: "Myoglobine", isCorrect: false },
          { label: "Ferritine", isCorrect: false }
        ]
      })
      .expect(200);
    expect(updated.body.data.prompt).toContain("mise à jour");

    const published = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/questions/${questionId}/publish`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(published.body.data.status).toBe("published");
    expect(published.body.data.publishedAt).toBeTruthy();

    const publishedChoices = published.body.data.choices as Array<{
      id: string;
      isCorrect: boolean;
    }>;
    const correctChoiceId = publishedChoices.find((choice) => choice.isCorrect)?.id;
    expect(correctChoiceId).toBeDefined();

    const createdSession = await request(app.getHttpServer())
      .post("/v1/trainings/sessions")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        mode: "learning",
        stopRule: "fixed_custom",
        targetQuestionCount: 1,
        subjectIds: [subjectId],
        chapterIds: [chapterId]
      })
      .expect(201);
    const sessionId = createdSession.body.data.id as string;

    const answer = await request(app.getHttpServer())
      .post(`/v1/trainings/sessions/${sessionId}/answers`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        questionId,
        selectedChoiceId: correctChoiceId,
        responseTimeMs: 640
      })
      .expect(201);
    expect(answer.body.data.isCorrect).toBe(true);
  });

  it("plays a full duel (5 rounds) to completion", async () => {
    const player1 = await registerUser("Duel Player 1");
    const player2 = await registerUser("Duel Player 2");
    const duelId = await startInProgressDuel(player1, player2);

    let duel = await getDuel(player1, duelId);
    let turnSafety = 0;
    while (duel.status !== "completed" && turnSafety < 20) {
      const actor = duel.currentTurnUserId === player1.userId ? player1 : player2;
      await playCurrentTurn(duelId, actor);
      duel = await getDuel(player1, duelId);
      turnSafety += 1;
    }

    expect(turnSafety).toBeLessThan(20);
    expect(duel.status).toBe("completed");
    expect(duel.completedAt).not.toBeNull();
    expect(duel.rounds).toHaveLength(5);
    expect(duel.rounds.every((round) => round.status === "completed")).toBe(true);
    expect(["score", "tie_break_speed"]).toContain(duel.winReason);
  });

  it("handles joker request/grant and enforces one joker per player", async () => {
    const player1 = await registerUser("Joker Player 1");
    const player2 = await registerUser("Joker Player 2");
    const duelId = await startInProgressDuel(player1, player2);

    const before = await getDuel(player1, duelId);
    const beforeDeadline = new Date(before.turnDeadlineAt as string).getTime();

    const requestJoker = await request(app.getHttpServer())
      .post(`/v1/duels/${duelId}/jokers/request`)
      .set("Authorization", `Bearer ${player1.accessToken}`)
      .send({ reason: "retard train" })
      .expect(201);

    const jokerId = requestJoker.body.data.jokerId as string;
    expect(requestJoker.body.data.status).toBe("pending");

    await request(app.getHttpServer())
      .post(`/v1/duels/${duelId}/jokers/${jokerId}/respond`)
      .set("Authorization", `Bearer ${player2.accessToken}`)
      .send({ decision: "grant" })
      .expect(201);

    const after = await getDuel(player1, duelId);
    const afterDeadline = new Date(after.turnDeadlineAt as string).getTime();
    expect(afterDeadline).toBeGreaterThan(beforeDeadline);

    const secondJoker = await request(app.getHttpServer())
      .post(`/v1/duels/${duelId}/jokers/request`)
      .set("Authorization", `Bearer ${player1.accessToken}`)
      .send({ reason: "second try" })
      .expect(422);

    expect(secondJoker.body.error.code).toBe("DUEL_JOKER_ALREADY_USED");
  });

  it("expires due turns through worker service and gives hand to opponent", async () => {
    const player1 = await registerUser("Timeout Player 1");
    const player2 = await registerUser("Timeout Player 2");
    const duelId = await startInProgressDuel(player1, player2);

    await db.query(
      `
        UPDATE duels
        SET turn_deadline_at = NOW() - INTERVAL '2 minutes'
        WHERE id = $1
      `,
      [duelId]
    );

    const result = await duelsService.expireDueTurns(10);
    expect(result.processed).toBeGreaterThanOrEqual(1);

    const duel = await getDuel(player1, duelId);
    expect(duel.status).toBe("in_progress");
    expect(duel.currentTurnUserId).toBe(player2.userId);
  });

  it("serializes concurrent answers on same slot (one success, one business error)", async () => {
    const player1 = await registerUser("Race Player 1");
    const player2 = await registerUser("Race Player 2");
    const duelId = await startInProgressDuel(player1, player2);

    const round = await getCurrentRound(player1, duelId);
    await chooseSubjectIfNeeded(player1, duelId, round);
    const questions = await getRoundQuestions(player1, duelId, round.roundNo);
    const firstSlot = questions[0];

    const payload = {
      slotNo: firstSlot.slotNo,
      questionId: firstSlot.question.id,
      selectedChoiceId: firstSlot.question.choices[0].id,
      responseTimeMs: 1200
    };

    const [resp1, resp2] = await Promise.all([
      request(app.getHttpServer())
        .post(`/v1/duels/${duelId}/rounds/${round.roundNo}/answers`)
        .set("Authorization", `Bearer ${player1.accessToken}`)
        .send(payload),
      request(app.getHttpServer())
        .post(`/v1/duels/${duelId}/rounds/${round.roundNo}/answers`)
        .set("Authorization", `Bearer ${player1.accessToken}`)
        .send(payload)
    ]);

    const statuses = [resp1.status, resp2.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 422]);

    const businessError = resp1.status === 422 ? resp1 : resp2;
    expect(businessError.body.error.code).toBe("DUEL_SLOT_ALREADY_ANSWERED");
  });

  async function registerUser(displayName: string): Promise<TestUserSession> {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const email = `integration-${suffix}@example.com`;
    const response = await request(app.getHttpServer())
      .post("/v1/auth/register")
      .send({
        email,
        password: passwordForTests(),
        displayName
      })
      .expect(201);

    return {
      userId: response.body.data.user.id as string,
      email,
      accessToken: response.body.data.tokens.accessToken as string,
      refreshToken: response.body.data.tokens.refreshToken as string
    };
  }

  async function startInProgressDuel(player1: TestUserSession, player2: TestUserSession): Promise<string> {
    const created = await request(app.getHttpServer())
      .post("/v1/duels")
      .set("Authorization", `Bearer ${player1.accessToken}`)
      .send({
        matchmakingMode: "friend_invite",
        opponentUserId: player2.userId
      })
      .expect(201);
    const duelId = created.body.data.duelId as string;

    await request(app.getHttpServer())
      .post(`/v1/duels/${duelId}/accept`)
      .set("Authorization", `Bearer ${player2.accessToken}`)
      .expect(201);

    const opener = await request(app.getHttpServer())
      .get(`/v1/duels/${duelId}/opener`)
      .set("Authorization", `Bearer ${player1.accessToken}`)
      .expect(200);
    const openerChoiceId = opener.body.data.question.choices[0].id as string;

    await request(app.getHttpServer())
      .post(`/v1/duels/${duelId}/opener/answer`)
      .set("Authorization", `Bearer ${player1.accessToken}`)
      .send({
        selectedChoiceId: openerChoiceId,
        responseTimeMs: 150
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/duels/${duelId}/opener/answer`)
      .set("Authorization", `Bearer ${player2.accessToken}`)
      .send({
        selectedChoiceId: openerChoiceId,
        responseTimeMs: 450
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/duels/${duelId}/opener/decision`)
      .set("Authorization", `Bearer ${player1.accessToken}`)
      .send({
        decision: "take_hand"
      })
      .expect(201);

    return duelId;
  }

  async function playCurrentTurn(duelId: string, actor: TestUserSession): Promise<void> {
    const round = await getCurrentRound(actor, duelId);
    await chooseSubjectIfNeeded(actor, duelId, round);

    const questions = await getRoundQuestions(actor, duelId, round.roundNo);
    for (const item of questions) {
      await request(app.getHttpServer())
        .post(`/v1/duels/${duelId}/rounds/${round.roundNo}/answers`)
        .set("Authorization", `Bearer ${actor.accessToken}`)
        .send({
          slotNo: item.slotNo,
          questionId: item.question.id,
          selectedChoiceId: item.question.choices[0].id,
          responseTimeMs: 1000 + item.slotNo
        })
        .expect(201);
    }
  }

  async function chooseSubjectIfNeeded(
    actor: TestUserSession,
    duelId: string,
    round: CurrentRoundView
  ): Promise<void> {
    if (round.chosenSubjectId) {
      return;
    }

    await request(app.getHttpServer())
      .post(`/v1/duels/${duelId}/rounds/${round.roundNo}/choose-subject`)
      .set("Authorization", `Bearer ${actor.accessToken}`)
      .send({
        subjectId: round.offeredSubjects[0].id
      })
      .expect(201);
  }

  async function getDuel(user: TestUserSession, duelId: string): Promise<DuelView> {
    const response = await request(app.getHttpServer())
      .get(`/v1/duels/${duelId}`)
      .set("Authorization", `Bearer ${user.accessToken}`)
      .expect(200);
    return response.body.data as DuelView;
  }

  async function getCurrentRound(user: TestUserSession, duelId: string): Promise<CurrentRoundView> {
    const response = await request(app.getHttpServer())
      .get(`/v1/duels/${duelId}/rounds/current`)
      .set("Authorization", `Bearer ${user.accessToken}`)
      .expect(200);
    return response.body.data as CurrentRoundView;
  }

  async function getRoundQuestions(
    user: TestUserSession,
    duelId: string,
    roundNo: number
  ): Promise<DuelQuestionItem[]> {
    const response = await request(app.getHttpServer())
      .get(`/v1/duels/${duelId}/rounds/${roundNo}/questions`)
      .set("Authorization", `Bearer ${user.accessToken}`)
      .expect(200);
    return response.body.data.items as DuelQuestionItem[];
  }
});

function passwordForTests(): string {
  return "Password12345!";
}
