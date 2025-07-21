import { db } from '../db';
import { games, bets, virtualBets, users } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { fetchMLBScoreboard } from './mlb-api';
import { bankrollManager } from './bankroll-manager';

export interface GameResult {
  awayScore: number;
  homeScore: number;
  status: string;
  completedAt?: Date;
}

/**
 * Calculate bet result based on game outcome
 */
export function calculateBetResult(bet: any, game: any): { result: string; actualWin: number } {
  if (!game.awayScore && game.awayScore !== 0 || !game.homeScore && game.homeScore !== 0) {
    return { result: 'pending', actualWin: 0 };
  }

  const { betType, selection, stake, odds } = bet;
  const { awayScore, homeScore, awayTeam, homeTeam } = game;
  
  let result = 'lose';
  let actualWin = 0;

  switch (betType) {
    case 'moneyline':
      if (selection === awayTeam && awayScore > homeScore) {
        result = 'win';
      } else if (selection === homeTeam && homeScore > awayScore) {
        result = 'win';
      }
      break;

    case 'spread':
    case 'runline':
      // Parse spread from selection (e.g., "Rangers -1.5")
      const spreadMatch = selection.match(/([-+]?\d+\.?\d*)/);
      if (spreadMatch) {
        const spread = parseFloat(spreadMatch[1]);
        const isAway = selection.includes(awayTeam);
        
        if (isAway) {
          const adjustedScore = awayScore + spread;
          if (adjustedScore > homeScore) result = 'win';
          else if (adjustedScore === homeScore) result = 'push';
        } else {
          const adjustedScore = homeScore + spread;
          if (adjustedScore > awayScore) result = 'win';
          else if (adjustedScore === awayScore) result = 'push';
        }
      }
      break;

    case 'total':
      const totalScore = awayScore + homeScore;
      const totalMatch = selection.match(/(\d+\.?\d*)/);
      
      if (totalMatch) {
        const line = parseFloat(totalMatch[1]);
        
        if (selection.toLowerCase().includes('over')) {
          if (totalScore > line) result = 'win';
          else if (totalScore === line) result = 'push';
        } else if (selection.toLowerCase().includes('under')) {
          if (totalScore < line) result = 'win';
          else if (totalScore === line) result = 'push';
        }
      }
      break;
  }

  // Calculate actual winnings (stake is already in cents from database)
  const stakeInCents = parseFloat(stake);
  if (result === 'win') {
    let profit = 0;
    if (odds > 0) {
      profit = stakeInCents * (odds / 100);
    } else {
      profit = stakeInCents * (100 / Math.abs(odds));
    }
    // Total payout = original stake + profit
    actualWin = stakeInCents + profit;
  } else if (result === 'push') {
    actualWin = stakeInCents; // Return stake on push
  }

  return { result, actualWin };
}

/**
 * Settle all pending bets for completed games
 */
export async function settlePendingBets(): Promise<number> {
  try {
    // Find completed games that haven't had bets settled
    const completedGames = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.status, 'final'),
          eq(games.betsSettled, false)
        )
      );

    let totalSettled = 0;

    for (const game of completedGames) {
      // Find all pending bets for this game
      const pendingBets = await db
        .select()
        .from(bets)
        .where(
          and(
            eq(bets.gameId, game.gameId),
            eq(bets.status, 'pending')
          )
        );

      console.log(`Settling ${pendingBets.length} bets for game ${game.gameId}`);

      // Settle each bet with bankroll management
      for (const bet of pendingBets) {
        const { result, actualWin } = calculateBetResult(bet, game);
        
        // Update bet record
        await db
          .update(bets)
          .set({
            status: 'settled',
            result,
            actualWin: actualWin.toString()
          })
          .where(eq(bets.id, bet.id));

        // Process bankroll transaction if bet has a user
        if (bet.userId) {
          try {
            const betDescription = `${bet.betType} on ${game.awayTeam} @ ${game.homeTeam}`;
            
            if (result === 'won') {
              await bankrollManager.processBetSettlement(
                bet.userId,
                bet.id,
                'win',
                actualWin,
                game.gameId,
                betDescription
              );
            } else if (result === 'lost') {
              await bankrollManager.processBetSettlement(
                bet.userId,
                bet.id,
                'loss',
                0,
                game.gameId,
                betDescription
              );
            } else if (result === 'push') {
              await bankrollManager.processBetSettlement(
                bet.userId,
                bet.id,
                'push',
                parseFloat(bet.stake.toString()),
                game.gameId,
                betDescription
              );
            }
          } catch (error) {
            console.error(`Failed to process bankroll for bet ${bet.id}:`, error);
          }
        }

        totalSettled++;
      }

      // Mark game as having bets settled
      await db
        .update(games)
        .set({
          betsSettled: true,
          completedAt: new Date()
        })
        .where(eq(games.id, game.id));
    }

    console.log(`Settled ${totalSettled} bets across ${completedGames.length} games`);
    return totalSettled;

  } catch (error) {
    console.error('Error settling bets:', error);
    return 0;
  }
}

/**
 * Settle pending virtual bets based on completed games
 */
