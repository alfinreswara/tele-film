const axios = require('axios');
const { env } = require('../config/env');

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: env.requestTimeoutMs,
  params: {
    api_key: env.tmdbApiKey
  }
});

async function get(path, params = {}) {
  const response = await tmdb.get(path, { params });
  return response.data;
}

module.exports = {
  get
};
