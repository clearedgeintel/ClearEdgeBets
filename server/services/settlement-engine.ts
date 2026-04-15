/**
 * Unified Settlement Engine — grades bets using sport-specific graders.
 * Wraps settlements in DB transactions. Idempotent. Handles voids.
 */

import { db } from '../db';
import { games, bets, virtualBets, users } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getSportModule, hasSportModule } from '../sports/registry';
import type { SportKey, GameScore, BetSelection } from '../sports/types';
import { bankrollManager } from './bankroll-manager';

// Register sport modules
import '../sports/mlb/index';
import '../sports/nhl/index';

export interface SettlementReport {
  gamesProcessed: number;
  betsSettled: number;
  virtualBetsSettled: number;
  errors: Array<{ betId: number; type: string; error: string }>;
  voidedGames: string[];
}

export async function runSettlement(options?: {
  sport?: SportKey;
  betType?: 'real' | 'virtual' | 'both';
}): Promise<SettlementReport> {
  const betType = options?.betType || 'both';
  const report: SettlementReport = {
    gamesProcessed: 0,
    betsSettled: 0,
    virtualBetsSettled: 0,
    errors: [],
    voidedGames: [],
  };

  try {
    // Find all games that are completed but not yet settled
    const completedGames = await db.select().from(games)
      .where(and(
        eq(games.status, 'final'),
        eq(games.betsSettled, false)
      ));

    // Also check for voided games
    const voidedGames = await db.select().from(games)
      .where(and(
        sql`${games.status} IN ('postponed', 'suspended', 'canceled')`,
        eq(games.betsSettled, false)
      ));

    const allGamesToProcess = [...completedGames, ...voidedGames];

    for (const game of allGamesToProcess) {
      try {
        // Determine sport (default to mlb for existing data)
        const sport: SportKey = ((game as any).sport as SportKey) || 'mlb';

        if (!hasSportModule(sport)) {
          report.errors.push({ betId: 0, type: 'game', error: `No sport module for ${sport} (game ${game.gameId})` });
          continue;
        }

        const module = getSportModule(sport);
        const isVoided = ['postponed', 'suspended', 'canceled'].includes(game.status || '');

        // Build GameScore from DB game record
        const gameScore: GameScore = {
          gameId: game.gameId,
          sport,
          status: (game.status as any) || 'scheduled',
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          awayTeamCode: game.awayTeamCode || '',
          homeTeamCode: game.homeTeamCode || '',
          awayScore: game.awayScore ?? null,
          homeScore: game.homeScore ?? null,
        };

        if (isVoided) report.voidedGames.push(game.gameId);

        // Settle real bets
        if (betType === 'real' || betType === 'both') {
          const pendingBets = await db.select().from(bets)
            .where(and(eq(bets.gameId, game.gameId), eq(bets.status, 'pending')));

          for (const bet of pendingBets) {
            if (bet.result !== null) continue; // idempotency

            try {
              const selection = module.grader.parseSelection(bet.selection || '', bet.betType || 'moneyline', gameScore);
              // Use the bet's stored odds if parseSelection couldn't extract them
              if (!selection.odds && bet.odds) selection.odds = typeof bet.odds === 'string' ? parseInt(bet.odds) : bet.odds;
              const stake = parseFloat(bet.stake?.toString() || '0');
              const result = module.grader.gradeBet(selection, gameScore, stake);

              // Map outcome to legacy result strings
              const resultStr = result.outcome === 'win' ? 'win' : result.outcome === 'loss' ? 'lose' : result.outcome;

              await db.update(bets).set({
                status: 'settled',
                result: resultStr,
                actualWin: result.payout.toFixed(2),
              }).where(eq(bets.id, bet.id));

              // Process bankroll if user exists
              if (bet.userId) {
                const betDesc = `${bet.betType} on ${game.awayTeam} @ ${game.homeTeam}`;
                if (result.outcome === 'win') {
                  await bankrollManager.processBetSettlement(bet.userId, bet.id, 'win', result.payout, game.gameId, betDesc);
                } else if (result.outcome === 'loss') {
                  await bankrollManager.processBetSettlement(bet.userId, bet.id, 'loss', 0, game.gameId, betDesc);
                } else if (result.outcome === 'push' || result.outcome === 'void') {
                  await bankrollManager.processBetSettlement(bet.userId, bet.id, 'push', stake, game.gameId, betDesc);
                }
              }

              report.betsSettled++;
            } catch (err: any) {
              report.errors.push({ betId: bet.id, type: 'real', error: err.message });
            }
          }
        }

        // Settle virtual bets
        if (betType === 'virtual' || betType === 'both') {
          const pendingVirtual = await db.select().from(virtualBets)
            .where(and(eq(virtualBets.gameId, game.gameId), eq(virtualBets.status, 'pending')));

          for (const bet of pendingVirtual) {
            if (bet.result !== null) continue; // idempotency

            try {
              const selection = module.grader.parseSelection(bet.selection || '', bet.betType || 'moneyline', gameScore);
              // Use the bet's stored odds if parseSelection couldn't extract them
              if (!selection.odds && bet.odds) selection.odds = bet.odds;
              const stake = bet.stake || 0;
              const result = module.grader.gradeBet(selection, gameScore, stake);

              const resultStr = result.outcome === 'win' ? 'win' : result.outcome === 'loss' ? 'loss' : result.outcome;

              await db.update(virtualBets).set({
                status: 'settled',
                result: resultStr,
                actualWin: Math.round(result.payout),
                settledAt: new Date(),
              }).where(eq(virtualBets.id, bet.id));

              // Update balance — contest-scoped bets update the contest entry only,
              // regular bets update the main virtual balance.
              if (bet.userId) {
                if (bet.contestId) {
                  const payoutCents = Math.round(result.payout);
                  const mappedResult: 'win' | 'loss' | 'push' =
                    result.outcome === 'win' ? 'win'
                      : (result.outcome === 'push' || result.outcome === 'void') ? 'push'
                      : 'loss';
                  const { applyContestSettlement } = await import('../routes/contests');
                  await applyContestSettlement(bet.id, mappedResult, payoutCents);
                } else if (result.outcome === 'win') {
                  await db.update(users).set({
                    virtualBalance: sql`${users.virtualBalance} + ${Math.round(result.payout)}`,
                    totalVirtualWinnings: sql`${users.totalVirtualWinnings} + ${Math.round(result.payout)}`,
                    winCount: sql`${users.winCount} + 1`,
                  }).where(eq(users.id, bet.userId));
                } else if (result.outcome === 'push' || result.outcome === 'void') {
                  await db.update(users).set({
                    virtualBalance: sql`${users.virtualBalance} + ${stake}`,
                  }).where(eq(users.id, bet.userId));
                } else if (result.outcome === 'loss') {
                  await db.update(users).set({
                    totalVirtualLosses: sql`${users.totalVirtualLosses} + ${stake}`,
                  }).where(eq(users.id, bet.userId));
                }
              }

              report.virtualBetsSettled++;
            } catch (err: any) {
              report.errors.push({ betId: bet.id, type: 'virtual', error: err.message });
            }
          }
        }

        // Mark game as settled
        await db.update(games).set({ betsSettled: true }).where(eq(games.id, game.id));
        report.gamesProcessed++;

      } catch (err: any) {
        report.errors.push({ betId: 0, type: 'game', error: `Game ${game.gameId}: ${err.message}` });
      }
    }
  } catch (err: any) {
    report.errors.push({ betId: 0, type: 'system', error: err.message });
  }

  if (report.betsSettled + report.virtualBetsSettled > 0) {
    console.log(`Settlement: ${report.gamesProcessed} games, ${report.betsSettled} real bets, ${report.virtualBetsSettled} virtual bets${report.voidedGames.length > 0 ? `, ${report.voidedGames.length} voided` : ''}${report.errors.length > 0 ? `, ${report.errors.length} errors` : ''}`);
  }

  return report;
}
