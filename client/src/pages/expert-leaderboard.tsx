import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";
import { Link } from "wouter";

interface ExpertWithRecord {
  id: string;
  name: string;
  title: string;
  avatar: string;
  style: string;
  riskLevel: string;
  record: { wins: number; losses: number; pushes: number; pending: number };
  winRate: number;
}

export default function ExpertLeaderboard() {
  const { data: experts = [] } = useQuery<ExpertWithRecord[]>({
    queryKey: ['/api/experts'],
    queryFn: () => fetch('/api/experts').then(r => r.json()),
  });

  // Sort by win rate, then wins
  const ranked = [...experts]
    .map(e => {
      const total = e.record.wins + e.record.losses;
      const units = e.record.wins * 1.0 - e.record.losses * 1.0; // simplified unit P&L
      const roi = total > 0 ? Math.round((units / total) * 100) : 0;
      return { ...e, total, units, roi };
    })
    .sort((a, b) => b.winRate - a.winRate || b.record.wins - a.record.wins);

  const leader = ranked[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-amber-400" />
          Expert Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI analysts ranked by performance</p>
      </div>

      {/* Podium — top 3 */}
      {ranked.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-8">
          {/* 2nd */}
          <div className="text-center w-28">
            <div className="text-3xl mb-1">{ranked[1].avatar}</div>
            <div className="text-xs font-medium text-foreground">{ranked[1].name}</div>
            <div className="text-lg font-bold tabular-nums text-zinc-400">{ranked[1].winRate}%</div>
            <div className="h-20 bg-zinc-800 rounded-t-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-zinc-500">2</span>
            </div>
          </div>
          {/* 1st */}
          <div className="text-center w-32">
            <div className="text-4xl mb-1">{ranked[0].avatar}</div>
            <div className="text-sm font-bold text-amber-400">{ranked[0].name}</div>
            <div className="text-xl font-bold tabular-nums text-amber-400">{ranked[0].winRate}%</div>
            <div className="h-28 bg-amber-500/15 border border-amber-500/20 rounded-t-lg flex items-center justify-center">
              <span className="text-3xl font-bold text-amber-400">1</span>
            </div>
          </div>
          {/* 3rd */}
          <div className="text-center w-28">
            <div className="text-3xl mb-1">{ranked[2].avatar}</div>
            <div className="text-xs font-medium text-foreground">{ranked[2].name}</div>
            <div className="text-lg font-bold tabular-nums text-zinc-400">{ranked[2].winRate}%</div>
            <div className="h-16 bg-zinc-800 rounded-t-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-zinc-500">3</span>
            </div>
          </div>
        </div>
      )}

      {/* Full table */}
      <Card className="border-border/30">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                <th className="text-left py-3 px-4">#</th>
                <th className="text-left py-3 px-3">Expert</th>
                <th className="text-center py-3 px-2">W-L-P</th>
                <th className="text-center py-3 px-2">Win%</th>
                <th className="text-center py-3 px-2">Units</th>
                <th className="text-center py-3 px-2">ROI</th>
                <th className="text-center py-3 px-2">Pending</th>
                <th className="text-center py-3 px-2 hidden sm:table-cell">Risk</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((e, i) => (
                <tr key={e.id} className="border-b border-border/10 hover:bg-zinc-800/20">
                  <td className="py-3 px-4 font-bold text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="py-3 px-3">
                    <Link href="/experts" className="flex items-center gap-2 group">
                      <span className="text-xl">{e.avatar}</span>
                      <div>
                        <div className="font-medium text-foreground group-hover:text-emerald-400 transition-colors">{e.name}</div>
                        <div className="text-[10px] text-muted-foreground">{e.title}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="text-center py-3 px-2 tabular-nums font-medium">
                    <span className="text-emerald-400">{e.record.wins}</span>
                    <span className="text-zinc-600">-</span>
                    <span className="text-red-400">{e.record.losses}</span>
                    {e.record.pushes > 0 && <><span className="text-zinc-600">-</span><span className="text-zinc-400">{e.record.pushes}</span></>}
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className={`font-bold tabular-nums ${e.winRate >= 55 ? 'text-emerald-400' : e.winRate >= 50 ? 'text-amber-400' : e.total > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                      {e.total > 0 ? `${e.winRate}%` : '—'}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className={`font-medium tabular-nums flex items-center justify-center gap-0.5 ${e.units > 0 ? 'text-emerald-400' : e.units < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                      {e.units > 0 && <TrendingUp className="h-3 w-3" />}
                      {e.units < 0 && <TrendingDown className="h-3 w-3" />}
                      {e.total > 0 ? `${e.units > 0 ? '+' : ''}${e.units.toFixed(1)}u` : '—'}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className={`tabular-nums ${e.roi > 0 ? 'text-emerald-400' : e.roi < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                      {e.total > 0 ? `${e.roi > 0 ? '+' : ''}${e.roi}%` : '—'}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">
                    {e.record.pending > 0 ? (
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px]">{e.record.pending}</Badge>
                    ) : <span className="text-zinc-600">0</span>}
                  </td>
                  <td className="text-center py-3 px-2 hidden sm:table-cell">
                    <Badge className={`border text-[10px] ${e.riskLevel === 'aggressive' ? 'bg-red-500/15 text-red-400 border-red-500/20' : e.riskLevel === 'moderate' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-blue-500/15 text-blue-400 border-blue-500/20'}`}>
                      {e.riskLevel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ranked.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No expert data yet. Generate picks first.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
