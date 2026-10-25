export const CHAT_MODELS = Object.freeze([
  "mercury-2",
  "mercury-2.5",
  "mercury-3",
]);

const MODEL_ALIASES = new Map([
  ["2", "mercury-2"],
  ["mercury2", "mercury-2"],
  ["mercury-2", "mercury-2"],
  ["2.5", "mercury-2.5"],
  ["mercury2.5", "mercury-2.5"],
  ["mercury-2.5", "mercury-2.5"],
  ["3", "mercury-3"],
  ["mercury3", "mercury-3"],
  ["mercury-3", "mercury-3"],
]);

export const REASONING_EFFORTS = Object.freeze([
  "instant",
  "low",
  "medium",
  "high",
]);

export function normalizeModel(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  return MODEL_ALIASES.get(value.trim().toLowerCase()) ?? null;
}

export function normalizeReasoningEffort(value, fallback = "low") {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  const normalized = value.trim().toLowerCase();
  return REASONING_EFFORTS.includes(normalized) ? normalized : null;
}
