require('dotenv').config();

const required = ['BOT_TOKEN', 'TMDB_API_KEY'];

function getEnvNumber(key, fallback) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getEnvList(key) {
  return (process.env[key] || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = {
  validateEnv,
  env: {
    botToken: process.env.BOT_TOKEN,
    adminTelegramIds: getEnvList('ADMIN_TELEGRAM_IDS'),
    tmdbApiKey: process.env.TMDB_API_KEY,
    aiProvider: process.env.AI_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-5.4-nano',
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    aiDailyLimit: getEnvNumber('AI_DAILY_LIMIT', 3),
    openSubtitlesApiKey: process.env.OPENSUBTITLES_API_KEY,
    openSubtitlesUserAgent: process.env.OPENSUBTITLES_USER_AGENT || 'MovieCompanionBot v1.0',
    defaultSubtitleLanguage: process.env.DEFAULT_SUBTITLE_LANGUAGE || 'id',
    requestTimeoutMs: getEnvNumber('REQUEST_TIMEOUT_MS', 8000),
    rateLimitMax: getEnvNumber('RATE_LIMIT_MAX', 5),
    rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 10000),
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};
