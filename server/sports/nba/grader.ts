/**
 * NBA Bet Grader — implements BetGrader for basketball.
 * Handles moneyline, point spread, and totals.
 *
 * NBA-specific rules:
 * - Moneyline includes overtime (standard — no regulation-only moneyline)
 * - Spread is point spread (e.g. -7.5); full game including OT
 * - Totals use full-game score including OT
 */

import type { BetGrader, BetSelection, GameScore, GradingResult } from '../types';

export class NBABetGrader implements BetGrader {
  sport = 'nba' as const;

  gradeBet(selection: BetSelection, score: GameScore, stake: number): GradingResult {
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
    if (!sel.team) return { outcome: 'pending', payout: 0, notes: 'No team for moneyline' };

    const teamCode = sel.team.toUpperCase();
    const isAway = teamCode === score.awayTeamCode.toUpperCase() || score.awayTeam.toLowerCase().includes(teamCode.toLowerCase());
    const won = isAway ? awayScore > homeScore : homeScore > awayScore;

    if (won) {
      const profit = sel.odds > 0 ? stake * (sel.odds / 100) : stake * (100 / Math.abs(sel.odds));
      return { outcome: 'win', payout: stake + profit, notes: 'Moneyline win' };
    }
    return { outcome: 'loss', payout: 0, notes: 'Moneyline loss' };
  }

  private gradeSpread(sel: BetSelection, awayScore: number, homeScore: number, stake: number, score: GameScore): GradingResult {
    if (!sel.team || sel.line === undefined) return { outcome: 'pending', payout: 0, notes: 'Missing team/line for spread' };

    const teamCode = sel.team.toUpperCase();
    const isAway = teamCode === score.awayTeamCode.toUpperCase() || score.awayTeam.toLowerCase().includes(teamCode.toLowerCase());
    const teamScore = isAway ? awayScore : homeScore;
    const oppScore = isAway ? homeScore : awayScore;
    const adjusted = teamScore + sel.line;

    if (adjusted > oppScore) {
      const profit = sel.odds > 0 ? stake * (sel.odds / 100) : stake * (100 / Math.abs(sel.odds));
      return { outcome: 'win', payout: stake + profit, notes: `Spread win (${teamScore}${sel.line >= 0 ? '+' : ''}${sel.line}=${adjusted} vs ${oppScore})` };
    }
    if (adjusted === oppScore) return { outcome: 'push', payout: stake, notes: 'Spread push' };
    return { outcome: 'loss', payout: 0, notes: 'Spread loss' };
  }

  private gradeTotal(sel: BetSelection, awayScore: number, homeScore: number, stake: number): GradingResult {
    if (!sel.direction || sel.line === undefined) return { outcome: 'pending', payout: 0, notes: 'Missing direction/line for total' };

    const totalPoints = awayScore + homeScore;
    const profit = sel.odds > 0 ? stake * (sel.odds / 100) : stake * (100 / Math.abs(sel.odds));

    if (sel.direction === 'over') {
      if (totalPoints > sel.line) return { outcome: 'win', payout: stake + profit, notes: `Over win (${totalPoints} > ${sel.line})` };
      if (totalPoints === sel.line) return { outcome: 'push', payout: stake, notes: 'Total push' };
      return { outcome: 'loss', payout: 0, notes: `Over loss (${totalPoints} < ${sel.line})` };
    } else {
      if (totalPoints < sel.line) return { outcome: 'win', payout: stake + profit, notes: `Under win (${totalPoints} < ${sel.line})` };
      if (totalPoints === sel.line) return { outcome: 'push', payout: stake, notes: 'Total push' };
      return { outcome: 'loss', payout: 0, notes: `Under loss (${totalPoints} > ${sel.line})` };
    }
  }

  parseSelection(rawSelection: string, betType: string, _game: GameScore): BetSelection {
    const raw = rawSelection.trim();
    const bt = betType.toLowerCase();

    if (bt === 'moneyline' || bt === 'ml') {
      const team = raw.replace(/\s*ML\s*/i, '').replace(/\s*[+-]\d+\s*$/, '').trim();
      const oddsMatch = raw.match(/([+-]\d+)/);
      return { betType: 'moneyline', team, odds: oddsMatch ? parseInt(oddsMatch[1]) : 0, rawSelection: raw };
    }

    if (bt === 'spread' || bt === 'pointspread' || bt === 'point spread') {
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

    return { betType: 'moneyline', team: raw, odds: 0, rawSelection: raw };
  }

  isGameFinal(score: GameScore): boolean {
    return score.status === 'final';
  }

  isGameVoided(score: GameScore): boolean {
    return ['postponed', 'suspended', 'canceled'].includes(score.status);
  }
}
