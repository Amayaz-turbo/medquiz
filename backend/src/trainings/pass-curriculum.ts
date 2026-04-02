export type PassCurriculumChapter = {
  code: string;
  label: string;
  topics: string[];
};

export type PassCurriculumSubject = {
  code: string;
  label: string;
  chapters: PassCurriculumChapter[];
};

export const PASS_CURRICULUM: PassCurriculumSubject[] = [
  {
    code: "CHEM_BIOC",
    label: "Chimie générale et organique / Biochimie",
    chapters: [
      {
        code: "CHEM_GENERAL",
        label: "Chimie générale",
        topics: [
          "Structure atomique et tableau périodique",
          "Liaisons chimiques",
          "Stéréochimie",
          "Réactions acido-basiques, pH, pKa, tampons biologiques",
          "Thermodynamique chimique",
          "Cinétique chimique et ordre de réaction",
          "Oxydoréduction et potentiels redox"
        ]
      },
      {
        code: "CHEM_ORGA",
        label: "Chimie organique",
        topics: [
          "Fonctions chimiques",
          "Mécanismes réactionnels",
          "Glucides",
          "Lipides",
          "Acides aminés",
          "Peptides et protéines"
        ]
      },
      {
        code: "BIOCHIMIE",
        label: "Biochimie",
        topics: [
          "Enzymologie",
          "Métabolisme glucidique",
          "Cycle de Krebs",
          "Chaîne respiratoire mitochondriale et phosphorylation oxydative",
          "Bêta-oxydation des acides gras",
          "Biosynthèse des lipides",
          "Métabolisme des acides aminés",
          "Outils et méthodes d'analyse biochimique"
        ]
      }
    ]
  },
  {
    code: "BCMG",
    label: "Biologie cellulaire et moléculaire / Génétique",
    chapters: [
      {
        code: "BIOLOGIE_CELLULAIRE",
        label: "Biologie cellulaire",
        topics: [
          "Structure de la cellule procaryote vs eucaryote",
          "Membrane plasmique",
          "Organites",
          "Cytosquelette",
          "Cycle cellulaire",
          "Mitose et méiose",
          "Mort cellulaire"
        ]
      },
      {
        code: "BIOLOGIE_MOLECULAIRE",
        label: "Biologie moléculaire",
        topics: [
          "Structure de l'ADN et de l'ARN",
          "Réplication de l'ADN",
          "Transcription",
          "Traduction",
          "Régulation de l'expression génique",
          "Mutations et réparation de l'ADN",
          "Techniques de biologie moléculaire"
        ]
      },
      {
        code: "GENETIQUE",
        label: "Génétique",
        topics: [
          "Hérédité mendélienne",
          "Hérédité non mendélienne",
          "Génétique des populations",
          "Génétique moléculaire humaine",
          "Mutations héréditaires et maladies génétiques",
          "Caryotype et anomalies chromosomiques"
        ]
      }
    ]
  },
  {
    code: "PHYS_BIOPHYS",
    label: "Physique / Biophysique",
    chapters: [
      {
        code: "PHYSIQUE_GENERALE",
        label: "Physique générale",
        topics: [
          "Mécanique des fluides",
          "Thermodynamique appliquée au vivant",
          "Électricité",
          "Optique géométrique"
        ]
      },
      {
        code: "RAYONNEMENTS",
        label: "Rayonnements et radioactivité",
        topics: [
          "Spectre électromagnétique",
          "Radioactivité",
          "Interactions des rayonnements avec la matière",
          "Applications médicales",
          "Radioprotection et unités de dose"
        ]
      },
      {
        code: "BIOPHYSIQUE",
        label: "Biophysique",
        topics: [
          "Potentiel de repos et potentiel d'action",
          "Propagation de l'influx nerveux",
          "Biomécanique musculaire",
          "Hémodynamique",
          "Acoustique et audiologie",
          "Ultrasons et applications médicales"
        ]
      }
    ]
  },
  {
    code: "HISTO_EMBRYO",
    label: "Histologie, embryologie et cytologie",
    chapters: [
      {
        code: "HISTOLOGIE_GENERALE",
        label: "Histologie générale",
        topics: [
          "Tissus épithéliaux",
          "Tissus conjonctifs",
          "Tissu sanguin",
          "Tissu musculaire",
          "Tissu nerveux",
          "Méthodes histologiques"
        ]
      },
      {
        code: "EMBRYOLOGIE",
        label: "Embryologie",
        topics: [
          "Gamétogenèse",
          "Fécondation",
          "Segmentation",
          "Implantation et nidation",
          "Gastrulation",
          "Neurulation",
          "Développement des annexes embryonnaires",
          "Organogenèse générale",
          "Embryologie clinique"
        ]
      }
    ]
  },
  {
    code: "SHS_ETHIQUE",
    label: "Sciences humaines et sociales / Éthique",
    chapters: [
      {
        code: "PSYCHOLOGIE",
        label: "Psychologie",
        topics: [
          "Grandes théories psychologiques",
          "Psychologie du développement",
          "Psychologie clinique",
          "Communication en santé"
        ]
      },
      {
        code: "SOCIOLOGIE_SANTE",
        label: "Sociologie de la santé",
        topics: [
          "Déterminants sociaux de la santé",
          "Sociologie des professions de santé",
          "Représentations sociales de la maladie",
          "Sociologie de l'hôpital et des organisations de soins"
        ]
      },
      {
        code: "DROIT_MEDICAL",
        label: "Droit médical et déontologie",
        topics: [
          "Droits des patients",
          "Secret professionnel et secret médical",
          "Responsabilité médicale",
          "Code de déontologie médicale",
          "Fins de vie",
          "Législation sur les produits de santé"
        ]
      },
      {
        code: "ETHIQUE_MEDICALE",
        label: "Éthique médicale",
        topics: [
          "Les 4 grands principes",
          "Éthique de la recherche clinique",
          "Comités d'éthique",
          "Bioéthique"
        ]
      }
    ]
  },
  {
    code: "SP_EPIDE",
    label: "Santé publique et épidémiologie",
    chapters: [
      {
        code: "EPIDEMIOLOGIE",
        label: "Épidémiologie",
        topics: [
          "Mesures de fréquence",
          "Études épidémiologiques",
          "Biais épidémiologiques",
          "Causalité",
          "Dépistage"
        ]
      },
      {
        code: "SANTE_PUBLIQUE",
        label: "Santé publique",
        topics: [
          "Organisation du système de santé français",
          "Indicateurs de santé",
          "Prévention",
          "Surveillance épidémiologique",
          "Grands problèmes de santé publique",
          "Politique vaccinale",
          "Médecine du travail et risques professionnels",
          "Hygiène hospitalière"
        ]
      }
    ]
  },
  {
    code: "ANAT_GENERALE",
    label: "Anatomie générale",
    chapters: [
      {
        code: "ANAT_GENERALITES",
        label: "Généralités",
        topics: [
          "Plans anatomiques et termes de position",
          "Notions d'imagerie médicale"
        ]
      },
      {
        code: "ANAT_LOCOMOTEUR",
        label: "Appareil locomoteur",
        topics: [
          "Ostéologie",
          "Membre supérieur",
          "Membre inférieur",
          "Colonne vertébrale"
        ]
      },
      {
        code: "ANAT_CAVITES_ORGANES",
        label: "Cavités et organes",
        topics: [
          "Thorax",
          "Abdomen",
          "Pelvis",
          "Tête et cou",
          "Système nerveux central"
        ]
      },
      {
        code: "ANAT_VASCULARISATION",
        label: "Vascularisation",
        topics: [
          "Aorte et ses branches principales",
          "Système porte hépatique",
          "Système cave supérieur et inférieur",
          "Cercle artériel de Willis",
          "Système lymphatique général"
        ]
      }
    ]
  },
  {
    code: "MATH_BIOSTAT",
    label: "Mathématiques et biostatistiques",
    chapters: [
      {
        code: "MATHS",
        label: "Mathématiques",
        topics: [
          "Fonctions usuelles",
          "Dérivation et intégration",
          "Équations différentielles simples",
          "Matrices et systèmes linéaires",
          "Nombres complexes"
        ]
      },
      {
        code: "STATS_DESCRIPTIVES",
        label: "Statistiques descriptives",
        topics: [
          "Variables quantitatives, qualitatives et ordinales",
          "Indicateurs de tendance centrale",
          "Indicateurs de dispersion",
          "Représentations graphiques"
        ]
      },
      {
        code: "PROBABILITES",
        label: "Probabilités",
        topics: [
          "Probabilités classiques",
          "Variables aléatoires discrètes et continues",
          "Lois binomiale, de Poisson et normale",
          "Théorème central limite"
        ]
      },
      {
        code: "TESTS_STATISTIQUES",
        label: "Tests statistiques",
        topics: [
          "Estimation et intervalle de confiance",
          "Tests paramétriques",
          "Tests non paramétriques",
          "Corrélation et régression linéaire simple",
          "p-valeur, erreurs de type I et II, puissance"
        ]
      }
    ]
  },
  {
    code: "PHYSIO_GENERALE",
    label: "Physiologie générale",
    chapters: [
      {
        code: "PHYSIO_CELLULAIRE",
        label: "Physiologie cellulaire",
        topics: [
          "Potentiel de repos et potentiel d'action",
          "Transports membranaires actifs et passifs"
        ]
      },
      {
        code: "PHYSIO_CARDIO",
        label: "Système cardiovasculaire",
        topics: [
          "Cycle cardiaque, ECG et révolution cardiaque",
          "Débit cardiaque, pression artérielle et régulation",
          "Microcirculation et échanges capillaires"
        ]
      },
      {
        code: "PHYSIO_RESP",
        label: "Système respiratoire",
        topics: [
          "Mécanique ventilatoire",
          "Échanges gazeux alvéolaires",
          "Transport de l'O2 et du CO2 dans le sang",
          "Régulation de la respiration"
        ]
      },
      {
        code: "PHYSIO_NERVEUX",
        label: "Système nerveux",
        topics: [
          "Organisation générale du SNC et du SNP",
          "Système nerveux autonome",
          "Neurotransmetteurs principaux",
          "Réflexes médullaires"
        ]
      },
      {
        code: "PHYSIO_DIGESTIF",
        label: "Système digestif",
        topics: [
          "Motricité digestive",
          "Sécrétions digestives",
          "Digestion et absorption"
        ]
      },
      {
        code: "PHYSIO_RENAL",
        label: "Système rénal",
        topics: [
          "Structure du néphron",
          "Filtration glomérulaire",
          "Réabsorption et sécrétion tubulaires",
          "Régulation de l'équilibre hydro-électrolytique et acido-basique"
        ]
      },
      {
        code: "PHYSIO_ENDOCRINIEN",
        label: "Système endocrinien",
        topics: [
          "Hypothalamus-hypophyse",
          "Thyroïde, parathyroïdes, surrénales, pancréas endocrine",
          "Régulation par rétrocontrôle"
        ]
      }
    ]
  },
  {
    code: "ICM",
    label: "Initiation à la connaissance du médicament",
    chapters: [
      {
        code: "PHARMA_GENERALE",
        label: "Pharmacologie générale",
        topics: [
          "Définitions",
          "Pharmacocinétique",
          "Biodisponibilité, volume de distribution, demi-vie",
          "Pharmacodynamie",
          "Effets indésirables et interactions médicamenteuses"
        ]
      },
      {
        code: "DEVELOPPEMENT_MEDICAMENT",
        label: "Développement du médicament",
        topics: [
          "Phases de développement",
          "Autorisation de mise sur le marché",
          "Essais cliniques",
          "Pharmacovigilance"
        ]
      },
      {
        code: "REGLEMENTATION_CIRCUIT",
        label: "Réglementation et circuit",
        topics: [
          "Statuts du médicament",
          "Circuit hospitalier du médicament",
          "Rôle de l'ANSM",
          "Ordonnances et règles de prescription"
        ]
      },
      {
        code: "FORMES_PHARMACEUTIQUES",
        label: "Formes pharmaceutiques",
        topics: [
          "Formes orales",
          "Formes injectables",
          "Formes topiques, transdermiques, inhalées, rectales",
          "Galénique et libération modifiée"
        ]
      }
    ]
  },
  {
    code: "ANGLAIS_MED",
    label: "Anglais médical et scientifique",
    chapters: [
      {
        code: "ANGLAIS_MEDICAL",
        label: "Anglais médical et scientifique",
        topics: [
          "Vocabulaire médical fondamental",
          "Racines latines et grecques des termes médicaux",
          "Compréhension de textes scientifiques",
          "Expression écrite et orale en contexte médical",
          "Acronymes et abréviations médicaux anglophones"
        ]
      }
    ]
  },
  {
    code: "METIERS_SANTE",
    label: "Métiers de la santé et projet professionnel",
    chapters: [
      {
        code: "PROJET_PRO",
        label: "Métiers de la santé et projet professionnel",
        topics: [
          "Présentation des filières MMOPK",
          "Durée des études, débouchés, spécialités",
          "Organisation hospitalière et libérale",
          "Stage d'initiation aux soins infirmiers",
          "Séminaire de découverte des métiers de santé",
          "Préparation aux épreuves orales"
        ]
      }
    ]
  }
];
