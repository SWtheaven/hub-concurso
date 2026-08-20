import assert from "node:assert/strict";
import test from "node:test";

import worker, {
  normalizeEditalFacts,
  normalizeEditalSummaries,
  normalizeNotice,
  normalizeQuestion,
  plannerSubjectInput,
  stripHtml
} from "../src/index.js";

test("health does not reveal secrets and reports the license gate", async () => {
  const response = await worker.fetch(
    new Request("https://hub.test/api/health"),
    { QUESTIONS_API_KEY: "secret-value", QUESTIONS_TERMS_ACCEPTED: "false", GROQ_API_KEY: "groq-secret" }
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.integrations.questions.status, "license-review-required");
  assert.equal(body.integrations.groq.ready, true);
  assert.equal(body.integrations.editalAi.ready, true);
  assert.equal(JSON.stringify(body).includes("secret-value"), false);
  assert.equal(JSON.stringify(body).includes("groq-secret"), false);
});

test("accepts the Supabase publishable key and makes allowed origins optional", async () => {
  const response = await worker.fetch(
    new Request("https://hub.test/api/health", {
      headers: { "Origin": "http://127.0.0.1:4173" }
    }),
    {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      SUPABASE_SECRET_KEY: "backend-test-only"
    }
  );
  const body = await response.json();
  assert.equal(body.integrations.supabase.ready, true);
  assert.equal(body.integrations.editalPersistence.ready, true);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "http://127.0.0.1:4173");
  assert.equal(JSON.stringify(body).includes("sb_publishable_test"), false);
});

test("integration diagnostics require an authenticated request", async () => {
  const response = await worker.fetch(
    new Request("https://hub.test/api/diagnostics/integrations"),
    {}
  );
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.code, "authentication_required");
});

test("integration diagnostics report only configuration booleans with the development token", async () => {
  const env = {
    CONCURSO_HUB_INTERNAL_TOKEN: "development-token-secret",
    GROQ_API_KEY: "groq-secret-value",
    GEMINI_API_KEY: "gemini-secret-value",
    YOUTUBE_API_KEY: "youtube-secret-value",
    RESEND_API_KEY: "resend-secret-value",
    SUPABASE_URL: "https://private-project.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "publishable-secret-value",
    SUPABASE_SECRET_KEY: "backend-secret-value"
  };
  const response = await worker.fetch(
    new Request("https://hub.test/api/diagnostics/integrations", {
      headers: { "X-Concurso-Hub-Token": env.CONCURSO_HUB_INTERNAL_TOKEN }
    }),
    env
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.authenticatedBy, "internal_development_token");
  assert.deepEqual(body.configured, {
    GROQ_API_KEY: true,
    GEMINI_API_KEY: true,
    YOUTUBE_API_KEY: true,
    RESEND_API_KEY: true,
    SUPABASE_URL: true,
    SUPABASE_PUBLISHABLE_KEY: true,
    SUPABASE_SECRET_KEY: true
  });
  assert.equal(body.operational.requested, false);
  assert.equal(body.operational.groq.status, "not_checked");

  const serialized = JSON.stringify(body);
  for (const value of Object.values(env)) assert.equal(serialized.includes(value), false);
});

test("integration diagnostics accept a valid Supabase session", async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://project.supabase.co/auth/v1/user");
    assert.equal(init.headers.apikey, "sb_publishable_test");
    assert.equal(init.headers.Authorization, "Bearer user-session-token");
    return Response.json({ id: "00000000-0000-4000-8000-000000000001" });
  };

  const response = await worker.fetch(
    new Request("https://hub.test/api/diagnostics/integrations", {
      headers: { "Authorization": "Bearer user-session-token" }
    }),
    {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test"
    }
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.authenticatedBy, "supabase_session");
  assert.equal(body.configured.SUPABASE_URL, true);
  assert.equal(body.configured.SUPABASE_SECRET_KEY, false);
});

test("optional integration pings use cheap read-only provider endpoints", async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("api.groq.com")) {
      assert.equal(init.headers.Authorization, "Bearer groq-secret");
    } else if (url.includes("generativelanguage.googleapis.com")) {
      assert.equal(init.headers["x-goog-api-key"], "gemini-secret");
      assert.match(url, /pageSize=1/);
    } else if (url.includes("supabase.co")) {
      assert.equal(init.headers.apikey, "supabase-secret");
      assert.match(url, /planner_subjects\?select=id&limit=1$/);
    } else {
      assert.fail(`Unexpected ping URL: ${url}`);
    }
    return new Response(null, { status: 200 });
  };

  const env = {
    CONCURSO_HUB_INTERNAL_TOKEN: "test-token",
    GROQ_API_KEY: "groq-secret",
    GEMINI_API_KEY: "gemini-secret",
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SECRET_KEY: "supabase-secret"
  };
  const response = await worker.fetch(
    new Request("https://hub.test/api/diagnostics/integrations?ping=true", {
      headers: { "X-Concurso-Hub-Token": "test-token" }
    }),
    env
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.operational.requested, true);
  assert.equal(body.operational.groq.operational, true);
  assert.equal(body.operational.gemini.operational, true);
  assert.equal(body.operational.supabase.operational, true);
  assert.equal(calls.length, 3);
  assert.equal(JSON.stringify(body).includes("groq-secret"), false);
});

