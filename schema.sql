BEGIN;

-- Optional: useful if you later decide to generate UUIDs in SQL.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Enum Types
-- =========================
CREATE TYPE question_type AS ENUM ('single_choice', 'multi_choice', 'open_text');
CREATE TYPE question_status AS ENUM ('draft', 'published', 'retired');
CREATE TYPE quiz_mode AS ENUM ('learning', 'discovery', 'review', 'par_coeur', 'rattrapage');
CREATE TYPE session_stop_rule AS ENUM ('fixed_10', 'fixed_custom', 'until_stop');
CREATE TYPE duel_status AS ENUM ('pending_opener', 'in_progress', 'completed', 'cancelled', 'expired');
CREATE TYPE duel_round_status AS ENUM ('awaiting_choice', 'player1_turn', 'player2_turn', 'completed', 'scored_zero');
CREATE TYPE joker_status AS ENUM ('pending', 'granted', 'rejected', 'expired');
CREATE TYPE notification_type AS ENUM ('duel_turn', 'duel_joker_request', 'duel_joker_granted', 'duel_finished', 'review_reminder');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'read');
CREATE TYPE subscription_plan AS ENUM ('free', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'expired');
CREATE TYPE subscription_provider AS ENUM ('none', 'stripe', 'apple', 'google');
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE submission_review_action AS ENUM ('approve', 'reject');
CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'closed');
CREATE TYPE ad_placement AS ENUM ('rewarded_end_first_session', 'quiz_start_interstitial', 'rewarded_avatar_cosmetic');
CREATE TYPE avatar_item_type AS ENUM ('object', 'pose', 'outfit', 'background');
CREATE TYPE reward_grant_type AS ENUM ('ad_free_window', 'avatar_cosmetic');

-- =========================
-- Generic helpers
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- =========================
-- Core User & Content Tables
-- =========================
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  country_code CHAR(2) NOT NULL DEFAULT 'FR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  CONSTRAINT users_email_lower_chk CHECK (email = LOWER(email))
);

CREATE INDEX users_last_seen_idx ON users (last_seen_at DESC);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  study_track TEXT,
  year_label TEXT,
  ux_tone TEXT NOT NULL DEFAULT 'supportive',
  public_alias TEXT,
  profile_color TEXT,
  bio TEXT,
  visibility TEXT NOT NULL DEFAULT 'friends',
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_profiles_visibility_chk CHECK (visibility IN ('public', 'friends', 'private')),
  CONSTRAINT user_profiles_bio_len_chk CHECK (bio IS NULL OR LENGTH(bio) <= 140)
);

CREATE TRIGGER user_profiles_set_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE subjects (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subjects_code_upper_chk CHECK (code = UPPER(code))
);

CREATE INDEX subjects_sort_order_idx ON subjects (sort_order);

CREATE TABLE chapters (
  id UUID PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chapters_subject_code_uniq UNIQUE (subject_id, code)
);

CREATE INDEX chapters_subject_sort_idx ON chapters (subject_id, sort_order);

CREATE TABLE questions (
  id UUID PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  question_type question_type NOT NULL DEFAULT 'single_choice',
  prompt TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty SMALLINT NOT NULL,
  status question_status NOT NULL DEFAULT 'draft',
  curriculum_scope TEXT NOT NULL DEFAULT 'national',
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT questions_difficulty_chk CHECK (difficulty BETWEEN 1 AND 5),
  CONSTRAINT questions_curriculum_scope_chk CHECK (curriculum_scope = 'national'),
  CONSTRAINT questions_published_ts_chk CHECK (
    (status <> 'published') OR (published_at IS NOT NULL)
  ),
  CONSTRAINT questions_retired_ts_chk CHECK (
    (status <> 'retired') OR (retired_at IS NOT NULL)
  )
);

CREATE INDEX questions_status_subject_chapter_idx ON questions (status, subject_id, chapter_id);
CREATE INDEX questions_subject_chapter_difficulty_idx ON questions (subject_id, chapter_id, difficulty);

CREATE TRIGGER questions_set_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE question_choices (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position SMALLINT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_choices_position_chk CHECK (position BETWEEN 1 AND 4),
  CONSTRAINT question_choices_question_position_uniq UNIQUE (question_id, position)
);

CREATE INDEX question_choices_question_idx ON question_choices (question_id);

