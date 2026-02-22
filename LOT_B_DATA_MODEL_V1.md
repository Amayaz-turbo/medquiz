# Lot B - Modele de donnees v1 (detail auditable)

Date: 2026-02-21
Statut: proposition pour critique
Perimetre: schema logique PostgreSQL + regles de contrainte + exemples de donnees

## 1) Objectif du Lot B

Ce document fixe la base de donnees v1 pour:
- les 5 modes solo (`apprentissage`, `decouverte`, `revision`, `par_coeur`, `rattrapage`)
- le duel asynchrone 5x3 avec question d'ouverture
- la monetisation (`free` + `premium` 1,99 EUR/mois)
- la pub v1 (rewarded + interstitiel)
- la moderation des questions proposees par les utilisateurs

## 2) Conventions techniques

- IDs: UUID (recommande UUIDv7).
- Horodatage: `TIMESTAMPTZ` en UTC.
- Suppression:
  - relation forte: `ON DELETE CASCADE`
  - relation metier: `ON DELETE RESTRICT` (par defaut)
- Donnees calculables (taux): calculees au service, stockees en cache table d'agregats.
- Valeurs enum: type PostgreSQL enum ou `TEXT + CHECK`.
- V1 questions:
  - active en production: `single_choice` uniquement
  - schema deja prevu pour `multi_choice` et `open_text`.

## 3) Vue entites principales

1. Utilisateur et preferences:
- `users`
- `user_profiles`
- `user_chapter_progress`

2. Contenu pedagogique:
- `subjects`
- `chapters`
- `questions`
- `question_choices`
- `question_reports`

3. Contribution communautaire (moderee):
- `question_submissions`
- `question_submission_choices`
- `question_submission_reviews`

4. Quiz solo:
- `quiz_sessions`
- `quiz_session_subject_filters`
- `quiz_session_chapter_filters`
- `quiz_answers`
- `user_question_stats`
- `user_subject_stats`

5. Duel asynchrone:
- `duels`
- `duel_openers`
- `duel_rounds`
- `duel_round_questions`
- `duel_answers`
- `duel_jokers`

6. Notifications, abonnement, pub:
- `notifications`
- `subscriptions`
- `ad_reward_windows`
- `ad_impressions`

7. Progression avatar et cosmetiques:
- `avatar_stages`
- `medical_specialties`
- `avatar_items`
- `user_avatar_progress`
- `user_avatar_inventory`
- `user_avatar_equipment`
- `rewarded_grants`

## 4) Catalogue des enums v1

| Enum | Valeurs |
|---|---|
| `question_type` | `single_choice`, `multi_choice`, `open_text` |
| `question_status` | `draft`, `published`, `retired` |
| `quiz_mode` | `learning`, `discovery`, `review`, `par_coeur`, `rattrapage` |
| `session_stop_rule` | `fixed_10`, `fixed_custom`, `until_stop` |
| `duel_status` | `pending_opener`, `in_progress`, `completed`, `cancelled`, `expired` |
| `duel_round_status` | `awaiting_choice`, `player1_turn`, `player2_turn`, `completed`, `scored_zero` |
| `joker_status` | `pending`, `granted`, `rejected`, `expired` |
| `notification_type` | `duel_turn`, `duel_joker_request`, `duel_joker_granted`, `duel_finished`, `review_reminder` |
| `notification_status` | `pending`, `sent`, `failed`, `read` |
| `subscription_plan` | `free`, `premium` |
| `subscription_status` | `active`, `past_due`, `cancelled`, `expired` |
| `subscription_provider` | `none`, `stripe`, `apple`, `google` |
| `submission_status` | `pending`, `approved`, `rejected` |
| `submission_review_action` | `approve`, `reject` |
| `report_status` | `open`, `reviewing`, `closed` |
| `ad_placement` | `rewarded_end_first_session`, `quiz_start_interstitial`, `rewarded_avatar_cosmetic` |
| `avatar_item_type` | `object`, `pose`, `outfit`, `background` |
| `reward_grant_type` | `ad_free_window`, `avatar_cosmetic` |

## 5) Dictionnaire des tables

## 5.1 `users`
But: identite applicative.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `email` | TEXT | non | - | UNIQUE, email normalise lowercase |
| `display_name` | TEXT | non | - | nom visible |
| `timezone` | TEXT | non | `Europe/Paris` | utile pour jours/streak |
| `country_code` | CHAR(2) | non | `FR` | cible initiale France |
| `is_active` | BOOLEAN | non | `TRUE` | soft disable |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `last_seen_at` | TIMESTAMPTZ | oui | `NULL` |  |

