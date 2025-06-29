export interface CFLGame {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
  gameTime: string;
  venue: string;
  week: number;
  season: string;
  odds: {
    moneyline?: { away: number; home: number };
    spread?: { away: number; home: number; awayOdds: number; homeOdds: number };
    total?: { line: number; over: number; under: number };
  };
}

// CFL Team data
const CFL_TEAMS = {
  // West Division
  'BC': { name: 'BC Lions', city: 'Vancouver', venue: 'BC Place' },
  'CGY': { name: 'Calgary Stampeders', city: 'Calgary', venue: 'McMahon Stadium' },
  'EDM': { name: 'Edmonton Elks', city: 'Edmonton', venue: 'Commonwealth Stadium' },
  'SSK': { name: 'Saskatchewan Roughriders', city: 'Regina', venue: 'Mosaic Stadium' },
  'WPG': { name: 'Winnipeg Blue Bombers', city: 'Winnipeg', venue: 'Princess Auto Stadium' },
  
  // East Division
  'HAM': { name: 'Hamilton Tiger-Cats', city: 'Hamilton', venue: 'Tim Hortons Field' },
  'TOR': { name: 'Toronto Argonauts', city: 'Toronto', venue: 'BMO Field' },
  'OTT': { name: 'Ottawa REDBLACKS', city: 'Ottawa', venue: 'TD Place Stadium' },
  'MTL': { name: 'Montreal Alouettes', city: 'Montreal', venue: 'Percival Molson Memorial Stadium' }
};

// Generate realistic CFL schedule for current season
function generateCFLSchedule() {
  const games: CFLGame[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Generate games for a 30-day period to demonstrate date filtering
  const gameSchedule = [];
  
  // Define all CFL teams for rotation
  const teams = [
    { code: 'OTT', name: 'Ottawa REDBLACKS', venue: 'TD Place Stadium' },
    { code: 'SSK', name: 'Saskatchewan Roughriders', venue: 'Mosaic Stadium' },
    { code: 'TOR', name: 'Toronto Argonauts', venue: 'BMO Field' },
    { code: 'MTL', name: 'Montreal Alouettes', venue: 'Percival Molson Memorial Stadium' },
    { code: 'HAM', name: 'Hamilton Tiger-Cats', venue: 'Tim Hortons Field' },
    { code: 'CGY', name: 'Calgary Stampeders', venue: 'McMahon Stadium' },
    { code: 'EDM', name: 'Edmonton Elks', venue: 'The Brick Field at Commonwealth Stadium' },
    { code: 'BC', name: 'BC Lions', venue: 'BC Place' },
    { code: 'WPG', name: 'Winnipeg Blue Bombers', venue: 'Princess Auto Stadium' }
  ];
  
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const gameDate = new Date(today);
    gameDate.setDate(today.getDate() + dayOffset);
    const dateStr = gameDate.toISOString();
    
    // Generate 1-3 games per day based on day of week (more on weekends)
    const isWeekend = gameDate.getDay() === 0 || gameDate.getDay() === 6;
    const numGames = isWeekend ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 2) + 1; // 2-3 on weekends, 1-2 on weekdays
    
    for (let gameNum = 0; gameNum < numGames; gameNum++) {
      // Use day offset and game number to create unique team pairings
      const awayIndex = (dayOffset * 2 + gameNum) % teams.length;
      const homeIndex = (dayOffset * 2 + gameNum + 4) % teams.length;
      
      if (awayIndex !== homeIndex) { // Ensure teams don't play themselves
        const awayTeam = teams[awayIndex];
        const homeTeam = teams[homeIndex];
        
        gameSchedule.push({
          gameId: `cfl_${currentYear}_d${dayOffset}_g${gameNum + 1}`,
          awayTeam: awayTeam.name,
          homeTeam: homeTeam.name,
          awayTeamCode: awayTeam.code,
          homeTeamCode: homeTeam.code,
          gameTime: dateStr,
          venue: homeTeam.venue,
          week: Math.floor(dayOffset / 7) + 1,
          season: currentYear.toString()
        });
      }
    }
  }

  const upcomingGames = gameSchedule;

  // Add realistic odds to each game
  upcomingGames.forEach((game, index) => {
    const gameWithOdds: CFLGame = {
      ...game,
      odds: generateRealisticCFLOdds(game.awayTeamCode, game.homeTeamCode)
    };
    games.push(gameWithOdds);
  });

  return games;
}

function generateRealisticCFLOdds(awayTeam: string, homeTeam: string) {
  // Team strength ratings (higher = better)
  const teamStrengths = {
    'WPG': 90, // Blue Bombers - defending champions
    'CGY': 85, // Stampeders - consistently strong
    'TOR': 82, // Argonauts - recent Grey Cup winners
    'MTL': 80, // Alouettes - solid team
    'BC': 78,  // Lions - competitive
    'SSK': 76, // Roughriders - home field advantage
    'HAM': 74, // Tiger-Cats - rebuilding
    'OTT': 72, // REDBLACKS - improving
    'EDM': 70  // Elks - recent struggles
  };

  const awayStrength = teamStrengths[awayTeam as keyof typeof teamStrengths] || 75;
  const homeStrength = teamStrengths[homeTeam as keyof typeof teamStrengths] || 75;
  
  // Home field advantage (typically 3-4 points in CFL)
  const homeAdvantage = 3.5;
  const adjustedHomeStrength = homeStrength + homeAdvantage;
  
  // Calculate spread
  const rawSpread = adjustedHomeStrength - awayStrength;
  const spread = Math.round(rawSpread * 2) / 2; // Round to nearest 0.5
  
  // Generate moneyline odds based on spread
  const favoriteOdds = spread > 0 ? 
    Math.max(-300, Math.round(-110 - (Math.abs(spread) * 15))) :
    Math.min(300, Math.round(110 + (Math.abs(spread) * 15)));
  
  const underdogOdds = spread > 0 ?
    Math.min(300, Math.round(110 + (Math.abs(spread) * 15))) :
    Math.max(-300, Math.round(-110 - (Math.abs(spread) * 15)));

  // Generate total (CFL games typically 45-55 points)
  const baseTotal = 49.5;
  const totalVariation = (Math.random() - 0.5) * 8; // ±4 points
  const total = Math.round((baseTotal + totalVariation) * 2) / 2; // Round to nearest 0.5

  return {
    moneyline: {
      away: spread > 0 ? underdogOdds : favoriteOdds,
      home: spread > 0 ? favoriteOdds : underdogOdds
    },
    spread: {
      away: spread,
      home: -spread,
      awayOdds: -110,
      homeOdds: -110
    },
    total: {
      line: total,
      over: -110,
      under: -110
    }
  };
}

export async function fetchCFLGames(): Promise<CFLGame[]> {
  // In production, this would fetch from a real CFL API
  // For now, return realistic schedule data
  return generateCFLSchedule();
}

export function generateMockCFLPublicPercentage() {
  return {
    moneyline: {
      away: Math.floor(Math.random() * 40) + 30, // 30-70%
      home: Math.floor(Math.random() * 40) + 30  // 30-70%
    },
    total: {
      over: Math.floor(Math.random() * 20) + 40, // 40-60%
      under: Math.floor(Math.random() * 20) + 40 // 40-60%
    }
  };
}