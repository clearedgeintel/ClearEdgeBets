import { describe, it, expect, vi } from 'vitest';

// Mock db so bet-settlement.ts can be imported without DATABASE_URL
vi.mock('../../server/db', () => ({ db: {} }));

import { calculateBetResult } from '../../server/services/bet-settlement';

// Helper to build a minimal bet object
function bet(overrides: Record<string, unknown>) {
  return { betType: 'moneyline', selection: 'Yankees', stake: '1000', odds: -110, ...overrides };
}

// Helper to build a minimal game object
function game(overrides: Record<string, unknown>) {
  return { awayTeam: 'Red Sox', homeTeam: 'Yankees', awayScore: 3, homeScore: 5, ...overrides };
}

// ─── Moneyline ────────────────────────────────────────────────────────────────

describe('calculateBetResult — moneyline', () => {
  it('wins when selected home team wins', () => {
    const { result } = calculateBetResult(
      bet({ selection: 'Yankees', odds: -150 }),
      game({ awayScore: 2, homeScore: 5 })
    );
    expect(result).toBe('win');
  });

  it('wins when selected away team wins', () => {
    const { result } = calculateBetResult(
      bet({ selection: 'Red Sox', odds: +130 }),
      game({ awayScore: 6, homeScore: 3 })
    );
    expect(result).toBe('win');
  });

  it('loses when selected team loses', () => {
    const { result } = calculateBetResult(
      bet({ selection: 'Red Sox', odds: +130 }),
      game({ awayScore: 2, homeScore: 5 })
    );
    expect(result).toBe('lose');
  });

  it('returns pending when scores are missing', () => {
    const { result } = calculateBetResult(
      bet({ selection: 'Yankees' }),
      { awayTeam: 'Red Sox', homeTeam: 'Yankees', awayScore: null, homeScore: null }
    );
    expect(result).toBe('pending');
  });
});

// ─── Moneyline payout calculations ───────────────────────────────────────────

describe('calculateBetResult — payout amounts', () => {
  it('calculates positive odds payout correctly (+150 on $10)', () => {
    // +150 odds on $10 stake → profit = $15, total = $25
    const { result, actualWin } = calculateBetResult(
      bet({ selection: 'Red Sox', odds: 150, stake: '1000' }), // 1000 cents = $10
      game({ awayScore: 5, homeScore: 2 })
    );
    expect(result).toBe('win');
    expect(actualWin).toBe(2500); // $25 in cents
  });

  it('calculates negative odds payout correctly (-200 on $10)', () => {
    // -200 odds on $10 stake → profit = $5, total = $15
    const { result, actualWin } = calculateBetResult(
      bet({ selection: 'Yankees', odds: -200, stake: '1000' }),
      game({ awayScore: 2, homeScore: 5 })
    );
    expect(result).toBe('win');
    expect(actualWin).toBe(1500); // $15 in cents
  });

  it('returns zero actualWin on a loss', () => {
    const { result, actualWin } = calculateBetResult(
      bet({ selection: 'Red Sox', odds: +130 }),
      game({ awayScore: 2, homeScore: 5 })
    );
    expect(result).toBe('lose');
    expect(actualWin).toBe(0);
  });
});

// ─── Totals ───────────────────────────────────────────────────────────────────

describe('calculateBetResult — totals', () => {
  it('wins over bet when combined score exceeds line', () => {
    const { result } = calculateBetResult(
      bet({ betType: 'total', selection: 'Over 8.5', odds: -110 }),
      game({ awayScore: 5, homeScore: 4 }) // 9 total
    );
    expect(result).toBe('win');
  });

  it('loses over bet when combined score is under line', () => {
    const { result } = calculateBetResult(
      bet({ betType: 'total', selection: 'Over 8.5', odds: -110 }),
      game({ awayScore: 3, homeScore: 4 }) // 7 total
    );
    expect(result).toBe('lose');
  });

  it('wins under bet when combined score is under line', () => {
    const { result } = calculateBetResult(
      bet({ betType: 'total', selection: 'Under 9.5', odds: -110 }),
      game({ awayScore: 3, homeScore: 4 }) // 7 total
    );
    expect(result).toBe('win');
  });

  it('pushes when combined score exactly matches line', () => {
    const { result, actualWin } = calculateBetResult(
      bet({ betType: 'total', selection: 'Over 7', odds: -110, stake: '1000' }),
      game({ awayScore: 3, homeScore: 4 }) // 7 total — exact push
    );
    expect(result).toBe('push');
    expect(actualWin).toBe(1000); // stake returned
  });
});

// ─── Run line / spread ────────────────────────────────────────────────────────

describe('calculateBetResult — spread / runline', () => {
  it('wins away team spread when they cover', () => {
    // Red Sox +1.5 — Red Sox lose by 1 → covers
    const { result } = calculateBetResult(
      bet({ betType: 'spread', selection: 'Red Sox +1.5', odds: -110 }),
      game({ awayScore: 4, homeScore: 5 }) // lose by 1, cover +1.5
    );
    expect(result).toBe('win');
  });

  it('loses away team spread when they do not cover', () => {
    // Red Sox +1.5 — Red Sox lose by 3 → does not cover
    const { result } = calculateBetResult(
      bet({ betType: 'spread', selection: 'Red Sox +1.5', odds: -110 }),
      game({ awayScore: 2, homeScore: 5 })
    );
    expect(result).toBe('lose');
  });

  it('wins home team spread when they cover', () => {
    // Yankees -1.5 — Yankees win by 3 → covers
    const { result } = calculateBetResult(
      bet({ betType: 'spread', selection: 'Yankees -1.5', odds: -110 }),
      game({ awayScore: 2, homeScore: 5 })
    );
    expect(result).toBe('win');
  });

  it('pushes on spread when adjusted score ties', () => {
    // Yankees -2 — Yankees win by exactly 2 → push
    const { result } = calculateBetResult(
      bet({ betType: 'runline', selection: 'Yankees -2', odds: -110 }),
      game({ awayScore: 3, homeScore: 5 })
    );
    expect(result).toBe('push');
  });
});
