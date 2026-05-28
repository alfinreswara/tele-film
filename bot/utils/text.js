function sanitizeQuery(input = '', max = 120) {
  return input
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function escapeMarkdown(text = '') {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function yearFromDate(date = '') {
  return date ? date.slice(0, 4) : 'N/A';
}

function truncate(text = '', max = 650) {
  if (!text) return 'Deskripsi belum tersedia.';
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

module.exports = {
  sanitizeQuery,
  escapeMarkdown,
  yearFromDate,
  truncate
};
