import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const projectFile = name => new URL(`../../${name}`, import.meta.url);

async function loadEditalUx() {
  const source = await readFile(projectFile("edital-ux.js"), "utf8");
  const context = vm.createContext({ window: {} });
  vm.runInContext(source, context);
  return context.window.EditalUx;
}

test("UX-001 derives levels only from literal edital evidence", async () => {
  const ux = await loadEditalUx();
  const cargos = [
    { codigo: "1", nome: "Analista", evidencia: { trecho: "Analista | Superior | 2 vagas" } },
    { codigo: "2", nome: "Técnico", evidencia: { trecho: "Técnico | Médio | 4 vagas" } },
    { codigo: "3", nome: "Especialista", evidencia: { trecho: "Especialista | Superior | 1 vaga" } },
    { codigo: "4", nome: "Operador", evidencia: { trecho: "Operador | Técnico | cadastro reserva" } }
  ];

  const result = ux.groupCatalogByEvidenceLevel(cargos);
  assert.deepEqual(
    Array.from(result.groups, group => [group.level, group.cargos.length]),
    [["Superior", 2], ["Médio", 1], ["Técnico", 1]]
  );
  assert.equal(result.unresolved.length, 0);
});
test("UX-001 displays one level when the edital proves only one level", async () => {
  const ux = await loadEditalUx();
  const result = ux.groupCatalogByEvidenceLevel([
    { nome: "Cargo A", evidencia: { trecho: "Cargo A | Ensino Médio | 10 vagas" } },
    { nome: "Cargo B", evidencia: { trecho: "Cargo B | Ensino Médio | 5 vagas" } }
  ]);

  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].level, "Ensino Médio");
  assert.equal(result.groups[0].cargos.length, 2);
});

test("UX-001 never invents a level when evidence is absent or contradictory", async () => {
  const ux = await loadEditalUx();
  const result = ux.groupCatalogByEvidenceLevel([
    { nome: "Sem nível", nivel: "Superior", evidencia: { trecho: "Sem nível | 3 vagas" } },
    { nome: "Sem evidência", escolaridade: "Médio" }
  ]);

  assert.equal(result.groups.length, 0);
  assert.equal(result.unresolved.length, 2);
});

test("UX-001 frontend exposes the four visual stages and a state-preserving Back action", async () => {
  const [app, html] = await Promise.all([
    readFile(projectFile("app.js"), "utf8"),
    readFile(projectFile("index.html"), "utf8")
  ]);

  assert.match(html, /id="cargoFlowBackBtn"/);
  assert.match(html, /id="cargoSummaryContent"[^>]*hidden/);
  assert.equal((html.match(/<script src="edital-ux\.js"><\/script>/g) || []).length, 1);
  assert.match(app, /function renderLevelChoices\b/);
  assert.match(app, /function renderCargoChoicesForLevel\b/);
  assert.match(app, /function renderCargoSummaryStage\b/);
  assert.match(app, /function navigateCargoFlowBack\b/);
  assert.match(app, /analyzedCargoContexts\.get\(cargoKey\)/);
  assert.match(app, /Cargo restaurado nesta sessão sem repetir a análise de IA/);

  const backFunction = app.match(/function navigateCargoFlowBack\(\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(backFunction);
  assert.doesNotMatch(backFunction[1], /authenticatedApiRequest|fetch|analyze-cargo|catalog-cargos/);
});
