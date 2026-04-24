# Spec: Standalone Prediction Markets Product

> A self-contained blueprint to build a Kalshi / DraftKings-Predictions-style prediction-market platform as its own product, separate from ClearEdge Sports. Hand this file to a fresh AI or engineer and they should be able to bootstrap a new repo from it.

---

## 1. Product vision

A consumer web + mobile platform where users trade **Yes/No event contracts** on sports, politics, weather, pop culture, and user-proposed markets. Each contract settles at **$1 (or 100¢) if correct, $0 if not**. Prices (1¢–99¢) reflect implied probability and move with demand.

- **Primary user story**: "I think the Lakers win tonight. Yes shares are 48¢. I buy 100 shares for $48. Lakers win → I collect $100. Lakers lose → I lose $48. If I want to exit early, I sell at whatever the current market price is."
- **Differentiation vs. sportsbook**: early cash-out at any price, two-sided markets, non-sports categories, lower house edge (AMM spread, not vig), shareable positions.
- **Working title**: "ClearPredict" (placeholder — bikeshed as needed).

## 2. Legal & regulatory notes (read first)

Real-money prediction markets in the US fall under **CFTC jurisdiction** (event contracts) or state gambling law (sports-outcome wagers), depending on structure. This is the single biggest strategic decision.

Three viable paths:

1. **Virtual-only (no real cash deposits / withdrawals)** — ship fast, no licensing. Free coins, leaderboards, tournament prizes paid in third-party gift cards if desired. Safe in all US states. Recommended for v1.
2. **Operate as a DCM** (Designated Contract Market) — CFTC-regulated. Kalshi's path. Takes 1–3 years, ~$5-20M capital, heavy compliance. Not realistic for a single-founder v1.
3. **Partner with a licensed DCM** — white-label on top of someone like Kalshi or Polymarket-for-US. Possible but requires business deal + revenue share.

**This spec assumes path #1 (virtual).** Keep the architecture clean enough that real-money can be added later behind a feature flag + KYC + CFTC partnership.

## 3. Core concepts

| Concept | Definition |
|---|---|
| **Event** | A real-world outcome with a clear resolution date and criteria ("Will Lakers beat Warriors on 2026-04-25?"). |
| **Market** | A Yes/No question on an event. Has a price curve from creation → trading close → resolution. Settles at 100¢ for the correct side, 0¢ for the other. |
| **Position** | A user's holding of shares on one side of one market. Long only in v1 (buying Yes or No). |
| **Trade** | A single buy or sell action. Leaves an audit trail. |
| **AMM** | Automated Market Maker — the algorithm that quotes Yes/No prices based on outstanding share volume. No human market-maker needed in v1. |
| **Resolution** | Deciding the winning side. Auto for sports (oracle = Tank01 / ESPN API). Manual for custom markets in v1. |
| **Cash-out** | Selling a position before resolution, receiving the current mark price × shares. |
| **Wallet** | A virtual balance in cents. Starts at 10,000¢ ($100). Earned through referrals, trivia, contests. No real-money deposits in v1. |

## 4. Tech stack recommendation

Monolith-first. Same stack as ClearEdge for faster onboarding of familiar engineers:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui. Wouter or React Router 7.
- **Backend**: Node 20 + Express 4 + TypeScript. ESM throughout.
- **Database**: PostgreSQL 16 (Supabase or self-hosted Neon). Drizzle ORM.
- **Auth**: Email/password + Google OAuth via Passport. express-session on Postgres.
- **Realtime**: Server-Sent Events from an in-memory pub/sub for price updates (upgrade to WebSockets only if SSE gets noisy). Redis/Upstash for multi-instance fanout later.
- **Cache**: In-memory per-instance for v1; Redis in prod.
- **Jobs**: `node-cron` for scheduled generation + resolution. Move to BullMQ/Redis queues if job volume grows.
- **Oracle / data source**: Tank01 via RapidAPI for sports (already has MLB/NHL/NBA). Fallback to ESPN scoreboard for redundancy.
- **Hosting**: Railway or Render for v1. Move to Fly.io or Vercel + Supabase when you need geographic distribution.
- **Observability**: Sentry (errors) + PostHog (product analytics) + a simple request-id logger.

## 5. Data model

