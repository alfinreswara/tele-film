const { env } = require('../config/env');

function isAdminUser(userId) {
  if (!userId) return false;
  return env.adminTelegramIds.includes(String(userId));
}

module.exports = {
  isAdminUser
};
