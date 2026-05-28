const { upsertUser } = require('../database/users');

function userMiddleware() {
  return async (ctx, next) => {
    upsertUser(ctx.from);
    return next();
  };
}

module.exports = userMiddleware;
