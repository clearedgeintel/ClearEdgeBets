/**
 * Tank01 MLB API Service
 * Primary data source for games, odds, players, and team stats.
 * API: tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com
 */
import { trackedFetch } from '../lib/api-tracker';
import { getCached, setCache } from '../lib/cache';

const BASE_URL = 'https://tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com';
const API_KEY = process.env.TANK01_API_KEY || process.env.RAPIDAPI_KEY || '';
const API_HOST = 'tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com';

// ─── Types ───────────────────────────────────────────────────────────

export interface Tank01Game {
  gameID: string;           // "20260403_SD@BOS"
  away: string;             // "SD"
  home: string;             // "BOS"
  teamIDAway: string;
  teamIDHome: string;
  gameTime: string;         // "2:10p"
  gameTime_epoch: string;
  gameDate: string;         // "20260403"
  gameType: string;
  probableStartingPitchers: {
    away: string;           // player ID
    home: string;
  };
}

export interface Tank01Odds {
  awayTeam: string;
  homeTeam: string;
  gameDate: string;
  [bookmaker: string]: any; // bet365, draftkings, fanduel, etc.
}

export interface BookOdds {
  homeTeamML: string;
  awayTeamML: string;
  totalOver: string;
  totalUnder: string;
  totalOverOdds: string;
  totalUnderOdds: string;
  homeTeamRunLine: string;
  awayTeamRunLine: string;
  homeTeamRunLineOdds: string;
  awayTeamRunLineOdds: string;
}

