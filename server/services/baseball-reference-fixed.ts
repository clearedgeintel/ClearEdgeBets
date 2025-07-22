import fetch from 'node-fetch';

// Interface for Baseball Reference team batting statistics
export interface BaseballReferenceStats {
  team: string;
  batters?: number;
  battingAge?: number;
  runsPerGame?: number;
  games?: number;
  plateAppearances?: number;
  atBats?: number;
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbis?: number;
  stolenBases?: number;
  caughtStealing?: number;
  walks?: number;
  strikeouts?: number;
  battingAverage?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  lastUpdated: Date;
}

// Interface for Baseball Reference team pitching statistics
export interface BaseballReferencePitchingStats {
  team: string;
  pitchers?: number;
  pitchingAge?: number;
  runsAllowedPerGame?: number;
  games?: number;
  gamesStarted?: number;
  completeGames?: number;
  shutouts?: number;
  saves?: number;
  inningsPitched?: number;
  hits?: number;
  runs?: number;
  earnedRuns?: number;
  homeRuns?: number;
  walks?: number;
  intentionalWalks?: number;
  strikeouts?: number;
  hitByPitch?: number;
  balks?: number;
  wildPitches?: number;
  battersFaced?: number;
  era?: number;
  fip?: number;
  whip?: number;
  h9?: number;
  hr9?: number;
  bb9?: number;
  so9?: number;
  so_w?: number;
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
      console.error('Error fetching Baseball Reference batting data:', error);
      return [];
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
      return [];
    }
  }

  private parseTeamBattingStats(html: string): BaseballReferenceStats[] {
    const stats: BaseballReferenceStats[] = [];
    
    try {
      // Look for the team batting table
      const tableStart = html.indexOf('id="teams_standard_batting"');
      if (tableStart === -1) {
        console.warn('Could not find teams_standard_batting table');
        return [];
      }
      
      const tableEnd = html.indexOf('</table>', tableStart);
      if (tableEnd === -1) {
        console.warn('Could not find end of batting table');
        return [];
      }
      
      const tableContent = html.substring(tableStart, tableEnd);
      
      // Simple regex to extract team data rows
      const teamRowRegex = /<tr[^>]*>.*?data-stat="team_name"[^>]*>([^<]+)<.*?<\/tr>/g;
      let match;
      
      while ((match = teamRowRegex.exec(tableContent)) !== null) {
        const teamCode = match[1].trim();
        if (!teamCode || teamCode.length === 0) continue;
        
        // Extract the full row content for this team
        const rowStart = match.index;
        const rowEnd = tableContent.indexOf('</tr>', rowStart) + 5;
        const rowContent = tableContent.substring(rowStart, rowEnd);
        
        // Parse basic stats for this team
        const teamStats: BaseballReferenceStats = {
          team: teamCode,
          games: this.extractStat(rowContent, 'G'),
          runs: this.extractStat(rowContent, 'R'),
          hits: this.extractStat(rowContent, 'H'),
          homeRuns: this.extractStat(rowContent, 'HR'),
          rbis: this.extractStat(rowContent, 'RBI'),
          walks: this.extractStat(rowContent, 'BB'),
          strikeouts: this.extractStat(rowContent, 'SO'),
          battingAverage: this.extractStatFloat(rowContent, 'batting_avg'),
          obp: this.extractStatFloat(rowContent, 'onbase_perc'),
          slg: this.extractStatFloat(rowContent, 'slugging_perc'),
          ops: this.extractStatFloat(rowContent, 'onbase_plus_slugging'),
          runsPerGame: this.extractStatFloat(rowContent, 'R_per_game'),
          lastUpdated: new Date()
        };
        
        stats.push(teamStats);
      }
      
      return stats.filter(stat => stat.team && stat.games && stat.games > 0);
    } catch (error) {
      console.error('Error parsing Baseball Reference batting HTML:', error);
      return [];
    }
  }

  private parseTeamPitchingStats(html: string): BaseballReferencePitchingStats[] {
    const stats: BaseballReferencePitchingStats[] = [];
    
    try {
      // Look for the team pitching table
      const tableStart = html.indexOf('id="teams_standard_pitching"');
      if (tableStart === -1) {
        console.warn('Could not find teams_standard_pitching table');
        return [];
      }
      
      const tableEnd = html.indexOf('</table>', tableStart);
      if (tableEnd === -1) {
        console.warn('Could not find end of pitching table');
        return [];
      }
      
      const tableContent = html.substring(tableStart, tableEnd);
      
      // Simple regex to extract team data rows
      const teamRowRegex = /<tr[^>]*>.*?data-stat="team_name"[^>]*>([^<]+)<.*?<\/tr>/g;
      let match;
      
      while ((match = teamRowRegex.exec(tableContent)) !== null) {
        const teamCode = match[1].trim();
        if (!teamCode || teamCode.length === 0) continue;
        
        // Extract the full row content for this team
        const rowStart = match.index;
        const rowEnd = tableContent.indexOf('</tr>', rowStart) + 5;
        const rowContent = tableContent.substring(rowStart, rowEnd);
        
        // Parse basic stats for this team
        const teamStats: BaseballReferencePitchingStats = {
          team: teamCode,
          games: this.extractStat(rowContent, 'G'),
          gamesStarted: this.extractStat(rowContent, 'GS'),
          completeGames: this.extractStat(rowContent, 'CG'),
          shutouts: this.extractStat(rowContent, 'SHO_cg'),
          saves: this.extractStat(rowContent, 'SV'),
          strikeouts: this.extractStat(rowContent, 'SO'),
          walks: this.extractStat(rowContent, 'BB'),
          hits: this.extractStat(rowContent, 'H'),
          runs: this.extractStat(rowContent, 'R'),
          earnedRuns: this.extractStat(rowContent, 'ER'),
          homeRuns: this.extractStat(rowContent, 'HR'),
          era: this.extractStatFloat(rowContent, 'earned_run_avg'),
          whip: this.extractStatFloat(rowContent, 'whip'),
          so9: this.extractStatFloat(rowContent, 'so_per_9'),
          bb9: this.extractStatFloat(rowContent, 'bb_per_9'),
          hr9: this.extractStatFloat(rowContent, 'hr_per_9'),
          runsAllowedPerGame: this.extractStatFloat(rowContent, 'runs_allowed_per_game'),
          lastUpdated: new Date()
        };
        
        stats.push(teamStats);
      }
      
      return stats.filter(stat => stat.team && stat.games && stat.games > 0);
    } catch (error) {
      console.error('Error parsing Baseball Reference pitching HTML:', error);
      return [];
    }
  }

  private extractStat(html: string, statName: string): number {
    const regex = new RegExp(`data-stat="${statName}"[^>]*>([0-9,]+)<`, 'i');
    const match = html.match(regex);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  private extractStatFloat(html: string, statName: string): number {
    const regex = new RegExp(`data-stat="${statName}"[^>]*>([0-9,.]+)<`, 'i');
    const match = html.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }
}

export const baseballReferenceService = new BaseballReferenceService();