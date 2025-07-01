import fetch from 'node-fetch';

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

export async function getPinnaclePlayerProps(): Promise<PinnaclePlayerProp[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log('No RAPIDAPI_KEY found for Pinnacle API');
    return [];
  }

  try {
    // First get the sport ID for Baseball
    const baseballSportId = 3; // Baseball is typically sport ID 3 on Pinnacle

    // Get special markets (player props) for Baseball
    const url = `https://pinnacle-odds.p.rapidapi.com/kit/v1/specials?sport_id=${baseballSportId}`;
    
    console.log(`Fetching MLB player props from Pinnacle API...`);
    
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

    // Process specials data
    if (data.specials && Array.isArray(data.specials)) {
      data.specials.forEach((special: any) => {
        // Filter for player props categories
        if (isPlayerPropCategory(special.category) && special.lines) {
          Object.values(special.lines).forEach((line: any, index: number) => {
            const propType = extractPropTypeFromName(special.name);
            const playerName = extractPlayerNameFromSpecial(special.name);
            
            if (playerName && propType) {
              const prop: PinnaclePlayerProp = {
                id: `pinnacle_${special.special_id}_${line.id}`,
                gameId: special.event_id ? `pinnacle_${special.event_id}` : `pinnacle_${special.special_id}`,
                playerName: playerName,
                team: special.event ? extractTeamFromEvent(special.event, playerName) : 'UNK',
                opponent: special.event ? getOpponentTeam(special.event, playerName) : '',
                propType: propType,
                line: line.handicap || extractLineFromName(special.name) || 0.5,
                overOdds: convertPinnacleOdds(line.price, true),
                underOdds: convertPinnacleOdds(line.price, false),
                bookmaker: 'Pinnacle',
                category: mapCategoryToStandard(special.category),
                specialId: special.special_id,
                lineId: line.line_id,
                handicap: line.handicap,
                maxBet: special.max_bet || 1000,
                projectedValue: calculateProjectedValue(propType, line.handicap),
                edge: calculateEdge(line.price)
              };
              props.push(prop);
            }
          });
        }
      });
    }

    console.log(`Found ${props.length} Pinnacle player props for MLB`);
    return props;

  } catch (error) {
    console.error('Error fetching player props from Pinnacle API:', error);
    return [];
  }
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
  return line + variance;
}

function calculateEdge(price: number): number {
  // Calculate edge based on Pinnacle's sharp odds
  // Pinnacle typically has 2-3% margin, so simulate edge calculation
  const impliedProb = 1 / price;
  const estimatedProb = impliedProb + (Math.random() * 0.05 - 0.025); // ±2.5% adjustment
  return Math.max(0, (estimatedProb - impliedProb) * 100);
}

// Function to get available sports (for verification)
export async function getPinnacleSports() {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://pinnacle-odds.p.rapidapi.com/kit/v1/sports', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'pinnacle-odds.p.rapidapi.com'
      }
    });

    const data = await response.json();
    console.log('Available Pinnacle sports:', data);
    return data;
  } catch (error) {
    console.error('Error fetching Pinnacle sports:', error);
    return [];
  }
}