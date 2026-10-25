import test from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../src/app.js";
import { getConfig } from "../src/config.js";

class FakeStore {
  constructor() {
    this.records = new Map();
  }

  async get(uid) {
    return {
      messages: this.records.get(uid) ?? [],
      persistent: true,
      backend: "test",
      warning: null,
    };
  }

  async set(uid, messages) {
    this.records.set(uid, messages);
    return {
      messages,
      persistent: true,
      backend: "test",
      warning: null,
    };
  }

  async clear(uid) {
    this.records.delete(uid);
    return { persistent: true, backend: "test", warning: null };
  }
}

class FakeInception {
  constructor() {
    this.chatCalls = [];
    this.visionCalls = [];
  }

  async chat(input) {
    this.chatCalls.push(input);
    return {
      answer: `Réponse ${this.chatCalls.length}`,
      usage: { total_tokens: 10 },
      finishReason: "stop",
    };
  }

  async analyzeImage(input) {
    this.visionCalls.push(input);
    return {
      profile: "Observations structurées : un paysage.",
      observations: { primary_subject: { value: "landscape" } },
      usage: { input_tokens: 12, output_tokens: 1 },
    };
  }
}

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(value = "") {
      this.body += value;
    },
  };
}

async function invoke(handler, path, options = {}) {
  const req = {
    method: options.method ?? "GET",
    url: path,
    headers: {
      host: "localhost",
      ...(options.headers ?? {}),
    },
    ...(options.body ? { body: options.body } : {}),
  };
  const res = mockResponse();
  await handler(req, res);
  return { status: res.statusCode, headers: res.headers, json: JSON.parse(res.body) };
}

function baseConfig(extra = {}) {
  return {
    ...getConfig({ INCEPTION_API_KEY: "test-key" }),
    ...extra,
  };
}

test("GET /api sans paramètres décrit l'API", async () => {
  const handler = createHandler({ config: baseConfig() });
  const response = await invoke(handler, "/api");
  assert.equal(response.status, 200);
  assert.deepEqual(response.json.models, ["mercury-2", "mercury-2.5", "mercury-3"]);
});

test("une conversation continue avec le même uid", async () => {
  const store = new FakeStore();
  const inception = new FakeInception();
  const handler = createHandler({ config: baseConfig(), store, inception });

  const first = await invoke(
    handler,
    "/api?mercy=Bonjour&uid=123&model=mercury-2.5",
  );
  const second = await invoke(
    handler,
    "/api?mercy=Continue&uid=123&model=mercury-3",
  );

  assert.equal(first.status, 200);
  assert.equal(first.json.model, "mercury-2.5");
  assert.equal(first.json.tokens.request.total, 10);
  assert.equal(first.json.tokens.free_tier_projection.similar_requests, 10000000);
  assert.equal(second.json.answer, "Réponse 2");
  assert.equal(inception.chatCalls[1].messages.length, 3);
  assert.equal(inception.chatCalls[1].messages[1].role, "assistant");
});

test("la route image combine Mercury Decide et le modèle choisi", async () => {
  const inception = new FakeInception();
  const handler = createHandler({
    config: baseConfig(),
    store: new FakeStore(),
    inception,
    imageLoader: async () => ({
      dataUrl: "data:image/png;base64,AA==",
      contentType: "image/png",
      size: 1,
      finalUrl: "https://images.example.com/test.png",
    }),
  });

  const response = await invoke(
    handler,
    "/api?mercy=Décris&uid=img-1&model=mercury-2&image=https%3A%2F%2Fimages.example.com%2Ftest.png",
  );

  assert.equal(response.status, 200);
  assert.equal(response.json.model, "mercury-2");
  assert.equal(response.json.image.model, "mercury-decide");
  assert.equal(response.json.tokens.vision.total, 13);
  assert.equal(response.json.tokens.request.total, 23);
  assert.equal(inception.visionCalls.length, 1);
  assert.match(inception.chatCalls[0].messages[0].content, /paysage/);
  assert.doesNotMatch(inception.chatCalls[0].messages[0].content, /base64/);
});

test("MERCY_API_TOKEN protège la route", async () => {
  const handler = createHandler({
    config: baseConfig({ publicApiToken: "secret" }),
    store: new FakeStore(),
    inception: new FakeInception(),
  });

  const denied = await invoke(handler, "/api?mercy=Bonjour&uid=123");
  const allowed = await invoke(handler, "/api?mercy=Bonjour&uid=123", {
    headers: { authorization: "Bearer secret" },
  });

  assert.equal(denied.status, 401);
  assert.equal(allowed.status, 200);
});

test("un modèle inconnu est refusé", async () => {
  const handler = createHandler({
    config: baseConfig(),
    store: new FakeStore(),
    inception: new FakeInception(),
  });
  const response = await invoke(
    handler,
    "/api?mercy=Bonjour&uid=123&model=claude-opus-5-5",
  );
  assert.equal(response.status, 400);
  assert.equal(response.json.error.code, "invalid_model");
});
