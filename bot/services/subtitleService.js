const openSubtitles = require('../integrations/openSubtitlesClient');
const { env } = require('../config/env');

async function searchSubtitles({ title, year, type }) {
  if (!openSubtitles.isConfigured()) {
    return {
      configured: false,
      results: []
    };
  }

  const data = await openSubtitles.get('/subtitles', {
    query: title,
    languages: env.defaultSubtitleLanguage,
    type: type === 'tv' ? 'episode' : 'movie',
    year
  });

  const results = (data.data || []).slice(0, 5).map((item) => {
    const file = item.attributes?.files?.[0] || {};
    return {
      id: item.id,
      fileId: file.file_id,
      fileName: file.file_name || `${title}.srt`,
      language: item.attributes?.language,
      downloads: item.attributes?.download_count || 0,
      release: item.attributes?.release || '',
      hearingImpaired: item.attributes?.hearing_impaired || false
    };
  }).filter((item) => item.fileId);

  return {
    configured: true,
    results
  };
}

async function getDownloadLink(fileId) {
  const data = await openSubtitles.post('/download', {
    file_id: fileId
  });

  return data.link;
}

module.exports = {
  searchSubtitles,
  getDownloadLink
};
