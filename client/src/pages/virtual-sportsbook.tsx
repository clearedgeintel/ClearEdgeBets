import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, TrendingUp, TrendingDown, RotateCcw, Trophy, BarChart3, LogIn, X, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

function teamLogo(code: string) {
  const c = code.toUpperCase() === 'WAS' ? 'wsh' : code.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${c}.png`;
}

function fmtOdds(odds: number) {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

interface Game {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode?: string;
  homeTeamCode?: string;
  gameTime: string;
  gameTimeEpoch?: number | null;
  venue: string;
  status?: string;
  odds?: {
    moneyline?: { away: number; home: number };
    total?: { line: number; over: number; under: number };
    spread?: { away: number; home: number };
  };
}

interface SlipItem {
  id: string;
  gameId: string;
  matchup: string;
  awayCode: string;
  homeCode: string;
  betType: string;
  selection: string;
  odds: number;
  stake: number;
}

export default function VirtualSportsbook() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [slip, setSlip] = useState<SlipItem[]>([]);
  const [isParlayMode, setIsParlayMode] = useState(false);
  const [parlayStake, setParlayStake] = useState(10);
  const [showHistory, setShowHistory] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Auth guard
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <h1 className="text-xl font-bold mb-2">Prediction Game</h1>
        <p className="text-sm text-zinc-500 mb-6">Sign in to start with $1,000 virtual money</p>
        <Button onClick={() => window.location.href = '/auth'} className="w-full">
          <LogIn className="h-4 w-4 mr-2" /> Sign In to Play
        </Button>
      </div>
    );
  }

  // Data
  const { data: balance } = useQuery<any>({
    queryKey: ['/api/user/balance'],
    queryFn: () => fetch('/api/user/balance', { credentials: 'include' }).then(r => r.json()),
  });

  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
    queryFn: () => fetch('/api/games', { credentials: 'include' }).then(r => r.json()),
    staleTime: 300000,
  });

  const { data: virtualBets = [] } = useQuery<any[]>({
    queryKey: ['/api/virtual/bets'],
    queryFn: () => fetch('/api/virtual/bets', { credentials: 'include' }).then(r => r.json()),
  });

  const placeBetsMutation = useMutation({
    mutationFn: (bets: any[]) => Promise.all(bets.map(b =>
      apiRequest("POST", "/api/virtual/bets", b)
    )),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/virtual/bets'] });
      qc.invalidateQueries({ queryKey: ['/api/user/balance'] });
      setSlip([]);
      toast({ title: 'Bets placed!' });
    },
    onError: () => toast({ title: 'Failed to place bets', variant: 'destructive' }),
  });

  const resetMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/user/balance/reset", { clearHistory: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/user/balance'] });
      qc.invalidateQueries({ queryKey: ['/api/virtual/bets'] });
      setShowResetDialog(false);
      toast({ title: 'Balance reset to $1,000' });
    },
  });

  // Filter upcoming games
  const upcoming = useMemo(() => (games || []).filter((g: any) => {
    if (g.status === 'live' || g.status === 'final') return false;
    if (g.gameTimeEpoch) return Date.now() < g.gameTimeEpoch * 1000;
    return true;
  }), [games]);

  // Slip helpers
  const isInSlip = (gameId: string, betType: string, selection: string) =>
    slip.some(s => s.gameId === gameId && s.betType === betType && s.selection === selection);

  const addToSlip = (game: Game, betType: string, selection: string, odds: number) => {
    if (isInSlip(game.gameId, betType, selection)) return;
    const awayCode = game.awayTeamCode || game.gameId.match(/([A-Z]{2,3})\s*@/)?.[1] || '';
    const homeCode = game.homeTeamCode || game.gameId.match(/@\s*([A-Z]{2,3})/)?.[1] || '';
    setSlip(prev => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      gameId: game.gameId, matchup: `${game.awayTeam} @ ${game.homeTeam}`,
      awayCode, homeCode, betType, selection, odds, stake: 10,
    }]);
  };

  const removeFromSlip = (id: string) => setSlip(prev => prev.filter(s => s.id !== id));

  const updateStake = (id: string, stake: number) =>
    setSlip(prev => prev.map(s => s.id === id ? { ...s, stake } : s));

  const calcPayout = (stake: number, odds: number) =>
    odds > 0 ? stake + stake * odds / 100 : stake + stake * 100 / Math.abs(odds);

  const calcParlayOdds = () => {
    let dec = 1;
    slip.forEach(s => { dec *= s.odds > 0 ? s.odds / 100 + 1 : 100 / Math.abs(s.odds) + 1; });
    return dec >= 2 ? Math.round((dec - 1) * 100) : Math.round(-100 / (dec - 1));
  };

  const placeBets = () => {
    if (isParlayMode) {
      // Place as single virtual bet with parlay note
      const pOdds = calcParlayOdds();
      placeBetsMutation.mutate([{
        gameId: slip[0].gameId, betType: 'parlay',
        selection: slip.map(s => s.selection).join(' + '),
        odds: pOdds, stake: parlayStake,
        potentialWin: Math.round(calcPayout(parlayStake, pOdds)),
      }]);
    } else {
      placeBetsMutation.mutate(slip.filter(s => s.stake > 0).map(s => ({
        gameId: s.gameId, betType: s.betType, selection: s.selection,
        odds: s.odds, stake: s.stake, potentialWin: Math.round(calcPayout(s.stake, s.odds)),
      })));
    }
  };

  const totalSlipStake = isParlayMode ? parlayStake : slip.reduce((s, b) => s + b.stake, 0);
  const bal = balance?.balance ?? 1000;
  const pendingBets = virtualBets.filter((b: any) => b.status === 'pending');
  const settledBets = virtualBets.filter((b: any) => b.status === 'settled');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Prediction Game</h1>
          <p className="text-xs text-zinc-500">Paper trade with $1,000. Picks settle automatically.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/virtual-performance">
            <Button variant="outline" size="sm" className="text-xs h-7"><BarChart3 className="h-3 w-3 mr-1" />Stats</Button>
          </Link>
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-7"><RotateCcw className="h-3 w-3 mr-1" />Reset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Reset to $1,000?</DialogTitle></DialogHeader>
              <p className="text-sm text-zinc-500">This clears your balance and bet history.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>Reset</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balance strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Balance', value: `$${bal.toFixed(0)}`, color: 'text-foreground', icon: DollarSign },
          { label: 'Winnings', value: `$${(balance?.totalWinnings ?? 0).toFixed(0)}`, color: 'text-emerald-400', icon: TrendingUp },
          { label: 'Losses', value: `$${(balance?.totalLosses ?? 0).toFixed(0)}`, color: 'text-red-400', icon: TrendingDown },
          { label: 'Win Rate', value: `${balance?.winRate ?? '0.0'}%`, color: 'text-amber-400', icon: Trophy },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1">
              <s.icon className="h-3 w-3" />{s.label}
            </div>
            <div className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Games column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Today's Lines</h2>
            <span className="text-[10px] text-zinc-600">{upcoming.length} games</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-800/50 rounded-lg animate-pulse" />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-sm">No upcoming games</div>
          ) : (
            <div className="space-y-1.5">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_80px_80px] gap-1 px-3 text-[10px] text-zinc-600 uppercase tracking-wider">
                <span></span>
                <span className="text-center">Spread</span>
                <span className="text-center">ML</span>
                <span className="text-center">Total</span>
              </div>

              {upcoming.map((game: any) => {
                const awayCode = game.awayTeamCode || game.gameId.match(/([A-Z]{2,3})\s*@/)?.[1] || '';
                const homeCode = game.homeTeamCode || game.gameId.match(/@\s*([A-Z]{2,3})/)?.[1] || '';
                const ml = game.odds?.moneyline;
                const total = game.odds?.total;
                const spread = game.odds?.spread;

                const OddsBtn = ({ type, sel, odds, label }: { type: string; sel: string; odds: number; label: string }) => {
                  const active = isInSlip(game.gameId, type, sel);
                  return (
                    <button
                      onClick={() => addToSlip(game, type, sel, odds)}
                      disabled={active}
                      className={`h-7 rounded text-[11px] font-medium tabular-nums transition-colors ${
                        active
                          ? 'bg-amber-600 text-white'
                          : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                };

                return (
                  <div key={game.gameId} className="bg-card border border-border/20 rounded-lg overflow-hidden">
                    {/* Game time bar */}
                    <div className="px-3 py-1 bg-zinc-900/50 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">{game.gameTime} — {game.venue?.split(',')[0]}</span>
                    </div>

                    {/* Away row */}
                    <div className="grid grid-cols-[1fr_80px_80px_80px] gap-1 px-3 py-1.5 items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={teamLogo(awayCode)} alt="" className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{awayCode}</span>
                      </div>
                      <OddsBtn
                        type="spread" sel={`${game.awayTeam} +1.5`}
                        odds={spread?.away || -110}
                        label={`+1.5 ${fmtOdds(spread?.away || -110)}`}
                      />
                      {ml ? (
                        <OddsBtn type="moneyline" sel={`${game.awayTeam} ML`} odds={ml.away} label={fmtOdds(ml.away)} />
                      ) : <div className="h-7 bg-zinc-800/40 rounded flex items-center justify-center text-[10px] text-zinc-600">—</div>}
                      {total ? (
                        <OddsBtn type="total" sel={`Over ${total.line}`} odds={total.over} label={`O ${total.line}`} />
                      ) : <div className="h-7 bg-zinc-800/40 rounded flex items-center justify-center text-[10px] text-zinc-600">—</div>}
                    </div>

                    {/* Home row */}
                    <div className="grid grid-cols-[1fr_80px_80px_80px] gap-1 px-3 py-1.5 items-center border-t border-border/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={teamLogo(homeCode)} alt="" className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{homeCode}</span>
                      </div>
                      <OddsBtn
                        type="spread" sel={`${game.homeTeam} -1.5`}
                        odds={spread?.home || -110}
                        label={`-1.5 ${fmtOdds(spread?.home || -110)}`}
                      />
                      {ml ? (
                        <OddsBtn type="moneyline" sel={`${game.homeTeam} ML`} odds={ml.home} label={fmtOdds(ml.home)} />
                      ) : <div className="h-7 bg-zinc-800/40 rounded" />}
                      {total ? (
                        <OddsBtn type="total" sel={`Under ${total.line}`} odds={total.under} label={`U ${total.line}`} />
                      ) : <div className="h-7 bg-zinc-800/40 rounded" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bet History (collapsible) */}
          <div className="mt-6">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2">
              <ChevronDown className={`h-3 w-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              Bet History ({virtualBets.length})
            </button>
            {showHistory && (
              <div className="space-y-1">
                {virtualBets.slice(0, 20).map((bet: any) => (
                  <div key={bet.id} className="flex items-center justify-between py-1.5 px-2.5 rounded bg-zinc-900/30 border border-border/20 text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className={`text-[9px] px-1 ${
                        bet.result === 'win' ? 'bg-emerald-500/10 text-emerald-400' :
                        bet.result === 'loss' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{bet.status === 'settled' ? bet.result?.toUpperCase() : 'PENDING'}</Badge>
                      <span className="text-zinc-300 truncate">{bet.selection}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-zinc-500 tabular-nums">
                      <span>${parseFloat(bet.stake).toFixed(0)}</span>
                      <span>{fmtOdds(bet.odds)}</span>
                      {bet.status === 'settled' && bet.result === 'win' && (
                        <span className="text-emerald-400">+${parseFloat(bet.actualWin).toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                ))}
                {virtualBets.length === 0 && <p className="text-xs text-zinc-600 text-center py-4">No bets yet</p>}
              </div>
            )}
          </div>
        </div>

        {/* Pick Slip sidebar */}
        <div className="w-72 flex-shrink-0 hidden lg:block">
          <div className="sticky top-20">
            <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-zinc-900/50 border-b border-border/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Pick Slip</h3>
                  {slip.length > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-400 text-[10px]">{slip.length}</Badge>
                  )}
                </div>
              </div>

              {slip.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-600">
                  Click odds to add picks
                </div>
              ) : (
                <div>
                  {slip.map(bet => (
                    <div key={bet.id} className="px-3 py-2.5 border-b border-border/10">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <img src={teamLogo(bet.awayCode)} alt="" className="h-3.5 w-3.5" />
                          <span className="text-[11px] text-zinc-400">@</span>
                          <img src={teamLogo(bet.homeCode)} alt="" className="h-3.5 w-3.5" />
                        </div>
                        <button onClick={() => removeFromSlip(bet.id)} className="text-zinc-600 hover:text-red-400">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-xs font-medium text-zinc-200">{bet.selection}</div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-amber-400 tabular-nums">{fmtOdds(bet.odds)}</span>
                        {!isParlayMode && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-500">$</span>
                            <input
                              type="number" value={bet.stake} min={1}
                              onChange={e => updateStake(bet.id, Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-14 h-5 text-[11px] text-right bg-zinc-800 border border-zinc-700 rounded px-1 tabular-nums"
                            />
                          </div>
                        )}
                      </div>
                      {!isParlayMode && bet.stake > 0 && (
                        <div className="text-[10px] text-emerald-500/70 text-right mt-0.5 tabular-nums">
                          Win ${calcPayout(bet.stake, bet.odds).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Parlay toggle */}
                  {slip.length >= 2 && (
                    <div className="px-3 py-2 border-b border-border/10 bg-zinc-900/30">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isParlayMode} onChange={e => setIsParlayMode(e.target.checked)}
                          className="rounded border-zinc-600 bg-zinc-800 text-amber-500" />
                        <span className="text-xs font-medium">Parlay ({slip.length} legs)</span>
                        {isParlayMode && (
                          <span className="ml-auto text-[10px] text-amber-400 tabular-nums">{fmtOdds(calcParlayOdds())}</span>
                        )}
                      </label>
                      {isParlayMode && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">Stake $</span>
                          <input type="number" value={parlayStake} min={1}
                            onChange={e => setParlayStake(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-16 h-5 text-[11px] text-right bg-zinc-800 border border-zinc-700 rounded px-1 tabular-nums" />
                          <span className="text-[10px] text-emerald-500/70 tabular-nums ml-auto">
                            Win ${calcPayout(parlayStake, calcParlayOdds()).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Place button */}
                  <div className="p-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span>Total Stake</span>
                      <span className="font-medium text-foreground tabular-nums">${totalSlipStake.toFixed(2)}</span>
                    </div>
                    <Button
                      className="w-full h-9 text-xs bg-amber-600 hover:bg-amber-700"
                      disabled={totalSlipStake <= 0 || totalSlipStake > bal || placeBetsMutation.isPending}
                      onClick={placeBets}
                    >
                      {placeBetsMutation.isPending ? 'Placing...' : isParlayMode ? `Place Parlay ($${parlayStake})` : `Place ${slip.length} Pick${slip.length !== 1 ? 's' : ''}`}
                    </Button>
                    {totalSlipStake > bal && (
                      <p className="text-[10px] text-red-400 mt-1 text-center">Insufficient balance</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile slip (fixed bottom) */}
      {slip.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
          <div className="bg-card border border-amber-500/30 rounded-xl p-3 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">{slip.length} pick{slip.length !== 1 ? 's' : ''} — ${totalSlipStake.toFixed(0)}</span>
              <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                disabled={totalSlipStake <= 0 || placeBetsMutation.isPending} onClick={placeBets}>
                Place Picks
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
