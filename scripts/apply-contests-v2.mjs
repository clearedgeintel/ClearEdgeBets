// One-off: add Group Contests v2 config columns to the contests table.
// Run with: node --env-file=.env scripts/apply-contests-v2.mjs
// Idempotent — all ADD COLUMN IF NOT EXISTS.

import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing. Run with --env-file=.env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
ALTER TABLE contests ADD COLUMN IF NOT EXISTS sport text;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS scoring_mode text NOT NULL DEFAULT 'balance';
ALTER TABLE contests ADD COLUMN IF NOT EXISTS allow_parlays boolean NOT NULL DEFAULT true;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS min_stake_cents integer DEFAULT 0;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS max_stake_cents integer;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS entry_fee_coins integer DEFAULT 0;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS max_entrants integer;
`;

try {
  await pool.query(SQL);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='contests'
      AND column_name IN ('sport','scoring_mode','allow_parlays','min_stake_cents','max_stake_cents','entry_fee_coins','max_entrants')
    ORDER BY column_name
  `);
  console.log('contests v2 columns present:');
  rows.forEach((r) => console.log(`  ✓ ${r.column_name}`));
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