Indexes:
- `UNIQUE(email)`
- `INDEX(last_seen_at DESC)`

## 5.2 `user_profiles`
But: preferences non critiques auth.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `user_id` | UUID | non | - | PK, FK -> `users.id` |
| `study_track` | TEXT | oui | `NULL` | informatif (PASS/LAS) |
| `year_label` | TEXT | oui | `NULL` | informatif |
| `ux_tone` | TEXT | non | `supportive` | ton produit |
| `onboarding_completed_at` | TIMESTAMPTZ | oui | `NULL` | onboarding complet |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `updated_at` | TIMESTAMPTZ | non | `NOW()` |  |

## 5.3 `subjects`
But: matieres nationales.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `code` | TEXT | non | - | UNIQUE (`ANAT`, `BIOCH`, etc.) |
| `name` | TEXT | non | - |  |
| `sort_order` | SMALLINT | non | 0 | ordre affichage |
| `is_active` | BOOLEAN | non | `TRUE` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Indexes:
- `UNIQUE(code)`
- `INDEX(sort_order)`

## 5.4 `chapters`
But: chapitres par matiere.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `subject_id` | UUID | non | - | FK -> `subjects.id` |
| `code` | TEXT | non | - | unique dans la matiere |
| `name` | TEXT | non | - |  |
| `sort_order` | SMALLINT | non | 0 |  |
| `is_active` | BOOLEAN | non | `TRUE` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(subject_id, code)`

Indexes:
- `INDEX(subject_id, sort_order)`

## 5.5 `questions`
But: banque centrale de questions.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `subject_id` | UUID | non | - | FK -> `subjects.id` |
| `chapter_id` | UUID | non | - | FK -> `chapters.id` |
| `question_type` | `question_type` | non | `single_choice` | v1 utilise `single_choice` |
| `prompt` | TEXT | non | - | intitule question |
| `explanation` | TEXT | non | - | obligatoire |
| `difficulty` | SMALLINT | non | - | CHECK 1..5 |
| `status` | `question_status` | non | `draft` | `published` en production |
| `curriculum_scope` | TEXT | non | `national` | hors fac locale |
| `created_by_user_id` | UUID | oui | `NULL` | null si equipe interne |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `published_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `retired_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `updated_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `CHECK(difficulty BETWEEN 1 AND 5)`
- `CHECK(curriculum_scope = 'national')` en v1
- coherence chapitre/matiere a valider via trigger (`chapter.subject_id == question.subject_id`)

Indexes:
- `INDEX(status, subject_id, chapter_id)`
- `INDEX(subject_id, chapter_id, difficulty)`

