const tmdbService = require('../services/tmdbService');
const { formatTrendingList } = require('../utils/formatters');
const { trendingKeyboard } = require('../utils/keyboards');
const logger = require('../utils/logger');

function registerTrendingCommand(bot) {
  bot.command('trending', async (ctx) => {
    await ctx.sendChatAction('typing');

    try {
      const trending = await tmdbService.getTrending();
      const text = [
        formatTrendingList('Trending Movie', trending.movies),
        '',
        formatTrendingList('Trending TV', trending.tv),
        '',
        formatTrendingList('Trending Anime', trending.anime)
      ].join('\n');

      return ctx.replyWithMarkdownV2(text, trendingKeyboard(trending));
    } catch (error) {
      logger.error('trending_command_failed', { error: error.message });
      return ctx.reply('Gagal memuat trending. Coba lagi sebentar.');
    }
  });
}

module.exports = registerTrendingCommand;
