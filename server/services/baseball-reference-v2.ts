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
      console.log(`HTML length: ${html.length}, Contains teams_standard_batting: ${html.includes('teams_standard_batting')}`);
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
      // Find all team rows in the batting table  
      const rowPattern = /<tr[^>]*>.*?data-stat="team_name".*?<\/tr>/gs;
      const rows = html.match(rowPattern);
      
      console.log(`Found ${rows ? rows.length : 0} potential team rows in batting table`);
      
      if (!rows || rows.length === 0) {
        console.warn('No team rows found in batting table');
        return [];
      }
      
      for (const rowHtml of rows) {
        try {
          // Extract team name from the link text
          const teamNameMatch = rowHtml.match(/data-stat="team_name"[^>]*><a[^>]*>([^<]+)<\/a>/);
          if (!teamNameMatch) continue;
          
          const teamName = teamNameMatch[1].trim();
          if (!teamName) continue;
          
          // Create abbreviated team code from team name
          const teamCode = this.getTeamCode(teamName);
          
          // Extract stats using data-stat attributes
          const teamStats: BaseballReferenceStats = {
            team: teamCode,
            batters: this.extractStatFromHtml(rowHtml, 'batters_used'),
            battingAge: this.extractFloatFromHtml(rowHtml, 'age_bat'),
            runsPerGame: this.extractFloatFromHtml(rowHtml, 'runs_per_game'),
            games: this.extractStatFromHtml(rowHtml, 'G'),
            plateAppearances: this.extractStatFromHtml(rowHtml, 'PA'),
            atBats: this.extractStatFromHtml(rowHtml, 'AB'),
            runs: this.extractStatFromHtml(rowHtml, 'R'),
            hits: this.extractStatFromHtml(rowHtml, 'H'),
            doubles: this.extractStatFromHtml(rowHtml, '2B'),
            triples: this.extractStatFromHtml(rowHtml, '3B'),
            homeRuns: this.extractStatFromHtml(rowHtml, 'HR'),
            rbis: this.extractStatFromHtml(rowHtml, 'RBI'),
            stolenBases: this.extractStatFromHtml(rowHtml, 'SB'),
            caughtStealing: this.extractStatFromHtml(rowHtml, 'CS'),
            walks: this.extractStatFromHtml(rowHtml, 'BB'),
            strikeouts: this.extractStatFromHtml(rowHtml, 'SO'),
            battingAverage: this.extractFloatFromHtml(rowHtml, 'batting_avg'),
            obp: this.extractFloatFromHtml(rowHtml, 'onbase_perc'),
            slg: this.extractFloatFromHtml(rowHtml, 'slugging_perc'),
            ops: this.extractFloatFromHtml(rowHtml, 'onbase_plus_slugging'),
            lastUpdated: new Date()
          };
          
          stats.push(teamStats);
        } catch (parseError) {
          console.warn('Error parsing individual team batting data:', parseError);
          continue;
        }
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
      // Find all team rows in the pitching table
      const rowPattern = /<tr[^>]*>.*?data-stat="team_name".*?<\/tr>/gs;
      const rows = html.match(rowPattern);
      
      if (!rows || rows.length === 0) {
        console.warn('No team rows found in pitching table');
        return [];
      }
      
      for (const rowHtml of rows) {
        try {
          // Extract team name from the link text
          const teamNameMatch = rowHtml.match(/data-stat="team_name"[^>]*><a[^>]*>([^<]+)<\/a>/);
          if (!teamNameMatch) continue;
          
          const teamName = teamNameMatch[1].trim();
          if (!teamName) continue;
          
          // Create abbreviated team code from team name
          const teamCode = this.getTeamCode(teamName);
          
          // Extract stats using data-stat attributes
          const teamStats: BaseballReferencePitchingStats = {
            team: teamCode,
            pitchers: this.extractStatFromHtml(rowHtml, 'pitchers_used'),
            pitchingAge: this.extractFloatFromHtml(rowHtml, 'age_pitch'),
            runsAllowedPerGame: this.extractFloatFromHtml(rowHtml, 'runs_allowed_per_game'),
            games: this.extractStatFromHtml(rowHtml, 'G'),
            gamesStarted: this.extractStatFromHtml(rowHtml, 'GS'),
            completeGames: this.extractStatFromHtml(rowHtml, 'CG'),
            shutouts: this.extractStatFromHtml(rowHtml, 'SHO_cg'),
            saves: this.extractStatFromHtml(rowHtml, 'SV'),
            inningsPitched: this.extractFloatFromHtml(rowHtml, 'IP'),
            hits: this.extractStatFromHtml(rowHtml, 'H'),
            runs: this.extractStatFromHtml(rowHtml, 'R'),
            earnedRuns: this.extractStatFromHtml(rowHtml, 'ER'),
            homeRuns: this.extractStatFromHtml(rowHtml, 'HR'),
            walks: this.extractStatFromHtml(rowHtml, 'BB'),
            strikeouts: this.extractStatFromHtml(rowHtml, 'SO'),
            era: this.extractFloatFromHtml(rowHtml, 'earned_run_avg'),
            whip: this.extractFloatFromHtml(rowHtml, 'whip'),
            so9: this.extractFloatFromHtml(rowHtml, 'so_per_9'),
            bb9: this.extractFloatFromHtml(rowHtml, 'bb_per_9'),
            hr9: this.extractFloatFromHtml(rowHtml, 'hr_per_9'),
            lastUpdated: new Date()
          };
          
          stats.push(teamStats);
        } catch (parseError) {
          console.warn('Error parsing individual team pitching data:', parseError);
          continue;
        }
      }
      
      return stats.filter(stat => stat.team && stat.games && stat.games > 0);
    } catch (error) {
      console.error('Error parsing Baseball Reference pitching HTML:', error);
      return [];
    }
  }

  private extractStatFromHtml(html: string, statName: string): number {
    const regex = new RegExp(`data-stat="${statName}"[^>]*>([0-9,]+)`, 'i');
    const match = html.match(regex);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
  }

  private extractFloatFromHtml(html: string, statName: string): number {
    const regex = new RegExp(`data-stat="${statName}"[^>]*>([0-9,.]+)`, 'i');
    const match = html.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }

  private getTeamCode(teamName: string): string {
    const teamMap: { [key: string]: string } = {
      'Arizona Diamondbacks': 'ARI',
      'Athletics': 'OAK',
      'Atlanta Braves': 'ATL',
      'Baltimore Orioles': 'BAL',
      'Boston Red Sox': 'BOS',
      'Chicago Cubs': 'CHC',
      'Chicago White Sox': 'CHW',
      'Cincinnati Reds': 'CIN',
      'Cleveland Guardians': 'CLE',
      'Colorado Rockies': 'COL',
      'Detroit Tigers': 'DET',
      'Houston Astros': 'HOU',
      'Kansas City Royals': 'KAN',
      'Los Angeles Angels': 'LAA',
      'Los Angeles Dodgers': 'LAD',
      'Miami Marlins': 'MIA',
      'Milwaukee Brewers': 'MIL',
      'Minnesota Twins': 'MIN',
      'New York Mets': 'NYM',
      'New York Yankees': 'NYY',
      'Philadelphia Phillies': 'PHI',
      'Pittsburgh Pirates': 'PIT',
      'San Diego Padres': 'SDP',
      'San Francisco Giants': 'SFG',
      'Seattle Mariners': 'SEA',
      'St. Louis Cardinals': 'STL',
      'Tampa Bay Rays': 'TBR',
      'Texas Rangers': 'TEX',
      'Toronto Blue Jays': 'TOR',
      'Washington Nationals': 'WSN'
    };
    
    return teamMap[teamName] || teamName.substring(0, 3).toUpperCase();
  }
}

export const baseballReferenceService = new BaseballReferenceService();