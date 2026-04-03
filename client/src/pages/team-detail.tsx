import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, Trophy, TrendingUp, TrendingDown, Activity, AlertTriangle, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PowerComponent {
  name: string;
  rawValue: string;
  score: number;
  weight: number;
  weighted: number;
  formula: string;
}

interface PowerBreakdown {
  available: boolean;
  team: string;
  totalPower: number;
  batting: { total: number; components: PowerComponent[] };
  pitching: { total: number; components: PowerComponent[] };
}

interface PlayerData {
  playerID: string;
  name: string;
  pos: string;
  jerseyNum: string;
  bat: string;
  throw: string;
  height: string;
  weight: string;
  headshot?: string;
  injury?: { description: string; injDate?: string; designation?: string } | null;
  stats?: {
    Pitching?: Record<string, string>;
    Hitting?: Record<string, string>;
    gamesPlayed?: string;
    gamesStarted?: string;
    [key: string]: any;
  } | null;
}

interface TeamDetail {
  teamAbv: string;
  teamName: string;
  teamCity: string;
  shortName: string;
  logo: string;
  venue: string;
  division: string;
  conference: string;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
  roster: PlayerData[];
  powerScore: any;
}

export default function TeamDetailPage() {
  const [, params] = useRoute("/team/:teamAbv");
  const teamAbv = params?.teamAbv?.toUpperCase() || "";

  const { data: team, isLoading, error } = useQuery<TeamDetail>({
    queryKey: ['/api/team', teamAbv],
    queryFn: () => fetch(`/api/team/${teamAbv}`, { credentials: 'include' }).then(r => {
      if (!r.ok) throw new Error('Team not found');
      return r.json();
    }),
    enabled: !!teamAbv,
  });

  const { data: powerBreakdown } = useQuery<PowerBreakdown>({
    queryKey: ['/api/team-power-breakdown', teamAbv],
    queryFn: () => fetch(`/api/team-power-breakdown/${teamAbv}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!teamAbv,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-48 bg-muted rounded-xl"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-lg"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Team not found.</p>
        <Link href="/team-power-scores"><Button variant="outline" className="mt-4">Back to Rankings</Button></Link>
      </div>
    );
  }

  const pitchers = team.roster.filter(p => p.pos === 'P');
  const hitters = team.roster.filter(p => p.pos !== 'P');
  const wpct = team.wins + team.losses > 0 ? (team.wins / (team.wins + team.losses)).toFixed(3) : '.000';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/team-power-scores">
        <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4 mr-1" /> Power Rankings
        </Button>
      </Link>

      {/* Team Header */}
      <div className="flex items-center gap-4 sm:gap-6 mb-6">
        <img src={team.logo} alt={team.teamName} className="h-16 w-16 sm:h-24 sm:w-24 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight truncate">{team.teamName}</h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs sm:text-sm mt-1">
            <span>{team.conference} · {team.division}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{team.venue}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl sm:text-4xl font-bold tabular-nums text-foreground">{team.wins}-{team.losses}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">{wpct}</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground tabular-nums">{team.runsScored}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Runs Scored</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground tabular-nums">{team.runsAllowed}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Runs Allowed</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold tabular-nums ${team.runDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {team.runDiff >= 0 ? '+' : ''}{team.runDiff}
            </div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Run Diff</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {team.wins + team.losses > 0 ? (team.runsScored / (team.wins + team.losses)).toFixed(1) : '-'}
            </div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">RS/Game</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {team.wins + team.losses > 0 ? (team.runsAllowed / (team.wins + team.losses)).toFixed(1) : '-'}
            </div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">RA/Game</div>
          </CardContent>
        </Card>
      </div>

      {/* Power Score Breakdown */}
      {powerBreakdown?.available && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Batting Score */}
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  Batting Score
                </span>
                <span className="text-2xl font-bold tabular-nums text-blue-400">{powerBreakdown.batting.total}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {powerBreakdown.batting.components.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-muted-foreground">{c.rawValue}</span>
                    </div>
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="text-zinc-500 text-[10px]">{c.weight}%</span>
                      <span className="text-blue-400 font-medium w-6 text-right">{c.weighted}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={c.score} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-zinc-500 tabular-nums w-8 text-right">{c.score}/100</span>
                  </div>
                  <p className="text-[9px] text-zinc-600 mt-0.5">{c.formula}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pitching Score */}
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Pitching Score
                </span>
                <span className="text-2xl font-bold tabular-nums text-emerald-400">{powerBreakdown.pitching.total}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {powerBreakdown.pitching.components.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-muted-foreground">{c.rawValue}</span>
                    </div>
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="text-zinc-500 text-[10px]">{c.weight}%</span>
                      <span className="text-emerald-400 font-medium w-6 text-right">{c.weighted}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={c.score} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-zinc-500 tabular-nums w-8 text-right">{c.score}/100</span>
                  </div>
                  <p className="text-[9px] text-zinc-600 mt-0.5">{c.formula}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Total Power Score summary */}
          <Card className="md:col-span-2 border-border/30 bg-zinc-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Total Power Score</div>
                    <div className="text-xs text-muted-foreground">Batting ({powerBreakdown.batting.total}) + Pitching ({powerBreakdown.pitching.total})</div>
                  </div>
                </div>
                <div className="text-3xl font-bold tabular-nums text-amber-400">{powerBreakdown.totalPower}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Batting</span>
                    <span>{powerBreakdown.batting.total}/100</span>
                  </div>
                  <Progress value={powerBreakdown.batting.total} className="h-2" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Pitching</span>
                    <span>{powerBreakdown.pitching.total}/100</span>
                  </div>
                  <Progress value={powerBreakdown.pitching.total} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Position Players */}
      <Card className="mb-6 border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            Position Players ({hitters.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                  <th className="text-left py-2 px-4">Player</th>
                  <th className="text-center py-2 px-2">Pos</th>
                  <th className="text-center py-2 px-2 hidden sm:table-cell">B/T</th>
                  <th className="text-center py-2 px-2">GP</th>
                  <th className="text-center py-2 px-2">AVG</th>
                  <th className="text-center py-2 px-2">HR</th>
                  <th className="text-center py-2 px-2">RBI</th>
                  <th className="text-center py-2 px-2 hidden sm:table-cell">OBP</th>
                  <th className="text-center py-2 px-2 hidden sm:table-cell">SLG</th>
                  <th className="text-center py-2 px-2 hidden sm:table-cell">OPS</th>
                  <th className="text-center py-2 px-2 hidden sm:table-cell">SB</th>
                </tr>
              </thead>
              <tbody>
                {hitters.map((p) => {
                  const h = p.stats?.Hitting;
                  const ab = parseInt(h?.AB || '0');
                  const hits = parseInt(h?.H || '0');
                  const avg = ab > 0 ? (hits / ab).toFixed(3) : '-';
                  return (
                    <tr key={p.playerID} className="border-b border-border/20 hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {p.headshot ? (
                            <img src={p.headshot} alt="" className="h-8 w-8 rounded-full object-cover bg-zinc-800" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                              {p.jerseyNum}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-foreground">{p.name}</span>
                            {p.injury?.description && (
                              <Badge className="ml-2 bg-red-500/15 text-red-400 border border-red-500/20 text-[9px] px-1 py-0">
                                IL
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-2 px-2 text-muted-foreground">{p.pos}</td>
                      <td className="text-center py-2 px-2 text-muted-foreground text-xs hidden sm:table-cell">{p.bat}/{p.throw}</td>
                      <td className="text-center py-2 px-2 tabular-nums">{p.stats?.gamesPlayed || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums font-medium">{avg}</td>
                      <td className="text-center py-2 px-2 tabular-nums">{h?.HR || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums">{h?.RBI || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums hidden sm:table-cell">{h?.OBP || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums hidden sm:table-cell">{h?.SLG || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums hidden sm:table-cell">{h?.OPS || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums hidden sm:table-cell">{h?.SB || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pitching Staff */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Pitching Staff ({pitchers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                  <th className="text-left py-2 px-4">Pitcher</th>
                  <th className="text-center py-2 px-2">Role</th>
                  <th className="text-center py-2 px-2">W</th>
                  <th className="text-center py-2 px-2">L</th>
                  <th className="text-center py-2 px-2">ERA</th>
                  <th className="text-center py-2 px-2">IP</th>
                  <th className="text-center py-2 px-2">SO</th>
                  <th className="text-center py-2 px-2">BB</th>
                  <th className="text-center py-2 px-2">WHIP</th>
                  <th className="text-center py-2 px-2">SV</th>
                </tr>
              </thead>
              <tbody>
                {pitchers.map((p) => {
                  const s = p.stats?.Pitching;
                  const isSP = p.stats?.gamesStarted && parseInt(p.stats.gamesStarted) > 0;
                  return (
                    <tr key={p.playerID} className="border-b border-border/20 hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {p.headshot ? (
                            <img src={p.headshot} alt="" className="h-8 w-8 rounded-full object-cover bg-zinc-800" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                              {p.jerseyNum}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-foreground">{p.name}</span>
                            {p.injury?.description && (
                              <Badge className="ml-2 bg-red-500/15 text-red-400 border border-red-500/20 text-[9px] px-1 py-0">
                                IL
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-2 px-2">
                        <Badge className={isSP ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20 text-[10px]' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]'}>
                          {isSP ? 'SP' : 'RP'}
                        </Badge>
                      </td>
                      <td className="text-center py-2 px-2 tabular-nums">{s?.Win || '0'}</td>
                      <td className="text-center py-2 px-2 tabular-nums">{s?.Loss || '0'}</td>
                      <td className="text-center py-2 px-2 tabular-nums font-medium">{s?.ERA || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums">{s?.InningsPitched || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums">{s?.SO || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums">{s?.BB || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums">{s?.WHIP || '-'}</td>
                      <td className="text-center py-2 px-2 tabular-nums">{s?.Save || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
