/**
 * NBA team name/code mappings (30 teams).
 */

export const NBA_TEAMS: Record<string, string> = {
  ATL: 'Atlanta Hawks', BOS: 'Boston Celtics', BKN: 'Brooklyn Nets',
  CHA: 'Charlotte Hornets', CHI: 'Chicago Bulls', CLE: 'Cleveland Cavaliers',
  DAL: 'Dallas Mavericks', DEN: 'Denver Nuggets', DET: 'Detroit Pistons',
  GS: 'Golden State Warriors', HOU: 'Houston Rockets', IND: 'Indiana Pacers',
  LAC: 'Los Angeles Clippers', LAL: 'Los Angeles Lakers', MEM: 'Memphis Grizzlies',
  MIA: 'Miami Heat', MIL: 'Milwaukee Bucks', MIN: 'Minnesota Timberwolves',
  NO: 'New Orleans Pelicans', NY: 'New York Knicks', OKC: 'Oklahoma City Thunder',
  ORL: 'Orlando Magic', PHI: 'Philadelphia 76ers', PHO: 'Phoenix Suns',
  POR: 'Portland Trail Blazers', SAC: 'Sacramento Kings', SA: 'San Antonio Spurs',
  TOR: 'Toronto Raptors', UTA: 'Utah Jazz', WAS: 'Washington Wizards',
};

// ESPN uses some different codes than Tank01; map when they diverge
const ESPN_CODE: Record<string, string> = {
  BKN: 'bkn', GS: 'gs', NO: 'no', NY: 'ny', SA: 'sa',
  PHO: 'phx', UTA: 'utah',
};

export function getNBATeamName(code: string): string {
  return NBA_TEAMS[code.toUpperCase()] || code;
}

export function getNBATeamLogo(code: string): string {
  const upper = code.toUpperCase();
  const espnCode = ESPN_CODE[upper] || upper.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nba/500/${espnCode}.png`;
}
