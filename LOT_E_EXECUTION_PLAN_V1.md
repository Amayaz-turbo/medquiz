# Lot E - Execution Plan v1 (detail auditable)

Date: 2026-02-21
Statut: proposition pour validation
Perimetre: plan d'execution produit + technique, du kickoff au lancement

## 1) Objectif du Lot E

Transformer les Lots A/B/C/D en plan d'execution concret:
- priorites claires (P0/P1)
- sprints sequences
- Definition of Done stricte
- strategie de tests
- gates de validation avant passage sprint suivant

## 2) Contraintes et principes retenus

- Qualite prioritaire sur vitesse.
- UX non anxiogene, ton positif.
- Stack complete des le lancement: OAuth (email + Google + Apple), billing (Stripe + Apple + Google).
- Duel robuste en mode unitaire.
- Avatar long terme (stages, specialite, cosmetiques).
- Aucune avancee sprint sans validation explicite des artefacts critiques.

## 3) Cadence et gouvernance

Cadence recommandee:
- Sprint de 2 semaines.
- Demo interne + revue produit en fin de sprint.
- Gate de validation obligatoire avant sprint suivant.

Justification stabilite:
- 2 semaines = meilleur compromis qualite/feedback/risque pour ce scope.
- 1 semaine augmente le risque de dette et de validation insuffisante.

Rituels:
- Planning sprint: lundi matin.
- Point technique court: quotidien.
- Revue qualite: milieu et fin de sprint.
- Retrospective: fin de sprint.

Branches et release:
- branches feature courtes.
- merge uniquement avec CI verte.
- tags versionnes pour chaque release candidate.

## 4) Backlog priorise (P0 / P1)

## 4.1 P0 (must-have lancement)

Produit core:
- onboarding complet
- setup session (matiere/chapitre/mode/format)
- quiz solo 5 modes
- feedback immediate avec explication
- progression par matiere (taux + points a renforcer)

Duel:
- creation duel ami/random libre/random niveau proche
- opener + decision de main
- 5 manches x 3 questions
- reponses unitaires
- joker sursis (1 par joueur/duel)
- expiration automatique 0/3 via job direct

Monetisation:
- pub interstitielle debut quiz free
- rewarded fin 1ere session journee (30 min sans pub)
- paywall premium 1,99
- checkout Stripe + Apple + Google
- verification serveur des achats

Personnalisation:
- profil joueur (pseudo, bio, visibilite, couleur)
- avatar progression stages (PASS/LAS->DFGSM2->DFGSM3->DFASM1->DFASM2->DFASM3->Interne->Docteur junior)
- choix specialite au stade Interne
- inventaire et equipement cosmetique
- rewarded cosmetique

Infra/qualite:
- observabilite logs/erreurs
- tests unitaires + integration + e2e critiques
- securite auth/webhooks/permissions

## 4.2 P1 (post-launch proche)

- mode melee groupe premium
- evenements concours ponctuels
- moderation operationnelle avancee (SLA outillage)
- tuning matchmaking niveau proche par MMR avance
- automatisation anti-fraude supplementaire

## 5) Plan sprint par sprint

## Sprint 0 - Setup fondations (2 semaines)

Objectif:
- socle technique et governance de code.

Deliverables:
- repo structure (app mobile + backend + infra)
- CI/CD minimal (lint, tests, build)
- environnements dev/staging
- conventions (code style, architecture, logs)
- OpenAPI skeleton depuis Lot C

Definition of Done sprint:
- CI verte sur PR
- docs setup locale completes
- environnement staging deployable

Gate validation:
- architecture validee
- pipeline operationnel

## Sprint 1 - Auth complete + profil (2 semaines)

Objectif:
- authentification complete et securisee.

Deliverables:
- email/password register/login/refresh/logout
- OAuth Google/Apple
- profil utilisateur de base (`/me`, `profile update`)
- push token registration
- matrice roles/permissions

Tests requis:
- unit: token, refresh, policy
- integration: OAuth callbacks, conflits email
- securite: brute-force basic protections

Gate validation:
- auth flows e2e passes (iOS/Android)
- aucun endpoint sensible sans auth

