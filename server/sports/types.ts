/**
 * Multi-sport core types — every sport module implements these interfaces.
 */

/** Supported sports */
export type SportKey = 'mlb' | 'nhl' | 'nfl' | 'nba' | 'ncaaf' | 'ncaab';

/** Result of grading a single bet */
export type BetOutcome = 'win' | 'loss' | 'push' | 'void' | 'pending';

/** Structured representation of what a bet is on */
export interface BetSelection {
  betType: 'moneyline' | 'spread' | 'total' | 'prop';
  team?: string;                    // team code for moneyline/spread
  direction?: 'over' | 'under';    // for totals
  line?: number;                    // spread or total line
  odds: number;                     // American odds
  rawSelection: string;             // original text for backward compat
}

/** Minimal game result needed to grade a bet */
export interface GameScore {
  gameId: string;
  sport: SportKey;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'suspended' | 'canceled';
  awayTeam: string;
  homeTeam: string;
  awayTeamCode: string;
  homeTeamCode: string;
  awayScore: number | null;
  homeScore: number | null;
  metadata?: Record<string, unknown>;  // sport-specific (inning, period, quarter, etc.)
}

/** Result from grading a single bet */
export interface GradingResult {
  outcome: BetOutcome;
  payout: number;         // total returned (0 for loss, stake for push, stake+profit for win)
  notes?: string;         // human-readable explanation
}

/** Interface every sport module must implement for bet grading */
export interface BetGrader {
  sport: SportKey;

  /** Grade a single bet against a completed game */
  gradeBet(selection: BetSelection, score: GameScore, stake: number): GradingResult;

  /** Parse a raw selection string into a structured BetSelection */
  parseSelection(rawSelection: string, betType: string, game: GameScore): BetSelection;

  /** Is the game truly final and safe to grade? */
  isGameFinal(score: GameScore): boolean;

  /** Should the game be voided (postponed, canceled, etc.)? */
  isGameVoided(score: GameScore): boolean;
}

/** Full sport module — grading + data fetching */
export interface SportModule {
  sport: SportKey;
  grader: BetGrader;

  /** Fetch today's scoreboard from external API → GameScore[] */
  fetchScoreboard(date: string): Promise<GameScore[]>;

  /** Map external team identifier to internal team name */
  getTeamName(externalCode: string): string;
}
