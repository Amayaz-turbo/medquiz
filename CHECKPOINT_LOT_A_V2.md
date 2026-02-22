# Checkpoint - Lot A v2 (valide)

Date: 2026-02-19

## Etat global

- Lot A valide.
- Prochaine etape: Lot B (dictionnaire de donnees complet + contraintes + index + exemples).

## Decisions produit confirmees

1. Cible:
- PASS/LAS, usage toute l'annee.
- Persona prioritaire: etudiant regulier (sessions sur temps morts).

2. Sessions:
- Mode `10 questions`
- Mode `Nombre personnalise`
- Mode `Jusqu'a arret`

3. Filtrage contenu:
- Par matiere / chapitre
- Questions deja revisees
- Questions aleatoires
- Adaptation a l'avancement declare par l'utilisateur

4. Onboarding:
- Onboarding complet
- Pas d'objectifs imposes
- Ton non anxiogene, renforcement positif

5. Modes:
- `Apprentissage` (global configurable)
- `Decouverte` (jamais vues)
- `Revision` (deja vues, filtres matiere/chapitre)
- `Par coeur`: 100% si < 4 tentatives, 80% si >= 4 tentatives
- `Rattrapage` (erreurs/instabilite)
- `Duel asynchrone` (5 manches x 3 questions)

6. Duel:
- Adversaire ami ou aleatoire
- Multi-duels simultanes
- Question d'ouverture pour determiner le premier joueur (exactitude + rapidite)
- Gagnant choisit de prendre ou laisser la main
- Corrections immediates
- Tie-break: question aleatoire puis vitesse si egalite

7. Regles de delai duel:
- 24h par tour
- Sursis possible +24h accorde par l'adversaire
- A H48 sans sursis: 0/3

8. Monetisation:
- Gratuit: pubs + max 2 duels simultanes
- Premium: sans pub + mode melee (groupe) + confort
- Prix cible premium: 1,99 EUR/mois
- Pas d'essai gratuit

9. Qualite contenu:
- Exigence elevee des la v1
- Proposition de questions utilisateur possible, avec moderation

## Clarifications ajoutees (2026-02-19 soir)

1. Referentiel contenu:
- National et generique, hors-sujet interdit.
- Pas de dependance forte aux variations locales de fac/prof.

2. Types de questions:
- V1: QCM simple.
- Evolutions prevues: QCM a reponses multiples, puis questions ouvertes.

3. Qualite pedagogique:
- Explication obligatoire pour chaque question.
- Source officielle non obligatoire.

4. Matchmaking duel aleatoire:
- L'utilisateur choisit: matchmaking libre ou niveau proche.

5. Sursis duel:
- 1 sursis maximum par duel.
- 1 joker par joueur.

6. Publicites:
- Rewarded video a la fin de la premiere session.
- Recompense: 30 min sans pub.
- Si pas de bonus actif: interstitiel au debut de chaque quiz.

7. Classements:
- Pas de classement global v1.
- Resultats individuels + duels seulement.
- Classements ponctuels possibles lors d'evenements/concours.

## Workflow moderation (defini v1)

- Soumission utilisateur -> `pending` -> relecture editoriale -> `approved` ou `rejected` (avec motif) -> signalement post-publication possible.

## Reprise du 2026-02-21

- Revue consolidee creee dans:
  - `/Users/amayazturbo/Documents/New project/LOT_A_REVIEW_V3.md`
- Cette revue est la base de validation finale du Lot A avant passage au Lot B.

## Validation finale du 2026-02-21

1. Sursis duel:
- 1 sursis max par joueur et par duel (1 joker chacun).

2. Matchmaking:
- Les 2 options restent disponibles (aleatoire libre + niveau proche).

3. Evaluation:
- Pas de score composite.
- Metrique principale: taux de bonne reponse.
- Priorisation revision selon resultats cumules par matiere.

4. Statut:
- Lot A ferme et valide.
- Passage au Lot B autorise.

## Lot B demarre (2026-02-21)

- Document cree:
  - `/Users/amayazturbo/Documents/New project/LOT_B_DATA_MODEL_V1.md`
- Contenu:
  - dictionnaire complet table/colonne/contrainte/index
  - contraintes transverses
  - exemples SQL concrets
  - points a critiquer avant gel SQL final

## Validation partielle Lot B (2026-02-21)

1. Rewarded:
- "Premiere session" = premiere session de la journee.

2. Limite free duels:
- Max 2 duels actifs au total (duels lances + recus).

3. Equite duel:
- Equivalence de difficulte obligatoire entre les 2 joueurs (ressenti de justice).
- Regle v1: niveau tire au hasard (sans repartition imposee), mais strictement identique pour les 2 joueurs.

4. Flux session:
- Choix matiere(s) -> choix chapitre(s) ou matiere complete -> choix mode.
- Le `session_scope` est retire du modele; la logique repose sur `mode` + filtres.

5. QCM v1:
- 4 choix fixes par question.

6. Moderation v1:
- Workflow binaire `approve/reject`.

## Generation SQL (2026-02-21)

- Fichier SQL executable cree:
  - `/Users/amayazturbo/Documents/New project/schema.sql`
- Couverture:
  - enums, tables, indexes, contraintes
  - triggers metier critiques (coherence matiere/chapitre, regles QCM, moderation submissions, cap duels free)
