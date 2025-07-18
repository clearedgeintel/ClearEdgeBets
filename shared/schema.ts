import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  subscriptionTier: text("subscription_tier").notNull().default("free"), // free, pro, elite
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // active, canceled, past_due
  subscriptionEndDate: timestamp("subscription_end_date"),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  referralCount: integer("referral_count").default(0),
  isAdmin: boolean("is_admin").default(false),
  // Virtual betting balance (in cents to avoid decimal issues)
  virtualBalance: integer("virtual_balance").default(100000), // $1000 in cents
  totalVirtualWinnings: integer("total_virtual_winnings").default(0), // track total winnings
  totalVirtualLosses: integer("total_virtual_losses").default(0), // track total losses
  betCount: integer("bet_count").default(0), // track number of bets placed
  winCount: integer("win_count").default(0), // track number of winning bets
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral codes table for tracking and management
export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  usageCount: integer("usage_count").default(0),
  maxUses: integer("max_uses"), // null = unlimited
  isActive: boolean("is_active").default(true),
  rewardTier: text("reward_tier"), // what tier to grant
  rewardDuration: integer("reward_duration"), // days of access
  commissionPercentage: integer("commission_percentage").default(0), // percentage commission for referrer (0-100)
  totalCommissionEarned: integer("total_commission_earned").default(0), // total commission earned in cents
  totalReferrals: integer("total_referrals").default(0), // count of successful referrals
  lastPayoutAt: timestamp("last_payout_at"), // when commission was last paid out
  payoutStatus: text("payout_status").default("pending"), // pending, processing, paid
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const weeklyLeaderboard = pgTable("weekly_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  weekStart: timestamp("week_start").notNull(), // Monday of the week
  weekEnd: timestamp("week_end").notNull(), // Sunday of the week
  totalBets: integer("total_bets").default(0),
  wonBets: integer("won_bets").default(0),
  lostBets: integer("lost_bets").default(0),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).default("0.00"), // percentage
  totalStaked: decimal("total_staked", { precision: 10, scale: 2 }).default("0.00"),
  totalWinnings: decimal("total_winnings", { precision: 10, scale: 2 }).default("0.00"),
  netProfit: decimal("net_profit", { precision: 10, scale: 2 }).default("0.00"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).default("0.00"), // percentage
  rank: integer("rank").default(0),
  points: integer("points").default(0), // scoring system: win=3pts, place=1pt
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Phrase detection rules for AI analysis
export const phraseDetectionRules = pgTable("phrase_detection_rules", {
  id: serial("id").primaryKey(),
  phrase: text("phrase").notNull(),
  category: text("category").notNull(), // 'under', 'over', 'away_team', 'home_team'
  description: text("description"), // optional description of what the phrase indicates
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1), // higher priority phrases are checked first
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull().unique(),
  awayTeam: text("away_team").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeamCode: text("away_team_code").notNull(),
  homeTeamCode: text("home_team_code").notNull(),
  gameTime: text("game_time").notNull(),
  venue: text("venue").notNull(),
  awayPitcher: text("away_pitcher"),
  homePitcher: text("home_pitcher"),
  awayPitcherStats: text("away_pitcher_stats"),
  homePitcherStats: text("home_pitcher_stats"),
  status: text("status").notNull().default("scheduled"), // scheduled, live, final, postponed, suspended
  awayScore: integer("away_score"),
  homeScore: integer("home_score"),
  // Live game information
  inning: integer("inning"),
  inningHalf: text("inning_half"), // top, bottom
  outs: integer("outs"),
  balls: integer("balls"),
  strikes: integer("strikes"),
  runnersOn: jsonb("runners_on"), // bases occupied
  lastPlay: text("last_play"),
  // Game completion info
  completedAt: timestamp("completed_at"),
  betsSettled: boolean("bets_settled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const odds = pgTable("odds", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  bookmaker: text("bookmaker").notNull(),
  market: text("market").notNull(),
  awayOdds: integer("away_odds"),
  homeOdds: integer("home_odds"),
  overOdds: integer("over_odds"),
  underOdds: integer("under_odds"),
  total: decimal("total", { precision: 3, scale: 1 }),
  awaySpread: decimal("away_spread", { precision: 3, scale: 1 }),
  homeSpread: decimal("home_spread", { precision: 3, scale: 1 }),
  awaySpreadOdds: integer("away_spread_odds"),
  homeSpreadOdds: integer("home_spread_odds"),
  publicPercentage: jsonb("public_percentage"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiSummaries = pgTable("ai_summaries", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  summary: text("summary").notNull(),
  confidence: integer("confidence").notNull(),
  valuePlays: jsonb("value_plays"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  gameId: text("game_id").notNull(),
  betType: text("bet_type").notNull(),
  selection: text("selection").notNull(),
  odds: integer("odds").notNull(),
  stake: decimal("stake", { precision: 10, scale: 2 }).notNull(),
  potentialWin: decimal("potential_win", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  result: text("result"),
  actualWin: decimal("actual_win", { precision: 10, scale: 2 }),
  placedAt: timestamp("placed_at").defaultNow(),
  notes: text("notes"),
  confidence: integer("confidence"),
});

export const dailyPicks = pgTable("daily_picks", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  gameId: text("game_id").notNull(),
  pickType: text("pick_type").notNull(),
  selection: text("selection").notNull(),
  odds: integer("odds").notNull(),
  reasoning: text("reasoning").notNull(),
  confidence: integer("confidence").notNull(),
  expectedValue: decimal("expected_value", { precision: 5, scale: 2 }),
  status: text("status").notNull().default("pending"),
  result: text("result"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consensusData = pgTable("consensus_data", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  market: text("market").notNull(),
  publicPercentage: jsonb("public_percentage").notNull(),
  sharpMoney: jsonb("sharp_money"),
  lineMovement: jsonb("line_movement"),
  bookmakerConsensus: jsonb("bookmaker_consensus"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const props = pgTable("props", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  player: text("player").notNull(),
  propType: text("prop_type").notNull(),
  line: text("line").notNull(),
  odds: integer("odds").notNull(),
  description: text("description"),
});

export const performanceTracking = pgTable("performance_tracking", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  gameDate: text("game_date").notNull(),
  awayTeam: text("away_team").notNull(),
  homeTeam: text("home_team").notNull(),
  
  // AI Predictions
  aiConfidence: integer("ai_confidence"),
  predictedWinner: text("predicted_winner"),
  predictedTotal: decimal("predicted_total", { precision: 4, scale: 1 }),
  predictedSpread: decimal("predicted_spread", { precision: 4, scale: 1 }),
  aiValuePlays: jsonb("ai_value_plays"),
  
  // Actual Results
  actualWinner: text("actual_winner"),
  actualTotal: decimal("actual_total", { precision: 4, scale: 1 }),
  actualSpread: decimal("actual_spread", { precision: 4, scale: 1 }),
  finalScore: text("final_score"),
  
  // Performance Metrics
  winnerCorrect: boolean("winner_correct"),
  totalCorrect: boolean("total_correct"),
  spreadCorrect: boolean("spread_correct"),
  confidenceAccuracy: decimal("confidence_accuracy", { precision: 5, scale: 2 }),
  
  // Pitcher Performance vs Prediction
  awayPitcherActual: jsonb("away_pitcher_actual"),
  homePitcherActual: jsonb("home_pitcher_actual"),
  pitchingPredictionAccuracy: decimal("pitching_prediction_accuracy", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertOddsSchema = createInsertSchema(odds).omit({
  id: true,
  updatedAt: true,
});

export const insertAiSummarySchema = createInsertSchema(aiSummaries).omit({
  id: true,
  createdAt: true,
});

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  placedAt: true,
}).extend({
  stake: z.union([z.string(), z.number()]).transform(val => val.toString()),
  potentialWin: z.union([z.string(), z.number()]).transform(val => val.toString()),
  actualWin: z.union([z.string(), z.number(), z.null()]).transform(val => val === null ? null : val?.toString()).optional(),
});

export const insertPropSchema = createInsertSchema(props).omit({
  id: true,
});

export const insertDailyPickSchema = createInsertSchema(dailyPicks).omit({
  id: true,
  createdAt: true,
});

export const insertConsensusDataSchema = createInsertSchema(consensusData).omit({
  id: true,
  updatedAt: true,
});

export const insertPerformanceTrackingSchema = createInsertSchema(performanceTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklyLeaderboardSchema = createInsertSchema(weeklyLeaderboard).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertOdds = z.infer<typeof insertOddsSchema>;
export type Odds = typeof odds.$inferSelect;
export type InsertAiSummary = z.infer<typeof insertAiSummarySchema>;
export type AiSummary = typeof aiSummaries.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;
export type InsertProp = z.infer<typeof insertPropSchema>;
export type Prop = typeof props.$inferSelect;
export type InsertDailyPick = z.infer<typeof insertDailyPickSchema>;
export type DailyPick = typeof dailyPicks.$inferSelect;
export type InsertConsensusData = z.infer<typeof insertConsensusDataSchema>;
export type ConsensusData = typeof consensusData.$inferSelect;
export type InsertPerformanceTracking = z.infer<typeof insertPerformanceTrackingSchema>;
export type PerformanceTracking = typeof performanceTracking.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertWeeklyLeaderboard = z.infer<typeof insertWeeklyLeaderboardSchema>;
export type WeeklyLeaderboard = typeof weeklyLeaderboard.$inferSelect;

// Bankroll transactions table for comprehensive financial tracking
export const bankrollTransactions = pgTable("bankroll_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  transactionType: text("transaction_type").notNull(), // bet_placed, bet_won, bet_lost, bet_push, deposit, withdrawal, bonus, refund
  amount: integer("amount").notNull(), // amount in cents (positive for credits, negative for debits)
  previousBalance: integer("previous_balance").notNull(), // balance before transaction in cents
  newBalance: integer("new_balance").notNull(), // balance after transaction in cents
  relatedBetId: integer("related_bet_id").references(() => bets.id), // link to bet if transaction is bet-related
  relatedGameId: text("related_game_id"), // link to game if applicable
  description: text("description").notNull(), // human-readable description
  metadata: jsonb("metadata"), // additional transaction details
  processedBy: text("processed_by"), // system, admin, or user action
  status: text("status").default("completed"), // pending, completed, failed, reversed
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log table for comprehensive system tracking
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // null for system actions
  action: text("action").notNull(), // bet_placed, bet_settled, balance_updated, user_created, etc.
  entityType: text("entity_type").notNull(), // bet, user, game, transaction, etc.
  entityId: text("entity_id"), // ID of the affected entity
  oldValues: jsonb("old_values"), // previous state before change
  newValues: jsonb("new_values"), // new state after change
  ipAddress: text("ip_address"), // user IP if applicable
  userAgent: text("user_agent"), // user browser/app info
  sessionId: text("session_id"), // session identifier
  severity: text("severity").default("info"), // debug, info, warning, error, critical
  description: text("description").notNull(), // human-readable description
  metadata: jsonb("metadata"), // additional context data
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily bankroll snapshots for historical tracking
export const bankrollSnapshots = pgTable("bankroll_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  snapshotDate: date("snapshot_date").notNull(), // date of snapshot
  startingBalance: integer("starting_balance").notNull(), // balance at start of day
  endingBalance: integer("ending_balance").notNull(), // balance at end of day
  totalWagered: integer("total_wagered").default(0), // total amount wagered this day
  totalWon: integer("total_won").default(0), // total amount won this day
  totalLost: integer("total_lost").default(0), // total amount lost this day
  betsPlaced: integer("bets_placed").default(0), // number of bets placed
  betsWon: integer("bets_won").default(0), // number of bets won
  betsLost: integer("bets_lost").default(0), // number of bets lost
  netChange: integer("net_change").default(0), // net change for the day
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).default("0.00"), // win percentage
  roi: decimal("roi", { precision: 5, scale: 2 }).default("0.00"), // return on investment percentage
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertBankrollTransactionSchema = createInsertSchema(bankrollTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertBankrollSnapshotSchema = createInsertSchema(bankrollSnapshots).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type InsertBankrollTransaction = z.infer<typeof insertBankrollTransactionSchema>;
export type BankrollTransaction = typeof bankrollTransactions.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertBankrollSnapshot = z.infer<typeof insertBankrollSnapshotSchema>;
export type BankrollSnapshot = typeof bankrollSnapshots.$inferSelect;

// Player props table for DFS betting
export const playerProps = pgTable("player_props", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(),
  playerName: text("player_name").notNull(),
  team: text("team").notNull(),
  opponent: text("opponent").notNull(),
  propType: text("prop_type").notNull(), // hits, home_runs, strikeouts, etc.
  line: decimal("line", { precision: 10, scale: 2 }).notNull(),
  overOdds: integer("over_odds").notNull(),
  underOdds: integer("under_odds").notNull(),
  bookmaker: text("bookmaker").notNull(), // draftkings, fanduel, underdog, prizepicks
  category: text("category").notNull(), // hitting, pitching, general
  projectedValue: decimal("projected_value", { precision: 10, scale: 2 }),
  edge: decimal("edge", { precision: 10, scale: 4 }), // calculated edge percentage
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player prop parlays table
export const playerPropParlays = pgTable("player_prop_parlays", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name"), // optional parlay name
  selections: jsonb("selections").notNull(), // array of prop selections
  analysis: jsonb("analysis").notNull(), // parlay analysis data
  stake: integer("stake").notNull(), // stake in cents
  potentialPayout: integer("potential_payout").notNull(), // potential payout in cents
  totalOdds: integer("total_odds").notNull(), // combined american odds
  status: text("status").default("pending"), // pending, won, lost, pushed
  result: text("result"), // final result details
  actualPayout: integer("actual_payout"), // actual payout in cents
  placedAt: timestamp("placed_at"),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prop bet tracking table for individual prop bets (non-parlay)
export const propBets = pgTable("prop_bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  propId: integer("prop_id").notNull().references(() => playerProps.id),
  selection: text("selection").notNull(), // over or under
  odds: integer("odds").notNull(),
  stake: integer("stake").notNull(), // stake in cents
  potentialWin: integer("potential_win").notNull(), // potential win in cents
  status: text("status").default("pending"), // pending, won, lost, pushed
  result: text("result"), // final result
  actualWin: integer("actual_win"), // actual win in cents
  placedAt: timestamp("placed_at").defaultNow(),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for player props
export const insertPlayerPropSchema = createInsertSchema(playerProps).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertPlayerPropParlaySchema = createInsertSchema(playerPropParlays).omit({
  id: true,
  createdAt: true,
});

export const insertPropBetSchema = createInsertSchema(propBets).omit({
  id: true,
  createdAt: true,
});

// Types for player props
export type InsertPlayerProp = z.infer<typeof insertPlayerPropSchema>;
export type PlayerProp = typeof playerProps.$inferSelect;
export type InsertPlayerPropParlay = z.infer<typeof insertPlayerPropParlaySchema>;
export type PlayerPropParlay = typeof playerPropParlays.$inferSelect;
export type InsertPropBet = z.infer<typeof insertPropBetSchema>;
export type PropBet = typeof propBets.$inferSelect;

// Groups table for betting groups
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  maxMembers: integer("max_members").default(50),
  currentMembers: integer("current_members").default(1),
  inviteCode: text("invite_code").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group memberships table
export const groupMemberships = pgTable("group_memberships", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // admin, moderator, member
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Friend invitations table
export const friendInvitations = pgTable("friend_invitations", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").references(() => users.id), // null for email invites
  recipientEmail: text("recipient_email"), // for inviting non-users
  groupId: integer("group_id").references(() => groups.id), // optional group invitation
  status: text("status").notNull().default("pending"), // pending, accepted, declined, expired
  message: text("message"),
  inviteToken: text("invite_token").unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Friendships table for accepted friend relationships
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId1: integer("user_id_1").notNull().references(() => users.id),
  userId2: integer("user_id_2").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group leaderboards (group-specific weekly competition)
export const groupLeaderboards = pgTable("group_leaderboards", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  totalBets: integer("total_bets").default(0),
  wonBets: integer("won_bets").default(0),
  lostBets: integer("lost_bets").default(0),
  winRate: text("win_rate").default("0%"),
  totalStaked: text("total_staked").default("$0"),
  totalWinnings: text("total_winnings").default("$0"),
  netProfit: text("net_profit").default("$0"),
  profitMargin: text("profit_margin").default("0%"),
  rank: integer("rank").default(1),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports for groups
export const insertGroupSchema = createInsertSchema(groups);
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export const insertGroupMembershipSchema = createInsertSchema(groupMemberships);
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;
export type GroupMembership = typeof groupMemberships.$inferSelect;

export const insertFriendInvitationSchema = createInsertSchema(friendInvitations);
export type InsertFriendInvitation = z.infer<typeof insertFriendInvitationSchema>;
export type FriendInvitation = typeof friendInvitations.$inferSelect;

export const insertFriendshipSchema = createInsertSchema(friendships);
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

export const insertGroupLeaderboardSchema = createInsertSchema(groupLeaderboards);
export type InsertGroupLeaderboard = z.infer<typeof insertGroupLeaderboardSchema>;
export type GroupLeaderboard = typeof groupLeaderboards.$inferSelect;

// AI-generated support tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // bug_report, feature_request, analysis_insight, market_update
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  source: text("source").notNull().default("ai_automated"), // ai_automated, user_submitted, admin_created
  metadata: jsonb("metadata"), // store additional data like game analysis, market conditions, etc.
  assignedTo: integer("assigned_to").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports for tickets
export const insertTicketSchema = createInsertSchema(tickets);
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Virtual Bets - Separate paper trading environment
export const virtualBets = pgTable("virtual_bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: text("game_id").notNull(),
  betType: text("bet_type").notNull(),
  selection: text("selection").notNull(),
  odds: integer("odds").notNull(),
  stake: integer("stake").notNull(), // in cents
  potentialWin: integer("potential_win").notNull(), // in cents
  status: text("status").notNull().default("pending"),
  result: text("result"),
  actualWin: integer("actual_win"), // in cents
  placedAt: timestamp("placed_at").defaultNow(),
  settledAt: timestamp("settled_at"),
  notes: text("notes"),
  confidence: integer("confidence"),
});

// Virtual Betting Slip - Temporary storage for unsaved virtual bets
export const virtualBettingSlip = pgTable("virtual_betting_slip", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: text("game_id").notNull(),
  betType: text("bet_type").notNull(),
  selection: text("selection").notNull(),
  odds: integer("odds").notNull(),
  stake: integer("stake").default(0), // in cents
  potentialWin: integer("potential_win").default(0), // in cents
  addedAt: timestamp("added_at").defaultNow(),
});

// Type exports for virtual betting
export const insertVirtualBetSchema = createInsertSchema(virtualBets);
export type InsertVirtualBet = z.infer<typeof insertVirtualBetSchema>;
export type VirtualBet = typeof virtualBets.$inferSelect;

export const insertVirtualBettingSlipSchema = createInsertSchema(virtualBettingSlip);
export type InsertVirtualBettingSlip = z.infer<typeof insertVirtualBettingSlipSchema>;
export type VirtualBettingSlip = typeof virtualBettingSlip.$inferSelect;

// Type exports for phrase detection rules
export const insertPhraseDetectionRuleSchema = createInsertSchema(phraseDetectionRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPhraseDetectionRule = z.infer<typeof insertPhraseDetectionRuleSchema>;
export type PhraseDetectionRule = typeof phraseDetectionRules.$inferSelect;
