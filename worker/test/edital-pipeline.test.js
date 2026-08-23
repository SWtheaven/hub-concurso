import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import worker from "../src/edital-pipeline.js";

const tables = Object.fromEntries([
  "editais",
  "edital_cargos",
  "edital_materias",
  "edital_selections",
  "edital_revisions"
].map(name => [name, []]));

const canonical = value => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

const uniqueKey = (table, row) => {
  if (table === "edital_cargos") return [
    row.edital_id,
    canonical(row.nome),
    canonical(row.especialidade),
    canonical(row.codigo)
  ].join("|");

  if (table === "edital_materias")
    return `${row.cargo_id}|${canonical(row.nome)}`;

  if (table === "edital_selections")
    return `${row.user_id ?? ""}|${row.edital_id}`;

  return row.id;
};

const filterRows = (rows, searchParams) => rows.filter(row => {
  for (const [name, expression] of searchParams.entries()) {
    if (["select", "limit", "on_conflict", "order"].includes(name)) continue;

    if (expression === "is.null") {
      if (row[name] !== null && row[name] !== undefined) return false;
      continue;
    }

    if (expression.startsWith("eq.")) {
      if (String(row[name]) !== expression.slice(3)) return false;
    }
  }

  return true;
});

const sourceVersions = {
  1: {
    etag: '"petro-v1"',
    version: "v1",
    lastModified: "Sat, 16 Aug 2026 10:00:00 GMT",
    content: `
EDITAL PETRO XYZ 2026
InscriÃ§Ãµes de 01/09/2026 a 30/09/2026.
Cargo 101 - TÃ©cnico de OperaÃ§Ã£o.
Requisitos: ensino mÃ©dio e curso tÃ©cnico em AutomaÃ§Ã£o Industrial.
MatÃ©rias: MatemÃ¡tica, LÃ­ngua Portuguesa e FÃ­sica.
`
  },
  2: {
    etag: '"petro-v2"',
    version: "v2",
    lastModified: "Sun, 17 Aug 2026 10:00:00 GMT",
    content: `
RETIFICAÃ‡ÃƒO DO EDITAL PETRO XYZ 2026
InscriÃ§Ãµes prorrogadas atÃ© 05/10/2026.
Cargo 101 - TÃ©cnico de OperaÃ§Ã£o.
Requisitos: ensino mÃ©dio e curso tÃ©cnico em AutomaÃ§Ã£o Industrial.
MatÃ©rias: MatemÃ¡tica, LÃ­ngua Portuguesa e FÃ­sica.
`
  }
};
let activeSourceVersion = 1;
let aiCalls = 0;
let sourceGetCalls = 0;

const hashSource = content =>
  `sha256:${createHash("sha256").update(content).digest("hex")}`;

globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  const method = options.method || "GET";

  if (url.hostname === "petro-source.test") {
    const source = sourceVersions[activeSourceVersion];
    const headers = {
      ETag: source.etag,
      "Last-Modified": source.lastModified,
      "X-Source-Version": source.version,
      "Content-Type": "text/plain; charset=utf-8"
    };

    if (method === "HEAD") return new Response(null, { status: 200, headers });

    if (method === "GET") {
      sourceGetCalls += 1;
      const requestHeaders = new Headers(options.headers || {});

      if (requestHeaders.get("If-None-Match") === source.etag)
        return new Response(null, { status: 304, headers });

      return new Response(source.content, { status: 200, headers });
    }
  }

  if (
    url.hostname === "generativelanguage.googleapis.com" &&
    url.pathname === "/v1beta/interactions"
  ) {
    aiCalls += 1;
    return Response.json({
      steps: [{
        type: "model_output",
        content: [{
          type: "text",
          text: JSON.stringify({
            summary: "O prazo de inscriÃ§Ã£o foi prorrogado atÃ© 05/10/2026.",
            impacts: {
              selectedCargo: false,
              requisitos: false,
              prova: false,
              inscricoes: true,
              materias: false
            },
            changes: [{
              category: "inscricoes",
              description: "Prazo final alterado de 30/09 para 05/10/2026.",
              affectsSelectedCargo: false,
              evidenceOld: "atÃ© 30/09/2026",
              evidenceNew: "atÃ© 05/10/2026"
            }]
          })
        }]
      }]
    });
  }

  const match = url.pathname.match(/^\/rest\/v1\/([^/]+)$/);

  if (!match) throw new Error(`Chamada externa inesperada: ${url}`);

  const table = match[1];
  const rows = tables[table];

  if (!rows) return Response.json({ message: "Tabela inexistente" }, { status: 404 });

  if (method === "GET") {
    const selected = filterRows(rows, url.searchParams);
    const limit = Number(url.searchParams.get("limit"));
    return Response.json(limit ? selected.slice(0, limit) : selected);
  }

  if (method === "POST") {
    const payload = JSON.parse(options.body);
    const byId = rows.findIndex(row => row.id === payload.id);
    const sameUnique = rows.findIndex(
      row => uniqueKey(table, row) === uniqueKey(table, payload)
    );

    if (sameUnique >= 0 && byId < 0) {
      return Response.json({ code: "23505", message: "duplicate key" }, {
        status: 409
      });
    }

    if (byId >= 0) rows[byId] = { ...rows[byId], ...payload };
    else rows.push({ ...payload });

    const stored = rows.find(row => row.id === payload.id);
    return Response.json([stored], { status: byId >= 0 ? 200 : 201 });
  }

  if (method === "PATCH") {
    const payload = JSON.parse(options.body);
    const selected = filterRows(rows, url.searchParams);

    for (const row of selected) Object.assign(row, payload);

    return Response.json(selected);
  }

  return Response.json({ message: "Método não simulado" }, { status: 405 });
};

const catalog = {
  concurso: "PROCESSO SELETIVO PÚBLICO PETRO XYZ 2026",
  orgao: "PETRO XYZ",
  banca: "Fundação CESGRANRIO",
  regrasGerais: [{
    categoria: "Inscrições",
    resumo: "Inscrições pela internet de 01/09/2026 a 30/09/2026.",
    evidencia: {
      secao: "Inscrições",
      trecho: "As inscrições ocorrerão de 01/09/2026 a 30/09/2026."
    }
  }],
  cargos: [
    {
      codigo: "101",
      nome: "TÉCNICO DE OPERAÇÃO",
      especialidade: null,
      localidade: "Rio de Janeiro",
      uf: "RJ",
      vagas: "20 vagas imediatas e cadastro de reserva",
      salario: "R$ 5.800,00",
      cargaHoraria: "40 horas semanais",
      evidencia: {
        secao: "CARGO 101 - TÉCNICO DE OPERAÇÃO",
        trecho: "Cargo 101: salário de R$ 5.800,00 e 40 horas semanais."
      }
    },
    {
      codigo: "102",
      nome: "TÉCNICO DE MANUTENÇÃO",
      especialidade: "MECÂNICA",
      localidade: "Rio de Janeiro",
      uf: "RJ",
      vagas: "12 vagas",
      salario: "R$ 6.100,00",
      cargaHoraria: "40 horas semanais",
      evidencia: {
        secao: "CARGO 102 - TÉCNICO DE MANUTENÇÃO - MECÂNICA",
        trecho: "Cargo 102: 12 vagas e salário de R$ 6.100,00."
      }
    },
    {
      codigo: "103",
      nome: "TÉCNICO DE SEGURANÇA DO TRABALHO",
      especialidade: null,
      localidade: "Macaé",
      uf: "RJ",
      vagas: "Cadastro de reserva",
      salario: "R$ 6.300,00",
      cargaHoraria: null,
      evidencia: {
        secao: "CARGO 103 - TÉCNICO DE SEGURANÇA DO TRABALHO",
        trecho: "Cargo 103: cadastro de reserva e salário de R$ 6.300,00."
      }
    },
    {
      codigo: "104",
      nome: "ANALISTA DE SISTEMAS",
      especialidade: "DESENVOLVIMENTO",
      localidade: "Rio de Janeiro",
      uf: "RJ",
      vagas: "5 vagas",
      salario: "R$ 10.500,00",
      cargaHoraria: "40 horas semanais",
      evidencia: {
        secao: "CARGO 104 - ANALISTA DE SISTEMAS - DESENVOLVIMENTO",
        trecho: "Cargo 104: 5 vagas e salário de R$ 10.500,00."
      }
    }
  ]
};

