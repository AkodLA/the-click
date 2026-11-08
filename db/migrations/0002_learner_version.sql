-- Optimistic concurrency: every save bumps the version; a save only applies if nobody saved in between.
alter table learners add column if not exists version integer not null default 0;
