// Seed or promote the site admin (tim.hull@clearedgeintel.com by default).
//
// Usage on a fresh DB:
//   ADMIN_PASSWORD="strongpassword" node --env-file=.env scripts/seed-admin.mjs
//
// If the admin account already exists, this just ensures is_admin=true and
// subscription_tier='elite' (password is left untouched). Safe to re-run.
//
// Env:
//   ADMIN_EMAIL     (default: tim.hull@clearedgeintel.com)
//   ADMIN_USERNAME  (default: timhull)
//   ADMIN_PASSWORD  (required only when creating the account for the first time)

import pg from 'pg';
import bcrypt from 'bcrypt';

const EMAIL = process.env.ADMIN_EMAIL || 'tim.hull@clearedgeintel.com';
const USERNAME = process.env.ADMIN_USERNAME || 'timhull';
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing. Run with --env-file=.env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const { rows } = await pool.query('SELECT id, email, is_admin, subscription_tier FROM users WHERE email = $1', [EMAIL]);
  if (rows.length > 0) {
    const u = rows[0];
    await pool.query(
      `UPDATE users SET is_admin = true, subscription_tier = 'elite' WHERE id = $1`,
      [u.id]
    );
    console.log(`✓ existing user (id=${u.id}, ${EMAIL}) promoted to admin/elite`);
  } else {
    if (!PASSWORD) {
      console.error(`✗ ${EMAIL} not found and ADMIN_PASSWORD not set.`);
      console.error('  Set ADMIN_PASSWORD before running to create the account.');
      process.exit(1);
    }
    const hashed = await bcrypt.hash(PASSWORD, 10);
    const { rows: created } = await pool.query(
      `INSERT INTO users (username, email, password, is_admin, subscription_tier, subscription_status)
       VALUES ($1, $2, $3, true, 'elite', 'active')
       RETURNING id`,
      [USERNAME, EMAIL, hashed]
    );
    console.log(`✓ created admin ${EMAIL} (id=${created[0].id}, username=${USERNAME})`);
  }
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