CREATE TABLE question_reports (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  reason_code TEXT NOT NULL,
  comment TEXT,
  status report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  CONSTRAINT question_reports_reason_code_chk CHECK (
    reason_code IN ('wrong_answer', 'unclear', 'out_of_scope', 'typo', 'other')
  )
);

CREATE INDEX question_reports_question_status_idx ON question_reports (question_id, status);
CREATE INDEX question_reports_user_created_idx ON question_reports (user_id, created_at DESC);

CREATE TABLE question_submissions (
  id UUID PRIMARY KEY,
  proposer_user_id UUID NOT NULL REFERENCES users(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  question_type question_type NOT NULL DEFAULT 'single_choice',
  prompt TEXT NOT NULL,
  explanation TEXT NOT NULL,
  status submission_status NOT NULL DEFAULT 'pending',
  reviewed_by_user_id UUID REFERENCES users(id),
  review_note TEXT,
  published_question_id UUID REFERENCES questions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  CONSTRAINT question_submissions_approved_requires_publish_chk CHECK (
    status <> 'approved' OR (
      published_question_id IS NOT NULL
      AND reviewed_by_user_id IS NOT NULL
      AND reviewed_at IS NOT NULL
    )
  ),
  CONSTRAINT question_submissions_rejected_requires_review_chk CHECK (
    status <> 'rejected' OR (
      reviewed_by_user_id IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND review_note IS NOT NULL
      AND LENGTH(TRIM(review_note)) > 0
    )
  )
);

CREATE INDEX question_submissions_status_created_idx ON question_submissions (status, created_at);
CREATE INDEX question_submissions_proposer_created_idx ON question_submissions (proposer_user_id, created_at DESC);

CREATE TABLE question_submission_choices (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES question_submissions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position SMALLINT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT question_submission_choices_position_chk CHECK (position BETWEEN 1 AND 4),
  CONSTRAINT question_submission_choices_submission_position_uniq UNIQUE (submission_id, position)
);

CREATE TABLE question_submission_reviews (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES question_submissions(id),
  reviewer_user_id UUID NOT NULL REFERENCES users(id),
  action submission_review_action NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX question_submission_reviews_submission_created_idx ON question_submission_reviews (submission_id, created_at DESC);

CREATE TABLE user_chapter_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  declared_progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, chapter_id),
  CONSTRAINT user_chapter_progress_pct_chk CHECK (declared_progress_pct >= 0 AND declared_progress_pct <= 100)
);

CREATE INDEX user_chapter_progress_user_updated_idx ON user_chapter_progress (user_id, updated_at DESC);

CREATE TRIGGER user_chapter_progress_set_updated_at
BEFORE UPDATE ON user_chapter_progress
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================
-- Quiz Sessions
-- =========================
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode quiz_mode NOT NULL,
  stop_rule session_stop_rule NOT NULL,
  target_question_count SMALLINT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  ended_reason TEXT,
  is_first_session_of_day BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT quiz_sessions_stop_rule_chk CHECK (
    (stop_rule = 'fixed_10' AND target_question_count = 10)
    OR (stop_rule = 'fixed_custom' AND target_question_count BETWEEN 1 AND 200)
    OR (stop_rule = 'until_stop' AND target_question_count IS NULL)
  )
);

CREATE INDEX quiz_sessions_user_started_idx ON quiz_sessions (user_id, started_at DESC);
CREATE INDEX quiz_sessions_user_first_session_idx ON quiz_sessions (user_id, is_first_session_of_day, started_at DESC);

CREATE TABLE quiz_session_subject_filters (
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  PRIMARY KEY (session_id, subject_id)
);

CREATE TABLE quiz_session_chapter_filters (
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  PRIMARY KEY (session_id, chapter_id)
);

CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_choice_id UUID REFERENCES question_choices(id),
  open_text_answer TEXT,
  open_text_answer_normalized TEXT,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  answer_order SMALLINT NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT quiz_answers_response_time_chk CHECK (response_time_ms IS NULL OR response_time_ms > 0),
  CONSTRAINT quiz_answers_session_order_uniq UNIQUE (session_id, answer_order),
  CONSTRAINT quiz_answers_session_question_uniq UNIQUE (session_id, question_id)
);

CREATE INDEX quiz_answers_user_question_answered_idx ON quiz_answers (user_id, question_id, answered_at DESC);
CREATE INDEX quiz_answers_session_idx ON quiz_answers (session_id);

