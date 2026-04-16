import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Brain, User, Target, TrendingUp, DollarSign, Wind, Thermometer, CloudRain, BarChart3 } from "lucide-react";
import { ExpertAvatar } from "./expert-avatar";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { LiveScore } from "@/components/live-score";
import { Link } from "wouter";

interface Game {
  id: number;
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
  gameTime: string;
  venue: string;
  awayPitcher?: string;
  homePitcher?: string;
  awayPitcherStats?: string;
  homePitcherStats?: string;
  status: string;
  awayScore?: number;
  homeScore?: number;
  odds: Array<{
    id: number;
    gameId: string;
    bookmaker: string;
    market: string;
    awayOdds?: number;
    homeOdds?: number;
    overOdds?: number;
    underOdds?: number;
    total?: string;
    awaySpread?: string;
    homeSpread?: string;
    awaySpreadOdds?: number;
    homeSpreadOdds?: number;
  }>;
  aiSummary?: {
    id: number;
    gameId: string;
    summary: string;
    confidence: number;
    valuePlays: Array<{
      type: string;
      selection: string;
      reasoning: string;
      expectedValue: number;
    }>;
  };
  weather?: {
    temperature: number;
    condition: string;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    precipitation: number;
    totalRunsImpact: 'favor_over' | 'favor_under' | 'neutral';
    gameDelay: 'low' | 'medium' | 'high' | 'very_high';
  } | null;
  parkFactor?: {
    factor: number;
    label: string;
  } | null;
  multiBookOdds?: Array<{
    bookmaker: string;
    moneyline: { away: number; home: number } | null;
    runline: { awaySpread: string; homeSpread: string; awayOdds: number; homeOdds: number } | null;
    total: { line: string; overOdds: number; underOdds: number } | null;
  }> | null;
  awayPitcherHeadshot?: string;
  homePitcherHeadshot?: string;
  beatWriter?: {
    name: string;
    avatar: string;
    region?: string;
  };
}

// Sub-component: fetches last-5-starts ERA for a single pitcher lazily
function PitcherRecentStats({ name }: { name: string }) {
  const { data } = useQuery<{ l5ERA: number | null; starts: number } | null>({
    queryKey: ['/api/pitcher-recent', name],
    queryFn: () =>
      fetch(`/api/pitcher-recent/${encodeURIComponent(name)}`, { credentials: 'include' })
        .then(r => r.json()),
    staleTime: 1000 * 60 * 60,
    enabled: !!name,
  });
  if (!data || data.l5ERA === null) return null;
  return (
    <span className="text-xs text-amber-400 font-medium ml-1">
      L{data.starts}: {data.l5ERA} ERA
    </span>
  );
}

