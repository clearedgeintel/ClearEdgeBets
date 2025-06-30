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
    moneyline?: { away: number; home: number };
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
  const apiKey = process.env.ODDS_API_KEY || process.env.THE_ODDS_API_KEY || "";
  
  if (!apiKey) {
    console.error("No odds API key provided");
    return [];
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Odds API request failed: ${response.status} ${response.statusText}`);
    }

    const games: OddsApiGame[] = await response.json();
    
    return games.map(game => processGameData(game)).filter(Boolean);
  } catch (error) {
    console.error("Error fetching odds data:", error);
    return [];
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

    return {
      gameId: game.id,
      awayTeam: game.away_team,
      homeTeam: game.home_team,
      awayTeamCode,
      homeTeamCode,
      gameTime: game.commence_time, // Keep as ISO string for proper date parsing
      venue: `${game.home_team} Stadium`, // Placeholder - API doesn't provide venue
      odds,
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
