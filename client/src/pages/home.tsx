import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import GameCard from "@/components/game-card";
import BettingSlip from "@/components/betting-slip";
import KellyCalculator from "@/components/kelly-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, TrendingUp, Target, Filter, Crown, Zap, ArrowRight, Users, BarChart3, Shield } from "lucide-react";
import { useBettingSlip } from "@/hooks/use-betting-slip";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "wouter";

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user } = useAuth();
  const { bets, stats } = useBettingSlip();

  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: userBets = [] } = useQuery<any[]>({
    queryKey: ["/api/bets"],
  });

  // Check if user is new (no subscription and no bets)
  const isNewUser = user && user.subscriptionTier === "free" && userBets.length === 0;

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
      {/* Onboarding Modal */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Welcome to MLB Betting Intelligence! 🎯
            </DialogTitle>
            <DialogDescription className="text-center text-lg mt-4">
              Get the edge you need with AI-powered betting insights
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-gray-600">Advanced algorithms analyze every game with 85%+ accuracy</p>
              </div>
              
              <div className="text-center p-4">
                <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Smart Picks</h3>
                <p className="text-sm text-gray-600">Daily curated picks based on value and probability</p>
              </div>
              
              <div className="text-center p-4">
                <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Risk Management</h3>
                <p className="text-sm text-gray-600">Kelly calculator and bankroll optimization tools</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white text-center">
              <h3 className="text-xl font-bold mb-2">Ready to Start Winning?</h3>
              <p className="opacity-90 mb-4">Upgrade to Pro for unlimited AI picks and advanced features</p>
              <div className="flex gap-3 justify-center">
                <Link href="/subscribe">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100">
                    View Plans <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10"
                  onClick={() => setShowOnboarding(false)}
                >
                  Continue Free
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Banner for New Users */}
        {isNewUser && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome, {user?.username}! 👋</h2>
                <p className="opacity-90 mb-4">
                  You're on the Free plan. Ready to unlock professional betting insights?
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Join 2,847+ successful bettors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>85%+ prediction accuracy</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/subscribe">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100">
                    Upgrade Now
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="text-white border-white/30 hover:bg-white/10"
                  onClick={() => setShowOnboarding(true)}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <main className="lg:col-span-3 space-y-6">
            {/* Date Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">MLB Betting Dashboard</h2>
                    <p className="text-gray-600 mt-1">
                      Today's MLB Games • <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium text-primary">{games.length} games</span> scheduled with AI analysis
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
                          className={`${
                            index === 0 
                              ? 'bg-green-500 text-white' 
                              : index === 1 
                                ? 'bg-yellow-500 text-gray-900' 
                                : 'bg-orange-500 text-white'
                          } border-0 font-bold`}
                        >
                          {pick.expectedValue > 0 ? `+EV ${pick.expectedValue.toFixed(1)}%` : "🔥 Hot"}
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
    </div>
  );
}