export interface Tank01Player {
  playerID: string;
  longName: string;
  teamAbv: string;
  pos: string;
  espnHeadshot?: string;
  mlbHeadshot?: string;
  injury?: { description: string; injDate?: string; designation?: string };
  stats?: {
    Pitching?: {
      ERA: string;
      Win: string;
      Loss: string;
      SO: string;
      InningsPitched: string;
      WHIP: string;
      Save: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export interface Tank01Score {
  away: string;
  home: string;
  gameID: string;
  gameStatus: string;
  gameStatusCode: string;
  awayResult?: string;
  homeResult?: string;
  lineScore?: any;
}

export interface Tank01Team {
  teamAbv: string;
  teamCity: string;
  teamName: string;
  teamID: string;
  wins: string;
  loss: string;
  RS: string;
  RA: string;
  DIFF: string;
  division: string;
  conference: string;
  espnLogo1?: string;
  mlbLogo1?: string;
}

// ─── API Helpers ─────────────────────────────────────────────────────

async function tank01Fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!API_KEY) {
    console.warn('Tank01 API key not configured');
    return null;
  }

  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${endpoint}${query ? '?' + query : ''}`;

  try {
    const resp = await trackedFetch(url, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY,
      },
    });

    if (!resp.ok) {
      console.error(`Tank01 API error: ${resp.status} ${resp.statusText} for ${endpoint}`);
      return null;
    }

    const data: any = await resp.json();
    if (data.statusCode !== 200) {
      console.error(`Tank01 API status ${data.statusCode} for ${endpoint}`);
      return null;
    }

    return data.body as T;
  } catch (err) {
    console.error(`Tank01 API fetch error for ${endpoint}:`, err);
    return null;
  }
}

// ─── Date Helper ─────────────────────────────────────────────────────

function toTank01Date(dateStr: string): string {
  // Convert "2026-04-03" or Date to "20260403"
  return dateStr.replace(/-/g, '');
}

// ─── Public API ──────────────────────────────────────────────────────

/** Fetch all games for a given date with probable pitchers */
export async function fetchTank01Games(date: string): Promise<Tank01Game[]> {
  const cacheKey = `tank01-games-${date}`;
  const cached = getCached<Tank01Game[]>(cacheKey);
  if (cached) return cached;

  const games = await tank01Fetch<Tank01Game[]>('/getMLBGamesForDate', {
    gameDate: toTank01Date(date),
  });

  if (games && games.length > 0) {
    setCache(cacheKey, games, 900); // 15 min
  }
  return games || [];
}

/** Fetch multi-book betting odds for a given date */
export async function fetchTank01Odds(date: string): Promise<Record<string, Tank01Odds>> {
  const cacheKey = `tank01-odds-${date}`;
  const cached = getCached<Record<string, Tank01Odds>>(cacheKey);
  if (cached) return cached;

  const odds = await tank01Fetch<Record<string, Tank01Odds>>('/getMLBBettingOdds', {
    gameDate: toTank01Date(date),
  });

  if (odds && Object.keys(odds).length > 0) {
    setCache(cacheKey, odds, 300); // 5 min
  }
  return odds || {};
}

/** Fetch live scores for a given date */
export async function fetchTank01Scores(date: string): Promise<Record<string, Tank01Score>> {
  const cacheKey = `tank01-scores-${date}`;
  const cached = getCached<Record<string, Tank01Score>>(cacheKey);
  if (cached) return cached;

  const scores = await tank01Fetch<Record<string, Tank01Score>>('/getMLBScoresOnly', {
    gameDate: toTank01Date(date),
    topPerformers: 'true',
  });

  if (scores && Object.keys(scores).length > 0) {
    setCache(cacheKey, scores, 60); // 1 min for live data
  }
  return scores || {};
}

/** Fetch player info (with optional season stats) */
export async function fetchTank01Player(playerID: string, getStats = true): Promise<Tank01Player | null> {
  const cacheKey = `tank01-player-${playerID}`;
  const cached = getCached<Tank01Player>(cacheKey);
  if (cached) return cached;

  const player = await tank01Fetch<Tank01Player>('/getMLBPlayerInfo', {
    playerID,
    ...(getStats ? { getStats: 'true' } : {}),
  });

  if (player) {
    setCache(cacheKey, player, 3600); // 1 hour
  }
  return player;
}

/** Fetch all 30 MLB teams with current W/L records */
export async function fetchTank01Teams(): Promise<Tank01Team[]> {
  const cacheKey = 'tank01-teams';
  const cached = getCached<Tank01Team[]>(cacheKey);
  if (cached) return cached;

  const teams = await tank01Fetch<Tank01Team[]>('/getMLBTeams');

  if (teams && teams.length > 0) {
    setCache(cacheKey, teams, 1800); // 30 min
  }
  return teams || [];
}

export interface Tank01RosterPlayer {
  playerID: string;
  longName: string;
  pos: string;
  jerseyNum: string;
  bat: string;
  throw: string;
  height: string;
  weight: string;
  bDay: string;
  espnHeadshot?: string;
  mlbHeadshot?: string;
  injury?: { description: string; injDate?: string; designation?: string };
  isStartingPitcher?: string;
  teamAbv: string;
}

/** Fetch team roster */
export async function fetchTank01Roster(teamAbv: string): Promise<Tank01RosterPlayer[]> {
  const cacheKey = `tank01-roster-${teamAbv}`;
  const cached = getCached<Tank01RosterPlayer[]>(cacheKey);
  if (cached) return cached;

  const data = await tank01Fetch<{ roster: Tank01RosterPlayer[] }>('/getMLBTeamRoster', { teamAbv });
  const roster = data?.roster || [];

  if (roster.length > 0) {
    setCache(cacheKey, roster, 3600); // 1 hour
  }
  return roster;
}

/** Fetch team roster WITH inline stats (getStats=true) */
export async function fetchTank01RosterWithStats(teamAbv: string): Promise<any[]> {
  const cacheKey = `tank01-roster-stats-${teamAbv}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const data = await tank01Fetch<{ roster: any[] }>('/getMLBTeamRoster', { teamAbv, getStats: 'true' });
  const roster = data?.roster || [];

  if (roster.length > 0) {
    setCache(cacheKey, roster, 3600);
  }
  return roster;
}

/** Aggregate individual player stats into team-level batting + pitching stats */
export interface AggregatedTeamStats {
  teamAbv: string;
  gamesPlayed: number;
  batting: {
    ab: number; h: number; hr: number; bb: number; so: number; rbi: number; tb: number; r: number;
    avg: number; slg: number; obp: number; ops: number;
    runsPerGame: number; hrPerGame: number; bbPerGame: number;
  };
  pitching: {
    ip: number; er: number; h: number; bb: number; so: number; sv: number; wins: number; losses: number; cg: number;
    era: number; whip: number; k9: number;
    svPerGame: number; cgPerGame: number;
  };
}

export async function aggregateTeamStats(teamAbv: string): Promise<AggregatedTeamStats | null> {
  const cacheKey = `tank01-team-agg-${teamAbv}`;
  const cached = getCached<AggregatedTeamStats>(cacheKey);
  if (cached) return cached;

  const [teams, roster] = await Promise.all([
    fetchTank01Teams(),
    fetchTank01RosterWithStats(teamAbv),
  ]);

  const team = teams.find(t => t.teamAbv === teamAbv);
  if (!team || roster.length === 0) return null;

  const gp = parseInt(team.wins || '0') + parseInt(team.loss || '0') || 1;

  // Aggregate batting
  let ab = 0, h = 0, hr = 0, bb = 0, so = 0, rbi = 0, tb = 0, r = 0;
  roster.forEach((p: any) => {
    const s = p.stats?.Hitting;
    if (s) {
      ab += parseInt(s.AB || '0');
      h += parseInt(s.H || '0');
      hr += parseInt(s.HR || '0');
      bb += parseInt(s.BB || '0');
      so += parseInt(s.SO || '0');
      rbi += parseInt(s.RBI || '0');
      tb += parseInt(s.TB || '0');
      r += parseInt(s.R || '0');
    }
  });

  const avg = ab > 0 ? h / ab : 0;
  const slg = ab > 0 ? tb / ab : 0;
  const obp = (ab + bb) > 0 ? (h + bb) / (ab + bb) : 0;
  const ops = obp + slg;

  // Aggregate pitching
  let ip = 0, er = 0, ph = 0, pbb = 0, pso = 0, sv = 0, pw = 0, pl = 0, cg = 0;
  roster.forEach((p: any) => {
    const s = p.stats?.Pitching;
    if (s && parseFloat(s.InningsPitched || '0') > 0) {
      // Handle IP format (5.1 = 5 1/3, 5.2 = 5 2/3)
      const ipRaw = parseFloat(s.InningsPitched || '0');
      const full = Math.floor(ipRaw);
      const partial = Math.round((ipRaw - full) * 10);
      ip += full + partial / 3;
      er += parseInt(s.ER || '0');
      ph += parseInt(s.H || '0');
      pbb += parseInt(s.BB || '0');
      pso += parseInt(s.SO || '0');
      sv += parseInt(s.Save || '0');
      pw += parseInt(s.Win || '0');
      pl += parseInt(s.Loss || '0');
      cg += parseInt(s.CompleteGame || '0');
    }
  });

  const era = ip > 0 ? (er / ip) * 9 : 9.99;
  const whip = ip > 0 ? (ph + pbb) / ip : 9.99;
  const k9 = ip > 0 ? (pso / ip) * 9 : 0;

  const result: AggregatedTeamStats = {
    teamAbv,
    gamesPlayed: gp,
    batting: {
      ab, h, hr, bb, so, rbi, tb, r,
      avg, slg, obp, ops,
      runsPerGame: r / gp, hrPerGame: hr / gp, bbPerGame: bb / gp,
    },
    pitching: {
      ip, er, h: ph, bb: pbb, so: pso, sv, wins: pw, losses: pl, cg,
      era, whip, k9,
      svPerGame: sv / gp, cgPerGame: cg / gp,
    },
  };

  setCache(cacheKey, result, 1800); // 30 min
  return result;
}

/** Get aggregated stats for all 30 teams */
export async function aggregateAllTeamStats(): Promise<AggregatedTeamStats[]> {
  const cacheKey = 'tank01-all-team-agg';
  const cached = getCached<AggregatedTeamStats[]>(cacheKey);
  if (cached) return cached;

  const teams = await fetchTank01Teams();
  const results: AggregatedTeamStats[] = [];

  // Batch 6 at a time to avoid rate limits
  for (let i = 0; i < teams.length; i += 6) {
    const batch = teams.slice(i, i + 6);
    const stats = await Promise.all(batch.map(t => aggregateTeamStats(t.teamAbv)));
    stats.forEach(s => { if (s) results.push(s); });
  }

  if (results.length > 0) setCache(cacheKey, results, 1800);
  return results;
}

// ESPN logo URL helper
export function getTeamLogo(teamAbv: string): string {
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${teamAbv.toLowerCase()}.png`;
}

// ─── Composed Helpers ────────────────────────────────────────────────

const KNOWN_BOOKS = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'bet365', 'fanatics', 'hardrock', 'pointsbet'];

/** Parse Tank01 odds for a single game into a structured multi-book format */
export function parseMultiBookOdds(gameOdds: Tank01Odds) {
  const books: Array<{
    bookmaker: string;
    moneyline: { away: number; home: number } | null;
    runline: { awaySpread: string; homeSpread: string; awayOdds: number; homeOdds: number } | null;
    total: { line: string; overOdds: number; underOdds: number } | null;
  }> = [];

  for (const book of KNOWN_BOOKS) {
    const b = gameOdds[book] as BookOdds | undefined;
    if (!b) continue;

    books.push({
      bookmaker: book,
      moneyline: b.awayTeamML && b.homeTeamML
        ? { away: parseInt(b.awayTeamML), home: parseInt(b.homeTeamML) }
        : null,
      runline: b.awayTeamRunLine && b.awayTeamRunLineOdds
        ? {
            awaySpread: b.awayTeamRunLine,
            homeSpread: b.homeTeamRunLine,
            awayOdds: parseInt(b.awayTeamRunLineOdds),
            homeOdds: parseInt(b.homeTeamRunLineOdds),
          }
        : null,
      total: b.totalOver && b.totalOverOdds
        ? {
            line: b.totalOver,
            overOdds: parseInt(b.totalOverOdds),
            underOdds: parseInt(b.totalUnderOdds),
          }
        : null,
    });
  }

  return books;
}

/** Calculate consensus (average) odds across all books */
export function getConsensusOdds(books: ReturnType<typeof parseMultiBookOdds>) {
  const mlBooks = books.filter(b => b.moneyline);
  const rlBooks = books.filter(b => b.runline);
  const totBooks = books.filter(b => b.total);

  return {
    moneyline: mlBooks.length > 0
      ? {
          away: Math.round(mlBooks.reduce((s, b) => s + b.moneyline!.away, 0) / mlBooks.length),
          home: Math.round(mlBooks.reduce((s, b) => s + b.moneyline!.home, 0) / mlBooks.length),
        }
      : null,
    spread: rlBooks.length > 0
      ? {
          away: rlBooks[0].runline!.awaySpread,
          home: rlBooks[0].runline!.homeSpread,
          awayOdds: Math.round(rlBooks.reduce((s, b) => s + b.runline!.awayOdds, 0) / rlBooks.length),
          homeOdds: Math.round(rlBooks.reduce((s, b) => s + b.runline!.homeOdds, 0) / rlBooks.length),
        }
      : null,
    total: totBooks.length > 0
      ? {
          line: totBooks[0].total!.line,
          over: Math.round(totBooks.reduce((s, b) => s + b.total!.overOdds, 0) / totBooks.length),
          under: Math.round(totBooks.reduce((s, b) => s + b.total!.underOdds, 0) / totBooks.length),
        }
      : null,
  };
}

/** Resolve pitcher IDs to names + stats, with caching */
export async function resolvePitchers(
  awayID: string,
  homeID: string
): Promise<{
  awayPitcher?: string;
  homePitcher?: string;
  awayPitcherStats?: string;
  homePitcherStats?: string;
  awayPitcherHeadshot?: string;
  homePitcherHeadshot?: string;
}> {
  const [away, home] = await Promise.all([
    awayID ? fetchTank01Player(awayID, true) : null,
    homeID ? fetchTank01Player(homeID, true) : null,
  ]);

  const formatStats = (p: Tank01Player | null) => {
    if (!p?.stats?.Pitching) return undefined;
    const s = p.stats.Pitching;
    return `(${s.Win || 0}-${s.Loss || 0}, ${s.ERA || '-.--'})`;
  };

  return {
    awayPitcher: away?.longName,
    homePitcher: home?.longName,
    awayPitcherStats: formatStats(away),
    homePitcherStats: formatStats(home),
    awayPitcherHeadshot: away?.espnHeadshot || away?.mlbHeadshot,
    homePitcherHeadshot: home?.espnHeadshot || home?.mlbHeadshot,
  };
}

// Team abbreviation → full name lookup
const TEAM_NAMES: Record<string, string> = {
  ARI: 'Arizona Diamondbacks', ATL: 'Atlanta Braves', BAL: 'Baltimore Orioles',
  BOS: 'Boston Red Sox', CHC: 'Chicago Cubs', CHW: 'Chicago White Sox',
  CIN: 'Cincinnati Reds', CLE: 'Cleveland Guardians', COL: 'Colorado Rockies',
  DET: 'Detroit Tigers', HOU: 'Houston Astros', KC: 'Kansas City Royals',
  LAA: 'Los Angeles Angels', LAD: 'Los Angeles Dodgers', MIA: 'Miami Marlins',
  MIL: 'Milwaukee Brewers', MIN: 'Minnesota Twins', NYM: 'New York Mets',
  NYY: 'New York Yankees', OAK: 'Oakland Athletics', PHI: 'Philadelphia Phillies',
  PIT: 'Pittsburgh Pirates', SD: 'San Diego Padres', SEA: 'Seattle Mariners',
  SF: 'San Francisco Giants', STL: 'St. Louis Cardinals', TB: 'Tampa Bay Rays',
  TEX: 'Texas Rangers', TOR: 'Toronto Blue Jays', WSH: 'Washington Nationals',
};

// MLB stadium lookup for venue names
const TEAM_VENUES: Record<string, string> = {
  ARI: 'Chase Field', ATL: 'Truist Park', BAL: 'Oriole Park at Camden Yards',
  BOS: 'Fenway Park', CHC: 'Wrigley Field', CHW: 'Guaranteed Rate Field',
  CIN: 'Great American Ball Park', CLE: 'Progressive Field', COL: 'Coors Field',
  DET: 'Comerica Park', HOU: 'Minute Maid Park', KC: 'Kauffman Stadium',
  LAA: 'Angel Stadium', LAD: 'Dodger Stadium', MIA: 'loanDepot park',
  MIL: 'American Family Field', MIN: 'Target Field', NYM: 'Citi Field',
  NYY: 'Yankee Stadium', OAK: 'Oakland Coliseum', PHI: 'Citizens Bank Park',
  PIT: 'PNC Park', SD: 'Petco Park', SEA: 'T-Mobile Park',
  SF: 'Oracle Park', STL: 'Busch Stadium', TB: 'Tropicana Field',
  TEX: 'Globe Life Field', TOR: 'Rogers Centre', WSH: 'Nationals Park',
};

export function getTeamFullName(code: string): string {
  return TEAM_NAMES[code] || code;
}

export function getTeamVenue(code: string): string {
  return TEAM_VENUES[code] || 'TBD';
}
