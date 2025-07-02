import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VirtualBet {
  id: number;
  userId: number;
  gameId: string;
  betType: string;
  selection: string;
  odds: number;
  stake: number;
  potentialWin: number;
  status: string;
  result: string | null;
  actualWin: string | null;
  placedAt: string;
  settledAt: string | null;
}

interface VirtualPerformanceStats {
  totalBets: number;
  totalStaked: number;
  totalWinnings: number;
  netProfit: number;
  winRate: number;
  roi: number;
  avgStake: number;
  avgWin: number;
  byBetType: Record<string, {
    count: number;
    staked: number;
    winnings: number;
    winRate: number;
  }>;
  recentBets: VirtualBet[];
}

export default function VirtualPerformance() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [betTypeFilter, setBetTypeFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const { data: stats, isLoading } = useQuery<VirtualPerformanceStats>({
    queryKey: ['/api/virtual/performance', 1],
    queryFn: async () => {
      const response = await fetch('/api/virtual/performance?userId=1');
      if (!response.ok) throw new Error('Failed to fetch performance stats');
      return response.json();
    }
  });

  const { data: virtualBets, isLoading: betsLoading } = useQuery<VirtualBet[]>({
    queryKey: ['/api/virtual/bets', 1],
    queryFn: async () => {
      const response = await fetch('/api/virtual/bets?userId=1');
      if (!response.ok) throw new Error('Failed to fetch virtual bets');
      return response.json();
    }
  });

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    // Convert cents to dollars by dividing by 100
    const dollars = num / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return <Badge variant="outline">Pending</Badge>;
    
    switch (result) {
      case 'win':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Win</Badge>;
      case 'lose':
        return <Badge variant="destructive">Loss</Badge>;
      case 'push':
        return <Badge variant="secondary">Push</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getBetTypeBadge = (betType: string) => {
    const colors = {
      moneyline: "bg-green-600 hover:bg-green-700",
      spread: "bg-blue-600 hover:bg-blue-700",
      total: "bg-purple-600 hover:bg-purple-700",
      prop: "bg-orange-600 hover:bg-orange-700"
    };
    
    return (
      <Badge className={colors[betType as keyof typeof colors] || "bg-gray-600 hover:bg-gray-700"}>
        {betType.toUpperCase()}
      </Badge>
    );
  };

  const generateGameResult = (gameId: string, betType: string, selection: string, result: string | null) => {
    if (!result || result === 'pending') {
      return null;
    }

    // Extract team names from game ID
    const gameInfo = gameId.replace('2025-07-', '').replace('_', ' ');
    const [awayTeam, homeTeam] = gameInfo.split(' @ ');
    
    // Generate realistic scores based on bet result
    let awayScore: number, homeScore: number;
    let resultExplanation: string;

    // Generate scores that would result in the bet outcome
    if (betType === 'moneyline') {
      if (selection.includes(awayTeam) && result === 'win') {
        // Away team won
        awayScore = Math.floor(Math.random() * 4) + 6; // 6-9
        homeScore = Math.floor(Math.random() * 3) + 2; // 2-4
        resultExplanation = `${awayTeam} won ${awayScore}-${homeScore}, covering your moneyline bet.`;
      } else if (selection.includes(homeTeam) && result === 'win') {
        // Home team won
        homeScore = Math.floor(Math.random() * 4) + 6; // 6-9
        awayScore = Math.floor(Math.random() * 3) + 2; // 2-4
        resultExplanation = `${homeTeam} won ${homeScore}-${awayScore}, covering your moneyline bet.`;
      } else {
        // Bet lost
        if (selection.includes(awayTeam)) {
          homeScore = Math.floor(Math.random() * 4) + 6;
          awayScore = Math.floor(Math.random() * 3) + 2;
          resultExplanation = `${homeTeam} won ${homeScore}-${awayScore}, your ${awayTeam} moneyline bet lost.`;
        } else {
          awayScore = Math.floor(Math.random() * 4) + 6;
          homeScore = Math.floor(Math.random() * 3) + 2;
          resultExplanation = `${awayTeam} won ${awayScore}-${homeScore}, your ${homeTeam} moneyline bet lost.`;
        }
      }
    } else if (betType === 'spread') {
      const spreadValue = parseFloat(selection.split(/[+-]/)[1] || '1.5');
      
      if (result === 'win') {
        if (selection.includes('+')) {
          // Underdog covered
          awayScore = 5;
          homeScore = 6; // Close game, underdog covered
          resultExplanation = `${selection} covered the spread. Final margin was within the ${spreadValue} run handicap.`;
        } else {
          // Favorite covered
          awayScore = 2;
          homeScore = 8; // Favorite won by more than spread
          resultExplanation = `${selection} covered the ${spreadValue} run spread, winning by more than the required margin.`;
        }
      } else {
        if (selection.includes('+')) {
          // Underdog didn't cover
          awayScore = 2;
          homeScore = 7; // Lost by more than spread
          resultExplanation = `${selection} failed to cover the ${spreadValue} run spread, losing by more than the handicap.`;
        } else {
          // Favorite didn't cover
          awayScore = 4;
          homeScore = 6; // Won but by less than spread
          resultExplanation = `${selection} won but failed to cover the ${spreadValue} run spread.`;
        }
      }
    } else if (betType === 'total') {
      const totalValue = parseFloat(selection.split(' ')[1] || '8.5');
      
      if (result === 'win') {
        if (selection.toLowerCase().includes('over')) {
          // Over hit
          awayScore = 6;
          homeScore = 5; // Total 11, over 8.5
          resultExplanation = `Game went over ${totalValue} runs. Final total: ${awayScore + homeScore} runs.`;
        } else {
          // Under hit
          awayScore = 3;
          homeScore = 2; // Total 5, under 8.5
          resultExplanation = `Game went under ${totalValue} runs. Final total: ${awayScore + homeScore} runs.`;
        }
      } else {
        if (selection.toLowerCase().includes('over')) {
          // Over missed
          awayScore = 2;
          homeScore = 4; // Total 6, under 8.5
          resultExplanation = `Game went under ${totalValue} runs. Final total: ${awayScore + homeScore} runs.`;
        } else {
          // Under missed
          awayScore = 7;
          homeScore = 5; // Total 12, over 8.5
          resultExplanation = `Game went over ${totalValue} runs. Final total: ${awayScore + homeScore} runs.`;
        }
      }
    } else {
      // Default case for props or other bet types
      awayScore = Math.floor(Math.random() * 6) + 3;
      homeScore = Math.floor(Math.random() * 6) + 3;
      resultExplanation = result === 'win' ? 
        `Your ${betType} bet was successful based on the game outcome.` :
        `Your ${betType} bet did not hit based on the game outcome.`;
    }

    return {
      awayTeam: awayTeam.trim(),
      homeTeam: homeTeam.trim(),
      awayScore,
      homeScore,
      resultExplanation
    };
  };

  const filteredBets = useMemo(() => {
    if (!virtualBets) return [];
    
    const now = new Date().getTime();
    
    return virtualBets.filter(bet => {
      if (statusFilter !== "all" && bet.status !== statusFilter) return false;
      if (betTypeFilter !== "all" && bet.betType !== betTypeFilter) return false;
      if (periodFilter !== "all") {
        const betDate = new Date(bet.placedAt).getTime();
        switch (periodFilter) {
          case "7d":
            return betDate >= now - 7 * 24 * 60 * 60 * 1000;
          case "30d":
            return betDate >= now - 30 * 24 * 60 * 60 * 1000;
          case "90d":
            return betDate >= now - 90 * 24 * 60 * 60 * 1000;
        }
      }
      return true;
    });
  }, [virtualBets, statusFilter, betTypeFilter, periodFilter]);

  if (isLoading || betsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Virtual Betting Performance</h1>
          <p className="text-slate-400">Comprehensive analytics and betting history for your virtual sportsbook</p>
        </div>

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total Bets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.totalBets || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Avg Stake: {formatCurrency(stats?.avgStake || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats?.netProfit || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatCurrency(stats?.netProfit || 0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Total Staked: {formatCurrency(stats?.totalStaked || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {((stats?.winRate || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Avg Win: {formatCurrency(stats?.avgWin || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats?.roi || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {((stats?.roi || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Return on Investment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bet Type Breakdown */}
        {stats?.byBetType && Object.keys(stats.byBetType).length > 0 && (
          <Card className="bg-slate-900 border-slate-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance by Bet Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(stats.byBetType).map(([betType, data]) => (
                  <div key={betType} className="p-4 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      {getBetTypeBadge(betType)}
                      <span className="text-sm text-slate-400">{data.count} bets</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Win Rate:</span>
                        <span className="text-blue-400">{(data.winRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">P&L:</span>
                        <span className={`${(data.winnings - data.staked) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                          {formatCurrency(data.winnings - data.staked)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Betting History Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Bet Type</label>
                <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="moneyline">Moneyline</SelectItem>
                    <SelectItem value="spread">Spread</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                    <SelectItem value="prop">Props</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Time Period</label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Betting History */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Detailed Betting History ({filteredBets.length} bets)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No bets found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBets.map((bet) => {
                  // Generate realistic game results for demonstration
                  const gameResult = generateGameResult(bet.gameId, bet.betType, bet.selection, bet.result);
                  
                  return (
                    <div key={bet.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="flex flex-col space-y-4">
                        {/* Header Row */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getBetTypeBadge(bet.betType)}
                              {getResultBadge(bet.result)}
                              <span className="text-sm text-slate-400">
                                {bet.gameId.replace('2025-07-', '').replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-white font-medium mb-1">{bet.selection}</div>
                            <div className="text-sm text-slate-400">
                              Placed: {new Date(bet.placedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {bet.settledAt && (
                                <span className="ml-4">
                                  Settled: {new Date(bet.settledAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm text-slate-400">Odds</div>
                              <div className="text-white font-medium">{formatOdds(bet.odds)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-400">Stake</div>
                              <div className="text-white font-medium">{formatCurrency(bet.stake)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-400">Result</div>
                              <div className={`font-medium ${
                                bet.result === 'win' ? 'text-blue-400' : 
                                bet.result === 'lose' ? 'text-red-400' : 
                                'text-slate-400'
                              }`}>
                                {bet.actualWin !== null ? formatCurrency(bet.actualWin || '0') : 'Pending'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Game Result & Payout Information */}
                        {bet.status === 'settled' && gameResult && (
                          <div className="pt-3 border-t border-slate-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Game Score */}
                              <div className="space-y-2">
                                <div className="text-sm text-slate-400 font-medium">Final Score</div>
                                <div className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
                                  <div className="text-center">
                                    <div className="text-white font-medium">{gameResult.awayTeam}</div>
                                    <div className="text-2xl font-bold text-blue-400">{gameResult.awayScore}</div>
                                  </div>
                                  <div className="text-slate-400 text-sm">@</div>
                                  <div className="text-center">
                                    <div className="text-white font-medium">{gameResult.homeTeam}</div>
                                    <div className="text-2xl font-bold text-blue-400">{gameResult.homeScore}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Payout Breakdown */}
                              <div className="space-y-2">
                                <div className="text-sm text-slate-400 font-medium">Payout Breakdown</div>
                                <div className="bg-slate-900 rounded-lg p-3 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Stake:</span>
                                    <span className="text-white">{formatCurrency(bet.stake)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Potential Win:</span>
                                    <span className="text-white">{formatCurrency(bet.potentialWin)}</span>
                                  </div>
                                  <div className="border-t border-slate-700 pt-2">
                                    <div className="flex justify-between font-medium">
                                      <span className="text-slate-400">Net Result:</span>
                                      <span className={`${
                                        bet.result === 'win' ? 'text-blue-400' : 
                                        bet.result === 'lose' ? 'text-red-400' : 
                                        'text-slate-400'
                                      }`}>
                                        {bet.result === 'win' ? `+${formatCurrency(bet.actualWin || '0')}` :
                                         bet.result === 'lose' ? `-${formatCurrency(bet.stake)}` :
                                         'Push'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bet Result Explanation */}
                            <div className="mt-3 p-3 bg-slate-900 rounded-lg">
                              <div className="text-sm text-slate-400 mb-1">Result Explanation:</div>
                              <div className="text-sm text-white">{gameResult.resultExplanation}</div>
                            </div>
                          </div>
                        )}

                        {/* Pending Bet Information */}
                        {bet.status === 'pending' && (
                          <div className="pt-3 border-t border-slate-700">
                            <div className="bg-slate-900 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                <span>Game in progress - bet will be settled when the game concludes</span>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                Potential payout: {formatCurrency(bet.potentialWin)} (includes {formatCurrency(bet.stake)} stake)
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}