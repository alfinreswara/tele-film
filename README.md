# Movie Companion Telegram Bot

Movie Companion Telegram Bot sesuai PRD: bot Telegram untuk mencari film, anime, TV series, subtitle, trailer, rekomendasi mirip, AI search, watchlist, dan anime tracker.

## Fitur

- `/movie <judul>` mencari film/series/anime via TMDB.
- `/ai <deskripsi>` memahami pencarian natural language dengan Gemini/OpenAI, lalu fallback ke pencocokan lokal jika provider belum siap.
- Inline button `Subtitle`, `Trailer`, `Similar`, `Save`, dan `Follow Anime`.
- `/watchlist` menampilkan film yang disimpan user.
- `/recommend` memberi rekomendasi personal dari watchlist/riwayat.
- `/anime <judul>` mencari anime dan menyediakan tombol follow.
- `/myanime` menampilkan anime yang difollow.
- Scheduler mengecek update episode anime secara berkala.
- `/trending` menampilkan trending movie, TV, dan anime.
- `/help` menampilkan daftar command.
- Rate limit 5 request per 10 detik.
- API key dibaca dari `.env`.
- Error handling untuk API gagal, timeout, query kosong, dan hasil tidak ditemukan.

## Setup

```bash
npm install
cp .env.example .env
```

Isi `.env`:

```env
BOT_TOKEN=token_bot_telegram
ADMIN_TELEGRAM_IDS=6214249890
TMDB_API_KEY=api_key_tmdb
OPENSUBTITLES_API_KEY=api_key_opensubtitles
OPENAI_API_KEY=api_key_openai
OPENAI_MODEL=gpt-5.4-nano
AI_PROVIDER=gemini
GEMINI_API_KEY=api_key_gemini
GEMINI_MODEL=gemini-2.5-flash-lite
AI_DAILY_LIMIT=3
OPENSUBTITLES_USER_AGENT=MovieCompanionBot v1.0
```

Jalankan:

```bash
npm start
```

Dengan PM2:

```bash
pm2 start bot/bot.js --name movie-companion-bot
```

Atau pakai ecosystem config:

```bash
pm2 start ecosystem.config.js
```

## Command

```txt
/movie interstellar
/ai film alien sedih luar angkasa
/watchlist
/recommend
/anime one piece
/myanime
/trending
/help
```

## Catatan API

- TMDB dipakai untuk search, detail, trailer, similar, dan trending.
- OpenSubtitles dipakai untuk mencari subtitle dan mendapatkan link download.
- Gemini/OpenAI dipakai hanya untuk memahami maksud pencarian user, bukan sebagai database film. Jika provider belum siap, `/ai` memakai fallback pencocokan lokal.
- Data watchlist dan anime follow disimpan lokal di `bot/data/*.json`.
- Bot tidak menyediakan streaming atau konten ilegal.
