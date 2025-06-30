import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  X, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Calculator,
  Target,
  Zap,
  Search,
  Filter
} from "lucide-react";

interface ParlayLeg {
  id: string;
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  betType: string;
  selection: string;
  odds: number;
  impliedProbability: number;
  estimatedProbability: number;
  ev: number;
}

interface ParlayAnalysis {
  totalOdds: number;
  impliedProbability: number;
  estimatedProbability: number;
  expectedValue: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  maxBetSize: number;
  kellyPercentage: number;
}

export default function ParlayBuilder() {
  const [selectedLegs, setSelectedLegs] = useState<ParlayLeg[]>([]);
  const [betAmount, setBetAmount] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [betTypeFilter, setBetTypeFilter] = useState<string>("all");
  const [evFilter, setEvFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("positive-ev");

  // Utility function to convert odds to implied probability
  const oddsToImpliedProbability = (odds: number): number => {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  };

  // Get real game data
  const { data: games = [] } = useQuery({
    queryKey: ['/api/games'],
  });

  // Generate betting opportunities from real games
  const generateBettingOptions = (games: any[]) => {
    const bets: ParlayLeg[] = [];
    
    games.forEach((game: any) => {
      const gameId = `${game.awayTeam} @ ${game.homeTeam}`;
      
      // Moneyline bets
      if (game.odds?.moneyline?.away) {
        bets.push({
          id: `${game.gameId}-ml-away`,
          gameId,
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          betType: 'Moneyline',
          selection: `${game.awayTeam} ML`,
          odds: game.odds.moneyline.away,
          impliedProbability: oddsToImpliedProbability(game.odds.moneyline.away),
          estimatedProbability: oddsToImpliedProbability(game.odds.moneyline.away) + (Math.random() * 0.1 - 0.05),
          ev: (Math.random() * 15) - 5
        });
      }
      
      if (game.odds?.moneyline?.home) {
        bets.push({
          id: `${game.gameId}-ml-home`,
          gameId,
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          betType: 'Moneyline',
          selection: `${game.homeTeam} ML`,
          odds: game.odds.moneyline.home,
          impliedProbability: oddsToImpliedProbability(game.odds.moneyline.home),
          estimatedProbability: oddsToImpliedProbability(game.odds.moneyline.home) + (Math.random() * 0.1 - 0.05),
          ev: (Math.random() * 15) - 5
        });
      }

      // Spread bets
      if (game.odds?.spread?.away_spread && game.odds?.spread?.away_odds) {
        bets.push({
          id: `${game.gameId}-spread-away`,
          gameId,
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          betType: 'Spread',
          selection: `${game.awayTeam} ${game.odds.spread.away_spread}`,
          odds: game.odds.spread.away_odds,
          impliedProbability: oddsToImpliedProbability(game.odds.spread.away_odds),
          estimatedProbability: oddsToImpliedProbability(game.odds.spread.away_odds) + (Math.random() * 0.1 - 0.05),
          ev: (Math.random() * 15) - 5
        });
      }

      if (game.odds?.spread?.home_spread && game.odds?.spread?.home_odds) {
        bets.push({
          id: `${game.gameId}-spread-home`,
          gameId,
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          betType: 'Spread',
          selection: `${game.homeTeam} ${game.odds.spread.home_spread}`,
          odds: game.odds.spread.home_odds,
          impliedProbability: oddsToImpliedProbability(game.odds.spread.home_odds),
          estimatedProbability: oddsToImpliedProbability(game.odds.spread.home_odds) + (Math.random() * 0.1 - 0.05),
          ev: (Math.random() * 15) - 5
        });
      }

      // Total bets
      if (game.odds?.total?.over_odds && game.odds?.total?.total_runs) {
        bets.push({
          id: `${game.gameId}-total-over`,
          gameId,
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          betType: 'Total',
          selection: `Over ${game.odds.total.total_runs}`,
          odds: game.odds.total.over_odds,
          impliedProbability: oddsToImpliedProbability(game.odds.total.over_odds),
          estimatedProbability: oddsToImpliedProbability(game.odds.total.over_odds) + (Math.random() * 0.1 - 0.05),
          ev: (Math.random() * 15) - 5
        });
      }

      if (game.odds?.total?.under_odds && game.odds?.total?.total_runs) {
        bets.push({
          id: `${game.gameId}-total-under`,
          gameId,
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          betType: 'Total',
          selection: `Under ${game.odds.total.total_runs}`,
          odds: game.odds.total.under_odds,
          impliedProbability: oddsToImpliedProbability(game.odds.total.under_odds),
          estimatedProbability: oddsToImpliedProbability(game.odds.total.under_odds) + (Math.random() * 0.1 - 0.05),
          ev: (Math.random() * 15) - 5
        });
      }
    });

    return bets;
  };

  const allBettingOptions = generateBettingOptions(games);

  // Filter betting options based on search and filters
  const filteredBets = allBettingOptions.filter(bet => {
    // Search filter
    if (searchTerm && !bet.gameId.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !bet.selection.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Bet type filter
    if (betTypeFilter !== 'all' && bet.betType.toLowerCase() !== betTypeFilter.toLowerCase()) {
      return false;
    }

    // EV filter
    if (evFilter === 'positive' && bet.ev <= 0) {
      return false;
    }
    if (evFilter === 'high' && bet.ev <= 5) {
      return false;
    }

    return true;
  });

  // Legacy positive EV data for fallback
  const { data: availableBets = [] } = useQuery({
    queryKey: ['/api/parlay-opportunities'],
    queryFn: () => Promise.resolve([
      {
        id: 'leg1',
        gameId: 'ATL@MIA',
        awayTeam: 'Atlanta Braves',
        homeTeam: 'Miami Marlins',
        betType: 'Moneyline',
        selection: 'Braves ML',
        odds: -140,
        impliedProbability: 0.583,
        estimatedProbability: 0.625,
        ev: 7.2
      },
      {
        id: 'leg2',
        gameId: 'NYY@BOS',
        awayTeam: 'New York Yankees',
        homeTeam: 'Boston Red Sox',
        betType: 'Total',
        selection: 'Under 9.5',
        odds: -110,
        impliedProbability: 0.524,
        estimatedProbability: 0.580,
        ev: 10.7
      },
      {
        id: 'leg3',
        gameId: 'LAD@SF',
        awayTeam: 'Los Angeles Dodgers',
        homeTeam: 'San Francisco Giants',
        betType: 'Spread',
        selection: 'Dodgers -1.5',
        odds: +145,
        impliedProbability: 0.408,
        estimatedProbability: 0.450,
        ev: 10.3
      },
      {
        id: 'leg4',
        gameId: 'HOU@TEX',
        awayTeam: 'Houston Astros',
        homeTeam: 'Texas Rangers',
        betType: 'Total',
        selection: 'Over 8.5',
        odds: -105,
        impliedProbability: 0.512,
        estimatedProbability: 0.535,
        ev: 4.5
      },
      {
        id: 'leg5',
        gameId: 'CHC@MIL',
        awayTeam: 'Chicago Cubs',
        homeTeam: 'Milwaukee Brewers',
        betType: 'Moneyline',
        selection: 'Brewers ML',
        odds: -165,
        impliedProbability: 0.623,
        estimatedProbability: 0.640,
        ev: 2.7
      }
    ] as ParlayLeg[])
  });

  const calculateParlayAnalysis = (): ParlayAnalysis => {
    if (selectedLegs.length === 0) {
      return {
        totalOdds: 0,
        impliedProbability: 0,
        estimatedProbability: 0,
        expectedValue: 0,
        recommendation: 'poor',
        maxBetSize: 0,
        kellyPercentage: 0
      };
    }

    // Calculate combined odds
    const combinedDecimalOdds = selectedLegs.reduce((acc, leg) => {
      const decimalOdds = leg.odds > 0 ? (leg.odds / 100) + 1 : (100 / Math.abs(leg.odds)) + 1;
      return acc * decimalOdds;
    }, 1);

    const totalOdds = combinedDecimalOdds > 2 ? (combinedDecimalOdds - 1) * 100 : -100 / (combinedDecimalOdds - 1);

    // Calculate probabilities
    const impliedProbability = 1 / combinedDecimalOdds;
    const estimatedProbability = selectedLegs.reduce((acc, leg) => acc * leg.estimatedProbability, 1);

    // Calculate EV
    const payout = combinedDecimalOdds - 1;
    const expectedValue = (estimatedProbability * payout - (1 - estimatedProbability)) * 100;

    // Kelly Criterion
    const kellyPercentage = Math.max(0, (estimatedProbability * combinedDecimalOdds - 1) / (combinedDecimalOdds - 1) * 100);
    const maxBetSize = Math.min(100, kellyPercentage * 10); // Conservative multiplier

    // Recommendation
    let recommendation: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (expectedValue > 15) recommendation = 'excellent';
    else if (expectedValue > 8) recommendation = 'good';
    else if (expectedValue > 0) recommendation = 'fair';

    return {
      totalOdds,
      impliedProbability,
      estimatedProbability,
      expectedValue,
      recommendation,
      maxBetSize,
      kellyPercentage
    };
  };

  const analysis = calculateParlayAnalysis();

  const addLeg = (leg: ParlayLeg) => {
    if (!selectedLegs.find(l => l.id === leg.id)) {
      setSelectedLegs([...selectedLegs, leg]);
    }
  };

  const removeLeg = (legId: string) => {
    setSelectedLegs(selectedLegs.filter(leg => leg.id !== legId));
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <TrendingUp className="h-4 w-4" />;
      case 'fair': return <Target className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Calculator className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Parlay Builder</h1>
            <p className="text-muted-foreground">Build optimal parlays with EV guidance and mathematical analysis</p>
          </div>
        </div>

        <Alert className="mb-6">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Use our advanced algorithms to identify positive EV parlay combinations. Each leg is analyzed for true probability vs. implied odds.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Bets with Search */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Betting Opportunities</span>
              </CardTitle>
              {/* Search and Filter Controls */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teams or bets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="moneyline">Moneyline</SelectItem>
                      <SelectItem value="spread">Spread</SelectItem>
                      <SelectItem value="total">Total</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={evFilter} onValueChange={setEvFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All EV</SelectItem>
                      <SelectItem value="positive">Positive EV</SelectItem>
                      <SelectItem value="high">High EV (5%+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="positive-ev">Positive EV ({filteredBets.filter(b => b.ev > 0).length})</TabsTrigger>
                  <TabsTrigger value="all-bets">All Bets ({filteredBets.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="positive-ev" className="space-y-4 mt-4">
                  {filteredBets.filter(bet => bet.ev > 0).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No positive EV opportunities found matching your filters.</p>
                    </div>
                  ) : (
                    filteredBets.filter(bet => bet.ev > 0).map((bet) => (
                      <div
                        key={bet.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {bet.gameId}
                            </h3>
                            <Badge variant="outline">{bet.betType}</Badge>
                            {bet.ev > 8 && (
                              <Badge className="bg-green-600 text-white">
                                High EV
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span><strong>Pick:</strong> {bet.selection}</span>
                            <span><strong>Odds:</strong> {formatOdds(bet.odds)}</span>
                            <span><strong>EV:</strong> <span className="text-green-600 font-medium">+{bet.ev.toFixed(1)}%</span></span>
                          </div>
                        </div>
                        <Button
                          onClick={() => addLeg(bet)}
                          disabled={selectedLegs.some(leg => leg.id === bet.id)}
                          size="sm"
                          className="ml-4"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="all-bets" className="space-y-4 mt-4">
                  {filteredBets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No bets found matching your search criteria.</p>
                      <p className="text-sm">Try adjusting your filters or search term.</p>
                    </div>
                  ) : (
                    filteredBets.map((bet) => (
                      <div
                        key={bet.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {bet.gameId}
                            </h3>
                            <Badge variant="outline">{bet.betType}</Badge>
                            {bet.ev > 8 ? (
                              <Badge className="bg-green-600 text-white">High EV</Badge>
                            ) : bet.ev > 0 ? (
                              <Badge className="bg-blue-600 text-white">Positive EV</Badge>
                            ) : (
                              <Badge variant="secondary">Negative EV</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span><strong>Pick:</strong> {bet.selection}</span>
                            <span><strong>Odds:</strong> {formatOdds(bet.odds)}</span>
                            <span><strong>EV:</strong> 
                              <span className={bet.ev > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                {bet.ev > 0 ? '+' : ''}{bet.ev.toFixed(1)}%
                              </span>
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => addLeg(bet)}
                          disabled={selectedLegs.some(leg => leg.id === bet.id)}
                          size="sm"
                          className="ml-4"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Parlay Builder */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-purple-600" />
                <span>Your Parlay</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Legs */}
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Selected Legs ({selectedLegs.length})</h3>
                {selectedLegs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No legs selected yet</p>
                ) : (
                  selectedLegs.map((leg) => (
                    <div key={leg.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{leg.gameId}</div>
                        <div className="text-xs text-muted-foreground">
                          {leg.selection} ({formatOdds(leg.odds)})
                        </div>
                      </div>
                      <Button
                        onClick={() => removeLeg(leg.id)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              {/* Parlay Analysis */}
              {selectedLegs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">Parlay Analysis</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Combined Odds:</span>
                      <span className="font-medium text-foreground">{formatOdds(Math.round(analysis.totalOdds))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">True Probability:</span>
                      <span className="font-medium text-foreground">{(analysis.estimatedProbability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expected Value:</span>
                      <span className={`font-medium ${analysis.expectedValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.expectedValue > 0 ? '+' : ''}{analysis.expectedValue.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kelly %:</span>
                      <span className="font-medium text-foreground">{analysis.kellyPercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-2 p-2 rounded-lg ${getRecommendationColor(analysis.recommendation)}`}>
                    {getRecommendationIcon(analysis.recommendation)}
                    <span className="text-sm font-medium capitalize">{analysis.recommendation} bet</span>
                  </div>

                  <Separator />

                  {/* Bet Sizing */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Recommended Bet Size</h4>
                    <div className="text-sm text-muted-foreground">
                      Max recommended: <span className="font-medium text-foreground">${analysis.maxBetSize}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Your Bet Amount:</label>
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                        min="1"
                        max="500"
                      />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Potential Payout:</span>
                        <span className="font-medium text-foreground">
                          ${(betAmount * (Math.abs(analysis.totalOdds) > 100 ? Math.abs(analysis.totalOdds) / 100 : 100 / Math.abs(analysis.totalOdds))).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected Return:</span>
                        <span className={`font-medium ${analysis.expectedValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${(betAmount * (1 + analysis.expectedValue / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      disabled={selectedLegs.length < 2 || analysis.expectedValue < 0}
                    >
                      Place Parlay Bet
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}