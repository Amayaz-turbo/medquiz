# MedQuiz Backend - Checklist Go-Live (Exigeante)

## 1) Pré-requis bloquants (avant déploiement)

- [ ] `Backend CI / backend-build-e2e` est **obligatoire** en protection de branche.
- [ ] `npm run build` passe sur le commit candidat.
- [ ] `npm run test:e2e -- --runInBand --watchman=false` passe sur le commit candidat.
- [ ] Les migrations SQL sont validées sur un clone de prod.
- [ ] Une sauvegarde base + point de restauration est disponible.
- [ ] Plan de rollback validé en équipe (voir section 8).

## 2) Configuration production stricte

- [ ] Fichier d’environnement basé sur `../.env.production.example`.
- [ ] `NODE_ENV=production`.
- [ ] `ACCESS_TOKEN_SECRET` et `REFRESH_TOKEN_SECRET` sont random, >= 64 chars.
- [ ] `METRICS_AUTH_TOKEN` est configuré, >= 16 chars.
- [ ] `CORS_ORIGIN` limité aux domaines front réels (pas de wildcard).
- [ ] `DUEL_EXPIRATION_JOB_ENABLED=true`.
- [ ] `DUEL_EXPIRATION_INTERVAL_SECONDS` entre `30` et `120`.
- [ ] `SLO_AVAILABILITY_TARGET_PCT=99.9`.
- [ ] `SLO_P95_LATENCY_MS=300` (ou plus strict selon charge réelle).

## 3) Déploiement base de données

- [ ] Déploiement migration:
  - `DATABASE_URL=... npm run db:migrate`
- [ ] Vérification tables critiques:
  - `duels`, `duel_rounds`, `duel_answers`, `auth_refresh_tokens`, `notifications`
- [ ] Vérification seed:
  - `avatar_stages`, `medical_specialties`, `avatar_items`

## 4) Déploiement application

- [ ] Déploiement version backend (rolling/blue-green recommandé).
- [ ] Health checks activés:
  - `GET /v1/health/live`
  - `GET /v1/health/ready`
- [ ] Vérification immédiate:
  - `curl -fsS https://<host>/v1/health/live`
  - `curl -fsS https://<host>/v1/health/ready`

## 5) Observabilité et alerting

- [ ] Scrape Prometheus de `/v1/observability/metrics` configuré avec auth token.
- [ ] Règles d’alerte chargées:
  - `ops/prometheus/medquiz-alert-rules.yml`
- [ ] Test d’alerte réalisé (au moins une alerte warning simulée).
- [ ] Dashboard minimal disponible:
  - requêtes/s
  - taux 5xx
  - p95 latence
  - `dependency_up{dependency="database"}`

## 6) Vérification fonctionnelle post-déploiement (smoke)

- [ ] Auth:
  - register/login/refresh/logout
- [ ] Duel:
  - création, acceptation, opener, round complet, joker, forfeit
- [ ] Worker timeout duel:
  - expiration de tour observée
- [ ] Endpoints observabilité:
  - `/v1/observability/slo` (token requis)
  - `/v1/observability/metrics` (token requis)

## 7) Critères Go-Live stricts (minimum)

- [ ] `availability` observée >= `99.9%` sur fenêtre de monitoring initiale.
- [ ] `p95 latency` <= `300ms` sur endpoints cœur.
- [ ] `5xx ratio` stable et sous budget d’erreur.
- [ ] Aucune alerte `critical` active pendant 30 minutes post-déploiement.
- [ ] `health/ready` stable (pas de flapping).

## 8) Rollback (si un critère bloque)

- [ ] Stopper la propagation trafic vers la version courante.
- [ ] Rebasculer vers la dernière version stable.
- [ ] Si migration incompatible: appliquer procédure DB de rollback/restore validée.
- [ ] Vérifier:
  - `health/live`
  - `health/ready`
  - baisse des alertes
- [ ] Ouvrir incident + postmortem (voir `INCIDENT_RUNBOOK.md`).

## 9) Validation finale

- [ ] Validation technique signée (backend + infra).
- [ ] Validation produit signée.
- [ ] Publication changelog interne + note de monitoring.
