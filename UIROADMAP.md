# ClearEdge Sports — UI/UX Roadmap

> Last updated: 2026-04-15
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
- Pick Slip is a floating button (only appears with active bets)
- Gold (#eab308) brand accent, AI expert portraits, loading skeletons everywhere
- Prediction Game promoted with NEW badge, active-contest banner, Play badge on mobile
- Shareable OG pick cards, contest chat, Beat the Experts H2H, sortable leaderboards
- Win confetti, streak chip, consensus banner

### Remaining gap:
Editorial game cards still lead with odds (should lead with pitchers/weather and hide odds behind a toggle). "For You" feed personalization, onboarding, and multi-sport visual system still ahead.

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
- [ ] **Related stories** at the bottom of each article (`/api/blog/related?tags=` endpoint — Phase 3)
- [ ] **Writer follow** — users can follow specific beat writers and get their content surfaced first

### 2.2 Expert Panel Redesign
- [x] **AI-generated expert portraits** — `ExpertAvatar` renders URL or emoji fallback; 5 DALL-E portraits in `client/public/experts/`
- [x] **Consensus indicator** — 🔥 "Consensus Pick — N experts agree" banner on Today's Edge (home.tsx)
- [x] **Shareable pick cards** — `/api/og/pick/:id` renders 1200×630 PNG via `satori` + `@resvg/resvg-js` (expert portrait, team logos, pick, confidence, ClearEdge wordmark); Share2 button on each expert pick card opens X intent
- [x] **Beat the Experts H2H** — `/h2h` page with side-by-side user-vs-expert comparison (win %, ROI, record), AHEAD badges, Challenge CTA linking to contest creation
- [x] **Contests v2 create dialog** — sport filter, scoring mode (balance/ROI/win-rate), parlay toggle, min/max stake, max entrants wired into create dialog + server-side enforcement
- [x] **Contest chat** — `contest_messages` table + REST endpoints + bubble-style chat drawer on contest-detail with 8s polling
- [ ] **Columnist profile cards** — larger avatar + 2-sentence bio on hover, latest pick headline (Phase 3)
- [ ] **Picks as "analysis cards"** not table rows — each pick gets its own mini-card with rationale visible by default
- [ ] **Expert vs Expert "Debate" cards** — when two experts disagree on the same game

### 2.3 Game Cards Reimagined
- [ ] **Default view: editorial** — show team logos, pitchers, venue, weather, expert pick count. No odds unless user expands
- [ ] **Odds behind a toggle** — "Show Odds" button reveals the 8-book comparison. Keeps the default view clean for casual fans
- [ ] **Inline Morning Roast link** — if a recap exists for this matchup, show "Read the recap →" link on the card
- [ ] **Live game state** — during games, show inning/score with a green "LIVE" badge. After completion, show final score with "Read Recap" link

### 2.4 Feed Experience
- [ ] **Unified content feed** — blend Morning Roast articles, expert picks, trivia results, and game updates into one scrollable timeline (like Twitter/X)
- [ ] **"For You" personalization** — based on followed experts and favorite teams, surface relevant content first
- [ ] **Content type indicators** — small icon badges: ☕ recap, 🎯 expert pick, ❓ trivia, 📊 ranking change

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
- [ ] **Scroll-triggered animations** — `.scroll-fade` utility exists but not wired to IntersectionObserver yet

### 3.3 Responsive Refinements
- [ ] **Tablet breakpoint pass** (768–1024px) — sidebar-rail + top-nav tabs behavior check
- [ ] **Game cards on tablet** — 2-column grid with slightly larger text
- [ ] **Morning Roast on tablet** — featured story + 2 cards (not 3)
- [ ] **Expert Panel on mobile** — horizontal swipe carousel instead of vertical stack

---

## Phase 4 — Engagement Patterns (2-4 weeks)

### 4.1 Onboarding
- [ ] **First-visit flow** — "What are you here for?" → Sports News / Expert Picks / Prediction Game → tailors the homepage
- [ ] **Team selection** — on signup, pick 3 favorite teams. Used for "For You" feed and Morning Roast prioritization
- [ ] **Guided tour** — 4-step tooltip tour: "Here's the Morning Roast", "Meet our Expert Panel", "Play the Prediction Game", "Subscribe for daily picks"

### 4.2 Retention Hooks
- [x] **Streak counter** — flame chip in top nav, computed from virtual-bet win streak (`top-nav.tsx` `StreakChip`)
- [ ] **Trivia of the Day popup** — first-visit-of-day bubble on homepage
- [ ] **Weekly wrap-up email** — "Your week: 3 trivia correct, Expert Sharp went 5-2, 12 new recaps"

### 4.3 Social & Community
- [ ] **Comments on Morning Roast articles** — threaded with upvote/downvote
- [x] **Shareable expert picks** — `/api/og/pick/:id` 1200×630 PNG shipped via satori; Share button on expert pick cards
- [x] **Contest chat** — `contest_messages` table + REST polling + bubble chat drawer on contest-detail
- [x] **Active-contest banner** — gold "Live Contest" banner on homepage when user has ≥1 active entry
- [x] **Win confetti** — `canvas-confetti` fires on bet-settle win + contest champion (throttled, gold palette)
- [x] **Sortable contest leaderboard** — Balance / ROI / Win % sort toggle with re-ranked display
- [ ] **Leaderboard badges** — top 10 trivia players get a profile badge

---

## Phase 5 — Platform Maturity (ongoing)

### 5.1 Multi-Sport Visual System
- [ ] **Sport-specific color accents** — MLB (emerald), NFL (blue), NBA (orange), NHL (ice blue)
- [ ] **Sport switcher in nav** — tab bar or dropdown to switch between sports. Each sport has its own Morning Roast, Expert Panel, Games page
- [ ] **Universal game card component** — same card structure works for MLB, NFL, NBA, NHL with sport-specific data fields

### 5.2 Content CMS
- [ ] **Admin content editor** — rich text editor for Morning Roast articles (currently generated markdown only)
- [ ] **Scheduled publishing** — write article, schedule for 8 AM release
- [ ] **Content calendar view** — see what's scheduled, what's published, gaps in coverage

### 5.3 Performance & Accessibility
- [ ] **Image optimization** — ESPN images served via proxy with resizing (avoid loading 500px logos at 32px display size)
- [ ] **Lazy load below-fold sections** — defer Expert Picks, Yesterday's Scores, Today's Games until user scrolls
- [ ] **WCAG 2.1 AA compliance** — check contrast ratios on dark theme, add aria labels to interactive elements
- [ ] **Core Web Vitals** — target LCP < 2.5s, CLS < 0.1, FID < 100ms

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
| Editorial game cards (Show Odds) | High | Medium | Next |
| Unified "For You" feed | High | High | Next |
| Onboarding flow + fav teams | High | Medium | Phase 4 |
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
