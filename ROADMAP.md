# ClearEdge Sports — Product Roadmap

> Last updated: 2026-04-03
> Platform: clearedgesports.ai
> Status tracking: [x] Done | [-] In Progress | [ ] Not Started

---

## Phase 1 — Quick Wins (<1 week each)

### Technical Debt
- [ ] Split `routes.ts` (7,600 lines) into feature modules: admin, blog, editorial, newsletter, tank01, games, auth
- [ ] Remove 3 duplicate `/api/admin/stats` routes and 2 duplicate `/api/subscription/create` routes
- [ ] Remove dead Baseball Reference service (replaced by Tank01)
- [ ] Fix Stripe secret key in `.env` (currently `pk_test_...`, needs `sk_test_...`)
- [ ] Add database indexes on frequently queried columns (gameId, userId, gameDate)
- [ ] Rate limit public newsletter subscribe endpoint
- [ ] Remove or gate unused "coming soon" pages (expert-consultation, white-label, golf, NHL, NBA)

### Features
- [ ] Remap beat writers to expert analyst personas (The Contrarian, The Quant, The Sharp, The Homie, The Closer) — keep existing 25 writers as the "newsroom", add 5 headline analysts with distinct analysis styles
- [ ] Follow/Favorite experts — `user_favorites` table, toggle endpoint, personalized feed
- [ ] Historical pick filters — add expert, bet type, and sport filters to performance tracking page
- [ ] Injury impact scorer — AI-generated 1-10 impact rating when key players hit IL (Tank01 has injury data)
- [ ] Line snapshot on picks — save consensus odds to `oddsHistory` when daily picks are generated
- [ ] Fade/Follow toggle per expert — track which experts a user follows, surface their picks first

---

## Phase 2 — Core Differentiators (2-4 weeks each)

### Trivia & Games
- [ ] Daily prop quiz — 5 questions generated from yesterday's box scores, earn virtual coins
- [ ] Beat the Expert H2H — pick same games as an AI persona, compare results after settlement
- [ ] Line movement guessing game — show opening line, guess direction, reveal closing line

### Engagement
- [ ] Streak bonuses — track consecutive wins, apply 1.5x/2x/3x coin multiplier at 3/5/7 streaks
- [ ] SMS/Push alerts — Twilio or web-push for pick drop notifications, injury alerts
- [ ] Consensus meter on game cards — show sharp vs public percentage inline

### Multi-Sport
- [ ] NFL integration via Tank01 — reuse game card, odds, AI analysis patterns
- [ ] NBA integration — same pattern
- [ ] NHL integration — same pattern

### Content
- [ ] Morning Roast auto-generation — scheduler generates all reviews at 8 AM without admin trigger
- [ ] Newsletter auto-send — integrate with email provider (SendGrid/Resend) for actual delivery
- [ ] AI-generated daily podcast script — text-to-speech integration for audio content

---

## Phase 3 — Monetization (after user base)

### Revenue
- [ ] Virtual coin purchases — Stripe one-time payments for coin packs ($5/5K, $10/12K, $25/35K)
- [ ] Premium expert tiers — certain AI analysts only available to paid subscribers
- [ ] Sponsored content slots — ad placements in newsletter, game cards, blog footer
- [ ] Affiliate program — public signup links, affiliate dashboard, auto-payout tracking

### Subscription Enhancements
- [ ] Rename tiers: Free / Edge Pass ($25/mo) / Sharp Pass ($40/mo)
- [ ] Annual pricing option with discount
- [ ] Trial period (7-day free trial of Edge Pass)
- [ ] Usage-based limits on AI features for free tier

---

## Completed Features

### Infrastructure
- [x] Express.js + React 18 + TypeScript full-stack app
- [x] Supabase PostgreSQL with Drizzle ORM (30+ tables)
- [x] Session-based authentication with bcrypt
- [x] Rate limiting on API endpoints
- [x] In-memory TTL caching for external API calls
- [x] Structured logging (JSON in prod, human-readable in dev)
- [x] `dotenv` environment variable loading
- [x] `cross-env` for Windows compatibility
- [x] Vitest test suite (50 tests passing)
- [x] Railway deployment with PORT env var support

### Data Sources
- [x] Tank01 MLB API — primary data source (games, odds, rosters, player stats, box scores)
- [x] ESPN API — fallback for games when Tank01 unavailable
- [x] OpenWeatherMap API — stadium weather data
- [x] MLB Stats API — pitcher recent stats (L5 ERA)
- [x] OpenAI GPT-4o — AI analysis, picks, newsletters, game reviews
- [x] Stripe — subscription billing

