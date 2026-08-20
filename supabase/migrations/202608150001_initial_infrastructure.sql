create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.user_progress is
  'Progresso do Concurso Hub. Conteúdo de questões de provedores externos não deve ser persistido aqui.';

alter table public.user_progress enable row level security;

drop policy if exists "users_read_own_progress" on public.user_progress;
create policy "users_read_own_progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

drop policy if exists "users_insert_own_progress" on public.user_progress;
create policy "users_insert_own_progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "users_update_own_progress" on public.user_progress;
create policy "users_update_own_progress"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_user_progress_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_user_progress_updated_at on public.user_progress;
create trigger touch_user_progress_updated_at
before update on public.user_progress
for each row execute function public.touch_user_progress_updated_at();

create table if not exists public.radar_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  query text not null default '"concurso público" | "processo seletivo"',
  territory_ids text[] not null default '{}',
  email_alerts_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.radar_preferences enable row level security;

drop policy if exists "users_manage_own_radar_preferences" on public.radar_preferences;
create policy "users_manage_own_radar_preferences"
  on public.radar_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
