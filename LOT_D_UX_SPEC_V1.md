# Lot D - UX Spec v1 (detail auditable)

Date: 2026-02-21
Statut: proposition pour validation
Perimetre: UX produit mobile, copywriting, etats UI, parcours, instrumentation

## 1) Principes UX directeurs

- Public: etudiants PASS/LAS, usage sur sessions courtes et frequentes.
- Ton: accompagnement, clarte, renforcement positif, sans infantilisation.
- Eviter dans l'UI: `faiblesses`, `lacunes`, `retard`.
- Preferer: `points a renforcer`, `prochaine priorite`, `etat des lieux`.
- Priorite UX: aller vite vers une session utile, avec effort cognitif minimal.

## 2) Architecture de navigation

Navigation principale (bottom tabs):
- `Accueil`
- `Entrainement`
- `Duel`
- `Progression`
- `Profil`

Raccourcis critiques:
- `Lancer un quiz` accessible depuis `Accueil` et `Entrainement`.
- `Reprendre duel` accessible depuis `Accueil` et `Duel`.
- `Passer premium` accessible depuis `Profil`, `Duel`, et point de friction pub.

## 3) Design system fonctionnel (v1)

Composants de base:
- `SubjectChip` (matiere)
- `ChapterChip` (chapitre)
- `ModeCard` (learning/review/par coeur/rattrapage/discovery)
- `SessionRulePicker` (`10 questions`, `Nombre`, `Jusqu'a arret`)
- `QuestionCard` + `ChoiceButton`
- `FeedbackPanel` (correct/incorrect + explication)
- `DuelRoundHeader` (manche, score, deadline)
- `AdRewardBanner` (30 min sans pub)
- `PremiumBanner`
- `AvatarStageCard` (etape carriere medecine)
- `AvatarStudio` (pose, objets, tenue, fond)

Etats universels par ecran:
- `loading`
- `empty`
- `error`
- `offline`

## 4) Microcopy guide (ton)

Lignes de base:
- Reussite: `Bien joue, tu consolides cette notion.`
- Erreur: `Bonne tentative. On la retravaille ensemble.`
- Relance: `Encore 3 questions pour finir cette session.`
- Rattrapage: `Voici tes prochaines priorites de revision.`

Interdits copy:
- `Tu es faible en ...`
- `Tu as de grosses lacunes`

## 5) Parcours UX complets

## 5.1 Parcours Onboarding (complet)

Objectif:
- configurer personnalisation sans pression.

Etapes:
1. Ecran bienvenue + promesse de l'app.
2. Choix filiere/annee (informatif).
3. Choix matieres suivies.
4. Choix progression par chapitre (slider 0-100).
5. Preferences duel (ami, aleatoire libre, niveau proche).
6. Permissions push (explication utile, pas coercitive).
7. Ecran recap + bouton `Commencer`.

Etats:
- Loading initial referentiels (matieres/chapitres).
- Erreur reseau: retry + sauvegarde locale temporaire.

Sortie onboarding:
- marque `onboarding_completed_at`
- redirection `Accueil`

## 5.2 Parcours Quiz solo (creation -> jeu -> fin)

Etape A: Setup session
1. Selection matiere(s).
2. Selection chapitre(s) ou `Toute la matiere`.
3. Selection mode:
- `Questions libres`
- `Revision`
- `Par coeur`
- `A revoir`
- `Decouverte`
4. Selection format session:
- `10 questions`
- `Choisir un nombre`
- `Jusqu'a arret`
5. CTA `Demarrer`.

Etape B: Question
- Afficher question + 4 choix.
- Reponse unitaire.
- Feedback immediat (correct + explication).
- CTA `Question suivante`.

Etape C: Fin session
- Carte resultat:
  - `taux de bonne reponse`
  - `questions traitees`
  - `points a renforcer` par matiere/chapitre
