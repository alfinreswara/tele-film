const { Telegraf } = require('telegraf');
const { validateEnv, env } = require('./config/env');
const rateLimit = require('./middleware/rateLimit');
const userMiddleware = require('./handlers/users');
const registerHelpCommand = require('./commands/help');
const registerAiCommand = require('./commands/ai');
const { registerMovieCommand } = require('./commands/movie');
const registerTrendingCommand = require('./commands/trending');
const registerCallbackHandlers = require('./handlers/callbacks');
const registerErrorHandler = require('./handlers/errors');
const logger = require('./utils/logger');

validateEnv();

const bot = new Telegraf(env.botToken);

bot.use(userMiddleware());
bot.use(rateLimit());

registerHelpCommand(bot);
registerAiCommand(bot);
registerMovieCommand(bot);
registerTrendingCommand(bot);
registerCallbackHandlers(bot);
registerErrorHandler(bot);

bot.launch()
  .then(() => logger.info('bot_started'))
  .catch((error) => {
    logger.error('bot_start_failed', { error: error.message });
    process.exit(1);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
