# HUB-002 — EDITAL-005 — Relatório técnico

Data: 23/08/2026  
Issue: #7 — Pacote documental Multi-PDF  
Branch: `edital-005-multi-pdf`  
Baseline de origem: `main` em `f3a633a851bd4f89800d491ffcbfed0707d34ea7`  
Estado: correção de escopo de matérias concluída e validada; candidato isolado autorizado, sem cutover.

## Resultado executivo

O Hub agora aceita um ou vários PDFs como um pacote lógico único. Cada PDF mantém nome, hash, origem opcional e texto separado por página. O Worker aceita o novo contrato `documents[]` e continua aceitando o contrato legado `editalText`.

Não foi criada migration e nenhuma alteração foi aplicada ao Supabase real. O manifesto, as evidências, os snapshots por página e os conflitos usam o campo JSONB `editais.metadata` e os campos JSONB de evidência já existentes.

O fluxo P0 e o UX-001 foram preservados. A regressão automatizada terminou com **34/34 testes aprovados** e o dry-run do Worker foi aprovado com `QUESTIONS_TERMS_ACCEPTED="false"`.

Em 23/08/2026, a auditoria identificou que `evidenceMatchesSelectedCargo` rejeitava matéria geral quando a evidência não repetia o nome/código do cargo. A correção preserva dois caminhos estritos:

- matéria específica: exige vínculo literal com código ou nome do cargo selecionado;
- matéria geral por nível: exige escolaridade do cargo comprovada por evidência literal ligada ao próprio cargo, nome da matéria no trecho e abrangência explícita a todos os cargos daquele nível.

Sem prova literal da escolaridade do cargo, a regra geral por nível é rejeitada. Não há inferência externa.

## Arquitetura escolhida

1. O navegador mantém uma fila de PDFs antes da análise.
2. Cada arquivo é lido separadamente pelo PDF.js e recebe SHA-256 próprio.
3. Arquivos com o mesmo hash são deduplicados.
4. O hash do pacote é o hash individual para um único PDF ou o SHA-256 da lista ordenada dos hashes únicos para dois ou mais PDFs.
5. O frontend envia ao Worker uma estrutura `documents[]`; nenhum texto global concatenado ou truncado é criado para o fluxo Multi-PDF.
6. O Worker valida o pacote, preserva documento/página e envia o pacote estruturado ao modelo Gemini já aprovado.
7. Toda evidência Multi-PDF só é aceita quando documento, página e trecho literal existem no pacote recebido.
8. O catálogo é deduplicado por identidade do cargo. As matérias são deduplicadas e filtradas pela identidade explícita do cargo ou por abrangência geral do nível, somente quando cargo, nível, matéria e abrangência estão comprovados literalmente.
9. Manifesto, snapshots por documento/página e conflitos são persistidos em `editais.metadata`.
10. A verificação EDITAL-004 consulta cada origem disponível com ETag/Last-Modified e hash. Documento sem URL fica explicitamente como não verificável e não gera revisão falsa.

## Extensão do contrato público

### Novo contrato aceito

```json
{
  "packageHash": "sha256:...",
  "documents": [
    {
      "id": "doc-...",
      "name": "edital.pdf",
      "hash": "sha256:...",
      "sourceUrl": "https://.../edital.pdf",
      "pages": [
        { "page": 1, "text": "..." }
      ]
    }
  ]
}
```

Aplicado em:

- `POST /api/edital/catalog-cargos`
- `POST /api/edital/analyze-cargo`

### Contrato legado preservado

```json
{
  "editalText": "texto integral já utilizado pelo cliente legado"
}
```

### Evidência Multi-PDF

```json
{
  "documentId": "doc-...",
  "documentName": "conteudo-programatico.pdf",
  "page": 3,
  "secao": "Conteúdo programático — Cargo 101",
  "trecho": "Cargo 101 ... Matemática"
}
```

Para o contrato legado, `documentId`, `documentName` e `page` podem ser nulos e `secao`/`trecho` continuam compatíveis.

## Persistência sem migration

Estruturas adicionadas ao JSONB `editais.metadata`:

- `package_hash`;
- `document_manifest`;
- `document_snapshots` com páginas separadas;
- `document_source_tracking` para ETag, Last-Modified e hash por documento;
- `documents_last_checked_at`;
- `catalog_conflicts`;
- `analysis_conflicts`.

O `editais.source_hash` recebe o hash do pacote. As tabelas e migrations `001 → 002 → 003 → 004` não foram alteradas.

## Arquivos alterados

