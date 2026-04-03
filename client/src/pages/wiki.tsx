import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calculator, MapPin, TrendingUp, Activity, Trophy, BarChart3 } from "lucide-react";
import { Link } from "wouter";

// Import park factors data
const PARK_FACTORS: Array<{ code: string; factor: number; label: string; venue: string }> = [
  { code: 'COL', factor: 1.20, label: 'Hitter-Friendly', venue: 'Coors Field' },
  { code: 'CHC', factor: 1.08, label: 'Hitter-Friendly', venue: 'Wrigley Field' },
  { code: 'CIN', factor: 1.07, label: 'Hitter-Friendly', venue: 'Great American Ball Park' },
  { code: 'BOS', factor: 1.06, label: 'Hitter-Friendly', venue: 'Fenway Park' },
  { code: 'PHI', factor: 1.04, label: 'Hitter-Friendly', venue: 'Citizens Bank Park' },
  { code: 'BAL', factor: 1.02, label: 'Neutral', venue: 'Oriole Park' },
  { code: 'NYY', factor: 1.02, label: 'Neutral', venue: 'Yankee Stadium' },
  { code: 'TOR', factor: 1.02, label: 'Neutral', venue: 'Rogers Centre' },
  { code: 'NYM', factor: 1.00, label: 'Neutral', venue: 'Citi Field' },
  { code: 'TEX', factor: 0.99, label: 'Neutral', venue: 'Globe Life Field' },
  { code: 'WSH', factor: 0.99, label: 'Neutral', venue: 'Nationals Park' },
  { code: 'ARI', factor: 0.98, label: 'Neutral', venue: 'Chase Field' },
  { code: 'DET', factor: 0.98, label: 'Neutral', venue: 'Comerica Park' },
  { code: 'KC',  factor: 0.98, label: 'Neutral', venue: 'Kauffman Stadium' },
  { code: 'MIL', factor: 0.98, label: 'Neutral', venue: 'American Family Field' },
  { code: 'PIT', factor: 0.98, label: 'Neutral', venue: 'PNC Park' },
  { code: 'ATL', factor: 0.97, label: 'Neutral', venue: 'Truist Park' },
  { code: 'LAA', factor: 0.97, label: 'Neutral', venue: 'Angel Stadium' },
  { code: 'MIN', factor: 0.97, label: 'Neutral', venue: 'Target Field' },
  { code: 'STL', factor: 0.97, label: 'Neutral', venue: 'Busch Stadium' },
  { code: 'TB',  factor: 0.97, label: 'Neutral', venue: 'Tropicana Field' },
  { code: 'CHW', factor: 0.96, label: 'Pitcher-Friendly', venue: 'Guaranteed Rate Field' },
  { code: 'CLE', factor: 0.95, label: 'Pitcher-Friendly', venue: 'Progressive Field' },
  { code: 'HOU', factor: 0.95, label: 'Pitcher-Friendly', venue: 'Minute Maid Park' },
  { code: 'LAD', factor: 0.94, label: 'Pitcher-Friendly', venue: 'Dodger Stadium' },
  { code: 'OAK', factor: 0.94, label: 'Pitcher-Friendly', venue: 'Oakland Coliseum' },
  { code: 'MIA', factor: 0.93, label: 'Pitcher-Friendly', venue: 'loanDepot Park' },
  { code: 'SD',  factor: 0.93, label: 'Pitcher-Friendly', venue: 'Petco Park' },
  { code: 'SEA', factor: 0.92, label: 'Pitcher-Friendly', venue: 'T-Mobile Park' },
  { code: 'SF',  factor: 0.89, label: 'Pitcher-Friendly', venue: 'Oracle Park' },
];