## 5.6 `question_choices`
But: propositions de reponse.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `question_id` | UUID | non | - | FK -> `questions.id` ON DELETE CASCADE |
| `label` | TEXT | non | - | texte reponse |
| `position` | SMALLINT | non | - | ordre d'affichage |
| `is_correct` | BOOLEAN | non | `FALSE` | v1: une seule vraie |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(question_id, position)`
- `CHECK(position BETWEEN 1 AND 4)`
- regle metier v1: exactement 1 choix `is_correct=TRUE` pour une `single_choice` (trigger/validation service)
- regle metier v1: exactement 4 choix par question

Indexes:
- `INDEX(question_id)`

## 5.7 `question_reports`
But: signalements post-publication.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `question_id` | UUID | non | - | FK -> `questions.id` |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `reason_code` | TEXT | non | - | ex `wrong_answer`, `unclear`, `out_of_scope`, `typo`, `other` |
| `comment` | TEXT | oui | `NULL` |  |
| `status` | `report_status` | non | `open` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `closed_at` | TIMESTAMPTZ | oui | `NULL` |  |

Indexes:
- `INDEX(question_id, status)`
- `INDEX(user_id, created_at DESC)`

## 5.8 `question_submissions`
But: propositions de questions utilisateurs.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `proposer_user_id` | UUID | non | - | FK -> `users.id` |
| `subject_id` | UUID | non | - | FK -> `subjects.id` |
| `chapter_id` | UUID | non | - | FK -> `chapters.id` |
| `question_type` | `question_type` | non | `single_choice` | v1: simple |
| `prompt` | TEXT | non | - |  |
| `explanation` | TEXT | non | - | obligatoire |
| `status` | `submission_status` | non | `pending` | workflow moderation |
| `reviewed_by_user_id` | UUID | oui | `NULL` | reviewer interne |
| `review_note` | TEXT | oui | `NULL` | motif rejet / commentaire |
| `published_question_id` | UUID | oui | `NULL` | FK -> `questions.id` si approuve |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `reviewed_at` | TIMESTAMPTZ | oui | `NULL` |  |

Contraintes:
- si `status='approved'` => `published_question_id` non null
- si `status='rejected'` => `review_note` recommande non null (validation service)

Indexes:
- `INDEX(status, created_at)`
- `INDEX(proposer_user_id, created_at DESC)`

## 5.9 `question_submission_choices`
But: choix associes aux soumissions.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `submission_id` | UUID | non | - | FK -> `question_submissions.id` ON DELETE CASCADE |
| `label` | TEXT | non | - |  |
| `position` | SMALLINT | non | - |  |
| `is_correct` | BOOLEAN | non | `FALSE` |  |

Contraintes:
- `UNIQUE(submission_id, position)`
- `CHECK(position BETWEEN 1 AND 4)`
- regle metier v1: exactement 4 choix par soumission

## 5.10 `question_submission_reviews`
But: historique d'actions de moderation.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `submission_id` | UUID | non | - | FK -> `question_submissions.id` |
| `reviewer_user_id` | UUID | non | - | FK -> `users.id` |
| `action` | `submission_review_action` | non | - | `approve`, `reject` |
| `note` | TEXT | oui | `NULL` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Indexes:
- `INDEX(submission_id, created_at DESC)`

## 5.11 `user_chapter_progress`
But: progression declaree par l'utilisateur.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `user_id` | UUID | non | - | FK -> `users.id` |
| `chapter_id` | UUID | non | - | FK -> `chapters.id` |
| `declared_progress_pct` | NUMERIC(5,2) | non | 0 | CHECK 0..100 |
| `last_declared_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `updated_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- PK(`user_id`, `chapter_id`)
- `CHECK(declared_progress_pct >= 0 AND declared_progress_pct <= 100)`

Indexes:
- `INDEX(user_id, updated_at DESC)`

## 5.12 `quiz_sessions`
But: unite de jeu solo (10 questions, custom, jusqu'a arret).

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `mode` | `quiz_mode` | non | - | 5 modes solo |
| `stop_rule` | `session_stop_rule` | non | - | format session |
| `target_question_count` | SMALLINT | oui | `NULL` | requis si `fixed_custom` |
| `started_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `ended_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `ended_reason` | TEXT | oui | `NULL` | ex `completed_target`, `user_stop` |
| `is_first_session_of_day` | BOOLEAN | non | `FALSE` | pour pub rewarded |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- si `stop_rule='fixed_10'` => `target_question_count=10`
- si `stop_rule='fixed_custom'` => `target_question_count BETWEEN 1 AND 200`
- si `stop_rule='until_stop'` => `target_question_count IS NULL`

Indexes:
- `INDEX(user_id, started_at DESC)`
- `INDEX(user_id, is_first_session_of_day, started_at DESC)`

Note UX/metier:
- Flux v1: choisir matiere(s), puis chapitre(s) (ou toute la matiere), puis mode.
- Mapping des modes UI:
  - `learning` = `questions libres` (aleatoire vues + non vues)
  - `review` = questions deja vues
  - `par_coeur` = questions reussies
  - `rattrapage` = questions ratees / instables
  - `discovery` = questions jamais vues

## 5.13 `quiz_session_subject_filters`
But: matieres selectionnees pour une session.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `session_id` | UUID | non | - | FK -> `quiz_sessions.id` ON DELETE CASCADE |
| `subject_id` | UUID | non | - | FK -> `subjects.id` |

Contraintes:
- PK(`session_id`, `subject_id`)

## 5.14 `quiz_session_chapter_filters`
But: chapitres selectionnes pour une session.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `session_id` | UUID | non | - | FK -> `quiz_sessions.id` ON DELETE CASCADE |
| `chapter_id` | UUID | non | - | FK -> `chapters.id` |

Contraintes:
- PK(`session_id`, `chapter_id`)

## 5.15 `quiz_answers`
But: reponses d'une session solo.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `session_id` | UUID | non | - | FK -> `quiz_sessions.id` ON DELETE CASCADE |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `question_id` | UUID | non | - | FK -> `questions.id` |
| `selected_choice_id` | UUID | oui | `NULL` | FK -> `question_choices.id` |
| `is_correct` | BOOLEAN | non | - |  |
| `response_time_ms` | INTEGER | oui | `NULL` | CHECK > 0 |
| `answer_order` | SMALLINT | non | - | ordre dans session |
| `answered_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(session_id, answer_order)`
- `CHECK(response_time_ms IS NULL OR response_time_ms > 0)`

Indexes:
- `INDEX(user_id, question_id, answered_at DESC)`
- `INDEX(session_id)`

## 5.16 `user_question_stats`
But: agregats par question pour moteur de selection.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `user_id` | UUID | non | - | FK -> `users.id` |
| `question_id` | UUID | non | - | FK -> `questions.id` |
| `attempts_count` | INTEGER | non | 0 | >= 0 |
| `correct_count` | INTEGER | non | 0 | >= 0 |
| `last_answered_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `last_correct` | BOOLEAN | oui | `NULL` |  |
| `last_mode` | `quiz_mode` | oui | `NULL` |  |
| `last_3_results` | TEXT | non | '' | exemple `101` |
| `updated_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- PK(`user_id`, `question_id`)
- `CHECK(attempts_count >= correct_count)`
- `CHECK(last_3_results ~ '^[01]{0,3}$')`

Indexes:
- `INDEX(user_id, updated_at DESC)`

Regles metier derivees:
- `taux_reussite = correct_count / attempts_count` (si attempts_count > 0)
- `par_coeur`:
  - attempts < 4 => taux = 100%
  - attempts >= 4 => taux >= 80%
- `rattrapage`:
  - taux < 60% ou pattern erreur recente (`last_3_results` contient 0)

## 5.17 `user_subject_stats`
But: tableau de bord par matiere (resultats cumules).

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `user_id` | UUID | non | - | FK -> `users.id` |
| `subject_id` | UUID | non | - | FK -> `subjects.id` |
| `attempts_count` | INTEGER | non | 0 |  |
| `correct_count` | INTEGER | non | 0 |  |
| `questions_seen_count` | INTEGER | non | 0 | distinct vues |
| `questions_to_reinforce_count` | INTEGER | non | 0 | derive moteur |
| `updated_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- PK(`user_id`, `subject_id`)
- `CHECK(attempts_count >= correct_count)`

