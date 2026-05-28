const { env } = require('../config/env');
const { isAdminUser } = require('../utils/admin');

const usage = new Map();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function checkAndConsume(userId) {
  if (!userId) return { allowed: true, remaining: env.aiDailyLimit };
  if (isAdminUser(userId)) return { allowed: true, remaining: 'admin' };

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
