import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchTodaysGames } from "./services/odds";
import { fetchCFLGames, generateMockCFLPublicPercentage, type CFLGame } from "./services/cfl";
import { fetchMLBGamesForDate, getGameResult } from "./services/mlb-api";
import { generateGameAnalysis, generateDailyDigest, type GameAnalysisData } from "./services/openai";
import { insertBetSchema, insertGameSchema, insertOddsSchema, insertUserSchema } from "@shared/schema";
import Stripe from "stripe";
import bcrypt from "bcrypt";

// Helper function to generate CFL pick reasoning
function generateCFLPickReasoning(game: CFLGame, pickType: number): string {
  const reasonings = [
    // Moneyline reasoning (pickType 0)
    [
      `${game.awayTeam} shows strong road form and should handle the travel well. Their offensive line has been protecting the quarterback effectively, while ${game.homeTeam}'s pass rush has struggled in recent games.`,
      `${game.awayTeam} has favorable matchups against ${game.homeTeam}'s secondary. Weather conditions and field surface favor the visiting team's playing style in this matchup.`,
      `${game.awayTeam} has won 4 of their last 6 road games against similar competition. Their running game should control the clock and keep ${game.homeTeam}'s explosive offense off the field.`
    ],
    // Total reasoning (pickType 1)  
    [
      `Expect a defensive battle with strong winds forecasted at ${game.venue}. Both teams have struggled offensively in recent weeks, and ${game.homeTeam}'s home field advantage includes tough weather conditions.`,
      `Both defenses are playing at a high level, while both offenses have been inconsistent. The pace of play should be methodical with emphasis on running games and field position.`,
      `Weather and field conditions favor under betting. Both teams prefer to control the clock, and recent head-to-head meetings have stayed under this total 3 of the last 4 times.`
    ],
    // Spread reasoning (pickType 2)
    [
      `${game.awayTeam} has been competitive as road underdogs this season, covering 4 of their last 6 games when getting points. ${game.homeTeam} tends to play down to competition level.`,
      `The spread appears inflated based on recent performance. ${game.awayTeam}'s defense has improved significantly and should keep this game within range throughout.`,
      `${game.awayTeam} matches up well against ${game.homeTeam}'s strengths. This line creates value as the market has overreacted to recent results and home field advantage.`
    ]
  ];

  const typeIndex = Math.max(0, Math.min(2, pickType));
  const reasoningIndex = Math.floor(Math.random() * reasonings[typeIndex].length);
  return reasonings[typeIndex][reasoningIndex];
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

// Function to generate different game data based on date
function generateGamesForDate(dateString: string) {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dateHash = dateString.split('-').join(''); // Simple hash from date
  
  // Use date as seed for consistent results
  const seed = parseInt(dateHash.substring(0, 8)) % 1000;
  
  // Vary game count based on day of week (MLB schedule patterns)
  let gameCount: number;
  if (dayOfWeek === 1) { // Monday - fewer games
    gameCount = ((seed * 17) % 6) + 2; // 2-7 games
  } else if (dayOfWeek === 0) { // Sunday - full schedule
    gameCount = ((seed * 23) % 8) + 10; // 10-17 games
  } else if (dayOfWeek === 6) { // Saturday - full schedule  
    gameCount = ((seed * 31) % 8) + 12; // 12-19 games
  } else { // Tuesday-Friday - normal schedule
    gameCount = ((seed * 13) % 6) + 8; // 8-13 games
  }

  // Real MLB pitchers by team (2024-2025 season)
  const mlbPitchers = {
    "ATL": ["Spencer Strider", "Max Fried", "Charlie Morton", "Bryce Elder", "AJ Smith-Shawver"],
    "MIA": ["Sandy Alcantara", "Jesus Luzardo", "Braxton Garrett", "Johnny Cueto", "Ryan Weathers"],
    "NYM": ["Jacob deGrom", "Kodai Senga", "Justin Verlander", "Jose Quintana", "Tylor Megill"],
    "PHI": ["Zack Wheeler", "Aaron Nola", "Ranger Suarez", "Cristopher Sanchez", "Taijuan Walker"],
    "WSH": ["Josiah Gray", "MacKenzie Gore", "Patrick Corbin", "Trevor Williams", "Jake Irvin"],
    "CHC": ["Justin Steele", "Jameson Taillon", "Marcus Stroman", "Jordan Wicks", "Javier Assad"],
    "CIN": ["Hunter Greene", "Nick Lodolo", "Graham Ashcraft", "Andrew Abbott", "Brandon Williamson"],
    "MIL": ["Corbin Burnes", "Freddy Peralta", "Brandon Woodruff", "Adrian Houser", "Colin Rea"],
    "PIT": ["Paul Skenes", "Mitch Keller", "Jared Jones", "Bailey Falter", "Marco Gonzales"],
    "STL": ["Sonny Gray", "Kyle Gibson", "Miles Mikolas", "Andre Pallante", "Steven Matz"],
    "ARI": ["Zac Gallen", "Merrill Kelly", "Eduardo Rodriguez", "Brandon Pfaadt", "Ryne Nelson"],
    "COL": ["German Marquez", "Kyle Freeland", "Austin Gomber", "Ryan Feltner", "Ty Blach"],
    "LAD": ["Yoshinobu Yamamoto", "Tyler Glasnow", "Walker Buehler", "Julio Urias", "Bobby Miller"],
    "SD": ["Dylan Cease", "Joe Musgrove", "Yu Darvish", "Michael King", "Matt Waldron"],
    "SF": ["Logan Webb", "Blake Snell", "Robbie Ray", "Kyle Harrison", "Jordan Hicks"],
    "BAL": ["Grayson Rodriguez", "Kyle Bradish", "John Means", "Dean Kremer", "Cole Irvin"],
    "BOS": ["Brayan Bello", "Kutter Crawford", "Tanner Houck", "Nick Pivetta", "Garrett Whitlock"],
    "NYY": ["Gerrit Cole", "Carlos Rodon", "Nestor Cortes", "Marcus Stroman", "Luis Gil"],
    "TB": ["Shane Baz", "Zack Littell", "Ryan Pepiot", "Taj Bradley", "Aaron Civale"],
    "TOR": ["Kevin Gausman", "Jose Berrios", "Chris Bassitt", "Yusei Kikuchi", "Bowden Francis"],
    "CWS": ["Garrett Crochet", "Erick Fedde", "Chris Flexen", "Jonathan Cannon", "Davis Martin"],
    "CLE": ["Shane Bieber", "Triston McKenzie", "Logan Allen", "Tanner Bibee", "Cal Quantrill"],
    "DET": ["Tarik Skubal", "Casey Mize", "Matt Manning", "Reese Olson", "Jack Flaherty"],
    "KC": ["Seth Lugo", "Brady Singer", "Michael Wacha", "Cole Ragans", "Jordan Lyles"],
    "MIN": ["Pablo Lopez", "Joe Ryan", "Bailey Ober", "Kenta Maeda", "Chris Paddack"],
    "HOU": ["Framber Valdez", "Cristian Javier", "Ronel Blanco", "Hunter Brown", "Justin Verlander"],
    "LAA": ["Tyler Anderson", "Patrick Sandoval", "Griffin Canning", "Jose Suarez", "Reid Detmers"],
    "OAK": ["Paul Blackburn", "JP Sears", "Mason Miller", "Mitch Spence", "Luis Medina"],
    "SEA": ["Logan Gilbert", "George Kirby", "Luis Castillo", "Bryce Miller", "Bryan Woo"],
    "TEX": ["Jacob deGrom", "Nathan Eovaldi", "Andrew Heaney", "Jon Gray", "Dane Dunning"]
  };
  
  const teams = [
    { name: "Atlanta Braves", code: "ATL" },
    { name: "Miami Marlins", code: "MIA" },
    { name: "New York Mets", code: "NYM" },
    { name: "Philadelphia Phillies", code: "PHI" },
    { name: "Washington Nationals", code: "WSH" },
    { name: "Chicago Cubs", code: "CHC" },
    { name: "Cincinnati Reds", code: "CIN" },
    { name: "Milwaukee Brewers", code: "MIL" },
    { name: "Pittsburgh Pirates", code: "PIT" },
    { name: "St. Louis Cardinals", code: "STL" },
    { name: "Arizona Diamondbacks", code: "ARI" },
    { name: "Colorado Rockies", code: "COL" },
    { name: "Los Angeles Dodgers", code: "LAD" },
    { name: "San Diego Padres", code: "SD" },
    { name: "San Francisco Giants", code: "SF" },
    { name: "Baltimore Orioles", code: "BAL" },
    { name: "Boston Red Sox", code: "BOS" },
    { name: "New York Yankees", code: "NYY" },
    { name: "Tampa Bay Rays", code: "TB" },
    { name: "Toronto Blue Jays", code: "TOR" },
    { name: "Chicago White Sox", code: "CWS" },
    { name: "Cleveland Guardians", code: "CLE" },
    { name: "Detroit Tigers", code: "DET" },
    { name: "Kansas City Royals", code: "KC" },
    { name: "Minnesota Twins", code: "MIN" },
    { name: "Houston Astros", code: "HOU" },
    { name: "Los Angeles Angels", code: "LAA" },
    { name: "Oakland Athletics", code: "OAK" },
    { name: "Seattle Mariners", code: "SEA" },
    { name: "Texas Rangers", code: "TEX" }
  ];
  
  const games = [];
  const usedTeams = new Set();
  
  for (let i = 0; i < gameCount; i++) {
    // Pick teams that haven't been used yet
    const availableTeams = teams.filter(team => !usedTeams.has(team.code));
    
    if (availableTeams.length < 2) {
      console.log(`Only ${availableTeams.length} teams available, stopping at ${i} games`);
      break; // Not enough teams for another game
    }
    
    // Use a more deterministic selection to ensure we use all available teams
    const awayIndex = (seed + i * 7) % availableTeams.length;
    const homeIndex = (seed + i * 11 + 1) % availableTeams.length;
    
    let awayTeam = availableTeams[awayIndex];
    let homeTeam = availableTeams[homeIndex === awayIndex ? (homeIndex + 1) % availableTeams.length : homeIndex];
    
    usedTeams.add(awayTeam.code);
    usedTeams.add(homeTeam.code);
    
    // Generate game time (7:00 PM - 10:00 PM ET)
    const hour = 19 + (seed + i) % 4; // 7, 8, 9, or 10 PM
    const minute = (seed + i * 7) % 4 * 15; // 0, 15, 30, or 45 minutes
    const gameTime = new Date(date);
    gameTime.setHours(hour, minute, 0, 0);
    
    const gameId = `${dateString}_${awayTeam.code} @ ${homeTeam.code}`;
    
    // Get starting pitchers for both teams
    const awayPitchers = (mlbPitchers as any)[awayTeam.code] || ["TBD"];
    const homePitchers = (mlbPitchers as any)[homeTeam.code] || ["TBD"];
    
    // Select pitcher based on date seed for consistency
    const awayPitcher = awayPitchers[(seed + i * 3) % awayPitchers.length];
    const homePitcher = homePitchers[(seed + i * 5) % homePitchers.length];
    
    // Generate realistic pitcher stats
    const awayWins = Math.floor(Math.random() * 8) + 5;
    const awayLosses = Math.floor(Math.random() * 6) + 2;
    const awayERA = (Math.random() * 2.5 + 2.8).toFixed(2);
    
    const homeWins = Math.floor(Math.random() * 8) + 5;
    const homeLosses = Math.floor(Math.random() * 6) + 2;
    const homeERA = (Math.random() * 2.5 + 2.8).toFixed(2);
    
    games.push({
      gameId,
      awayTeam: awayTeam.name,
      homeTeam: homeTeam.name,
      awayTeamCode: awayTeam.code,
      homeTeamCode: homeTeam.code,
      gameTime: gameTime.toISOString(),
      venue: `${homeTeam.name} Stadium`,
      awayPitcher: awayPitcher,
      homePitcher: homePitcher,
      awayPitcherStats: `${awayWins}-${awayLosses}, ${awayERA} ERA`,
      homePitcherStats: `${homeWins}-${homeLosses}, ${homeERA} ERA`,
      odds: {
        moneyline: { 
          away: -110 + (seed + i * 3) % 40 - 20, 
          home: -110 + (seed + i * 5) % 40 - 20 
        },
        spread: { 
          away: ((seed + i * 2) % 10 - 5) / 2, 
          home: -((seed + i * 2) % 10 - 5) / 2,
          awayOdds: -110,
          homeOdds: -110
        },
        total: { 
          line: 7.5 + ((seed + i * 4) % 6), 
          over: -110, 
          under: -110 
        }
      },
      publicPercentage: {
        moneyline: { 
          away: 45 + (seed + i * 3) % 10, 
          home: 55 - (seed + i * 3) % 10 
        },
        total: { 
          over: 52 + (seed + i * 7) % 8 - 4, 
          under: 48 - (seed + i * 7) % 8 + 4 
        }
      }
    });
  }
  
  return games;
}

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

  // Get games with odds and AI analysis for specified date
  app.get("/api/games", async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date as string || new Date().toISOString().split('T')[0];
      
      // Generate date-specific games data
      const gamesWithOdds = generateGamesForDate(targetDate);
      
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
            awayPitcher: gameData.awayPitcher,
            homePitcher: gameData.homePitcher,
            awayPitcherStats: gameData.awayPitcherStats,
            homePitcherStats: gameData.homePitcherStats,
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

      // Get games for the specified date
      const games = await storage.getAllTodaysGames();
      const filteredGames = games.filter(game => game.gameId.startsWith(targetDate));
      const gamesWithData = await Promise.all(
        filteredGames.map(async (game) => {
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

  // Get CFL games with odds
  app.get("/api/cfl/games", async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];
      console.log(`CFL Route: Query date: ${date}, Target date: ${targetDate}`);
      
      const cflGames = await fetchCFLGames(targetDate);
      console.log(`CFL Route: Got ${cflGames.length} raw CFL games from service`);
      
      // Transform CFL games to match expected format
      const formattedGames = cflGames.map(game => {
        console.log(`CFL Route: Formatting game ${game.gameId} with time ${game.gameTime}`);
        return {
          id: Math.floor(Math.random() * 1000000),
          gameId: game.gameId,
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          awayTeamCode: game.awayTeamCode,
          homeTeamCode: game.homeTeamCode,
          gameTime: game.gameTime,
          venue: game.venue,
          status: "scheduled",
          week: game.week,
          season: game.season,
          odds: [
          game.odds.moneyline && {
            id: Math.floor(Math.random() * 1000000),
            gameId: game.gameId,
            bookmaker: "consensus",
            market: "h2h",
            awayOdds: game.odds.moneyline.away,
            homeOdds: game.odds.moneyline.home
          },
          game.odds.total && {
            id: Math.floor(Math.random() * 1000000),
            gameId: game.gameId,
            bookmaker: "consensus",
            market: "totals",
            total: game.odds.total.line.toString(),
            overOdds: game.odds.total.over,
            underOdds: game.odds.total.under
          },
          game.odds.spread && {
            id: Math.floor(Math.random() * 1000000),
            gameId: game.gameId,
            bookmaker: "consensus",
            market: "spreads",
            awaySpread: game.odds.spread.away > 0 ? `+${game.odds.spread.away}` : game.odds.spread.away.toString(),
            homeSpread: game.odds.spread.home > 0 ? `+${game.odds.spread.home}` : game.odds.spread.home.toString(),
            awaySpreadOdds: game.odds.spread.awayOdds,
            homeSpreadOdds: game.odds.spread.homeOdds
          }
        ].filter(Boolean)
        };
      });

      // Filter games by target date (with timezone flexibility)
      const filteredGames = formattedGames.filter(game => {
        const gameDate = new Date(game.gameTime);
        const gameDateUTC = gameDate.toISOString().split('T')[0];
        
        // Also check local North American time zones where CFL games are played
        const gameTimeET = new Date(gameDate.getTime() - (4 * 60 * 60 * 1000)); // EDT (UTC-4)
        const gameTimeCT = new Date(gameDate.getTime() - (5 * 60 * 60 * 1000)); // CDT (UTC-5)  
        const gameTimeMT = new Date(gameDate.getTime() - (6 * 60 * 60 * 1000)); // MDT (UTC-6)
        const gameTimePT = new Date(gameDate.getTime() - (7 * 60 * 60 * 1000)); // PDT (UTC-7)
        
        const gameDateET = gameTimeET.toISOString().split('T')[0];
        const gameDateCT = gameTimeCT.toISOString().split('T')[0];
        const gameDateMT = gameTimeMT.toISOString().split('T')[0];
        const gameDatePT = gameTimePT.toISOString().split('T')[0];
        
        const matches = gameDateUTC === targetDate || 
                       gameDateET === targetDate || 
                       gameDateCT === targetDate || 
                       gameDateMT === targetDate || 
                       gameDatePT === targetDate;
        
        console.log(`CFL Filtering: Game ${game.gameId} UTC: ${gameDateUTC}, ET: ${gameDateET}, CT: ${gameDateCT}, MT: ${gameDateMT}, PT: ${gameDatePT} vs target ${targetDate} = ${matches}`);
        return matches;
      });
      
      console.log(`CFL Final: ${filteredGames.length} games after filtering from ${formattedGames.length} total`);

      res.json(filteredGames);
    } catch (error) {
      console.error("Error fetching CFL games:", error);
      res.status(500).json({ error: "Failed to fetch CFL games" });
    }
  });

  // Get CFL daily picks
  app.get("/api/cfl/daily-picks", async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];
      
      // Generate realistic CFL picks based on the games
      const cflGames = await fetchCFLGames();
      const cflPicks = cflGames.map((game, index) => ({
        id: index + 1,
        date: targetDate,
        gameId: game.gameId,
        pickType: ["moneyline", "total", "spread"][index % 3],
        selection: index % 3 === 0 ? game.awayTeam :
                  index % 3 === 1 ? `Under ${game.odds.total?.line || 50}` :
                  `${game.awayTeam} ${game.odds.spread?.away || "+3"}`,
        odds: index % 3 === 0 ? game.odds.moneyline?.away || 150 :
              index % 3 === 1 ? game.odds.total?.under || -110 :
              game.odds.spread?.awayOdds || -110,
        reasoning: generateCFLPickReasoning(game, index % 3),
        confidence: Math.floor(Math.random() * 30) + 60, // 60-90%
        expectedValue: Math.round((Math.random() * 15 + 5) * 10) / 10, // 5-20%
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        awayTeamCode: game.awayTeamCode,
        homeTeamCode: game.homeTeamCode,
        gameTime: game.gameTime,
        status: "pending" as const
      }));

      res.json(cflPicks);
    } catch (error) {
      console.error("Error fetching CFL picks:", error);
      res.status(500).json({ error: "Failed to fetch CFL picks" });
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
      // Use the same date calculation as the frontend to avoid timezone issues
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      const todayString = localDate.toISOString().split('T')[0];

      // Store picks in database
      const storedPicks = await Promise.all(aiPicks.map(pick => 
        storage.createDailyPick({
          date: todayString,
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

  // Get daily picks endpoint
  app.get("/api/daily-picks", async (req, res) => {
    try {
      const { date } = req.query;
      let targetDate = date ? String(date) : '';
      if (!targetDate) {
        const today = new Date();
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
        targetDate = localDate.toISOString().split('T')[0];
      }
      const picks = await storage.getDailyPicks(targetDate);
      res.json(picks);
    } catch (error) {
      console.error("Error fetching daily picks:", error);
      res.status(500).json({ error: "Failed to fetch daily picks" });
    }
  });

  // Helper function to calculate bet result
  function calculateBetResult(bet: any, game: any): string | null {
    if (!game.awayScore || !game.homeScore) return null;
    
    const awayScore = parseInt(game.awayScore);
    const homeScore = parseInt(game.homeScore);
    
    switch (bet.betType) {
      case 'moneyline':
        const winner = awayScore > homeScore ? 'away' : 'home';
        const selectedTeam = bet.selection.toLowerCase();
        const awayTeam = game.awayTeam?.toLowerCase() || '';
        const homeTeam = game.homeTeam?.toLowerCase() || '';
        
        if (selectedTeam.includes(awayTeam.split(' ').pop()) && winner === 'away') return 'win';
        if (selectedTeam.includes(homeTeam.split(' ').pop()) && winner === 'home') return 'win';
        return 'loss';
        
      case 'spread':
        // Parse spread from selection like "Baltimore Orioles -1.5"
        const spreadMatch = bet.selection.match(/([-+]\d+\.?\d*)/);
        if (!spreadMatch) return null;
        
        const spread = parseFloat(spreadMatch[1]);
        const selectedTeam2 = bet.selection.toLowerCase();
        const awayTeam2 = game.awayTeam?.toLowerCase() || '';
        const homeTeam2 = game.homeTeam?.toLowerCase() || '';
        
        let actualSpread;
        if (selectedTeam2.includes(awayTeam2.split(' ').pop())) {
          actualSpread = awayScore - homeScore;
        } else if (selectedTeam2.includes(homeTeam2.split(' ').pop())) {
          actualSpread = homeScore - awayScore;
        } else {
          return null;
        }
        
        if (actualSpread + spread > 0) return 'win';
        if (actualSpread + spread === 0) return 'push';
        return 'loss';
        
      case 'total':
        const totalScore = awayScore + homeScore;
        const totalMatch = bet.selection.match(/(\d+\.?\d*)/);
        if (!totalMatch) return null;
        
        const line = parseFloat(totalMatch[1]);
        const isOver = bet.selection.toLowerCase().includes('over');
        
        if (isOver) {
          if (totalScore > line) return 'win';
          if (totalScore === line) return 'push';
          return 'loss';
        } else {
          if (totalScore < line) return 'win';
          if (totalScore === line) return 'push';
          return 'loss';
        }
        
      default:
        return null;
    }
  }

  // Endpoint to resolve pending bets based on game results
  app.post("/api/resolve-bets", async (req, res) => {
    try {
      const allBets = await storage.getUserBets();
      const pendingBets = allBets.filter(bet => bet.status === "pending");
      
      let resolvedCount = 0;
      
      for (const bet of pendingBets) {
        // Try to get the game result
        const game = await storage.getGame(bet.gameId);
        
        if (game && game.status === "completed" && game.awayScore !== null && game.homeScore !== null) {
          // Calculate bet result based on bet type and selection
          const result = calculateBetResult(bet, game);
          
          if (result) {
            const actualWin = result === "win" ? 
              parseFloat(bet.potentialWin.toString()) : 
              result === "push" ? parseFloat(bet.stake.toString()) : 0;
            
            await storage.updateBetResult(bet.id, result, actualWin);
            resolvedCount++;
          }
        }
      }
      
      res.json({ message: `Resolved ${resolvedCount} bets` });
    } catch (error) {
      console.error("Error resolving bets:", error);
      res.status(500).json({ error: "Failed to resolve bets" });
    }
  });

  // Endpoint to simulate game completion with final scores for testing
  app.post("/api/simulate-game-results", async (req, res) => {
    try {
      const games = await storage.getAllTodaysGames();
      
      // Simulate final scores for a few games
      const gameUpdates = [
        { gameId: "Baltimore Orioles @ Texas Rangers", awayScore: 8, homeScore: 5 },
        { gameId: "Philadelphia Phillies @ Atlanta Braves", awayScore: 3, homeScore: 7 },
        { gameId: "Minnesota Twins @ Detroit Tigers", awayScore: 6, homeScore: 4 },
        { gameId: "Miami Marlins @ Arizona Diamondbacks", awayScore: 2, homeScore: 9 },
      ];
      
      let updatedCount = 0;
      
      for (const update of gameUpdates) {
        const game = games.find(g => g.gameId === update.gameId);
        if (game) {
          await storage.updateGame(game.gameId, {
            status: "completed",
            awayScore: update.awayScore,
            homeScore: update.homeScore
          });
          updatedCount++;
        }
      }
      
      res.json({ 
        message: `Simulated results for ${updatedCount} games`,
        games: gameUpdates
      });
    } catch (error) {
      console.error("Error simulating game results:", error);
      res.status(500).json({ error: "Failed to simulate game results" });
    }
  });

  // Reset all results for a date to allow re-reconciliation
  app.post("/api/performance/reset-results", async (req, res) => {
    try {
      const { date } = req.body;
      let targetDate = date;
      if (!targetDate) {
        const today = new Date();
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
        targetDate = localDate.toISOString().split('T')[0];
      }
      
      const dailyPicks = await storage.getDailyPicks(targetDate);
      let resetCount = 0;
      
      for (const pick of dailyPicks) {
        if (pick.result !== null) {
          await storage.updateDailyPickResult(pick.id, null);
          resetCount++;
        }
      }
      
      res.json({ 
        message: `Reset ${resetCount} pick results for ${targetDate}`,
        resetCount 
      });
    } catch (error) {
      console.error("Reset results error:", error);
      res.status(500).json({ error: "Failed to reset results" });
    }
  });

  // Generate historical results for demonstration
  app.post("/api/performance/generate-historical", async (req, res) => {
    try {
      const { days = 7 } = req.body;
      
      let generatedDays = 0;
      const today = new Date();
      
      for (let i = 1; i <= days; i++) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);
        const dateString = pastDate.toISOString().split('T')[0];
        
        // Check if we already have picks for this date
        const existingPicks = await storage.getDailyPicks(dateString);
        if (existingPicks.length > 0) continue;
        
        // Generate sample historical picks
        const samplePicks = [
          {
            date: dateString,
            gameId: `Yankees@RedSox_${dateString}`,
            pickType: "moneyline",
            selection: "New York Yankees",
            odds: -145,
            confidence: 78,
            reasoning: "Yankees starter has excellent record vs Red Sox lineup, bullpen advantage",
            expectedValue: "6.2",
            status: "completed"
          },
          {
            date: dateString,
            gameId: `Dodgers@Giants_${dateString}`,
            pickType: "total",
            selection: "Under 8.5",
            odds: -110,
            confidence: 82,
            reasoning: "Strong pitching matchup, both teams trending under recently",
            expectedValue: "4.8",
            status: "completed"
          },
          {
            date: dateString,
            gameId: `Astros@Rangers_${dateString}`,
            pickType: "spread",
            selection: "Houston Astros -1.5",
            odds: +125,
            confidence: 75,
            reasoning: "Astros offense has been dominant, Rangers struggling with injuries",
            expectedValue: "8.1",
            status: "completed"
          }
        ];
        
        // Create the picks
        for (const pick of samplePicks) {
          const createdPick = await storage.createDailyPick(pick);
          
          // Auto-reconcile with realistic results based on confidence
          const random = Math.random();
          let result = 'loss';
          
          if (random < pick.confidence / 100) {
            result = 'win';
          } else if (random < (pick.confidence / 100) + 0.05) {
            result = 'push';
          }
          
          await storage.updateDailyPickResult(createdPick.id, result);
        }
        
        generatedDays++;
      }
      
      res.json({ 
        message: `Generated historical data for ${generatedDays} days`,
        generatedDays 
      });
    } catch (error) {
      console.error("Historical generation error:", error);
      res.status(500).json({ error: "Failed to generate historical data" });
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

  // Performance Reconciliation API
  app.get("/api/performance/daily", async (req, res) => {
    try {
      const { date } = req.query;
      let targetDate = date ? String(date) : '';
      if (!targetDate) {
        // Use the same date calculation as elsewhere to avoid timezone issues
        const today = new Date();
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
        targetDate = localDate.toISOString().split('T')[0];
      }
      
      // Get daily picks for the date
      const dailyPicks = await storage.getDailyPicks(targetDate);
      
      // Get games for that date to check results
      const games = await storage.getAllTodaysGames();
      
      // Create performance summary
      const performance = {
        date: targetDate,
        totalPicks: dailyPicks.length,
        resolvedPicks: dailyPicks.filter(pick => pick.result !== null).length,
        winningPicks: dailyPicks.filter(pick => pick.result === 'win').length,
        losingPicks: dailyPicks.filter(pick => pick.result === 'loss').length,
        accuracy: 0,
        picks: dailyPicks.map(pick => {
          // Find corresponding game
          const game = games.find(g => g.gameId === pick.gameId);
          return {
            ...pick,
            game: game ? {
              awayTeam: game.awayTeam,
              homeTeam: game.homeTeam,
              gameTime: game.gameTime
            } : null
          };
        })
      };
      
      if (performance.resolvedPicks > 0) {
        performance.accuracy = (performance.winningPicks / performance.resolvedPicks) * 100;
      }
      
      res.json(performance);
    } catch (error) {
      console.error("Daily performance error:", error);
      res.status(500).json({ error: "Failed to fetch daily performance" });
    }
  });

  // MLB Real Data endpoint
  app.get("/api/mlb/games/:date", async (req, res) => {
    try {
      const { date } = req.params;
      console.log("Fetching MLB games for date:", date);
      
      // Test the API key first
      if (!process.env.RAPIDAPI_KEY) {
        console.error("RAPIDAPI_KEY not found");
        return res.status(500).json({ error: "API key not configured" });
      }
      
      const mlbGames = await fetchMLBGamesForDate(date);
      console.log("MLB games fetched:", mlbGames.length, "games");
      res.json(mlbGames);
    } catch (error: any) {
      console.error("Error fetching MLB games:", error);
      res.status(500).json({ error: "Failed to fetch MLB games", details: error.message });
    }
  });

  app.post("/api/performance/reconcile", async (req, res) => {
    try {
      const { pickId, result } = req.body;
      
      if (!pickId || !result || !['win', 'loss', 'push'].includes(result)) {
        return res.status(400).json({ error: "Invalid pick ID or result" });
      }
      
      const updatedPick = await storage.updateDailyPickResult(pickId, result);
      
      res.json(updatedPick);
    } catch (error) {
      console.error("Pick reconciliation error:", error);
      res.status(500).json({ error: "Failed to update pick result" });
    }
  });

  app.get("/api/performance/monthly", async (req, res) => {
    try {
      const { month, year } = req.query;
      const currentDate = new Date();
      const targetMonth = month ? parseInt(String(month)) : currentDate.getMonth() + 1;
      const targetYear = year ? parseInt(String(year)) : currentDate.getFullYear();
      
      // Get performance stats for the month
      const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
      const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];
      
      const performanceStats = await storage.getPerformanceStats({ start: startDate, end: endDate });
      
      res.json({
        month: targetMonth,
        year: targetYear,
        ...performanceStats
      });
    } catch (error) {
      console.error("Monthly performance error:", error);
      res.status(500).json({ error: "Failed to fetch monthly performance" });
    }
  });

  // Auto-reconcile picks using real MLB API data only
  app.post("/api/performance/auto-reconcile", async (req, res) => {
    try {
      const { date, force = false } = req.body;
      let targetDate = date;
      if (!targetDate) {
        const today = new Date();
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
        targetDate = localDate.toISOString().split('T')[0];
      }
      
      const dailyPicks = await storage.getDailyPicks(targetDate);
      
      // Only reconcile if we have real MLB game data
      const mlbGames = await fetchMLBGamesForDate(targetDate);
      if (mlbGames.length === 0) {
        return res.json({ 
          message: `No real MLB games found for ${targetDate} - no reconciliation performed`,
          reconciledCount: 0 
        });
      }
      
      let reconciledCount = 0;
      
      for (const pick of dailyPicks) {
        // Skip already reconciled picks unless force is true
        if (pick.result !== null && !force) continue;
        
        // Find corresponding MLB game
        const mlbGame = mlbGames.find(game => {
          const gameTeams = pick.gameId.toLowerCase();
          const awayTeam = game.awayTeam.toLowerCase();
          const homeTeam = game.homeTeam.toLowerCase();
          return gameTeams.includes(awayTeam.split(' ')[0]) && gameTeams.includes(homeTeam.split(' ')[0]);
        });
        
        if (mlbGame && mlbGame.isCompleted) {
          const result = getGameResult(mlbGame, pick.pickType, pick.selection);
          if (result) {
            await storage.updateDailyPickResult(pick.id, result);
            reconciledCount++;
          }
        }
      }
      
      res.json({ 
        message: `Reconciled ${reconciledCount} picks using real MLB data for ${targetDate}`,
        reconciledCount 
      });
    } catch (error) {
      console.error("Auto-reconcile error:", error);
      res.status(500).json({ error: "Failed to auto-reconcile picks" });
    }
  });

  // Admin stats endpoint
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      const totalUsers = users.length;
      const freeUsers = users.filter(u => u.subscriptionTier === 'free').length;
      const proUsers = users.filter(u => u.subscriptionTier === 'pro').length;
      const eliteUsers = users.filter(u => u.subscriptionTier === 'elite').length;
      const activeSubscriptions = users.filter(u => u.subscriptionStatus === 'active').length;
      
      // Mock revenue calculation (in real app, would fetch from Stripe)
      const totalRevenue = (proUsers * 9.99) + (eliteUsers * 19.99);

      const stats = {
        totalUsers,
        freeUsers,
        proUsers,
        eliteUsers,
        activeSubscriptions,
        totalRevenue: Math.round(totalRevenue)
      };

      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Admin users endpoint
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Return user data without passwords
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        createdAt: user.createdAt
      }));

      res.json(safeUsers);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin update tier endpoint
  app.post("/api/admin/update-tier", async (req, res) => {
    try {
      const { userId, tier } = req.body;

      if (!userId || !tier) {
        return res.status(400).json({ error: "User ID and tier are required" });
      }

      if (!['free', 'pro', 'elite'].includes(tier)) {
        return res.status(400).json({ error: "Invalid tier specified" });
      }

      const updatedUser = await storage.updateUserSubscription(userId, {
        tier,
        status: tier === 'free' ? null : 'active',
        endDate: tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });

      res.json({
        message: "User tier updated successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          subscriptionTier: updatedUser.subscriptionTier,
          subscriptionStatus: updatedUser.subscriptionStatus
        }
      });
    } catch (error) {
      console.error("Admin update tier error:", error);
      res.status(500).json({ error: "Failed to update user tier" });
    }
  });

  // Create admin user endpoint
  app.post("/api/admin/create-admin", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user with Elite tier
      const adminUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        subscriptionTier: "elite",
        subscriptionStatus: "active",
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });

      res.json({
        message: "Admin user created successfully",
        user: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          subscriptionTier: adminUser.subscriptionTier,
          subscriptionStatus: adminUser.subscriptionStatus
        }
      });
    } catch (error) {
      console.error("Create admin user error:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  // Odds comparison endpoint for Pro tier
  app.get("/api/odds-comparison", async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];
      
      // Mock odds comparison data for multiple sportsbooks
      const games = await storage.getAllTodaysGames();
      
      const oddsComparison = games.map(game => {
        const bookmakers = [
          {
            name: "DraftKings",
            moneyline: { away: -115, home: 105 },
            spread: { away: -110, home: -110, line: 1.5 },
            total: { over: -115, under: -105, line: 9.5 },
            bestLines: {
              moneylineAway: true,  // Best line for away ML
              moneylineHome: false,
              spreadAway: false,
              spreadHome: true,     // Best line for home spread
              totalOver: false,
              totalUnder: true      // Best line for under
            }
          },
          {
            name: "FanDuel",
            moneyline: { away: -120, home: 110 },
            spread: { away: -105, home: -115, line: 1.5 },
            total: { over: -110, under: -110, line: 9.5 },
            bestLines: {
              moneylineAway: false,
              moneylineHome: true,  // Best line for home ML
              spreadAway: true,     // Best line for away spread
              spreadHome: false,
              totalOver: true,      // Best line for over
              totalUnder: false
            }
          },
          {
            name: "BetMGM",
            moneyline: { away: -118, home: 108 },
            spread: { away: -108, home: -112, line: 1.5 },
            total: { over: -112, under: -108, line: 9.5 },
            bestLines: {
              moneylineAway: false,
              moneylineHome: false,
              spreadAway: false,
              spreadHome: false,
              totalOver: false,
              totalUnder: false
            }
          },
          {
            name: "Caesars",
            moneyline: { away: -116, home: 106 },
            spread: { away: -115, home: -105, line: 1.5 },
            total: { over: -118, under: -102, line: 9.5 },
            bestLines: {
              moneylineAway: false,
              moneylineHome: false,
              spreadAway: false,
              spreadHome: false,
              totalOver: false,
              totalUnder: false
            }
          }
        ];

        return {
          gameId: game.gameId,
          awayTeam: game.awayTeam,
          homeTeam: game.homeTeam,
          gameTime: game.gameTime,
          venue: game.venue,
          bookmakers
        };
      });

      res.json(oddsComparison);
    } catch (error) {
      console.error("Odds comparison error:", error);
      res.status(500).json({ error: "Failed to fetch odds comparison" });
    }
  });

  // Prop Finder endpoint for Elite tier
  app.get("/api/prop-finder", async (req, res) => {
    try {
      const { category, propType, minEV, positiveEVOnly } = req.query;
      
      // Generate mock prop betting data with realistic player names and statistics
      const mockProps = [
        {
          id: "prop_1",
          gameId: "LAD@SF",
          awayTeam: "Los Angeles Dodgers",
          homeTeam: "San Francisco Giants", 
          playerName: "Mookie Betts",
          position: "RF",
          category: "batting",
          propType: "hits",
          line: 1.5,
          overOdds: -115,
          underOdds: -105,
          expectedValue: 12.3,
          impliedProb: 53.5,
          projectedProb: 65.8,
          confidence: 85,
          lastGames: "2-1-3-1-2",
          seasonAvg: 1.8,
          vsOpponent: 2.1,
          weather: "Clear, 75°F",
          venue: "Oracle Park",
          gameTime: "2025-06-30T19:10:00Z"
        },
        {
          id: "prop_2", 
          gameId: "HOU@SEA",
          awayTeam: "Houston Astros",
          homeTeam: "Seattle Mariners",
          playerName: "Framber Valdez",
          position: "P",
          category: "pitching",
          propType: "strikeouts",
          line: 6.5,
          overOdds: 110,
          underOdds: -130,
          expectedValue: 8.7,
          impliedProb: 56.5,
          projectedProb: 65.2,
          confidence: 78,
          lastGames: "7-8-5-9-6",
          seasonAvg: 7.2,
          vsOpponent: 8.1,
          weather: "Partly cloudy, 68°F",
          venue: "T-Mobile Park",
          gameTime: "2025-06-30T22:10:00Z"
        },
        {
          id: "prop_3",
          gameId: "NYY@BOS", 
          awayTeam: "New York Yankees",
          homeTeam: "Boston Red Sox",
          playerName: "Rafael Devers",
          position: "3B",
          category: "batting",
          propType: "home_runs",
          line: 0.5,
          overOdds: 265,
          underOdds: -350,
          expectedValue: 15.2,
          impliedProb: 27.4,
          projectedProb: 42.6,
          confidence: 72,
          lastGames: "1-0-1-0-0",
          seasonAvg: 0.8,
          vsOpponent: 1.2,
          weather: "Clear, 72°F",
          venue: "Fenway Park",
          gameTime: "2025-06-30T19:10:00Z"
        },
        {
          id: "prop_4",
          gameId: "ATL@MIA",
          awayTeam: "Atlanta Braves", 
          homeTeam: "Miami Marlins",
          playerName: "Ronald Acuña Jr.",
          position: "OF",
          category: "batting",
          propType: "stolen_bases",
          line: 0.5,
          overOdds: 180,
          underOdds: -220,
          expectedValue: 6.8,
          impliedProb: 35.7,
          projectedProb: 42.5,
          confidence: 68,
          lastGames: "1-0-1-1-0",
          seasonAvg: 0.6,
          vsOpponent: 0.8,
          weather: "Humid, 82°F",
          venue: "loanDepot park", 
          gameTime: "2025-06-30T19:10:00Z"
        },
        {
          id: "prop_5",
          gameId: "SD@COL",
          awayTeam: "San Diego Padres",
          homeTeam: "Colorado Rockies",
          playerName: "Manny Machado",
          position: "3B",
          category: "batting", 
          propType: "rbis",
          line: 1.5,
          overOdds: 125,
          underOdds: -145,
          expectedValue: 4.3,
          impliedProb: 59.2,
          projectedProb: 63.5,
          confidence: 61,
          lastGames: "2-1-0-3-1",
          seasonAvg: 1.4,
          vsOpponent: 1.7,
          weather: "Clear, 78°F",
          venue: "Coors Field",
          gameTime: "2025-06-30T20:40:00Z"
        }
      ];

      // Apply filters
      let filteredProps = mockProps;

      if (category && category !== 'all') {
        filteredProps = filteredProps.filter(prop => prop.category === category);
      }

      if (propType && propType !== 'all') {
        filteredProps = filteredProps.filter(prop => prop.propType === propType);
      }

      if (positiveEVOnly === 'true') {
        filteredProps = filteredProps.filter(prop => prop.expectedValue > 0);
      }

      if (minEV) {
        filteredProps = filteredProps.filter(prop => prop.expectedValue >= parseFloat(String(minEV)));
      }

      res.json(filteredProps);
    } catch (error) {
      console.error("Prop finder error:", error);
      res.status(500).json({ error: "Failed to fetch prop bets" });
    }
  });

  // Hot Trends endpoint for Elite tier
  app.get("/api/hot-trends", async (req, res) => {
    try {
      const { category } = req.query;
      
      // Generate mock hot trends data with realistic MLB patterns
      const mockTrends = [
        {
          id: "trend_1",
          title: "Rockies Home Overs",
          description: "Colorado Rockies home games consistently hitting the over at Coors Field",
          percentage: 73,
          games: 32,
          category: "venue",
          trend: "hot",
          confidence: 87,
          roi: 18.5,
          examples: [
            "COL vs LAD - Over 11.5 ✓ (Final: 8-6)",
            "COL vs SD - Over 10.5 ✓ (Final: 9-7)", 
            "COL vs ARI - Over 12 ✓ (Final: 10-8)"
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: "trend_2", 
          title: "Astros Road Favorites",
          description: "Houston Astros as road favorites covering the run line consistently",
          percentage: 68,
          games: 28,
          category: "team",
          trend: "hot",
          confidence: 82,
          roi: 14.2,
          examples: [
            "HOU -1.5 @ SEA ✓ (Won 7-3)",
            "HOU -1.5 @ LAA ✓ (Won 8-4)",
            "HOU -1.5 @ TEX ✓ (Won 6-2)"
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: "trend_3",
          title: "White Sox Under Streak", 
          description: "Chicago White Sox games trending heavily under the total",
          percentage: 71,
          games: 24,
          category: "total",
          trend: "hot",
          confidence: 79,
          roi: 12.8,
          examples: [
            "CWS vs DET - Under 9 ✓ (Final: 4-2)",
            "CWS @ KC - Under 8.5 ✓ (Final: 3-1)",
            "CWS vs MIN - Under 9.5 ✓ (Final: 5-3)"
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: "trend_4",
          title: "Rain Game Unders",
          description: "Games with 30%+ rain probability hitting under at high rate",
          percentage: 69,
          games: 18,
          category: "weather", 
          trend: "hot",
          confidence: 75,
          roi: 11.3,
          examples: [
            "NYY @ BOS - Under 9.5 ✓ (Rain delay, Final: 4-1)",
            "PHI @ WAS - Under 10 ✓ (Drizzle throughout)",
            "MIL @ CHC - Under 8.5 ✓ (Postponed, makeup under)"
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: "trend_5",
          title: "Brewers First 5 Overs",
          description: "Milwaukee Brewers first 5 innings consistently high scoring",
          percentage: 64,
          games: 21,
          category: "team",
          trend: "hot", 
          confidence: 71,
          roi: 9.7,
          examples: [
            "MIL F5 Over 4.5 vs STL ✓ (5-2 after 5)",
            "MIL F5 Over 5 @ CIN ✓ (6-1 after 5)",
            "MIL F5 Over 4.5 vs PIT ✓ (4-3 after 5)"
          ],
          lastUpdated: new Date().toISOString()
        },
        {
          id: "trend_6",
          title: "Yankees Losing Streak ATS",
          description: "New York Yankees failing to cover as favorites during recent slump",
          percentage: 29,
          games: 14,
          category: "streak",
          trend: "cold",
          confidence: 68,
          roi: -8.4,
          examples: [
            "NYY -1.5 vs BOS ✗ (Won 5-4)",
            "NYY -2.5 @ TB ✗ (Lost 6-3)",
            "NYY -1.5 vs TOR ✗ (Won 4-3)"
          ],
          lastUpdated: new Date().toISOString()
        }
      ];

      // Apply category filter
      let filteredTrends = mockTrends;
      if (category && category !== 'all') {
        filteredTrends = mockTrends.filter(trend => trend.category === category);
      }

      res.json(filteredTrends);
    } catch (error) {
      console.error("Hot trends error:", error);
      res.status(500).json({ error: "Failed to fetch hot trends" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
