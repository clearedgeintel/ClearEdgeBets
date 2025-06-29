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
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // CFL season runs June-October, but for demo purposes, show some upcoming games
  const upcomingGames = [
    // Week 1 - Season opener and key matchups
    {
      gameId: 'cfl_2025_w1_g1',
      awayTeam: 'Ottawa REDBLACKS',
      homeTeam: 'Saskatchewan Roughriders',
      awayTeamCode: 'OTT',
      homeTeamCode: 'SSK',
      gameTime: 'June 5, 2025 at 9:00 PM ET',
      venue: 'Mosaic Stadium',
      week: 1,
      season: '2025'
    },
    {
      gameId: 'cfl_2025_w1_g2',
      awayTeam: 'Toronto Argonauts',
      homeTeam: 'Montreal Alouettes',
      awayTeamCode: 'TOR',
      homeTeamCode: 'MTL',
      gameTime: 'June 6, 2025 at 7:30 PM ET',
      venue: 'Percival Molson Memorial Stadium',
      week: 1,
      season: '2025'
    },
    {
      gameId: 'cfl_2025_w1_g3',
      awayTeam: 'Hamilton Tiger-Cats',
      homeTeam: 'Calgary Stampeders',
      awayTeamCode: 'HAM',
      homeTeamCode: 'CGY',
      gameTime: 'June 7, 2025 at 7:00 PM MT',
      venue: 'McMahon Stadium',
      week: 1,
      season: '2025'
    },
    {
      gameId: 'cfl_2025_w1_g4',
      awayTeam: 'Edmonton Elks',
      homeTeam: 'BC Lions',
      awayTeamCode: 'EDM',
      homeTeamCode: 'BC',
      gameTime: 'June 7, 2025 at 10:00 PM ET',
      venue: 'BC Place',
      week: 1,
      season: '2025'
    },
    // Week 2 games
    {
      gameId: 'cfl_2025_w2_g1',
      awayTeam: 'BC Lions',
      homeTeam: 'Winnipeg Blue Bombers',
      awayTeamCode: 'BC',
      homeTeamCode: 'WPG',
      gameTime: 'June 12, 2025 at 8:30 PM ET',
      venue: 'Princess Auto Stadium',
      week: 2,
      season: '2025'
    },
    {
      gameId: 'cfl_2025_w2_g2',
      awayTeam: 'Montreal Alouettes',
      homeTeam: 'Ottawa REDBLACKS',
      awayTeamCode: 'MTL',
      homeTeamCode: 'OTT',
      gameTime: 'June 13, 2025 at 7:30 PM ET',
      venue: 'TD Place Stadium',
      week: 2,
      season: '2025'
    },
    {
      gameId: 'cfl_2025_w2_g3',
      awayTeam: 'Calgary Stampeders',
      homeTeam: 'Toronto Argonauts',
      awayTeamCode: 'CGY',
      homeTeamCode: 'TOR',
      gameTime: 'June 14, 2025 at 4:00 PM ET',
      venue: 'BMO Field',
      week: 2,
      season: '2025'
    },
    {
      gameId: 'cfl_2025_w2_g4',
      awayTeam: 'Saskatchewan Roughriders',
      homeTeam: 'Hamilton Tiger-Cats',
      awayTeamCode: 'SSK',
      homeTeamCode: 'HAM',
      gameTime: 'June 14, 2025 at 7:00 PM ET',
      venue: 'Tim Hortons Field',
      week: 2,
      season: '2025'
    }
  ];

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