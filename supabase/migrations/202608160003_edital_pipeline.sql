-- Concurso Hub — Etapa 7E
-- Persistência multi-cargo, reidratação e histórico de alterações da fonte oficial.

create table if not exists public.editais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  orgao text,
  banca text,
  source_url text,
  source_type text not null default 'oficial',
  source_hash text,
  source_version text,
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  regras_gerais jsonb not null default '[]'::jsonb,
  analysis_status text,
  analysis_model text,
  metadata jsonb not null default '{}'::jsonb,
  publicado_em text,
  inscricao_inicio text,
  inscricao_fim text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.editais add column if not exists source_url text;
alter table public.editais add column if not exists source_type text not null default 'oficial';
alter table public.editais add column if not exists source_hash text;
alter table public.editais add column if not exists source_version text;
alter table public.editais add column if not exists last_checked_at timestamptz;
alter table public.editais add column if not exists last_changed_at timestamptz;
alter table public.editais add column if not exists regras_gerais jsonb not null default '[]'::jsonb;
alter table public.editais add column if not exists analysis_status text;
alter table public.editais add column if not exists analysis_model text;
alter table public.editais add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.editais add column if not exists publicado_em text;
alter table public.editais add column if not exists inscricao_inicio text;
alter table public.editais add column if not exists inscricao_fim text;
alter table public.editais add column if not exists created_at timestamptz not null default now();
alter table public.editais add column if not exists updated_at timestamptz not null default now();

create table if not exists public.edital_cargos (
  id uuid primary key default gen_random_uuid(),
  edital_id uuid not null references public.editais(id) on delete cascade,
  codigo text,
  nome text not null,
  especialidade text,
  localidade text,
  uf text,
  vagas text,
  salario text,
  carga_horaria text,
  requisitos jsonb not null default '{}'::jsonb,
  remuneracao jsonb not null default '{}'::jsonb,
  prova jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.edital_cargos add column if not exists requisitos jsonb not null default '{}'::jsonb;
alter table public.edital_cargos add column if not exists remuneracao jsonb not null default '{}'::jsonb;
alter table public.edital_cargos add column if not exists prova jsonb not null default '{}'::jsonb;
alter table public.edital_cargos add column if not exists evidence jsonb not null default '{}'::jsonb;
alter table public.edital_cargos add column if not exists carga_horaria text;

create table if not exists public.edital_materias (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references public.edital_cargos(id) on delete cascade,
  nome text not null,
  topicos jsonb not null default '[]'::jsonb,
  peso text,
  numero_questoes text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.edital_materias add column if not exists topicos jsonb not null default '[]'::jsonb;
alter table public.edital_materias add column if not exists peso text;
alter table public.edital_materias add column if not exists numero_questoes text;
alter table public.edital_materias add column if not exists evidence jsonb not null default '{}'::jsonb;

create table if not exists public.edital_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  edital_id uuid not null references public.editais(id) on delete cascade,
  cargo_id uuid not null references public.edital_cargos(id) on delete cascade,
  selected_at timestamptz not null default now()
);

create table if not exists public.edital_revisions (
  id uuid primary key default gen_random_uuid(),
  edital_id uuid not null references public.editais(id) on delete cascade,
  detected_at timestamptz not null default now(),
  old_hash text not null,
  new_hash text not null,
  changes jsonb not null default '{}'::jsonb,
  ai_summary text,
  source_url text,
  reviewed boolean not null default false
);

create index if not exists editais_source_url_idx on public.editais(source_url);
create index if not exists edital_cargos_edital_id_idx on public.edital_cargos(edital_id);
create index if not exists edital_materias_cargo_id_idx on public.edital_materias(cargo_id);
create index if not exists edital_selections_current_idx
  on public.edital_selections(user_id, selected_at desc);
create index if not exists edital_revisions_latest_idx
  on public.edital_revisions(edital_id, detected_at desc);

alter table public.editais enable row level security;
alter table public.edital_cargos enable row level security;
alter table public.edital_materias enable row level security;
alter table public.edital_selections enable row level security;
alter table public.edital_revisions enable row level security;

revoke all on public.editais from anon, authenticated;
revoke all on public.edital_cargos from anon, authenticated;
revoke all on public.edital_materias from anon, authenticated;
revoke all on public.edital_selections from anon, authenticated;
revoke all on public.edital_revisions from anon, authenticated;

grant all on public.editais to service_role;
grant all on public.edital_cargos to service_role;
grant all on public.edital_materias to service_role;
grant all on public.edital_selections to service_role;
grant all on public.edital_revisions to service_role;

comment on table public.edital_revisions is
  'Alterações objetivamente detectadas na fonte oficial; a IA apenas resume diferenças após a mudança de hash.';
