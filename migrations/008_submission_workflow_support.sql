ALTER TABLE question_submissions
  ADD COLUMN IF NOT EXISTS difficulty SMALLINT;

UPDATE question_submissions
SET difficulty = COALESCE(difficulty, 3)
WHERE difficulty IS NULL;

ALTER TABLE question_submissions
  ALTER COLUMN difficulty SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'question_submissions_difficulty_chk'
  ) THEN
    ALTER TABLE question_submissions
      ADD CONSTRAINT question_submissions_difficulty_chk
      CHECK (difficulty BETWEEN 1 AND 5);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS question_submission_open_text_answers (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES question_submissions(id) ON DELETE CASCADE,
  accepted_answer_text TEXT NOT NULL,
  normalized_answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_submission_open_text_answers_accepted_non_empty_chk CHECK (LENGTH(TRIM(accepted_answer_text)) > 0),
  CONSTRAINT question_submission_open_text_answers_normalized_non_empty_chk CHECK (LENGTH(TRIM(normalized_answer_text)) > 0),
  CONSTRAINT question_submission_open_text_answers_submission_normalized_uniq UNIQUE (submission_id, normalized_answer_text)
);

CREATE INDEX IF NOT EXISTS question_submission_open_text_answers_submission_idx
  ON question_submission_open_text_answers (submission_id);
