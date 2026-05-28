const aiSearchService = require('../services/aiSearchService');
const tmdbService = require('../services/tmdbService');
const { addHistory } = require('../database/history');
const { checkAndConsume } = require('../middleware/aiUsageLimit');
const { sanitizeQuery } = require('../utils/text');
const { sendMovie } = require('./movie');
const logger = require('../utils/logger');

function filterByMediaType(results, mediaType) {
  if (!mediaType || mediaType === 'any') return results;
  return results.filter((item) => item.type === mediaType);
}

async function findAiResults(intent) {
  const mediaType = intent.mediaType === 'tv' ? 'tv' : 'movie';

  if (intent.mode === 'discover') {
    const discovered = await tmdbService.discover({
      mediaType,
      genre: intent.genre,
      sortBy: intent.sortBy,
      country: intent.country
    });

    if (discovered.length) return discovered;
  }

  const searched = filterByMediaType(await tmdbService.search(intent.searchQuery), intent.mediaType);
  if (searched.length) return searched;

  return tmdbService.discover({
    mediaType,
    genre: intent.genre,
    sortBy: intent.sortBy,
    country: intent.country
  });
}

function registerAiCommand(bot) {
  bot.command('ai', async (ctx) => {
    const query = sanitizeQuery(ctx.message.text.replace(/^\/ai(@\w+)?/i, ''));

    if (!query) {
      return ctx.reply('Ketik deskripsi film setelah command. Contoh: /ai film alien sedih luar angkasa');
    }

    if (!aiSearchService.isConfigured()) {
      return ctx.reply('Fitur AI belum aktif. Isi API key provider AI di .env dulu.');
    }

    const usage = checkAndConsume(ctx.from?.id);
    if (!usage.allowed) {
      return ctx.reply('Limit AI harian kamu habis. Coba lagi besok atau pakai /movie untuk pencarian biasa.');
    }

    await ctx.sendChatAction('typing');

    try {
      const intent = await aiSearchService.understandMovieQuery(query);

      const results = await findAiResults(intent);
      const first = results[0];

      if (!first) {
        return ctx.reply(`AI memahami pencarian sebagai "${intent.searchQuery}", tapi TMDB belum menemukan hasil.`);
      }

      const movie = await tmdbService.getDetails(first.id, first.type);

      if (!movie) {
        return ctx.reply(`AI memahami pencarian sebagai "${intent.searchQuery}", tapi detail film belum tersedia.`);
      }

      addHistory({
        telegram_id: ctx.from?.id,
        query: `/ai ${query} -> ${intent.searchQuery}`,
        type: movie.type
      });

      if (intent.reason) {
        const modeText = intent.mode === 'discover' ? `Discover ${intent.genre || 'umum'} ${intent.sortBy}` : `Search ${intent.searchQuery}`;
        await ctx.reply(`AI Search: ${intent.reason}\nMode TMDB: ${modeText}\nSisa limit AI hari ini: ${usage.remaining}`);
      }

      return sendMovie(ctx, movie);
    } catch (error) {
      logger.error('ai_command_failed', { error: error.message, query });
      return ctx.reply('Maaf, AI Search sedang bermasalah. Coba lagi sebentar atau pakai /movie.');
    }
  });
}

module.exports = registerAiCommand;
