import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trophy, Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface RankedPlayer {
  rank: number;
  playerID: string;
  name: string;
  pos: string;
  team: string;
  teamLogo: string;
  headshot?: string;
  jerseyNum: string;
  gp: string;
  gs?: string;
  powerScore: number;
  powerBreakdown?: Array<{ label: string; raw: string; score: number; weight: number; pts: number }>;
  injury?: { description: string } | null;
  // Hitter fields
  avg?: string; hr?: number; rbi?: number; runs?: number; bb?: number; so?: number; ops?: string; ab?: number; hits?: number;
  // Pitcher fields
  era?: string; whip?: string; ip?: string; wins?: number; losses?: number; saves?: number;
}

type SortKey = 'powerScore' | 'avg' | 'hr' | 'rbi' | 'ops' | 'so' | 'era' | 'whip' | 'wins' | 'saves';

export default function PlayerRankings() {
  const [type, setType] = useState<'hitters' | 'starters' | 'relievers'>('hitters');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('powerScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const apiType = type === 'hitters' ? 'hitters' : 'pitchers';
  const { data: allPlayers = [], isLoading } = useQuery<RankedPlayer[]>({
    queryKey: ['/api/player-rankings', apiType],
    queryFn: () => fetch(`/api/player-rankings?type=${apiType}`).then(r => r.json()),
    staleTime: 300000,
  });

  // Filter starters vs relievers based on games started
  const players = type === 'starters'
    ? allPlayers.filter(p => parseInt(p.gs || '0') > 0)
    : type === 'relievers'
    ? allPlayers.filter(p => parseInt(p.gs || '0') === 0)
    : allPlayers;

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir(key === 'era' || key === 'whip' ? 'asc' : 'desc'); }
  };

  const filtered = players
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = parseFloat(String((a as any)[sortBy] || 0));
      const bv = parseFloat(String((b as any)[sortBy] || 0));
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const SortHeader = ({ label, field, className = '' }: { label: string; field: SortKey; className?: string }) => (
    <th className={`py-2 px-2 cursor-pointer select-none hover:text-foreground transition-colors ${className}`} onClick={() => toggleSort(field)}>
      <div className="flex items-center justify-center gap-0.5">
        <span>{label}</span>
        {sortBy === field ? (sortDir === 'desc' ? <ChevronDown className="h-3 w-3 text-emerald-400" /> : <ChevronUp className="h-3 w-3 text-emerald-400" />) : <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />}
      </div>
    </th>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            Player Power Rankings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Sortable leaderboards powered by composite scoring</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant={type === 'hitters' ? 'default' : 'outline'} onClick={() => { setType('hitters'); setSortBy('powerScore'); }} className={type === 'hitters' ? 'bg-emerald-600' : ''}>
            Hitters
          </Button>
          <Button size="sm" variant={type === 'starters' ? 'default' : 'outline'} onClick={() => { setType('starters'); setSortBy('powerScore'); }} className={type === 'starters' ? 'bg-blue-600' : ''}>
            Starters
          </Button>
          <Button size="sm" variant={type === 'relievers' ? 'default' : 'outline'} onClick={() => { setType('relievers'); setSortBy('powerScore'); }} className={type === 'relievers' ? 'bg-amber-600' : ''}>
            Relievers
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search player or team..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-zinc-900/50 border-border/50 text-sm h-9" />
      </div>

      {/* Scoring formula */}
      <div className="text-[10px] text-zinc-600 mb-4">
        {type === 'hitters'
          ? 'Power Score = OPS (30%) + HR Rate (20%) + SLG (15%) + Walk Rate (15%) + RBI Rate (10%) + K Rate Penalty (10%)'
          : type === 'starters'
          ? 'Power Score = ERA inv (35%) + WHIP inv (25%) + K Rate (20%) + Wins (10%) + Saves (10%) · Filtered to pitchers with starts'
          : 'Power Score = ERA inv (35%) + WHIP inv (25%) + K Rate (20%) + Wins (10%) + Saves (10%) · Filtered to relief only'}
      </div>

      <Card className="border-border/30">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading player data across 30 rosters...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    <th className="text-left py-2 px-3 w-8">#</th>
                    <th className="text-left py-2 px-3">Player</th>
                    <SortHeader label="PWR" field="powerScore" />
                    <th className="text-center py-2 px-2">GP</th>
                    {type === 'hitters' ? (
                      <>
                        <SortHeader label="AVG" field="avg" />
                        <SortHeader label="HR" field="hr" />
                        <SortHeader label="RBI" field="rbi" />
                        <SortHeader label="OPS" field="ops" />
                        <SortHeader label="BB" field="so" className="hidden sm:table-cell" />
                        <SortHeader label="SO" field="so" className="hidden sm:table-cell" />
                      </>
                    ) : (
                      <>
                        <SortHeader label="ERA" field="era" />
                        <SortHeader label="WHIP" field="whip" />
                        <SortHeader label="W" field="wins" />
                        <SortHeader label="SO" field="so" />
                        <SortHeader label="SV" field="saves" className="hidden sm:table-cell" />
                        <th className="text-center py-2 px-2 hidden sm:table-cell">IP</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.playerID} className="border-b border-border/10 hover:bg-zinc-800/30">
                      <td className="py-2 px-3 text-muted-foreground tabular-nums text-xs">{i + 1}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {p.headshot ? (
                            <img src={p.headshot} alt="" className="h-7 w-7 rounded-full object-cover bg-zinc-800 flex-shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 flex-shrink-0">{p.jerseyNum}</div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground text-xs truncate">{p.name}</span>
                              {p.injury?.description && <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[8px] px-1 py-0">IL</Badge>}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <img src={p.teamLogo} alt="" className="h-3 w-3" />
                              <span>{p.team}</span>
                              <span>·</span>
                              <span>{p.pos}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-2 px-2">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className={`tabular-nums text-xs font-bold cursor-help ${p.powerScore >= 70 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : p.powerScore >= 40 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                                {p.powerScore}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-zinc-900 border-border/50 p-3 w-56">
                              <div className="text-xs">
                                <div className="font-semibold text-foreground mb-2">{p.name} — PWR {p.powerScore}</div>
                                {p.powerBreakdown?.map(b => (
                                  <div key={b.label} className="flex items-center justify-between py-0.5">
                                    <span className="text-muted-foreground">{b.label} <span className="text-zinc-600">({b.raw})</span></span>
                                    <span className="tabular-nums">
                                      <span className="text-zinc-500">{b.score}</span>
                                      <span className="text-zinc-700 mx-0.5">×</span>
                                      <span className="text-zinc-500">{b.weight}%</span>
                                      <span className="text-zinc-700 mx-0.5">=</span>
                                      <span className="text-foreground font-medium">{b.pts}</span>
                                    </span>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-border/30 font-semibold">
                                  <span className="text-muted-foreground">Total</span>
                                  <span className="text-emerald-400">{p.powerScore}</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="text-center py-2 px-2 tabular-nums text-muted-foreground text-xs">{p.gp}</td>
                      {type === 'hitters' ? (
                        <>
                          <td className="text-center py-2 px-2 tabular-nums text-xs font-medium">{p.avg}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs">{p.hr}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs">{p.rbi}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs font-medium">{p.ops}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs text-muted-foreground hidden sm:table-cell">{p.bb}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs text-muted-foreground hidden sm:table-cell">{p.so}</td>
                        </>
                      ) : (
                        <>
                          <td className="text-center py-2 px-2 tabular-nums text-xs font-medium">{p.era}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs">{p.whip}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs">{p.wins}-{p.losses}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs">{p.so}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs hidden sm:table-cell">{p.saves}</td>
                          <td className="text-center py-2 px-2 tabular-nums text-xs text-muted-foreground hidden sm:table-cell">{p.ip}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && !isLoading && (
                <div className="p-8 text-center text-muted-foreground text-sm">No players found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
