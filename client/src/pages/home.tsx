import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pen, History, Target, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "wouter";
import { format, subDays } from "date-fns";

function teamLogo(code: string) {
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${code.toLowerCase()}.png`;
}

const EXPERT_AVATARS: Record<string, string> = { contrarian: '🕵️‍♂️', quant: '🧑‍💻', sharp: '🎯', homie: '😄', closer: '⏰' };

interface ScoreGame { gameID: string; away: string; home: string; lineScore?: { away?: { R?: string }; home?: { R?: string } }; }
interface BlogReview { id: number; title: string; content: string; author: string; authorMood?: string; heroImage?: string; awayTeam: string; homeTeam: string; awayScore: number; homeScore: number; awayLogo?: string; homeLogo?: string; }
interface TodayGame { gameId: string; awayTeam: string; homeTeam: string; awayTeamCode: string; homeTeamCode: string; gameTime: string; awayPitcher?: string; homePitcher?: string; odds: Array<{ market: string; awayOdds?: number; homeOdds?: number; total?: string }>; }

export default function Home() {
  useAuth();
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const today = new Date().toISOString().split('T')[0];

  const { data: todayGames = [] } = useQuery<TodayGame[]>({ queryKey: ["/api/games"], refetchInterval: 60000 });
  const { data: yesterdayScores } = useQuery<Record<string, ScoreGame>>({ queryKey: ["/api/scores/yesterday", yesterday], queryFn: () => fetch(`/api/scores/yesterday?date=${yesterday}`).then(r => r.ok ? r.json() : {}), staleTime: 300000 });
  const { data: blogReviews = [] } = useQuery<BlogReview[]>({ queryKey: ['/api/blog/reviews'], queryFn: () => fetch('/api/blog/reviews').then(r => r.json()) });
  const { data: dailyContent } = useQuery<{ history: { year: number; event: string } | null; picks: Array<{ pick: string; rationale: string }> }>({ queryKey: ['/api/homepage/daily-content'], queryFn: () => fetch('/api/homepage/daily-content').then(r => r.json()), staleTime: 3600000 });
  const { data: expertPicks = [] } = useQuery<any[]>({ queryKey: ['/api/expert-picks', today], queryFn: () => fetch(`/api/expert-picks?date=${today}`).then(r => r.json()), staleTime: 300000 });

  const featured = blogReviews[0];
  const moreReviews = blogReviews.slice(1, 4);
  const yesterdayGamesList = Object.values(yesterdayScores || {});

  // Merge AI picks + expert picks into "Today's Edge"
  const edgePicks = [
    ...expertPicks.slice(0, 4).map((p: any) => ({ source: EXPERT_AVATARS[p.expertId] || '🎯', label: p.expertId, pick: p.selection, rationale: p.rationale, confidence: p.confidence })),
    ...(dailyContent?.picks || []).slice(0, 2).map((p) => ({ source: '🤖', label: 'AI', pick: p.pick, rationale: p.rationale, confidence: null as number | null })),
  ].slice(0, 6);

  return (
    <div>
      {/* ── Yesterday's Scores Ticker ── */}
      {yesterdayGamesList.length > 0 && (
        <div className="border-b border-border/30 bg-zinc-950/50 overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <span className="text-zinc-600 flex-shrink-0 font-medium uppercase tracking-wider text-[9px]">Final</span>
            {yesterdayGamesList.map((game) => {
              const away = game.away || game.gameID?.split('_')[1]?.split('@')[0] || '';
              const home = game.home || game.gameID?.split('@')[1] || '';
              return (
                <div key={game.gameID} className="flex items-center gap-1.5 flex-shrink-0 text-zinc-400">
                  <img src={teamLogo(away)} alt="" className="h-3.5 w-3.5" />
                  <span className="tabular-nums font-medium text-zinc-300">{game.lineScore?.away?.R || '0'}</span>
                  <span className="text-zinc-600">-</span>
                  <span className="tabular-nums font-medium text-zinc-300">{game.lineScore?.home?.R || '0'}</span>
                  <img src={teamLogo(home)} alt="" className="h-3.5 w-3.5" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Morning Roast Full-Bleed Hero ── */}
      {featured && (
        <Link href="/blog">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-zinc-900 cursor-pointer group">
            {featured.heroImage ? (
              <img src={featured.heroImage} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <div className="flex items-center gap-6">
                  {featured.awayLogo && <img src={featured.awayLogo} alt="" className="h-20 w-20 opacity-40" />}
                  <span className="text-4xl font-bold text-zinc-600 tabular-nums">{featured.awayScore} - {featured.homeScore}</span>
                  {featured.homeLogo && <img src={featured.homeLogo} alt="" className="h-20 w-20 opacity-40" />}
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
              <div className="max-w-4xl">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider">Morning Roast</Badge>
                  <span className="text-white/50 text-xs">{featured.awayTeam.split(' ').pop()} {featured.awayScore} - {featured.homeScore} {featured.homeTeam.split(' ').pop()}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-2 group-hover:text-amber-100 transition-colors">
                  {featured.title}
                </h1>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Pen className="h-3 w-3 text-amber-400" />
                  <span>{featured.author}</span>
                  {featured.authorMood === 'grumpy' && <span className="text-red-400 text-xs">(grumpy)</span>}
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      <div className="max-w-5xl mx-auto px-4">
        {/* ── More Stories ── */}
        {moreReviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-6 border-b border-border/20">
            {moreReviews.map((review) => (
              <Link key={review.id} href="/blog">
                <div className="flex gap-3 group cursor-pointer">
                  <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-zinc-900">
                    {review.heroImage ? (
                      <img src={review.heroImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        {review.awayLogo && <img src={review.awayLogo} alt="" className="h-5 w-5 opacity-40" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">{review.title}</h4>
                    <span className="text-[10px] text-zinc-500">{review.author}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Today's Edge (merged picks) ── */}
        {edgePicks.length > 0 && (
          <div className="py-6 border-b border-border/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                Today's Edge
              </h2>
              <Link href="/experts">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-emerald-400">
                  All Expert Picks <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {edgePicks.map((pick, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 bg-card border border-border/20 rounded-lg">
                  <span className="text-lg flex-shrink-0 mt-0.5">{pick.source}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{pick.pick}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{pick.rationale}</div>
                  </div>
                  {pick.confidence && (
                    <Badge className={`text-[9px] px-1 py-0 border flex-shrink-0 tabular-nums ${pick.confidence >= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{pick.confidence}%</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── This Day in Baseball ── */}
        {dailyContent?.history && (
          <div className="py-6 border-b border-border/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-xs">{dailyContent.history.year}</span>
              </div>
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-1">
                  <History className="h-3 w-3 text-amber-400" />
                  This Day in Baseball
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{dailyContent.history.event}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Today's Schedule Rail ── */}
        {todayGames.length > 0 && (
          <div className="py-6 border-b border-border/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Today · {todayGames.length} games</h2>
              <Link href="/todays-games">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-emerald-400 h-6 px-2">
                  Full Schedule <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {todayGames.map((game) => (
                <Link key={game.gameId} href="/todays-games">
                  <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-card border border-border/20 rounded-full hover:border-emerald-500/20 transition-colors cursor-pointer text-xs">
                    <img src={teamLogo(game.awayTeamCode)} alt="" className="h-4 w-4" />
                    <span className="font-medium text-foreground">{game.awayTeamCode}</span>
                    <span className="text-zinc-600">@</span>
                    <span className="font-medium text-foreground">{game.homeTeamCode}</span>
                    <img src={teamLogo(game.homeTeamCode)} alt="" className="h-4 w-4" />
                    <span className="text-zinc-600 text-[10px]">{game.gameTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-4 gap-2 py-6">
          {[
            { href: '/todays-games', emoji: '⚾', label: 'Games' },
            { href: '/experts', emoji: '🎯', label: 'Experts' },
            { href: '/team-power-scores', emoji: '📊', label: 'Rankings' },
            { href: '/trivia', emoji: '❓', label: 'Trivia' },
          ].map(link => (
            <Link key={link.href} href={link.href}>
              <div className="p-3 bg-card border border-border/20 rounded-lg text-center hover:border-emerald-500/20 transition-colors cursor-pointer">
                <span className="text-lg">{link.emoji}</span>
                <div className="text-[10px] font-medium text-muted-foreground mt-1">{link.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
