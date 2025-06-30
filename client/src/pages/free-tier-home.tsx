import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierRestriction, FreeTierLimit, useTierAccess } from "@/components/tier-restrictions";
import { useAuth } from "@/contexts/auth-context";
import { Target, TrendingUp, Lock, Crown, Zap, BarChart3, Clock } from "lucide-react";
import { Link } from "wouter";

interface DailyPick {
  id: number;
  gameId: string;
  pickType: string;
  selection: string;
  odds: number;
  confidence: number;
  reasoning: string;
  expectedValue: string;
  result?: string;
}

interface Game {
  id: number;
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
  gameTime: string;
  venue: string;
  status: string;
  odds: Array<{
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
}

export default function FreeTierHome() {
  const { user } = useAuth();
  const { userTier, hasProAccess } = useTierAccess();
  const [viewedGames, setViewedGames] = useState<Set<string>>(new Set());

  // Fetch daily picks (limit to top 3 for free tier)
  const { data: dailyPicks = [] } = useQuery<DailyPick[]>({
    queryKey: ["/api/daily-picks"],
  });

  // Fetch games
  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Limit free tier to top 3 picks
  const freePicks = dailyPicks.slice(0, 3);
  const freeGames = games.slice(0, 5); // Show 5 games max for free tier

  const handleGameView = (gameId: string) => {
    if (!hasProAccess && viewedGames.size >= 3) {
      return; // Block viewing more than 3 games for free users
    }
    setViewedGames(prev => new Set(Array.from(prev).concat(gameId)));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Free Tier Header */}
        <div className="bg-primary rounded-xl shadow-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">ClearEdge Bets Free</h1>
              <p className="opacity-90 mb-4">
                Get started with daily MLB betting insights
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>3 Daily Expert Picks</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Basic Game Data</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/subscribe">
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </Link>
              <p className="text-xs opacity-75 text-center">Starting at $9.99/mo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top 3 Daily Picks - FREE TIER */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Today's Expert Picks
                  </CardTitle>
                  <Badge variant="secondary">Free Tier</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {freePicks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No picks available today</p>
                  </div>
                ) : (
                  freePicks.map((pick, index) => (
                    <Card key={pick.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-600">
                              #{index + 1}
                            </Badge>
                            <h3 className="font-semibold">{pick.selection}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{pick.pickType}</Badge>
                            <span className="font-mono text-sm">{formatOdds(pick.odds)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">Confidence</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full">
                              <div 
                                className={`h-2 rounded-full ${getConfidenceColor(pick.confidence)}`}
                                style={{ width: `${pick.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{pick.confidence}%</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">AI Reasoning</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {pick.reasoning.split('.')[0]}.
                          </p>
                        </div>

                        {pick.result && (
                          <div className="mt-3 pt-3 border-t">
                            <Badge 
                              variant={pick.result === 'win' ? 'default' : pick.result === 'loss' ? 'destructive' : 'secondary'}
                              className={
                                pick.result === 'win' ? 'bg-green-500 text-white' :
                                pick.result === 'loss' ? 'bg-red-500 text-white' :
                                'bg-yellow-500 text-white'
                              }
                            >
                              {pick.result === 'win' ? 'WIN' : pick.result === 'loss' ? 'LOSS' : 'PUSH'}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
                
                {/* Pro Tier Teaser */}
                <TierRestriction 
                  requiredTier="pro" 
                  feature="unlimited daily picks with full analysis"
                  fallbackComponent={
                    <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50">
                      <CardContent className="p-6 text-center">
                        <Crown className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Unlock All Picks</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Get unlimited daily picks with full AI analysis, confidence scores, and EV calculations
                        </p>
                        <Link href="/subscribe">
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Upgrade to Pro - $9.99/mo
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  }
                >
                  {/* This content is hidden for free tier */}
                  <div></div>
                </TierRestriction>
              </CardContent>
            </Card>
          </div>

          {/* Today's Games - LIMITED FREE TIER */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Today's Games
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {viewedGames.size >= 3 && !hasProAccess && (
                  <FreeTierLimit 
                    maxItems={3}
                    currentCount={viewedGames.size}
                    itemType="games"
                    upgradeMessage="Upgrade to Pro for unlimited access."
                  />
                )}
                
                {freeGames.map((game, index) => {
                  const isLocked = !hasProAccess && viewedGames.size >= 3 && !viewedGames.has(game.gameId);
                  const moneylineOdds = game.odds.find(o => o.market === "moneyline");
                  const totalOdds = game.odds.find(o => o.market === "totals");
                  const spreadOdds = game.odds.find(o => o.market === "spreads");
                  
                  return (
                    <Card key={game.id} className={isLocked ? "opacity-50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{game.awayTeamCode}</span>
                            <span className="text-xs text-muted-foreground">@</span>
                            <span className="text-sm font-medium">{game.homeTeamCode}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{game.gameTime}</span>
                        </div>
                        
                        {!isLocked ? (
                          <div className="space-y-2 text-xs">
                            {/* Moneyline */}
                            {moneylineOdds && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ML:</span>
                                <div className="space-x-2">
                                  <span>{formatOdds(moneylineOdds.awayOdds || 0)}</span>
                                  <span>{formatOdds(moneylineOdds.homeOdds || 0)}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Spread */}
                            {spreadOdds && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Spread:</span>
                                <div className="space-x-2">
                                  <span>{spreadOdds.awaySpread} ({formatOdds(spreadOdds.awaySpreadOdds || 0)})</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Total */}
                            {totalOdds && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total:</span>
                                <div className="space-x-2">
                                  <span>O{totalOdds.total} ({formatOdds(totalOdds.overOdds || 0)})</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Lock className="h-4 w-4" />
                              <span>Upgrade to view</span>
                            </div>
                          </div>
                        )}
                        
                        {!isLocked && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full mt-3"
                            onClick={() => handleGameView(game.gameId)}
                          >
                            View Details
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                
                <Card className="border-dashed border-2 border-purple-200 bg-purple-50/50">
                  <CardContent className="p-4 text-center">
                    <Zap className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-3">
                      Elite: Full game analysis, prop finder, parlay builder
                    </p>
                    <Link href="/subscribe">
                      <Button size="sm" variant="outline" className="border-purple-200 text-purple-600">
                        Elite - $19.99/mo
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}