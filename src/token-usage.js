function finiteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeChatUsage(usage) {
  const input = finiteNumber(usage?.prompt_tokens ?? usage?.input_tokens);
  const output = finiteNumber(usage?.completion_tokens ?? usage?.output_tokens);
  const total = finiteNumber(usage?.total_tokens) || input + output;
  const cachedInput = finiteNumber(
    usage?.prompt_tokens_details?.cached_tokens ??
      usage?.input_tokens_details?.cached_tokens,
  );
  const reasoning = finiteNumber(
    usage?.completion_tokens_details?.reasoning_tokens ??
      usage?.output_tokens_details?.reasoning_tokens,
  );

  return {
    input,
    cached_input: cachedInput,
    output,
    reasoning,
    total,
  };
}

function normalizeVisionUsage(usage) {
  if (!usage) return null;
  const input = finiteNumber(usage.input_tokens ?? usage.prompt_tokens);
  const output = finiteNumber(usage.output_tokens ?? usage.completion_tokens);
  const total = finiteNumber(usage.total_tokens) || input + output;
  return { input, output, total };
}

export function buildTokenReport(
  chatUsage,
  visionUsage = null,
  referenceTokens = 100_000_000,
) {
  const chat = normalizeChatUsage(chatUsage);
  const vision = normalizeVisionUsage(visionUsage);
  const request = {
    input: chat.input + (vision?.input ?? 0),
    output: chat.output + (vision?.output ?? 0),
    total: chat.total + (vision?.total ?? 0),
  };

  return {
    chat,
    vision,
    request,
    free_tier_projection: {
      reference_tokens: referenceTokens,
      similar_requests:
        request.total > 0 ? Math.floor(referenceTokens / request.total) : null,
      basis:
        "Projection théorique à consommation identique; ce n'est pas le solde réel du compte.",
    },
    note: "Les tokens de raisonnement sont déjà inclus dans les tokens de sortie et ne sont pas ajoutés une seconde fois.",
  };
}
