/**
 * NHL Team name/code mappings.
 */

export const NHL_TEAMS: Record<string, string> = {
  ANA: 'Anaheim Ducks', ARI: 'Arizona Coyotes', BOS: 'Boston Bruins',
  BUF: 'Buffalo Sabres', CGY: 'Calgary Flames', CAR: 'Carolina Hurricanes',
  CHI: 'Chicago Blackhawks', COL: 'Colorado Avalanche', CBJ: 'Columbus Blue Jackets',
  DAL: 'Dallas Stars', DET: 'Detroit Red Wings', EDM: 'Edmonton Oilers',
  FLA: 'Florida Panthers', LA: 'Los Angeles Kings', MIN: 'Minnesota Wild',
  MTL: 'Montreal Canadiens', NSH: 'Nashville Predators', NJ: 'New Jersey Devils',
  NYI: 'New York Islanders', NYR: 'New York Rangers', OTT: 'Ottawa Senators',
  PHI: 'Philadelphia Flyers', PIT: 'Pittsburgh Penguins', SJ: 'San Jose Sharks',
  SEA: 'Seattle Kraken', STL: 'St. Louis Blues', TB: 'Tampa Bay Lightning',
  TOR: 'Toronto Maple Leafs', UTA: 'Utah Hockey Club', VAN: 'Vancouver Canucks',
  VGK: 'Vegas Golden Knights', WSH: 'Washington Capitals', WPG: 'Winnipeg Jets',
};

export function getNHLTeamName(code: string): string {
  return NHL_TEAMS[code.toUpperCase()] || code;
}

export function getNHLTeamLogo(code: string): string {
  return `https://a.espncdn.com/i/teamlogos/nhl/500/${code.toLowerCase()}.png`;
}
