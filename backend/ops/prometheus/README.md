# Prometheus - Branchage MedQuiz Backend

## 1) Pré-requis

- Backend lancé sur `http://localhost:8080` (health live/ready en 200).
- `METRICS_ENABLED=true` et `METRICS_AUTH_TOKEN` renseigné côté backend.
- Docker Desktop démarré (pour la stack locale Prometheus + Alertmanager).

## 2) Préparer le secret de scrape

Depuis `backend/ops/prometheus`:

```bash
mkdir -p secrets
grep '^METRICS_AUTH_TOKEN=' ../../.env.production | cut -d= -f2- > secrets/medquiz_metrics_token
chmod 600 secrets/medquiz_metrics_token
```

## 3) Démarrer Prometheus local

```bash
cd /Users/amayazturbo/Documents/New\ project/backend/ops/prometheus
docker compose -f docker-compose.local.yml up -d
```

Endpoints:
- Prometheus UI: `http://localhost:9090`
- Alertmanager UI: `http://localhost:9093`

## 4) Vérifier le scrape

Dans Prometheus:
- `Status -> Targets`
- Le job `medquiz-backend` doit être `UP`.

Requête rapide:

```promql
up{job="medquiz-backend"}
```

Attendu: valeur `1`.

## 5) Règles d’alerte chargées

Le fichier `medquiz-alert-rules.yml` est monté automatiquement et inclut:
- `MedQuizBackendTargetDown`
- `MedQuizApiAvailabilityHighBurnFast`
- `MedQuizApiAvailabilityHighBurnSlow`
- `MedQuizApiP95LatencyTooHigh`
- `MedQuizDatabaseDependencyDown`

## 6) Test d’alerte (pas à pas)

### Test simple et fiable: cible backend down

1. Arrêter le backend (le terminal où tourne `npm run start`).
2. Attendre 2 minutes (condition `for: 2m`).
3. Vérifier dans Prometheus/Alertmanager que `MedQuizBackendTargetDown` passe en `firing`.
4. Relancer le backend.
5. Vérifier que l’alerte retourne en `resolved`.

### Requête de contrôle:

```promql
ALERTS{alertname="MedQuizBackendTargetDown"}
```

## 7) Configuration production

Utiliser `prometheus.production.example.yml` comme base:

1. Copier le fichier et adapter les `targets`.
2. Garder `authorization.credentials_file` pour éviter les tokens en clair dans le YAML.
3. Monter le fichier secret `medquiz_metrics_token` via ton orchestrateur (Kubernetes secret, VM file, etc.).
4. Charger `medquiz-alert-rules.yml`.

## 8) Troubleshooting rapide

- `Target DOWN + 401`: mauvais token Prometheus.
- `Target DOWN + connection refused`: backend non démarré ou mauvais host/port.
- `Target DOWN + timeout`: réseau/firewall entre Prometheus et backend.
- Pas d’alertes: vérifier `Status -> Rules` et l’horloge système.
