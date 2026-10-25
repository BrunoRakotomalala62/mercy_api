import test from "node:test";
import assert from "node:assert/strict";
import { buildTokenReport } from "../src/token-usage.js";

test("le rapport additionne le chat et l'analyse d'image sans doubler le raisonnement", () => {
  const report = buildTokenReport(
    {
      prompt_tokens: 463,
      completion_tokens: 704,
      total_tokens: 1167,
      prompt_tokens_details: { cached_tokens: 20 },
      completion_tokens_details: { reasoning_tokens: 346 },
    },
    { input_tokens: 3982, output_tokens: 13 },
  );

  assert.deepEqual(report.chat, {
    input: 463,
    cached_input: 20,
    output: 704,
    reasoning: 346,
    total: 1167,
  });
  assert.deepEqual(report.vision, { input: 3982, output: 13, total: 3995 });
  assert.deepEqual(report.request, { input: 4445, output: 717, total: 5162 });
  assert.equal(report.free_tier_projection.similar_requests, 19372);
});

test("le rapport fonctionne sans image", () => {
  const report = buildTokenReport({
    prompt_tokens: 200,
    completion_tokens: 300,
    total_tokens: 500,
  });
  assert.equal(report.vision, null);
  assert.equal(report.request.total, 500);
  assert.equal(report.free_tier_projection.similar_requests, 200000);
});
