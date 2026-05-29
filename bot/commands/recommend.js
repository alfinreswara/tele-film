const watchlistStore = require('../database/watchlist');
const historyStore = require('../database/history');
const tmdbService = require('../services/tmdbService');
const { escapeMarkdown, yearFromDate } = require('../utils/text');
const logger = require('../utils/logger');

function formatRecommendations(items, sourceTitle) {
  if (!items.length) {
    return 'Belum ada rekomendasi personal\\. Tambahkan beberapa film ke watchlist dulu dengan tombol *Save*\\.';
  }

  const rows = items.slice(0, 8).map((item, index) => {
    const year = yearFromDate(item.releaseDate);
    return `${index + 1}\\. *${escapeMarkdown(item.title)}* \\(${escapeMarkdown(year)}\\) • ⭐ ${escapeMarkdown(Number(item.rating || 0).toFixed(1))}`;
  });

  return [
    '*Rekomendasi Untuk Kamu*',
    sourceTitle ? `Berdasarkan: ${escapeMarkdown(sourceTitle)}` : 'Berdasarkan watchlist dan riwayat pencarian kamu\\.',
    '',
    ...rows
  ].join('\n');
}

function registerRecommendCommand(bot) {
  bot.command('recommend', async (ctx) => {
    await ctx.sendChatAction('typing');

    try {
      const watchlist = watchlistStore.getWatchlist(ctx.from?.id);
      const history = historyStore.getUserHistory(ctx.from?.id);
      const source = watchlist[0] || history[0];

      if (!source) {
        return ctx.replyWithMarkdownV2(formatRecommendations([], ''));
      }

      const sourceMovie = await tmdbService.getDetails(source.id, source.type || 'movie');
      const recommendations = await tmdbService.getDetailedSimilar(sourceMovie, 8);
      return ctx.replyWithMarkdownV2(formatRecommendations(recommendations, sourceMovie.title));
    } catch (error) {
      logger.error('recommend_command_failed', { error: error.message, userId: ctx.from?.id });
      return ctx.reply('Gagal membuat rekomendasi. Coba lagi setelah menambahkan film ke watchlist.');
    }
  });
}

module.exports = registerRecommendCommand;
