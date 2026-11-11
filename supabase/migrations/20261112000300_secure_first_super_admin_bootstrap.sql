-- One-time bootstrap for the first school super administrator.
-- The token is stored only as a hash in a private schema and consumed atomically.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.admin_bootstrap_tokens (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE private.admin_bootstrap_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.admin_bootstrap_tokens TO service_role;

CREATE OR REPLACE FUNCTION public.consume_admin_bootstrap_token(p_token_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  deleted_rows integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_profiles) THEN
    RETURN FALSE;
  END IF;

  DELETE FROM private.admin_bootstrap_tokens
  WHERE id = 1
    AND token_hash = p_token_hash
    AND expires_at > pg_catalog.now();

  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_admin_bootstrap_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_admin_bootstrap_token(text) TO service_role;
