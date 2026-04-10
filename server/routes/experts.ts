import { Router } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { fetchTank01Games, fetchTank01Odds, fetchTank01Player, fetchTank01Teams, fetchTank01RosterWithStats, parseMultiBookOdds, getConsensusOdds, getTeamFullName } from '../services/tank01-mlb';
import { getParkFactor } from '../lib/park-factors';

const router = Router();

// Get all experts with their records (public)
router.get('/experts', async (req, res) => {
  try {
    const { getAllExperts } = await import('@shared/expert-panel');
    const experts = getAllExperts();
    const records = await Promise.all(experts.map(async e => {
      const record = await storage.getExpertRecord(e.id);
      const total = record.wins + record.losses;
      return {
        ...e,
        record,
        winRate: total > 0 ? Math.round((record.wins / total) * 100) : 0,
        roi: 0, // Would need unit tracking for real ROI
      };
    }));
    res.json(records);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Get today's expert picks (tier-gated for free users)
router.get('/expert-picks', async (req, res) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    let picks = await storage.getExpertPicksByDate(date);

    // Admin and paid users get everything
    const userId = (req.session as any)?.userId;
    const user = userId ? await storage.getUser(userId) : null;

    if (!user?.isAdmin) {
      const tier = user?.subscriptionTier || 'free';
      const isPaid = tier === 'pro' || tier === 'edge' || tier === 'elite' || tier === 'sharp';

      if (!isPaid) {
        // Free: hide Sharp & Closer picks, delay others by 30 min
        picks = picks.filter(p => !['sharp', 'closer'].includes(p.expertId));
        const cutoff = new Date(Date.now() - 30 * 60 * 1000);
        picks = picks.filter(p => new Date(p.createdAt) < cutoff);
      }
    }

    res.json(picks);
  } catch { res.json([]); }
});

// Get picks for a specific game (public)
router.get('/expert-picks/game/:gameId', async (req, res) => {
  try {
    res.json(await storage.getExpertPicksByGame(req.params.gameId));
  } catch { res.json([]); }
});

// Get a single expert's pick history (public)
router.get('/expert-picks/expert/:id', async (req, res) => {
  try {
    res.json(await storage.getExpertPicksByExpert(req.params.id));
  } catch { res.json([]); }
});

// Follow/fade toggle (authenticated, tier-gated)
router.post('/expert-follow', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { expertId, mode } = req.body;
    if (!expertId || !mode) return res.status(400).json({ error: 'expertId and mode required' });

    const user = await storage.getUser(userId);
    const { normalizeTier, FREE_TIER_LIMITS } = await import('../stripe-config');
    const tier = normalizeTier(user?.subscriptionTier || 'free');

    // Free tier: no fade, max 1 follow
    if (tier === 'free') {
      if (mode === 'fade') return res.status(403).json({ error: 'Fade mode requires Edge Pass or higher', upgrade: true });
      const follows = await storage.getUserExpertFollows(userId);
      const activeFollows = follows.filter(f => f.expertId !== expertId);
      if (activeFollows.length >= FREE_TIER_LIMITS.maxExpertFollows) {
        return res.status(403).json({ error: `Free tier allows ${FREE_TIER_LIMITS.maxExpertFollows} follow. Upgrade for unlimited.`, upgrade: true });
      }
    }

    const result = await storage.toggleExpertFollow(userId, expertId, mode);
    res.json({ followed: !!result, mode: result?.mode || null });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Get user's follows (authenticated)
router.get('/expert-follows', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.json([]);
    res.json(await storage.getUserExpertFollows(userId));
  } catch { res.json([]); }
});

// ── Admin: Expert & Writer Management ─────────────────────────────

