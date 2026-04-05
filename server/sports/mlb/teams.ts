/**
 * MLB Team name/code mappings.
 */

export const MLB_TEAMS: Record<string, string> = {
  ARI: 'Arizona Diamondbacks', ATL: 'Atlanta Braves', BAL: 'Baltimore Orioles',
  BOS: 'Boston Red Sox', CHC: 'Chicago Cubs', CHW: 'Chicago White Sox',
  CIN: 'Cincinnati Reds', CLE: 'Cleveland Guardians', COL: 'Colorado Rockies',
  DET: 'Detroit Tigers', HOU: 'Houston Astros', KC: 'Kansas City Royals',
  LAA: 'Los Angeles Angels', LAD: 'Los Angeles Dodgers', MIA: 'Miami Marlins',
  MIL: 'Milwaukee Brewers', MIN: 'Minnesota Twins', NYM: 'New York Mets',
  NYY: 'New York Yankees', OAK: 'Oakland Athletics', PHI: 'Philadelphia Phillies',
  PIT: 'Pittsburgh Pirates', SD: 'San Diego Padres', SEA: 'Seattle Mariners',
  SF: 'San Francisco Giants', STL: 'St. Louis Cardinals', TB: 'Tampa Bay Rays',
  TEX: 'Texas Rangers', TOR: 'Toronto Blue Jays', WSH: 'Washington Nationals',
};

export function getMLBTeamName(code: string): string {
  return MLB_TEAMS[code.toUpperCase()] || code;
}

export function getMLBTeamCode(fullName: string): string | undefined {
  const lower = fullName.toLowerCase();
  for (const [code, name] of Object.entries(MLB_TEAMS)) {
    if (name.toLowerCase() === lower || lower.includes(name.split(' ').pop()!.toLowerCase())) {
      return code;
    }
  }
  return undefined;
}
