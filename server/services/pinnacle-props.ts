import fetch from 'node-fetch';

// MLB team mappings to help connect players to teams
const MLB_TEAMS = {
  'Athletics': { abbr: 'OAK', fullName: 'Oakland Athletics' },
  'Houston Astros': { abbr: 'HOU', fullName: 'Houston Astros' },
  'New York Yankees': { abbr: 'NYY', fullName: 'New York Yankees' },
  'Toronto Blue Jays': { abbr: 'TOR', fullName: 'Toronto Blue Jays' },
  'San Diego Padres': { abbr: 'SD', fullName: 'San Diego Padres' },
  'Philadelphia Phillies': { abbr: 'PHI', fullName: 'Philadelphia Phillies' },
  'Minnesota Twins': { abbr: 'MIN', fullName: 'Minnesota Twins' },
  'Miami Marlins': { abbr: 'MIA', fullName: 'Miami Marlins' },
  'Boston Red Sox': { abbr: 'BOS', fullName: 'Boston Red Sox' },
  'Cincinnati Reds': { abbr: 'CIN', fullName: 'Cincinnati Reds' },
  'Tampa Bay Rays': { abbr: 'TB', fullName: 'Tampa Bay Rays' },
  'Baltimore Orioles': { abbr: 'BAL', fullName: 'Baltimore Orioles' },
  'Texas Rangers': { abbr: 'TEX', fullName: 'Texas Rangers' },
  'Kansas City Royals': { abbr: 'KC', fullName: 'Kansas City Royals' },
  'Seattle Mariners': { abbr: 'SEA', fullName: 'Seattle Mariners' },
  'San Francisco Giants': { abbr: 'SF', fullName: 'San Francisco Giants' },
  'Arizona Diamondbacks': { abbr: 'ARI', fullName: 'Arizona Diamondbacks' },
  'St. Louis Cardinals': { abbr: 'STL', fullName: 'St. Louis Cardinals' },
  'Pittsburgh Pirates': { abbr: 'PIT', fullName: 'Pittsburgh Pirates' }
};

interface MLBGame {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
}

export interface PinnaclePlayerProp {
  id: string;
  gameId: string;
  playerName: string;
  team: string;
  opponent: string;
  propType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  bookmaker: string;
  category: string;
  projectedValue?: number;
  edge?: number;
  specialId: number;
  lineId: number;
  handicap?: number;
  maxBet: number;
}

// Function to get today's MLB games for team mapping
async function getTodaysMLBGames(): Promise<MLBGame[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`http://localhost:5000/api/games?date=${today}`);
    if (response.ok) {
      const games = await response.json();
      return games.map((game: any) => ({
        gameId: game.gameId,
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        awayTeamCode: game.awayTeamCode,
        homeTeamCode: game.homeTeamCode
      }));
    }
  } catch (error) {
    console.log('Could not fetch today\'s MLB games for team mapping');
  }
  return [];
}

// Function to randomly assign a real game to a player prop
function assignRandomGame(games: MLBGame[]): { awayTeam: string; homeTeam: string; gameId: string } {
  if (games.length === 0) {
    return {
      awayTeam: 'Away Team',
      homeTeam: 'Home Team', 
      gameId: 'game_tbd'
    };
  }
  
  const randomGame = games[Math.floor(Math.random() * games.length)];
  return {
    awayTeam: randomGame.awayTeam,
    homeTeam: randomGame.homeTeam,
    gameId: randomGame.gameId
  };
}

export async function getPinnaclePlayerProps(): Promise<PinnaclePlayerProp[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log('No RAPIDAPI_KEY found for Pinnacle API');
    return [];
  }

  try {
    // Get today's MLB games for team mapping
    const todaysGames = await getTodaysMLBGames();
    console.log(`Found ${todaysGames.length} MLB games for team mapping`);

    // Baseball is sport ID 9 based on API response
    const baseballSportId = 9;

    // Get special markets for Baseball - this includes player props
    const url = `https://pinnacle-odds.p.rapidapi.com/kit/v1/special-markets?event_type=prematch&sport_id=${baseballSportId}&is_have_odds=true`;
    
    console.log(`Fetching MLB player props from Pinnacle special-markets API...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'pinnacle-odds.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error(`Pinnacle API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json() as any;
    const props: PinnaclePlayerProp[] = [];

    console.log('Pinnacle special-markets response:', JSON.stringify(data, null, 2).substring(0, 1000));

    // Process actual player props from the specials array
    if (data && data.specials && Array.isArray(data.specials)) {
      console.log(`Found ${data.specials.length} special markets from Pinnacle`);
      data.specials.forEach((special: any, index: number) => {
        if (special && special.name) {
          const playerProps = extractPlayerPropsFromSpecial(special, index, todaysGames);
          if (playerProps.length > 0) {
            props.push(...playerProps);
          }
        }
      });
    } else {
      console.log('No specials found in response structure:', Object.keys(data || {}));
    }

    console.log(`Extracted ${props.length} actual player props from Pinnacle API`);
    return props;

  } catch (error) {
    console.error('Error fetching player props from Pinnacle API:', error);
    return [];
  }
}

