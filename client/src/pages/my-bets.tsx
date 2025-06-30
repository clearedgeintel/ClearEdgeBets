import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, BarChart3, Calendar, RefreshCw, Edit2, Check, X, Trash2 } from "lucide-react";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const { bets, stats, clearBet, updateBet } = useBettingSlip();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingBet, setEditingBet] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ stake: string; selection: string }>({ stake: "", selection: "" });
  
  const { data: serverBets = [] } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
  });

  // Mutation to simulate game results for testing
  const simulateGamesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/simulate-game-results");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Game results simulated",
        description: "Final scores have been added to games for testing.",
      });
    },
  });

  // Mutation to resolve pending bets
  const resolveBetsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/resolve-bets");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      toast({
        title: "Bets resolved",
        description: data.message || "Pending bets have been updated with results.",
      });
    },
    onError: () => {
      toast({
        title: "Resolution failed",
        description: "Unable to resolve pending bets. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handlers for editing bets
  const startEditing = (bet: any) => {
    setEditingBet(bet.id);
    setEditValues({
      stake: bet.stake.toString(),
      selection: bet.selection
    });
  };

  const cancelEditing = () => {
    setEditingBet(null);
    setEditValues({ stake: "", selection: "" });
  };

  const saveEdit = (bet: any) => {
    const newStake = parseFloat(editValues.stake);
    if (isNaN(newStake) || newStake <= 0) {
      toast({
        title: "Invalid stake",
        description: "Please enter a valid stake amount.",
        variant: "destructive",
      });
      return;
    }

    const updates = {
      stake: newStake,
      selection: editValues.selection,
      potentialWin: calculatePotentialWin(newStake, bet.odds)
    };

    updateBet(bet.gameId, bet.betType, bet.selection, updates);
    setEditingBet(null);
    toast({
      title: "Bet updated",
      description: "Your bet has been successfully updated.",
    });
  };

  const removeBet = (bet: any) => {
    clearBet(bet.gameId, bet.betType, bet.selection);
    toast({
      title: "Bet removed",
      description: "Bet has been removed from your betting slip.",
    });
  };

  const calculatePotentialWin = (stake: number, odds: number): number => {
    if (odds > 0) {
      return stake * (odds / 100);
    } else {
      return stake * (100 / Math.abs(odds));
    }
  };

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Bets</h1>
            <p className="text-muted-foreground mt-1">Track your betting history and performance</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => simulateGamesMutation.mutate()}
              disabled={simulateGamesMutation.isPending}
              variant="outline"
              size="sm"
            >
              {simulateGamesMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                "Simulate Games"
              )}
            </Button>
            <Button
              onClick={() => resolveBetsMutation.mutate()}
              disabled={resolveBetsMutation.isPending}
              size="sm"
            >
              {resolveBetsMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                "Resolve Bets"
              )}
            </Button>
          </div>
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
                    <img 
                      src="/clearedge-logo-final.png" 
                      alt="ClearEdge Bets" 
                      className="h-16 w-auto mx-auto mb-4 opacity-60"
                    />
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
                          {editingBet === bet.id ? (
                            <Input
                              value={editValues.selection}
                              onChange={(e) => setEditValues({ ...editValues, selection: e.target.value })}
                              className="max-w-xs"
                              placeholder="Selection"
                            />
                          ) : (
                            <h3 className="font-semibold text-foreground">{bet.selection}</h3>
                          )}
                          <Badge variant="outline">{bet.betType}</Badge>
                          <Badge variant="secondary">{formatOdds(bet.odds)}</Badge>
                        </div>
                        <div className="mb-2">
                          <p className="text-sm font-medium text-foreground">{bet.gameId.replace('@', ' @ ')}</p>
                          <p className="text-xs text-muted-foreground">Placed: {new Date(bet.placedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-muted-foreground">
                            Stake: {editingBet === bet.id ? (
                              <Input
                                type="number"
                                value={editValues.stake}
                                onChange={(e) => setEditValues({ ...editValues, stake: e.target.value })}
                                className="w-24 h-8 text-sm inline-block ml-1"
                                step="0.01"
                                min="0"
                              />
                            ) : (
                              <span className="font-medium text-foreground">{formatCurrency(bet.stake)}</span>
                            )}
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
                        {editingBet === bet.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveEdit(bet)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(bet)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBet(bet)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
                    <img 
                      src="/clearedge-logo-final.png" 
                      alt="ClearEdge Bets" 
                      className="h-16 w-auto mx-auto mb-4 opacity-60"
                    />
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
                        <div className="mb-2">
                          <p className="text-sm font-medium text-foreground">{bet.gameId.replace('@', ' @ ')}</p>
                          <p className="text-xs text-muted-foreground">Placed: {new Date(bet.placedAt).toLocaleDateString()}</p>
                        </div>
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
