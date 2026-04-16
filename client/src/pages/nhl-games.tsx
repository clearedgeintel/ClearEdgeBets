import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { SportSwitcher } from "@/components/sport-switcher";

interface NHLGame {
  gameId: string;
  sport: string;
  away: string;
  home: string;
  awayName: string;
  homeName: string;
  awayLogo: string;
  homeLogo: string;
  gameTime: string;
  moneyline?: { away: number; home: number } | null;
  puckLine?: { away: string; home: string; awayOdds: number; homeOdds: number } | null;
  total?: { line: string; overOdds: number; underOdds: number } | null;
}

function formatOdds(n: number) { return n > 0 ? `+${n}` : `${n}`; }

export default function NHLGames() {
  const { data: games = [], isLoading } = useQuery<NHLGame[]>({
    queryKey: ['/api/nhl/games'],
    queryFn: () => fetch('/api/nhl/games').then(r => r.json()),
    refetchInterval: 60000,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <span>🏒</span> NHL Games
          </h1>
          <SportSwitcher />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">{games.length} games today</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Card key={i} className="animate-pulse border-border/30"><CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent></Card>)}
        </div>
      )}

      {!isLoading && games.length === 0 && (
        <Card className="border-border/30">
          <CardContent className="p-10 text-center text-muted-foreground text-sm">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
            No NHL games scheduled for today.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {games.map(game => (
          <Card key={game.gameId} className="border-border/30 card-glow">
            <CardContent className="p-4">
              {/* Teams */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img src={game.awayLogo} alt="" className="h-8 w-8" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{game.awayName}</div>
                    <div className="text-[10px] text-zinc-500">{game.away}</div>
                  </div>
                </div>
                <div className="text-xs text-zinc-600 flex-shrink-0">{game.gameTime}</div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <div className="min-w-0 text-right">
                    <div className="font-semibold text-sm text-foreground truncate">{game.homeName}</div>
                    <div className="text-[10px] text-zinc-500">{game.home}</div>
                  </div>
                  <img src={game.homeLogo} alt="" className="h-8 w-8" />
                </div>
              </div>

              {/* Odds row */}
              {(game.moneyline || game.total || game.puckLine) && (
                <div className="flex items-center justify-center gap-4 text-[11px] tabular-nums">
                  {game.moneyline && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">ML</span>
                      <span className="text-blue-400">{formatOdds(game.moneyline.away)}</span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-blue-400">{formatOdds(game.moneyline.home)}</span>
                    </div>
                  )}
                  {game.puckLine && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">PL</span>
                      <span className="text-emerald-400">{game.puckLine.away}/{game.puckLine.home}</span>
                    </div>
                  )}
                  {game.total && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">O/U</span>
                      <span className="text-amber-400">{game.total.line}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
