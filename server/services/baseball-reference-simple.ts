import fetch from 'node-fetch';

export interface BaseballReferenceStats {
  team: string;
  games?: number;
  runs?: number;
  hits?: number;
  homeRuns?: number;
  rbis?: number;
  walks?: number;
  strikeouts?: number;
  battingAverage?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  runsPerGame?: number;
  lastUpdated: Date;
}

export interface BaseballReferencePitchingStats {
  team: string;
  games?: number;
  era?: number;
  whip?: number;
  strikeouts?: number;
  walks?: number;
  saves?: number;
  runsAllowedPerGame?: number;
  lastUpdated: Date;
}

export class BaseballReferenceService {
  private baseUrl = 'https://www.baseball-reference.com';

  async fetchTeamBattingStats(): Promise<BaseballReferenceStats[]> {
    try {
      console.log('Fetching Baseball Reference team batting stats...');
      
      const response = await fetch(`${this.baseUrl}/leagues/majors/2025-standard-batting.shtml`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log(`Fetched ${html.length} chars of HTML`);
      
      const stats: BaseballReferenceStats[] = [];
      
      // Extract team data from HTML using simple string methods
      const teamNames = [
        'Arizona Diamondbacks', 'Athletics', 'Atlanta Braves', 'Baltimore Orioles', 
        'Boston Red Sox', 'Chicago Cubs', 'Chicago White Sox', 'Cincinnati Reds',
        'Cleveland Guardians', 'Colorado Rockies', 'Detroit Tigers', 'Houston Astros',
        'Kansas City Royals', 'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins',
        'Milwaukee Brewers', 'Minnesota Twins', 'New York Mets', 'New York Yankees',
        'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres', 
        'San Francisco Giants', 'Seattle Mariners', 'St. Louis Cardinals',
        'Tampa Bay Rays', 'Texas Rangers', 'Toronto Blue Jays', 'Washington Nationals'
      ];
      
      for (const teamName of teamNames) {
        try {
          const teamIndex = html.indexOf(`>${teamName}</`);
          if (teamIndex === -1) continue;
          
          // Find the row containing this team
          const rowStart = html.lastIndexOf('<tr', teamIndex);
          const rowEnd = html.indexOf('</tr>', teamIndex);
          
          if (rowStart === -1 || rowEnd === -1) continue;
          
          const rowHtml = html.substring(rowStart, rowEnd + 5);
          
          // Extract basic stats
          const games = this.extractNumber(rowHtml, 'data-stat="G"');
          const runs = this.extractNumber(rowHtml, 'data-stat="R"');
          const hits = this.extractNumber(rowHtml, 'data-stat="H"');
          const homeRuns = this.extractNumber(rowHtml, 'data-stat="HR"');
          const ops = this.extractFloat(rowHtml, 'data-stat="onbase_plus_slugging"');
          
          if (games > 0) {
            stats.push({
              team: this.getTeamCode(teamName),
              games,
              runs,
              hits,
              homeRuns,
              ops,
              runsPerGame: runs / games,
              lastUpdated: new Date()
            });
          }
        } catch (error) {
          console.warn(`Error parsing team ${teamName}:`, error);
        }
      }
      
      console.log(`Successfully parsed batting stats for ${stats.length} teams`);
      return stats;
      
    } catch (error) {
      console.error('Error fetching Baseball Reference batting data:', error);
      return [];
    }
  }

  async fetchTeamPitchingStats(): Promise<BaseballReferencePitchingStats[]> {
    try {
      console.log('Fetching Baseball Reference team pitching stats...');
      
      const response = await fetch(`${this.baseUrl}/leagues/majors/2025-standard-pitching.shtml`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const stats: BaseballReferencePitchingStats[] = [];
      
      const teamNames = [
        'Arizona Diamondbacks', 'Athletics', 'Atlanta Braves', 'Baltimore Orioles', 
        'Boston Red Sox', 'Chicago Cubs', 'Chicago White Sox', 'Cincinnati Reds',
        'Cleveland Guardians', 'Colorado Rockies', 'Detroit Tigers', 'Houston Astros',
        'Kansas City Royals', 'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins',
        'Milwaukee Brewers', 'Minnesota Twins', 'New York Mets', 'New York Yankees',
        'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres', 
        'San Francisco Giants', 'Seattle Mariners', 'St. Louis Cardinals',
        'Tampa Bay Rays', 'Texas Rangers', 'Toronto Blue Jays', 'Washington Nationals'
      ];
      
      for (const teamName of teamNames) {
        try {
          const teamIndex = html.indexOf(`>${teamName}</`);
          if (teamIndex === -1) continue;
          
          const rowStart = html.lastIndexOf('<tr', teamIndex);
          const rowEnd = html.indexOf('</tr>', teamIndex);
          
          if (rowStart === -1 || rowEnd === -1) continue;
          
          const rowHtml = html.substring(rowStart, rowEnd + 5);
          
          const games = this.extractNumber(rowHtml, 'data-stat="G"');
          const era = this.extractFloat(rowHtml, 'data-stat="earned_run_avg"');
          const whip = this.extractFloat(rowHtml, 'data-stat="whip"');
          const saves = this.extractNumber(rowHtml, 'data-stat="SV"');
          
          if (games > 0) {
            stats.push({
              team: this.getTeamCode(teamName),
              games,
              era,
              whip,
              saves,
              lastUpdated: new Date()
            });
          }
        } catch (error) {
          console.warn(`Error parsing pitching team ${teamName}:`, error);
        }
      }
      
      console.log(`Successfully parsed pitching stats for ${stats.length} teams`);
      return stats;
      
    } catch (error) {
      console.error('Error fetching Baseball Reference pitching data:', error);
      return [];
    }
  }

  private extractNumber(html: string, pattern: string): number {
    const regex = new RegExp(`${pattern}[^>]*>([0-9,]+)`, 'i');
    const match = html.match(regex);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
  }

  private extractFloat(html: string, pattern: string): number {
    const regex = new RegExp(`${pattern}[^>]*>([0-9,.]+)`, 'i');
    const match = html.match(regex);
    return match ? parseFloat(match[1]) : 0.0;
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