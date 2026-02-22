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

### Option A - VM / Docker Compose (prêt à lancer)

Fichiers utilisés:
- `prometheus.production.yml`
- `alertmanager.production.yml`
- `docker-compose.production.yml`

Étapes:

1. Préparer le secret (Terminal 2: Prometheus):

```bash
cd /Users/amayazturbo/Documents/New\ project/backend/ops/prometheus
mkdir -p secrets
grep '^METRICS_AUTH_TOKEN=' ../../.env.production | cut -d= -f2- > secrets/medquiz_metrics_token
chmod 600 secrets/medquiz_metrics_token
```

Important:
- Le fichier attendu est `backend/.env.production` (pas `.env.production.example`).
- Dans `backend/.env.production`, ne laisse pas de placeholder avec `<...>` (ex: `<strong-password>`), sinon `source` échoue.

2. Éditer les deux valeurs obligatoires:
- Dans `prometheus.production.yml`: remplacer `api.medquiz.fr:443` par ton endpoint réel.
- Dans `alertmanager.production.yml`: remplacer l’URL webhook par ton endpoint d’alerte réel.

3. Lancer la stack (Terminal 2: Prometheus):

```bash
docker compose -f docker-compose.production.yml up -d
```

4. Vérifier:

```bash
curl -s 'http://localhost:9090/api/v1/query?query=up%7Bjob%3D%22medquiz-backend%22%7D'
curl -s 'http://localhost:9090/api/v1/rules' | grep -n MedQuizBackendTargetDown
```

5. Si tu testes en local, garder le backend actif (Terminal 1: Backend):

```bash
cd /Users/amayazturbo/Documents/New\ project/backend
set -a; source .env.production; set +a
npm run build
npm run start
```

### Option B - Kubernetes / autre orchestrateur

Utiliser `prometheus.production.example.yml` comme base:

1. Adapter les `targets`.
2. Conserver `authorization.credentials_file` (pas de token en clair).
3. Monter le secret `medquiz_metrics_token` via Secret Kubernetes / fichier VM.
4. Charger `medquiz-alert-rules.yml`.

## 8) Troubleshooting rapide

- `Target DOWN + 401`: mauvais token Prometheus.
- `Target DOWN + connection refused`: backend non démarré ou mauvais host/port.
- `Target DOWN + timeout`: réseau/firewall entre Prometheus et backend.
- Pas d’alertes: vérifier `Status -> Rules` et l’horloge système.
