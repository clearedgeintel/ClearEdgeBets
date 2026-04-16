# ClearEdge Sports — Product & Technical Roadmap

> Last updated: **2026-04-15** (post-Phase-3 sweep)  
> Platform: clearedgesports.ai  
> Status tracking: [x] Done | [-] In Progress | [ ] Not Started

---

## Phase 0 — Settlement & Multi-Sport Architecture ✅ COMPLETE (April 5)

- [x] Unified sport-aware settlement engine with MLB + NHL graders
- [x] 92+ tests passing
- [x] `sport` column + `sportMetadata` jsonb added everywhere
- [x] Idempotency, no duplicate routes for settlement

## Phase 1 — AI Personality System ✅ COMPLETE

- [x] 25 beat writers + auto Morning Roast
- [x] 5 expert analysts with tracked W/L + ROI
- [x] Consensus / Debate cards, follow/fade, tiered visibility
- [x] Editor's Desk + 3-day editorial slate

## Completed Features (as of April 9)

- Full MLB + NHL coverage (games, odds, rosters, weather, park factors, power scores)
- Virtual sportsbook + parlay client-side calculation
- Stripe subscription tiers + coin store + referrals
- AI Assistant, Daily Dose newsletter, trivia, groups, leaderboards
- Team detail pages, player power rankings, wiki, feed
- Admin Operations Center, API Playground, full API call logging

### Technical Debt Addressed Recently
- [x] Fixed Stripe secret key detection warning
- [x] Newsletter auto-send via Resend (daily 9:15 AM)
- [x] Virtual bet settlement: sync past dates, odds fallback, WSH/WAS team code fix
- [x] Washington Nationals logo fix (WAS→WSH) across all pages
- [x] Expert picks enriched with pitcher stats, top hitters, injuries, standings, implied probabilities
- [x] Post-game notes on expert picks (AI-generated why pick won/lost)
- [x] Game summary page with box scores and player stats
- [x] Admin roster management (activate/deactivate/create experts and writers)
- [x] Homepage scorecards redesign (individual cards vs cramped ticker)

---

## Phase 1.5 — Immediate Priorities (April–May 2026) [HIGH]

### Critical
- [-] **Split `routes.ts`** — Phase 1 done (8 routers extracted, 8723→7929 lines)
  - [x] `routes/auth.ts` — register, login, logout, session
  - [x] `routes/experts.ts` — expert panel, picks, follows, admin CRUD
  - [x] `routes/newsletter.ts` — subscribe, archive, admin generate/send
  - [x] `routes/virtual-bets.ts` — virtual bets, performance, slip
  - [x] `routes/blog.ts` — Morning Roast reviews, generate
  - [x] `routes/social.ts` — groups, friends, invitations
  - [x] `routes/trivia.ts` — questions, answers, generate
  - [x] `routes/nhl-games.ts` — NHL games, scores, teams
  - [ ] Phase 2: games, admin, subscriptions, settlement, odds, power scores
