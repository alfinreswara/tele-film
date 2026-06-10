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

function parseJson(raw = "") {
  const text = String(raw).trim();
  const candidates = [text];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced?.[1]) {
    candidates.push(fenced[1].trim());
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start !== -1 && end > start) {
    candidates.push(text.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next normalized candidate.
    }
  }

  return {};
}

function detectResponseLanguage(query) {
  return /\b(best|movie|movies|sad|space|school|war|romance|zombie|desert|comedy|weather|recipe|coding|python|stock|news|math|flight|hotel)\b/i.test(query)
    ? 'en'
    : 'id';
}

const MOVIE_TOPIC_PATTERNS = [
  /\b(film|movie|movies|cinema|bioskop|tv|series|serial|anime|drakor|k-drama|kdrama|sitcom|documentary|documenter)\b/i,
  /\b(actor|actress|aktor|aktris|sutradara|director|cast|pemeran|trailer|subtitle|sinopsis|plot|ending|episode|season)\b/i,
  /\b(action|adventure|animation|comedy|drama|fantasy|horror|mystery|romance|sci-fi|thriller|war|zombie|alien|school|desert|space)\b/i,
  /\b(rekomendasi|recommend|recommendation|terbaik|populer|rating|tontonan|nonton|watch|watchlist)\b/i
];

const OFF_TOPIC_PATTERNS = [
  /\b(coding|programming|javascript|python|php|html|css|bug|error|source code|ngoding)\b/i,
  /\b(resep|masak|makanan|minuman|recipe|cook|cooking|restaurant|restoran)\b/i,
  /\b(cuaca|weather|hujan|panas|suhu|forecast)\b/i,
  /\b(crypto|bitcoin|saham|stock|forex|investasi|trading|harga emas|price)\b/i,
  /\b(matematika|math|aljabar|calculus|fisika|kimia|biologi|homework|tugas sekolah)\b/i,
  /\b(berita|news|politik|election|presiden|gubernur|hukum|legal)\b/i,
  /\b(doa|jadwal sholat|shalat|agama|ceramah|khutbah)\b/i,
  /\b(hotel|tiket pesawat|flight|travel|wisata|rute|maps|alamat)\b/i,
  /\b(cara|tutorial|buatkan|bikin|tulis|translate|terjemahkan|ringkas|summarize|explain|jelaskan|apa itu|siapa|kapan|dimana)\b/i,
  /\b(lagu|song|lyrics|lirik|chord|playlist)\b/i
];

function hasMovieTopicSignal(query) {
  return MOVIE_TOPIC_PATTERNS.some((pattern) => pattern.test(query));
}

function isOffTopicQuery(query) {
  if (hasMovieTopicSignal(query)) return false;
  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(query));
}

function offTopicReason(responseLanguage) {
  return responseLanguage === 'en'
    ? 'AI Search is only for movie, TV series, and anime requests. Please ask about titles, genres, moods, trailers, subtitles, or viewing recommendations.'
    : 'AI Search hanya untuk pencarian film, TV series, dan anime. Gunakan untuk judul, genre, mood, trailer, subtitle, atau rekomendasi tontonan.';
}

function buildOffTopicIntent(userQuery) {
  const cleanedQuery = sanitizeQuery(userQuery);
  const responseLanguage = detectResponseLanguage(cleanedQuery);

  return {
    configured: isConfigured(),
    mode: 'off_topic',
    searchQuery: cleanedQuery,
    mediaType: 'any',
    genre: '',
    keywords: [],
    sortBy: 'popular',
    country: '',
    responseLanguage,
    reason: offTopicReason(responseLanguage)
  };
}

function detectOffTopicQuery(userQuery) {
  return isOffTopicQuery(userQuery) ? buildOffTopicIntent(userQuery) : null;
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

  if (/(indonesia|film lokal|film nasional|lokal indonesia)/i.test(lowered)) {
    next.mode = "discover";
    next.country = next.country || "ID";
    next.reason = next.responseLanguage === "en"
      ? "The user is looking for Indonesian movies, so the search is focused on Indonesian-origin titles."
      : "Pengguna mencari film Indonesia, jadi pencarian difokuskan ke judul asal Indonesia.";
  }

  if (/(korea|korean|drakor|k-drama|kdrama)/i.test(lowered)) {
    next.mode = "discover";
    next.country = next.country || "KR";
    next.mediaType = /drakor|k-drama|kdrama/i.test(lowered) ? "tv" : next.mediaType;
    next.reason = next.responseLanguage === "en"
      ? "The user is looking for Korean titles, so the search is focused on Korean-origin results."
      : "Pengguna mencari judul Korea, jadi pencarian difokuskan ke hasil asal Korea.";
  }

  if (/(jepang|japanese|anime)/i.test(lowered)) {
    next.mode = "discover";
    next.country = next.country || "JP";
  }

  return next;
}

