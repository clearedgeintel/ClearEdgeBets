import type { ProcessedGameData } from './odds';

export interface MLBGameData {
  gameId: string;
  gameDate: string;
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
  gameTime: string;
  venue: string;
  status: string;
  inning?: string;
  awayScore?: number;
  homeScore?: number;
  isCompleted: boolean;
  awayPitcher?: string;
  homePitcher?: string;
  awayPitcherStats?: string;
  homePitcherStats?: string;
}

export interface MLBScoreboardResponse {
  events: Array<{
    id: string;
    uid: string;
    date: string;
    name: string;
    shortName: string;
    competitions: Array<{
      id: string;
      venue: {
        fullName: string;
      };
      competitors: Array<{
        id: string;
        uid: string;
        type: string;
        homeAway: string;
        team: {
          id: string;
          abbreviation: string;
          displayName: string;
          shortDisplayName: string;
        };
        score: string;
      }>;
      status: {
        clock: number;
        displayClock: string;
        period: number;
        type: {
          id: string;
          name: string;
          state: string;
          completed: boolean;
          description: string;
          detail: string;
          shortDetail: string;
        };
      };
    }>;
  }>;
}

// Team name mappings for consistency
const TEAM_MAPPINGS: Record<string, { name: string; code: string }> = {
  'Arizona Diamondbacks': { name: 'Arizona Diamondbacks', code: 'ARI' },
  'Atlanta Braves': { name: 'Atlanta Braves', code: 'ATL' },
  'Baltimore Orioles': { name: 'Baltimore Orioles', code: 'BAL' },
  'Boston Red Sox': { name: 'Boston Red Sox', code: 'BOS' },
  'Chicago Cubs': { name: 'Chicago Cubs', code: 'CHC' },
  'Chicago White Sox': { name: 'Chicago White Sox', code: 'CWS' },
  'Cincinnati Reds': { name: 'Cincinnati Reds', code: 'CIN' },
  'Cleveland Guardians': { name: 'Cleveland Guardians', code: 'CLE' },
  'Colorado Rockies': { name: 'Colorado Rockies', code: 'COL' },
  'Detroit Tigers': { name: 'Detroit Tigers', code: 'DET' },
  'Houston Astros': { name: 'Houston Astros', code: 'HOU' },
  'Kansas City Royals': { name: 'Kansas City Royals', code: 'KC' },
  'Los Angeles Angels': { name: 'Los Angeles Angels', code: 'LAA' },
  'Los Angeles Dodgers': { name: 'Los Angeles Dodgers', code: 'LAD' },
  'Miami Marlins': { name: 'Miami Marlins', code: 'MIA' },
  'Milwaukee Brewers': { name: 'Milwaukee Brewers', code: 'MIL' },
  'Minnesota Twins': { name: 'Minnesota Twins', code: 'MIN' },
  'New York Mets': { name: 'New York Mets', code: 'NYM' },
  'New York Yankees': { name: 'New York Yankees', code: 'NYY' },
  'Oakland Athletics': { name: 'Oakland Athletics', code: 'OAK' },
  'Philadelphia Phillies': { name: 'Philadelphia Phillies', code: 'PHI' },
  'Pittsburgh Pirates': { name: 'Pittsburgh Pirates', code: 'PIT' },
  'San Diego Padres': { name: 'San Diego Padres', code: 'SD' },
  'San Francisco Giants': { name: 'San Francisco Giants', code: 'SF' },
  'Seattle Mariners': { name: 'Seattle Mariners', code: 'SEA' },
  'St. Louis Cardinals': { name: 'St. Louis Cardinals', code: 'STL' },
  'Tampa Bay Rays': { name: 'Tampa Bay Rays', code: 'TB' },
  'Texas Rangers': { name: 'Texas Rangers', code: 'TEX' },
  'Toronto Blue Jays': { name: 'Toronto Blue Jays', code: 'TOR' },
  'Washington Nationals': { name: 'Washington Nationals', code: 'WSH' }
};

