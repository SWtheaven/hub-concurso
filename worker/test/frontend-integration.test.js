import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const projectFile = name => new URL(`../../${name}`, import.meta.url);

test("frontend includes Etapa 7E once and does not depend on pasted helper snippets", async () => {
  const [app, html, config, bank] = await Promise.all([
    readFile(projectFile("app.js"), "utf8"),
    readFile(projectFile("index.html"), "utf8"),
    readFile(projectFile("app-config.js"), "utf8"),
    readFile(projectFile("question-bank.js"), "utf8")
  ]);

  assert.equal((app.match(/const SUPABASE_SESSION_KEY\b/g) || []).length, 1);
  assert.equal((app.match(/INTERNAL_TOKEN_SESSION_KEY/g) || []).length, 0);
  assert.equal((html.match(/<script\s+src="app\.js"><\/script>/g) || []).length, 1);
  assert.doesNotMatch(html, /concurso-hub-etapa-7e-client\.js/);
  assert.match(html, /id="editalSourceUrl"/);

  for (const functionName of [
    "prepareEditalCatalog",
    "selectPipelineCargo",
    "applyPersistedEditalContext",
    "renderEditalUpdateAlert",
    "bootstrapPersistedHub"
  ]) assert.match(app, new RegExp(`function ${functionName}\\b`));

  assert.match(app, /refreshGatewayStatus\(\)[\s\S]*?\.then\(bootstrapPersistedHub\)/);
  assert.match(config, /muddy-voice-c9c5\.gspereira-dev\.workers\.dev/);
  assert.match(bank, /id: "fundacao_cesgranrio"/);
  assert.match(html, /Fundação CESGRANRIO/);
});
