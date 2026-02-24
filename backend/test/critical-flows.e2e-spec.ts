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

  it("updates me profile and customization with strict validation", async () => {
    const user = await registerUser("Me Profile Runner");

    const meBefore = await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .expect(200);
    expect(meBefore.body.data.displayName).toBe("Me Profile Runner");
    expect(meBefore.body.data.subscription.plan).toBe("free");
    expect(meBefore.body.data.subscription.status).toBe("active");

    const emptyProfilePatch = await request(app.getHttpServer())
      .patch("/v1/me/profile")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({})
      .expect(400);
    expect(emptyProfilePatch.body.error.code).toBe("VALIDATION_ERROR");

    const profilePatched = await request(app.getHttpServer())
      .patch("/v1/me/profile")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({
        displayName: "  Me Runner Prime  ",
        studyTrack: "  PASS/LAS  ",
        yearLabel: "  DFGSM2  ",
        uxTone: "  positive  "
      })
      .expect(200);
    expect(profilePatched.body.data.displayName).toBe("Me Runner Prime");
    expect(profilePatched.body.data.studyTrack).toBe("PASS/LAS");
    expect(profilePatched.body.data.yearLabel).toBe("DFGSM2");
    expect(profilePatched.body.data.uxTone).toBe("positive");

    const customPatched = await request(app.getHttpServer())
      .patch("/v1/me/profile/customization")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({
        publicAlias: "  QuizMaster  ",
        profileColor: "  #1E90FF  ",
        bio: "  Revision every day  ",
        visibility: "public"
      })
      .expect(200);
    expect(customPatched.body.data.publicAlias).toBe("QuizMaster");
    expect(customPatched.body.data.profileColor).toBe("#1E90FF");
    expect(customPatched.body.data.bio).toBe("Revision every day");
    expect(customPatched.body.data.visibility).toBe("public");

    const clearCustomFields = await request(app.getHttpServer())
      .patch("/v1/me/profile/customization")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({
        publicAlias: "   ",
        bio: "   "
      })
      .expect(200);
    expect(clearCustomFields.body.data.publicAlias).toBeNull();
    expect(clearCustomFields.body.data.bio).toBeNull();

    const invalidName = await request(app.getHttpServer())
      .patch("/v1/me/profile")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({
        displayName: "  "
      })
      .expect(400);
    expect(invalidName.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("exposes avatar progression, inventory, equipment and specialty stage gate", async () => {
    const player = await registerUser("Avatar Player");

    const stages = await request(app.getHttpServer())
      .get("/v1/avatar/stages")
      .set("Authorization", `Bearer ${player.accessToken}`)
      .expect(200);
    expect((stages.body.data.items as unknown[]).length).toBeGreaterThan(0);

    const specialties = await request(app.getHttpServer())
      .get("/v1/avatar/specialties")
      .set("Authorization", `Bearer ${player.accessToken}`)
      .expect(200);
    expect((specialties.body.data.items as unknown[]).length).toBeGreaterThan(0);

    const avatarBefore = await request(app.getHttpServer())
      .get("/v1/me/avatar")
      .set("Authorization", `Bearer ${player.accessToken}`)
      .expect(200);
    expect(avatarBefore.body.data.currentStage.code).toBe("pass_las");
    expect(avatarBefore.body.data.inventorySummary.totalOwned).toBeGreaterThan(0);

    const inventory = await request(app.getHttpServer())
      .get("/v1/me/avatar/inventory")
      .set("Authorization", `Bearer ${player.accessToken}`)
      .expect(200);
    const inventoryItems = inventory.body.data.items as Array<{
      id: string;
      itemType: "object" | "pose" | "outfit" | "background";
    }>;
    expect(inventoryItems.length).toBeGreaterThan(0);
    const firstItem = inventoryItems[0];

    await request(app.getHttpServer())
      .post("/v1/me/avatar/equipment")
      .set("Authorization", `Bearer ${player.accessToken}`)
      .send({
        itemType: firstItem.itemType,
        itemId: firstItem.id
      })
      .expect(201);

    const avatarAfterEquip = await request(app.getHttpServer())
      .get("/v1/me/avatar")
      .set("Authorization", `Bearer ${player.accessToken}`)
      .expect(200);
    expect(avatarAfterEquip.body.data.equipment[firstItem.itemType].id).toBe(firstItem.id);

    const specialtyId = (specialties.body.data.items as Array<{ id: string }>)[0].id;
    const specialtyLocked = await request(app.getHttpServer())
      .post("/v1/me/avatar/specialty")
      .set("Authorization", `Bearer ${player.accessToken}`)
      .send({ specialtyId })
      .expect(422);
    expect(specialtyLocked.body.error.code).toBe("AVATAR_SPECIALTY_STAGE_LOCKED");

    await db.query(
      `
        UPDATE user_avatar_progress
        SET current_stage_id = (
          SELECT id
          FROM avatar_stages
          WHERE code = 'interne'
          LIMIT 1
        )
        WHERE user_id = $1
      `,
      [player.userId]
    );

    const specialtySet = await request(app.getHttpServer())
      .post("/v1/me/avatar/specialty")
      .set("Authorization", `Bearer ${player.accessToken}`)
      .send({ specialtyId })
      .expect(201);
    expect(specialtySet.body.data.specialty.id).toBe(specialtyId);

    const avatarAfterSpecialty = await request(app.getHttpServer())
      .get("/v1/me/avatar")
      .set("Authorization", `Bearer ${player.accessToken}`)
      .expect(200);
    expect(avatarAfterSpecialty.body.data.specialty.id).toBe(specialtyId);
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

  it("lists and retires admin training questions with proper access control", async () => {
    const owner = await registerUser("Content Retire Owner");
    const outsider = await registerUser("Content Retire Outsider");

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

    const created = await request(app.getHttpServer())
      .post("/v1/trainings/admin/questions")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: "Quelle cellule sanguine transporte majoritairement l'oxygène ?",
        explanation: "Le globule rouge transporte l'oxygène grâce à l'hémoglobine.",
        difficulty: 2,
        publishNow: true,
        choices: [
          { label: "Globule rouge", isCorrect: true },
          { label: "Plaquette", isCorrect: false },
          { label: "Lymphocyte", isCorrect: false },
          { label: "Neutrophile", isCorrect: false }
        ]
      })
      .expect(201);
    const questionId = created.body.data.id as string;
    expect(created.body.data.status).toBe("published");

    const ownerList = await request(app.getHttpServer())
      .get("/v1/trainings/admin/questions")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(
      (ownerList.body.data.items as Array<{ id: string }>).some((item) => item.id === questionId)
    ).toBe(true);

    const outsiderListAll = await request(app.getHttpServer())
      .get("/v1/trainings/admin/questions?createdBy=all")
      .set("Authorization", `Bearer ${outsider.accessToken}`)
      .expect(403);
    expect(outsiderListAll.body.error.code).toBe("TRAINING_CONTENT_EDITOR_FORBIDDEN");

    const outsiderRetire = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/questions/${questionId}/retire`)
      .set("Authorization", `Bearer ${outsider.accessToken}`)
      .expect(403);
    expect(outsiderRetire.body.error.code).toBe("TRAINING_CONTENT_EDITOR_FORBIDDEN");

    const retired = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/questions/${questionId}/retire`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(retired.body.data.status).toBe("retired");
    expect(retired.body.data.retiredAt).toBeTruthy();

    const republishRetired = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/questions/${questionId}/publish`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(422);
    expect(republishRetired.body.error.code).toBe("QUESTION_ALREADY_RETIRED");

    const retiredList = await request(app.getHttpServer())
      .get("/v1/trainings/admin/questions?status=retired")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(
      (retiredList.body.data.items as Array<{ id: string }>).some((item) => item.id === questionId)
    ).toBe(true);

    const trainingSession = await request(app.getHttpServer())
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
    const sessionId = trainingSession.body.data.id as string;

    const answerRetired = await request(app.getHttpServer())
      .post(`/v1/trainings/sessions/${sessionId}/answers`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        questionId,
        selectedChoiceId:
          ((retired.body.data.choices as Array<{ id: string; isCorrect: boolean }>).find((item) => item.isCorrect)
            ?.id as string) ?? randomUUID(),
        responseTimeMs: 700
      })
      .expect(404);
    expect(answerRetired.body.error.code).toBe("QUESTION_NOT_FOUND");
  });

  it("runs question submission workflow (submit, reject, approve)", async () => {
    const proposer = await registerUser("Submission Proposer");
    const reviewer = await registerUser("Submission Reviewer");

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

    const firstSubmission = await request(app.getHttpServer())
      .post("/v1/trainings/submissions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: "Quelle cellule produit principalement les anticorps ?",
        explanation: "Les plasmocytes dérivés des lymphocytes B produisent les anticorps.",
        difficulty: 3,
        choices: [
          { label: "Plasmocyte", isCorrect: true },
          { label: "Neutrophile", isCorrect: false },
          { label: "Hématie", isCorrect: false },
          { label: "Plaquette", isCorrect: false }
        ]
      })
      .expect(201);
    const firstSubmissionId = firstSubmission.body.data.id as string;
    expect(firstSubmission.body.data.status).toBe("pending");

    await request(app.getHttpServer())
      .get(`/v1/trainings/submissions/${firstSubmissionId}`)
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .expect(200);

    const selfReview = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${firstSubmissionId}/review`)
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({ decision: "reject", reviewNote: "auto review forbidden" })
      .expect(403);
    expect(selfReview.body.error.code).toBe("SUBMISSION_SELF_REVIEW_FORBIDDEN");

    const rejectWithoutNote = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${firstSubmissionId}/review`)
      .set("Authorization", `Bearer ${reviewer.accessToken}`)
      .send({ decision: "reject" })
      .expect(400);
    expect(rejectWithoutNote.body.error.code).toBe("VALIDATION_ERROR");

    const rejected = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${firstSubmissionId}/review`)
      .set("Authorization", `Bearer ${reviewer.accessToken}`)
      .send({ decision: "reject", reviewNote: "Proposition trop imprécise" })
      .expect(201);
    expect(rejected.body.data.status).toBe("rejected");
    expect(rejected.body.data.reviewNote).toContain("imprécise");

    const secondSubmission = await request(app.getHttpServer())
      .post("/v1/trainings/submissions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "open_text",
        prompt: "Quelle est la principale molécule énergétique immédiate de la cellule ?",
        explanation: "L'ATP est la principale molécule énergétique immédiate.",
        difficulty: 2,
        acceptedAnswers: ["ATP", "Adénosine triphosphate"]
      })
      .expect(201);
    const secondSubmissionId = secondSubmission.body.data.id as string;

    const approved = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${secondSubmissionId}/review`)
      .set("Authorization", `Bearer ${reviewer.accessToken}`)
      .send({ decision: "approve", reviewNote: "Valide pour publication" })
      .expect(201);
    expect(approved.body.data.status).toBe("approved");
    const publishedQuestionId = approved.body.data.publishedQuestionId as string;
    expect(publishedQuestionId).toBeTruthy();

    const approvedList = await request(app.getHttpServer())
      .get("/v1/trainings/submissions?status=approved&createdBy=all")
      .set("Authorization", `Bearer ${reviewer.accessToken}`)
      .expect(200);
    expect(
      (approvedList.body.data.items as Array<{ id: string }>).some((item) => item.id === secondSubmissionId)
    ).toBe(true);

    const trainingSession = await request(app.getHttpServer())
      .post("/v1/trainings/sessions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        mode: "learning",
        stopRule: "fixed_custom",
        targetQuestionCount: 1,
        subjectIds: [subjectId],
        chapterIds: [chapterId]
      })
      .expect(201);

    const answer = await request(app.getHttpServer())
      .post(`/v1/trainings/sessions/${trainingSession.body.data.id as string}/answers`)
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        questionId: publishedQuestionId,
        openTextAnswer: " atp ",
        responseTimeMs: 720
      })
      .expect(201);
    expect(answer.body.data.isCorrect).toBe(true);
  });

  it("builds a prioritized review queue with duplicate detection hints", async () => {
    const proposer = await registerUser("Queue Proposer");
    const reviewer = await registerUser("Queue Reviewer");

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

    const basePrompt = "Quel nerf innerve principalement le diaphragme ?";
    await request(app.getHttpServer())
      .post("/v1/trainings/admin/questions")
      .set("Authorization", `Bearer ${reviewer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: basePrompt,
        explanation: "Le nerf phrénique innerve principalement le diaphragme.",
        difficulty: 2,
        publishNow: true,
        choices: [
          { label: "Nerf phrénique", isCorrect: true },
          { label: "Nerf vague", isCorrect: false },
          { label: "Nerf radial", isCorrect: false },
          { label: "Nerf ulnaire", isCorrect: false }
        ]
      })
      .expect(201);

    const submission = await request(app.getHttpServer())
      .post("/v1/trainings/submissions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: basePrompt,
        explanation: "Le nerf phrénique est le principal nerf moteur du diaphragme.",
        difficulty: 2,
        choices: [
          { label: "Nerf phrénique", isCorrect: true },
          { label: "Nerf médian", isCorrect: false },
          { label: "Nerf sciatique", isCorrect: false },
          { label: "Nerf fémoral", isCorrect: false }
        ]
      })
      .expect(201);
    const submissionId = submission.body.data.id as string;

    const queue = await request(app.getHttpServer())
      .get("/v1/trainings/admin/submissions/review-queue?limit=10")
      .set("Authorization", `Bearer ${reviewer.accessToken}`)
      .expect(200);

    const item = (queue.body.data.items as Array<{
      id: string;
      qualityScore: number;
      queueScore: number;
      flags: string[];
      duplicateCandidates: Array<{ sourceType: string; similarityScore: number }>;
    }>).find((entry) => entry.id === submissionId);
    expect(item).toBeDefined();
    expect(item?.qualityScore).toBeGreaterThanOrEqual(0);
    expect(item?.queueScore).toBeGreaterThanOrEqual(0);
    expect(item?.flags).toContain("potential_duplicate");
    expect((item?.duplicateCandidates.length ?? 0)).toBeGreaterThan(0);
    expect(item?.duplicateCandidates[0].sourceType).toBe("question");
    expect(item?.duplicateCandidates[0].similarityScore).toBeGreaterThanOrEqual(0.9);
  });

  it("exposes submission review dashboard with SLA and backlog distributions", async () => {
    const proposer = await registerUser("Dashboard Proposer");
    const reviewer = await registerUser("Dashboard Reviewer");

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

    const oldPending = await request(app.getHttpServer())
      .post("/v1/trainings/submissions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: "Quel organe assure principalement la filtration du sang ?",
        explanation: "Le rein filtre le sang et participe à l'homéostasie.",
        difficulty: 2,
        choices: [
          { label: "Rein", isCorrect: true },
          { label: "Foie", isCorrect: false },
          { label: "Poumon", isCorrect: false },
          { label: "Pancréas", isCorrect: false }
        ]
      })
      .expect(201);
    const oldPendingId = oldPending.body.data.id as string;
    await db.query(
      `
        UPDATE question_submissions
        SET created_at = NOW() - INTERVAL '55 hours'
        WHERE id = $1
      `,
      [oldPendingId]
    );

    const toApprove = await request(app.getHttpServer())
      .post("/v1/trainings/submissions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "open_text",
        prompt: "Quelle est la molécule énergétique immédiate majeure ?",
        explanation: "L'ATP est la molécule énergétique immédiate de référence.",
        difficulty: 2,
        acceptedAnswers: ["ATP", "Adénosine triphosphate"]
      })
      .expect(201);
    const toApproveId = toApprove.body.data.id as string;

    const toReject = await request(app.getHttpServer())
      .post("/v1/trainings/submissions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: "Question volontairement faible pour test dashboard",
        explanation: "Explication volontairement insuffisante.",
        difficulty: 1,
        choices: [
          { label: "Option A", isCorrect: true },
          { label: "Option B", isCorrect: false },
          { label: "Option C", isCorrect: false },
          { label: "Option D", isCorrect: false }
        ]
      })
      .expect(201);
    const toRejectId = toReject.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${toApproveId}/review`)
      .set("Authorization", `Bearer ${reviewer.accessToken}`)
      .send({ decision: "approve", reviewNote: "Valide pour publication" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${toRejectId}/review`)
      .set("Authorization", `Bearer ${reviewer.accessToken}`)
      .send({ decision: "reject", reviewNote: "Insuffisamment précis" })
      .expect(201);

    const dashboard = await request(app.getHttpServer())
      .get("/v1/trainings/admin/submissions/dashboard")
      .set("Authorization", `Bearer ${reviewer.accessToken}`)
      .expect(200);

    expect(dashboard.body.data.sla.targetHours).toBe(48);
    expect(dashboard.body.data.sla.pending.totalCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.data.sla.pending.overSlaCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.data.sla.pending.oldestPendingHours).toBeGreaterThanOrEqual(50);
    expect(dashboard.body.data.sla.reviewLast7d.reviewedCount).toBeGreaterThanOrEqual(2);
    expect(dashboard.body.data.sla.reviewLast7d.approvedCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.data.sla.reviewLast7d.rejectedCount).toBeGreaterThanOrEqual(1);

    const pendingSubject = (dashboard.body.data.pendingBySubject as Array<{ subjectId: string; pendingCount: number }>).find(
      (item) => item.subjectId === subjectId
    );
    expect(pendingSubject).toBeDefined();
    expect((pendingSubject?.pendingCount ?? 0)).toBeGreaterThanOrEqual(1);
    expect((dashboard.body.data.pendingDistribution.byQuestionType as unknown[]).length).toBeGreaterThan(0);
    expect((dashboard.body.data.pendingDistribution.byDifficulty as unknown[]).length).toBeGreaterThan(0);
  });

  it("enforces reviewer claim/release locking for submission moderation", async () => {
    const proposer = await registerUser("Claim Proposer");
    const reviewer1 = await registerUser("Claim Reviewer 1");
    const reviewer2 = await registerUser("Claim Reviewer 2");

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

    const submission = await request(app.getHttpServer())
      .post("/v1/trainings/submissions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "open_text",
        prompt: "Quelle est la principale molécule énergétique immédiate de la cellule ?",
        explanation: "L'ATP est la principale molécule énergétique immédiatement utilisable.",
        difficulty: 2,
        acceptedAnswers: ["ATP", "Adénosine triphosphate"]
      })
      .expect(201);
    const submissionId = submission.body.data.id as string;

    const claimedByReviewer1 = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionId}/claim`)
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(201);
    expect(claimedByReviewer1.body.data.claim.claimedByUserId).toBe(reviewer1.userId);
    expect(claimedByReviewer1.body.data.claim.isActive).toBe(true);

    const claimByReviewer2 = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionId}/claim`)
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .expect(409);
    expect(claimByReviewer2.body.error.code).toBe("SUBMISSION_ALREADY_CLAIMED");

    const releaseByReviewer2 = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionId}/release-claim`)
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .expect(403);
    expect(releaseByReviewer2.body.error.code).toBe("SUBMISSION_CLAIM_FORBIDDEN");

    const releaseByReviewer1 = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionId}/release-claim`)
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(201);
    expect(releaseByReviewer1.body.data.released).toBe(true);

    await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionId}/claim`)
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .expect(201);

    const reviewByReviewer1 = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionId}/review`)
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .send({ decision: "reject", reviewNote: "blocked by claim" })
      .expect(409);
    expect(reviewByReviewer1.body.error.code).toBe("SUBMISSION_ALREADY_CLAIMED");

    const reviewedByReviewer2 = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionId}/review`)
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .send({ decision: "approve", reviewNote: "Reviewed and approved" })
      .expect(201);
    expect(reviewedByReviewer2.body.data.status).toBe("approved");
    expect(reviewedByReviewer2.body.data.claim.isActive).toBe(false);
    expect(reviewedByReviewer2.body.data.claim.claimedByUserId).toBeNull();

    const submissionAfter = await request(app.getHttpServer())
      .get(`/v1/trainings/submissions/${submissionId}`)
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .expect(200);
    expect(submissionAfter.body.data.claim.isActive).toBe(false);
    expect(submissionAfter.body.data.claim.claimedByUserId).toBeNull();
  });

  it("lists reviewer active claims and releases only own claims in bulk", async () => {
    const proposer = await registerUser("Bulk Claim Proposer");
    const reviewer1 = await registerUser("Bulk Claim Reviewer 1");
    const reviewer2 = await registerUser("Bulk Claim Reviewer 2");

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

    const createSubmission = async (prompt: string): Promise<string> => {
      const submission = await request(app.getHttpServer())
        .post("/v1/trainings/submissions")
        .set("Authorization", `Bearer ${proposer.accessToken}`)
        .send({
          subjectId,
          chapterId,
          questionType: "single_choice",
          prompt,
          explanation: "Explication de validation pour le workflow de claim.",
          difficulty: 2,
          choices: [
            { label: "Bonne réponse", isCorrect: true },
            { label: "Distracteur 1", isCorrect: false },
            { label: "Distracteur 2", isCorrect: false },
            { label: "Distracteur 3", isCorrect: false }
          ]
        })
        .expect(201);
      return submission.body.data.id as string;
    };

    const submissionOneId = await createSubmission("Question claim lot A");
    const submissionTwoId = await createSubmission("Question claim lot B");
    const submissionThreeId = await createSubmission("Question claim lot C");

    await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionOneId}/claim`)
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionTwoId}/claim`)
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionThreeId}/claim`)
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .expect(201);

    const reviewer1ClaimsBefore = await request(app.getHttpServer())
      .get("/v1/trainings/admin/submissions/my-claims?limit=10")
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(200);
    const reviewer1ClaimItems = reviewer1ClaimsBefore.body.data.items as Array<{
      submissionId: string;
      claim: { claimedByUserId: string; remainingMinutes: number };
    }>;
    expect(reviewer1ClaimItems).toHaveLength(2);
    expect(reviewer1ClaimItems.map((item) => item.submissionId)).toEqual(
      expect.arrayContaining([submissionOneId, submissionTwoId])
    );
    expect(reviewer1ClaimItems.every((item) => item.claim.claimedByUserId === reviewer1.userId)).toBe(true);
    expect(reviewer1ClaimItems.every((item) => item.claim.remainingMinutes > 0)).toBe(true);

    const reviewer2ClaimsBefore = await request(app.getHttpServer())
      .get("/v1/trainings/admin/submissions/my-claims")
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .expect(200);
    const reviewer2ClaimItemsBefore = reviewer2ClaimsBefore.body.data.items as Array<{ submissionId: string }>;
    expect(reviewer2ClaimItemsBefore).toHaveLength(1);
    expect(reviewer2ClaimItemsBefore[0].submissionId).toBe(submissionThreeId);

    const releaseAllReviewer1 = await request(app.getHttpServer())
      .post("/v1/trainings/admin/submissions/release-all-claims")
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(201);
    expect(releaseAllReviewer1.body.data.releasedCount).toBe(2);
    expect(releaseAllReviewer1.body.data.submissionIds as string[]).toEqual(
      expect.arrayContaining([submissionOneId, submissionTwoId])
    );

    const reviewer1ClaimsAfter = await request(app.getHttpServer())
      .get("/v1/trainings/admin/submissions/my-claims")
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(200);
    expect((reviewer1ClaimsAfter.body.data.items as unknown[]).length).toBe(0);

    const reviewer2ClaimsAfter = await request(app.getHttpServer())
      .get("/v1/trainings/admin/submissions/my-claims")
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .expect(200);
    const reviewer2ClaimItemsAfter = reviewer2ClaimsAfter.body.data.items as Array<{ submissionId: string }>;
    expect(reviewer2ClaimItemsAfter).toHaveLength(1);
    expect(reviewer2ClaimItemsAfter[0].submissionId).toBe(submissionThreeId);

    await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionOneId}/claim`)
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .expect(201);

    const claimStillLockedForReviewer1 = await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${submissionThreeId}/claim`)
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(409);
    expect(claimStillLockedForReviewer1.body.error.code).toBe("SUBMISSION_ALREADY_CLAIMED");
  });

  it("claims next pending submission while skipping active claims from others", async () => {
    const proposer = await registerUser("Next Claim Proposer");
    const reviewer1 = await registerUser("Next Claim Reviewer 1");
    const reviewer2 = await registerUser("Next Claim Reviewer 2");

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

    const first = await request(app.getHttpServer())
      .post("/v1/trainings/submissions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: "Quel organe assure principalement la filtration glomérulaire ?",
        explanation: "Le rein assure la filtration glomérulaire.",
        difficulty: 2,
        choices: [
          { label: "Rein", isCorrect: true },
          { label: "Foie", isCorrect: false },
          { label: "Poumon", isCorrect: false },
          { label: "Cœur", isCorrect: false }
        ]
      })
      .expect(201);
    const firstSubmissionId = first.body.data.id as string;

    const second = await request(app.getHttpServer())
      .post("/v1/trainings/submissions")
      .set("Authorization", `Bearer ${proposer.accessToken}`)
      .send({
        subjectId,
        chapterId,
        questionType: "single_choice",
        prompt: "Quel ion est majoritairement intracellulaire ?",
        explanation: "Le potassium est l'ion majoritairement intracellulaire.",
        difficulty: 2,
        choices: [
          { label: "Potassium", isCorrect: true },
          { label: "Sodium", isCorrect: false },
          { label: "Chlore", isCorrect: false },
          { label: "Calcium", isCorrect: false }
        ]
      })
      .expect(201);
    const secondSubmissionId = second.body.data.id as string;

    await db.query(
      `
        UPDATE question_submissions
        SET created_at = NOW() - INTERVAL '200 days'
        WHERE id = $1
      `,
      [firstSubmissionId]
    );
    await db.query(
      `
        UPDATE question_submissions
        SET created_at = NOW() - INTERVAL '190 days'
        WHERE id = $1
      `,
      [secondSubmissionId]
    );

    await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${firstSubmissionId}/claim`)
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(201);

    const claimedNextByReviewer2 = await request(app.getHttpServer())
      .post("/v1/trainings/admin/submissions/claim-next")
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .expect(201);
    expect(claimedNextByReviewer2.body.data.submissionId).toBe(secondSubmissionId);

    await request(app.getHttpServer())
      .post(`/v1/trainings/admin/submissions/${firstSubmissionId}/release-claim`)
      .set("Authorization", `Bearer ${reviewer1.accessToken}`)
      .expect(201);

    const claimedNextAfterRelease = await request(app.getHttpServer())
      .post("/v1/trainings/admin/submissions/claim-next")
      .set("Authorization", `Bearer ${reviewer2.accessToken}`)
      .expect(201);
    expect(claimedNextAfterRelease.body.data.submissionId).toBe(secondSubmissionId);
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
