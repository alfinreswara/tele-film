const axios = require('axios');
const { env } = require('../config/env');

const client = axios.create({
  baseURL: 'https://api.openai.com/v1',
  timeout: env.requestTimeoutMs,
  headers: {
    Authorization: `Bearer ${env.openaiApiKey || ''}`,
    'Content-Type': 'application/json'
  }
});

function isConfigured() {
  return Boolean(env.openaiApiKey);
}

async function createChatCompletion(messages) {
  const response = await client.post('/chat/completions', {
    model: env.openaiModel,
    messages,
    temperature: 0.2,
    max_tokens: 220,
    response_format: { type: 'json_object' }
  });

  return response.data.choices?.[0]?.message?.content || '{}';
}

module.exports = {
  isConfigured,
  createChatCompletion
};
