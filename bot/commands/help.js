const HELP_TEXT = [
  '*Movie Companion Bot*',
  '',
  'Command:',
  '/movie judul \\- cari movie, anime, TV series, atau drakor',
  '/ai deskripsi \\- cari film dengan bahasa natural memakai AI',
  '/watchlist \\- lihat film yang kamu simpan',
  '/recommend \\- rekomendasi personal dari watchlist',
  '/anime judul \\- cari anime dan follow episode update',
  '/myanime \\- lihat anime yang kamu follow',
  '/trending \\- lihat trending movie, TV, dan anime',
  '/help \\- tampilkan bantuan',
  '',
  'AI akan mengikuti bahasa yang kamu pakai',
  '',
  'Contoh:',
  '`/movie interstellar`',
  '`/ai film alien sedih luar angkasa`',
  '`/ai best comedy movies of all time`'
].join('\n');

function registerHelpCommand(bot) {
  bot.start((ctx) => ctx.replyWithMarkdownV2(HELP_TEXT));
  bot.help((ctx) => ctx.replyWithMarkdownV2(HELP_TEXT));
}

module.exports = registerHelpCommand;