test("removed legacy AI test routes remain absent", async () => {
  for (const path of ["/api/ai/test", "/api/ai/gemini-test"]) {
    const response = await worker.fetch(new Request(`https://hub.test${path}`), {});
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.error.code, "not_found");
  }
});

test("uses the publishable key as apikey when creating an anonymous session", async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (input, init) => {
    assert.match(String(input), /\/auth\/v1\/signup$/);
    assert.equal(init.headers.apikey, "sb_publishable_test");
    assert.equal("Authorization" in init.headers, false);
    return Response.json({
      access_token: "user-access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      user: { id: "00000000-0000-4000-8000-000000000001" }
    });
  };

  const response = await worker.fetch(
    new Request("https://hub.test/api/auth/anonymous", { method: "POST" }),
    {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test"
    }
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.accessToken, "user-access-token");
});

test("question routes stay blocked until terms are accepted", async () => {
  const response = await worker.fetch(
    new Request("https://hub.test/api/questions/catalog"),
    { QUESTIONS_API_KEY: "configured", QUESTIONS_TERMS_ACCEPTED: "false" }
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error.code, "questions_license_review_required");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("normalizes multiple-choice questions without provider HTML", () => {
  const question = normalizeQuestion({
    id: 42,
    enunciado: "<p>Qual é a alternativa <strong>correta</strong>?</p>",
    resposta: "b",
    options: [{ key: "a", text: "<b>Primeira</b>" }, { key: "b", text: "Segunda" }],
    materia: { label: "Português" },
    topico: { label: "Interpretação" },
    banca: { label: "FGV" },
    ano: 2025
  });
  assert.equal(question.prompt, "Qual é a alternativa correta?");
  assert.deepEqual(question.options, ["Primeira", "Segunda"]);
  assert.equal(question.correctIndex, 1);
  assert.equal(question.bank, "FGV");
});

test("normalizes Querido Diário results as discovery requiring verification", () => {
  const notice = normalizeNotice({
    territory_id: "3550308",
    territory_name: "São Paulo",
    state_code: "SP",
    date: "2026-08-15",
    edition: "123",
    excerpts: ["<em>RETIFICAÇÃO</em> do edital"],
    url: "https://example.test/diario.pdf",
    txt_url: null
  });
  assert.equal(notice.type, "Retificação");
  assert.equal(notice.verificationRequired, true);
  assert.equal(notice.excerpt, "RETIFICAÇÃO do edital");
});

test("strips unsafe markup from provider text", () => {
  assert.equal(stripHtml("<script>alert(1)</script><p>A &amp; B</p>"), "A & B");
});

test("question gateway normalizes, filters the bank and disables caching", async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    assert.equal(init.headers["x-api-key"], "provider-secret");
    assert.match(url, /materiaId=5/);
    return new Response(JSON.stringify({
      content: [
        { id: 1, enunciado: "Item FGV", resposta: "certo", certoOuErrado: true, banca: { label: "FGV" } },
        { id: 2, enunciado: "Item Cebraspe", resposta: "errado", certoOuErrado: true, banca: { label: "CEBRASPE" } }
      ],
      last: true
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const response = await worker.fetch(
    new Request("https://hub.test/api/questions?subjectId=5&bank=FGV&size=20"),
    { QUESTIONS_API_KEY: "provider-secret", QUESTIONS_TERMS_ACCEPTED: "true" }
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Provider-Cache"), "disabled");
  const body = await response.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].bank, "FGV");
  assert.deepEqual(body.items[0].options, ["Certo", "Errado"]);
  assert.equal(body.items[0].correctIndex, 0);
});

test("edital facts keep nulls and reject values not supported by cited pages", () => {
  const pages = [{
    page: 1,
    text: "Inscrições de 1 a 10 de setembro de 2026. Taxa de R$ 80,00. Língua Portuguesa: interpretação de textos."
  }];
  const facts = normalizeEditalFacts({
    inscricoes: {
      inicio: "1 de setembro de 2026",
      fim: "10 de setembro de 2026",
      taxa: "R$ 90,00",
      isencao: "Não informado",
      condicoes: [],
      fontes: [{ pagina: 1, trecho: "Inscrições de 1 a 10 de setembro de 2026. Taxa de R$ 80,00." }]
    },
    materias: [{
      nome: "Língua Portuguesa",
      topicos: ["interpretação de textos", "gramática avançada"],
      fontes: [{ pagina: 1, trecho: "Língua Portuguesa: interpretação de textos." }]
    }]
  }, pages);
  assert.equal(facts.inscricoes.inicio, "1 de setembro de 2026");
  assert.equal(facts.inscricoes.taxa, null);
  assert.equal(facts.inscricoes.isencao, null);
  assert.deepEqual(facts.materias[0].topicos, ["interpretação de textos"]);
  assert.equal(normalizeEditalSummaries({ prova: "Não encontrado" }).prova, null);
  assert.equal(normalizeEditalSummaries({ prova: "A prova será em 2027." }, { prova: { data: "20/10/2026" } }).prova, null);
});

test("planner subjects use a stable normalized key", () => {
  const item = plannerSubjectInput({
    editalRef: "edital:123",
    editalName: "Edital TJ.pdf",
    cargo: "Técnico de Operações",
    subject: "Língua Portuguesa",
    topics: ["Interpretação", "Interpretação", ""]
  });
  assert.equal(item.subject_key, "lingua-portuguesa");
  assert.equal(item.cargo_key, "tecnico-de-operacoes");
  assert.deepEqual(item.topics, ["Interpretação"]);
});

test("planner LIST, ADD and DELETE preserve user, edital, cargo and subject", async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const userId = "00000000-0000-4000-8000-000000000001";
  const itemId = "00000000-0000-4000-8000-000000000002";
  const restCalls = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.pathname === "/auth/v1/user") {
      return Response.json({ id: userId });
    }

    restCalls.push({ url, init });

    if (init.method === "POST") {
      const payload = JSON.parse(init.body);
      return Response.json([{ id: itemId, ...payload }]);
    }

    if (init.method === "DELETE") return Response.json([{ id: itemId }]);
    return Response.json([{ id: itemId, user_id: userId }]);
  };

  const env = {
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test"
  };
  const headers = { Authorization: "Bearer session-token", "Content-Type": "application/json" };

  const list = await worker.fetch(new Request(
    "https://hub.test/api/planner/subjects?editalRef=edital%3A123&cargo=T%C3%A9cnico%20de%20Opera%C3%A7%C3%B5es",
    { headers }
  ), env);
  assert.equal(list.status, 200);

  const add = await worker.fetch(new Request("https://hub.test/api/planner/subjects", {
    method: "POST",
    headers,
    body: JSON.stringify({
      editalRef: "edital:123",
      editalName: "Edital TJ.pdf",
      cargo: "Técnico de Operações",
      subject: "Língua Portuguesa",
      topics: ["Interpretação"]
    })
  }), env);
  assert.equal(add.status, 200, JSON.stringify(await add.clone().json()));
  assert.equal((await add.json()).saved, true);

  const remove = await worker.fetch(new Request(
    `https://hub.test/api/planner/subjects/${itemId}`,
    { method: "DELETE", headers }
  ), env);
  assert.equal(remove.status, 200);
  assert.equal((await remove.json()).deleted, true);
  assert.equal(restCalls.length, 3);
  for (const { init } of restCalls) {
    assert.equal(init.headers.Authorization, "Bearer session-token");
    assert.equal(init.headers.apikey, "sb_publishable_test");
  }
  const postCall = restCalls.find(call => call.init.method === "POST");
  assert.deepEqual(JSON.parse(postCall.init.body), {
    user_id: userId,
    edital_ref: "edital:123",
    edital_name: "Edital TJ.pdf",
    concurso_name: null,
    cargo: "Técnico de Operações",
    cargo_key: "tecnico-de-operacoes",
    subject: "Língua Portuguesa",
    subject_key: "lingua-portuguesa",
    topics: ["Interpretação"]
  });
  assert.equal(
    postCall.url.searchParams.get("on_conflict"),
    "user_id,edital_ref,cargo_key,subject_key"
  );
});

