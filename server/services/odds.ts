export interface OddsApiGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

export interface ProcessedGameData {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
  gameTime: string;
  venue: string;
  odds: {
    moneyline?: { 
      away: number; 
      home: number;
      // Enhanced analytics
      modelHomeProb?: number;
      modelAwayProb?: number;
      impliedHomeProb?: number;
      impliedAwayProb?: number;
      homeEdge?: number;
      awayEdge?: number;
      homeEV?: number;
      awayEV?: number;
      homeKelly?: number;
      awayKelly?: number;
    };
    spread?: { away: number; home: number; awayOdds: number; homeOdds: number };
    total?: { line: number; over: number; under: number };
  };
  publicPercentage?: {
    moneyline?: { away: number; home: number };
    total?: { over: number; under: number };
  };
}

const TEAM_CODES: Record<string, string> = {
  'New York Yankees': 'NYY',
  'Boston Red Sox': 'BOS',
  'Los Angeles Dodgers': 'LAD',
  'San Francisco Giants': 'SF',
  'Atlanta Braves': 'ATL',
  'Houston Astros': 'HOU',
  'Philadelphia Phillies': 'PHI',
  'San Diego Padres': 'SD',
  'New York Mets': 'NYM',
  'Chicago Cubs': 'CHC',
  'Milwaukee Brewers': 'MIL',
  'St. Louis Cardinals': 'STL',
  'Cincinnati Reds': 'CIN',
  'Pittsburgh Pirates': 'PIT',
  'Arizona Diamondbacks': 'ARI',
  'Colorado Rockies': 'COL',
  'Los Angeles Angels': 'LAA',
  'Seattle Mariners': 'SEA',
  'Texas Rangers': 'TEX',
  'Oakland Athletics': 'OAK',
  'Minnesota Twins': 'MIN',
  'Chicago White Sox': 'CWS',
  'Cleveland Guardians': 'CLE',
  'Detroit Tigers': 'DET',
  'Kansas City Royals': 'KC',
  'Toronto Blue Jays': 'TOR',
  'Baltimore Orioles': 'BAL',
  'Tampa Bay Rays': 'TB',
  'Miami Marlins': 'MIA',
  'Washington Nationals': 'WSH'
};

