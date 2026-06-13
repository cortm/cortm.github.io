-- Run once in Supabase SQL Editor to enable cross-device progress sync.
-- https://supabase.com/dashboard/project/lhvfqthdlxsvasuhkwap/sql/new

create table if not exists public.user_progress (
  sync_id uuid primary key,
  profile jsonb not null default '{}',
  daily_session jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_progress_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_progress_updated_at on public.user_progress;
create trigger user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.set_user_progress_updated_at();

alter table public.user_progress enable row level security;

drop policy if exists "Progress is publicly readable" on public.user_progress;
create policy "Progress is publicly readable"
  on public.user_progress for select
  using (true);

drop policy if exists "Anyone can insert progress" on public.user_progress;
create policy "Anyone can insert progress"
  on public.user_progress for insert
  with check (true);

drop policy if exists "Anyone can update progress" on public.user_progress;
create policy "Anyone can update progress"
  on public.user_progress for update
  using (true)
  with check (true);
