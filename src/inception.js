import { HttpError } from "./errors.js";

const VISION_QUESTIONS = Object.freeze({
  image_type: {
    type: "choice",
    criteria: {
      photograph: "A real-world photograph",
      illustration: "A drawing, painting, 3D render, or other illustration",
      screenshot: "A software, website, mobile app, or game screenshot",
      document: "A photographed or scanned document, poster, receipt, or page",
      chart_or_diagram: "A chart, graph, map, technical diagram, or infographic",
      logo_or_icon: "A logo, icon, symbol, or simple graphic",
      meme: "A meme or image dominated by captioned humor",
      other: "None of the other image types",
    },
  },
  primary_subject: {
    type: "choice",
    criteria: {
      one_person: "One person is the main subject",
      multiple_people: "Several people are the main subject",
      animal: "One or more animals are the main subject",
      food_or_drink: "Food or drink is the main subject",
      vehicle: "A vehicle is the main subject",
      building_or_room: "Architecture, a building, or an interior is the main subject",
      landscape_or_nature: "A landscape, natural scene, or weather is the main subject",
      plant_or_flower: "A plant, tree, or flower is the main subject",
      product_or_object: "A product or everyday physical object is the main subject",
      screen_or_interface: "A screen, application, or interface is the main subject",
      text_or_document: "Text, a sign, poster, or document is the main subject",
      artwork_or_symbol: "Artwork, a logo, or a symbol is the main subject",
      event_or_action: "An event or action is more important than one subject",
      other_or_unclear: "The main subject is different or unclear",
    },
  },
  subject_detail: {
    type: "choice",
    criteria: {
      adult_person: "An adult person",
      child_or_baby: "A child or baby",
      dog: "A dog",
      cat: "A cat",
      bird: "A bird",
      horse: "A horse",
      livestock: "Livestock such as a cow, goat, sheep, or pig",
      wild_animal: "A wild mammal",
      fish_or_reptile: "A fish, reptile, or amphibian",
      insect: "An insect or arachnid",
      flower_or_plant: "A flower or plant",
      prepared_food: "A prepared meal or dish",
      fruit_or_vegetable: "Fruit or vegetables",
      drink: "A beverage",
      car: "A car, van, or truck",
      motorcycle_or_bicycle: "A motorcycle, scooter, or bicycle",
      aircraft_or_boat: "An aircraft or boat",
      train: "A train or rail vehicle",
      building: "A building or architectural structure",
      room_or_furniture: "A room or furniture",
      phone_or_computer: "A phone, tablet, computer, or electronic device",
      clothing_or_accessory: "Clothing, shoes, jewelry, or an accessory",
      book_or_document: "A book, paper, card, receipt, or document",
      sign_or_logo: "A sign, label, logo, or icon",
      landscape: "A broad landscape or skyline",
      water_or_sky: "A body of water, clouds, or the sky",
      other_or_unclear: "None of the listed details, not applicable, or unclear",
    },
  },
  environment: {
    type: "choice",
    criteria: {
      home: "Inside or around a home",
      office_or_school: "An office, school, laboratory, or professional workspace",
      shop_or_restaurant: "A shop, market, restaurant, café, or commercial venue",
      street_or_city: "A street, road, parking area, or urban outdoor place",
      nature: "A forest, field, mountain, desert, or other natural land setting",
      beach_or_water: "A beach, sea, river, lake, or pool setting",
      event_or_sports: "An event, stage, stadium, sports venue, or celebration",
      studio_or_plain_background: "A studio or plain/isolated background",
      digital_interface: "A digital screen or interface rather than a physical setting",
      document_page: "A document or page fills the image",
      unknown_or_other: "The setting is unclear or different",
    },
  },
  activity: {
    type: "choice",
    criteria: {
      posing: "Posing or looking toward the camera",
      talking_or_meeting: "Talking, meeting, teaching, or presenting",
      working_or_studying: "Working, studying, writing, or using equipment",
      eating_or_cooking: "Eating, drinking, serving, or cooking",
      sport_or_exercise: "Playing a sport or exercising",
      walking_or_traveling: "Walking, driving, riding, flying, or traveling",
      playing_or_performing: "Playing, dancing, making music, or performing",
      resting: "Sitting, lying down, sleeping, or resting",
      object_display: "A static object, product, dish, document, or scene is displayed",
      no_clear_activity: "No clear activity or not applicable",
    },
  },
  people_count: {
    type: "choice",
    criteria: {
      none: "No person visible",
      one: "Exactly one person visible",
      two: "Exactly two people visible",
      small_group: "Three to ten people visible",
      crowd: "More than ten people visible",
      unclear: "People may be present but the count is unclear",
    },
  },
  framing: {
    type: "choice",
    criteria: {
      extreme_close_up: "An extreme close-up or macro view",
      close_up: "A close-up of a face or object",
      medium_shot: "A medium-distance view",
      wide_shot: "A wide view showing substantial surroundings",
      overhead: "An overhead or top-down view",
      interface_or_page: "A flat screenshot, interface, or page",
      unclear: "The framing is unclear or not applicable",
    },
  },
  lighting: {
    type: "choice",
    criteria: {
      bright_natural: "Bright natural daylight",
      soft_natural: "Soft or diffuse natural light",
      artificial_indoor: "Artificial indoor lighting",
      low_light_or_night: "Low light or nighttime",
      dramatic: "Dramatic, high-contrast, or strongly directional lighting",
      flat_graphic: "Flat graphic colors or lighting is not applicable",
      unclear: "Lighting is unclear",
    },
  },
  palette: {
    type: "choice",
    criteria: {
      warm: "Mostly warm colors such as red, orange, yellow, or brown",
      cool: "Mostly cool colors such as blue, green, or violet",
      neutral: "Mostly neutral colors",
      monochrome: "Black-and-white or nearly monochrome",
      colorful: "Many vivid or varied colors",
      dark: "Predominantly dark tones",
      light: "Predominantly pale or bright tones",
    },
  },
  mood: {
    type: "choice",
    criteria: {
      joyful: "Joyful, playful, celebratory, or friendly",
      calm: "Calm, peaceful, or relaxed",
      professional: "Professional, formal, educational, or informational",
      dramatic: "Dramatic, intense, exciting, or energetic",
      somber: "Somber, sad, lonely, or serious",
      mysterious: "Mysterious, eerie, or suspenseful",
      neutral: "Neutral or no clear mood",
    },
  },
  image_quality: {
    type: "choice",
    criteria: {
      sharp: "Sharp and clear",
      slightly_blurry: "Slightly blurry, compressed, or noisy",
      very_blurry: "Very blurry or difficult to interpret",
      obstructed: "Important content is cropped or obstructed",
      not_applicable: "A clean graphic, screenshot, or document where photo quality is not applicable",
    },
  },
  readable_text: {
    type: "noul",
    instructions: "Is there clearly visible text that appears readable in the image?",
  },
  visible_face: {
    type: "noul",
    instructions: "Is at least one human face clearly visible?",
  },
});