### Game Data
- [x] Today's games with probable pitchers (Tank01 + ESPN fallback)
- [x] Multi-book odds comparison (8 sportsbooks: DraftKings, FanDuel, BetMGM, Caesars, bet365, Fanatics, Hard Rock, PointsBet)
- [x] Consensus odds calculation across all books
- [x] Weather data on game cards (temperature, wind, precipitation, delay risk)
- [x] Ballpark run factors for all 30 MLB stadiums
- [x] Pitcher last 5 starts ERA (lazy-loaded per pitcher)
- [x] Yesterday's scores on homepage
- [x] Live score tracking

### AI Features
- [x] AI game analysis with confidence scores
- [x] Daily picks generation (scheduled 8 AM CT)
- [x] AI daily ticket generation (scheduled 9 AM CT)
- [x] Weekly summary generation (Mondays 9 AM CT)
- [x] Sarcastic game reviews with 25 AI beat writers
- [x] Editor's Desk — assign topics to multiple writers with tone/length/angle controls
- [x] Publish editorial columns to Morning Roast blog
- [x] Newsletter generation with quick picks, recap, weather watch
- [x] Writer personality injection (bio, quirks, catchphrase, specialty, secret team bias)

### Team & Player Analytics
- [x] Team Power Scores (0-200) — batting + pitching composite from Tank01 roster aggregation
- [x] Team detail pages with full roster, headshots, season stats
- [x] Power score breakdown with component math visualization
- [x] Player Power Rankings — hitters, starters, relievers with composite scoring
- [x] Hover tooltip showing full power score calculation
- [x] Park factor display on game cards and wiki
- [x] Clickable team logos/names linking to team detail from game cards and power rankings

### Content Platform
- [x] The Morning Roast — AI game recap blog with hero images, ESPN thumbnails, team logos
- [x] The Newsroom — 25 beat writer profiles with full personality bios
- [x] Editor's Desk — story assignment with game linking, player focus, tone/length controls
- [x] Newsletter system — subscribe, archive, admin dashboard with metrics
- [x] Wiki — full documentation of power scores, park factors, methodology

### User Features
- [x] Virtual prediction game with $1,000 starting balance
- [x] Pick slip / betting slip
- [x] Weekly leaderboard with points system
- [x] Groups and friend invitations
- [x] Performance tracking and analytics
- [x] Kelly Calculator
- [x] Odds comparison page

### Admin
- [x] Admin panel with grouped navigation (Operations, Users & Billing, Content & AI)
- [x] Operations Center — scheduler status, manual trigger buttons, API health
- [x] API Playground — test all endpoints with response preview
- [x] API Call Log — full request/response payload viewer with filters
- [x] Newsletter admin — generate editions, subscriber list, metrics
- [x] User management with tier updates
- [x] Referral code management with commission tracking

### Design
- [x] Dark command center theme (Inter font, emerald/blue/gold palette)
- [x] Mobile responsive — bottom nav bar, collapsible sidebar, responsive grids
- [x] ESPN team logos throughout
- [x] Condensed game cards with inline odds, expandable AI analysis
- [x] Multi-book odds comparison table

### Security
- [x] All API keys externalized to environment variables
- [x] Admin route authentication on all sensitive endpoints
- [x] Session secret from environment
- [x] `.env.example` with placeholder values only
- [x] API key redaction in call logs

---

## Architecture Notes

### Current Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Routing | Wouter (client), Express (server) |
| Database | Supabase PostgreSQL + Drizzle ORM |
| AI | OpenAI GPT-4o / GPT-4o-mini |
| Sports Data | Tank01 MLB API (primary), ESPN (fallback) |
| Weather | OpenWeatherMap |
| Payments | Stripe |
| Hosting | Railway |

### Key Files
| File | Purpose | Lines |
|------|---------|-------|
| `server/routes.ts` | All API routes (needs splitting) | ~7,600 |
| `shared/schema.ts` | Database schema (30+ tables) | ~810 |
| `server/services/tank01-mlb.ts` | Tank01 API service | ~400 |
| `server/services/openai.ts` | All AI generation functions | ~770 |
| `shared/beat-writers.ts` | 25 writer personality profiles | ~350 |
| `client/src/App.tsx` | All routes + lazy loading | ~140 |
