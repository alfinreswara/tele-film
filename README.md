# Movie Companion Telegram Bot

Phase 1 MVP sesuai PRD: bot Telegram untuk mencari film, anime, TV series, subtitle, trailer, rekomendasi mirip, dan trending.

## Fitur

- `/movie <judul>` mencari film/series/anime via TMDB.
- `/ai <deskripsi>` memahami pencarian natural language dengan OpenAI lalu mencari hasil lewat TMDB.
- Inline button `Subtitle`, `Trailer`, dan `Similar`.
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

## Command

```txt
/movie interstellar
/ai film alien sedih luar angkasa
/trending
/help
```

## Catatan API

- TMDB dipakai untuk search, detail, trailer, similar, dan trending.
- OpenSubtitles dipakai untuk mencari subtitle dan mendapatkan link download.
- Gemini/OpenAI dipakai hanya untuk memahami maksud pencarian user, bukan sebagai database film.
- Bot tidak menyediakan streaming atau konten ilegal.
