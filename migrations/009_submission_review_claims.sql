ALTER TABLE question_submissions
  ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'question_submissions_claim_shape_chk'
  ) THEN
    ALTER TABLE question_submissions
      ADD CONSTRAINT question_submissions_claim_shape_chk
      CHECK (
        (claimed_by_user_id IS NULL AND claimed_at IS NULL AND claim_expires_at IS NULL)
        OR
        (
          claimed_by_user_id IS NOT NULL
          AND claimed_at IS NOT NULL
          AND claim_expires_at IS NOT NULL
          AND claim_expires_at > claimed_at
        )
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS question_submissions_claim_expires_idx
  ON question_submissions (claim_expires_at);
