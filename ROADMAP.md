# ClearEdge Sports — Product & Technical Roadmap

> Last updated: 2026-04-05
> Platform: clearedgesports.ai
> Status tracking: [x] Done | [-] In Progress | [ ] Not Started

---

## Settlement & Multi-Sport Architecture ✅ COMPLETE

### Phase 0 — Settlement Overhaul (Done April 5)
- [x] Fixed critical settlement bug: `'won'`/`'lost'` → `'win'`/`'lose'` string mismatch
- [x] Removed duplicate unauthenticated `/api/admin/settle-virtual-bets` route
- [x] Removed `setTimeout` hack from `updateGameStatus`
- [x] Added idempotency guards (skip already-settled bets)
- [x] Created `server/sports/types.ts` — BetGrader, BetSelection, GameScore, SportModule interfaces
- [x] Created `server/sports/registry.ts` — pluggable sport module registry
- [x] Created `server/sports/mlb/` — MLB grader, API client, teams (23 tests)
- [x] Created `server/sports/nhl/` — NHL grader, API client, teams (19 tests)
- [x] Created `server/services/settlement-engine.ts` — unified settlement using sport graders
- [x] Added `sport` column to games, bets, virtualBets, dailyPicks, expertPicks (default 'mlb')
- [x] Added `sportMetadata` jsonb to games table
- [x] Added database indexes (7 indexes across key tables)
- [x] Wired settlement engine into scheduler and trigger routes
- [x] 92 tests passing (50 original + 23 MLB grader + 19 NHL grader)

---

## AI Personality System ✅ BUILT

### The Newsroom (Content Writers) — 25 Beat Writers
- [x] 25 writers with unique voices, quirks, catchphrases, regional beat assignments
- [x] Auto Morning Roast — every 15 min checks for completed games, assigns beat writer
- [x] Editor's Desk — assign topics to writers, control tone/length/angle/player focus
- [x] Multi-sport news context — auto-detects sport from topic, pulls ESPN data
- [x] 3-day editorial slate (today + tomorrow + day after)
- [ ] Bureau Chief badges on writer profiles

### The Expert Panel (Pick Analysts) — 5 Personas ✅ BUILT
- [x] 5 experts: Contrarian, Quant, Sharp, Homie, Closer
- [x] AI pick generation per expert (8:30 AM CT scheduled)
- [x] Auto-grading every 30 min via settlement engine
- [x] Expert profile page with W/L record, ROI, active picks
- [x] Expert leaderboard with podium
- [x] Follow/Fade per expert (free tier: 1 follow, no fade)
- [x] Expert picks visible on game cards (inline summary + expanded detail)
- [x] Consensus detection (🔥 3+ experts agree) + Debate cards (⚔️ disagreement)
- [x] Expert picks on homepage ("Today's Edge" section)
- [x] Picks tier-gated: free=delayed 30min, no Sharp/Closer. Paid=all, real-time

---

## Completed Features

### Sports Coverage
- [x] **MLB** — full coverage: games, 8-book odds, rosters, player stats, weather, park factors, power scores, expert picks, Morning Roast
- [x] **NHL** — games page, scores ticker, Tank01 odds (ML, puck line, totals), settlement grader
- [ ] **NFL** — planned (Phase 2)
- [ ] **NBA** — planned (Phase 2)

### Infrastructure
- [x] Express.js + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- [x] Supabase PostgreSQL + Drizzle ORM (30+ tables, `sport` column on all key tables)
- [x] Session-based auth with PostgreSQL session store (connect-pg-simple)
- [x] Rate limiting, TTL caching, structured logging
- [x] Vitest test suite (92 tests)
- [x] Railway deployment
- [x] Multi-sport settlement engine with sport-specific graders

### Data Sources
- [x] Tank01 MLB API — games, odds, rosters, player stats, box scores
- [x] Tank01 NHL API — games, odds, scores, teams/standings
- [x] ESPN API — news, headlines, fallback scores (all sports)
- [x] OpenWeatherMap — stadium weather
- [x] MLB Stats API — pitcher recent stats
- [x] OpenAI GPT-4o / GPT-4o-mini — AI analysis, picks, reviews, newsletter, chat
- [x] Stripe — subscription billing + coin store

### AI Content & Analysis
- [x] AI game analysis with computed Edge Score (replaces fake AI confidence)
- [x] Daily picks (8 AM), expert picks (8:30 AM), AI ticket (9 AM), weekly summary (Mon 9 AM)
- [x] Sarcastic game reviews — 25 beat writers, auto-generated within 15 min of game end
- [x] Editor's Desk with 3-day editorial calendar
- [x] AI Assistant — real GPT-4o-mini chat with live game data, standings, expert picks, news context
- [x] Newsletter system — AI-generated daily brief, subscriber management, email-ready HTML
- [x] Multi-sport news context injection (ESPN headlines, injuries, standings per sport)

### Analytics & Rankings
- [x] Team Power Scores (0-200) from Tank01 roster aggregation
- [x] Team detail pages with roster, headshots, season stats, power score breakdown
- [x] Player Power Rankings (hitters/starters/relievers) with hover tooltip showing math
- [x] Computed Edge Score on game cards (ML gap + expert count + park factor + weather + consensus)
- [x] Strong Play / Lean indicators on game cards
- [x] Park factor display + Wiki documentation

### Content Platform
- [x] The Morning Roast — full-bleed hero, ESPN images, author bylines, category tags
- [x] Article features: reading time, share buttons, related stories, auto-tags
- [x] The Newsroom — 25 writer profiles with bios
- [x] Unified content feed (/feed) — blends recaps, expert picks, newsletters
- [x] Daily trivia — 5 AI questions, earn virtual coins
- [x] Injury impact scorer — AI 1-10 rating per injured player

