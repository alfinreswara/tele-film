const { readJson, writeJson } = require('./jsonStore');

const STORE = 'watchlist';

function all() {
  return readJson(STORE, {});
}

function save(data) {
  writeJson(STORE, data);
}

function keyFor(item) {
  return `${item.type}:${item.id}`;
}

function getWatchlist(userId) {
  const data = all();
  return data[String(userId)] || [];
}

function addToWatchlist(userId, movie) {
  const data = all();
  const id = String(userId);
  const items = data[id] || [];
  const item = {
    id: movie.id,
    type: movie.type,
    title: movie.title,
    releaseDate: movie.releaseDate,
    rating: movie.rating,
    posterUrl: movie.posterUrl,
    addedAt: new Date().toISOString()
  };

  if (!items.some((candidate) => keyFor(candidate) === keyFor(item))) {
    items.unshift(item);
  }

  data[id] = items.slice(0, 50);
  save(data);
  return data[id];
}

function removeFromWatchlist(userId, type, movieId) {
  const data = all();
  const id = String(userId);
  const before = data[id] || [];
  data[id] = before.filter((item) => !(item.type === type && String(item.id) === String(movieId)));
  save(data);
  return data[id];
}

function clearWatchlist(userId) {
  const data = all();
  data[String(userId)] = [];
  save(data);
}

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  clearWatchlist
};
