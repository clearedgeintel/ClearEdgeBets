import { users, games, odds, aiSummaries, bets, props, dailyPicks, consensusData, type User, type InsertUser, type Game, type InsertGame, type Odds, type InsertOdds, type AiSummary, type InsertAiSummary, type Bet, type InsertBet, type Prop, type InsertProp, type DailyPick, type InsertDailyPick, type ConsensusData, type InsertConsensusData } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  updateDailyPickResult(pickId: number, result: string): Promise<DailyPick>;

  // Consensus Data methods
  getConsensusData(gameId: string): Promise<ConsensusData[]>;
  createConsensusData(data: InsertConsensusData): Promise<ConsensusData>;
  updateConsensusData(gameId: string, market: string, updates: Partial<ConsensusData>): Promise<ConsensusData>;
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

  async updateDailyPickResult(pickId: number, result: string): Promise<DailyPick> {
    for (const [date, picks] of Array.from(this.dailyPicks.entries())) {
      const pickIndex = picks.findIndex((p: any) => p.id === pickId);
      if (pickIndex >= 0) {
        const updatedPick = { ...picks[pickIndex], result, status: "settled" };
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

export const storage = new MemStorage();
