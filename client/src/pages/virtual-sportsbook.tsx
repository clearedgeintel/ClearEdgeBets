import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, TrendingUp, TrendingDown, RotateCcw, Target, Trophy, BarChart3, LogIn, Brain, Calculator, Trash2, Plus, Minus, Receipt, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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

interface BettingSlipItem {
  id: string;
  gameId: string;
  matchup: string;
  betType: string;
  selection: string;
  odds: number;
  stake: number;
  potentialWin: number;
  addedAt: Date;
}

interface BettingSlip {
  id: string;
  items: BettingSlipItem[];
  totalStake: number;
  totalPotentialWin: number;
  createdAt: Date;
  status: 'draft' | 'placed' | 'settled';
  betType: 'individual' | 'parlay';
  parlayOdds?: number;
  parlayStake?: number;
  parlayPayout?: number;
}

export default function VirtualSportsbook() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [aiBetSlip, setAiBetSlip] = useState<AIBetRecommendation[] | null>(null);
  const [isGeneratingAIBets, setIsGeneratingAIBets] = useState(false);

  // Mutation to save virtual bets to database
  const saveBetsMutation = useMutation({
    mutationFn: async (betsToSave: { gameId: string; betType: string; selection: string; odds: number; stake: number; potentialWin: number; }[]) => {
      // Use test user ID (999) for virtual betting when not authenticated
      const virtualUserId = user?.id || 999;
      
      const promises = betsToSave.map(bet => 
        apiRequest("POST", "/api/virtual/bets", {
          userId: virtualUserId,
          gameId: bet.gameId,
          betType: bet.betType,
          selection: bet.selection,
          odds: bet.odds,
          stake: bet.stake,
          potentialWin: bet.potentialWin,
          status: "pending"
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidate both the specific user's virtual bets and the balance
      const virtualUserId = user?.id || 999;
      queryClient.invalidateQueries({ queryKey: ["/api/virtual/bets", virtualUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error) => {
      console.error("Error saving virtual bets:", error);
      toast({
        title: "Error",
        description: "Failed to place virtual bets. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Betting slip state management
  const [bettingSlips, setBettingSlips] = useState<BettingSlip[]>([]);
  const [currentSlip, setCurrentSlip] = useState<BettingSlip | null>(null);
  const [showBettingSlip, setShowBettingSlip] = useState(false);
  const [isParlayMode, setIsParlayMode] = useState(false);
  const [parlayStake, setParlayStake] = useState<number>(10);
  
  // Track selected bets
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());

  // Helper function to check if bet is selected
  const getBetState = (gameId: string, betType: string, selection: string, originalOdds: number) => {
    const betKey = `${gameId}_${betType}_${selection}`;
    const isSelected = selectedBets.has(betKey);
    return { isSelected, displayOdds: originalOdds, betKey };
  };

  // Helper functions for betting slip management
  const createNewBettingSlip = (): BettingSlip => {
    const newSlip: BettingSlip = {
      id: `slip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      items: [],
      totalStake: 0,
      totalPotentialWin: 0,
      createdAt: new Date(),
      status: 'draft',
      betType: isParlayMode ? 'parlay' : 'individual',
      parlayOdds: 0,
      parlayStake: 0,
      parlayPayout: 0
    };
    return newSlip;
  };

  // Calculate parlay odds by multiplying all individual odds
  const calculateParlayOdds = (items: BettingSlipItem[]): number => {
    if (items.length === 0) return 0;
    
    // Filter out any items with invalid odds
    const validItems = items.filter(item => item.odds !== 0 && !isNaN(item.odds));
    if (validItems.length === 0) return 0;
    
    // Convert American odds to decimal odds, multiply them, then convert back
    let combinedDecimalOdds = 1;
    validItems.forEach(item => {
      const decimalOdds = item.odds > 0 
        ? (item.odds / 100) + 1 
        : (100 / Math.abs(item.odds)) + 1;
      combinedDecimalOdds *= decimalOdds;
    });
    
    // Convert back to American odds
    if (combinedDecimalOdds === 1) return 0;
    
    const americanOdds = combinedDecimalOdds >= 2 
      ? Math.round((combinedDecimalOdds - 1) * 100)
      : Math.round(-100 / (combinedDecimalOdds - 1));
    
    return isNaN(americanOdds) || !isFinite(americanOdds) ? 0 : americanOdds;
  };

  // Calculate parlay payout
  const calculateParlayPayout = (stake: number, odds: number): number => {
    if (isNaN(stake) || !isFinite(stake) || stake <= 0) return 0;
    if (isNaN(odds) || !isFinite(odds) || odds === 0) return stake; // Return stake if odds are invalid
    
    if (odds > 0) {
      return stake + (stake * odds / 100);
    } else {
      return stake + (stake * 100 / Math.abs(odds));
    }
  };

  const addToBettingSlip = (gameId: string, matchup: string, betType: string, selection: string, odds: number) => {
    const betKey = `${gameId}_${betType}_${selection}`;
    
    // Check if bet is already selected
    if (selectedBets.has(betKey)) {
      toast({
        title: "Bet Already Selected",
        description: "This bet is already in your betting slip.",
        variant: "destructive",
      });
      return;
    }

    let slip = currentSlip;
    
    // Create new slip if none exists
    if (!slip) {
      slip = createNewBettingSlip();
      setCurrentSlip(slip);
      setBettingSlips(prev => [...prev, slip!]);
    }

    const newBet: BettingSlipItem = {
      id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      matchup,
      betType,
      selection,
      odds,
      stake: 0,
      potentialWin: 0,
      addedAt: new Date()
    };

    const updatedSlip = {
      ...slip,
      items: [...slip.items, newBet]
    };

    // Add to selected bets set
    setSelectedBets(prev => {
      const newSet = new Set(prev);
      newSet.add(betKey);
      return newSet;
    });

    setCurrentSlip(updatedSlip);
    setBettingSlips(prev => prev.map(s => s.id === slip!.id ? updatedSlip : s));
    // Remove auto-show betting slip
    // setShowBettingSlip(true);

    toast({
      title: "Added to Betting Slip",
      description: `${selection} added to your betting slip.`,
    });
  };

  const updateBetStake = (betId: string, stake: number) => {
    if (!currentSlip) return;

    const updatedItems = currentSlip.items.map(item => {
      if (item.id === betId) {
        const potentialWin = item.odds === 0 ? 0 : stake * (item.odds > 0 ? item.odds / 100 : 100 / Math.abs(item.odds));
        return { ...item, stake, potentialWin };
      }
      return item;
    });

    const totalStake = updatedItems.reduce((sum, item) => sum + item.stake, 0);
    const totalPotentialWin = updatedItems.reduce((sum, item) => sum + item.potentialWin, 0);

    const updatedSlip = {
      ...currentSlip,
      items: updatedItems,
      totalStake,
      totalPotentialWin
    };

    setCurrentSlip(updatedSlip);
    setBettingSlips(prev => prev.map(s => s.id === currentSlip.id ? updatedSlip : s));
  };

  const removeBetFromSlip = (betId: string) => {
    if (!currentSlip) return;

    // Find the bet being removed to clear its selected state
    const removedBet = currentSlip.items.find(item => item.id === betId);
    if (removedBet) {
      const betKey = `${removedBet.gameId}_${removedBet.betType}_${removedBet.selection}`;
      setSelectedBets(prev => {
        const newSet = new Set(prev);
        newSet.delete(betKey);
        return newSet;
      });

    }

    const updatedItems = currentSlip.items.filter(item => item.id !== betId);
    
    if (updatedItems.length === 0) {
      // Remove empty slip
      setBettingSlips(prev => prev.filter(s => s.id !== currentSlip.id));
      setCurrentSlip(null);
      setShowBettingSlip(false);
      return;
    }

    const totalStake = updatedItems.reduce((sum, item) => sum + item.stake, 0);
    const totalPotentialWin = updatedItems.reduce((sum, item) => sum + item.potentialWin, 0);

    const updatedSlip = {
      ...currentSlip,
      items: updatedItems,
      totalStake,
      totalPotentialWin
    };

    setCurrentSlip(updatedSlip);
    setBettingSlips(prev => prev.map(s => s.id === currentSlip.id ? updatedSlip : s));
  };

  // Virtual balance mutation (reuse existing endpoint)
  const initializeVirtualBalanceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/user/virtual-balance/reset");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      toast({
        title: "Virtual Sportsbook Initialized",
        description: "Your virtual balance is ready! Start with $1,000.",
      });
    },
  });

  // Fetch user's virtual balance and stats
  const { data: balanceData, isLoading: balanceLoading } = useQuery<BalanceData>({
    queryKey: ["/api/user/balance", user?.id || 999],
    queryFn: async () => {
      const virtualUserId = user?.id || 999;
      const response = await fetch(`/api/user/balance?userId=${virtualUserId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    retry: false,
  });

  // Fetch games for selected date
  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const dateParam = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/api/games?date=${dateParam}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch user's virtual bets
  const { data: virtualBets = [], isLoading: virtualBetsLoading } = useQuery({
    queryKey: ["/api/virtual/bets", user?.id || 999],
    queryFn: async () => {
      const virtualUserId = user?.id || 999;

      const response = await fetch(`/api/virtual/bets?userId=${virtualUserId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const data = await response.json();

      return data;
    },
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

  // Initialize virtual balance if needed
  const initializeBalance = () => {
    if (user && !balanceData) {
      initializeVirtualBalanceMutation.mutate();
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
        
        // Calculate implied probability and value with safety checks
        const impliedProbability = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
        const aiProbability = confidence / 100;
        
        // Prevent division by zero and ensure finite values
        let impliedValue = 0;
        if (impliedProbability > 0 && isFinite(impliedProbability)) {
          impliedValue = ((aiProbability - impliedProbability) / impliedProbability) * 100;
          // Cap implied value to reasonable range
          impliedValue = Math.max(-100, Math.min(1000, impliedValue));
        }
        
        // Calculate expected return with safety checks
        let expectedReturn = stake;
        if (odds > 0) {
          expectedReturn = stake * (odds / 100) + stake;
        } else if (odds < 0) {
          expectedReturn = stake * (100 / Math.abs(odds)) + stake;
        }
        
        // Ensure finite values
        if (!isFinite(expectedReturn)) {
          expectedReturn = stake;
        }
        
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
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Virtual Sportsbook
            </CardTitle>
            <CardDescription>
              Sign in to start with $1,000 virtual money for practice betting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                You need to be signed in to access the virtual sportsbook.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'} 
                className="w-full"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Start
              </Button>
            </div>
            
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
      {/* Header with Date Picker */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Virtual Sportsbook
            </h1>
            <p className="text-muted-foreground">
              Practice your betting skills with simulated money. Start with $1,000 and track your performance!
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Games for</div>
              <div className="text-lg font-semibold">
                {format(selectedDate, "EEEE, MMMM d")}
              </div>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-48 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Virtual Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
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
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
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
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/virtual-performance'}
        >
          <BarChart3 className="h-4 w-4" />
          View Performance Stats
        </Button>
      </div>

      {/* My Virtual Bets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            My Virtual Bets
            <Badge variant="secondary" className="ml-auto">
              {virtualBets?.length || 0} {virtualBets?.length === 1 ? 'bet' : 'bets'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Track all your virtual bets and their profit/loss results. This is your complete betting history for paper trading.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {virtualBets && virtualBets.length > 0 ? (
            <div className="space-y-4">
              {virtualBets.map((bet: any) => {
                const stakeAmount = parseFloat(bet.stake);
                const potentialWinAmount = parseFloat(bet.potentialWin);
                const actualWinAmount = bet.actualWin ? parseFloat(bet.actualWin) : 0;
                
                // Calculate profit/loss
                let profitLoss = 0;
                if (bet.status === 'settled') {
                  if (bet.result === 'win') {
                    profitLoss = actualWinAmount; // Pure profit (not including stake back)
                  } else if (bet.result === 'loss') {
                    profitLoss = -stakeAmount; // Loss is negative stake
                  } else if (bet.result === 'push') {
                    profitLoss = 0; // Push means no profit/loss
                  }
                }
                
                return (
                  <div key={bet.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold">{bet.selection}</div>
                        <div className="text-sm text-muted-foreground">
                          {bet.gameId.replace(/_/g, ' vs ')} • {bet.betType}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {bet.placedAt ? new Date(bet.placedAt).toLocaleDateString() : 'Unknown'} • Odds: {bet.odds > 0 ? '+' : ''}{bet.odds}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            bet.status === 'settled' 
                              ? bet.result === 'win' 
                                ? 'default' 
                                : bet.result === 'loss' 
                                  ? 'destructive' 
                                  : 'secondary'
                              : 'outline'
                          }
                        >
                          {bet.status === 'settled' 
                            ? bet.result?.toUpperCase() || 'SETTLED'
                            : bet.status.toUpperCase()
                          }
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Stake</div>
                        <div className="font-medium">${stakeAmount.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Potential Win</div>
                        <div className="font-medium text-blue-600">${potentialWinAmount.toFixed(2)}</div>
                      </div>
                      {bet.status === 'settled' && (
                        <>
                          <div>
                            <div className="text-muted-foreground">Actual Win</div>
                            <div className="font-medium">${actualWinAmount.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Profit/Loss</div>
                            <div className={`font-medium ${
                              profitLoss > 0 
                                ? 'text-green-600' 
                                : profitLoss < 0 
                                  ? 'text-red-600' 
                                  : 'text-muted-foreground'
                            }`}>
                              {profitLoss > 0 ? '+' : ''}${profitLoss.toFixed(2)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {bet.notes && (
                      <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                        <div className="text-muted-foreground mb-1">Notes:</div>
                        <div>{bet.notes}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No virtual bets yet.</p>
              <p className="text-sm">Start by placing your first virtual bet above!</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                      <div className="font-semibold text-blue-600">${bet.expectedReturn.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">AI Probability</div>
                      <div className="font-semibold">{bet.aiProbability.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Implied Value</div>
                      <div className={`font-semibold ${bet.impliedValue > 0 ? 'text-blue-600' : 'text-red-600'}`}>
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
                  <div className="text-sm text-blue-600">
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

      {/* Betting Slip Section */}
      {currentSlip && currentSlip.items.length > 0 && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Your Betting Slip
              <Badge variant="secondary" className="ml-auto">
                {currentSlip.items.length} {currentSlip.items.length === 1 ? 'bet' : 'bets'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Review and manage your selected bets. Set stakes and place your bets when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {currentSlip.items.map((bet) => (
                <div key={bet.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{bet.selection}</div>
                      <div className="text-xs text-muted-foreground">{bet.matchup}</div>
                      <div className="text-xs text-blue-600 font-medium">
                        {bet.odds > 0 ? '+' : ''}{bet.odds} odds
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <input
                          type="number"
                          placeholder="$0"
                          value={bet.stake || ''}
                          onChange={(e) => {
                            const stake = parseFloat(e.target.value) || 0;
                            updateBetStake(bet.id, stake);
                          }}
                          className="w-20 px-2 py-1 text-sm border rounded text-right bg-background text-foreground border-border"
                          min="0"
                          step="1"
                        />
                        {bet.stake > 0 && (
                          <div className="text-xs text-blue-600 font-medium">
                            Win: ${bet.potentialWin.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBetFromSlip(bet.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Parlay Toggle */}
            {currentSlip.items.length > 1 && (
              <div className="px-4 py-3 border-t bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="parlayToggle"
                        checked={isParlayMode}
                        onChange={(e) => {
                          setIsParlayMode(e.target.checked);
                          if (currentSlip) {
                            currentSlip.betType = e.target.checked ? 'parlay' : 'individual';
                            currentSlip.parlayOdds = e.target.checked ? calculateParlayOdds(currentSlip.items) : 0;
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor="parlayToggle" className="font-medium cursor-pointer">
                        Parlay Bet
                      </Label>
                    </div>
                    {isParlayMode && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {currentSlip.items.length} legs
                      </Badge>
                    )}
                  </div>
                  {isParlayMode && (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-700">
                        {calculateParlayOdds(currentSlip.items) > 0 ? '+' : ''}{calculateParlayOdds(currentSlip.items)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Combined odds
                      </div>
                    </div>
                  )}
                </div>
                
                {isParlayMode && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="parlayStake" className="text-sm font-medium">
                        Parlay Stake:
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">$</span>
                        <Input
                          id="parlayStake"
                          type="number"
                          placeholder="10"
                          value={parlayStake}
                          onChange={(e) => setParlayStake(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm bg-background text-foreground border-border"
                          min="0"
                          step="1"
                        />
                      </div>
                      {parlayStake > 0 && (
                        <div className="text-sm text-blue-600 font-medium">
                          Potential Win: ${calculateParlayPayout(parlayStake, calculateParlayOdds(currentSlip.items)).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Betting Slip Summary */}
            <div className="p-4 bg-muted/50 border-t">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold">
                    {isParlayMode ? 'Parlay Total' : 'Individual Bets Total'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentSlip.items.length} bets selected
                    {isParlayMode && <span className="ml-1 text-blue-600">• Parlay</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    Stake: ${isParlayMode ? parlayStake.toFixed(2) : currentSlip.totalStake.toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    Potential Win: ${isParlayMode 
                      ? calculateParlayPayout(parlayStake, calculateParlayOdds(currentSlip.items)).toFixed(2)
                      : currentSlip.totalPotentialWin.toFixed(2)
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isParlayMode ? parlayStake === 0 : currentSlip.totalStake === 0 || saveBetsMutation.isPending}
                  onClick={() => {
                    const totalStake = isParlayMode ? parlayStake : currentSlip.totalStake;
                    const betDescription = isParlayMode 
                      ? `Parlay bet (${currentSlip.items.length} legs)` 
                      : `${currentSlip.items.length} individual bets`;
                    
                    // Prepare bets for saving to database
                    const betsToSave = currentSlip.items.map(item => ({
                      gameId: item.gameId,
                      betType: isParlayMode ? 'parlay' : item.betType,
                      selection: item.selection,
                      odds: isParlayMode ? calculateParlayOdds(currentSlip.items) : item.odds,
                      stake: isParlayMode ? parlayStake / currentSlip.items.length : item.stake,
                      potentialWin: isParlayMode ? calculateParlayPayout(parlayStake, calculateParlayOdds(currentSlip.items)) : item.potentialWin
                    }));


                    
                    // Save bets to database
                    saveBetsMutation.mutate(betsToSave, {
                      onSuccess: () => {
                        toast({
                          title: "Bets Placed!",
                          description: `${betDescription} placed for $${totalStake.toFixed(2)}`,
                        });
                        
                        // Clear all selected bets
                        setSelectedBets(new Set());
                        
                        setCurrentSlip(null);
                        setBettingSlips(prev => prev.filter(s => s.id !== currentSlip.id));
                        setIsParlayMode(false);
                        setParlayStake(10);
                      }
                    });
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {saveBetsMutation.isPending 
                    ? "Placing Bets..." 
                    : isParlayMode 
                      ? `Place Parlay ($${parlayStake.toFixed(2)})` 
                      : `Place Bets ($${currentSlip.totalStake.toFixed(2)})`
                  }
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setCurrentSlip(null);
                    setBettingSlips(prev => prev.filter(s => s.id !== currentSlip.id));
                  }}
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
                          // Generate realistic MLB run line spreads
                          const runLines = [1.5, 2.5]; // Common MLB run lines
                          const randomLine = runLines[Math.floor(Math.random() * runLines.length)];
                          const spread = game.odds?.spread || {
                            away: Math.random() > 0.5 ? +randomLine : -randomLine,
                            home: 0
                          };
                          if (!game.odds?.spread) {
                            spread.home = -spread.away; // Home team gets opposite
                          }
                          
                          const awaySpreadSelection = `${game.awayTeam} ${spread.away > 0 ? '+' : ''}${spread.away}`;
                          const homeSpreadSelection = `${game.homeTeam} ${spread.home > 0 ? '+' : ''}${spread.home}`;
                          const awayBetState = getBetState(game.gameId, "spread", awaySpreadSelection, -110);
                          const homeBetState = getBetState(game.gameId, "spread", homeSpreadSelection, -110);

                          return (
                            <>
                              <Button 
                                variant={awayBetState.isSelected ? "default" : "outline"} 
                                size="sm" 
                                className={`justify-center h-6 px-2 font-mono text-xs ${
                                  awayBetState.isSelected 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : ""
                                }`}
                                disabled={awayBetState.isSelected}
                                onClick={() => {
                                  addToBettingSlip(
                                    game.gameId, 
                                    `${game.awayTeam} @ ${game.homeTeam}`, 
                                    "spread", 
                                    awaySpreadSelection, 
                                    -110
                                  );
                                }}
                              >
                                {spread.away > 0 ? '+' : ''}{spread.away} {awayBetState.displayOdds > 0 ? '+' : ''}{awayBetState.displayOdds}
                              </Button>
                              <Button 
                                variant={homeBetState.isSelected ? "default" : "outline"} 
                                size="sm" 
                                className={`justify-center h-6 px-2 font-mono text-xs ${
                                  homeBetState.isSelected 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : ""
                                }`}
                                disabled={homeBetState.isSelected}
                                onClick={() => {
                                  addToBettingSlip(
                                    game.gameId, 
                                    `${game.awayTeam} @ ${game.homeTeam}`, 
                                    "spread", 
                                    homeSpreadSelection, 
                                    -110
                                  );
                                }}
                              >
                                {spread.home > 0 ? '+' : ''}{spread.home} {homeBetState.displayOdds > 0 ? '+' : ''}{homeBetState.displayOdds}
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Moneyline Column */}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">M/L</div>
                      <div className="flex flex-col space-y-1">
{(() => {
                          // Generate realistic MLB moneyline odds
                          const moneyline = game.odds?.moneyline || (() => {
                            const favoriteOdds = [-110, -120, -130, -140, -150, -160, -170, -180];
                            const underdogOdds = [110, 120, 130, 140, 150, 160, 170, 180];
                            const isFavoriteAway = Math.random() > 0.5;
                            
                            if (isFavoriteAway) {
                              return {
                                away: favoriteOdds[Math.floor(Math.random() * favoriteOdds.length)],
                                home: underdogOdds[Math.floor(Math.random() * underdogOdds.length)]
                              };
                            } else {
                              return {
                                away: underdogOdds[Math.floor(Math.random() * underdogOdds.length)],
                                home: favoriteOdds[Math.floor(Math.random() * favoriteOdds.length)]
                              };
                            }
                          })();
                          
                          const awayMLSelection = `${game.awayTeam} ML`;
                          const homeMLSelection = `${game.homeTeam} ML`;
                          const awayMLBetState = getBetState(game.gameId, "moneyline", awayMLSelection, moneyline.away);
                          const homeMLBetState = getBetState(game.gameId, "moneyline", homeMLSelection, moneyline.home);

                          return (
                            <>
                              <Button 
                                variant={awayMLBetState.isSelected ? "default" : "outline"} 
                                size="sm" 
                                className={`justify-center h-6 px-2 font-mono text-xs ${
                                  awayMLBetState.isSelected 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : ""
                                }`}
                                disabled={awayMLBetState.isSelected}
                                onClick={() => {
                                  addToBettingSlip(
                                    game.gameId, 
                                    `${game.awayTeam} @ ${game.homeTeam}`, 
                                    "moneyline", 
                                    awayMLSelection, 
                                    moneyline.away
                                  );
                                }}
                              >
                                {awayMLBetState.displayOdds > 0 ? '+' : ''}{awayMLBetState.displayOdds}
                              </Button>
                              <Button 
                                variant={homeMLBetState.isSelected ? "default" : "outline"} 
                                size="sm" 
                                className={`justify-center h-6 px-2 font-mono text-xs ${
                                  homeMLBetState.isSelected 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : ""
                                }`}
                                disabled={homeMLBetState.isSelected}
                                onClick={() => {
                                  addToBettingSlip(
                                    game.gameId, 
                                    `${game.awayTeam} @ ${game.homeTeam}`, 
                                    "moneyline", 
                                    homeMLSelection, 
                                    moneyline.home
                                  );
                                }}
                              >
                                {homeMLBetState.displayOdds > 0 ? '+' : ''}{homeMLBetState.displayOdds}
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Total Runs Column */}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">Runs</div>
                      <div className="flex flex-col space-y-1">
{(() => {
                          // Generate realistic MLB total runs odds
                          const total = game.odds?.total || (() => {
                            const totalLines = [7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 10.5]; // Common MLB totals
                            const overUnderOdds = [-105, -110, -115, -120, 105, 110, 115, 120];
                            const line = totalLines[Math.floor(Math.random() * totalLines.length)];
                            const overOdds = overUnderOdds[Math.floor(Math.random() * overUnderOdds.length)];
                            const underOdds = overOdds > 0 ? -overOdds - 10 : Math.abs(overOdds) + 10;
                            
                            return {
                              line,
                              over: overOdds,
                              under: underOdds
                            };
                          })();
                          
                          const overSelection = `Over ${total.line}`;
                          const underSelection = `Under ${total.line}`;
                          const overBetState = getBetState(game.gameId, "total", overSelection, total.over);
                          const underBetState = getBetState(game.gameId, "total", underSelection, total.under);

                          return (
                            <>
                              <Button 
                                variant={overBetState.isSelected ? "default" : "outline"} 
                                size="sm" 
                                className={`justify-center h-6 px-2 font-mono text-xs ${
                                  overBetState.isSelected 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : ""
                                }`}
                                disabled={overBetState.isSelected}
                                onClick={() => {
                                  addToBettingSlip(
                                    game.gameId, 
                                    `${game.awayTeam} @ ${game.homeTeam}`, 
                                    "total", 
                                    overSelection, 
                                    total.over
                                  );
                                }}
                              >
                                O{total.line} {overBetState.displayOdds > 0 ? '+' : ''}{overBetState.displayOdds}
                              </Button>
                              <Button 
                                variant={underBetState.isSelected ? "default" : "outline"} 
                                size="sm" 
                                className={`justify-center h-6 px-2 font-mono text-xs ${
                                  underBetState.isSelected 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : ""
                                }`}
                                disabled={underBetState.isSelected}
                                onClick={() => {
                                  addToBettingSlip(
                                    game.gameId, 
                                    `${game.awayTeam} @ ${game.homeTeam}`, 
                                    "total", 
                                    underSelection, 
                                    total.under
                                  );
                                }}
                              >
                                U{total.line} {underBetState.displayOdds > 0 ? '+' : ''}{underBetState.displayOdds}
                              </Button>
                            </>
                          );
                        })()}
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
                            className="text-xs p-1 h-auto"
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
                            className="text-xs p-1 h-auto"
                            onClick={() => {
                              addToBettingSlip(
                                game.gameId, 
                                `${game.awayTeam} @ ${game.homeTeam}`, 
                                "prop", 
                                `${randomBatter1} Hits Over 1.5`, 
                                140
                              );
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
                            className="text-xs p-1 h-auto"
                            onClick={() => {
                              addToBettingSlip(
                                game.gameId, 
                                `${game.awayTeam} @ ${game.homeTeam}`, 
                                "prop", 
                                `${randomBatter2} RBIs Over 0.5`, 
                                165
                              );
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
                            className="text-xs p-1 h-auto"
                            onClick={() => {
                              addToBettingSlip(
                                game.gameId, 
                                `${game.awayTeam} @ ${game.homeTeam}`, 
                                "prop", 
                                `${randomBatter1} Home Run`, 
                                350
                              );
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
                            className="text-xs p-1 h-auto"
                            onClick={() => {
                              addToBettingSlip(
                                game.gameId, 
                                `${game.awayTeam} @ ${game.homeTeam}`, 
                                "prop", 
                                `${homePitcher} Innings O5.5`, 
                                -120
                              );
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
                            className="text-xs p-1 h-auto"
                            onClick={() => {
                              addToBettingSlip(
                                game.gameId, 
                                `${game.awayTeam} @ ${game.homeTeam}`, 
                                "prop", 
                                `${awayPitcher} Walks U2.5`, 
                                -115
                              );
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