function upstreamMessage(payload, fallback) {
  const raw =
    payload?.error?.message || payload?.detail?.message || payload?.message || fallback;
  return String(raw).replace(/[\r\n]+/g, " ").slice(0, 500);
}

export class InceptionClient {
  constructor(config, options = {}) {
    this.config = config;
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  assertConfigured() {
    if (!this.config.inceptionApiKey) {
      throw new HttpError(
        503,
        "inception_key_missing",
        "INCEPTION_API_KEY n'est pas configurée sur le serveur.",
      );
    }
  }

  async post(path, body) {
    this.assertConfigured();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.upstreamTimeoutMs);
    let response;
    try {
      response = await this.fetch(`${this.config.inceptionBaseUrl}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.inceptionApiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      const timedOut = error.name === "AbortError";
      throw new HttpError(
        timedOut ? 504 : 502,
        timedOut ? "inception_timeout" : "inception_unreachable",
        timedOut
          ? "Le service Inception a dépassé le délai autorisé."
          : "Le service Inception est momentanément inaccessible.",
        { cause: error },
      );
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { message: text };
    }

    if (!response.ok) {
      const message = upstreamMessage(payload, `Erreur Inception HTTP ${response.status}`);
      if (response.status === 429) {
        throw new HttpError(429, "inception_rate_limited", message);
      }
      if (response.status === 402) {
        throw new HttpError(503, "inception_quota_exceeded", message);
      }
      if (response.status === 401 || response.status === 403) {
        throw new HttpError(
          502,
          "inception_authentication_failed",
          "La clé Inception configurée sur le serveur est refusée.",
        );
      }
      if (response.status === 404) {
        throw new HttpError(502, "inception_model_unavailable", message);
      }
      throw new HttpError(502, "inception_error", message);
    }

    return payload;
  }

  async chat({ model, messages, effort }) {
    const payload = await this.post("/chat/completions", {
      model,
      messages: [
        { role: "system", content: this.config.systemPrompt },
        ...messages,
      ],
      reasoning_effort: effort,
      max_completion_tokens: this.config.maxCompletionTokens,
    });

    const content = payload?.choices?.[0]?.message?.content;
    const answer = Array.isArray(content)
      ? content.map((part) => part?.text ?? "").join("")
      : content;
    if (typeof answer !== "string" || answer.trim() === "") {
      throw new HttpError(
        502,
        "invalid_inception_response",
        "Inception n'a pas renvoyé de réponse textuelle exploitable.",
      );
    }
    return {
      answer: answer.trim(),
      usage: payload.usage ?? null,
      finishReason: payload?.choices?.[0]?.finish_reason ?? null,
      upstreamId: payload.id ?? null,
    };
  }

  async analyzeImage({ dataUrl, prompt }) {
    const payload = await this.post("/decisions", {
      model: "mercury-decide",
      state: [
        {
          type: "text",
          text: `Analyse visuelle structurée. Demande de l'utilisateur : ${prompt}`,
        },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
      questions: VISION_QUESTIONS,
    });
    if (!payload?.answers || typeof payload.answers !== "object") {
      throw new HttpError(
        502,
        "invalid_vision_response",
        "Mercury Decide n'a pas renvoyé d'observations visuelles.",
      );
    }
    return {
      observations: summarizeVisionAnswers(payload.answers),
      profile: formatVisionProfile(payload.answers),
      usage: payload.usage ?? null,
    };
  }
}

