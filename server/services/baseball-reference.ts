import fetch from 'node-fetch';

export interface BaseballReferenceStats {
  team: string;
  batters: number;
  battingAge: number;
  runsPerGame: number;
  games: number;
  plateAppearances: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbis: number;
  stolenBases: number;
  caughtStealing: number;
  walks: number;
  strikeouts: number;
  battingAverage: number;
  obp: number;
  slg: number;
  ops: number;
  lastUpdated: Date;
}

export interface BaseballReferencePitchingStats {
  team: string;
  pitchers: number;
  pitchingAge: number;
  runsAllowedPerGame: number;
  games: number;
  gamesStarted: number;
  completeGames: number;
  shutouts: number;
  saves: number;
  inningsPitched: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  homeRuns: number;
  walks: number;
  intentionalWalks: number;
  strikeouts: number;
  hitByPitch: number;
  balks: number;
  wildPitches: number;
  battersFaced: number;
  era: number;
  fip: number;
  whip: number;
  h9: number;
  hr9: number;
  bb9: number;
  so9: number;
  so_w: number;
  lastUpdated: Date;
}

export class BaseballReferenceService {
  private baseUrl = 'https://www.baseball-reference.com';

  async fetchTeamBattingStats(): Promise<BaseballReferenceStats[]> {
    try {
      const url = `${this.baseUrl}/leagues/majors/2025-standard-batting.shtml`;
      console.log('Fetching Baseball Reference team batting stats...');
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const stats = this.parseTeamBattingStats(html);
      
      console.log(`Successfully fetched batting stats for ${stats.length} teams`);
      return stats;
    } catch (error) {
      console.error('Error fetching Baseball Reference data:', error);
      throw error;
    }
  }

  async fetchTeamPitchingStats(): Promise<BaseballReferencePitchingStats[]> {
    try {
      const url = `${this.baseUrl}/leagues/majors/2025-standard-pitching.shtml`;
      console.log('Fetching Baseball Reference team pitching stats...');
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const stats = this.parseTeamPitchingStats(html);
      
      console.log(`Successfully fetched pitching stats for ${stats.length} teams`);
      return stats;
    } catch (error) {
      console.error('Error fetching Baseball Reference pitching data:', error);
      throw error;
    }
  }

  private parseTeamBattingStats(html: string): BaseballReferenceStats[] {
    const stats: BaseballReferenceStats[] = [];
    
    try {
      // Extract team batting table data using regex patterns
      const tableRegex = /<table[^>]*id="teams_standard_batting"[^>]*>(.*?)<\/table>/gs;
      const tableMatch = html.match(tableRegex);
      
      if (!tableMatch) {
        console.warn('Could not find teams_standard_batting table');
        return [];
      }

      const tableContent = tableMatch[1];
      
      // Extract table rows
      const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gs;
      const rows = [...tableContent.matchAll(rowRegex)];
      
      for (const row of rows) {
        const rowContent = row[1];
        
        // Skip header rows and divider rows
        if (rowContent.includes('<th') || rowContent.includes('class="thead"')) {
          continue;
        }
        
        // Extract cell data
        const cellRegex = /<td[^>]*data-stat="([^"]*)"[^>]*>([^<]*(?:<[^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/td>/g;
        const cells = [...rowContent.matchAll(cellRegex)];
        
        if (cells.length === 0) continue;
        
        const teamData: any = {};
        cells.forEach(cell => {
          const [, statName, value] = cell;
          teamData[statName] = value.replace(/<[^>]*>/g, '').trim();
        });
        
        // Only process if we have team data
        if (!teamData.team_ID || teamData.team_ID === '') continue;
        
        try {
          const teamStats: BaseballReferenceStats = {
            team: teamData.team_ID || teamData.franchise_ID || 'Unknown',
            batters: parseInt(teamData.batters_used) || 0,
            battingAge: parseFloat(teamData.age_bat) || 0,
            runsPerGame: parseFloat(teamData.R_per_game) || 0,
            games: parseInt(teamData.G) || 0,
            plateAppearances: parseInt(teamData.PA) || 0,
            atBats: parseInt(teamData.AB) || 0,
            runs: parseInt(teamData.R) || 0,
            hits: parseInt(teamData.H) || 0,
            doubles: parseInt(teamData['2B']) || 0,
            triples: parseInt(teamData['3B']) || 0,
            homeRuns: parseInt(teamData.HR) || 0,
            rbis: parseInt(teamData.RBI) || 0,
            stolenBases: parseInt(teamData.SB) || 0,
            caughtStealing: parseInt(teamData.CS) || 0,
            walks: parseInt(teamData.BB) || 0,
            strikeouts: parseInt(teamData.SO) || 0,
            battingAverage: parseFloat(teamData.batting_avg) || 0,
            obp: parseFloat(teamData.onbase_perc) || 0,
            slg: parseFloat(teamData.slugging_perc) || 0,
            ops: parseFloat(teamData.onbase_plus_slugging) || 0,
            lastUpdated: new Date()
          };
          
          stats.push(teamStats);
        } catch (parseError) {
          console.warn(`Error parsing team data:`, parseError);
          continue;
        }
      }
      