export async function fetchMLBScoreboard(year: number, month: number, day: number): Promise<MLBGameData[]> {
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY environment variable is required');
  }

  try {
    const response = await fetch(
      `https://major-league-baseball-mlb.p.rapidapi.com/scoreboard?year=${year}&month=${month.toString().padStart(2, '0')}&day=${day.toString().padStart(2, '0')}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'major-league-baseball-mlb.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`MLB API request failed: ${response.status} ${response.statusText}`);
    }

    const data: MLBScoreboardResponse = await response.json();
    
    // Handle different API response structures
    if (!data || !data.events) {
      console.log("MLB API returned unexpected format - no events array found");
      return [];
    }
    
    return data.events.map(event => {
      if (!event.competitions || event.competitions.length === 0) {
        return null;
      }
      
      const competition = event.competitions[0]; // Get the first competition
      const awayCompetitor = competition.competitors?.find(c => c.homeAway === 'away');
      const homeCompetitor = competition.competitors?.find(c => c.homeAway === 'home');
      
      if (!awayCompetitor || !homeCompetitor) {
        return null;
      }
      
      const awayTeam = awayCompetitor.team.displayName;
      const homeTeam = homeCompetitor.team.displayName;
      const awayCode = awayCompetitor.team.abbreviation;
      const homeCode = homeCompetitor.team.abbreviation;
      
      return {
        gameId: `${awayCode}@${homeCode}`,
        gameDate: event.date,
        awayTeam: awayTeam,
        homeTeam: homeTeam,
        awayTeamCode: awayCode,
        homeTeamCode: homeCode,
        gameTime: new Date(event.date).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        venue: competition.venue.fullName,
        status: competition.status.type.detail,
        inning: competition.status.period ? `Inning ${competition.status.period}` : undefined,
        awayScore: awayCompetitor.score ? parseInt(awayCompetitor.score) : undefined,
        homeScore: homeCompetitor.score ? parseInt(homeCompetitor.score) : undefined,
        isCompleted: competition.status.type.completed
      };
    }).filter(game => game !== null) as MLBGameData[];
  } catch (error) {
    console.error('Error fetching MLB scoreboard:', error);
    throw error;
  }
}

export async function fetchTodaysMLBGames(): Promise<MLBGameData[]> {
  const today = new Date();
  return fetchMLBScoreboard(today.getFullYear(), today.getMonth() + 1, today.getDate());
}

export async function fetchMLBGamesForDate(dateString: string): Promise<MLBGameData[]> {
  const date = new Date(dateString);
  return fetchMLBScoreboard(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

// Fetch detailed game information including pitcher data
export async function fetchMLBGameDetails(year: number, month: number, day: number): Promise<MLBGameData[]> {
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY environment variable is required');
  }

  try {
    const response = await fetch(
      `https://major-league-baseball-mlb.p.rapidapi.com/scoreboard?year=${year}&month=${month.toString().padStart(2, '0')}&day=${day.toString().padStart(2, '0')}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'major-league-baseball-mlb.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`MLB API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || !data.events) {
      console.log("MLB API returned unexpected format - no events array found");
      return [];
    }
    
    return data.events.map((event: any) => {
      if (!event.competitions || event.competitions.length === 0) {
        return null;
      }
      
      const competition = event.competitions[0];
      const awayCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'away');
      const homeCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'home');
      
      if (!awayCompetitor || !homeCompetitor) {
        return null;
      }
      
      const awayTeam = awayCompetitor.team.displayName;
      const homeTeam = homeCompetitor.team.displayName;
      const awayCode = awayCompetitor.team.abbreviation;
      const homeCode = homeCompetitor.team.abbreviation;
      
      // Extract pitcher information if available
      let awayPitcher = '';
      let homePitcher = '';
      let awayPitcherStats = '';
      let homePitcherStats = '';
      
      // Check if pitcher data is available in the competition details
      if (competition.situation?.pitcher) {
        awayPitcher = competition.situation.pitcher.displayName || '';
        awayPitcherStats = `${competition.situation.pitcher.era || 'N/A'} ERA`;
      }
      
      // Look for probable pitchers in probables array
      if (awayCompetitor.probables && awayCompetitor.probables.length > 0) {
        const probablePitcher = awayCompetitor.probables[0];
        if (probablePitcher.athlete) {
          awayPitcher = probablePitcher.athlete.displayName || probablePitcher.athlete.fullName || '';
          // Add pitcher stats if available
          if (probablePitcher.athlete.statistics) {
            const stats = probablePitcher.athlete.statistics;
            awayPitcherStats = `${stats.era || 'N/A'} ERA, ${stats.whip || 'N/A'} WHIP`;
          } else {
            awayPitcherStats = 'Stats TBD';
          }
        }
      }
      
      if (homeCompetitor.probables && homeCompetitor.probables.length > 0) {
        const probablePitcher = homeCompetitor.probables[0];
        if (probablePitcher.athlete) {
          homePitcher = probablePitcher.athlete.displayName || probablePitcher.athlete.fullName || '';
          // Add pitcher stats if available
          if (probablePitcher.athlete.statistics) {
            const stats = probablePitcher.athlete.statistics;
            homePitcherStats = `${stats.era || 'N/A'} ERA, ${stats.whip || 'N/A'} WHIP`;
          } else {
            homePitcherStats = 'Stats TBD';
          }
        }
      }
      
      return {
        gameId: `${awayCode}@${homeCode}`,
        gameDate: event.date,
        awayTeam: awayTeam,
        homeTeam: homeTeam,
        awayTeamCode: awayCode,
        homeTeamCode: homeCode,
        gameTime: new Date(event.date).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        venue: competition.venue.fullName,
        status: competition.status.type.detail,
        inning: competition.status.period ? `Inning ${competition.status.period}` : undefined,
        awayScore: awayCompetitor.score ? parseInt(awayCompetitor.score) : undefined,
        homeScore: homeCompetitor.score ? parseInt(homeCompetitor.score) : undefined,
        isCompleted: competition.status.type.completed,
        awayPitcher: awayPitcher || undefined,
        homePitcher: homePitcher || undefined,
        awayPitcherStats: awayPitcherStats || undefined,
        homePitcherStats: homePitcherStats || undefined
      };
    }).filter((game: any) => game !== null) as MLBGameData[];
  } catch (error) {
    console.error('Error fetching MLB game details:', error);
    throw error;
  }
}

