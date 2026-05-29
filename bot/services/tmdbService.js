const tmdbClient = require('../integrations/tmdbClient');
const cache = require('../cache/memoryCache');

const CACHE_TTL = 1000 * 60 * 60;
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_LANGUAGE = 'id-ID';
const MOVIE_GENRES = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  science_fiction: 878,
  thriller: 53,
  war: 10752,
  western: 37
};
const TV_GENRES = {
  action: 10759,
  adventure: 10759,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 10765,
  kids: 10762,
  mystery: 9648,
  romance: 18,
  'sci-fi': 10765,
  science_fiction: 10765,
  thriller: 9648,
  war: 10768,
  western: 37
};

function posterUrl(path) {
  return path ? `${POSTER_BASE_URL}${path}` : null;
}

function isAnime(item) {
  const originCountries = item.origin_country || [];
  const language = item.original_language;
  return language === 'ja' || originCountries.includes('JP');
}

function normalizeSearchResult(item) {
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  return {
    id: item.id,
    type,
    title: item.title || item.name || item.original_title || item.original_name,
    originalTitle: item.original_title || item.original_name,
    releaseDate: item.release_date || item.first_air_date || '',
    posterPath: item.poster_path,
    overview: item.overview || '',
    rating: item.vote_average || 0,
    popularity: item.popularity || 0,
    isAnime: isAnime(item)
  };
}

async function search(query) {
  const cacheKey = `tmdb:search:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await tmdbClient.get('/search/multi', {
    query,
    include_adult: false,
    language: TMDB_LANGUAGE,
    page: 1
  });

  const results = (data.results || [])
    .filter((item) => ['movie', 'tv'].includes(item.media_type))
    .map(normalizeSearchResult)
    .sort((a, b) => b.popularity - a.popularity);

  cache.set(cacheKey, results, CACHE_TTL);
  return results;
}

function sortValue(sortBy) {
  const normalized = String(sortBy || '').toLowerCase();

  if (['top_rated', 'rating', 'best', 'highest_rated'].includes(normalized)) {
    return 'vote_average.desc';
  }

  if (['newest', 'latest', 'recent'].includes(normalized)) {
    return 'primary_release_date.desc';
  }

  if (['oldest', 'classic'].includes(normalized)) {
    return 'primary_release_date.asc';
  }

  return 'popularity.desc';
}

function genreIdFor(mediaType, genre) {
  if (!genre) return null;
  const key = String(genre).toLowerCase().replace(/\s+/g, '_');
  const genres = mediaType === 'tv' ? TV_GENRES : MOVIE_GENRES;
  return genres[key] || null;
}

async function resolveKeywordIds(keywords = []) {
  const ids = [];

  for (const keyword of keywords.slice(0, 5)) {
    const normalized = String(keyword || '').trim().toLowerCase();
    if (!normalized) continue;

    const cacheKey = `tmdb:keyword:${normalized}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      ids.push(cached);
      continue;
    }

    const data = await tmdbClient.get('/search/keyword', {
      query: normalized,
      page: 1
    });
    const match = (data.results || []).find((item) => (
      item.name?.toLowerCase() === normalized
    )) || data.results?.[0];

    if (match?.id) {
      cache.set(cacheKey, match.id, CACHE_TTL);
      ids.push(match.id);
    }
  }

  return ids;
}

async function discover(options = {}) {
  const mediaType = options.mediaType === 'tv' ? 'tv' : 'movie';
  const cacheKey = `tmdb:discover:${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const params = {
    language: TMDB_LANGUAGE,
    include_adult: false,
    page: 1,
    sort_by: sortValue(options.sortBy),
    'vote_count.gte': options.sortBy === 'top_rated' ? 2000 : 50
  };
  const genreId = genreIdFor(mediaType, options.genre);
  const keywordIds = await resolveKeywordIds(options.keywords || []);

  if (genreId) params.with_genres = genreId;
  if (keywordIds.length) params.with_keywords = keywordIds.join('|');
  if (options.country) params.with_origin_country = String(options.country).toUpperCase();
  if (options.year) {
    const yearKey = mediaType === 'tv' ? 'first_air_date_year' : 'primary_release_year';
    params[yearKey] = options.year;
  }

  const data = await tmdbClient.get(`/discover/${mediaType}`, params);
  const results = (data.results || [])
    .map((item) => normalizeSearchResult({ ...item, media_type: mediaType }))
    .filter((item) => item.posterPath && item.overview)
    .slice(0, 10);

  cache.set(cacheKey, results, CACHE_TTL);
  return results;
}

async function getDetails(id, type = 'movie') {
  const mediaType = type === 'tv' ? 'tv' : 'movie';
  const cacheKey = `tmdb:detail:${mediaType}:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await tmdbClient.get(`/${mediaType}/${id}`, {
    append_to_response: 'videos,similar,recommendations',
    language: TMDB_LANGUAGE
  });

  const trailer = (data.videos?.results || []).find((video) => (
    video.site === 'YouTube' && ['Trailer', 'Teaser'].includes(video.type)
  ));

  const similar = [
    ...(data.similar?.results || []),
    ...(data.recommendations?.results || [])
  ]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 8)
    .map(normalizeSearchResult);

  const details = {
    id: data.id,
    type: mediaType,
    title: data.title || data.name || data.original_title || data.original_name,
    originalTitle: data.original_title || data.original_name,
    releaseDate: data.release_date || data.first_air_date || '',
    genres: (data.genres || []).map((genre) => genre.name),
    rating: data.vote_average || 0,
    overview: data.overview || '',
    runtime: data.runtime || (data.episode_run_time || [])[0] || null,
    posterUrl: posterUrl(data.poster_path),
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    similar
  };

  cache.set(cacheKey, details, CACHE_TTL);
  return details;
}

async function getDetailedSimilar(movie, limit = 5) {
  const candidates = (movie.similar || []).slice(0, limit);
  const detailed = await Promise.all(candidates.map(async (item) => {
    try {
      return getDetails(item.id, item.type);
    } catch {
      return item;
    }
  }));

  return detailed.filter(Boolean);
}

async function getTrending() {
  const cacheKey = 'tmdb:trending';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const [movies, tv, anime] = await Promise.all([
    tmdbClient.get('/trending/movie/day', { language: TMDB_LANGUAGE }),
    tmdbClient.get('/trending/tv/day', { language: TMDB_LANGUAGE }),
    tmdbClient.get('/discover/tv', {
      language: TMDB_LANGUAGE,
      sort_by: 'popularity.desc',
      with_original_language: 'ja',
      with_origin_country: 'JP',
      page: 1
    })
  ]);

  const movieResults = (movies.results || []).slice(0, 8).map((item) => normalizeSearchResult({ ...item, media_type: 'movie' }));
  const tvResults = (tv.results || []).slice(0, 8).map((item) => normalizeSearchResult({ ...item, media_type: 'tv' }));
  const animeResults = (anime.results || []).slice(0, 8).map((item) => normalizeSearchResult({ ...item, media_type: 'tv' }));

  const payload = {
    movies: movieResults,
    tv: tvResults,
    anime: animeResults
  };

  cache.set(cacheKey, payload, 1000 * 60 * 60 * 12);
  return payload;
}

module.exports = {
  search,
  discover,
  getDetails,
  getDetailedSimilar,
  getTrending
};