- `app.js`
- `edital-package.js` (novo)
- `index.html`
- `style.css`
- `worker/package.json`
- `worker/src/edital-documents.js` (novo)
- `worker/src/edital-pipeline.js`
- `worker/src/edital-schooling.js`
- `worker/test/edital-005.test.js` (novo)
- `worker/test/edital-pipeline.test.js`
- `docs/HUB-002_EDITAL-005_Relatorio_2026-08-22.md` (novo)

## Matriz de validação obrigatória

| # | Cenário | Resultado | Evidência automatizada |
|---|---|---|---|
| 1 | 1 PDF | ✅ PASSOU | normalização e hash individual/compatível |
| 2 | 2 PDFs complementares | ✅ PASSOU | pacote estruturado com documento A e B |
| 3 | 3+ PDFs | ✅ PASSOU | terceiro documento neutro preservado |
| 4 | cargo no A + matérias no B | ✅ PASSOU | Cargo 101 em `Abertura.pdf`; Matemática em `Conteudo.pdf` |
| 5 | PDF duplicado | ✅ PASSOU | deduplicação por SHA-256; sem duplicar cargo/matéria |
| 6 | PDF sem informação útil | ✅ PASSOU | documento permanece no manifesto sem criar fato |
| 7 | ausência de contaminação entre cargos | ✅ PASSOU | matéria do Cargo 202 rejeitada para Cargo 101 |
| 8 | evidência documento+página | ✅ PASSOU | página/trecho inexistente é rejeitado |
| 9 | UX-001 | ✅ PASSOU | 4/4 testes de níveis, cargos, resumo e Voltar |
| 10 | planner | ✅ PASSOU | LIST/ADD/DELETE por usuário+edital+cargo+matéria |
| 11 | reidratação | ✅ PASSOU | manifesto e cargo/matérias restaurados do JSONB |
| 12 | EDITAL-004 sem revisão falsa | ✅ PASSOU | pacote idêntico: 0 nova revisão; ETag evita novo GET |
| 13 | regressão completa P0 | ✅ PASSOU | suíte completa 34/34 |
| 14 | matéria geral por nível comprovado | ✅ PASSOU | Engenheiro de Software comprovadamente Superior recebe Português aplicável a todos os cargos de nível superior; Direito Administrativo do Cargo 202 é rejeitado |

## Comandos e resultados

```text
node --check app.js
node --check worker/src/edital-pipeline.js
node --test ...

tests 34
pass 34
fail 0
```

```text
wrangler 4.123.0 deploy --dry-run
Total Upload: 142.35 KiB / gzip: 32.86 KiB
QUESTIONS_TERMS_ACCEPTED = "false"
Resultado: aprovado; nenhum deploy executado.
```

Modelos preservados:

- Gemini: `gemini-3.6-flash`
- Groq edital/explicação: `llama-3.3-70b-versatile`
- Groq Whisper: `whisper-large-v3-turbo`
- Workers AI: `@cf/meta/llama-3.1-8b-instruct-fast`

## Riscos e limites conhecidos

- O teste real com PDFs oficiais divididos ainda é obrigatório; fixtures não substituem o gate do Founder.
- Pacotes muito extensos continuam sujeitos aos limites de requisição/memória do provedor, embora o código não aplique corte global de caracteres.
- Evidência Multi-PDF é intencionalmente estrita: trecho que não exista literalmente na página é descartado; matéria geral só entra quando sua abrangência e o nível do cargo estão comprovados no edital.
- Documento sem URL oficial pode ser analisado e persistido, mas sua alteração remota não pode ser verificada; o estado fica explícito e não cria revisão falsa.
- Quando um PDF remoto muda, a revisão objetiva indica impactos como indeterminados até revisão. Nenhum motor jurídico foi criado e nenhuma precedência é inventada.
- O armazenamento do texto integral por página em JSONB pode aumentar o tamanho da linha para pacotes grandes; deverá ser observado no teste real, sem reestruturar o banco neste ciclo.

## Estado de infraestrutura

- Supabase: não alterado.
- Migrations: nenhuma nova migration; `001 → 004` intactas.
- Worker de produção: não alterado.
- Frontend atual: não alterado.
- Deploy candidato: autorizado apenas em ambiente isolado; publicação e smoke registrados em complemento após execução.
- Cutover: proibido e não executado.

## Próximo gate

1. Publicar a branch e abrir PR draft sem merge.
2. Com autorização operacional, publicar Worker e frontend em URLs candidatas isoladas.
3. Repetir smoke mínimo no candidato.
4. Founder executar o teste real com edital dividido em vários PDFs.
5. Somente após aprovação, retornar ao C.O.; não executar cutover automaticamente.
