BEGIN;

CREATE TABLE IF NOT EXISTS auth_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by_token_id UUID REFERENCES auth_refresh_tokens(id),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_refresh_tokens_not_expired_on_insert_chk CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS auth_refresh_tokens_user_created_idx
ON auth_refresh_tokens (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_refresh_tokens_user_active_idx
ON auth_refresh_tokens (user_id, expires_at DESC)
WHERE revoked_at IS NULL;

COMMIT;
