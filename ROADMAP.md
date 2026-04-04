# ClearEdge Sports — Product Roadmap

> Last updated: 2026-04-03
> Platform: clearedgesports.ai
> Status tracking: [x] Done | [-] In Progress | [ ] Not Started

---

## AI Personality Architecture

### The Newsroom (Content Writers) — 25 Beat Writers ✅ BUILT
The existing 25 writers create **content**: game recaps, editorial columns, Morning Roast articles.
They write stories, not picks. Each has a unique voice, quirks, and personality.

**Bureau Chiefs** (promoted from the 25, one per sport):
- [ ] **Chip Dalloway** — MLB Bureau Chief (Lead MLB Columnist, 28 years)
- [ ] **Biff Kowalczyk** — NFL Bureau Chief (Action Reporter, dramatic style)
- [ ] **Sven Basepath** — NBA Bureau Chief (Dramatic, speed/pace specialist)
- [ ] **Gordy Metrodome** — NHL Bureau Chief (Folksy, cold weather expert)
- [ ] **Skip Homerfield** — Golf Bureau Chief (Witty, power rankings obsessed)

Bureau Chiefs oversee their sport's coverage and are the default writer for that sport's Morning Roast.

### The Expert Panel (Pick Analysts) — 5 Personas 🆕 NOT BUILT
The experts make **picks**: specific game selections with odds, confidence, and rationale.
They don't write articles — they issue analysis cards and predictions.

| Persona | Style | Approach | Specialty |
|---------|-------|----------|-----------|
| **The Contrarian** | Skeptical, finds value against public | Fades heavy favorites, targets underdogs | Over-hyped teams, reverse line movement |
| **The Quant** | Data-driven, emotionless | Expected value, regression models, sample size | Totals, run lines, statistical edges |
| **The Sharp** | Professional, concise, high conviction | Line shopping, steam moves, closing line value | Moneylines, early value, line movement |
| **The Homie** | Casual, relatable, gut + stats | Vibes + data, fan perspective with analytics | Parlays, props, fun picks |
| **The Closer** | Late-game specialist, clutch calls | Late odds, bullpen matchups, weather shifts | Live picks, game-time decisions |

Each expert:
- Has a profile card with avatar, bio, win rate, ROI
- Issues 1-3 picks per day with confidence level and rationale
- Gets auto-graded after game completion
- Has a public track record (W/L, ATS%, ROI%, unit P&L)
- Users can Follow or Fade each expert
- Picks appear on game cards and a dedicated "Expert Picks" feed

---

## Phase 1 — Quick Wins (<1 week each)

### Technical Debt
- [ ] Split `routes.ts` (7,600 lines) into feature modules
- [ ] Remove duplicate routes (`/api/admin/stats` x3, `/api/subscription/create` x2)
- [ ] Remove dead Baseball Reference service files
- [ ] Fix Stripe secret key (currently `pk_test_...`, needs `sk_test_...`)
- [ ] Add database indexes on gameId, userId, gameDate
- [ ] Rate limit public newsletter subscribe endpoint
- [ ] Remove or gate unused "coming soon" pages

### Expert Panel Foundation
- [ ] Create `shared/expert-panel.ts` — 5 expert personas with profiles, analysis styles, pick preferences
- [ ] Create `expert_picks` DB table — expertId, gameId, pickType, selection, odds, confidence, rationale, result, gradedAt
- [ ] Create `user_expert_follows` DB table — userId, expertId, mode (follow/fade)
- [ ] AI pick generation per expert — each expert analyzes today's slate through their lens
- [ ] Expert profile page `/experts` — cards with bio, W/L record, ROI, active picks
- [ ] Expert picks on game cards — show which experts have picks on each game

### Newsroom Enhancements
- [ ] Promote 5 writers to Bureau Chief with sport assignment
- [ ] Auto-assign Morning Roast by sport to the correct Bureau Chief
- [ ] Bureau Chief badge on writer profiles and articles

### Homepage
- [x] "This Day in Baseball" history card
- [x] "Picks of the Day" — 3 daily picks with rationale
- [ ] Expert Panel picks carousel — show today's expert picks inline

---

## Phase 2 — Core Differentiators (2-4 weeks each)

### Expert Pick Tracking
- [ ] Auto-grading — scheduler checks completed games, grades expert picks
- [ ] Public leaderboard — experts ranked by ROI%, win rate, unit P&L
- [ ] Historical filters — by sport, expert, bet type, date range
- [ ] Fade/Follow toggle — users can follow or fade each expert
- [ ] Personalized feed — show picks from followed experts first
- [ ] Line snapshot — save consensus odds at pick post time for CLV tracking
- [ ] Expert consensus — when 3+ experts agree on a pick, highlight it

### Trivia & Games
- [ ] Daily prop quiz — 5 questions from yesterday's box scores, earn virtual coins
- [ ] Beat the Expert H2H — pick same games as an expert, compare results
- [ ] Line movement guessing game — guess direction from opening to closing line

### Engagement
- [ ] Streak bonuses — 1.5x/2x/3x coin multiplier at 3/5/7 consecutive wins
- [ ] SMS/Push alerts — notifications on expert pick drops, injury alerts
- [ ] Consensus meter on game cards — sharp vs public percentage
- [ ] Injury impact scorer — AI-generated 1-10 rating when key players hit IL

### Multi-Sport Expansion
- [ ] NFL integration via Tank01 — reuse game card, odds, AI analysis patterns
- [ ] NBA integration
- [ ] NHL integration
- [ ] Bureau Chiefs auto-assigned to their sport's content pipeline