const selectedCargo = {
  codigo: "101",
  nome: "TÉCNICO DE OPERAÇÃO",
  especialidade: null,
  localidade: "Rio de Janeiro",
  uf: "RJ"
};

const evidence = (cargo, text) => ({
  secao: `CONTEÚDO PROGRAMÁTICO - Cargo ${cargo}`,
  trecho: `Cargo ${cargo}: ${text}`
});

const cargoAnalysis = {
  selectedCargo,
  requisitos: {
    itens: [
      {
        tipo: "escolaridade",
        descricao: "Ensino médio completo",
        evidencia: evidence("101", "Ensino médio completo")
      },
      {
        tipo: "curso_tecnico",
        descricao: "Curso técnico em Automação Industrial",
        evidencia: evidence("101", "curso técnico em Automação Industrial")
      }
    ],
    evidencia: evidence("101", "requisitos do cargo")
  },
  remuneracao: {
    vencimentoBasico: "R$ 5.800,00",
    remuneracaoTotal: null,
    beneficios: [],
    cargaHoraria: "40 horas semanais",
    observacoes: null,
    evidencia: evidence("101", "R$ 5.800,00; 40 horas semanais")
  },
  prova: null,
  materias: [
    { nome: "Conhecimentos Gerais", topicos: ["Regra comum ao nível técnico"], peso: null, numeroQuestoes: "10", evidencia: evidence("Nível técnico", "Conhecimentos Gerais") },
    { nome: "Matemática", topicos: [], peso: null, numeroQuestoes: null, evidencia: evidence("101", "Matemática") },
    { nome: "Língua Portuguesa", topicos: [], peso: null, numeroQuestoes: null, evidencia: evidence("101", "Língua Portuguesa") },
    { nome: "Física", topicos: [], peso: null, numeroQuestoes: null, evidencia: evidence("101", "Física") },
    { nome: "Mecânica", topicos: [], peso: null, numeroQuestoes: null, evidencia: evidence("102", "Mecânica") },
    { nome: "Termodinâmica", topicos: [], peso: null, numeroQuestoes: null, evidencia: evidence("102", "Termodinâmica") },
    { nome: "Segurança do Trabalho", topicos: [], peso: null, numeroQuestoes: null, evidencia: evidence("103", "Segurança do Trabalho") },
    { nome: "Banco de Dados", topicos: [], peso: null, numeroQuestoes: null, evidencia: evidence("104", "Banco de Dados") },
    { nome: "Programação", topicos: [], peso: null, numeroQuestoes: null, evidencia: evidence("104", "Programação") }
  ],
  resumoCargo: {
    resumo: "Técnico de Operação, código 101.",
    regrasGeraisAplicaveis: catalog.regrasGerais,
    evidencia: evidence("101", "Técnico de Operação")
  }
};

const payload = {
  editalKey: "petro-xyz-2026",
  edital: {
    nome: catalog.concurso,
    orgao: catalog.orgao,
    banca: catalog.banca,
    sourceUrl: "https://petro-source.test/editais/2026.txt",
    sourceType: "oficial",
    sourceHash: hashSource(sourceVersions[1].content)
  },
  catalog,
  selectedCargo,
  cargoAnalysis,
  model: "gemini-3.6-flash"
};

const persist = async body => {
  const response = await worker.fetch(new Request(
    "https://worker.test/api/edital/persist",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Concurso-Hub-Token": "test-token"
      },
      body: JSON.stringify(body)
    }
  ), {
    CONCURSO_HUB_INTERNAL_TOKEN: "test-token",
    SUPABASE_URL: "https://supabase.test",
    SUPABASE_SECRET_KEY: "backend-only-test-key"
  });

  return { response, data: await response.json() };
};

const first = await persist(payload);
const second = await persist(payload);

