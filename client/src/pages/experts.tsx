import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpertAvatar } from "@/components/expert-avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Target, TrendingUp, Users, ChevronDown, ChevronUp, UserPlus, UserMinus, Sparkles, Clock, History, Share2 } from "lucide-react";
import { format } from "date-fns";

interface ExpertWithRecord {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  style: string;
  specialty: string;
  pickTypes: string[];
  riskLevel: string;
  record: { wins: number; losses: number; pushes: number; pending: number };
  winRate: number;
}

interface ExpertPick {
  id: number;
  expertId: string;
  gameId: string;
  gameDate: string;
  pickType: string;
  selection: string;
  odds: number;
  confidence: number;
  rationale: string;
  result: string;
  units: string;
  postGameNote?: string;
  createdAt: string;
}

interface UserFollow {
  expertId: string;
  mode: string;
}

function teamLogo(code: string) {
  const c = code.toUpperCase() === 'WAS' ? 'wsh' : code.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${c}.png`;
}

const riskColors: Record<string, string> = {
  conservative: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  moderate: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  aggressive: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const resultColors: Record<string, string> = {
  win: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  loss: 'bg-red-500/10 text-red-400 border-red-500/20',
  push: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function Experts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [collapsedExperts, setCollapsedExperts] = useState<Set<string>>(new Set());
  const [showBio, setShowBio] = useState<Set<string>>(new Set());
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = user?.isAdmin;

  const toggleExpert = (id: string) => {
    setCollapsedExperts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { data: experts = [], isLoading: expertsLoading } = useQuery<ExpertWithRecord[]>({
    queryKey: ['/api/experts'],
    queryFn: () => fetch('/api/experts').then(r => r.json()),
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: todayPicks = [] } = useQuery<ExpertPick[]>({
    queryKey: ['/api/expert-picks', today],
    queryFn: () => fetch(`/api/expert-picks?date=${today}`).then(r => r.json()),
  });

  const { data: follows = [] } = useQuery<UserFollow[]>({
    queryKey: ['/api/expert-follows'],
    queryFn: () => fetch('/api/expert-follows', { credentials: 'include' }).then(r => r.json()),
    enabled: !!user,
  });

  // Fetch recent pick history for all experts
  const { data: recentHistory = {} } = useQuery<Record<string, ExpertPick[]>>({
    queryKey: ['/api/expert-picks/recent-history'],
    queryFn: async () => {
      const expertIds = experts.map(e => e.id);
      const results: Record<string, ExpertPick[]> = {};
      await Promise.all(expertIds.map(async (id) => {
        try {
          const resp = await fetch(`/api/expert-picks/expert/${id}`);
          const picks: ExpertPick[] = await resp.json();
          // Get last 20 graded picks (not pending, not today)
          results[id] = picks
            .filter(p => p.result !== 'pending' && p.gameDate !== today)
            .sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime())
            .slice(0, 20);
        } catch { results[id] = []; }
      }));
      return results;
    },
    enabled: experts.length > 0,
  });

  const followMutation = useMutation({
    mutationFn: async ({ expertId, mode }: { expertId: string; mode: string }) => {
      const resp = await fetch('/api/expert-follow', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ expertId, mode }),
      });
      return resp.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expert-follows'] }),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch('/api/admin/generate-expert-picks', { method: 'POST', credentials: 'include' });
      if (!resp.ok) throw new Error((await resp.json()).error);
      return resp.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Picks generated!', description: `${data.totalPicks} picks from 5 experts` });
      queryClient.invalidateQueries({ queryKey: ['/api/expert-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/experts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expert-picks/recent-history'] });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const getFollowMode = (expertId: string) => follows.find(f => f.expertId === expertId)?.mode;

  // Calculate recent streak from history
  const getStreak = (picks: ExpertPick[]) => {
    if (!picks.length) return null;
    const first = picks[0].result;
    if (first !== 'win' && first !== 'loss') return null;
    let count = 0;
    for (const p of picks) {
      if (p.result === first) count++;
      else break;
    }
    return { type: first, count };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Expert Panel</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">5 AI analysts. 5 different lenses. Follow or fade.</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" className="text-xs h-8"
            onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <Sparkles className="h-3 w-3 mr-1" />
            {generateMutation.isPending ? 'Generating...' : 'Generate Picks'}
          </Button>
        )}
      </div>

      <DebatesBanner picks={todayPicks} experts={experts} />

      <div className="space-y-4">
        {expertsLoading && experts.length === 0 && Array.from({ length: 5 }).map((_, i) => (
          <Card key={`sk-${i}`} className="border border-zinc-700/60 overflow-hidden rounded-xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-4/5" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded-md" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {experts.map(expert => {
          const isExpanded = !collapsedExperts.has(expert.id);
          const expertPicks = todayPicks.filter(p => p.expertId === expert.id);
          const history = recentHistory[expert.id] || [];
          const followMode = getFollowMode(expert.id);
          const total = expert.record.wins + expert.record.losses;
          const streak = getStreak(history);

          return (
            <Card key={expert.id} className="border border-zinc-700/60 overflow-hidden rounded-xl shadow-md shadow-black/20">
              <CardContent className="p-0">
                {/* Expert header */}
                <div className="p-3 sm:p-4 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                  onClick={() => toggleExpert(expert.id)}>
                  <div className="flex items-start gap-3">
                    <ExpertAvatar avatar={expert.avatar} name={expert.name} size="lg" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-foreground">{expert.name}</h3>
                        <Badge className={`border text-[9px] ${riskColors[expert.riskLevel]}`}>{expert.riskLevel}</Badge>
                      </div>
                      <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 line-clamp-1">{expert.style}</p>
                      {/* Bio snippet — columnist-style, always visible */}
                      {!isExpanded && expert.bio && (
                        <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">{expert.bio}</p>
                      )}
                      {/* Latest pick headline */}
                      {!isExpanded && expertPicks[0] && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                          <span className="text-amber-400/70">Today:</span>
                          <span className="font-medium text-foreground truncate">{expertPicks[0].selection}</span>
                          <Badge className={`text-[9px] px-1 py-0 border tabular-nums flex-shrink-0 ${expertPicks[0].confidence >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                            {expertPicks[0].confidence}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-zinc-500 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                  {/* Stats row */}
                  <div className="flex items-center gap-2 mt-2 ml-9 sm:ml-12 flex-wrap">
                    {total > 0 && (
                      <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] tabular-nums">
                        {expert.record.wins}-{expert.record.losses}
                      </Badge>
                    )}
                    {total > 0 && (
                      <Badge className={`text-[10px] tabular-nums border ${expert.winRate >= 55 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : expert.winRate >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {expert.winRate}%
                      </Badge>
                    )}
                    {expertPicks.length > 0 && (
                      <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]">
                        {expertPicks.length} pick{expertPicks.length !== 1 ? 's' : ''} today
                      </Badge>
                    )}
                    {streak && (
                      <Badge className={`text-[10px] border ${streak.type === 'win' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {streak.count}{streak.type === 'win' ? 'W' : 'L'} streak
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border/20 p-3 sm:p-4 bg-zinc-900/20">
                    {/* Bio toggle */}
                    <div className="mb-3">
                      <button
                        className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setShowBio(prev => { const next = new Set(prev); if (next.has(expert.id)) next.delete(expert.id); else next.add(expert.id); return next; }); }}>
                        {showBio.has(expert.id) ? 'Hide bio' : 'Bio'}
                      </button>
                      {showBio.has(expert.id) && (
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1.5">{expert.bio}</p>
                      )}
                    </div>

                    {/* Follow/Fade buttons */}
                    {user && (
                      <div className="flex gap-2 mb-4">
                        <Button size="sm" variant={followMode === 'follow' ? 'default' : 'outline'}
                          className={`flex-1 h-8 text-xs ${followMode === 'follow' ? 'bg-emerald-600' : ''}`}
                          onClick={(e) => { e.stopPropagation(); followMutation.mutate({ expertId: expert.id, mode: 'follow' }); }}>
                          <UserPlus className="h-3 w-3 mr-1" />{followMode === 'follow' ? 'Following' : 'Follow'}
                        </Button>
                        <Button size="sm" variant={followMode === 'fade' ? 'default' : 'outline'}
                          className={`flex-1 h-8 text-xs ${followMode === 'fade' ? 'bg-red-600' : ''}`}
                          onClick={(e) => { e.stopPropagation(); followMutation.mutate({ expertId: expert.id, mode: 'fade' }); }}>
                          <UserMinus className="h-3 w-3 mr-1" />{followMode === 'fade' ? 'Fading' : 'Fade'}
                        </Button>
                      </div>
                    )}

                    {/* Specialty */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[10px] text-muted-foreground">
                      <span className="text-foreground">{expert.specialty}</span>
                      <span>·</span>
                      <span>{expert.pickTypes.join(', ')}</span>
                    </div>

                    {/* Today's Picks */}
                    {expertPicks.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
                          <Target className="h-3 w-3" /> Today's Picks
                        </h4>
                        {expertPicks.map(pick => {
                          const codes = pick.gameId.split('@');
                          const awayCode = (codes[0] || '').replace(/^\d+_/, '').trim();
                          const homeCode = (codes[1] || '').trim();
                          const resultBorder = pick.result === 'win' ? 'border-l-emerald-500/60'
                            : pick.result === 'loss' ? 'border-l-red-500/60'
                            : 'border-l-amber-500/40';
                          return (
                            <div key={pick.id} className={`p-3 bg-zinc-900/60 border border-border/30 border-l-2 ${resultBorder} rounded-lg`}>
                              {/* Matchup row */}
                              <div className="flex items-center gap-2 mb-2 text-[10px] text-zinc-500">
                                {awayCode && <img src={teamLogo(awayCode)} alt="" className="h-3.5 w-3.5" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
                                <span className="uppercase font-medium">{awayCode}</span>
                                <span className="text-zinc-700">@</span>
                                <span className="uppercase font-medium">{homeCode}</span>
                                {homeCode && <img src={teamLogo(homeCode)} alt="" className="h-3.5 w-3.5" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
                                <span className="ml-auto uppercase tracking-wider text-zinc-600">{pick.pickType || 'moneyline'}</span>
                              </div>

                              {/* Headline */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-base font-semibold text-foreground">{pick.selection}</span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] tabular-nums">
                                    {pick.odds > 0 ? '+' : ''}{pick.odds}
                                  </Badge>
                                  <Badge className={`text-[10px] border tabular-nums ${pick.confidence >= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : pick.confidence >= 60 ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                    {pick.confidence}%
                                  </Badge>
                                  {pick.units && (
                                    <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] tabular-nums">{pick.units}u</Badge>
                                  )}
                                  {pick.result && pick.result !== 'pending' && (
                                    <Badge className={`text-[10px] border font-bold ${resultColors[pick.result]}`}>{pick.result.toUpperCase()}</Badge>
                                  )}
                                </div>
                              </div>

                              {/* Rationale */}
                              <p className="text-xs text-zinc-400 leading-relaxed mt-2">{pick.rationale}</p>

                              {/* Post-game note (only if settled) */}
                              {pick.postGameNote && pick.result && pick.result !== 'pending' && (
                                <div className={`mt-2 pt-2 border-t border-border/20 text-[11px] leading-snug ${pick.result === 'win' ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                                  <span className="font-semibold uppercase tracking-wider text-[9px] mr-1.5">Recap</span>
                                  {pick.postGameNote}
                                </div>
                              )}

                              {/* Share button */}
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/api/og/pick/${pick.id}`;
                                    const text = `${expert.name}: ${pick.selection} (${pick.confidence}% confidence) — ClearEdge Sports`;
                                    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                                    window.open(tweetUrl, '_blank', 'width=550,height=420');
                                  }}
                                  className="flex items-center gap-1 p-1 text-[10px] text-zinc-600 hover:text-amber-400 transition-colors"
                                  title="Share on X"
                                >
                                  <Share2 className="h-3 w-3" /> Share
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-xs text-muted-foreground mb-4">
                        No picks today yet. Experts analyze the slate each morning.
                      </div>
                    )}

                    {/* Recent History */}
                    {history.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
                          <History className="h-3 w-3" /> Recent Results
                        </h4>
                        {/* Visual streak bar */}
                        <div className="flex gap-0.5 mb-2">
                          {history.slice(0, 15).map((pick, i) => (
                            <div
                              key={pick.id}
                              title={`${pick.selection} — ${pick.result.toUpperCase()} (${pick.gameDate})`}
                              className={`h-5 flex-1 rounded-sm ${
                                pick.result === 'win' ? 'bg-emerald-500/60' :
                                pick.result === 'loss' ? 'bg-red-500/60' :
                                'bg-zinc-600/60'
                              }`}
                            />
                          ))}
                        </div>
                        {/* Last 5 picks detail */}
                        <div className="space-y-1.5">
                          {history.slice(0, 5).map(pick => {
                            const codes = pick.gameId.split('@');
                            return (
                              <div key={pick.id} className="py-1.5 px-2.5 rounded bg-zinc-900/30 border border-border/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {codes[0] && <img src={teamLogo(codes[0])} alt="" className="h-3.5 w-3.5 flex-shrink-0" />}
                                    <span className="text-[11px] text-zinc-300 truncate">{pick.selection}</span>
                                    <span className="text-[10px] text-zinc-600">{pick.gameDate}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="text-[10px] text-zinc-500 tabular-nums">
                                      {pick.odds > 0 ? '+' : ''}{pick.odds}
                                    </span>
                                    <Badge className={`text-[9px] border ${resultColors[pick.result]}`}>
                                      {pick.result.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                {pick.postGameNote && (
                                  <p className={`text-[10px] mt-1 leading-snug ${pick.result === 'win' ? 'text-emerald-500/70' : pick.result === 'loss' ? 'text-red-400/70' : 'text-zinc-500'}`}>
                                    {pick.postGameNote}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface DebatesBannerProps {
  picks: ExpertPick[];
  experts: ExpertWithRecord[];
}

function DebatesBanner({ picks, experts }: DebatesBannerProps) {
  const safePicks = Array.isArray(picks) ? picks : [];
  const expertById = new Map((experts || []).map((e) => [e.id, e]));

  // Group picks by gameId, find games where experts disagree on selection
  const debates = (() => {
    const byGame = new Map<string, ExpertPick[]>();
    for (const p of safePicks) {
      if (!p.gameId) continue;
      const arr = byGame.get(p.gameId) || [];
      arr.push(p);
      byGame.set(p.gameId, arr);
    }
    const out: Array<{ gameId: string; a: ExpertPick; b: ExpertPick }> = [];
    byGame.forEach((list, gameId) => {
      if (list.length < 2) return;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (list[i].selection !== list[j].selection) {
            if (!out.some((d) => d.gameId === gameId)) {
              out.push({ gameId, a: list[i], b: list[j] });
            }
            return;
          }
        }
      }
    });
    return out.slice(0, 3);
  })();

  if (debates.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      <div className="text-[10px] uppercase tracking-wider font-bold text-purple-300 flex items-center gap-1.5">
        <span>⚔️</span> Debates
      </div>
      {debates.map((d) => {
        const ea = expertById.get(d.a.expertId);
        const eb = expertById.get(d.b.expertId);
        const matchup = (d.gameId.split("_")[1] || d.gameId).replace(/@/g, " @ ");
        return (
          <div key={`${d.gameId}-${d.a.expertId}-${d.b.expertId}`} className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/30 rounded-lg p-3">
            <div className="text-[10px] text-zinc-500 mb-1.5">{matchup}</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{ea?.name || d.a.expertId}</span>
              <span className="text-purple-300">picks</span>
              <span className="font-semibold text-foreground">{d.a.selection}</span>
              <span className="text-zinc-600 mx-1">·</span>
              <span className="font-medium text-foreground">{eb?.name || d.b.expertId}</span>
              <span className="text-purple-300">picks</span>
              <span className="font-semibold text-foreground">{d.b.selection}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