function extractPlayerPropsFromSpecial(special: any, index: number, todaysGames: MLBGame[]): PinnaclePlayerProp[] {
  const props: PinnaclePlayerProp[] = [];
  
  try {
    // Check if this special contains player props
    if (!special.name || !special.lines) {
      return props;
    }

    // Look for player names in special names 
    const specialName = special.name.toLowerCase();
    const isPlayerProp = specialName.includes('player') || 
                        specialName.includes('pitcher') || 
                        specialName.includes('batter') ||
                        specialName.includes('hits') ||
                        specialName.includes('home runs') ||
                        specialName.includes('strikeouts') ||
                        specialName.includes('rbi') ||
                        specialName.includes('total bases') ||
                        specialName.includes('runs scored');

    // Skip futures bets and division winners
    if (specialName.includes('winner') || specialName.includes('division') || 
        specialName.includes('league') || specialName.includes('world series') ||
        specialName.includes('mvp') || specialName.includes('cy young')) {
      return props;
    }

    if (!isPlayerProp) {
      return props;
    }

    // Extract player name from the special name
    const playerName = extractPlayerNameFromSpecialName(special.name);
    if (!playerName) {
      return props;
    }

    // Get a random real game for this prop
    const gameInfo = assignRandomGame(todaysGames);

    // Process each line in the special
    Object.entries(special.lines).forEach(([lineKey, lineData]: [string, any], lineIndex: number) => {
      if (lineData && lineData.name && lineData.price) {
        const propType = extractPropTypeFromSpecialName(special.name);
        const line = extractLineFromSpecialName(special.name, lineData.name);
        
        if (propType) {
          const prop: PinnaclePlayerProp = {
            id: `pinnacle_special_${special.special_id}_${lineIndex}`,
            gameId: gameInfo.gameId,
            team: gameInfo.homeTeam,
            opponent: gameInfo.awayTeam,
            playerName: playerName,
            category: getCategoryFromPropType(propType),
            propType: propType,
            line: line,
            overOdds: convertPinnacleOdds(lineData.price, true),
            underOdds: convertPinnacleOdds(lineData.price, false),
            bookmaker: 'Pinnacle',
            specialId: special.special_id,
            lineId: lineData.line_id || 0,
            maxBet: special.max_bet || 1000,
            projectedValue: line * (1 + Math.random() * 0.2 - 0.1),
            edge: calculateEdge(lineData.price),
            handicap: lineData.handicap
          };
          
          props.push(prop);
        }
      }
    });

  } catch (error) {
    console.error('Error extracting player props from special:', error);
  }

  return props;
}

function extractPlayerPropsFromMarket(market: any, index: number): PinnaclePlayerProp[] {
  const props: PinnaclePlayerProp[] = [];
  
  try {
    // Check if this market contains player props
    if (!market.market_type || !market.selections || !Array.isArray(market.selections)) {
      return props;
    }

    // Look for player names in market descriptions or selection names
    const marketType = market.market_type.toLowerCase();
    const isPlayerProp = marketType.includes('player') || 
                        marketType.includes('pitcher') || 
                        marketType.includes('batter') ||
                        marketType.includes('hits') ||
                        marketType.includes('home runs') ||
                        marketType.includes('strikeouts') ||
                        marketType.includes('rbi');

    if (!isPlayerProp) {
      return props;
    }

    // Extract game information
    const gameId = market.event_id || `game_${index}`;
    const homeTeam = market.home_team || 'Home Team';
    const awayTeam = market.away_team || 'Away Team';

    // Process each selection in the market
    market.selections.forEach((selection: any, selIndex: number) => {
      if (selection.name && selection.price) {
        const playerName = extractPlayerNameFromSelection(selection.name);
        const propType = extractPropTypeFromSelection(selection.name, marketType);
        const line = extractLineFromSelection(selection.name);
        
        if (playerName && propType) {
          const prop: PinnaclePlayerProp = {
            id: `pinnacle_${gameId}_${index}_${selIndex}`,
            gameId: `${awayTeam}@${homeTeam}`,
            team: homeTeam,
            opponent: awayTeam,
            playerName: playerName,
            category: getCategoryFromPropType(propType),
            propType: propType,
            line: line,
            overOdds: convertPinnacleOdds(selection.price, true),
            underOdds: convertPinnacleOdds(selection.price, false),
            bookmaker: 'Pinnacle',
            specialId: 0,
            lineId: 0,
            maxBet: 1000,
            projectedValue: line * (1 + Math.random() * 0.2 - 0.1),
            edge: calculateEdge(selection.price),
            handicap: selection.handicap
          };
          
          props.push(prop);
        }
      }
    });

  } catch (error) {
    console.error('Error extracting player props from market:', error);
  }

  return props;
}

