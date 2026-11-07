-- Run once in Supabase → SQL editor. Needed for the deployed (Vercel) version.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  worker text not null,
  language text not null,
  kind text not null check (kind in ('session_start','step_done','task_done','problem','question','return_grade')),
  text_no text not null,
  text_original text,
  meta jsonb
);

create index if not exists events_created_at_idx on public.events (created_at desc);

-- Only the server (service role key) talks to this table. No public access.
alter table public.events enable row level security;
