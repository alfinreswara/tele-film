const { escapeMarkdown, truncate, yearFromDate } = require('./text');

function rating(value) {
  return Number(value || 0).toFixed(1);
}

function formatMovieCaption(movie) {
  const year = yearFromDate(movie.releaseDate);
  const genres = movie.genres?.length ? movie.genres.slice(0, 3).join(', ') : 'N/A';
  const runtime = movie.runtime ? `${movie.runtime}m` : 'N/A';

  return [
    `🎬 *${escapeMarkdown(movie.title)}* \\(${escapeMarkdown(year)}\\)`,
    '',
    `⭐ Rating: ${escapeMarkdown(rating(movie.rating))}`,
    `🎭 Genre: ${escapeMarkdown(genres)}`,
    `⏱ Durasi: ${escapeMarkdown(runtime)}`,
    '',
    escapeMarkdown(truncate(movie.overview))
  ].join('\n');
}

function formatTrendingList(title, items) {
  if (!items.length) return `*${escapeMarkdown(title)}*\nBelum ada hasil.`;

  const rows = items.slice(0, 8).map((item, index) => {
    const year = yearFromDate(item.releaseDate);
    return `${index + 1}\\. ${escapeMarkdown(item.title)} \\(${escapeMarkdown(year)}\\)`;
  });

  return [`*${escapeMarkdown(title)}*`, ...rows].join('\n');
}

function formatSimilar(movie) {
  if (!movie.similar?.length) {
    return `Belum ada rekomendasi mirip untuk ${movie.title}.`;
  }

  const sourceGenres = new Set((movie.genres || []).map((genre) => genre.toLowerCase()));
  const rows = movie.similar.slice(0, 5).map((item, index) => {
    const year = yearFromDate(item.releaseDate);
    const itemGenres = item.genres?.length ? item.genres.slice(0, 3) : [];
    const sharedGenres = itemGenres.filter((genre) => sourceGenres.has(genre.toLowerCase()));
    const genreText = itemGenres.length ? itemGenres.join(', ') : 'Genre belum tersedia';
    const reason = sharedGenres.length
      ? `Nuansanya dekat karena sama\\-sama ${escapeMarkdown(sharedGenres.slice(0, 2).join(' dan '))}\\.`
      : `Masuk daftar rekomendasi TMDB untuk penonton ${escapeMarkdown(movie.title)}\\.`;
    const overview = truncate(item.overview || '', 150);

    return [
      `*${index + 1}\\. ${escapeMarkdown(item.title)}* \\(${escapeMarkdown(year)}\\)`,
      `⭐ ${escapeMarkdown(rating(item.rating))}  •  ${escapeMarkdown(genreText)}`,
      `${reason}`,
      `${escapeMarkdown(overview)}`
    ].join('\n');
  });

  return [
    `*Rekomendasi mirip ${escapeMarkdown(movie.title)}*`,
    `Dipilih dari similar/recommendation TMDB, diurutkan untuk rasa cerita yang paling dekat\\.`,
    '',
    ...rows
  ].join('\n\n');
}

function formatSubtitleResults(movie, subtitles) {
  if (!subtitles.configured) {
    return 'OpenSubtitles belum dikonfigurasi. Isi OPENSUBTITLES_API_KEY di .env untuk mengaktifkan fitur subtitle.';
  }

  if (!subtitles.results.length) {
    return `Subtitle untuk ${movie.title} belum tersedia.`;
  }

  const rows = subtitles.results.map((item, index) => (
    `${index + 1}. ${item.fileName} (${item.language || 'N/A'})`
  ));

  return [`Subtitle tersedia untuk ${movie.title}:`, ...rows].join('\n');
}

module.exports = {
  formatMovieCaption,
  formatTrendingList,
  formatSimilar,
  formatSubtitleResults
};
