import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  ArrowUpDown, 
  Search,
  ExternalLink,
  Star,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

interface OddsComparison {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  gameTime: string;
  venue: string;
  bookmakers: Array<{
    name: string;
    logo: string;
    moneyline: {
      away: number;
      home: number;
    };
    spread: {
      line: number;
      awayOdds: number;
      homeOdds: number;
    };
    total: {
      line: number;
      overOdds: number;
      underOdds: number;
    };
    lastUpdated: string;
  }>;
  bestOdds: {
    awayML: { bookmaker: string; odds: number };
    homeML: { bookmaker: string; odds: number };
    awaySpread: { bookmaker: string; odds: number };
    homeSpread: { bookmaker: string; odds: number };
    over: { bookmaker: string; odds: number };
    under: { bookmaker: string; odds: number };
  };
}

export default function OddsComparison() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBet, setSelectedBet] = useState("all");
  const [sortBy, setSortBy] = useState("value");

  // Mock odds comparison data - in production this would come from real sportsbook APIs
  const { data: oddsData = [], isLoading } = useQuery<OddsComparison[]>({
    queryKey: ['/api/odds-comparison'],
    queryFn: async () => {
      // Generate mock data for demonstration
      const games = [
        { gameId: "NYY@TOR", awayTeam: "Yankees", homeTeam: "Blue Jays", gameTime: "7:07 PM", venue: "Rogers Centre" },
        { gameId: "SD@PHI", awayTeam: "Padres", homeTeam: "Phillies", gameTime: "7:05 PM", venue: "Citizens Bank Park" },
        { gameId: "STL@PIT", awayTeam: "Cardinals", homeTeam: "Pirates", gameTime: "7:40 PM", venue: "PNC Park" },
        { gameId: "CIN@BOS", awayTeam: "Reds", homeTeam: "Red Sox", gameTime: "7:10 PM", venue: "Fenway Park" }
      ];

      return games.map(game => ({
        ...game,
        bookmakers: [
          {
            name: "DraftKings",
            logo: "dk",
            moneyline: { away: -105, home: -115 },
            spread: { line: -1.5, awayOdds: +145, homeOdds: -165 },
            total: { line: 9.0, overOdds: -110, underOdds: -110 },
            lastUpdated: "2 min ago"
          },
          {
            name: "FanDuel", 
            logo: "fd",
            moneyline: { away: -102, home: -118 },
            spread: { line: -1.5, awayOdds: +142, homeOdds: -162 },
            total: { line: 9.0, overOdds: -108, underOdds: -112 },
            lastUpdated: "1 min ago"
          },
          {
            name: "BetMGM",
            logo: "mgm",
            moneyline: { away: -108, home: -112 },
            spread: { line: -1.5, awayOdds: +148, homeOdds: -168 },
            total: { line: 8.5, overOdds: -115, underOdds: -105 },
            lastUpdated: "3 min ago"
          },
          {
            name: "Caesars",
            logo: "cz",
            moneyline: { away: -100, home: -120 },
            spread: { line: -1.5, awayOdds: +150, homeOdds: -170 },
            total: { line: 9.0, overOdds: -105, underOdds: -115 },
            lastUpdated: "4 min ago"
          }
        ],
        bestOdds: {
          awayML: { bookmaker: "Caesars", odds: -100 },
          homeML: { bookmaker: "DraftKings", odds: -115 },
          awaySpread: { bookmaker: "Caesars", odds: +150 },
          homeSpread: { bookmaker: "DraftKings", odds: -165 },
          over: { bookmaker: "Caesars", odds: -105 },
          under: { bookmaker: "BetMGM", odds: -105 }
        }
      }));
    },
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  const getBestOddsStyle = (bookmaker: string, currentOdds: number, bestOdds: { bookmaker: string; odds: number }) => {
    if (bookmaker === bestOdds.bookmaker && currentOdds === bestOdds.odds) {
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 font-bold border-2 border-green-500";
    }
    return "bg-muted hover:bg-muted/80";
  };

  const getValueRating = (odds: number, bestOdds: number) => {
    const diff = Math.abs(odds - bestOdds);
    if (diff <= 5) return "excellent";
    if (diff <= 10) return "good";
    if (diff <= 20) return "fair";
    return "poor";
  };

  const filteredGames = oddsData.filter(game => 
    searchTerm === "" || 
    game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Odds Comparison</h1>
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
            Pro Feature
          </Badge>
        </div>
        <p className="text-muted-foreground mb-6">
          Compare odds across major sportsbooks to find the best value for your bets
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedBet} onValueChange={setSelectedBet}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Bet Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bets</SelectItem>
              <SelectItem value="moneyline">Moneyline</SelectItem>
              <SelectItem value="spread">Spread</SelectItem>
              <SelectItem value="total">Totals</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Best Value</SelectItem>
              <SelectItem value="time">Game Time</SelectItem>
              <SelectItem value="team">Team Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Odds Comparison Cards */}
      <div className="space-y-6">
        {filteredGames.map((game) => (
          <Card key={game.gameId} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {game.awayTeam} @ {game.homeTeam}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {game.gameTime} • {game.venue}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Moneyline Comparison */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Moneyline
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {game.bookmakers.map((book) => (
                    <div key={`${game.gameId}-${book.name}-ml`} className="space-y-2">
                      <div className="text-sm font-medium text-center">{book.name}</div>
                      <div className="grid grid-cols-2 gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-12 flex flex-col ${getBestOddsStyle(book.name, book.moneyline.away, game.bestOdds.awayML)}`}
                        >
                          <span className="text-xs">{game.awayTeam}</span>
                          <span className="font-bold">{book.moneyline.away > 0 ? '+' : ''}{book.moneyline.away}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-12 flex flex-col ${getBestOddsStyle(book.name, book.moneyline.home, game.bestOdds.homeML)}`}
                        >
                          <span className="text-xs">{game.homeTeam}</span>
                          <span className="font-bold">{book.moneyline.home > 0 ? '+' : ''}{book.moneyline.home}</span>
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">{book.lastUpdated}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spread Comparison */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Point Spread
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {game.bookmakers.map((book) => (
                    <div key={`${game.gameId}-${book.name}-spread`} className="space-y-2">
                      <div className="text-sm font-medium text-center">{book.name}</div>
                      <div className="grid grid-cols-2 gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-12 flex flex-col ${getBestOddsStyle(book.name, book.spread.awayOdds, game.bestOdds.awaySpread)}`}
                        >
                          <span className="text-xs">{book.spread.line > 0 ? '+' : ''}{book.spread.line}</span>
                          <span className="font-bold">{book.spread.awayOdds > 0 ? '+' : ''}{book.spread.awayOdds}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-12 flex flex-col ${getBestOddsStyle(book.name, book.spread.homeOdds, game.bestOdds.homeSpread)}`}
                        >
                          <span className="text-xs">{book.spread.line < 0 ? '+' : '-'}{Math.abs(book.spread.line)}</span>
                          <span className="font-bold">{book.spread.homeOdds > 0 ? '+' : ''}{book.spread.homeOdds}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Comparison */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Total Runs
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {game.bookmakers.map((book) => (
                    <div key={`${game.gameId}-${book.name}-total`} className="space-y-2">
                      <div className="text-sm font-medium text-center">{book.name}</div>
                      <div className="grid grid-cols-2 gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-12 flex flex-col ${getBestOddsStyle(book.name, book.total.overOdds, game.bestOdds.over)}`}
                        >
                          <span className="text-xs">O {book.total.line}</span>
                          <span className="font-bold">{book.total.overOdds > 0 ? '+' : ''}{book.total.overOdds}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-12 flex flex-col ${getBestOddsStyle(book.name, book.total.underOdds, game.bestOdds.under)}`}
                        >
                          <span className="text-xs">U {book.total.line}</span>
                          <span className="font-bold">{book.total.underOdds > 0 ? '+' : ''}{book.total.underOdds}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value Alert */}
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Value Alert: Best moneyline odds spread is 20+ points - shop around for maximum value!
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGames.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No games found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm ? "Try adjusting your search terms" : "No games available for comparison"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}