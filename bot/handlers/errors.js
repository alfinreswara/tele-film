const logger = require('../utils/logger');

function registerErrorHandler(bot) {
  bot.catch((error, ctx) => {
    logger.error('bot_error', {
      error: error.message,
      updateType: ctx.updateType,
      userId: ctx.from?.id
    });

    return ctx.reply('Maaf, ada masalah di bot. Coba lagi sebentar.').catch(() => {});
  });
}

module.exports = registerErrorHandler;