function windDegToCompass(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

interface AIPickData {
  id: number;
  team: string;
  selection: string;
  pickType: string;
  confidence: number;
  reasoning: string;
  odds: string;
}

interface ExpertPickData {
  id: string;
  selection: string;
  pickType: string;
  confidence: number;
  reasoning: string;
  odds: string;
  value: number;
}

interface EnhancedGameCardProps {
  game: Game;
}

function teamLogoUrl(code: string): string {
  const c = code.toUpperCase() === 'WAS' ? 'wsh' : code.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${c}.png`;
}

export default function EnhancedGameCard({ game }: EnhancedGameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [showOdds, setShowOdds] = useState(false);
  const { addBet } = useBettingSlip();

  // Fetch expert picks for this game
  const { data: expertPicks = [] } = useQuery<any[]>({
    queryKey: ['/api/expert-picks/game', game.gameId],
    queryFn: () => {
      // Extract team codes from gameId format "2026-04-03_NYY @ BOS"
      const match = game.gameId.match(/([A-Z]{2,3})\s*@\s*([A-Z]{2,3})/);
      if (!match) return Promise.resolve([]);
      const code = `${match[1]}@${match[2]}`;
      return fetch(`/api/expert-picks/game/${code}`).then(r => r.json());
    },
    staleTime: 300000,
  });

  // Consensus detection — do 3+ experts agree on the same side?
  const consensus = (() => {
    try {
      if (!Array.isArray(expertPicks) || expertPicks.length < 3) return null;
      const sides: Record<string, string[]> = {};
      expertPicks.forEach((p: any) => {
        const key = p?.selection?.toLowerCase()?.trim();
        if (key) { sides[key] = sides[key] || []; sides[key].push(p.expertId); }
      });
      const entries = Object.entries(sides);
      if (entries.length === 0) return null;
      const best = entries.sort((a, b) => b[1].length - a[1].length)[0];
      return best && best[1].length >= 3 ? { selection: expertPicks.find((p: any) => p?.selection?.toLowerCase()?.trim() === best[0])?.selection, count: best[1].length } : null;
    } catch { return null; }
  })();

  // Expert debate — two experts disagree on same game
  const debate = (() => {
    try {
      if (!Array.isArray(expertPicks) || expertPicks.length < 2) return null;
      for (let i = 0; i < expertPicks.length; i++) {
        for (let j = i + 1; j < expertPicks.length; j++) {
          const a = expertPicks[i]; const b = expertPicks[j];
          if (a?.pickType === b?.pickType && a?.selection !== b?.selection) return { a, b };
        }
      }
      return null;
    } catch { return null; }
  })();


  // Compute Edge Score from real signals (replaces AI confidence)
  const edgeScore = (() => {
    try {
      let score = 0;
      const signals: string[] = [];

      // 1. Moneyline gap (0-25 pts)
      const awayML = Math.abs(moneylineOdds?.awayOdds || 0);
      const homeML = Math.abs(moneylineOdds?.homeOdds || 0);
      const mlGap = Math.abs((moneylineOdds?.awayOdds || 0) - (moneylineOdds?.homeOdds || 0));
      if (mlGap >= 150) { score += 25; signals.push('Large line gap'); }
      else if (mlGap >= 80) { score += 15; signals.push('Clear favorite'); }
      else if (mlGap >= 40) { score += 8; }

      // 2. Expert agreement (0-30 pts)
      const expertCount = Array.isArray(expertPicks) ? expertPicks.length : 0;
      if (expertCount >= 3) { score += 30; signals.push(`${expertCount} experts`); }
      else if (expertCount >= 2) { score += 20; signals.push('2 experts'); }
      else if (expertCount >= 1) { score += 10; }

      // 3. Park factor (0-15 pts)
      const pf = game.parkFactor?.factor || 1.0;
      if (pf >= 1.10) { score += 15; signals.push('Hitter park'); }
      else if (pf >= 1.05) { score += 10; }
      else if (pf <= 0.92) { score += 15; signals.push('Pitcher park'); }
      else if (pf <= 0.95) { score += 8; }

      // 4. Weather impact (0-10 pts)
      if (game.weather?.totalRunsImpact === 'favor_over' || game.weather?.totalRunsImpact === 'favor_under') {
        score += 10; signals.push('Weather edge');
      }
      if (game.weather?.windSpeed && game.weather.windSpeed >= 15) { score += 5; }

      // 5. Consensus boost (0-20 pts)
      if (consensus) { score += 20; signals.push('Consensus pick'); }
      else if (debate) { score += 5; } // Debate means interesting game

      return { score: Math.min(score, 100), signals };
    } catch { return { score: 0, signals: [] }; }
  })();

  // Compute play lean: combines odds gap + expert consensus + AI confidence
  const playLean = (() => {
    try {
      // Check if experts lean one way
      const expertSides: Record<string, number> = {};
      if (Array.isArray(expertPicks)) {
        expertPicks.forEach((p: any) => {
          if (p?.selection) {
            // Try to determine which team they picked
            const sel = p.selection.toLowerCase();
            if (sel.includes(game.awayTeamCode?.toLowerCase())) expertSides['away'] = (expertSides['away'] || 0) + 1;
            else if (sel.includes(game.homeTeamCode?.toLowerCase())) expertSides['home'] = (expertSides['home'] || 0) + 1;
          }
        });
      }

      const awayExperts = expertSides['away'] || 0;
      const homeExperts = expertSides['home'] || 0;
      const totalExperts = awayExperts + homeExperts;

      // Check moneyline gap
      const awayML = moneylineOdds?.awayOdds || 0;
      const homeML = moneylineOdds?.homeOdds || 0;
      const mlGap = Math.abs(awayML - homeML);

      // AI confidence
      const aiConf = game.aiSummary?.confidence || 0;

      // Determine lean
      if (totalExperts === 0 && mlGap < 40) return null; // No clear lean

      let team = '';
      let strength: 'strong' | 'lean' = 'lean';

      if (totalExperts >= 2 && (awayExperts >= homeExperts * 2 || homeExperts >= awayExperts * 2)) {
        team = awayExperts > homeExperts ? game.awayTeamCode : game.homeTeamCode;
        strength = totalExperts >= 3 ? 'strong' : 'lean';
      } else if (mlGap >= 80) {
        // Big favorite
        team = awayML < homeML ? game.awayTeamCode : game.homeTeamCode;
        strength = mlGap >= 150 ? 'strong' : 'lean';
      } else if (aiConf >= 75 && game.aiSummary?.summary) {
        // AI has high confidence — try to extract direction from summary
        const summary = game.aiSummary.summary.toLowerCase();
        if (summary.includes(game.awayTeamCode?.toLowerCase())) team = game.awayTeamCode;
        else if (summary.includes(game.homeTeamCode?.toLowerCase())) team = game.homeTeamCode;
        strength = aiConf >= 85 ? 'strong' : 'lean';
      }

      if (!team) return null;
      return { team, strength };
    } catch { return null; }
  })();

  // Fetch all daily picks, AI suggested bets, and game evaluations
  const { data: allAIPicks = [] } = useQuery<any[]>({
    queryKey: ['/api/daily-picks']
  });


  // No expert picks API - removed to maintain authentic data only

  // Get AI pick that matches this specific game 
  const aiPick = allAIPicks.find(pick => {
    if (!pick.gameId) return false;
    
    // Exact gameId match - picks now use same format as games: "2025-07-21_BAL @ CLE"
    return pick.gameId === game.gameId;
  }) || null;


  const getOddsByMarket = (market: string) => {
    return game.odds.find(o => o.market === market);
  };

  const moneylineOdds = getOddsByMarket("moneyline");
  const totalOdds = getOddsByMarket("totals");
  const spreadOdds = getOddsByMarket("spreads");

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getPickIcon = (pickType: string) => {
    switch (pickType.toLowerCase()) {
      case 'moneyline':
        return <Target className="h-4 w-4" />;
      case 'spread':
      case 'runline':
        return <TrendingUp className="h-4 w-4" />;
      case 'total':
      case 'over':
      case 'under':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };


  return (
    <Card className="w-full card-glow border-border/50 bg-card">
      {/* ── Condensed Header: Logos + Teams + Time + Inline Odds ── */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Away team */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link href={`/team/${game.awayTeamCode}`}>
              <img src={teamLogoUrl(game.awayTeamCode)} alt={game.awayTeamCode} className="h-8 w-8 flex-shrink-0 hover:scale-110 transition-transform cursor-pointer" />
            </Link>
            <div className="min-w-0">
              <Link href={`/team/${game.awayTeamCode}`} className="hover:text-emerald-400 transition-colors">
                <div className="font-semibold text-sm text-foreground truncate">{game.awayTeam}</div>
              </Link>
              <div className="text-[10px] text-muted-foreground truncate">
                {game.awayPitcher && <>{game.awayPitcher} {game.awayPitcherStats && <span className="text-zinc-500">{game.awayPitcherStats}</span>}</>}
              </div>
            </div>
          </div>

          {/* Game info center */}
          <div className="flex flex-col items-center flex-shrink-0 px-2">
            {game.status === "final" ? (
              <>
                <div className="text-lg font-bold tabular-nums">{game.awayScore} - {game.homeScore}</div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Final</div>
              </>
            ) : game.status === "live" || game.status === "inprogress" || game.status === "in_progress" ? (
              <>
                <div className="text-lg font-bold tabular-nums">{game.awayScore ?? 0} - {game.homeScore ?? 0}</div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Live</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-xs text-muted-foreground font-medium">{game.gameTime}</div>
                <div className="text-[10px] text-muted-foreground">@</div>
              </>
            )}
          </div>

          {/* Home team */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <Link href={`/team/${game.homeTeamCode}`} className="hover:text-emerald-400 transition-colors">
                <div className="font-semibold text-sm text-foreground truncate">{game.homeTeam}</div>
              </Link>
              <div className="text-[10px] text-muted-foreground truncate">
                {game.homePitcher && <>{game.homePitcher} {game.homePitcherStats && <span className="text-zinc-500">{game.homePitcherStats}</span>}</>}
              </div>
            </div>
            <Link href={`/team/${game.homeTeamCode}`}>
              <img src={teamLogoUrl(game.homeTeamCode)} alt={game.homeTeamCode} className="h-8 w-8 flex-shrink-0 hover:scale-110 transition-transform cursor-pointer" />
            </Link>
          </div>
        </div>

        {/* Consensus / Debate indicators */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {consensus && (
            <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/20 text-[10px] px-1.5 py-0">
              🔥 {consensus.count} experts agree: {consensus.selection}
            </Badge>
          )}
          {debate && !consensus && (
            <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-1.5 py-0">
              ⚔️ {debate.a.expertId} vs {debate.b.expertId}
            </Badge>
          )}
          {game.status === "final" && (
            <Link href="/blog" className="text-[10px] text-amber-500/70 hover:text-amber-400 transition-colors">
              Read the recap &rarr;
            </Link>
          )}
        </div>

        {/* Context strip: weather, park factor — editorial content first */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
          {game.weather && (
            <>
              <span className="flex items-center gap-0.5">
                <Thermometer className="h-2.5 w-2.5" />{Math.round(game.weather.temperature)}°
              </span>
              <span className="flex items-center gap-0.5">
                <Wind className="h-2.5 w-2.5" />{Math.round(game.weather.windSpeed)}mph
              </span>
              {game.weather.totalRunsImpact !== 'neutral' && (
                <Badge className={`text-[9px] px-1 py-0 border ${game.weather.totalRunsImpact === 'favor_over' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                  {game.weather.totalRunsImpact === 'favor_over' ? 'Over' : 'Under'}
                </Badge>
              )}
            </>
          )}
          {game.parkFactor && (
            <Badge className={`text-[9px] px-1 py-0 border ${
              game.parkFactor.factor >= 1.05 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
              : game.parkFactor.factor <= 0.95 ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
              : 'bg-zinc-500/10 text-zinc-500 border-zinc-700'
            }`}>PF {game.parkFactor.factor.toFixed(2)}</Badge>
          )}
          {game.venue && <span className="text-zinc-600 hidden sm:inline">{game.venue}</span>}
        </div>

        {/* Odds toggle — hidden by default, editorial-first */}
        {(moneylineOdds || totalOdds || spreadOdds) && (
          <div className="mt-2">
            {showOdds ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] tabular-nums">
                  {moneylineOdds && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">ML</span>
                      <span className="text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => addBet({ gameId: game.gameId, betType: 'moneyline', selection: game.awayTeamCode, odds: moneylineOdds.awayOdds || 0, stake: 10, potentialWin: 0 })}>
                        {formatOdds(moneylineOdds.awayOdds || 0)}
                      </span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => addBet({ gameId: game.gameId, betType: 'moneyline', selection: game.homeTeamCode, odds: moneylineOdds.homeOdds || 0, stake: 10, potentialWin: 0 })}>
                        {formatOdds(moneylineOdds.homeOdds || 0)}
                      </span>
                    </div>
                  )}
                  {spreadOdds && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">RL</span>
                      <span className="text-emerald-400">{spreadOdds.awaySpread}/{spreadOdds.homeSpread}</span>
                    </div>
                  )}
                  {totalOdds && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">O/U</span>
                      <span className="text-amber-400">{totalOdds.total}</span>
                    </div>
                  )}
                  {playLean && (
                    <Badge className={`text-[10px] px-1.5 py-0 border ${playLean.strength === 'strong' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {playLean.strength === 'strong' ? '🔥' : '👉'} {playLean.team} {playLean.strength === 'strong' ? 'Strong Play' : 'Lean'}
                    </Badge>
                  )}
                </div>
                <button onClick={() => setShowOdds(false)} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors ml-2">
                  Hide
                </button>
              </div>
            ) : (
              <button onClick={() => setShowOdds(true)} className="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> Show Odds
              </button>
            )}
          </div>
        )}

        {/* Expert picks + edge score + expand */}
        <div className="flex flex-wrap items-center justify-between mt-2 gap-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          </div>

          {/* Inline expert pick summary (visible without expanding) */}
          {expertPicks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {expertPicks.slice(0, 3).map((pick: any) => (
                <div key={pick.id} className="flex items-center gap-1 text-[10px]">
                  <ExpertAvatar avatar={`/experts/${pick.expertId}.png`} name={pick.expertId} size="sm" className="h-4 w-4" />
                  <span className="text-foreground font-medium">{pick.selection}</span>
                  <Badge className={`text-[8px] px-1 py-0 border tabular-nums ${pick.confidence >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>{pick.confidence}%</Badge>
                </div>
              ))}
              {expertPicks.length > 3 && <span className="text-[10px] text-zinc-600">+{expertPicks.length - 3} more</span>}
            </div>
          )}

          {/* AI confidence + expand */}
          <div className="flex items-center gap-1.5">
            {expertPicks.length > 0 && (
              <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-1.5 py-0">
                <Target className="h-2.5 w-2.5 mr-0.5" />{expertPicks.length} expert{expertPicks.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {edgeScore.score > 0 && (
              <Badge className={`text-[10px] px-1.5 py-0 border tabular-nums ${edgeScore.score >= 60 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : edgeScore.score >= 30 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
                title={edgeScore.signals.join(' · ')}>
                Edge {edgeScore.score}
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => setExpanded(!expanded)}>
              {expanded ? <><ChevronUp className="h-3 w-3 mr-0.5" />Less</> : <><ChevronDown className="h-3 w-3 mr-0.5" />More</>}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Expanded Content ── */}
      {expanded && (
      <CardContent className="pt-0">
        {/* Quick Odds Display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {moneylineOdds && (
            <div className="text-center p-2.5 bg-zinc-900/50 border border-border/50 rounded-lg">
              <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">Moneyline</p>
              <div className="space-y-1">
                <Badge
                  className="bg-blue-500/10 text-blue-400 text-xs cursor-pointer hover:bg-blue-500/20 transition-colors border border-blue-500/20 tabular-nums"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'moneyline',
                    selection: game.awayTeamCode,
                    odds: moneylineOdds.awayOdds || 0,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  {game.awayTeamCode} {formatOdds(moneylineOdds.awayOdds || 0)}
                </Badge>
                <Badge
                  className="bg-blue-500/10 text-blue-400 text-xs cursor-pointer hover:bg-blue-500/20 transition-colors border border-blue-500/20 tabular-nums"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'moneyline',
                    selection: game.homeTeamCode,
                    odds: moneylineOdds.homeOdds || 0,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  {game.homeTeamCode} {formatOdds(moneylineOdds.homeOdds || 0)}
                </Badge>
              </div>
            </div>
          )}
          
          {spreadOdds && (
            <div className="text-center p-2.5 bg-zinc-900/50 border border-border/50 rounded-lg">
              <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">Run Line</p>
              <div className="space-y-1">
                <Badge
                  className="bg-emerald-500/10 text-emerald-400 text-xs cursor-pointer hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 tabular-nums"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'spread',
                    selection: `${game.awayTeamCode} ${spreadOdds.awaySpread}`,
                    odds: spreadOdds.awayOdds || -110,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  {game.awayTeamCode} {spreadOdds.awaySpread}
                </Badge>
                <Badge
                  className="bg-emerald-500/10 text-emerald-400 text-xs cursor-pointer hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 tabular-nums"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'spread',
                    selection: `${game.homeTeamCode} ${spreadOdds.homeSpread}`,
                    odds: spreadOdds.homeOdds || -110,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  {game.homeTeamCode} {spreadOdds.homeSpread}
                </Badge>
              </div>
            </div>
          )}

          {totalOdds && (
            <div className="text-center p-2.5 bg-zinc-900/50 border border-border/50 rounded-lg">
              <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">Total</p>
              <div className="space-y-1">
                <Badge
                  className="bg-amber-500/10 text-amber-400 text-xs cursor-pointer hover:bg-amber-500/20 transition-colors border border-amber-500/20 tabular-nums"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'total',
                    selection: `Over ${totalOdds.total}`,
                    odds: totalOdds.overOdds || -110,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  Over {totalOdds.total}
                </Badge>
                <Badge
                  className="bg-amber-500/10 text-amber-400 text-xs cursor-pointer hover:bg-amber-500/20 transition-colors border border-amber-500/20 tabular-nums"
                  onClick={() => addBet({
                    gameId: game.gameId,
                    betType: 'total',
                    selection: `Under ${totalOdds.total}`,
                    odds: totalOdds.underOdds || -110,
                    stake: 10,
                    potentialWin: 0
                  })}
                >
                  Under {totalOdds.total}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Multi-Book Odds Comparison */}
        {game.multiBookOdds && game.multiBookOdds.length > 0 && (
          <div className="mb-3">
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider flex items-center gap-1 mb-2 transition-colors"
              onClick={() => setShowBooks(!showBooks)}
            >
              {showBooks ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showBooks ? 'Hide' : 'Compare'} {game.multiBookOdds.length} Sportsbooks
            </button>
            {showBooks && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                      <th className="text-left py-1.5 pr-2">Book</th>
                      <th className="text-center py-1.5 px-1">{game.awayTeamCode}</th>
                      <th className="text-center py-1.5 px-1">{game.homeTeamCode}</th>
                      <th className="text-center py-1.5 px-1">RL {game.awayTeamCode}</th>
                      <th className="text-center py-1.5 px-1">RL {game.homeTeamCode}</th>
                      <th className="text-center py-1.5 px-1">O</th>
                      <th className="text-center py-1.5 px-1">U</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.multiBookOdds.map((book) => (
                      <tr key={book.bookmaker} className="border-b border-border/20 hover:bg-zinc-800/30">
                        <td className="py-1.5 pr-2 font-medium text-zinc-400 capitalize">{book.bookmaker}</td>
                        <td className="text-center py-1.5 px-1 tabular-nums text-blue-400">{book.moneyline ? (book.moneyline.away > 0 ? '+' : '') + book.moneyline.away : '-'}</td>
                        <td className="text-center py-1.5 px-1 tabular-nums text-blue-400">{book.moneyline ? (book.moneyline.home > 0 ? '+' : '') + book.moneyline.home : '-'}</td>
                        <td className="text-center py-1.5 px-1 tabular-nums text-emerald-400">{book.runline ? `${book.runline.awaySpread} (${book.runline.awayOdds > 0 ? '+' : ''}${book.runline.awayOdds})` : '-'}</td>
                        <td className="text-center py-1.5 px-1 tabular-nums text-emerald-400">{book.runline ? `${book.runline.homeSpread} (${book.runline.homeOdds > 0 ? '+' : ''}${book.runline.homeOdds})` : '-'}</td>
                        <td className="text-center py-1.5 px-1 tabular-nums text-amber-400">{book.total ? `${book.total.line} (${book.total.overOdds > 0 ? '+' : ''}${book.total.overOdds})` : '-'}</td>
                        <td className="text-center py-1.5 px-1 tabular-nums text-amber-400">{book.total ? `${book.total.line} (${book.total.underOdds > 0 ? '+' : ''}${book.total.underOdds})` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

            <div className="border-t border-border/50 my-4"></div>

            {/* AI Game Analysis */}
            {game.aiSummary && (
              <div className="mb-4 p-3 bg-zinc-900/50 border border-border/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-4 w-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-foreground">AI Game Analysis</h4>
                  {edgeScore.score > 0 && (
                    <Badge className={`text-xs border ${edgeScore.score >= 60 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : edgeScore.score >= 30 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                      Edge {edgeScore.score}
                    </Badge>
                  )}
                  {edgeScore.signals.length > 0 && (
                    <span className="text-[10px] text-zinc-500">{edgeScore.signals.join(' · ')}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {game.aiSummary.summary}
                </p>
              </div>
            )}

            {/* Expert Panel Picks */}
            {expertPicks.length > 0 && (
              <div className="mb-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-purple-400" />
                  <h4 className="text-sm font-medium text-foreground">Expert Picks</h4>
                  <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 text-xs">{expertPicks.length}</Badge>
                </div>
                <div className="space-y-1.5">
                  {expertPicks.map((pick: any) => (
                    <div key={pick.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{pick.expertId === 'contrarian' ? '🕵️‍♂️' : pick.expertId === 'quant' ? '🧑‍💻' : pick.expertId === 'sharp' ? '🎯' : pick.expertId === 'homie' ? '😄' : '⏰'}</span>
                        <span className="text-foreground">{pick.selection}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums text-zinc-500">{pick.odds > 0 ? '+' : ''}{pick.odds}</span>
                        <Badge className={`text-[9px] px-1 py-0 border ${pick.confidence >= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{pick.confidence}%</Badge>
                        {pick.result && pick.result !== 'pending' && (
                          <Badge className={`text-[9px] px-1 py-0 border ${pick.result === 'win' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>{pick.result.toUpperCase()}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pick Suggestions */}
            <div className="space-y-4">
              {/* AI Pick */}
              {aiPick && (
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      <h5 className="text-sm font-semibold text-foreground">AI Suggestion</h5>
                      <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 font-medium">
                        {aiPick.confidence}%
                      </Badge>
                    </div>
                    <Badge className="bg-zinc-800 text-zinc-300 tabular-nums">{aiPick.odds || "N/A"}</Badge>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="text-purple-400">{getPickIcon(aiPick.pickType)}</div>
                    <span className="text-sm font-semibold text-foreground">{aiPick.selection}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiPick.reasoning}
                  </p>
                </div>
              )}

            </div>
      </CardContent>
      )}
    </Card>
  );
}