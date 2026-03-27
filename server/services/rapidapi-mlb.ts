// RapidAPI MLB service using the same endpoints as the n8n workflow
import fetch from 'node-fetch';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY environment variable is required");
const RAPIDAPI_HOST_BASEBALL = "baseball4.p.rapidapi.com";
const RAPIDAPI_HOST_PINNACLE = "pinnacle-odds.p.rapidapi.com";

export interface RapidMLBGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamCode: string;
  awayTeamCode: string;
  gameTime: string;
  venue: string;
  gameDate: string;
  homeWinPct: number;
  awayWinPct: number;
}

export interface PinnacleOdds {
  event_id: string;
  home_team: string;
  away_team: string;
  start_time: string;
  home_odds: number;
  away_odds: number;
}

export interface EnhancedMLBData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamCode: string;
  awayTeamCode: string;
  gameTime: string;
  venue: string;
  homeOdds: number;
  awayOdds: number;
  homeWinPct: number;
  awayWinPct: number;
  homeProb: number;
  awayProb: number;
  homeImp: number;
  awayImp: number;
  homeEV: number;
  awayEV: number;
  homeKelly: number;
  awayKelly: number;
  homeEdge: number;
  awayEdge: number;
}

class RapidAPIMLBService {
  private async makeRequest(url: string, host: string): Promise<any> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': host,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async fetchMLBSchedule(date: string): Promise<RapidMLBGame[]> {
    try {
      console.log(`Fetching MLB schedule for ${date} from RapidAPI...`);
      
      const url = `https://${RAPIDAPI_HOST_BASEBALL}/v1/mlb/schedule?date=${date}`;
      const data = await this.makeRequest(url, RAPIDAPI_HOST_BASEBALL);
      
      const games: RapidMLBGame[] = [];
      
      // Process the response similar to n8n workflow
      Object.keys(data.body || {}).forEach(key => {
        const game = data.body[key];
        
        if (game && game.teams) {
          const isoDate = game.gameDate;
          const dateObj = new Date(isoDate);
          
          // Convert to CDT (subtract 5 hours)
          dateObj.setHours(dateObj.getHours() - 5);
          
          const datePart = dateObj.toISOString().split('T')[0];
          const timePart = dateObj.toISOString().split('T')[1].replace('Z', '').slice(0, 5);
          
          // Calculate win percentages from team records
          
          // Calculate win percentages based on team records
          const homeWins = game.teams.home.leagueRecord?.wins || 50;
          const homeLosses = game.teams.home.leagueRecord?.losses || 50;
          const awayWins = game.teams.away.leagueRecord?.wins || 50;
          const awayLosses = game.teams.away.leagueRecord?.losses || 50;
          
          const homeWinPct = homeWins / (homeWins + homeLosses);
          const awayWinPct = awayWins / (awayWins + awayLosses);
          
          const awayTeamName = game.teams.away.team.name || "Unknown Away Team";
          const homeTeamName = game.teams.home.team.name || "Unknown Home Team";
          const awayTeamCode = this.extractTeamCode(awayTeamName);
          const homeTeamCode = this.extractTeamCode(homeTeamName);
          
          games.push({
            gameId: `${datePart}_${awayTeamCode} @ ${homeTeamCode}`,
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeTeamCode,
            awayTeamCode,
            gameTime: `${datePart}T${timePart}:00.000Z`,
            venue: game.venue?.name || "TBD",
            gameDate: datePart,
            homeWinPct,
            awayWinPct
          });
        }
      });
      
      console.log(`Successfully fetched ${games.length} MLB games from RapidAPI`);
      return games;
    } catch (error) {
      console.error("Error fetching MLB schedule from RapidAPI:", error);
      return [];
    }
  }

  async fetchPinnacleOdds(): Promise<PinnacleOdds[]> {
    try {
      console.log("Fetching Pinnacle odds from RapidAPI...");
      
      const url = `https://${RAPIDAPI_HOST_PINNACLE}/kit/v1/markets?league_ids=246&event_type=prematch&sport_id=9&is_have_odds=true`;
      const data = await this.makeRequest(url, RAPIDAPI_HOST_PINNACLE);
      
      const odds: PinnacleOdds[] = [];
      
      // Process events similar to n8n workflow
      const events = data.events || [];
      for (const game of events) {
        const period0 = game.periods?.num_0;
        const moneyLine = period0?.money_line;
        
        if (moneyLine && moneyLine.home && moneyLine.away) {
          odds.push({
            event_id: game.event_id,
            home_team: game.home,
            away_team: game.away,
            start_time: game.starts,
            home_odds: moneyLine.home,
            away_odds: moneyLine.away
          });
        }
      }
      
      console.log(`Successfully fetched ${odds.length} Pinnacle odds from RapidAPI`);
      return odds;
    } catch (error) {
      console.error("Error fetching Pinnacle odds from RapidAPI:", error);
      return [];
    }
  }

  private extractTeamCode(teamName: string): string {
    if (!teamName || typeof teamName !== 'string') {
      console.warn('Invalid team name provided to extractTeamCode:', teamName);
      return 'UNK';
    }
    
    const codeMap: { [key: string]: string } = {
      'Arizona Diamondbacks': 'ARI',
      'Atlanta Braves': 'ATL',
      'Baltimore Orioles': 'BAL',
      'Boston Red Sox': 'BOS',
      'Chicago Cubs': 'CHC',
      'Chicago White Sox': 'CWS',
      'Cincinnati Reds': 'CIN',
      'Cleveland Guardians': 'CLE',
      'Colorado Rockies': 'COL',
      'Detroit Tigers': 'DET',
      'Houston Astros': 'HOU',
      'Kansas City Royals': 'KC',
      'Los Angeles Angels': 'LAA',
      'Los Angeles Dodgers': 'LAD',
      'Miami Marlins': 'MIA',
      'Milwaukee Brewers': 'MIL',
      'Minnesota Twins': 'MIN',
      'New York Mets': 'NYM',
      'New York Yankees': 'NYY',
      'Oakland Athletics': 'OAK',
      'Philadelphia Phillies': 'PHI',
      'Pittsburgh Pirates': 'PIT',
      'San Diego Padres': 'SD',
      'San Francisco Giants': 'SF',
      'Seattle Mariners': 'SEA',
      'St. Louis Cardinals': 'STL',
      'Tampa Bay Rays': 'TB',
      'Texas Rangers': 'TEX',
      'Toronto Blue Jays': 'TOR',
      'Washington Nationals': 'WSH'
    };
    
    return codeMap[teamName] || teamName.substring(0, 3).toUpperCase();
  }

  // Enhanced analytics calculations from the n8n workflow
  calculateEnhancedAnalytics(games: RapidMLBGame[], odds: PinnacleOdds[]): EnhancedMLBData[] {
    const enhancedData: EnhancedMLBData[] = [];
    
    for (const game of games) {
      // Find matching odds by team names
      const matchingOdds = odds.find(odd => 
        odd.home_team.includes(game.homeTeamCode) || 
        odd.away_team.includes(game.awayTeamCode) ||
        game.homeTeam.includes(odd.home_team) ||
        game.awayTeam.includes(odd.away_team)
      );
      
      if (!matchingOdds) continue;
      
      const homeOdds = matchingOdds.home_odds;
      const awayOdds = matchingOdds.away_odds;
      const homeWinPct = game.homeWinPct;
      const awayWinPct = game.awayWinPct;
      
      // Avoid division by zero
      if (!homeOdds || !awayOdds || !homeWinPct || !awayWinPct) continue;
      
      const totalWinPct = homeWinPct + awayWinPct;
      
      // Convert season win percentages to game probabilities using a more realistic approach
      // Use implied probabilities as base and adjust slightly based on team strength difference
      const baseHomeImp = homeOdds > 0 ? 100 / (homeOdds + 100) : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
      const baseAwayImp = awayOdds > 0 ? 100 / (awayOdds + 100) : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);
      
      // Create model probabilities using team power scores and win percentages for realistic edge opportunities
      // Normalize team power scores to get relative strength
      const avgPowerScore = 95; // Average MLB team power score
      const homePowerAdj = (homeWinPct - 0.5) * 0.2; // Larger adjustment based on team quality
      const awayPowerAdj = (awayWinPct - 0.5) * 0.2;
      
      // Model probabilities that incorporate team analysis for betting edge
      const homeProb = Math.max(0.15, Math.min(0.85, baseHomeImp + homePowerAdj));
      const awayProb = Math.max(0.15, Math.min(0.85, baseAwayImp + awayPowerAdj));
      
      // Implied probabilities from odds
      const homeImp = homeOdds > 0 ? 100 / (homeOdds + 100) : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
      const awayImp = awayOdds > 0 ? 100 / (awayOdds + 100) : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);
      
      // Expected Value calculations
      const homeEV = homeOdds > 0 ? 
        (homeProb * homeOdds - (1 - homeProb) * 100) / 100 :
        (homeProb * 100 - (1 - homeProb) * Math.abs(homeOdds)) / 100;
      
      const awayEV = awayOdds > 0 ? 
        (awayProb * awayOdds - (1 - awayProb) * 100) / 100 :
        (awayProb * 100 - (1 - awayProb) * Math.abs(awayOdds)) / 100;
      
      // Kelly Criterion
      const homeKelly = homeEV > 0 ? homeEV / (homeOdds > 0 ? homeOdds / 100 : 100 / Math.abs(homeOdds)) : 0;
      const awayKelly = awayEV > 0 ? awayEV / (awayOdds > 0 ? awayOdds / 100 : 100 / Math.abs(awayOdds)) : 0;
      
      // Edge calculations
      const homeEdge = homeProb - homeImp;
      const awayEdge = awayProb - awayImp;
      
      enhancedData.push({
        gameId: game.gameId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeTeamCode: game.homeTeamCode,
        awayTeamCode: game.awayTeamCode,
        gameTime: game.gameTime,
        venue: game.venue,
        homeOdds,
        awayOdds,
        homeWinPct,
        awayWinPct,
        homeProb,
        awayProb,
        homeImp,
        awayImp,
        homeEV,
        awayEV,
        homeKelly,
        awayKelly,
        homeEdge,
        awayEdge
      });
    }
    
    return enhancedData;
  }
}

export const rapidAPIMLBService = new RapidAPIMLBService();