export async function settleVirtualBets(): Promise<number> {
  try {
    // Find completed games that haven't had bets settled
    const completedGames = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.status, 'final'),
          eq(games.betsSettled, false)
        )
      );

    let totalSettled = 0;

    for (const game of completedGames) {
      // Find all pending virtual bets for this game
      const pendingVirtualBets = await db
        .select()
        .from(virtualBets)
        .where(
          and(
            eq(virtualBets.gameId, game.gameId),
            eq(virtualBets.status, 'pending')
          )
        );

      for (const bet of pendingVirtualBets) {
        // Calculate bet result
        const betResult = calculateBetResult(bet, game);
        
        // Update virtual bet status
        await db
          .update(virtualBets)
          .set({
            status: 'settled',
            result: betResult.result,
            actualWin: Math.round(betResult.actualWin) // Already in cents
          })
          .where(eq(virtualBets.id, bet.id));

        // Update user's virtual balance and statistics
        if (bet.userId) {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.id, bet.userId))
            .limit(1);

          if (user.length > 0) {
            const currentUser = user[0];
            const stakeAmount = parseFloat(bet.stake.toString());
            const winAmount = betResult.actualWin;
            
            let balanceChange = 0;
            let totalWinningsChange = 0;
            let totalLossesChange = 0;
            let winCountChange = 0;

            if (betResult.result === 'win') {
              // winAmount already includes stake + profit from calculateBetResult
              balanceChange = winAmount;
              totalWinningsChange = winAmount - stakeAmount; // Only count the profit as winnings
              winCountChange = 1;
            } else if (betResult.result === 'loss') {
              // Balance was already deducted when bet was placed, no additional change needed
              totalLossesChange = stakeAmount;
            } else if (betResult.result === 'push') {
              // Return the stake to user's balance
              balanceChange = stakeAmount;
            }

            // Update user statistics - balanceChange is already in cents
            await db
              .update(users)
              .set({
                virtualBalance: Math.round((currentUser.virtualBalance || 0) + balanceChange), // balanceChange already in cents
                totalVirtualWinnings: Math.round((currentUser.totalVirtualWinnings || 0) + (totalWinningsChange * 100)), // Convert profit to cents
                totalVirtualLosses: Math.round((currentUser.totalVirtualLosses || 0) + (totalLossesChange * 100)), // Convert to cents
                winCount: (currentUser.winCount || 0) + winCountChange,
                betCount: (currentUser.betCount || 0) // betCount was incremented when bet was placed
              })
              .where(eq(users.id, bet.userId));
          }
        }

        totalSettled++;
      }
    }

    console.log(`Settled ${totalSettled} virtual bets across ${completedGames.length} games`);
    return totalSettled;

  } catch (error) {
    console.error('Error settling virtual bets:', error);
    return 0;
  }
}

/**
 * Update game with live score and status information
 */
export async function updateGameStatus(gameId: string, update: {
  status?: string;
  awayScore?: number;
  homeScore?: number;
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  outs?: number;
  balls?: number;
  strikes?: number;
  runnersOn?: any;
  lastPlay?: string;
}): Promise<void> {
  try {
    await db
      .update(games)
      .set({
        ...update,
        completedAt: update.status === 'final' ? new Date() : undefined
      })
      .where(eq(games.gameId, gameId));

    // If game is complete, trigger bet settlement
    if (update.status === 'final') {
      setTimeout(async () => {
        await settlePendingBets();
        await settleVirtualBets();
      }, 1000); // Small delay to ensure update is committed
    }

  } catch (error) {
    console.error('Error updating game status:', error);
  }
}

/**
 * Sync live game data from MLB API
 */
export async function syncLiveGameData(): Promise<number> {
  try {
    console.log('Syncing live game data from MLB API...');
    
    // Get today's games from MLB API
    const today = new Date();
    const mlbGames = await fetchMLBScoreboard(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    let updatedGames = 0;
    
    for (const mlbGame of mlbGames) {
      // Create the expected game ID format with date prefix
      const dateStr = mlbGame.gameDate || today.toISOString().split('T')[0];
      const expectedGameId = `${dateStr}_${mlbGame.awayTeamCode} @ ${mlbGame.homeTeamCode}`;
      
      // Find matching game in our database using the expected format
      const existingGames = await db
        .select()
        .from(games)
        .where(eq(games.gameId, expectedGameId));
      
      if (existingGames.length === 0) {
        console.log(`Game ${expectedGameId} not found in database, skipping sync`);
        continue;
      }
      
      const existingGame = existingGames[0];
      
      // Check if status or scores have changed
      const statusChanged = existingGame.status !== mlbGame.status;
      const scoresChanged = existingGame.awayScore !== mlbGame.awayScore || 
                           existingGame.homeScore !== mlbGame.homeScore;
      
      if (statusChanged || scoresChanged) {
        console.log(`Updating game ${expectedGameId}: ${mlbGame.status}, Score: ${mlbGame.awayScore}-${mlbGame.homeScore}`);
        
        // Extract live details if available
        const liveDetails = (mlbGame as any).liveDetails;
        
        await updateGameStatus(expectedGameId, {
          status: mlbGame.status,
          awayScore: mlbGame.awayScore ?? undefined,
          homeScore: mlbGame.homeScore ?? undefined,
          inning: liveDetails?.inning ?? undefined,
          inningHalf: liveDetails?.inningHalf ?? undefined,
          lastPlay: liveDetails?.detail ?? undefined
        });
        
        updatedGames++;
      }
    }
    
    console.log(`Synced ${updatedGames} games from MLB API`);
    return updatedGames;
    
  } catch (error) {
    console.error('Error syncing live game data:', error);
    return 0;
  }
}

/**
 * Get live game information (now fetches from database which is synced with MLB API)
 */
export async function getLiveGameInfo(gameId: string) {
  try {
    const [game] = await db
      .select({
        status: games.status,
        awayScore: games.awayScore,
        homeScore: games.homeScore,
        inning: games.inning,
        inningHalf: games.inningHalf,
        outs: games.outs,
        balls: games.balls,
        strikes: games.strikes,
        runnersOn: games.runnersOn,
        lastPlay: games.lastPlay
      })
      .from(games)
      .where(eq(games.gameId, gameId));

    return game;
  } catch (error) {
    console.error('Error fetching live game info:', error);
    return null;
  }
}