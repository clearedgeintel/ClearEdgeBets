import { describe, it, expect } from 'vitest';
import { mergeRealOddsWithGames } from '../../server/services/realOdds';

function makeGame(gameId: string, awayTeam = 'BOS', homeTeam = 'NYY') {
  return { gameId, awayTeam, homeTeam, odds: null };
}

function makeOdds(gameId: string) {
  return {
    gameId,
    moneyline: { away: +130, home: -150 },
    spread: { away: 1.5, home: -1.5, awayOdds: -110, homeOdds: -110, line: 1.5 },
    total: { over: -110, under: -110, line: 8.5 },
  };
}

describe('mergeRealOddsWithGames', () => {
  it('merges odds when game ID matches exactly', () => {
    const games = [makeGame('2025-04-01_BOS @ NYY')];
    const odds = [makeOdds('2025-04-01_BOS @ NYY')];
    const result = mergeRealOddsWithGames(games, odds);
    expect(result[0].odds.moneyline).toEqual({ away: 130, home: -150 });
  });

  it('leaves odds null when no match found', () => {
    const games = [makeGame('2025-04-01_BOS @ NYY')];
    const odds = [makeOdds('2025-04-01_LAD @ SF')];
    const result = mergeRealOddsWithGames(games, odds);
    expect(result[0].odds).toBeNull();
  });

  it('matches by team name when game ID date prefix differs', () => {
    const games = [makeGame('2025-04-01_BOS @ NYY', 'BOS', 'NYY')];
    // odds has same teams but different date format
    const odds = [{ ...makeOdds('2025-04-01_BOS @ NYY') }];
    const result = mergeRealOddsWithGames(games, odds);
    expect(result[0].odds).not.toBeNull();
  });

  it('handles empty odds array — all games keep null odds', () => {
    const games = [makeGame('2025-04-01_BOS @ NYY'), makeGame('2025-04-01_LAD @ SF')];
    const result = mergeRealOddsWithGames(games, []);
    expect(result.every(g => g.odds === null)).toBe(true);
  });

  it('handles empty games array', () => {
    const odds = [makeOdds('2025-04-01_BOS @ NYY')];
    const result = mergeRealOddsWithGames([], odds);
    expect(result).toHaveLength(0);
  });

  it('preserves all other game fields after merge', () => {
    const games = [{ ...makeGame('2025-04-01_BOS @ NYY'), venue: 'Fenway', gameTime: '7:10 PM' }];
    const odds = [makeOdds('2025-04-01_BOS @ NYY')];
    const result = mergeRealOddsWithGames(games, odds);
    expect(result[0].venue).toBe('Fenway');
    expect(result[0].gameTime).toBe('7:10 PM');
  });

  it('merges multiple games correctly', () => {
    const games = [
      makeGame('2025-04-01_BOS @ NYY'),
      makeGame('2025-04-01_LAD @ SF', 'LAD', 'SF'),
    ];
    const odds = [
      makeOdds('2025-04-01_BOS @ NYY'),
      { ...makeOdds('2025-04-01_LAD @ SF'), moneyline: { away: -120, home: +100 } },
    ];
    const result = mergeRealOddsWithGames(games, odds);
    expect(result[0].odds.moneyline.away).toBe(130);
    expect(result[1].odds.moneyline.away).toBe(-120);
  });
});
