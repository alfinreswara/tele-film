const watchlistStore = require('../database/watchlist');
const { escapeMarkdown, yearFromDate } = require('../utils/text');

function formatWatchlist(items) {
  if (!items.length) {
    return 'Watchlist kamu masih kosong\\. Tekan tombol *Save* di hasil film atau pakai `/movie judul` dulu\\.';
  }

  const rows = items.slice(0, 20).map((item, index) => {
    const year = yearFromDate(item.releaseDate);
    return `${index + 1}\\. *${escapeMarkdown(item.title)}* \\(${escapeMarkdown(year)}\\) • ${escapeMarkdown(item.type.toUpperCase())}`;
  });

  return ['*Watchlist Kamu*', ...rows].join('\n');
}

function registerWatchlistCommand(bot) {
  bot.command('watchlist', (ctx) => {
    const items = watchlistStore.getWatchlist(ctx.from?.id);
    return ctx.replyWithMarkdownV2(formatWatchlist(items));
  });

  bot.command('clearwatchlist', (ctx) => {
    watchlistStore.clearWatchlist(ctx.from?.id);
    return ctx.reply('Watchlist kamu sudah dikosongkan.');
  });
}

module.exports = registerWatchlistCommand;
