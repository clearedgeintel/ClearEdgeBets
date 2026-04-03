/**
 * MLB Ballpark Run Factors (2024 season)
 * Values represent runs scored relative to league average (1.00 = average).
 * > 1.0 = hitter-friendly, < 1.0 = pitcher-friendly.
 * Source: Baseball Reference multi-year park factor data.
 */
export interface ParkFactor {
  factor: number;        // e.g. 1.08 = 8% more runs than average
  label: string;         // "Hitter-Friendly" | "Neutral" | "Pitcher-Friendly"
  venue: string;
}

const PARK_FACTORS: Record<string, ParkFactor> = {
  ARI: { factor: 0.98, label: 'Neutral',           venue: 'Chase Field' },
  ATL: { factor: 0.97, label: 'Neutral',           venue: 'Truist Park' },
  BAL: { factor: 1.02, label: 'Neutral',           venue: 'Oriole Park at Camden Yards' },
  BOS: { factor: 1.06, label: 'Hitter-Friendly',   venue: 'Fenway Park' },
  CHC: { factor: 1.08, label: 'Hitter-Friendly',   venue: 'Wrigley Field' },
  CHW: { factor: 0.96, label: 'Pitcher-Friendly',  venue: 'Guaranteed Rate Field' },
  CIN: { factor: 1.07, label: 'Hitter-Friendly',   venue: 'Great American Ball Park' },
  CLE: { factor: 0.95, label: 'Pitcher-Friendly',  venue: 'Progressive Field' },
  COL: { factor: 1.20, label: 'Hitter-Friendly',   venue: 'Coors Field' },
  DET: { factor: 0.98, label: 'Neutral',           venue: 'Comerica Park' },
  HOU: { factor: 0.95, label: 'Pitcher-Friendly',  venue: 'Minute Maid Park' },
  KC:  { factor: 0.98, label: 'Neutral',           venue: 'Kauffman Stadium' },
  LAA: { factor: 0.97, label: 'Neutral',           venue: 'Angel Stadium' },
  LAD: { factor: 0.94, label: 'Pitcher-Friendly',  venue: 'Dodger Stadium' },
  MIA: { factor: 0.93, label: 'Pitcher-Friendly',  venue: 'loanDepot park' },
  MIL: { factor: 0.98, label: 'Neutral',           venue: 'American Family Field' },
  MIN: { factor: 0.97, label: 'Neutral',           venue: 'Target Field' },
  NYM: { factor: 1.00, label: 'Neutral',           venue: 'Citi Field' },
  NYY: { factor: 1.02, label: 'Neutral',           venue: 'Yankee Stadium' },
  OAK: { factor: 0.94, label: 'Pitcher-Friendly',  venue: 'Oakland Coliseum' },
  PHI: { factor: 1.04, label: 'Hitter-Friendly',   venue: 'Citizens Bank Park' },
  PIT: { factor: 0.98, label: 'Neutral',           venue: 'PNC Park' },
  SD:  { factor: 0.93, label: 'Pitcher-Friendly',  venue: 'Petco Park' },
  SEA: { factor: 0.92, label: 'Pitcher-Friendly',  venue: 'T-Mobile Park' },
  SF:  { factor: 0.89, label: 'Pitcher-Friendly',  venue: 'Oracle Park' },
  STL: { factor: 0.97, label: 'Neutral',           venue: 'Busch Stadium' },
  TB:  { factor: 0.97, label: 'Neutral',           venue: 'Tropicana Field' },
  TEX: { factor: 0.99, label: 'Neutral',           venue: 'Globe Life Field' },
  TOR: { factor: 1.02, label: 'Neutral',           venue: 'Rogers Centre' },
  WSH: { factor: 0.99, label: 'Neutral',           venue: 'Nationals Park' },
};

export function getParkFactor(teamCode: string): ParkFactor | null {
  return PARK_FACTORS[teamCode.toUpperCase()] ?? null;
}
