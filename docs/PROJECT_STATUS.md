# Status do projeto

**Data-base:** 20/08/2026  
**Baseline:** `b3da0d8`  
**Fase:** HUB-002 — Integração controlada e validação end-to-end

## Concluído

- HUB-000 — governança e Arquivo-Mestre;
- HUB-001 — auditoria e reconciliação;
- baseline técnica identificável;
- contrato único entre frontend e Worker candidato;
- planner por usuário + edital + cargo + matéria;
- ADD/LIST/DELETE do planner;
- migrations canônicas sem colisão;
- modelos de IA centralizados;
- encoding/mojibake corrigido;
- pipeline 7E preservado;
- 23/23 testes locais aprovados;
- Wrangler dry-run aprovado.

## Gate atual

A baseline de código está aprovada, mas produção ainda não é considerada reconciliada. O HUB-002 deve validar, nesta ordem:

1. Supabase real em modo read-only;
2. diferenças entre schema real e migrations canônicas;
3. aplicação controlada das alterações necessárias;
4. Worker candidato correspondente ao commit aprovado;
5. smoke tests reais;
6. E2E completo.

## Fora do gate atual

Não expandir neste ciclo:

- Radar;
- simulados;
- API de questões;
- YouTube;
- Resend;
- refatorações estéticas sem necessidade funcional.

## Critério de saída do HUB-002

O fluxo mínimo deve funcionar de ponta a ponta: sessão → edital → catálogo de cargos → seleção de cargo → análise → persistência → reidratação → planner ADD/LIST/DELETE → verificação da fonte oficial.
