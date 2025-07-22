import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, Target, DollarSign } from "lucide-react";

interface EnhancedOddsData {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  gameTime: string;
  odds: {
    moneyline?: {
      away: number;
      home: number;
      impliedAwayProb?: number;
      impliedHomeProb?: number;
      modelAwayProb?: number;
      modelHomeProb?: number;
      awayEdge?: number;
      homeEdge?: number;
      awayEV?: number;
      homeEV?: number;
      awayKelly?: number;
      homeKelly?: number;
    };
    spread?: {
      away: number;
      home: number;
      awayOdds: number;
      homeOdds: number;
    };
    total?: {
      line: number;
      over: number;
      under: number;
    };
  };
}

// Utility function to calculate implied probability from American odds
function calculateImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

// Utility function to convert probability to American odds
function probabilityToAmericanOdds(probability: number): number {
  if (probability >= 0.5) {
    return -Math.round((probability / (1 - probability)) * 100);
  } else {
    return Math.round(((1 - probability) / probability) * 100);
  }
}

// Utility function to format percentage
function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Utility function to format odds with proper sign
function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export default function EnhancedOdds() {
  const { data: gamesData, isLoading, error } = useQuery<EnhancedOddsData[]>({
    queryKey: ["/api/games"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading enhanced odds data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center">Error loading odds data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform API data to expected format - extract moneyline odds from odds array
  const gamesWithOdds = gamesData?.map(game => {
    // Find moneyline odds in the odds array
    const moneylineOdds = (game.odds as any[])?.find((odds: any) => odds.market === 'moneyline');
    const spreadOdds = (game.odds as any[])?.find((odds: any) => odds.market === 'spread');
    const totalOdds = (game.odds as any[])?.find((odds: any) => odds.market === 'total');
    
    if (!moneylineOdds) return null; // Skip games without moneyline odds
    
    return {
      ...game,
      odds: {
        moneyline: {
          away: moneylineOdds.awayOdds,
          home: moneylineOdds.homeOdds
        },
        spread: spreadOdds ? {
          away: spreadOdds.awayOdds,
          home: spreadOdds.homeOdds,
          line: spreadOdds.line || 1.5
        } : undefined,
        total: totalOdds ? {
          over: totalOdds.overOdds,
          under: totalOdds.underOdds,
          line: totalOdds.line || 8.5
        } : undefined
      }
    };
  }).filter(game => game !== null) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-blue-600">Enhanced Odds Analysis</h1>
        <p className="text-lg text-muted-foreground">
          Detailed breakdown of odds calculations, implied probabilities, and betting value analysis
        </p>
        {gamesWithOdds.length > 0 && gamesWithOdds[0].gameId.startsWith('demo-') && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Demo Mode:</strong> Displaying sample odds data for calculation demonstration. 
              The Odds API quota has been exceeded. Calculations and formulas are accurate and ready for live data.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {gamesWithOdds.map((game) => {
          const moneyline = game.odds.moneyline!;
          
          // Calculate implied probabilities manually to verify
          const calculatedAwayImplied = calculateImpliedProbability(moneyline.away);
          const calculatedHomeImplied = calculateImpliedProbability(moneyline.home);
          const totalImplied = calculatedAwayImplied + calculatedHomeImplied;
          const vigPercentage = ((totalImplied - 1) * 100);
          
          // True probabilities (removing vig)
          const trueAwayProb = calculatedAwayImplied / totalImplied;
          const trueHomeProb = calculatedHomeImplied / totalImplied;
          
          // Fair odds (no vig)
          const fairAwayOdds = probabilityToAmericanOdds(trueAwayProb);
          const fairHomeOdds = probabilityToAmericanOdds(trueHomeProb);

          return (
            <Card key={game.gameId} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  {game.awayTeam} @ {game.homeTeam}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {game.gameTime} • {game.venue}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Moneyline Odds Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Moneyline Analysis
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Away Team */}
                    <Card className="bg-blue-50 dark:bg-blue-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{game.awayTeam}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>American Odds:</span>
                          <Badge variant="outline" className="font-mono">
                            {formatOdds(moneyline.away)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Implied Probability:</span>
                          <span className="font-semibold">
                            {formatPercentage(calculatedAwayImplied)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>True Probability:</span>
                          <span className="font-semibold text-green-600">
                            {formatPercentage(trueAwayProb)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>True Probability:</span>
                          <span className="font-semibold text-green-600">
                            {formatPercentage(trueAwayProb)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fair Odds:</span>
                          <Badge variant="outline" className="font-mono">
                            {formatOdds(fairAwayOdds)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Home Team */}
                    <Card className="bg-red-50 dark:bg-red-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{game.homeTeam}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>American Odds:</span>
                          <Badge variant="outline" className="font-mono">
                            {formatOdds(moneyline.home)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Implied Probability:</span>
                          <span className="font-semibold">
                            {formatPercentage(calculatedHomeImplied)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>True Probability:</span>
                          <span className="font-semibold text-green-600">
                            {formatPercentage(trueHomeProb)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>True Probability:</span>
                          <span className="font-semibold text-green-600">
                            {formatPercentage(trueHomeProb)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fair Odds:</span>
                          <Badge variant="outline" className="font-mono">
                            {formatOdds(fairHomeOdds)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Spread and Total Information */}
                {(game.odds.spread || game.odds.total) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Additional Markets
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {game.odds.spread && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Run Line</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span>{game.awayTeam} {game.odds.spread.line > 0 ? '+' : ''}{game.odds.spread.line}:</span>
                                <Badge variant="outline">{formatOdds(game.odds.spread.away)}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>{game.homeTeam} {game.odds.spread.line < 0 ? '+' : ''}{-game.odds.spread.line}:</span>
                                <Badge variant="outline">{formatOdds(game.odds.spread.home)}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        {game.odds.total && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Total Runs</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span>Over {game.odds.total.line}:</span>
                                <Badge variant="outline">{formatOdds(game.odds.total.over)}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Under {game.odds.total.line}:</span>
                                <Badge variant="outline">{formatOdds(game.odds.total.under)}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground text-center pt-2">
                                Implied: Over {formatPercentage(calculateImpliedProbability(game.odds.total.over))}, 
                                Under {formatPercentage(calculateImpliedProbability(game.odds.total.under))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </>
                )}

              </CardContent>
            </Card>
          );
        })}
      </div>

      {gamesWithOdds.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-lg text-muted-foreground">No games with odds data available at this time.</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}