const movieService = require('../services/movieService');
const tmdbService = require('../services/tmdbService');
const { addHistory } = require('../database/history');
const { sanitizeQuery } = require('../utils/text');
const { formatMovieCaption } = require('../utils/formatters');
const { movieKeyboard } = require('../utils/keyboards');
const logger = require('../utils/logger');

const searchSessions = new Map();

function buildNavigation(results, index) {
  if (!results || results.length <= 1) return null;

  return {
    index,
    hasPrevious: index > 0,
    hasNext: index < results.length - 1
  };
}

async function sendMovie(ctx, movie, navigation = null) {
  const options = {
    parse_mode: 'MarkdownV2',
    ...movieKeyboard(movie, navigation)
  };

  if (movie.posterUrl) {
    return ctx.replyWithPhoto(movie.posterUrl, {
      caption: formatMovieCaption(movie),
      ...options
    });
  }

  return ctx.replyWithMarkdownV2(formatMovieCaption(movie), movieKeyboard(movie, navigation));
}

function registerMovieCommand(bot) {
  bot.command('movie', async (ctx) => {
    const query = sanitizeQuery(ctx.message.text.replace(/^\/movie(@\w+)?/i, ''));

    if (!query) {
      return ctx.reply('Ketik judul setelah command. Contoh: /movie interstellar');
    }

    await ctx.sendChatAction('typing');

    try {
      const movie = await movieService.findBestMatch(query);

      if (!movie) {
        return ctx.reply(`Tidak menemukan hasil untuk "${query}". Coba judul lain.`);
      }

      const results = (await tmdbService.search(query)).slice(0, 5);
      searchSessions.set(ctx.from.id, {
        results,
        createdAt: Date.now()
      });

      addHistory({
        telegram_id: ctx.from?.id,
        id: movie.id,
        title: movie.title,
        query,
        type: movie.type
      });

      return sendMovie(ctx, movie, buildNavigation(results, 0));
    } catch (error) {
      logger.error('movie_command_failed', { error: error.message, query });
      return ctx.reply('Maaf, pencarian sedang bermasalah. Coba lagi sebentar.');
    }
  });

  bot.action(/^detail:(movie|tv):(\d+)$/, async (ctx) => {
    const [, type, id] = ctx.match;
    await ctx.answerCbQuery();

    try {
      const movie = await tmdbService.getDetails(id, type);
      return sendMovie(ctx, movie);
    } catch (error) {
      logger.error('detail_callback_failed', { error: error.message, type, id });
      return ctx.reply('Gagal membuka detail. Coba lagi sebentar.');
    }
  });

  bot.action(/^movie_page:(\d+)$/, async (ctx) => {
    const index = Number(ctx.match[1]);
    const session = searchSessions.get(ctx.from?.id);
    await ctx.answerCbQuery();

    if (!session || Date.now() - session.createdAt > 1000 * 60 * 15) {
      return ctx.reply('Sesi pencarian sudah habis. Jalankan /movie lagi.');
    }

    const result = session.results[index];
    if (!result) {
      return ctx.reply('Halaman tidak tersedia.');
    }

    try {
      const movie = await tmdbService.getDetails(result.id, result.type);
      return sendMovie(ctx, movie, buildNavigation(session.results, index));
    } catch (error) {
      logger.error('movie_page_callback_failed', { error: error.message, index });
      return ctx.reply('Gagal membuka halaman hasil. Coba lagi sebentar.');
    }
  });
}

module.exports = {
  registerMovieCommand,
  sendMovie
};
