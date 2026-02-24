# MedQuiz Backend (Lot G bootstrap)

Backend API NestJS for MedQuiz with priority on:
- duels async (first)
- trainings (solo)
- secure auth (JWT + refresh rotation in DB)

## Stack

- NestJS (Fastify)
- PostgreSQL 16
- JWT access + refresh
- Argon2 password hashing

## Current implemented routes (`/v1`)

Public:
- `GET /health`
- `GET /health/live`
- `GET /health/ready`
- `GET /observability/metrics`
- `GET /observability/slo`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Protected:
- `GET /me`
- `GET /avatar/stages`
- `GET /avatar/specialties`
- `GET /me/avatar`
- `GET /me/avatar/inventory`
- `POST /me/avatar/equipment`
- `POST /me/avatar/specialty`
- `GET /trainings/dashboard`
- `GET /trainings/state/subjects`
- `GET /trainings/state/subjects/:subjectId/chapters`
- `PUT /trainings/state/chapters/:chapterId`
- `POST /trainings/sessions`
- `GET /trainings/sessions/:sessionId`
- `GET /trainings/sessions/:sessionId/questions`
- `POST /trainings/sessions/:sessionId/answers`
- `POST /trainings/sessions/:sessionId/complete`
- `GET /trainings/admin/open-text/questions/:questionId/accepted-answers`
- `POST /trainings/admin/open-text/questions/:questionId/accepted-answers`
- `DELETE /trainings/admin/open-text/questions/:questionId/accepted-answers/:answerId`
- `POST /trainings/submissions`
- `GET /trainings/submissions`
- `GET /trainings/submissions/:submissionId`
- `POST /trainings/admin/questions`
- `GET /trainings/admin/questions/:questionId`
- `GET /trainings/admin/questions`
- `PUT /trainings/admin/questions/:questionId`
- `POST /trainings/admin/questions/:questionId/publish`
- `POST /trainings/admin/questions/:questionId/retire`
- `POST /trainings/admin/submissions/:submissionId/review`
- `GET /trainings/admin/submissions/review-queue`
- `GET /trainings/admin/submissions/dashboard`
- `POST /trainings/admin/submissions/:submissionId/claim`
- `POST /trainings/admin/submissions/claim-next`
- `POST /trainings/admin/submissions/:submissionId/release-claim`
- `GET /trainings/admin/submissions/my-claims`
- `POST /trainings/admin/submissions/release-all-claims`
- `POST /duels`
- `GET /duels`
- `GET /duels/:duelId`
- `POST /duels/:duelId/accept`
- `POST /duels/:duelId/decline`
- `GET /duels/:duelId/opener`
- `POST /duels/:duelId/opener/answer`
- `POST /duels/:duelId/opener/decision`
- `GET /duels/:duelId/rounds/current`
- `POST /duels/:duelId/rounds/:roundNo/choose-subject`
- `GET /duels/:duelId/rounds/:roundNo/questions`
- `POST /duels/:duelId/rounds/:roundNo/answers`
- `POST /duels/:duelId/jokers/request`
- `POST /duels/:duelId/jokers/:jokerId/respond`
- `POST /duels/:duelId/forfeit`

## Prerequisites

1. Copy environment file:
   - `cp .env.example .env`
2. Set a valid `DATABASE_URL`
3. Apply SQL migrations from repo root:
   - `cd backend`
   - `DATABASE_URL=postgresql://... npm run db:migrate`

## Local run

```bash
cd backend
npm install
npm run start:dev
```

Server will run on `PORT` (default `8080`), base prefix `/v1`.
The internal duel timeout worker is enabled by default (`DUEL_EXPIRATION_JOB_ENABLED=true`).

## Observability / SLO

- Request metrics + latency histogram are collected in-memory and exposed at `GET /v1/observability/metrics` (Prometheus text format).
- SLO snapshot is exposed at `GET /v1/observability/slo`.
- `GET /v1/health/live` is liveness only.
- `GET /v1/health/ready` verifies PostgreSQL with timeout (`HEALTH_DB_TIMEOUT_MS`).
- If `METRICS_AUTH_TOKEN` is set, observability endpoints require:
  - `Authorization: Bearer <token>` or
  - `x-metrics-token: <token>`
- In production, `METRICS_AUTH_TOKEN` is mandatory when `METRICS_ENABLED=true`.
- Prometheus alert rules template is provided at `ops/prometheus/medquiz-alert-rules.yml`.
- Full Prometheus setup + local alert test guide: `ops/prometheus/README.md`.
- Ready-to-run production compose stack: `ops/prometheus/docker-compose.production.yml`.
- Go-live checklist: `ops/PROD_ROLLOUT_CHECKLIST.md`.
- Incident response runbook: `ops/INCIDENT_RUNBOOK.md`.
- Production env template: `.env.production.example`.

## Security choices already in place

- strict request validation (`whitelist`, `forbidNonWhitelisted`)
- centralized error envelope with request id
- password hashing with Argon2
- refresh token hashing in DB + rotation + revoke on logout
- helmet enabled
- request-level structured telemetry logs

## Important scope notes

- Duel timeout worker (`expire_duel_turns`) is not yet wired as cron/worker in this checkpoint.
- Open-text training answers are enabled with normalized exact-match scoring.
- OAuth Google/Apple endpoints from API spec are not yet implemented in this checkpoint.
