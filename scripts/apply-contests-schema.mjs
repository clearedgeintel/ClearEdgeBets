// One-off: apply contest tables + virtual_bets.contest_id column.
// Run with: node --env-file=.env scripts/apply-contests-schema.mjs
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set. Try: node --env-file=.env scripts/apply-contests-schema.mjs');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
CREATE TABLE IF NOT EXISTS contests (
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
);

CREATE TABLE IF NOT EXISTS contest_entries (
  id serial PRIMARY KEY,
  contest_id integer NOT NULL REFERENCES contests(id),
  user_id integer NOT NULL REFERENCES users(id),
  current_balance integer NOT NULL,
  total_bets integer DEFAULT 0,
  won_bets integer DEFAULT 0,
  lost_bets integer DEFAULT 0,
  joined_at timestamp DEFAULT now()
);

ALTER TABLE virtual_bets ADD COLUMN IF NOT EXISTS contest_id integer;
`;

try {
  await pool.query(SQL);
  const [{ rows: c }, { rows: e }, { rows: col }] = await Promise.all([
    pool.query("SELECT to_regclass('contests') AS t"),
    pool.query("SELECT to_regclass('contest_entries') AS t"),
    pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='virtual_bets' AND column_name='contest_id'"),
  ]);
  console.log('contests:', c[0].t ? 'ok' : 'missing');
  console.log('contest_entries:', e[0].t ? 'ok' : 'missing');
  console.log('virtual_bets.contest_id:', col.length ? 'ok' : 'missing');
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
