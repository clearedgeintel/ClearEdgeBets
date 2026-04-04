import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Brain, User, Target, TrendingUp, DollarSign, Wind, Thermometer, CloudRain } from "lucide-react";
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
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${code.toLowerCase()}.png`;
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
    if (expertPicks.length < 3) return null;
    const sides: Record<string, string[]> = {};
    expertPicks.forEach((p: any) => {
      const key = p.selection?.toLowerCase().trim();
      if (key) { sides[key] = sides[key] || []; sides[key].push(p.expertId); }
    });
    const best = Object.entries(sides).sort((a, b) => b[1].length - a[1].length)[0];
    return best && best[1].length >= 3 ? { selection: expertPicks.find((p: any) => p.selection?.toLowerCase().trim() === best[0])?.selection, count: best[1].length, experts: best[1] } : null;
  })();

  // Expert debate — two experts disagree on same game
  const debate = (() => {
    if (expertPicks.length < 2) return null;
    // Find two picks that are opposite sides of same market
    for (let i = 0; i < expertPicks.length; i++) {
      for (let j = i + 1; j < expertPicks.length; j++) {
        const a = expertPicks[i]; const b = expertPicks[j];
        if (a.pickType === b.pickType && a.selection !== b.selection) {
          return { a, b };
        }
      }
    }
    return null;
  })();

  // Check if a Morning Roast recap exists for this game
  const { data: blogReviews = [] } = useQuery<any[]>({
    queryKey: ['/api/blog/reviews'],
    queryFn: () => fetch('/api/blog/reviews').then(r => r.json()),
    staleTime: 300000,
  });
  const matchCodes = game.gameId.match(/([A-Z]{2,3})\s*@\s*([A-Z]{2,3})/);
  const hasRecap = blogReviews.some((r: any) => r.gameId?.includes(matchCodes?.[1] || '___') && r.gameId?.includes(matchCodes?.[2] || '___'));

  // Fetch all daily picks, AI suggested bets, and game evaluations
  const { data: allAIPicks = [] } = useQuery<any[]>({
    queryKey: ['/api/daily-picks']
  });

  const { data: aiSuggestedBets = [] } = useQuery<any[]>({
    queryKey: ['/api/ai-suggested-bets']
  });

  const { data: gameEvaluations = [] } = useQuery<any[]>({
    queryKey: ['/api/game-evaluations']
  });

  // No expert picks API - removed to maintain authentic data only

  // Get AI pick that matches this specific game 
  const aiPick = allAIPicks.find(pick => {
    if (!pick.gameId) return false;
    
    // Exact gameId match - picks now use same format as games: "2025-07-21_BAL @ CLE"
    return pick.gameId === game.gameId;
  }) || null;

  // Get evaluation data for this game
  const gameEvaluation = gameEvaluations.find(evaluation => evaluation.gameId === game.gameId);
  
  // No expert picks available - removed to maintain authentic data integrity

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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { variant: "default" as const, label: "High", color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" };
    if (confidence >= 65) return { variant: "secondary" as const, label: "Med", color: "bg-amber-500/15 text-amber-400 border border-amber-500/20" };
    return { variant: "outline" as const, label: "Low", color: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20" };
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
              <div className="text-lg font-bold tabular-nums">{game.awayScore} - {game.homeScore}</div>
            ) : (
              <div className="text-xs text-muted-foreground font-medium">{game.gameTime}</div>
            )}
            <div className="text-[10px] text-muted-foreground">@</div>
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

        {/* Consensus / Debate / Recap indicators */}
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
          {hasRecap && (
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-1.5 py-0 cursor-pointer">
              ☕ Read Recap
            </Badge>
          )}
        </div>

        {/* Odds toggle */}
        {(moneylineOdds || totalOdds || spreadOdds) && (
          <div className="mt-2">
            {showOdds ? (
              <div className="flex items-center justify-center gap-4 text-[11px] tabular-nums">
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
                <button onClick={() => setShowOdds(false)} className="text-zinc-600 hover:text-zinc-400 text-[10px]">Hide</button>
              </div>
            ) : (
              <button onClick={() => setShowOdds(true)} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                Show Odds →
              </button>
            )}
          </div>
        )}

        {/* Context strip: weather, park factor, AI confidence */}
        <div className="flex flex-wrap items-center justify-between mt-2 gap-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
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
            {game.beatWriter && (
              <span className="flex items-center gap-1 text-amber-400/70 hidden sm:flex">
                <span>{game.beatWriter.avatar}</span>
                <span>{game.beatWriter.name}</span>
              </span>
            )}
          </div>

          {/* Expert picks + AI confidence + expand */}
          <div className="flex items-center gap-1.5">
            {expertPicks.length > 0 && (
              <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-1.5 py-0">
                <Target className="h-2.5 w-2.5 mr-0.5" />{expertPicks.length} expert{expertPicks.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {game.aiSummary && game.aiSummary.confidence > 0 && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-1.5 py-0">
                <Brain className="h-2.5 w-2.5 mr-0.5" />{game.aiSummary.confidence}%
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
                  <Brain className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-sm font-medium text-foreground">AI Game Analysis</h4>
                  <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                    {game.aiSummary.confidence}%
                  </Badge>
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

              {/* Expert picks removed - no authentic expert picks API available */}

              {/* AI Suggested Picks - Show for all games */}
              {!aiPick && (() => {
                const gameSuggestions = aiSuggestedBets.find(bet => bet.gameId === game.gameId);
                
                if (gameSuggestions?.suggestions?.length > 0) {
                  return (
                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Brain className="h-5 w-5 text-blue-400" />
                        <h5 className="text-sm font-semibold text-foreground">AI Suggested Picks</h5>
                        <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 text-xs">
                          {gameSuggestions.suggestions.length} Options
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {gameSuggestions.suggestions.map((suggestion: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2.5 bg-zinc-900/50 rounded border border-border/50">
                            <div className="flex items-center space-x-2">
                              <div className="text-blue-400">{getPickIcon(suggestion.betType)}</div>
                              <div>
                                <span className="text-sm font-medium text-foreground">
                                  {suggestion.betType === 'moneyline' ? `${suggestion.team} ML` :
                                   suggestion.betType === 'total' ? `${suggestion.selection.toUpperCase()} ${suggestion.line}` :
                                   suggestion.betType === 'spread' ? `${suggestion.team} ${suggestion.line}` :
                                   suggestion.selection}
                                </span>
                                <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getConfidenceBadge(suggestion.confidence).color + " text-xs mb-1"}>
                                {suggestion.confidence}%
                              </Badge>
                              <p className="text-xs text-zinc-400 tabular-nums">{formatOdds(suggestion.odds)}</p>
                              <p className="text-xs text-emerald-400">EV: {suggestion.expectedValue}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Fallback for games without suggestions
                return (
                  <div className="text-center py-6 bg-zinc-900/30 border border-border/30 rounded-lg">
                    <Brain className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
                    {gameEvaluation ? (
                      <>
                        <p className="text-sm text-foreground font-medium mb-2">
                          {gameEvaluation.evaluationStatus === 'evaluated' ? 'Game Evaluated - No Pick Warranted' :
                           gameEvaluation.evaluationStatus === 'no_value' ? 'No Betting Value Found' :
                           'Insufficient Data for Analysis'}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto mb-3">
                          {gameEvaluation.reasoning ||
                           'Our AI analyzed this matchup but didn\'t find sufficient edge for a recommended bet.'}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs text-zinc-400 border-zinc-700">
                          {gameEvaluation.evaluationStatus === 'evaluated' ? 'Analysis Complete' :
                           gameEvaluation.evaluationStatus === 'no_value' ? 'No Value Found' :
                           'Data Incomplete'}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-foreground font-medium mb-2">Analysis Pending</p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                          This game hasn't been evaluated yet. Check back later for AI analysis and potential picks.
                        </p>
                        <Badge variant="secondary" className="mt-3 text-xs">
                          Awaiting Analysis
                        </Badge>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
      </CardContent>
      )}
    </Card>
  );
}