```sql
-- Users
users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                      -- nullable if OAuth-only
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  virtual_balance_cents BIGINT NOT NULL DEFAULT 10000,  -- $100 starting balance
  referral_code TEXT UNIQUE,
  referred_by BIGINT REFERENCES users(id),
  is_admin BOOLEAN DEFAULT false,
  kyc_status TEXT DEFAULT 'unverified',    -- future real-money hook
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Event (the real-world thing being predicted)
events (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,        -- 'sports_game' | 'politics' | 'weather' | 'custom' | 'pop_culture'
  sport TEXT,                    -- for category=sports_game: 'mlb'|'nhl'|'nba'|'nfl'
  external_id TEXT,              -- Tank01 game ID etc; unique per-category
  title TEXT NOT NULL,           -- "Lakers @ Warriors — 2026-04-25"
  starts_at TIMESTAMPTZ NOT NULL,
  resolves_at TIMESTAMPTZ,       -- when we expect final data
  status TEXT DEFAULT 'upcoming',-- 'upcoming' | 'live' | 'final' | 'canceled'
  metadata JSONB,                -- sport-specific fields (scores, weather, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
)
CREATE INDEX ON events (category, starts_at);
CREATE UNIQUE INDEX ON events (category, external_id) WHERE external_id IS NOT NULL;

-- Market (a specific yes/no question on an event)
markets (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT REFERENCES events(id),   -- nullable for fully custom markets
  question TEXT NOT NULL,                  -- "Will Lakers beat Warriors?"
  description TEXT,
  resolution_criteria JSONB NOT NULL,      -- { type: 'team_wins', team: 'LAL' } or { type: 'total_over', line: 215.5 }
  image_url TEXT,
  yes_price_cents SMALLINT NOT NULL DEFAULT 50,   -- 1..99
  shares_yes BIGINT NOT NULL DEFAULT 0,           -- outstanding yes shares (demand signal)
  shares_no BIGINT NOT NULL DEFAULT 0,
  volume_cents BIGINT NOT NULL DEFAULT 0,         -- cumulative notional traded
  trades_count INTEGER NOT NULL DEFAULT 0,
  traders_count INTEGER NOT NULL DEFAULT 0,       -- denormalized unique user count
  closes_at TIMESTAMPTZ NOT NULL,          -- trading closes (usually = event starts_at)
  resolves_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',     -- 'open' | 'closed' | 'resolved' | 'voided'
  resolution TEXT,                         -- 'yes' | 'no' | 'void' (when resolved)
  resolved_by BIGINT REFERENCES users(id), -- admin who resolved (for custom markets)
  created_by BIGINT REFERENCES users(id),  -- null for system-generated
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
CREATE INDEX ON markets (status, closes_at);
CREATE INDEX ON markets (event_id);

-- Position (user's holding)
positions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  market_id BIGINT NOT NULL REFERENCES markets(id),
  side TEXT NOT NULL,                      -- 'yes' | 'no'
  shares BIGINT NOT NULL,                  -- currently held
  total_cost_cents BIGINT NOT NULL,        -- current cost basis (shares × avg)
  realized_pnl_cents BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',     -- 'open' | 'closed' | 'settled_win' | 'settled_loss' | 'voided'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
)
CREATE UNIQUE INDEX ON positions (user_id, market_id, side) WHERE status = 'open';
CREATE INDEX ON positions (user_id, status);

-- Trade (audit log of every buy/sell/settlement)
trades (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  market_id BIGINT NOT NULL REFERENCES markets(id),
  position_id BIGINT REFERENCES positions(id),
  action TEXT NOT NULL,                    -- 'buy' | 'sell' | 'settle'
  side TEXT NOT NULL,                      -- 'yes' | 'no'
  shares BIGINT NOT NULL,
  price_cents SMALLINT NOT NULL,           -- average fill price
  total_cents BIGINT NOT NULL,             -- signed: buy negative, sell/win positive
  balance_after_cents BIGINT NOT NULL,     -- user's balance after trade (for audit)
  created_at TIMESTAMPTZ DEFAULT now()
)
CREATE INDEX ON trades (market_id, created_at DESC);
CREATE INDEX ON trades (user_id, created_at DESC);

-- Market messages (chat / activity feed per market)
market_messages (
  id BIGSERIAL PRIMARY KEY,
  market_id BIGINT NOT NULL REFERENCES markets(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)
CREATE INDEX ON market_messages (market_id, created_at DESC);

-- Watchlist
user_market_watches (
  user_id BIGINT NOT NULL REFERENCES users(id),
  market_id BIGINT NOT NULL REFERENCES markets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
)
```