- CTA:
  - `Relancer une session`
  - `Aller en revision`
  - `Retour Accueil`

## 5.3 Parcours Duel asynchrone

Etape A: Creation
- Choix mode duel:
  - `Defier un ami`
  - `Joueur aleatoire`
  - `Niveau proche`
- Afficher compteur duels actifs (free: max 2).

Etape B: Opener
- Question d'ouverture (exactitude + rapidite).
- Si victoire opener: choix `Prendre la main` ou `Laisser la main`.

Etape C: Manche
- En-tete: `Manche 2/5`, score, deadline.
- Si c'est ton tour:
  1. Choisir une matiere parmi 3.
  2. Repondre aux 3 questions (unitaire).
  3. A la 3e, cloture auto + notification adverse.
- Si pas ton tour:
  - ecran attente + timer + option `Demander un sursis` si applicable.

Etape D: Sursis joker
- 1 joker max par joueur/duel.
- Demande: modal avec message optionnel.
- Reponse adverse: `Accorder` ou `Refuser`.

Etape E: Fin duel
- Score final.
- Si egalite: tie-break question aleatoire, puis vitesse.
- CTA:
  - `Revanche`
  - `Nouveau duel`

## 5.4 Parcours Publicite / Premium

Regle pub free:
- Fin de premiere session du jour: proposer rewarded.
- Si rewarded acceptee: 30 min sans interstitiel.
- Sinon: interstitiel au debut de chaque quiz.

UX rewarded:
- Message valide: `Regarde une video et profite de 30 min sans pub.`
- Apres reward: badge visible `Sans pub jusqu'a HH:MM`.

UX premium:
- Positionnement: confort + continuites, pas pression.
- Avantages affiches:
  - sans pub
  - plus de duels actifs
  - mode melee
- Prix: `1,99 EUR/mois`.

## 6) Specification ecran par ecran

## 6.1 Ecran Accueil

But:
- point d'entree quotidien en moins de 3 secondes.

Blocs:
- `Etat des lieux du jour`
- `Duel a jouer`
- `Continuer un quiz`
- `Relancer une revision`

Actions:
- `Lancer un quiz`
- `Reprendre duel`
- `Voir progression`

Etat vide:
- nouveau compte: proposer `Demarrer une premiere session`.

Etat erreur:
- fallback local + retry.

Analytics:
- `home_viewed`
- `home_start_quiz_tap`
- `home_resume_duel_tap`

## 6.2 Ecran Entrainement Setup

Champs:
- matieres (multi select)
- chapitres (multi select)
- mode (cards)
- format session

Validations UI:
- au moins 1 matiere requise
- si `fixed_custom`, nombre obligatoire

CTA:
- `Demarrer la session`

Analytics:
- `quiz_setup_opened`
- `quiz_setup_mode_selected`
- `quiz_session_started`

## 6.3 Ecran Question

Elements:
- progression (`4/10`)
- enonce
- 4 choix
- timer discret (optionnel)

Apres reponse:
- feedback immediat
- explication obligatoire visible

Cas limite:
- offline pendant reponse -> file locale et retry

Analytics:
- `quiz_question_viewed`
- `quiz_answer_submitted`
- `quiz_answer_correct`

## 6.4 Ecran Fin session

KPI affiches:
- taux de bonne reponse
- nb questions traitees
- repartition par matiere
- points a renforcer

Actions:
- `Relancer en revision`
- `Changer de mode`
- `Retour Accueil`

Ad slot:
- si free + conditions remplies -> bloc rewarded (non intrusif).

Analytics:
- `quiz_session_completed`
- `rewarded_offer_shown`
- `rewarded_accepted`

## 6.5 Ecran Duel Lobby

Sections:
- duels en attente
- duels en cours
- duels termines

Actions:
- `Defier un ami`
- `Trouver un joueur aleatoire`
- `Trouver niveau proche`

Contraintes visuelles:
- afficher clairement `2/2 duels actifs` pour free.

