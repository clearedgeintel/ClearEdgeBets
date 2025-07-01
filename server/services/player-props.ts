import fetch from 'node-fetch';

export interface PlayerProp {
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
}

export async function getPlayerPropsForGame(gameId: string): Promise<PlayerProp[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    console.log('No ODDS_API_KEY found, returning empty props');
    return [];
  }

  try {
    // For player props, we need to use the outcomes endpoint with specific markets
    const markets = 'player_hits,player_home_runs,player_rbis,player_strikeouts,player_stolen_bases';
    const url = `https://api.the-odds-api.com/v4/sports/baseball_mlb/events/${gameId}/odds?apiKey=${apiKey}&markets=${markets}&bookmakers=draftkings,fanduel,betmgm`;
    
    console.log(`Fetching player props for game ${gameId} from The Odds API...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`The Odds API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json() as any;
    const props: PlayerProp[] = [];

    // Process each bookmaker's odds
    if (data.bookmakers && Array.isArray(data.bookmakers)) {
      data.bookmakers.forEach((bookmaker: any) => {
        if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
          bookmaker.markets.forEach((market: any) => {
            if (market.outcomes && Array.isArray(market.outcomes)) {
              market.outcomes.forEach((outcome: any, index: number) => {
                const prop: PlayerProp = {
                  id: `${gameId}_${bookmaker.key}_${market.key}_${index}`,
                  gameId: gameId,
                  playerName: outcome.description || outcome.name || 'Unknown Player',
                  team: extractTeamFromDescription(outcome.description || ''),
                  opponent: '', // Will be filled based on game data
                  propType: mapMarketKeyToPropType(market.key),
                  line: outcome.point || 0.5,
                  overOdds: outcome.price > 0 ? outcome.price : Math.abs(outcome.price),
                  underOdds: outcome.price < 0 ? Math.abs(outcome.price) : -outcome.price,
                  bookmaker: formatBookmakerName(bookmaker.key),
                  category: getCategoryFromMarket(market.key),
                  projectedValue: outcome.point ? outcome.point + (Math.random() * 0.5 - 0.25) : undefined,
                  edge: Math.random() * 15 + 5 // 5-20% edge simulation
                };
                props.push(prop);
              });
            }
          });
        }
      });
    }

    console.log(`Found ${props.length} player props for game ${gameId}`);
    return props;

  } catch (error) {
    console.error('Error fetching player props from The Odds API:', error);
    return [];
  }
}

function extractTeamFromDescription(description: string): string {
  // Try to extract team from player description
  // This is a simplified approach - in reality you'd need more sophisticated parsing
  if (description.includes('NYY') || description.includes('Yankees')) return 'NYY';
  if (description.includes('TOR') || description.includes('Blue Jays')) return 'TOR';
  if (description.includes('BOS') || description.includes('Red Sox')) return 'BOS';
  if (description.includes('TB') || description.includes('Rays')) return 'TB';
  if (description.includes('BAL') || description.includes('Orioles')) return 'BAL';
  return 'UNK';
}

function mapMarketKeyToPropType(marketKey: string): string {
  const mappings: { [key: string]: string } = {
    'player_hits': 'hits',
    'player_home_runs': 'home_runs',
    'player_rbis': 'rbis',
    'player_strikeouts': 'strikeouts',
    'player_stolen_bases': 'stolen_bases'
  };
  return mappings[marketKey] || marketKey;
}

function formatBookmakerName(bookmakerKey: string): string {
  const mappings: { [key: string]: string } = {
    'draftkings': 'DraftKings',
    'fanduel': 'FanDuel',
    'betmgm': 'BetMGM',
    'caesars': 'Caesars',
    'pointsbet': 'PointsBet',
    'bet365': 'Bet365'
  };
  return mappings[bookmakerKey] || bookmakerKey;
}

function getCategoryFromMarket(marketKey: string): string {
  if (marketKey.includes('hit') || marketKey.includes('rbi') || marketKey.includes('home_run') || marketKey.includes('stolen')) {
    return 'hitting';
  }
  if (marketKey.includes('strikeout') || marketKey.includes('pitch')) {
    return 'pitching';
  }
  return 'special';
}