// MLB Team Lookup Table
export const MLB_TEAMS = {
  // American League East
  'BAL': { name: 'Baltimore Orioles', city: 'Baltimore', abbreviation: 'BAL', division: 'AL East' },
  'BOS': { name: 'Boston Red Sox', city: 'Boston', abbreviation: 'BOS', division: 'AL East' },
  'NYY': { name: 'New York Yankees', city: 'New York', abbreviation: 'NYY', division: 'AL East' },
  'TB': { name: 'Tampa Bay Rays', city: 'Tampa Bay', abbreviation: 'TB', division: 'AL East' },
  'TOR': { name: 'Toronto Blue Jays', city: 'Toronto', abbreviation: 'TOR', division: 'AL East' },
  
  // American League Central
  'CWS': { name: 'Chicago White Sox', city: 'Chicago', abbreviation: 'CWS', division: 'AL Central' },
  'CHW': { name: 'Chicago White Sox', city: 'Chicago', abbreviation: 'CHW', division: 'AL Central' },
  'CLE': { name: 'Cleveland Guardians', city: 'Cleveland', abbreviation: 'CLE', division: 'AL Central' },
  'DET': { name: 'Detroit Tigers', city: 'Detroit', abbreviation: 'DET', division: 'AL Central' },
  'KC': { name: 'Kansas City Royals', city: 'Kansas City', abbreviation: 'KC', division: 'AL Central' },
  'MIN': { name: 'Minnesota Twins', city: 'Minnesota', abbreviation: 'MIN', division: 'AL Central' },
  
  // American League West
  'HOU': { name: 'Houston Astros', city: 'Houston', abbreviation: 'HOU', division: 'AL West' },
  'LAA': { name: 'Los Angeles Angels', city: 'Los Angeles', abbreviation: 'LAA', division: 'AL West' },
  'OAK': { name: 'Oakland Athletics', city: 'Oakland', abbreviation: 'OAK', division: 'AL West' },
  'SEA': { name: 'Seattle Mariners', city: 'Seattle', abbreviation: 'SEA', division: 'AL West' },
  'TEX': { name: 'Texas Rangers', city: 'Texas', abbreviation: 'TEX', division: 'AL West' },
  
  // National League East
  'ATL': { name: 'Atlanta Braves', city: 'Atlanta', abbreviation: 'ATL', division: 'NL East' },
  'MIA': { name: 'Miami Marlins', city: 'Miami', abbreviation: 'MIA', division: 'NL East' },
  'NYM': { name: 'New York Mets', city: 'New York', abbreviation: 'NYM', division: 'NL East' },
  'PHI': { name: 'Philadelphia Phillies', city: 'Philadelphia', abbreviation: 'PHI', division: 'NL East' },
  'WSH': { name: 'Washington Nationals', city: 'Washington', abbreviation: 'WSH', division: 'NL East' },
  'WSN': { name: 'Washington Nationals', city: 'Washington', abbreviation: 'WSN', division: 'NL East' },
  
  // National League Central
  'CHC': { name: 'Chicago Cubs', city: 'Chicago', abbreviation: 'CHC', division: 'NL Central' },
  'CIN': { name: 'Cincinnati Reds', city: 'Cincinnati', abbreviation: 'CIN', division: 'NL Central' },
  'MIL': { name: 'Milwaukee Brewers', city: 'Milwaukee', abbreviation: 'MIL', division: 'NL Central' },
  'PIT': { name: 'Pittsburgh Pirates', city: 'Pittsburgh', abbreviation: 'PIT', division: 'NL Central' },
  'STL': { name: 'St. Louis Cardinals', city: 'St. Louis', abbreviation: 'STL', division: 'NL Central' },
  
  // National League West
  'ARI': { name: 'Arizona Diamondbacks', city: 'Arizona', abbreviation: 'ARI', division: 'NL West' },
  'COL': { name: 'Colorado Rockies', city: 'Colorado', abbreviation: 'COL', division: 'NL West' },
  'LAD': { name: 'Los Angeles Dodgers', city: 'Los Angeles', abbreviation: 'LAD', division: 'NL West' },
  'SD': { name: 'San Diego Padres', city: 'San Diego', abbreviation: 'SD', division: 'NL West' },
  'SF': { name: 'San Francisco Giants', city: 'San Francisco', abbreviation: 'SF', division: 'NL West' }
} as const;

export type TeamCode = keyof typeof MLB_TEAMS;

export function getTeamName(teamCode: string): string {
  const team = MLB_TEAMS[teamCode as TeamCode];
  return team ? team.name : teamCode;
}

export function getTeamCity(teamCode: string): string {
  const team = MLB_TEAMS[teamCode as TeamCode];
  return team ? team.city : teamCode;
}

export function getTeamDivision(teamCode: string): string {
  const team = MLB_TEAMS[teamCode as TeamCode];
  return team ? team.division : 'Unknown';
}

export function getAllTeams() {
  return Object.entries(MLB_TEAMS).map(([code, team]) => ({
    code,
    ...team
  }));
}

// Function to match team codes from different sources
export function normalizeTeamCode(teamCode: string): string {
  // Handle common variations
  const codeMap: Record<string, string> = {
    'WSN': 'WSH', // Washington Nationals sometimes appears as WSN
    'CHW': 'CWS', // Chicago White Sox sometimes appears as CHW
    'LAD': 'LAD', // Los Angeles Dodgers
    'LAA': 'LAA', // Los Angeles Angels
    'SD': 'SD',   // San Diego Padres
    'SF': 'SF'    // San Francisco Giants
  };
  
  return codeMap[teamCode.toUpperCase()] || teamCode.toUpperCase();
}