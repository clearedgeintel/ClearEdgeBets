/**
 * Contests Routes
 * Group-scoped finite competitions with configurable duration + starting bankroll.
 * Each entrant gets an isolated bankroll — contest bets do NOT touch the main virtual balance.
 */

import { Router, type Request } from "express";
import { db } from "../db";
import {
  contests,
  contestEntries,
  contestMessages,
  groups,
  groupMemberships,
  users,
  virtualBets,
} from "../../shared/schema";
import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";

const router = Router();

function auth(req: Request): number | null {
  return req.session.userId ?? null;
}

async function isGroupMember(groupId: number, userId: number): Promise<boolean> {
  const [m] = await db
    .select()
    .from(groupMemberships)
    .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, userId)))
    .limit(1);
  return !!m && m.isActive !== false;
}

// ── Create contest ────────────────────────────────────────────────────────
router.post("/api/contests", async (req, res) => {
  try {
    const userId = auth(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const {
      groupId, name, description, startingBankroll, startDate, durationDays,
      sport, scoringMode, allowParlays, minStake, maxStake, maxEntrants,
    } = req.body;
    if (!groupId || !name || !startDate || !durationDays) {
      return res.status(400).json({ error: "groupId, name, startDate, durationDays required" });
    }

    if (!(await isGroupMember(Number(groupId), userId))) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return res.status(400).json({ error: "Invalid startDate" });
    const end = new Date(start.getTime() + Number(durationDays) * 86400000);

    const bankrollCents = Math.max(
      1000,
      Math.round((Number(startingBankroll) || 1000) * 100)
    );

    const now = new Date();
    const status = start <= now ? "active" : "scheduled";

    const [contest] = await db
      .insert(contests)
      .values({
        groupId: Number(groupId),
        createdBy: userId,
        name,
        description: description || null,
        startingBankroll: bankrollCents,
        startDate: start,
        endDate: end,
        status,
        sport: sport || null,
        scoringMode: scoringMode || "balance",
        allowParlays: allowParlays !== false,
        minStakeCents: minStake ? Math.round(Number(minStake) * 100) : 0,
        maxStakeCents: maxStake ? Math.round(Number(maxStake) * 100) : null,
        entryFeeCoins: 0,
        maxEntrants: maxEntrants ? Number(maxEntrants) : null,
      })
      .returning();

    // Auto-join the creator
    await db.insert(contestEntries).values({
      contestId: contest.id,
      userId,
      currentBalance: bankrollCents,
    });

    res.status(201).json(contest);
  } catch (err) {
    console.error("Error creating contest:", err);
    res.status(500).json({ error: "Failed to create contest" });
  }
});

// ── List contests for the user's groups ───────────────────────────────────
router.get("/api/contests", async (req, res) => {
  try {
    const userId = auth(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const memberships = await db
      .select({ groupId: groupMemberships.groupId })
      .from(groupMemberships)
      .where(eq(groupMemberships.userId, userId));

    const groupIds = memberships.map((m) => m.groupId);
    if (groupIds.length === 0) return res.json([]);

    const rows = await db
      .select()
      .from(contests)
      .where(inArray(contests.groupId, groupIds))
      .orderBy(desc(contests.createdAt));

    // Attach the user's entry (if any) for each contest
    const entries = await db
      .select()
      .from(contestEntries)
      .where(eq(contestEntries.userId, userId));
    const entryMap = new Map(entries.map((e) => [e.contestId, e]));

    res.json(
      rows.map((c) => ({
        ...c,
        myEntry: entryMap.get(c.id) || null,
      }))
    );
  } catch (err) {
    console.error("Error listing contests:", err);
    res.status(500).json({ error: "Failed to list contests" });
  }
});

// ── Contest detail + leaderboard ──────────────────────────────────────────
router.get("/api/contests/:id", async (req, res) => {
  try {
    const userId = auth(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const id = Number(req.params.id);
    const [contest] = await db.select().from(contests).where(eq(contests.id, id)).limit(1);
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    if (!(await isGroupMember(contest.groupId, userId))) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const leaderboard = await db
      .select({
        entryId: contestEntries.id,
        userId: contestEntries.userId,
        currentBalance: contestEntries.currentBalance,
        totalBets: contestEntries.totalBets,
        wonBets: contestEntries.wonBets,
        lostBets: contestEntries.lostBets,
        joinedAt: contestEntries.joinedAt,
        username: users.username,
      })
      .from(contestEntries)
      .leftJoin(users, eq(users.id, contestEntries.userId))
      .where(eq(contestEntries.contestId, id));

    leaderboard.sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0));

    res.json({
      ...contest,
      leaderboard: leaderboard.map((r, i) => ({ ...r, rank: i + 1 })),
    });
  } catch (err) {
    console.error("Error fetching contest:", err);
    res.status(500).json({ error: "Failed to fetch contest" });
  }
});

// ── Join contest ──────────────────────────────────────────────────────────
router.post("/api/contests/:id/join", async (req, res) => {
  try {
    const userId = auth(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const id = Number(req.params.id);
    const [contest] = await db.select().from(contests).where(eq(contests.id, id)).limit(1);
    if (!contest) return res.status(404).json({ error: "Contest not found" });
    if (contest.status === "completed" || contest.status === "cancelled") {
      return res.status(400).json({ error: "Contest is closed" });
    }
    if (!(await isGroupMember(contest.groupId, userId))) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const [existing] = await db
      .select()
      .from(contestEntries)
      .where(and(eq(contestEntries.contestId, id), eq(contestEntries.userId, userId)))
      .limit(1);
    if (existing) return res.json(existing);

    // v2 gate: max entrants
    if (contest.maxEntrants) {
      const currentEntrants = await db
        .select({ id: contestEntries.id })
        .from(contestEntries)
        .where(eq(contestEntries.contestId, id));
      if (currentEntrants.length >= contest.maxEntrants) {
        return res.status(400).json({ error: "Contest is full" });
      }
    }

    // v2: entry fee enforcement deferred until a dedicated coin ledger exists;
    // for now we store the config on the contest but don't deduct.

    const [entry] = await db
      .insert(contestEntries)
      .values({
        contestId: id,
        userId,
        currentBalance: contest.startingBankroll,
      })
      .returning();

    res.status(201).json(entry);
  } catch (err) {
    console.error("Error joining contest:", err);
    res.status(500).json({ error: "Failed to join contest" });
  }
});

// ── Place a contest-scoped bet ────────────────────────────────────────────
router.post("/api/contests/:id/bets", async (req, res) => {
  try {
    const userId = auth(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const id = Number(req.params.id);
    const { gameId, betType, selection, odds, stake, sport } = req.body;
    if (!gameId || !betType || !selection || odds === undefined || !stake) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [contest] = await db.select().from(contests).where(eq(contests.id, id)).limit(1);
    if (!contest) return res.status(404).json({ error: "Contest not found" });
    if (contest.status !== "active" && contest.status !== "scheduled") {
      return res.status(400).json({ error: "Contest is closed" });
    }
    const now = new Date();
    if (now > contest.endDate) {
      return res.status(400).json({ error: "Contest has ended" });
    }

    const [entry] = await db
      .select()
      .from(contestEntries)
      .where(and(eq(contestEntries.contestId, id), eq(contestEntries.userId, userId)))
      .limit(1);
    if (!entry) return res.status(403).json({ error: "Join the contest first" });

    const stakeCents = Math.round(parseFloat(stake) * 100);
    if (stakeCents <= 0) return res.status(400).json({ error: "Stake must be positive" });
    if (entry.currentBalance < stakeCents) {
      return res.status(400).json({ error: "Insufficient contest balance" });
    }

    // v2 gates: sport filter, parlay toggle, min/max stake
    const effectiveSport = sport || "mlb";
    if (contest.sport && contest.sport !== effectiveSport) {
      return res.status(400).json({ error: `This contest is ${contest.sport.toUpperCase()}-only` });
    }
    if (contest.allowParlays === false && String(betType).toLowerCase() === "parlay") {
      return res.status(400).json({ error: "Parlays are disabled in this contest" });
    }
    if (contest.minStakeCents && stakeCents < contest.minStakeCents) {
      return res.status(400).json({ error: `Minimum stake is $${(contest.minStakeCents / 100).toFixed(2)}` });
    }
    if (contest.maxStakeCents && stakeCents > contest.maxStakeCents) {
      return res.status(400).json({ error: `Maximum stake is $${(contest.maxStakeCents / 100).toFixed(2)}` });
    }

    const oddsNum = Number(odds);
    const potentialWinCents =
      oddsNum > 0
        ? Math.round((stakeCents * oddsNum) / 100)
        : Math.round((stakeCents * 100) / Math.abs(oddsNum));

    // Debit contest bankroll
    await db
      .update(contestEntries)
      .set({
        currentBalance: entry.currentBalance - stakeCents,
        totalBets: (entry.totalBets || 0) + 1,
      })
      .where(eq(contestEntries.id, entry.id));

    const [bet] = await db
      .insert(virtualBets)
      .values({
        userId,
        sport: sport || "mlb",
        gameId,
        betType,
        selection,
        odds: oddsNum,
        stake: stakeCents,
        potentialWin: potentialWinCents,
        status: "pending",
        contestId: id,
      })
      .returning();

    res.status(201).json(bet);
  } catch (err) {
    console.error("Error placing contest bet:", err);
    res.status(500).json({ error: "Failed to place contest bet" });
  }
});

// ── List the user's bets in a contest ─────────────────────────────────────
router.get("/api/contests/:id/bets", async (req, res) => {
  try {
    const userId = auth(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const id = Number(req.params.id);
    const rows = await db
      .select()
      .from(virtualBets)
      .where(and(eq(virtualBets.contestId, id), eq(virtualBets.userId, userId)))
      .orderBy(desc(virtualBets.placedAt));

    res.json(
      rows.map((b) => ({
        ...b,
        stake: (b.stake / 100).toFixed(2),
        potentialWin: (b.potentialWin / 100).toFixed(2),
        actualWin: b.actualWin != null ? (b.actualWin / 100).toFixed(2) : null,
      }))
    );
  } catch (err) {
    console.error("Error listing contest bets:", err);
    res.status(500).json({ error: "Failed to list contest bets" });
  }
});

// ── Contest chat ──────────────────────────────────────────────────────────

router.get("/api/contests/:id/messages", async (req, res) => {
  try {
    const userId = auth(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const id = Number(req.params.id);
    const [contest] = await db.select().from(contests).where(eq(contests.id, id)).limit(1);
    if (!contest) return res.status(404).json({ error: "Contest not found" });
    if (!(await isGroupMember(contest.groupId, userId))) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const after = req.query.after ? Number(req.query.after) : 0;
    const rows = await db
      .select({
        id: contestMessages.id,
        userId: contestMessages.userId,
        message: contestMessages.message,
        createdAt: contestMessages.createdAt,
        username: users.username,
      })
      .from(contestMessages)
      .leftJoin(users, eq(users.id, contestMessages.userId))
      .where(
        after
          ? and(eq(contestMessages.contestId, id), eq(contestMessages.id, after))
          : eq(contestMessages.contestId, id)
      )
      .orderBy(asc(contestMessages.createdAt))
      .limit(100);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching contest messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/api/contests/:id/messages", async (req, res) => {
  try {
    const userId = auth(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const id = Number(req.params.id);
    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: "Message too long (max 500 chars)" });
    }

    const [contest] = await db.select().from(contests).where(eq(contests.id, id)).limit(1);
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    const [entry] = await db
      .select()
      .from(contestEntries)
      .where(and(eq(contestEntries.contestId, id), eq(contestEntries.userId, userId)))
      .limit(1);
    if (!entry) return res.status(403).json({ error: "Join the contest to chat" });

    const [msg] = await db
      .insert(contestMessages)
      .values({ contestId: id, userId, message: message.trim() })
      .returning();

    const [user] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1);

    res.status(201).json({ ...msg, username: user?.username });
  } catch (err) {
    console.error("Error posting contest message:", err);
    res.status(500).json({ error: "Failed to post message" });
  }
});

// ── Completion tick: called from settlement loop ──────────────────────────
// Closes any active contest past its endDate and assigns a winner.
export async function completeExpiredContests(): Promise<number> {
  const now = new Date();
  const activeOnes = await db
    .select()
    .from(contests)
    .where(and(eq(contests.status, "active")));

  let closed = 0;
  for (const c of activeOnes) {
    if (now < c.endDate) continue;

    const entries = await db
      .select()
      .from(contestEntries)
      .where(eq(contestEntries.contestId, c.id));

    let winnerId: number | null = null;
    if (entries.length > 0) {
      const top = entries.reduce((a, b) =>
        (b.currentBalance || 0) > (a.currentBalance || 0) ? b : a
      );
      winnerId = top.userId;
    }

    await db
      .update(contests)
      .set({ status: "completed", winnerId, updatedAt: now })
      .where(eq(contests.id, c.id));
    closed++;
  }

  // Promote scheduled → active once their start date passes
  const scheduled = await db
    .select()
    .from(contests)
    .where(eq(contests.status, "scheduled"));
  for (const c of scheduled) {
    if (now >= c.startDate) {
      await db
        .update(contests)
        .set({ status: "active", updatedAt: now })
        .where(eq(contests.id, c.id));
    }
  }

  return closed;
}

// ── Contest-aware settlement hook ─────────────────────────────────────────
// Called by settlement engine when a virtualBet with contestId is graded.
// Adds winnings (stake+profit) back to the contest entry for a win; loss is a no-op
// because the stake was already debited at placement time.
export async function applyContestSettlement(
  betId: number,
  result: "win" | "loss" | "push",
  payoutCents: number
): Promise<void> {
  const [bet] = await db.select().from(virtualBets).where(eq(virtualBets.id, betId)).limit(1);
  if (!bet || !bet.contestId) return;

  const [entry] = await db
    .select()
    .from(contestEntries)
    .where(
      and(eq(contestEntries.contestId, bet.contestId), eq(contestEntries.userId, bet.userId))
    )
    .limit(1);
  if (!entry) return;

  let newBalance = entry.currentBalance;
  let wonBets = entry.wonBets || 0;
  let lostBets = entry.lostBets || 0;

  if (result === "win") {
    newBalance += payoutCents;
    wonBets += 1;
  } else if (result === "loss") {
    lostBets += 1;
  } else if (result === "push") {
    // refund stake
    newBalance += bet.stake;
  }

  await db
    .update(contestEntries)
    .set({ currentBalance: newBalance, wonBets, lostBets })
    .where(eq(contestEntries.id, entry.id));
}

export default router;
