import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useBettingSlip } from "@/contexts/betting-slip-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BettingSlip() {
  const { bets, updateBet, clearBet, clearAllBets, getTotalStake, getTotalPotentialWin } = useBettingSlip();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const placeBetsMutation = useMutation({
    mutationFn: async (betsToPlace: typeof bets) => {
      const promises = betsToPlace.map(bet => 
        apiRequest("POST", "/api/bets", bet)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      clearAllBets();
      toast({
        title: "Bets Placed",
        description: "Your bets have been successfully placed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to place bets. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const calculatePotentialWin = (stake: number, odds: number) => {
    if (stake <= 0) return 0;
    if (odds > 0) {
      return (stake * odds) / 100;
    } else {
      return (stake * 100) / Math.abs(odds);
    }
  };

  const handleStakeChange = (gameId: string, betType: string, selection: string, stake: number) => {
    console.log("Stake change:", { gameId, betType, selection, stake });
    const bet = bets.find(b => b.gameId === gameId && b.betType === betType && b.selection === selection);
    if (bet) {
      const potentialWin = calculatePotentialWin(stake, bet.odds);
      updateBet(gameId, betType, selection, { stake, potentialWin });
    }
  };

  const handleOddsChange = (gameId: string, betType: string, selection: string, odds: number) => {
    console.log("Odds change:", { gameId, betType, selection, odds });
    const bet = bets.find(b => b.gameId === gameId && b.betType === betType && b.selection === selection);
    if (bet) {
      const potentialWin = calculatePotentialWin(bet.stake, odds);
      updateBet(gameId, betType, selection, { odds, potentialWin });
    }
  };

  const handlePlaceBets = () => {
    const validBets = bets.filter(bet => bet.stake > 0);
    if (validBets.length === 0) {
      toast({
        title: "No Valid Bets",
        description: "Please enter stake amounts for your bets.",
        variant: "destructive",
      });
      return;
    }
    placeBetsMutation.mutate(validBets);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary text-white p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Betting Slip</CardTitle>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {bets.length} Bet{bets.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {bets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No bets selected</p>
            <p className="text-xs mt-1">Click on odds to add bets</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {bets.map((bet, index) => (
                <div key={`${bet.gameId}-${bet.betType}-${bet.selection}`} className="bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground truncate">{bet.selection}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => clearBet(bet.gameId, bet.betType, bet.selection)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="mb-2">
                    <p className="text-xs font-medium text-foreground">{bet.gameId.replace('@', ' @ ')}</p>
                    <p className="text-xs text-muted-foreground">{bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1)} Bet</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-muted-foreground w-12">Odds:</label>
                      <Input
                        type="number"
                        placeholder="Odds"
                        value={bet.odds}
                        onChange={(e) => handleOddsChange(bet.gameId, bet.betType, bet.selection, parseInt(e.target.value) || 0)}
                        className="flex-1 text-xs h-8"
                        title="Adjust odds to match your actual betting ticket"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-muted-foreground w-12">Stake:</label>
                      <Input
                        type="number"
                        placeholder="$0.00"
                        value={bet.stake || ""}
                        onChange={(e) => handleStakeChange(bet.gameId, bet.betType, bet.selection, parseFloat(e.target.value) || 0)}
                        className="flex-1 text-xs h-8"
                        title="Enter your bet amount"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    To win: ${bet.potentialWin.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">Total Stake:</span>
                <span className="font-bold text-lg">${getTotalStake().toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Potential Win:</span>
                <span className="font-semibold text-secondary">${getTotalPotentialWin().toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <Button 
                  className="w-full bg-secondary text-white hover:bg-emerald-600"
                  onClick={handlePlaceBets}
                  disabled={placeBetsMutation.isPending || getTotalStake() === 0}
                >
                  {placeBetsMutation.isPending ? "Placing Bets..." : "Place Bets"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={clearAllBets}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
