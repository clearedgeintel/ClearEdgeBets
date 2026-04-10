import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Virtual Betting API Endpoints (Paper Trading)

// Get user's virtual bets
router.get("/api/virtual/bets", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const virtualBets = await storage.getUserVirtualBets(userId);

    // Convert cents back to dollars for frontend display
    const convertedBets = virtualBets.map(bet => ({
      ...bet,
      stake: (parseInt(bet.stake.toString()) / 100).toFixed(2),
      potentialWin: (parseInt(bet.potentialWin.toString()) / 100).toFixed(2),
      actualWin: bet.actualWin ? (parseInt(bet.actualWin.toString()) / 100).toFixed(2) : null
    }));

    res.json(convertedBets);
  } catch (error) {
    console.error("Error fetching virtual bets:", error);
    res.status(500).json({ error: "Failed to fetch virtual bets" });
  }
});

// Place a virtual bet (paper trading)
router.post("/api/virtual/bets", async (req, res) => {
  try {
    const { userId, gameId, betType, selection, odds, stake } = req.body;

    if (!userId || !gameId || !betType || !selection || !odds || !stake) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert stake to cents for storage
    const stakeInCents = Math.round(parseFloat(stake) * 100);

    // Check if user has sufficient virtual balance
    const currentBalance = await storage.getUserVirtualBalance(userId);
    if (currentBalance < stakeInCents) {
      return res.status(400).json({ error: "Insufficient virtual balance" });
    }

    // Calculate potential win in cents
    let potentialWinInCents;
    if (odds > 0) {
      potentialWinInCents = Math.round((stakeInCents * odds) / 100);
    } else {
      potentialWinInCents = Math.round((stakeInCents * 100) / Math.abs(odds));
    }

    // Deduct stake from virtual balance
    const newBalance = currentBalance - stakeInCents;
    await storage.updateVirtualBalance(userId, newBalance);

    const virtualBet = await storage.createVirtualBet({
      userId,
      gameId,
      betType,
      selection,
      odds,
      stake: stakeInCents,
      potentialWin: potentialWinInCents,
      status: "pending"
    });

    res.status(201).json({
      ...virtualBet,
      stake: (virtualBet.stake / 100).toFixed(2),
      potentialWin: (virtualBet.potentialWin / 100).toFixed(2),
      actualWin: virtualBet.actualWin ? (virtualBet.actualWin / 100).toFixed(2) : null
    });
  } catch (error) {
    console.error("Error placing virtual bet:", error);
    res.status(400).json({ error: "Invalid virtual bet data" });
  }
});

// Update virtual bet result
router.patch("/api/virtual/bets/:id/result", async (req, res) => {
  try {
    const betId = parseInt(req.params.id);
    const { result, actualWin } = req.body;

    if (!result) {
      return res.status(400).json({ error: "Result is required" });
    }

    const actualWinInCents = actualWin ? Math.round(parseFloat(actualWin) * 100) : undefined;
    const updatedBet = await storage.updateVirtualBetResult(betId, result, actualWinInCents);

    res.json({
      ...updatedBet,
      stake: (updatedBet.stake / 100).toFixed(2),
      potentialWin: (updatedBet.potentialWin / 100).toFixed(2),
      actualWin: updatedBet.actualWin ? (updatedBet.actualWin / 100).toFixed(2) : null
    });
  } catch (error) {
    console.error("Error updating virtual bet result:", error);
    res.status(500).json({ error: "Failed to update virtual bet result" });
  }
});

// Delete virtual bet
router.delete("/api/virtual/bets/:id", async (req, res) => {
  try {
    const betId = parseInt(req.params.id);
    await storage.deleteVirtualBet(betId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting virtual bet:", error);
    res.status(500).json({ error: "Failed to delete virtual bet" });
  }
});

// Get virtual betting performance statistics
router.get("/api/virtual/performance", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string) || 999; // Fallback user ID for testing
    const bets = await storage.getUserVirtualBets(userId);

    // Calculate performance statistics
    const totalBets = bets.length;
    const settledBets = bets.filter(bet => bet.status === 'settled');
    const wonBets = settledBets.filter(bet => bet.result === 'win');

    // Keep everything in cents for consistency with database storage
    const totalStakedCents = bets.reduce((sum, bet) => sum + parseFloat(bet.stake.toString()), 0);
    const totalWinningsCents = settledBets.reduce((sum, bet) => sum + (bet.actualWin ? parseFloat(bet.actualWin.toString()) : 0), 0);
    const netProfitCents = totalWinningsCents - totalStakedCents;
    const winRate = settledBets.length > 0 ? wonBets.length / settledBets.length : 0;
    const roi = totalStakedCents > 0 ? netProfitCents / totalStakedCents : 0;
    const avgStakeCents = totalBets > 0 ? totalStakedCents / totalBets : 0;
    const avgWinCents = wonBets.length > 0 ? totalWinningsCents / wonBets.length : 0;

    // Performance by bet type
    const byBetType: Record<string, any> = {};
    bets.forEach(bet => {
      if (!byBetType[bet.betType]) {
        byBetType[bet.betType] = {
          count: 0,
          staked: 0,
          winnings: 0,
          won: 0,
          settled: 0
        };
      }
      byBetType[bet.betType].count++;
      byBetType[bet.betType].staked += parseFloat(bet.stake.toString());
      if (bet.status === 'settled') {
        byBetType[bet.betType].settled++;
        byBetType[bet.betType].winnings += bet.actualWin ? parseFloat(bet.actualWin.toString()) : 0;
        if (bet.result === 'win') {
          byBetType[bet.betType].won++;
        }
      }
    });

    // Calculate win rates by bet type
    Object.keys(byBetType).forEach(betType => {
      const data = byBetType[betType];
      data.winRate = data.settled > 0 ? data.won / data.settled : 0;
    });

    // Convert recent bets to proper dollar format for frontend display
    const convertedRecentBets = bets.slice(-10).reverse().map(bet => ({
      ...bet,
      stake: parseFloat(bet.stake.toString()) / 100,
      potentialWin: parseFloat(bet.potentialWin.toString()) / 100,
      actualWin: bet.actualWin ? (parseFloat(bet.actualWin.toString()) / 100) : null
    }));

    const stats = {
      totalBets: totalBets,
      totalStaked: totalStakedCents,
      totalWinnings: totalWinningsCents,
      netProfit: netProfitCents,
      winRate: winRate,
      roi: roi,
      avgStake: avgStakeCents,
      avgWin: avgWinCents,
      byBetType: byBetType,
      recentBets: convertedRecentBets
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching virtual performance:', error);
    res.status(500).json({ error: 'Failed to fetch virtual performance' });
  }
});

