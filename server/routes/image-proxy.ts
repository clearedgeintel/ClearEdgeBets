/**
 * Image caching proxy.
 * GET /api/img?u=<encoded URL>
 *
 * Why: ESPN team logos are re-fetched on every page view; this proxy
 * caches them to disk with a 30-day immutable header so the browser
 * hits our server once per logo and never again.
 *
 * Resize support is deferred (needs sharp, a native dep with Windows
 * build complexity). The cache + CDN header alone gives a significant
 * LCP/CLS improvement on pages with many game cards.
 *
 * Only proxies whitelisted hosts to prevent SSRF.
 */

import { Router } from 'express';
import { createHash } from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const router = Router();

const CACHE_DIR = path.resolve('node_modules/.cache/img-proxy');
const MAX_AGE_SECONDS = 30 * 86400; // 30 days
const ALLOWED_HOSTS = new Set([
  'a.espncdn.com',
  'cdn.nba.com',
]);

fs.mkdir(CACHE_DIR, { recursive: true }).catch(() => {});

router.get('/api/img', async (req, res) => {
  try {
    const raw = String(req.query.u || '');
    if (!raw) return res.status(400).send('missing u');
    let url: URL;
    try { url = new URL(raw); } catch { return res.status(400).send('bad url'); }
    if (!ALLOWED_HOSTS.has(url.hostname)) return res.status(403).send('host not allowed');

    const hash = createHash('sha1').update(raw).digest('hex');
    const ext = url.pathname.endsWith('.png') ? 'png' : 'img';
    const cachePath = path.join(CACHE_DIR, `${hash}.${ext}`);

    try {
      const buf = await fs.readFile(cachePath);
      res.setHeader('Content-Type', ext === 'png' ? 'image/png' : 'image/*');
      res.setHeader('Cache-Control', `public, max-age=${MAX_AGE_SECONDS}, immutable`);
      res.setHeader('X-Cache', 'HIT');
      return res.end(buf);
    } catch { /* miss */ }

    const upstream = await fetch(raw);
    if (!upstream.ok) return res.status(502).send('upstream failed');
    const ab = await upstream.arrayBuffer();
    const out = Buffer.from(ab);

    await fs.writeFile(cachePath, out).catch(() => {});
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/*');
    res.setHeader('Cache-Control', `public, max-age=${MAX_AGE_SECONDS}, immutable`);
    res.setHeader('X-Cache', 'MISS');
    res.end(out);
  } catch (err) {
    console.error('img proxy error:', err);
    res.status(500).send('error');
  }
});

export default router;