## Sprint 2 - Referentiel contenu + onboarding (2 semaines)

Objectif:
- user pret a jouer avec preferences utiles.

Deliverables:
- subjects/chapters APIs
- onboarding complet
- progression declaree par chapitre
- copywriting v1 ton positif

Tests requis:
- integration: write/read progression
- e2e: onboarding complet sans blocage

Gate validation:
- onboarding valide UX
- temps onboarding acceptable

## Sprint 3 - Quiz solo core (2 semaines)

Objectif:
- boucle quiz fonctionnelle de bout en bout.

Deliverables:
- session creation 5 modes
- next question
- answer submit unitaire + feedback
- complete session
- stats matiere et resume

Tests requis:
- unit: regles mode (discovery/review/par coeur/rattrapage)
- integration: coherence session->answers
- e2e: 10 questions completes

Gate validation:
- exactitude scoring validee
- latence endpoint question acceptable

## Sprint 4 - Duel core (2 semaines)

Objectif:
- duel jouable de bout en bout.

Deliverables:
- create/list/detail duel
- opener + decision main
- rounds current + choose subject
- questions manche + answers unitaires
- notifications duel turn

Tests requis:
- integration: transitions etats duel
- e2e: duel complet standard

Gate validation:
- pas de desynchronisation des tours
- notifications de tour stables

## Sprint 5 - Robustesse duel (2 semaines)

Objectif:
- rendre duel resilient et anti-abus.

Deliverables:
- joker request/respond
- cooldown relance notification
- job expiration direct (sans endpoint)
- tie-break complet
- cap free 2 duels actifs

Tests requis:
- unit: regles joker/cap free
- integration: expirations en lot
- e2e: cas limites (abandon, timeout)

Gate validation:
- aucune regression etat duel
- regles business strictement appliquees

## Sprint 6 - Monetisation ads/premium UX (2 semaines)

Objectif:
- boucle moneti stable et comprehensible.

Deliverables:
- eligibility ads
- ad impressions/reward grants
- 30 min sans pub
- paywall UX final (ordre paiement par plateforme)

Tests requis:
- integration: blocage interstitiel pendant fenetre reward
- e2e: flow rewarded fin 1ere session

Gate validation:
- logique ads conforme aux regles validees

## Sprint 7 - Billing complet securise (2 semaines)

Objectif:
- paiements robustes multi-provider.

Deliverables:
- Stripe checkout + webhook signature
- Apple verify receipt
- Google verify purchase
- restore purchase
- synchronisation subscription plan/status

Tests requis:
- integration: transitions de plan
- securite: verification signature/webhook idempotent

Gate validation:
- scenarios achat/restore/cancel passes
- pas de faille evidente billing

## Sprint 8 - Avatar progression + studio (2 semaines)

Objectif:
- personnalisation avancee conforme vision produit.

Deliverables:
- APIs avatar state/inventory/equipment
- progression stage XP
- specialite unlock au stade Interne
- Avatar Studio UI
- rewarded cosmetique (drop + equipement)

Tests requis:
- unit: regles stage/specialite
- integration: ownership item + equipement
- e2e: unlock cosmetique via rewarded

Gate validation:
- progression avatar stable
- aucun avantage gameplay involontaire
- feature flag avatar actif (desactivable instantanement si incident)
- kill-switch rewarded cosmetique operationnel

## Sprint 9 - Moderation + qualite contenu (2 semaines)

Objectif:
- securiser pipeline contenu.

Deliverables:
- soumission question user
- backlog moderation admin (approve/reject)
- signalement question publiee
- audit trail moderation

Tests requis:
- integration: workflow pending->approved/rejected
- e2e: soumission invalide (3 choix) -> erreur

Gate validation:
- moderation operationnelle
- regles QCM strictes preservees

## Sprint 10 - Hardening global (2 semaines)

Objectif:
- stabilite pre-beta.

Deliverables:
- perf tuning endpoints critiques
- robustesse notifications
- accessibilite AA
- monitoring dashboards + alerting
- protection rate-limit finale

