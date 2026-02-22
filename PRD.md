# PRD - Application Quiz Medical PASS/LAS

## 1. Resume executif

- Produit: application mobile de quiz medical orientee PASS/LAS 1ere annee.
- Positionnement: entrainement quotidien, revision intelligente, duel asynchrone engageant.
- Objectif business: monetisation rapide via publicite + abonnement premium low-cost.
- Marche cible initial: France, etudiants PASS/LAS.

## 2. Objectifs produit

### 2.1 Objectifs utilisateur

- Reviser efficacement des notions de 1ere annee.
- Identifier rapidement ses lacunes.
- Maintenir la motivation par la competition et la progression visible.

### 2.2 Objectifs business (90 jours)

- Atteindre une base active d'utilisateurs hebdomadaires.
- Obtenir une retention J7 significative grace aux routines de revision.
- Convertir une part des utilisateurs actifs vers premium sans pub.

### 2.3 KPI principaux

- Activation J1: utilisateur ayant complete >= 20 questions.
- Retention J7 / J30.
- Questions repondues par DAU.
- Duels lances par WAU.
- Conversion premium (%).
- ARPDAU.

## 3. Cible et personas

### 3.1 Persona principal

- Etudiant PASS/LAS 1 (18-22 ans)
- Usage mobile, sessions de 5-15 min
- Fort stress d'examens, besoin de repetition et de feedback rapide

### 3.2 Pain points

- Difficultes a prioriser les revisions.
- Oubli rapide des notions non revues.
- Perte de motivation sur revisions longues.

## 4. Proposition de valeur

- Une base unique de questions de 1ere annee.
- Cinq modes reutilisant la meme base + l'historique de l'utilisateur.
- Un mode duel asynchrone type Duel Quiz, sans contrainte de temps reel.

## 5. Scope produit v1 (MVP)

### Inclus

- Authentification (email + provider social)
- Banque de questions taggee
- Modes: Apprentissage, Revision, Par coeur, Rattrapage, Duel asynchrone
- Corrections avec explications
- Profil et statistiques de base
- Publicite pour plan gratuit
- Abonnement premium sans pub
- Notifications push (duel et rappel revision)

### Exclu v1

- Contenu video / cours longs
- IA conversationnelle pedagogique
- Classement national avance

## 6. Regles metier - modes de jeu

## 6.1 Base de selection commune

Chaque tentative alimente des stats par utilisateur-question:
- nb_tentatives
- nb_reussites
- taux_reussite
- derniere_tentative_at
- streak_correct

## 6.2 Mode Apprentissage

But: decouverte de nouvelles questions.

Regles:
- Priorite aux questions jamais vues.
- Fallback: questions vues une seule fois et anciennes.
- Afficher explication systematiquement.

## 6.3 Mode Revision

But: consolidation globale.

Regles:
- Questions deja vues uniquement.
- Ponderation vers questions non revues recemment.
- Melange de difficulte pour maintenir engagement.

## 6.4 Mode Par coeur

But: maintien des acquis.

Regles:
- Questions avec taux_reussite >= 0.8
- Minimum de tentatives (ex: >= 2)
- Priorite a la rapidite et a la regularite

## 6.5 Mode Rattrapage

But: corriger les lacunes.

Regles:
- Questions avec taux_reussite < 0.6 ou erreurs recentes.
- Priorite aux questions echouees sur les 3 dernieres tentatives.
- Feedback detaille obligatoire.

## 6.6 Mode Duel asynchrone

Format:
- 5 manches
- 1 manche = 3 questions
- 15 points max

Flux:
1. Joueur A lance duel avec Joueur B.
2. Joueur de depart choisi aleatoirement (v1).
3. A son tour, joueur actif choisit 1 matiere parmi 3 proposees.
4. Il repond a ses 3 questions.
5. Tour cloture, notification envoyee a l'adversaire.
6. L'adversaire joue sa serie de 3 questions sur la meme matiere (difficulte equivalente).
7. Sequence repetee sur 5 manches.
8. Score final compare, tie-break si egalite (1 question decisive).

Contraintes:
- Delai par tour: 24h (configurable)
- Expiration: tour perdu si delai depasse
- Anti-triche minimal: randomisation ordre des reponses, limite aux captures cote client

## 7. Monétisation

## 7.1 Plan Gratuit

- Publicite (interstitielle legere + rewarded optionnelle)
- Nombre limite de duels simultanes (ex: 2)
- Stats basiques

## 7.2 Plan Premium (exemple: 3.99 EUR/mois)

- Sans publicite
- Duels illimites
- Stats avancees
- Priorite sur fonctionnalites de revision avancee

## 7.3 Strategie conversion

- Paywall apres valeur percue (pas au premier ecran)
- Triggers: fin de duel, progression streak, pre-examens
- Offre speciale periode partiels (pack 30 jours)

## 8. UX et ecrans v1

## 8.1 Ecrans coeur

- Onboarding (objectif et niveau)
- Home (modes + progression)
- Session quiz (question + timer optionnel + feedback)
- Resultat session
- Revision dashboard (points faibles / forts)
- Duel lobby (inviter, etat des duels)
- Tour duel (choix matiere, reponses, score manche)
- Profil (stats, historique)
- Paywall / Abonnement

## 8.2 Home - architecture

- Bloc progression du jour
- Bloc "Continuer revision"
- Bloc "Lancer un duel"
- Acces direct aux 4 modes solo

## 9. User stories MVP

- En tant qu'etudiant, je peux repondre a des questions nouvelles chaque jour.
- En tant qu'etudiant, je peux revoir uniquement mes erreurs.
- En tant qu'etudiant, je peux defier un ami sans etre connecte en meme temps.
- En tant qu'etudiant, je recois une notification quand c'est mon tour.
- En tant qu'utilisateur gratuit, je peux utiliser l'app avec pubs.
- En tant qu'utilisateur premium, je peux supprimer les pubs et debloquer plus de confort.

