# HUB-002 — UX-001 — Fechamento técnico

Data: 22/08/2026

Issue: `#4 — UX-001`

PR: `#6 — UX-001: fluxo edital por nível e cargo`

Branch de entrega: `ux-001-level-cargo-flow`

SHA do código aprovado no teste real: `f991aa202db3c59decff51f8d8857baa237d1170`

Baseline de origem: `main` em `a2d38ddac9d941f0f180f5ca9e9374e9b0636368`

## Decisão do Founder/C.O.

O Founder concluiu o teste real com o mesmo PDF NAV Brasil usado no primeiro gate e declarou:

**UX-001 — APROVADO.**

Essa aprovação encerra o gate funcional da UX-001. Ela não autoriza, por si só, o cutover dos ambientes candidatos.

## Resultado funcional aprovado

| Verificação | Resultado |
|---|---:|
| PDF → níveis evidenciados no edital | ✅ PASSOU |
| Superior | ✅ 15 cargos/vagas |
| Técnico | ✅ 4 cargos/vagas |
| Médio | ✅ 1 cargo/vaga |
| `unresolved` | ✅ 0 |
| Nome do cargo não infere escolaridade | ✅ PASSOU |
| Escolaridade acompanhada de evidência dedicada | ✅ PASSOU |
| Nível → cargos/vagas correspondentes | ✅ PASSOU |
| Seleção → resumo completo do cargo | ✅ PASSOU |
| “Resumo pronto” oculto antes da seleção | ✅ PASSOU |
| Botão Voltar preservando estado | ✅ PASSOU |
| Reuso do resultado sem chamada desnecessária de IA | ✅ PASSOU |

O caso crítico foi validado: **Profissional Técnico de Navegação Aérea — Operador de Torre de Controle** pertence ao nível **Médio**, conforme a coluna “Nível de escolaridade” da seção 3.1 do edital. A palavra “Técnico” no nome do cargo não participa da classificação.

## Contrato aplicado

O catálogo transporta:

- `escolaridade`: somente `Fundamental`, `Médio`, `Técnico`, `Superior` ou `null`;
- `escolaridadeEvidencia.secao`;
- `escolaridadeEvidencia.trecho`.

O Worker remove código, nome e especialidade do cargo antes de validar o trecho dedicado. O nível só permanece quando o valor estruturado e a evidência concordam. Ausência, contradição ou ambiguidade resulta em `null` e o frontend mantém o cargo em `unresolved`.

## Testes finais

### UX-001

Resultado: **4/4 PASSOU**.

### Regressão completa

Resultado: **28/28 PASSOU**.

Cobertura preservada:

- migrations canônicas;
- autenticação e sessão;
- planner LIST, ADD e DELETE por usuário + edital + cargo + matéria;
- catálogo e análise isolada por cargo;
- matérias exclusivas do cargo;
- persistência e reidratação;
- ETag, Last-Modified, hash, versionamento e revisões;
- edital como fonte autoritativa;
- Gemini/Groq nos modelos aprovados;
- Fundação CESGRANRIO;
- API de questões desabilitada.

## Ambientes candidatos aprovados

### Worker preview

- Version ID: `e0f35c65-f7ac-44a9-b0ab-20cc97c36f84`
- URL: `https://ux001-nav-concurso-hub-api.gspereira-dev.workers.dev`
- health: HTTP 200;
- sessão anônima: passou;
- refresh: passou;
- Gemini, Groq, Supabase e persistência: `ready`;
- tráfego de produção: não alterado.

### Frontend candidato

- Version ID: `68130e50-47f6-41ed-92f1-61f32c9982e4`
- URL: `https://concurso-hub-ux001-nav-frontend.gspereira-dev.workers.dev`
- aponta exclusivamente para o Worker preview `ux001-nav`;
- contém somente os oito assets necessários.

A primeira tentativa de hospedagem incluiu arquivos internos `.wrangler` e arquivos do repositório. A versão `68130e50-47f6-41ed-92f1-61f32c9982e4` corrigiu o problema: `.wrangler`, `.github`, código do Worker e migrations retornam HTTP 404. Nenhum token ou chave secreta foi identificado no arquivo de cache temporariamente exposto.

## Infraestrutura preservada

| Área | Estado |
|---|---:|
| Supabase/schema/RLS | Sem alteração |
| Migrations | Sem alteração |
| Modelos Groq/Gemini | Sem alteração |
| Análise isolada por cargo | Preservada |
| API de questões | Desabilitada |
| Radar | Não iniciado |
| Cutover | Não executado |

## Plano mínimo de cutover

Somente após autorização final do C.O.:

1. registrar as versões/deployments atualmente ativos do Worker e frontend oficiais;
2. confirmar que o `main` contém o merge da PR #6;
3. promover a versão Worker `e0f35c65-f7ac-44a9-b0ab-20cc97c36f84` para o tráfego oficial;
4. publicar os mesmos oito assets do frontend candidato no serviço/rota oficial definido pelo C.O.;
5. executar health, sessão, refresh e um catálogo NAV mínimo no endereço oficial;
6. executar o fluxo nível → cargo → resumo e o planner LIST/ADD/DELETE;
7. registrar os IDs efetivamente promovidos e o horário do cutover;
8. manter os candidatos disponíveis até o aceite pós-cutover.

## Plano mínimo de rollback

Se qualquer smoke pós-cutover falhar:

1. interromper os testes e não corrigir diretamente em produção;
2. restaurar o deployment/version anteriormente ativo do Worker;
3. restaurar o deployment anterior do frontend ou sua rota/domínio oficial;
4. validar health, sessão, bootstrap e planner na versão restaurada;
5. registrar a falha e manter a PR/commit aprovado como candidato, sem nova promoção;
6. só repetir o cutover após correção, regressão e nova autorização.

## Estado para decisão do C.O.

**UX-001 APROVADA E TECNICAMENTE PRONTA PARA DECISÃO DE CUTOVER.**

Nenhum cutover foi realizado. Radar permanece bloqueado até nova ordem.
