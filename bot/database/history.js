const history = [];

function addHistory(entry) {
  history.push({
    telegram_id: entry.telegram_id,
    query: entry.query,
    type: entry.type || 'movie',
    created_at: new Date().toISOString()
  });

  if (history.length > 1000) {
    history.shift();
  }
}

module.exports = {
  addHistory
};
