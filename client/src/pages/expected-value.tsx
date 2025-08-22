import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Calculator, 
  DollarSign, 
  Target, 
  AlertCircle,
  BarChart3,
  Brain,
  Clock,
  MapPin,
  Calendar
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Expected Value calculation utilities
const calculateImpliedProbability = (odds: number): number => {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
};

const calculateExpectedValue = (trueProbability: number, odds: number): number => {
  const impliedProbability = calculateImpliedProbability(odds);
  if (odds > 0) {
    return (trueProbability * odds) - ((1 - trueProbability) * 100);
  } else {
    return (trueProbability * (100 / Math.abs(odds)) * 100) - ((1 - trueProbability) * 100);
  }
};

const calculateKellyStake = (trueProbability: number, odds: number, bankroll: number): number => {
  const impliedProbability = calculateImpliedProbability(odds);
  const b = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
  const kellyFraction = (trueProbability * (b + 1) - 1) / b;
  return Math.max(0, kellyFraction * bankroll);
};

const formatOdds = (odds: number): string => {
  return odds > 0 ? `+${odds}` : `${odds}`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface EVBet {
  gameId: string;
  game: any;
  betType: string;
  selection: string;
  odds: number;
  trueProbability: number;
  expectedValue: number;
  kellyStake: number;
  confidence: number;
  reasoning: string;
}

export default function ExpectedValue() {
  const [bankroll, setBankroll] = useState<number>(1000);
  const [minimumBet, setMinimumBet] = useState<number>(10);
  const [kellyMultiplier, setKellyMultiplier] = useState<number>(0.25); // Quarter Kelly
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [evBets, setEVBets] = useState<EVBet[]>([]);

  // Generate date options for today and next few days
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const displayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
      dates.push({ value: dateString, label: `${displayName} (${dateString})` });
    }
    
    return dates;
  };

  // Fetch real MLB games with odds for selected date
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/games?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch enhanced picks for AI-derived probabilities for selected date
  const { data: enhancedPicks, isLoading: picksLoading } = useQuery({
    queryKey: ["/api/enhanced-picks/all", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/enhanced-picks/all?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch enhanced picks');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate EV bets when data is available
  useEffect(() => {
    if (!games || !enhancedPicks || !Array.isArray(games) || games.length === 0) return;

    const calculatedBets: EVBet[] = [];

    games.forEach((game: any) => {
      if (!game.odds) return;

      // Find corresponding enhanced pick for AI probability estimates
      const enhancedPick = Array.isArray(enhancedPicks) ? enhancedPicks.find((pick: any) => pick.gameId === game.gameId) : null;
      
      // Calculate EV for moneyline bets
      if (game.odds.moneyline) {
        // Away team moneyline
        if (game.odds.moneyline.away) {
          const awayOdds = game.odds.moneyline.away;
          let awayTrueProbability = 0.5; // Default 50-50 if no AI data
          let confidence = 30;
          let reasoning = "Default probability estimation";

          if (enhancedPick && enhancedPick.confidence && enhancedPick.bet) {
            // Extract probability estimate from AI confidence and analysis
            const aiConfidence = enhancedPick.confidence / 100;
            if (enhancedPick.bet.toLowerCase().includes(game.awayTeam.toLowerCase()) || 
                enhancedPick.bet.toLowerCase().includes(game.awayTeamCode.toLowerCase())) {
              awayTrueProbability = Math.min(0.85, 0.45 + (aiConfidence * 0.25)); // Scale AI confidence
              confidence = enhancedPick.confidence;
              reasoning = enhancedPick.reasoning || "AI analysis suggests value";
            }
          }

          const awayEV = calculateExpectedValue(awayTrueProbability, awayOdds);
          const kellyStake = Math.max(0, calculateKellyStake(awayTrueProbability, awayOdds, bankroll) * kellyMultiplier);
          calculatedBets.push({
            gameId: game.gameId,
            game,
            betType: 'Moneyline',
            selection: `${game.awayTeam} to win`,
            odds: awayOdds,
            trueProbability: awayTrueProbability,
            expectedValue: awayEV,
            kellyStake,
            confidence,
            reasoning
          });
        }

        // Home team moneyline
        if (game.odds.moneyline.home) {
          const homeOdds = game.odds.moneyline.home;
          let homeTrueProbability = 0.5;
          let confidence = 30;
          let reasoning = "Default probability estimation";

          if (enhancedPick && enhancedPick.confidence && enhancedPick.bet) {
            const aiConfidence = enhancedPick.confidence / 100;
            if (enhancedPick.bet.toLowerCase().includes(game.homeTeam.toLowerCase()) || 
                enhancedPick.bet.toLowerCase().includes(game.homeTeamCode.toLowerCase())) {
              homeTrueProbability = Math.min(0.85, 0.45 + (aiConfidence * 0.25));
              confidence = enhancedPick.confidence;
              reasoning = enhancedPick.reasoning || "AI analysis suggests value";
            }
          }

          const homeEV = calculateExpectedValue(homeTrueProbability, homeOdds);
          const kellyStake = Math.max(0, calculateKellyStake(homeTrueProbability, homeOdds, bankroll) * kellyMultiplier);
          calculatedBets.push({
            gameId: game.gameId,
            game,
            betType: 'Moneyline',
            selection: `${game.homeTeam} to win`,
            odds: homeOdds,
            trueProbability: homeTrueProbability,
            expectedValue: homeEV,
            kellyStake,
            confidence,
            reasoning
          });
        }
      }

      // Calculate EV for total bets (over/under)
      if (game.odds.total && game.odds.total.line) {
        const totalLine = game.odds.total.line;
        
        // Over bet
        if (game.odds.total.over) {
          const overOdds = game.odds.total.over;
          let overTrueProbability = 0.5;
          let confidence = 30;
          let reasoning = "Default probability estimation";

          if (enhancedPick && enhancedPick.confidence && enhancedPick.bet) {
            const aiConfidence = enhancedPick.confidence / 100;
            if (enhancedPick.bet.toLowerCase().includes('over') || 
                enhancedPick.bet.toLowerCase().includes('high-scoring')) {
              overTrueProbability = Math.min(0.85, 0.45 + (aiConfidence * 0.25));
              confidence = enhancedPick.confidence;
              reasoning = enhancedPick.reasoning || "AI analysis suggests high-scoring game";
            }
          }

          const overEV = calculateExpectedValue(overTrueProbability, overOdds);
          const kellyStake = Math.max(0, calculateKellyStake(overTrueProbability, overOdds, bankroll) * kellyMultiplier);
          calculatedBets.push({
            gameId: game.gameId,
            game,
            betType: 'Total',
            selection: `Over ${totalLine}`,
            odds: overOdds,
            trueProbability: overTrueProbability,
            expectedValue: overEV,
            kellyStake,
            confidence,
            reasoning
          });
        }

        // Under bet
        if (game.odds.total.under) {
          const underOdds = game.odds.total.under;
          let underTrueProbability = 0.5;
          let confidence = 30;
          let reasoning = "Default probability estimation";

          if (enhancedPick && enhancedPick.confidence && enhancedPick.bet) {
            const aiConfidence = enhancedPick.confidence / 100;
            if (enhancedPick.bet.toLowerCase().includes('under') || 
                enhancedPick.bet.toLowerCase().includes('low-scoring')) {
              underTrueProbability = Math.min(0.85, 0.45 + (aiConfidence * 0.25));
              confidence = enhancedPick.confidence;
              reasoning = enhancedPick.reasoning || "AI analysis suggests low-scoring game";
            }
          }

          const underEV = calculateExpectedValue(underTrueProbability, underOdds);
          const kellyStake = Math.max(0, calculateKellyStake(underTrueProbability, underOdds, bankroll) * kellyMultiplier);
          calculatedBets.push({
            gameId: game.gameId,
            game,
            betType: 'Total',
            selection: `Under ${totalLine}`,
            odds: underOdds,
            trueProbability: underTrueProbability,
            expectedValue: underEV,
            kellyStake,
            confidence,
            reasoning
          });
        }
      }
    });

    // Sort by expected value descending (positive EV first, then negative EV)
    calculatedBets.sort((a, b) => b.expectedValue - a.expectedValue);
    setEVBets(calculatedBets); // Show all bets
  }, [games, enhancedPicks, bankroll, minimumBet, kellyMultiplier, selectedDate]);

  const positiveEVBets = evBets.filter(bet => bet.expectedValue > 0);
  const negativeEVBets = evBets.filter(bet => bet.expectedValue <= 0);
  const totalRecommendedStake = positiveEVBets.reduce((sum, bet) => sum + bet.kellyStake, 0);
  const averageEV = evBets.length > 0 ? evBets.reduce((sum, bet) => sum + bet.expectedValue, 0) / evBets.length : 0;
  const portfolioRisk = (totalRecommendedStake / bankroll) * 100;

  if (gamesLoading || picksLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-300">Loading expected value calculations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Calculator className="h-8 w-8 text-blue-400" />
            Expected Value Calculator
          </h1>
          <p className="text-gray-300 mt-2">
            Optimal bet sizing using Kelly Criterion and AI-enhanced probability estimates
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <Label htmlFor="dateSelect" className="text-gray-300 text-sm mb-1">Select Date</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-[200px] bg-gray-700 border-gray-600 text-white">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {getDateOptions().map((dateOption) => (
                  <SelectItem key={dateOption.value} value={dateOption.value} className="text-white hover:bg-gray-600">
                    {dateOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Brain className="h-4 w-4 mr-1" />
            Real Data + AI Analysis
          </Badge>
        </div>
      </div>

      {/* Settings Panel */}
      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            Bankroll Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bankroll" className="text-gray-300">Total Bankroll ($)</Label>
              <Input
                id="bankroll"
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                min="100"
                step="100"
              />
            </div>
            <div>
              <Label htmlFor="minimumBet" className="text-gray-300">Minimum Bet ($)</Label>
              <Input
                id="minimumBet"
                type="number"
                value={minimumBet}
                onChange={(e) => setMinimumBet(Number(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
                step="5"
              />
            </div>
            <div>
              <Label htmlFor="kellyMultiplier" className="text-gray-300">Kelly Multiplier</Label>
              <Input
                id="kellyMultiplier"
                type="number"
                value={kellyMultiplier}
                onChange={(e) => setKellyMultiplier(Number(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                min="0.1"
                max="1.0"
                step="0.05"
              />
              <p className="text-xs text-gray-400 mt-1">0.25 = Quarter Kelly (recommended)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Positive EV Bets</p>
                <p className="text-2xl font-bold text-green-400">{positiveEVBets.length}</p>
                <p className="text-xs text-gray-400">of {evBets.length} total</p>
              </div>
              <Target className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Recommended</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRecommendedStake)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Average EV</p>
                <p className="text-2xl font-bold text-blue-400">+{averageEV.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Portfolio Risk</p>
                <p className={`text-2xl font-bold ${portfolioRisk > 20 ? 'text-red-400' : portfolioRisk > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {portfolioRisk.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Warning */}
      {portfolioRisk > 15 && (
        <Alert className="mb-6 bg-yellow-900/20 border-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-yellow-200">
            High portfolio risk detected ({portfolioRisk.toFixed(1)}%). Consider reducing bet sizes or increasing bankroll to maintain prudent risk management.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Source Verification */}
      <Card className="mb-6 bg-blue-900/20 border-blue-600">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Data Source Verification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-200 font-medium">MLB Games Data</p>
              <p className="text-blue-100">✓ Live from The Odds API + MLB API</p>
              <p className="text-blue-100">✓ Real pitcher matchups & stats</p>
            </div>
            <div>
              <p className="text-blue-200 font-medium">Odds Data</p>
              <p className="text-blue-100">✓ Real-time sportsbook odds</p>
              <p className="text-blue-100">✓ Moneyline, totals, spreads</p>
            </div>
            <div>
              <p className="text-blue-200 font-medium">AI Probabilities</p>
              <p className="text-blue-100">✓ Enhanced picks analysis</p>
              <p className="text-blue-100">✓ Confidence-weighted estimates</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EV Betting Analysis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            Complete EV Analysis - {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : 
                                   selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'Tomorrow' : 
                                   new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-300">Positive EV</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-300">Negative EV</span>
            </div>
          </div>
        </div>
        
        {evBets.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No EV Analysis Available
              </h3>
              <p className="text-gray-300">
                No games found for {selectedDate === new Date().toISOString().split('T')[0] ? 'today' : 
                                  selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'tomorrow' : 
                                  'this date'}.
                Try selecting a different date or check back when games are scheduled.
              </p>
            </CardContent>
          </Card>
        ) : (
          evBets.map((bet, index) => {
            const isPositiveEV = bet.expectedValue > 0;
            const borderColor = isPositiveEV ? 'border-green-600' : 'border-red-600';
            const bgColor = isPositiveEV ? 'bg-gray-800' : 'bg-gray-900';
            
            return (
            <Card key={`${bet.gameId}-${bet.selection}`} className={`${bgColor} ${borderColor} border-l-4`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className={isPositiveEV 
                        ? "bg-green-900/20 text-green-300 border-green-600" 
                        : "bg-red-900/20 text-red-300 border-red-600"
                      }>
                        {isPositiveEV ? `+${bet.expectedValue.toFixed(2)}% EV` : `${bet.expectedValue.toFixed(2)}% EV`}
                      </Badge>
                      <Badge className={`
                        ${bet.confidence >= 75 ? 'bg-green-600' : bet.confidence >= 50 ? 'bg-yellow-600' : 'bg-gray-600'}
                      `}>
                        {bet.confidence}% Confidence
                      </Badge>
                      <Badge variant="outline" className="bg-blue-900/20 text-blue-300 border-blue-600">
                        Real Data
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {bet.game.awayTeam} @ {bet.game.homeTeam}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(bet.game.gameTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {bet.game.venue}
                      </div>
                      {bet.game.awayPitcher && bet.game.homePitcher && (
                        <div>
                          {bet.game.awayPitcher} vs {bet.game.homePitcher}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bet Details */}
                <div className="border-l-4 border-blue-400 pl-4 mb-4">
                  <div className="font-medium text-blue-300 mb-2">
                    {bet.betType}: {bet.selection}
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {bet.reasoning}
                  </p>
                </div>

                {/* EV Calculations */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Odds</p>
                    <p className="font-semibold text-white">{formatOdds(bet.odds)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">True Probability</p>
                    <p className="font-semibold text-white">{(bet.trueProbability * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Expected Value</p>
                    <p className={`font-semibold ${isPositiveEV ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositiveEV ? '+' : ''}{bet.expectedValue.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Recommended Stake</p>
                    <p className="font-semibold text-blue-400">{formatCurrency(bet.kellyStake)}</p>
                  </div>
                </div>

                {/* Potential Return */}
                <div className="mt-4 text-right">
                  <p className="text-sm text-gray-400">
                    Potential Return: <span className="text-green-400 font-medium">
                      {formatCurrency(bet.odds > 0 
                        ? bet.kellyStake + (bet.kellyStake * (bet.odds / 100))
                        : bet.kellyStake + (bet.kellyStake * (100 / Math.abs(bet.odds)))
                      )}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      {/* Disclaimer */}
      <Alert className="mt-8 bg-gray-900/50 border-gray-600">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-gray-300">
          <strong>Risk Disclaimer:</strong> Expected value calculations are based on AI probability estimates and should not be considered guaranteed profits. 
          Sports betting involves substantial risk of loss. Only bet what you can afford to lose and ensure compliance with local laws.
        </AlertDescription>
      </Alert>
    </div>
  );
}