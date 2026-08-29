<div align="center">

# 🎬 Sofa Syndicate

### A shared cinema for the people you watch with.

Track what you're watching, rate it your own way, and keep every space — family movie nights, the friend-group chat, your anime club — completely separate.

<br />

[![Made with React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-3457D5?style=flat-square)](#)
[![Backend](https://img.shields.io/badge/Backend-Node%20%2B%20Postgres-1B2030?style=flat-square)](#)
[![Styled with Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-E8B23D?style=flat-square)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-10131C?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-8B93A6?style=flat-square)](#license)

</div>

<br />

---

## ✨ What is this?

Most watchlists are one flat, shared spreadsheet — everyone's opinions mashed into the same column. **Sofa Syndicate** isn't that.

You create **spaces** — isolated rooms with their own members, their own list, and their own ratings. Your rating of a comfort-watch sitcom with your family doesn't have to be the same number you'd give it among film-snob friends. One title, tracked independently everywhere you and the people you watch with actually talk about it.

Every title on the list renders as a **ticket stub** — poster on one side, a perforated divider, your watch status on the other. Tick it off, and the stub gets stamped, gold ink and all.

<br />

## 🪧 Features

| | |
|---|---|
| 🔐 **Real auth** | Email/password or Google sign-in — no shared passwords, no guest links. |
| 🎟️ **Isolated spaces** | Create or join rooms with owner / admin / member roles. Your data in one space never bleeds into another. |
| 🍿 **One-search adding** | Type a title, pick the right poster from TMDb & MyAnimeList, done — no manual metadata entry. |
| ✅ **Per-person watched status** | Everyone in a space ticks off what *they've* seen, independently. |
| ⭐ **Optional 1–10 ratings** | Rate it or don't — watched and rated are related but separate. Change your mind any time — ratings can be cleared, not just overwritten. |
| 👥 **See who rated what** | Every member's individual rating is visible on the title itself, not just a group average — hover the pill row on desktop, or open the full per-member breakdown on mobile. |
| 📊 **Average + rating count** | Each title shows the group's average score alongside how many people actually rated it, so a 9/10 from one person reads differently than a 9/10 from four. |
| 🎡 **Reel-style mobile rating** | Rating on mobile is a drag-to-rate film-reel picker, not a row of ten tiny buttons — built for touch, not adapted from desktop. |
| ⚡ **Instant feedback** | Marking watched or rating a title updates the screen immediately, not after a network round trip. |
| 🔍 **Search & filter** | By type (movie / series / anime), language, rating, or watched status. |
| 📱 **Actually good on mobile** | Real 44px+ tap targets, a bottom-sheet add flow, no accidental swipe-gesture conflicts, full feature parity with desktop — not a stripped-down view. |
| 📲 **Installable app** | Add it to your home screen and it opens standalone, no browser chrome — with offline-ready app shell caching and an update-available prompt when a new version ships. |

<br />

## 🎨 Design language

Sofa Syndicate leans into an actual cinema identity instead of a generic dashboard:

```
midnight  #10131C   background — a dimmed theater
velvet    #1B2030   card surfaces
gold      #E8B23D   the signature accent — CTAs, the watched stamp
stub      #C1443D   unwatched / urgent, used sparingly
cream     #F4EFE3   primary text
smoke     #8B93A6   metadata, secondary text
```

Display type is a tall, condensed marquee-sign face (`Anton`); everything functional stays in quiet `Inter`. The one animation worth writing home about: tick a title as watched, and the stub gets a gold stamp that springs into place — mirrored as a compact corner badge on mobile posters, not just a desktop-only flourish.

<br />

## 🧱 Tech stack

```
Frontend    React + TypeScript, Vite, Tailwind CSS, TanStack Query, Framer Motion
Backend     Node.js (Express v5), Prisma ORM, PostgreSQL (Supabase)
Auth        JWT (access + httpOnly refresh)
Metadata    TMDb API & Jikan API (MyAnimeList), proxied server-side
PWA         vite-plugin-pwa (injectManifest / Workbox) — app-shell precaching only,
            no API response caching, to keep per-space watch data private per device
```

<br />

## 🚀 Getting started

```bash
# clone
git clone https://github.com/your-org/sofa-syndicate.git
cd sofa-syndicate

# backend
cd server
npm install
# add DATABASE_URL, JWT secrets, TMDB_API_KEY to .env
npx prisma db push
npm run dev

# frontend — new terminal
cd ../web
npm install
npm run dev
```

The app runs at `http://localhost:5173`, talking to the API at `http://localhost:4000`.

### Environment variables (`server/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string (IPv4 pooler) |
| `DIRECT_URL` | Postgres direct connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `TMDB_API_KEY` | V3 API Key from [themoviedb.org](https://www.themoviedb.org/settings/api) |
| `CLIENT_URL` | Frontend URL (default: `http://localhost:5173`) |
| `PORT` | API Port (default: `4000`) |

### Environment variables (`web`, production only)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Set to `/api` in production so the API is called same-origin through a proxy rewrite — keeps the auth cookie first-party instead of third-party, which some browsers (Safari especially) restrict by default. |

<br />

## 📂 Project structure

```
sofa-syndicate/
├── web/                     # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # FilmStubCard, FilterBar, Navbar, ReelRatingPicker, UpdateBanner, ...
│   │   ├── pages/           # SpaceListPage, SpaceDetailPage, JoinPage, LoginPage
│   │   ├── context/         # AuthProvider
│   │   └── service-worker.ts # PWA app-shell precaching (injectManifest strategy)
│   └── tailwind.config.js   # design tokens live here
├── server/                  # Node + Prisma backend
│   ├── src/
│   │   ├── routes/          # auth, spaces, media
│   │   └── middleware/      # auth check & membership access control
│   └── prisma/schema.prisma
```

<br />

## 🗺️ Roadmap

- [x] Multi-space auth & access control
- [x] TMDb & MyAnimeList search-and-add
- [x] Per-space watched status + optional rating
- [x] Invite & Join flows
- [x] Per-member rating visibility (who rated what, not just the average)
- [x] Installable PWA with app-shell caching
- [ ] Comments — a real discussion thread per title, separate from your personal rating note
- [ ] Custom tags per title, scoped per space (e.g. "slow-burn," "date night") — community-tagged, not fixed genres
- [ ] Cross-space "your all-time favorites" view
- [ ] Activity feed ("Raj marked *Parasite* as watched")
- [ ] `.csv` export per space

<br />

## 🤝 Contributing

Issues and PRs welcome. If you're proposing a UI change, please check it against the design tokens before opening a PR — the whole point of this app is that it doesn't look like a generic dashboard. Mobile is the primary usage surface, not an afterthought — any new feature should be designed for it first, not adapted from desktop after the fact.

<br />

## 📄 License

MIT — see [`LICENSE`](./LICENSE).

<br />

<div align="center">

*Built for the people you watch things with.*

</div>