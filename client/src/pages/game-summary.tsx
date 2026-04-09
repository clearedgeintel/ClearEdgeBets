import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

function teamLogo(code: string) {
  const c = code.toUpperCase() === 'WAS' ? 'wsh' : code.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${c}.png`;
}

interface BoxScore {
  gameID: string;
  away: string;
  home: string;
  awayFull: string;
  homeFull: string;
  lineScore: {
    away?: { R?: string; H?: string; E?: string; [inning: string]: string | undefined };
    home?: { R?: string; H?: string; E?: string; [inning: string]: string | undefined };
  };
  venue: string;
  weather: string;
  attendance: string;
  decisions: Array<{ decision: string; name: string; team: string }>;
  awayHitters: Hitter[];
  homeHitters: Hitter[];
  awayPitchers: Pitcher[];
  homePitchers: Pitcher[];
}

interface Hitter {
  name: string; pos: string; ab: string; r: string; h: string; rbi: string; hr: string; bb: string; so: string; avg: string;
}

interface Pitcher {
  name: string; ip: string; h: string; r: string; er: string; bb: string; so: string; hr: string; pitchCount: string;
}

function HitterTable({ hitters, teamCode }: { hitters: Hitter[]; teamCode: string }) {
  if (!hitters.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-zinc-500 border-b border-border/20">
            <th className="text-left py-1.5 px-2 font-medium">
              <div className="flex items-center gap-1.5">
                <img src={teamLogo(teamCode)} alt="" className="h-3.5 w-3.5" />
                Batting
              </div>
            </th>
            <th className="text-center px-1.5 font-medium">AB</th>
            <th className="text-center px-1.5 font-medium">R</th>
            <th className="text-center px-1.5 font-medium">H</th>
            <th className="text-center px-1.5 font-medium">RBI</th>
            <th className="text-center px-1.5 font-medium">HR</th>
            <th className="text-center px-1.5 font-medium">BB</th>
            <th className="text-center px-1.5 font-medium">SO</th>
          </tr>
        </thead>
        <tbody>
          {hitters.map((h, i) => {
            const isKey = parseInt(h.hr) > 0 || parseInt(h.h) >= 3 || parseInt(h.rbi) >= 3;
            return (
              <tr key={i} className={`border-b border-border/10 ${isKey ? 'bg-emerald-500/5' : ''}`}>
                <td className="py-1.5 px-2">
                  <span className={`${isKey ? 'text-emerald-400 font-medium' : 'text-zinc-300'}`}>{h.name}</span>
                  <span className="text-zinc-600 ml-1 text-[10px]">{h.pos}</span>
                </td>
                <td className="text-center px-1.5 text-zinc-400 tabular-nums">{h.ab}</td>
                <td className="text-center px-1.5 text-zinc-400 tabular-nums">{h.r}</td>
                <td className={`text-center px-1.5 tabular-nums ${parseInt(h.h) > 0 ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>{h.h}</td>
                <td className={`text-center px-1.5 tabular-nums ${parseInt(h.rbi) > 0 ? 'text-zinc-200' : 'text-zinc-500'}`}>{h.rbi}</td>
                <td className={`text-center px-1.5 tabular-nums ${parseInt(h.hr) > 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>{h.hr}</td>
                <td className="text-center px-1.5 text-zinc-400 tabular-nums">{h.bb}</td>
                <td className="text-center px-1.5 text-zinc-500 tabular-nums">{h.so}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PitcherTable({ pitchers, teamCode }: { pitchers: Pitcher[]; teamCode: string }) {
  if (!pitchers.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-zinc-500 border-b border-border/20">
            <th className="text-left py-1.5 px-2 font-medium">
              <div className="flex items-center gap-1.5">
                <img src={teamLogo(teamCode)} alt="" className="h-3.5 w-3.5" />
                Pitching
              </div>
            </th>
            <th className="text-center px-1.5 font-medium">IP</th>
            <th className="text-center px-1.5 font-medium">H</th>
            <th className="text-center px-1.5 font-medium">R</th>
            <th className="text-center px-1.5 font-medium">ER</th>
            <th className="text-center px-1.5 font-medium">BB</th>
            <th className="text-center px-1.5 font-medium">SO</th>
            <th className="text-center px-1.5 font-medium hidden sm:table-cell">PC</th>
          </tr>
        </thead>
        <tbody>
          {pitchers.map((p, i) => (
            <tr key={i} className="border-b border-border/10">
              <td className="py-1.5 px-2 text-zinc-300">{p.name}</td>
              <td className="text-center px-1.5 text-zinc-400 tabular-nums">{p.ip}</td>
              <td className="text-center px-1.5 text-zinc-400 tabular-nums">{p.h}</td>
              <td className="text-center px-1.5 text-zinc-400 tabular-nums">{p.r}</td>
              <td className={`text-center px-1.5 tabular-nums ${parseInt(p.er) > 0 ? 'text-red-400' : 'text-zinc-400'}`}>{p.er}</td>
              <td className="text-center px-1.5 text-zinc-400 tabular-nums">{p.bb}</td>
              <td className={`text-center px-1.5 tabular-nums ${parseInt(p.so) >= 5 ? 'text-emerald-400 font-medium' : 'text-zinc-400'}`}>{p.so}</td>
              <td className="text-center px-1.5 text-zinc-500 tabular-nums hidden sm:table-cell">{p.pitchCount || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GameSummary() {
  const params = useParams<{ gameID: string }>();
  const gameID = params.gameID || '';

  const { data: box, isLoading, error } = useQuery<BoxScore>({
    queryKey: ['/api/boxscore', gameID],
    queryFn: () => fetch(`/api/boxscore/${gameID}`).then(r => {
      if (!r.ok) throw new Error('Failed to load box score');
      return r.json();
    }),
    enabled: !!gameID,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/"><span className="text-zinc-500 hover:text-zinc-300 cursor-pointer"><ArrowLeft className="h-4 w-4" /></span></Link>
          <span className="text-sm text-zinc-500">Loading box score...</span>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-zinc-800/50 rounded-lg" />
          <div className="h-64 bg-zinc-800/50 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !box) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/"><span className="text-zinc-500 hover:text-zinc-300 cursor-pointer"><ArrowLeft className="h-4 w-4" /></span></Link>
          <span className="text-sm text-red-400">Failed to load box score</span>
        </div>
      </div>
    );
  }

  const awayR = parseInt(box.lineScore?.away?.R || '0');
  const homeR = parseInt(box.lineScore?.home?.R || '0');
  const awayWon = awayR > homeR;

  // Extract inning numbers from line score
  const innings: string[] = [];
  const awayLS = box.lineScore?.away || {};
  for (const key of Object.keys(awayLS)) {
    if (/^\d+$/.test(key)) innings.push(key);
  }
  innings.sort((a, b) => parseInt(a) - parseInt(b));

  const winPitcher = box.decisions.find(d => d.decision === 'W');
  const lossPitcher = box.decisions.find(d => d.decision === 'L');
  const savePitcher = box.decisions.find(d => d.decision === 'S');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back link */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/"><span className="text-zinc-500 hover:text-zinc-300 cursor-pointer"><ArrowLeft className="h-4 w-4" /></span></Link>
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Game Summary</span>
      </div>

      {/* Scoreboard */}
      <Card className="border-border/30 mb-4 overflow-hidden">
        <CardContent className="p-0">
          {/* Team scores */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <img src={teamLogo(box.away)} alt="" className="h-10 w-10 sm:h-12 sm:w-12" />
                <div>
                  <div className={`text-base sm:text-lg font-bold ${awayWon ? 'text-foreground' : 'text-zinc-500'}`}>{box.awayFull}</div>
                  <span className="text-[10px] text-zinc-600">{awayWon ? 'W' : 'L'}</span>
                </div>
              </div>
              <div className={`text-3xl sm:text-4xl font-bold tabular-nums ${awayWon ? 'text-foreground' : 'text-zinc-500'}`}>{awayR}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <img src={teamLogo(box.home)} alt="" className="h-10 w-10 sm:h-12 sm:w-12" />
                <div>
                  <div className={`text-base sm:text-lg font-bold ${!awayWon ? 'text-foreground' : 'text-zinc-500'}`}>{box.homeFull}</div>
                  <span className="text-[10px] text-zinc-600">{!awayWon ? 'W' : 'L'}</span>
                </div>
              </div>
              <div className={`text-3xl sm:text-4xl font-bold tabular-nums ${!awayWon ? 'text-foreground' : 'text-zinc-500'}`}>{homeR}</div>
            </div>
          </div>

          {/* Line score */}
          {innings.length > 0 && (
            <div className="border-t border-border/20 overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-zinc-600">
                    <th className="text-left py-1.5 px-3 font-medium w-16"></th>
                    {innings.map(i => (
                      <th key={i} className="text-center px-1.5 font-medium w-7">{i}</th>
                    ))}
                    <th className="text-center px-2 font-bold text-zinc-400">R</th>
                    <th className="text-center px-2 font-bold text-zinc-400">H</th>
                    <th className="text-center px-2 font-bold text-zinc-400">E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/10">
                    <td className="py-1.5 px-3 font-medium text-zinc-300">{box.away}</td>
                    {innings.map(i => (
                      <td key={i} className="text-center px-1.5 text-zinc-400 tabular-nums">{awayLS[i] || '0'}</td>
                    ))}
                    <td className={`text-center px-2 font-bold tabular-nums ${awayWon ? 'text-foreground' : 'text-zinc-400'}`}>{box.lineScore?.away?.R || '0'}</td>
                    <td className="text-center px-2 text-zinc-400 tabular-nums">{box.lineScore?.away?.H || '0'}</td>
                    <td className="text-center px-2 text-zinc-400 tabular-nums">{box.lineScore?.away?.E || '0'}</td>
                  </tr>
                  <tr className="border-t border-border/10">
                    <td className="py-1.5 px-3 font-medium text-zinc-300">{box.home}</td>
                    {innings.map(i => (
                      <td key={i} className="text-center px-1.5 text-zinc-400 tabular-nums">{(box.lineScore?.home || {} as any)[i] || '0'}</td>
                    ))}
                    <td className={`text-center px-2 font-bold tabular-nums ${!awayWon ? 'text-foreground' : 'text-zinc-400'}`}>{box.lineScore?.home?.R || '0'}</td>
                    <td className="text-center px-2 text-zinc-400 tabular-nums">{box.lineScore?.home?.H || '0'}</td>
                    <td className="text-center px-2 text-zinc-400 tabular-nums">{box.lineScore?.home?.E || '0'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Decisions + venue */}
          <div className="border-t border-border/20 px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
            {winPitcher && <span><span className="text-zinc-400 font-medium">W:</span> {winPitcher.name}</span>}
            {lossPitcher && <span><span className="text-zinc-400 font-medium">L:</span> {lossPitcher.name}</span>}
            {savePitcher && <span><span className="text-zinc-400 font-medium">S:</span> {savePitcher.name}</span>}
            {box.venue && <span className="hidden sm:inline">· {box.venue}</span>}
            {box.attendance && <span className="hidden sm:inline">· {box.attendance}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Box Score Tables */}
      <div className="space-y-3">
        <Card className="border-border/30">
          <CardContent className="p-0">
            <HitterTable hitters={box.awayHitters} teamCode={box.away} />
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-0">
            <PitcherTable pitchers={box.awayPitchers} teamCode={box.away} />
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-0">
            <HitterTable hitters={box.homeHitters} teamCode={box.home} />
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-0">
            <PitcherTable pitchers={box.homePitchers} teamCode={box.home} />
          </CardContent>
        </Card>
      </div>

      {/* Weather info */}
      {box.weather && (
        <div className="mt-4 text-[11px] text-zinc-600 text-center">
          {box.weather}
        </div>
      )}
    </div>
  );
}
