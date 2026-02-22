# Lot A - Revue Produit v3 (a valider)

Date: 2026-02-21
Statut: proposition consolidee a partir des decisions validees

## 1) Positionnement

- Cible principale: etudiants PASS/LAS en France.
- Portee du contenu: nationale, generique, hors-sujet interdit.
- Usage vise: toute l'annee, avec sessions courtes pendant les temps morts.
- Ton produit: accompagnement, confiance, renforcement positif.
- Style non retenu: langage anxiogene ou culpabilisant.

## 2) Experience de session (important)

L'utilisateur choisit le format de session avant de jouer:
- `10 questions`
- `Nombre personnalise`
- `Jusqu'a arret`

Ces formats s'appliquent aux modes solo (et peuvent etre limites par regles internes si besoin de performance serveur).

## 3) Filtrage pedagogique

Avant une session, l'utilisateur peut filtrer:
- Par matiere
- Par chapitre
- Par progression declaree (ou il en est dans son programme)
- `Questions deja revisees`
- `Questions totalement aleatoires`

Objectif: laisser l'etudiant piloter finement son parcours.

## 4) Onboarding

- Onboarding complet (detaille), assume comme plus long.
- Filiere/annee demandee a titre informatif uniquement.
- Pas d'objectif de productivite impose.
- Les champs centraux: progression par matiere/chapitre et preferences de revision.

## 5) Modes de jeu solo

## 5.1 Apprentissage
- Banque globale configurable avec filtres utilisateur.
- Peut contenir des questions deja vues selon le contexte de progression.

## 5.2 Decouverte
- Uniquement questions jamais vues par l'utilisateur.

## 5.3 Revision
- Questions deja vues.
- L'utilisateur choisit: toutes matieres ou selection restreinte.

## 5.4 Par coeur
Regle validee:
- Si tentatives < 4: question eligible seulement si 100% de reussite.
- Si tentatives >= 4: question eligible si taux de reussite >= 80%.

## 5.5 Rattrapage
- Questions ratees ou instables.
- Priorite aux erreurs recentes.

## 6) Duel asynchrone (mode principal social)

Format:
- 5 manches
- 3 questions par manche
- 15 points max

Adversaire:
- Invitation ami
- OU matchmaking aleatoire
- OU matchmaking niveau proche (choix utilisateur)

Debut duel:
- Question d'ouverture (exactitude + rapidite) pour designer le gagnant.
- Le gagnant choisit de prendre la main ou de laisser la main.

Tour de jeu:
- Le joueur actif choisit une matiere parmi 3 propositions.
- Repond a 3 questions.
- Fin de tour: notification a l'adversaire.
- Correction visible immediatement apres reponse (valide).

Fin duel:
- Score cumule apres 5 manches.
- Tie-break si egalite: 1 question aleatoire.
- Si nouvelle egalite: vitesse de reponse.

## 7) Delais, sursis, penalites (duel)

- Delai standard: 24h par tour.
- Sursis: +24h possible.
- Regle de joker: 1 sursis max par duel et par joueur (1 joker chacun).
- A H48 sans sursis actif: manche penalisee a 0/3 pour le joueur en retard.

## 8) Progression et evaluation

Affichage prefere:
- Etat des lieux par matiere
- Pourcentage du programme couvre
- Taux de reussite
- Resultats cumules par matiere sur tous les quiz
- Identification des points a retravailler pour le mode revision
- Streak strict (cassable), avec recompenses ponctuelles

Mots a eviter dans l'UX:
- `faiblesses`
- `lacunes`

Alternatives:
- `points a renforcer`
- `prochaine priorite`

## 9) Monetisation

Plan gratuit:
- Rewarded video a la fin de la premiere session, recompense: 30 min sans pub
- Si pas de bonus actif: interstitiel au debut de chaque quiz
- 2 duels simultanes max

Plan premium:
- Sans pub
- Plus de confort de jeu
- Mode melee de groupe
- Prix cible: 1,99 EUR/mois
- Pas d'essai gratuit

## 10) Qualite contenu

- Explication obligatoire pour chaque question.
- Source officielle non obligatoire.
- Qualite editoriale elevee des la v1.
- QCM simple en v1.
- Evolutions prevues: QCM reponses multiples, puis questions ouvertes.

## 11) Propositions utilisateur (questions)

Autoriser la proposition de questions par utilisateurs, avec moderation.

Workflow v1 propose:
1. Soumission utilisateur
2. Statut `pending`
3. Relecture equipe editoriale
4. `approved` (publication) ou `rejected` (motif)
5. Signalement post-publication possible

## 12) Classements

- Pas de classement global en v1.
- Priorite a la progression personnelle et aux resultats de duel.
- Evenements concours possibles plus tard (ponctuels, optionnels).

## 13) Decisions finales Lot A (validees)

1. Sursis duel:
- 1 sursis max par joueur et par duel (1 joker chacun).

2. Matchmaking:
- Les 2 options restent disponibles:
  - aleatoire libre
  - niveau proche

3. Publicites v1:
- Rewarded video en fin de premiere session avec recompense 30 min sans pub.
- Si pas de bonus sans pub actif: interstitiel au debut de chaque quiz.

4. Evaluation:
- Pas de score composite.
- KPI utilisateur principal: taux de bonne reponse.
- Priorisation revision basee sur les resultats cumules par matiere.

5. Statut:
- Lot A ferme, passage possible au Lot B.