Tests requis:
- charge: endpoints quiz/duel
- securite: authz, webhook, abuse
- accessibility checks

Gate validation:
- SLO minimaux atteints
- zero bug bloquant connu

## Sprint 11 - Beta fermee + release prep (2 semaines)

Objectif:
- valider en conditions reelles avant ouverture.

Deliverables:
- beta groupe cible PASS/LAS
- collecte feedback qualite/perf
- tri bugs P0/P1
- release candidate + runbook incident

Gate validation:
- criteres go-live atteints
- plan support lancement valide

## 6) Definition of Done (globale)

Une story est `Done` si:
- code merge avec review validee
- tests unit/integration pertinents passes
- contrat API documente et teste
- logs/erreurs instrumentes
- analytics event emis si fonctionnalite user-facing
- ux copy validee (ton + clarte)
- pas de regression e2e critique

Une feature est `Done` si:
- acceptance criterias produit valides
- QA manuelle executee (happy path + edge cases)
- observabilite post-deploiement disponible

## 7) Strategie de tests detaillee

Unit tests:
- regles metier pures (modes quiz, joker, cap free, avatar unlock)

Integration tests:
- DB + services + transactions
- cas limites metier (expiration, equipping non-owned item)

Contract tests:
- OpenAPI conformance (req/res)

E2E tests:
- onboarding -> quiz -> stats
- duel complet avec joker/timeout
- rewarded + premium checkout
- avatar progression + equipement

Non-fonctionnel:
- perf: latence endpoints critiques
- securite: auth/webhooks/rate-limit
- accessibilite: contrast/focus/touch targets

## 8) SLO cibles pre-lancement

- p95 `next-question` < 200 ms
- p95 `duel answer` < 250 ms
- taux erreur serveur (5xx) < 0.2%
- notif duel turn: median < 3 sec, p95 < 8 sec
- disponibilite API (rolling 30j) >= 99.95%
- crash-free sessions mobile >= 99.7%
- succes verification webhooks billing >= 99.99%

## 8.1 Criteres go-live (niveau exigeant)

Critere produit:
- 0 bug P0 ouvert.
- 0 bug P1 ouvert sur quiz, duel, billing, auth.

Critere securite:
- 0 vulnerabilite critique/haute non corrigee (SAST/DAST/deps).
- webhook billing avec verification signature 100% active.
- rotation secrets et audit acces realises.

Critere fiabilite:
- SLO section 8 tenus pendant 14 jours consecutifs en pre-prod/beta.
- incoherence d'etat duel = 0 sur les 10 000 derniers duels beta.
- mismatch billing (etat provider vs etat interne) = 0 sur 14 jours.

Critere operation:
- runbook incident valide et teste.
- rollback applicatif et rollback migration testes.
- alerting critique actif (auth, duel, billing, webhook, DB saturation).

## 9) Risques majeurs et mitigation

1. Complexite multi-provider billing
- mitigation: contract tests + sandbox matrix + runbooks

2. Robustesse duel asynchrone
- mitigation: machine etat stricte + tests d'invariants

3. Equilibre rewarded/pub
- mitigation: telemetry fine + caps dynamiques

4. Scope avatar trop large
- mitigation: v1 cosmetique strict + backlog phase 2

## 10) Plan de validation utilisateur (mode strict)

A la fin de chaque sprint:
- 1 document de sprint (livre vs prevu)
- 1 checklist QA
- 1 demo fonctionnelle
- 1 liste d'arbitrages restants

Aucune ouverture sprint suivant sans:
- validation explicite utilisateur
- validation technique (tests + monitoring)

## 11) Decisions Lot E (etat courant)

1. Cadence:
- Valide: sprint de 2 semaines (choix stabilite qualite).

2. Priorite avatar:
- Valide: Sprint 8 maintenu, avec feature flag + kill-switch pour robustesse.

3. Beta:
- Valide: beta fermee en Sprint 11 (priorite stabilite maximale).

4. SLO:
- Valide: cibles SLO renforcees (section 8).

5. Definition lancement:
- Valide: criteres go-live exigeants (section 8.1).
