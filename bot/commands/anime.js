const tmdbService = require('../services/tmdbService');
const animeFollows = require('../database/animeFollows');
const { sanitizeQuery, escapeMarkdown, yearFromDate } = require('../utils/text');
const logger = require('../utils/logger');

function formatFollows(items) {
  if (!items.length) {
    return 'Belum ada anime yang kamu follow\\. Cari anime dengan `/anime judul anime`, lalu tekan *Follow Anime*\\.';
  }

  const rows = items.slice(0, 20).map((item, index) => {
    const year = yearFromDate(item.releaseDate);
    const episode = item.lastEpisodeCount ? ` • ${item.lastEpisodeCount} episode` : '';
    return `${index + 1}\\. *${escapeMarkdown(item.title)}* \\(${escapeMarkdown(year)}\\)${escapeMarkdown(episode)}`;
  });

  return ['*Anime yang Kamu Follow*', ...rows].join('\n');
}

function registerAnimeCommand(bot) {
  bot.command('anime', async (ctx) => {
    const query = sanitizeQuery(ctx.message.text.replace(/^\/anime(@\w+)?/i, ''));

    if (!query) {
      return ctx.reply('Ketik judul anime. Contoh: /anime one piece');
    }

    await ctx.sendChatAction('typing');

    try {
      const results = (await tmdbService.search(query))
        .filter((item) => item.type === 'tv' && item.isAnime)
        .slice(0, 5);

      if (!results.length) {
        return ctx.reply(`Anime "${query}" belum ditemukan.`);
      }

      const first = await tmdbService.getDetails(results[0].id, 'tv');
      const { sendMovie } = require('./movie');
      return sendMovie(ctx, first);
    } catch (error) {
      logger.error('anime_command_failed', { error: error.message, query });
      return ctx.reply('Gagal mencari anime. Coba lagi sebentar.');
    }
  });

  bot.command('myanime', (ctx) => {
    const items = animeFollows.getUserFollows(ctx.from?.id);
    return ctx.replyWithMarkdownV2(formatFollows(items));
  });
}

module.exports = registerAnimeCommand;