CREATE TABLE question_open_text_answers (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  accepted_answer_text TEXT NOT NULL,
  normalized_answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_open_text_answers_accepted_non_empty_chk CHECK (LENGTH(TRIM(accepted_answer_text)) > 0),
  CONSTRAINT question_open_text_answers_normalized_non_empty_chk CHECK (LENGTH(TRIM(normalized_answer_text)) > 0),
  CONSTRAINT question_open_text_answers_question_normalized_uniq UNIQUE (question_id, normalized_answer_text)
);

CREATE INDEX question_open_text_answers_question_idx ON question_open_text_answers (question_id);

CREATE TABLE quiz_answer_multi_choices (
  answer_id UUID NOT NULL REFERENCES quiz_answers(id) ON DELETE CASCADE,
  choice_id UUID NOT NULL REFERENCES question_choices(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (answer_id, choice_id)
);

CREATE INDEX quiz_answer_multi_choices_choice_idx ON quiz_answer_multi_choices (choice_id);

CREATE TABLE user_question_stats (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  last_answered_at TIMESTAMPTZ,
  last_correct BOOLEAN,
  last_mode quiz_mode,
  last_3_results TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id),
  CONSTRAINT user_question_stats_attempts_chk CHECK (attempts_count >= correct_count),
  CONSTRAINT user_question_stats_last3_chk CHECK (last_3_results ~ '^[01]{0,3}$')
);

CREATE INDEX user_question_stats_user_updated_idx ON user_question_stats (user_id, updated_at DESC);

CREATE TRIGGER user_question_stats_set_updated_at
BEFORE UPDATE ON user_question_stats
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE user_subject_stats (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  attempts_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  questions_seen_count INTEGER NOT NULL DEFAULT 0,
  questions_to_reinforce_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, subject_id),
  CONSTRAINT user_subject_stats_attempts_chk CHECK (attempts_count >= correct_count)
);

CREATE INDEX user_subject_stats_user_updated_idx ON user_subject_stats (user_id, updated_at DESC);

CREATE TRIGGER user_subject_stats_set_updated_at
BEFORE UPDATE ON user_subject_stats
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================
-- Duels
-- =========================
CREATE TABLE duels (
  id UUID PRIMARY KEY,
  player1_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID NOT NULL REFERENCES users(id),
  matchmaking_mode TEXT NOT NULL,
  status duel_status NOT NULL DEFAULT 'pending_opener',
  starter_user_id UUID REFERENCES users(id),
  current_turn_user_id UUID REFERENCES users(id),
  current_round_no SMALLINT NOT NULL DEFAULT 1,
  player1_score SMALLINT NOT NULL DEFAULT 0,
  player2_score SMALLINT NOT NULL DEFAULT 0,
  turn_deadline_at TIMESTAMPTZ,
  tie_break_played BOOLEAN NOT NULL DEFAULT FALSE,
  winner_user_id UUID REFERENCES users(id),
  win_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT duels_players_distinct_chk CHECK (player1_id <> player2_id),
  CONSTRAINT duels_round_no_chk CHECK (current_round_no BETWEEN 1 AND 5),
  CONSTRAINT duels_score_non_negative_chk CHECK (player1_score >= 0 AND player2_score >= 0),
  CONSTRAINT duels_matchmaking_mode_chk CHECK (matchmaking_mode IN ('friend_invite', 'random_free', 'random_level')),
  CONSTRAINT duels_win_reason_chk CHECK (
    win_reason IS NULL OR win_reason IN ('score', 'tie_break_speed', 'forfeit', 'timeout')
  )
);

CREATE INDEX duels_current_turn_status_idx ON duels (current_turn_user_id, status);
CREATE INDEX duels_player1_created_idx ON duels (player1_id, created_at DESC);
CREATE INDEX duels_player2_created_idx ON duels (player2_id, created_at DESC);

