const openaiClient = require('../integrations/openaiClient');
const geminiClient = require('../integrations/geminiClient');
const { env } = require('../config/env');
const { sanitizeQuery } = require('../utils/text');

function isConfigured() {
  if (env.aiProvider === 'gemini') {
    return geminiClient.isConfigured();
  }

  return openaiClient.isConfigured();
}

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function understandMovieQuery(userQuery) {
  const cleanedQuery = sanitizeQuery(userQuery);

  if (!isConfigured()) {
    return {
      configured: false,
      searchQuery: cleanedQuery,
      note: 'AI provider belum dikonfigurasi.'
    };
  }

  const instructions = [
    'Kamu membantu Telegram bot film memahami pencarian user berbahasa Indonesia.',
    'Balas hanya JSON valid.',
    'Tugasmu mengubah deskripsi bebas menjadi intent pencarian TMDB.',
    'Jika user menyebut judul spesifik, gunakan mode search.',
    'Jika user meminta kategori seperti terbaik, rating tertinggi, populer, komedi terbaik, film Indonesia, gunakan mode discover.',
    'Gunakan genre bahasa Inggris kecil: action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, horror, mystery, romance, sci-fi, thriller, war.',
    'Gunakan country ISO-3166 jika disebut, contoh Indonesia = ID, Jepang = JP, Korea = KR.',
    'Gunakan sortBy: top_rated, popular, newest, oldest.',
    'Schema: {"mode":"search|discover","searchQuery":"string","mediaType":"movie|tv|any","genre":"string","sortBy":"popular|top_rated|newest|oldest","country":"string","reason":"string"}',
    `User query: ${cleanedQuery}`
  ].join('\n');

  const raw = env.aiProvider === 'gemini'
    ? await geminiClient.generateJson(instructions)
    : await openaiClient.createChatCompletion([
      {
        role: 'system',
        content: instructions
      },
      {
        role: 'user',
        content: cleanedQuery
      }
    ]);

  const parsed = parseJson(raw);
  const searchQuery = sanitizeQuery(parsed.searchQuery || cleanedQuery);

  return {
    configured: true,
    mode: ['search', 'discover'].includes(parsed.mode) ? parsed.mode : 'search',
    searchQuery: searchQuery || cleanedQuery,
    mediaType: ['movie', 'tv', 'any'].includes(parsed.mediaType) ? parsed.mediaType : 'any',
    genre: sanitizeQuery(parsed.genre || ''),
    sortBy: ['popular', 'top_rated', 'newest', 'oldest'].includes(parsed.sortBy) ? parsed.sortBy : 'popular',
    country: sanitizeQuery(parsed.country || '').toUpperCase(),
    reason: sanitizeQuery(parsed.reason || '')
  };
}

module.exports = {
  isConfigured,
  understandMovieQuery
};
