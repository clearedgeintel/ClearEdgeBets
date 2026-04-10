# ClearEdge Sports — Product & Technical Roadmap

> Last updated: **2026-04-09** (evening)  
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
  - [ ] Expert avatars upgraded to AI portraits
- [ ] Type `req.session` properly (remove `as any`)

### High Value
- [ ] Full multi-book odds comparison with best-line highlighting
- [ ] Server-side parlay tracking + settlement (single record with legs)
- [ ] Email + Telegram daily alerts (Resend + Telegram bot)
- [ ] Player props system (use existing schema + Tank01/ESPN data)

---

## Phase 2 — Product Expansion (Q2–Q3 2026)

- [ ] **NFL integration** via Tank01 (spreads, totals, props)
- [ ] **NBA integration**
- [ ] Sport selector on Games page + universal game card component
- [ ] Expand Expert Panel to all sports
- [ ] Live line-movement heatmap
- [ ] Parlay Builder with EV guidance + same-game parlays + boost promotions
- [ ] Prop Finder with +EV filter
- [ ] Injury / lineup push alerts (real-time)

---

## Phase 3 — Platform Maturity & Engagement (Q3–Q4 2026)

- [ ] College sports (CFB + CBB)
- [ ] Unified content feed personalization ("For You")
- [ ] Onboarding flow + favorite teams + streak counter
- [ ] Comments on Morning Roast articles
- [ ] Shareable expert pick cards
- [ ] Beat the Expert H2H mode
- [ ] Discord / Telegram community access
- [ ] AI chat assistant (conversational "Which unders have edge today?")

### Technical Improvements
- [ ] Replace in-memory cache with Redis / Supabase Edge
- [ ] Image optimization proxy for ESPN assets
- [ ] Centralized error handling middleware
- [ ] Rate limiting on AI endpoints
- [ ] WCAG 2.1 AA compliance
- [ ] Core Web Vitals optimization

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
