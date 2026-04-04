/**
 * News Context Builder — gathers real-time sports context for AI writers.
 * Multi-sport: detects topic and pulls relevant ESPN data (MLB, NFL, NBA, NHL).
 * Feeds headlines, standings, injuries, and scores into content generation.
 */

import { trackedFetch } from '../lib/api-tracker';
import { getCached, setCache } from '../lib/cache';
import { fetchTank01Teams, fetchTank01Scores, getTeamFullName } from './tank01-mlb';

export interface NewsContext {
  sport: string;
  headlines: string[];
  injuries: string[];
  standings: string[];
  recentScores: string[];
  timestamp: string;
}

// ESPN sport path mappings
const ESPN_SPORTS: Record<string, { path: string; label: string }> = {
  mlb: { path: 'baseball/mlb', label: 'MLB' },
  nfl: { path: 'football/nfl', label: 'NFL' },
  nba: { path: 'basketball/nba', label: 'NBA' },
  nhl: { path: 'hockey/nhl', label: 'NHL' },
  soccer: { path: 'soccer/usa.1', label: 'MLS' },
  golf: { path: 'golf/pga', label: 'PGA' },
  cfl: { path: 'football/cfl', label: 'CFL' },
};

// Keywords that map to sports
const SPORT_KEYWORDS: Record<string, string[]> = {
  mlb: ['baseball', 'mlb', 'pitcher', 'batting', 'home run', 'innings', 'bullpen', 'strikeout', 'era', 'whip', 'cubs', 'yankees', 'dodgers', 'mets', 'braves', 'astros', 'phillies', 'padres', 'guardians', 'orioles', 'twins', 'royals', 'rangers', 'reds', 'tigers', 'pirates', 'marlins', 'brewers', 'rays', 'mariners', 'giants', 'cardinals', 'rockies', 'nationals', 'angels', 'athletics', 'white sox', 'red sox', 'blue jays', 'diamondbacks'],
  nfl: ['football', 'nfl', 'quarterback', 'touchdown', 'super bowl', 'draft', 'receiver', 'rushing', 'passing', 'chiefs', 'eagles', 'bills', 'ravens', 'cowboys', '49ers', 'lions', 'packers', 'dolphins', 'bengals', 'steelers', 'chargers', 'jets', 'rams', 'seahawks', 'browns', 'texans', 'jaguars', 'broncos', 'colts', 'vikings', 'saints', 'bears', 'falcons', 'panthers', 'buccaneers', 'titans', 'commanders', 'cardinals'],
  nba: ['basketball', 'nba', 'three-pointer', 'dunk', 'rebound', 'assist', 'playoff', 'celtics', 'nuggets', 'lakers', 'warriors', 'bucks', 'suns', '76ers', 'nets', 'heat', 'knicks', 'clippers', 'mavericks', 'grizzlies', 'cavaliers', 'timberwolves', 'pelicans', 'kings', 'thunder', 'hawks', 'raptors', 'bulls', 'rockets', 'spurs', 'trail blazers', 'pacers', 'magic', 'hornets', 'pistons', 'wizards', 'jazz'],
  nhl: ['hockey', 'nhl', 'goal', 'assist', 'power play', 'penalty', 'goalie', 'shutout', 'hat trick', 'stanley cup', 'bruins', 'avalanche', 'panthers', 'oilers', 'rangers', 'hurricanes', 'stars', 'maple leafs', 'lightning', 'jets', 'devils', 'islanders', 'penguins', 'capitals', 'canadiens', 'senators', 'sabres', 'flyers', 'blue jackets', 'red wings', 'blackhawks', 'predators', 'wild', 'flames', 'canucks', 'kraken', 'coyotes', 'golden knights', 'sharks', 'blues', 'ducks', 'kings'],
};

/** Detect which sport a topic is about */
export function detectSport(topic: string): string {
  const lower = topic.toLowerCase();
  let bestSport = 'mlb'; // default
  let bestScore = 0;

  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestSport = sport;
    }
  }

  return bestSport;
}

/** Fetch ESPN headlines for any sport */
async function fetchESPNHeadlines(sport: string): Promise<string[]> {
  const espn = ESPN_SPORTS[sport] || ESPN_SPORTS.mlb;
  try {
    const resp = await trackedFetch(`https://site.api.espn.com/apis/site/v2/sports/${espn.path}/news?limit=15`);
    if (!resp.ok) return [];
    const data = await resp.json() as any;
    return (data.articles || []).map((a: any) => a.headline).filter(Boolean);
  } catch {
    return [];
  }
}

/** Fetch ESPN scores for any sport */
async function fetchESPNScores(sport: string): Promise<string[]> {
  const espn = ESPN_SPORTS[sport] || ESPN_SPORTS.mlb;
  try {
    const resp = await trackedFetch(`https://site.api.espn.com/apis/site/v2/sports/${espn.path}/scoreboard`);
    if (!resp.ok) return [];
    const data = await resp.json() as any;
    return (data.events || [])
      .filter((e: any) => e.status?.type?.completed)
      .map((e: any) => {
        const comp = e.competitions?.[0];
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        return `${away?.team?.abbreviation || '?'} ${away?.score || '0'} @ ${home?.team?.abbreviation || '?'} ${home?.score || '0'}`;
      });
  } catch {
    return [];
  }
}

