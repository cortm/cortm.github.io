-- Run once in Supabase SQL Editor to allow the app to save drills.
-- https://supabase.com/dashboard/project/lhvfqthdlxsvasuhkwap/sql/new

alter table public.drills enable row level security;

drop policy if exists "Drills are publicly readable" on public.drills;
create policy "Drills are publicly readable"
  on public.drills for select
  using (true);

drop policy if exists "Anyone can update drills" on public.drills;
create policy "Anyone can update drills"
  on public.drills for update
  using (true)
  with check (true);

drop policy if exists "Anyone can insert drills" on public.drills;
create policy "Anyone can insert drills"
  on public.drills for insert
  with check (true);