Indexes:
- `INDEX(user_id, updated_at DESC)`

## 5.18 `duels`
But: match asynchrone principal.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `player1_id` | UUID | non | - | FK -> `users.id` |
| `player2_id` | UUID | non | - | FK -> `users.id` |
| `matchmaking_mode` | TEXT | non | - | `friend_invite`, `random_free`, `random_level` |
| `status` | `duel_status` | non | `pending_opener` |  |
| `starter_user_id` | UUID | oui | `NULL` | apres opener + decision |
| `current_turn_user_id` | UUID | oui | `NULL` | joueur actif |
| `current_round_no` | SMALLINT | non | 1 | CHECK 1..5 |
| `player1_score` | SMALLINT | non | 0 | 0..15 (+ tie-break logique) |
| `player2_score` | SMALLINT | non | 0 |  |
| `turn_deadline_at` | TIMESTAMPTZ | oui | `NULL` | 24h / sursis |
| `tie_break_played` | BOOLEAN | non | `FALSE` |  |
| `winner_user_id` | UUID | oui | `NULL` | FK -> `users.id` |
| `win_reason` | TEXT | oui | `NULL` | `score`, `tie_break_speed`, `forfeit`, `timeout` |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `accepted_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `completed_at` | TIMESTAMPTZ | oui | `NULL` |  |

Contraintes:
- `CHECK(player1_id <> player2_id)`
- `CHECK(current_round_no BETWEEN 1 AND 5)`

Indexes:
- `INDEX(current_turn_user_id, status)`
- `INDEX(player1_id, created_at DESC)`
- `INDEX(player2_id, created_at DESC)`

## 5.19 `duel_openers`
But: question d'ouverture (determine gagnant + choix de main).

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `duel_id` | UUID | non | - | UNIQUE, FK -> `duels.id` ON DELETE CASCADE |
| `question_id` | UUID | non | - | FK -> `questions.id` |
| `player1_choice_id` | UUID | oui | `NULL` | FK -> `question_choices.id` |
| `player2_choice_id` | UUID | oui | `NULL` | FK -> `question_choices.id` |
| `player1_correct` | BOOLEAN | oui | `NULL` |  |
| `player2_correct` | BOOLEAN | oui | `NULL` |  |
| `player1_response_time_ms` | INTEGER | oui | `NULL` |  |
| `player2_response_time_ms` | INTEGER | oui | `NULL` |  |
| `winner_user_id` | UUID | oui | `NULL` | FK -> `users.id` |
| `winner_decision` | TEXT | oui | `NULL` | `take_hand` / `leave_hand` |
| `resolved_at` | TIMESTAMPTZ | oui | `NULL` |  |

Indexes:
- `INDEX(duel_id)`

## 5.20 `duel_rounds`
But: 5 manches et leur progression.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `duel_id` | UUID | non | - | FK -> `duels.id` ON DELETE CASCADE |
| `round_no` | SMALLINT | non | - | CHECK 1..5 |
| `offered_subject_1_id` | UUID | non | - | FK -> `subjects.id` |
| `offered_subject_2_id` | UUID | non | - | FK -> `subjects.id` |
| `offered_subject_3_id` | UUID | non | - | FK -> `subjects.id` |
| `chosen_subject_id` | UUID | oui | `NULL` | FK -> `subjects.id` |
| `chosen_by_user_id` | UUID | oui | `NULL` | FK -> `users.id` |
| `status` | `duel_round_status` | non | `awaiting_choice` |  |
| `player1_done_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `player2_done_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(duel_id, round_no)`
- 3 matieres proposees distinctes (trigger/validation service)
- `chosen_subject_id` doit appartenir aux 3 proposees