### User Features
- [x] Virtual prediction game ($1,000 balance)
- [x] Pick slip, weekly leaderboard, groups
- [x] Performance tracking
- [x] Kelly Calculator, odds comparison

### Monetization
- [x] Tiers: Free / Edge Pass ($25/mo) / Sharp Pass ($40/mo)
- [x] Annual pricing (20% off)
- [x] Coin store (5K/$4.99, 12K/$9.99, 35K/$24.99)
- [x] Free tier limits: 1 follow, no fade, 30-min pick delay, no Sharp/Closer picks
- [x] Referral code management with commission tracking

### Admin
- [x] Admin panel — Operations, Users & Billing, Content & AI
- [x] Operations Center — 8 scheduled tasks with status, manual Run buttons, daily timeline
- [x] API Playground + API Call Log (full payload viewer)
- [x] Newsletter admin, user management, referral codes
- [x] Editor's Desk with 3-day editorial slate

### Design & Mobile
- [x] Dark premium theme (Inter font, amber/gold primary, emerald for positive only)
- [x] Collapsible sidebar with icon rail (fade transition)
- [x] Mobile bottom nav (Home, Feed, Experts, Roast, Games)
- [x] Full-bleed Morning Roast hero on homepage
- [x] Score ticker (MLB + NHL)
- [x] Condensed game cards with inline expert picks, Edge Score, Strong/Lean badges
- [x] Page transitions (150ms fade-up)
- [x] Responsive: tablet breakpoints, mobile-optimized expert panel

### Security
- [x] API keys externalized, redacted in call logs
- [x] Admin auth on all sensitive endpoints
- [x] Route protection (ProtectedRoute wrapper)
- [x] Session persistence via PostgreSQL

---

## Remaining Work

### Phase 2 — More Sports (Q3 2026)
- [ ] NFL integration via Tank01 (spreads, totals, player props)
- [ ] NBA integration (points, quarters, player props)
- [ ] Sport selector on games page (tabbed: MLB | NHL | NFL | NBA)
- [ ] Expert Panel expanded to cover all sports
- [ ] Morning Roast auto-generation for NHL games

### Phase 3 — College Sports (Q4 2026)
- [ ] College Football (CFB)
- [ ] College Basketball (CBB)

### Technical Debt
- [ ] Split `routes.ts` (~7,800 lines) into feature modules
- [ ] Remove remaining duplicate routes
- [ ] Fix Stripe secret key (`pk_test_` → `sk_test_`)
- [ ] Newsletter auto-send via SendGrid/Resend
- [ ] Image optimization (proxy ESPN images)
- [ ] WCAG 2.1 AA compliance

### Engagement (Future)
- [ ] Onboarding flow (first-visit team selection)
- [ ] Daily streak counter
- [ ] Article comments
- [ ] Shareable expert pick cards
- [ ] Beat the Expert H2H mode
- [ ] Line movement guessing game

---

## Architecture

### Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Routing | Wouter (client), Express (server) |
| Database | Supabase PostgreSQL + Drizzle ORM |
| AI | OpenAI GPT-4o / GPT-4o-mini |
| Sports Data | Tank01 MLB + NHL APIs, ESPN (fallback) |
| Weather | OpenWeatherMap |
| Payments | Stripe |
| Hosting | Railway |

### Sport Module Architecture
```
server/sports/
├── types.ts           — BetGrader, BetSelection, GameScore, SportModule interfaces
├── registry.ts        — registerSport() / getSportModule()
├── mlb/
│   ├── grader.ts      — moneyline, runline, totals (23 tests)
│   ├── api-client.ts  — wraps Tank01 MLB → GameScore[]
│   ├── teams.ts       — 30 team name/code maps
│   └── index.ts       — auto-registers on import
└── nhl/
    ├── grader.ts      — moneyline, puck line, totals (19 tests)
    ├── api-client.ts  — wraps Tank01 NHL → GameScore[]
    ├── teams.ts       — 32 team name/code/logo maps
    └── index.ts       — auto-registers on import

To add a new sport:
1. Create server/sports/{sport}/grader.ts implementing BetGrader
2. Create server/sports/{sport}/api-client.ts wrapping the data source
3. Create server/sports/{sport}/teams.ts + index.ts
4. Import the module — settlement engine picks it up automatically
```

### Automated Daily Schedule (Central Time)
| Time | Task |
|------|------|
| 8:00 AM | Daily AI picks generation |
| 8:30 AM | Expert panel picks (5 experts) |
| 9:00 AM | AI daily ticket |
| 9:00 AM Mon | Weekly summary |
| Every 15 min | Settlement engine + Morning Roast auto-generation |
| Every 30 min | Expert pick grading + odds snapshot |

### Key Files
| File | Purpose | Lines |
|------|---------|-------|
| `server/routes.ts` | All API routes | ~7,800 |
| `shared/schema.ts` | Database schema (30+ tables) | ~900 |
| `server/services/settlement-engine.ts` | Unified sport-aware settlement | ~180 |
| `server/services/tank01-mlb.ts` | Tank01 MLB API + aggregation | ~500 |
| `server/sports/mlb/grader.ts` | MLB bet grading | ~160 |
| `server/sports/nhl/grader.ts` | NHL bet grading | ~130 |
| `server/services/openai.ts` | All AI generation | ~900 |
| `shared/beat-writers.ts` | 25 writer personalities | ~400 |
| `shared/expert-panel.ts` | 5 expert analyst personas | ~100 |
