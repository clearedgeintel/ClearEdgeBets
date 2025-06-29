import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  status: text("status").notNull().default("scheduled"),
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
