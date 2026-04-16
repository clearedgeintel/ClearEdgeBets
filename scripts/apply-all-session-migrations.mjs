// Consolidated migration: applies every schema change from the April 2026
// UI-overhaul session. Idempotent — every statement uses ADD COLUMN IF NOT
// EXISTS / CREATE TABLE IF NOT EXISTS.
//
// Usage (against production):
//   DATABASE_URL="<prod-url>" node scripts/apply-all-session-migrations.mjs
//
// Or if running locally with .env pointing at prod:
//   node scripts/apply-all-session-migrations.mjs

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ override: true });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing.');
  process.exit(1);
}

// Manual parse — pg's URL parser chokes on unescaped @/! in the Supabase password.
function parsePg(url) {
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.+)@([^:/]+)(?::(\d+))?\/(.+?)(?:\?.*)?$/);
  if (!m) throw new Error('Unparseable DATABASE_URL');
  return { user: m[1], password: m[2], host: m[3], port: Number(m[4] || 5432), database: m[5] };
}

const pool = new pg.Pool({
  ...parsePg(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
});

const MIGRATIONS = [
  // ── Users (onboarding + favorites)
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_teams jsonb DEFAULT '[]'::jsonb`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_interest text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false`,

  // ── Contests v1
  `CREATE TABLE IF NOT EXISTS contests (
    id serial PRIMARY KEY,
    group_id integer NOT NULL REFERENCES groups(id),
    created_by integer NOT NULL REFERENCES users(id),
    name text NOT NULL,
    description text,
    starting_bankroll integer NOT NULL DEFAULT 100000,
    start_date timestamp NOT NULL,
    end_date timestamp NOT NULL,
    status text NOT NULL DEFAULT 'scheduled',
    winner_id integer REFERENCES users(id),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS contest_entries (
    id serial PRIMARY KEY,
    contest_id integer NOT NULL REFERENCES contests(id),
    user_id integer NOT NULL REFERENCES users(id),
    current_balance integer NOT NULL,
    total_bets integer DEFAULT 0,
    won_bets integer DEFAULT 0,
    lost_bets integer DEFAULT 0,
    joined_at timestamp DEFAULT now()
  )`,

  // ── Contests v2 config columns
  `ALTER TABLE contests ADD COLUMN IF NOT EXISTS sport text`,
  `ALTER TABLE contests ADD COLUMN IF NOT EXISTS scoring_mode text NOT NULL DEFAULT 'balance'`,
  `ALTER TABLE contests ADD COLUMN IF NOT EXISTS allow_parlays boolean NOT NULL DEFAULT true`,
  `ALTER TABLE contests ADD COLUMN IF NOT EXISTS min_stake_cents integer DEFAULT 0`,
  `ALTER TABLE contests ADD COLUMN IF NOT EXISTS max_stake_cents integer`,
  `ALTER TABLE contests ADD COLUMN IF NOT EXISTS entry_fee_coins integer DEFAULT 0`,
  `ALTER TABLE contests ADD COLUMN IF NOT EXISTS max_entrants integer`,

  // ── Virtual bets → contest link
  `ALTER TABLE virtual_bets ADD COLUMN IF NOT EXISTS contest_id integer`,

  // ── Contest chat
  `CREATE TABLE IF NOT EXISTS contest_messages (
    id serial PRIMARY KEY,
    contest_id integer NOT NULL REFERENCES contests(id),
    user_id integer NOT NULL REFERENCES users(id),
    message text NOT NULL,
    created_at timestamp DEFAULT now()
  )`,

  // ── Writer follows
  `CREATE TABLE IF NOT EXISTS user_writer_follows (
    id serial PRIMARY KEY,
    user_id integer NOT NULL,
    author text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_uwf_user ON user_writer_follows(user_id)`,

  // ── Article comments
  `CREATE TABLE IF NOT EXISTS article_comments (
    id serial PRIMARY KEY,
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    parent_id integer,
    body text NOT NULL,
    is_hidden boolean DEFAULT false,
    created_at timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ac_review ON article_comments(review_id)`,
];

try {
  console.log(`Applying ${MIGRATIONS.length} migrations to ${parsePg(process.env.DATABASE_URL).host}...`);
  for (let i = 0; i < MIGRATIONS.length; i++) {
    const sql = MIGRATIONS[i];
    const preview = sql.replace(/\s+/g, ' ').slice(0, 80);
    try {
      await pool.query(sql);
      console.log(`  ✓ [${i + 1}/${MIGRATIONS.length}] ${preview}...`);
    } catch (err) {
      console.error(`  ✗ [${i + 1}/${MIGRATIONS.length}] ${preview}...`);
      console.error(`    ${err.message}`);
      throw err;
    }
  }

  // Verify critical columns
  const checks = [
    { table: 'users', column: 'favorite_teams' },
    { table: 'users', column: 'primary_interest' },
    { table: 'users', column: 'onboarding_complete' },
    { table: 'virtual_bets', column: 'contest_id' },
    { table: 'contests', column: 'sport' },
  ];
  console.log('\nVerification:');
  for (const { table, column } of checks) {
    const { rows } = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`,
      [table, column]
    );
    console.log(`  ${rows.length ? '✓' : '✗'} ${table}.${column}`);
  }

  const tables = ['contests', 'contest_entries', 'contest_messages', 'user_writer_follows', 'article_comments'];
  for (const t of tables) {
    const { rows } = await pool.query(`SELECT to_regclass($1) AS t`, [t]);
    console.log(`  ${rows[0].t ? '✓' : '✗'} table ${t}`);
  }
  console.log('\nDone.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
