import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Filter } from "lucide-react";
import { useState } from "react";
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
  actualWin: number | null;
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
    queryKey: ['/api/virtual/performance', { userId: 999 }],
    queryFn: async () => {
      const response = await fetch('/api/virtual/performance?userId=999');
      if (!response.ok) throw new Error('Failed to fetch performance stats');
      return response.json();
    }
  });

  const { data: virtualBets, isLoading: betsLoading } = useQuery<VirtualBet[]>({
    queryKey: ['/api/virtual/bets', { userId: 999 }],
    queryFn: async () => {
      const response = await fetch('/api/virtual/bets?userId=999');
      if (!response.ok) throw new Error('Failed to fetch virtual bets');
      return response.json();
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
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

  const filteredBets = virtualBets?.filter(bet => {
    if (statusFilter !== "all" && bet.status !== statusFilter) return false;
    if (betTypeFilter !== "all" && bet.betType !== betTypeFilter) return false;
    if (periodFilter !== "all") {
      const betDate = new Date(bet.placedAt);
      const now = new Date();
      switch (periodFilter) {
        case "7d":
          return betDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "30d":
          return betDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case "90d":
          return betDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
    }
    return true;
  }) || [];

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
                {filteredBets.map((bet) => (
                  <div key={bet.id} className="p-4 bg-slate-800 rounded-lg">
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
                            {bet.actualWin !== null ? formatCurrency(bet.actualWin) : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}