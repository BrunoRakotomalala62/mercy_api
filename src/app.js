import { getConfig } from "./config.js";
import { asHttpError, HttpError } from "./errors.js";
import {
  applyCors,
  readJsonBody,
  requestId,
  requestUrl,
  sendJson,
  setCommonHeaders,
} from "./http.js";
import { downloadImageAsDataUrl } from "./image.js";
import { InceptionClient } from "./inception.js";
import {
  CHAT_MODELS,
  normalizeModel,
  normalizeReasoningEffort,
  REASONING_EFFORTS,
} from "./models.js";
import { requireApiToken, validateUid } from "./security.js";
import { ConversationStore } from "./store.js";
import { buildTokenReport } from "./token-usage.js";

let sharedStore;

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function valueFrom(input, ...names) {
  for (const name of names) {
    const value = firstValue(input[name]);
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function truthy(value) {
  return ["1", "true", "yes", "oui", "on"].includes(String(value).toLowerCase());
}

function publicMetadata(config) {
  return {
    ok: true,
    name: "Mercy API",
    version: "1.0.0",
    endpoint: "/api",
    methods: ["GET", "POST"],
    models: CHAT_MODELS,
    default_model: config.defaultModel,
    reasoning_efforts: REASONING_EFFORTS,
    conversation: {
      parameter: "uid",
      persistent_when_redis_is_configured: true,
      ttl_seconds: config.conversationTtlSeconds,
    },
    image: {
      parameter: "image",
      enabled: config.enableVision,
      analysis_model: "mercury-decide",
      supported_formats: ["PNG", "JPEG", "WebP", "GIF"],
      remote_urls_must_use_https: true,
    },
    token_reporting: {
      response_field: "tokens",
      free_tier_reference: config.freeTokenReference,
      projection_is_not_account_balance: true,
    },
    examples: {
      text: "/api?mercy=Bonjour&uid=123&model=mercury-3",
      image:
        "/api?mercy=Décrivez%20cette%20photo&image=https%3A%2F%2Fexample.com%2Fphoto.jpg&uid=123&model=mercury-3",
      reset: "/api?uid=123&reset=1",
    },
  };
}

async function parseInput(req) {
  const url = requestUrl(req);
  const query = Object.fromEntries(url.searchParams.entries());
  if (req.method === "GET") return query;
  if (req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      return { ...query, ...body };
    } catch (error) {
      if (error.code === "REQUEST_TOO_LARGE") {
        throw new HttpError(413, "request_too_large", "Le corps de la requête est trop volumineux.");
      }
      throw new HttpError(400, "invalid_json", "Le corps JSON est invalide.");
    }
  }
  return query;
}

export function createHandler(dependencies = {}) {
  return async function handler(req, res) {
    const id = requestId(req);
    const config = dependencies.config ?? getConfig();
    setCommonHeaders(res, id);
    applyCors(req, res, config.allowedOrigins);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      if (!["GET", "POST"].includes(req.method)) {
        res.setHeader("Allow", "GET, POST, OPTIONS");
        throw new HttpError(405, "method_not_allowed", "Utilisez GET ou POST.");
      }

      requireApiToken(req, config.publicApiToken);
      const input = await parseInput(req);
      const prompt = valueFrom(input, "mercy", "message").trim();
      const rawUid = valueFrom(input, "uid").trim();
      const shouldReset = truthy(valueFrom(input, "reset"));

      if (!prompt && !rawUid && !shouldReset) {
        sendJson(res, 200, { ...publicMetadata(config), request_id: id });
        return;
      }

      const uid = validateUid(rawUid);
      const store =
        dependencies.store ??
        (sharedStore ??= new ConversationStore(config, {
          fetch: dependencies.fetch,
        }));

      if (shouldReset) {
        const cleared = await store.clear(uid);
        if (!prompt) {
          sendJson(res, 200, {
            ok: true,
            request_id: id,
            uid,
            reset: true,
            conversation: cleared,
          });
          return;
        }
      }

      if (!prompt) {
        throw new HttpError(
          400,
          "missing_mercy",
          "Le paramètre mercy (ou message en POST) est obligatoire.",
        );
      }
      if (prompt.length > config.maxPromptChars) {
        throw new HttpError(
          413,
          "prompt_too_large",
          `Le message dépasse ${config.maxPromptChars} caractères.`,
        );
      }

      const requestedModel = valueFrom(input, "model", "modele", "modèle");
      const model = requestedModel
        ? normalizeModel(requestedModel)
        : config.defaultModel;
      if (!model) {
        throw new HttpError(
          400,
          "invalid_model",
          `Modèle invalide. Valeurs acceptées : ${CHAT_MODELS.join(", ")}.`,
        );
      }

      const requestedEffort = valueFrom(input, "effort", "reasoning_effort");
      const effort = normalizeReasoningEffort(
        requestedEffort,
        config.defaultReasoningEffort,
      );
      if (!effort) {
        throw new HttpError(
          400,
          "invalid_reasoning_effort",
          `Effort invalide. Valeurs acceptées : ${REASONING_EFFORTS.join(", ")}.`,
        );
      }

      const imageUrl = valueFrom(input, "image").trim();
      const historyState = shouldReset
        ? { messages: [], persistent: false, backend: "memory", warning: null }
        : await store.get(uid);
      const inception =
        dependencies.inception ??
        new InceptionClient(config, { fetch: dependencies.fetch });

      let modelPrompt = prompt;
      let vision = null;
      if (imageUrl) {
        if (!config.enableVision) {
          throw new HttpError(503, "vision_disabled", "L'analyse d'image est désactivée.");
        }
        const imageLoader = dependencies.imageLoader ?? downloadImageAsDataUrl;
        const image = await imageLoader(imageUrl, config);
        const analysis = await inception.analyzeImage({
          dataUrl: image.dataUrl,
          prompt,
        });
        modelPrompt = `${prompt}\n\n${analysis.profile}`;
        vision = {
          analyzed: true,
          model: "mercury-decide",
          source_url: image.finalUrl,
          content_type: image.contentType,
          bytes: image.size,
          observations: analysis.observations,
          usage: analysis.usage,
        };
      }

      const messages = [
        ...historyState.messages,
        { role: "user", content: modelPrompt },
      ];
      const completion = await inception.chat({ model, messages, effort });
      const saved = await store.set(uid, [
        ...messages,
        { role: "assistant", content: completion.answer },
      ]);

      const tokens = buildTokenReport(
        completion.usage,
        vision?.usage ?? null,
        config.freeTokenReference,
      );

      sendJson(res, 200, {
        ok: true,
        request_id: id,
        uid,
        model,
        reasoning_effort: effort,
        answer: completion.answer,
        usage: completion.usage,
        tokens,
        finish_reason: completion.finishReason,
        image: vision,
        conversation: {
          message_count: saved.messages.length,
          persistent: saved.persistent,
          backend: saved.backend,
          ttl_seconds: config.conversationTtlSeconds,
          warning: saved.warning,
        },
      });
    } catch (error) {
      const safe = asHttpError(error);
      if (safe.status >= 500) {
        console.error("Mercy API error", {
          requestId: id,
          code: safe.code,
          message: safe.message,
        });
      }
      sendJson(res, safe.status, {
        ok: false,
        request_id: id,
        error: {
          code: safe.code,
          message: safe.message,
          ...(safe.details ? { details: safe.details } : {}),
        },
      });
    }
  };
}
