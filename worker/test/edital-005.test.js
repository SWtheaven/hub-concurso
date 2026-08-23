import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import worker from "../src/edital-pipeline.js";
import {
  combinedPackageHash,
  normalizeEditalDocuments,
  sanitizeDocumentEvidence
} from "../src/edital-documents.js";

const hash = text => `sha256:${createHash("sha256").update(text).digest("hex")}`;
const evidence = (document, page, trecho, secao = null) => ({
  documentId: document.id,
  documentName: document.name,
  page,
  secao,
  trecho
});
const makeDocument = (id, name, pages, sourceUrl = null) => {
  const source = pages.map(page => page.text).join("\n");
  return { id, name, hash: hash(source), sourceUrl, pages };
};

const cargoDocument = makeDocument("doc-a", "Abertura.pdf", [{
  page: 7,
  text: "Cargo 101 - Técnico de Operação. Escolaridade: Técnico. Vagas: 20. Requisito explícito: curso técnico reconhecido. Jornada semanal de 40 horas."
}]);
const subjectDocument = makeDocument("doc-b", "Conteudo.pdf", [{
  page: 3,
  text: "Conteúdo programático do Cargo 101 - Técnico de Operação: Matemática; Física. Cargo 202 - Analista: Direito."
}]);
const emptyDocument = makeDocument("doc-c", "Cronograma.pdf", [{ page: 1, text: "" }]);
const superiorCargoDocument = makeDocument("doc-superior", "Cargos.pdf", [{
  page: 11,
  text: "Cargo 301 - Engenheiro de Software. Escolaridade: Superior."
}]);
const superiorSubjectDocument = makeDocument("doc-superior-subjects", "Programas.pdf", [{
  page: 4,
  text: "Português — aplicável a todos os cargos de nível superior. Cargo 202 - Analista Jurídico: Direito Administrativo."
}]);

test("EDITAL-005 normalizes 1, 2 and 3+ PDFs, removes duplicate hashes and keeps empty useful-neutral PDFs", async () => {
  for (const documents of [
    [cargoDocument],
    [cargoDocument, subjectDocument],
    [cargoDocument, subjectDocument, emptyDocument]
  ]) {
    const normalized = await normalizeEditalDocuments({ documents });
    assert.equal(normalized.documents.length, documents.length);
    assert.equal(normalized.packageHash, await combinedPackageHash(documents.map(item => item.hash)));
  }

  const deduplicated = await normalizeEditalDocuments({
    documents: [cargoDocument, subjectDocument, structuredClone(cargoDocument)]
  });
  assert.equal(deduplicated.documents.length, 2);
  assert.equal(
    deduplicated.packageHash,
    await combinedPackageHash([cargoDocument.hash, subjectDocument.hash])
  );
});

test("EDITAL-005 keeps editalText backward compatible and validates document+page+literal evidence", async () => {
  const legacy = await normalizeEditalDocuments({
    editalText: "Edital legado com texto suficiente. ".repeat(5)
  });
  assert.equal(legacy.mode, "legacy");
  assert.equal(legacy.documents.length, 1);

  const packageData = await normalizeEditalDocuments({
    documents: [cargoDocument, subjectDocument]
  });
  assert.deepEqual(
    sanitizeDocumentEvidence(
      evidence(subjectDocument, 3, "Cargo 101 - Técnico de Operação"),
      packageData
    ),
    {
      documentId: "doc-b",
      documentName: "Conteudo.pdf",
      page: 3,
      secao: null,
      trecho: "Cargo 101 - Técnico de Operação"
    }
  );
  assert.equal(
    sanitizeDocumentEvidence(evidence(subjectDocument, 99, "Matemática"), packageData),
    null
  );
  assert.equal(
    sanitizeDocumentEvidence(evidence(cargoDocument, 7, "Direito"), packageData),
    null
  );
});