assert.equal(first.response.status, 200);
assert.equal(second.response.status, 200);
assert.equal(first.data.ok, true);
assert.equal(first.data.edital.id, second.data.edital.id);
assert.equal(first.data.selectedCargo.id, second.data.selectedCargo.id);
assert.deepEqual(
  first.data.materias.items.map(item => item.id),
  second.data.materias.items.map(item => item.id)
);

assert.equal(tables.editais.length, 1);
assert.equal(tables.edital_cargos.length, 4);
assert.equal(tables.edital_selections.length, 1);
assert.equal(tables.edital_materias.length, 4);
assert.equal(tables.edital_revisions.length, 0);
assert.deepEqual(
  tables.edital_materias.map(item => item.nome).sort(),
  ["Conhecimentos Gerais", "Física", "Língua Portuguesa", "Matemática"].sort()
);

const selectedRow = tables.edital_cargos.find(row => row.codigo === "101");
assert.ok(selectedRow);
assert.equal(selectedRow.requisitos.itens.length, 2);
assert.equal(selectedRow.remuneracao.vencimentoBasico, "R$ 5.800,00");
assert.equal(selectedRow.prova && Object.keys(selectedRow.prova).length, 0);
assert.ok(tables.edital_materias.every(row => row.cargo_id === selectedRow.id));
assert.deepEqual(tables.editais[0].regras_gerais, catalog.regrasGerais);

// O cliente nao pode fabricar uma revisao enviando outro hash.
const forgedChange = structuredClone(payload);
forgedChange.edital.sourceHash = hashSource(sourceVersions[2].content);
const rejectedForgedChange = await persist(forgedChange);
assert.equal(rejectedForgedChange.response.status, 409);
assert.equal(tables.edital_revisions.length, 0);
assert.equal(tables.editais[0].source_hash, payload.edital.sourceHash);

const mismatchedPayload = structuredClone(payload);
mismatchedPayload.cargoAnalysis.selectedCargo.codigo = "102";
const mismatched = await persist(mismatchedPayload);
assert.equal(mismatched.response.status, 400);
assert.equal(mismatched.data.ok, false);
assert.equal(tables.edital_materias.length, 4);

