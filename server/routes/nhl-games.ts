import { Router } from 'express';

const router = Router();

router.get('/api/nhl/games', async (req, res) => {
  try {
    const { fetchNHLGames, fetchNHLOdds } = await import('../sports/nhl/api-client');
    const { getNHLTeamName, getNHLTeamLogo } = await import('../sports/nhl/teams');
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const [games, oddsMap] = await Promise.all([fetchNHLGames(date), fetchNHLOdds(date)]);
    const formatted = games.map((g: any) => {
      const odds = oddsMap[g.gameID];
      const dk = odds?.draftkings;
      return {
        gameId: g.gameID, sport: 'nhl', away: g.away, home: g.home,
        awayName: getNHLTeamName(g.away), homeName: getNHLTeamName(g.home),
        awayLogo: getNHLTeamLogo(g.away), homeLogo: getNHLTeamLogo(g.home),
        gameTime: g.gameTime,
        moneyline: dk ? { away: parseInt(dk.awayTeamML || '0'), home: parseInt(dk.homeTeamML || '0') } : null,
        puckLine: dk ? { away: dk.awayTeamPuckLine, home: dk.homeTeamPuckLine, awayOdds: parseInt(dk.awayTeamPuckLineOdds || '0'), homeOdds: parseInt(dk.homeTeamPuckLineOdds || '0') } : null,
        total: dk ? { line: dk.totalOver, overOdds: parseInt(dk.totalOverOdds || '0'), underOdds: parseInt(dk.totalUnderOdds || '0') } : null,
      };
    });
    res.json(formatted);
  } catch (err) { console.error('NHL games error:', err); res.json([]); }
});

router.get('/api/nhl/scores', async (req, res) => {
  try {
    const { fetchNHLScoreboard } = await import('../sports/nhl/api-client');
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    res.json(await fetchNHLScoreboard(date));
  } catch { res.json([]); }
});

router.get('/api/nhl/teams', async (req, res) => {
  try {
    const { fetchNHLTeams } = await import('../sports/nhl/api-client');
    res.json(await fetchNHLTeams());
  } catch { res.json([]); }
});

export default router;