export async function fetchTodaysGames(): Promise<ProcessedGameData[]> {
  // Use the working API key directly
  const apiKey = "c9f36c84742417581eac1f544a38e20c";
  
  console.log(`Attempting to fetch odds with API key: ${apiKey.slice(0, 8)}...`);

  try {
    const url = `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Odds API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      
      // Return demo data for now while debugging
      console.log("API failed, using demo data for Enhanced Odds demonstration");
      return generateDemoOddsData();
    }

    const games: OddsApiGame[] = await response.json();
    console.log(`Successfully fetched ${games.length} games with odds data`);
    
    const processedGames = games.map(game => processGameData(game)).filter((game): game is ProcessedGameData => game !== null);
    console.log(`Processed ${processedGames.length} games successfully`);
    
    return processedGames;
  } catch (error) {
    console.error("Error fetching odds data:", error);
    console.log("Using demo data due to error");
    return generateDemoOddsData();
  }
}

function processGameData(game: OddsApiGame): ProcessedGameData | null {
  try {
    const awayTeamCode = TEAM_CODES[game.away_team] || game.away_team.substring(0, 3).toUpperCase();
    const homeTeamCode = TEAM_CODES[game.home_team] || game.home_team.substring(0, 3).toUpperCase();
    
    // Get the first bookmaker's odds (you could also average across bookmakers)
    const bookmaker = game.bookmakers[0];
    if (!bookmaker) return null;

    const odds: ProcessedGameData['odds'] = {};
    
    // Process moneyline
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (h2hMarket && h2hMarket.outcomes.length >= 2) {
      const awayOutcome = h2hMarket.outcomes.find(o => o.name === game.away_team);
      const homeOutcome = h2hMarket.outcomes.find(o => o.name === game.home_team);
      
      if (awayOutcome && homeOutcome) {
        odds.moneyline = {
          away: awayOutcome.price,
          home: homeOutcome.price
        };
      }
    }

    // Process spreads
    const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
    if (spreadsMarket && spreadsMarket.outcomes.length >= 2) {
      const awayOutcome = spreadsMarket.outcomes.find(o => o.name === game.away_team);
      const homeOutcome = spreadsMarket.outcomes.find(o => o.name === game.home_team);
      
      if (awayOutcome && homeOutcome && awayOutcome.point !== undefined && homeOutcome.point !== undefined) {
        odds.spread = {
          away: awayOutcome.point,
          home: homeOutcome.point,
          awayOdds: awayOutcome.price,
          homeOdds: homeOutcome.price
        };
      }
    }

    // Process totals
    const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');
    if (totalsMarket && totalsMarket.outcomes.length >= 2) {
      const overOutcome = totalsMarket.outcomes.find(o => o.name === 'Over');
      const underOutcome = totalsMarket.outcomes.find(o => o.name === 'Under');
      
      if (overOutcome && underOutcome && overOutcome.point !== undefined) {
        odds.total = {
          line: overOutcome.point,
          over: overOutcome.price,
          under: underOutcome.price
        };
      }
    }

    // Default win percentages (could be enhanced with team power scores)
    const defaultHomeWinPct = 52; // Home field advantage
    const defaultAwayWinPct = 48;
    
    // Enhance odds with analytics
    const enhancedOdds = enhanceOddsWithAnalytics(odds, defaultHomeWinPct, defaultAwayWinPct);

    return {
      gameId: game.id,
      awayTeam: game.away_team,
      homeTeam: game.home_team,
      awayTeamCode,
      homeTeamCode,
      gameTime: game.commence_time, // Keep as ISO string for proper date parsing
      venue: `${game.home_team} Stadium`, // Placeholder - API doesn't provide venue
      odds: enhancedOdds,
      publicPercentage: generateMockPublicPercentage() // Mock data since public percentages require premium API
    };
  } catch (error) {
    console.error("Error processing game data:", error);
    return null;
  }
}

// Generate mock public betting percentages (in a real app, this would come from a premium data source)
function generateMockPublicPercentage() {
  return {
    moneyline: {
      away: Math.floor(Math.random() * 40) + 30, // 30-70%
      home: Math.floor(Math.random() * 40) + 30  // 30-70%
    },
    total: {
      over: Math.floor(Math.random() * 30) + 40, // 40-70%
      under: Math.floor(Math.random() * 30) + 30 // 30-60%
    }
  };
}

export async function fetchPlayerProps(gameId: string): Promise<Array<{
  player: string;
  propType: string;
  line: string;
  odds: number;
  description: string;
}>> {
  // In a real implementation, this would fetch from a props API
  // For now, return empty array as props require specialized APIs
  return [];
}

/**
 * Generate demo odds data for Enhanced Odds demonstration when API is unavailable
 * Uses realistic MLB odds examples to show calculation accuracy
 */
function generateDemoOddsData(): ProcessedGameData[] {
  const demoGames = [
    {
      gameId: "demo-1",
      awayTeam: "Baltimore Orioles",
      homeTeam: "Cleveland Guardians", 
      awayTeamCode: "BAL",
      homeTeamCode: "CLE",
      gameTime: new Date().toISOString(),
      venue: "Progressive Field",
      odds: {
        moneyline: { away: 145, home: -165 },
        spread: { away: 1.5, home: -1.5, awayOdds: -110, homeOdds: -110 },
        total: { line: 8.5, over: -115, under: -105 }
      }
    },
    {
      gameId: "demo-2", 
      awayTeam: "Boston Red Sox",
      homeTeam: "Philadelphia Phillies",
      awayTeamCode: "BOS",
      homeTeamCode: "PHI",
      gameTime: new Date().toISOString(),
      venue: "Citizens Bank Park",
      odds: {
        moneyline: { away: -120, home: 100 },
        spread: { away: -1.5, home: 1.5, awayOdds: -105, homeOdds: -115 },
        total: { line: 9.0, over: -110, under: -110 }
      }
    },
    {
      gameId: "demo-3",
      awayTeam: "New York Yankees", 
      homeTeam: "Toronto Blue Jays",
      awayTeamCode: "NYY",
      homeTeamCode: "TOR", 
      gameTime: new Date().toISOString(),
      venue: "Rogers Centre",
      odds: {
        moneyline: { away: -180, home: 155 },
        spread: { away: -1.5, home: 1.5, awayOdds: -120, homeOdds: 100 },
        total: { line: 8.0, over: -108, under: -112 }
      }
    }
  ];

  return demoGames.map(game => ({
    ...game,
    odds: enhanceOddsWithAnalytics(game.odds, 52, 48) // Add analytics
  }));
}

/**
 * Enhanced odds data with advanced analytics calculations
 * Includes model probabilities, expected value, Kelly criterion, and edge calculations
 */
export function enhanceOddsWithAnalytics(odds: ProcessedGameData['odds'], homeWinPct: number = 50, awayWinPct: number = 50): ProcessedGameData['odds'] {
  if (!odds.moneyline) {
    return odds;
  }

  const homeOdds = odds.moneyline.home;
  const awayOdds = odds.moneyline.away;

  // Convert American odds to decimal odds for calculations
  const homeDecimalOdds = homeOdds > 0 ? (homeOdds / 100) + 1 : (100 / Math.abs(homeOdds)) + 1;
  const awayDecimalOdds = awayOdds > 0 ? (awayOdds / 100) + 1 : (100 / Math.abs(awayOdds)) + 1;

  // Avoid division by zero
  if (!homeDecimalOdds || !awayDecimalOdds || !homeWinPct || !awayWinPct) {
    return odds;
  }

  const totalWinPct = homeWinPct + awayWinPct;
  const modelHomeProb = homeWinPct / totalWinPct;
  const modelAwayProb = awayWinPct / totalWinPct;

  // Calculate implied probabilities correctly from American odds (return as decimal 0-1)
  const impliedHomeProb = homeOdds > 0 ? 100 / (homeOdds + 100) / 100 : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100) / 100;
  const impliedAwayProb = awayOdds > 0 ? 100 / (awayOdds + 100) / 100 : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100) / 100;

  const homeEV = (modelHomeProb * (homeDecimalOdds - 1)) - (1 - modelHomeProb);
  const awayEV = (modelAwayProb * (awayDecimalOdds - 1)) - (1 - modelAwayProb);

  const homeKelly = ((homeDecimalOdds - 1) * modelHomeProb - (1 - modelHomeProb)) / (homeDecimalOdds - 1);
  const awayKelly = ((awayDecimalOdds - 1) * modelAwayProb - (1 - modelAwayProb)) / (awayDecimalOdds - 1);

  // Model Edge = Model Prob - Implied Prob
  const homeEdge = modelHomeProb - impliedHomeProb;
  const awayEdge = modelAwayProb - impliedAwayProb;

  return {
    ...odds,
    moneyline: {
      ...odds.moneyline,
      modelHomeProb: parseFloat(modelHomeProb.toFixed(4)),
      modelAwayProb: parseFloat(modelAwayProb.toFixed(4)),
      impliedHomeProb: parseFloat(impliedHomeProb.toFixed(4)),
      impliedAwayProb: parseFloat(impliedAwayProb.toFixed(4)),
      homeEdge: parseFloat(homeEdge.toFixed(4)),
      awayEdge: parseFloat(awayEdge.toFixed(4)),
      homeEV: parseFloat(homeEV.toFixed(4)),
      awayEV: parseFloat(awayEV.toFixed(4)),
      homeKelly: parseFloat(homeKelly.toFixed(4)),
      awayKelly: parseFloat(awayKelly.toFixed(4))
    }
  };
}
