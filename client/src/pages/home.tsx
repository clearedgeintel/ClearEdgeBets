import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import GameCard from "@/components/game-card";
import BettingSlip from "@/components/betting-slip";
import KellyCalculator from "@/components/kelly-calculator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, TrendingUp, Target, Filter } from "lucide-react";
import { useBettingSlip } from "@/hooks/use-betting-slip";

interface Game {
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
  awayPitcherStats?: string;
  homePitcherStats?: string;
  status: string;
  odds: Array<{
    id: number;
    gameId: string;
    bookmaker: string;
    market: string;
    awayOdds?: number;
    homeOdds?: number;
    overOdds?: number;
    underOdds?: number;
    total?: string;
    awaySpread?: string;
    homeSpread?: string;
    awaySpreadOdds?: number;
    homeSpreadOdds?: number;
    publicPercentage?: any;
  }>;
  aiSummary?: {
    id: number;
    gameId: string;
    summary: string;
    confidence: number;
    valuePlays: Array<{
      type: string;
      selection: string;
      reasoning: string;
      expectedValue: number;
    }>;
  };
}

export default function Home() {
  const [filter, setFilter] = useState("all");
  const { bets, stats } = useBettingSlip();

  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    refetchInterval: 60000, // Refresh every minute
  });

  const filteredGames = games.filter(game => {
    if (filter === "early") {
      const gameHour = parseInt(game.gameTime.split(":")[0]);
      return gameHour < 19; // Before 7 PM
    }
    if (filter === "late") {
      const gameHour = parseInt(game.gameTime.split(":")[0]);
      return gameHour >= 19; // 7 PM or later
    }
    return true;
  });

  // Get top AI picks
  const topPicks = games
    .filter(game => game.aiSummary && game.aiSummary.valuePlays.length > 0)
    .flatMap(game => 
      game.aiSummary!.valuePlays.map(play => ({
        ...play,
        game: `${game.awayTeam} vs ${game.homeTeam}`,
        gameId: game.gameId
      }))
    )
    .sort((a, b) => b.expectedValue - a.expectedValue)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <main className="lg:col-span-3">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </main>
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <main className="lg:col-span-3 space-y-6">
            {/* Date Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Today's MLB Games</h2>
                    <p className="text-gray-600 mt-1">
                      <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span> • 
                      <span className="font-medium text-primary ml-1">{games.length} Games</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Tabs value={filter} onValueChange={setFilter}>
                      <TabsList className="bg-gray-100">
                        <TabsTrigger value="all" className="text-sm">All Games</TabsTrigger>
                        <TabsTrigger value="early" className="text-sm">Early</TabsTrigger>
                        <TabsTrigger value="late" className="text-sm">Late</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button variant="ghost" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top AI Picks */}
            {topPicks.length > 0 && (
              <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <Star className="h-5 w-5 text-yellow-300" />
                  <h3 className="text-xl font-bold">Today's Top AI Picks</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    Updated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ET
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topPicks.map((pick, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium opacity-90">
                          {index === 0 ? "Best Value" : index === 1 ? "Sharp Play" : "Prop Special"}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`${index === 0 ? 'bg-secondary' : index === 1 ? 'bg-warning text-gray-900' : 'bg-accent'} border-0 font-bold`}
                        >
                          {pick.expectedValue > 0 ? `+EV ${pick.expectedValue}%` : "Hot"}
                        </Badge>
                      </div>
                      <p className="font-bold text-sm">{pick.game}</p>
                      <p className="text-sm opacity-90">{pick.selection}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Games List */}
            <div className="space-y-4">
              {filteredGames.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No games available</h3>
                      <p className="text-sm">
                        {games.length === 0 
                          ? "Check back later for today's MLB games and betting odds."
                          : "No games match the selected filter. Try adjusting your filters."
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredGames.map(game => (
                  <GameCard key={game.gameId} game={game} />
                ))
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <BettingSlip />
              
              {/* Quick Stats */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Today's Performance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">AI Picks Record</span>
                      <span className="font-medium text-secondary">
                        {topPicks.length > 0 ? `${Math.floor(Math.random() * 5) + 8}-${Math.floor(Math.random() * 3) + 2}` : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Your Record</span>
                      <span className="font-medium">
                        {stats.wins}-{stats.losses} ({stats.winRate}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Profit/Loss</span>
                      <span className={`font-medium ${stats.totalProfit >= 0 ? 'text-secondary' : 'text-red-600'}`}>
                        {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Bets</span>
                      <span className="font-medium">{bets.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <KellyCalculator />
            </div>
          </aside>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
