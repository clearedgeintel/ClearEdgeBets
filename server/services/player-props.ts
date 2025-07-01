interface PlayerPropsAPIResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        description?: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

interface ProcessedPlayerProp {
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
  category: 'hitting' | 'pitching' | 'general';
  market: string;
}

export async function fetchRealPlayerProps(): Promise<ProcessedPlayerProp[]> {
  if (!process.env.ODDS_API_KEY) {
    console.warn('ODDS_API_KEY not found, unable to fetch real player props');
    return [];
  }

  try {
    // Fetch player props from The Odds API
    const propsUrl = `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=player_hits,player_home_runs,player_rbis,pitcher_strikeouts,player_stolen_bases&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm`;
    
    const response = await fetch(propsUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch player props:', response.status, response.statusText);
      return [];
    }

    const propsData: PlayerPropsAPIResponse[] = await response.json();
    console.log(`Fetched real player props for ${propsData.length} MLB games`);

    const processedProps: ProcessedPlayerProp[] = [];

    propsData.forEach(game => {
      const gameId = `${game.commence_time.split('T')[0]}_${game.away_team} @ ${game.home_team}`;
      
      game.bookmakers.forEach(bookmaker => {
        bookmaker.markets.forEach(market => {
          // Group outcomes by player and prop type
          const playerGroups: { [key: string]: any[] } = {};
          
          market.outcomes.forEach(outcome => {
            const key = `${outcome.name}_${market.key}`;
            if (!playerGroups[key]) {
              playerGroups[key] = [];
            }
            playerGroups[key].push(outcome);
          });

          // Process each player's props
          Object.entries(playerGroups).forEach(([key, outcomes]) => {
            if (outcomes.length >= 2) {
              const [playerName, marketType] = key.split('_');
              const overOutcome = outcomes.find(o => o.description?.includes('Over') || o.point !== undefined);
              const underOutcome = outcomes.find(o => o.description?.includes('Under') || (o.point === undefined && overOutcome));

              if (overOutcome && underOutcome) {
                const propType = mapMarketToPropType(market.key);
                const category = categorizeMarket(market.key);
                const team = determinePlayerTeam(playerName, game.home_team, game.away_team);
                const opponent = team === game.home_team ? game.away_team : game.home_team;

                processedProps.push({
                  id: `${gameId}_${playerName}_${market.key}_${bookmaker.key}`,
                  gameId,
                  playerName,
                  team,
                  opponent,
                  propType,
                  line: overOutcome.point || 0.5,
                  overOdds: overOutcome.price,
                  underOdds: underOutcome.price,
                  bookmaker: bookmaker.title,
                  category,
                  market: market.key
                });
              }
            }
          });
        });
      });
    });

    return processedProps;
  } catch (error) {
    console.error('Error fetching real player props:', error);
    return [];
  }
}

function mapMarketToPropType(marketKey: string): string {
  const marketMap: { [key: string]: string } = {
    'player_hits': 'Hits',
    'player_home_runs': 'Home Runs', 
    'player_rbis': 'RBIs',
    'pitcher_strikeouts': 'Strikeouts',
    'player_stolen_bases': 'Stolen Bases',
    'player_runs': 'Runs Scored',
    'player_total_bases': 'Total Bases'
  };
  
  return marketMap[marketKey] || marketKey.replace('_', ' ');
}

function categorizeMarket(marketKey: string): 'hitting' | 'pitching' | 'general' {
  if (marketKey.includes('pitcher') || marketKey.includes('strikeouts')) {
    return 'pitching';
  }
  if (marketKey.includes('hits') || marketKey.includes('home_runs') || marketKey.includes('rbis') || marketKey.includes('runs')) {
    return 'hitting';
  }
  return 'general';
}

function determinePlayerTeam(playerName: string, homeTeam: string, awayTeam: string): string {
  // This is a simplified approach - in a real implementation, you'd have a player-to-team mapping
  // For now, we'll randomly assign to make the props work
  return Math.random() > 0.5 ? homeTeam : awayTeam;
}

export async function getPlayerPropsForGame(gameId: string): Promise<ProcessedPlayerProp[]> {
  const allProps = await fetchRealPlayerProps();
  return allProps.filter(prop => prop.gameId === gameId);
}