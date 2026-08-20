-- Concurso Hub — HUB-001-R1/R2
-- Reconciliacao canonica do planner por usuario + edital + cargo + materia.
-- Nao remove tabelas legadas e pode ser executada apos as migrations 001-003.

alter table public.planner_subjects
  add column if not exists cargo_key text;

update public.planner_subjects
set cargo_key = 'geral'
where cargo_key is null or btrim(cargo_key) = '';

alter table public.planner_subjects
  alter column cargo_key set default 'geral';

alter table public.planner_subjects
  alter column cargo_key set not null;

alter table public.planner_subjects
  drop constraint if exists planner_subjects_unique_context;

alter table public.planner_subjects
  add constraint planner_subjects_unique_context
  unique (user_id, edital_ref, cargo_key, subject_key);

create index if not exists planner_subjects_user_edital_cargo_idx
  on public.planner_subjects(user_id, edital_ref, cargo_key, created_at);

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

comment on table public.planner_subjects is
  'Planner canonico do Concurso Hub: uma materia por usuario, edital e cargo.';