function hasSpecificDiscoverSignal(intent) {
  return Boolean(intent.genre || intent.country || intent.keywords?.length);
}

function fallbackReason(responseLanguage, providerConfigured) {
  if (responseLanguage === "en") {
    return providerConfigured
      ? "AI provider is unavailable, so the bot uses local query matching."
      : "AI provider is not configured yet, so the bot uses local query matching.";
  }

  return providerConfigured
    ? "Provider AI sedang bermasalah, jadi bot memakai pencocokan query lokal."
    : "Provider AI belum dikonfigurasi, jadi bot memakai pencocokan query lokal.";
}

function buildFallbackIntent(userQuery, reason = "", options = {}) {
  const cleanedQuery = sanitizeQuery(userQuery);
  const responseLanguage = detectResponseLanguage(cleanedQuery);
  const providerConfigured = options.providerConfigured ?? isConfigured();
  const intent = {
    configured: providerConfigured,
    providerFallback: true,
    mode: "search",
    searchQuery: cleanedQuery,
    mediaType: "movie",
    genre: "",
    keywords: [],
    sortBy: "popular",
    country: "",
    responseLanguage,
    reason: reason || fallbackReason(responseLanguage, providerConfigured)
  };

  return inferLocalIntent(cleanedQuery, intent);
}

async function understandMovieQuery(userQuery) {
  const cleanedQuery = sanitizeQuery(userQuery);
  const offTopicIntent = detectOffTopicQuery(cleanedQuery);

  if (offTopicIntent) {
    return offTopicIntent;
  }

  if (!isConfigured()) {
    return buildFallbackIntent(cleanedQuery, "", { providerConfigured: false });
  }

  const instructions = [
    'Kamu membantu Telegram bot film memahami pencarian user dalam berbagai bahasa.',
    'Balas hanya JSON valid.',
    'Tugasmu mengubah deskripsi bebas menjadi intent pencarian TMDB.',
    'Deteksi bahasa utama user dari query.',
    'Field reason wajib memakai bahasa yang sama dengan query user.',
    'Jika user menyebut judul spesifik, gunakan mode search.',
    'Jika query tidak berhubungan dengan film, TV series, anime, aktor, sutradara, genre, trailer, subtitle, atau rekomendasi tontonan, gunakan mode off_topic.',
    'Jika user meminta kategori seperti terbaik, rating tertinggi, populer, komedi terbaik, film Indonesia, gunakan mode discover.',
    'Jangan pernah memakai mode discover jika genre, keywords, dan country semuanya kosong.',
    'Jika maksud user tidak jelas, pakai mode search dengan searchQuery dari kata inti user.',
    'searchQuery harus mengikuti maksud user, jangan terlalu umum. Contoh: "film padang gurun" => searchQuery "desert movie", bukan "popular movies".',
    'Gunakan genre bahasa Inggris kecil: action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, horror, mystery, romance, sci-fi, thriller, war.',
    'Gunakan keywords TMDB bahasa Inggris untuk tema spesifik, contoh sekolah = ["school","high school","student","coming of age"], mood bagus = ["feel good","friendship"], anime sekolah = ["school","anime"].',
    'Gunakan country ISO-3166 jika disebut, contoh Indonesia = ID, Jepang = JP, Korea = KR.',
    'Gunakan sortBy: top_rated, popular, newest, oldest.',
    'Schema: {"mode":"search|discover|off_topic","searchQuery":"string","mediaType":"movie|tv|any","genre":"string","keywords":["string"],"sortBy":"popular|top_rated|newest|oldest","country":"string","responseLanguage":"id|en|other","reason":"string"}',
    `User query: ${cleanedQuery}`
  ].join('\n');

  let raw;

  try {
    raw = env.aiProvider === 'gemini'
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
  } catch {
    return buildFallbackIntent(cleanedQuery);
  }

  const parsed = parseJson(raw);
  const searchQuery = sanitizeQuery(parsed.searchQuery || cleanedQuery);

  const intent = {
    configured: true,
    mode: ['search', 'discover', 'off_topic'].includes(parsed.mode) ? parsed.mode : 'search',
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

  if (intent.mode === 'off_topic') {
    return {
      ...intent,
      reason: intent.reason || offTopicReason(intent.responseLanguage)
    };
  }

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
  detectOffTopicQuery,
  understandMovieQuery,
  hasSpecificDiscoverSignal,
  buildFallbackIntent
};