test("EDITAL-005 frontend exposes queue, multiple selection, removal and one analysis action", async () => {
  const [html, app, packageSource] = await Promise.all([
    readFile(new URL("../../index.html", import.meta.url), "utf8"),
    readFile(new URL("../../app.js", import.meta.url), "utf8"),
    readFile(new URL("../../edital-package.js", import.meta.url), "utf8")
  ]);
  assert.match(html, /id="editalInput"[^>]*multiple/);
  assert.match(html, /id="editalDocumentList"/);
  assert.match(html, /id="addEditalDocumentBtn"/);
  assert.match(html, /id="analyzeEditalDocumentsBtn"[^>]*>Analisar documentos/);
  assert.match(app, /function queueEditalFiles\b/);
  assert.match(app, /function analyzeEditalDocuments\b/);
  assert.match(app, /document-remove/);
  assert.match(app, /documents: editalDocumentsPayload\(\)/);
  assert.doesNotMatch(packageSource, /\.slice\(0,\s*\d{4,}/);

  const context = vm.createContext({
    window: { crypto: webcrypto },
    TextEncoder,
    Uint8Array,
    Set,
    Object
  });
  vm.runInContext(packageSource, context);
  const combined = await context.window.EditalPackage.combinedHash([
    cargoDocument,
    subjectDocument,
    cargoDocument
  ]);
  assert.equal(combined, await combinedPackageHash([cargoDocument.hash, subjectDocument.hash]));
});

test("EDITAL-005 public Worker contract still accepts legacy editalText", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    steps: [{
      type: "model_output",
      content: [{
        type: "text",
        text: JSON.stringify({
          concurso: "Concurso legado",
          orgao: null,
          banca: null,
          regrasGerais: [],
          cargos: [{
            codigo: "1",
            nome: "Cargo legado",
            especialidade: null,
            localidade: null,
            uf: null,
            vagas: null,
            salario: null,
            cargaHoraria: null,
            escolaridade: null,
            escolaridadeEvidencia: {
              documentId: null,
              documentName: null,
              page: null,
              secao: null,
              trecho: null
            },
            evidencia: {
              documentId: null,
              documentName: null,
              page: null,
              secao: "Cargos",
              trecho: "Cargo legado"
            }
          }],
          conflitos: []
        })
      }]
    }]
  });
  try {
    const response = await worker.fetch(new Request(
      "https://worker.test/api/edital/catalog-cargos",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editalText: "Cargo legado. ".repeat(12) })
      }
    ), { GEMINI_API_KEY: "test", EDITAL_PIPELINE_TRUSTED: true });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.result.cargos[0].nome, "Cargo legado");
    assert.equal(data.result.packageHash, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("EDITAL-005 associates cargo in A with subjects in B and rejects duplicate/foreign matter", async () => {
  const geminiResults = [{
    concurso: "Concurso Complementar 2026",
    orgao: "Órgão Exemplo",
    banca: "Fundação CESGRANRIO",
    regrasGerais: [],
    cargos: [{
      codigo: "101",
      nome: "Técnico de Operação",
      especialidade: null,
      localidade: null,
      uf: null,
      vagas: "20",
      salario: null,
      cargaHoraria: null,
      escolaridade: "Técnico",
      escolaridadeEvidencia: evidence(cargoDocument, 7, "Escolaridade: Técnico"),
      evidencia: evidence(cargoDocument, 7, "Cargo 101 - Técnico de Operação")
    }],
    conflitos: []
  }, {
    selectedCargo: {
      codigo: "101",
      nome: "Técnico de Operação",
      especialidade: null,
      localidade: null,
      uf: null
    },
    requisitos: null,
    remuneracao: null,
    prova: null,
    materias: [
      {
        nome: "Matemática",
        topicos: ["Álgebra", "Álgebra"],
        peso: null,
        numeroQuestoes: null,
        evidencia: evidence(subjectDocument, 3, "Cargo 101 - Técnico de Operação: Matemática")
      },
      {
        nome: "Matemática",
        topicos: [],
        peso: null,
        numeroQuestoes: null,
        evidencia: evidence(subjectDocument, 3, "Cargo 101 - Técnico de Operação: Matemática")
      },
      {
        nome: "Direito",
        topicos: [],
        peso: null,
        numeroQuestoes: null,
        evidencia: evidence(subjectDocument, 3, "Cargo 202 - Analista: Direito")
      }
    ],
    resumoCargo: null,
    conflitos: []
  }];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    const url = new URL(typeof input === "string" ? input : input.url);
    if (url.hostname !== "generativelanguage.googleapis.com")
      throw new Error(`Chamada inesperada: ${url}`);
    const result = geminiResults.shift();
    return Response.json({
      steps: [{
        type: "model_output",
        content: [{ type: "text", text: JSON.stringify(result) }]
      }]
    });
  };

  try {
    const documents = [cargoDocument, subjectDocument, emptyDocument, cargoDocument];
    const packageHash = await combinedPackageHash(documents.map(item => item.hash));
    const env = { GEMINI_API_KEY: "test", EDITAL_PIPELINE_TRUSTED: true };
    const call = async (path, payload) => {
      const response = await worker.fetch(new Request(`https://worker.test${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }), env);
      return { response, data: await response.json() };
    };

    const catalog = await call("/api/edital/catalog-cargos", { documents, packageHash });
    assert.equal(catalog.response.status, 200);
    assert.equal(catalog.data.result.documentCount, 3);
    assert.equal(catalog.data.result.cargos.length, 1);
    assert.equal(catalog.data.result.cargos[0].evidencia.documentName, "Abertura.pdf");

    const analyzed = await call("/api/edital/analyze-cargo", {
      documents,
      packageHash,
      selectedCargo: catalog.data.result.cargos[0],
      regrasGerais: []
    });
    assert.equal(analyzed.response.status, 200);
    assert.deepEqual(analyzed.data.result.materias.map(item => item.nome), ["Matemática"]);
    assert.deepEqual(analyzed.data.result.materias[0].topicos, ["Álgebra"]);
    assert.equal(analyzed.data.result.materias[0].evidencia.documentName, "Conteudo.pdf");
    assert.equal(analyzed.data.result.materias[0].evidencia.page, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("EDITAL-005 accepts a general subject only for the edital-proven cargo level and rejects a foreign specific subject", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    const url = new URL(typeof input === "string" ? input : input.url);
    if (url.hostname !== "generativelanguage.googleapis.com")
      throw new Error(`Chamada inesperada: ${url}`);
    return Response.json({
      steps: [{
        type: "model_output",
        content: [{
          type: "text",
          text: JSON.stringify({
            selectedCargo: {
              codigo: "301",
              nome: "Engenheiro de Software",
              especialidade: null,
              localidade: null,
              uf: null
            },
            requisitos: null,
            remuneracao: null,
            prova: null,
            materias: [
              {
                nome: "Português",
                topicos: [],
                peso: null,
                numeroQuestoes: null,
                evidencia: evidence(
                  superiorSubjectDocument,
                  4,
                  "Português — aplicável a todos os cargos de nível superior"
                )
              },
              {
                nome: "Direito Administrativo",
                topicos: [],
                peso: null,
                numeroQuestoes: null,
                evidencia: evidence(
                  superiorSubjectDocument,
                  4,
                  "Cargo 202 - Analista Jurídico: Direito Administrativo"
                )
              }
            ],
            resumoCargo: null,
            conflitos: []
          })
        }]
      }]
    });
  };

  try {
    const documents = [superiorCargoDocument, superiorSubjectDocument];
    const response = await worker.fetch(new Request(
      "https://worker.test/api/edital/analyze-cargo",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents,
          packageHash: await combinedPackageHash(documents.map(item => item.hash)),
          selectedCargo: {
            codigo: "301",
            nome: "Engenheiro de Software",
            especialidade: null,
            localidade: null,
            uf: null,
            escolaridade: "Superior",
            escolaridadeEvidencia: evidence(
              superiorCargoDocument,
              11,
              "Cargo 301 - Engenheiro de Software. Escolaridade: Superior"
            )
          },
          regrasGerais: []
        })
      }
    ), { GEMINI_API_KEY: "test", EDITAL_PIPELINE_TRUSTED: true });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(data.result.materias.map(item => item.nome), ["Português"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
