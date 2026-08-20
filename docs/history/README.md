# Histórico técnico

Este diretório registra os marcos de reconciliação do Hub de Concursos sem transformar artefatos históricos em migrations ou código executável.

## 20/08/2026 — HUB-001

### Auditoria e reconciliação do HEAD

A auditoria identificou quatro estados concorrentes: 7C, pipeline 7E, snapshot MVP V4.0 e produção. O problema principal deixou de ser ausência de código e passou a ser drift entre fonte, deploy e schema.

Principais achados:

- frontend V4 e Worker publicado usavam contratos diferentes;
- não havia HEAD Git canônico;
- existiam duas migrations `003` concorrentes;
- `planner_items` era legado sem migration reproduzível;
- o planner não isolava corretamente a matéria por cargo;
- DELETE remoto estava ausente;
- modelos de IA e encoding estavam divergentes;
- Radar, questões, YouTube e Resend não estavam prontos para o gate principal.

### HUB-001-R1/R2 — baseline reconciliada

A reconciliação estabeleceu a baseline `b3da0d8` e a tag lógica `hub-001-r1r2-baseline`.

Resultados:

- contrato único entre frontend e Worker candidato;
- sequência canônica `001 → 002 → 003 → 004`;
- planner em `planner_subjects` com identidade `(user_id, edital_ref, cargo_key, subject_key)`;
- ADD/LIST/DELETE implementados;
- pipeline 7E preservado;
- defaults de Gemini/Groq centralizados;
- mojibake corrigido;
- 23/23 testes locais aprovados;
- Wrangler dry-run aprovado;
- nenhuma migration/deploy de produção executada durante a reconciliação.

## Fase seguinte

O projeto entrou no **HUB-002 — Integração controlada e validação end-to-end**, com foco em Supabase real, migrations aplicadas, Worker publicado, smoke tests autenticados e fluxo E2E.

Os relatórios completos permanecem no Arquivo-Mestre do projeto e devem ser incorporados aqui somente quando sua publicação não gerar duplicidade ou exposição indevida de informações operacionais.
