const axios = require('axios');
const { env } = require('../config/env');

const client = axios.create({
  baseURL: 'https://api.opensubtitles.com/api/v1',
  timeout: env.requestTimeoutMs,
  headers: {
    'Api-Key': env.openSubtitlesApiKey || '',
    'User-Agent': env.openSubtitlesUserAgent,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

function isConfigured() {
  return Boolean(env.openSubtitlesApiKey);
}

async function get(path, params = {}) {
  const response = await client.get(path, { params });
  return response.data;
}

async function post(path, data = {}) {
  const response = await client.post(path, data);
  return response.data;
}

module.exports = {
  isConfigured,
  get,
  post
};