## 6. AMM design (simple linear-impact model)

Good enough for v1. Upgrade to LMSR or CPMM in v2 when liquidity matters.

```ts
// Constants (tune after load testing)
const SLIPPAGE_PER_SHARE = 1;   // price moves 1 cent per 100 shares
const PRICE_MIN = 1;
const PRICE_MAX = 99;

// Quote a buy: returns estimated total cost + new market price
function quoteBuy(oldPrice: number, shares: number, side: 'yes' | 'no') {
  const deltaPerShare = side === 'yes' ? SLIPPAGE_PER_SHARE : -SLIPPAGE_PER_SHARE;
  const newPrice = clamp(oldPrice + deltaPerShare * shares / 100, PRICE_MIN, PRICE_MAX);
  const avgFill = (oldPrice + newPrice) / 2;
  const totalCents = Math.round(avgFill * shares);
  return { totalCents, avgFillCents: avgFill, newPrice };
}

// Quote a sell: reverse direction
function quoteSell(oldPrice: number, shares: number, side: 'yes' | 'no') { ... }

// Execute in a single DB transaction:
//  1. SELECT market FOR UPDATE
//  2. Check user balance (buy) or share count (sell)
//  3. Compute quote
//  4. Update market (yes_price, shares_yes/no, volume, trades_count, traders_count)
//  5. Upsert position (weighted average cost for buy; reduce shares for sell)
//  6. Insert trade row
//  7. Update user balance
```

