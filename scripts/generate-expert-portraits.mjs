// Generate AI portraits for the 5 expert analysts using OpenAI's image API.
// Saves each PNG to client/public/experts/{id}.png and updates the
// expert_analysts.avatar column to point at the new URL.
//
// Usage:  node --env-file=.env scripts/generate-expert-portraits.mjs
// Cost:   ~$0.40 (5 images at gpt-image-1 standard quality, $0.08 each)
//
// The portraits are generated with a consistent editorial style so they
// feel like a coordinated set, not five random AI faces. Re-run with
// --force to overwrite existing files.

import fs from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';
import pg from 'pg';

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY missing. Run with: node --env-file=.env scripts/generate-expert-portraits.mjs');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing.');
  process.exit(1);
}

const FORCE = process.argv.includes('--force');
const OUT_DIR = path.resolve('client/public/experts');
const STYLE = 'editorial portrait, soft warm rim lighting on a deep charcoal background, three-quarter angle, professional headshot, photorealistic, 35mm lens, shallow depth of field, subtle gold accent in lighting, looking thoughtfully off-camera, magazine-cover quality, neutral expression with hint of confidence';

const PROMPTS = {
  contrarian: `A 40-year-old man with sharp, observant eyes and a slight smirk, wearing a charcoal turtleneck under a worn navy blazer, short dark hair, faint stubble. Looks like a former Wall Street trader who reads the room better than anyone. ${STYLE}.`,
  quant: `A 35-year-old person with intelligent eyes behind clear-rimmed glasses, wearing a fitted gray sweater, calm and composed expression. Hair pulled back simply. Looks like an MIT-trained data scientist who finds patterns invisible to others. ${STYLE}.`,
  sharp: `A 50-year-old man with a weathered, focused face and steel-gray short hair, wearing a tailored black shirt. Quietly intense expression. Looks like a Vegas oddsmaker who has seen every angle of a betting market. ${STYLE}.`,
  homie: `A 30-year-old person with a warm, easy smile, wearing a relaxed beige henley, slightly tousled hair, friendly approachable energy. Looks like a popular sports podcaster you'd grab a beer with. ${STYLE}.`,
  closer: `A 55-year-old man with grey-streaked hair and a calm, decisive gaze, wearing a dark olive jacket over a cream shirt. Composed and focused expression. Looks like a former MLB bullpen coach who reads the late-game flow. ${STYLE}.`,
};

await fs.mkdir(OUT_DIR, { recursive: true });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

for (const [id, prompt] of Object.entries(PROMPTS)) {
  const file = path.join(OUT_DIR, `${id}.png`);
  if (!FORCE) {
    try {
      await fs.access(file);
      console.log(`skip ${id}.png (already exists — pass --force to regenerate)`);
      continue;
    } catch {}
  }
  console.log(`generating ${id}...`);
  const res = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1024',
    quality: 'medium',
    n: 1,
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`  ✗ no image returned for ${id}`);
    continue;
  }
  await fs.writeFile(file, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${file}`);
}

// Update DB so the new URLs flow through GET /api/experts
console.log('\nupdating expert_analysts.avatar...');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
try {
  for (const id of Object.keys(PROMPTS)) {
    const { rowCount } = await pool.query(
      'UPDATE expert_analysts SET avatar = $1 WHERE id = $2',
      [`/experts/${id}.png`, id]
    );
    console.log(`  ${rowCount ? '✓' : '–'} ${id}: ${rowCount} row(s)`);
  }
} finally {
  await pool.end();
}

console.log('\nDone. Restart dev server so React Query refetches /api/experts.');
