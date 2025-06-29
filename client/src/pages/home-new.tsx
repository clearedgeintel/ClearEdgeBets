import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Users, 
  Clock, 
  DollarSign,
  Zap,
  Shield,
  Search,
  Filter,
  ArrowRight,
  Star
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { user } = useAuth();

  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    refetchInterval: 60000,
  });

  const { data: dailyPicks = [] } = useQuery<any[]>({
    queryKey: ["/api/daily-picks"],
  });

  const stats = {
    totalGames: games.length,
    aiAnalyzed: games.filter(g => g.aiSummary).length,
    avgConfidence: games.reduce((acc, g) => acc + (g.aiSummary?.confidence || 0), 0) / games.length || 0,
    topPicks: dailyPicks.slice(0, 3)
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = searchTerm === "" || 
      game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === "all" || 
      (selectedFilter === "analyzed" && game.aiSummary) ||
      (selectedFilter === "early" && parseInt(game.gameTime.split(":")[0]) < 19) ||
      (selectedFilter === "late" && parseInt(game.gameTime.split(":")[0]) >= 19);
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Get Your <span className="text-primary">Clear</span><span className="text-secondary">Edge</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Professional MLB betting intelligence powered by AI. Make smarter bets with real-time analysis.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/subscribe">
                  <Button size="lg" className="w-full">
                    Start Winning Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Button variant="outline" size="lg" className="w-full">
                  View Live Games
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Games Today
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalGames}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-secondary" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      AI Analyzed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.aiAnalyzed}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Confidence
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {Math.round(stats.avgConfidence)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-secondary" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Live Updates
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Real-time
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {["all", "analyzed", "early", "late"].map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Picks Section */}
        {stats.topPicks.length > 0 && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Today's Top AI Picks
                <Badge variant="secondary">Live</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.topPicks.map((pick: any, index: number) => (
                  <div key={pick.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        {index === 0 ? "Best Value" : index === 1 ? "Sharp Play" : "Sleeper"}
                      </Badge>
                      <span className="text-sm font-medium text-green-600">
                        +{pick.expectedValue}% EV
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{pick.selection}</p>
                    <p className="text-xs text-gray-600 mt-1">{pick.pickType}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Games Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Today's Games ({filteredGames.length})
            </h2>
            <Link href="/daily-picks">
              <Button variant="outline" size="sm">
                View All Picks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {filteredGames.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No games found</h3>
                <p className="text-gray-500">
                  {searchTerm ? "Try adjusting your search terms" : "No games match the selected filter"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredGames.map((game) => (
                <GameCard key={game.gameId} game={game} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simplified Game Card Component
function GameCard({ game }: { game: Game }) {
  const moneylineOdds = game.odds.find(o => o.market === "h2h");
  const totalOdds = game.odds.find(o => o.market === "totals");
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="font-semibold text-sm">{game.awayTeamCode}</p>
              <p className="text-xs text-gray-500">Away</p>
            </div>
            <span className="text-gray-400">@</span>
            <div className="text-center">
              <p className="font-semibold text-sm">{game.homeTeamCode}</p>
              <p className="text-xs text-gray-500">Home</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{game.gameTime}</p>
            <p className="text-xs text-gray-500">{game.venue}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {game.aiSummary && (
          <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Analysis</span>
              <Badge variant="outline" className="text-xs">
                {game.aiSummary.confidence}% confidence
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{game.aiSummary.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {moneylineOdds && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Moneyline</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  {game.awayTeamCode} {moneylineOdds.awayOdds ? (moneylineOdds.awayOdds > 0 ? `+${moneylineOdds.awayOdds}` : moneylineOdds.awayOdds) : 'N/A'}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  {game.homeTeamCode} {moneylineOdds.homeOdds ? (moneylineOdds.homeOdds > 0 ? `+${moneylineOdds.homeOdds}` : moneylineOdds.homeOdds) : 'N/A'}
                </Button>
              </div>
            </div>
          )}

          {totalOdds && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Total {totalOdds.total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  O {totalOdds.overOdds ? (totalOdds.overOdds > 0 ? `+${totalOdds.overOdds}` : totalOdds.overOdds) : 'N/A'}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  U {totalOdds.underOdds ? (totalOdds.underOdds > 0 ? `+${totalOdds.underOdds}` : totalOdds.underOdds) : 'N/A'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {game.aiSummary?.valuePlays && game.aiSummary.valuePlays.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Value Plays</p>
            <div className="space-y-1">
              {game.aiSummary.valuePlays.slice(0, 2).map((play, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{play.selection}</span>
                  <Badge variant="outline" className="text-xs">
                    +{play.expectedValue}% EV
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}