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
  
  // Generate games for the next 7 days to demonstrate date filtering
  const gameSchedule = [];
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const gameDate = new Date(today);
    gameDate.setDate(today.getDate() + dayOffset);
    const dateStr = gameDate.toISOString();
    
    // Add 1-2 games per day
    if (dayOffset === 0) { // Today - multiple games
      gameSchedule.push(
        {
          gameId: `cfl_${currentYear}_today_g1`,
          awayTeam: 'Ottawa REDBLACKS',
          homeTeam: 'Saskatchewan Roughriders',
          awayTeamCode: 'OTT',
          homeTeamCode: 'SSK',
          gameTime: dateStr,
          venue: 'Mosaic Stadium',
          week: 1,
          season: currentYear.toString()
        },
        {
          gameId: `cfl_${currentYear}_today_g2`,
          awayTeam: 'Toronto Argonauts',
          homeTeam: 'Montreal Alouettes',
          awayTeamCode: 'TOR',
          homeTeamCode: 'MTL',
          gameTime: dateStr,
          venue: 'Percival Molson Memorial Stadium',
          week: 1,
          season: currentYear.toString()
        }
      );
    } else if (dayOffset === 1) { // Tomorrow
      gameSchedule.push({
        gameId: `cfl_${currentYear}_d${dayOffset}_g1`,
        awayTeam: 'Hamilton Tiger-Cats',
        homeTeam: 'Calgary Stampeders',
        awayTeamCode: 'HAM',
        homeTeamCode: 'CGY',
        gameTime: dateStr,
        venue: 'McMahon Stadium',
        week: 1,
        season: currentYear.toString()
      });
    } else if (dayOffset === 2) { // Day after tomorrow
      gameSchedule.push({
        gameId: `cfl_${currentYear}_d${dayOffset}_g1`,
        awayTeam: 'Edmonton Elks',
        homeTeam: 'BC Lions',
        awayTeamCode: 'EDM',
        homeTeamCode: 'BC',
        gameTime: dateStr,
        venue: 'BC Place',
        week: 1,
        season: currentYear.toString()
      });
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