const callWorker = async (path, { method = "GET", body = null } = {}) => {
  const response = await worker.fetch(new Request(`https://worker.test${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Concurso-Hub-Token": "test-token"
    },
    body: body === null ? null : JSON.stringify(body)
  }), {
    CONCURSO_HUB_INTERNAL_TOKEN: "test-token",
    SUPABASE_URL: "https://supabase.test",
    SUPABASE_SECRET_KEY: "backend-only-test-key",
    GEMINI_API_KEY: "gemini-test-key"
  });

  return { response, data: await response.json() };
};

// Primeira abertura: reidrata tudo, calcula o hash e confirma que nada mudou.
const firstBootstrap = await callWorker("/api/hub/bootstrap", {
  method: "POST",
  body: {}
});
assert.equal(firstBootstrap.response.status, 200);
assert.equal(firstBootstrap.data.state, "ready");
assert.equal(firstBootstrap.data.context.selectedCargo.codigo, "101");
assert.equal(firstBootstrap.data.context.materias.length, 4);
assert.equal(firstBootstrap.data.context.edital.regrasGerais.length, 1);
assert.equal(firstBootstrap.data.sourceCheck.state, "sem_alteracao");
assert.equal(firstBootstrap.data.alert, null);
assert.equal(aiCalls, 0);
assert.equal(sourceGetCalls, 1);
assert.ok(tables.editais[0].last_checked_at);
assert.equal(tables.editais[0].last_changed_at, undefined);
assert.equal(tables.editais[0].metadata.source_etag, sourceVersions[1].etag);
assert.match(tables.editais[0].metadata.source_text_snapshot, /30\/09\/2026/);

const rehydrated = await callWorker("/api/edital/current");
assert.equal(rehydrated.data.state, "rehydrated");
assert.equal(
  rehydrated.data.context.selectedCargo.analysis.requisitos.itens.length,
  2
);
assert.deepEqual(
  rehydrated.data.context.materias.map(item => item.nome).sort(),
  tables.edital_materias.map(item => item.nome).sort()
);

// Mesmo ETag: nao baixa o documento e nao chama IA.
const unchangedBootstrap = await callWorker("/api/hub/bootstrap", {
  method: "POST",
  body: {}
});
assert.equal(unchangedBootstrap.data.sourceCheck.detectionMethod, "etag");
assert.equal(unchangedBootstrap.data.alert, null);
assert.equal(sourceGetCalls, 1);
assert.equal(aiCalls, 0);
assert.equal(tables.edital_revisions.length, 0);

// A mesma URL passa a servir outra versao: hash muda e so entao a IA roda.
activeSourceVersion = 2;
const changedBootstrap = await callWorker("/api/hub/bootstrap", {
  method: "POST",
  body: {}
});
assert.equal(changedBootstrap.data.sourceCheck.state, "alterado");
assert.equal(changedBootstrap.data.sourceCheck.changed, true);
assert.equal(changedBootstrap.data.alert.type, "edital_changed");
assert.equal(changedBootstrap.data.alert.affectsSelectedCargo, false);
assert.equal(
  changedBootstrap.data.alert.impacts
    .find(item => item.key === "inscricoes").affected,
  true
);
assert.equal(aiCalls, 1);
assert.equal(sourceGetCalls, 2);
assert.equal(tables.edital_revisions.length, 1);
assert.equal(tables.edital_revisions[0].old_hash, payload.edital.sourceHash);
assert.equal(
  tables.edital_revisions[0].new_hash,
  hashSource(sourceVersions[2].content)
);
assert.ok(tables.editais[0].last_changed_at);
assert.equal(tables.editais[0].source_version, "v2");

// A nova abertura na mesma versao nao repete alerta, IA ou revisao.
const afterChangeBootstrap = await callWorker("/api/hub/bootstrap", {
  method: "POST",
  body: {}
});
assert.equal(afterChangeBootstrap.data.sourceCheck.state, "sem_alteracao");
assert.equal(afterChangeBootstrap.data.alert, null);
assert.equal(aiCalls, 1);
assert.equal(tables.edital_revisions.length, 1);

// Sem URL oficial o estado e explicito e nenhuma fonte e inventada.
tables.editais[0].source_url = null;
const withoutOfficialSource = await callWorker("/api/edital/check-source", {
  method: "POST",
  body: {}
});
assert.equal(withoutOfficialSource.data.state, "sem_fonte_oficial");
assert.equal(withoutOfficialSource.data.changed, false);
assert.equal(withoutOfficialSource.data.alert, null);
assert.equal(aiCalls, 1);

// EDITAL-005: o pacote verifica cada origem e não cria revisão falsa.
const trackedHash = hashSource(sourceVersions[2].content);
const offlineHash = hashSource("ANEXO COMPLEMENTAR SEM URL OFICIAL");
const packageHash = hashSource([trackedHash, offlineHash].sort().join("\n"));
tables.editais[0].source_hash = packageHash;
tables.editais[0].metadata = {
  document_manifest: [
    {
      id: "doc-edital",
      name: "Edital.pdf",
      hash: trackedHash,
      sourceUrl: "https://petro-source.test/editais/2026.txt",
      pageCount: 1
    },
    {
      id: "doc-anexo",
      name: "Anexo.pdf",
      hash: offlineHash,
      sourceUrl: null,
      pageCount: 1
    }
  ]
};
const revisionsBeforePackageCheck = tables.edital_revisions.length;
const getsBeforePackageCheck = sourceGetCalls;
const unchangedPackage = await callWorker("/api/edital/check-source", {
  method: "POST",
  body: {}
});
assert.equal(unchangedPackage.data.state, "sem_alteracao");
assert.equal(unchangedPackage.data.changed, false);
assert.equal(unchangedPackage.data.alert, null);
assert.equal(tables.edital_revisions.length, revisionsBeforePackageCheck);
assert.equal(sourceGetCalls, getsBeforePackageCheck + 1);
assert.equal(
  unchangedPackage.data.documents.find(item => item.id === "doc-anexo").state,
  "sem_fonte_oficial"
);

const cachedPackageCheck = await callWorker("/api/edital/check-source", {
  method: "POST",
  body: {}
});
assert.equal(cachedPackageCheck.data.changed, false);
assert.equal(sourceGetCalls, getsBeforePackageCheck + 1);
assert.equal(tables.edital_revisions.length, revisionsBeforePackageCheck);

// Alterar uma única origem altera o hash combinado e cria uma única revisão objetiva.
activeSourceVersion = 1;
const changedPackage = await callWorker("/api/edital/check-source", {
  method: "POST",
  body: {}
});
assert.equal(changedPackage.data.state, "alterado");
assert.equal(changedPackage.data.changed, true);
assert.equal(changedPackage.data.alert.type, "edital_changed");
assert.equal(tables.edital_revisions.length, revisionsBeforePackageCheck + 1);
assert.equal(aiCalls, 1);
assert.equal(
  tables.editais[0].source_hash,
  hashSource([hashSource(sourceVersions[1].content), offlineHash].sort().join("\n"))
);

// Persistência e reidratação do manifesto Multi-PDF usam o JSONB já existente.
const multiPayload = structuredClone(payload);
multiPayload.editalKey = "petro-xyz-multi-pdf";
multiPayload.edital.nome = "PROCESSO SELETIVO PETRO XYZ — PACOTE DOCUMENTAL";
multiPayload.edital.sourceUrl = null;
multiPayload.edital.sourceHash = packageHash;
multiPayload.edital.sourceText = null;
multiPayload.edital.sourceMetadata = {
  package_hash: packageHash,
  document_manifest: [
    {
      id: "doc-edital",
      name: "Edital.pdf",
      hash: trackedHash,
      sourceUrl: null,
      pageCount: 1
    },
    {
      id: "doc-anexo",
      name: "Conteudo.pdf",
      hash: offlineHash,
      sourceUrl: null,
      pageCount: 1
    }
  ],
  document_snapshots: [
    {
      id: "doc-edital",
      name: "Edital.pdf",
      hash: trackedHash,
      sourceUrl: null,
      pages: [{ page: 1, text: "Cargo 101 - Técnico de Operação" }]
    },
    {
      id: "doc-anexo",
      name: "Conteudo.pdf",
      hash: offlineHash,
      sourceUrl: null,
      pages: [{ page: 1, text: "Cargo 101 - Matemática" }]
    }
  ]
};
const persistedPackage = await persist(multiPayload);
assert.equal(persistedPackage.response.status, 200);
assert.equal(tables.editais.length, 2);
const packageRow = tables.editais.find(
  row => row.id === persistedPackage.data.edital.id
);
assert.equal(packageRow.source_hash, packageHash);
assert.equal(packageRow.metadata.document_manifest.length, 2);
assert.equal(packageRow.metadata.document_snapshots[1].pages[0].page, 1);
const rehydratedPackage = await callWorker(
  `/api/edital/current?editalId=${encodeURIComponent(packageRow.id)}`
);
assert.equal(rehydratedPackage.data.state, "rehydrated");
assert.equal(rehydratedPackage.data.context.edital.metadata.document_manifest.length, 2);
assert.equal(rehydratedPackage.data.context.selectedCargo.codigo, "101");
assert.equal(rehydratedPackage.data.context.materias.length, 4);

const source = await readFile(
  new URL("../src/edital-pipeline.js", import.meta.url),
  "utf8"
);
for (const route of [
  "/api/edital/catalog-cargos",
  "/api/edital/analyze-cargo",
  "/api/edital/persist",
  "/api/edital/current",
  "/api/edital/check-source",
  "/api/hub/bootstrap"
]) assert.match(source, new RegExp(route.replaceAll("/", "\\/")));

for (const legacy of [
  "/api/planner/add",
  "/api/ai/explain",
  "planner_items"
]) assert.equal(source.includes(legacy), false);

console.log(
  "Etapa 7E: reidratação OK; sem mudança = 0 IA; mudança real = 1 IA / 1 revisão"
);
