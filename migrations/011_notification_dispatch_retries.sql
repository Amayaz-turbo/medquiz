BEGIN;

ALTER TABLE notifications
  ADD COLUMN dispatch_attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN next_dispatch_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN last_dispatch_error TEXT;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_dispatch_attempt_count_chk CHECK (dispatch_attempt_count >= 0);

UPDATE notifications
SET next_dispatch_at = created_at
WHERE status = 'pending';

CREATE INDEX notifications_pending_dispatch_idx
  ON notifications (next_dispatch_at ASC, created_at ASC, id ASC)
  WHERE status = 'pending';

COMMIT;