Analytics:
- `duel_lobby_viewed`
- `duel_create_tap`
- `duel_free_limit_hit`

## 6.6 Ecran Opener Duel

Elements:
- question unique
- feedback opener
- panel resultat des 2 joueurs

Si gagnant:
- modal choix `Prendre la main` / `Laisser la main`.

Analytics:
- `duel_opener_answered`
- `duel_opener_winner_decision`

## 6.7 Ecran Manche Duel (tour actif)

Header:
- `Manche X/5`
- score global
- deadline du tour

Flow:
1. choix matiere (3 options)
2. sequence 3 questions unitaire
3. cloture auto tour

Feedback:
- correction immediate apres chaque reponse

Analytics:
- `duel_subject_chosen`
- `duel_round_answer_submitted`
- `duel_round_completed`

## 6.8 Ecran Duel attente (tour adverse)

Elements:
- timer restant
- bouton `Demander un sursis` si non utilise
- statut demande sursis

Actions:
- `Relancer notification` (valide v1, cooldown anti-spam: 1 action / 12h / duel)

Analytics:
- `duel_wait_viewed`
- `duel_joker_requested`
- `duel_joker_response`

## 6.9 Ecran Fin Duel

Elements:
- score final
- resume manches
- tie-break mention si applique

Actions:
- `Revanche`
- `Nouveau duel`
- `Retour lobby`

Analytics:
- `duel_completed`
- `duel_rematch_tap`

## 6.10 Ecran Progression

Sections:
- taux global
- etat des lieux par matiere
- points a renforcer (top chapitres)
- historique sessions recentes

Mots utilises:
- `A renforcer`, `En progression`, `Bien acquis`

Analytics:
- `progress_viewed`
- `progress_subject_opened`

## 6.11 Ecran Profil

Sections:
- compte
- abonnement
- notifications
- support
- personnalisation joueur

Actions:
- `Passer premium`
- `Gerer abonnement`
- `Se deconnecter`

Personnalisation (proposition v1+):
- pseudo public
- couleur de profil (theme carte duel)
- bio courte (140 caracteres)
- visibilite profil (`public` / `amis` / `prive`)
- acces `Avatar Studio`

Progression avatar (validee):
- l'avatar evolue avec l'activite de jeu (quiz, duel, regularite).
- etapes carriere:
  - `PASS/LAS`
  - `DFGSM2`
  - `DFGSM3`
  - `DFASM1`
  - `DFASM2`
  - `DFASM3`
  - `Interne`
  - `Docteur junior`
