# ClearEdge Sports — Project Context

## Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui + Wouter routing
- **Backend**: Express.js + TypeScript + express-session + bcrypt
- **Database**: Supabase PostgreSQL + Drizzle ORM (30+ tables)
- **AI**: OpenAI GPT-4o / GPT-4o-mini
- **Sports Data**: Tank01 MLB API (primary), ESPN (fallback)
- **Weather**: OpenWeatherMap
- **Payments**: Stripe (subscription billing)
- **Hosting**: Railway

## Commands
- `npm run dev` — Start dev server (cross-env, tsx)
- `npm run build` — Vite build + esbuild server bundle
- `npm start` — Production server
- `npm test` — Vitest (50 tests)
- `npm run db:push` — Push schema to Supabase
- `npx kill-port 5000 && npm run dev` — Restart dev server

## Key Files
| File | Purpose |
|------|---------|
| `server/routes.ts` | All API routes (~7,600 lines — needs splitting) |
| `shared/schema.ts` | Drizzle schema (30+ tables, ~850 lines) |
| `server/services/tank01-mlb.ts` | Tank01 API + team stat aggregation |
| `server/services/openai.ts` | All AI generation (picks, reviews, newsletter) |
| `shared/beat-writers.ts` | 25 newsroom writer personalities |
| `shared/expert-panel.ts` | 5 expert analyst personas |
| `server/lib/api-tracker.ts` | External API call logging with payloads |
| `server/lib/park-factors.ts` | 30 MLB stadium run factors |
| `server/lib/cache.ts` | In-memory TTL cache |
| `client/src/App.tsx` | All routes + ProtectedRoute wrapper |

## Architecture
- **Newsroom** (25 writers) = content (articles, recaps, Morning Roast)
- **Expert Panel** (5 analysts) = picks (predictions with W/L tracking)
- Writers have regional beat assignments (teams they cover)
- Auto Morning Roast scheduler generates reviews after games complete
- All external API calls go through `trackedFetch()` for logging

## Conventions
- ESM throughout (`"type": "module"`)
- Session auth: `(req.session as any)?.userId`
- Admin check: `storage.getUser(userId)` then `user?.isAdmin`
- New tables: add to `shared/schema.ts`, run `npm run db:push`
- API keys: always from `process.env`, never hardcoded
- CSS: dark theme, emerald/blue/gold palette, Inter font
- Mobile: `hidden sm:table-cell` for optional table columns, bottom nav on mobile

## Environment Variables
DATABASE_URL, SESSION_SECRET, OPENAI_API_KEY, TANK01_API_KEY, ODDS_API_KEY, RAPIDAPI_KEY, OPENWEATHERMAP_API_KEY, STRIPE_SECRET_KEY

## Admin User
- Email: tim.hull@clearedgeintel.com
- The only admin account
