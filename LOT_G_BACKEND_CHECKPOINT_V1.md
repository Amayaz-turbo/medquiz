# Lot G - Backend Checkpoint V1 (auditable)

Date: 2026-02-21
Statut: implementation initiale (backend scaffold + modules prioritaires)

## 1) Livrables crees

### 1.1 Backend app (`/backend`)

- NestJS app structure
- Fastify runtime + helmet
- validation globale stricte
- gestion erreurs centralisee avec `requestId`
- DB service PostgreSQL (`pg`) + transaction helper

### 1.2 Modules implementes

- `health`
- `auth` (register/login/refresh/logout + me)
- `me` (`GET /v1/me`)
- `trainings` (creation session, question feed, answer, complete)
- `duels` (create/list/detail + accept + opener flow + decision)

### 1.3 Migration SQL ajoutee

- `migrations/005_auth_refresh_tokens.sql`
  - `auth_credentials`
  - `auth_refresh_tokens`
  - indexes actifs

## 2) Couverture fonctionnelle (v1)

## 2.1 Auth securisee

✅ Implementee:
- hash mdp Argon2
- JWT access token (`typ=access`)
- refresh token stocke hash en DB (`sha256`) + rotation
- revoke refresh token sur logout
- guard JWT pour endpoints prives

⚠️ A finaliser:
- OAuth Google/Apple (spec Lot C)
- rate-limit specifique auth

## 2.2 Entrainements

✅ Implemente:
- creation session (`learning/discovery/review/par_coeur/rattrapage`)
- regles `stop_rule`:
  - `fixed_10` -> 10
  - `fixed_custom` -> 1..200
  - `until_stop` -> sans cible
- filtrage matieres/chapitres
- selection questions selon mode
- submit answer QCM simple
- update stats:
  - `user_question_stats`
  - `user_subject_stats`
  - `questions_to_reinforce_count`
- cloture session

⚠️ A finaliser:
- support `multi_choice` et `open_text` en answer
- strategie anti-repetition avancee (pooling adaptatif)

## 2.3 Duels

✅ Implemente:
- create duel:
  - `friend_invite`
  - `random_free`
  - `random_level` (matching year_label tolerant)
- list/detail duels
- accept + decline invitation duel ami
- opener:
  - fetch question
  - answer par joueur
  - resolution winner (correctness puis vitesse, tie deterministic)
- decision winner (`take_hand`/`leave_hand`)
- passage duel `in_progress`
- rounds:
  - current round state
  - choose subject
  - assign 3 questions par joueur avec difficulte equivalente par slot
  - submit answer unitaire par slot
  - cloture auto de tour a la 3e reponse
  - passage de main + notification
  - passage manche suivante jusqu'a 5 manches
  - scoring cumule + finalisation duel
  - tie-break vitesse si egalite
- jokers/sursis:
  - request (+24h)
  - respond (`grant`/`reject`)
- forfeit duel
- notifications duel en DB (`duel_turn`, `duel_joker_request`, `duel_joker_granted`, `duel_finished`)

⚠️ A finaliser:
- durcir observabilite worker timeout (`expire_duel_turns`) en prod multi-instance

## 3) Fichiers backend principaux

- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/database/database.service.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/trainings/trainings.service.ts`
- `backend/src/duels/duels.service.ts`
- `backend/src/duels/duel-expiration.worker.ts`
- `backend/README.md`

## 4) Risques / points de review

1. Couverture tests automatises (unit/integration/e2e) encore a ecrire/brancher.
2. Worker timeout duel branche, mais non valide en charge/multi-instance reelle.
3. OpenAPI `openapi.yaml` n'a pas encore ete aligne sur tous les details de payload retour implementes cote backend.

## 4.1 Verification technique effectuee

- `npm run build` backend: OK (compilation TypeScript validee).

## 5) Proposition de suite immediate

1. Aligner `openapi.yaml` sur routes effectivement exposees (`trainings` + duel avance).
2. Ajouter tests unitaires + integration DB sur auth/duel/trainings.
3. Ajouter metriques/alerting dediees worker timeout duel.
