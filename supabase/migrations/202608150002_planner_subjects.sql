create table if not exists public.planner_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  edital_ref text not null,
  edital_name text,
  concurso_name text,
  cargo text,
  cargo_key text not null default 'geral',
  subject text not null,
  subject_key text not null,
  topics text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint planner_subjects_unique_context
    unique (user_id, edital_ref, subject_key)
);

comment on table public.planner_subjects is
  'Matérias adicionadas ao planner a partir de um edital, sem conteúdo de provedores de questões.';

alter table public.planner_subjects enable row level security;

drop policy if exists "users_read_own_planner_subjects" on public.planner_subjects;
create policy "users_read_own_planner_subjects"
  on public.planner_subjects for select
  using (auth.uid() = user_id);

drop policy if exists "users_insert_own_planner_subjects" on public.planner_subjects;
create policy "users_insert_own_planner_subjects"
  on public.planner_subjects for insert
  with check (auth.uid() = user_id);

drop policy if exists "users_update_own_planner_subjects" on public.planner_subjects;
create policy "users_update_own_planner_subjects"
  on public.planner_subjects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users_delete_own_planner_subjects" on public.planner_subjects;
create policy "users_delete_own_planner_subjects"
  on public.planner_subjects for delete
  using (auth.uid() = user_id);
