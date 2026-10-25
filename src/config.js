import { normalizeModel, normalizeReasoningEffort } from "./models.js";

function integerFromEnv(value, fallback, min, max) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

function booleanFromEnv(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return !["0", "false", "no", "off"].includes(String(value).toLowerCase());
}

function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/, "");
}

export function getConfig(env = process.env) {
  const requestedDefault = normalizeModel(env.DEFAULT_MODEL ?? "mercury-3");
  const defaultEffort = normalizeReasoningEffort(
    env.DEFAULT_REASONING_EFFORT ?? "low",
    "low",
  );

  return {
    inceptionApiKey: env.INCEPTION_API_KEY?.trim() ?? "",
    inceptionBaseUrl: stripTrailingSlash(
      env.INCEPTION_API_BASE_URL || "https://api.inceptionlabs.ai/v1",
    ),
    defaultModel: requestedDefault ?? "mercury-3",
    defaultReasoningEffort: defaultEffort ?? "low",
    maxCompletionTokens: integerFromEnv(
      env.MAX_COMPLETION_TOKENS,
      1200,
      1,
      131072,
    ),
    upstreamTimeoutMs: integerFromEnv(
      env.UPSTREAM_TIMEOUT_MS,
      55000,
      1000,
      120000,
    ),
    maxPromptChars: integerFromEnv(env.MAX_PROMPT_CHARS, 12000, 1, 100000),
    maxHistoryMessages: integerFromEnv(
      env.MAX_HISTORY_MESSAGES,
      24,
      2,
      200,
    ),
    maxHistoryChars: integerFromEnv(
      env.MAX_HISTORY_CHARS,
      60000,
      1000,
      1000000,
    ),
    conversationTtlSeconds: integerFromEnv(
      env.CONVERSATION_TTL_SECONDS,
      604800,
      60,
      2592000,
    ),
    maxImageBytes: integerFromEnv(
      env.MAX_IMAGE_BYTES,
      7 * 1024 * 1024,
      1024,
      10 * 1024 * 1024,
    ),
    imageTimeoutMs: integerFromEnv(env.IMAGE_TIMEOUT_MS, 12000, 1000, 30000),
    imageHostAllowlist: (env.IMAGE_HOST_ALLOWLIST ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
    enableVision: booleanFromEnv(env.ENABLE_VISION, true),
    publicApiToken: env.MERCY_API_TOKEN?.trim() ?? "",
    allowedOrigins: (env.ALLOWED_ORIGINS ?? "*")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    redisUrl:
      env.UPSTASH_REDIS_REST_URL?.trim() || env.KV_REST_API_URL?.trim() || "",
    redisToken:
      env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
      env.KV_REST_API_TOKEN?.trim() ||
      "",
    systemPrompt:
      env.MERCY_SYSTEM_PROMPT?.trim() ||
      [
        "Tu es Mercy, un assistant utile, précis et multilingue.",
        "Réponds dans la langue de l'utilisateur, sauf demande contraire.",
        "Tiens compte de l'historique fourni sans inventer de faits.",
        "Pour une image, les observations reçues proviennent d'un classificateur visuel structuré : n'affirme jamais avoir vu directement l'image, n'invente aucun détail absent et signale clairement toute incertitude.",
      ].join(" "),
  };
}
