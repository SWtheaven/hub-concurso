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
| Testes da baseline | ✅ 23/23 |
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

> **Nota de repositório:** a primeira sincronização do GitHub prioriza documentação, migrations, configuração, governança e automação. O snapshot-fonte aprovado continua sendo preservado integralmente fora desta primeira importação enquanto os módulos maiores são sincronizados sem alterar a baseline.

## Baseline canônica

- **Branch de referência do projeto:** `main`
- **Baseline reconciliada:** `b3da0d8`
- **Tag lógica de referência:** `hub-001-r1r2-baseline`
- **Sequência canônica de migrations:** `001 → 002 → 003 → 004`

O snapshot V4 e as versões 7C/7E anteriores são referências históricas, não baseline ativa.

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

## Organização do repositório

```text
.
├── .github/                              # CI e templates
├── docs/                                 # arquitetura, status e histórico
├── supabase/migrations/                  # migrations canônicas
├── worker/                               # configuração, contratos e testes sincronizados
├── app-config.js                         # configuração pública segura
├── CONTRIBUTING.md
├── SECURITY.md
└── README.md
```

Os módulos maiores do frontend e Worker são importados progressivamente a partir do snapshot aprovado, sem modificar seu conteúdo funcional durante a sincronização.

## Desenvolvimento local

### Requisitos

- Node.js LTS
- npm
- Wrangler
- projeto Supabase para integração real

### Validação do Worker

Quando o código-fonte completo do Worker estiver presente no checkout:

```bash
cd worker
npm install
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

- segredos permanecem somente no Worker/ambiente;
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

Consulte [`docs/history/README.md`](docs/history/README.md) para a linha do tempo técnica consolidada da auditoria HUB-001 e da baseline HUB-001-R1/R2.

## Contribuição

Consulte [`CONTRIBUTING.md`](CONTRIBUTING.md). Mudanças devem ser pequenas, rastreáveis e ligadas a um item `HUB-xxx` ou issue correspondente.

---

**Estado atual:** baseline reconciliada; HUB-002 em integração controlada.
