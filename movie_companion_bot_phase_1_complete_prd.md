# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Movie Companion Telegram Bot — Phase 1 MVP

Version: 1.0
Status: Draft
Target Platform: Telegram
Primary Tech Stack: Node.js + Telegraf
Author: OpenAI

---

# 1. Executive Summary

Movie Companion Bot adalah Telegram bot yang membantu user mencari informasi film, anime, TV series, dan subtitle dengan cepat langsung dari Telegram.

Bot difokuskan untuk:
- mobile-first usage,
- response cepat,
- UX sederhana,
- ringan di VPS murah,
- scalable untuk future monetization.

Bot bukan platform streaming ilegal.
Bot bertindak sebagai:
- movie discovery tool,
- subtitle finder,
- anime companion,
- recommendation assistant.

---

# 2. Product Vision

Membangun:

"All-in-One Telegram Movie & Anime Companion"

yang dapat digunakan user Telegram untuk:
- mencari film,
- melihat info,
- mencari subtitle,
- menemukan anime baru,
- dan mendapatkan rekomendasi.

---

# 3. Product Goals

## Primary Goals

### G1 — Fast Movie Search
User dapat menemukan informasi film kurang dari 3 detik.

### G2 — Easy Subtitle Access
Subtitle mudah ditemukan tanpa membuka website lain.

### G3 — Mobile Friendly UX
Seluruh experience nyaman digunakan di Telegram mobile.

### G4 — Retention Ready
Fondasi dibuat agar mudah ditambah:
- notification,
- favorites,
- AI recommendation,
- premium feature.

---

# 4. Success Metrics

## Technical KPI

| Metric | Target |
|---|---|
| Average Response Time | < 3s |
| API Failure Rate | < 5% |
| Bot Uptime | 99% |
| Memory Usage | < 500MB |

---

## Product KPI

| Metric | Target |
|---|---|
| Daily Active User | 100+ |
| Returning Users | 30% |
| Subtitle Searches/day | 500+ |
| Trending Command Usage | 50+/day |

---

# 5. User Personas

## Persona 1 — Anime Watcher

### Description
User Telegram yang sering mencari anime dan subtitle Indonesia.

### Needs
- subtitle cepat,
- episode info,
- anime recommendation.

---

## Persona 2 — Movie Casual User

### Description
User yang ingin cepat mencari:
- rating,
- trailer,
- subtitle.

### Needs
- UI simpel,
- tidak ribet,
- no login.

---

## Persona 3 — Telegram Downloader Community

### Description
User Telegram yang suka tools praktis.

### Needs
- fast response,
- all-in-one feature,
- lightweight usage.

---

# 6. Core Features (Phase 1)

# FEATURE 1 — Movie Search

## Description
User dapat mencari:
- movie,
- anime,
- TV series,
- drakor.

---

## Command

```txt
/movie interstellar
```

---

## API Source

TMDB API

---

## Response Data

Bot menampilkan:
- poster,
- title,
- release year,
- genre,
- rating,
- overview,
- runtime.

---

## UI Example

```txt
🎬 Interstellar (2014)

⭐ Rating: 8.7
🎭 Genre: Sci-Fi
⏱ Runtime: 169m

A team of explorers travel through a wormhole...

[Subtitle]
[Trailer]
[Similar]
```

---

## Acceptance Criteria

| Criteria | Status |
|---|---|
| Search result tampil | Required |
| Poster tampil | Required |
| Rating tampil | Required |
| Inline button aktif | Required |

---

# FEATURE 2 — Subtitle Search

## Description
User dapat mencari subtitle berdasarkan movie.

---

## Flow

```txt
/movie interstellar
↓
User klik Subtitle
↓
Bot mencari subtitle
↓
Bot mengirim file .srt
```

---

## API

OpenSubtitles API

---

## Supported Subtitle

| Language | Support |
|---|---|
| Indonesia | Yes |
| English | Yes |
| Japanese | Optional |

---

## Features

- subtitle movie,
- subtitle anime,
- subtitle episode,
- multiple result subtitle.

---

## Acceptance Criteria

| Criteria | Status |
|---|---|
| Subtitle downloadable | Required |
| Multiple result support | Required |
| Error handling | Required |

---

# FEATURE 3 — Trailer Button

## Description
Bot memberikan trailer film.

---

## Source

YouTube Search

---

## UI Example

```txt
[Watch Trailer]
```

---

## Acceptance Criteria

| Criteria | Status |
|---|---|
| Trailer button clickable | Required |
| Opens YouTube | Required |

---

# FEATURE 4 — Similar Recommendation

## Description
Bot memberikan movie recommendation berdasarkan movie yang dicari.

---

## Example

```txt
Mirip dengan Interstellar:
- Arrival
- Gravity
- The Martian
```

---

## API

TMDB Similar Endpoint

---

## Acceptance Criteria

| Criteria | Status |
|---|---|
| Recommendation muncul | Required |
| Minimal 3 hasil | Required |

---

# FEATURE 5 — Trending Movies

## Description
Menampilkan trending movie/anime.

---

## Command

```txt
/trending
```

---

## Categories

- Trending Movie
- Trending TV
- Trending Anime

---

## API

TMDB Trending API

---

## Acceptance Criteria

| Criteria | Status |
|---|---|
| Trending tampil | Required |
| Update daily | Required |

---

# FEATURE 6 — Help Menu

## Description
Menampilkan command list.

---

## Command

```txt
/help
```

---

## Acceptance Criteria

| Criteria | Status |
|---|---|
| Help tampil | Required |
| Command lengkap | Required |

---

# FEATURE 7 — Inline Navigation

## Description
Menggunakan inline keyboard untuk navigasi.

