/**
 * NBA API Client — wraps Tank01 NBA (fantasy-stats host) → GameScore[].
 *
 * Uses the same RAPIDAPI_KEY / TANK01_API_KEY env var as MLB + NHL.
 * The NBA host on RapidAPI is `tank01-fantasy-stats.p.rapidapi.com`.
 */

import type { GameScore } from '../types';
import { trackedFetch } from '../../lib/api-tracker';
import { getCached, setCache } from '../../lib/cache';
import { getNBATeamName } from './teams';

const NBA_API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';
const NBA_API_BASE = `https://${NBA_API_HOST}`;
const API_KEY = process.env.TANK01_API_KEY || process.env.RAPIDAPI_KEY || '';

async function nbaFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!API_KEY) return null;
  const query = new URLSearchParams(params).toString();
  const url = `${NBA_API_BASE}${endpoint}${query ? '?' + query : ''}`;
  try {
    const resp = await trackedFetch(url, {
      headers: { 'x-rapidapi-host': NBA_API_HOST, 'x-rapidapi-key': API_KEY },
    });
    if (!resp.ok) return null;
    const data: any = await resp.json();
    if (data.statusCode !== 200) return null;
    return data.body as T;
  } catch { return null; }
}

/** Fetch NBA scores for a date → GameScore[] */
export async function fetchNBAScoreboard(date: string): Promise<GameScore[]> {
  const cacheKey = `nba-scores-${date}`;
  const cached = getCached<GameScore[]>(cacheKey);
  if (cached) return cached;

  const tank01Date = date.replace(/-/g, '');
  const scores = await nbaFetch<Record<string, any>>('/getNBAScoresOnly', { gameDate: tank01Date });
  if (!scores) return [];

  const results = Object.entries(scores).map(([gameID, game]) => ({
    gameId: gameID,
    sport: 'nba' as const,
    status: game.gameStatusCode === '2' || game.gameStatus === 'Completed' || game.gameStatus === 'Final'
      ? 'final' as const
      : game.gameStatus === 'Postponed' ? 'postponed' as const
      : game.gameStatusCode === '1' ? 'live' as const
      : 'scheduled' as const,
    awayTeam: getNBATeamName(game.away),
    homeTeam: getNBATeamName(game.home),
    awayTeamCode: game.away,
    homeTeamCode: game.home,
    awayScore: game.awayPts != null ? parseInt(game.awayPts) : (game.lineScore?.away?.total ? parseInt(game.lineScore.away.total) : null),
    homeScore: game.homePts != null ? parseInt(game.homePts) : (game.lineScore?.home?.total ? parseInt(game.lineScore.home.total) : null),
    metadata: {
      currentQuarter: game.currentPeriod,
      lineScore: game.lineScore,
    },
  }));

  if (results.length > 0) setCache(cacheKey, results, 60);
  return results;
}

/** Fetch NBA odds for a date */
export async function fetchNBAOdds(date: string): Promise<Record<string, any>> {
  const cacheKey = `nba-odds-${date}`;
  const cached = getCached<Record<string, any>>(cacheKey);
  if (cached) return cached;

  const tank01Date = date.replace(/-/g, '');
  const odds = await nbaFetch<Record<string, any>>('/getNBABettingOdds', { gameDate: tank01Date });
  if (odds && Object.keys(odds).length > 0) setCache(cacheKey, odds, 300);
  return odds || {};
}

/** Fetch NBA teams */
export async function fetchNBATeams(): Promise<any[]> {
  const cacheKey = 'nba-teams';
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const teams = await nbaFetch<any[]>('/getNBATeams');
  if (teams && teams.length > 0) setCache(cacheKey, teams, 1800);
  return teams || [];
}

/** Fetch NBA box score for a specific game */
export async function fetchNBABoxScore(gameID: string): Promise<any | null> {
  const cacheKey = `nba-boxscore-${gameID}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const data = await nbaFetch<any>('/getNBABoxScore', { gameID });
  if (data) setCache(cacheKey, data, 300);
  return data;
}

/** Fetch NBA schedule for a date */
export async function fetchNBAGames(date: string): Promise<any[]> {
  const cacheKey = `nba-games-${date}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const tank01Date = date.replace(/-/g, '');
  const games = await nbaFetch<any[]>('/getNBAGamesForDate', { gameDate: tank01Date });
  if (games && games.length > 0) setCache(cacheKey, games, 900);
  return games || [];
}
