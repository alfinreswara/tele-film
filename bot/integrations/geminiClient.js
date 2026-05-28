const axios = require('axios');
const { env } = require('../config/env');

const client = axios.create({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  timeout: env.requestTimeoutMs,
  headers: {
    'Content-Type': 'application/json'
  }
});

function isConfigured() {
  return Boolean(env.geminiApiKey);
}

async function generateJson(prompt) {
  const response = await client.post(`/models/${env.geminiModel}:generateContent`, {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 220,
      responseMimeType: 'application/json'
    }
  }, {
    params: {
      key: env.geminiApiKey
    }
  });

  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}

module.exports = {
  isConfigured,
  generateJson
};