Key invariants:
- `yes_price_cents ∈ [1, 99]` always.
- `no_price_cents = 100 - yes_price_cents` (implicit — don't store both).
- `shares_yes, shares_no >= 0`.
- `SUM(position.shares) × price` per side reconciles with market state.
- Buying yes moves yes price UP; buying no moves yes price DOWN (= no price UP).

## 7. Service architecture

Single monolith with clear internal boundaries:

```
standalone-predict/
├── client/                         # React app (Vite)
│   └── src/
│       ├── pages/
│       │   ├── home.tsx            # Hot markets feed
│       │   ├── market-detail.tsx   # Trade a single market
│       │   ├── my-positions.tsx
│       │   ├── leaderboard.tsx
│       │   └── account.tsx
│       ├── components/
│       │   ├── market-card.tsx
│       │   ├── price-pill.tsx
│       │   ├── buy-panel.tsx
│       │   ├── position-row.tsx
│       │   └── trade-feed.tsx
│       ├── hooks/
│       │   ├── use-market-stream.ts  # SSE subscription for live prices
│       │   └── use-auth.ts
│       └── lib/
│           ├── amm-math.ts          # mirror of server for live quote preview
│           └── queryClient.ts
├── server/
│   ├── index.ts                    # Express entry
│   ├── db.ts                       # Drizzle pool
│   ├── auth/                       # Passport strategies + session
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── markets.ts              # CRUD + trade endpoints
│   │   ├── positions.ts
│   │   ├── leaderboard.ts
│   │   ├── events.ts               # admin: create/resolve custom events
│   │   └── stream.ts               # SSE /api/stream/markets/:id
│   ├── services/
│   │   ├── amm.ts                  # quoteBuy, quoteSell, executeTrade (DB tx)
│   │   ├── market-generator.ts     # daily sports market creation
│   │   ├── resolver.ts             # auto-resolve when event goes final
│   │   ├── oracle-sports.ts        # Tank01 / ESPN data fetch for resolution
│   │   ├── pubsub.ts               # in-memory event bus (swap to Redis later)
│   │   └── scheduler.ts            # node-cron: generate + resolve + close
│   └── shared/
│       └── schema.ts               # Drizzle schema shared client-side (type-only)
├── scripts/
│   ├── apply-schema.mjs            # idempotent prod migration
│   ├── seed-dev.mjs                # dev seed data
│   └── generate-markets.mjs        # manual one-off generator
└── package.json
```

## 8. Key endpoints

```
GET  /api/markets                       ?category=&status=&sport=&sort=hot|new|closing
GET  /api/markets/:id                   market + last 20 trades + current user position
POST /api/markets/:id/trade             { side, action: 'buy'|'sell', dollars | shares }
POST /api/markets                       admin / user-created (user markets need moderation queue)
GET  /api/positions                     current user's open + settled positions with mark-to-market
GET  /api/leaderboard?window=7d|30d|ytd realized pnl + win-rate ranking
GET  /api/stream/markets/:id            SSE — price ticks on every trade
POST /api/markets/:id/watch             toggle watchlist
POST /api/admin/markets/:id/resolve     { resolution: 'yes'|'no'|'void' }  admin-only for custom markets
```

## 9. Realtime strategy

- Single Node process can handle ~1K concurrent SSE clients comfortably. That's enough for v1.
- Each trade publishes `{ marketId, yesPriceCents, volume, tradeCount }` to an internal `EventEmitter`. SSE handler subscribes to it and fans out to connected clients for that market.
- Graceful fallback: client polls every 3s if SSE fails.
- Upgrade path: replace EventEmitter with Redis pub/sub when you scale to multiple instances.

## 10. Market generation (sports)

Cron at 7 AM CT daily:
1. Fetch next 36h of games via Tank01 for each enabled sport.
2. For each game, upsert an `events` row keyed on `(category='sports_game', external_id=gameID)`.
3. Create 2 markets per game by default:
   - Moneyline: "Will {home} beat {away}?" — seed `yes_price_cents` from ESPN/Tank01 moneyline implied probability (converted to percentage and clamped 10–90).
   - Total: "Will total > {line}?" — seed at 50¢.
4. Idempotent: skip if `(event_id, question)` already exists.

## 11. Resolution & oracle

Cron every 15 min:
1. Find `events` with `status != 'final'` whose `starts_at < now() - 4h` (probably final).
2. Fetch current state from oracle (Tank01 + ESPN as fallback). If both agree on final + score, write `events.status='final'` with `metadata.final_score`.
3. For each open/closed market on that event, evaluate `resolution_criteria`:
   - `{ type: 'team_wins', team: 'LAL' }` → did LAL win?
   - `{ type: 'total_over', line: 215.5 }` → was total > 215.5?
4. For each open position on that market:
   - Winning side: credit `shares × 100` cents to user's balance; position `settled_win`.
   - Losing side: position `settled_loss`.
5. Mark market `resolved` with resolution.
6. Write `trades` rows with `action='settle'` for audit.
7. Publish SSE event `market:resolved` so clients update instantly.

Canceled games → `resolution='void'`, refund all positions at avg cost basis (break-even).

## 12. Auth

- Email + password (bcrypt, cost 10) + email verification via Resend.
- Google OAuth via `passport-google-oauth20`.
- Session cookie: httpOnly, sameSite=lax, 30-day expiry. Sessions stored in `session` table via `connect-pg-simple`.
- Augment `express-session` with `SessionData { userId?: number }` in a `.d.ts` so `req.session.userId` is typed (see the TS augmentation pattern from the ClearEdge codebase).

## 13. Wallet / balance

All monetary values stored in **cents** as `BIGINT` (ints only; no float money ever). Starting balance 10,000¢ = $100. Top-ups in v1:
- Referral bonus: 1,000¢ when invitee funds their first trade.
- Daily login streak (7 → 500¢, 30 → 5,000¢).
- Admin grant for contests/winners.

Never allow `virtual_balance_cents < 0` — enforce with a `CHECK` constraint and a balance-check inside the trade transaction.

## 14. Anti-abuse

- Rate limit `/api/markets/:id/trade` to 30/min per user.
- Reject trades on markets where `closes_at <= now()`.
- Soft cap: max 10,000 shares per user per market per hour (prevents someone pumping a market).
- Require email verification before first trade.
- Flag (for admin review) any user whose win rate > 75% over 50+ trades — probably API abuse or insider info.
- Rotate market prices to center if no activity for 24h (prevents stale illiquid markets from trapping capital).

## 15. Phased rollout

**Phase 1 — MVP (2–3 weeks)**
- Schema + AMM + sports markets for MLB/NHL/NBA
- Trade UI (buy/sell at current price)
- Positions page with mark-to-market
- Resolution on game final
- Email auth, virtual balance

**Phase 2 — Engagement (2 weeks)**
- SSE live prices
- Leaderboard (daily/weekly/monthly realized P&L)
- Per-market chat
- Watchlist + email notifications on big price moves
- Referral program

**Phase 3 — Depth (3 weeks)**
- User-proposed custom markets (non-sports) with moderation queue
- Order book option for power users (alongside AMM)
- NFL + college sports
- Mobile PWA with push notifications

**Phase 4 — Monetization (open-ended)**
- Premium tier: early access to markets, advanced charts, export
- Sponsored markets (brand-promoted events)
- B2B embedded widget (drop-in market card for content sites)
- Real-money evaluation — partnership with a CFTC-registered DCM

## 16. Files to generate in a fresh repo

Quick scaffold list if you're bootstrapping:

```
package.json                — deps: react, react-dom, express, drizzle-orm, pg, bcrypt, passport, express-session, connect-pg-simple, zod, @tanstack/react-query, wouter, canvas-confetti, date-fns, lucide-react
tsconfig.json               — strict mode, moduleResolution=bundler, ESM
vite.config.ts              — client build + proxy /api to :5000
tailwind.config.ts          — gold/amber brand, soft dark theme
drizzle.config.ts           — points at shared/schema.ts
.env.example                — DATABASE_URL, SESSION_SECRET, TANK01_API_KEY, RESEND_API_KEY, GOOGLE_OAUTH_CLIENT_ID/SECRET
scripts/apply-schema.mjs    — idempotent ADD COLUMN / CREATE TABLE IF NOT EXISTS
scripts/seed-dev.mjs        — creates 3 test users, 10 sample markets, 20 trades
README.md                   — this file condensed + setup steps
LICENSE                     — MIT or your choice
```

## 17. What to reuse from ClearEdge Sports

If you build this inside the same org, you can lift:
- **Tank01 API wrappers** (`server/sports/*/api-client.ts`) — schedule, odds, scoreboard fetching
- **Settlement-engine iteration pattern** (`server/services/settlement-engine.ts:125-178`) — find final games, iterate bets, grade, credit balance in a transaction
- **`ExpertAvatar`, `SportBadge`, `SportSwitcher`** components
- **Onboarding modal** pattern (multi-step, favorite teams)
- **Confetti helper** (`client/src/lib/confetti.ts`) — fire on settled_win
- **Auth session typing** (`server/types/session.d.ts`)
- **Image-caching proxy** (`server/routes/image-proxy.ts`)
- **`seed-admin.mjs` + boot-time promotion** pattern
- **OG image generation** via `satori` + `@resvg/resvg-js` (for social-shareable position cards)

## 18. Verification checklist (for MVP launch)

- [ ] Create dev user, get 10,000¢ balance, buy 100 yes shares at 50¢ on a live game market.
- [ ] Balance decreases by 50¢ × 100 = 5,000¢. Position shows 100 @ 50¢. Market `yes_price_cents` ticks to 51.
- [ ] Buy another 500 yes shares: avg cost increases, price moves to ~56¢.
- [ ] Sell 200 shares: credit ≈ 56¢ × 200 = 11,200¢. Position reduced to 400 shares. Realized P&L positive.
- [ ] Game goes final in user's favor → cron resolver credits 400 × 100¢ = 40,000¢ within 15 min. Position `settled_win`.
- [ ] SSE page open: another browser makes a trade, first browser sees price tick without reload.
- [ ] Voided game: positions refunded at cost, zero realized P&L.
- [ ] Rate limit: 31st trade in a minute returns 429.
- [ ] Admin resolves a custom market via /api/admin/markets/:id/resolve; all positions settle accordingly.
- [ ] `DROP DATABASE` + `apply-schema.mjs` + `seed-dev.mjs` → fully functional app from cold boot.

---

## 19. Next steps for you

1. Decide on **brand + domain** (current placeholder: ClearPredict). Register, set up Vercel/Railway account.
2. Decide **virtual-only vs. real-money path** (strongly recommend virtual-only for v1).
3. Fork the structural bones from ClearEdge — start with a fresh repo but copy `server/db.ts`, `server/lib/cache.ts`, `server/types/session.d.ts`, the `scripts/apply-*.mjs` pattern, and the shadcn/ui component folder.
4. Build Phase 1 in order: schema → AMM + trade endpoint → market generator → resolver → trade UI → positions page → deploy → dogfood with 5-10 people.
5. Instrument with PostHog from day one so you know which markets people actually trade.
