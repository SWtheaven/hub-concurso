# Passo a passo — baseline HUB-001-R1/R2

Este roteiro prepara a baseline para validação. Ele não autoriza nem executa deploy.

## 1. Validar o pacote local

Execute `TESTAR_ETAPA_7E.bat`. Em linha de comando, o equivalente é:

```text
cd worker
npm ci
npm test
npm run check
```

O dry-run precisa concluir sem erro e os testes devem confirmar o pipeline 7E e o planner LIST/ADD/DELETE.

## 2. Conferir o Supabase sem alterar produção

Compare o histórico real com a ordem canônica documentada em `docs/SQL_RECONCILIATION.md`. A sequência esperada é `001`, `002`, `003_edital_pipeline` e `004_baseline_reconciliation`.

Não execute o arquivo alternativo `202608160003_authoritative_edital`. Não remova `planner_items` ou qualquer outra tabela legada sem inventário read-only e aprovação do C.O.

Confirme também que **Authentication > Providers > Anonymous Sign-Ins** está habilitado.

## 3. Conferir a configuração do Worker

Use os nomes de ambiente listados em `worker/.dev.vars.example`. Segredos ficam exclusivamente no Cloudflare/local `.dev.vars`; nunca em `app-config.js`.

Os modelos aprovados da baseline são:

- Gemini: `gemini-3.6-flash`;
- Groq: `llama-3.3-70b-versatile`;
- Groq Whisper: `whisper-large-v3-turbo`.

Mantenha `QUESTIONS_TERMS_ACCEPTED=false` até a validação contratual/licença.

## 4. Preparar o Worker sem publicar

Execute `ATUALIZAR_WORKER_ETAPA_7E.bat`. O script roda os testes e `wrangler deploy --dry-run`; não chama `wrangler deploy`.

## 5. Gate para HUB-002

Somente após aprovação do C.O.:

1. aplicar as migrations canônicas em ambiente controlado;
2. publicar o Worker candidato;
3. abrir o frontend apontando para esse Worker;
4. executar smoke tests autenticados e o primeiro teste end-to-end.

Até essa aprovação, a produção permanece inalterada.
