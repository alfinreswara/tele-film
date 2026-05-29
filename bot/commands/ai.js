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

function isEnglish(intent) {
  return intent.responseLanguage === 'en';
}

function aiText(intent, key, params = {}) {
  const english = isEnglish(intent);
  const messages = {
    noResults: english
      ? `AI understood your search as "${params.searchQuery}", but TMDB did not find a result.`
      : `AI memahami pencarian sebagai "${params.searchQuery}", tapi TMDB belum menemukan hasil.`,
    noDetails: english
      ? `AI understood your search as "${params.searchQuery}", but the movie details are not available.`
      : `AI memahami pencarian sebagai "${params.searchQuery}", tapi detail film belum tersedia.`,
    prefix: english ? 'AI Search' : 'AI Search',
    mode: english ? 'TMDB mode' : 'Mode TMDB',
    remaining: english ? 'AI daily limit left' : 'Sisa limit AI hari ini',
    general: english ? 'general' : 'umum'
  };

  return messages[key];
}

async function findAiResults(intent) {
  const mediaType = intent.mediaType === 'tv' ? 'tv' : 'movie';

  if (intent.mode === 'discover') {
    const attempts = [
      {
        mediaType,
        genre: intent.genre,
        keywords: intent.keywords,
        sortBy: intent.sortBy,
        country: intent.country
      },
      {
        mediaType,
        genre: intent.genre,
        keywords: intent.keywords,
        keywordMode: 'any',
        sortBy: intent.sortBy,
        country: intent.country
      },
      {
        mediaType,
        genre: intent.genre,
        sortBy: intent.sortBy,
        country: intent.country
      },
      {
        mediaType,
        keywords: intent.keywords,
        sortBy: intent.sortBy,
        country: intent.country
      },
      {
        mediaType,
        keywords: intent.keywords,
        keywordMode: 'any',
        sortBy: intent.sortBy,
        country: intent.country
      },
      {
        mediaType,
        genre: intent.genre,
        sortBy: intent.sortBy
      },
      {
        mediaType,
        keywords: intent.keywords,
        sortBy: intent.sortBy
      }
    ];

    for (const attempt of attempts) {
      if (!attempt.genre && !attempt.keywords?.length && !attempt.country) continue;
      const discovered = await tmdbService.discover(attempt);
      if (discovered.length) return discovered;
    }
  }

  const searched = filterByMediaType(await tmdbService.search(intent.searchQuery), intent.mediaType);
  if (searched.length) return searched;

  if (intent.genre || intent.keywords?.length || intent.country) {
    return tmdbService.discover({
      mediaType,
      genre: intent.genre,
      keywords: intent.keywords,
      sortBy: intent.sortBy,
      country: intent.country
    });
  }

  return [];
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
        return ctx.reply(aiText(intent, 'noResults', { searchQuery: intent.searchQuery }));
      }

      const movie = await tmdbService.getDetails(first.id, first.type);

      if (!movie) {
        return ctx.reply(aiText(intent, 'noDetails', { searchQuery: intent.searchQuery }));
      }

      addHistory({
        telegram_id: ctx.from?.id,
        id: movie.id,
        title: movie.title,
        query: `/ai ${query} -> ${intent.searchQuery}`,
        type: movie.type
      });

      if (intent.reason) {
        const detailParts = [
          intent.genre || aiText(intent, 'general'),
          ...(intent.keywords || []).slice(0, 3)
        ];
        const modeText = intent.mode === 'discover' && (intent.genre || intent.keywords?.length || intent.country)
          ? `Discover ${detailParts.join(', ')} ${intent.sortBy}`
          : `Search ${intent.searchQuery}`;
        await ctx.reply(`${aiText(intent, 'prefix')}: ${intent.reason}\n${aiText(intent, 'mode')}: ${modeText}\n${aiText(intent, 'remaining')}: ${usage.remaining}`);
      }

      return sendMovie(ctx, movie);
    } catch (error) {
      logger.error('ai_command_failed', { error: error.message, query });
      return ctx.reply('Maaf, AI Search sedang bermasalah. Coba lagi sebentar atau pakai /movie.');
    }
  });
}

module.exports = registerAiCommand;