CREATE TABLE duel_openers (
  id UUID PRIMARY KEY,
  duel_id UUID NOT NULL UNIQUE REFERENCES duels(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  player1_choice_id UUID REFERENCES question_choices(id),
  player2_choice_id UUID REFERENCES question_choices(id),
  player1_correct BOOLEAN,
  player2_correct BOOLEAN,
  player1_response_time_ms INTEGER,
  player2_response_time_ms INTEGER,
  winner_user_id UUID REFERENCES users(id),
  winner_decision TEXT,
  resolved_at TIMESTAMPTZ,
  CONSTRAINT duel_openers_p1_response_time_chk CHECK (player1_response_time_ms IS NULL OR player1_response_time_ms > 0),
  CONSTRAINT duel_openers_p2_response_time_chk CHECK (player2_response_time_ms IS NULL OR player2_response_time_ms > 0),
  CONSTRAINT duel_openers_winner_decision_chk CHECK (
    winner_decision IS NULL OR winner_decision IN ('take_hand', 'leave_hand')
  )
);

CREATE INDEX duel_openers_duel_idx ON duel_openers (duel_id);

CREATE TABLE duel_rounds (
  id UUID PRIMARY KEY,
  duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  round_no SMALLINT NOT NULL,
  offered_subject_1_id UUID NOT NULL REFERENCES subjects(id),
  offered_subject_2_id UUID NOT NULL REFERENCES subjects(id),
  offered_subject_3_id UUID NOT NULL REFERENCES subjects(id),
  chosen_subject_id UUID REFERENCES subjects(id),
  chosen_by_user_id UUID REFERENCES users(id),
  status duel_round_status NOT NULL DEFAULT 'awaiting_choice',
  player1_done_at TIMESTAMPTZ,
  player2_done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT duel_rounds_round_no_chk CHECK (round_no BETWEEN 1 AND 5),
  CONSTRAINT duel_rounds_unique_round_uniq UNIQUE (duel_id, round_no),
  CONSTRAINT duel_rounds_offered_distinct_chk CHECK (
    offered_subject_1_id <> offered_subject_2_id
    AND offered_subject_1_id <> offered_subject_3_id
    AND offered_subject_2_id <> offered_subject_3_id
  ),
  CONSTRAINT duel_rounds_chosen_subject_in_offer_chk CHECK (
    chosen_subject_id IS NULL
    OR chosen_subject_id IN (offered_subject_1_id, offered_subject_2_id, offered_subject_3_id)
  )
);

CREATE INDEX duel_rounds_duel_round_idx ON duel_rounds (duel_id, round_no);

CREATE TABLE duel_round_questions (
  id UUID PRIMARY KEY,
  duel_round_id UUID NOT NULL REFERENCES duel_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  slot_no SMALLINT NOT NULL,
  question_id UUID NOT NULL REFERENCES questions(id),
  difficulty_snapshot SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT duel_round_questions_slot_chk CHECK (slot_no BETWEEN 1 AND 3),
  CONSTRAINT duel_round_questions_difficulty_chk CHECK (difficulty_snapshot BETWEEN 1 AND 5),
  CONSTRAINT duel_round_questions_slot_uniq UNIQUE (duel_round_id, user_id, slot_no),
  CONSTRAINT duel_round_questions_question_uniq UNIQUE (duel_round_id, user_id, question_id)
);

CREATE INDEX duel_round_questions_round_user_idx ON duel_round_questions (duel_round_id, user_id);

CREATE TABLE duel_answers (
  id UUID PRIMARY KEY,
  duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  duel_round_id UUID NOT NULL REFERENCES duel_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_choice_id UUID REFERENCES question_choices(id),
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  slot_no SMALLINT NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT duel_answers_response_time_chk CHECK (response_time_ms IS NULL OR response_time_ms > 0),
  CONSTRAINT duel_answers_slot_chk CHECK (slot_no BETWEEN 1 AND 3),
  CONSTRAINT duel_answers_slot_uniq UNIQUE (duel_round_id, user_id, slot_no)
);

CREATE INDEX duel_answers_duel_user_answered_idx ON duel_answers (duel_id, user_id, answered_at DESC);

CREATE TABLE duel_jokers (
  id UUID PRIMARY KEY,
  duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES users(id),
  granted_by_user_id UUID NOT NULL REFERENCES users(id),
  status joker_status NOT NULL DEFAULT 'pending',
  hours_granted SMALLINT NOT NULL DEFAULT 24,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  old_deadline_at TIMESTAMPTZ,
  new_deadline_at TIMESTAMPTZ,
  CONSTRAINT duel_jokers_one_per_player_per_duel_uniq UNIQUE (duel_id, requested_by_user_id),
  CONSTRAINT duel_jokers_distinct_users_chk CHECK (requested_by_user_id <> granted_by_user_id),
  CONSTRAINT duel_jokers_hours_chk CHECK (hours_granted = 24)
);

CREATE INDEX duel_jokers_duel_status_requested_idx ON duel_jokers (duel_id, status, requested_at DESC);

-- =========================
-- Notifications / Billing / Ads
-- =========================
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status notification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

CREATE INDEX notifications_user_status_created_idx ON notifications (user_id, status, created_at DESC);
CREATE INDEX notifications_type_created_idx ON notifications (type, created_at DESC);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  provider subscription_provider NOT NULL DEFAULT 'none',
  external_ref TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_external_ref_required_chk CHECK (
    provider = 'none' OR external_ref IS NOT NULL
  )
);