// Check if a specific game result is available
export function getGameResult(gameData: MLBGameData, pickType: string, selection: string): 'win' | 'loss' | 'push' | null {
  if (!gameData.isCompleted || gameData.awayScore === undefined || gameData.homeScore === undefined) {
    return null;
  }

  const awayScore = gameData.awayScore;
  const homeScore = gameData.homeScore;

  if (pickType === 'moneyline') {
    const winner = awayScore > homeScore ? gameData.awayTeam : gameData.homeTeam;
    return selection === winner ? 'win' : 'loss';
  }

  if (pickType === 'spread') {
    const spreadMatch = selection.match(/(.*)\s+([-+])\s*(\d+\.?\d*)/);
    if (spreadMatch) {
      const spreadTeam = spreadMatch[1].trim();
      const spreadDirection = spreadMatch[2];
      const spreadValue = parseFloat(spreadMatch[3]);
      
      let teamScore: number;
      let opponentScore: number;
      
      if (spreadTeam === gameData.homeTeam) {
        teamScore = homeScore;
        opponentScore = awayScore;
      } else {
        teamScore = awayScore;
        opponentScore = homeScore;
      }
      
      const actualMargin = teamScore - opponentScore;
      const requiredMargin = spreadDirection === '-' ? -spreadValue : spreadValue;
      
      if (actualMargin === requiredMargin) {
        return 'push';
      }
      
      return actualMargin > requiredMargin ? 'win' : 'loss';
    }
  }

  if (pickType === 'total') {
    const totalMatch = selection.match(/(\d+\.?\d*)/);
    if (totalMatch) {
      const totalValue = parseFloat(totalMatch[1]);
      const actualTotal = awayScore + homeScore;
      
      if (actualTotal === totalValue) {
        return 'push';
      }
      
      if (selection.toLowerCase().includes('over')) {
        return actualTotal > totalValue ? 'win' : 'loss';
      } else {
        return actualTotal < totalValue ? 'win' : 'loss';
      }
    }
  }

  return null;
}