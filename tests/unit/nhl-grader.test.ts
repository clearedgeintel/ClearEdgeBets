import { describe, it, expect } from 'vitest';
import { NHLBetGrader } from '../../server/sports/nhl/grader';
import type { GameScore, BetSelection } from '../../server/sports/types';

const grader = new NHLBetGrader();

const finalGame: GameScore = {
  gameId: 'VGK@EDM', sport: 'nhl', status: 'final',
  awayTeam: 'Vegas Golden Knights', homeTeam: 'Edmonton Oilers',
  awayTeamCode: 'VGK', homeTeamCode: 'EDM',
  awayScore: 5, homeScore: 1,
};

const closeGame: GameScore = { ...finalGame, awayScore: 3, homeScore: 2, metadata: { overtime: true } };
const postponedGame: GameScore = { ...finalGame, status: 'postponed', awayScore: null, homeScore: null };
const liveGame: GameScore = { ...finalGame, status: 'live' };

describe('NHLBetGrader', () => {
  describe('isGameFinal / isGameVoided', () => {
    it('final game is final', () => expect(grader.isGameFinal(finalGame)).toBe(true));
    it('live game is not final', () => expect(grader.isGameFinal(liveGame)).toBe(false));
    it('postponed game is voided', () => expect(grader.isGameVoided(postponedGame)).toBe(true));
  });

  describe('Moneyline', () => {
    it('away team wins', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'VGK', odds: -150, rawSelection: 'VGK ML' };
      const result = grader.gradeBet(sel, finalGame, 100);
      expect(result.outcome).toBe('win');
      expect(result.payout).toBeGreaterThan(100);
    });

    it('home team loses', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'EDM', odds: +130, rawSelection: 'EDM ML' };
      const result = grader.gradeBet(sel, finalGame, 100);
      expect(result.outcome).toBe('loss');
    });

    it('-150 favorite payout correct', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'VGK', odds: -150, rawSelection: 'VGK ML' };
      const result = grader.gradeBet(sel, finalGame, 150);
      expect(result.payout).toBeCloseTo(250); // 150 + 100
    });

    it('+130 underdog payout correct', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'VGK', odds: 130, rawSelection: 'VGK ML' };
      const result = grader.gradeBet(sel, finalGame, 100);
      expect(result.payout).toBeCloseTo(230); // 100 + 130
    });

    it('OT win counts for moneyline', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'VGK', odds: -120, rawSelection: 'VGK ML' };
      const result = grader.gradeBet(sel, closeGame, 100);
      expect(result.outcome).toBe('win');
    });
  });

  describe('Puck Line (Spread)', () => {
    it('away -1.5 wins on blowout', () => {
      const sel: BetSelection = { betType: 'spread', team: 'VGK', line: -1.5, odds: +164, rawSelection: 'VGK -1.5' };
      const result = grader.gradeBet(sel, finalGame, 100); // 5-1 = +4
      expect(result.outcome).toBe('win');
    });

    it('away -1.5 loses on close game', () => {
      const sel: BetSelection = { betType: 'spread', team: 'VGK', line: -1.5, odds: +164, rawSelection: 'VGK -1.5' };
      const result = grader.gradeBet(sel, closeGame, 100); // 3-2 = +1
      expect(result.outcome).toBe('loss');
    });

    it('home +1.5 wins on close game', () => {
      const sel: BetSelection = { betType: 'spread', team: 'EDM', line: 1.5, odds: -198, rawSelection: 'EDM +1.5' };
      const result = grader.gradeBet(sel, closeGame, 100); // 2+1.5=3.5 vs 3
      expect(result.outcome).toBe('win');
    });
  });

  describe('Totals', () => {
    it('over wins on high-scoring game', () => {
      const sel: BetSelection = { betType: 'total', direction: 'over', line: 5.5, odds: -110, rawSelection: 'Over 5.5' };
      const result = grader.gradeBet(sel, finalGame, 100); // 5+1=6 > 5.5
      expect(result.outcome).toBe('win');
    });

    it('under wins on low-scoring game', () => {
      const sel: BetSelection = { betType: 'total', direction: 'under', line: 5.5, odds: -110, rawSelection: 'Under 5.5' };
      const result = grader.gradeBet(sel, closeGame, 100); // 3+2=5 < 5.5
      expect(result.outcome).toBe('win');
    });

    it('push on exact total', () => {
      const sel: BetSelection = { betType: 'total', direction: 'over', line: 6, odds: -110, rawSelection: 'Over 6' };
      const result = grader.gradeBet(sel, finalGame, 100); // 5+1=6
      expect(result.outcome).toBe('push');
      expect(result.payout).toBe(100);
    });
  });

  describe('Void / Pending', () => {
    it('postponed returns void with stake', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'VGK', odds: -150, rawSelection: 'VGK ML' };
      const result = grader.gradeBet(sel, postponedGame, 100);
      expect(result.outcome).toBe('void');
      expect(result.payout).toBe(100);
    });

    it('live game returns pending', () => {
      const sel: BetSelection = { betType: 'moneyline', team: 'VGK', odds: -150, rawSelection: 'VGK ML' };
      const result = grader.gradeBet(sel, liveGame, 100);
      expect(result.outcome).toBe('pending');
    });
  });

  describe('parseSelection', () => {
    it('parses moneyline', () => {
      const sel = grader.parseSelection('VGK ML', 'moneyline', finalGame);
      expect(sel.betType).toBe('moneyline');
      expect(sel.team).toBe('VGK');
    });

    it('parses puck line', () => {
      const sel = grader.parseSelection('EDM +1.5', 'puckline', finalGame);
      expect(sel.betType).toBe('spread');
      expect(sel.team).toBe('EDM');
      expect(sel.line).toBe(1.5);
    });

    it('parses over total', () => {
      const sel = grader.parseSelection('Over 5.5 (-135)', 'total', finalGame);
      expect(sel.betType).toBe('total');
      expect(sel.direction).toBe('over');
      expect(sel.line).toBe(5.5);
      expect(sel.odds).toBe(-135);
    });
  });
});
