const tmdbService = require('../services/tmdbService');
const subtitleService = require('../services/subtitleService');
const { yearFromDate } = require('../utils/text');
const { formatSimilar, formatSubtitleResults } = require('../utils/formatters');
const { subtitleKeyboard } = require('../utils/keyboards');
const logger = require('../utils/logger');

function registerCallbackHandlers(bot) {
  bot.action(/^subtitle:(movie|tv):(\d+)$/, async (ctx) => {
    const [, type, id] = ctx.match;
    await ctx.answerCbQuery();
    await ctx.sendChatAction('typing');

    try {
      const movie = await tmdbService.getDetails(id, type);
      const subtitles = await subtitleService.searchSubtitles({
        title: movie.title,
        year: yearFromDate(movie.releaseDate),
        type: movie.type
      });

      if (subtitles.results.length) {
        return ctx.reply(formatSubtitleResults(movie, subtitles), subtitleKeyboard(subtitles.results));
      }

      return ctx.reply(formatSubtitleResults(movie, subtitles));
    } catch (error) {
      logger.error('subtitle_callback_failed', { error: error.message, type, id });
      return ctx.reply('Gagal mencari subtitle. Coba lagi sebentar.');
    }
  });

  bot.action(/^download_sub:(\d+)$/, async (ctx) => {
    const [, fileId] = ctx.match;
    await ctx.answerCbQuery();
    await ctx.sendChatAction('upload_document');

    try {
      const link = await subtitleService.getDownloadLink(Number(fileId));
      return ctx.replyWithDocument({ url: link, filename: `subtitle-${fileId}.srt` });
    } catch (error) {
      logger.error('subtitle_download_failed', { error: error.message, fileId });
      return ctx.reply('Gagal mengunduh subtitle. Coba pilih subtitle lain.');
    }
  });

  bot.action(/^trailer:(movie|tv):(\d+)$/, async (ctx) => {
    const [, type, id] = ctx.match;
    await ctx.answerCbQuery();

    try {
      const movie = await tmdbService.getDetails(id, type);
      if (!movie.trailerUrl) {
        return ctx.reply('Trailer belum tersedia.');
      }

      return ctx.reply(`Trailer ${movie.title}: ${movie.trailerUrl}`);
    } catch (error) {
      logger.error('trailer_callback_failed', { error: error.message, type, id });
      return ctx.reply('Gagal memuat trailer. Coba lagi sebentar.');
    }
  });

  bot.action(/^similar:(movie|tv):(\d+)$/, async (ctx) => {
    const [, type, id] = ctx.match;
    await ctx.answerCbQuery();

    try {
      const movie = await tmdbService.getDetails(id, type);
      const detailedSimilar = await tmdbService.getDetailedSimilar(movie, 5);
      return ctx.replyWithMarkdownV2(formatSimilar({
        ...movie,
        similar: detailedSimilar
      }));
    } catch (error) {
      logger.error('similar_callback_failed', { error: error.message, type, id });
      return ctx.reply('Gagal memuat rekomendasi. Coba lagi sebentar.');
    }
  });
}

module.exports = registerCallbackHandlers;
