ALTER TABLE quiz_answers
  ADD COLUMN IF NOT EXISTS open_text_answer TEXT,
  ADD COLUMN IF NOT EXISTS open_text_answer_normalized TEXT;

CREATE TABLE IF NOT EXISTS question_open_text_answers (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  accepted_answer_text TEXT NOT NULL,
  normalized_answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_open_text_answers_accepted_non_empty_chk CHECK (LENGTH(TRIM(accepted_answer_text)) > 0),
  CONSTRAINT question_open_text_answers_normalized_non_empty_chk CHECK (LENGTH(TRIM(normalized_answer_text)) > 0),
  CONSTRAINT question_open_text_answers_question_normalized_uniq UNIQUE (question_id, normalized_answer_text)
);

CREATE INDEX IF NOT EXISTS question_open_text_answers_question_idx
  ON question_open_text_answers (question_id);
