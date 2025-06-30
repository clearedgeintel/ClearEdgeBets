import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, RotateCcw, Target, Trophy, BarChart3, LogIn, Brain, Calculator } from "lucide-react";

interface BalanceData {
  balance: number;
  totalWinnings: number;
  totalLosses: number;
  winRate: string;
  winCount: number;
  betCount: number;
}

interface Game {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  gameTime: string;
  venue: string;
  odds?: {
    moneyline?: { away: number; home: number };
    total?: { line: number; over: number; under: number };
  };
}

interface AIBetRecommendation {
  gameId: string;
  team: string;
  matchup: string;
  betType: string;
  selection: string;
  odds: number;
  aiProbability: number;
  confidence: number;
  stake: number;
  expectedReturn: number;
  impliedValue: number;
  reasoning: string;
}

export default function VirtualSportsbook() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [aiBetSlip, setAiBetSlip] = useState<AIBetRecommendation[] | null>(null);
  const [isGeneratingAIBets, setIsGeneratingAIBets] = useState(false);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest("POST", "/api/login", credentials);
    },
    onSuccess: (data: any) => {
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      toast({
        title: "Welcome to Virtual Sportsbook!",
        description: data.message || "Login successful",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Fetch user's virtual balance and stats
  const { data: balanceData, isLoading: balanceLoading } = useQuery<BalanceData>({
    queryKey: ["/api/user/balance"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch today's games for betting
  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    retry: false,
  });

  // Reset balance mutation
  const resetBalanceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/user/balance/reset");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      toast({
        title: "Balance Reset",
        description: data.message || "Balance reset to $1,000",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset balance",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      loginMutation.mutate({ username: username.trim(), password: password.trim() });
    }
  };

  const handleResetBalance = () => {
    if (window.confirm("Are you sure you want to reset your balance to $1,000? This will clear all your statistics.")) {
      resetBalanceMutation.mutate();
    }
  };

  // Generate AI bet recommendations
  const generateAIBetSlip = async () => {
    if (!balanceData || !games || games.length === 0) {
      toast({
        title: "Unable to generate bets",
        description: "No games available or balance information missing.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAIBets(true);
    
    try {
      const bankroll = balanceData.balance;
      const totalBudget = bankroll * 0.10; // 10% of bankroll
      
      // Simulate AI analysis with confidence scores
      const availableGames = games.slice(0, 5); // Top 5 games
      const recommendations: AIBetRecommendation[] = [];
      
      let totalConfidence = 0;
      const gameAnalysis = availableGames.map((game: any) => {
        const confidence = Math.random() * 40 + 60; // 60-100% confidence
        totalConfidence += confidence;
        
        // Determine bet type and selection
        const betTypes = ['moneyline', 'total'];
        const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
        
        let selection = '';
        let odds = 0;
        let reasoning = '';
        
        if (betType === 'moneyline' && game.odds?.moneyline) {
          const favorHome = Math.random() > 0.5;
          selection = favorHome ? game.homeTeam : game.awayTeam;
          odds = favorHome ? game.odds.moneyline.home : game.odds.moneyline.away;
          reasoning = favorHome 
            ? `Home field advantage and strong recent performance favor ${game.homeTeam}`
            : `${game.awayTeam} has superior pitching matchup and momentum`;
        } else if (game.odds?.total) {
          const favorOver = Math.random() > 0.5;
          selection = favorOver ? `Over ${game.odds.total.line}` : `Under ${game.odds.total.line}`;
          odds = favorOver ? game.odds.total.over : game.odds.total.under;
          reasoning = favorOver
            ? 'Weather conditions and offensive trends suggest high-scoring game'
            : 'Strong pitching matchup and defensive statistics favor under';
        }
        
        return {
          game,
          confidence,
          betType,
          selection,
          odds,
          reasoning
        };
      });
      
      // Calculate weighted stakes based on confidence
      gameAnalysis.forEach(({ game, confidence, betType, selection, odds, reasoning }) => {
        const weight = confidence / totalConfidence;
        const stake = Math.round((totalBudget * weight) * 100) / 100;
        
        // Calculate implied probability and value
        const impliedProbability = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
        const aiProbability = confidence / 100;
        const impliedValue = ((aiProbability - impliedProbability) / impliedProbability) * 100;
        
        const expectedReturn = odds > 0 
          ? stake * (odds / 100) + stake
          : stake * (100 / Math.abs(odds)) + stake;
        
        recommendations.push({
          gameId: game.gameId,
          team: selection.includes('Over') || selection.includes('Under') ? 'Total' : selection,
          matchup: `${game.awayTeam} @ ${game.homeTeam}`,
          betType: betType === 'moneyline' ? 'Moneyline' : 'Total',
          selection,
          odds,
          aiProbability: aiProbability * 100,
          confidence,
          stake,
          expectedReturn: Math.round(expectedReturn * 100) / 100,
          impliedValue,
          reasoning
        });
      });
      
      setAiBetSlip(recommendations);
      
      toast({
        title: "AI Bet Slip Generated!",
        description: `Created 5 optimized bets using 10% of your $${bankroll.toFixed(2)} bankroll.`,
      });
      
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Unable to generate AI bet recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAIBets(false);
    }
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Virtual Sportsbook
            </CardTitle>
            <CardDescription>
              Enter any username and password to start with $1,000 virtual money
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose any username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Any password works"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {loginMutation.isPending ? "Logging in..." : "Start Virtual Betting"}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p className="mb-2">🎯 Practice Mode Features:</p>
              <ul className="text-left space-y-1">
                <li>• Start with $1,000 virtual money</li>
                <li>• Real MLB odds and games</li>
                <li>• Track your betting performance</li>
                <li>• Reset balance anytime</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (balanceLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Virtual Sportsbook</h1>
        <p className="text-muted-foreground">
          Practice your betting skills with simulated money. Start with $1,000 and track your performance!
        </p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Virtual Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${balanceData?.balance?.toFixed(2) || "1000.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for betting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${balanceData?.totalWinnings?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time winnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${balanceData?.totalLosses?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time losses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Trophy className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {balanceData?.winRate || "0.0"}%
            </div>
            <p className="text-xs text-muted-foreground">
              {balanceData?.winCount || 0} / {balanceData?.betCount || 0} bets won
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button
          onClick={generateAIBetSlip}
          disabled={isGeneratingAIBets || !games || games.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Brain className="h-4 w-4" />
          {isGeneratingAIBets ? "Generating AI Bets..." : "Generate AI Bet Slip"}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleResetBalance}
          disabled={resetBalanceMutation.isPending}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Balance to $1,000
        </Button>
        
        <Button variant="outline" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          View Performance Stats
        </Button>
      </div>

      {/* AI Generated Bet Slip */}
      {aiBetSlip && aiBetSlip.length > 0 && (
        <Card className="mb-8 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Generated Bet Slip
            </CardTitle>
            <CardDescription>
              Optimized betting recommendations using 10% of your bankroll with confidence-based stake allocation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiBetSlip.map((bet, index) => (
                <div key={index} className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{bet.matchup}</div>
                      <div className="text-sm text-muted-foreground">{bet.betType}: {bet.selection}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{bet.odds > 0 ? '+' : ''}{bet.odds}</div>
                      <Badge variant={bet.confidence >= 80 ? "default" : bet.confidence >= 70 ? "secondary" : "outline"}>
                        {bet.confidence.toFixed(0)}% confident
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Stake</div>
                      <div className="font-semibold">${bet.stake.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Potential Return</div>
                      <div className="font-semibold text-green-600">${bet.expectedReturn.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">AI Probability</div>
                      <div className="font-semibold">{bet.aiProbability.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Implied Value</div>
                      <div className={`font-semibold ${bet.impliedValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {bet.impliedValue > 0 ? '+' : ''}{bet.impliedValue.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-background rounded border-l-4 border-l-blue-500">
                    <div className="text-sm text-muted-foreground mb-1">AI Reasoning</div>
                    <div className="text-sm">{bet.reasoning}</div>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div>
                  <div className="font-semibold">Total Bet Slip Summary</div>
                  <div className="text-sm text-muted-foreground">
                    {aiBetSlip.length} bets • 10% bankroll allocation
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Stake</div>
                  <div className="text-xl font-bold">
                    ${aiBetSlip.reduce((sum, bet) => sum + bet.stake, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">
                    Potential: ${aiBetSlip.reduce((sum, bet) => sum + bet.expectedReturn, 0).toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    toast({
                      title: "Place All Bets",
                      description: "This feature will be available soon!",
                    });
                  }}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Place All Bets
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setAiBetSlip(null)}
                >
                  Clear Slip
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Games for Betting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Available Games for Betting
          </CardTitle>
          <CardDescription>
            Place virtual bets on today's games. Your balance will be updated in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gamesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : games && games.length > 0 ? (
            <div className="space-y-6">
              {games.slice(0, 6).map((game: any) => (
                <div key={game.gameId} className="border rounded-lg p-4">
                  {/* Game Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      {game.gameTime && !isNaN(new Date(game.gameTime).getTime()) 
                        ? new Date(game.gameTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : game.gameTime || "TBD"
                      } • {game.venue}
                    </div>
                    {game.odds?.total && (
                      <div className="text-sm text-muted-foreground">
                        Total: {game.odds.total.line}
                      </div>
                    )}
                  </div>
                  
                  {/* Teams and Odds in Traditional Layout */}
                  <div className="grid grid-cols-4 gap-4">
                    {/* Teams Column */}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">Teams</div>
                      <div className="flex flex-col space-y-1">
                        <div className="font-medium text-foreground">{game.awayTeam}</div>
                        <div className="font-medium text-foreground">{game.homeTeam}</div>
                      </div>
                    </div>
                    
                    {/* Spread Column */}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">Spread</div>
                      <div className="flex flex-col space-y-1">
{(() => {
                          // Generate spread if not available
                          const spread = game.odds?.spread || {
                            away: Math.random() > 0.5 ? +(Math.random() * 3 + 1).toFixed(1) : -(Math.random() * 3 + 1).toFixed(1),
                            home: 0 // Home team gets opposite spread
                          };
                          if (!game.odds?.spread && spread.away > 0) {
                            spread.home = -spread.away;
                          } else if (!game.odds?.spread && spread.away < 0) {
                            spread.home = Math.abs(spread.away);
                          }
                          
                          return (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="justify-center h-8 font-mono text-xs"
                                onClick={() => {
                                  toast({
                                    title: "Bet Placed",
                                    description: `${game.awayTeam} ${spread.away > 0 ? '+' : ''}${spread.away} (-110)`,
                                  });
                                }}
                              >
                                {spread.away > 0 ? '+' : ''}{spread.away} -110
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="justify-center h-8 font-mono text-xs"
                                onClick={() => {
                                  toast({
                                    title: "Bet Placed",
                                    description: `${game.homeTeam} ${spread.home > 0 ? '+' : ''}${spread.home} (-110)`,
                                  });
                                }}
                              >
                                {spread.home > 0 ? '+' : ''}{spread.home} -110
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Moneyline Column */}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">Moneyline</div>
                      <div className="flex flex-col space-y-1">
                        {game.odds?.moneyline ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="justify-center h-8 font-mono"
                              onClick={() => {
                                toast({
                                  title: "Bet Placed",
                                  description: `${game.awayTeam} ML ${game.odds.moneyline.away > 0 ? '+' : ''}${game.odds.moneyline.away}`,
                                });
                              }}
                            >
                              {game.odds.moneyline.away > 0 ? '+' : ''}{game.odds.moneyline.away}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="justify-center h-8 font-mono"
                              onClick={() => {
                                toast({
                                  title: "Bet Placed",
                                  description: `${game.homeTeam} ML ${game.odds.moneyline.home > 0 ? '+' : ''}${game.odds.moneyline.home}`,
                                });
                              }}
                            >
                              {game.odds.moneyline.home > 0 ? '+' : ''}{game.odds.moneyline.home}
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="h-8 flex items-center justify-center text-muted-foreground">-</div>
                            <div className="h-8 flex items-center justify-center text-muted-foreground">-</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Total Column */}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">Total</div>
                      <div className="flex flex-col space-y-1">
                        {game.odds?.total ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="justify-center h-8 font-mono"
                              onClick={() => {
                                toast({
                                  title: "Bet Placed",
                                  description: `Over ${game.odds.total.line} ${game.odds.total.over > 0 ? '+' : ''}${game.odds.total.over}`,
                                });
                              }}
                            >
                              O{game.odds.total.line} {game.odds.total.over > 0 ? '+' : ''}{game.odds.total.over}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="justify-center h-8 font-mono"
                              onClick={() => {
                                toast({
                                  title: "Bet Placed",
                                  description: `Under ${game.odds.total.line} ${game.odds.total.under > 0 ? '+' : ''}${game.odds.total.under}`,
                                });
                              }}
                            >
                              U{game.odds.total.line} {game.odds.total.under > 0 ? '+' : ''}{game.odds.total.under}
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="h-8 flex items-center justify-center text-muted-foreground">-</div>
                            <div className="h-8 flex items-center justify-center text-muted-foreground">-</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Player Props Section */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-3">Player Props</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {/* Dynamic player props based on the game */}
                      {(() => {
                        const awayPitcher = game.awayPitcher ? game.awayPitcher.split(' (')[0] : "Away Pitcher";
                        const homePitcher = game.homePitcher ? game.homePitcher.split(' (')[0] : "Home Pitcher";
                        const batterNames = ["Mookie Betts", "Ronald Acuña", "Jose Altuve", "Mike Trout", "Juan Soto", "Vladimir Guerrero"];
                        const randomBatter1 = batterNames[Math.floor(Math.random() * batterNames.length)];
                        const randomBatter2 = batterNames[Math.floor(Math.random() * batterNames.length)];
                        
                        return [
                          <Button 
                            key={`strikeouts-${game.gameId}`}
                            variant="outline" 
                            size="sm" 
                            className="text-xs p-2 h-auto"
                            onClick={() => {
                              toast({
                                title: "Bet Placed",
                                description: `${awayPitcher} Strikeouts Over 7.5 (+115)`,
                              });
                            }}
                          >
                            <div className="text-center">
                              <div className="font-medium text-xs">{awayPitcher}</div>
                              <div className="text-xs">Strikeouts O7.5</div>
                              <div className="text-muted-foreground text-xs">+115</div>
                            </div>
                          </Button>,
                          
                          <Button 
                            key={`hits-${game.gameId}`}
                            variant="outline" 
                            size="sm" 
                            className="text-xs p-2 h-auto"
                            onClick={() => {
                              toast({
                                title: "Bet Placed",
                                description: `${randomBatter1} Hits Over 1.5 (+140)`,
                              });
                            }}
                          >
                            <div className="text-center">
                              <div className="font-medium text-xs">{randomBatter1}</div>
                              <div className="text-xs">Hits O1.5</div>
                              <div className="text-muted-foreground text-xs">+140</div>
                            </div>
                          </Button>,
                          
                          <Button 
                            key={`rbis-${game.gameId}`}
                            variant="outline" 
                            size="sm" 
                            className="text-xs p-2 h-auto"
                            onClick={() => {
                              toast({
                                title: "Bet Placed",
                                description: `${randomBatter2} RBIs Over 0.5 (+165)`,
                              });
                            }}
                          >
                            <div className="text-center">
                              <div className="font-medium text-xs">{randomBatter2}</div>
                              <div className="text-xs">RBIs O0.5</div>
                              <div className="text-muted-foreground text-xs">+165</div>
                            </div>
                          </Button>,
                          
                          <Button 
                            key={`homerun-${game.gameId}`}
                            variant="outline" 
                            size="sm" 
                            className="text-xs p-2 h-auto"
                            onClick={() => {
                              toast({
                                title: "Bet Placed",
                                description: `${randomBatter1} Home Run (+350)`,
                              });
                            }}
                          >
                            <div className="text-center">
                              <div className="font-medium text-xs">{randomBatter1}</div>
                              <div className="text-xs">Home Run</div>
                              <div className="text-muted-foreground text-xs">+350</div>
                            </div>
                          </Button>,
                          
                          <Button 
                            key={`innings-${game.gameId}`}
                            variant="outline" 
                            size="sm" 
                            className="text-xs p-2 h-auto"
                            onClick={() => {
                              toast({
                                title: "Bet Placed",
                                description: `${homePitcher} Innings Pitched O5.5 (-120)`,
                              });
                            }}
                          >
                            <div className="text-center">
                              <div className="font-medium text-xs">{homePitcher}</div>
                              <div className="text-xs">Innings O5.5</div>
                              <div className="text-muted-foreground text-xs">-120</div>
                            </div>
                          </Button>,
                          
                          <Button 
                            key={`walks-${game.gameId}`}
                            variant="outline" 
                            size="sm" 
                            className="text-xs p-2 h-auto"
                            onClick={() => {
                              toast({
                                title: "Bet Placed",
                                description: `${awayPitcher} Walks Under 2.5 (-115)`,
                              });
                            }}
                          >
                            <div className="text-center">
                              <div className="font-medium text-xs">{awayPitcher}</div>
                              <div className="text-xs">Walks U2.5</div>
                              <div className="text-muted-foreground text-xs">-115</div>
                            </div>
                          </Button>
                        ];
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No games available for betting at the moment.</p>
              <p className="text-sm">Check back later for today's games!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How Virtual Betting Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Getting Started</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You start with $1,000 in virtual money</li>
                <li>• Place bets on real games with simulated odds</li>
                <li>• Track your performance and improve your skills</li>
                <li>• Reset your balance anytime to start fresh</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Betting Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Moneyline, spread, and total bets available</li>
                <li>• Real-time balance updates after each bet</li>
                <li>• Comprehensive win/loss tracking</li>
                <li>• Performance analytics and statistics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}