// Get all experts (with DB active status)
router.get('/admin/expert-analysts', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const { expertAnalysts } = await import('@shared/schema');
    const rows = await db.select().from(expertAnalysts).orderBy(expertAnalysts.name);

    // If DB is empty, seed from hardcoded defaults
    if (rows.length === 0) {
      const { getAllExperts } = await import('@shared/expert-panel');
      const defaults = getAllExperts();
      for (const e of defaults) {
        await db.insert(expertAnalysts).values({
          id: e.id, name: e.name, title: e.title, avatar: e.avatar, bio: e.bio,
          style: e.style, approach: e.approach, specialty: e.specialty,
          pickTypes: e.pickTypes, voiceDirective: e.voiceDirective,
          riskLevel: e.riskLevel, maxPicksPerDay: e.maxPicksPerDay, isActive: true,
        }).onConflictDoNothing();
      }
      const seeded = await db.select().from(expertAnalysts).orderBy(expertAnalysts.name);
      return res.json(seeded);
    }

    res.json(rows);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Toggle expert active status
router.patch('/admin/expert-analysts/:id/toggle', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const { expertAnalysts } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const existing = await db.select().from(expertAnalysts).where(eq(expertAnalysts.id, req.params.id));
    if (existing.length === 0) return res.status(404).json({ error: 'Expert not found' });

    const [updated] = await db.update(expertAnalysts)
      .set({ isActive: !existing[0].isActive })
      .where(eq(expertAnalysts.id, req.params.id)).returning();
    res.json(updated);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Create or update expert
router.post('/admin/expert-analysts', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const { expertAnalysts } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const data = req.body;
    if (!data.id || !data.name) return res.status(400).json({ error: 'id and name required' });

    const existing = await db.select().from(expertAnalysts).where(eq(expertAnalysts.id, data.id));
    if (existing.length > 0) {
      const [updated] = await db.update(expertAnalysts).set({
        name: data.name, title: data.title, avatar: data.avatar, bio: data.bio,
        style: data.style, approach: data.approach, specialty: data.specialty,
        pickTypes: data.pickTypes || [], voiceDirective: data.voiceDirective,
        riskLevel: data.riskLevel || 'moderate', maxPicksPerDay: data.maxPicksPerDay || 4,
        isActive: data.isActive ?? true,
      }).where(eq(expertAnalysts.id, data.id)).returning();
      return res.json(updated);
    }

    const [created] = await db.insert(expertAnalysts).values({
      id: data.id, name: data.name, title: data.title || '', avatar: data.avatar || '🎯',
      bio: data.bio || '', style: data.style || '', approach: data.approach || '',
      specialty: data.specialty || '', pickTypes: data.pickTypes || ['moneyline'],
      voiceDirective: data.voiceDirective || '', riskLevel: data.riskLevel || 'moderate',
      maxPicksPerDay: data.maxPicksPerDay || 4, isActive: data.isActive ?? true,
    }).returning();
    res.json(created);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Get all writers (with DB active status)
router.get('/admin/beat-writers', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const { beatWriters } = await import('@shared/schema');
    const rows = await db.select().from(beatWriters).orderBy(beatWriters.name);

    // Seed from hardcoded if empty
    if (rows.length === 0) {
      const { BEAT_WRITERS } = await import('@shared/beat-writers');
      for (const w of BEAT_WRITERS) {
        await db.insert(beatWriters).values({
          name: w.name, mood: w.mood, title: w.title, bio: w.bio,
          quirks: w.quirks, catchphrase: w.catchphrase, avatar: w.avatar,
          favoriteTeam: w.favoriteTeam || null, beatTeams: w.beatTeams,
          region: w.region || null, yearsExperience: w.yearsExperience,
          specialty: w.specialty, isActive: true,
        }).onConflictDoNothing();
      }
      const seeded = await db.select().from(beatWriters).orderBy(beatWriters.name);
      return res.json(seeded);
    }

    res.json(rows);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Toggle writer active status
router.patch('/admin/beat-writers/:id/toggle', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const { beatWriters } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const existing = await db.select().from(beatWriters).where(eq(beatWriters.id, parseInt(req.params.id)));
    if (existing.length === 0) return res.status(404).json({ error: 'Writer not found' });

    const [updated] = await db.update(beatWriters)
      .set({ isActive: !existing[0].isActive })
      .where(eq(beatWriters.id, parseInt(req.params.id))).returning();
    res.json(updated);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Create or update writer
router.post('/admin/beat-writers', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const { beatWriters } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const data = req.body;
    if (!data.name) return res.status(400).json({ error: 'name required' });

    if (data.id) {
      const [updated] = await db.update(beatWriters).set({
        name: data.name, mood: data.mood || 'witty', title: data.title || '',
        bio: data.bio || '', quirks: data.quirks || [], catchphrase: data.catchphrase || '',
        avatar: data.avatar || '✍️', favoriteTeam: data.favoriteTeam || null,
        beatTeams: data.beatTeams || [], region: data.region || null,
        yearsExperience: data.yearsExperience || 10, specialty: data.specialty || '',
        isActive: data.isActive ?? true,
      }).where(eq(beatWriters.id, data.id)).returning();
      return res.json(updated);
    }

    const [created] = await db.insert(beatWriters).values({
      name: data.name, mood: data.mood || 'witty', title: data.title || '',
      bio: data.bio || '', quirks: data.quirks || [], catchphrase: data.catchphrase || '',
      avatar: data.avatar || '✍️', favoriteTeam: data.favoriteTeam || null,
      beatTeams: data.beatTeams || [], region: data.region || null,
      yearsExperience: data.yearsExperience || 10, specialty: data.specialty || '',
      isActive: data.isActive ?? true,
    }).returning();
    res.json(created);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Admin: generate expert picks for today
router.post('/admin/generate-expert-picks', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const today = new Date().toISOString().split('T')[0];
    const { getAllExperts } = await import('@shared/expert-panel');
    const { generateExpertPicks } = await import('../services/openai');

    // Fetch today's games, odds, and team standings
    const [games, oddsMap, allTeams] = await Promise.all([
      fetchTank01Games(today),
      fetchTank01Odds(today),
      fetchTank01Teams(),
    ]);
    const teamLookup: Record<string, { wins: string; loss: string; diff: string }> = {};
    allTeams.forEach(t => { teamLookup[t.teamAbv] = { wins: t.wins, loss: t.loss, diff: t.DIFF }; });

    // Collect unique team abbreviations for roster fetches
    const teamAbvs: string[] = [];
    games.forEach(g => {
      if (!teamAbvs.includes(g.away)) teamAbvs.push(g.away);
      if (!teamAbvs.includes(g.home)) teamAbvs.push(g.home);
    });

    // Fetch all rosters with stats in parallel (cached per team)
    const rosterMap: Record<string, any[]> = {};
    await Promise.all(teamAbvs.map(async abv => {
      try {
        rosterMap[abv] = await fetchTank01RosterWithStats(abv);
      } catch { rosterMap[abv] = []; }
    }));

    // Helper: extract top hitters from roster by OPS
    const getTopHitters = (roster: any[], count = 3) => {
      return roster
        .filter((p: any) => p.stats?.Hitting && parseInt(p.stats.Hitting.AB || '0') >= 30)
        .map((p: any) => {
          const s = p.stats.Hitting;
          const ab = parseInt(s.AB || '0');
          const h = parseInt(s.H || '0');
          const bb = parseInt(s.BB || '0');
          const tb = parseInt(s.TB || '0');
          const avg = ab > 0 ? (h / ab).toFixed(3) : '.000';
          const obp = (ab + bb) > 0 ? ((h + bb) / (ab + bb)) : 0;
          const slg = ab > 0 ? tb / ab : 0;
          const ops = (obp + slg).toFixed(3);
          return {
            name: p.longName,
            avg: avg.startsWith('0') ? avg.slice(1) : avg,
            hr: parseInt(s.HR || '0'),
            ops: ops.startsWith('0') ? ops.slice(1) : ops,
            pos: p.pos,
          };
        })
        .sort((a: any, b: any) => parseFloat(b.ops) - parseFloat(a.ops))
        .slice(0, count);
    };

    // Helper: extract notable injuries from roster
    const getInjuries = (roster: any[]) => {
      return roster
        .filter((p: any) => p.injury?.designation)
        .map((p: any) => `${p.longName} (${p.injury.designation}, ${p.injury.description || 'undisclosed'})`)
        .slice(0, 5);
    };

    // Helper: build pitcher profile from player data
    const buildPitcherProfile = (player: any) => {
      if (!player) return undefined;
      const s = player.stats?.Pitching;
      if (!s) return { name: player.longName };
      const ip = parseFloat(s.InningsPitched || '0');
      const so = parseInt(s.SO || '0');
      const gs = parseInt(s.GamesStarted || s.GS || '0');
      return {
        name: player.longName,
        record: `${s.Win || 0}-${s.Loss || 0}`,
        era: s.ERA || undefined,
        whip: s.WHIP || undefined,
        k9: ip > 0 ? ((so / ip) * 9).toFixed(1) : undefined,
        ip: s.InningsPitched || undefined,
        gamesStarted: gs || undefined,
      };
    };

    const gameData = await Promise.all(games.map(async g => {
      const odds = oddsMap[g.gameID];
      const books = odds ? parseMultiBookOdds(odds) : [];
      const consensus = books.length > 0 ? getConsensusOdds(books) : { moneyline: null, total: null, spread: null };
      const parkFactor = getParkFactor(g.home);

      // Resolve pitcher names + stats
      const [awayPitcherData, homePitcherData] = await Promise.all([
        g.probableStartingPitchers?.away ? fetchTank01Player(g.probableStartingPitchers.away, true) : null,
        g.probableStartingPitchers?.home ? fetchTank01Player(g.probableStartingPitchers.home, true) : null,
      ]);

      const awayRoster = rosterMap[g.away] || [];
      const homeRoster = rosterMap[g.home] || [];

      return {
        gameId: `${g.away}@${g.home}`,
        away: getTeamFullName(g.away),
        home: getTeamFullName(g.home),
        gameTime: g.gameTime,
        awayPitcher: awayPitcherData?.longName,
        homePitcher: homePitcherData?.longName,
        awayPitcherProfile: buildPitcherProfile(awayPitcherData),
        homePitcherProfile: buildPitcherProfile(homePitcherData),
        awayTopHitters: getTopHitters(awayRoster),
        homeTopHitters: getTopHitters(homeRoster),
        awayInjuries: getInjuries(awayRoster),
        homeInjuries: getInjuries(homeRoster),
        awayRecord: teamLookup[g.away] ? `${teamLookup[g.away].wins}-${teamLookup[g.away].loss}` : undefined,
        homeRecord: teamLookup[g.home] ? `${teamLookup[g.home].wins}-${teamLookup[g.home].loss}` : undefined,
        awayRunDiff: teamLookup[g.away]?.diff ? parseInt(teamLookup[g.away].diff) : undefined,
        homeRunDiff: teamLookup[g.home]?.diff ? parseInt(teamLookup[g.home].diff) : undefined,
        moneyline: consensus.moneyline || undefined,
        total: consensus.total ? { line: consensus.total.line, overOdds: consensus.total.over, underOdds: consensus.total.under } : undefined,
        runline: consensus.spread ? { away: consensus.spread.away, home: consensus.spread.home, awayOdds: consensus.spread.awayOdds, homeOdds: consensus.spread.homeOdds } : undefined,
        parkFactor: parkFactor?.factor,
      };
    }));

    const allPicks: any[] = [];
    for (const expert of getAllExperts()) {
      const picks = await generateExpertPicks({ expert, games: gameData });
      for (const pick of picks) {
        const saved = await storage.createExpertPick({
          expertId: expert.id,
          gameId: pick.gameId,
          gameDate: today,
          pickType: pick.pickType,
          selection: pick.selection,
          odds: pick.odds,
          confidence: pick.confidence,
          rationale: pick.rationale,
          units: String(pick.units || 1),
          result: 'pending',
          gradedAt: null,
        });
        allPicks.push(saved);
      }
    }

    res.json({ success: true, totalPicks: allPicks.length, picks: allPicks });
  } catch (error: any) {
    console.error('Error generating expert picks:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
