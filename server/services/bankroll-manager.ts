import { db } from "../db";
import { users, bets, bankrollTransactions, auditLogs, bankrollSnapshots } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface TransactionRequest {
  userId: number;
  transactionType: 'bet_placed' | 'bet_won' | 'bet_lost' | 'bet_push' | 'deposit' | 'withdrawal' | 'bonus' | 'refund';
  amount: number; // amount in cents
  relatedBetId?: number;
  relatedGameId?: string;
  description: string;
  metadata?: any;
  processedBy?: string;
}

export interface AuditLogRequest {
  userId?: number;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  description: string;
  metadata?: any;
}

export class BankrollManager {
  
  /**
   * Process a bankroll transaction with full audit trail
   */
  async processTransaction(request: TransactionRequest): Promise<{ success: boolean; newBalance: number; transactionId: number }> {
    try {
      // Start transaction
      return await db.transaction(async (tx) => {
        // Get current user balance
        const [user] = await tx.select().from(users).where(eq(users.id, request.userId));
        if (!user) {
          throw new Error(`User ${request.userId} not found`);
        }

        const previousBalance = user.virtualBalance;
        const newBalance = previousBalance + request.amount;

        // Validate balance constraints
        if (newBalance < 0 && request.transactionType === 'bet_placed') {
          throw new Error('Insufficient funds for bet placement');
        }

        // Create transaction record
        const [transaction] = await tx.insert(bankrollTransactions).values({
          userId: request.userId,
          transactionType: request.transactionType,
          amount: request.amount,
          previousBalance,
          newBalance,
          relatedBetId: request.relatedBetId,
          relatedGameId: request.relatedGameId,
          description: request.description,
          metadata: request.metadata,
          processedBy: request.processedBy || 'system',
          status: 'completed'
        }).returning();

        // Update user balance and statistics
        const updateData: any = {
          virtualBalance: newBalance
        };

        // Update statistics based on transaction type
        if (request.transactionType === 'bet_won') {
          updateData.totalVirtualWinnings = user.totalVirtualWinnings + request.amount;
          updateData.winCount = user.winCount + 1;
        } else if (request.transactionType === 'bet_lost') {
          updateData.totalVirtualLosses = user.totalVirtualLosses + Math.abs(request.amount);
        } else if (request.transactionType === 'bet_placed') {
          updateData.betCount = user.betCount + 1;
        }

        await tx.update(users).set(updateData).where(eq(users.id, request.userId));

        // Create audit log
        await this.createAuditLog({
          userId: request.userId,
          action: 'balance_updated',
          entityType: 'bankroll_transaction',
          entityId: transaction.id.toString(),
          oldValues: { balance: previousBalance },
          newValues: { balance: newBalance, transactionType: request.transactionType, amount: request.amount },
          severity: 'info',
          description: `Balance updated: ${request.description}`,
          metadata: { transactionId: transaction.id, ...request.metadata }
        });

        return {
          success: true,
          newBalance,
          transactionId: transaction.id
        };
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      
      // Log error to audit trail
      await this.createAuditLog({
        userId: request.userId,
        action: 'transaction_failed',
        entityType: 'bankroll_transaction',
        severity: 'error',
        description: `Transaction failed: ${error.message}`,
        metadata: { error: error.message, request }
      });

      throw error;
    }
  }

  /**
   * Process bet placement with bankroll deduction
   */
  async processBetPlacement(userId: number, betId: number, stakeAmount: number, gameId: string, betDescription: string): Promise<{ success: boolean; newBalance: number }> {
    const stakeInCents = Math.round(stakeAmount * 100);
    
    const result = await this.processTransaction({
      userId,
      transactionType: 'bet_placed',
      amount: -stakeInCents, // negative for debit
      relatedBetId: betId,
      relatedGameId: gameId,
      description: `Bet placed: ${betDescription}`,
      metadata: { betId, gameId, stakeAmount },
      processedBy: 'system'
    });

    await this.createAuditLog({
      userId,
      action: 'bet_placed',
      entityType: 'bet',
      entityId: betId.toString(),
      newValues: { betId, stakeAmount, gameId },
      severity: 'info',
      description: `Bet placed for $${stakeAmount.toFixed(2)}`,
      metadata: { transactionId: result.transactionId }
    });

    return result;
  }

  /**
   * Process bet settlement with bankroll adjustment
   */
  async processBetSettlement(userId: number, betId: number, result: 'win' | 'loss' | 'push', winAmount: number, gameId: string, betDescription: string): Promise<{ success: boolean; newBalance: number }> {
    const winAmountInCents = Math.round(winAmount * 100);
    
    let transactionType: TransactionRequest['transactionType'];
    let amount: number;
    let description: string;

    switch (result) {
      case 'win':
        transactionType = 'bet_won';
        amount = winAmountInCents; // positive for credit
        description = `Bet won: ${betDescription} - Payout $${winAmount.toFixed(2)}`;
        break;
      case 'loss':
        transactionType = 'bet_lost';
        amount = 0; // no credit for losses (stake already deducted)
        description = `Bet lost: ${betDescription}`;
        break;
      case 'push':
        transactionType = 'bet_push';
        // For push, refund the original stake
        const [bet] = await db.select().from(bets).where(eq(bets.id, betId));
        const stakeInCents = Math.round(parseFloat(bet.stake.toString()) * 100);
        amount = stakeInCents; // positive to refund stake
        description = `Bet pushed: ${betDescription} - Stake refunded`;
        break;
    }

    const transactionResult = await this.processTransaction({
      userId,
      transactionType,
      amount,
      relatedBetId: betId,
      relatedGameId: gameId,
      description,
      metadata: { betId, gameId, result, winAmount },
      processedBy: 'system'
    });

    await this.createAuditLog({
      userId,
      action: 'bet_settled',
      entityType: 'bet',
      entityId: betId.toString(),
      newValues: { betId, result, winAmount, gameId },
      severity: 'info',
      description: `Bet settled: ${result.toUpperCase()} - ${betDescription}`,
      metadata: { transactionId: transactionResult.transactionId }
    });

    return transactionResult;
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(request: AuditLogRequest): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: request.userId,
        action: request.action,
        entityType: request.entityType,
        entityId: request.entityId,
        oldValues: request.oldValues,
        newValues: request.newValues,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        sessionId: request.sessionId,
        severity: request.severity || 'info',
        description: request.description,
        metadata: request.metadata
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get user transaction history
   */
  async getUserTransactionHistory(userId: number, limit: number = 50) {
    return await db.select()
      .from(bankrollTransactions)
      .where(eq(bankrollTransactions.userId, userId))
      .orderBy(sql`created_at DESC`)
      .limit(limit);
  }

  /**
   * Get user audit trail
   */
  async getUserAuditTrail(userId: number, limit: number = 100) {
    return await db.select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(sql`created_at DESC`)
      .limit(limit);
  }

  /**
   * Create daily bankroll snapshot
   */
  async createDailySnapshot(userId: number, snapshotDate: string): Promise<void> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return;

      // Get yesterday's snapshot for starting balance
      const yesterday = new Date(snapshotDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const [previousSnapshot] = await db.select()
        .from(bankrollSnapshots)
        .where(and(
          eq(bankrollSnapshots.userId, userId),
          eq(bankrollSnapshots.snapshotDate, yesterdayStr)
        ));

      const startingBalance = previousSnapshot?.endingBalance || user.virtualBalance;

      // Get day's transactions
      const transactions = await db.select()
        .from(bankrollTransactions)
        .where(and(
          eq(bankrollTransactions.userId, userId),
          sql`DATE(created_at) = ${snapshotDate}`
        ));

      let totalWagered = 0;
      let totalWon = 0;
      let totalLost = 0;
      let betsPlaced = 0;
      let betsWon = 0;
      let betsLost = 0;

      transactions.forEach(transaction => {
        switch (transaction.transactionType) {
          case 'bet_placed':
            totalWagered += Math.abs(transaction.amount);
            betsPlaced++;
            break;
          case 'bet_won':
            totalWon += transaction.amount;
            betsWon++;
            break;
          case 'bet_lost':
            betsLost++;
            break;
        }
      });

      const netChange = user.virtualBalance - startingBalance;
      const winRate = betsPlaced > 0 ? (betsWon / betsPlaced) * 100 : 0;
      const roi = totalWagered > 0 ? (netChange / totalWagered) * 100 : 0;

      await db.insert(bankrollSnapshots).values({
        userId,
        snapshotDate,
        startingBalance,
        endingBalance: user.virtualBalance,
        totalWagered,
        totalWon,
        totalLost,
        betsPlaced,
        betsWon,
        betsLost,
        netChange,
        winRate: winRate.toFixed(2),
        roi: roi.toFixed(2)
      });

    } catch (error) {
      console.error('Failed to create daily snapshot:', error);
    }
  }

  /**
   * Get user bankroll analytics
   */
  async getUserBankrollAnalytics(userId: number) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('User not found');

    // Get recent transactions
    const recentTransactions = await this.getUserTransactionHistory(userId, 10);

    // Get daily snapshots for trend analysis
    const snapshots = await db.select()
      .from(bankrollSnapshots)
      .where(eq(bankrollSnapshots.userId, userId))
      .orderBy(sql`snapshot_date DESC`)
      .limit(30);

    // Calculate metrics
    const totalBets = user.betCount;
    const totalWins = user.winCount;
    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
    const totalWagered = user.totalVirtualLosses + user.totalVirtualWinnings;
    const netProfit = user.totalVirtualWinnings - user.totalVirtualLosses;
    const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;

    return {
      currentBalance: user.virtualBalance / 100, // convert cents to dollars
      totalBets,
      totalWins,
      winRate: winRate.toFixed(2),
      totalWagered: totalWagered / 100,
      netProfit: netProfit / 100,
      roi: roi.toFixed(2),
      recentTransactions: recentTransactions.map(t => ({
        ...t,
        amount: t.amount / 100,
        previousBalance: t.previousBalance / 100,
        newBalance: t.newBalance / 100
      })),
      dailySnapshots: snapshots.map(s => ({
        ...s,
        startingBalance: s.startingBalance / 100,
        endingBalance: s.endingBalance / 100,
        totalWagered: s.totalWagered / 100,
        totalWon: s.totalWon / 100,
        totalLost: s.totalLost / 100,
        netChange: s.netChange / 100
      }))
    };
  }
}

export const bankrollManager = new BankrollManager();