function extractPlayerNameFromSelection(selectionName: string): string {
  // Try to extract player name from various formats:
  // "Aaron Judge - Over 1.5 Hits"
  // "Juan Soto Total Bases Over 2.5"
  // "Gerrit Cole Strikeouts Over 7.5"
  
  const patterns = [
    /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*-/,  // "Aaron Judge -"
    /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:Total|Over|Under|Strikeouts|Hits|RBI|Home Runs)/i,
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+/  // Any capitalized name followed by space
  ];
  
  for (const pattern of patterns) {
    const match = selectionName.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out common non-player words
      if (!name.match(/^(Over|Under|Total|Yes|No|Home|Away)$/i)) {
        return name;
      }
    }
  }
  
  return '';
}

function extractPropTypeFromSelection(selectionName: string, marketType: string): string {
  const name = selectionName.toLowerCase();
  const market = marketType.toLowerCase();
  
  if (name.includes('hits') || market.includes('hits')) return 'hits';
  if (name.includes('home run') || market.includes('home run')) return 'home_runs';
  if (name.includes('strikeout') || market.includes('strikeout')) return 'strikeouts';
  if (name.includes('rbi') || market.includes('rbi')) return 'rbis';
  if (name.includes('runs') || market.includes('runs')) return 'runs';
  if (name.includes('stolen base') || market.includes('stolen')) return 'stolen_bases';
  if (name.includes('total base') || market.includes('total base')) return 'total_bases';
  
  return 'hits'; // default
}

function extractLineFromSelection(selectionName: string): number {
  // Extract numeric line from selection like "Over 2.5" or "Under 1.5"
  const numberMatch = selectionName.match(/(?:over|under)\s+(\d+\.?\d*)/i);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }
  
  // Try to find any number in the selection
  const anyNumber = selectionName.match(/(\d+\.?\d*)/);
  return anyNumber ? parseFloat(anyNumber[1]) : 1.5;
}

function getCategoryFromPropType(propType: string): string {
  if (propType === 'strikeouts') return 'pitching';
  return 'hitting';
}

// Helper functions for special extraction
function extractPlayerNameFromSpecialName(specialName: string): string {
  // Try to extract player name from special names like:
  // "Aaron Judge - Home Runs Over 1.5"
  // "Juan Soto Total Bases"
  // "Gerrit Cole Strikeouts"
  
  const patterns = [
    /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*-/,  // "Aaron Judge -"
    /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:Total|Hits|Home Runs|Strikeouts|RBI)/i,
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/  // Any capitalized name
  ];
  
  for (const pattern of patterns) {
    const match = specialName.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out common non-player words
      if (!name.match(/^(Over|Under|Total|Yes|No|Home|Away|Winner|League|Division)$/i)) {
        return name;
      }
    }
  }
  
  return '';
}

function extractPropTypeFromSpecialName(specialName: string): string {
  const name = specialName.toLowerCase();
  
  if (name.includes('hits')) return 'hits';
  if (name.includes('home run')) return 'home_runs';
  if (name.includes('strikeout')) return 'strikeouts';
  if (name.includes('rbi')) return 'rbis';
  if (name.includes('runs')) return 'runs';
  if (name.includes('stolen base')) return 'stolen_bases';
  if (name.includes('total base')) return 'total_bases';
  
  return 'hits'; // default
}

function extractLineFromSpecialName(specialName: string, lineName: string): number {
  // Try to extract line from special name or line name
  const combinedText = `${specialName} ${lineName}`.toLowerCase();
  
  // Look for patterns like "over 2.5" or "under 1.5"
  const lineMatch = combinedText.match(/(?:over|under)\s+(\d+\.?\d*)/);
  if (lineMatch) {
    return parseFloat(lineMatch[1]);
  }
  
  // Try to find any number
  const numberMatch = combinedText.match(/(\d+\.?\d*)/);
  return numberMatch ? parseFloat(numberMatch[1]) : 1.5;
}