// Virtual Betting Slip API Endpoints

// Get user's virtual betting slip
router.get("/api/virtual/betting-slip", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const bettingSlip = await storage.getVirtualBettingSlip(userId);
    const convertedSlip = bettingSlip.map(item => ({
      ...item,
      stake: (item.stake / 100).toFixed(2),
      potentialWin: (item.potentialWin / 100).toFixed(2)
    }));

    res.json(convertedSlip);
  } catch (error) {
    console.error("Error fetching virtual betting slip:", error);
    res.status(500).json({ error: "Failed to fetch virtual betting slip" });
  }
});

// Add to virtual betting slip
router.post("/api/virtual/betting-slip", async (req, res) => {
  try {
    const { userId, gameId, betType, selection, odds } = req.body;

    if (!userId || !gameId || !betType || !selection || !odds) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const slipItem = await storage.addToVirtualBettingSlip({
      userId,
      gameId,
      betType,
      selection,
      odds,
      stake: 0,
      potentialWin: 0
    });

    res.status(201).json({
      ...slipItem,
      stake: (slipItem.stake / 100).toFixed(2),
      potentialWin: (slipItem.potentialWin / 100).toFixed(2)
    });
  } catch (error) {
    console.error("Error adding to virtual betting slip:", error);
    res.status(400).json({ error: "Invalid virtual betting slip data" });
  }
});

// Update virtual betting slip stake
router.patch("/api/virtual/betting-slip/:id", async (req, res) => {
  try {
    const slipId = parseInt(req.params.id);
    const { stake } = req.body;

    if (!stake || stake < 0) {
      return res.status(400).json({ error: "Valid stake is required" });
    }

    const stakeInCents = Math.round(parseFloat(stake) * 100);

    // Get the slip item to calculate potential win
    const slipItems = await storage.getVirtualBettingSlip(0); // This would need userId logic
    const currentItem = slipItems.find(item => item.id === slipId);

    if (!currentItem) {
      return res.status(404).json({ error: "Betting slip item not found" });
    }

    // Calculate potential win
    let potentialWinInCents;
    if (currentItem.odds > 0) {
      potentialWinInCents = Math.round((stakeInCents * currentItem.odds) / 100);
    } else {
      potentialWinInCents = Math.round((stakeInCents * 100) / Math.abs(currentItem.odds));
    }

    const updatedItem = await storage.updateVirtualBettingSlipStake(slipId, stakeInCents, potentialWinInCents);

    res.json({
      ...updatedItem,
      stake: (updatedItem.stake / 100).toFixed(2),
      potentialWin: (updatedItem.potentialWin / 100).toFixed(2)
    });
  } catch (error) {
    console.error("Error updating virtual betting slip stake:", error);
    res.status(500).json({ error: "Failed to update virtual betting slip stake" });
  }
});

// Remove from virtual betting slip
router.delete("/api/virtual/betting-slip/:id", async (req, res) => {
  try {
    const slipId = parseInt(req.params.id);
    await storage.removeFromVirtualBettingSlip(slipId);
    res.status(204).send();
  } catch (error) {
    console.error("Error removing from virtual betting slip:", error);
    res.status(500).json({ error: "Failed to remove from virtual betting slip" });
  }
});

// Clear virtual betting slip
router.delete("/api/virtual/betting-slip", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    await storage.clearVirtualBettingSlip(userId);
    res.status(204).send();
  } catch (error) {
    console.error("Error clearing virtual betting slip:", error);
    res.status(500).json({ error: "Failed to clear virtual betting slip" });
  }
});

export default router;
