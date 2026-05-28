const { env } = require('../config/env');
const logger = require('../utils/logger');

const buckets = new Map();

function rateLimit() {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const now = Date.now();
    const bucket = buckets.get(userId) || [];
    const activeHits = bucket.filter((timestamp) => now - timestamp < env.rateLimitWindowMs);

    if (activeHits.length >= env.rateLimitMax) {
      logger.warn('rate_limit_exceeded', { userId });
      return ctx.reply('Terlalu banyak request. Coba lagi beberapa detik lagi.');
    }

    activeHits.push(now);
    buckets.set(userId, activeHits);
    return next();
  };
}

module.exports = rateLimit;
