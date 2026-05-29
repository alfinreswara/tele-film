const history = [];

function addHistory(entry) {
  history.push({
    telegram_id: entry.telegram_id,
    id: entry.id,
    title: entry.title,
    query: entry.query,
    type: entry.type || 'movie',
    created_at: new Date().toISOString()
  });

  if (history.length > 1000) {
    history.shift();
  }
}

function getUserHistory(userId) {
  return history
    .filter((item) => String(item.telegram_id) === String(userId) && item.id)
    .slice(-20)
    .reverse();
}

module.exports = {
  addHistory,
  getUserHistory
};
