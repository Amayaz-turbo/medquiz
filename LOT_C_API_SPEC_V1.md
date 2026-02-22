# Lot C - API Spec v1 (detail auditable)

Date: 2026-02-21
Statut: proposition pour validation
Perimetre: API REST v1 alignee sur `schema.sql` et Lot B valide

## 1) Conventions API

- Base URL: `/v1`
- Format: JSON UTF-8
- Timezone serveur: UTC (`ISO-8601`)
- Auth: `Authorization: Bearer <jwt_access_token>`
- Idempotence recommandee sur endpoints de creation critiques:
  - header `Idempotency-Key`
  - concerne: creation session quiz, creation duel, checkout subscription

## 2) Enveloppe reponse

Succes:
```json
{
  "data": {},
  "meta": {}
}
```

Erreur:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "targetQuestionCount must be 10 when stopRule=fixed_10",
    "details": [
      {"field": "targetQuestionCount", "reason": "invalid_for_stop_rule"}
    ],
    "requestId": "req_01J..."
  }
}
```

## 3) Codes d'erreur standards

- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 CONFLICT`
- `422 BUSINESS_RULE_VIOLATION`
- `429 RATE_LIMITED`
- `500 INTERNAL_ERROR`

Codes metier recurrents:
- `FREE_DUEL_LIMIT_REACHED`
- `DUEL_NOT_YOUR_TURN`
- `DUEL_SUBJECT_NOT_OFFERED`
- `DUEL_JOKER_ALREADY_USED`
- `SESSION_ALREADY_COMPLETED`
- `QUESTION_NOT_IN_SESSION`
- `REWARDED_NOT_ELIGIBLE`
- `AVATAR_SPECIALTY_LOCKED`
- `AVATAR_ITEM_NOT_OWNED`
- `AVATAR_ITEM_STAGE_LOCKED`

## 4) Auth et compte

## 4.1 POST `/v1/auth/register`

But: creation compte.

Body:
```json
{
  "email": "alice@medmail.fr",
  "password": "StrongPassword123!",
  "displayName": "Alice"
}
```