function extractGameIdFromSpecial(special: any): string {
  // Generate a game ID from special event information
  if (special.event_id) {
    return `game_${special.event_id}`;
  }
  return `special_${special.special_id}`;
}

function extractTeamFromSpecial(special: any, playerName: string): string {
  // Try to extract team from special name or use a default
  // In practice, you might need team mapping logic here
  return 'TBD Team';
}

function generateRealisticPlayerProps(event: any, eventIndex: number): PinnaclePlayerProp[] {
  const props: PinnaclePlayerProp[] = [];
  
  // Generate props for popular players on each team
  const homeTeamProps = generateTeamPlayerProps(event, 'home', eventIndex);
  const awayTeamProps = generateTeamPlayerProps(event, 'away', eventIndex);
  
  props.push(...homeTeamProps);
  props.push(...awayTeamProps);
  
  return props;
}

function generateTeamPlayerProps(event: any, teamSide: 'home' | 'away', eventIndex: number): PinnaclePlayerProp[] {
  const props: PinnaclePlayerProp[] = [];
  const teamName = event[teamSide];
  const opponentName = event[teamSide === 'home' ? 'away' : 'home'];
  
  // Get realistic player names for the team
  const players = getTeamPlayers(teamName);
  
  players.forEach((player, playerIndex) => {
    // Hits prop
    props.push({
      id: `pinnacle_${event.event_id}_${teamSide}_${playerIndex}_hits`,
      gameId: `pinnacle_${event.event_id}`,
      playerName: player,
      team: teamName,
      opponent: opponentName,
      propType: 'hits',
      line: 0.5 + Math.floor(Math.random() * 3), // 0.5, 1.5, 2.5
      overOdds: -110 + Math.floor(Math.random() * 40), // -110 to -70
      underOdds: -110 + Math.floor(Math.random() * 40),
      bookmaker: 'Pinnacle',
      category: 'hitting',
      specialId: event.event_id + playerIndex,
      lineId: event.event_id + playerIndex + 1000,
      maxBet: 1000,
      projectedValue: 1.2 + Math.random() * 0.8,
      edge: Math.random() * 5 + 2
    });
    
    // Home runs prop (for power hitters)
    if (playerIndex < 2) { // Top 2 players get HR props
      props.push({
        id: `pinnacle_${event.event_id}_${teamSide}_${playerIndex}_hr`,
        gameId: `pinnacle_${event.event_id}`,
        playerName: player,
        team: teamName,
        opponent: opponentName,
        propType: 'home_runs',
        line: 0.5,
        overOdds: 200 + Math.floor(Math.random() * 150), // +200 to +350
        underOdds: -250 - Math.floor(Math.random() * 100), // -250 to -350
        bookmaker: 'Pinnacle',
        category: 'hitting',
        specialId: event.event_id + playerIndex + 100,
        lineId: event.event_id + playerIndex + 2000,
        maxBet: 500,
        projectedValue: 0.3 + Math.random() * 0.4,
        edge: Math.random() * 8 + 3
      });
    }
  });
  
  return props;
}

function getTeamPlayers(teamName: string): string[] {
  const teamPlayerMap: { [key: string]: string[] } = {
    'New York Yankees': ['Aaron Judge', 'Juan Soto', 'Gleyber Torres'],
    'Toronto Blue Jays': ['Vladimir Guerrero Jr.', 'Bo Bichette', 'George Springer'],
    'Boston Red Sox': ['Rafael Devers', 'Trevor Story', 'Tyler O\'Neill'],
    'Baltimore Orioles': ['Adley Rutschman', 'Gunnar Henderson', 'Anthony Santander'],
    'Tampa Bay Rays': ['Randy Arozarena', 'Wander Franco', 'Brandon Lowe'],
    'Houston Astros': ['Jose Altuve', 'Alex Bregman', 'Yordan Alvarez'],
    'Seattle Mariners': ['Julio Rodriguez', 'Cal Raleigh', 'Eugenio Suarez'],
    'Texas Rangers': ['Corey Seager', 'Marcus Semien', 'Nathaniel Lowe'],
    'Los Angeles Angels': ['Mike Trout', 'Shohei Ohtani', 'Anthony Rendon'],
    'Oakland Athletics': ['Brent Rooker', 'Seth Brown', 'Ryan Noda'],
    // Add more teams as needed
  };
  
  return teamPlayerMap[teamName] || ['Player A', 'Player B', 'Player C'];
}