Indexes:
- `INDEX(duel_id, round_no)`

## 5.21 `duel_round_questions`
But: set de 3 questions par joueur et par manche.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `duel_round_id` | UUID | non | - | FK -> `duel_rounds.id` ON DELETE CASCADE |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `slot_no` | SMALLINT | non | - | CHECK 1..3 |
| `question_id` | UUID | non | - | FK -> `questions.id` |
| `difficulty_snapshot` | SMALLINT | non | - | copie difficulty au tirage |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(duel_round_id, user_id, slot_no)`
- `UNIQUE(duel_round_id, user_id, question_id)`

Indexes:
- `INDEX(duel_round_id, user_id)`

Regle metier:
- equivalence de difficulte entre joueurs geree au service.
- regle v1: niveau tire au hasard (sans repartition imposee), mais strictement identique pour les 2 joueurs d'une meme manche.

## 5.22 `duel_answers`
But: reponses de duel.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `duel_id` | UUID | non | - | FK -> `duels.id` ON DELETE CASCADE |
| `duel_round_id` | UUID | non | - | FK -> `duel_rounds.id` ON DELETE CASCADE |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `question_id` | UUID | non | - | FK -> `questions.id` |
| `selected_choice_id` | UUID | oui | `NULL` | FK -> `question_choices.id` |
| `is_correct` | BOOLEAN | non | - |  |
| `response_time_ms` | INTEGER | oui | `NULL` | CHECK > 0 |
| `slot_no` | SMALLINT | non | - | CHECK 1..3 |
| `answered_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(duel_round_id, user_id, slot_no)`

Indexes:
- `INDEX(duel_id, user_id, answered_at DESC)`

## 5.23 `duel_jokers`
But: gestion du sursis (+24h) avec 1 joker max par joueur/duel.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `duel_id` | UUID | non | - | FK -> `duels.id` ON DELETE CASCADE |
| `requested_by_user_id` | UUID | non | - | FK -> `users.id` |
| `granted_by_user_id` | UUID | non | - | FK -> `users.id` |
| `status` | `joker_status` | non | `pending` |  |
| `hours_granted` | SMALLINT | non | 24 | CHECK = 24 |
| `requested_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `resolved_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `old_deadline_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `new_deadline_at` | TIMESTAMPTZ | oui | `NULL` |  |

Contraintes:
- `UNIQUE(duel_id, requested_by_user_id)` (1 joker max par joueur et duel)
- `CHECK(requested_by_user_id <> granted_by_user_id)`
- `CHECK(hours_granted = 24)`

Indexes:
- `INDEX(duel_id, status, requested_at DESC)`

## 5.24 `notifications`
But: file d'envoi push et historique lecture.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `type` | `notification_type` | non | - |  |
| `payload` | JSONB | non | `'{}'::jsonb` | context duel/session |
| `status` | `notification_status` | non | `pending` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `sent_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `read_at` | TIMESTAMPTZ | oui | `NULL` |  |

Indexes:
- `INDEX(user_id, status, created_at DESC)`
- `INDEX(type, created_at DESC)`

## 5.25 `subscriptions`
But: gestion free/premium.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `plan` | `subscription_plan` | non | `free` |  |
| `status` | `subscription_status` | non | `active` |  |
| `provider` | `subscription_provider` | non | `none` |  |
| `external_ref` | TEXT | oui | `NULL` | id provider |
| `started_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `ends_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `cancelled_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `updated_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- une seule souscription `active` par utilisateur (index unique partiel)

Indexes:
- `INDEX(user_id, status, updated_at DESC)`

## 5.26 `ad_reward_windows`
But: fenetre sans pub de 30 minutes apres rewarded.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `trigger_session_id` | UUID | non | - | FK -> `quiz_sessions.id` |
| `source` | TEXT | non | `rewarded_end_first_session` | v1 |
| `starts_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `ends_at` | TIMESTAMPTZ | non | - | attendu = +30 min |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Indexes:
- `INDEX(user_id, ends_at DESC)`

