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

// Generate realistic CFL schedule for 2025 season
function generateCFLSchedule() {
  const games: CFLGame[] = [];
  const today = new Date();
  
  // 2025 CFL Season: June 5 - October 25, 21 weeks, 18 games per team
  const seasonStart = new Date('2025-06-05');
  const seasonEnd = new Date('2025-10-25');
  
  // Check if we're in season
  if (today < seasonStart || today > seasonEnd) {
    return games; // Return empty if out of season
  }
  
  // Define all 9 CFL teams with accurate venue names
  const teams = [
    { code: 'OTT', name: 'Ottawa REDBLACKS', venue: 'TD Place Stadium' },
    { code: 'SSK', name: 'Saskatchewan Roughriders', venue: 'Mosaic Stadium' },
    { code: 'TOR', name: 'Toronto Argonauts', venue: 'BMO Field' },
    { code: 'MTL', name: 'Montreal Alouettes', venue: 'Percival Molson Memorial Stadium' },
    { code: 'HAM', name: 'Hamilton Tiger-Cats', venue: 'Tim Hortons Field' },
    { code: 'CGY', name: 'Calgary Stampeders', venue: 'McMahon Stadium' },
    { code: 'EDM', name: 'Edmonton Elks', venue: 'Commonwealth Stadium' },
    { code: 'BC', name: 'BC Lions', venue: 'BC Place' },
    { code: 'WPG', name: 'Winnipeg Blue Bombers', venue: 'Princess Auto Stadium' }
  ];
  
  // Create realistic weekly schedule (typically 3-5 games per week)
  const gameSchedule = [];
  let currentWeek = 1;
  
  // Season opener - Thursday June 5, 2025
  if (today >= seasonStart && today <= seasonEnd) {
    gameSchedule.push({
      gameId: `cfl_2025_w1_opener`,
      awayTeam: 'Ottawa REDBLACKS',
      homeTeam: 'Saskatchewan Roughriders', 
      awayTeamCode: 'OTT',
      homeTeamCode: 'SSK',
      gameTime: '2025-06-05T21:30:00.000Z', // 9:30 PM EDT
      venue: 'Mosaic Stadium',
      week: 1,
      season: '2025'
    });
  }
  
  // Generate games for visible date range (30 days from today)
  for (let dayOffset = -2; dayOffset < 30; dayOffset++) {
    const gameDate = new Date(today);
    gameDate.setDate(today.getDate() + dayOffset);
    
    // Skip if outside season dates
    if (gameDate < seasonStart || gameDate > seasonEnd) continue;
    
    const dayOfWeek = gameDate.getDay();
    
    // CFL games typically on: Thursday (1), Friday (1-2), Saturday (2-3), Sunday (1-2)
    let numGames = 0;
    if (dayOfWeek === 4) numGames = 1; // Thursday
    else if (dayOfWeek === 5) numGames = Math.random() > 0.5 ? 2 : 1; // Friday
    else if (dayOfWeek === 6) numGames = Math.random() > 0.3 ? 3 : 2; // Saturday (most games)
    else if (dayOfWeek === 0) numGames = Math.random() > 0.5 ? 2 : 1; // Sunday
    
    // Always ensure at least one game on Saturdays during CFL season
    if (dayOfWeek === 6 && numGames === 0) numGames = 2;
    
    // Calculate current CFL week (21-week season)
    const weeksSinceStart = Math.floor((gameDate.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    currentWeek = Math.min(21, weeksSinceStart + 1);
    
    for (let gameNum = 0; gameNum < numGames; gameNum++) {
      // Create diverse matchups avoiding same teams playing too often
      const seed = dayOffset * 10 + gameNum;
      const awayIndex = seed % teams.length;
      let homeIndex = (seed + 4) % teams.length;
      
      // Ensure teams don't play themselves
      if (awayIndex === homeIndex) {
        homeIndex = (homeIndex + 1) % teams.length;
      }
      
      const awayTeam = teams[awayIndex];
      const homeTeam = teams[homeIndex];
      
      // Set realistic CFL game times
      let gameTime = new Date(gameDate);
      if (dayOfWeek === 4) { // Thursday night
        gameTime.setHours(21, 30, 0, 0); // 9:30 PM
      } else if (dayOfWeek === 5) { // Friday night  
        gameTime.setHours(20, 0, 0, 0); // 8:00 PM
      } else if (dayOfWeek === 6) { // Saturday
        // Mix of afternoon and evening games
        const hour = gameNum === 0 ? 16 : (gameNum === 1 ? 19 : 21); // 4 PM, 7 PM, 9 PM
        gameTime.setHours(hour, 0, 0, 0);
      } else if (dayOfWeek === 0) { // Sunday afternoon
        gameTime.setHours(16, 0, 0, 0); // 4 PM
      }
      
      gameSchedule.push({
        gameId: `cfl_2025_w${currentWeek}_${awayTeam.code}@${homeTeam.code}`,
        awayTeam: awayTeam.name,
        homeTeam: homeTeam.name,
        awayTeamCode: awayTeam.code,
        homeTeamCode: homeTeam.code,
        gameTime: gameTime.toISOString(),
        venue: homeTeam.venue,
        week: currentWeek,
        season: '2025'
      });
    }
  }

  // Handle special CFL events and off-season
  if (gameSchedule.length === 0) {
    // If we're outside the regular season (Dec - May), show preseason or off-season message
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    
    if (currentMonth >= 4 && currentMonth <= 5) { // May-June preseason
      // Add some preseason games
      gameSchedule.push({
        gameId: `cfl_2025_preseason_1`,
        awayTeam: 'Calgary Stampeders',
        homeTeam: 'BC Lions',
        awayTeamCode: 'CGY',
        homeTeamCode: 'BC',
        gameTime: '2025-05-19T22:00:00.000Z', // May 19 preseason opener
        venue: 'BC Place',
        week: 0, // Preseason
        season: '2025'
      });
    }
  }

  // Add special events if dates match
  const labourDay = new Date('2025-09-01'); // Labour Day Classic
  const stampedeBowl = new Date('2025-07-03'); // Stampede Bowl
  
  gameSchedule.forEach(game => {
    const gameDate = new Date(game.gameTime);
    
    // Labour Day Classic - Hamilton @ Toronto traditional matchup
    if (Math.abs(gameDate.getTime() - labourDay.getTime()) < 24 * 60 * 60 * 1000) {
      if (game.homeTeamCode === 'TOR' && game.awayTeamCode === 'HAM') {
        game.gameId = 'cfl_2025_labour_day_classic';
      }
    }
    
    // Stampede Bowl - Calgary hosting
    if (Math.abs(gameDate.getTime() - stampedeBowl.getTime()) < 24 * 60 * 60 * 1000) {
      if (game.homeTeamCode === 'CGY') {
        game.gameId = 'cfl_2025_stampede_bowl';
      }
    }
  });

  const upcomingGames = gameSchedule;
  console.log(`Generated ${upcomingGames.length} games in schedule`);

  // Add realistic odds to each game
  upcomingGames.forEach((game, index) => {
    console.log(`Adding odds to game: ${game.gameId}`);
    const gameWithOdds: CFLGame = {
      ...game,
      odds: generateRealisticCFLOdds(game.awayTeamCode, game.homeTeamCode)
    };
    games.push(gameWithOdds);
  });

  console.log(`Returning ${games.length} total CFL games`);
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

export async function fetchCFLGames(targetDate?: string): Promise<CFLGame[]> {
  // Generate CFL games for a date range around today to support date navigation
  const today = new Date();
  const games: CFLGame[] = [];
  
  // Generate games for a 7-day window around today (for date navigation)
  for (let dayOffset = -3; dayOffset <= 3; dayOffset++) {
    const gameDate = new Date(today);
    gameDate.setDate(today.getDate() + dayOffset);
    const gameDateStr = gameDate.toISOString().split('T')[0];
    const dayOfWeek = gameDate.getDay();
    
    // For testing: Generate CFL games for more days, with more games on weekends
    const shouldHaveGames = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 || dayOfWeek === 1; // Fri, Sat, Sun, Mon
    if (shouldHaveGames) {
      const gameCount = dayOfWeek === 6 ? 3 : 2; // More games on Saturday
      
      const matchups = [
        { away: 'Hamilton Tiger-Cats', home: 'Toronto Argonauts', awayCode: 'HAM', homeCode: 'TOR', venue: 'BMO Field' },
        { away: 'Calgary Stampeders', home: 'BC Lions', awayCode: 'CGY', homeCode: 'BC', venue: 'BC Place' },
        { away: 'Ottawa REDBLACKS', home: 'Saskatchewan Roughriders', awayCode: 'OTT', homeCode: 'SSK', venue: 'Mosaic Stadium' },
        { away: 'Montreal Alouettes', home: 'Winnipeg Blue Bombers', awayCode: 'MTL', homeCode: 'WPG', venue: 'Princess Auto Stadium' },
        { away: 'Edmonton Elks', home: 'Hamilton Tiger-Cats', awayCode: 'EDM', homeCode: 'HAM', venue: 'Tim Hortons Field' }
      ];
      
      for (let i = 0; i < Math.min(gameCount, matchups.length); i++) {
        const matchup = matchups[(dayOffset + i + 3) % matchups.length]; // Rotate matchups
        const gameTime = `${gameDateStr}T${19 + i}:00:00.000Z`; // Start at 7 PM, then 8 PM, 9 PM
        
        games.push({
          gameId: `cfl_2025_${matchup.awayCode}@${matchup.homeCode}_${gameDateStr}`,
          awayTeam: matchup.away,
          homeTeam: matchup.home,
          awayTeamCode: matchup.awayCode,
          homeTeamCode: matchup.homeCode,
          gameTime: gameTime,
          venue: matchup.venue,
          week: 4,
          season: '2025',
          odds: generateRealisticCFLOdds(matchup.awayCode, matchup.homeCode)
        });
      }
    }
  }
  
  console.log(`Generated ${games.length} CFL games for date range`);
  return games;
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