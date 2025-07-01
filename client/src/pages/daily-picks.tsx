import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useBettingSlip } from "@/hooks/use-betting-slip";
import { useBettingSlip as useBettingSlipContext } from "@/contexts/betting-slip-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Link } from "wouter";
import { 
  Target, 
  BarChart3, 
  Crown, 
  Lock, 
  Sparkles,
  TrendingUp,
  ShoppingCart,
  X,
  Edit2
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface DailyPick {
  id: number;
  date: string;
  gameId: string;
  pickType: string;
  selection: string;
  odds: number;
  confidence: number;
  reasoning: string;
  expectedValue: string;
  status: string;
  result?: string | null;
  createdAt: Date | null;
}

export default function DailyPicks() {
  const queryClient = useQueryClient();
  const { addBet } = useBettingSlip();
  const { bets, updateBet, clearBet, clearAllBets, getTotalStake, getTotalPotentialWin } = useBettingSlipContext();
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user has Pro access
  const hasProAccess = user && (user.subscriptionTier === 'pro' || user.subscriptionTier === 'elite');

  // Show upgrade prompt for non-Pro users
  if (!hasProAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-card rounded-lg border p-8">
              <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Pro Feature Required</h1>
              <p className="text-muted-foreground mb-6">
                Daily Picks is a Pro feature that provides AI-powered betting recommendations with detailed analysis and confidence scoring.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Crown className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Upgrade to Pro for $25/month</span>
                </div>
                <Link href="/subscribe">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Continue with the rest of the component for Pro users
  const {
    data: picks,
    isLoading: picksLoading,
    error: picksError,
  } = useQuery<DailyPick[]>({
    queryKey: ["/api/daily-picks"],
  });

  const generatePicksMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/daily-picks/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-picks"] });
      toast({
        title: "Daily picks generated",
        description: "AI has analyzed today's games and created new betting recommendations.",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Unable to generate daily picks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const setResultMutation = useMutation({
    mutationFn: async ({ pickId, result }: { pickId: number; result: string }) => {
      const response = await apiRequest("PATCH", `/api/daily-picks/${pickId}/result`, { result });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-picks"] });
      toast({
        title: "Result updated",
        description: "Pick result has been updated successfully.",
      });
    },
  });

  const placeBetsMutation = useMutation({
    mutationFn: async (betsToPlace: typeof bets) => {
      const promises = betsToPlace.map(bet => 
        apiRequest("POST", "/api/bets", {
          gameId: bet.gameId,
          betType: bet.betType,
          selection: bet.selection,
          odds: bet.odds,
          stake: bet.stake.toString(),
          potentialWin: bet.potentialWin.toString(),
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-bets"] });
      clearAllBets();
      toast({
        title: "Bets placed successfully!",
        description: `${bets.length} bet(s) have been placed for $${getTotalStake().toFixed(2)}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to place bets",
        description: "There was an error placing your bets. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addToBettingSlip = (pick: DailyPick) => {
    const bet = {
      gameId: pick.gameId,
      betType: pick.pickType.toLowerCase(),
      selection: pick.selection,
      odds: pick.odds,
      stake: 0,
      potentialWin: 0,
    };
    
    addBet(bet);
    toast({
      title: "Added to betting slip",
      description: `${pick.selection} has been added to your betting slip.`,
    });
  };

  // Helper functions
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  if (picksError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Picks</h1>
            <p className="text-muted-foreground">Unable to load daily picks. Please try again later.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Daily Picks</h1>
          <p className="text-muted-foreground">
            AI-powered betting recommendations with detailed analysis and confidence scoring
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Pro Feature</span>
          </div>
          <Button
            onClick={() => generatePicksMutation.mutate()}
            disabled={generatePicksMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {generatePicksMutation.isPending ? (
              "Generating..."
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate New Picks
              </>
            )}
          </Button>
        </div>

        {/* Betting Slip Display */}
        {bets.length > 0 && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your Betting Slip
                <Badge variant="secondary" className="ml-auto">
                  {bets.length} {bets.length === 1 ? 'bet' : 'bets'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Review and manage your selected bets. Set stakes and place your bets when ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {bets.map((bet) => (
                  <div key={`${bet.gameId}-${bet.betType}-${bet.selection}`} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{bet.selection}</div>
                        <div className="text-xs text-muted-foreground">{bet.gameId}</div>
                        <div className="text-xs text-blue-600 font-medium">
                          {bet.odds > 0 ? '+' : ''}{bet.odds} odds
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Stake</div>
                          <Input
                            type="number"
                            value={bet.stake}
                            onChange={(e) => {
                              const newStake = parseFloat(e.target.value) || 0;
                              const newPotentialWin = bet.odds > 0 
                                ? newStake * (bet.odds / 100)
                                : newStake * (100 / Math.abs(bet.odds));
                              updateBet(bet.gameId, bet.betType, bet.selection, {
                                stake: newStake,
                                potentialWin: newPotentialWin
                              });
                            }}
                            className="w-20 h-8 text-xs"
                            placeholder="0"
                          />
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Potential Win</div>
                          <div className="text-xs font-semibold text-blue-600">
                            ${bet.potentialWin.toFixed(2)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => clearBet(bet.gameId, bet.betType, bet.selection)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t bg-muted/20">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold">Total Stake: ${getTotalStake().toFixed(2)}</div>
                    <div className="text-sm text-blue-600 font-semibold">
                      Potential Win: ${getTotalPotentialWin().toFixed(2)}
                    </div>
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={getTotalStake() === 0 || placeBetsMutation.isPending}
                    onClick={() => placeBetsMutation.mutate(bets)}
                  >
                    {placeBetsMutation.isPending ? "Placing Bets..." : `Place Bets ($${getTotalStake().toFixed(2)})`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {picksLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : picks && picks.length > 0 ? (
          <div className="space-y-6">
            {picks.map((pick) => (
              <Card key={pick.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Target className="h-5 w-5 text-primary" />
                        <span>{pick.selection}</span>
                        <Badge variant="outline" className="ml-2">
                          {pick.pickType}
                        </Badge>
                        {pick.result && (
                          <Badge 
                            variant={pick.result === 'WIN' ? 'default' : pick.result === 'LOSS' ? 'destructive' : 'secondary'}
                            className="ml-2"
                          >
                            {pick.result}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Game ID: {pick.gameId}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {formatOdds(pick.odds)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercentage(pick.confidence)} confidence
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analysis</span>
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {pick.reasoning}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">Expected Value</div>
                          <div className="text-lg font-bold text-green-600">
                            {pick.expectedValue}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Status</div>
                          <Badge variant={pick.status === 'active' ? 'default' : 'secondary'}>
                            {pick.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!pick.result && (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setResultMutation.mutate({ pickId: pick.id, result: 'WIN' })}
                              disabled={setResultMutation.isPending}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              Win
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setResultMutation.mutate({ pickId: pick.id, result: 'LOSS' })}
                              disabled={setResultMutation.isPending}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              Loss
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setResultMutation.mutate({ pickId: pick.id, result: 'PUSH' })}
                              disabled={setResultMutation.isPending}
                              className="text-gray-600 border-gray-600 hover:bg-gray-50"
                            >
                              Push
                            </Button>
                          </div>
                        )}
                        <Button
                          size="sm"
                          onClick={() => addToBettingSlip(pick)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Add to Slip
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No picks available</h3>
            <p className="text-muted-foreground mb-4">
              Generate AI-powered daily picks to get started with your betting strategy.
            </p>
            <Button
              onClick={() => generatePicksMutation.mutate()}
              disabled={generatePicksMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {generatePicksMutation.isPending ? (
                "Generating..."
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Daily Picks
                </>
              )}
            </Button>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}