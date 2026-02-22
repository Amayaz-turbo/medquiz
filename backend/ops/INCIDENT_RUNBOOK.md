# MedQuiz Backend - Incident Runbook (SLO)

## 1) Sévérités

- `SEV-1`: indisponibilité majeure, auth/duels KO, perte de service large.
- `SEV-2`: dégradation forte (latence, erreurs), impact significatif mais service partiel.
- `SEV-3`: anomalie limitée, workaround possible.

## 2) Déclencheurs principaux

- Alerte `MedQuizApiAvailabilityHighBurnFast` (critical).
- Alerte `MedQuizApiAvailabilityHighBurnSlow` (warning).
- Alerte `MedQuizApiP95LatencyTooHigh` (warning).
- Alerte `MedQuizDatabaseDependencyDown` (critical).

## 3) Triage immédiat (0-10 min)

1. Confirmer le scope:
   - endpoints touchés
   - % utilisateurs impactés
   - début incident (timestamp)
2. Vérifier santé:
   - `GET /v1/health/live`
   - `GET /v1/health/ready`
3. Vérifier métriques:
   - taux 5xx (`http_requests_total{status_class="5xx"}`)
   - p95 latence (`http_request_duration_ms_bucket`)
   - DB up (`dependency_up{dependency="database"}`)
4. Nommer Incident Commander (IC) + canal dédié.

## 4) Playbook par symptôme

### A) Disponibilité (5xx) en burn rapide

1. Geler déploiements en cours.
2. Identifier route(s) fautive(s) via labels `route`/`method`.
3. Si régression récente: rollback immédiat vers dernière version stable.
4. Vérifier baisse du ratio 5xx dans les 5-10 min.
5. Garder incident ouvert jusqu’à retour sous seuil stable.

### B) Latence p95 > objectif

1. Isoler endpoints dominants (histogram labels `route`, `method`).
2. Vérifier saturation DB/CPU/mémoire/connections pool.
3. Réduire pression:
   - limiter trafic non critique
   - augmenter capacité horizontale si possible
4. Si suite à release: rollback.
5. Confirmer retour p95 <= objectif pendant 15 min.

### C) Database dependency down

1. Vérifier connectivité DB réseau/TLS/credentials.
2. Vérifier état primaire/réplica et quota connexions.
3. Activer procédure DBA (failover ou restauration).
4. Rétablir `health/ready=ok` avant reprise trafic normal.
5. Surveiller 30 min après recovery.

## 5) Commandes utiles (exemples)

```bash
# Santé applicative
curl -i https://<host>/v1/health/live
curl -i https://<host>/v1/health/ready

# SLO snapshot (token requis)
curl -H "Authorization: Bearer <metrics-token>" \
  https://<host>/v1/observability/slo
```

## 6) Communication incident

- T0: annonce incident + impact estimé.
- T+15 min: hypothèse principale + action en cours.
- T+30 min puis toutes 30 min: update statut.
- Clôture: heure résolution + état final + suivi postmortem.

## 7) Critères de sortie incident

- `health/ready` stable.
- Aucune alerte critical active.
- Taux 5xx revenu au niveau nominal.
- p95 latence revenue sous objectif.

## 8) Postmortem (obligatoire SEV-1/SEV-2)

- Timeline factuelle.
- Cause racine technique.
- Pourquoi les garde-fous n’ont pas arrêté plus tôt.
- Actions correctives:
  - court terme (24-72h)
  - moyen terme (1-2 sprints)
- Owner + deadline pour chaque action.
