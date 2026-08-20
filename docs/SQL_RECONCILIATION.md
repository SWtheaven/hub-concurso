# Reconciliação SQL — HUB-001-R1/R2

## Sequência canônica

1. `202608150001_initial_infrastructure.sql`
2. `202608150002_planner_subjects.sql`
3. `202608160003_edital_pipeline.sql`
4. `202608200004_baseline_reconciliation.sql`

## Decisões

- `planner_subjects` é a tabela canônica do planner.
- A identidade única é usuário + edital + cargo + matéria.
- `planner_items` permanece apenas como legado no banco existente; a baseline não o consulta nem o remove.
- `202608160003_authoritative_edital.txt` não faz parte da sequência canônica.
- A parte válida desse arquivo — isolamento do planner por `cargo_key` — foi incorporada à migration `004`.
- `edital_monitors` não foi incorporada porque o pipeline 7E já mantém ETag, Last-Modified, snapshot e hash em `editais.metadata` e registra mudanças em `edital_revisions`.
- Nenhuma tabela legada deve ser apagada antes de um inventário read-only do Supabase real.

