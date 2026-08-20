# Etapa API 01 — fundação e conectores prioritários

## Escopo entregue

Esta etapa preserva o frontend existente e introduz uma fronteira segura para integrações externas.

| Componente | Estado | Decisão aplicada |
|---|---|---|
| Cloudflare Worker | Implementado | Proxy, CORS, normalização, rate limiting e proteção de chaves |
| Supabase | Implementado | Progresso e matérias do planner com RLS, sessão anônima e prevenção de duplicidade |
| API das Questões | Implementada com trava | Sem cache/persistência; exige aceite explícito dos termos |
| Querido Diário | Implementado | Radar de descoberta, cache de 5 minutos e aviso de verificação |
| Groq | Implementado | Explicações de erros sob demanda |
| Whisper na Groq | Rota implementada | Recebe áudio multipart de até 25 MB |
| Workers AI | Implementado | Fallback para explicações quando a Groq falha |
| Gemini | Implementado | Extração factual do edital no Worker, com evidências de página e JSON tipado |
| Groq no resumidor | Implementado | Pós-processamento semântico e fallback da extração |
| Resend | Planejado | Entrará após preferências de alerta e autenticação |
| YouTube Data API | Planejado | Entrará após normalização de matérias/tópicos |
| BrasilAPI | Planejado | Entrará no calendário do planner |
| Concursos Brasil/Deno | Planejado como discovery | Nunca será a única fonte oficial |
| ENEM.dev | Opcional | Usar somente para validar o motor de provas |

## Contrato de segurança

- O frontend nunca recebe chaves de Groq, Supabase ou API das Questões em produção.
- O endpoint de questões envia `Cache-Control: no-store` e não grava conteúdo externo no Supabase.
- `QUESTIONS_TERMS_ACCEPTED` começa como `false`. A integração devolve erro controlado até a revisão contratual.
- O Querido Diário é um radar. Cada resultado carrega `verificationRequired: true` e aponta ao documento.
- O rate limiter do Worker usa a identidade de rede disponibilizada pela Cloudflare; as chaves nunca fazem parte da chave de limite.
- As rotas de progresso e planner validam o token no Supabase Auth e dependem das políticas RLS.
- O resumidor separa extração factual de sumarização; valores sem evidência são normalizados para `null` e nunca recebem placeholders.

## Configuração local

1. Copie `worker/.dev.vars.example` para `worker/.dev.vars`.
2. Preencha `GEMINI_API_KEY`, `GROQ_API_KEY`, `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` conforme necessário.
3. Solicite ao provedor das questões confirmação escrita sobre uso comercial, exibição a usuários, cache e retenção.
4. Somente após a confirmação, defina `QUESTIONS_TERMS_ACCEPTED="true"`.
5. Aplique, em ordem, as migrações `202608150001_initial_infrastructure.sql` e `202608150002_planner_subjects.sql` no Supabase.
6. Habilite **Anonymous Sign-Ins** no Supabase Auth para sincronizar o planner sem exigir uma tela de cadastro nesta etapa.
7. Rode `npm install` e `npm test` dentro de `worker`.
8. Use `INICIAR_NOVA_INFRA.bat` para desenvolvimento local. O perfil local não carrega Workers AI, evitando exigir login na Cloudflare; o fallback é habilitado no perfil de produção.

## Próxima etapa recomendada

Adicionar autenticação visual opcional (email/social), sincronização incremental do restante do estado local e preferências do radar. Depois disso, implementar Resend com alertas idempotentes e YouTube/BrasilAPI.
