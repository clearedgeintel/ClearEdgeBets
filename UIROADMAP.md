# ClearEdge Sports — UI/UX Roadmap

> Last updated: 2026-04-04
> Context: ClearEdge has evolved from a sports betting analytics tool into an **AI-automated sports news + expert analysis platform**. The UI needs to catch up.

---

## Current State Assessment

### What ClearEdge IS now:
- An AI-powered sports news site ("The Morning Roast")
- An expert picks platform (5 AI analysts with tracked records)
- A community prediction game (virtual balance, leaderboard)
- A data reference tool (power scores, park factors, odds)

### What the UI still says:
- "Pick Slip" in sidebar footer
- Pro/Elite tier gating around calculators and odds tools
- Moneyline odds prominent on every game card
- Sidebar organized like a sportsbook dashboard

### The gap:
The **content is editorial** (beat writers, game recaps, expert analysis) but the **navigation is transactional** (parlays, props, Kelly calculator). New users see a sports blog but navigate a betting terminal.

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
- [ ] **Remove hero logo/tagline block** — the site name is already in the nav. Use that space for content
- [ ] **Morning Roast as full-bleed hero** — featured story image should span the full viewport width (no max-w-5xl constraint on the hero)
- [ ] **Merge "Picks of the Day" and "Expert Picks Today"** into one section called "Today's Edge" — shows the 3 best picks from across all experts with one-line rationale
- [ ] **Yesterday's scores as a ticker strip** — thin horizontal bar below the nav (like ESPN), not a card section
- [ ] **Today's games as a compact schedule rail** — horizontal scroll of game pills (LAD@WSH 7:05, NYM@SF 10:15) instead of a 3-column grid

### 1.2 Navigation Overhaul
- [ ] **Replace sidebar with top navigation tabs** on desktop — "Feed | Games | Experts | Rankings | Play" — content area gets full width
- [ ] **Or: make sidebar collapsible** — collapsed by default showing only icons, expands on hover. Gives content more breathing room
- [ ] **Rename sidebar categories** to match editorial voice:
  - "Games & Odds" → "Today's Matchups"
  - "Rankings" → "Power Rankings"
  - "My Picks" → "My History"
  - "Tools & Calculators" → move to a settings/utility page, not primary nav
- [ ] **Remove "Pick Slip" from sidebar footer** — move to a floating button (like a shopping cart) that only appears when items are added
- [ ] **Mobile bottom nav update** — swap "Players" for "Trivia" (more engagement-oriented)

### 1.3 Typography & Spacing
- [ ] **Increase body text size** from 14px to 15-16px for article content (blog readability)
- [ ] **Add a serif option for article body text** — sans-serif for UI, serif for long-form content (like Substack/Medium)
- [ ] **Increase line-height** on Morning Roast articles from 1.5 to 1.7 for readability
- [ ] **Add section dividers** — thin horizontal rules between homepage sections instead of relying on spacing alone

---

## Phase 2 — Content Experience (2-3 weeks)

### 2.1 Morning Roast Enhancements
- [ ] **Article reading time estimate** — "3 min read" badge on each story card
- [ ] **Share buttons** — Twitter/X, copy link, share to group
- [ ] **Related stories** at the bottom of each article — "More from Chip Dalloway" or "Other games from April 3"
- [ ] **Category tags** — "Blowout", "Walk-off", "Shutout", "Extra Innings" auto-tagged from box score data
- [ ] **Writer follow** — users can follow specific beat writers and get their content surfaced first

