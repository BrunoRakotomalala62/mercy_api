import test from "node:test";
import assert from "node:assert/strict";
import {
  CHAT_MODELS,
  normalizeModel,
  normalizeReasoningEffort,
} from "../src/models.js";

test("les trois modèles de chat sont exposés", () => {
  assert.deepEqual(CHAT_MODELS, ["mercury-2", "mercury-2.5", "mercury-3"]);
});

test("les alias de modèles sont normalisés", () => {
  assert.equal(normalizeModel("2"), "mercury-2");
  assert.equal(normalizeModel("2.5"), "mercury-2.5");
  assert.equal(normalizeModel("MERCURY-3"), "mercury-3");
  assert.equal(normalizeModel("claude-opus-5-5"), null);
});

test("l'effort de raisonnement est validé", () => {
  assert.equal(normalizeReasoningEffort("HIGH"), "high");
  assert.equal(normalizeReasoningEffort("invalide"), null);
});
