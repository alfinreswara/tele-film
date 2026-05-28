const users = new Map();

function upsertUser(from = {}) {
  if (!from.id) return null;

  const existing = users.get(from.id);
  const user = {
    telegram_id: from.id,
    username: from.username || '',
    first_name: from.first_name || '',
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  users.set(from.id, user);
  return user;
}

module.exports = {
  upsertUser
};
