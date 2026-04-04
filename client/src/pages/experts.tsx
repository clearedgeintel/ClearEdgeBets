import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Target, TrendingUp, Users, ChevronDown, ChevronUp, UserPlus, UserMinus, Sparkles, Clock } from "lucide-react";
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
  createdAt: string;
}

interface UserFollow {
  expertId: string;
  mode: string;
}

function teamLogo(code: string) {
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${code.toLowerCase()}.png`;
}

const riskColors: Record<string, string> = {
  conservative: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  moderate: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  aggressive: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function Experts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedExpert, setExpandedExpert] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = user?.isAdmin;

  const { data: experts = [] } = useQuery<ExpertWithRecord[]>({
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
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const getFollowMode = (expertId: string) => follows.find(f => f.expertId === expertId)?.mode;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Expert Panel</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">5 AI analysts. 5 different lenses. Follow or fade.</p>
      </div>

      <div className="space-y-3">
        {experts.map(expert => {
          const isExpanded = expandedExpert === expert.id;
          const expertPicks = todayPicks.filter(p => p.expertId === expert.id);
          const followMode = getFollowMode(expert.id);
          const total = expert.record.wins + expert.record.losses;

          return (
            <Card key={expert.id} className="border-border/30 overflow-hidden">
              <CardContent className="p-0">
                {/* Expert header — stacks on mobile */}
                <div className="p-3 sm:p-4 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                  onClick={() => setExpandedExpert(isExpanded ? null : expert.id)}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl sm:text-3xl flex-shrink-0">{expert.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-foreground">{expert.name}</h3>
                        <Badge className={`border text-[9px] ${riskColors[expert.riskLevel]}`}>{expert.riskLevel}</Badge>
                      </div>
                      <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 line-clamp-1">{expert.style}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-zinc-500 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                  {/* Stats row — always visible, compact */}
                  <div className="flex items-center gap-2 mt-2 ml-9 sm:ml-12">
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
                        {expertPicks.length} pick{expertPicks.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-border/20 p-3 sm:p-4 bg-zinc-900/20">
                    {/* Bio */}
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-3">{expert.bio}</p>

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

                    {/* Picks */}
                    {expertPicks.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Today's Picks</h4>
                        {expertPicks.map(pick => {
                          const codes = pick.gameId.split('@');
                          return (
                            <div key={pick.id} className="p-2.5 bg-zinc-900/50 border border-border/30 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  {codes[0] && <img src={teamLogo(codes[0])} alt="" className="h-4 w-4" />}
                                  <span className="text-sm font-medium text-foreground">{pick.selection}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] tabular-nums">
                                    {pick.odds > 0 ? '+' : ''}{pick.odds}
                                  </Badge>
                                  <Badge className={`text-[9px] border tabular-nums ${pick.confidence >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>{pick.confidence}%</Badge>
                                  {pick.result && pick.result !== 'pending' && (
                                    <Badge className={`text-[9px] border ${pick.result === 'win' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{pick.result.toUpperCase()}</Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-zinc-500 line-clamp-2">{pick.rationale}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-xs text-muted-foreground">
                        No picks today. Experts analyze the slate each morning.
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
