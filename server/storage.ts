import { users, games, odds, aiSummaries, bets, props, dailyPicks, gameEvaluations, consensusData, performanceTracking, referralCodes, weeklyLeaderboard, groups, groupMemberships, friendInvitations, friendships, tickets, virtualBets, virtualBettingSlip, phraseDetectionRules, baseballReferenceStats, baseballReferencePitchingStats, oddsHistory, type User, type InsertUser, type Game, type InsertGame, type Odds, type InsertOdds, type AiSummary, type InsertAiSummary, type Bet, type InsertBet, type Prop, type InsertProp, type DailyPick, type InsertDailyPick, type GameEvaluation, type InsertGameEvaluation, type ConsensusData, type InsertConsensusData, type PerformanceTracking, type InsertPerformanceTracking, type ReferralCode, type InsertReferralCode, type WeeklyLeaderboard, type InsertWeeklyLeaderboard, type Group, type InsertGroup, type GroupMembership, type InsertGroupMembership, type FriendInvitation, type InsertFriendInvitation, type Friendship, type InsertFriendship, type Ticket, type InsertTicket, type VirtualBet, type InsertVirtualBet, type VirtualBettingSlip, type InsertVirtualBettingSlip, type PhraseDetectionRule, type InsertPhraseDetectionRule, type BaseballReferenceStats, type InsertBaseballReferenceStats, type BaseballReferencePitchingStats, type InsertBaseballReferencePitchingStats, type InsertOddsHistory, type OddsHistory, blogReviews, type BlogReview, type InsertBlogReview, editorialColumns, type EditorialColumn, type InsertEditorialColumn, newsletterSubscribers, type NewsletterSubscriber, type InsertNewsletterSubscriber, newsletters, type Newsletter, type InsertNewsletter, expertPicks, type ExpertPick, type InsertExpertPick, userExpertFollows, type UserExpertFollow, type InsertUserExpertFollow, triviaQuestions, triviaAnswers } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, gte, lte, desc, lt } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: number, subscriptionData: {
    subscriptionTier?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionEndDate?: Date;
  }): Promise<User>;
  updateUserTier(userId: number, tier: string, isAdmin?: boolean): Promise<User>;
  updateUserAdmin(userId: number, isAdmin: boolean): Promise<User>;
  updateUsername(userId: number, username: string): Promise<User>;
  generateReferralCode(userId: number): Promise<string>;
  validateReferralCode(code: string): Promise<ReferralCode | null>;
  
  // Virtual Balance methods
  getUserVirtualBalance(userId: number): Promise<number>;
  updateVirtualBalance(userId: number, newBalance: number): Promise<User>;
  resetVirtualBalance(userId: number): Promise<User>;
  processBetSettlement(userId: number, betResult: 'win' | 'loss', amount: number): Promise<User>;

  // Referral Code methods
  createReferralCode(referralCode: InsertReferralCode): Promise<ReferralCode>;
  getReferralCode(code: string): Promise<ReferralCode | undefined>;
  getAllReferralCodes(): Promise<ReferralCode[]>;
  updateReferralCodeUsage(code: string): Promise<ReferralCode>;
  updateReferralCodeCommission(code: string, commissionAmount: number): Promise<ReferralCode>;
  markReferralCodePaid(code: string): Promise<ReferralCode>;
  
  // Admin methods
  getAdminStats(): Promise<{
    totalUsers: number;
    freeUsers: number;
    proUsers: number;
    eliteUsers: number;
    totalReferrals: number;
    activeReferralCodes: number;
  }>;

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
  updateGameAISummary(gameId: string, aiSummary: any): Promise<void>;

  // Bet methods (real-world bets)
  getUserBets(userId?: number): Promise<Bet[]>;
  createBet(bet: InsertBet): Promise<Bet>;
  updateBetResult(betId: number, result: string, actualWin?: number): Promise<Bet>;
  deleteBet(betId: number): Promise<void>;

  // Virtual Bet methods (paper trading)
  getUserVirtualBets(userId: number): Promise<VirtualBet[]>;
  createVirtualBet(bet: InsertVirtualBet): Promise<VirtualBet>;
  updateVirtualBetResult(betId: number, result: string, actualWin?: number): Promise<VirtualBet>;
  deleteVirtualBet(betId: number): Promise<void>;

  // Virtual Betting Slip methods
  getVirtualBettingSlip(userId: number): Promise<VirtualBettingSlip[]>;
  addToVirtualBettingSlip(slip: InsertVirtualBettingSlip): Promise<VirtualBettingSlip>;
  updateVirtualBettingSlipStake(slipId: number, stake: number, potentialWin: number): Promise<VirtualBettingSlip>;
  removeFromVirtualBettingSlip(slipId: number): Promise<void>;
  clearVirtualBettingSlip(userId: number): Promise<void>;

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

  // Weekly Leaderboard methods
  getCurrentWeekLeaderboard(): Promise<Array<WeeklyLeaderboard & { user: User }>>;
  getWeeklyLeaderboard(weekStart: Date): Promise<Array<WeeklyLeaderboard & { user: User }>>;
  updateUserWeeklyStats(userId: number, betResult: 'win' | 'loss', stakeAmount: number, winAmount?: number): Promise<void>;
  resetWeeklyLeaderboard(): Promise<void>;
  getUserWeeklyStats(userId: number): Promise<WeeklyLeaderboard | undefined>;

  // Groups methods
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(groupId: number): Promise<Group | undefined>;
  getUserGroups(userId: number): Promise<Array<Group & { membership: GroupMembership }>>;
  getAllGroups(): Promise<Group[]>;
  updateGroup(groupId: number, updates: Partial<Group>): Promise<Group>;
  deleteGroup(groupId: number): Promise<void>;
  generateGroupInviteCode(groupId: number): Promise<string>;

  // Group Membership methods
  addGroupMember(groupId: number, userId: number, role?: string): Promise<GroupMembership>;
  removeGroupMember(groupId: number, userId: number): Promise<void>;
  getGroupMembers(groupId: number): Promise<Array<GroupMembership & { user: User }>>;
  getUserGroupRole(groupId: number, userId: number): Promise<GroupMembership | undefined>;
  updateGroupMemberRole(groupId: number, userId: number, role: string): Promise<GroupMembership>;

  // Friend Invitation methods
  createFriendInvitation(invitation: InsertFriendInvitation): Promise<FriendInvitation>;
  getFriendInvitation(invitationId: number): Promise<FriendInvitation | undefined>;
  getFriendInvitationByToken(token: string): Promise<FriendInvitation | undefined>;
  getUserFriendInvitations(userId: number, status?: string): Promise<FriendInvitation[]>;
  updateFriendInvitationStatus(invitationId: number, status: string): Promise<FriendInvitation>;
  acceptFriendInvitation(invitationId: number): Promise<Friendship>;

  // Friendship methods
  createFriendship(userId1: number, userId2: number): Promise<Friendship>;
  getUserFriends(userId: number): Promise<Array<Friendship & { friend: User }>>;
  deleteFriendship(userId1: number, userId2: number): Promise<void>;
  areFriends(userId1: number, userId2: number): Promise<boolean>;

  // Ticket methods
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTickets(filters?: { status?: string; category?: string; source?: string }): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  updateTicketStatus(id: number, status: string): Promise<Ticket>;
  
  // Performance data methods for scheduler
  getGames(date: string): Promise<Game[]>;
  getRecentPerformanceData(): Promise<any[]>;
  getPerformanceDataRange(startDate: string, endDate: string): Promise<any[]>;

  // Phrase Detection Rule methods
  getAllPhraseDetectionRules(): Promise<PhraseDetectionRule[]>;
  getPhraseDetectionRulesByCategory(category: string): Promise<PhraseDetectionRule[]>;
  createPhraseDetectionRule(rule: InsertPhraseDetectionRule): Promise<PhraseDetectionRule>;
  updatePhraseDetectionRule(id: number, updates: Partial<PhraseDetectionRule>): Promise<PhraseDetectionRule>;
  deletePhraseDetectionRule(id: number): Promise<void>;
  togglePhraseDetectionRule(id: number, isActive: boolean): Promise<PhraseDetectionRule>;

  // Baseball Reference Stats methods
  storeBaseballReferenceStats(stats: InsertBaseballReferenceStats): Promise<BaseballReferenceStats>;
  getBaseballReferenceSnapshot(date: string): Promise<BaseballReferenceStats[]>;
  getHistoricalBaseballReferenceStats(team: string, date: string, daysBack: number): Promise<BaseballReferenceStats[]>;
  getTeamBaseballReferenceStats(team: string, date?: string): Promise<BaseballReferenceStats | undefined>;
  
  // Baseball Reference Pitching Stats methods
  storeBaseballReferencePitchingStats(stats: InsertBaseballReferencePitchingStats): Promise<BaseballReferencePitchingStats>;
  getBaseballReferencePitchingSnapshot(date: string): Promise<BaseballReferencePitchingStats[]>;
  getHistoricalBaseballReferencePitchingStats(team: string, date: string, daysBack: number): Promise<BaseballReferencePitchingStats[]>;
  getTeamBaseballReferencePitchingStats(team: string, date?: string): Promise<BaseballReferencePitchingStats | undefined>;
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
        username: "admin",
        email: "admin@clearedgebets.com",
        password: "$2b$10$qiCcMv9IkhmlFRXZMuf0YuELoUzEgWsTzkGxPYn3CBGXp131ArRGi", // "admin123"
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

  async deleteBet(betId: number): Promise<void> {
    const existingBet = this.bets.get(betId);
    if (!existingBet) {
      throw new Error(`Bet with ID ${betId} not found`);
    }
    this.bets.delete(betId);
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

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
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

  async upsertGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .onConflictDoUpdate({
        target: games.gameId,
        set: {
          awayTeam: insertGame.awayTeam,
          homeTeam: insertGame.homeTeam,
          awayTeamCode: insertGame.awayTeamCode,
          homeTeamCode: insertGame.homeTeamCode,
          gameTime: insertGame.gameTime,
          venue: insertGame.venue,
          awayPitcher: insertGame.awayPitcher,
          homePitcher: insertGame.homePitcher,
          awayPitcherStats: insertGame.awayPitcherStats,
          homePitcherStats: insertGame.homePitcherStats,
          status: insertGame.status
        }
      })
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

  async updateGameAISummary(gameId: string, aiSummary: any): Promise<void> {
    // Check if AI summary already exists for this game
    const existingSummary = await this.getAiSummary(gameId);
    
    if (existingSummary) {
      // Update existing AI summary
      await db
        .update(aiSummaries)
        .set({
          summary: aiSummary.summary,
          confidence: aiSummary.confidence,
          lastUpdated: new Date()
        })
        .where(eq(aiSummaries.gameId, gameId));
    } else {
      // Create new AI summary
      await this.createAiSummary({
        gameId,
        summary: aiSummary.summary,
        confidence: aiSummary.confidence,
        lastUpdated: new Date()
      });
    }
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

  async deleteBet(betId: number): Promise<void> {
    await db
      .delete(bets)
      .where(eq(bets.id, betId));
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

  // Admin and referral methods
  async updateUserTier(userId: number, tier: string, isAdmin?: boolean): Promise<User> {
    const updateData: any = { subscriptionTier: tier };
    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin;
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserAdmin(userId: number, isAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isAdmin })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUsername(userId: number, username: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ username })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async generateReferralCode(userId: number): Promise<string> {
    // Generate a unique 8-character referral code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    await db
      .update(users)
      .set({ referralCode: code })
      .where(eq(users.id, userId));
    
    return code;
  }

  async validateReferralCode(code: string): Promise<ReferralCode | null> {
    const [referralCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code));
    
    if (!referralCode || !referralCode.isActive) {
      return null;
    }
    
    // Check if it has reached max uses
    if (referralCode.maxUses && referralCode.usageCount >= referralCode.maxUses) {
      return null;
    }
    
    // Check if it's expired
    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      return null;
    }
    
    return referralCode;
  }

  async createReferralCode(insertReferralCode: InsertReferralCode): Promise<ReferralCode> {
    const [referralCode] = await db
      .insert(referralCodes)
      .values(insertReferralCode)
      .returning();
    return referralCode;
  }

  async getReferralCode(code: string): Promise<ReferralCode | undefined> {
    const [referralCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code));
    return referralCode || undefined;
  }

  async getAllReferralCodes(): Promise<ReferralCode[]> {
    return await db.select().from(referralCodes);
  }

  async updateReferralCodeUsage(code: string): Promise<ReferralCode> {
    const [referralCode] = await db
      .update(referralCodes)
      .set({ 
        usageCount: sql`${referralCodes.usageCount} + 1`
      })
      .where(eq(referralCodes.code, code))
      .returning();
    return referralCode;
  }

  async updateReferralCodeCommission(code: string, commissionAmount: number): Promise<ReferralCode> {
    const [referralCode] = await db
      .update(referralCodes)
      .set({ 
        totalCommissionEarned: sql`${referralCodes.totalCommissionEarned} + ${commissionAmount}`,
        totalReferrals: sql`${referralCodes.totalReferrals} + 1`,
        usageCount: sql`${referralCodes.usageCount} + 1`
      })
      .where(eq(referralCodes.code, code))
      .returning();
    return referralCode;
  }

  async markReferralCodePaid(code: string): Promise<ReferralCode> {
    const [referralCode] = await db
      .update(referralCodes)
      .set({ 
        payoutStatus: 'paid',
        lastPayoutAt: new Date(),
        totalCommissionEarned: 0 // Reset commission after payout
      })
      .where(eq(referralCodes.code, code))
      .returning();
    return referralCode;
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    freeUsers: number;
    proUsers: number;
    eliteUsers: number;
    totalReferrals: number;
    activeReferralCodes: number;
  }> {
    const allUsers = await db.select().from(users);
    const allReferralCodes = await db.select().from(referralCodes);
    
    const totalUsers = allUsers.length;
    const freeUsers = allUsers.filter(u => u.subscriptionTier === 'free').length;
    const proUsers = allUsers.filter(u => u.subscriptionTier === 'pro').length;
    const eliteUsers = allUsers.filter(u => u.subscriptionTier === 'elite').length;
    const totalReferrals = allUsers.filter(u => u.referredBy).length;
    const activeReferralCodes = allReferralCodes.filter(r => r.isActive).length;

    return {
      totalUsers,
      freeUsers,
      proUsers,
      eliteUsers,
      totalReferrals,
      activeReferralCodes
    };
  }

  // Virtual Balance methods
  async getUserVirtualBalance(userId: number): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.virtualBalance || 100000; // Default $1000 in cents
  }

  async updateVirtualBalance(userId: number, newBalance: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ virtualBalance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async resetVirtualBalance(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        virtualBalance: 100000, // Reset to $1000
        totalVirtualWinnings: 0,
        totalVirtualLosses: 0,
        betCount: 0,
        winCount: 0
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async clearUserVirtualBets(userId: number): Promise<void> {
    await db
      .delete(virtualBets)
      .where(eq(virtualBets.userId, userId));
  }

  async processBetSettlement(userId: number, betResult: 'win' | 'loss', amount: number): Promise<User> {
    const currentUser = await this.getUser(userId);
    if (!currentUser) throw new Error('User not found');

    const currentBalance = currentUser.virtualBalance || 100000;
    const newBalance = betResult === 'win' ? currentBalance + amount : currentBalance - amount;
    
    const updateData: any = {
      virtualBalance: Math.max(0, newBalance), // Don't allow negative balance
      betCount: (currentUser.betCount || 0) + 1
    };

    if (betResult === 'win') {
      updateData.winCount = (currentUser.winCount || 0) + 1;
      updateData.totalVirtualWinnings = (currentUser.totalVirtualWinnings || 0) + amount;
    } else {
      updateData.totalVirtualLosses = (currentUser.totalVirtualLosses || 0) + amount;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Weekly Leaderboard methods
  async getCurrentWeekLeaderboard(): Promise<Array<WeeklyLeaderboard & { user: User }>> {
    const weekStart = this.getWeekStart(new Date());
    return this.getWeeklyLeaderboard(weekStart);
  }

  async getWeeklyLeaderboard(weekStart: Date): Promise<Array<WeeklyLeaderboard & { user: User }>> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const leaderboardData = await db
      .select({
        leaderboard: weeklyLeaderboard,
        user: users
      })
      .from(weeklyLeaderboard)
      .innerJoin(users, eq(weeklyLeaderboard.userId, users.id))
      .where(
        and(
          gte(weeklyLeaderboard.weekStart, weekStart),
          lte(weeklyLeaderboard.weekEnd, weekEnd)
        )
      )
      .orderBy(desc(weeklyLeaderboard.points), desc(weeklyLeaderboard.netProfit));

    return leaderboardData.map(row => ({
      ...row.leaderboard,
      user: row.user
    }));
  }

  async updateUserWeeklyStats(userId: number, betResult: 'win' | 'loss', stakeAmount: number, winAmount: number = 0): Promise<void> {
    const weekStart = this.getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get existing weekly stats or create new entry
    let [weeklyStats] = await db
      .select()
      .from(weeklyLeaderboard)
      .where(
        and(
          eq(weeklyLeaderboard.userId, userId),
          gte(weeklyLeaderboard.weekStart, weekStart),
          lte(weeklyLeaderboard.weekEnd, weekEnd)
        )
      );

    if (!weeklyStats) {
      // Create new weekly entry
      [weeklyStats] = await db
        .insert(weeklyLeaderboard)
        .values({
          userId,
          weekStart,
          weekEnd,
          totalBets: 0,
          wonBets: 0,
          lostBets: 0,
          winRate: "0.00",
          totalStaked: "0.00",
          totalWinnings: "0.00",
          netProfit: "0.00",
          profitMargin: "0.00",
          rank: 0,
          points: 0
        })
        .returning();
    }

    // Calculate new stats
    const newTotalBets = (weeklyStats.totalBets || 0) + 1;
    const newWonBets = (weeklyStats.wonBets || 0) + (betResult === 'win' ? 1 : 0);
    const newLostBets = (weeklyStats.lostBets || 0) + (betResult === 'loss' ? 1 : 0);
    const newTotalStaked = parseFloat(weeklyStats.totalStaked || "0") + stakeAmount;
    const newTotalWinnings = parseFloat(weeklyStats.totalWinnings || "0") + (betResult === 'win' ? winAmount : 0);
    const newNetProfit = newTotalWinnings - newTotalStaked;
    const newWinRate = newTotalBets > 0 ? (newWonBets / newTotalBets) * 100 : 0;
    const newProfitMargin = newTotalStaked > 0 ? (newNetProfit / newTotalStaked) * 100 : 0;
    const newPoints = (newWonBets * 3) + (newLostBets * 0); // 3 points for win, 0 for loss

    // Update weekly stats
    await db
      .update(weeklyLeaderboard)
      .set({
        totalBets: newTotalBets,
        wonBets: newWonBets,
        lostBets: newLostBets,
        winRate: newWinRate.toFixed(2),
        totalStaked: newTotalStaked.toFixed(2),
        totalWinnings: newTotalWinnings.toFixed(2),
        netProfit: newNetProfit.toFixed(2),
        profitMargin: newProfitMargin.toFixed(2),
        points: newPoints,
        updatedAt: new Date()
      })
      .where(eq(weeklyLeaderboard.id, weeklyStats.id));

    // Update ranks for all users in this week
    await this.updateWeeklyRanks(weekStart);
  }

  async resetWeeklyLeaderboard(): Promise<void> {
    const currentWeekStart = this.getWeekStart(new Date());
    
    // Archive current week's data (optional - keep for historical purposes)
    // Delete entries older than 8 weeks to keep database clean
    const eightWeeksAgo = new Date(currentWeekStart);
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    await db
      .delete(weeklyLeaderboard)
      .where(lt(weeklyLeaderboard.weekStart, eightWeeksAgo));
  }

  async getUserWeeklyStats(userId: number): Promise<WeeklyLeaderboard | undefined> {
    const weekStart = this.getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [weeklyStats] = await db
      .select()
      .from(weeklyLeaderboard)
      .where(
        and(
          eq(weeklyLeaderboard.userId, userId),
          gte(weeklyLeaderboard.weekStart, weekStart),
          lte(weeklyLeaderboard.weekEnd, weekEnd)
        )
      );

    return weeklyStats;
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Monday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private async updateWeeklyRanks(weekStart: Date): Promise<void> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const leaderboardEntries = await db
      .select()
      .from(weeklyLeaderboard)
      .where(
        and(
          gte(weeklyLeaderboard.weekStart, weekStart),
          lte(weeklyLeaderboard.weekEnd, weekEnd)
        )
      )
      .orderBy(desc(weeklyLeaderboard.points), desc(weeklyLeaderboard.netProfit));

    // Update ranks
    for (let i = 0; i < leaderboardEntries.length; i++) {
      await db
        .update(weeklyLeaderboard)
        .set({ rank: i + 1 })
        .where(eq(weeklyLeaderboard.id, leaderboardEntries[i].id));
    }
  }

  // Groups methods
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [group] = await db
      .insert(groups)
      .values({ ...insertGroup, inviteCode })
      .returning();
    
    // Add creator as admin member
    await this.addGroupMember(group.id, group.createdBy, 'admin');
    return group;
  }

  async getGroup(groupId: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
    return group;
  }

  async getUserGroups(userId: number): Promise<Array<Group & { membership: GroupMembership }>> {
    const results = await db
      .select({
        group: groups,
        membership: groupMemberships,
      })
      .from(groups)
      .innerJoin(groupMemberships, eq(groups.id, groupMemberships.groupId))
      .where(
        and(
          eq(groupMemberships.userId, userId),
          eq(groupMemberships.isActive, true)
        )
      );

    return results.map(result => ({
      ...result.group,
      membership: result.membership,
    }));
  }

  async getAllGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async updateGroup(groupId: number, updates: Partial<Group>): Promise<Group> {
    const [group] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groups.id, groupId))
      .returning();
    return group;
  }

  async deleteGroup(groupId: number): Promise<void> {
    // Remove all memberships first
    await db.delete(groupMemberships).where(eq(groupMemberships.groupId, groupId));
    // Delete the group
    await db.delete(groups).where(eq(groups.id, groupId));
  }

  async generateGroupInviteCode(groupId: number): Promise<string> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db
      .update(groups)
      .set({ inviteCode, updatedAt: new Date() })
      .where(eq(groups.id, groupId));
    return inviteCode;
  }

  // Group Membership methods
  async addGroupMember(groupId: number, userId: number, role: string = 'member'): Promise<GroupMembership> {
    const [membership] = await db
      .insert(groupMemberships)
      .values({ groupId, userId, role })
      .returning();
    
    // Update group member count
    await db
      .update(groups)
      .set({ 
        currentMembers: sql`${groups.currentMembers} + 1`,
        updatedAt: new Date()
      })
      .where(eq(groups.id, groupId));
    
    return membership;
  }

  async removeGroupMember(groupId: number, userId: number): Promise<void> {
    await db
      .update(groupMemberships)
      .set({ isActive: false })
      .where(
        and(
          eq(groupMemberships.groupId, groupId),
          eq(groupMemberships.userId, userId)
        )
      );
    
    // Update group member count
    await db
      .update(groups)
      .set({ 
        currentMembers: sql`${groups.currentMembers} - 1`,
        updatedAt: new Date()
      })
      .where(eq(groups.id, groupId));
  }

  async getGroupMembers(groupId: number): Promise<Array<GroupMembership & { user: User }>> {
    const results = await db
      .select({
        membership: groupMemberships,
        user: users,
      })
      .from(groupMemberships)
      .innerJoin(users, eq(groupMemberships.userId, users.id))
      .where(
        and(
          eq(groupMemberships.groupId, groupId),
          eq(groupMemberships.isActive, true)
        )
      );

    return results.map(result => ({
      ...result.membership,
      user: result.user,
    }));
  }

  async getUserGroupRole(groupId: number, userId: number): Promise<GroupMembership | undefined> {
    const [membership] = await db
      .select()
      .from(groupMemberships)
      .where(
        and(
          eq(groupMemberships.groupId, groupId),
          eq(groupMemberships.userId, userId),
          eq(groupMemberships.isActive, true)
        )
      );
    return membership;
  }

  async updateGroupMemberRole(groupId: number, userId: number, role: string): Promise<GroupMembership> {
    const [membership] = await db
      .update(groupMemberships)
      .set({ role })
      .where(
        and(
          eq(groupMemberships.groupId, groupId),
          eq(groupMemberships.userId, userId)
        )
      )
      .returning();
    return membership;
  }

  // Friend Invitation methods
  async createFriendInvitation(insertInvitation: InsertFriendInvitation): Promise<FriendInvitation> {
    const token = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const [invitation] = await db
      .insert(friendInvitations)
      .values({ 
        ...insertInvitation, 
        inviteToken: token,
        expiresAt 
      })
      .returning();
    return invitation;
  }

  async getFriendInvitation(invitationId: number): Promise<FriendInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(friendInvitations)
      .where(eq(friendInvitations.id, invitationId));
    return invitation;
  }

  async getFriendInvitationByToken(token: string): Promise<FriendInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(friendInvitations)
      .where(eq(friendInvitations.inviteToken, token));
    return invitation;
  }

  async getUserFriendInvitations(userId: number, status?: string): Promise<FriendInvitation[]> {
    if (status) {
      return await db
        .select()
        .from(friendInvitations)
        .where(
          and(
            eq(friendInvitations.recipientId, userId),
            eq(friendInvitations.status, status)
          )
        );
    }
    
    return await db
      .select()
      .from(friendInvitations)
      .where(eq(friendInvitations.recipientId, userId));
  }

  async updateFriendInvitationStatus(invitationId: number, status: string): Promise<FriendInvitation> {
    const [invitation] = await db
      .update(friendInvitations)
      .set({ status, respondedAt: new Date() })
      .where(eq(friendInvitations.id, invitationId))
      .returning();
    return invitation;
  }

  async acceptFriendInvitation(invitationId: number): Promise<Friendship> {
    const invitation = await this.getFriendInvitation(invitationId);
    if (!invitation || !invitation.recipientId) {
      throw new Error('Invalid invitation');
    }

    // Create friendship
    const friendship = await this.createFriendship(invitation.senderId, invitation.recipientId);
    
    // Update invitation status
    await this.updateFriendInvitationStatus(invitationId, 'accepted');
    
    return friendship;
  }

  // Friendship methods
  async createFriendship(userId1: number, userId2: number): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({ userId1, userId2 })
      .returning();
    return friendship;
  }

  async getUserFriends(userId: number): Promise<Array<Friendship & { friend: User }>> {
    const results = await db
      .select({
        friendship: friendships,
        friend: users,
      })
      .from(friendships)
      .innerJoin(users, 
        sql`${users.id} = CASE 
          WHEN ${friendships.userId1} = ${userId} THEN ${friendships.userId2}
          ELSE ${friendships.userId1}
        END`
      )
      .where(
        sql`${friendships.userId1} = ${userId} OR ${friendships.userId2} = ${userId}`
      );

    return results.map(result => ({
      ...result.friendship,
      friend: result.friend,
    }));
  }

  async deleteFriendship(userId1: number, userId2: number): Promise<void> {
    await db
      .delete(friendships)
      .where(
        sql`(${friendships.userId1} = ${userId1} AND ${friendships.userId2} = ${userId2}) 
            OR (${friendships.userId1} = ${userId2} AND ${friendships.userId2} = ${userId1})`
      );
  }

  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        sql`(${friendships.userId1} = ${userId1} AND ${friendships.userId2} = ${userId2}) 
            OR (${friendships.userId1} = ${userId2} AND ${friendships.userId2} = ${userId1})`
      );
    return !!friendship;
  }

  // Virtual Bet methods (paper trading)
  async getUserVirtualBets(userId: number): Promise<VirtualBet[]> {
    return await db.select().from(virtualBets).where(eq(virtualBets.userId, userId));
  }

  async createVirtualBet(bet: InsertVirtualBet): Promise<VirtualBet> {
    const [virtualBet] = await db
      .insert(virtualBets)
      .values(bet)
      .returning();
    return virtualBet;
  }

  async updateVirtualBetResult(betId: number, result: string, actualWin?: number): Promise<VirtualBet> {
    const [bet] = await db
      .update(virtualBets)
      .set({
        result,
        actualWin: actualWin || null,
        status: "settled",
        settledAt: new Date()
      })
      .where(eq(virtualBets.id, betId))
      .returning();
    return bet;
  }

  async deleteVirtualBet(betId: number): Promise<void> {
    await db
      .delete(virtualBets)
      .where(eq(virtualBets.id, betId));
  }

  // Virtual Betting Slip methods
  async getVirtualBettingSlip(userId: number): Promise<VirtualBettingSlip[]> {
    return await db.select().from(virtualBettingSlip).where(eq(virtualBettingSlip.userId, userId));
  }

  async addToVirtualBettingSlip(slip: InsertVirtualBettingSlip): Promise<VirtualBettingSlip> {
    const [slipItem] = await db
      .insert(virtualBettingSlip)
      .values(slip)
      .returning();
    return slipItem;
  }

  async updateVirtualBettingSlipStake(slipId: number, stake: number, potentialWin: number): Promise<VirtualBettingSlip> {
    const [slipItem] = await db
      .update(virtualBettingSlip)
      .set({ stake, potentialWin })
      .where(eq(virtualBettingSlip.id, slipId))
      .returning();
    return slipItem;
  }

  async removeFromVirtualBettingSlip(slipId: number): Promise<void> {
    await db
      .delete(virtualBettingSlip)
      .where(eq(virtualBettingSlip.id, slipId));
  }

  async clearVirtualBettingSlip(userId: number): Promise<void> {
    await db
      .delete(virtualBettingSlip)
      .where(eq(virtualBettingSlip.userId, userId));
  }

  // Phrase Detection Rule methods
  async getAllPhraseDetectionRules(): Promise<PhraseDetectionRule[]> {
    return await db
      .select()
      .from(phraseDetectionRules)
      .orderBy(phraseDetectionRules.priority, phraseDetectionRules.category);
  }

  async getPhraseDetectionRulesByCategory(category: string): Promise<PhraseDetectionRule[]> {
    return await db
      .select()
      .from(phraseDetectionRules)
      .where(
        and(
          eq(phraseDetectionRules.category, category),
          eq(phraseDetectionRules.isActive, true)
        )
      )
      .orderBy(phraseDetectionRules.priority);
  }

  async createPhraseDetectionRule(rule: InsertPhraseDetectionRule): Promise<PhraseDetectionRule> {
    const [newRule] = await db
      .insert(phraseDetectionRules)
      .values({
        ...rule,
        updatedAt: new Date(),
      })
      .returning();
    return newRule;
  }

  async updatePhraseDetectionRule(id: number, updates: Partial<PhraseDetectionRule>): Promise<PhraseDetectionRule> {
    const [updatedRule] = await db
      .update(phraseDetectionRules)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(phraseDetectionRules.id, id))
      .returning();
    return updatedRule;
  }

  async deletePhraseDetectionRule(id: number): Promise<void> {
    await db
      .delete(phraseDetectionRules)
      .where(eq(phraseDetectionRules.id, id));
  }

  async togglePhraseDetectionRule(id: number, isActive: boolean): Promise<PhraseDetectionRule> {
    const [updatedRule] = await db
      .update(phraseDetectionRules)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(phraseDetectionRules.id, id))
      .returning();
    return updatedRule;
  }

  // Baseball Reference Stats methods
  async storeBaseballReferenceStats(stats: InsertBaseballReferenceStats): Promise<BaseballReferenceStats> {
    const [newStats] = await db
      .insert(baseballReferenceStats)
      .values(stats)
      .onConflictDoUpdate({
        target: [baseballReferenceStats.date, baseballReferenceStats.team],
        set: {
          ...stats,
          createdAt: new Date(),
        },
      })
      .returning();
    return newStats;
  }

  async getBaseballReferenceSnapshot(date: string): Promise<BaseballReferenceStats[]> {
    return await db
      .select()
      .from(baseballReferenceStats)
      .where(eq(baseballReferenceStats.date, date))
      .orderBy(baseballReferenceStats.team);
  }

  async getHistoricalBaseballReferenceStats(team: string, date: string, daysBack: number): Promise<BaseballReferenceStats[]> {
    const endDate = new Date(date);
    const startDate = new Date(date);
    startDate.setDate(endDate.getDate() - daysBack);

    return await db
      .select()
      .from(baseballReferenceStats)
      .where(
        and(
          eq(baseballReferenceStats.team, team),
          gte(baseballReferenceStats.date, startDate.toISOString().split('T')[0]),
          lte(baseballReferenceStats.date, endDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(baseballReferenceStats.date));
  }

  async getTeamBaseballReferenceStats(team: string, date?: string): Promise<BaseballReferenceStats | undefined> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const [stats] = await db
      .select()
      .from(baseballReferenceStats)
      .where(
        and(
          eq(baseballReferenceStats.team, team),
          eq(baseballReferenceStats.date, targetDate)
        )
      );
    
    return stats;
  }

  // Baseball Reference Pitching Stats methods
  async storeBaseballReferencePitchingStats(stats: InsertBaseballReferencePitchingStats): Promise<BaseballReferencePitchingStats> {
    const [newStats] = await db
      .insert(baseballReferencePitchingStats)
      .values(stats)
      .onConflictDoUpdate({
        target: [baseballReferencePitchingStats.date, baseballReferencePitchingStats.team],
        set: {
          ...stats,
          createdAt: new Date(),
        },
      })
      .returning();
    return newStats;
  }

  async getBaseballReferencePitchingSnapshot(date: string): Promise<BaseballReferencePitchingStats[]> {
    return await db
      .select()
      .from(baseballReferencePitchingStats)
      .where(eq(baseballReferencePitchingStats.date, date))
      .orderBy(baseballReferencePitchingStats.team);
  }

  async getHistoricalBaseballReferencePitchingStats(team: string, date: string, daysBack: number): Promise<BaseballReferencePitchingStats[]> {
    const endDate = new Date(date);
    const startDate = new Date(date);
    startDate.setDate(endDate.getDate() - daysBack);

    return await db
      .select()
      .from(baseballReferencePitchingStats)
      .where(
        and(
          eq(baseballReferencePitchingStats.team, team),
          gte(baseballReferencePitchingStats.date, startDate.toISOString().split('T')[0]),
          lte(baseballReferencePitchingStats.date, endDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(baseballReferencePitchingStats.date));
  }

  async getTeamBaseballReferencePitchingStats(team: string, date?: string): Promise<BaseballReferencePitchingStats | undefined> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [stats] = await db
      .select()
      .from(baseballReferencePitchingStats)
      .where(
        and(
          eq(baseballReferencePitchingStats.team, team),
          eq(baseballReferencePitchingStats.date, targetDate)
        )
      );

    return stats;
  }

  async recordOddsSnapshot(entries: InsertOddsHistory[]): Promise<void> {
    if (entries.length === 0) return;
    await db.insert(oddsHistory).values(entries);
  }

  async getOddsHistory(gameId: string, market: string): Promise<OddsHistory[]> {
    return db
      .select()
      .from(oddsHistory)
      .where(and(eq(oddsHistory.gameId, gameId), eq(oddsHistory.market, market)))
      .orderBy(oddsHistory.recordedAt);
  }

  // ── Blog Reviews ──
  async createBlogReview(review: InsertBlogReview): Promise<BlogReview> {
    const [created] = await db.insert(blogReviews).values(review).returning();
    return created;
  }

  async getBlogReview(gameId: string): Promise<BlogReview | undefined> {
    const [review] = await db.select().from(blogReviews).where(eq(blogReviews.gameId, gameId));
    return review;
  }

  async getBlogReviewBySlug(slug: string): Promise<BlogReview | undefined> {
    const [review] = await db.select().from(blogReviews).where(eq(blogReviews.slug, slug));
    return review;
  }

  async getRecentBlogReviews(limit = 20): Promise<BlogReview[]> {
    return db.select().from(blogReviews).orderBy(desc(blogReviews.createdAt)).limit(limit);
  }

  async getBlogReviewsByDate(gameDate: string): Promise<BlogReview[]> {
    return db.select().from(blogReviews).where(eq(blogReviews.gameDate, gameDate)).orderBy(desc(blogReviews.createdAt));
  }

  // ── Editorial Columns ──
  async createEditorialColumn(col: InsertEditorialColumn): Promise<EditorialColumn> {
    const [created] = await db.insert(editorialColumns).values(col).returning();
    return created;
  }

  async getEditorialColumns(limit = 50): Promise<EditorialColumn[]> {
    return db.select().from(editorialColumns).orderBy(desc(editorialColumns.createdAt)).limit(limit);
  }

  async getEditorialColumnsByAssignment(assignmentId: string): Promise<EditorialColumn[]> {
    return db.select().from(editorialColumns).where(eq(editorialColumns.assignmentId, assignmentId)).orderBy(editorialColumns.createdAt);
  }

  async getEditorialColumnBySlug(slug: string): Promise<EditorialColumn | undefined> {
    const [col] = await db.select().from(editorialColumns).where(eq(editorialColumns.slug, slug));
    return col;
  }

  // ── Newsletter Subscribers ──
  async addSubscriber(sub: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [created] = await db.insert(newsletterSubscribers).values(sub).returning();
    return created;
  }

  async getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const [sub] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));
    return sub;
  }

  async getSubscriberByToken(token: string): Promise<NewsletterSubscriber | undefined> {
    const [sub] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.unsubscribeToken, token));
    return sub;
  }

  async getActiveSubscribers(): Promise<NewsletterSubscriber[]> {
    return db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'active')).orderBy(desc(newsletterSubscribers.subscribedAt));
  }

  async getAllSubscribers(): Promise<NewsletterSubscriber[]> {
    return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
  }

  async unsubscribe(token: string): Promise<boolean> {
    const result = await db.update(newsletterSubscribers).set({ status: 'unsubscribed', unsubscribedAt: new Date() }).where(eq(newsletterSubscribers.unsubscribeToken, token)).returning();
    return result.length > 0;
  }

  // ── Newsletters ──
  async createNewsletter(nl: InsertNewsletter): Promise<Newsletter> {
    const [created] = await db.insert(newsletters).values(nl).returning();
    return created;
  }

  async getNewsletters(limit = 50): Promise<Newsletter[]> {
    return db.select().from(newsletters).orderBy(desc(newsletters.createdAt)).limit(limit);
  }

  async getNewsletterBySlug(slug: string): Promise<Newsletter | undefined> {
    const [nl] = await db.select().from(newsletters).where(eq(newsletters.slug, slug));
    return nl;
  }

  async updateNewsletter(id: number, data: Partial<InsertNewsletter>): Promise<Newsletter> {
    const [updated] = await db.update(newsletters).set(data).where(eq(newsletters.id, id)).returning();
    return updated;
  }

  // ── Expert Picks ──
  async createExpertPick(pick: InsertExpertPick): Promise<ExpertPick> {
    const [created] = await db.insert(expertPicks).values(pick).returning();
    return created;
  }

  async getExpertPicksByDate(gameDate: string): Promise<ExpertPick[]> {
    return db.select().from(expertPicks).where(eq(expertPicks.gameDate, gameDate)).orderBy(desc(expertPicks.createdAt));
  }

  async getExpertPicksByExpert(expertId: string, limit = 50): Promise<ExpertPick[]> {
    return db.select().from(expertPicks).where(eq(expertPicks.expertId, expertId)).orderBy(desc(expertPicks.createdAt)).limit(limit);
  }

  async getExpertPicksByGame(gameId: string): Promise<ExpertPick[]> {
    return db.select().from(expertPicks).where(eq(expertPicks.gameId, gameId));
  }

  async getPendingExpertPicks(): Promise<ExpertPick[]> {
    return db.select().from(expertPicks).where(eq(expertPicks.result, 'pending')).orderBy(expertPicks.createdAt);
  }

  async gradeExpertPick(id: number, result: string, postGameNote?: string): Promise<ExpertPick> {
    const [updated] = await db.update(expertPicks).set({ result, postGameNote: postGameNote || null, gradedAt: new Date() }).where(eq(expertPicks.id, id)).returning();
    return updated;
  }

  async getExpertRecord(expertId: string): Promise<{ wins: number; losses: number; pushes: number; pending: number }> {
    const picks = await db.select().from(expertPicks).where(eq(expertPicks.expertId, expertId));
    return {
      wins: picks.filter(p => p.result === 'win').length,
      losses: picks.filter(p => p.result === 'loss').length,
      pushes: picks.filter(p => p.result === 'push').length,
      pending: picks.filter(p => !p.result || p.result === 'pending').length,
    };
  }

  // ── User Expert Follows ──
  async toggleExpertFollow(userId: number, expertId: string, mode: string): Promise<UserExpertFollow | null> {
    // Check existing
    const [existing] = await db.select().from(userExpertFollows)
      .where(and(eq(userExpertFollows.userId, userId), eq(userExpertFollows.expertId, expertId)));
    if (existing) {
      if (existing.mode === mode) {
        // Unfollow
        await db.delete(userExpertFollows).where(eq(userExpertFollows.id, existing.id));
        return null;
      }
      // Switch mode
      const [updated] = await db.update(userExpertFollows).set({ mode }).where(eq(userExpertFollows.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(userExpertFollows).values({ userId, expertId, mode }).returning();
    return created;
  }

  async getUserExpertFollows(userId: number): Promise<UserExpertFollow[]> {
    return db.select().from(userExpertFollows).where(eq(userExpertFollows.userId, userId));
  }

  // ── Trivia ──
  async createTriviaQuestion(q: any): Promise<any> {
    const [created] = await db.insert(triviaQuestions).values(q).returning();
    return created;
  }

  async getTriviaByDate(gameDate: string): Promise<any[]> {
    return db.select().from(triviaQuestions).where(eq(triviaQuestions.gameDate, gameDate));
  }

  async recordTriviaAnswer(a: any): Promise<any> {
    const [created] = await db.insert(triviaAnswers).values(a).returning();
    return created;
  }

  async getUserTriviaAnswers(userId: number, gameDate: string): Promise<any[]> {
    const questions = await this.getTriviaByDate(gameDate);
    const qIds = questions.map(q => q.id);
    if (qIds.length === 0) return [];
    return db.select().from(triviaAnswers).where(and(eq(triviaAnswers.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
