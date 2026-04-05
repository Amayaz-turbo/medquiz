import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";
import { DuelsService } from "../duels/duels.service";

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
      legacyPrompts?: string[];
      chapterCode?: string;
      chapterName?: string;
      choices: DemoChoiceSeed[];
    }
  | {
      type: "open_text";
      prompt: string;
      explanation: string;
      difficulty: number;
      legacyPrompts?: string[];
      chapterCode?: string;
      chapterName?: string;
      acceptedAnswers: string[];
    };

type DemoChapterSeed = {
  code: string;
  name: string;
};

type DemoSubjectSeed = {
  code: string;
  name: string;
  chapterCode: string;
  chapterName: string;
  chapters: DemoChapterSeed[];
  questions: DemoQuestionSeed[];
};

const DEMO_SUBJECTS: DemoSubjectSeed[] = [
  {
    code: "ANAT",
    name: "Anatomie générale",
    chapterCode: "ANAT_GENERALITES",
    chapterName: "Généralités",
    chapters: [
      { code: "ANAT_GENERALITES", name: "Généralités" },
      { code: "ANAT_LOCOMOTEUR", name: "Appareil locomoteur" },
      { code: "ANAT_CAVITES_ORGANES", name: "Cavités et organes" },
      { code: "ANAT_VASCULARISATION", name: "Vascularisation" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Dans quel plan le corps est-il séparé en parties droite et gauche ?",
        explanation: "Le plan sagittal sépare le corps en une partie droite et une partie gauche.",
        difficulty: 2,
        legacyPrompts: ["[Demo] Quel plan sépare le corps en partie droite et partie gauche ?"],
        chapterCode: "ANAT_GENERALITES",
        chapterName: "Généralités",
        choices: [
          { label: "Plan sagittal", isCorrect: true },
          { label: "Plan frontal", isCorrect: false },
          { label: "Plan transversal", isCorrect: false },
          { label: "Plan oblique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel os appartient au bras, entre l'épaule et le coude ?",
        explanation: "L'humérus est l'os du bras ; le radius et l'ulna appartiennent à l'avant-bras.",
        difficulty: 1,
        legacyPrompts: ["[Demo] Quel os appartient au bras ?"],
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Humérus", isCorrect: true },
          { label: "Radius", isCorrect: false },
          { label: "Ulna", isCorrect: false },
          { label: "Clavicule", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] La patella se projette en avant de quelle articulation ?",
        explanation: "La patella est l'os sésamoïde situé en avant du genou, dans l'appareil extenseur.",
        difficulty: 2,
        legacyPrompts: ["[Demo] La patella se situe en avant de quelle articulation ?"],
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Genou", isCorrect: true },
          { label: "Hanche", isCorrect: false },
          { label: "Cheville", isCorrect: false },
          { label: "Coude", isCorrect: false }
        ]
      },
      {
        type: "multi_choice",
        prompt: "[Demo] Quels éléments composent la ceinture scapulaire ?",
        explanation: "La ceinture scapulaire associe la clavicule et la scapula.",
        difficulty: 3,
        legacyPrompts: ["[Demo] Quels éléments appartiennent à la ceinture scapulaire ?"],
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Clavicule", isCorrect: true },
          { label: "Scapula", isCorrect: true },
          { label: "Humérus", isCorrect: false },
          { label: "Sternum", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel os constitue la partie antérieure médiane de la cage thoracique ?",
        explanation: "Le sternum forme la partie antérieure médiane de la cage thoracique.",
        difficulty: 1,
        legacyPrompts: ["[Demo] Quel os forme la partie antérieure de la cage thoracique ?"],
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Sternum", isCorrect: true },
          { label: "Scapula", isCorrect: false },
          { label: "Humérus", isCorrect: false },
          { label: "Fibula", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle structure transmet la force du muscle à l'os ?",
        explanation: "Le tendon transmet la force générée par le muscle à son insertion osseuse.",
        difficulty: 1,
        legacyPrompts: ["[Demo] Quelle structure relie le muscle à l'os ?"],
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Tendon", isCorrect: true },
          { label: "Nerf", isCorrect: false },
          { label: "Cartilage", isCorrect: false },
          { label: "Fascia", isCorrect: false }
        ]
      },
      {
        type: "multi_choice",
        prompt: "[Demo] Quels os appartiennent au membre inférieur ?",
        explanation: "Le fémur, le tibia et la patella appartiennent au membre inférieur.",
        difficulty: 2,
        legacyPrompts: ["[Demo] Quelles structures appartiennent au membre inférieur ?"],
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Fémur", isCorrect: true },
          { label: "Tibia", isCorrect: true },
          { label: "Patella", isCorrect: true },
          { label: "Radius", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel os est situé sur le côté latéral de la jambe ?",
        explanation: "La fibula, anciennement appelée péroné, est située latéralement dans la jambe.",
        difficulty: 2,
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Fibula", isCorrect: true },
          { label: "Tibia", isCorrect: false },
          { label: "Fémur", isCorrect: false },
          { label: "Patella", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel os constitue la mâchoire inférieure ?",
        explanation: "La mâchoire inférieure correspond à la mandibule.",
        difficulty: 1,
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Mandibule", isCorrect: true },
          { label: "Maxillaire", isCorrect: false },
          { label: "Zygomatique", isCorrect: false },
          { label: "Temporal", isCorrect: false }
        ]
      },
      {
        type: "multi_choice",
        prompt: "[Demo] Quelles caractéristiques définissent une articulation synoviale ?",
        explanation: "Une articulation synoviale comporte une capsule, une cavité et du cartilage articulaire.",
        difficulty: 3,
        legacyPrompts: ["[Demo] Quelles propositions concernent une articulation synoviale ?"],
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Présence d'une capsule articulaire", isCorrect: true },
          { label: "Présence d'une cavité articulaire", isCorrect: true },
          { label: "Cartilage articulaire sur les surfaces", isCorrect: true },
          { label: "Absence complète de mobilité", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel muscle est principalement responsable de l'abduction du bras entre 15° et 90° ?",
        explanation: "Le supra-épineux initie les premiers 15°, puis le deltoïde prend le relais jusqu'à 90°.",
        difficulty: 2,
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Supra-épineux", isCorrect: false },
          { label: "Deltoïde", isCorrect: true },
          { label: "Grand dorsal", isCorrect: false },
          { label: "Petit rond", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel nerf innerve le biceps brachial, muscle majeur de la flexion du coude et de la supination ?",
        explanation: "Le nerf musculo-cutané innerve notamment le biceps brachial, impliqué dans la flexion du coude et la supination.",
        difficulty: 3,
        legacyPrompts: [
          "[Demo] Quel nerf est responsable de la flexion du coude et de la supination de l'avant-bras ?"
        ],
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Nerf radial", isCorrect: false },
          { label: "Nerf ulnaire", isCorrect: false },
          { label: "Nerf médian", isCorrect: false },
          { label: "Nerf musculo-cutané", isCorrect: true }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle artère vascularise le plus souvent le nœud sinusal ?",
        explanation: "Dans environ 60% des cas, le nœud sinusal est vascularisé par l'artère coronaire droite.",
        difficulty: 4,
        legacyPrompts: ["[Demo] Quelle structure assure la vascularisation principale du nœud sinusal ?"],
        chapterCode: "ANAT_VASCULARISATION",
        chapterName: "Vascularisation",
        choices: [
          { label: "Artère interventriculaire antérieure", isCorrect: false },
          { label: "Artère coronaire droite", isCorrect: true },
          { label: "Artère circonflexe", isCorrect: false },
          { label: "Veine cardiaque moyenne", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel organe est rétro-péritonéal, à l'exception de sa queue ?",
        explanation: "Le pancréas est rétro-péritonéal sauf sa queue, qui est intrapéritonéale.",
        difficulty: 2,
        legacyPrompts: ["[Demo] Quel organe est principalement rétro-péritonéal ?"],
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Estomac", isCorrect: false },
          { label: "Foie", isCorrect: false },
          { label: "Pancréas (sauf queue)", isCorrect: true },
          { label: "Rate", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle structure traverse le foramen magnum ?",
        explanation: "Le foramen magnum laisse notamment passer la moelle épinière et les artères vertébrales.",
        difficulty: 2,
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Nerf optique", isCorrect: false },
          { label: "Moelle épinière", isCorrect: true },
          { label: "Nerf facial", isCorrect: false },
          { label: "Artère carotide interne", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel nerf est le plus exposé lors d'une fracture du col chirurgical de l'humérus ?",
        explanation: "Le nerf axillaire contourne le col chirurgical de l'humérus, ce qui l'expose particulièrement lors de ce type de fracture.",
        difficulty: 3,
        legacyPrompts: [
          "[Demo] Quel nerf est le plus souvent lésé lors d'une fracture du col chirurgical de l'humérus ?"
        ],
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Nerf radial", isCorrect: false },
          { label: "Nerf axillaire", isCorrect: true },
          { label: "Nerf médian", isCorrect: false },
          { label: "Nerf ulnaire", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel muscle permet l'extension du genou ?",
        explanation: "Le quadriceps est le principal muscle extenseur du genou.",
        difficulty: 1,
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Ischio-jambiers", isCorrect: false },
          { label: "Sartorius", isCorrect: false },
          { label: "Quadriceps", isCorrect: true },
          { label: "Gastrocnémien", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel os participe à la paroi latérale de l'orbite ?",
        explanation: "L'os zygomatique participe à la paroi latérale de l'orbite.",
        difficulty: 2,
        legacyPrompts: ["[Demo] Quel os participe à la formation de l'orbite ?"],
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Os pariétal", isCorrect: false },
          { label: "Os zygomatique", isCorrect: true },
          { label: "Os occipital", isCorrect: false },
          { label: "Os temporal", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel nerf crânien innerve le muscle releveur de la paupière supérieure ?",
        explanation: "Le nerf oculomoteur (III) innerve le muscle releveur de la paupière supérieure.",
        difficulty: 2,
        legacyPrompts: [
          "[Demo] Quel nerf crânien est responsable de l'élévation de la paupière supérieure ?"
        ],
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Nerf trochléaire (IV)", isCorrect: false },
          { label: "Nerf oculomoteur (III)", isCorrect: true },
          { label: "Nerf abducens (VI)", isCorrect: false },
          { label: "Nerf trijumeau (V)", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel muscle assure l'essentiel de l'inspiration au repos ?",
        explanation: "Le diaphragme assure la majorité de la ventilation au repos.",
        difficulty: 1,
        legacyPrompts: ["[Demo] Quel est le principal muscle inspiratoire ?"],
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Intercostaux internes", isCorrect: false },
          { label: "Diaphragme", isCorrect: true },
          { label: "Grand pectoral", isCorrect: false },
          { label: "Dentelé antérieur", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle artère participe principalement à la vascularisation du cerveau antérieur ?",
        explanation: "L'artère carotide interne participe à la vascularisation du cerveau antérieur via le polygone de Willis.",
        difficulty: 2,
        legacyPrompts: ["[Demo] Quelle artère vascularise principalement le cerveau ?"],
        chapterCode: "ANAT_VASCULARISATION",
        chapterName: "Vascularisation",
        choices: [
          { label: "Artère carotide externe", isCorrect: false },
          { label: "Artère carotide interne", isCorrect: true },
          { label: "Artère sous-clavière", isCorrect: false },
          { label: "Artère pulmonaire", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel ligament relie le foie à la paroi abdominale antérieure ?",
        explanation: "Le ligament falciforme relie le foie à la paroi abdominale antérieure et contient le ligament rond.",
        difficulty: 2,
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Ligament hépatogastrique", isCorrect: false },
          { label: "Ligament falciforme", isCorrect: true },
          { label: "Ligament rond", isCorrect: false },
          { label: "Ligament coronaire", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle structure recueille l'urine juste avant l'uretère ?",
        explanation: "Le bassinet, ou pelvis rénal, collecte l'urine avant son passage dans l'uretère.",
        difficulty: 2,
        legacyPrompts: ["[Demo] Quelle structure draine directement l'urine vers l'uretère ?"],
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Tubule contourné distal", isCorrect: false },
          { label: "Calice mineur", isCorrect: false },
          { label: "Bassinet (pelvis rénal)", isCorrect: true },
          { label: "Capsule rénale", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle structure participe surtout à la coordination motrice ?",
        explanation: "Le cervelet coordonne les mouvements volontaires et participe à l'équilibre.",
        difficulty: 1,
        legacyPrompts: ["[Demo] Quelle structure est responsable de la coordination motrice ?"],
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Thalamus", isCorrect: false },
          { label: "Hypothalamus", isCorrect: false },
          { label: "Cervelet", isCorrect: true },
          { label: "Hippocampe", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Chez l'homme, quelle structure traverse la prostate ?",
        explanation: "L'urètre prostatique traverse la prostate.",
        difficulty: 2,
        chapterCode: "ANAT_CAVITES_ORGANES",
        chapterName: "Cavités et organes",
        choices: [
          { label: "Urètre", isCorrect: true },
          { label: "Uretère", isCorrect: false },
          { label: "Canal déférent", isCorrect: false },
          { label: "Artère iliaque", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel est l'os de la cuisse ?",
        explanation: "Le fémur est l'os unique de la cuisse.",
        difficulty: 1,
        legacyPrompts: ["[Demo] Quel est le nom de l'os de la cuisse ?"],
        chapterCode: "ANAT_LOCOMOTEUR",
        chapterName: "Appareil locomoteur",
        choices: [
          { label: "Fémur", isCorrect: true },
          { label: "Tibia", isCorrect: false },
          { label: "Fibula", isCorrect: false },
          { label: "Humérus", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "PHYS",
    name: "Physiologie générale",
    chapterCode: "PHYS_CELLULAIRE",
    chapterName: "Physiologie cellulaire",
    chapters: [
      { code: "PHYS_CELLULAIRE", name: "Physiologie cellulaire" },
      { code: "PHYS_CARDIO", name: "Système cardiovasculaire" },
      { code: "PHYS_RESP", name: "Système respiratoire" },
      { code: "PHYS_NERVEUX", name: "Système nerveux" },
      { code: "PHYS_RENAL", name: "Système rénal" },
      { code: "PHYS_ENDOCRINIEN", name: "Système endocrinien" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Quel est le pacemaker physiologique du coeur ?",
        explanation: "Le noeud sinusal initie normalement le rythme cardiaque.",
        difficulty: 2,
        chapterCode: "PHYS_CARDIO",
        chapterName: "Système cardiovasculaire",
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
        chapterCode: "PHYS_ENDOCRINIEN",
        chapterName: "Système endocrinien",
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
        chapterCode: "PHYS_RESP",
        chapterName: "Système respiratoire",
        choices: [
          { label: "Alvéoles pulmonaires", isCorrect: true },
          { label: "Bronches souches", isCorrect: false },
          { label: "Trachée", isCorrect: false },
          { label: "Plèvre", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Lors d'un exercice physique, quel paramètre augmente habituellement ?",
        explanation: "La fréquence cardiaque augmente habituellement pendant l'effort.",
        difficulty: 2,
        legacyPrompts: ["[Demo] Quels paramètres augmentent habituellement pendant l'exercice ?"],
        chapterCode: "PHYS_CARDIO",
        chapterName: "Système cardiovasculaire",
        choices: [
          { label: "Fréquence cardiaque", isCorrect: true },
          { label: "Température corporelle centrale à 30°C", isCorrect: false },
          { label: "Glycémie toujours nulle", isCorrect: false },
          { label: "Arrêt complet de la ventilation", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel organe principal filtre le sang pour fabriquer l'urine ?",
        explanation: "Le rein filtre le plasma et participe à la formation de l'urine.",
        difficulty: 1,
        chapterCode: "PHYS_RENAL",
        chapterName: "Système rénal",
        choices: [
          { label: "Rein", isCorrect: true },
          { label: "Foie", isCorrect: false },
          { label: "Pancréas", isCorrect: false },
          { label: "Rate", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle partie du système nerveux central contrôle surtout l'équilibre et la coordination ?",
        explanation: "Le cervelet est impliqué dans la coordination des mouvements et l'équilibre.",
        difficulty: 2,
        chapterCode: "PHYS_NERVEUX",
        chapterName: "Système nerveux",
        choices: [
          { label: "Cervelet", isCorrect: true },
          { label: "Hypophyse", isCorrect: false },
          { label: "Moelle osseuse", isCorrect: false },
          { label: "Thyroïde", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Dans le sang, quelle molécule transporte directement l'oxygène ?",
        explanation: "L'hémoglobine transporte directement l'oxygène ; elle est contenue dans les globules rouges.",
        difficulty: 2,
        legacyPrompts: ["[Demo] Quels éléments participent au transport de l'oxygène dans l'organisme ?"],
        chapterCode: "PHYS_RESP",
        chapterName: "Système respiratoire",
        choices: [
          { label: "Hémoglobine", isCorrect: true },
          { label: "Albumine", isCorrect: false },
          { label: "Bile", isCorrect: false },
          { label: "Insuline", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle cellule sanguine contient l'hémoglobine ?",
        explanation: "Les globules rouges, ou hématies, contiennent l'hémoglobine qui transporte l'oxygène.",
        difficulty: 1,
        chapterCode: "PHYS_RESP",
        chapterName: "Système respiratoire",
        choices: [
          { label: "Globule rouge", isCorrect: true },
          { label: "Plaquette", isCorrect: false },
          { label: "Lymphocyte", isCorrect: false },
          { label: "Neutrophile", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel organe sécrète l'insuline ?",
        explanation: "L'insuline est sécrétée par le pancréas endocrine.",
        difficulty: 1,
        chapterCode: "PHYS_ENDOCRINIEN",
        chapterName: "Système endocrinien",
        choices: [
          { label: "Pancréas", isCorrect: true },
          { label: "Foie", isCorrect: false },
          { label: "Rein", isCorrect: false },
          { label: "Rate", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel compartiment cardiaque éjecte le sang dans l'aorte ?",
        explanation: "Le ventricule gauche propulse le sang oxygéné dans l'aorte.",
        difficulty: 2,
        chapterCode: "PHYS_CARDIO",
        chapterName: "Système cardiovasculaire",
        choices: [
          { label: "Ventricule gauche", isCorrect: true },
          { label: "Oreillette gauche", isCorrect: false },
          { label: "Ventricule droit", isCorrect: false },
          { label: "Oreillette droite", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel effet est typiquement observé lors d'une activation du système sympathique ?",
        explanation: "Le système sympathique provoque notamment une augmentation de la fréquence cardiaque.",
        difficulty: 3,
        legacyPrompts: ["[Demo] Quels effets sont attendus lors d'une activation du système sympathique ?"],
        chapterCode: "PHYS_NERVEUX",
        chapterName: "Système nerveux",
        choices: [
          { label: "Augmentation de la fréquence cardiaque", isCorrect: true },
          { label: "Bradycardie immédiate", isCorrect: false },
          { label: "Stimulation massive de la digestion", isCorrect: false },
          { label: "Myosis", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel gaz est principalement transporté des tissus vers les poumons ?",
        explanation: "Le dioxyde de carbone est ramené vers les poumons pour être expiré.",
        difficulty: 1,
        chapterCode: "PHYS_RESP",
        chapterName: "Système respiratoire",
        choices: [
          { label: "Dioxyde de carbone (CO2)", isCorrect: true },
          { label: "Oxygène (O2)", isCorrect: false },
          { label: "Azote (N2)", isCorrect: false },
          { label: "Hélium", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "BIOC",
    name: "Chimie générale et organique / Biochimie",
    chapterCode: "BIOCHIMIE",
    chapterName: "Biochimie",
    chapters: [
      { code: "CHEM_GENERAL", name: "Chimie générale" },
      { code: "CHEM_ORGA", name: "Chimie organique" },
      { code: "BIOCHIMIE", name: "Biochimie" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Quelle molécule est souvent qualifiée de monnaie énergétique cellulaire ?",
        explanation: "L'ATP fournit une énergie directement utilisable par de nombreuses réactions.",
        difficulty: 1,
        chapterCode: "BIOCHIMIE",
        chapterName: "Biochimie",
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
        chapterCode: "BIOCHIMIE",
        chapterName: "Biochimie",
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
        chapterCode: "CHEM_ORGA",
        chapterName: "Chimie organique",
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
        chapterCode: "BIOCHIMIE",
        chapterName: "Biochimie",
        choices: [
          { label: "Elles abaissent l'énergie d'activation", isCorrect: true },
          { label: "Elles sont des catalyseurs", isCorrect: true },
          { label: "Elles sont toujours consommées pendant la réaction", isCorrect: false },
          { label: "Elles modifient la constante d'équilibre", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel type de molécule constitue principalement les membranes cellulaires ?",
        explanation: "Les membranes cellulaires sont principalement constituées d'une bicouche de phospholipides.",
        difficulty: 2,
        chapterCode: "CHEM_ORGA",
        chapterName: "Chimie organique",
        choices: [
          { label: "Phospholipides", isCorrect: true },
          { label: "Nucléotides", isCorrect: false },
          { label: "Acides aminés", isCorrect: false },
          { label: "Triglycérides", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle molécule porte l'information génétique dans la cellule ?",
        explanation: "L'ADN contient l'information génétique cellulaire.",
        difficulty: 1,
        chapterCode: "BIOCHIMIE",
        chapterName: "Biochimie",
        choices: [
          { label: "ADN", isCorrect: true },
          { label: "ATP", isCorrect: false },
          { label: "Collagène", isCorrect: false },
          { label: "Lactate", isCorrect: false }
        ]
      },
      {
        type: "multi_choice",
        prompt: "[Demo] Quelles molécules sont des glucides ?",
        explanation: "Le glucose, le fructose et le glycogène appartiennent à la famille des glucides.",
        difficulty: 2,
        chapterCode: "CHEM_ORGA",
        chapterName: "Chimie organique",
        choices: [
          { label: "Glucose", isCorrect: true },
          { label: "Fructose", isCorrect: true },
          { label: "Glycogène", isCorrect: true },
          { label: "Cholestérol", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel acide nucléique contient de l'uracile ?",
        explanation: "L'ARN contient de l'uracile à la place de la thymine.",
        difficulty: 2,
        chapterCode: "BIOCHIMIE",
        chapterName: "Biochimie",
        choices: [
          { label: "ARN", isCorrect: true },
          { label: "ADN", isCorrect: false },
          { label: "ATP", isCorrect: false },
          { label: "Glycogène", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel composé est le produit final direct de la glycolyse ?",
        explanation: "La glycolyse aboutit au pyruvate.",
        difficulty: 3,
        chapterCode: "BIOCHIMIE",
        chapterName: "Biochimie",
        choices: [
          { label: "Pyruvate", isCorrect: true },
          { label: "Acétyl-CoA", isCorrect: false },
          { label: "Lactose", isCorrect: false },
          { label: "Urée", isCorrect: false }
        ]
      },
      {
        type: "multi_choice",
        prompt: "[Demo] Quelles propositions décrivent correctement l'ATP ?",
        explanation: "L'ATP stocke de l'énergie chimique et participe à de nombreuses réactions cellulaires.",
        difficulty: 2,
        chapterCode: "BIOCHIMIE",
        chapterName: "Biochimie",
        choices: [
          { label: "C'est une molécule énergétique cellulaire", isCorrect: true },
          { label: "Elle contient des groupements phosphate", isCorrect: true },
          { label: "Elle peut être hydrolysée en ADP", isCorrect: true },
          { label: "Elle remplace l'ADN comme support génétique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel est le monomère principal des protéines ?",
        explanation: "Les protéines sont constituées d'acides aminés.",
        difficulty: 1,
        legacyPrompts: ["[Demo] Comment s'appelle le monomère principal des protéines ?"],
        chapterCode: "CHEM_ORGA",
        chapterName: "Chimie organique",
        choices: [
          { label: "Acide aminé", isCorrect: true },
          { label: "Nucléotide", isCorrect: false },
          { label: "Acide gras", isCorrect: false },
          { label: "Monosaccharide", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "BCMG",
    name: "Biologie cellulaire et moléculaire / Génétique",
    chapterCode: "BIOLOGIE_CELLULAIRE",
    chapterName: "Biologie cellulaire",
    chapters: [
      { code: "BIOLOGIE_CELLULAIRE", name: "Biologie cellulaire" },
      { code: "BIOLOGIE_MOLECULAIRE", name: "Biologie moléculaire" },
      { code: "GENETIQUE", name: "Génétique" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Quel organite est principalement responsable de la production d'ATP dans la cellule eucaryote ?",
        explanation: "La mitochondrie est le siège principal de la production d'ATP par phosphorylation oxydative.",
        difficulty: 1,
        chapterCode: "BIOLOGIE_CELLULAIRE",
        chapterName: "Biologie cellulaire",
        choices: [
          { label: "Mitochondrie", isCorrect: true },
          { label: "Lysosome", isCorrect: false },
          { label: "Appareil de Golgi", isCorrect: false },
          { label: "Noyau", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle structure délimite la cellule et contrôle les échanges avec le milieu extérieur ?",
        explanation: "La membrane plasmique constitue la limite de la cellule et participe au transport sélectif des substances.",
        difficulty: 1,
        chapterCode: "BIOLOGIE_CELLULAIRE",
        chapterName: "Biologie cellulaire",
        choices: [
          { label: "Membrane plasmique", isCorrect: true },
          { label: "Paroi nucléaire", isCorrect: false },
          { label: "Ribosome", isCorrect: false },
          { label: "Nucléole", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Durant quelle phase du cycle cellulaire la réplication de l'ADN a-t-elle lieu ?",
        explanation: "La réplication de l'ADN a lieu pendant la phase S de l'interphase.",
        difficulty: 2,
        chapterCode: "BIOLOGIE_CELLULAIRE",
        chapterName: "Biologie cellulaire",
        choices: [
          { label: "Phase G1", isCorrect: false },
          { label: "Phase S", isCorrect: true },
          { label: "Phase G2", isCorrect: false },
          { label: "Mitose", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] À quel moment de la mitose les chromatides sœurs se séparent-elles ?",
        explanation: "Les chromatides sœurs se séparent pendant l'anaphase.",
        difficulty: 2,
        chapterCode: "BIOLOGIE_CELLULAIRE",
        chapterName: "Biologie cellulaire",
        choices: [
          { label: "Prophase", isCorrect: false },
          { label: "Métaphase", isCorrect: false },
          { label: "Anaphase", isCorrect: true },
          { label: "Télophase", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Comment appelle-t-on une mort cellulaire programmée et régulée ?",
        explanation: "L'apoptose correspond à une mort cellulaire programmée, à distinguer de la nécrose.",
        difficulty: 1,
        chapterCode: "BIOLOGIE_CELLULAIRE",
        chapterName: "Biologie cellulaire",
        choices: [
          { label: "Apoptose", isCorrect: true },
          { label: "Nécrose", isCorrect: false },
          { label: "Mitose", isCorrect: false },
          { label: "Phagocytose", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle enzyme réalise la transcription de l'ADN en ARN ?",
        explanation: "L'ARN polymérase synthétise un ARN complémentaire à partir d'un brin d'ADN matrice.",
        difficulty: 2,
        chapterCode: "BIOLOGIE_MOLECULAIRE",
        chapterName: "Biologie moléculaire",
        choices: [
          { label: "ADN polymérase", isCorrect: false },
          { label: "ARN polymérase", isCorrect: true },
          { label: "Ligase", isCorrect: false },
          { label: "Topoisomérase", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel type d'ARN apporte les acides aminés au ribosome pendant la traduction ?",
        explanation: "L'ARNt transporte les acides aminés vers le ribosome pendant la synthèse protéique.",
        difficulty: 2,
        chapterCode: "BIOLOGIE_MOLECULAIRE",
        chapterName: "Biologie moléculaire",
        choices: [
          { label: "ARNm", isCorrect: false },
          { label: "ARNr", isCorrect: false },
          { label: "ARNt", isCorrect: true },
          { label: "snARN", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle technique permet d'amplifier spécifiquement une séquence d'ADN ?",
        explanation: "La PCR permet d'amplifier une séquence d'ADN cible grâce à des cycles successifs de réplication in vitro.",
        difficulty: 1,
        chapterCode: "BIOLOGIE_MOLECULAIRE",
        chapterName: "Biologie moléculaire",
        choices: [
          { label: "PCR", isCorrect: true },
          { label: "Western blot", isCorrect: false },
          { label: "Caryotype", isCorrect: false },
          { label: "Immunofluorescence", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel triplet de bases présent sur l'ARNm est lu par le ribosome ?",
        explanation: "Le ribosome lit des codons sur l'ARN messager pendant la traduction.",
        difficulty: 2,
        chapterCode: "BIOLOGIE_MOLECULAIRE",
        chapterName: "Biologie moléculaire",
        choices: [
          { label: "Codon", isCorrect: true },
          { label: "Anticodon", isCorrect: false },
          { label: "Exon", isCorrect: false },
          { label: "Promoteur", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Lors d'un croisement Aa x Aa, quelle est la probabilité d'obtenir un génotype aa ?",
        explanation: "Le tableau de croisement mendélien donne 1 aa sur 4, soit 25 %.",
        difficulty: 2,
        chapterCode: "GENETIQUE",
        chapterName: "Génétique",
        choices: [
          { label: "25 %", isCorrect: true },
          { label: "50 %", isCorrect: false },
          { label: "75 %", isCorrect: false },
          { label: "100 %", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle anomalie chromosomique correspond à la trisomie 21 ?",
        explanation: "La trisomie 21 correspond à la présence de trois copies du chromosome 21.",
        difficulty: 1,
        chapterCode: "GENETIQUE",
        chapterName: "Génétique",
        choices: [
          { label: "Trois copies du chromosome 21", isCorrect: true },
          { label: "Absence d'un chromosome X", isCorrect: false },
          { label: "Délétion du chromosome 5", isCorrect: false },
          { label: "Translocation du chromosome 22", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Dans le système ABO, quel groupe sanguin illustre une codominance entre deux allèles ?",
        explanation: "Le groupe AB exprime à la fois l'antigène A et l'antigène B : les deux allèles sont codominants.",
        difficulty: 2,
        chapterCode: "GENETIQUE",
        chapterName: "Génétique",
        choices: [
          { label: "Groupe O", isCorrect: false },
          { label: "Groupe A", isCorrect: false },
          { label: "Groupe B", isCorrect: false },
          { label: "Groupe AB", isCorrect: true }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle condition fait partie des hypothèses du modèle de Hardy-Weinberg ?",
        explanation: "Le modèle de Hardy-Weinberg suppose notamment une population de grande taille avec accouplements aléatoires et sans sélection.",
        difficulty: 3,
        chapterCode: "GENETIQUE",
        chapterName: "Génétique",
        choices: [
          { label: "Population de grande taille sans sélection", isCorrect: true },
          { label: "Mutations très fréquentes à chaque génération", isCorrect: false },
          { label: "Migration permanente entre populations", isCorrect: false },
          { label: "Croisements uniquement entre apparentés", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "ICM",
    name: "Initiation à la connaissance du médicament",
    chapterCode: "PHARMA_GENERALE",
    chapterName: "Pharmacologie générale",
    chapters: [
      { code: "PHARMA_GENERALE", name: "Pharmacologie générale" },
      { code: "DEVELOPPEMENT_MEDICAMENT", name: "Développement du médicament" },
      { code: "REGLEMENTATION_CIRCUIT", name: "Réglementation et circuit" },
      { code: "FORMES_PHARMACEUTIQUES", name: "Formes pharmaceutiques" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Que signifie l'acronyme ADME en pharmacocinétique ?",
        explanation: "ADME signifie Absorption, Distribution, Métabolisme, Élimination.",
        difficulty: 1,
        chapterCode: "PHARMA_GENERALE",
        chapterName: "Pharmacologie générale",
        choices: [
          { label: "Absorption, Distribution, Métabolisme, Élimination", isCorrect: true },
          { label: "Action, Diffusion, Modification, Excrétion", isCorrect: false },
          { label: "Administration, Dilution, Métabolisme, Exposition", isCorrect: false },
          { label: "Absorption, Dégradation, Mutation, Excrétion", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Comment appelle-t-on la substance responsable de l'effet pharmacologique d'un médicament ?",
        explanation: "Le principe actif est la substance qui produit l'effet recherché.",
        difficulty: 1,
        chapterCode: "PHARMA_GENERALE",
        chapterName: "Pharmacologie générale",
        choices: [
          { label: "Principe actif", isCorrect: true },
          { label: "Excipient", isCorrect: false },
          { label: "Générique", isCorrect: false },
          { label: "Galénique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel paramètre pharmacocinétique décrit le temps nécessaire pour que la concentration plasmatique diminue de moitié ?",
        explanation: "La demi-vie d'élimination correspond au temps nécessaire pour diminuer de moitié la concentration plasmatique du médicament.",
        difficulty: 2,
        chapterCode: "PHARMA_GENERALE",
        chapterName: "Pharmacologie générale",
        choices: [
          { label: "Demi-vie d'élimination", isCorrect: true },
          { label: "Biodisponibilité", isCorrect: false },
          { label: "Volume de distribution", isCorrect: false },
          { label: "Clairance créatinine", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Un médicament qui se fixe sur un récepteur et l'active est qualifié de :",
        explanation: "Un agoniste se fixe à un récepteur et mime l'effet du ligand endogène.",
        difficulty: 2,
        chapterCode: "PHARMA_GENERALE",
        chapterName: "Pharmacologie générale",
        choices: [
          { label: "Agoniste", isCorrect: true },
          { label: "Antagoniste", isCorrect: false },
          { label: "Excipient", isCorrect: false },
          { label: "Inducteur", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle phase du développement du médicament correspond en premier à l'essai chez l'humain ?",
        explanation: "La phase I est la première phase conduite chez l'humain après la phase préclinique.",
        difficulty: 1,
        chapterCode: "DEVELOPPEMENT_MEDICAMENT",
        chapterName: "Développement du médicament",
        choices: [
          { label: "Phase I", isCorrect: true },
          { label: "Phase II", isCorrect: false },
          { label: "Phase III", isCorrect: false },
          { label: "Phase IV", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle phase correspond à la surveillance après commercialisation du médicament ?",
        explanation: "La phase IV correspond au suivi post-AMM, notamment en pharmacovigilance.",
        difficulty: 1,
        chapterCode: "DEVELOPPEMENT_MEDICAMENT",
        chapterName: "Développement du médicament",
        choices: [
          { label: "Phase IV", isCorrect: true },
          { label: "Phase III", isCorrect: false },
          { label: "Phase II", isCorrect: false },
          { label: "Phase préclinique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel terme désigne une étude dans laquelle ni le patient ni l'investigateur ne connaissent le traitement reçu ?",
        explanation: "On parle de double aveugle lorsque ni le participant ni l'investigateur ne connaissent l'attribution du traitement.",
        difficulty: 2,
        chapterCode: "DEVELOPPEMENT_MEDICAMENT",
        chapterName: "Développement du médicament",
        choices: [
          { label: "Double aveugle", isCorrect: true },
          { label: "Cohorte", isCorrect: false },
          { label: "Étude transversale", isCorrect: false },
          { label: "Open label", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel organisme français est chargé de la sécurité du médicament ?",
        explanation: "L'ANSM est l'Agence nationale de sécurité du médicament et des produits de santé.",
        difficulty: 1,
        chapterCode: "REGLEMENTATION_CIRCUIT",
        chapterName: "Réglementation et circuit",
        choices: [
          { label: "ANSM", isCorrect: true },
          { label: "ARS", isCorrect: false },
          { label: "HAS", isCorrect: false },
          { label: "CCNE", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel document formalise l'autorisation de commercialiser un médicament ?",
        explanation: "L'AMM, autorisation de mise sur le marché, permet la commercialisation du médicament.",
        difficulty: 1,
        chapterCode: "REGLEMENTATION_CIRCUIT",
        chapterName: "Réglementation et circuit",
        choices: [
          { label: "AMM", isCorrect: true },
          { label: "ECG", isCorrect: false },
          { label: "DMP", isCorrect: false },
          { label: "ALD", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Dans le circuit hospitalier du médicament, qui réalise la dispensation après la prescription ?",
        explanation: "La dispensation est réalisée par la pharmacie, avant l'administration au patient.",
        difficulty: 2,
        chapterCode: "REGLEMENTATION_CIRCUIT",
        chapterName: "Réglementation et circuit",
        choices: [
          { label: "La pharmacie", isCorrect: true },
          { label: "Le laboratoire industriel", isCorrect: false },
          { label: "Le patient lui-même", isCorrect: false },
          { label: "Le service de radiologie", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle forme pharmaceutique est administrée directement dans une veine ?",
        explanation: "La voie intraveineuse correspond à une administration directement dans une veine.",
        difficulty: 1,
        chapterCode: "FORMES_PHARMACEUTIQUES",
        chapterName: "Formes pharmaceutiques",
        choices: [
          { label: "Forme injectable IV", isCorrect: true },
          { label: "Comprimé", isCorrect: false },
          { label: "Patch transdermique", isCorrect: false },
          { label: "Suppositoire", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle forme pharmaceutique est conçue pour une diffusion du médicament à travers la peau ?",
        explanation: "Le patch transdermique permet une diffusion prolongée du principe actif à travers la peau.",
        difficulty: 1,
        chapterCode: "FORMES_PHARMACEUTIQUES",
        chapterName: "Formes pharmaceutiques",
        choices: [
          { label: "Patch transdermique", isCorrect: true },
          { label: "Gélule", isCorrect: false },
          { label: "Perfusion", isCorrect: false },
          { label: "Sirop", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "SP",
    name: "Santé publique et épidémiologie",
    chapterCode: "EPIDEMIOLOGIE",
    chapterName: "Épidémiologie",
    chapters: [
      { code: "EPIDEMIOLOGIE", name: "Épidémiologie" },
      { code: "SANTE_PUBLIQUE", name: "Santé publique" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Quel indicateur correspond au nombre de nouveaux cas apparus pendant une période donnée ?",
        explanation: "L'incidence mesure l'apparition de nouveaux cas dans une population au cours d'une période.",
        difficulty: 1,
        chapterCode: "EPIDEMIOLOGIE",
        chapterName: "Épidémiologie",
        choices: [
          { label: "Incidence", isCorrect: true },
          { label: "Prévalence", isCorrect: false },
          { label: "Spécificité", isCorrect: false },
          { label: "Mortalité", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel indicateur mesure le nombre total de cas présents dans une population à un moment donné ?",
        explanation: "La prévalence correspond au nombre total de cas existants dans une population à un instant donné.",
        difficulty: 1,
        chapterCode: "EPIDEMIOLOGIE",
        chapterName: "Épidémiologie",
        choices: [
          { label: "Prévalence", isCorrect: true },
          { label: "Incidence", isCorrect: false },
          { label: "Létalité", isCorrect: false },
          { label: "Risque relatif", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel type d'étude suit des sujets dans le temps à partir de leur exposition ?",
        explanation: "Une étude de cohorte suit des sujets exposés ou non exposés au cours du temps.",
        difficulty: 2,
        chapterCode: "EPIDEMIOLOGIE",
        chapterName: "Épidémiologie",
        choices: [
          { label: "Étude de cohorte", isCorrect: true },
          { label: "Étude cas-témoins", isCorrect: false },
          { label: "Étude transversale", isCorrect: false },
          { label: "Série de cas", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel biais survient lorsque la population incluse n'est pas représentative de la population cible ?",
        explanation: "Le biais de sélection apparaît lorsque les sujets inclus diffèrent de façon systématique de la population cible.",
        difficulty: 2,
        chapterCode: "EPIDEMIOLOGIE",
        chapterName: "Épidémiologie",
        choices: [
          { label: "Biais de sélection", isCorrect: true },
          { label: "Biais d'information", isCorrect: false },
          { label: "Biais de confusion", isCorrect: false },
          { label: "Biais de mémorisation", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Que mesure la sensibilité d'un test diagnostique ?",
        explanation: "La sensibilité correspond à la capacité d'un test à détecter les sujets réellement malades.",
        difficulty: 2,
        chapterCode: "EPIDEMIOLOGIE",
        chapterName: "Épidémiologie",
        choices: [
          { label: "La capacité à détecter les malades", isCorrect: true },
          { label: "La capacité à exclure les non malades", isCorrect: false },
          { label: "La fréquence de la maladie", isCorrect: false },
          { label: "Le coût du dépistage", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel organisme français élabore notamment des recommandations de bonne pratique ?",
        explanation: "La HAS participe à l'élaboration de recommandations de bonne pratique et à l'évaluation des stratégies de santé.",
        difficulty: 1,
        chapterCode: "SANTE_PUBLIQUE",
        chapterName: "Santé publique",
        choices: [
          { label: "HAS", isCorrect: true },
          { label: "CCNE", isCorrect: false },
          { label: "CROUS", isCorrect: false },
          { label: "URSSAF", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Comment appelle-t-on une action visant à éviter l'apparition d'une maladie ?",
        explanation: "La prévention primaire vise à empêcher la survenue de la maladie.",
        difficulty: 1,
        chapterCode: "SANTE_PUBLIQUE",
        chapterName: "Santé publique",
        choices: [
          { label: "Prévention primaire", isCorrect: true },
          { label: "Prévention secondaire", isCorrect: false },
          { label: "Prévention tertiaire", isCorrect: false },
          { label: "Prévention quaternaire", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Une mammographie de dépistage chez une personne asymptomatique relève surtout de quelle prévention ?",
        explanation: "Le dépistage vise à détecter précocement une maladie avant l'apparition de complications : il relève de la prévention secondaire.",
        difficulty: 2,
        chapterCode: "SANTE_PUBLIQUE",
        chapterName: "Santé publique",
        choices: [
          { label: "Prévention secondaire", isCorrect: true },
          { label: "Prévention primaire", isCorrect: false },
          { label: "Prévention tertiaire", isCorrect: false },
          { label: "Prévention quaternaire", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Comment appelle-t-on une infection acquise au cours d'une prise en charge dans un établissement de santé ?",
        explanation: "On parle d'infection associée aux soins, souvent appelée infection nosocomiale lorsqu'elle est acquise à l'hôpital.",
        difficulty: 1,
        chapterCode: "SANTE_PUBLIQUE",
        chapterName: "Santé publique",
        choices: [
          { label: "Infection nosocomiale", isCorrect: true },
          { label: "Infection zoonotique", isCorrect: false },
          { label: "Infection opportuniste", isCorrect: false },
          { label: "Infection congénitale", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel organisme régional pilote notamment la mise en oeuvre des politiques de santé dans les territoires ?",
        explanation: "Les ARS pilotent l'organisation territoriale de la santé à l'échelle régionale.",
        difficulty: 1,
        chapterCode: "SANTE_PUBLIQUE",
        chapterName: "Santé publique",
        choices: [
          { label: "ARS", isCorrect: true },
          { label: "ANSM", isCorrect: false },
          { label: "CNIL", isCorrect: false },
          { label: "CNRS", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Une maladie à déclaration obligatoire doit être :",
        explanation: "Certaines maladies doivent être signalées aux autorités sanitaires pour permettre la surveillance et la réponse de santé publique.",
        difficulty: 2,
        chapterCode: "SANTE_PUBLIQUE",
        chapterName: "Santé publique",
        choices: [
          { label: "Signalée aux autorités sanitaires", isCorrect: true },
          { label: "Uniquement notée dans le dossier sans autre démarche", isCorrect: false },
          { label: "Déclarée seulement au pharmacien", isCorrect: false },
          { label: "Toujours annoncée à l'employeur", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "HISTO_EMBRYO",
    name: "Histologie, embryologie et cytologie",
    chapterCode: "HISTOLOGIE_GENERALE",
    chapterName: "Histologie générale",
    chapters: [
      { code: "HISTOLOGIE_GENERALE", name: "Histologie générale" },
      { code: "EMBRYOLOGIE", name: "Embryologie" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Sur quelle structure repose un épithélium de revêtement ?",
        explanation: "Un épithélium de revêtement repose sur une lame basale qui le sépare du tissu conjonctif sous-jacent.",
        difficulty: 1,
        chapterCode: "HISTOLOGIE_GENERALE",
        chapterName: "Histologie générale",
        choices: [
          { label: "Lame basale", isCorrect: true },
          { label: "Sarcomère", isCorrect: false },
          { label: "Méninge", isCorrect: false },
          { label: "Endocarde", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel tissu est caractérisé par une matrice extracellulaire abondante ?",
        explanation: "Le tissu conjonctif se distingue par une matrice extracellulaire abondante par rapport au tissu épithélial.",
        difficulty: 1,
        chapterCode: "HISTOLOGIE_GENERALE",
        chapterName: "Histologie générale",
        choices: [
          { label: "Tissu conjonctif", isCorrect: true },
          { label: "Tissu épithélial", isCorrect: false },
          { label: "Tissu nerveux", isCorrect: false },
          { label: "Tissu musculaire cardiaque", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle cellule sanguine mature ne possède normalement pas de noyau ?",
        explanation: "L'érythrocyte mature humain a perdu son noyau, ce qui favorise le transport des gaz.",
        difficulty: 1,
        chapterCode: "HISTOLOGIE_GENERALE",
        chapterName: "Histologie générale",
        choices: [
          { label: "Érythrocyte", isCorrect: true },
          { label: "Lymphocyte", isCorrect: false },
          { label: "Monocyte", isCorrect: false },
          { label: "Fibroblaste", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel type de tissu musculaire est involontaire et présent dans la paroi des viscères ?",
        explanation: "Le muscle lisse est involontaire et se trouve notamment dans la paroi digestive ou vasculaire.",
        difficulty: 1,
        chapterCode: "HISTOLOGIE_GENERALE",
        chapterName: "Histologie générale",
        choices: [
          { label: "Muscle lisse", isCorrect: true },
          { label: "Muscle strié squelettique", isCorrect: false },
          { label: "Muscle cardiaque", isCorrect: false },
          { label: "Tissu conjonctif dense", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle cellule gliale est responsable de la myélinisation dans le système nerveux central ?",
        explanation: "Dans le système nerveux central, la myéline est produite par les oligodendrocytes.",
        difficulty: 2,
        chapterCode: "HISTOLOGIE_GENERALE",
        chapterName: "Histologie générale",
        choices: [
          { label: "Oligodendrocyte", isCorrect: true },
          { label: "Cellule de Schwann", isCorrect: false },
          { label: "Fibroblaste", isCorrect: false },
          { label: "Plaquette", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] En coloration HES, quelle structure apparaît classiquement bleu-violet avec l'hématoxyline ?",
        explanation: "L'hématoxyline colore surtout les structures basophiles, notamment les noyaux.",
        difficulty: 2,
        chapterCode: "HISTOLOGIE_GENERALE",
        chapterName: "Histologie générale",
        choices: [
          { label: "Les noyaux cellulaires", isCorrect: true },
          { label: "Les fibres de collagène", isCorrect: false },
          { label: "Les lipides neutres", isCorrect: false },
          { label: "Le mucus", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Où se déroule la spermatogenèse ?",
        explanation: "La spermatogenèse se déroule dans les tubes séminifères des testicules.",
        difficulty: 1,
        chapterCode: "EMBRYOLOGIE",
        chapterName: "Embryologie",
        choices: [
          { label: "Dans les tubes séminifères", isCorrect: true },
          { label: "Dans l'épididyme", isCorrect: false },
          { label: "Dans la prostate", isCorrect: false },
          { label: "Dans les vésicules séminales", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Comment s'appelle le stade embryonnaire qui s'implante dans l'utérus ?",
        explanation: "Le blastocyste est le stade qui s'implante dans l'endomètre lors de la nidation.",
        difficulty: 1,
        chapterCode: "EMBRYOLOGIE",
        chapterName: "Embryologie",
        choices: [
          { label: "Blastocyste", isCorrect: true },
          { label: "Zygote", isCorrect: false },
          { label: "Morula", isCorrect: false },
          { label: "Gamète", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle étape embryologique aboutit à la formation des trois feuillets embryonnaires ?",
        explanation: "La gastrulation conduit à la formation de l'ectoderme, du mésoderme et de l'endoderme.",
        difficulty: 1,
        chapterCode: "EMBRYOLOGIE",
        chapterName: "Embryologie",
        choices: [
          { label: "Gastrulation", isCorrect: true },
          { label: "Neurulation", isCorrect: false },
          { label: "Fécondation", isCorrect: false },
          { label: "Segmentation", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle structure se forme lors de la neurulation ?",
        explanation: "La neurulation conduit à la formation du tube neural, à l'origine du système nerveux central.",
        difficulty: 1,
        chapterCode: "EMBRYOLOGIE",
        chapterName: "Embryologie",
        choices: [
          { label: "Tube neural", isCorrect: true },
          { label: "Canal déférent", isCorrect: false },
          { label: "Canal thoracique", isCorrect: false },
          { label: "Sinus veineux", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel est le rôle principal du placenta ?",
        explanation: "Le placenta assure les échanges entre la mère et le fœtus, notamment pour les gaz et les nutriments.",
        difficulty: 1,
        chapterCode: "EMBRYOLOGIE",
        chapterName: "Embryologie",
        choices: [
          { label: "Assurer les échanges mère-fœtus", isCorrect: true },
          { label: "Produire les gamètes", isCorrect: false },
          { label: "Former la moelle osseuse", isCorrect: false },
          { label: "Remplacer le cordon ombilical", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Comment appelle-t-on un agent susceptible d'induire une malformation pendant le développement embryonnaire ?",
        explanation: "Un agent tératogène peut perturber le développement embryonnaire et favoriser des malformations.",
        difficulty: 2,
        chapterCode: "EMBRYOLOGIE",
        chapterName: "Embryologie",
        choices: [
          { label: "Tératogène", isCorrect: true },
          { label: "Mitogène", isCorrect: false },
          { label: "Anticoagulant", isCorrect: false },
          { label: "Anabolisant", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "PHYS_BIOPHYS",
    name: "Physique / Biophysique",
    chapterCode: "PHYSIQUE_GENERALE",
    chapterName: "Physique générale",
    chapters: [
      { code: "PHYSIQUE_GENERALE", name: "Physique générale" },
      { code: "RAYONNEMENTS", name: "Rayonnements et radioactivité" },
      { code: "BIOPHYSIQUE", name: "Biophysique" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Dans la loi de Poiseuille, quelle grandeur influence très fortement le débit d'un fluide dans un tube ?",
        explanation: "Dans la loi de Poiseuille, le rayon intervient à la puissance 4 : une petite variation du rayon modifie fortement le débit.",
        difficulty: 2,
        chapterCode: "PHYSIQUE_GENERALE",
        chapterName: "Physique générale",
        choices: [
          { label: "Le rayon du tube", isCorrect: true },
          { label: "La couleur du fluide", isCorrect: false },
          { label: "Le nombre de globules rouges", isCorrect: false },
          { label: "La masse du patient", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle unité du Système international correspond à la pression ?",
        explanation: "La pression s'exprime en pascals dans le Système international.",
        difficulty: 1,
        chapterCode: "PHYSIQUE_GENERALE",
        chapterName: "Physique générale",
        choices: [
          { label: "Pascal", isCorrect: true },
          { label: "Watt", isCorrect: false },
          { label: "Joule", isCorrect: false },
          { label: "Volt", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle relation traduit la loi d'Ohm pour un conducteur ohmique ?",
        explanation: "La loi d'Ohm relie la tension, la résistance et l'intensité par U = R × I.",
        difficulty: 1,
        chapterCode: "PHYSIQUE_GENERALE",
        chapterName: "Physique générale",
        choices: [
          { label: "U = R × I", isCorrect: true },
          { label: "P = m × g", isCorrect: false },
          { label: "E = m × c²", isCorrect: false },
          { label: "F = m × a²", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Une lentille convergente est utilisée pour :",
        explanation: "Une lentille convergente fait converger les rayons lumineux et peut former une image réelle.",
        difficulty: 2,
        chapterCode: "PHYSIQUE_GENERALE",
        chapterName: "Physique générale",
        choices: [
          { label: "Faire converger les rayons lumineux", isCorrect: true },
          { label: "Créer un rayonnement gamma", isCorrect: false },
          { label: "Mesurer une pression artérielle", isCorrect: false },
          { label: "Empêcher toute réfraction", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel rayonnement correspond à une onde électromagnétique très énergétique utilisée en radiographie ?",
        explanation: "Les rayons X sont des ondes électromagnétiques de haute énergie utilisées en imagerie médicale.",
        difficulty: 1,
        chapterCode: "RAYONNEMENTS",
        chapterName: "Rayonnements et radioactivité",
        choices: [
          { label: "Rayons X", isCorrect: true },
          { label: "Ondes sonores", isCorrect: false },
          { label: "Courant continu", isCorrect: false },
          { label: "Lumière infrarouge uniquement", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Que représente la demi-vie d'un radionucléide ?",
        explanation: "La demi-vie correspond au temps nécessaire pour que l'activité ou le nombre de noyaux radioactifs soit divisé par deux.",
        difficulty: 2,
        chapterCode: "RAYONNEMENTS",
        chapterName: "Rayonnements et radioactivité",
        choices: [
          { label: "Le temps nécessaire pour diviser l'activité par deux", isCorrect: true },
          { label: "Le temps nécessaire pour doubler la masse", isCorrect: false },
          { label: "Le temps nécessaire pour stériliser un bloc", isCorrect: false },
          { label: "Le temps nécessaire pour refroidir un tissu", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle unité prend en compte l'effet biologique des rayonnements sur l'organisme ?",
        explanation: "Le sievert tient compte de l'effet biologique des rayonnements, contrairement au gray qui exprime la dose absorbée.",
        difficulty: 2,
        chapterCode: "RAYONNEMENTS",
        chapterName: "Rayonnements et radioactivité",
        choices: [
          { label: "Sievert", isCorrect: true },
          { label: "Pascal", isCorrect: false },
          { label: "Litre", isCorrect: false },
          { label: "Newton", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle technique d'imagerie repose sur l'utilisation d'ultrasons ?",
        explanation: "L'échographie utilise des ultrasons réfléchis par les tissus pour produire une image.",
        difficulty: 1,
        chapterCode: "RAYONNEMENTS",
        chapterName: "Rayonnements et radioactivité",
        choices: [
          { label: "Échographie", isCorrect: true },
          { label: "Radiothérapie", isCorrect: false },
          { label: "Scintigraphie", isCorrect: false },
          { label: "Scanner injecté uniquement", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Au repos, l'intérieur de la cellule excitable est le plus souvent :",
        explanation: "Au repos, l'intérieur de la cellule est négatif par rapport au milieu extracellulaire.",
        difficulty: 1,
        chapterCode: "BIOPHYSIQUE",
        chapterName: "Biophysique",
        choices: [
          { label: "Négatif par rapport à l'extérieur", isCorrect: true },
          { label: "Toujours positif", isCorrect: false },
          { label: "Strictement neutre", isCorrect: false },
          { label: "Toujours identique au milieu extérieur", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Lors du début d'un potentiel d'action neuronal, quel ion entre massivement dans la cellule ?",
        explanation: "La dépolarisation initiale du potentiel d'action est principalement liée à une entrée de sodium.",
        difficulty: 2,
        chapterCode: "BIOPHYSIQUE",
        chapterName: "Biophysique",
        choices: [
          { label: "Sodium", isCorrect: true },
          { label: "Calcium uniquement extracellulaire", isCorrect: false },
          { label: "Chlore", isCorrect: false },
          { label: "Hélium", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] À quoi correspond le débit cardiaque en physiologie ?",
        explanation: "Le débit cardiaque correspond au volume éjecté par minute, soit fréquence cardiaque × volume d'éjection systolique.",
        difficulty: 2,
        chapterCode: "BIOPHYSIQUE",
        chapterName: "Biophysique",
        choices: [
          { label: "Fréquence cardiaque × volume d'éjection systolique", isCorrect: true },
          { label: "Pression systolique + pression diastolique", isCorrect: false },
          { label: "Volume pulmonaire × fréquence respiratoire", isCorrect: false },
          { label: "Vitesse du sang dans une seule veine", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] En acoustique, le décibel sert principalement à exprimer :",
        explanation: "Le décibel exprime un niveau sonore, c'est-à-dire une intensité perçue selon une échelle logarithmique.",
        difficulty: 1,
        chapterCode: "BIOPHYSIQUE",
        chapterName: "Biophysique",
        choices: [
          { label: "Le niveau sonore", isCorrect: true },
          { label: "La fréquence cardiaque", isCorrect: false },
          { label: "La température corporelle", isCorrect: false },
          { label: "La glycémie", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "SHS_ETHIQUE",
    name: "Sciences humaines et sociales / Éthique",
    chapterCode: "PSYCHOLOGIE",
    chapterName: "Psychologie",
    chapters: [
      { code: "PSYCHOLOGIE", name: "Psychologie" },
      { code: "SOCIOLOGIE_SANTE", name: "Sociologie de la santé" },
      { code: "DROIT_MEDICAL", name: "Droit médical et déontologie" },
      { code: "ETHIQUE_MEDICALE", name: "Éthique médicale" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Quelle notion est centrale dans l'écoute active en santé ?",
        explanation: "L'écoute active repose notamment sur l'attention portée au patient et la reformulation de ses propos.",
        difficulty: 1,
        chapterCode: "PSYCHOLOGIE",
        chapterName: "Psychologie",
        choices: [
          { label: "La reformulation", isCorrect: true },
          { label: "L'interruption systématique", isCorrect: false },
          { label: "La minimisation des émotions", isCorrect: false },
          { label: "Le jargon technique permanent", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Dans la psychologie du développement, à qui associe-t-on les stades du développement cognitif ?",
        explanation: "Les stades du développement cognitif sont classiquement associés à Jean Piaget.",
        difficulty: 1,
        chapterCode: "PSYCHOLOGIE",
        chapterName: "Psychologie",
        choices: [
          { label: "Piaget", isCorrect: true },
          { label: "Pasteur", isCorrect: false },
          { label: "Descartes", isCorrect: false },
          { label: "Claude Bernard", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel type de facteur fait partie des déterminants sociaux de la santé ?",
        explanation: "Le niveau de vie, les conditions de logement ou d'éducation font partie des déterminants sociaux de la santé.",
        difficulty: 1,
        chapterCode: "SOCIOLOGIE_SANTE",
        chapterName: "Sociologie de la santé",
        choices: [
          { label: "Les conditions de vie", isCorrect: true },
          { label: "Le groupe sanguin seulement", isCorrect: false },
          { label: "La couleur des yeux", isCorrect: false },
          { label: "Le signe astrologique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] En droit médical, le consentement éclairé suppose avant tout que le patient ait reçu :",
        explanation: "Le consentement éclairé implique une information loyale, claire et appropriée avant la décision du patient.",
        difficulty: 2,
        chapterCode: "DROIT_MEDICAL",
        chapterName: "Droit médical et déontologie",
        choices: [
          { label: "Une information claire et adaptée", isCorrect: true },
          { label: "Une promesse de guérison", isCorrect: false },
          { label: "Un accès direct au bloc opératoire", isCorrect: false },
          { label: "Une autorisation de l'employeur", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Le secret médical concerne principalement :",
        explanation: "Le secret médical protège les informations concernant la personne prise en charge.",
        difficulty: 1,
        chapterCode: "DROIT_MEDICAL",
        chapterName: "Droit médical et déontologie",
        choices: [
          { label: "Les informations de santé du patient", isCorrect: true },
          { label: "Uniquement les résultats biologiques", isCorrect: false },
          { label: "Seulement les prescriptions hospitalières", isCorrect: false },
          { label: "Uniquement les actes chirurgicaux", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel texte international encadre l'éthique de la recherche clinique chez l'humain ?",
        explanation: "La déclaration d'Helsinki constitue un texte de référence pour l'éthique de la recherche clinique.",
        difficulty: 2,
        chapterCode: "ETHIQUE_MEDICALE",
        chapterName: "Éthique médicale",
        choices: [
          { label: "La déclaration d'Helsinki", isCorrect: true },
          { label: "Le serment d'Hippocrate uniquement", isCorrect: false },
          { label: "Le code civil seulement", isCorrect: false },
          { label: "La loi des gaz parfaits", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Parmi les quatre grands principes de l'éthique médicale, lequel consiste à respecter la capacité du patient à décider pour lui-même ?",
        explanation: "Le principe d'autonomie reconnaît au patient la capacité de participer aux décisions qui le concernent.",
        difficulty: 2,
        chapterCode: "ETHIQUE_MEDICALE",
        chapterName: "Éthique médicale",
        choices: [
          { label: "Autonomie", isCorrect: true },
          { label: "Justice", isCorrect: false },
          { label: "Non-malfaisance", isCorrect: false },
          { label: "Bienfaisance uniquement envers l'équipe", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel comité français est notamment consulté sur les grandes questions de bioéthique ?",
        explanation: "Le CCNE est le Comité consultatif national d'éthique pour les sciences de la vie et de la santé.",
        difficulty: 2,
        chapterCode: "ETHIQUE_MEDICALE",
        chapterName: "Éthique médicale",
        choices: [
          { label: "CCNE", isCorrect: true },
          { label: "ANSM", isCorrect: false },
          { label: "CAF", isCorrect: false },
          { label: "CROUS", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "MATH_BIOSTAT",
    name: "Mathématiques et biostatistiques",
    chapterCode: "MATHS",
    chapterName: "Mathématiques",
    chapters: [
      { code: "MATHS", name: "Mathématiques" },
      { code: "STATS_DESCRIPTIVES", name: "Statistiques descriptives" },
      { code: "PROBABILITES", name: "Probabilités" },
      { code: "TESTS_STATISTIQUES", name: "Tests statistiques" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Quelle fonction est l'inverse de la fonction exponentielle ?",
        explanation: "Le logarithme népérien est la fonction réciproque de l'exponentielle.",
        difficulty: 1,
        chapterCode: "MATHS",
        chapterName: "Mathématiques",
        choices: [
          { label: "Le logarithme", isCorrect: true },
          { label: "La dérivée seconde", isCorrect: false },
          { label: "La valeur absolue", isCorrect: false },
          { label: "La médiane", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] La dérivée de exp(x) est :",
        explanation: "La fonction exponentielle a la particularité d'être sa propre dérivée.",
        difficulty: 1,
        chapterCode: "MATHS",
        chapterName: "Mathématiques",
        choices: [
          { label: "exp(x)", isCorrect: true },
          { label: "x × exp(x)", isCorrect: false },
          { label: "1 / x", isCorrect: false },
          { label: "0", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel indicateur est sensible aux valeurs extrêmes dans une série quantitative ?",
        explanation: "La moyenne est influencée par les valeurs extrêmes, contrairement à la médiane qui y est plus robuste.",
        difficulty: 2,
        chapterCode: "STATS_DESCRIPTIVES",
        chapterName: "Statistiques descriptives",
        choices: [
          { label: "La moyenne", isCorrect: true },
          { label: "La médiane uniquement", isCorrect: false },
          { label: "Le mode uniquement", isCorrect: false },
          { label: "Le rang", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel indicateur décrit la dispersion autour de la moyenne ?",
        explanation: "L'écart-type mesure la dispersion des valeurs autour de la moyenne.",
        difficulty: 1,
        chapterCode: "STATS_DESCRIPTIVES",
        chapterName: "Statistiques descriptives",
        choices: [
          { label: "L'écart-type", isCorrect: true },
          { label: "La médiane", isCorrect: false },
          { label: "Le mode", isCorrect: false },
          { label: "Le percentile 50", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] La probabilité d'un événement impossible est égale à :",
        explanation: "Par définition, un événement impossible a une probabilité nulle.",
        difficulty: 1,
        chapterCode: "PROBABILITES",
        chapterName: "Probabilités",
        choices: [
          { label: "0", isCorrect: true },
          { label: "0,5", isCorrect: false },
          { label: "1", isCorrect: false },
          { label: "-1", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle loi de probabilité est classiquement utilisée pour modéliser un grand nombre de phénomènes biologiques continus ?",
        explanation: "La loi normale est une loi continue très utilisée en statistique biomédicale.",
        difficulty: 1,
        chapterCode: "PROBABILITES",
        chapterName: "Probabilités",
        choices: [
          { label: "La loi normale", isCorrect: true },
          { label: "La loi des mailles", isCorrect: false },
          { label: "La loi de Hooke", isCorrect: false },
          { label: "La loi de Poiseuille", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Un intervalle de confiance à 95 % donne une estimation :",
        explanation: "L'intervalle de confiance fournit une plage plausible pour la valeur du paramètre estimé.",
        difficulty: 2,
        chapterCode: "TESTS_STATISTIQUES",
        chapterName: "Tests statistiques",
        choices: [
          { label: "De la plage plausible du paramètre", isCorrect: true },
          { label: "De la valeur certaine et exacte du paramètre", isCorrect: false },
          { label: "Du nombre de sujets inclus", isCorrect: false },
          { label: "De la sensibilité d'un examen clinique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel test est classiquement utilisé pour comparer deux variables qualitatives ?",
        explanation: "Le test du Chi² est utilisé pour étudier l'association entre variables qualitatives.",
        difficulty: 2,
        chapterCode: "TESTS_STATISTIQUES",
        chapterName: "Tests statistiques",
        choices: [
          { label: "Chi²", isCorrect: true },
          { label: "Test t de Student", isCorrect: false },
          { label: "ANOVA uniquement", isCorrect: false },
          { label: "Régression de Cox", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Dans beaucoup d'études biomédicales, une p-valeur inférieure à 0,05 est traditionnellement considérée comme :",
        explanation: "Par convention, une p-valeur inférieure à 0,05 est souvent interprétée comme statistiquement significative.",
        difficulty: 2,
        chapterCode: "TESTS_STATISTIQUES",
        chapterName: "Tests statistiques",
        choices: [
          { label: "Statistiquement significative", isCorrect: true },
          { label: "Cliniquement toujours majeure", isCorrect: false },
          { label: "Forcément fausse", isCorrect: false },
          { label: "Synonyme d'absence de biais", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "ANGLAIS_MED",
    name: "Anglais médical et scientifique",
    chapterCode: "ANGLAIS_MEDICAL",
    chapterName: "Anglais médical et scientifique",
    chapters: [
      { code: "ANGLAIS_MEDICAL", name: "Anglais médical et scientifique" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Comment dit-on « douleur thoracique » en anglais médical ?",
        explanation: "Le terme usuel est chest pain.",
        difficulty: 1,
        chapterCode: "ANGLAIS_MEDICAL",
        chapterName: "Anglais médical et scientifique",
        choices: [
          { label: "Chest pain", isCorrect: true },
          { label: "Head injury", isCorrect: false },
          { label: "Short stature", isCorrect: false },
          { label: "Skin rash", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Comment traduit-on « essoufflement » dans un contexte médical ?",
        explanation: "L'essoufflement se traduit classiquement par shortness of breath ou dyspnea.",
        difficulty: 1,
        chapterCode: "ANGLAIS_MEDICAL",
        chapterName: "Anglais médical et scientifique",
        choices: [
          { label: "Shortness of breath", isCorrect: true },
          { label: "Broken skin", isCorrect: false },
          { label: "Sore hand", isCorrect: false },
          { label: "Slow digestion", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Dans un article scientifique, le mot « abstract » désigne :",
        explanation: "L'abstract correspond au résumé d'un article scientifique.",
        difficulty: 1,
        chapterCode: "ANGLAIS_MEDICAL",
        chapterName: "Anglais médical et scientifique",
        choices: [
          { label: "Le résumé", isCorrect: true },
          { label: "La bibliographie", isCorrect: false },
          { label: "Le tableau des résultats uniquement", isCorrect: false },
          { label: "L'autorisation éthique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Que signifie l'acronyme « BP » dans un contexte médical anglophone ?",
        explanation: "BP signifie blood pressure, c'est-à-dire la pression artérielle.",
        difficulty: 1,
        chapterCode: "ANGLAIS_MEDICAL",
        chapterName: "Anglais médical et scientifique",
        choices: [
          { label: "Blood pressure", isCorrect: true },
          { label: "Body pain", isCorrect: false },
          { label: "Blood pulse", isCorrect: false },
          { label: "Breathing pattern", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Comment dit-on « ordonnance » en anglais médical courant ?",
        explanation: "Le mot prescription désigne l'ordonnance médicale.",
        difficulty: 1,
        chapterCode: "ANGLAIS_MEDICAL",
        chapterName: "Anglais médical et scientifique",
        choices: [
          { label: "Prescription", isCorrect: true },
          { label: "Injection", isCorrect: false },
          { label: "Diagnosis", isCorrect: false },
          { label: "Ward", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Le terme anglais « caregiver » renvoie le plus souvent à :",
        explanation: "Caregiver désigne la personne qui prend soin d'un malade, professionnel ou aidant selon le contexte.",
        difficulty: 2,
        chapterCode: "ANGLAIS_MEDICAL",
        chapterName: "Anglais médical et scientifique",
        choices: [
          { label: "Une personne qui prend soin du patient", isCorrect: true },
          { label: "Un appareil de monitorage", isCorrect: false },
          { label: "Un type de médicament", isCorrect: false },
          { label: "Une analyse biologique", isCorrect: false }
        ]
      }
    ]
  },
  {
    code: "METIERS_SANTE",
    name: "Métiers de la santé et projet professionnel",
    chapterCode: "PROJET_PRO",
    chapterName: "Métiers de la santé et projet professionnel",
    chapters: [
      { code: "PROJET_PRO", name: "Métiers de la santé et projet professionnel" }
    ],
    questions: [
      {
        type: "single_choice",
        prompt: "[Demo] Dans l'acronyme MMOPK, la lettre P correspond à :",
        explanation: "Dans MMOPK, P correspond à pharmacie.",
        difficulty: 1,
        chapterCode: "PROJET_PRO",
        chapterName: "Métiers de la santé et projet professionnel",
        choices: [
          { label: "Pharmacie", isCorrect: true },
          { label: "Psychologie", isCorrect: false },
          { label: "Pédiatrie", isCorrect: false },
          { label: "Physique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle filière est centrée sur la santé bucco-dentaire ?",
        explanation: "L'odontologie correspond à la chirurgie dentaire et à la santé bucco-dentaire.",
        difficulty: 1,
        chapterCode: "PROJET_PRO",
        chapterName: "Métiers de la santé et projet professionnel",
        choices: [
          { label: "Odontologie", isCorrect: true },
          { label: "Maïeutique", isCorrect: false },
          { label: "Kinésithérapie", isCorrect: false },
          { label: "Pharmacie", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quelle filière prépare spécifiquement au métier de sage-femme ?",
        explanation: "La maïeutique prépare au métier de sage-femme.",
        difficulty: 1,
        chapterCode: "PROJET_PRO",
        chapterName: "Métiers de la santé et projet professionnel",
        choices: [
          { label: "Maïeutique", isCorrect: true },
          { label: "Médecine", isCorrect: false },
          { label: "Odontologie", isCorrect: false },
          { label: "Pharmacie", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Le stage d'initiation aux soins infirmiers concerne classiquement les admis en :",
        explanation: "Ce stage est classiquement requis au début du cursus pour les admis en médecine et en odontologie.",
        difficulty: 2,
        chapterCode: "PROJET_PRO",
        chapterName: "Métiers de la santé et projet professionnel",
        choices: [
          { label: "Médecine et odontologie", isCorrect: true },
          { label: "Uniquement pharmacie", isCorrect: false },
          { label: "Uniquement kinésithérapie", isCorrect: false },
          { label: "Aucune filière de santé", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Quel type de structure correspond à un exercice hors hôpital, en cabinet par exemple ?",
        explanation: "On parle d'exercice libéral lorsqu'un professionnel travaille en cabinet ou hors structure hospitalière.",
        difficulty: 1,
        chapterCode: "PROJET_PRO",
        chapterName: "Métiers de la santé et projet professionnel",
        choices: [
          { label: "Exercice libéral", isCorrect: true },
          { label: "Exercice universitaire uniquement", isCorrect: false },
          { label: "Exercice carcéral", isCorrect: false },
          { label: "Exercice théorique", isCorrect: false }
        ]
      },
      {
        type: "single_choice",
        prompt: "[Demo] Lors des épreuves orales, quelle compétence transversale est particulièrement attendue ?",
        explanation: "Les oraux valorisent notamment la communication, l'écoute et la capacité à argumenter clairement.",
        difficulty: 1,
        chapterCode: "PROJET_PRO",
        chapterName: "Métiers de la santé et projet professionnel",
        choices: [
          { label: "La communication", isCorrect: true },
          { label: "La mémorisation brute sans interaction", isCorrect: false },
          { label: "Le calcul de dérivées complexes", isCorrect: false },
          { label: "La seule rapidité d'écriture", isCorrect: false }
        ]
      }
    ]
  }
];

@Injectable()
export class DemoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly duelsService: DuelsService
  ) {}

  async ensureDemoCatalog(createdByUserId: string) {
    const before = await this.getCatalogStats();
    const openTextSupported = await this.hasTable("question_open_text_answers");
    let insertedCount = 0;

    await this.db.withTransaction(async (client) => {
      for (let idx = 0; idx < DEMO_SUBJECTS.length; idx += 1) {
        insertedCount += await this.seedSubjectCatalog(
          client,
          DEMO_SUBJECTS[idx],
          idx,
          createdByUserId,
          openTextSupported
        );
      }
    });

    const after = await this.getCatalogStats();
    return {
      seeded: insertedCount > 0,
      insertedCount,
      openTextSupported,
      ...after
    };
  }

  async simulateOpponentTurn(userId: string, duelId: string) {
    const duel = await this.duelsService.getDuel(userId, duelId);

    if (duel.status !== "in_progress") {
      throw new UnprocessableEntityException({
        code: "DEMO_DUEL_NOT_ACTIVE",
        message: "Le duel n'est pas actif"
      });
    }

    if (!duel.currentTurnUserId) {
      throw new UnprocessableEntityException({
        code: "DEMO_DUEL_NO_CURRENT_TURN",
        message: "Aucun tour adverse à simuler"
      });
    }

    if (duel.currentTurnUserId === userId) {
      throw new UnprocessableEntityException({
        code: "DEMO_DUEL_ALREADY_YOUR_TURN",
        message: "C'est déjà ton tour"
      });
    }

    const opponentUserId = duel.currentTurnUserId;
    let round = await this.duelsService.getCurrentRound(opponentUserId, duelId);
    let chosenSubjectId = round.chosenSubjectId ?? null;

    if (!chosenSubjectId) {
      const fallbackSubject = round.offeredSubjects[0];
      if (!fallbackSubject) {
        throw new UnprocessableEntityException({
          code: "DEMO_DUEL_NO_SUBJECTS_OFFERED",
          message: "Aucune matière proposée pour simuler ce tour"
        });
      }

      await this.duelsService.chooseRoundSubject(opponentUserId, duelId, round.roundNo, {
        subjectId: fallbackSubject.id
      });
      chosenSubjectId = fallbackSubject.id;
      round = await this.duelsService.getCurrentRound(opponentUserId, duelId);
    }

    const answeredSlotRows = await this.db.query<{ slot_no: number }>(
      `
        SELECT da.slot_no
        FROM duel_answers da
        JOIN duel_rounds dr ON dr.id = da.duel_round_id
        WHERE da.duel_id = $1
          AND da.user_id = $2
          AND dr.round_no = $3
      `,
      [duelId, opponentUserId, round.roundNo]
    );
    const answeredSlots = new Set(answeredSlotRows.rows.map((row) => Number(row.slot_no)));

    const questions = await this.duelsService.getRoundQuestions(opponentUserId, duelId, round.roundNo);
    let playedQuestions = 0;

    for (const item of questions) {
      if (answeredSlots.has(Number(item.slotNo))) {
        continue;
      }

      const choice = Array.isArray(item.question?.choices) ? item.question.choices[0] : null;
      if (!choice) {
        throw new UnprocessableEntityException({
          code: "DEMO_DUEL_NO_CHOICES",
          message: "Une question duel n'a pas de choix disponibles"
        });
      }

      await this.duelsService.submitRoundAnswer(opponentUserId, duelId, round.roundNo, {
        slotNo: Number(item.slotNo),
        questionId: item.question.id,
        selectedChoiceId: choice.id,
        responseTimeMs: 1200 + Number(item.slotNo) * 250
      });
      playedQuestions += 1;
    }

    return {
      duel: await this.duelsService.getDuel(userId, duelId),
      simulatedUserId: opponentUserId,
      roundNo: round.roundNo,
      chosenSubjectId,
      playedQuestions
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
    createdByUserId: string,
    openTextSupported: boolean
  ): Promise<number> {
    const subjectId = await this.upsertSubject(client, subject, index);
    const chapterIds = new Map<string, string>();
    const chapterSortOrders = new Map(subject.chapters.map((chapter, chapterIndex) => [chapter.code, chapterIndex + 1]));
    let insertedCount = 0;

    for (const question of subject.questions) {
      if (question.type === "open_text" && !openTextSupported) {
        continue;
      }
      const chapterCode = question.chapterCode ?? subject.chapterCode;
      const chapterName = question.chapterName ?? subject.chapterName;
      const chapterKey = `${chapterCode}::${chapterName}`;
      let chapterId = chapterIds.get(chapterKey);
      if (!chapterId) {
        const chapterSortOrder = chapterSortOrders.get(chapterCode) ?? chapterIds.size + 1;
        chapterId = await this.upsertChapter(client, subjectId, chapterCode, chapterName, chapterSortOrder);
        chapterIds.set(chapterKey, chapterId);
      }
      if (
        await this.insertQuestion(
          client,
          subjectId,
          chapterId,
          question,
          createdByUserId,
          openTextSupported
        )
      ) {
        insertedCount += 1;
      }
    }

    await this.deactivateMissingChapters(
      client,
      subjectId,
      subject.chapters.map((chapter) => chapter.code)
    );

    return insertedCount;
  }

  private async hasTable(tableName: string): Promise<boolean> {
    const result = await this.db.query<{ exists: string | null }>(
      `
        SELECT to_regclass($1) AS exists
      `,
      [`public.${tableName}`]
    );
    return Boolean(result.rows[0]?.exists);
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
    chapterCode: string,
    chapterName: string,
    sortOrder: number
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `
        INSERT INTO chapters (id, subject_id, code, name, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (subject_id, code)
        DO UPDATE
        SET
          name = EXCLUDED.name,
          sort_order = EXCLUDED.sort_order,
          is_active = TRUE
        RETURNING id
      `,
      [randomUUID(), subjectId, chapterCode, chapterName, sortOrder]
    );

    return result.rows[0].id;
  }

  private async deactivateMissingChapters(
    client: PoolClient,
    subjectId: string,
    activeChapterCodes: string[]
  ): Promise<void> {
    await client.query(
      `
        UPDATE chapters
        SET is_active = FALSE
        WHERE subject_id = $1
          AND NOT (code = ANY($2::text[]))
      `,
      [subjectId, activeChapterCodes]
    );
  }

  private async insertQuestion(
    client: PoolClient,
    subjectId: string,
    chapterId: string,
    question: DemoQuestionSeed,
    createdByUserId: string,
    openTextSupported: boolean
  ): Promise<boolean> {
    const promptCandidates = [question.prompt, ...(question.legacyPrompts ?? [])];
    const existing = await client.query<{ id: string }>(
      `
        SELECT id
        FROM questions
        WHERE prompt = ANY($1::text[])
        LIMIT 1
      `,
      [promptCandidates]
    );

    if (existing.rowCount > 0) {
      const questionId = existing.rows[0].id;
      await client.query(
        `
          UPDATE questions
          SET
            subject_id = $2,
            chapter_id = $3,
            question_type = $4,
            prompt = $5,
            explanation = $6,
            difficulty = $7,
            status = 'draft'
          WHERE id = $1
        `,
        [
          questionId,
          subjectId,
          chapterId,
          question.type,
          question.prompt,
          question.explanation,
          question.difficulty
        ]
      );
      await this.syncQuestionContent(client, questionId, question, openTextSupported);
      await client.query(
        `
          UPDATE questions
          SET
            status = 'published',
            published_at = COALESCE(published_at, NOW())
          WHERE id = $1
        `,
        [questionId]
      );
      return false;
    }

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

    await this.syncQuestionContent(client, questionId, question, openTextSupported);

    await client.query(
      `
        UPDATE questions
        SET status = 'published',
            published_at = NOW()
        WHERE id = $1
      `,
      [questionId]
    );

    return true;
  }

  private async syncQuestionContent(
    client: PoolClient,
    questionId: string,
    question: DemoQuestionSeed,
    openTextSupported: boolean
  ): Promise<void> {
    if (openTextSupported) {
      await client.query(
        `
          DELETE FROM question_open_text_answers
          WHERE question_id = $1
        `,
        [questionId]
      );
    }

    if (question.type === "open_text") {
      const normalizedAnswers = new Set<string>();
      for (const acceptedAnswer of question.acceptedAnswers) {
        const normalizedAnswer = this.normalizeOpenTextValue(acceptedAnswer);
        if (!normalizedAnswer || normalizedAnswers.has(normalizedAnswer)) {
          continue;
        }
        normalizedAnswers.add(normalizedAnswer);
        await client.query(
          `
            INSERT INTO question_open_text_answers
              (id, question_id, accepted_answer_text, normalized_answer_text)
            VALUES
              ($1, $2, $3, $4)
            ON CONFLICT (question_id, normalized_answer_text) DO NOTHING
          `,
          [randomUUID(), questionId, acceptedAnswer, normalizedAnswer]
        );
      }
      return;
    }

    const existingChoices = await client.query<{ id: string; position: number }>(
      `
        SELECT id, position
        FROM question_choices
        WHERE question_id = $1
        ORDER BY position ASC
      `,
      [questionId]
    );

    for (let position = 0; position < question.choices.length; position += 1) {
      const choice = question.choices[position];
      const current = existingChoices.rows[position];

      if (current) {
        await client.query(
          `
            UPDATE question_choices
            SET label = $2,
                position = $3,
                is_correct = $4
            WHERE id = $1
          `,
          [current.id, choice.label, position + 1, choice.isCorrect]
        );
        continue;
      }

      await client.query(
        `
          INSERT INTO question_choices (id, question_id, label, position, is_correct)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [randomUUID(), questionId, choice.label, position + 1, choice.isCorrect]
      );
    }
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
