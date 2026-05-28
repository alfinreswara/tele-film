const { env } = require('../config/env');

const usage = new Map();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function checkAndConsume(userId) {
  if (!userId) return { allowed: true, remaining: env.aiDailyLimit };

  const key = `${userId}:${dayKey()}`;
  const count = usage.get(key) || 0;

  if (count >= env.aiDailyLimit) {
    return { allowed: false, remaining: 0 };
  }

  usage.set(key, count + 1);
  return {
    allowed: true,
    remaining: env.aiDailyLimit - count - 1
  };
}

module.exports = {
  checkAndConsume
};
