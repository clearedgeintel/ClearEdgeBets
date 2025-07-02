import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Bet {
  gameId: string;
  betType: string;
  selection: string;
  odds: number;
  stake: number;
  potentialWin: number;
}

export interface BettingStats {
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
}

interface BettingSlipContextType {
  bets: Bet[];
  stats: BettingStats;
  addBet: (bet: Bet) => void;
  updateBet: (gameId: string, betType: string, selection: string, updates: Partial<Bet>) => void;
  clearBet: (gameId: string, betType: string, selection: string) => void;
  clearAllBets: () => void;
  getTotalStake: () => number;
  getTotalPotentialWin: () => number;
  updateStats: (newStats: Partial<BettingStats>) => void;
}

const BettingSlipContext = createContext<BettingSlipContextType | undefined>(undefined);

interface BettingSlipProviderProps {
  children: ReactNode;
}

export function BettingSlipProvider({ children }: BettingSlipProviderProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BettingStats>({
    totalBets: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalProfit: 0
  });

  // Load bets from localStorage on mount
  useEffect(() => {
    const savedBets = localStorage.getItem("bettingSlip");
    if (savedBets) {
      try {
        setBets(JSON.parse(savedBets));
      } catch (error) {
        console.error("Error loading betting slip:", error);
      }
    }

    const savedStats = localStorage.getItem("bettingStats");
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (error) {
        console.error("Error loading betting stats:", error);
      }
    }
  }, []);

  // Save bets to localStorage whenever bets change
  useEffect(() => {
    localStorage.setItem("bettingSlip", JSON.stringify(bets));
  }, [bets]);

  // Save stats to localStorage whenever stats change
  useEffect(() => {
    localStorage.setItem("bettingStats", JSON.stringify(stats));
  }, [stats]);

  const addBet = (bet: Bet) => {
    setBets(currentBets => {
      // Check if bet already exists
      const existingBetIndex = currentBets.findIndex(
        b => b.gameId === bet.gameId && b.betType === bet.betType && b.selection === bet.selection
      );

      if (existingBetIndex >= 0) {
        // Update existing bet
        const updatedBets = [...currentBets];
        updatedBets[existingBetIndex] = bet;
        return updatedBets;
      } else {
        // Add new bet
        const newBets = [...currentBets, bet];
        return newBets;
      }
    });
  };

  const updateBet = (gameId: string, betType: string, selection: string, updates: Partial<Bet>) => {
    setBets(currentBets => 
      currentBets.map(bet => 
        bet.gameId === gameId && bet.betType === betType && bet.selection === selection
          ? { ...bet, ...updates }
          : bet
      )
    );
  };

  const clearBet = (gameId: string, betType: string, selection: string) => {
    setBets(currentBets => 
      currentBets.filter(bet => 
        !(bet.gameId === gameId && bet.betType === betType && bet.selection === selection)
      )
    );
  };

  const clearAllBets = () => {
    setBets([]);
  };

  const getTotalStake = () => {
    return bets.reduce((total, bet) => total + bet.stake, 0);
  };

  const getTotalPotentialWin = () => {
    return bets.reduce((total, bet) => total + bet.potentialWin, 0);
  };

  const updateStats = (newStats: Partial<BettingStats>) => {
    setStats(currentStats => ({
      ...currentStats,
      ...newStats
    }));
  };

  const value = {
    bets,
    stats,
    addBet,
    updateBet,
    clearBet,
    clearAllBets,
    getTotalStake,
    getTotalPotentialWin,
    updateStats
  };

  return (
    <BettingSlipContext.Provider value={value}>
      {children}
    </BettingSlipContext.Provider>
  );
}

export function useBettingSlip() {
  const context = useContext(BettingSlipContext);
  if (context === undefined) {
    throw new Error('useBettingSlip must be used within a BettingSlipProvider');
  }
  return context;
}