CREATE INDEX subscriptions_user_status_updated_idx ON subscriptions (user_id, status, updated_at DESC);
CREATE UNIQUE INDEX subscriptions_one_active_per_user_uniq
ON subscriptions (user_id)
WHERE status = 'active';

CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE ad_reward_windows (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'rewarded_end_first_session',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ad_reward_windows_source_chk CHECK (source = 'rewarded_end_first_session'),
  CONSTRAINT ad_reward_windows_duration_chk CHECK (ends_at = starts_at + INTERVAL '30 minutes')
);

CREATE INDEX ad_reward_windows_user_ends_idx ON ad_reward_windows (user_id, ends_at DESC);

CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE SET NULL,
  placement ad_placement NOT NULL,
  network TEXT,
  revenue_eur NUMERIC(10,4),
  shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  reward_granted BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT ad_impressions_revenue_non_negative_chk CHECK (revenue_eur IS NULL OR revenue_eur >= 0),
  CONSTRAINT ad_impressions_clicked_after_shown_chk CHECK (clicked_at IS NULL OR clicked_at >= shown_at)
);

CREATE INDEX ad_impressions_user_shown_idx ON ad_impressions (user_id, shown_at DESC);
CREATE INDEX ad_impressions_session_idx ON ad_impressions (session_id);
CREATE INDEX ad_impressions_placement_shown_idx ON ad_impressions (placement, shown_at DESC);

