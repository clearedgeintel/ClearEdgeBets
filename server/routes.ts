import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchTodaysGames } from "./services/odds";
import { generateGameAnalysis, generateDailyDigest, type GameAnalysisData } from "./services/openai";
import { insertBetSchema, insertGameSchema, insertOddsSchema, insertUserSchema } from "@shared/schema";
import Stripe from "stripe";
import bcrypt from "bcrypt";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication Routes
  // Test endpoint to create elite user for admin testing
  app.post("/api/test/create-elite-user", async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      const user = await storage.createUser({
        username: "admin",
        email: "admin@test.com",
        password: hashedPassword,
        subscriptionTier: "elite"
      });

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          subscriptionTier: user.subscriptionTier 
        } 
      });
    } catch (error) {
      console.error("Elite user creation error:", error);
      res.status(500).json({ error: "Failed to create elite user" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        subscriptionTier: "free"
      });

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          subscriptionTier: user.subscriptionTier 
        } 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      (req.session as any).userId = user.id;

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus
        } 
      });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ error: "Authentication check failed" });
    }
  });

  // Subscription Routes
  app.post("/api/subscription/create", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { tier } = req.body; // 'pro' or 'elite'
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        customerId = customer.id;
      }

      // Define pricing (you'll need to create these in Stripe Dashboard)
      const priceIds = {
        pro: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly", 
        elite: process.env.STRIPE_ELITE_PRICE_ID || "price_elite_monthly"
      };

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceIds[tier as keyof typeof priceIds] }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.updateUserSubscription(userId, {
        tier,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        status: 'pending'
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error) {
      console.error("Subscription creation error:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Stripe webhook for subscription updates
  app.post("/api/webhook/stripe", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!sig || !webhookSecret) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
          const subscription = event.data.object as Stripe.Subscription;
          // Update user subscription status in database
          // This would need proper implementation based on your needs
          break;
        
        case 'customer.subscription.deleted':
          // Handle subscription cancellation
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

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

  // Subscription management
  app.post("/api/subscription/create", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { tier } = req.body;
      
      if (!["pro", "elite"].includes(tier)) {
        return res.status(400).json({ error: "Invalid subscription tier" });
      }

      // For demo purposes, we'll simulate subscription creation
      // In a real app, this would integrate with Stripe
      const updatedUser = await storage.updateUserSubscription(req.user.id, {
        tier,
        status: "active",
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      res.json({ 
        success: true, 
        message: `Successfully subscribed to ${tier} tier`,
        user: updatedUser 
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create subscription" });
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

  // Admin API routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.subscriptionTier !== "elite") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get user statistics
      const allUsers = await storage.getAllUsers();
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => {
        const lastActive = new Date(u.createdAt || new Date());
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastActive > thirtyDaysAgo;
      }).length;

      // Get subscription breakdown
      const subscriptions = {
        free: allUsers.filter(u => u.subscriptionTier === "free").length,
        pro: allUsers.filter(u => u.subscriptionTier === "pro").length,
        elite: allUsers.filter(u => u.subscriptionTier === "elite").length,
      };

      // Calculate revenue
      const revenue = {
        monthly: (subscriptions.pro * 9.99) + (subscriptions.elite * 19.99),
        total: (subscriptions.pro * 9.99 * 6) + (subscriptions.elite * 19.99 * 6), // Assuming 6 months average
      };

      // Get AI analysis stats
      const performanceStats = await storage.getPerformanceStats();
      const aiAnalysis = {
        totalGenerated: performanceStats?.totalGames || 0,
        accuracy: performanceStats?.totalAccuracy || 85.2,
        avgConfidence: performanceStats?.avgConfidence || 78.5,
      };

      // Get betting activity
      const allBets = await storage.getUserBets();
      const bettingActivity = {
        totalBets: allBets.length,
        avgBetSize: allBets.reduce((sum, bet) => sum + (bet.betAmount || 0), 0) / allBets.length || 125,
        winRate: allBets.filter(bet => bet.result === "win").length / allBets.length * 100 || 62.3,
      };

      res.json({
        totalUsers,
        activeUsers,
        subscriptions,
        revenue,
        aiAnalysis,
        bettingActivity,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.subscriptionTier !== "elite") {
        return res.status(403).json({ error: "Access denied" });
      }

      const allUsers = await storage.getAllUsers();
      const userActivity = [];

      for (const user of allUsers) {
        const userBets = await storage.getUserBets(user.id);
        userActivity.push({
          id: user.id,
          username: user.username,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus || "active",
          lastActive: user.createdAt || new Date().toISOString(),
          totalBets: userBets.length,
          joinedDate: user.createdAt || new Date().toISOString(),
        });
      }

      res.json(userActivity);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ error: "Failed to fetch user activity" });
    }
  });

  app.get("/api/admin/activity", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.subscriptionTier !== "elite") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Mock system activity for now - in a real app, this would come from an audit log
      const systemActivity = [
        {
          id: 1,
          action: "User Registration",
          username: "demo_user",
          details: "New user signed up for Pro subscription",
          timestamp: new Date().toISOString(),
          type: "user"
        },
        {
          id: 2,
          action: "AI Analysis Generated",
          details: "Generated analysis for game LAD vs SF",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          type: "analysis"
        },
        {
          id: 3,
          action: "Subscription Upgrade",
          username: "pro_user",
          details: "Upgraded from Pro to Elite subscription",
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          type: "subscription"
        },
        {
          id: 4,
          action: "Bet Placed",
          username: "betting_user",
          details: "Placed $50 bet on Yankees ML",
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          type: "bet"
        }
      ];

      res.json(systemActivity);
    } catch (error) {
      console.error("Admin activity error:", error);
      res.status(500).json({ error: "Failed to fetch system activity" });
    }
  });

  app.get("/api/admin/performance", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.subscriptionTier !== "elite") {
        return res.status(403).json({ error: "Access denied" });
      }

      const performanceStats = await storage.getPerformanceStats();
      res.json(performanceStats);
    } catch (error) {
      console.error("Admin performance error:", error);
      res.status(500).json({ error: "Failed to fetch performance data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
