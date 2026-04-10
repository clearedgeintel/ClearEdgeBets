import { Router } from "express";
import { db } from "../db";
import { playerPropParlays, propBets, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// ── Helper: calculate potential win from American odds ──────────────
function calcPayout(stakeInCents: number, americanOdds: number): number {
  if (americanOdds > 0) {
    return Math.round((stakeInCents * americanOdds) / 100);
  }
  return Math.round((stakeInCents * 100) / Math.abs(americanOdds));
}

// ── Helper: require auth ────────────────────────────────────────────
function getSessionUserId(req: any): number | null {
  return (req.session as any)?.userId ?? null;
}

// ── POST /api/parlays — Create a parlay bet ─────────────────────────
router.post("/api/parlays", async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { name, selections, stake, totalOdds } = req.body;

    if (!selections || !stake || !totalOdds) {
      return res.status(400).json({ error: "selections, stake, and totalOdds are required" });
    }

    const stakeInCents = Math.round(parseFloat(stake) * 100);
    if (stakeInCents <= 0) {
      return res.status(400).json({ error: "Stake must be positive" });
    }

    // Check virtual balance
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    const balance = user.virtualBalance ?? 100000;
    if (balance < stakeInCents) {
      return res.status(400).json({ error: "Insufficient virtual balance" });
    }

    const potentialPayout = calcPayout(stakeInCents, totalOdds);

    // Deduct stake from balance
    await db
      .update(users)
      .set({ virtualBalance: balance - stakeInCents })
      .where(eq(users.id, userId));

    // Create parlay record
    const [parlay] = await db
      .insert(playerPropParlays)
      .values({
        userId,
        name: name || null,
        selections,
        analysis: {},
        stake: stakeInCents,
        potentialPayout,
        totalOdds: Math.round(totalOdds),
        status: "pending",
        placedAt: new Date(),
      })
      .returning();

    res.status(201).json({
      ...parlay,
      stake: (parlay.stake / 100).toFixed(2),
      potentialPayout: (parlay.potentialPayout / 100).toFixed(2),
    });
  } catch (error) {
    console.error("Error creating parlay:", error);
    res.status(500).json({ error: "Failed to create parlay" });
  }
});

// ── GET /api/parlays — List user's parlays (most recent first) ──────
router.get("/api/parlays", async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const parlays = await db
      .select()
      .from(playerPropParlays)
      .where(eq(playerPropParlays.userId, userId))
      .orderBy(desc(playerPropParlays.createdAt));

    const converted = parlays.map((p) => ({
      ...p,
      stake: (p.stake / 100).toFixed(2),
      potentialPayout: (p.potentialPayout / 100).toFixed(2),
      actualPayout: p.actualPayout ? (p.actualPayout / 100).toFixed(2) : null,
    }));

    res.json(converted);
  } catch (error) {
    console.error("Error fetching parlays:", error);
    res.status(500).json({ error: "Failed to fetch parlays" });
  }
});

// ── GET /api/parlays/:id — Get single parlay (ownership check) ──────
router.get("/api/parlays/:id", async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const parlayId = parseInt(req.params.id);
    if (isNaN(parlayId)) return res.status(400).json({ error: "Invalid parlay ID" });

    const [parlay] = await db
      .select()
      .from(playerPropParlays)
      .where(eq(playerPropParlays.id, parlayId));

    if (!parlay) return res.status(404).json({ error: "Parlay not found" });
    if (parlay.userId !== userId) return res.status(403).json({ error: "Access denied" });

    res.json({
      ...parlay,
      stake: (parlay.stake / 100).toFixed(2),
      potentialPayout: (parlay.potentialPayout / 100).toFixed(2),
      actualPayout: parlay.actualPayout ? (parlay.actualPayout / 100).toFixed(2) : null,
    });
  } catch (error) {
    console.error("Error fetching parlay:", error);
    res.status(500).json({ error: "Failed to fetch parlay" });
  }
});

// ── POST /api/prop-bets — Place a single prop bet ───────────────────
router.post("/api/prop-bets", async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { propId, selection, odds, stake } = req.body;

    if (!propId || !selection || !odds || !stake) {
      return res.status(400).json({ error: "propId, selection, odds, and stake are required" });
    }

    const stakeInCents = Math.round(parseFloat(stake) * 100);
    if (stakeInCents <= 0) {
      return res.status(400).json({ error: "Stake must be positive" });
    }

    // Check virtual balance
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    const balance = user.virtualBalance ?? 100000;
    if (balance < stakeInCents) {
      return res.status(400).json({ error: "Insufficient virtual balance" });
    }

    const potentialWin = calcPayout(stakeInCents, odds);

    // Deduct stake from balance
    await db
      .update(users)
      .set({ virtualBalance: balance - stakeInCents })
      .where(eq(users.id, userId));

    // Create prop bet record
    const [bet] = await db
      .insert(propBets)
      .values({
        userId,
        propId,
        selection,
        odds: Math.round(odds),
        stake: stakeInCents,
        potentialWin,
        status: "pending",
        placedAt: new Date(),
      })
      .returning();

    res.status(201).json({
      ...bet,
      stake: (bet.stake / 100).toFixed(2),
      potentialWin: (bet.potentialWin / 100).toFixed(2),
      actualWin: bet.actualWin ? (bet.actualWin / 100).toFixed(2) : null,
    });
  } catch (error) {
    console.error("Error placing prop bet:", error);
    res.status(500).json({ error: "Failed to place prop bet" });
  }
});

// ── GET /api/prop-bets — Get user's prop bet history ────────────────
router.get("/api/prop-bets", async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const bets = await db
      .select()
      .from(propBets)
      .where(eq(propBets.userId, userId))
      .orderBy(desc(propBets.createdAt));

    const converted = bets.map((b) => ({
      ...b,
      stake: (b.stake / 100).toFixed(2),
      potentialWin: (b.potentialWin / 100).toFixed(2),
      actualWin: b.actualWin ? (b.actualWin / 100).toFixed(2) : null,
    }));

    res.json(converted);
  } catch (error) {
    console.error("Error fetching prop bets:", error);
    res.status(500).json({ error: "Failed to fetch prop bets" });
  }
});

export default router;
