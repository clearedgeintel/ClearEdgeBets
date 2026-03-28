import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

/**
 * Tests that every admin route correctly rejects unauthenticated
 * and non-admin requests, and allows admin users through.
 *
 * We test the auth guard pattern in isolation — no DB, no Stripe, no OpenAI.
 */

// The exact guard pattern used in routes.ts
function makeAdminGuard(getUser: (id: number) => Promise<{ isAdmin: boolean } | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const user = await getUser(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
  };
}

function buildApp(sessionUserId: number | undefined, isAdmin: boolean) {
  const app = express();
  app.use(express.json());
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));

  if (sessionUserId !== undefined) {
    app.use((req, _res, next) => {
      (req.session as any).userId = sessionUserId;
      next();
    });
  }

  const getUser = vi.fn().mockResolvedValue(
    sessionUserId ? { id: sessionUserId, isAdmin } : null
  );
  const guard = makeAdminGuard(getUser);

  app.get('/api/admin/bets', guard, (_req, res) => res.json([]));
  app.get('/api/admin/stats', guard, (_req, res) => res.json({}));
  app.get('/api/admin/users', guard, (_req, res) => res.json([]));
  app.post('/api/admin/update-tier', guard, (_req, res) => res.json({ ok: true }));
  app.post('/api/admin/generate-daily-picks', guard, (_req, res) => res.json({ ok: true }));
  app.post('/api/admin/settle-virtual-bets', guard, (_req, res) => res.json({ ok: true }));
  app.post('/api/admin/generate-ai-summaries', guard, (_req, res) => res.json({ ok: true }));

  return app;
}

const ADMIN_ROUTES = [
  ['GET',  '/api/admin/bets'],
  ['GET',  '/api/admin/stats'],
  ['GET',  '/api/admin/users'],
  ['POST', '/api/admin/update-tier'],
  ['POST', '/api/admin/generate-daily-picks'],
  ['POST', '/api/admin/settle-virtual-bets'],
  ['POST', '/api/admin/generate-ai-summaries'],
] as const;

describe('Admin route protection', () => {
  describe('no session → 401', () => {
    const app = buildApp(undefined, false);
    it.each(ADMIN_ROUTES)('%s %s', async (method, path) => {
      const res = await (method === 'GET' ? request(app).get(path) : request(app).post(path));
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });
  });

  describe('logged-in non-admin → 403', () => {
    const app = buildApp(42, false);
    it.each(ADMIN_ROUTES)('%s %s', async (method, path) => {
      const res = await (method === 'GET' ? request(app).get(path) : request(app).post(path));
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/admin access required/i);
    });
  });

  describe('logged-in admin → 200', () => {
    const app = buildApp(1, true);
    it.each(ADMIN_ROUTES)('%s %s', async (method, path) => {
      const res = await (method === 'GET' ? request(app).get(path) : request(app).post(path));
      expect(res.status).toBe(200);
    });
  });
});
