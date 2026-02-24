BEGIN;

CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  push_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_push_tokens_platform_chk CHECK (platform IN ('ios', 'android', 'web')),
  CONSTRAINT user_push_tokens_platform_token_uniq UNIQUE (platform, push_token)
);

CREATE INDEX user_push_tokens_user_last_seen_idx ON user_push_tokens (user_id, last_seen_at DESC);

CREATE TRIGGER user_push_tokens_set_updated_at
BEFORE UPDATE ON user_push_tokens
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
