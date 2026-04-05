import { describe, it, expect } from 'vitest';
import { MLBBetGrader } from '../../server/sports/mlb/grader';
import type { GameScore, BetSelection } from '../../server/sports/types';

const grader = new MLBBetGrader();

const finalGame: GameScore = {
  gameId: 'NYY@BOS', sport: 'mlb', status: 'final',
  awayTeam: 'New York Yankees', homeTeam: 'Boston Red Sox',
  awayTeamCode: 'NYY', homeTeamCode: 'BOS',
  awayScore: 5, homeScore: 3,
};

const tiedGame: GameScore = { ...finalGame, awayScore: 4, homeScore: 4 };
const postponedGame: GameScore = { ...finalGame, status: 'postponed', awayScore: null, homeScore: null };
const liveGame: GameScore = { ...finalGame, status: 'live' };
const shutoutGame: GameScore = { ...finalGame, awayScore: 0, homeScore: 3 };

describe('MLBBetGrader', () => {
  describe('isGameFinal / isGameVoided', () => {
    it('final game is final', () => expect(grader.isGameFinal(finalGame)).toBe(true));
    it('live game is not final', () => expect(grader.isGameFinal(liveGame)).toBe(false));
    it('postponed game is voided', () => expect(grader.isGameVoided(postponedGame)).toBe(true));
    it('final game is not voided', () => expect(grader.isGameVoided(finalGame)).toBe(false));
  });

  describe('Moneyline', () => {
    it('away team wins moneyline', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'NYY', odds: -130, rawSelection: 'NYY ML' };
      const result = grader.gradeBet(sel, finalGame, 100);
      expect(result.outcome).toBe('win');
      expect(result.payout).toBeGreaterThan(100);
    });

    it('home team loses moneyline', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'BOS', odds: +110, rawSelection: 'BOS ML' };
      const result = grader.gradeBet(sel, finalGame, 100);
      expect(result.outcome).toBe('loss');
      expect(result.payout).toBe(0);
    });

    it('+150 underdog payout is correct', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'NYY', odds: 150, rawSelection: 'NYY ML' };
      const result = grader.gradeBet(sel, finalGame, 100);
      expect(result.outcome).toBe('win');
      expect(result.payout).toBeCloseTo(250); // 100 stake + 150 profit
    });

    it('-200 favorite payout is correct', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'NYY', odds: -200, rawSelection: 'NYY ML' };
      const result = grader.gradeBet(sel, finalGame, 100);
      expect(result.outcome).toBe('win');
      expect(result.payout).toBeCloseTo(150); // 100 stake + 50 profit
    });

    it('shutout away team loses', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'NYY', odds: -130, rawSelection: 'NYY ML' };
      const result = grader.gradeBet(sel, shutoutGame, 100);
      expect(result.outcome).toBe('loss');
    });
  });

  describe('Spread (Runline)', () => {
    it('away -1.5 wins when ahead by 2+', () => {
      const sel: BetSelection = { betType: 'spread', team: 'NYY', line: -1.5, odds: +125, rawSelection: 'NYY -1.5' };
      const result = grader.gradeBet(sel, finalGame, 100); // 5-3 = +2
      expect(result.outcome).toBe('win');
    });

    it('away -1.5 loses when ahead by exactly 1', () => {
      const game = { ...finalGame, awayScore: 4, homeScore: 3 };
      const sel: BetSelection = { betType: 'spread', team: 'NYY', line: -1.5, odds: +125, rawSelection: 'NYY -1.5' };
      const result = grader.gradeBet(sel, game, 100); // 4-3 = +1, 4-1.5=2.5 vs 3
      expect(result.outcome).toBe('loss');
    });

    it('home +1.5 wins when losing by 1', () => {
      const game = { ...finalGame, awayScore: 4, homeScore: 3 };
      const sel: BetSelection = { betType: 'spread', team: 'BOS', line: 1.5, odds: -150, rawSelection: 'BOS +1.5' };
      const result = grader.gradeBet(sel, game, 100); // 3+1.5=4.5 vs 4
      expect(result.outcome).toBe('win');
    });

    it('push on integer line', () => {
      const game = { ...finalGame, awayScore: 5, homeScore: 3 };
      const sel: BetSelection = { betType: 'spread', team: 'NYY', line: -2, odds: -110, rawSelection: 'NYY -2' };
      const result = grader.gradeBet(sel, game, 100); // 5-2=3 vs 3
      expect(result.outcome).toBe('push');
      expect(result.payout).toBe(100);
    });
  });

  describe('Totals (Over/Under)', () => {
    it('over wins when total exceeds line', () => {
      const sel: BetSelection = { betType: 'total', direction: 'over', line: 7.5, odds: -110, rawSelection: 'Over 7.5' };
      const result = grader.gradeBet(sel, finalGame, 100); // 5+3=8 > 7.5
      expect(result.outcome).toBe('win');
    });

    it('under wins when total below line', () => {
      const sel: BetSelection = { betType: 'total', direction: 'under', line: 9.5, odds: -110, rawSelection: 'Under 9.5' };
      const result = grader.gradeBet(sel, finalGame, 100); // 8 < 9.5
      expect(result.outcome).toBe('win');
    });

    it('over loses when total below line', () => {
      const sel: BetSelection = { betType: 'total', direction: 'over', line: 9.5, odds: -110, rawSelection: 'Over 9.5' };
      const result = grader.gradeBet(sel, finalGame, 100); // 8 < 9.5
      expect(result.outcome).toBe('loss');
    });

    it('push on exact total', () => {
      const sel: BetSelection = { betType: 'total', direction: 'over', line: 8, odds: -110, rawSelection: 'Over 8' };
      const result = grader.gradeBet(sel, finalGame, 100); // 8 = 8
      expect(result.outcome).toBe('push');
      expect(result.payout).toBe(100);
    });
  });

  describe('Void / Pending', () => {
    it('postponed game returns void with stake', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'NYY', odds: -130, rawSelection: 'NYY ML' };
      const result = grader.gradeBet(sel, postponedGame, 100);
      expect(result.outcome).toBe('void');
      expect(result.payout).toBe(100);
    });

    it('live game returns pending', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'NYY', odds: -130, rawSelection: 'NYY ML' };
      const result = grader.gradeBet(sel, liveGame, 100);
      expect(result.outcome).toBe('pending');
    });
  });

  describe('parseSelection', () => {
    it('parses moneyline', () => {
      const sel = grader.parseSelection('NYY ML', 'moneyline', finalGame);
      expect(sel.betType).toBe('moneyline');
      expect(sel.team).toBe('NYY');
    });

    it('parses spread with line', () => {
      const sel = grader.parseSelection('BOS +1.5', 'runline', finalGame);
      expect(sel.betType).toBe('spread');
      expect(sel.team).toBe('BOS');
      expect(sel.line).toBe(1.5);
    });

    it('parses over total', () => {
      const sel = grader.parseSelection('Over 8.5', 'total', finalGame);
      expect(sel.betType).toBe('total');
      expect(sel.direction).toBe('over');
      expect(sel.line).toBe(8.5);
    });

    it('parses under total', () => {
      const sel = grader.parseSelection('Under 7.5 (-110)', 'total', finalGame);
      expect(sel.betType).toBe('total');
      expect(sel.direction).toBe('under');
      expect(sel.line).toBe(7.5);
      expect(sel.odds).toBe(-110);
    });
  });
});