- apres `Docteur junior`, evolution specifique selon specialite (phase suivante).
- deblocage specialite a partir du stade `Interne`.
- specialite choisie visible sur la carte profil/duel.
- progression purement cosmetique (pas d'avantage gameplay).

Cosmetiques avatar:
- categories: `objets`, `poses`, `tenues`, `fonds`.
- obtention:
  - rewarded ads (des le debut, drop cosmetique)
  - recompenses de progression
  - recompenses d'evenements
  - mini-concours ponctuels
- equipement depuis `Avatar Studio`.

Analytics:
- `profile_viewed`
- `premium_cta_tap`

## 6.12 Ecran Premium / Paywall

Message:
- angle confort et fluidite.

Contenu:
- prix 1,99 EUR/mois
- avantages premium
- moyens de paiement (Stripe + Apple + Google)

Ordre d'affichage valide:
- iOS: Apple > Stripe
- Android: Google > Stripe
- Web: Stripe

CTAs:
- `Passer premium`
- `Pas maintenant`

Analytics:
- `paywall_viewed`
- `paywall_subscribe_tap`
- `paywall_dismissed`

## 6.13 Ecran Soumettre une question

Formulaire:
- matiere
- chapitre
- enonce
- explication
- 4 choix (1 correct)

Etat post-submit:
- badge `En cours de moderation`.

Analytics:
- `submission_started`
- `submission_submitted`
- `submission_validation_error`

## 6.14 Ecran Avatar Studio

Sections:
- avatar courant (preview)
- barre de progression carriere
- specialite (si stage >= Interne)
- inventaire cosmetique par categorie
- equipement actif (pose/objets/tenue/fond)

Actions:
- `Equiper`
- `Retirer`
- `Voir comment debloquer`
- `Regarder une rewarded pour tenter un cosmetique`

Etats:
- verrouille (objets non debloques)
- nouveau (badge `Nouveau`)

Analytics:
- `avatar_studio_viewed`
- `avatar_item_equipped`
- `avatar_rewarded_cosmetic_claimed`

## 7) Etats UX transverses

Loading:
- skeleton pour listes et cartes.

Empty:
- message actionnable + CTA.

Error:
- message court, cause probable, retry.

Offline:
- bandeau `Tu es hors ligne, on synchronise des que possible`.

## 8) Notifications push (UX)

Types v1:
- tour duel disponible
- sursis demande
- sursis accorde/refuse
- duel termine
- rappel revision

Regles:
- frequence limitee (pas de spam)
- contenu informatif, ton neutre positif

Exemples:
- `Ton tour est pret dans le duel contre Lea.`
- `Sursis accorde: +24h pour ce duel.`

## 9) Accessibilite et qualite d'usage

- contrastes AA minimum
- zones tactiles >= 44px
- labels explicites pour lecteurs d'ecran
- ordre focus coherent
- taille texte ajustable sans casser layout

## 10) Instrumentation analytics minimale

Evenements critiques:
- onboarding:
  - `onboarding_started`, `onboarding_completed`
- quiz:
  - `quiz_session_started`, `quiz_answer_submitted`, `quiz_session_completed`
- duel:
  - `duel_created`, `duel_opener_answered`, `duel_round_completed`, `duel_completed`
- monetisation:
  - `rewarded_offer_shown`, `rewarded_accepted`, `paywall_viewed`, `subscription_purchased`
- avatar:
  - `avatar_stage_up`
  - `avatar_specialty_selected`
  - `avatar_item_unlocked`
  - `avatar_item_equipped`

Parametres communs:
- `userId`, `sessionId`, `mode`, `subjectIds`, `plan`, `networkState`, `appVersion`

## 11) QA UX (checklist v1)

- Onboarding complet possible sans blocage.
- Creation session en <= 15 sec pour un user habitue.
- Feedback question visible en < 300 ms apres validation reponse.
- Flow duel complet jouable sans ambiguite d'etat de tour.
- Rewarded accorde bien 30 min sans interstitiel.
- Paywall comprehensible en une lecture.
- avatar evolue correctement de `PASS/LAS` vers `Interne`, puis specialite selectionnable.
- rewarded cosmetique credite un item dans l'inventaire.

## 12) Decisions Lot D (etat courant)

1. Navigation:
- Valide: onglet `Entrainement` (a la place de `Quiz`) dans la barre principale.

2. Home:
- Valide: priorite visuelle `Duel a jouer` avant `Continuer un quiz`.

3. Rewarded:
- Valide: wording `Regarde une video et profite de 30 min sans pub.`

4. Duel attente:
- Valide: bouton `Relancer notification` present en v1 avec cooldown anti-spam.

5. Paywall:
- Valide: iOS (Apple > Stripe), Android (Google > Stripe), Web (Stripe).

6. Personnalisation profil joueur:
- Valide: personnalisation avancee avec avatar evolutif de carriere medicale.
- Valide: deblocage specialite au stade `Interne`.
- Valide: objets/poses/tenues/fonds, dont une partie via rewarded ads.
- Valide: parcours avatar cible `PASS/LAS -> DFGSM2 -> DFGSM3 -> DFASM1 -> DFASM2 -> DFASM3 -> Interne -> Docteur junior`.
