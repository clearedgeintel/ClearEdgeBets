/**
 * MLB API Client — wraps existing Tank01 + ESPN APIs to return GameScore[].
 */

import type { GameScore } from '../types';
import { fetchTank01Scores, getTeamFullName } from '../../services/tank01-mlb';

export async function fetchMLBScoreboard(date: string): Promise<GameScore[]> {
  const scores = await fetchTank01Scores(date);

  return Object.entries(scores).map(([gameID, game]: [string, any]) => ({
    gameId: gameID,
    sport: 'mlb' as const,
    status: game.gameStatusCode === '2' || game.gameStatus === 'Completed' ? 'final'
      : game.gameStatus === 'Postponed' ? 'postponed'
      : game.gameStatus === 'Suspended' ? 'suspended'
      : game.gameStatus === 'Canceled' ? 'canceled'
      : game.gameStatusCode === '1' ? 'live'
      : 'scheduled',
    awayTeam: getTeamFullName(game.away),
    homeTeam: getTeamFullName(game.home),
    awayTeamCode: game.away,
    homeTeamCode: game.home,
    awayScore: game.lineScore?.away?.R ? parseInt(game.lineScore.away.R) : null,
    homeScore: game.lineScore?.home?.R ? parseInt(game.lineScore.home.R) : null,
    metadata: {
      lineScore: game.lineScore,
      gameTime: game.gameTime,
    },
  }));
}
