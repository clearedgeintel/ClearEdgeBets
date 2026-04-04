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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Expert Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">5 AI analysts. 5 different lenses. Follow or fade.</p>
        </div>
        {isAdmin && (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}>
            {generateMutation.isPending ? <><Clock className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Today's Picks</>}
          </Button>
        )}
      </div>

      {/* Expert Cards */}
      <div className="space-y-4">
        {experts.map(expert => {
          const isExpanded = expandedExpert === expert.id;
          const expertPicks = todayPicks.filter(p => p.expertId === expert.id);
          const followMode = getFollowMode(expert.id);
          const total = expert.record.wins + expert.record.losses;

          return (
            <Card key={expert.id} className="border-border/30 overflow-hidden">
              <CardContent className="p-0">
                {/* Expert header */}
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                  onClick={() => setExpandedExpert(isExpanded ? null : expert.id)}>
                  <div className="text-3xl flex-shrink-0">{expert.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{expert.name}</h3>
                      <span className="text-xs text-muted-foreground">— {expert.title}</span>
                      <Badge className={`border text-[10px] ${riskColors[expert.riskLevel]}`}>{expert.riskLevel}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{expert.style}</p>
                  </div>
                  {/* Record */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-xs">
                    {total > 0 && (
                      <div className="text-center">
                        <div className="font-bold text-foreground tabular-nums">{expert.record.wins}-{expert.record.losses}</div>
                        <div className="text-muted-foreground">W-L</div>
                      </div>
                    )}
                    {total > 0 && (
                      <div className="text-center">
                        <div className={`font-bold tabular-nums ${expert.winRate >= 55 ? 'text-emerald-400' : expert.winRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{expert.winRate}%</div>
                        <div className="text-muted-foreground">Win%</div>
                      </div>
                    )}
                    {expertPicks.length > 0 && (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">
                        {expertPicks.length} pick{expertPicks.length !== 1 ? 's' : ''} today
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border/20 p-4 bg-zinc-900/20">
                    {/* Bio + follow buttons */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-2">{expert.bio}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Specialty: <span className="text-foreground">{expert.specialty}</span></span>
                          <span>·</span>
                          <span>Picks: <span className="text-foreground">{expert.pickTypes.join(', ')}</span></span>
                        </div>
                      </div>
                      {user && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button size="sm" variant={followMode === 'follow' ? 'default' : 'outline'}
                            className={followMode === 'follow' ? 'bg-emerald-600 h-7 text-xs' : 'h-7 text-xs'}
                            onClick={(e) => { e.stopPropagation(); followMutation.mutate({ expertId: expert.id, mode: 'follow' }); }}>
                            <UserPlus className="h-3 w-3 mr-1" />{followMode === 'follow' ? 'Following' : 'Follow'}
                          </Button>
                          <Button size="sm" variant={followMode === 'fade' ? 'default' : 'outline'}
                            className={followMode === 'fade' ? 'bg-red-600 h-7 text-xs' : 'h-7 text-xs'}
                            onClick={(e) => { e.stopPropagation(); followMutation.mutate({ expertId: expert.id, mode: 'fade' }); }}>
                            <UserMinus className="h-3 w-3 mr-1" />{followMode === 'fade' ? 'Fading' : 'Fade'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Today's picks */}
                    {expertPicks.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Today's Picks</h4>
                        {expertPicks.map(pick => {
                          const codes = pick.gameId.split('@');
                          return (
                            <div key={pick.id} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-border/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                {codes[0] && <img src={teamLogo(codes[0])} alt="" className="h-5 w-5" />}
                                <div>
                                  <div className="text-sm font-medium text-foreground">{pick.selection}</div>
                                  <div className="text-xs text-muted-foreground">{pick.rationale}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                                <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 tabular-nums">
                                  {pick.odds > 0 ? '+' : ''}{pick.odds}
                                </Badge>
                                <Badge className={`border tabular-nums ${pick.confidence >= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : pick.confidence >= 50 ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                  {pick.confidence}%
                                </Badge>
                                {pick.result && pick.result !== 'pending' && (
                                  <Badge className={pick.result === 'win' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : pick.result === 'loss' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}>
                                    {pick.result.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No picks posted today yet. {isAdmin && 'Click "Generate Today\'s Picks" above.'}
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