function topAlternatives(probabilities, selected) {
  if (!probabilities || typeof probabilities !== "object") return [];
  return Object.entries(probabilities)
    .filter(([key]) => key !== selected)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 2)
    .map(([value, probability]) => ({ value, probability: Number(probability) }));
}

export function summarizeVisionAnswers(answers) {
  const summary = {};
  for (const [name, answer] of Object.entries(answers)) {
    if (answer?.type === "choice") {
      summary[name] = {
        value: answer.choice,
        confidence: Number(answer.confidence ?? 0),
        alternatives: topAlternatives(answer.probabilities, answer.choice),
      };
    } else if (answer?.type === "noul") {
      const probability = Number(answer.noul ?? 0);
      summary[name] = { value: probability >= 0.5, probability };
    } else if (answer?.type === "score") {
      summary[name] = {
        value: Number(answer.score),
        confidence: Number(answer.confidence ?? 0),
      };
    }
  }
  return summary;
}

function choiceLabel(questionName, value) {
  return VISION_QUESTIONS[questionName]?.criteria?.[value] ?? value;
}

export function formatVisionProfile(answers) {
  const lines = [
    "Observations structurées produites par Mercury Decide (elles peuvent être incertaines) :",
  ];
  for (const [name, answer] of Object.entries(answers)) {
    if (answer?.type === "choice") {
      const confidence = Math.round(Number(answer.confidence ?? 0) * 100);
      lines.push(`- ${name}: ${choiceLabel(name, answer.choice)} (confiance ${confidence} %)`);
      if (confidence < 65) {
        const alternatives = topAlternatives(answer.probabilities, answer.choice)
          .map(({ value, probability }) => `${choiceLabel(name, value)} ${Math.round(probability * 100)} %`)
          .join(", ");
        if (alternatives) lines.push(`  alternatives possibles: ${alternatives}`);
      }
    } else if (answer?.type === "noul") {
      lines.push(
        `- ${name}: probabilité positive ${Math.round(Number(answer.noul ?? 0) * 100)} %`,
      );
    }
  }
  lines.push(
    "Réponds à la demande en t'appuyant uniquement sur ces observations. Ne fabrique ni objets, ni personnes, ni texte lisible, ni détails fins qui ne figurent pas ci-dessus. Explique la limite si une description plus précise est impossible.",
  );
  return lines.join("\n");
}
