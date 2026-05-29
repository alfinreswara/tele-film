const tmdbService = require('../services/tmdbService');
const animeFollows = require('../database/animeFollows');
const logger = require('../utils/logger');

const DEFAULT_INTERVAL_MS = 1000 * 60 * 60 * 6;

async function checkAnimeUpdates(bot) {
  const allFollows = animeFollows.getAllFollows();

  for (const [userId, items] of Object.entries(allFollows)) {
    for (const item of items) {
      try {
        const latest = await tmdbService.getDetails(item.id, 'tv');
        const latestEpisodes = latest.numberOfEpisodes || 0;
        const previousEpisodes = item.lastEpisodeCount || 0;
        const latestAirDate = latest.lastAirDate || '';

        if (latestEpisodes > previousEpisodes) {
          await bot.telegram.sendMessage(
            userId,
            [
              `Episode baru terdeteksi untuk ${latest.title}.`,
              `Episode sebelumnya: ${previousEpisodes || 'N/A'}`,
              `Episode terbaru: ${latestEpisodes}`,
              latestAirDate ? `Tanggal terakhir tayang: ${latestAirDate}` : ''
            ].filter(Boolean).join('\n')
          );
        }

        animeFollows.updateFollow(userId, item.id, {
          lastEpisodeCount: latestEpisodes,
          lastAirDate: latestAirDate,
          checkedAt: new Date().toISOString()
        });
      } catch (error) {
        logger.error('anime_update_check_failed', {
          error: error.message,
          userId,
          animeId: item.id
        });
      }
    }
  }
}

function startAnimeNotifications(bot, intervalMs = DEFAULT_INTERVAL_MS) {
  setTimeout(() => checkAnimeUpdates(bot), 1000 * 30);
  setInterval(() => checkAnimeUpdates(bot), intervalMs);
}

module.exports = {
  startAnimeNotifications,
  checkAnimeUpdates
};
