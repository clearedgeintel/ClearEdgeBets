/**
 * NHL API Client — wraps Tank01 NHL API to return GameScore[].
 */

import type { GameScore } from '../types';
import { trackedFetch } from '../../lib/api-tracker';
import { getCached, setCache } from '../../lib/cache';
import { getNHLTeamName } from './teams';

const NHL_API_BASE = 'https://tank01-nhl-live-in-game-real-time-statistics-nhl.p.rapidapi.com';
const API_KEY = process.env.TANK01_API_KEY || process.env.RAPIDAPI_KEY || '';
const API_HOST = 'tank01-nhl-live-in-game-real-time-statistics-nhl.p.rapidapi.com';

async function nhlFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!API_KEY) return null;
  const query = new URLSearchParams(params).toString();
  const url = `${NHL_API_BASE}${endpoint}${query ? '?' + query : ''}`;
  try {
    const resp = await trackedFetch(url, {
      headers: { 'x-rapidapi-host': API_HOST, 'x-rapidapi-key': API_KEY },
    });
    if (!resp.ok) return null;
    const data: any = await resp.json();
    if (data.statusCode !== 200) return null;
    return data.body as T;
  } catch { return null; }
}

/** Fetch NHL scores for a date → GameScore[] */
export async function fetchNHLScoreboard(date: string): Promise<GameScore[]> {
  const cacheKey = `nhl-scores-${date}`;
  const cached = getCached<GameScore[]>(cacheKey);
  if (cached) return cached;

  const tank01Date = date.replace(/-/g, '');
  const scores = await nhlFetch<Record<string, any>>('/getNHLScoresOnly', { gameDate: tank01Date });
  if (!scores) return [];

  const results = Object.entries(scores).map(([gameID, game]) => ({
    gameId: gameID,
    sport: 'nhl' as const,
    status: game.gameStatusCode === '2' || game.gameStatus === 'Completed' ? 'final' as const
      : game.gameStatus === 'Postponed' ? 'postponed' as const
      : game.gameStatusCode === '1' ? 'live' as const
      : 'scheduled' as const,
    awayTeam: getNHLTeamName(game.away),
    homeTeam: getNHLTeamName(game.home),
    awayTeamCode: game.away,
    homeTeamCode: game.home,
    awayScore: game.lineScore?.away?.total ? parseInt(game.lineScore.away.total) : null,
    homeScore: game.lineScore?.home?.total ? parseInt(game.lineScore.home.total) : null,
    metadata: {
      overtime: game.overtime,
      shootout: game.shootout,
      currentPeriod: game.currentPeriod,
      lineScore: game.lineScore,
    },
  }));

  if (results.length > 0) setCache(cacheKey, results, 60);
  return results;
}

/** Fetch NHL odds for a date */
export async function fetchNHLOdds(date: string): Promise<Record<string, any>> {
  const cacheKey = `nhl-odds-${date}`;
  const cached = getCached<Record<string, any>>(cacheKey);
  if (cached) return cached;

  const tank01Date = date.replace(/-/g, '');
  const odds = await nhlFetch<Record<string, any>>('/getNHLBettingOdds', { gameDate: tank01Date });
  if (odds && Object.keys(odds).length > 0) setCache(cacheKey, odds, 300);
  return odds || {};
}

/** Fetch NHL teams with standings */
export async function fetchNHLTeams(): Promise<any[]> {
  const cacheKey = 'nhl-teams';
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const teams = await nhlFetch<any[]>('/getNHLTeams');
  if (teams && teams.length > 0) setCache(cacheKey, teams, 1800);
  return teams || [];
}

/** Fetch NHL box score for a specific game */
export async function fetchNHLBoxScore(gameID: string): Promise<any | null> {
  const cacheKey = `nhl-boxscore-${gameID}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const data = await nhlFetch<any>('/getNHLBoxScore', { gameID });
  if (data) setCache(cacheKey, data, 300);
  return data;
}

/** Fetch NHL schedule for a date */
export async function fetchNHLGames(date: string): Promise<any[]> {
  const cacheKey = `nhl-games-${date}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const tank01Date = date.replace(/-/g, '');
  const games = await nhlFetch<any[]>('/getNHLGamesForDate', { gameDate: tank01Date });
  if (games && games.length > 0) setCache(cacheKey, games, 900);
  return games || [];
}
