import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Newspaper, Pen, Calendar, Clock, Sparkles, History, Target } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "wouter";
import { format, subDays } from "date-fns";

function teamLogo(code: string) {
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${code.toLowerCase()}.png`;
}

interface ScoreGame {
  gameID: string;
  away: string;
  home: string;
  awayResult?: string;
  homeResult?: string;
  gameStatus?: string;
  gameStatusCode?: string;
  gameTime?: string;
  lineScore?: { away?: { R?: string }; home?: { R?: string } };
}

interface BlogReview {
  id: number;
  gameId: string;
  gameDate: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  title: string;
  content: string;
  slug: string;
  author: string;
  authorMood?: string;
  heroImage?: string;
  awayLogo?: string;
  homeLogo?: string;
  createdAt: string;
}

interface TodayGame {
  id: number;
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
  gameTime: string;
  venue: string;
  awayPitcher?: string;
  homePitcher?: string;
  status: string;
  odds: Array<{ market: string; awayOdds?: number; homeOdds?: number; total?: string }>;
}

export default function Home() {
  useAuth(); // ensure auth context is available
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Today's games
  const { data: todayGames = [] } = useQuery<TodayGame[]>({
    queryKey: ["/api/games"],
    refetchInterval: 60000,
  });

  // Yesterday's scores (public endpoint)
  const { data: yesterdayScores } = useQuery<Record<string, ScoreGame>>({
    queryKey: ["/api/scores/yesterday", yesterday],
    queryFn: () => fetch(`/api/scores/yesterday?date=${yesterday}`).then(r => r.ok ? r.json() : {}),
    staleTime: 300000,
  });

  // Morning Roast blog reviews
  const { data: blogReviews = [] } = useQuery<BlogReview[]>({
    queryKey: ['/api/blog/reviews'],
    queryFn: () => fetch('/api/blog/reviews', { credentials: 'include' }).then(r => r.json()),
  });

  // Daily content — This Day in History + Picks of the Day
  const { data: dailyContent } = useQuery<{
    date: string;
    monthDay: string;
    history: { year: number; event: string } | null;
    picks: Array<{ pick: string; rationale: string }>;
  }>({
    queryKey: ['/api/homepage/daily-content'],
    queryFn: () => fetch('/api/homepage/daily-content').then(r => r.json()),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Expert picks for today
  const today = new Date().toISOString().split('T')[0];
  const { data: expertPicks = [] } = useQuery<any[]>({
    queryKey: ['/api/expert-picks', today],
    queryFn: () => fetch(`/api/expert-picks?date=${today}`).then(r => r.json()),
    staleTime: 300000,
  });

  const featured = blogReviews[0];
  const moreReviews = blogReviews.slice(1, 4);
  const yesterdayGamesList = Object.values(yesterdayScores || {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* ── Hero ── */}
      <div className="text-center mb-8">
        <img src="/clearedge-logo-new.png" alt="ClearEdge Sports" className="h-14 w-auto mx-auto mb-3 opacity-90" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">ClearEdge Sports</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered sports intelligence</p>
      </div>

      {/* ── This Day in Baseball + Picks of the Day ── */}
      {dailyContent && (dailyContent.history || dailyContent.picks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* This Day in History */}
          {dailyContent.history && (
            <Card className="border-border/30 bg-card">
              <CardContent className="p-4">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-3">
                  <History className="h-3.5 w-3.5 text-amber-400" />
                  This Day in Baseball
                </h3>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-400 font-bold text-sm">{dailyContent.history.year}</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{dailyContent.history.event}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Picks of the Day */}
          {dailyContent.picks.length > 0 && (
            <Card className="border-border/30 bg-card">
              <CardContent className="p-4">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-3">
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                  Picks of the Day
                </h3>
                <div className="space-y-2.5">
                  {dailyContent.picks.map((pick, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-400 text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{pick.pick}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{pick.rationale}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Expert Picks Today ── */}
      {expertPicks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-purple-400" />
              Expert Picks Today
            </h2>
            <Link href="/experts">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-purple-400">
                All Experts <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {expertPicks.slice(0, 6).map((pick: any) => (
              <div key={pick.id} className="p-3 bg-card border border-border/30 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{pick.expertId === 'contrarian' ? '🕵️‍♂️' : pick.expertId === 'quant' ? '🧑‍💻' : pick.expertId === 'sharp' ? '🎯' : pick.expertId === 'homie' ? '😄' : '⏰'}</span>
                    <span className="text-xs font-medium text-foreground capitalize">{pick.expertId}</span>
                  </div>
                  <Badge className={`text-[9px] px-1 py-0 border tabular-nums ${pick.confidence >= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{pick.confidence}%</Badge>
                </div>
                <div className="text-sm font-medium text-foreground">{pick.selection}</div>
                <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{pick.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Yesterday's Scores ── */}
      {yesterdayGamesList.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Yesterday's Final Scores
            </h2>
            <span className="text-xs text-zinc-600">{yesterday}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {yesterdayGamesList.map((game) => {
              const awayScore = game.lineScore?.away?.R || '0';
              const homeScore = game.lineScore?.home?.R || '0';
              const away = game.away || game.gameID?.split('_')[1]?.split('@')[0] || '';
              const home = game.home || game.gameID?.split('@')[1] || '';
              return (
                <div key={game.gameID} className="flex-shrink-0 w-36 p-2.5 bg-card border border-border/30 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <img src={teamLogo(away)} alt="" className="h-4 w-4" />
                      <span className="text-xs font-medium text-foreground">{away}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground">{awayScore}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img src={teamLogo(home)} alt="" className="h-4 w-4" />
                      <span className="text-xs font-medium text-foreground">{home}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground">{homeScore}</span>
                  </div>
                  <div className="text-[9px] text-zinc-600 mt-1 text-center">Final</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Today's Schedule ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Today's Games ({todayGames.length})
          </h2>
          <Link href="/todays-games">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-emerald-400">
              Full Schedule <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
        {todayGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {todayGames.slice(0, 9).map((game) => {
              const ml = game.odds?.find(o => o.market === 'moneyline');
              const tot = game.odds?.find(o => o.market === 'totals');
              return (
                <Link key={game.gameId} href="/todays-games">
                  <div className="p-3 bg-card border border-border/30 rounded-lg hover:border-emerald-500/20 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img src={teamLogo(game.awayTeamCode)} alt="" className="h-5 w-5" />
                        <span className="text-xs font-medium text-foreground truncate">{game.awayTeamCode}</span>
                        {ml?.awayOdds && <span className="text-[10px] text-blue-400 tabular-nums">{ml.awayOdds > 0 ? '+' : ''}{ml.awayOdds}</span>}
                      </div>
                      <span className="text-[10px] text-zinc-600 mx-2">{game.gameTime}</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        {ml?.homeOdds && <span className="text-[10px] text-blue-400 tabular-nums">{ml.homeOdds > 0 ? '+' : ''}{ml.homeOdds}</span>}
                        <span className="text-xs font-medium text-foreground truncate">{game.homeTeamCode}</span>
                        <img src={teamLogo(game.homeTeamCode)} alt="" className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-600">
                      <span className="truncate">{game.awayPitcher || 'TBD'} vs {game.homePitcher || 'TBD'}</span>
                      {tot?.total && <span className="text-amber-400/70 ml-1">O/U {tot.total}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/30">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No games scheduled for today. Check back later.
            </CardContent>
          </Card>
        )}
        {todayGames.length > 9 && (
          <Link href="/todays-games">
            <div className="text-center mt-2">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                +{todayGames.length - 9} more games <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </Link>
        )}
      </div>

      {/* ── The Morning Roast ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-amber-400" />
            The Morning Roast
          </h2>
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-amber-400">
              All Stories <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>

        {featured ? (
          <div className="space-y-4">
            {/* Featured story — hero */}
            <Link href="/blog">
              <div className="relative rounded-xl overflow-hidden aspect-video sm:aspect-[21/9] bg-zinc-900 cursor-pointer group">
                {featured.heroImage ? (
                  <img src={featured.heroImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <div className="flex items-center gap-6">
                      {featured.awayLogo && <img src={featured.awayLogo} alt="" className="h-16 w-16 opacity-50" />}
                      <span className="text-3xl font-bold text-zinc-600 tabular-nums">{featured.awayScore} - {featured.homeScore}</span>
                      {featured.homeLogo && <img src={featured.homeLogo} alt="" className="h-16 w-16 opacity-50" />}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <Badge className="bg-amber-500/90 text-black text-[10px] font-bold mb-2 uppercase tracking-wider">Featured</Badge>
                  <h3 className="text-xl md:text-2xl font-bold text-white leading-tight mb-1.5 group-hover:text-amber-200 transition-colors">
                    {featured.title}
                  </h3>
                  <div className="flex items-center gap-3 text-white/70 text-xs">
                    <span className="flex items-center gap-1"><Pen className="h-3 w-3 text-amber-400" />{featured.author}</span>
                    <span>{featured.awayTeam.split(' ').pop()} {featured.awayScore} - {featured.homeScore} {featured.homeTeam.split(' ').pop()}</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* More stories grid */}
            {moreReviews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {moreReviews.map((review) => (
                  <Link key={review.id} href="/blog">
                    <Card className="card-glow cursor-pointer border-border/30 overflow-hidden group h-full">
                      <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                        {review.heroImage ? (
                          <img src={review.heroImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              {review.awayLogo && <img src={review.awayLogo} alt="" className="h-8 w-8 opacity-40" />}
                              <span className="text-sm font-bold text-zinc-600 tabular-nums">{review.awayScore}-{review.homeScore}</span>
                              {review.homeLogo && <img src={review.homeLogo} alt="" className="h-8 w-8 opacity-40" />}
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-1.5 left-2 text-white/60 text-[10px]">
                          {review.awayTeam.split(' ').pop()} {review.awayScore}-{review.homeScore} {review.homeTeam.split(' ').pop()}
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors mb-1">
                          {review.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Pen className="h-2.5 w-2.5 text-amber-400/70" />
                          {review.author}
                          {review.authorMood === 'grumpy' && <span className="text-red-400">(grumpy)</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card className="border-border/30 border-dashed">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No stories yet. Check back tomorrow for sarcastic game recaps.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Link href="/todays-games">
          <div className="p-3 bg-card border border-border/30 rounded-lg text-center hover:border-emerald-500/20 transition-colors cursor-pointer">
            <span className="text-lg">⚾</span>
            <div className="text-xs font-medium text-foreground mt-1">Games & Odds</div>
          </div>
        </Link>
        <Link href="/team-power-scores">
          <div className="p-3 bg-card border border-border/30 rounded-lg text-center hover:border-emerald-500/20 transition-colors cursor-pointer">
            <span className="text-lg">📊</span>
            <div className="text-xs font-medium text-foreground mt-1">Power Rankings</div>
          </div>
        </Link>
        <Link href="/blog">
          <div className="p-3 bg-card border border-border/30 rounded-lg text-center hover:border-amber-500/20 transition-colors cursor-pointer">
            <span className="text-lg">☕</span>
            <div className="text-xs font-medium text-foreground mt-1">Morning Roast</div>
          </div>
        </Link>
        <Link href="/daily-picks">
          <div className="p-3 bg-card border border-border/30 rounded-lg text-center hover:border-emerald-500/20 transition-colors cursor-pointer">
            <span className="text-lg">🎯</span>
            <div className="text-xs font-medium text-foreground mt-1">Daily Picks</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
