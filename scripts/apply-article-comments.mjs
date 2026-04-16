import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ override: true });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing.');
  process.exit(1);
}

function parsePg(url) {
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.+)@([^:/]+)(?::(\d+))?\/(.+?)(?:\?.*)?$/);
  if (!m) throw new Error('Unparseable DATABASE_URL');
  return { user: m[1], password: m[2], host: m[3], port: Number(m[4] || 5432), database: m[5] };
}

const pool = new pg.Pool({
  ...parsePg(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
});

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS article_comments (
      id serial PRIMARY KEY,
      review_id integer NOT NULL,
      user_id integer NOT NULL,
      parent_id integer,
      body text NOT NULL,
      is_hidden boolean DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ac_review ON article_comments(review_id);
  `);
  const { rows } = await pool.query("SELECT to_regclass('article_comments') AS t");
  console.log('article_comments:', rows[0].t ? 'ok' : 'missing');
} catch (err) {
  console.error('Failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
