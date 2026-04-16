# ClearEdge Sports — UI/UX Roadmap

> Last updated: 2026-04-16 (full UIROADMAP sweep — Batches A–F)
> Context: ClearEdge has evolved from a sports betting analytics tool into an **AI-automated sports news + expert analysis platform**. The UI needs to catch up.

---

## Current State Assessment

### What ClearEdge IS now:
- An AI-powered sports news site ("The Morning Roast")
- An expert picks platform (5 AI analysts with tracked records)
- A community prediction game (virtual balance, leaderboard)
- A data reference tool (power scores, park factors, odds)

### What the UI now does right (shipped):
- Content-first homepage (Morning Roast hero → Today's Edge → schedule rail)
- Editorial nav (Feed · Matchups · Experts · Rankings · **Play**) with sidebar icon rail
- Editorial-first game cards: pitchers / weather / park factor / expert picks lead, odds hidden behind toggle
- Pick Slip is a floating button (only appears with active bets)
- Gold (#eab308) brand accent, AI expert portraits, loading skeletons everywhere
- Prediction Game promoted with NEW badge, active-contest banner, Play badge on mobile
- Shareable OG pick cards, contest chat, Beat the Experts H2H, sortable leaderboards
- Columnist expert cards (bio + today's pick headline), Debate banner
- Unified feed with "For You" personalization via favorite-team weighting
- Morning Roast: reading time + share buttons + related stories rail + category tags
- Onboarding modal (team picker), daily trivia popup
- Win confetti, streak chip, consensus banner, scroll-fade on feed reveal

### Remaining gap:
Multi-sport visual system (sport-specific accents + switcher + universal game card), tablet breakpoint refinements, writer follow, article comments, guided tour, accessibility/performance hardening.

---

## Design Principles (going forward)

1. **Content-first, tools-second** — Lead with stories and analysis, not calculators
2. **Discovery over depth** — Surface the best content; let users drill down
3. **Earn trust before selling** — Free tier should feel generous, not gated
4. **Mobile = primary** — Design for phone first, desktop second
5. **One voice** — The site should feel like a newsroom, not a dashboard

---

## Phase 1 — Identity Alignment (1-2 weeks)

### 1.1 Homepage Redesign
- [x] **Remove hero logo/tagline block**
- [x] **Morning Roast as full-bleed hero** (`aspect-[16/9] sm:aspect-[21/9]`, outside `max-w-5xl` constraint)
- [x] **Merge "Picks of the Day" and "Expert Picks Today"** into "Today's Edge"
- [x] **Yesterday's scores as a ticker strip** (`home.tsx:49-103`, horizontal scroll of 130px cards)
- [x] **Today's games as a compact schedule rail** (pill-shaped horizontal scroll)

### 1.2 Navigation Overhaul
- [x] **Desktop top navigation tabs** (Feed · Today's Matchups · Experts · Power Rankings · **Play**) in `top-nav.tsx`
- [x] **Sidebar collapsible** — icon rail (w-16) expands to full sidebar (w-72) on hover; `layout.tsx`
- [x] **Rename sidebar categories** — Today's Matchups, Power Rankings, My History
- [x] **Tools & Calculators** moved to General section (not per-sport)
- [x] **Pick Slip floating button** — only shows when `bets.length > 0`
- [x] **Mobile bottom nav** — Home · Feed · **Play** (with active-contest badge) · Experts · Roast

### 1.3 Typography & Spacing
- [x] **Body text 15.5px** with 1.75 line-height (`.article-body` in `index.css`)
- [x] **Serif for long-form** — Lora font, applied via `.article-body`
- [x] **Section dividers** — `border-b border-border/20` between homepage sections

---

## Phase 2 — Content Experience (2-3 weeks)

### 2.1 Morning Roast Enhancements
- [x] **Article reading time** — computed from word count in `blog.tsx`
- [x] **Share buttons** — X intent + copy link wired on article page
- [x] **Category tags** — Blowout / Close Game / Walk-Off / Shutout / Extras auto-detected from box score
- [x] **Related stories** — `GET /api/blog/related?slug&author&gameDate&limit` endpoint; article view renders a "More from {author}" / "More from this day" rail using the broader pool
- [x] **Writer follow** — `user_writer_follows` table + `/api/blog/writer-follow` + Follow/Following toggle next to author byline. For-You feed boosts recaps by followed authors.

### 2.2 Expert Panel Redesign
- [x] **AI-generated expert portraits** — `ExpertAvatar` renders URL or emoji fallback; 5 DALL-E portraits in `client/public/experts/`
- [x] **Consensus indicator** — 🔥 "Consensus Pick — N experts agree" banner on Today's Edge (home.tsx)
- [x] **Shareable pick cards** — `/api/og/pick/:id` renders 1200×630 PNG via `satori` + `@resvg/resvg-js` (expert portrait, team logos, pick, confidence, ClearEdge wordmark); Share2 button on each expert pick card opens X intent
- [x] **Beat the Experts H2H** — `/h2h` page with side-by-side user-vs-expert comparison (win %, ROI, record), AHEAD badges, Challenge CTA linking to contest creation
- [x] **Contests v2 create dialog** — sport filter, scoring mode (balance/ROI/win-rate), parlay toggle, min/max stake, max entrants wired into create dialog + server-side enforcement
- [x] **Contest chat** — `contest_messages` table + REST endpoints + bubble-style chat drawer on contest-detail with 8s polling
- [x] **Columnist profile cards** — bio snippet (2-line clamp) + "Today: {pick selection} {confidence%}" headline visible on the collapsed card; full bio in expanded view
- [x] **Expert vs Expert "Debate" cards** — `DebatesBanner` surfaces up to 3 disagreements above the expert list (same gameId, different selections)
- [x] **Picks as "analysis cards"** — each today's pick renders as its own card with matchup row (team logos), result-aware left border stripe, bold headline, odds/confidence/units/result badges, rationale, post-game recap, and share button

### 2.3 Game Cards Reimagined
- [x] **Default view: editorial** — team logos, pitchers, venue, weather, park factor, expert picks (with portrait avatars) visible first; odds collapsed behind toggle
- [x] **Odds behind a toggle** — "Show Odds" button with BarChart3 icon; Hide button when expanded
- [x] **Inline Morning Roast link** — "Read the recap →" link on completed game cards (existed)
- [x] **Live game state** — pulsing red dot + LIVE badge with running score for in-progress games; FINAL tag post-game

### 2.4 Feed Experience
- [x] **Unified content feed** — `feed.tsx` already blends recaps, expert picks, newsletters, trivia, rankings with date separators
- [x] **"For You" personalization** — favorite teams hoist matching items to the top with an amber sparkles "For You" pill; header switches to "Personalized for your N teams"
- [x] **Content type indicators** — type badges per item (☕ ⛩️ 📧 ❓ 📊)

---

## Phase 3 — Visual Polish (1-2 weeks)

### 3.1 Color & Branding
- [x] **Softened dark theme** — `#0f0f11` background, `#141416` lifted cards
- [x] **Reduced emerald** — emerald reserved for positive/win indicators only
- [x] **Gold primary accent** — `#eab308` on CSS vars, ring, chart-1, sidebar
- [x] **Expert avatars** — AI-generated DALL-E portraits (5 personas) shipped

### 3.2 Motion & Interaction
- [x] **Page transitions** — `.page-enter` fade keyed on `location` in `layout.tsx`
- [x] **Hover states on game cards** — `.play-card` utility (scale 1.01 + gold glow) on Prediction Game cards
- [x] **Loading skeletons** — layout-matching skeletons on home (5 sections), experts, virtual sportsbook, groups, contests, contest-detail, my-bets, weekly-leaderboard, blog
- [x] **Scroll-triggered animations** — `useInView` hook + `FadeIn` wrapper pair with `.scroll-fade`; applied to feed items (can spread to more surfaces)

### 3.3 Responsive Refinements
- [x] **Tablet breakpoint pass** (768–1024px) — sidebar rail now visible at md+ instead of lg+ only
- [x] **Game cards on tablet** — Today's Games already at md:grid-cols-2; no change needed
- [x] **Morning Roast on tablet** — "More Stories" grid is now 1 → 2 (md) → 3 (lg) cols
- [x] **Expert Panel on mobile** — horizontal scroll-snap carousel (85% card width) on <sm; vertical stack at sm+

---

## Phase 4 — Engagement Patterns (2-4 weeks)

### 4.1 Onboarding
- [x] **Team selection** — `OnboardingModal` on first login: MLB + NHL + NBA team grid, multi-select, persists `favoriteTeams` + `onboardingComplete`; drives For You feed
- [x] **First-visit flow** — Step 1 "What brings you to ClearEdge?" with 3 options (news / picks / play); persists to `users.primary_interest`. Step 2 is the team picker.
- [ ] **Guided tour** — 4-step tooltip tour (deferred — needs tour library choice + product design)

### 4.2 Retention Hooks
- [x] **Streak counter** — flame chip in top nav, computed from virtual-bet win streak (`top-nav.tsx` `StreakChip`)
- [x] **Trivia of the Day popup** — `DailyTriviaBubble` floating card (bottom-right), once-per-day localStorage gate, 2s delay, links to `/trivia`
- [ ] **Weekly wrap-up email** — deferred (needs Resend template + cron + user prefs)

### 4.3 Social & Community
- [x] **Comments on Morning Roast articles** — `article_comments` table with threaded replies (parentId); 2000-char composer + inline replies under each top-level
- [x] **Shareable expert picks** — `/api/og/pick/:id` 1200×630 PNG shipped via satori; Share button on expert pick cards
- [x] **Contest chat** — `contest_messages` table + REST polling + bubble chat drawer on contest-detail
- [x] **Active-contest banner** — gold "Live Contest" banner on homepage when user has ≥1 active entry
- [x] **Win confetti** — `canvas-confetti` fires on bet-settle win + contest champion (throttled, gold palette)
- [x] **Sortable contest leaderboard** — Balance / ROI / Win % sort toggle with re-ranked display
- [x] **Leaderboard badges** — 🏆 Champion (rank 1), 🥈 Elite (2-3), 🔥 Sharp (4-10) on weekly leaderboard

---

## Phase 5 — Platform Maturity (ongoing)

### 5.1 Multi-Sport Visual System
- [x] **Sport-specific color accents** — `.sport-mlb` emerald, `.sport-nhl` ice blue, `.sport-nba` orange, `.sport-nfl` blue tokens + `SportBadge` component (feed items, sport switcher)
- [x] **Sport switcher in nav** — `SportSwitcher` component (MLB · NHL · NBA pills) on Today's Matchups, NHL Games, NBA Games pages. Homepage scores strip now shows all three sports' finals.
- [ ] **Universal game card component** — deferred (multi-session refactor). Today's Matchups uses rich `EnhancedGameCard`; NHL/NBA pages use simpler per-sport cards. Closing the gap would require normalizing pitcher/period/quarter/park-factor differences.

### 5.2 Content CMS
- [ ] **Admin content editor** — rich text editor for Morning Roast articles (currently generated markdown only)
- [ ] **Scheduled publishing** — write article, schedule for 8 AM release
- [ ] **Content calendar view** — see what's scheduled, what's published, gaps in coverage

### 5.3 Performance & Accessibility
- [x] **Image caching proxy** — `GET /api/img?u=<url>` caches upstream images with 30-day immutable header (SHA-1 keyed disk cache, SSRF-safe host whitelist). Resize deferred (needs `sharp`).
- [x] **Lazy-load images** — `loading="lazy"` + `decoding="async"` on below-fold team logos; `fetchPriority="high"` + proper alt on hero image
- [x] **WCAG (partial)** — aria-label on icon-only buttons (mobile nav, notifications), aria-current on active tabs, aria-hidden on decorative icons. Broader color-contrast audit still open.
- [ ] **Core Web Vitals** — preload hero image done; defer non-critical CSS, audit CLS, Lighthouse-driven fixes still open

---

## Priority Matrix

| Change | Impact | Effort | Status |
|--------|--------|--------|--------|
| Morning Roast full-bleed hero | High | Low | ✅ Shipped |
| Merge picks → Today's Edge | High | Low | ✅ Shipped |
| Scores ticker strip | Medium | Low | ✅ Shipped |
| Sidebar collapsible + top tabs | High | Medium | ✅ Shipped |
| Article reading time + share | Medium | Low | ✅ Shipped |
| Expert consensus banner | High | Low | ✅ Shipped |
| Gold theme + AI portraits | Medium | Medium | ✅ Shipped |
| OG shareable pick cards | High | Medium | ✅ Shipped |
| Contest chat + H2H + v2 dialog | High | Medium | ✅ Shipped |
| Win confetti + streak chip | Medium | Low | ✅ Shipped |
| Loading skeletons (9 pages) | Medium | Medium | ✅ Shipped |
| Editorial game cards (Show Odds) | High | Medium | ✅ Shipped |
| Unified "For You" feed | High | High | ✅ Shipped |
| Onboarding + favorite teams | High | Medium | ✅ Shipped |
| Daily trivia popup | Medium | Low | ✅ Shipped |
| Related stories + columnist cards + Debates | Medium | Medium | ✅ Shipped |
| Writer follow | Medium | Low | Next |
| Comments on Morning Roast | Medium | Medium | Next |
| WCAG AA + Core Web Vitals | High | High | Phase 4 |
| Multi-sport visual system | High | High | Phase 5 |

---

## Metrics to Track

| Metric | Current (estimated) | Target |
|--------|-------------------|--------|
| Time on homepage | ~30 seconds | 2+ minutes |
| Morning Roast click-through | Unknown | 40%+ of homepage visitors |
| Expert Panel engagement | Unknown | 25%+ click into an expert |
| Trivia completion rate | Unknown | 60%+ of daily active users |
| Mobile vs desktop ratio | Unknown | Target 60% mobile |
| Newsletter subscribe rate | Unknown | 5%+ of unique visitors |
| Free → Edge conversion | Unknown | 3-5% |

---

## Design Tokens (shipped — see `client/src/index.css`)

```css
/* ClearEdge Sports — Premium Sports Publication Theme */
--background: #0f0f11;          /* softer dark (was #09090b) */
--card: #141416;                /* lifted card surface */
--primary: #eab308;             /* gold — editorial warmth */
--secondary: #3b82f6;           /* blue — data/analytics */
--accent: #22c55e;              /* green — positive/win indicators only */
--ring: #eab308;
--warning: #f59e0b;
--text-article: #d4d4d8;        /* brighter for long-form reading */

/* Component utilities */
.card-glow      /* gold glow on hover */
.play-card      /* stronger gold treatment + scale(1.01) — Prediction Game cards */
.page-enter     /* 150ms fade on route change */
.article-body   /* 15.5px Lora serif, 1.75 line-height */
```

---

## Summary

ClearEdge Sports is no longer a betting tool with content — it's a **content platform with analytical tools**. The UI should reflect this by:

1. **Leading with stories** (Morning Roast hero, expert analysis cards)
2. **Supporting with data** (odds, rankings, weather — available but not dominant)
3. **Engaging with play** (trivia, prediction game, expert follow/fade)
4. **Converting with value** (newsletter, Edge Pass, Sharp Pass)

The north star: **ESPN meets Substack meets FanDuel Insights** — a place where you come for the stories, stay for the analysis, and can't resist the daily trivia.
