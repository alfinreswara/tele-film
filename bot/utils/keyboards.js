const { Markup } = require('telegraf');

function movieKeyboard(movie, navigation = null) {
  const buttons = [
    Markup.button.callback('Subtitle', `subtitle:${movie.type}:${movie.id}`),
    movie.trailerUrl
      ? Markup.button.url('Trailer', movie.trailerUrl)
      : Markup.button.callback('Trailer', `trailer:${movie.type}:${movie.id}`),
    Markup.button.callback('Similar', `similar:${movie.type}:${movie.id}`),
    Markup.button.callback('Save', `watch:add:${movie.type}:${movie.id}`)
  ];

  const rows = [buttons.slice(0, 3), buttons.slice(3)];

  if (movie.type === 'tv' && movie.isAnime) {
    rows[1].push(Markup.button.callback('Follow Anime', `anime:follow:${movie.id}`));
  }

  if (navigation) {
    const navButtons = [];

    if (navigation.hasPrevious) {
      navButtons.push(Markup.button.callback('Previous Page', `movie_page:${navigation.index - 1}`));
    }

    if (navigation.hasNext) {
      navButtons.push(Markup.button.callback('Next Page', `movie_page:${navigation.index + 1}`));
    }

    if (navButtons.length) rows.push(navButtons);
  }

  return Markup.inlineKeyboard(rows);
}

function subtitleKeyboard(results) {
  const rows = results.map((item, index) => [
    Markup.button.callback(`Download ${index + 1}`, `download_sub:${item.fileId}`)
  ]);

  return Markup.inlineKeyboard(rows);
}

function trendingKeyboard(payload) {
  const rows = [
    ...payload.movies.slice(0, 5).map((item, index) => [
      Markup.button.callback(`Movie ${index + 1}`, `detail:${item.type}:${item.id}`)
    ]),
    ...payload.tv.slice(0, 5).map((item, index) => [
      Markup.button.callback(`TV ${index + 1}`, `detail:${item.type}:${item.id}`)
    ])
  ];

  return Markup.inlineKeyboard(rows);
}

module.exports = {
  movieKeyboard,
  subtitleKeyboard,
  trendingKeyboard
};
