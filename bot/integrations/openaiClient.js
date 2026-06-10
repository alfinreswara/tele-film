const axios = require("axios");
const { env } = require("../config/env");

const client = axios.create({
  baseURL: "https://api.openai.com/v1",
  timeout: env.requestTimeoutMs,
  headers: {
    Authorization: `Bearer ${env.openaiApiKey || ""}`,
    "Content-Type": "application/json"
  }
});

function isConfigured() {
  return Boolean(env.openaiApiKey);
}

const movieSearchIntentSchema = {
  type: "json_schema",
  name: "movie_search_intent",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "mode",
      "searchQuery",
      "mediaType",
      "genre",
      "keywords",
      "sortBy",
      "country",
      "responseLanguage",
      "reason"
    ],
    properties: {
      mode: { type: "string", enum: ["search", "discover", "off_topic"] },
      searchQuery: { type: "string" },
      mediaType: { type: "string", enum: ["movie", "tv", "any"] },
      genre: { type: "string" },
      keywords: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      },
      sortBy: { type: "string", enum: ["popular", "top_rated", "newest", "oldest"] },
      country: { type: "string" },
      responseLanguage: { type: "string", enum: ["id", "en", "other"] },
      reason: { type: "string" }
    }
  }
};

function extractResponseText(data = {}) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const chunks = [];

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("").trim();
}

function splitMessages(messages) {
  const systemMessages = messages
    .filter((message) => message.role === "system" || message.role === "developer")
    .map((message) => message.content)
    .filter(Boolean);
  const inputMessages = messages
    .filter((message) => message.role !== "system" && message.role !== "developer")
    .map((message) => `${message.role || "user"}: ${message.content}`)
    .filter(Boolean);

  return {
    instructions: systemMessages.join("\n\n"),
    input: inputMessages.join("\n\n") || systemMessages.join("\n\n")
  };
}

function shouldRetryWithChatCompletions(error) {
  const status = error.response?.status;
  return status === 400 || status === 404;
}

async function createResponsesCompletion(messages) {
  const { instructions, input } = splitMessages(messages);
  const response = await client.post("/responses", {
    model: env.openaiModel,
    instructions,
    input,
    max_output_tokens: 350,
    text: {
      format: movieSearchIntentSchema
    }
  });

  return extractResponseText(response.data) || "{}";
}

async function createLegacyChatCompletion(messages) {
  const response = await client.post("/chat/completions", {
    model: env.openaiModel,
    messages,
    temperature: 0.2,
    max_tokens: 350,
    response_format: { type: "json_object" }
  });

  return response.data.choices?.[0]?.message?.content || "{}";
}

async function createChatCompletion(messages) {
  try {
    return await createResponsesCompletion(messages);
  } catch (error) {
    if (!shouldRetryWithChatCompletions(error)) {
      throw error;
    }

    return createLegacyChatCompletion(messages);
  }
}

module.exports = {
  isConfigured,
  createChatCompletion
};
