// Sport-aware ESPN team logo URL builder.
// MLB: a.espncdn.com/i/teamlogos/mlb/500/scoreboard/{code}.png
// NHL: a.espncdn.com/i/teamlogos/nhl/500/{code}.png
// NBA: a.espncdn.com/i/teamlogos/nba/500/{code}.png
// NFL: a.espncdn.com/i/teamlogos/nfl/500/{code}.png

export type Sport = 'mlb' | 'nhl' | 'nba' | 'nfl';

// MLB-only code remaps (Tank01/our DB code → ESPN code).
const MLB_REMAP: Record<string, string> = { WAS: 'wsh' };

export function teamLogo(code: string | undefined | null, sport: Sport = 'mlb'): string {
  if (!code) return '';
  const upper = code.toUpperCase();
  const c = sport === 'mlb' && MLB_REMAP[upper] ? MLB_REMAP[upper] : code.toLowerCase();
  switch (sport) {
    case 'nhl':
      return `https://a.espncdn.com/i/teamlogos/nhl/500/${c}.png`;
    case 'nba':
      return `https://a.espncdn.com/i/teamlogos/nba/500/${c}.png`;
    case 'nfl':
      return `https://a.espncdn.com/i/teamlogos/nfl/500/${c}.png`;
    case 'mlb':
    default:
      return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${c}.png`;
  }
}