CREATE TABLE avatar_stages (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order SMALLINT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE medical_specialties (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE avatar_items (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  item_type avatar_item_type NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  source_type TEXT NOT NULL,
  required_stage_id UUID REFERENCES avatar_stages(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT avatar_items_rarity_chk CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  CONSTRAINT avatar_items_source_type_chk CHECK (source_type IN ('progression', 'event', 'rewarded'))
);

CREATE INDEX avatar_items_type_rarity_idx ON avatar_items (item_type, rarity);

CREATE TABLE user_avatar_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp_points INTEGER NOT NULL DEFAULT 0,
  current_stage_id UUID NOT NULL REFERENCES avatar_stages(id),
  specialty_id UUID REFERENCES medical_specialties(id),
  stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_avatar_progress_xp_chk CHECK (xp_points >= 0)
);

CREATE INDEX user_avatar_progress_stage_idx ON user_avatar_progress (current_stage_id);

CREATE TRIGGER user_avatar_progress_set_updated_at
BEFORE UPDATE ON user_avatar_progress
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE user_avatar_inventory (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES avatar_items(id),
  acquired_source TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_avatar_inventory_user_item_uniq UNIQUE (user_id, item_id),
  CONSTRAINT user_avatar_inventory_source_chk CHECK (acquired_source IN ('progression', 'event', 'rewarded'))
);

CREATE INDEX user_avatar_inventory_user_acquired_idx ON user_avatar_inventory (user_id, acquired_at DESC);

CREATE TABLE user_avatar_equipment (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type avatar_item_type NOT NULL,
  item_id UUID NOT NULL REFERENCES avatar_items(id),
  equipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_type)
);

CREATE INDEX user_avatar_equipment_item_idx ON user_avatar_equipment (item_id);

CREATE TABLE rewarded_grants (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_impression_id UUID NOT NULL REFERENCES ad_impressions(id) ON DELETE CASCADE,
  grant_type reward_grant_type NOT NULL,
  ad_reward_window_id UUID REFERENCES ad_reward_windows(id) ON DELETE CASCADE,
  avatar_item_id UUID REFERENCES avatar_items(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rewarded_grants_shape_chk CHECK (
    (grant_type = 'ad_free_window' AND ad_reward_window_id IS NOT NULL AND avatar_item_id IS NULL)
    OR (grant_type = 'avatar_cosmetic' AND avatar_item_id IS NOT NULL AND ad_reward_window_id IS NULL)
  )
);

CREATE INDEX rewarded_grants_user_granted_idx ON rewarded_grants (user_id, granted_at DESC);
CREATE INDEX rewarded_grants_impression_idx ON rewarded_grants (ad_impression_id);

-- =========================
-- Business-rule triggers
-- =========================

-- 1) Enforce chapter/subject coherence on questions.
CREATE OR REPLACE FUNCTION enforce_question_subject_chapter_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_chapter_subject_id UUID;
BEGIN
  SELECT c.subject_id INTO v_chapter_subject_id
  FROM chapters c
  WHERE c.id = NEW.chapter_id;

  IF v_chapter_subject_id IS NULL THEN
    RAISE EXCEPTION 'chapter_id % does not exist', NEW.chapter_id;
  END IF;

  IF v_chapter_subject_id <> NEW.subject_id THEN
    RAISE EXCEPTION 'chapter % belongs to subject %, but question subject is %',
      NEW.chapter_id, v_chapter_subject_id, NEW.subject_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER questions_subject_chapter_match_trg
BEFORE INSERT OR UPDATE OF subject_id, chapter_id ON questions
FOR EACH ROW
EXECUTE FUNCTION enforce_question_subject_chapter_match();

-- 2) Validate question choices for published single-choice questions.
CREATE OR REPLACE FUNCTION validate_question_choices_integrity(p_question_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_type question_type;
  v_status question_status;
  v_total INTEGER;
  v_correct INTEGER;
BEGIN
  SELECT q.question_type, q.status
  INTO v_type, v_status
  FROM questions q
  WHERE q.id = p_question_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_type = 'single_choice' AND v_status = 'published' THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE qc.is_correct)
    INTO v_total, v_correct
    FROM question_choices qc
    WHERE qc.question_id = p_question_id;

    IF v_total <> 4 THEN
      RAISE EXCEPTION 'Published single-choice question % must have exactly 4 choices (has %)', p_question_id, v_total;
    END IF;

    IF v_correct <> 1 THEN
      RAISE EXCEPTION 'Published single-choice question % must have exactly 1 correct choice (has %)', p_question_id, v_correct;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION trg_question_choices_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validate_question_choices_integrity(COALESCE(NEW.question_id, OLD.question_id));
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER question_choices_integrity_trg
AFTER INSERT OR UPDATE OR DELETE ON question_choices
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION trg_question_choices_integrity();

CREATE OR REPLACE FUNCTION trg_question_publish_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validate_question_choices_integrity(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER question_publish_integrity_trg
AFTER INSERT OR UPDATE OF status, question_type ON questions
FOR EACH ROW
EXECUTE FUNCTION trg_question_publish_integrity();

-- 3) Validate submission choices (v1: binary moderation + 4 choices + 1 correct).
CREATE OR REPLACE FUNCTION validate_submission_choices_integrity(p_submission_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_type question_type;
  v_total INTEGER;
  v_correct INTEGER;
BEGIN
  SELECT s.question_type
  INTO v_type
  FROM question_submissions s
  WHERE s.id = p_submission_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_type = 'single_choice' THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE sc.is_correct)
    INTO v_total, v_correct
    FROM question_submission_choices sc
    WHERE sc.submission_id = p_submission_id;

    IF v_total <> 4 THEN
      RAISE EXCEPTION 'Single-choice submission % must have exactly 4 choices (has %)', p_submission_id, v_total;
    END IF;

    IF v_correct <> 1 THEN
      RAISE EXCEPTION 'Single-choice submission % must have exactly 1 correct choice (has %)', p_submission_id, v_correct;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION trg_submission_choices_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validate_submission_choices_integrity(COALESCE(NEW.submission_id, OLD.submission_id));
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER question_submission_choices_integrity_trg
AFTER INSERT OR UPDATE OR DELETE ON question_submission_choices
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION trg_submission_choices_integrity();

CREATE OR REPLACE FUNCTION trg_submission_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validate_submission_choices_integrity(NEW.id);
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER question_submissions_integrity_trg
AFTER INSERT OR UPDATE OF question_type, status ON question_submissions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION trg_submission_integrity();

