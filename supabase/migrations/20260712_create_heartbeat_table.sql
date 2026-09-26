-- Migration: Create _heartbeat table for the supabase-keepalive workflow.
-- This tiny table exists solely so the GitHub Actions cron job can make a
-- real Postgres read query (via the REST API) to prevent Supabase from
-- auto-pausing the project on the Free plan.  It has no RLS policies,
-- so the service_role key can read it without extra setup.

CREATE TABLE IF NOT EXISTS public._heartbeat (
  id   integer PRIMARY KEY DEFAULT 1,
  note text    NOT NULL    DEFAULT 'keepalive ping target'
);

-- Ensure exactly one row exists for the query to return.
INSERT INTO public._heartbeat (id, note)
VALUES (1, 'keepalive ping target')
ON CONFLICT (id) DO NOTHING;