Regle metier:
- une pub interstitielle `quiz_start_interstitial` n'est pas affichee si `NOW() < ends_at`.

## 5.27 `ad_impressions`
But: traquer affichages pub et recompenses.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `user_id` | UUID | oui | `NULL` | FK -> `users.id` |
| `session_id` | UUID | oui | `NULL` | FK -> `quiz_sessions.id` |
| `placement` | `ad_placement` | non | - |  |
| `network` | TEXT | oui | `NULL` | ad network |
| `revenue_eur` | NUMERIC(10,4) | oui | `NULL` |  |
| `shown_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `clicked_at` | TIMESTAMPTZ | oui | `NULL` |  |
| `reward_granted` | BOOLEAN | non | `FALSE` |  |

Indexes:
- `INDEX(user_id, shown_at DESC)`
- `INDEX(session_id)`
- `INDEX(placement, shown_at DESC)`

## 5.28 `avatar_stages`
But: referentiel des etapes carriere avatar.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `code` | TEXT | non | - | UNIQUE (`pass_las`, `dfgsm2`, `dfgsm3`, `dfasm1`, `dfasm2`, `dfasm3`, `interne`, `docteur_junior`) |
| `name` | TEXT | non | - | libelle UX |
| `sort_order` | SMALLINT | non | - | ordre progression |
| `is_active` | BOOLEAN | non | `TRUE` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(code)`
- `UNIQUE(sort_order)`

## 5.29 `medical_specialties`
But: specialites deblocables au stade `Interne`.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `code` | TEXT | non | - | UNIQUE |
| `name` | TEXT | non | - | ex `Cardiologie` |
| `is_active` | BOOLEAN | non | `TRUE` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(code)`

## 5.30 `avatar_items`
But: catalogue objets/poses/tenues/fonds.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `code` | TEXT | non | - | UNIQUE |
| `name` | TEXT | non | - |  |
| `item_type` | `avatar_item_type` | non | - | `object`, `pose`, `outfit`, `background` |
| `rarity` | TEXT | non | `common` | `common`, `rare`, `epic`, `legendary` |
| `source_type` | TEXT | non | - | `progression`, `event`, `rewarded` |
| `required_stage_id` | UUID | oui | `NULL` | FK -> `avatar_stages.id` |
| `is_active` | BOOLEAN | non | `TRUE` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(code)`
- `CHECK(rarity IN ('common', 'rare', 'epic', 'legendary'))`
- `CHECK(source_type IN ('progression', 'event', 'rewarded'))`

Indexes:
- `INDEX(item_type, rarity)`

## 5.31 `user_avatar_progress`
But: progression avatar utilisateur (carriere + specialite).

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `user_id` | UUID | non | - | PK, FK -> `users.id` |
| `xp_points` | INTEGER | non | 0 | progression globale avatar |
| `current_stage_id` | UUID | non | - | FK -> `avatar_stages.id` |
| `specialty_id` | UUID | oui | `NULL` | FK -> `medical_specialties.id` |
| `stage_updated_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `created_at` | TIMESTAMPTZ | non | `NOW()` |  |
| `updated_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `CHECK(xp_points >= 0)`

Indexes:
- `INDEX(current_stage_id)`

## 5.32 `user_avatar_inventory`
But: inventaire cosmetique debloque par utilisateur.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `item_id` | UUID | non | - | FK -> `avatar_items.id` |
| `acquired_source` | TEXT | non | - | `progression`, `event`, `rewarded` |
| `acquired_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `UNIQUE(user_id, item_id)`
- `CHECK(acquired_source IN ('progression', 'event', 'rewarded'))`

Indexes:
- `INDEX(user_id, acquired_at DESC)`

## 5.33 `user_avatar_equipment`
But: equipement cosmetique actif (1 item par slot/type).

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `user_id` | UUID | non | - | FK -> `users.id` |
| `item_type` | `avatar_item_type` | non | - | slot equipement |
| `item_id` | UUID | non | - | FK -> `avatar_items.id` |
| `equipped_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- PK(`user_id`, `item_type`)

Indexes:
- `INDEX(item_id)`

## 5.34 `rewarded_grants`
But: tracer les recompenses attribuees apres rewarded ad.

