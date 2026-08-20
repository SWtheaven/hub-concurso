# Hub de Concursos

> Plataforma em evolução para transformar editais em informação estruturada, planejamento de estudos e acompanhamento do candidato.

[![Status](https://img.shields.io/badge/status-HUB--002%20integração-blue)](#status-do-projeto)
[![Baseline](https://img.shields.io/badge/baseline-b3da0d8-success)](#baseline-canônica)
[![Cloudflare Workers](https://img.shields.io/badge/backend-Cloudflare%20Workers-orange)](#arquitetura)
[![Supabase](https://img.shields.io/badge/data-Supabase-3ECF8E)](#arquitetura)

## Visão

O **Hub de Concursos** é um projeto orientado por edital. O objetivo é reduzir a fragmentação do estudo para concursos públicos por meio de um fluxo único: identificar cargos, analisar exclusivamente o cargo selecionado, estruturar matérias e tópicos, persistir o contexto e alimentar um planner de estudos.

O princípio técnico central é simples: **o edital é a fonte de verdade**. Dados sem evidência explícita não devem ser inventados ou completados pela IA.

## Status do projeto

A fase **HUB-001 — Auditoria e Reconciliação** foi concluída. A baseline de código está reconciliada e o projeto entrou no **HUB-002 — Integração controlada e validação end-to-end**.

| Área | Estado |
|---|---|
| Baseline de código | ✅ Aprovada |
| Testes locais | ✅ 23/23 |
| Worker candidato | ✅ Dry-run aprovado |
| Pipeline de edital 7E | ✅ Preservado |
| Planner por usuário/edital/cargo/matéria | ✅ ADD/LIST/DELETE |
| Supabase real | 🟡 Em reconciliação |
| Worker publicado | 🟡 Produção ainda em baseline anterior |
| Radar | 🟠 Parcial / fora do gate atual |
| Simulados | 🟠 Parcial / fora do gate atual |
| API de questões | 🟠 Implementada parcialmente e bloqueada por licença |
| YouTube / Resend | ⏸️ Backlog |

Veja [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) para o estado operacional atual.

## Baseline canônica

- **Branch de referência:** `main`
- **Baseline reconciliada:** `b3da0d8`
- **Tag de referência:** `hub-001-r1r2-baseline`
- **Sequência canônica de migrations:** `001 → 002 → 003 → 004`

O snapshot V4 e as versões 7C/7E anteriores são tratados como referências históricas, não como baseline ativa.

## Arquitetura

```text
Frontend estático
      │
      ▼
Cloudflare Worker
      ├── Supabase Auth / JWT / RLS
      ├── Pipeline de edital 7E
      ├── Planner
      ├── Gemini / Groq
      ├── Gateway de questões (bloqueado)
      └── Radar parcial
              │
              ▼
           Supabase
```

Detalhes em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Core preservado

O pipeline de edital mantém:

- catálogo multi-cargo;
- seleção e análise isolada por cargo;
- persistência idempotente;
- reidratação;
- ETag e Last-Modified;
- hash SHA-256 e versionamento;
- revisão e alerta de mudança;
- evidências para os dados extraídos.

O planner canônico usa a identidade:

```text
(user_id, edital_ref, cargo_key, subject_key)
```

## Estrutura do repositório

```text
.
├── index.html / app.js / style.css       # frontend
├── edital-analyzer.js                    # integração da análise de edital
├── question-bank.js                      # base/motor de questões local
├── ebooks.js                             # módulo existente de conteúdo
├── worker/                               # Cloudflare Worker e testes
├── supabase/migrations/                  # migrations canônicas
├── docs/                                 # arquitetura, status e histórico
└── .github/                              # CI e templates de colaboração
```

## Desenvolvimento local

### Requisitos

- Node.js LTS
- npm
- Wrangler
- projeto Supabase para integração real

### Testes do Worker

```bash
cd worker
npm ci
npm test
npm run check
```

### Ambiente local

Copie:

```text
worker/.dev.vars.example
```

para:

```text
worker/.dev.vars
```

Preencha somente no ambiente local. **Nunca versione segredos.**

## Migrations

A ordem canônica é:

1. `202608150001_initial_infrastructure.sql`
2. `202608150002_planner_subjects.sql`
3. `202608160003_edital_pipeline.sql`
4. `202608200004_baseline_reconciliation.sql`

A migration histórica concorrente `202608160003_authoritative_edital` não integra a cadeia executável. A decisão está documentada em [`docs/SQL_RECONCILIATION.md`](docs/SQL_RECONCILIATION.md).

## Segurança

- secrets permanecem somente no Worker/ambiente;
- o frontend não deve conter `SUPABASE_SECRET_KEY` ou chaves privadas;
- sessão de usuário usa Supabase Auth/JWT;
- dados por usuário usam RLS;
- a API de questões permanece desabilitada enquanto a validação contratual/licença não estiver concluída.

Veja [`SECURITY.md`](SECURITY.md).

## Governança

O projeto usa IDs de trabalho `HUB-xxx` para manter rastreabilidade entre decisão, implementação, testes e aprovação.

- **Founder:** autoridade final de produto;
- **C.O.:** governança, prioridade, critérios de aceite e aprovação;
- **DEV HUB:** implementação oficial e devolutivas técnicas.

Detalhes em [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md).

## Roadmap imediato

O foco atual é **estabilização e integração**, não expansão funcional.

1. inventário read-only do Supabase real;
2. reconciliação do schema aplicado com as migrations canônicas;
3. aplicação controlada do que faltar;
4. publicação controlada do Worker candidato;
5. smoke tests autenticados;
6. fluxo end-to-end completo.

Radar, simulados, questões, YouTube e Resend permanecem fora deste gate.

## Histórico técnico

- [`HUB-001 — Auditoria e Reconciliação do HEAD`](docs/history/HUB-001_Auditoria_Reconciliacao_HEAD_2026-08-20.md)
- [`HUB-001-R1/R2 — Entrega da baseline reconciliada`](docs/history/HUB-001-R1R2_Relatorio_de_Entrega_2026-08-20.md)

## Contribuição

Consulte [`CONTRIBUTING.md`](CONTRIBUTING.md). Mudanças devem ser pequenas, rastreáveis e ligadas a um item `HUB-xxx` ou issue correspondente.

---

**Estado atual:** baseline reconciliada; HUB-002 em integração controlada.
