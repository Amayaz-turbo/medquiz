import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";

type DemoChoiceSeed = {
  label: string;
  isCorrect: boolean;
};

type DemoQuestionSeed =
  | {
      type: "single_choice" | "multi_choice";
      prompt: string;
      explanation: string;
      difficulty: number;
      choices: DemoChoiceSeed[];
    }
  | {
      type: "open_text";
      prompt: string;
      explanation: string;
      difficulty: number;
      acceptedAnswers: string[];
    };

type DemoSubjectSeed = {
  code: string;
  name: string;
  chapterCode: string;
  chapterName: string;
  questions: DemoQuestionSeed[];
};

const DEMO_SUBJECTS: DemoSubjectSeed[] = [
  {
    code: "ANAT",
    name: "Anatomie",
    chapterCode: "ANAT_BASES",
    chapterName: "Repères anatomiques",
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Quel plan sépare le corps en partie droite et partie gauche ?",
        explanation: "Le plan sagittal divise le corps en côtés droit et gauche.",
        difficulty: 2,
        choices: [
          { label: "Plan sagittal", isCorrect: true },
          { label: "Plan frontal", isCorrect: false },
          { label: "Plan transversal", isCorrect: false },
          { label: "Plan oblique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel os appartient au bras ?",
        explanation: "L'humérus est l'os du bras, entre l'épaule et le coude.",
        difficulty: 1,
        choices: [
          { label: "Humérus", isCorrect: true },
          { label: "Radius", isCorrect: false },
          { label: "Ulna", isCorrect: false },
          { label: "Clavicule", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] La patella se situe en avant de quelle articulation ?",
        explanation: "La patella est l'os sésamoïde situé en avant du genou.",
        difficulty: 2,
        choices: [
          { label: "Genou", isCorrect: true },
          { label: "Hanche", isCorrect: false },
          { label: "Cheville", isCorrect: false },
          { label: "Coude", isCorrect: false }
        ]
      },
      {
        type: "multi_choice",
        prompt: "[Demo] Quels éléments appartiennent à la ceinture scapulaire ?",
        explanation: "La ceinture scapulaire comprend la clavicule et la scapula.",
        difficulty: 3,
        choices: [
          { label: "Clavicule", isCorrect: true },
          { label: "Scapula", isCorrect: true },
          { label: "Humérus", isCorrect: false },
          { label: "Sternum", isCorrect: false }
        ]
      },
      {
        type: "open_text",
        prompt: "[Demo] Quel est le nom de l'os de la cuisse ?",
        explanation: "L'os unique de la cuisse est le femur.",
        difficulty: 1,
        acceptedAnswers: ["femur", "fémur"]
      }
    ]
  },
  {
    code: "PHYS",
    name: "Physiologie",
    chapterCode: "PHYS_BASES",
    chapterName: "Grandes fonctions",
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Quel est le pacemaker physiologique du coeur ?",
        explanation: "Le noeud sinusal initie normalement le rythme cardiaque.",
        difficulty: 2,
        choices: [
          { label: "Noeud sinusal", isCorrect: true },
          { label: "Noeud atrio-ventriculaire", isCorrect: false },
          { label: "Faisceau de His", isCorrect: false },
          { label: "Réseau de Purkinje", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle hormone fait baisser la glycémie ?",
        explanation: "L'insuline favorise l'entrée et le stockage du glucose.",
        difficulty: 1,
        choices: [
          { label: "Insuline", isCorrect: true },
          { label: "Glucagon", isCorrect: false },
          { label: "Cortisol", isCorrect: false },
          { label: "Adrénaline", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Où ont lieu les échanges gazeux pulmonaires ?",
        explanation: "Les échanges gazeux se font au niveau des alvéoles.",
        difficulty: 1,
        choices: [
          { label: "Alvéoles pulmonaires", isCorrect: true },
          { label: "Bronches souches", isCorrect: false },
          { label: "Trachée", isCorrect: false },
          { label: "Plèvre", isCorrect: false }
        ]
      },
      {
        type: "multi_choice",
        prompt: "[Demo] Quels paramètres augmentent habituellement pendant l'exercice ?",
        explanation: "La fréquence cardiaque et le débit cardiaque augmentent pendant l'effort.",
        difficulty: 2,
        choices: [
          { label: "Fréquence cardiaque", isCorrect: true },
          { label: "Débit cardiaque", isCorrect: true },
          { label: "Ventilation minute", isCorrect: true },
          { label: "Saturation normale à 100% obligatoire", isCorrect: false }
        ]
      },
      {
        type: "open_text",
        prompt: "[Demo] Quel gaz est principalement transporté des tissus vers les poumons ?",
        explanation: "Le CO2 est ramené vers les poumons pour être expiré.",
        difficulty: 1,
        acceptedAnswers: ["co2", "dioxyde de carbone", "gaz carbonique"]
      }
    ]
  },
  {
    code: "BIOC",
    name: "Biochimie",
    chapterCode: "BIOC_BASES",
    chapterName: "Molécules et énergie",
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Quelle molécule est souvent qualifiée de monnaie énergétique cellulaire ?",
        explanation: "L'ATP fournit une énergie directement utilisable par de nombreuses réactions.",
        difficulty: 1,
        choices: [
          { label: "ATP", isCorrect: true },
          { label: "ADN", isCorrect: false },
          { label: "Collagène", isCorrect: false },
          { label: "Cholestérol", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel sucre est présent dans l'ADN ?",
        explanation: "L'ADN contient du désoxyribose, contrairement à l'ARN qui contient du ribose.",
        difficulty: 2,
        choices: [
          { label: "Désoxyribose", isCorrect: true },
          { label: "Ribose", isCorrect: false },
          { label: "Glucose", isCorrect: false },
          { label: "Fructose", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel type de liaison unit les acides aminés dans une protéine ?",
        explanation: "Les acides aminés sont reliés par des liaisons peptidiques.",
        difficulty: 1,
        choices: [
          { label: "Liaison peptidique", isCorrect: true },
          { label: "Liaison ester", isCorrect: false },
          { label: "Pont phosphodiester", isCorrect: false },
          { label: "Liaison glycosidique", isCorrect: false }
        ]
      },
      {
        type: "multi_choice",
        prompt: "[Demo] Quelles propositions concernent les enzymes ?",
        explanation: "Les enzymes accélèrent les réactions sans être consommées et abaissent l'énergie d'activation.",
        difficulty: 2,
        choices: [
          { label: "Elles abaissent l'énergie d'activation", isCorrect: true },
          { label: "Elles sont des catalyseurs", isCorrect: true },
          { label: "Elles sont toujours consommées pendant la réaction", isCorrect: false },
          { label: "Elles modifient la constante d'équilibre", isCorrect: false }
        ]
      },
      {
        type: "open_text",
        prompt: "[Demo] Comment s'appelle le monomère principal des protéines ?",
        explanation: "Les protéines sont constituées d'acides aminés.",
        difficulty: 1,
        acceptedAnswers: ["acide amine", "acide aminé", "acides amines", "acides aminés"]
      }
    ]
  }
];

@Injectable()
export class DemoService {
  constructor(private readonly db: DatabaseService) {}

  async ensureDemoCatalog(createdByUserId: string) {
    const before = await this.getCatalogStats();
    if (before.publishedSingleChoiceCount > 0) {
      return {
        seeded: false,
        ...before
      };
    }

    await this.db.withTransaction(async (client) => {
      for (let idx = 0; idx < DEMO_SUBJECTS.length; idx += 1) {
        await this.seedSubjectCatalog(client, DEMO_SUBJECTS[idx], idx, createdByUserId);
      }
    });

    const after = await this.getCatalogStats();
    return {
      seeded: true,
      ...after
    };
  }

  private async getCatalogStats() {
    const result = await this.db.query<{
      subject_count: string;
      published_question_count: string;
      published_single_choice_count: string;
    }>(
      `
        SELECT
          (SELECT COUNT(*)::text FROM subjects) AS subject_count,
          (SELECT COUNT(*)::text FROM questions WHERE status = 'published') AS published_question_count,
          (
            SELECT COUNT(*)::text
            FROM questions
            WHERE status = 'published'
              AND question_type = 'single_choice'
          ) AS published_single_choice_count
      `
    );

    const row = result.rows[0];
    return {
      subjectCount: Number(row?.subject_count ?? "0"),
      publishedQuestionCount: Number(row?.published_question_count ?? "0"),
      publishedSingleChoiceCount: Number(row?.published_single_choice_count ?? "0")
    };
  }

  private async seedSubjectCatalog(
    client: PoolClient,
    subject: DemoSubjectSeed,
    index: number,
    createdByUserId: string
  ): Promise<void> {
    const subjectId = await this.upsertSubject(client, subject, index);
    const chapterId = await this.upsertChapter(client, subjectId, subject);

    for (const question of subject.questions) {
      await this.insertQuestion(client, subjectId, chapterId, question, createdByUserId);
    }
  }

  private async upsertSubject(
    client: PoolClient,
    subject: DemoSubjectSeed,
    index: number
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `
        INSERT INTO subjects (id, code, name, sort_order, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (code)
        DO UPDATE
        SET
          name = EXCLUDED.name,
          sort_order = EXCLUDED.sort_order,
          is_active = TRUE
        RETURNING id
      `,
      [randomUUID(), subject.code, subject.name, index + 1]
    );

    return result.rows[0].id;
  }

  private async upsertChapter(
    client: PoolClient,
    subjectId: string,
    subject: DemoSubjectSeed
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `
        INSERT INTO chapters (id, subject_id, code, name, sort_order, is_active)
        VALUES ($1, $2, $3, $4, 1, TRUE)
        ON CONFLICT (subject_id, code)
        DO UPDATE
        SET
          name = EXCLUDED.name,
          sort_order = EXCLUDED.sort_order,
          is_active = TRUE
        RETURNING id
      `,
      [randomUUID(), subjectId, subject.chapterCode, subject.chapterName]
    );

    return result.rows[0].id;
  }

  private async insertQuestion(
    client: PoolClient,
    subjectId: string,
    chapterId: string,
    question: DemoQuestionSeed,
    createdByUserId: string
  ): Promise<void> {
    const questionId = randomUUID();

    await client.query(
      `
        INSERT INTO questions
          (id, subject_id, chapter_id, question_type, prompt, explanation, difficulty, status, created_by_user_id)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, 'draft', $8)
      `,
      [
        questionId,
        subjectId,
        chapterId,
        question.type,
        question.prompt,
        question.explanation,
        question.difficulty,
        createdByUserId
      ]
    );

    if (question.type === "open_text") {
      for (const acceptedAnswer of question.acceptedAnswers) {
        await client.query(
          `
            INSERT INTO question_open_text_answers
              (id, question_id, accepted_answer_text, normalized_answer_text)
            VALUES
              ($1, $2, $3, $4)
          `,
          [randomUUID(), questionId, acceptedAnswer, this.normalizeOpenTextValue(acceptedAnswer)]
        );
      }
    } else {
      for (let position = 0; position < question.choices.length; position += 1) {
        const choice = question.choices[position];
        await client.query(
          `
            INSERT INTO question_choices (id, question_id, label, position, is_correct)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [randomUUID(), questionId, choice.label, position + 1, choice.isCorrect]
        );
      }
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

  private normalizeOpenTextValue(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }
}