### 2.2 Expert Panel Redesign
- [ ] **Expert cards as "columnist" profiles** — larger avatar (generated AI portrait instead of emoji), bio snippet visible without expanding
- [ ] **Picks presented as "analysis cards"** not table rows — each pick gets its own mini-card with rationale visible by default
- [ ] **Consensus indicator** — when 3+ experts agree, show a "🔥 Consensus Pick" banner on the game card
- [ ] **Expert vs Expert** — when two experts disagree on the same game, highlight it as a "Debate" card

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
- [ ] **Soften the dark theme** — move background from `#09090b` (near-black) to `#0f0f11` (slightly lighter). Reduces eye strain for long reading sessions
- [ ] **Reduce emerald green usage** — green screams "money/profit" which reinforces betting. Use it sparingly for positive indicators only. Primary accent → amber/gold for "ClearEdge" branding
- [ ] **Add warm accent** — introduce a warm tone (amber or terracotta) for editorial content to differentiate from the cool analytics palette
- [ ] **Expert avatars upgrade** — replace emoji avatars with AI-generated portrait illustrations (consistent art style, like The Athletic's columnist headshots)

### 3.2 Motion & Interaction
- [ ] **Page transitions** — subtle fade-in when navigating between pages (150ms ease-out)
- [ ] **Scroll-triggered animations** — Morning Roast cards fade in as they enter viewport
- [ ] **Hover states on game cards** — subtle scale (1.01) + border glow on hover
- [ ] **Loading skeletons** — match the actual content layout (not generic gray blocks)

### 3.3 Responsive Refinements
- [ ] **Tablet breakpoint** (768-1024px) — currently jumps from mobile (bottom nav) to desktop (sidebar). Add a middle state: top tabs + no sidebar
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
- [ ] **Daily streak counter** — "You've visited 5 days in a row! 🔥" — visible in nav
- [ ] **Trivia of the Day popup** — show 1 question on homepage visit (before scrolling), earn quick coins
- [ ] **Weekly wrap-up email** — "Your week: 3 trivia correct, Expert Sharp went 5-2, Morning Roast had 12 new recaps"

### 4.3 Social & Community
- [ ] **Comment on Morning Roast articles** — threaded comments with upvote/downvote
- [ ] **Share expert picks** — "I'm following The Quant's play tonight" → shareable card image
- [ ] **Leaderboard badges** — top 10 trivia players get a badge on their profile

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

| Change | Impact | Effort | Priority |
|--------|--------|--------|----------|
| Remove hero logo block, Morning Roast full-bleed | High | Low | ⭐ Do first |
| Merge duplicate pick sections | High | Low | ⭐ Do first |
| Scores as ticker strip | Medium | Low | ⭐ Do first |
| Sidebar collapsible or top tabs | High | Medium | Phase 1 |
| Article reading time + share buttons | Medium | Low | Phase 2 |
| Expert consensus banner on game cards | High | Low | Phase 2 |
| Unified content feed | High | High | Phase 2 |
| Soften dark theme + warm accent | Medium | Low | Phase 3 |
| Expert avatar upgrade (AI portraits) | Medium | Medium | Phase 3 |
| Onboarding flow | High | Medium | Phase 4 |
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

## Design Tokens (proposed updates)

```css
/* Shift from "trading terminal" to "premium sports publication" */
--background: #0f0f11;          /* slightly warmer than #09090b */
--card: #141416;                /* lift cards more from background */
--primary: #eab308;             /* gold as brand primary (was emerald) */
--primary-positive: #22c55e;    /* keep green for positive indicators only */
--secondary: #3b82f6;           /* blue for data/analytics elements */
--accent-warm: #d97706;         /* amber for editorial warmth */
--text-article: #d4d4d8;        /* slightly brighter for long-form reading */
--text-ui: #a1a1aa;             /* muted for interface elements */
```

---

## Summary

ClearEdge Sports is no longer a betting tool with content — it's a **content platform with analytical tools**. The UI should reflect this by:

1. **Leading with stories** (Morning Roast hero, expert analysis cards)
2. **Supporting with data** (odds, rankings, weather — available but not dominant)
3. **Engaging with play** (trivia, prediction game, expert follow/fade)
4. **Converting with value** (newsletter, Edge Pass, Sharp Pass)

The north star: **ESPN meets Substack meets FanDuel Insights** — a place where you come for the stories, stay for the analysis, and can't resist the daily trivia.