## 10. Architecture technique recommandee

- Mobile: Flutter (iOS + Android)
- Backend API: NestJS (Node.js)
- DB: PostgreSQL
- Cache / jobs: Redis + queue (notifications, expiration des tours)
- Push: Firebase Cloud Messaging
- Paiement: Stripe
- Ads: Google AdMob
- Analytics: PostHog ou Firebase Analytics

## 11. Modele de donnees SQL initial (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subjects (matieres)
CREATE TABLE subjects (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  prompt TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Choices
CREATE TABLE question_choices (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  position SMALLINT NOT NULL,
  UNIQUE (question_id, position)
);

-- Attempts (solo)
CREATE TABLE attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_choice_id UUID REFERENCES question_choices(id),
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  mode TEXT NOT NULL CHECK (mode IN ('learning', 'review', 'par_coeur', 'rattrapage')),
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_user_question ON attempts(user_id, question_id);
CREATE INDEX idx_attempts_user_answered_at ON attempts(user_id, answered_at DESC);

-- Aggregats utilisateur-question
CREATE TABLE user_question_stats (
  user_id UUID NOT NULL REFERENCES users(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  attempts_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  last_answered_at TIMESTAMPTZ,
  last_correct BOOLEAN,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, question_id)
);

-- Duels
CREATE TABLE duels (
  id UUID PRIMARY KEY,
  player1_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'expired', 'cancelled')),
  starting_player_id UUID NOT NULL REFERENCES users(id),
  current_player_id UUID REFERENCES users(id),
  current_round SMALLINT NOT NULL DEFAULT 1 CHECK (current_round BETWEEN 1 AND 5),
  player1_score SMALLINT NOT NULL DEFAULT 0,
  player2_score SMALLINT NOT NULL DEFAULT 0,
  turn_deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Manches duel
CREATE TABLE duel_rounds (
  id UUID PRIMARY KEY,
  duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  round_number SMALLINT NOT NULL CHECK (round_number BETWEEN 1 AND 5),
  chosen_by_user_id UUID NOT NULL REFERENCES users(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  player1_done BOOLEAN NOT NULL DEFAULT FALSE,
  player2_done BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (duel_id, round_number)
);

-- Reponses duel
CREATE TABLE duel_answers (
  id UUID PRIMARY KEY,
  duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES duel_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_choice_id UUID REFERENCES question_choices(id),
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_duel_answers_user_duel ON duel_answers(user_id, duel_id);

-- Subscription
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'apple', 'google')),
  external_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, external_id)
);
```

## 12. API REST initiale

## 12.1 Auth / User

- POST /auth/register
- POST /auth/login
- GET /me
- GET /me/stats

## 12.2 Quiz solo

- GET /quiz/learning/next?limit=10
- GET /quiz/review/next?limit=10
- GET /quiz/par-coeur/next?limit=10
- GET /quiz/rattrapage/next?limit=10
- POST /quiz/attempts/bulk

Payload attempts exemple:
```json
{
  "mode": "learning",
  "answers": [
    {
      "questionId": "...",
      "selectedChoiceId": "...",
      "responseTimeMs": 4200
    }
  ]
}
```

## 12.3 Duel

- POST /duels (creer duel avec adversaire)
- GET /duels (liste des duels de l'utilisateur)
- GET /duels/:id
- POST /duels/:id/start-round (choix matiere)
- GET /duels/:id/rounds/:roundNumber/questions
- POST /duels/:id/rounds/:roundNumber/answers
- POST /duels/:id/forfeit

## 12.4 Billing / Ads

- GET /billing/subscription
- POST /billing/checkout-session
- POST /billing/webhook/stripe
- POST /ads/impression (optionnel analytics)

## 13. Logique serveur critique

- Selection de questions par mode via requetes SQL + ponderation.
- Mise a jour transactionnelle de user_question_stats apres chaque lot de reponses.
- Validation de tour duel (authorisation du joueur actif uniquement).
- Worker planifie pour expiration des tours (cron toutes les 5 min).
- Envoi push apres fin de tour.

## 14. Plan de delivery (8 semaines)

1. S1: cadrage, schema DB, setup backend/mobile, seed initial.
2. S2: auth, questions, mode apprentissage.
3. S3: revision/par coeur/rattrapage + stats de base.
4. S4: mode duel asynchrone end-to-end.
5. S5: notifications push + expiration des tours.
6. S6: pub + abonnement Stripe + paywall.
7. S7: QA fonctionnelle, tests de charge leger, tuning selection questions.
8. S8: beta fermee, instrumentation KPI, lancement.

## 15. QA et tests minimaux

- Tests unitaires:
  - scoring
  - selection de questions par mode
  - transitions d'etat duel
- Tests integration:
  - flux complet d'un duel 5 manches
  - abonnement et retrait des pubs
- Tests produit:
  - latence moyenne API < 300 ms sur endpoints quiz next
  - push de tour recu < 10 sec apres fin de manche

## 16. Risques et mitigation

- Qualite pedagogique insuffisante -> pipeline editorial + validation enseignant.
- Desequilibre en duel -> normalisation difficultes + A/B tuning.
- Trop de pub -> frequence cap stricte.
- Churn apres 1 semaine -> routines (streak, rappels, objectifs de session).

## 17. Decision backlog immediate (a trancher)

- Stack finale: NestJS vs Supabase.
- Prix premium exact et essai gratuit (oui/non).
- Format tie-break duel (1 question ou mort subite).
- Seuils exacts par coeur/rattrapage (0.8/0.6 a confirmer).