function teamLogo(code: string) {
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${code.toLowerCase()}.png`;
}

function factorColor(f: number) {
  if (f >= 1.05) return 'text-orange-400';
  if (f >= 1.01) return 'text-amber-400';
  if (f >= 0.96) return 'text-zinc-400';
  return 'text-sky-400';
}

function factorBg(f: number) {
  if (f >= 1.05) return 'bg-orange-500/10 border-orange-500/20';
  if (f >= 1.01) return 'bg-amber-500/10 border-amber-500/20';
  if (f >= 0.96) return 'bg-zinc-500/10 border-zinc-700';
  return 'bg-sky-500/10 border-sky-500/20';
}

export default function Wiki() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight">
          <BookOpen className="h-7 w-7 text-emerald-400" />
          ClearEdge Sports Wiki
        </h1>
        <p className="text-muted-foreground mt-2">How we score teams, players, and parks. Full methodology, open book.</p>
      </div>

      {/* Table of contents */}
      <Card className="mb-8 border-border/30">
        <CardContent className="p-4">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Contents</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <a href="#team-power" className="text-emerald-400 hover:text-emerald-300">Team Power Scores</a>
            <a href="#batting" className="text-blue-400 hover:text-blue-300">Batting Score</a>
            <a href="#pitching" className="text-emerald-400 hover:text-emerald-300">Pitching Score</a>
            <a href="#hitter-power" className="text-amber-400 hover:text-amber-300">Hitter Power Score</a>
            <a href="#pitcher-power" className="text-purple-400 hover:text-purple-300">Pitcher Power Score</a>
            <a href="#park-factors" className="text-sky-400 hover:text-sky-300">Park Factors</a>
          </div>
        </CardContent>
      </Card>

      {/* ── Team Power Score ── */}
      <section id="team-power" className="mb-12">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-amber-400" />
          Team Power Score
        </h2>
        <div className="prose-sm space-y-3 text-zinc-400 leading-relaxed">
          <p>Every MLB team gets a <strong className="text-foreground">Team Power Score</strong> from 0-200, combining a <span className="text-blue-400">Batting Score</span> (0-100) and a <span className="text-emerald-400">Pitching Score</span> (0-100). Teams are ranked 1-30 with percentile ratings.</p>
          <p>Data source: Baseball Reference season team stats, refreshed daily.</p>
        </div>
      </section>

      {/* ── Batting Score ── */}
      <section id="batting" className="mb-12">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-blue-400" />
          Team Batting Score (0-100)
        </h2>
        <p className="text-sm text-zinc-400 mb-4">Weighted composite of five offensive metrics, each normalized to a 0-100 scale then weighted.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                <th className="text-left py-2 px-3">Component</th>
                <th className="text-center py-2 px-3">Weight</th>
                <th className="text-left py-2 px-3">Formula</th>
                <th className="text-left py-2 px-3">What "100" means</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">OPS</td><td className="text-center py-2.5 px-3"><Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 text-xs">40%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">OPS × 100</td><td className="py-2.5 px-3 text-xs">1.000+ OPS</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">Runs/Game</td><td className="text-center py-2.5 px-3"><Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 text-xs">25%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">R/G × 15</td><td className="py-2.5 px-3 text-xs">6.7+ R/G</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">HR Rate</td><td className="text-center py-2.5 px-3"><Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 text-xs">15%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(HR/G) × 500</td><td className="py-2.5 px-3 text-xs">0.2+ HR per game</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">Batting Avg</td><td className="text-center py-2.5 px-3"><Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 text-xs">10%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">BA × 400</td><td className="py-2.5 px-3 text-xs">.250+ BA</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">Walk Rate</td><td className="text-center py-2.5 px-3"><Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/20 text-xs">10%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(BB/G) × 25</td><td className="py-2.5 px-3 text-xs">4+ BB per game</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-600 mt-3">OPS is weighted heaviest because it combines on-base ability and slugging into a single metric that correlates most strongly with run production.</p>
      </section>

      {/* ── Pitching Score ── */}
      <section id="pitching" className="mb-12">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          Team Pitching Score (0-100)
        </h2>
        <p className="text-sm text-zinc-400 mb-4">Inverse-weighted pitching metrics. Lower ERA/WHIP = higher score.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                <th className="text-left py-2 px-3">Component</th>
                <th className="text-center py-2 px-3">Weight</th>
                <th className="text-left py-2 px-3">Formula</th>
                <th className="text-left py-2 px-3">What "100" means</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">ERA</td><td className="text-center py-2.5 px-3"><Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">35%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(6.0 − ERA) × 25</td><td className="py-2.5 px-3 text-xs">2.00 ERA</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">WHIP</td><td className="text-center py-2.5 px-3"><Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">25%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(2.0 − WHIP) × 80</td><td className="py-2.5 px-3 text-xs">0.75 WHIP</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">K/9</td><td className="text-center py-2.5 px-3"><Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">20%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">K/9 × 10</td><td className="py-2.5 px-3 text-xs">10+ K/9</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">Save Rate</td><td className="text-center py-2.5 px-3"><Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">10%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(SV/G) × 200</td><td className="py-2.5 px-3 text-xs">0.5 SV per game</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">CG Rate</td><td className="text-center py-2.5 px-3"><Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">10%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(CG/G) × 1000</td><td className="py-2.5 px-3 text-xs">0.1 CG per game</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Hitter Power Score ── */}
      <section id="hitter-power" className="mb-12">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-400" />
          Individual Hitter Power Score
        </h2>
        <p className="text-sm text-zinc-400 mb-4">Used on the <Link href="/player-rankings" className="text-emerald-400 hover:underline">Player Rankings</Link> page. Composite of rate stats, not counting stats — a player with 3 HR in 10 AB scores higher than one with 5 HR in 100 AB. SLG is weighted separately from OPS to reward pure power hitters.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                <th className="text-left py-2 px-3">Component</th>
                <th className="text-center py-2 px-3">Weight</th>
                <th className="text-left py-2 px-3">Formula</th>
                <th className="text-left py-2 px-3">What "100" means</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">OPS</td><td className="text-center"><Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs">30%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">OPS × 100</td><td className="py-2.5 px-3 text-xs">1.000+ OPS</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">HR Rate</td><td className="text-center"><Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs">20%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(HR / AB) × 1000</td><td className="py-2.5 px-3 text-xs">1 HR per 10 AB</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">SLG</td><td className="text-center"><Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/20 text-xs">15%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">SLG × 150</td><td className="py-2.5 px-3 text-xs">.667+ SLG</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">Walk Rate</td><td className="text-center"><Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs">15%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(BB / AB) × 500</td><td className="py-2.5 px-3 text-xs">1 BB per 5 AB</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">RBI Rate</td><td className="text-center"><Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs">10%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(RBI / AB) × 500</td><td className="py-2.5 px-3 text-xs">1 RBI per 5 AB</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">K Rate (penalty)</td><td className="text-center"><Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-xs">10%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">100 − (SO / AB) × 300</td><td className="py-2.5 px-3 text-xs">Never striking out</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-600 mt-3">SLG is separated from OPS because OPS weights on-base and slugging equally. Breaking SLG out at 15% lets us reward extra-base power independently — a .250 hitter with .550 SLG gets proper credit for power that would be diluted in OPS alone.</p>
      </section>

      {/* ── Pitcher Power Score ── */}
      <section id="pitcher-power" className="mb-12">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-purple-400" />
          Individual Pitcher Power Score
        </h2>
        <p className="text-sm text-zinc-400 mb-4">Same page, pitcher tab. Starters and relievers share the formula but are displayed in separate leaderboards. Pitchers with 0 innings pitched are excluded.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                <th className="text-left py-2 px-3">Component</th>
                <th className="text-center py-2 px-3">Weight</th>
                <th className="text-left py-2 px-3">Formula</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">ERA (inverse)</td><td className="text-center"><Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 text-xs">35%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(6.0 − ERA) × 25</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">WHIP (inverse)</td><td className="text-center"><Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 text-xs">25%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(2.0 − WHIP) × 80</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">K Rate (K/9)</td><td className="text-center"><Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 text-xs">20%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">(SO / IP) × 9 × 10</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">Wins</td><td className="text-center"><Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 text-xs">10%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">W × 20</td></tr>
              <tr className="border-b border-border/10"><td className="py-2.5 px-3 font-medium text-foreground">Saves</td><td className="text-center"><Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 text-xs">10%</Badge></td><td className="py-2.5 px-3 font-mono text-xs">SV × 25</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Park Factors ── */}
      <section id="park-factors" className="mb-12">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-sky-400" />
          Ballpark Run Factors
        </h2>
        <div className="space-y-3 text-sm text-zinc-400 mb-6">
          <p>Park Factor (PF) measures how a stadium influences run scoring relative to league average. A factor of <strong className="text-foreground">1.00</strong> is perfectly neutral.</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><span className="text-orange-400 font-medium">&gt; 1.05</span> — Hitter-friendly. Expect more runs. Totals trend over.</li>
            <li><span className="text-amber-400 font-medium">1.01 – 1.05</span> — Slight hitter lean.</li>
            <li><span className="text-zinc-400 font-medium">0.96 – 1.00</span> — Neutral.</li>
            <li><span className="text-sky-400 font-medium">&lt; 0.96</span> — Pitcher-friendly. Fewer runs. Totals trend under.</li>
          </ul>
          <p>Based on multi-year Baseball Reference park factor data (2024 season weights).</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
                <th className="text-left py-2 px-3">Stadium</th>
                <th className="text-center py-2 px-3">Team</th>
                <th className="text-center py-2 px-3">Factor</th>
                <th className="text-center py-2 px-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {PARK_FACTORS.map(pf => (
                <tr key={pf.code} className="border-b border-border/10 hover:bg-zinc-800/20">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <img src={teamLogo(pf.code)} alt="" className="h-5 w-5" />
                      <span className="text-foreground font-medium">{pf.venue}</span>
                    </div>
                  </td>
                  <td className="text-center py-2 px-3">
                    <Link href={`/team/${pf.code}`} className="text-emerald-400 hover:underline text-xs">{pf.code}</Link>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className={`font-bold tabular-nums ${factorColor(pf.factor)}`}>{pf.factor.toFixed(2)}</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <Badge className={`border text-[10px] ${factorBg(pf.factor)}`}>{pf.label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-zinc-900/30 border border-border/30 rounded-lg">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notable</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-400">
            <div>
              <span className="text-orange-400 font-medium">Coors Field (1.20)</span> — The mile-high air thins breaking balls and carries fly balls. The most extreme park factor in baseball by a wide margin.
            </div>
            <div>
              <span className="text-sky-400 font-medium">Oracle Park (0.89)</span> — Cold Bay winds and deep dimensions make it the toughest place to hit in the majors.
            </div>
            <div>
              <span className="text-emerald-400 font-medium">Globe Life Field (0.99)</span> — The retractable roof neutralized what used to be a hitter's paradise in Arlington.
            </div>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div className="text-center text-xs text-zinc-600 py-8 border-t border-border/30">
        All scoring formulas are open source. Built by ClearEdge Sports. For entertainment purposes only.
      </div>
    </div>
  );
}