### Content Automation
- [ ] Morning Roast auto-generation — scheduler generates all reviews at 8 AM
- [ ] Newsletter auto-send — SendGrid/Resend integration for actual email delivery
- [ ] AI-generated daily podcast script — text-to-speech ready

---

## Phase 3 — Monetization (after user base)

### Revenue
- [ ] Virtual coin purchases — Stripe one-time payments ($5/5K, $10/12K, $25/35K coins)
- [ ] Premium expert access — The Sharp and The Closer picks only for paid users
- [ ] Sponsored content slots — newsletter, game cards, blog footer
- [ ] Affiliate program — public signup links, dashboard, auto-payout

### Subscription Tiers
- [ ] Rename: Free / Edge Pass ($25/mo) / Sharp Pass ($40/mo)
- [ ] Annual pricing with 20% discount
- [ ] 7-day free trial of Edge Pass
- [ ] Free tier limits: 1 expert follow, no Fade mode, delayed picks (30 min)
- [ ] Edge Pass: all experts, real-time picks, export data
- [ ] Sharp Pass: everything + expert consensus alerts, SMS notifications, priority API

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
- [x] Tank01 MLB API — primary (games, odds, rosters, player stats, box scores)
- [x] ESPN API — fallback for games
- [x] OpenWeatherMap API — stadium weather
- [x] MLB Stats API — pitcher recent stats (L5 ERA)
- [x] OpenAI GPT-4o / GPT-4o-mini — AI analysis, picks, newsletters, reviews
- [x] Stripe — subscription billing

### Game Data
- [x] Today's games with probable pitchers
- [x] Multi-book odds (8 sportsbooks)
- [x] Consensus odds calculation
- [x] Weather on game cards
- [x] Ballpark run factors (30 stadiums)
- [x] Pitcher last 5 starts ERA
- [x] Yesterday's scores on homepage
- [x] "This Day in Baseball" history
- [x] "Picks of the Day" (3 daily AI picks)

### AI Content
- [x] AI game analysis with confidence scores
- [x] Daily picks generation (8 AM CT)
- [x] AI daily ticket (9 AM CT)
- [x] Weekly summary (Mondays 9 AM CT)
- [x] Sarcastic game reviews — 25 AI beat writers with unique voices
- [x] Editor's Desk — assign topics to writers, control tone/length/angle/player focus
- [x] Publish editorial columns to Morning Roast
- [x] Newsletter with quick picks, recap, weather watch

### Analytics
- [x] Team Power Scores (0-200) from Tank01 roster aggregation
- [x] Team detail pages — roster, headshots, season stats, power breakdown
- [x] Player Power Rankings — hitters, starters, relievers (sortable, tooltip math)
- [x] SLG added to hitter power score formula
- [x] Park factor display + Wiki documentation

### Content Platform
- [x] The Morning Roast blog — hero images, ESPN thumbnails, author bylines
- [x] The Newsroom — 25 writer profiles with personality bios
- [x] Editor's Desk — multi-writer assignments with editorial controls
- [x] Newsletter system — subscribe, archive, admin dashboard
- [x] Wiki — power score methodology and park factor reference
- [x] MLB Weather Map — SVG US map with temperature-coded pins

### User Features
- [x] Virtual prediction game ($1,000 virtual balance)
- [x] Pick slip
- [x] Weekly leaderboard
- [x] Groups and friend invitations
- [x] Performance tracking and analytics
- [x] Kelly Calculator
- [x] Odds comparison

### Admin
- [x] Admin panel — grouped nav (Operations, Users & Billing, Content & AI)
- [x] Operations Center — scheduler, triggers, API health
- [x] API Playground — test endpoints live
- [x] API Call Log — full payload viewer with service filters
- [x] Newsletter admin — generate, preview, subscriber metrics
- [x] User management + tier updates
- [x] Referral code management

### Design & Mobile
- [x] Dark command center theme (Inter, emerald/blue/gold)
- [x] Mobile bottom nav bar (5 tabs)
- [x] Responsive tables with hidden columns on mobile
- [x] ESPN team logos throughout
- [x] Condensed game cards, expandable analysis
- [x] Multi-book odds comparison table
- [x] Clickable teams → team detail pages

### Security
- [x] API keys externalized
- [x] Admin auth on all sensitive endpoints
- [x] Session secret from environment
- [x] `.env.example` with placeholders only
- [x] API key redaction in call logs

---

## Architecture

### Stack
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
| `server/services/tank01-mlb.ts` | Tank01 API + team aggregation | ~500 |
| `server/services/openai.ts` | All AI generation functions | ~870 |
| `shared/beat-writers.ts` | 25 writer personalities | ~350 |
| `client/src/App.tsx` | All routes + lazy loading | ~140 |

### Personality System Summary
```
NEWSROOM (content)                    EXPERT PANEL (picks)
├── 25 Beat Writers                   ├── The Contrarian
│   ├── 5 Bureau Chiefs (per sport)   ├── The Quant
│   └── 20 Staff Writers              ├── The Sharp
│                                     ├── The Homie
│   Write: articles, recaps,          └── The Closer
│   editorials, Morning Roast
│                                     Issue: picks, predictions,
│   Personality: voice, quirks,       confidence, odds analysis
│   catchphrase, mood
│                                     Track: W/L, ROI%, unit P&L,
│                                     ATS%, CLV
```