200:
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "alice@medmail.fr",
      "displayName": "Alice"
    },
    "tokens": {
      "accessToken": "jwt",
      "refreshToken": "jwt"
    }
  }
}
```

## 4.2 POST `/v1/auth/login`

Body:
```json
{
  "email": "alice@medmail.fr",
  "password": "StrongPassword123!"
}
```

## 4.3 POST `/v1/auth/refresh`

Body:
```json
{
  "refreshToken": "jwt"
}
```

## 4.4 POST `/v1/auth/logout`

But: invalidation du refresh token courant.

## 4.5 GET `/v1/me`

But: profil courant + plan.

200:
```json
{
  "data": {
    "id": "uuid",
    "email": "alice@medmail.fr",
    "displayName": "Alice",
    "timezone": "Europe/Paris",
    "countryCode": "FR",
    "subscription": {
      "plan": "free",
      "status": "active"
    }
  }
}
```

## 4.6 PATCH `/v1/me/profile`

Body:
```json
{
  "displayName": "Alice M",
  "studyTrack": "PASS",
  "yearLabel": "P1",
  "uxTone": "supportive"
}
```

## 4.7 PUT `/v1/me/push-token`

But: enregistrer le token push mobile.

Body:
```json
{
  "platform": "ios",
  "pushToken": "fcm_or_apns_token"
}
```

## 4.8 POST `/v1/auth/oauth/google`

But: connexion/inscription Google.

Body:
```json
{
  "idToken": "google_id_token"
}
```

Validation:
- verifier signature Google
- verifier audience client id

## 4.9 POST `/v1/auth/oauth/apple`

But: connexion/inscription Apple.

Body:
```json
{
  "identityToken": "apple_identity_token",
  "authorizationCode": "optional_code"
}
```

Validation:
- verifier signature Apple
- verifier audience/bundle id

## 5) Referentiel pedagogique

## 5.1 GET `/v1/subjects`

But: liste matieres actives.

## 5.2 GET `/v1/subjects/{subjectId}/chapters`

But: chapitres actifs par matiere.

## 5.3 PUT `/v1/me/progress/chapters`

But: declarer avancement par chapitre.

Body:
```json
{
  "items": [
    {"chapterId": "uuid", "declaredProgressPct": 65.0},
    {"chapterId": "uuid", "declaredProgressPct": 20.0}
  ]
}
```

Validation:
- `declaredProgressPct` entre `0` et `100`

## 6) Quiz solo

Flux v1:
1. Choisir matiere(s)
2. Choisir chapitre(s) ou matiere complete
3. Choisir mode (`learning`, `review`, `par_coeur`, `rattrapage`, `discovery`)
4. Choisir format session (`fixed_10`, `fixed_custom`, `until_stop`)

## 6.1 POST `/v1/quiz/sessions`

But: creer une session solo.

Body:
```json
{
  "mode": "review",
  "stopRule": "fixed_10",
  "targetQuestionCount": 10,
  "subjectIds": ["uuid-subject-1"],
  "chapterIds": ["uuid-chapter-1", "uuid-chapter-2"]
}
```

Validation:
- `stopRule=fixed_10` -> `targetQuestionCount=10`
- `stopRule=fixed_custom` -> `targetQuestionCount` entre `1` et `200`
- `stopRule=until_stop` -> `targetQuestionCount` absent/null
- `review` -> questions deja vues uniquement
- `discovery` -> questions jamais vues uniquement
- `par_coeur` -> regle 100% (<4 tentatives) sinon >=80%
- `rattrapage` -> questions ratees/instables

201:
```json
{
  "data": {
    "session": {
      "id": "uuid",
      "mode": "review",
      "stopRule": "fixed_10",
      "targetQuestionCount": 10,
      "isFirstSessionOfDay": true,
      "startedAt": "2026-02-21T21:00:00Z"
    }
  }
}
```

## 6.2 GET `/v1/quiz/sessions/{sessionId}`

But: etat session + progression.

## 6.3 GET `/v1/quiz/sessions/{sessionId}/next-question`

But: recuperer prochaine question de la session.

200 (question):
```json
{
  "data": {
    "question": {
      "id": "uuid",
      "prompt": "...",
      "choices": [
        {"id": "uuid1", "label": "A", "position": 1},
        {"id": "uuid2", "label": "B", "position": 2},
        {"id": "uuid3", "label": "C", "position": 3},
        {"id": "uuid4", "label": "D", "position": 4}
      ],
      "subjectId": "uuid",
      "chapterId": "uuid"
    },
    "progress": {
      "answeredCount": 3,
      "targetQuestionCount": 10,
      "canStopNow": true
    }
  }
}
```

200 (session terminee):
```json
{
  "data": {
    "question": null,
    "sessionCompleted": true
  }
}
```

## 6.4 POST `/v1/quiz/sessions/{sessionId}/answers`

But: soumettre une reponse (feedback immediat obligatoire).

Body:
```json
{
  "questionId": "uuid",
  "selectedChoiceId": "uuid",
  "responseTimeMs": 4200
}
```

200:
```json
{
  "data": {
    "result": {
      "isCorrect": true,
      "correctChoiceId": "uuid",
      "explanation": "Le cerveau et la moelle epiniere..."
    },
    "progress": {
      "answeredCount": 4,
      "targetQuestionCount": 10,
      "sessionCompleted": false
    }
  }
}
```

Erreurs:
- `QUESTION_NOT_IN_SESSION`
- `SESSION_ALREADY_COMPLETED`

## 6.5 POST `/v1/quiz/sessions/{sessionId}/complete`

But: terminer explicitement une session `until_stop`.

Body:
```json
{
  "endedReason": "user_stop"
}
```

## 6.6 GET `/v1/me/stats/subjects`

But: etat des lieux par matiere.

200:
```json
{
  "data": {
    "items": [
      {
        "subjectId": "uuid",
        "attemptsCount": 120,
        "correctCount": 92,
        "successRate": 76.67,
        "questionsSeenCount": 58,
        "questionsToReinforceCount": 14
      }
    ]
  }
}
```

## 6.7 GET `/v1/me/stats/summary`

But: resume global (taux de bonne reponse + streak + activite).

## 7) Publicites et fenetre sans pub

Regle v1:
- Rewarded possible en fin de premiere session de la journee.
- Recompense: 30 min sans interstitiel.
- Interstitiel sinon au debut de chaque quiz (si user free).
- Rewarded cosmetique possible sur ecrans avatar/progression (campagnes dediees).

## 7.1 GET `/v1/ads/eligibility`

Query:
- `placement` (`rewarded_end_first_session`, `quiz_start_interstitial`, `rewarded_avatar_cosmetic`)
- `sessionId` optionnel

200:
```json
{
  "data": {
    "placement": "quiz_start_interstitial",
    "eligible": false,
    "reason": "reward_window_active",
    "rewardWindowEndsAt": "2026-02-21T21:30:00Z"
  }
}
```

## 7.2 POST `/v1/ads/impressions`

But: tracer affichage/clic/reward.

Body:
```json
{
  "placement": "rewarded_end_first_session",
  "sessionId": "uuid",
  "network": "admob",
  "rewardGranted": true
}
```

## 7.3 POST `/v1/ads/reward-grants`

But: attribuer une recompense apres rewarded valide (sans pub ou cosmetique avatar).

Body:
```json
{
  "sessionId": "uuid",
  "placement": "rewarded_end_first_session",
  "grantType": "ad_free_window"
}
```

Body (cosmetique):
```json
{
  "placement": "rewarded_avatar_cosmetic",
  "grantType": "avatar_cosmetic"
}
```

200 (cosmetique):
```json
{
  "data": {
    "grantType": "avatar_cosmetic",
    "avatarItem": {
      "id": "uuid-item",
      "name": "Stethoscope Neon",
      "itemType": "object",
      "rarity": "rare"
    }
  }
}
```

Erreurs:
- `REWARDED_NOT_ELIGIBLE`

## 8) Duels asynchrones

Regles v1:
- 5 manches x 3 questions
- duel ami, random libre, random niveau proche
- question d'ouverture (exactitude + rapidite)
- gagnant de l'ouverture choisit `take_hand` ou `leave_hand`
- 24h par tour, 1 joker/sursis max par joueur/duel
- free: max 2 duels actifs (lances + recus)
- difficulte tiree au hasard mais identique entre joueurs sur une meme manche

## 8.1 POST `/v1/duels`

Body (ami):
```json
{
  "matchmakingMode": "friend_invite",
  "opponentUserId": "uuid"
}
```

Body (random):
```json
{
  "matchmakingMode": "random_free"
}
```

201:
```json
{
  "data": {
    "duelId": "uuid",
    "status": "pending_opener"
  }
}
```

Erreurs:
- `FREE_DUEL_LIMIT_REACHED`

## 8.2 GET `/v1/duels`

Query:
- `status` optionnel (`pending_opener`, `in_progress`, `completed`)
- `limit`, `cursor`

## 8.3 GET `/v1/duels/{duelId}`

But: detail duel (scores, manche courante, deadlines, statut joker).

## 8.4 POST `/v1/duels/{duelId}/accept`

But: accepter invitation duel ami.

## 8.5 POST `/v1/duels/{duelId}/decline`

But: refuser invitation duel ami.

## 8.6 GET `/v1/duels/{duelId}/opener`

But: recuperer question d'ouverture.

## 8.7 POST `/v1/duels/{duelId}/opener/answer`

Body:
```json
{
  "selectedChoiceId": "uuid",
  "responseTimeMs": 3500
}
```

## 8.8 POST `/v1/duels/{duelId}/opener/decision`

But: decision du gagnant opener (`take_hand` / `leave_hand`).

Body:
```json
{
  "decision": "take_hand"
}
```

## 8.9 GET `/v1/duels/{duelId}/rounds/current`

But: etat de la manche active + matieres proposees.

200:
```json
{
  "data": {
    "roundNo": 2,
    "status": "awaiting_choice",
    "offeredSubjects": [
      {"id": "uuid-s1", "name": "Anatomie"},
      {"id": "uuid-s2", "name": "Biophysique"},
      {"id": "uuid-s3", "name": "Histologie"}
    ],
    "currentTurnUserId": "uuid"
  }
}
```

## 8.10 POST `/v1/duels/{duelId}/rounds/{roundNo}/choose-subject`

Body:
```json
{
  "subjectId": "uuid-s2"
}
```

Erreurs:
- `DUEL_NOT_YOUR_TURN`
- `DUEL_SUBJECT_NOT_OFFERED`

## 8.11 GET `/v1/duels/{duelId}/rounds/{roundNo}/questions`

But: 3 questions assignees au joueur courant pour la manche.

## 8.12 POST `/v1/duels/{duelId}/rounds/{roundNo}/answers`

Body:
```json
{
  "slotNo": 1,
  "questionId": "uuid",
  "selectedChoiceId": "uuid",
  "responseTimeMs": 4100
}
```

200:
```json
{
  "data": {
    "answerResult": {
      "isCorrect": true,
      "correctChoiceId": "uuid",
      "explanation": "..."
    },
    "roundProgress": {
      "answeredSlots": 1,
      "remainingSlots": 2
    },
    "turnCompleted": false
  }
}
```

Comportement:
- endpoint unitaire (1 question a la fois) pour robustesse reseau.
- a la 3e reponse validee, le tour est automatiquement cloture:
  - score manche calcule
  - score total mis a jour
  - notification adverse envoyee

## 8.13 POST `/v1/duels/{duelId}/jokers/request`

But: demander un sursis +24h.

Body:
```json
{
  "reason": "Je suis en garde ce soir"
}
```

Erreurs:
- `DUEL_JOKER_ALREADY_USED`

## 8.14 POST `/v1/duels/{duelId}/jokers/{jokerId}/respond`

But: adversaire accorde ou refuse le sursis.

Body:
```json
{
  "decision": "grant"
}
```

## 8.15 POST `/v1/duels/{duelId}/forfeit`

But: abandon duel.

## 8.16 Job interne `expire_duel_turns` (sans endpoint HTTP)

But: job cron/worker backend qui applique `0/3` aux tours expires.

Implementation v1:
- execution periodique (ex: toutes les 5 minutes)
- aucune route HTTP exposee pour cette operation
- logs techniques internes + metriques d'execution

## 9) Notifications

## 9.1 GET `/v1/notifications`

Query:
- `status` optionnel
- `limit`, `cursor`

## 9.2 POST `/v1/notifications/{notificationId}/read`

But: marquer une notification comme lue.

## 10) Abonnement / billing

## 10.1 GET `/v1/billing/subscription`

But: plan actuel + dates.

## 10.2 POST `/v1/billing/checkout-session`

But: demarrer achat premium 1,99 EUR/mois.

Body:
```json
{
  "provider": "stripe",
  "plan": "premium"
}
```

## 10.3 POST `/v1/billing/webhooks/stripe`

But: mise a jour etat abonnement depuis Stripe.

Securite:
- verification signature obligatoire.

## 10.4 POST `/v1/billing/apple/verify-receipt`

But: verifier transaction Apple cote serveur et mettre a jour subscription.

## 10.5 POST `/v1/billing/google/verify-purchase`

But: verifier transaction Google Play cote serveur et mettre a jour subscription.

## 10.6 POST `/v1/billing/restore`

But: restaurer achat Apple/Google.

## 11) Contributions et moderation

## 11.1 POST `/v1/question-submissions`

But: proposer une question.

Body:
```json
{
  "subjectId": "uuid",
  "chapterId": "uuid",
  "questionType": "single_choice",
  "prompt": "...",
  "explanation": "...",
  "choices": [
    {"label": "A", "position": 1, "isCorrect": false},
    {"label": "B", "position": 2, "isCorrect": true},
    {"label": "C", "position": 3, "isCorrect": false},
    {"label": "D", "position": 4, "isCorrect": false}
  ]
}
```

Validation:
- v1 `single_choice`
- exactement 4 choix
- exactement 1 choix correct

## 11.2 GET `/v1/question-submissions/me`

But: suivi des soumissions de l'utilisateur.

## 11.3 GET `/v1/question-submissions/{submissionId}`

But: detail + statut moderation (`pending`, `approved`, `rejected`).

## 11.4 POST `/v1/questions/{questionId}/reports`

But: signaler une question publiee.

Body:
```json
{
  "reasonCode": "unclear",
  "comment": "Formulation ambigue"
}
```

## 11.5 Endpoints internes moderation (admin)

- `GET /v1/admin/question-submissions?status=pending`
- `POST /v1/admin/question-submissions/{id}/approve`
- `POST /v1/admin/question-submissions/{id}/reject`

## 11.6 Avatar et personnalisation

## 11.6.1 GET `/v1/me/avatar`

But: recuperer etat avatar complet de l'utilisateur.

200:
```json
{
  "data": {
    "stage": {"code": "dfgsm3", "name": "DFGSM3"},
    "xpPoints": 1850,
    "nextStage": {"code": "dfasm1", "xpRequired": 2400},
    "specialty": null,
    "equipped": {
      "object": "uuid-item-1",
      "pose": "uuid-item-2",
      "outfit": "uuid-item-3",
      "background": "uuid-item-4"
    }
  }
}
```

## 11.6.2 PATCH `/v1/me/profile/customization`

But: modifier personnalisation de profil (hors avatar inventory).

Body:
```json
{
  "publicAlias": "AnatMaster",
  "profileColor": "#1F6FEB",
  "bio": "Objectif internat cardio",
  "visibility": "friends"
}
```

## 11.6.3 GET `/v1/avatar/stages`

But: liste des etapes carriere avatar.

## 11.6.4 GET `/v1/avatar/specialties`

But: liste specialites disponibles.

## 11.6.5 POST `/v1/me/avatar/specialty`

But: choisir sa specialite (deblocable au stade `Interne`).

Body:
```json
{
  "specialtyId": "uuid-specialty"
}
```

Erreurs:
- `AVATAR_SPECIALTY_LOCKED`

## 11.6.6 GET `/v1/me/avatar/inventory`

But: recuperer inventaire cosmetique.

Query:
- `itemType` optionnel (`object`, `pose`, `outfit`, `background`)

## 11.6.7 POST `/v1/me/avatar/equipment`

But: equiper un item cosmetique.

Body:
```json
{
  "itemType": "pose",
  "itemId": "uuid-item"
}
```

Erreurs:
- `AVATAR_ITEM_NOT_OWNED`
- `AVATAR_ITEM_STAGE_LOCKED`

## 12) Pagination et tri

Convention v1 sur listes:
- Query: `limit` (defaut 20, max 100)
- Query: `cursor` (opaque)
- Reponse `meta`:
```json
{
  "meta": {
    "nextCursor": "opaque_cursor_or_null"
  }
}
```

## 13) Rate limit (baseline v1 validee)

- Auth endpoints: 10 req/min/IP
- Quiz answers: 120 req/min/user
- Duel actions sensibles: 30 req/min/user
- Submission questions: 10 req/jour/user

## 14) Matrice droits

- User authentifie:
  - quiz solo, duel, stats, soumissions, reports
- User premium:
  - sans pub + exemptions fonctionnelles premium
- Admin:
  - moderation soumissions
- Service interne:
  - jobs expiration duel, webhooks verifies

## 15) Tests API minimaux (acceptance)

1. Quiz:
- creer session `review` avec filtre chapitre, repondre 10 questions, verifier completion.

2. Duel:
- creation -> opener -> decision main -> 3 reponses unitaires -> cloture manche auto -> notification adverse.

3. Joker:
- 1 request grant OK, 2e request meme joueur => `DUEL_JOKER_ALREADY_USED`.

4. Free limit:
- 3e duel actif user free => `FREE_DUEL_LIMIT_REACHED`.

5. Rewarded:
- premiere session finie -> eligible rewarded -> reward grant -> interstitiel bloque 30 min.

6. Moderation:
- soumission invalide (3 choix) => `VALIDATION_ERROR`.

7. Avatar:
- progression avatar (XP -> stage) verifiee.
- choix specialite refuse avant `Interne`, accepte a `Interne`.
- rewarded cosmetique attribue bien un item equipable.

## 16) Decisions Lot C (etat courant)

1. Auth providers v1:
- Valide: email/password + Google + Apple des le lancement.

2. Reponses duel:
- Valide: endpoint unitaire (1 reponse par appel), plus robuste que bulk.

3. Expiration des tours duel:
- Valide: Option B, job direct (worker/cron) sans endpoint interne HTTP expose.

4. Billing v1:
- Valide: stack complete des le lancement (Stripe + Apple + Google) avec verification serveur.

5. Rate limits:
- Valide: conserver les seuils proposes en baseline v1.

6. Avatar personnalisation:
- Valide: progression avatar carriere medicale + specialite a `Interne`.
- Valide: objets/poses/tenues/fonds dont acquisition via rewarded ads.