| Colonne | Type | Null | Defaut | Notes |
|---|---|---|---|---|
| `id` | UUID | non | - | PK |
| `user_id` | UUID | non | - | FK -> `users.id` |
| `ad_impression_id` | UUID | non | - | FK -> `ad_impressions.id` |
| `grant_type` | `reward_grant_type` | non | - | `ad_free_window` ou `avatar_cosmetic` |
| `ad_reward_window_id` | UUID | oui | `NULL` | FK -> `ad_reward_windows.id` |
| `avatar_item_id` | UUID | oui | `NULL` | FK -> `avatar_items.id` |
| `granted_at` | TIMESTAMPTZ | non | `NOW()` |  |

Contraintes:
- `CHECK((grant_type = 'ad_free_window' AND ad_reward_window_id IS NOT NULL AND avatar_item_id IS NULL) OR (grant_type = 'avatar_cosmetic' AND avatar_item_id IS NOT NULL AND ad_reward_window_id IS NULL))`

Indexes:
- `INDEX(user_id, granted_at DESC)`
- `INDEX(ad_impression_id)`

## 6) Contraintes transverses (service + trigger)

1. QCM v1:
- pour `question_type='single_choice'`, une seule reponse correcte.
- exactement 4 choix par question.

2. Coherence chapitre:
- `questions.chapter_id` doit appartenir a `questions.subject_id`.

3. Modes de session:
- `learning` (questions libres) sert aleatoirement des questions vues et non vues.
- `discovery` ne sert que des questions jamais vues.
- `review` ne sert que des questions deja vues.
- `par_coeur` applique la regle validee (100% <4 tentatives, sinon >=80%).
- `rattrapage` privilegie taux <60% + erreurs recentes.

4. Regle free duel:
- utilisateur free: max 2 duels `pending_opener` + `in_progress`.

5. Sursis duel:
- max 1 joker par joueur et par duel, contrainte `UNIQUE(duel_id, requested_by_user_id)`.

6. Expiration duel:
- deadline depassee sans sursis valide => manche `scored_zero` (0/3).

7. Pub:
- rewarded en fin de premiere session, cree `ad_reward_windows` de 30 min.
- si fenetre active: pas d'interstitiel debut quiz.

8. Avatar progression:
- progression de stage strictement ascendante (pas de retrogradation).
- le stage `Interne` debloque le choix de specialite.
- avant `Interne`, `specialty_id` doit rester `NULL`.

9. Avatar equipement:
- equipement autorise uniquement si item present dans `user_avatar_inventory`.
- un seul item equipe par slot (`item_type`) et par utilisateur.

10. Rewarded cosmetique:
- `rewarded_avatar_cosmetic` peut attribuer un item cosmetique via `rewarded_grants`.
- pas d'avantage gameplay; cosmetique uniquement.

11. Cohabitation rewarded:
- un rewarded peut attribuer soit `30 min sans pub` soit un `cosmetique`, selon type de campagne.
- les cosmetiques peuvent etre deblocables des le debut (sans stage minimum), selon campagne.

## 7) Exemples de lignes (audit rapide)

## 7.1 Exemple utilisateur + progression

```sql
INSERT INTO users (id, email, display_name) VALUES
('00000000-0000-7000-8000-000000000001', 'alice@medmail.fr', 'Alice');

INSERT INTO user_profiles (user_id, study_track, ux_tone, onboarding_completed_at)
VALUES ('00000000-0000-7000-8000-000000000001', 'PASS', 'supportive', NOW());

INSERT INTO user_chapter_progress (user_id, chapter_id, declared_progress_pct)
VALUES ('00000000-0000-7000-8000-000000000001', '10000000-0000-7000-8000-000000000010', 65.00);
```

## 7.2 Exemple question QCM simple

```sql
INSERT INTO questions
(id, subject_id, chapter_id, question_type, prompt, explanation, difficulty, status, curriculum_scope)
VALUES
('20000000-0000-7000-8000-000000000001',
 '10000000-0000-7000-8000-000000000001',
 '10000000-0000-7000-8000-000000000010',
 'single_choice',
 'Lequel de ces elements appartient au systeme nerveux central ?',
 'Le cerveau et la moelle epiniere composent le SNC.',
 2, 'published', 'national');

INSERT INTO question_choices (id, question_id, label, position, is_correct) VALUES
('21000000-0000-7000-8000-000000000001','20000000-0000-7000-8000-000000000001','Nerf radial',1,FALSE),
('21000000-0000-7000-8000-000000000002','20000000-0000-7000-8000-000000000001','Cerveau',2,TRUE),
('21000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000001','Ganglion spinal',3,FALSE),
('21000000-0000-7000-8000-000000000004','20000000-0000-7000-8000-000000000001','Plexus brachial',4,FALSE);
```

## 7.3 Exemple session review + reponse

