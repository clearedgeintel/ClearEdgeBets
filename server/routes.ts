import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchTodaysGames } from "./services/odds";
import { generateGameAnalysis, generateDailyDigest, type GameAnalysisData } from "./services/openai";
import { insertBetSchema, insertGameSchema, insertOddsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get today's games with odds and AI analysis
  app.get("/api/games", async (req, res) => {
    try {
      // Fetch fresh odds data
      const gamesWithOdds = await fetchTodaysGames();
      
      // Store/update games in memory
      for (const gameData of gamesWithOdds) {
        const existingGame = await storage.getGame(gameData.gameId);
        
        if (!existingGame) {
          await storage.createGame({
            gameId: gameData.gameId,
            awayTeam: gameData.awayTeam,
            homeTeam: gameData.homeTeam,
            awayTeamCode: gameData.awayTeamCode,
            homeTeamCode: gameData.homeTeamCode,
            gameTime: gameData.gameTime,
            venue: gameData.venue,
            status: "scheduled"
          });
        }

        // Store odds
        if (gameData.odds.moneyline) {
          await storage.createOdds({
            gameId: gameData.gameId,
            bookmaker: "consensus",
            market: "moneyline",
            awayOdds: gameData.odds.moneyline.away,
            homeOdds: gameData.odds.moneyline.home,
            publicPercentage: gameData.publicPercentage
          });
        }

        if (gameData.odds.total) {
          await storage.createOdds({
            gameId: gameData.gameId,
            bookmaker: "consensus",
            market: "totals",
            overOdds: gameData.odds.total.over,
            underOdds: gameData.odds.total.under,
            total: gameData.odds.total.line.toString(),
            publicPercentage: gameData.publicPercentage
          });
        }

        if (gameData.odds.spread) {
          await storage.createOdds({
            gameId: gameData.gameId,
            bookmaker: "consensus",
            market: "spreads",
            awaySpread: gameData.odds.spread.away.toString(),
            homeSpread: gameData.odds.spread.home.toString(),
            awaySpreadOdds: gameData.odds.spread.awayOdds,
            homeSpreadOdds: gameData.odds.spread.homeOdds,
            publicPercentage: gameData.publicPercentage
          });
        }
      }

      // Get all games with their odds and AI summaries
      const games = await storage.getAllTodaysGames();
      const gamesWithData = await Promise.all(
        games.map(async (game) => {
          const odds = await storage.getOddsByGameId(game.gameId);
          let aiSummary = await storage.getAiSummary(game.gameId);
          
          // Auto-generate AI analysis if it doesn't exist
          if (!aiSummary) {
            try {
              const analysisData: GameAnalysisData = {
                awayTeam: game.awayTeam,
                homeTeam: game.homeTeam,
                awayPitcher: game.awayPitcher ?? undefined,
                homePitcher: game.homePitcher ?? undefined,
                awayPitcherStats: game.awayPitcherStats ?? undefined,
                homePitcherStats: game.homePitcherStats ?? undefined,
                venue: game.venue,
                gameTime: game.gameTime
              };

              // Add odds data
              const moneylineOdds = odds.find(o => o.market === "moneyline");
              if (moneylineOdds) {
                analysisData.moneylineOdds = {
                  away: moneylineOdds.awayOdds || 0,
                  home: moneylineOdds.homeOdds || 0
                };
              }

              const totalOdds = odds.find(o => o.market === "totals");
              if (totalOdds) {
                analysisData.total = {
                  line: parseFloat(totalOdds.total || "8.5"),
                  overOdds: totalOdds.overOdds || 0,
                  underOdds: totalOdds.underOdds || 0
                };
              }

              const spreadOdds = odds.find(o => o.market === "spreads");
              if (spreadOdds) {
                analysisData.runLine = {
                  awaySpread: parseFloat(spreadOdds.awaySpread || "1.5"),
                  homeSpread: parseFloat(spreadOdds.homeSpread || "-1.5"),
                  awayOdds: spreadOdds.awaySpreadOdds || 0,
                  homeOdds: spreadOdds.homeSpreadOdds || 0
                };
              }

              const analysis = await generateGameAnalysis(analysisData);
              
              aiSummary = await storage.createAiSummary({
                gameId: game.gameId,
                summary: analysis.summary,
                confidence: analysis.confidence,
                valuePlays: JSON.stringify(analysis.valuePlays)
              });
            } catch (error) {
              console.log(`AI analysis failed for game ${game.gameId}:`, error);
            }
          }
          
          return {
            ...game,
            odds,
            aiSummary
          };
        })
      );

      res.json(gamesWithData);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  // Generate AI analysis for a specific game
  app.post("/api/games/:gameId/analyze", async (req, res) => {
    try {
      const { gameId } = req.params;
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const odds = await storage.getOddsByGameId(gameId);
      
      // Prepare data for AI analysis
      const analysisData: GameAnalysisData = {
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        awayPitcher: game.awayPitcher ?? undefined,
        homePitcher: game.homePitcher ?? undefined,
        awayPitcherStats: game.awayPitcherStats ?? undefined,
        homePitcherStats: game.homePitcherStats ?? undefined,
        venue: game.venue,
        gameTime: game.gameTime
      };

      // Add odds data
      const moneylineOdds = odds.find(o => o.market === "moneyline");
      if (moneylineOdds) {
        analysisData.moneylineOdds = {
          away: moneylineOdds.awayOdds || 0,
          home: moneylineOdds.homeOdds || 0
        };
      }

      const totalOdds = odds.find(o => o.market === "totals");
      if (totalOdds) {
        analysisData.total = {
          line: parseFloat(totalOdds.total || "0"),
          overOdds: totalOdds.overOdds || 0,
          underOdds: totalOdds.underOdds || 0
        };
      }

      const spreadOdds = odds.find(o => o.market === "spreads");
      if (spreadOdds) {
        analysisData.runLine = {
          awaySpread: parseFloat(spreadOdds.awaySpread || "0"),
          homeSpread: parseFloat(spreadOdds.homeSpread || "0"),
          awayOdds: spreadOdds.awaySpreadOdds || 0,
          homeOdds: spreadOdds.homeSpreadOdds || 0
        };
      }

      // Generate AI analysis
      const analysis = await generateGameAnalysis(analysisData);
      
      // Store the analysis
      const aiSummary = await storage.createAiSummary({
        gameId,
        summary: analysis.summary,
        confidence: analysis.confidence,
        valuePlays: analysis.valuePlays
      });

      res.json(aiSummary);
    } catch (error) {
      console.error("Error generating analysis:", error);
      res.status(500).json({ error: "Failed to generate analysis" });
    }
  });

  // Get user's betting history
  app.get("/api/bets", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const bets = await storage.getUserBets(userId);
      res.json(bets);
    } catch (error) {
      console.error("Error fetching bets:", error);
      res.status(500).json({ error: "Failed to fetch bets" });
    }
  });

  // Place a new bet
  app.post("/api/bets", async (req, res) => {
    try {
      const validatedBet = insertBetSchema.parse(req.body);
      const bet = await storage.createBet(validatedBet);
      res.status(201).json(bet);
    } catch (error) {
      console.error("Error placing bet:", error);
      res.status(400).json({ error: "Invalid bet data" });
    }
  });

  // Calculate Kelly Criterion
  app.post("/api/kelly", async (req, res) => {
    try {
      const { odds, winProbability, bankroll } = req.body;
      
      if (!odds || !winProbability || !bankroll) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Convert American odds to decimal
      const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
      
      // Kelly formula: f = (bp - q) / b
      // where b = odds-1, p = win probability, q = lose probability
      const b = decimalOdds - 1;
      const p = winProbability / 100;
      const q = 1 - p;
      
      const kellyFraction = (b * p - q) / b;
      const kellyPercentage = Math.max(0, kellyFraction * 100);
      const suggestedBet = (kellyPercentage / 100) * bankroll;

      res.json({
        kellyFraction,
        kellyPercentage: Math.round(kellyPercentage * 100) / 100,
        suggestedBet: Math.round(suggestedBet * 100) / 100,
        bankrollPercentage: Math.round(kellyPercentage * 100) / 100
      });
    } catch (error) {
      console.error("Error calculating Kelly:", error);
      res.status(500).json({ error: "Failed to calculate Kelly Criterion" });
    }
  });

  // Generate daily digest
  app.get("/api/digest", async (req, res) => {
    try {
      const games = await storage.getAllTodaysGames();
      const gamesData: GameAnalysisData[] = games.map(game => ({
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        gameTime: game.gameTime,
        venue: game.venue
      }));

      const digest = await generateDailyDigest(gamesData);
      res.json({ content: digest, generatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("Error generating digest:", error);
      res.status(500).json({ error: "Failed to generate daily digest" });
    }
  });

  // Daily picks endpoints
  app.get("/api/daily-picks", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const picks = await storage.getDailyPicks(today);
      res.json(picks);
    } catch (error) {
      console.error("Error fetching daily picks:", error);
      res.status(500).json({ error: "Failed to fetch daily picks" });
    }
  });

  app.post("/api/daily-picks/generate", async (req, res) => {
    try {
      const games = await storage.getAllTodaysGames();
      const { generateDailyPicks } = await import("./services/openai.js");
      
      const gameData = await Promise.all(games.map(async game => {
        const odds = await storage.getOddsByGameId(game.gameId);
        const moneylineOdds = odds.find(o => o.market === "h2h");
        const totalOdds = odds.find(o => o.market === "totals");
        const spreadOdds = odds.find(o => o.market === "spreads");

        return {
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          gameId: game.gameId,
          moneylineOdds: moneylineOdds ? { away: moneylineOdds.awayOdds || 0, home: moneylineOdds.homeOdds || 0 } : undefined,
          total: totalOdds ? { line: parseFloat(totalOdds.total || "0"), overOdds: totalOdds.overOdds || 0, underOdds: totalOdds.underOdds || 0 } : undefined,
          runLine: spreadOdds ? { 
            awaySpread: parseFloat(spreadOdds.awaySpread || "0"), 
            homeSpread: parseFloat(spreadOdds.homeSpread || "0"),
            awayOdds: spreadOdds.awaySpreadOdds || 0,
            homeOdds: spreadOdds.homeSpreadOdds || 0
          } : undefined,
          venue: game.venue,
          gameTime: game.gameTime,
          publicPercentage: moneylineOdds?.publicPercentage ? JSON.parse(JSON.stringify(moneylineOdds.publicPercentage)) : undefined
        };
      }));

      const aiPicks = await generateDailyPicks(gameData);
      const today = new Date().toISOString().split('T')[0];

      // Store picks in database
      const storedPicks = await Promise.all(aiPicks.map(pick => 
        storage.createDailyPick({
          date: today,
          gameId: pick.gameId,
          pickType: pick.pickType,
          selection: pick.selection,
          odds: pick.odds,
          confidence: pick.confidence,
          reasoning: pick.reasoning,
          expectedValue: pick.expectedValue.toString(),
          status: "active"
        })
      ));

      res.json(storedPicks);
    } catch (error) {
      console.error("Error generating daily picks:", error);
      res.status(500).json({ error: "Failed to generate daily picks" });
    }
  });

  // Consensus data endpoints
  app.get("/api/consensus/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const consensus = await storage.getConsensusData(gameId);
      res.json(consensus);
    } catch (error) {
      console.error("Error fetching consensus data:", error);
      res.status(500).json({ error: "Failed to fetch consensus data" });
    }
  });

  app.post("/api/consensus/:gameId/generate", async (req, res) => {
    try {
      const { gameId } = req.params;
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const { generateConsensusAnalysis } = await import("./services/openai.js");
      const odds = await storage.getOddsByGameId(gameId);
      const moneylineOdds = odds.find(o => o.market === "h2h");
      const totalOdds = odds.find(o => o.market === "totals");

      const gameData = {
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        gameId: game.gameId,
        moneylineOdds: moneylineOdds ? { away: moneylineOdds.awayOdds || 0, home: moneylineOdds.homeOdds || 0 } : undefined,
        total: totalOdds ? { line: parseFloat(totalOdds.total || "0"), overOdds: totalOdds.overOdds || 0, underOdds: totalOdds.underOdds || 0 } : undefined,
        venue: game.venue,
        gameTime: game.gameTime,
        publicPercentage: moneylineOdds?.publicPercentage ? JSON.parse(JSON.stringify(moneylineOdds.publicPercentage)) : undefined
      };

      const consensusAnalysis = await generateConsensusAnalysis(gameData);

      // Store consensus data
      const storedConsensus = await Promise.all(consensusAnalysis.map(analysis => 
        storage.createConsensusData({
          gameId: analysis.gameId,
          market: analysis.market,
          publicPercentage: analysis.publicPercentage,
          sharpMoney: analysis.sharpMoney,
          lineMovement: analysis.lineMovement,
          bookmakerConsensus: analysis.recommendation
        })
      ));

      res.json(storedConsensus);
    } catch (error) {
      console.error("Error generating consensus data:", error);
      res.status(500).json({ error: "Failed to generate consensus data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