-- 4) Free plan duel cap: max 2 active duels (launched + received).
CREATE OR REPLACE FUNCTION is_user_premium_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.plan = 'premium'
      AND s.status = 'active'
      AND (s.ends_at IS NULL OR s.ends_at > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION enforce_free_duel_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_user UUID;
BEGIN
  IF NEW.status NOT IN ('pending_opener', 'in_progress') THEN
    RETURN NEW;
  END IF;

  FOREACH v_user IN ARRAY ARRAY[NEW.player1_id, NEW.player2_id]
  LOOP
    IF NOT is_user_premium_active(v_user) THEN
      SELECT COUNT(*) INTO v_count
      FROM duels d
      WHERE d.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND d.status IN ('pending_opener', 'in_progress')
        AND (d.player1_id = v_user OR d.player2_id = v_user);

      IF v_count >= 2 THEN
        RAISE EXCEPTION 'Free user % cannot have more than 2 active duels', v_user;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER duels_free_cap_trg
BEFORE INSERT OR UPDATE OF status, player1_id, player2_id ON duels
FOR EACH ROW
EXECUTE FUNCTION enforce_free_duel_cap();

-- 5) Avatar rules: specialty gate at Intern stage and equipment ownership checks.
CREATE OR REPLACE FUNCTION enforce_avatar_specialty_rule()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_intern_order SMALLINT;
  v_current_order SMALLINT;
BEGIN
  SELECT sort_order INTO v_intern_order
  FROM avatar_stages
  WHERE code = 'interne'
  LIMIT 1;

  IF v_intern_order IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT sort_order INTO v_current_order
  FROM avatar_stages
  WHERE id = NEW.current_stage_id;

  IF v_current_order IS NULL THEN
    RAISE EXCEPTION 'current_stage_id % does not exist', NEW.current_stage_id;
  END IF;

  IF v_current_order < v_intern_order AND NEW.specialty_id IS NOT NULL THEN
    RAISE EXCEPTION 'specialty cannot be set before interne stage';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER user_avatar_progress_specialty_rule_trg
BEFORE INSERT OR UPDATE OF current_stage_id, specialty_id ON user_avatar_progress
FOR EACH ROW
EXECUTE FUNCTION enforce_avatar_specialty_rule();

CREATE OR REPLACE FUNCTION enforce_avatar_equipment_rule()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_owned BOOLEAN;
  v_item_type avatar_item_type;
  v_required_stage UUID;
  v_user_stage_order SMALLINT;
  v_required_stage_order SMALLINT;
BEGIN
  SELECT ai.item_type, ai.required_stage_id
  INTO v_item_type, v_required_stage
  FROM avatar_items ai
  WHERE ai.id = NEW.item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'avatar item % not found', NEW.item_id;
  END IF;

  IF v_item_type <> NEW.item_type THEN
    RAISE EXCEPTION 'avatar item type mismatch: expected %, got %', v_item_type, NEW.item_type;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM user_avatar_inventory uai
    WHERE uai.user_id = NEW.user_id
      AND uai.item_id = NEW.item_id
  ) INTO v_owned;

  IF NOT v_owned THEN
    RAISE EXCEPTION 'user % does not own avatar item %', NEW.user_id, NEW.item_id;
  END IF;

  IF v_required_stage IS NOT NULL THEN
    SELECT s.sort_order INTO v_user_stage_order
    FROM user_avatar_progress uap
    JOIN avatar_stages s ON s.id = uap.current_stage_id
    WHERE uap.user_id = NEW.user_id;

    SELECT s.sort_order INTO v_required_stage_order
    FROM avatar_stages s
    WHERE s.id = v_required_stage;

    IF v_user_stage_order IS NULL THEN
      RAISE EXCEPTION 'user % has no avatar progress row', NEW.user_id;
    END IF;

    IF v_required_stage_order IS NOT NULL AND v_user_stage_order < v_required_stage_order THEN
      RAISE EXCEPTION 'user % stage too low for avatar item %', NEW.user_id, NEW.item_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER user_avatar_equipment_rule_trg
BEFORE INSERT OR UPDATE OF item_type, item_id ON user_avatar_equipment
FOR EACH ROW
EXECUTE FUNCTION enforce_avatar_equipment_rule();

COMMIT;
