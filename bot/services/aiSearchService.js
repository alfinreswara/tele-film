const openaiClient = require('../integrations/openaiClient');
const geminiClient = require('../integrations/geminiClient');
const { env } = require('../config/env');
const { sanitizeQuery } = require('../utils/text');

function isConfigured() {
  if (env.aiProvider === 'gemini') {
    return geminiClient.isConfigured();
  }

  return openaiClient.isConfigured();
}

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function inferLocalIntent(query, intent) {
  const lowered = query.toLowerCase();
  const next = { ...intent };
  const wantsTopRated = /(terbaik|rating tertinggi|rating terbagus|highest rated|top rated|best)/i.test(lowered);

  function addRule({ pattern, genre, keywords = [], sortBy, mediaType = 'movie', reasonId, reasonEn }) {
    if (!pattern.test(lowered)) return;

    next.mode = 'discover';
    next.mediaType = next.mediaType === 'any' ? mediaType : next.mediaType;
    next.genre = next.genre || genre || '';
    next.sortBy = wantsTopRated ? 'top_rated' : (sortBy || next.sortBy);
    next.keywords = [
      ...new Set([...(next.keywords || []), ...keywords])
    ].slice(0, 5);

    if (!next.reason || /umum|popular|populer|general/i.test(next.reason)) {
      next.reason = next.responseLanguage === 'en' ? reasonEn : reasonId;
    }
  }

  if (/(sekolah|school|high school|kelas|kampus|college|student|pelajar|remaja)/i.test(lowered)) {
    next.mode = 'discover';
    next.mediaType = next.mediaType === 'any' ? 'movie' : next.mediaType;
    next.genre = next.genre || 'drama';
    next.sortBy = next.sortBy === 'popular' ? 'top_rated' : next.sortBy;
    next.keywords = [
      ...new Set([...(next.keywords || []), 'school', 'high school', 'student', 'coming of age'])
    ];
  }

  addRule({
    pattern: /(padang gurun|padang pasir|gurun|desert|sahara|dune)/i,
    genre: 'adventure',
    keywords: ['desert'],
    sortBy: 'popular',
    reasonId: 'Pengguna mencari film bertema padang gurun, jadi pencarian difokuskan ke keyword desert.',
    reasonEn: 'The user is looking for desert-themed movies, so the search is focused on the desert keyword.'
  });

  addRule({
    pattern: /(luar angkasa|angkasa|antariksa|alien|space|planet|galaksi|galaxy|mars|wormhole)/i,
    genre: 'sci-fi',
    keywords: ['space', 'alien'],
    sortBy: 'popular',
    reasonId: 'Pengguna mencari film bertema luar angkasa atau alien, jadi pencarian difokuskan ke sci-fi dan keyword space.',
    reasonEn: 'The user is looking for space or alien movies, so the search is focused on sci-fi and space keywords.'
  });

  addRule({
    pattern: /(sedih|nangis|bikin nangis|melankolis|galau|sad|tearjerker|depressing)/i,
    genre: 'drama',
    keywords: ['tragedy', 'loss'],
    sortBy: 'top_rated',
    reasonId: 'Pengguna mencari film bernuansa sedih, jadi pencarian difokuskan ke drama dan tema kehilangan.',
    reasonEn: 'The user is looking for sad movies, so the search is focused on drama and loss themes.'
  });

  addRule({
    pattern: /(mood|semangat|happy|bahagia|menghibur|uplifting|feel good|feel-good)/i,
    genre: 'comedy',
    keywords: ['feel good', 'friendship'],
    sortBy: 'popular',
    reasonId: 'Pengguna mencari film yang bisa memperbaiki mood, jadi pencarian difokuskan ke komedi dan feel-good.',
    reasonEn: 'The user is looking for mood-lifting movies, so the search is focused on comedy and feel-good themes.'
  });

  addRule({
    pattern: /(romantis|cinta|romance|love story|pacaran)/i,
    genre: 'romance',
    keywords: ['love', 'relationship'],
    sortBy: 'popular',
    reasonId: 'Pengguna mencari film romantis, jadi pencarian difokuskan ke genre romance.',
    reasonEn: 'The user is looking for romantic movies, so the search is focused on romance.'
  });

  addRule({
    pattern: /(zombie|mayat hidup|undead)/i,
    genre: 'horror',
    keywords: ['zombie'],
    sortBy: 'popular',
    reasonId: 'Pengguna mencari film zombie, jadi pencarian difokuskan ke horror dan keyword zombie.',
    reasonEn: 'The user is looking for zombie movies, so the search is focused on horror and zombie keywords.'
  });

  addRule({
    pattern: /(perang|militer|tentara|war|military|soldier)/i,
    genre: 'war',
    keywords: ['war', 'soldier'],
    sortBy: 'top_rated',
    reasonId: 'Pengguna mencari film perang, jadi pencarian difokuskan ke genre war.',
    reasonEn: 'The user is looking for war movies, so the search is focused on the war genre.'
  });

  addRule({
    pattern: /(detektif|misteri|investigasi|detective|mystery|investigation|crime)/i,
    genre: 'mystery',
    keywords: ['detective', 'investigation'],
    sortBy: 'popular',
    reasonId: 'Pengguna mencari film misteri atau detektif, jadi pencarian difokuskan ke mystery dan investigasi.',
    reasonEn: 'The user is looking for mystery or detective movies, so the search is focused on mystery and investigation.'
  });

  addRule({
    pattern: /(anime)/i,
    genre: next.genre,
    keywords: ['anime'],
    mediaType: 'tv',
    reasonId: 'Pengguna mencari anime, jadi pencarian difokuskan ke TV/anime.',
    reasonEn: 'The user is looking for anime, so the search is focused on TV/anime.'
  });

  return next;
}

