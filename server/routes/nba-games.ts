import { Router } from 'express';

const router = Router();

router.get('/api/nba/games', async (req, res) => {
  try {
    const { fetchNBAGames, fetchNBAOdds } = await import('../sports/nba/api-client');
    const { getNBATeamName, getNBATeamLogo } = await import('../sports/nba/teams');
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const [games, oddsMap] = await Promise.all([fetchNBAGames(date), fetchNBAOdds(date)]);
    const list = Array.isArray(games) ? games : Object.values(games || {});
    const formatted = list.map((g: any) => {
      const odds = oddsMap[g.gameID];
      const dk = odds?.draftkings;
      return {
        gameId: g.gameID, sport: 'nba', away: g.away, home: g.home,
        awayName: getNBATeamName(g.away), homeName: getNBATeamName(g.home),
        awayLogo: getNBATeamLogo(g.away), homeLogo: getNBATeamLogo(g.home),
        gameTime: g.gameTime,
        moneyline: dk ? { away: parseInt(dk.awayTeamML || '0'), home: parseInt(dk.homeTeamML || '0') } : null,
        spread: dk ? { away: dk.awayTeamSpread, home: dk.homeTeamSpread, awayOdds: parseInt(dk.awayTeamSpreadOdds || '0'), homeOdds: parseInt(dk.homeTeamSpreadOdds || '0') } : null,
        total: dk ? { line: dk.totalOver, overOdds: parseInt(dk.totalOverOdds || '0'), underOdds: parseInt(dk.totalUnderOdds || '0') } : null,
      };
    });
    res.json(formatted);
  } catch (err) { console.error('NBA games error:', err); res.json([]); }
});

router.get('/api/nba/scores', async (req, res) => {
  try {
    const { fetchNBAScoreboard } = await import('../sports/nba/api-client');
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    res.json(await fetchNBAScoreboard(date));
  } catch { res.json([]); }
});

router.get('/api/nba/teams', async (req, res) => {
  try {
    const { fetchNBATeams } = await import('../sports/nba/api-client');
    res.json(await fetchNBATeams());
  } catch { res.json([]); }
});

export default router;
