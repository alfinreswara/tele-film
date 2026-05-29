const { readJson, writeJson } = require('./jsonStore');

const STORE = 'anime_follows';

function all() {
  return readJson(STORE, {});
}

function save(data) {
  writeJson(STORE, data);
}

function getUserFollows(userId) {
  const data = all();
  return data[String(userId)] || [];
}

function getAllFollows() {
  return all();
}

function followAnime(userId, anime) {
  const data = all();
  const id = String(userId);
  const items = data[id] || [];
  const item = {
    id: anime.id,
    type: 'tv',
    title: anime.title,
    releaseDate: anime.releaseDate,
    rating: anime.rating,
    lastEpisodeCount: anime.numberOfEpisodes || 0,
    lastAirDate: anime.lastAirDate || '',
    addedAt: new Date().toISOString(),
    checkedAt: new Date().toISOString()
  };

  if (!items.some((candidate) => String(candidate.id) === String(item.id))) {
    items.unshift(item);
  }

  data[id] = items.slice(0, 50);
  save(data);
  return data[id];
}

function unfollowAnime(userId, animeId) {
  const data = all();
  const id = String(userId);
  data[id] = (data[id] || []).filter((item) => String(item.id) !== String(animeId));
  save(data);
  return data[id];
}

function updateFollow(userId, animeId, patch) {
  const data = all();
  const id = String(userId);
  data[id] = (data[id] || []).map((item) => (
    String(item.id) === String(animeId) ? { ...item, ...patch } : item
  ));
  save(data);
}

module.exports = {
  getUserFollows,
  getAllFollows,
  followAnime,
  unfollowAnime,
  updateFollow
};
