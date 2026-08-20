import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const workerRoot = new URL("../", import.meta.url);
const projectRoot = new URL("../../", import.meta.url);
const readProject = relative => readFile(new URL(relative, projectRoot), "utf8");

test("canonical migrations have unique versions and the reconciled planner identity", async () => {
  const migrationDir = new URL("supabase/migrations/", projectRoot);
  const names = (await readdir(migrationDir)).filter(name => name.endsWith(".sql")).sort();
  assert.deepEqual(names, [
    "202608150001_initial_infrastructure.sql",
    "202608150002_planner_subjects.sql",
    "202608160003_edital_pipeline.sql",
    "202608200004_baseline_reconciliation.sql"
  ]);
  assert.equal(new Set(names.map(name => name.match(/^\d+/)?.[0])).size, names.length);

  const reconciliation = await readProject("supabase/migrations/202608200004_baseline_reconciliation.sql");
  assert.match(reconciliation, /unique\s*\(user_id, edital_ref, cargo_key, subject_key\)/i);
  assert.match(reconciliation, /for delete[\s\S]*auth\.uid\(\) = user_id/i);
});

test("frontend and Worker share approved model defaults and planner routes", async () => {
  const [frontend, frontendConfig, worker, pipeline, modelConfigSource, wrangler] = await Promise.all([
    readProject("app.js"),
    readProject("app-config.js"),
    readFile(new URL("src/index.js", workerRoot), "utf8"),
    readFile(new URL("src/edital-pipeline.js", workerRoot), "utf8"),
    readFile(new URL("src/model-config.js", workerRoot), "utf8"),
    readFile(new URL("wrangler.jsonc", workerRoot), "utf8")
  ]);

  assert.match(frontendConfig, /gemini-3\.6-flash/);
  assert.match(modelConfigSource, /gemini-3\.6-flash/);
  assert.match(modelConfigSource, /llama-3\.3-70b-versatile/);
  assert.match(wrangler, /llama-3\.3-70b-versatile/);
  assert.match(frontend, /CONCURSO_HUB_CONFIG\?\.models\?\.geminiEdital/);
  assert.match(worker, /modelConfig\(env\)/);
  assert.match(pipeline, /modelConfig\(env\)\.geminiEdital/);
  assert.match(worker, /GET" && url\.pathname === "\/api\/planner\/subjects/);
  assert.match(worker, /POST" && url\.pathname === "\/api\/planner\/subjects/);
  assert.match(worker, /request\.method === "DELETE" && plannerSubjectDelete/);
  assert.equal(worker.includes("planner_items"), false);
  assert.equal(pipeline.includes("planner_items"), false);
});

test("baseline contains no known mojibake or confirmed LucronomIA asset", async () => {
  const sources = await Promise.all([
    readProject("app.js"),
    readProject("edital-analyzer.js"),
    readFile(new URL("src/index.js", workerRoot), "utf8"),
    readFile(new URL("src/edital-pipeline.js", workerRoot), "utf8")
  ]);
  const knownMojibake = /(?:Ã[\x80-\xBF]|Â[\x80-\xBF]|â(?:€|œ|™|€“|€”))/;
  for (const source of sources) assert.equal(knownMojibake.test(source), false);

  await assert.rejects(
    access(new URL("assets/logo-lucronomia.png", projectRoot)),
    error => error?.code === "ENOENT"
  );
  assert.equal((await readProject("index.html")).includes("logo-lucronomia"), false);
});

test("questions integration remains behind the license gate", async () => {
  const wrangler = await readFile(new URL("wrangler.jsonc", workerRoot), "utf8");
  const exampleEnv = await readFile(new URL(".dev.vars.example", workerRoot), "utf8");
  assert.match(wrangler, /"QUESTIONS_TERMS_ACCEPTED": "false"/);
  assert.match(exampleEnv, /QUESTIONS_TERMS_ACCEPTED="false"/);
});
