import { users, games, odds, aiSummaries, bets, props, dailyPicks, consensusData, performanceTracking, type User, type InsertUser, type Game, type InsertGame, type Odds, type InsertOdds, type AiSummary, type InsertAiSummary, type Bet, type InsertBet, type Prop, type InsertProp, type DailyPick, type InsertDailyPick, type ConsensusData, type InsertConsensusData, type PerformanceTracking, type InsertPerformanceTracking } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: number, subscriptionData: {
    tier: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status?: string;
    endDate?: Date;
  }): Promise<User>;

  // Game methods
  getAllTodaysGames(): Promise<Game[]>;
  getGame(gameId: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(gameId: string, updates: Partial<Game>): Promise<Game>;

  // Odds methods
  getOddsByGameId(gameId: string): Promise<Odds[]>;
  createOdds(odds: InsertOdds): Promise<Odds>;
  updateOdds(gameId: string, bookmaker: string, odds: Partial<Odds>): Promise<Odds>;

  // AI Summary methods
  getAiSummary(gameId: string): Promise<AiSummary | undefined>;
  createAiSummary(summary: InsertAiSummary): Promise<AiSummary>;

  // Bet methods
  getUserBets(userId?: number): Promise<Bet[]>;
  createBet(bet: InsertBet): Promise<Bet>;
  updateBetResult(betId: number, result: string, actualWin?: number): Promise<Bet>;

  // Props methods
  getPropsByGameId(gameId: string): Promise<Prop[]>;
  createProp(prop: InsertProp): Promise<Prop>;

  // Daily Pick methods
  getDailyPicks(date: string): Promise<DailyPick[]>;
  createDailyPick(pick: InsertDailyPick): Promise<DailyPick>;
  updateDailyPickResult(pickId: number, result: string | null): Promise<DailyPick>;

  // Consensus Data methods
  getConsensusData(gameId: string): Promise<ConsensusData[]>;
  createConsensusData(data: InsertConsensusData): Promise<ConsensusData>;
  updateConsensusData(gameId: string, market: string, updates: Partial<ConsensusData>): Promise<ConsensusData>;

  // Performance Tracking methods
  getPerformanceTracking(dateRange?: { start: string; end: string }): Promise<PerformanceTracking[]>;
  createPerformanceTracking(data: InsertPerformanceTracking): Promise<PerformanceTracking>;
  updatePerformanceTracking(gameId: string, updates: Partial<PerformanceTracking>): Promise<PerformanceTracking>;
  getPerformanceStats(dateRange?: { start: string; end: string }): Promise<{
    totalGames: number;
    winnerAccuracy: number;
    totalAccuracy: number;
    spreadAccuracy: number;
    avgConfidence: number;
    pitchingAccuracy: number;
    monthlyBreakdown: Array<{
      month: string;
      games: number;
      accuracy: number;
    }>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<string, Game>;
  private odds: Map<string, Odds[]>;
  private aiSummaries: Map<string, AiSummary>;
  private bets: Map<number, Bet>;
  private props: Map<string, Prop[]>;
  private dailyPicks: Map<string, DailyPick[]>;
  private consensusData: Map<string, ConsensusData[]>;
  private currentUserId: number;
  private currentBetId: number;
  private currentPropId: number;
  private currentPickId: number;
  private currentConsensusId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.odds = new Map();
    this.aiSummaries = new Map();
    this.bets = new Map();
    this.props = new Map();
    this.dailyPicks = new Map();
    this.consensusData = new Map();
    this.currentUserId = 1;
    this.currentBetId = 1;
    this.currentPropId = 1;
    this.currentPickId = 1;
    this.currentConsensusId = 1;

    // Add sample users for admin testing
    this.addSampleUsers();
  }

  private addSampleUsers() {
    const sampleUsers = [
      {
        id: 1,
        username: "admin_user",
        email: "admin@clearedgebets.com",
        password: "hashedpassword",
        subscriptionTier: "elite",
        subscriptionStatus: "active",
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        stripeCustomerId: "cus_admin123",
        stripeSubscriptionId: "sub_admin123",
        createdAt: new Date("2024-01-15")
      },
      {
        id: 2,
        username: "pro_bettor",
        email: "probettor@example.com",
        password: "hashedpassword",
        subscriptionTier: "pro",
        subscriptionStatus: "active",
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripeCustomerId: "cus_pro456",
        stripeSubscriptionId: "sub_pro456",
        createdAt: new Date("2024-06-01")
      },
      {
        id: 3,
        username: "casual_user",
        email: "casual@example.com",
        password: "hashedpassword",
        subscriptionTier: "free",
        subscriptionStatus: null,
        subscriptionEndDate: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdAt: new Date("2025-06-15")
      },
      {
        id: 4,
        username: "former_pro",
        email: "former@example.com",
        password: "hashedpassword",
        subscriptionTier: "pro",
        subscriptionStatus: "canceled",
        subscriptionEndDate: new Date("2025-06-20"),
        stripeCustomerId: "cus_former789",
        stripeSubscriptionId: "sub_former789",
        createdAt: new Date("2024-12-01")
      },
      {
        id: 5,
        username: "elite_trader",
        email: "elite@example.com",
        password: "hashedpassword",
        subscriptionTier: "elite",
        subscriptionStatus: "active",
        subscriptionEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        stripeCustomerId: "cus_elite101",
        stripeSubscriptionId: "sub_elite101",
        createdAt: new Date("2025-01-01")
      }
    ];

    sampleUsers.forEach(user => {
      this.users.set(user.id, user as User);
    });
    
    this.currentUserId = 6; // Next available ID
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllTodaysGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGame(gameId: string): Promise<Game | undefined> {
    return this.games.get(gameId);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const game: Game = { 
      ...insertGame, 
      id: this.games.size + 1,
      createdAt: new Date(),
      status: insertGame.status || "scheduled",
      awayPitcher: insertGame.awayPitcher || null,
      homePitcher: insertGame.homePitcher || null,
      awayPitcherStats: insertGame.awayPitcherStats || null,
      homePitcherStats: insertGame.homePitcherStats || null
    };
    this.games.set(insertGame.gameId, game);
    return game;
  }

  async updateGame(gameId: string, updates: Partial<Game>): Promise<Game> {
    const existingGame = this.games.get(gameId);
    if (!existingGame) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    const updatedGame = { ...existingGame, ...updates };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  async getOddsByGameId(gameId: string): Promise<Odds[]> {
    return this.odds.get(gameId) || [];
  }

  async createOdds(insertOdds: InsertOdds): Promise<Odds> {
    const odds: Odds = { 
      ...insertOdds, 
      id: this.odds.size + 1,
      updatedAt: new Date(),
      awayOdds: insertOdds.awayOdds || null,
      homeOdds: insertOdds.homeOdds || null,
      overOdds: insertOdds.overOdds || null,
      underOdds: insertOdds.underOdds || null,
      total: insertOdds.total || null,
      awaySpread: insertOdds.awaySpread || null,
      homeSpread: insertOdds.homeSpread || null,
      awaySpreadOdds: insertOdds.awaySpreadOdds || null,
      homeSpreadOdds: insertOdds.homeSpreadOdds || null,
      publicPercentage: insertOdds.publicPercentage || null
    };
    
    const gameOdds = this.odds.get(insertOdds.gameId) || [];
    gameOdds.push(odds);
    this.odds.set(insertOdds.gameId, gameOdds);
    
    return odds;
  }

  async updateOdds(gameId: string, bookmaker: string, updates: Partial<Odds>): Promise<Odds> {
    const gameOdds = this.odds.get(gameId) || [];
    const existingOddsIndex = gameOdds.findIndex(o => o.bookmaker === bookmaker);
    
    if (existingOddsIndex === -1) {
      throw new Error(`Odds for game ${gameId} and bookmaker ${bookmaker} not found`);
    }
    
    const updatedOdds = { ...gameOdds[existingOddsIndex], ...updates, updatedAt: new Date() };
    gameOdds[existingOddsIndex] = updatedOdds;
    this.odds.set(gameId, gameOdds);
    
    return updatedOdds;
  }

  async getAiSummary(gameId: string): Promise<AiSummary | undefined> {
    return this.aiSummaries.get(gameId);
  }

  async createAiSummary(insertSummary: InsertAiSummary): Promise<AiSummary> {
    const summary: AiSummary = { 
      ...insertSummary, 
      id: this.aiSummaries.size + 1,
      createdAt: new Date(),
      valuePlays: insertSummary.valuePlays || []
    };
    this.aiSummaries.set(insertSummary.gameId, summary);
    return summary;
  }

  async getUserBets(userId?: number): Promise<Bet[]> {
    if (userId) {
      return Array.from(this.bets.values()).filter(bet => bet.userId === userId);
    }
    return Array.from(this.bets.values());
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const id = this.currentBetId++;
    const bet: Bet = { 
      ...insertBet, 
      id,
      placedAt: new Date(),
      status: insertBet.status || "pending",
      result: insertBet.result || null,
      actualWin: insertBet.actualWin || null,
      notes: insertBet.notes || null,
      confidence: insertBet.confidence || null,
      userId: insertBet.userId || null
    };
    this.bets.set(id, bet);
    return bet;
  }

  async updateBetResult(betId: number, result: string, actualWin?: number): Promise<Bet> {
    const existingBet = this.bets.get(betId);
    if (!existingBet) {
      throw new Error(`Bet with ID ${betId} not found`);
    }
    const updatedBet = { ...existingBet, result, actualWin: actualWin?.toString() || null, status: "settled" };
    this.bets.set(betId, updatedBet);
    return updatedBet;
  }

  async getPropsByGameId(gameId: string): Promise<Prop[]> {
    return this.props.get(gameId) || [];
  }

  async createProp(insertProp: InsertProp): Promise<Prop> {
    const prop: Prop = { 
      ...insertProp, 
      id: this.currentPropId++,
      description: insertProp.description || null
    };
    
    const gameProps = this.props.get(insertProp.gameId) || [];
    gameProps.push(prop);
    this.props.set(insertProp.gameId, gameProps);
    
    return prop;
  }

  // Daily Pick methods
  async getDailyPicks(date: string): Promise<DailyPick[]> {
    return this.dailyPicks.get(date) || [];
  }

  async createDailyPick(insertPick: InsertDailyPick): Promise<DailyPick> {
    const pick: DailyPick = {
      ...insertPick,
      id: this.currentPickId++,
      createdAt: new Date(),
      status: insertPick.status || "active",
      result: insertPick.result || null,
      expectedValue: insertPick.expectedValue || null
    };

    const datePicks = this.dailyPicks.get(insertPick.date) || [];
    datePicks.push(pick);
    this.dailyPicks.set(insertPick.date, datePicks);

    return pick;
  }

  async updateDailyPickResult(pickId: number, result: string | null): Promise<DailyPick> {
    for (const [date, picks] of Array.from(this.dailyPicks.entries())) {
      const pickIndex = picks.findIndex((p: any) => p.id === pickId);
      if (pickIndex >= 0) {
        const status = result === null ? "active" : "settled";
        const updatedPick = { ...picks[pickIndex], result, status };
        picks[pickIndex] = updatedPick;
        this.dailyPicks.set(date, picks);
        return updatedPick;
      }
    }
    throw new Error(`Daily pick with ID ${pickId} not found`);
  }

  // Consensus Data methods
  async getConsensusData(gameId: string): Promise<ConsensusData[]> {
    return this.consensusData.get(gameId) || [];
  }

  async createConsensusData(insertData: InsertConsensusData): Promise<ConsensusData> {
    const data: ConsensusData = {
      ...insertData,
      id: this.currentConsensusId++,
      updatedAt: new Date(),
      sharpMoney: insertData.sharpMoney || {},
      lineMovement: insertData.lineMovement || {},
      bookmakerConsensus: insertData.bookmakerConsensus || {}
    };

    const gameConsensus = this.consensusData.get(insertData.gameId) || [];
    gameConsensus.push(data);
    this.consensusData.set(insertData.gameId, gameConsensus);

    return data;
  }

  async updateConsensusData(gameId: string, market: string, updates: Partial<ConsensusData>): Promise<ConsensusData> {
    const gameConsensus = this.consensusData.get(gameId) || [];
    const dataIndex = gameConsensus.findIndex(d => d.market === market);

    if (dataIndex === -1) {
      throw new Error(`Consensus data for game ${gameId} and market ${market} not found`);
    }

    const updatedData = { ...gameConsensus[dataIndex], ...updates, updatedAt: new Date() };
    gameConsensus[dataIndex] = updatedData;
    this.consensusData.set(gameId, gameConsensus);

    return updatedData;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserSubscription(userId: number, subscriptionData: {
    tier: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status?: string;
    endDate?: Date;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionTier: subscriptionData.tier,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        subscriptionStatus: subscriptionData.status,
        subscriptionEndDate: subscriptionData.endDate,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllTodaysGames(): Promise<Game[]> {
    return await db.select().from(games);
  }

  async getGame(gameId: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.gameId, gameId));
    return game || undefined;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }

  async updateGame(gameId: string, updates: Partial<Game>): Promise<Game> {
    const [game] = await db
      .update(games)
      .set(updates)
      .where(eq(games.gameId, gameId))
      .returning();
    return game;
  }

  async getOddsByGameId(gameId: string): Promise<Odds[]> {
    return await db.select().from(odds).where(eq(odds.gameId, gameId));
  }

  async createOdds(insertOdds: InsertOdds): Promise<Odds> {
    const [oddsRecord] = await db
      .insert(odds)
      .values(insertOdds)
      .returning();
    return oddsRecord;
  }

  async updateOdds(gameId: string, bookmaker: string, updates: Partial<Odds>): Promise<Odds> {
    const [oddsRecord] = await db
      .update(odds)
      .set(updates)
      .where(and(eq(odds.gameId, gameId), eq(odds.bookmaker, bookmaker)))
      .returning();
    return oddsRecord;
  }

  async getAiSummary(gameId: string): Promise<AiSummary | undefined> {
    const [summary] = await db.select().from(aiSummaries).where(eq(aiSummaries.gameId, gameId));
    return summary || undefined;
  }

  async createAiSummary(insertSummary: InsertAiSummary): Promise<AiSummary> {
    const [summary] = await db
      .insert(aiSummaries)
      .values(insertSummary)
      .returning();
    return summary;
  }

  async getUserBets(userId?: number): Promise<Bet[]> {
    if (userId) {
      return await db.select().from(bets).where(eq(bets.userId, userId));
    }
    return await db.select().from(bets);
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const [bet] = await db
      .insert(bets)
      .values(insertBet)
      .returning();
    return bet;
  }

  async updateBetResult(betId: number, result: string, actualWin?: number): Promise<Bet> {
    const [bet] = await db
      .update(bets)
      .set({
        result,
        actualWin: actualWin?.toString() || null,
        status: "settled"
      })
      .where(eq(bets.id, betId))
      .returning();
    return bet;
  }

  async getPropsByGameId(gameId: string): Promise<Prop[]> {
    return await db.select().from(props).where(eq(props.gameId, gameId));
  }

  async createProp(insertProp: InsertProp): Promise<Prop> {
    const [prop] = await db
      .insert(props)
      .values(insertProp)
      .returning();
    return prop;
  }

  async getDailyPicks(date: string): Promise<DailyPick[]> {
    return await db.select().from(dailyPicks).where(eq(dailyPicks.date, date));
  }

  async createDailyPick(insertPick: InsertDailyPick): Promise<DailyPick> {
    const [pick] = await db
      .insert(dailyPicks)
      .values(insertPick)
      .returning();
    return pick;
  }

  async updateDailyPickResult(pickId: number, result: string | null): Promise<DailyPick> {
    const status = result === null ? "active" : "settled";
    const [pick] = await db
      .update(dailyPicks)
      .set({ result, status })
      .where(eq(dailyPicks.id, pickId))
      .returning();
    return pick;
  }

  async getConsensusData(gameId: string): Promise<ConsensusData[]> {
    return await db.select().from(consensusData).where(eq(consensusData.gameId, gameId));
  }

  async createConsensusData(insertData: InsertConsensusData): Promise<ConsensusData> {
    const [data] = await db
      .insert(consensusData)
      .values(insertData)
      .returning();
    return data;
  }

  async updateConsensusData(gameId: string, market: string, updates: Partial<ConsensusData>): Promise<ConsensusData> {
    const [data] = await db
      .update(consensusData)
      .set(updates)
      .where(and(eq(consensusData.gameId, gameId), eq(consensusData.market, market)))
      .returning();
    return data;
  }

  async getPerformanceTracking(dateRange?: { start: string; end: string }): Promise<PerformanceTracking[]> {
    if (dateRange) {
      return await db.select().from(performanceTracking)
        .where(and(
          eq(performanceTracking.gameDate, dateRange.start), // This would need proper date range logic
          eq(performanceTracking.gameDate, dateRange.end)
        ));
    }
    return await db.select().from(performanceTracking);
  }

  async createPerformanceTracking(data: InsertPerformanceTracking): Promise<PerformanceTracking> {
    const [tracking] = await db
      .insert(performanceTracking)
      .values(data)
      .returning();
    return tracking;
  }

  async updatePerformanceTracking(gameId: string, updates: Partial<PerformanceTracking>): Promise<PerformanceTracking> {
    const [tracking] = await db
      .update(performanceTracking)
      .set(updates)
      .where(eq(performanceTracking.gameId, gameId))
      .returning();
    return tracking;
  }

  async getPerformanceStats(dateRange?: { start: string; end: string }): Promise<{
    totalGames: number;
    winnerAccuracy: number;
    totalAccuracy: number;
    spreadAccuracy: number;
    avgConfidence: number;
    pitchingAccuracy: number;
    monthlyBreakdown: Array<{
      month: string;
      games: number;
      accuracy: number;
    }>;
  }> {
    const records = await this.getPerformanceTracking(dateRange);
    
    const totalGames = records.length;
    const winnerCorrect = records.filter(r => r.winnerCorrect).length;
    const totalCorrect = records.filter(r => r.totalCorrect).length;
    const spreadCorrect = records.filter(r => r.spreadCorrect).length;
    
    const avgConfidence = records.reduce((sum, r) => sum + (r.aiConfidence || 0), 0) / totalGames;
    const avgPitchingAccuracy = records.reduce((sum, r) => sum + parseFloat(r.pitchingPredictionAccuracy || '0'), 0) / totalGames;

    // Group by month for breakdown
    const monthlyStats = new Map<string, { games: number; correct: number }>();
    records.forEach(record => {
      const month = record.gameDate.substring(0, 7); // YYYY-MM format
      const current = monthlyStats.get(month) || { games: 0, correct: 0 };
      current.games++;
      if (record.winnerCorrect) current.correct++;
      monthlyStats.set(month, current);
    });

    const monthlyBreakdown = Array.from(monthlyStats.entries()).map(([month, stats]) => ({
      month,
      games: stats.games,
      accuracy: stats.games > 0 ? (stats.correct / stats.games) * 100 : 0
    }));

    return {
      totalGames,
      winnerAccuracy: totalGames > 0 ? (winnerCorrect / totalGames) * 100 : 0,
      totalAccuracy: totalGames > 0 ? (totalCorrect / totalGames) * 100 : 0,
      spreadAccuracy: totalGames > 0 ? (spreadCorrect / totalGames) * 100 : 0,
      avgConfidence,
      pitchingAccuracy: avgPitchingAccuracy,
      monthlyBreakdown
    };
  }
}

export const storage = new DatabaseStorage();
