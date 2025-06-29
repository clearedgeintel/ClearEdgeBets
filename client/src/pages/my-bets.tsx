import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react";
import { useBettingSlip } from "@/contexts/betting-slip-context";

interface Bet {
  id: number;
  gameId: string;
  betType: string;
  selection: string;
  odds: number;
  stake: number;
  potentialWin: number;
  status: string;
  result?: string;
  actualWin?: number;
  placedAt: string;
}

export default function MyBets() {
  const { bets, stats, clearBet } = useBettingSlip();
  
  const { data: serverBets = [] } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
  });

  // Combine local bets with server bets
  const allBets = [...bets.map(bet => ({
    ...bet,
    id: Date.now() + Math.random(), // Temporary ID for local bets
    placedAt: new Date().toISOString(),
    status: "pending" as const
  })), ...serverBets];

  const pendingBets = allBets.filter(bet => bet.status === "pending");
  const settledBets = allBets.filter(bet => bet.status === "settled");

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">My Bets</h1>
          <p className="text-muted-foreground mt-1">Track your betting history and performance</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold text-foreground">{stats.winRate}%</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-secondary' : 'text-red-600'}`}>
                    {formatCurrency(stats.totalProfit)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stats.totalProfit >= 0 ? 'bg-secondary/10' : 'bg-red-100'}`}>
                  {stats.totalProfit >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bets</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalBets}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Bets</p>
                  <p className="text-2xl font-bold text-foreground">{pendingBets.length}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bets Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Bets ({pendingBets.length})</TabsTrigger>
            <TabsTrigger value="settled">Betting History ({settledBets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingBets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2 text-foreground">No pending bets</h3>
                    <p className="text-sm">Your active bets will appear here once placed.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              pendingBets.map((bet) => (
                <Card key={bet.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-foreground">{bet.selection}</h3>
                          <Badge variant="outline">{bet.betType}</Badge>
                          <Badge variant="secondary">{formatOdds(bet.odds)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Game ID: {bet.gameId}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-muted-foreground">
                            Stake: <span className="font-medium text-foreground">{formatCurrency(bet.stake)}</span>
                          </span>
                          <span className="text-muted-foreground">
                            To Win: <span className="font-medium text-secondary">{formatCurrency(bet.potentialWin)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                          Pending
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearBet(bet.gameId, bet.betType, bet.selection)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="settled" className="space-y-4">
            {settledBets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No betting history</h3>
                    <p className="text-sm">Your completed bets will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              settledBets.map((bet) => (
                <Card key={bet.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-foreground">{bet.selection}</h3>
                          <Badge variant="outline">{bet.betType}</Badge>
                          <Badge variant="secondary">{formatOdds(bet.odds)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Game ID: {bet.gameId}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-muted-foreground">
                            Stake: <span className="font-medium text-foreground">{formatCurrency(bet.stake)}</span>
                          </span>
                          {bet.actualWin !== undefined && (
                            <span className="text-muted-foreground">
                              Result: <span className={`font-medium ${bet.actualWin > 0 ? 'text-secondary' : 'text-red-600'}`}>
                                {formatCurrency(bet.actualWin)}
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Placed: {new Date(bet.placedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <Badge 
                          variant={bet.result === "win" ? "default" : "destructive"}
                          className={bet.result === "win" ? "bg-secondary" : ""}
                        >
                          {bet.result === "win" ? "Won" : bet.result === "loss" ? "Lost" : "Push"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MobileNav />
    </div>
  );
}
