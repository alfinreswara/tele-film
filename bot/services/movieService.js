const tmdbService = require('./tmdbService');

async function findBestMatch(query) {
  const results = await tmdbService.search(query);
  if (!results.length) return null;

  return tmdbService.getDetails(results[0].id, results[0].type);
}

module.exports = {
  findBestMatch
};