- Verification:
  - `psql` non disponible dans l'environnement local (commande absente), verification syntaxique complete non executable ici.

## Blocage environnement (2026-02-21)

- Tentative installation Homebrew pour installer PostgreSQL 16:
  - echec, droits admin macOS requis.
- Message systeme:
  - \"Need sudo access on macOS (e.g. the user amayazturbo needs to be an Administrator)!\"
- Nouvelle tentative apres autorisation Codex:
  - meme blocage, droits administrateur macOS toujours requis.

## Deblocage environnement (2026-02-21)

- `brew` disponible: `/opt/homebrew/bin/brew`
- PostgreSQL 16 installe via Homebrew.
- Service demarre:
  - `postgresql@16 started`
- Validation schema SQL executee avec succes sur base de test:
  - DB: `medquiz_schema_check`
  - Script: `/Users/amayazturbo/Documents/New project/schema.sql`
  - Resultat: `COMMIT`
  - Tables publiques creees: `27`

## Lot C demarre (2026-02-21)

- Document cree:
  - `/Users/amayazturbo/Documents/New project/LOT_C_API_SPEC_V1.md`
- Contenu:
  - conventions API v1, auth, erreurs
  - endpoints quiz/duel/pub/billing/moderation
  - payloads JSON exemples
  - tests acceptance minimaux
  - points a critiquer avant validation Lot C

## Validation partielle Lot C (2026-02-21)

1. Auth v1:
- email/password + Google + Apple des le lancement.

2. Reponses duel:
- mode unitaire (1 reponse par appel), priorite robustesse.

3. Billing v1:
- stack complete des le lancement: Stripe + Apple + Google.

4. Rate limits:
- baseline proposee conservee.

5. Point restant Lot C:
- choix final du mecanisme d'expiration des tours duel (endpoint interne HTTP vs job direct).

## Validation finale Lot C (2026-02-21)

1. Expiration tours duel:
- Option B validee: job direct (worker/cron), sans endpoint HTTP interne expose.

2. Statut:
- Lot C complet et coherent avec les decisions produit/techniques validees.

## Lot D demarre (2026-02-21)

- Document cree:
  - `/Users/amayazturbo/Documents/New project/LOT_D_UX_SPEC_V1.md`
- Contenu:
  - architecture de navigation
  - parcours UX complets (onboarding, quiz, duel, pub/premium)
  - specification ecran par ecran
  - microcopy et etats UX
  - analytics UX + checklist QA
  - points a critiquer avant validation Lot D

## Validation partielle Lot D (2026-02-21)

1. Navigation:
- onglet `Entrainement` valide (remplace `Quiz`).

2. Home:
- priorite `Duel a jouer` avant `Continuer un quiz`.

3. Nouvelle demande:
- personnalisation des profils joueurs a integrer (perimetre v1 a confirmer).

## Validation avancee Lot D (2026-02-21)

1. Decisions UX validees:
- wording rewarded valide.
- bouton `Relancer notification` valide (avec cooldown anti-spam).
- ordre moyens de paiement valide (iOS: Apple>Stripe, Android: Google>Stripe, Web: Stripe).

2. Personnalisation profil/avatar:
- personnalisation avancee validee.
- progression avatar carriere medicale validee:
  - `PASS/LAS` -> `DFGSM2` -> `DFGSM3` -> `DFASM1` -> `DFASM2` -> `DFASM3` -> `Interne` -> `Docteur junior`
- choix specialite deblocable au stade `Interne`.
- objets/poses/tenues/fonds deblocables des le debut via rewarded ads, objectifs atteints et mini-concours.

3. Alignement docs:
- Lot D mis a jour.
- Lot B (data model) et Lot C (API) etendus pour supporter avatar + rewarded cosmetique.

## Validation SQL apres extension avatar (2026-02-21)

- `schema.sql` mis a jour (enums/tables/contraintes/triggers avatar).
- Validation complete executee avec succes sur DB recreatee:
  - DB: `medquiz_schema_check`
  - Resultat execution: `COMMIT`
  - Tables publiques creees: `34`
  - Revalidee apres renommage stage `interne`: `COMMIT`, `34` tables.

## Validation finale Lot D (2026-02-21)

- Lot D valide:
  - UX/navigation/wording/rewarded/paywall
  - personnalisation profil + avatar long-terme
  - notifications UX confirmees

## Lot E demarre (2026-02-21)

- Document cree:
  - `/Users/amayazturbo/Documents/New project/LOT_E_EXECUTION_PLAN_V1.md`
- Contenu:
  - roadmap sprint par sprint
  - backlog P0/P1
  - Definition of Done
  - strategie de tests
  - SLO cibles
  - decisions a critiquer pour validation finale Lot E

## Validation Lot E (2026-02-21)

1. Cadence:
- sprint 2 semaines confirme (meilleur compromis qualite/stabilite).

2. Priorite avatar:
- maintenue en Sprint 8 avec garde-fous stabilite:
  - feature flag
  - kill-switch rewarded cosmetique

3. Beta:
- beta fermee confirmee en Sprint 11 (priorite stabilite maximale).

4. SLO:
- version exigeante confirmee (latence, fiabilite, disponibilite, crash-free, webhooks).

5. Go-live:
- criteres exigeants confirmes:
  - zero P0/P1 critique sur domaines coeur
  - zero faille securite haute/critique
  - coherence duel/billing strictement validee
