import { randomBytes, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

const DEFAULT_ADMIN_DATABASE_URL = "postgresql://localhost:5432/postgres";
const MIGRATION_FILE_REGEX = /^\d+.*\.sql$/;

export interface IsolatedTestDatabase {
  adminDatabaseUrl: string;
  databaseUrl: string;
  databaseName: string;
}

export async function createIsolatedTestDatabase(): Promise<IsolatedTestDatabase> {
  const adminDatabaseUrl = process.env.TEST_ADMIN_DATABASE_URL ?? DEFAULT_ADMIN_DATABASE_URL;
  const databaseName = `medquiz_it_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const databaseUrl = replaceDatabaseName(adminDatabaseUrl, databaseName);

  await withClient(adminDatabaseUrl, async (client) => {
    await client.query(`CREATE DATABASE "${databaseName}"`);
  });

  await applyMigrations(databaseUrl);

  return {
    adminDatabaseUrl,
    databaseUrl,
    databaseName
  };
}

export async function dropIsolatedTestDatabase(db: IsolatedTestDatabase): Promise<void> {
  await withClient(db.adminDatabaseUrl, async (client) => {
    await client.query(
      `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1
          AND pid <> pg_backend_pid()
      `,
      [db.databaseName]
    );
    await client.query(`DROP DATABASE IF EXISTS "${db.databaseName}"`);
  });
}

export async function applyMigrations(databaseUrl: string): Promise<void> {
  const migrationDir = resolve(__dirname, "../../migrations");
  const migrationFiles = (await readdir(migrationDir))
    .filter((name) => MIGRATION_FILE_REGEX.test(name))
    .sort();

  await withClient(databaseUrl, async (client) => {
    for (const file of migrationFiles) {
      const sql = await readFile(resolve(migrationDir, file), "utf8");
      await client.query(sql);
    }
  });
}

export async function seedPublishedSingleChoiceQuestions(databaseUrl: string): Promise<void> {
  const subjects = [
    { code: "ANAT", name: "Anatomie", chapterCode: "ANAT_CH1", chapterName: "Bases anatomiques" },
    { code: "PHYS", name: "Physiologie", chapterCode: "PHYS_CH1", chapterName: "Bases physiologiques" },
    { code: "BIOC", name: "Biochimie", chapterCode: "BIOC_CH1", chapterName: "Bases biochimiques" }
  ] as const;

  await withClient(databaseUrl, async (client) => {
    await client.query("BEGIN");
    try {
      for (let subjectIdx = 0; subjectIdx < subjects.length; subjectIdx += 1) {
        const subject = subjects[subjectIdx];
        const subjectId = randomUUID();
        const chapterId = randomUUID();

        await client.query(
          `
            INSERT INTO subjects (id, code, name, sort_order, is_active)
            VALUES ($1, $2, $3, $4, TRUE)
          `,
          [subjectId, subject.code, subject.name, subjectIdx + 1]
        );

        await client.query(
          `
            INSERT INTO chapters (id, subject_id, code, name, sort_order, is_active)
            VALUES ($1, $2, $3, $4, 1, TRUE)
          `,
          [chapterId, subjectId, subject.chapterCode, subject.chapterName]
        );

        for (let questionIdx = 1; questionIdx <= 12; questionIdx += 1) {
          const questionId = randomUUID();
          await client.query(
            `
              INSERT INTO questions
                (id, subject_id, chapter_id, question_type, prompt, explanation, difficulty, status)
              VALUES
                ($1, $2, $3, 'single_choice', $4, $5, 3, 'draft')
            `,
            [
              questionId,
              subjectId,
              chapterId,
              `${subject.name} question ${questionIdx}`,
              `${subject.name} explication ${questionIdx}`
            ]
          );

          for (let position = 1; position <= 4; position += 1) {
            await client.query(
              `
                INSERT INTO question_choices (id, question_id, label, position, is_correct)
                VALUES ($1, $2, $3, $4, $5)
              `,
              [
                randomUUID(),
                questionId,
                `${subject.code} Q${questionIdx} option ${position}`,
                position,
                position === 1
              ]
            );
          }

          await client.query(
            `
              UPDATE questions
              SET status = 'published',
                  published_at = NOW()
              WHERE id = $1
            `,
            [questionId]
          );
        }

        const multiQuestionId = randomUUID();
        await client.query(
          `
            INSERT INTO questions
              (id, subject_id, chapter_id, question_type, prompt, explanation, difficulty, status)
            VALUES
              ($1, $2, $3, 'multi_choice', $4, $5, 3, 'draft')
          `,
          [
            multiQuestionId,
            subjectId,
            chapterId,
            `${subject.name} question multi`,
            `${subject.name} explication multi`
          ]
        );

        for (let position = 1; position <= 4; position += 1) {
          await client.query(
            `
              INSERT INTO question_choices (id, question_id, label, position, is_correct)
              VALUES ($1, $2, $3, $4, $5)
            `,
            [
              randomUUID(),
              multiQuestionId,
              `${subject.code} multi option ${position}`,
              position,
              position === 1 || position === 3
            ]
          );
        }

        await client.query(
          `
            UPDATE questions
            SET status = 'published',
                published_at = NOW()
            WHERE id = $1
          `,
          [multiQuestionId]
        );

        const openTextQuestionId = randomUUID();
        await client.query(
          `
            INSERT INTO questions
              (id, subject_id, chapter_id, question_type, prompt, explanation, difficulty, status)
            VALUES
              ($1, $2, $3, 'open_text', $4, $5, 2, 'draft')
          `,
          [
            openTextQuestionId,
            subjectId,
            chapterId,
            `${subject.name} question ouverte`,
            `${subject.name} explication ouverte`
          ]
        );

        const acceptedAnswers = ["ATP", "adénosine triphosphate"];
        for (const acceptedAnswerText of acceptedAnswers) {
          await client.query(
            `
              INSERT INTO question_open_text_answers
                (id, question_id, accepted_answer_text, normalized_answer_text)
              VALUES
                ($1, $2, $3, $4)
            `,
            [
              randomUUID(),
              openTextQuestionId,
              acceptedAnswerText,
              normalizeOpenTextValue(acceptedAnswerText)
            ]
          );
        }

        await client.query(
          `
            UPDATE questions
            SET status = 'published',
                published_at = NOW()
            WHERE id = $1
          `,
          [openTextQuestionId]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

async function withClient<T>(
  connectionString: string,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

function replaceDatabaseName(baseConnectionString: string, databaseName: string): string {
  const parsed = new URL(baseConnectionString);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

function normalizeOpenTextValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
