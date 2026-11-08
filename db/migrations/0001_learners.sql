-- Snakk learners: pseudonymous progress only. No email, no name, no audio, no IP address.
-- Reached ONLY by our server through DATABASE_URL. There is no public database API.
create table if not exists learners (
  id uuid primary key default gen_random_uuid(),
  progress jsonb not null,
  -- SHA-256 of the learner's sync code. The code itself is never stored.
  sync_code_hash text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Defence in depth: nobody but the table owner (our server's role) may read or write it.
revoke all on table learners from public;
alter table learners enable row level security;
