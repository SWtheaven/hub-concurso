# Arquitetura

## Visão geral

O Hub de Concursos usa um frontend estático e um backend serverless em Cloudflare Workers. O Worker é o único roteador público da API e concentra autenticação, rate limiting, integração com provedores e acesso privilegiado ao pipeline persistente de editais.

```text
Browser
  │
  ▼
Frontend estático
  │ HTTPS
  ▼
Cloudflare Worker
  ├─ Supabase Auth / JWT
  ├─ Planner + progresso
  ├─ Pipeline de edital 7E
  ├─ Gemini / Groq / Workers AI
  ├─ Radar parcial
  └─ Gateway de questões (gate contratual)
  │
  ▼
Supabase PostgreSQL + RLS
```

## Fronteiras

### `worker/src/index.js`

Roteador público. É responsável por health, CORS, rate limit, auth e encaminhamento das rotas internas.

### `worker/src/edital-pipeline.js`

Módulo interno do pipeline 7E. Não deve expor um segundo contrato HTTP independente.

### `worker/src/model-config.js`

Ponto único para defaults de modelos usados no backend.

### Supabase

Tabelas canônicas:

- `user_progress`
- `radar_preferences`
- `planner_subjects`
- `editais`
- `edital_cargos`
- `edital_materias`
- `edital_selections`
- `edital_revisions`

`planner_items` é legado e não integra a baseline atual.

## Regra de domínio central

A análise específica ocorre **somente depois da seleção de um cargo**. Matérias, requisitos, remuneração e demais dados específicos nunca devem ser misturados entre cargos do mesmo edital.

## Versionamento de edital

O pipeline usa metadados HTTP e conteúdo para evitar reprocessamento desnecessário:

- ETag;
- Last-Modified;
- SHA-256;
- versão;
- revisão persistida quando há mudança real.