```sql
INSERT INTO quiz_sessions
(id, user_id, mode, stop_rule, target_question_count, is_first_session_of_day)
VALUES
('30000000-0000-7000-8000-000000000001',
 '00000000-0000-7000-8000-000000000001',
 'review', 'fixed_10', 10, TRUE);

INSERT INTO quiz_session_subject_filters (session_id, subject_id) VALUES
('30000000-0000-7000-8000-000000000001','10000000-0000-7000-8000-000000000001');

INSERT INTO quiz_answers
(id, session_id, user_id, question_id, selected_choice_id, is_correct, response_time_ms, answer_order)
VALUES
('31000000-0000-7000-8000-000000000001',
 '30000000-0000-7000-8000-000000000001',
 '00000000-0000-7000-8000-000000000001',
 '20000000-0000-7000-8000-000000000001',
 '21000000-0000-7000-8000-000000000002',
 TRUE, 4200, 1);
```

## 7.4 Exemple duel + joker

```sql
INSERT INTO duels
(id, player1_id, player2_id, matchmaking_mode, status, current_round_no, current_turn_user_id, turn_deadline_at)
VALUES
('40000000-0000-7000-8000-000000000001',
 '00000000-0000-7000-8000-000000000001',
 '00000000-0000-7000-8000-000000000002',
 'friend_invite', 'in_progress', 2,
 '00000000-0000-7000-8000-000000000002',
 NOW() + INTERVAL '24 hours');

INSERT INTO duel_jokers
(id, duel_id, requested_by_user_id, granted_by_user_id, status, hours_granted, requested_at, resolved_at, old_deadline_at, new_deadline_at)
VALUES
('41000000-0000-7000-8000-000000000001',
 '40000000-0000-7000-8000-000000000001',
 '00000000-0000-7000-8000-000000000002',
 '00000000-0000-7000-8000-000000000001',
 'granted', 24, NOW(), NOW(), NOW() + INTERVAL '24 hours', NOW() + INTERVAL '48 hours');
```

## 7.5 Exemple rewarded 30 min sans pub

```sql
INSERT INTO ad_reward_windows
(id, user_id, trigger_session_id, source, starts_at, ends_at)
VALUES
('50000000-0000-7000-8000-000000000001',
 '00000000-0000-7000-8000-000000000001',
 '30000000-0000-7000-8000-000000000001',
 'rewarded_end_first_session',
 NOW(), NOW() + INTERVAL '30 minutes');
```

## 7.6 Exemple avatar progression + cosmetique rewarded

```sql
INSERT INTO user_avatar_progress
(user_id, xp_points, current_stage_id, specialty_id)
VALUES
('00000000-0000-7000-8000-000000000001', 1850, '60000000-0000-7000-8000-000000000002', NULL);

INSERT INTO user_avatar_inventory
(id, user_id, item_id, acquired_source)
VALUES
('61000000-0000-7000-8000-000000000001',
 '00000000-0000-7000-8000-000000000001',
 '62000000-0000-7000-8000-000000000001',
 'rewarded');

INSERT INTO rewarded_grants
(id, user_id, ad_impression_id, grant_type, avatar_item_id)
VALUES
('63000000-0000-7000-8000-000000000001',
 '00000000-0000-7000-8000-000000000001',
 '64000000-0000-7000-8000-000000000001',
 'avatar_cosmetic',
 '62000000-0000-7000-8000-000000000001');
```

## 8) Decisions validees (Lot B - tranche actuelle)

1. Rewarded:
- Valide: "premiere session" = premiere session de la journee.

2. Difficultes duel:
- Valide: equivalence de difficulte obligatoire pour eviter qu'un joueur se sente lese.
- Regle v1 appliquee: niveau tire au hasard, sans repartition imposee, mais identique pour les 2 joueurs.

3. Flux de selection session:
- Valide: matiere(s) -> chapitre(s) ou matiere complete -> mode d'interrogation.
- Le `session_scope` est retire; la logique est portee par `mode` + filtres matiere/chapitre.

4. QCM v1:
- Valide: 4 choix fixes.

5. Moderation:
- Valide: workflow binaire `approve/reject` en v1.

6. Free duel limit:
- Valide: limite "2 duels actifs" appliquee a tous les duels (lances + recus).

7. Personnalisation avatar:
- Valide: progression avatar long-terme (`PASS/LAS` -> `DFGSM2` -> `DFGSM3` -> `DFASM1` -> `DFASM2` -> `DFASM3` -> `Interne` -> `Docteur junior`).
- Valide: choix specialite au stade `Interne`.
- Valide: objets/poses/tenues/fonds via progression/evenements/rewarded ads.
