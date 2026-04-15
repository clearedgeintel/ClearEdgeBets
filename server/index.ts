import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { schedulerService } from "./services/scheduler";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limiting
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/api/admin/generate', rateLimit({ windowMs: 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false }));
app.use('/api/games', rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }));

// Session configuration — stored in Supabase PostgreSQL
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
import pgSession from 'connect-pg-simple';
import pg from 'pg';
const PgStore = pgSession(session);
const sessionPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
app.use(session({
  store: new PgStore({
    pool: sessionPool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true only behind HTTPS reverse proxy
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function promoteAdmin() {
  const email = process.env.ADMIN_EMAIL || 'tim.hull@clearedgeintel.com';
  try {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!existing) {
      log(`admin seed: ${email} not registered yet — run scripts/seed-admin.mjs to create`);
      return;
    }
    if (!existing.isAdmin || existing.subscriptionTier !== 'elite') {
      await db.update(users)
        .set({ isAdmin: true, subscriptionTier: 'elite' })
        .where(eq(users.id, existing.id));
      log(`admin seed: promoted ${email} to admin/elite`);
    }
  } catch (err: any) {
    log(`admin seed skipped: ${err.message}`);
  }
}

(async () => {
  const server = await registerRoutes(app);
  await promoteAdmin();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT env var (Railway, Render, etc.) or default to 5000 for local dev
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    log(`✓ Automated AI ticket scheduler initialized`);
    log(`  - Daily tickets: 9:00 AM Central Time`);
    log(`  - Weekly summaries: Mondays at 9:00 AM Central Time`);
  });
})();