test("edital analysis prefers Gemini extraction and Groq summarization", async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  globalThis.fetch = async input => {
    const url = String(input);
    calls.push(url);
    if (url.includes("generativelanguage.googleapis.com")) {
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify({
          inscricoes: {
            inicio: "1 de setembro de 2026",
            fim: "10 de setembro de 2026",
            taxa: "R$ 80,00",
            isencao: null,
            condicoes: [],
            fontes: [{ pagina: 1, trecho: "Inscrições de 1 a 10 de setembro de 2026. Taxa de R$ 80,00." }]
          }
        }) }] } }]
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      model: "groq-test",
      choices: [{ message: { content: JSON.stringify({
        inscricoes: "As inscrições vão de 1 a 10 de setembro de 2026, com taxa de R$ 80,00.",
        vagas: null,
        remuneracao: null,
        prova: null,
        requisitos: null,
        etapas: null,
        regras: null
      }) } }]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const response = await worker.fetch(
    new Request("https://hub.test/api/ai/editals/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages: [{ page: 1, text: "Inscrições de 1 a 10 de setembro de 2026. Taxa de R$ 80,00. Condições conforme o cronograma oficial do concurso." }] })
    }),
    { GEMINI_API_KEY: "gemini-secret", GROQ_API_KEY: "groq-secret" }
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.providers.extraction.name, "gemini");
  assert.equal(body.providers.summarization.name, "groq");
  assert.equal(body.facts.inscricoes.taxa, "R$ 80,00");
  assert.match(body.summaries.inscricoes, /1 a 10 de setembro/);
  assert.equal(calls.length, 2);
});
