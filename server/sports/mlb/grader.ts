/**
 * MLB Bet Grader — implements BetGrader for baseball.
 * Handles moneyline, runline (spread), and totals.
 */

import type { BetGrader, BetSelection, GameScore, GradingResult, BetOutcome } from '../types';

export class MLBBetGrader implements BetGrader {
  sport = 'mlb' as const;

  gradeBet(selection: BetSelection, score: GameScore, stake: number): GradingResult {
    // Void check first
    if (this.isGameVoided(score)) {
      return { outcome: 'void', payout: stake, notes: `Game ${score.status} — stake returned` };
    }
    if (!this.isGameFinal(score)) {
      return { outcome: 'pending', payout: 0, notes: 'Game not final' };
    }

    const awayScore = score.awayScore ?? 0;
    const homeScore = score.homeScore ?? 0;

    switch (selection.betType) {
      case 'moneyline':
        return this.gradeMoneyline(selection, awayScore, homeScore, stake, score);

      case 'spread':
        return this.gradeSpread(selection, awayScore, homeScore, stake, score);

      case 'total':
        return this.gradeTotal(selection, awayScore, homeScore, stake);

      default:
        return { outcome: 'pending', payout: 0, notes: `Unknown bet type: ${selection.betType}` };
    }
  }

  private gradeMoneyline(sel: BetSelection, awayScore: number, homeScore: number, stake: number, score: GameScore): GradingResult {
    if (!sel.team) return { outcome: 'pending', payout: 0, notes: 'No team specified for moneyline' };

    const teamCode = sel.team.toUpperCase();
    const isAway = teamCode === score.awayTeamCode.toUpperCase();
    const isHome = teamCode === score.homeTeamCode.toUpperCase();

    if (!isAway && !isHome) {
      // Try name match
      const pickedAway = score.awayTeam.toLowerCase().includes(teamCode.toLowerCase());
      const pickedHome = score.homeTeam.toLowerCase().includes(teamCode.toLowerCase());
      if (pickedAway) return this.resolveML(awayScore > homeScore, stake, sel.odds);
      if (pickedHome) return this.resolveML(homeScore > awayScore, stake, sel.odds);
      return { outcome: 'pending', payout: 0, notes: `Could not match team: ${sel.team}` };
    }

    const won = isAway ? awayScore > homeScore : homeScore > awayScore;
    return this.resolveML(won, stake, sel.odds);
  }

  private resolveML(won: boolean, stake: number, odds: number): GradingResult {
    if (won) {
      const profit = odds > 0 ? stake * (odds / 100) : stake * (100 / Math.abs(odds));
      return { outcome: 'win', payout: stake + profit, notes: 'Moneyline win' };
    }
    return { outcome: 'loss', payout: 0, notes: 'Moneyline loss' };
  }

  private gradeSpread(sel: BetSelection, awayScore: number, homeScore: number, stake: number, score: GameScore): GradingResult {
    if (!sel.team || sel.line === undefined) return { outcome: 'pending', payout: 0, notes: 'Missing team or line for spread' };

    const teamCode = sel.team.toUpperCase();
    const isAway = teamCode === score.awayTeamCode.toUpperCase() || score.awayTeam.toLowerCase().includes(teamCode.toLowerCase());

    const teamScore = isAway ? awayScore : homeScore;
    const oppScore = isAway ? homeScore : awayScore;
    const adjusted = teamScore + sel.line;

    if (adjusted > oppScore) {
      const profit = sel.odds > 0 ? stake * (sel.odds / 100) : stake * (100 / Math.abs(sel.odds));
      return { outcome: 'win', payout: stake + profit, notes: `Spread win (${teamScore} + ${sel.line} = ${adjusted} vs ${oppScore})` };
    }
    if (adjusted === oppScore) {
      return { outcome: 'push', payout: stake, notes: 'Spread push' };
    }
    return { outcome: 'loss', payout: 0, notes: `Spread loss (${teamScore} + ${sel.line} = ${adjusted} vs ${oppScore})` };
  }

  private gradeTotal(sel: BetSelection, awayScore: number, homeScore: number, stake: number): GradingResult {
    if (!sel.direction || sel.line === undefined) return { outcome: 'pending', payout: 0, notes: 'Missing direction or line for total' };

    const totalRuns = awayScore + homeScore;

    if (sel.direction === 'over') {
      if (totalRuns > sel.line) {
        const profit = sel.odds > 0 ? stake * (sel.odds / 100) : stake * (100 / Math.abs(sel.odds));
        return { outcome: 'win', payout: stake + profit, notes: `Over win (${totalRuns} > ${sel.line})` };
      }
      if (totalRuns === sel.line) return { outcome: 'push', payout: stake, notes: 'Total push' };
      return { outcome: 'loss', payout: 0, notes: `Over loss (${totalRuns} < ${sel.line})` };
    } else {
      if (totalRuns < sel.line) {
        const profit = sel.odds > 0 ? stake * (sel.odds / 100) : stake * (100 / Math.abs(sel.odds));
        return { outcome: 'win', payout: stake + profit, notes: `Under win (${totalRuns} < ${sel.line})` };
      }
      if (totalRuns === sel.line) return { outcome: 'push', payout: stake, notes: 'Total push' };
      return { outcome: 'loss', payout: 0, notes: `Under loss (${totalRuns} > ${sel.line})` };
    }
  }

  parseSelection(rawSelection: string, betType: string, game: GameScore): BetSelection {
    const raw = rawSelection.trim();
    const bt = betType.toLowerCase();

    if (bt === 'moneyline' || bt === 'ml') {
      // "NYY ML", "Yankees", "NYY ML -130"
      const team = raw.replace(/\s*ML\s*/i, '').replace(/\s*[+-]\d+\s*$/, '').trim();
      const oddsMatch = raw.match(/([+-]\d+)/);
      return { betType: 'moneyline', team, odds: oddsMatch ? parseInt(oddsMatch[1]) : 0, rawSelection: raw };
    }

    if (bt === 'spread' || bt === 'runline') {
      // "NYY -1.5", "BOS +1.5 (+125)"
      const match = raw.match(/([A-Za-z]+)\s*([+-][\d.]+)/);
      const oddsMatch = raw.match(/\(([+-]\d+)\)/);
      return {
        betType: 'spread',
        team: match?.[1] || '',
        line: match ? parseFloat(match[2]) : 0,
        odds: oddsMatch ? parseInt(oddsMatch[1]) : -110,
        rawSelection: raw,
      };
    }

    if (bt === 'total' || bt === 'over' || bt === 'under') {
      // "Over 8.5", "Under 8.5 (-110)"
      const match = raw.match(/(over|under)\s*([\d.]+)/i);
      const oddsMatch = raw.match(/\(([+-]\d+)\)/);
      return {
        betType: 'total',
        direction: match?.[1]?.toLowerCase() as 'over' | 'under' || 'over',
        line: match ? parseFloat(match[2]) : 0,
        odds: oddsMatch ? parseInt(oddsMatch[1]) : -110,
        rawSelection: raw,
      };
    }

    // Fallback
    return { betType: 'moneyline', team: raw, odds: 0, rawSelection: raw };
  }

  isGameFinal(score: GameScore): boolean {
    return score.status === 'final';
  }

  isGameVoided(score: GameScore): boolean {
    return ['postponed', 'suspended', 'canceled'].includes(score.status);
  }
}
