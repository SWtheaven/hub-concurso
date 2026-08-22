import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { sanitizeCatalogSchooling } from "../src/edital-schooling.js";

const projectFile = name => new URL(`../../${name}`, import.meta.url);

async function loadEditalUx() {
  const source = await readFile(projectFile("edital-ux.js"), "utf8");
  const context = vm.createContext({ window: {} });
  vm.runInContext(source, context);
  return context.window.EditalUx;
}

test("UX-001 derives levels only from literal edital evidence", async () => {
  const ux = await loadEditalUx();
  const fixture = JSON.parse(await readFile(new URL("./fixtures/nav-brasil-catalog.json", import.meta.url), "utf8"));
  const cargos = fixture.cargos.map(sanitizeCatalogSchooling);

  const result = ux.groupCatalogByEvidenceLevel(cargos);
  assert.deepEqual(
    Array.from(result.groups, group => [group.level, group.cargos.length]),
    [["Superior", 15], ["Técnico", 4], ["Médio", 1]]
  );
  assert.equal(result.unresolved.length, 0);
});
test("UX-001 displays one level when the edital proves only one level", async () => {
  const ux = await loadEditalUx();
  const result = ux.groupCatalogByEvidenceLevel([
    { nome: "Cargo A", escolaridade: "Médio", escolaridadeEvidencia: { trecho: "Cargo A | Nível de escolaridade: Médio" } },
    { nome: "Cargo B", escolaridade: "Médio", escolaridadeEvidencia: { trecho: "Cargo B | Nível de escolaridade: Médio" } }
  ]);

  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].level, "Médio");
  assert.equal(result.groups[0].cargos.length, 2);
});

test("UX-001 never invents a level when evidence is absent or contradictory", async () => {
  const ux = await loadEditalUx();
  const cargos = [
    {
      nome: "Profissional Técnico de Navegação Aérea",
      escolaridade: "Médio",
      escolaridadeEvidencia: { trecho: "Profissional Técnico de Navegação Aérea | Nível de escolaridade: Médio" }
    },
    { nome: "Técnico sem prova", escolaridade: "Técnico", escolaridadeEvidencia: { trecho: "Técnico sem prova | 3 vagas" } },
    { nome: "Sem evidência", escolaridade: "Superior" }
  ];
  const sanitized = cargos.map(sanitizeCatalogSchooling);
  const result = ux.groupCatalogByEvidenceLevel(sanitized);

  assert.deepEqual(
    Array.from(result.groups, group => [group.level, group.cargos.length]),
    [["Médio", 1]]
  );
  assert.equal(result.unresolved.length, 2);
  assert.equal(sanitized[1].escolaridade, null);
  assert.equal(sanitized[2].escolaridade, null);
});

test("UX-001 frontend exposes the four visual stages and a state-preserving Back action", async () => {
  const [app, html, pipeline] = await Promise.all([
    readFile(projectFile("app.js"), "utf8"),
    readFile(projectFile("index.html"), "utf8"),
    readFile(new URL("../src/edital-pipeline.js", import.meta.url), "utf8")
  ]);

  assert.match(html, /id="cargoFlowBackBtn"/);
  assert.match(html, /id="cargoSummaryContent"[^>]*hidden/);
  assert.match(html, /id="summaryReadyState"[^>]*hidden/);
  assert.match(html, /id="aiReviewBtn"[^>]*hidden/);
  assert.match(html, /id="copySummaryBtn"[^>]*hidden/);
  assert.match(html, /id="summaryNotice"[^>]*hidden/);
  assert.equal((html.match(/<script src="edital-ux\.js"><\/script>/g) || []).length, 1);
  assert.match(app, /function renderLevelChoices\b/);
  assert.match(app, /function renderCargoChoicesForLevel\b/);
  assert.match(app, /function renderCargoSummaryStage\b/);
  assert.match(app, /function navigateCargoFlowBack\b/);
  assert.match(app, /analyzedCargoContexts\.get\(cargoKey\)/);
  assert.match(app, /Cargo restaurado nesta sessão sem repetir a análise de IA/);
  assert.match(app, /#summaryReadyState/);
  assert.match(pipeline, /escolaridadeEvidencia/);
  assert.match(pipeline, /Nunca deduza escolaridade pelo nome do cargo/);
  assert.match(pipeline, /map\(sanitizeCatalogSchooling\)/);

  const backFunction = app.match(/function navigateCargoFlowBack\(\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(backFunction);
  assert.doesNotMatch(backFunction[1], /authenticatedApiRequest|fetch|analyze-cargo|catalog-cargos/);
});