function hasSpecificDiscoverSignal(intent) {
  return Boolean(intent.genre || intent.country || intent.keywords?.length);
}

async function understandMovieQuery(userQuery) {
  const cleanedQuery = sanitizeQuery(userQuery);

  if (!isConfigured()) {
    return {
      configured: false,
      searchQuery: cleanedQuery,
      note: 'AI provider belum dikonfigurasi.'
    };
  }

  const instructions = [
    'Kamu membantu Telegram bot film memahami pencarian user dalam berbagai bahasa.',
    'Balas hanya JSON valid.',
    'Tugasmu mengubah deskripsi bebas menjadi intent pencarian TMDB.',
    'Deteksi bahasa utama user dari query.',
    'Field reason wajib memakai bahasa yang sama dengan query user.',
    'Jika user menyebut judul spesifik, gunakan mode search.',
    'Jika user meminta kategori seperti terbaik, rating tertinggi, populer, komedi terbaik, film Indonesia, gunakan mode discover.',
    'Jangan pernah memakai mode discover jika genre, keywords, dan country semuanya kosong.',
    'Jika maksud user tidak jelas, pakai mode search dengan searchQuery dari kata inti user.',
    'searchQuery harus mengikuti maksud user, jangan terlalu umum. Contoh: "film padang gurun" => searchQuery "desert movie", bukan "popular movies".',
    'Gunakan genre bahasa Inggris kecil: action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, horror, mystery, romance, sci-fi, thriller, war.',
    'Gunakan keywords TMDB bahasa Inggris untuk tema spesifik, contoh sekolah = ["school","high school","student","coming of age"], mood bagus = ["feel good","friendship"], anime sekolah = ["school","anime"].',
    'Gunakan country ISO-3166 jika disebut, contoh Indonesia = ID, Jepang = JP, Korea = KR.',
    'Gunakan sortBy: top_rated, popular, newest, oldest.',
    'Schema: {"mode":"search|discover","searchQuery":"string","mediaType":"movie|tv|any","genre":"string","keywords":["string"],"sortBy":"popular|top_rated|newest|oldest","country":"string","responseLanguage":"id|en|other","reason":"string"}',
    `User query: ${cleanedQuery}`
  ].join('\n');

  const raw = env.aiProvider === 'gemini'
    ? await geminiClient.generateJson(instructions)
    : await openaiClient.createChatCompletion([
      {
        role: 'system',
        content: instructions
      },
      {
        role: 'user',
        content: cleanedQuery
      }
    ]);

  const parsed = parseJson(raw);
  const searchQuery = sanitizeQuery(parsed.searchQuery || cleanedQuery);

  const intent = {
    configured: true,
    mode: ['search', 'discover'].includes(parsed.mode) ? parsed.mode : 'search',
    searchQuery: searchQuery || cleanedQuery,
    mediaType: ['movie', 'tv', 'any'].includes(parsed.mediaType) ? parsed.mediaType : 'any',
    genre: sanitizeQuery(parsed.genre || ''),
    keywords: Array.isArray(parsed.keywords)
      ? parsed.keywords.map((keyword) => sanitizeQuery(keyword)).filter(Boolean).slice(0, 5)
      : [],
    sortBy: ['popular', 'top_rated', 'newest', 'oldest'].includes(parsed.sortBy) ? parsed.sortBy : 'popular',
    country: sanitizeQuery(parsed.country || '').toUpperCase(),
    responseLanguage: sanitizeQuery(parsed.responseLanguage || 'id').toLowerCase(),
    reason: sanitizeQuery(parsed.reason || '', 240)
  };

  const inferred = inferLocalIntent(cleanedQuery, intent);

  if (inferred.mode === 'discover' && !hasSpecificDiscoverSignal(inferred)) {
    return {
      ...inferred,
      mode: 'search',
      searchQuery: inferred.searchQuery || cleanedQuery,
      reason: inferred.responseLanguage === 'en'
        ? 'The query is not specific enough for TMDB discover, so the bot uses direct search terms.'
        : 'Query belum cukup spesifik untuk TMDB discover, jadi bot memakai kata pencarian langsung.'
    };
  }

  return inferred;
}

module.exports = {
  isConfigured,
  understandMovieQuery,
  hasSpecificDiscoverSignal
};
