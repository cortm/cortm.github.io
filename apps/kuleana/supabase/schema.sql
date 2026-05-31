-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists household_states (
  household_id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table household_states enable row level security;

-- Family app: allow anon read/write for the household_states table.
-- Use a private URL and optional VITE_HOUSEHOLD_ID; tighten rules if you add auth later.
create policy "household_states_anon_all"
  on household_states
  for all
  to anon
  using (true)
  with check (true);