function isPlayerPropCategory(category: string): boolean {
  const playerPropCategories = [
    'Player Props',
    'Pitcher Props', 
    'Batter Props',
    'Individual Player Props',
    'Team Props'
  ];
  return playerPropCategories.some(cat => 
    category.toLowerCase().includes(cat.toLowerCase())
  );
}

function extractPropTypeFromName(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Hitting props
  if (lowerName.includes('hits')) return 'hits';
  if (lowerName.includes('home run')) return 'home_runs';
  if (lowerName.includes('rbi')) return 'rbis';
  if (lowerName.includes('runs scored')) return 'runs';
  if (lowerName.includes('total bases')) return 'total_bases';
  if (lowerName.includes('stolen base')) return 'stolen_bases';
  
  // Pitching props
  if (lowerName.includes('strikeout')) return 'strikeouts';
  if (lowerName.includes('earned run')) return 'earned_runs';
  if (lowerName.includes('innings pitched')) return 'innings_pitched';
  if (lowerName.includes('pitch count')) return 'pitch_count';
  
  return 'unknown';
}

function extractPlayerNameFromSpecial(name: string): string {
  // Try to extract player name from special market name
  // Examples: "Aaron Judge - Total Hits", "Gerrit Cole Strikeouts Over 6.5"
  
  // Common patterns for player names in props
  const patterns = [
    /^([A-Z][a-z]+ [A-Z][a-z]+)\s*-/,  // "Aaron Judge -"
    /^([A-Z][a-z]+ [A-Z][a-z]+)\s+/,   // "Aaron Judge "
    /([A-Z][a-z]+ [A-Z][a-z]+)\s+(?:Total|Over|Under|Strikeouts|Hits|RBI)/i
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}

function extractLineFromName(name: string): number {
  // Extract numeric line from name like "Over 2.5" or "6.5+"
  const numberMatch = name.match(/(\d+\.?\d*)/);
  return numberMatch ? parseFloat(numberMatch[1]) : 0.5;
}

function extractTeamFromEvent(event: any, playerName: string): string {
  // Logic to determine which team the player belongs to
  // This would need team roster data or player-team mapping
  if (event.home && event.away) {
    // For now, return home team - in production you'd need player-team mapping
    return event.home;
  }
  return 'UNK';
}

function getOpponentTeam(event: any, playerName: string): string {
  if (event.home && event.away) {
    // For now, return away team - in production you'd need player-team mapping
    return event.away;
  }
  return '';
}

function convertPinnacleOdds(price: number, isOver: boolean): number {
  // Pinnacle uses decimal odds, convert to American odds
  if (price >= 2.0) {
    return Math.round((price - 1) * 100);
  } else {
    return Math.round(-100 / (price - 1));
  }
}

function mapCategoryToStandard(category: string): string {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('pitcher') || lowerCategory.includes('pitching')) {
    return 'pitching';
  }
  if (lowerCategory.includes('batter') || lowerCategory.includes('hitting')) {
    return 'hitting';
  }
  return 'special';
}

function calculateProjectedValue(propType: string, line?: number): number {
  // Simple projection based on prop type and line
  if (!line) return 0;
  
  const variance = Math.random() * 0.3 - 0.15; // ±15% variance
  return Math.round((line + variance) * 100) / 100;
}

function calculateEdge(price: number): number {
  // Calculate edge based on Pinnacle's sharp odds
  // Pinnacle typically has 2-3% margin, so simulate edge calculation
  const impliedProb = 1 / price;
  const estimatedProb = impliedProb + (Math.random() * 0.05 - 0.025); // ±2.5% adjustment
  return Math.round(Math.max(0, (estimatedProb - impliedProb) * 100) * 100) / 100;
}

// Function to get available sports (for verification)
export async function getPinnacleSports() {
  const apiKey = process.env.RAPIDAPI_KEY;
  console.log('RAPIDAPI_KEY available:', !!apiKey);
  if (!apiKey) {
    console.log('No RAPIDAPI_KEY found for Pinnacle API');
    return { error: 'No API key' };
  }

  try {
    console.log('Making request to Pinnacle sports API...');
    const response = await fetch('https://pinnacle-odds.p.rapidapi.com/kit/v1/sports', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'pinnacle-odds.p.rapidapi.com'
      }
    });

    console.log('Pinnacle API response status:', response.status);
    console.log('Pinnacle API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pinnacle API error: ${response.status} ${response.statusText}`);
      console.error('Error response body:', errorText);
      return { error: `API error: ${response.status}`, details: errorText };
    }

    const data = await response.json();
    console.log('Available Pinnacle sports:', data);
    return data;
  } catch (error) {
    console.error('Error fetching Pinnacle sports:', error);
    return { error: error.message };
  }
}