/** Fetch ESPN standings for any sport */
async function fetchESPNStandings(sport: string): Promise<string[]> {
  const espn = ESPN_SPORTS[sport] || ESPN_SPORTS.mlb;
  try {
    const resp = await trackedFetch(`https://site.api.espn.com/apis/site/v2/sports/${espn.path}/standings`);
    if (!resp.ok) return [];
    const data = await resp.json() as any;
    const lines: string[] = [];
    (data.children || []).forEach((group: any) => {
      const name = group.name || group.abbreviation || 'Division';
      const entries = group.standings?.entries || [];
      if (entries.length > 0) {
        const leader = entries[0];
        const wins = leader.stats?.find((s: any) => s.name === 'wins')?.value || '?';
        const losses = leader.stats?.find((s: any) => s.name === 'losses')?.value || '?';
        lines.push(`${name}: ${leader.team?.displayName || '?'} leads (${wins}-${losses})`);
      }
    });
    return lines;
  } catch {
    return [];
  }
}

/** Build MLB standings from Tank01 (richer data) */
async function buildMLBStandings(): Promise<string[]> {
  try {
    const teams = await fetchTank01Teams();
    if (teams.length === 0) return [];
    const divisions: Record<string, Array<{ name: string; w: number; l: number }>> = {};
    teams.forEach(t => {
      const div = `${t.conferenceAbv} ${t.division}`;
      if (!divisions[div]) divisions[div] = [];
      divisions[div].push({ name: t.teamAbv, w: parseInt(t.wins || '0'), l: parseInt(t.loss || '0') });
    });
    const lines: string[] = [];
    Object.entries(divisions).sort().forEach(([div, teams]) => {
      teams.sort((a, b) => b.w - a.w || a.l - b.l);
      lines.push(`${div}: ${teams[0].name} leads (${teams[0].w}-${teams[0].l})`);
    });
    return lines;
  } catch {
    return [];
  }
}

/** Build MLB scores from Tank01 (richer) */
async function buildMLBRecentScores(): Promise<string[]> {
  try {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const scores = await fetchTank01Scores(d.toISOString().split('T')[0]);
    return Object.values(scores)
      .filter((g: any) => g.gameStatusCode === '2' || g.gameStatus === 'Completed')
      .map((g: any) => `${getTeamFullName(g.away)} ${g.lineScore?.away?.R || '0'} @ ${getTeamFullName(g.home)} ${g.lineScore?.home?.R || '0'}`);
  } catch {
    return [];
  }
}

/** Extract injury-related headlines */
function extractInjuries(headlines: string[]): string[] {
  const keywords = ['injured', 'injury', 'IL', 'disabled', 'X-rays', 'MRI', 'contusion', 'fracture', 'strain', 'sprain', 'surgery', 'concussion', 'placed on', 'day-to-day', 'out for', 'season-ending', 'torn', 'broken'];
  return headlines.filter(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));
}

/**
 * Build news context for a specific sport — cached 15 min per sport.
 * For MLB, uses Tank01 for richer standings/scores. Other sports use ESPN throughout.
 */
export async function buildNewsContext(sport?: string): Promise<NewsContext> {
  const detectedSport = sport || 'mlb';
  const cacheKey = `news-context-${detectedSport}`;
  const cached = getCached<NewsContext>(cacheKey);
  if (cached) return cached;

  const espnLabel = ESPN_SPORTS[detectedSport]?.label || 'MLB';

  // Fetch headlines from ESPN (works for all sports)
  const headlines = await fetchESPNHeadlines(detectedSport);
  const injuries = extractInjuries(headlines);

  // For MLB use Tank01 (richer), for others use ESPN
  let standings: string[];
  let recentScores: string[];

  if (detectedSport === 'mlb') {
    [standings, recentScores] = await Promise.all([buildMLBStandings(), buildMLBRecentScores()]);
  } else {
    [standings, recentScores] = await Promise.all([fetchESPNStandings(detectedSport), fetchESPNScores(detectedSport)]);
  }

  const context: NewsContext = {
    sport: espnLabel,
    headlines,
    injuries,
    standings,
    recentScores,
    timestamp: new Date().toISOString(),
  };

  setCache(cacheKey, context, 900); // 15 min
  return context;
}

/**
 * Build context from a topic string — auto-detects the sport.
 */
export async function buildNewsContextForTopic(topic: string): Promise<NewsContext> {
  const sport = detectSport(topic);
  return buildNewsContext(sport);
}

/**
 * Format context as text for AI prompt injection.
 */
export function formatContextForPrompt(ctx: NewsContext): string {
  let text = `\n**REAL-TIME ${ctx.sport} CONTEXT (as of ${new Date(ctx.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}):**\n`;

  if (ctx.headlines.length > 0) {
    text += `\n**Today's ${ctx.sport} Headlines:**\n${ctx.headlines.slice(0, 10).map(h => `• ${h}`).join('\n')}\n`;
  }
  if (ctx.injuries.length > 0) {
    text += `\n**Injury News:**\n${ctx.injuries.map(h => `• ${h}`).join('\n')}\n`;
  }
  if (ctx.standings.length > 0) {
    text += `\n**Standings Leaders:**\n${ctx.standings.map(s => `• ${s}`).join('\n')}\n`;
  }
  if (ctx.recentScores.length > 0) {
    text += `\n**Recent Scores:**\n${ctx.recentScores.slice(0, 10).map(s => `• ${s}`).join('\n')}\n`;
  }

  text += `\nUse this context to make your writing timely and relevant. Reference specific headlines, injuries, or standings when they connect to your topic.\n`;
  return text;
}