- [x] **UI/Brand Overhaul** (UIROADMAP.md Phases 1–3 substantially complete)
  - [x] Morning Roast full-bleed hero + content-first homepage
  - [x] Collapsible sidebar with icon rail
  - [x] "Today's Edge" merged picks, scores strip, compact schedule
  - [x] Softer dark theme (#0f0f11) + amber/gold accent
  - [x] Nav renames (Today's Matchups, Power Rankings, My History)
  - [x] Pick Slip floating button (only shows with active bets)
  - [x] Article readability (15.5px, 1.75 line-height)
  - [x] Recap links on completed game cards
  - [x] Expert avatars upgraded to AI portraits (`scripts/generate-expert-portraits.mjs` with DALL-E, 5 PNGs in `client/public/experts/`, `ExpertAvatar` component renders URL or emoji fallback)
  - [x] Gold primary accent (`#eab308`) across CSS vars, ring, chart-1, sidebar; `.play-card` hover utility
  - [x] Desktop top-nav tabs (Feed · Today's Matchups · Experts · Power Rankings · **Play** with NEW badge)
  - [x] Streak chip in top nav (computed from `/api/virtual/bets` win streak)
  - [x] 🔥 Consensus Pick banner on Today's Edge when ≥3 experts agree
  - [x] Page-fade transitions keyed on location
  - [x] Loading skeletons on home, experts, virtual sportsbook, groups, contests, contest-detail, my-bets, weekly-leaderboard (blog already had one)
- [x] Type `req.session` properly (`server/types/session.d.ts` augments `SessionData.userId`; stripped 102 `(req.session as any)` casts across `server/routes.ts` and `server/routes/*.ts`)

### Platform Infrastructure
- [x] **Social router `/api` prefix fix** — `server/routes.ts` mounts `socialRouter` at `/api` so `/api/groups`, `/api/friends`, `/api/friend-invitations` actually resolve. Entire social feature was silently broken (falling through to Vite SPA catch-all).
- [x] **Admin seeding** — boot-time promotion in `server/index.ts` ensures `ADMIN_EMAIL` (default `tim.hull@clearedgeintel.com`) is always `is_admin=true` + tier `elite`. `scripts/seed-admin.mjs` + `npm run seed:admin` for fresh-DB creation with `ADMIN_PASSWORD`.
- [x] **Group invite code UX** — surface code in create-group toast (auto-copied to clipboard); new `POST /api/groups/join-by-code` endpoint looks up group server-side (old client-side lookup scanned only the user's own groups, so joining never worked).

### High Value
- [ ] Full multi-book odds comparison with best-line highlighting
- [ ] Server-side parlay tracking + settlement (single record with legs)
- [ ] Email + Telegram daily alerts (Resend + Telegram bot)
- [ ] Player props system (use existing schema + Tank01/ESPN data)

### Prediction Game Expansion (April 2026)
- [x] **Nav IA reorg** — general items (Morning Roast, Expert Panel, Feed, Newsletter, etc.) lifted out of the Baseball sport collapsible into a flat "General" section; Prediction Game promoted to its own featured nav block with NEW badge; sport sections now contain only sport-scoped items (schedules)
- [x] **Prediction Game visual lift** — team logos on virtual sportsbook game cards and virtual performance final-score panels; `teamLogo()` helper made sport-aware (`mlb` | `nhl`)
- [x] **Group Contests v1** — group-scoped finite competitions with configurable start date, duration (1/3/7/14/30 days), and starting bankroll ($500 / $1k / $5k / $10k). Each entrant gets an isolated contest bankroll; settlement routes contest bets to `contestEntries.currentBalance` instead of the main virtual balance. Winner = highest balance at `endDate`. Scheduler promotes `scheduled` → `active` and closes expired contests each tick.
  - Schema: `contests`, `contestEntries`, `virtualBets.contestId`
  - Routes: `server/routes/contests.ts` (CRUD + join + contest-scoped bet placement + leaderboard)
  - UI: `/contests` (tabs: active/upcoming/completed), `/contests/:id` (leaderboard + your bets)
- [ ] **Group Contests v2** — sport filter, bet-type rules (straight-only vs parlays, min/max stake), alternative scoring modes (ROI / win-rate / points-per-pick), entry fees in coins, max entrants, invite-only, prize payouts (winner-take-all or top-3 coin splits), public/global contests, contest chat, rank-change notifications

---

## Phase 2 — Prediction Game Spotlight (April–May 2026)

Make the Prediction Game the most obvious, socially-shareable feature on the site.

- [ ] **Active-contest banner on homepage** — gold-bordered banner above Today's Edge when user has ≥1 `status='active'` contest entry, with deep-link to the leaderboard
- [ ] **Bottom-nav Play badge** — numeric dot on the Play tab in `mobile-bottom-nav.tsx` when user has active contests
- [ ] **Shareable pick cards** — `/api/og/pick/:id` endpoint rendering a 1200×630 PNG (expert portrait + team logos + pick + confidence + wordmark) via `satori`/`@vercel/og`; Share button on expert cards and Today's Edge items
- [ ] **Contest chat** — `contest_messages` table + polling endpoint + chat drawer on `contest-detail.tsx`; server-side filter via existing `phrase_detection_rules`
- [ ] **Group Contests v2** — extend `contests` with `sport`, `scoring_mode` (net profit / ROI / win-rate), `allow_parlays`, `min_stake`, `max_stake`, `entry_fee_coins`, `max_entrants`, `prize_split`; settlement engine honors parlay/stake flags per contest
- [ ] **"Beat the Experts" H2H teaser** — new route `/h2h` pitting user's 7-day virtual-bet record vs each expert; "Challenge" CTA pre-populates a 7-day contest seeded against the expert's picks
- [ ] **Confetti on win** — `canvas-confetti` fires from bet-settle toast (win outcome) and contest completion
- [ ] **Richer contest leaderboard** — team logos on recent-bets column, ROI/win-rate sort toggle

## Phase 2b — Multi-Sport & Betting Tools (Q2–Q3 2026)

- [ ] **NFL integration** via Tank01 (spreads, totals, props)
- [ ] **NBA integration**
- [ ] Sport selector on Games page + universal game card component
- [ ] Expand Expert Panel to all sports
- [ ] Live line-movement heatmap
- [ ] Parlay Builder with EV guidance + same-game parlays + boost promotions
- [ ] Prop Finder with +EV filter
- [ ] Injury / lineup push alerts (real-time)

---

## Phase 3 — Content & Engagement Layer (Q2–Q3 2026)

- [x] **"For You" feed** — blended timeline in `feed.tsx` mixing Morning Roast, expert picks, newsletters, trivia, rankings; weighted by `users.favorite_teams` (server enriches meta.teams; client hoists matches with "For You" sparkles pill)
- [x] **Expert Panel columnist redesign** — bio snippet + "Today: {pick selection} {confidence%}" headline visible on collapsed expert cards
- [x] **Debate cards** — `DebatesBanner` detects 2+ experts picking opposite sides of the same gameId and renders purple-accented "Expert A picks X · Expert B picks Y" rows above the expert list
- [x] **Editorial-first game cards** — `showOdds` defaults to false; pitchers/weather/park-factor/expert-picks visible first; "Show Odds" toggle with BarChart3 icon
- [x] **Morning Roast related stories** — `/api/blog/related?slug&author&gameDate&limit` endpoint with same-author → same-date → recent priority; article view swaps in with client-cache fallback
- [x] **Onboarding modal** — post-login "Pick your teams" grid (30 MLB + 16 NHL) with ESPN logos; persists `favoriteTeams` + marks `onboardingComplete`; shows once per user
- [x] **Daily trivia popup** — `DailyTriviaBubble` fixed-position card, once-per-day localStorage gate, 2s delay, links to `/trivia`
- [x] **Scroll-triggered animations** — `useInView` IntersectionObserver hook + `FadeIn` wrapper; applied to feed items
- [ ] **Writer follow** — users can follow specific beat writers to prioritize their content in the feed
- [ ] **"What are you here for?" onboarding step** — tailors homepage (News / Picks / Play) before team selection
- [ ] **Guided tour** — 4-step tooltip tour for new users
- [ ] **Weekly wrap-up email** — personalized summary each Monday
- [ ] **Comments on Morning Roast articles** — threaded with upvote/downvote
- [ ] **Leaderboard badges** — top trivia players get profile badges
- [ ] College sports (CFB + CBB)
- [ ] Discord / Telegram community access
- [ ] AI chat assistant (conversational "Which unders have edge today?")

---

## Phase 4 — Production Readiness & Performance (Q3 2026)

- [ ] **Finish `routes.ts` split** — extract remaining routers (games, admin, subscriptions, settlement, odds, power scores); target `server/routes.ts` < 1000 lines
- [ ] **React ErrorBoundary** around each lazy route + centralized Express error middleware with request-id
- [ ] **Rate limiting** per-user on AI endpoints (separate bucket for expensive endpoints)
- [ ] **Caching** — move `server/lib/cache.ts` to Redis (Upstash) with stampede protection; cache `/api/experts`, `/api/blog/reviews`, `/api/games`
- [ ] **SEO** — dynamic `<title>` + meta + Open Graph per route (article, expert profile, contest) via `react-helmet-async`; `/sitemap.xml` + `robots.txt`
- [ ] **WCAG 2.1 AA** — axe-core audit in Vitest; focus rings, ARIA labels on icon buttons, keyboard nav
- [ ] **Core Web Vitals** — preload hero image, lazy-load below-fold, image-optimization proxy for ESPN logos; target Lighthouse 95+
- [ ] **Test coverage ≥ 60%** on critical paths (settlement, contests, auth); currently 50 tests
- [ ] **Stripe webhook hardening** — signature verification, idempotency key, replay protection
- [ ] **Admin API logging dashboard** — searchable, filterable payload logs
- [ ] **Database indices** — `expert_picks(expert_id, game_date)`, `virtual_bets(user_id, status)`, `contest_entries(contest_id)`

---

## Phase 5 — Growth & Monetization (ongoing)

- [ ] **Email + Telegram daily alerts** (Resend already wired for newsletter; add Telegram bot + preference center at `/account/alerts`)
- [ ] **Referral system polish** — visible referral code on account page, tracked conversions, reward unlocks (e.g., 2 referrals = free Pro week)
- [ ] **Coin store visual upgrade** — gold-accented tiles, limited-time bundles, purchase-modal confetti
- [ ] **"Sharp Pass" (Elite) launch** — parlay builder, prop finder, AI chat all behind Elite gate; landing at `/sharp-pass`
- [ ] **Analytics + A/B testing** — PostHog or Plausible; funnel events (view → signup → first-bet → first-contest → subscribe); feature flags for experiment gating
- [ ] Leaderboard badges for top trivia players
- [ ] Weekly wrap-up email ("Your week: 3 trivia correct, Expert Sharp went 5-2, 12 new recaps")

---

## Architecture (Current – Strong)

The sport module system, settlement engine, and AI personality layers are the strongest parts of the codebase. Keep this architecture as the foundation.

**Next Major Refactor Target**: `server/routes.ts` → feature routers + better folder structure.

---

## Automated Daily Schedule (Central Time)

- 8:00 AM — Daily AI picks
- 8:30 AM — Expert panel picks (all 5)
- 9:00 AM — AI daily ticket + Morning Roast generation
- 9:15 AM — Newsletter send
- Every 15 min — Settlement + Roast auto-generation
- Every 30 min — Expert pick grading + odds snapshot

---

**Key Files to Watch**
- `server/routes.ts` (split this!)
- `server/services/settlement-engine.ts`
- `server/services/openai.ts`
- `shared/beat-writers.ts` + `shared/expert-panel.ts`
- `client/src/App.tsx` + lazy pages

**Success Metric (End of Q2 2026)**:  
ClearEdge Sports feels like **"ESPN meets Substack meets FanDuel Insights"** — users come for the stories and analysis, stay for the expert picks and prediction game, and happily convert to Edge/Sharp Pass.