      return stats.filter(stat => stat.team && stat.team !== 'Unknown');
    } catch (error) {
      console.error('Error parsing Baseball Reference HTML:', error);
      return [];
    }
  }

  private parseTeamPitchingStats(html: string): BaseballReferencePitchingStats[] {
    const stats: BaseballReferencePitchingStats[] = [];
    
    try {
      // Extract team pitching table data using regex patterns
      const tableRegex = /<table[^>]*id="teams_standard_pitching"[^>]*>(.*?)<\/table>/gs;
      const tableMatch = html.match(tableRegex);
      
      if (!tableMatch) {
        console.warn('Could not find teams_standard_pitching table');
        return [];
      }

      const tableContent = tableMatch[1];
      
      // Extract table rows
      const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gs;
      const rows = [...tableContent.matchAll(rowRegex)];
      
      for (const row of rows) {
        const rowContent = row[1];
        
        // Skip header rows and divider rows
        if (rowContent.includes('<th') || rowContent.includes('class="thead"')) {
          continue;
        }
        
        // Extract cell data
        const cellRegex = /<td[^>]*data-stat="([^"]*)"[^>]*>([^<]*(?:<[^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/td>/g;
        const cells = [...rowContent.matchAll(cellRegex)];
        
        if (cells.length === 0) continue;
        
        const teamData: any = {};
        cells.forEach(cell => {
          const [, statName, value] = cell;
          teamData[statName] = value.replace(/<[^>]*>/g, '').trim();
        });
        
        // Only process if we have team data
        if (!teamData.team_ID || teamData.team_ID === '') continue;
        
        try {
          const teamStats: BaseballReferencePitchingStats = {
            team: teamData.team_ID || teamData.franchise_ID || 'Unknown',
            pitchers: parseInt(teamData.pitchers_used) || 0,
            pitchingAge: parseFloat(teamData.age_pit) || 0,
            runsAllowedPerGame: parseFloat(teamData.RA_per_game) || 0,
            games: parseInt(teamData.G) || 0,
            gamesStarted: parseInt(teamData.GS) || 0,
            completeGames: parseInt(teamData.CG) || 0,
            shutouts: parseInt(teamData.SHO) || 0,
            saves: parseInt(teamData.SV) || 0,
            inningsPitched: parseFloat(teamData.IP) || 0,
            hits: parseInt(teamData.H) || 0,
            runs: parseInt(teamData.R) || 0,
            earnedRuns: parseInt(teamData.ER) || 0,
            homeRuns: parseInt(teamData.HR) || 0,
            walks: parseInt(teamData.BB) || 0,
            intentionalWalks: parseInt(teamData.IBB) || 0,
            strikeouts: parseInt(teamData.SO) || 0,
            hitByPitch: parseInt(teamData.HBP) || 0,
            balks: parseInt(teamData.BK) || 0,
            wildPitches: parseInt(teamData.WP) || 0,
            battersFaced: parseInt(teamData.BF) || 0,
            era: parseFloat(teamData.earned_run_avg) || 0,
            fip: parseFloat(teamData.FIP) || 0,
            whip: parseFloat(teamData.WHIP) || 0,
            h9: parseFloat(teamData.H9) || 0,
            hr9: parseFloat(teamData.HR9) || 0,
            bb9: parseFloat(teamData.BB9) || 0,
            so9: parseFloat(teamData.SO9) || 0,
            so_w: parseFloat(teamData.SO_W) || 0,
            lastUpdated: new Date()
          };
          
          stats.push(teamStats);
        } catch (parseError) {
          console.warn(`Error parsing pitching team data:`, parseError);
          continue;
        }
      }
      
      return stats.filter(stat => stat.team && stat.team !== 'Unknown');
    } catch (error) {
      console.error('Error parsing Baseball Reference pitching HTML:', error);
      return [];
    }
  }
}

export const baseballReferenceService = new BaseballReferenceService();