---

## Buttons

- Subtitle
- Trailer
- Similar
- Next Page
- Previous Page

---

## Acceptance Criteria

| Criteria | Status |
|---|---|
| Button responsive | Required |
| Callback berjalan | Required |

---

# 7. Future Features (NOT IN PHASE 1)

## Excluded Features

Belum termasuk:

- AI recommendation,
- AI natural language search,
- user login,
- payment system,
- admin dashboard,
- analytics dashboard,
- premium subscription,
- episode notification,
- favorites/watchlist,
- cloud storage.

---

# 8. User Journey

# Journey 1 — Search Movie

```txt
User membuka Telegram
↓
Ketik /movie interstellar
↓
Bot request ke TMDB
↓
Bot tampilkan info movie
↓
User klik subtitle
↓
Bot kirim subtitle
```

---

# Journey 2 — Browse Trending

```txt
User ketik /trending
↓
Bot tampilkan trending movie
↓
User klik movie
↓
Bot tampilkan detail movie
```

---

# 9. Functional Requirements

# FR-1 Search Movie

System harus:
- menerima query movie,
- melakukan request ke TMDB,
- mengembalikan hasil movie.

---

# FR-2 Subtitle Download

System harus:
- mencari subtitle,
- mengirim file subtitle,
- menangani subtitle kosong.

---

# FR-3 Trailer Link

System harus:
- menampilkan tombol trailer,
- membuka YouTube.

---

# FR-4 Error Handling

System harus menangani:
- API gagal,
- timeout,
- movie tidak ditemukan,
- subtitle tidak tersedia.

---

# 10. Non Functional Requirements

# NFR-1 Performance

Response target:

```txt
< 3 seconds
```

---

# NFR-2 Scalability

Backend harus modular agar mudah:
- scale,
- tambah feature,
- tambah API.

---

# NFR-3 Reliability

Bot harus:
- auto reconnect,
- survive API timeout,
- handle spam.

---

# NFR-4 Security

Bot harus:
- menyimpan API key di ENV,
- menggunakan rate limit,
- validasi input.

---

# 11. Technical Architecture

# High Level Architecture

```txt
Telegram User
      ↓
Telegram Bot
      ↓
Backend Service
      ↓
TMDB API
OpenSubtitles API
YouTube
      ↓
Response ke User
```

---

# Backend Stack

## Runtime
- Node.js

## Framework
- Telegraf.js

## HTTP Client
- Axios

## Database
- MongoDB

## Cache
- Redis (optional)

## Process Manager
- PM2

## Reverse Proxy
- Nginx

---

# 12. Folder Structure

```txt
bot/
 ├── commands/
 ├── handlers/
 ├── services/
 ├── integrations/
 ├── cache/
 ├── database/
 ├── middleware/
 ├── utils/
 ├── config/
 ├── logs/
 ├── bot.js
 ├── package.json
 └── .env
```

---

# 13. Database Design

# Collection — users

```json
{
  "telegram_id": "",
  "username": "",
  "created_at": ""
}
```

---

# Collection — history

```json
{
  "telegram_id": "",
  "query": "",
  "type": "movie",
  "created_at": ""
}
```

---

# Collection — cache

```json
{
  "key": "",
  "data": {},
  "expired_at": ""
}
```

---

# 14. API Design

# TMDB Endpoints

## Search Movie

```txt
GET /search/movie
```

---

## Trending

```txt
GET /trending/movie/day
```

---

# OpenSubtitles Endpoints

## Search Subtitle

```txt
GET /subtitles
```

---

## Download Subtitle

```txt
POST /download
```

---

# 15. Security Plan

# API Key Protection

Semua key disimpan di:

```txt
.env
```

---

# Anti Spam

Rate limit:

```txt
5 request / 10 detik
```

---

# Validation

Input user harus:
- dibersihkan,
- dicek panjang karakter,
- dicek invalid symbol.

---

# Logging

Log:
- API errors,
- crashes,
- spam detection,
- subtitle usage.

---

# 16. Deployment Plan

# Minimum VPS Spec

| Resource | Minimum |
|---|---|
| CPU | 1 Core |
| RAM | 1GB |
| Storage | 20GB |
| OS | Ubuntu 22 |

---

# Deployment Stack

- Ubuntu
- Node.js
- PM2
- Nginx
- MongoDB

---

# Deployment Steps

## 1. Clone Repository

```bash
git clone REPO_URL
```

---

## 2. Install Dependency

```bash
npm install
```

---

## 3. Configure ENV

```env
BOT_TOKEN=
TMDB_API_KEY=
SUBTITLE_API_KEY=
```

---

## 4. Start Bot

```bash
pm2 start bot.js
```

---

# 17. Monitoring

# Metrics

Track:
- active users,
- subtitle downloads,
- failed requests,
- response time.

---

# Recommended Tools

- PM2 logs
- Grafana (future)
- Uptime Kuma

---

# 18. Risks

| Risk | Solution |
|---|---|
| API limit | Add cache |
| Spam user | Add cooldown |
| VPS overload | Queue system |
| Subtitle missing | Fallback search |

---

# 19. Phase 2 Roadmap

# Planned Features

## AI Search

User:

```txt
film alien sedih luar angkasa
```

AI memahami query.

---

## Anime Episode Tracker

User dapat follow anime.

---

## Watchlist

Save favorite movie.

---

## Recommendation AI

Recommendation lebih personal.

---

## Notification System

Episode update otomatis.

---

# 20. Final Product Direction

Target akhir:

```txt
Telegram movie ecosystem bot
```

yang ringan,
cepat,
dan nyaman dipakai user mobile setiap hari.

