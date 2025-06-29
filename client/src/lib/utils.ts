import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function calculateImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

export function calculatePotentialWin(stake: number, odds: number): number {
  if (stake <= 0) return 0;
  
  if (odds > 0) {
    return (stake * odds) / 100;
  } else {
    return (stake * 100) / Math.abs(odds);
  }
}

export function americanToDecimal(odds: number): number {
  if (odds > 0) {
    return (odds / 100) + 1;
  } else {
    return (100 / Math.abs(odds)) + 1;
  }
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

export function kellyFormula(odds: number, winProbability: number): number {
  const decimalOdds = americanToDecimal(odds);
  const b = decimalOdds - 1;
  const p = winProbability / 100;
  const q = 1 - p;
  
  return (b * p - q) / b;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatTeamCode(teamName: string): string {
  const codes: Record<string, string> = {
    'New York Yankees': 'NYY',
    'Boston Red Sox': 'BOS',
    'Los Angeles Dodgers': 'LAD',
    'San Francisco Giants': 'SF',
    'Atlanta Braves': 'ATL',
    'Houston Astros': 'HOU',
    'Philadelphia Phillies': 'PHI',
    'San Diego Padres': 'SD',
    'New York Mets': 'NYM',
    'Chicago Cubs': 'CHC',
    'Milwaukee Brewers': 'MIL',
    'St. Louis Cardinals': 'STL',
    'Cincinnati Reds': 'CIN',
    'Pittsburgh Pirates': 'PIT',
    'Arizona Diamondbacks': 'ARI',
    'Colorado Rockies': 'COL',
    'Los Angeles Angels': 'LAA',
    'Seattle Mariners': 'SEA',
    'Texas Rangers': 'TEX',
    'Oakland Athletics': 'OAK',
    'Minnesota Twins': 'MIN',
    'Chicago White Sox': 'CWS',
    'Cleveland Guardians': 'CLE',
    'Detroit Tigers': 'DET',
    'Kansas City Royals': 'KC',
    'Toronto Blue Jays': 'TOR',
    'Baltimore Orioles': 'BAL',
    'Tampa Bay Rays': 'TB',
    'Miami Marlins': 'MIA',
    'Washington Nationals': 'WSH'
  };
  
  return codes[teamName] || teamName.substring(0, 3).toUpperCase();
}
