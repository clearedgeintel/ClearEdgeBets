/**
 * MLB Stats API Service - Official MLB Data
 * Provides real-time game data, injuries, lineups, and weather conditions
 * API: https://statsapi.mlb.com/api/v1/
 * Cost: Free
 * Rate Limit: Very generous
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

export interface MLBInjury {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  injuryType: string;
  bodyPart: string;
  status: string;
  dateInjured: string;
  expectedReturn?: string;
}

export interface MLBLineup {
  gameId: string;
  teamId: number;
  teamName: string;
  lineup: Array<{
    playerId: number;
    playerName: string;
    position: string;
    battingOrder: number;
  }>;
  pitcher: {
    playerId: number;
    playerName: string;
    record: string;
    era: string;
  };
}

export interface MLBGameWeather {
  gameId: string;
  condition: string;
  temperature: number;
  wind: {
    speed: number;
    direction: string;
  };
  humidity: number;
  precipitation: number;
}

class MLBStatsAPIService {
  private baseUrl = MLB_API_BASE;
  private lastRequestTime = 0;
  private requestCount = 0;

  // Rate limiting helper
  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Be respectful: minimum 100ms between requests
    if (timeSinceLastRequest < 100) {
      await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    await this.rateLimit();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`MLB Stats API error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get current MLB injuries
   */
  async getInjuries(): Promise<MLBInjury[]> {
    try {
      const data = await this.makeRequest('/sports/1/injuries');
      
      if (!data.injuries || !Array.isArray(data.injuries)) {
        return [];
      }

      return data.injuries.map((injury: any) => ({
        playerId: injury.player?.id || 0,
        playerName: injury.player?.fullName || 'Unknown',
        teamId: injury.team?.id || 0,
        teamName: injury.team?.name || 'Unknown',
        injuryType: injury.injuryType || 'Unknown',
        bodyPart: injury.bodyPart || 'Unknown',
        status: injury.status || 'Unknown',
        dateInjured: injury.date || new Date().toISOString(),
        expectedReturn: injury.expectedReturn
      }));
    } catch (error) {
      console.error('Error fetching MLB injuries:', error);
      return [];
    }
  }

  /**
   * Get game lineup information
   */
  async getGameLineup(gameId: string): Promise<MLBLineup[]> {
    try {
      // Extract MLB game ID from our format (2025-07-21_BAL @ CLE)
      const gamePk = await this.findGamePk(gameId);
      if (!gamePk) {
        return [];
      }

      const data = await this.makeRequest(`/game/${gamePk}/boxscore`);
      const lineups: MLBLineup[] = [];

      // Process both teams
      ['away', 'home'].forEach(side => {
        const team = data.teams?.[side];
        if (!team) return;

        const lineup: MLBLineup = {
          gameId,
          teamId: team.team.id,
          teamName: team.team.name,
          lineup: [],
          pitcher: {
            playerId: 0,
            playerName: 'TBD',
            record: '0-0',
            era: '0.00'
          }
        };

        // Get lineup players
        if (team.batters && Array.isArray(team.batters)) {
          team.batters.slice(0, 9).forEach((playerId: number, index: number) => {
            const player = team.players?.[`ID${playerId}`];
            if (player) {
              lineup.lineup.push({
                playerId,
                playerName: player.person.fullName,
                position: player.position?.abbreviation || 'UNK',
                battingOrder: index + 1
              });
            }
          });
        }

        // Get starting pitcher
        if (team.pitchers && team.pitchers.length > 0) {
          const pitcherId = team.pitchers[0];
          const pitcher = team.players?.[`ID${pitcherId}`];
          if (pitcher) {
            lineup.pitcher = {
              playerId: pitcherId,
              playerName: pitcher.person.fullName,
              record: pitcher.seasonStats?.pitching?.wins + '-' + pitcher.seasonStats?.pitching?.losses || '0-0',
              era: pitcher.seasonStats?.pitching?.era || '0.00'
            };
          }
        }

        lineups.push(lineup);
      });

      return lineups;
    } catch (error) {
      console.error('Error fetching game lineup:', error);
      return [];
    }
  }

  /**
   * Get weather conditions for a game
   */
  async getGameWeather(gameId: string): Promise<MLBGameWeather | null> {
    try {
      const gamePk = await this.findGamePk(gameId);
      if (!gamePk) {
        return null;
      }

      const data = await this.makeRequest(`/game/${gamePk}/linescore`);
      
      if (!data.gameInfo?.weather) {
        return null;
      }

      const weather = data.gameInfo.weather;
      return {
        gameId,
        condition: weather.condition || 'Clear',
        temperature: parseInt(weather.temp) || 72,
        wind: {
          speed: parseInt(weather.wind?.split(' ')[0]) || 0,
          direction: weather.wind?.split(' ').slice(1).join(' ') || 'Calm'
        },
        humidity: parseInt(weather.humidity?.replace('%', '')) || 50,
        precipitation: 0 // Not typically provided by MLB API
      };
    } catch (error) {
      console.error('Error fetching game weather:', error);
      return null;
    }
  }

  /**
   * Find MLB game PK from our game ID format
   */
  private async findGamePk(gameId: string): Promise<string | null> {
    try {
      // Extract date from gameId (2025-07-21_BAL @ CLE)
      const dateMatch = gameId.match(/^(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) return null;

      const date = dateMatch[1];
      const data = await this.makeRequest(`/schedule/games/?sportId=1&date=${date}`);
      
      if (!data.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
        return null;
      }

      // Find matching game
      for (const dateItem of data.dates) {
        if (!dateItem.games || !Array.isArray(dateItem.games)) continue;
        
        for (const game of dateItem.games) {
          const awayTeam = game.teams?.away?.team?.abbreviation;
          const homeTeam = game.teams?.home?.team?.abbreviation;
          
          if (gameId.includes(awayTeam) && gameId.includes(homeTeam)) {
            return game.gamePk.toString();
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding game PK:', error);
      return null;
    }
  }

  /**
   * Get API usage statistics
   */
  getUsageStats() {
    return {
      name: 'MLB Stats API',
      endpoint: this.baseUrl,
      requestCount: this.requestCount,
      lastRequest: new Date(this.lastRequestTime).toISOString(),
      status: 'active',
      cost: 'Free',
      rateLimit: 'Very generous',
      features: ['Injuries', 'Lineups', 'Weather', 'Game Data']
    };
  }
}

export const mlbStatsAPI = new MLBStatsAPIService();