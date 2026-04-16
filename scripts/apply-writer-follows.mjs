import dotenv from 'dotenv';
import pg from 'pg';

// Force .env to win over any machine-level env var (e.g. a DATABASE_URL set
// in the user's Windows environment from another project).
dotenv.config({ override: true });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing.');
  process.exit(1);
}

// Manually parse DATABASE_URL because the password contains unescaped @ / ! that
// confuse pg's default URL parser (last '@' must be the user/host separator).
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
    CREATE TABLE IF NOT EXISTS user_writer_follows (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      author text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_uwf_user ON user_writer_follows(user_id);
  `);
  const { rows } = await pool.query("SELECT to_regclass('user_writer_follows') AS t");
  console.log('user_writer_follows:', rows[0].t ? 'ok' : 'missing');
} catch (err) {
  console.error('Failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
