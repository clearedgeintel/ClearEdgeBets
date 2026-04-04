/**
 * News Context Builder — gathers real-time MLB context for AI writers.
 * Feeds ESPN headlines, standings, injuries, and recent scores into content generation.
 */

import { trackedFetch } from '../lib/api-tracker';
import { getCached, setCache } from '../lib/cache';
import { fetchTank01Teams, fetchTank01Scores, getTeamFullName } from './tank01-mlb';

export interface NewsContext {
  headlines: string[];
  injuries: string[];
  standings: string[];
  recentScores: string[];
  timestamp: string;
}

/** Fetch latest ESPN MLB headlines */
async function fetchESPNHeadlines(): Promise<string[]> {
  try {
    const resp = await trackedFetch('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news?limit=15');
    if (!resp.ok) return [];
    const data = await resp.json() as any;
    return (data.articles || []).map((a: any) => a.headline).filter(Boolean);
  } catch {
    return [];
  }
}

/** Build current standings summary from Tank01 */
async function buildStandings(): Promise<string[]> {
  try {
    const teams = await fetchTank01Teams();
    if (teams.length === 0) return [];

    // Group by division
    const divisions: Record<string, Array<{ name: string; w: number; l: number }>> = {};
    teams.forEach(t => {
      const div = `${t.conferenceAbv} ${t.division}`;
      if (!divisions[div]) divisions[div] = [];
      divisions[div].push({ name: t.teamAbv, w: parseInt(t.wins || '0'), l: parseInt(t.loss || '0') });
    });

    const lines: string[] = [];
    Object.entries(divisions).sort().forEach(([div, teams]) => {
      teams.sort((a, b) => b.w - a.w || a.l - b.l);
      const leader = teams[0];
      lines.push(`${div}: ${leader.name} leads (${leader.w}-${leader.l})`);
    });
    return lines;
  } catch {
    return [];
  }
}

/** Build yesterday's scores summary */
async function buildRecentScores(): Promise<string[]> {
  try {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];

    const scores = await fetchTank01Scores(yesterday);
    return Object.values(scores)
      .filter((g: any) => g.gameStatusCode === '2' || g.gameStatus === 'Completed')
      .map((g: any) => {
        const awayR = g.lineScore?.away?.R || '0';
        const homeR = g.lineScore?.home?.R || '0';
        return `${getTeamFullName(g.away)} ${awayR} @ ${getTeamFullName(g.home)} ${homeR}`;
      });
  } catch {
    return [];
  }
}

/** Extract injury-related headlines */
function extractInjuries(headlines: string[]): string[] {
  const injuryKeywords = ['injured', 'injury', 'IL', 'disabled list', 'X-rays', 'MRI', 'contusion', 'fracture', 'strain', 'sprain', 'surgery', 'concussion', 'placed on', 'day-to-day'];
  return headlines.filter(h => injuryKeywords.some(k => h.toLowerCase().includes(k.toLowerCase())));
}

/**
 * Build full news context — cached 15 minutes.
 * Call this before any AI content generation to give writers real-time awareness.
 */
export async function buildNewsContext(): Promise<NewsContext> {
  const cacheKey = 'news-context';
  const cached = getCached<NewsContext>(cacheKey);
  if (cached) return cached;

  const [headlines, standings, recentScores] = await Promise.all([
    fetchESPNHeadlines(),
    buildStandings(),
    buildRecentScores(),
  ]);

  const injuries = extractInjuries(headlines);

  const context: NewsContext = {
    headlines,
    injuries,
    standings,
    recentScores,
    timestamp: new Date().toISOString(),
  };

  setCache(cacheKey, context, 900); // 15 min cache
  return context;
}

/**
 * Format context as a text block for AI prompt injection.
 * This is what gets prepended to every writer/expert prompt.
 */
export function formatContextForPrompt(ctx: NewsContext): string {
  let text = `\n**REAL-TIME MLB CONTEXT (as of ${new Date(ctx.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}):**\n`;

  if (ctx.headlines.length > 0) {
    text += `\n**Today's Headlines:**\n${ctx.headlines.slice(0, 10).map(h => `• ${h}`).join('\n')}\n`;
  }

  if (ctx.injuries.length > 0) {
    text += `\n**Injury News:**\n${ctx.injuries.map(h => `• ${h}`).join('\n')}\n`;
  }

  if (ctx.standings.length > 0) {
    text += `\n**Division Leaders:**\n${ctx.standings.map(s => `• ${s}`).join('\n')}\n`;
  }

  if (ctx.recentScores.length > 0) {
    text += `\n**Yesterday's Results:**\n${ctx.recentScores.map(s => `• ${s}`).join('\n')}\n`;
  }

  text += `\nUse this context to make your writing timely and relevant. Reference specific headlines, injuries, or standings when they connect to your topic.\n`;

  return text;
}
