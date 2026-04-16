import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Get all reviews or by date (public)
router.get('/blog/reviews', async (req, res) => {
  try {
    const { date } = req.query;
    const reviews = date
      ? await storage.getBlogReviewsByDate(date as string)
      : await storage.getRecentBlogReviews(30);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get single review by slug (public)
router.get('/blog/reviews/:slug', async (req, res) => {
  try {
    const review = await storage.getBlogReviewBySlug(req.params.slug);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Get yesterday's completed games available for review (admin)
router.get('/blog/available-games', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const date = (req.query.date as string) || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })();
    const tank01Date = date.replace(/-/g, '');

    const { fetchTank01Scores } = await import('../services/tank01-mlb');
    const scores = await fetchTank01Scores(date);

    // Filter to completed games only
    const completed = Object.entries(scores)
      .filter(([, g]) => g.gameStatusCode === '2' || g.gameStatus === 'Completed')
      .map(([id, g]) => ({
        gameID: id,
        away: g.away,
        home: g.home,
        awayScore: parseInt(String(g.lineScore?.away?.R || g.awayResult?.replace(/\D/g, '') || '0')),
        homeScore: parseInt(String(g.lineScore?.home?.R || g.homeResult?.replace(/\D/g, '') || '0')),
        awayResult: g.awayResult,
        homeResult: g.homeResult,
      }));

    // Check which already have reviews
    const existingReviews = await storage.getBlogReviewsByDate(date);
    const reviewedIds = new Set(existingReviews.map(r => r.gameId));

    const games = completed.map(g => ({
      ...g,
      hasReview: reviewedIds.has(g.gameID),
      date,
    }));

    res.json({ date, games, reviewedCount: existingReviews.length, totalCompleted: completed.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate a sarcastic review for a specific game (admin)
router.post('/blog/generate-review', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const { gameID, date } = req.body;
    if (!gameID) return res.status(400).json({ error: 'gameID required' });

    // Check if already reviewed
    const existing = await storage.getBlogReview(gameID);
    if (existing) return res.json({ review: existing, alreadyExisted: true });

    // Fetch box score from Tank01
    const { trackedFetch } = await import('../lib/api-tracker');
    const boxResp = await trackedFetch(
      `https://tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com/getMLBBoxScore?gameID=${gameID}`,
      { headers: { 'x-rapidapi-host': 'tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com', 'x-rapidapi-key': process.env.TANK01_API_KEY || process.env.RAPIDAPI_KEY || '' } }
    );
    if (!boxResp.ok) return res.status(502).json({ error: `Tank01 box score failed: ${boxResp.status}` });
    const boxData = (await boxResp.json() as any).body;

    // Build player highlights from box score
    const playerStats = boxData.playerStats || {};
    const highlights: string[] = [];
    const { fetchTank01Player } = await import('../services/tank01-mlb');

    // Get top hitters (most hits or HRs)
    const hitters = Object.values(playerStats)
      .filter((p: any) => p.Hitting && parseInt(p.Hitting.H || '0') > 0)
      .sort((a: any, b: any) => {
        const aScore = parseInt(a.Hitting.HR || '0') * 5 + parseInt(a.Hitting.H || '0') + parseInt(a.Hitting.RBI || '0') * 2;
        const bScore = parseInt(b.Hitting.HR || '0') * 5 + parseInt(b.Hitting.H || '0') + parseInt(b.Hitting.RBI || '0') * 2;
        return bScore - aScore;
      })
      .slice(0, 6) as any[];

    for (const h of hitters) {
      const info = await fetchTank01Player(h.playerID, false);
      const name = info?.longName || `Player #${h.playerID}`;
      const hit = h.Hitting;
      const parts = [];
      if (parseInt(hit.HR || '0') > 0) parts.push(`${hit.HR} HR`);
      parts.push(`${hit.H}-${hit.AB}`);
      if (parseInt(hit.RBI || '0') > 0) parts.push(`${hit.RBI} RBI`);
      if (parseInt(hit.R || '0') > 0) parts.push(`${hit.R} R`);
      if (parseInt(hit.BB || '0') > 0) parts.push(`${hit.BB} BB`);
      if (parseInt(hit.SO || '0') > 0) parts.push(`${hit.SO} K`);
      highlights.push(`${name} (${h.team}): ${parts.join(', ')}`);
    }

    // Get pitchers with decisions
    const decisions = boxData.decisions || [];
    for (const d of decisions) {
      const info = await fetchTank01Player(d.playerID, false);
      const name = info?.longName || `Player #${d.playerID}`;
      const pitcher = Object.values(playerStats).find((p: any) => p.playerID === d.playerID) as any;
      if (pitcher?.Pitching) {
        const p = pitcher.Pitching;
        highlights.push(`${name} (${d.team}, ${d.decision}): ${p.InningsPitched} IP, ${p.H} H, ${p.ER} ER, ${p.SO} K, ${p.BB} BB`);
      }
    }

    const awayScore = parseInt(boxData.lineScore?.away?.R || '0');
    const homeScore = parseInt(boxData.lineScore?.home?.R || '0');
    const gameDate = date || gameID.split('_')[0]?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') || '';

    const { generateSarcasticGameReview } = await import('../services/openai');
    const { getTeamFullName } = await import('../services/tank01-mlb');
    const review = await generateSarcasticGameReview({
      gameId: gameID,
      awayTeam: getTeamFullName(boxData.away || gameID.split('_')[1]?.split('@')[0] || ''),
      homeTeam: getTeamFullName(boxData.home || gameID.split('@')[1] || ''),
      awayScore,
      homeScore,
      venue: boxData.Venue || '',
      weather: boxData.Weather || '',
      attendance: boxData.Attendance || '',
      wind: boxData.Wind || '',
      lineScore: boxData.lineScore,
      decisions,
      playerHighlights: highlights.join('\n'),
    });

    // Fetch ESPN game images (hero thumbnail + team logos)
    let heroImage: string | undefined;
    let awayLogo: string | undefined;
    let homeLogo: string | undefined;
    let espnRecap: string | undefined;
    try {
      const espnDate = gameDate.replace(/-/g, '');
      const espnResp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${espnDate}`);
      if (espnResp.ok) {
        const espnData = await espnResp.json() as any;
        const awayCode = boxData.away || gameID.split('_')[1]?.split('@')[0];
        const homeCode = boxData.home || gameID.split('@')[1];
        const match = espnData.events?.find((ev: any) => {
          const comp = ev.competitions?.[0];
          const a = comp?.competitors?.find((c: any) => c.homeAway === 'away');
          const h = comp?.competitors?.find((c: any) => c.homeAway === 'home');
          return a?.team?.abbreviation === awayCode || h?.team?.abbreviation === homeCode;
        });
        if (match) {
          const comp = match.competitions?.[0];
          const headline = comp?.headlines?.[0];
          heroImage = headline?.video?.[0]?.thumbnail;
          espnRecap = headline?.shortLinkText;
          const awayCmp = comp?.competitors?.find((c: any) => c.homeAway === 'away');
          const homeCmp = comp?.competitors?.find((c: any) => c.homeAway === 'home');
          awayLogo = awayCmp?.team?.logo;
          homeLogo = homeCmp?.team?.logo;
        }
      }
    } catch { /* ESPN images are best-effort */ }

    // Fallback logos from ESPN CDN pattern
    const awayCode = boxData.away || '';
    const homeCode2 = boxData.home || '';
    if (!awayLogo && awayCode) awayLogo = `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${awayCode.toLowerCase()}.png`;
    if (!homeLogo && homeCode2) homeLogo = `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${homeCode2.toLowerCase()}.png`;

    // Save to database
    const saved = await storage.createBlogReview({
      gameId: gameID,
      gameDate,
      awayTeam: getTeamFullName(boxData.away || ''),
      homeTeam: getTeamFullName(boxData.home || ''),
      awayScore,
      homeScore,
      title: review.title,
      content: review.content,
      slug: review.slug,
      author: review.author,
      authorMood: review.authorMood,
      venue: boxData.Venue,
      weather: boxData.Weather,
      attendance: boxData.Attendance,
      heroImage,
      awayLogo,
      homeLogo,
      espnRecap,
      boxScoreData: boxData,
    });

    res.json({ review: saved, alreadyExisted: false });
  } catch (error: any) {
    console.error('Error generating blog review:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
