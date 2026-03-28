import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCached, setCache, invalidateCache, invalidateCacheByPrefix } from '../../server/lib/cache';

// Reset module between tests so cache state doesn't leak
beforeEach(async () => {
  // Invalidate any keys we might use in tests
  invalidateCache('test-key');
  invalidateCacheByPrefix('test:');
});

describe('cache', () => {
  it('returns null for unknown key', () => {
    expect(getCached('test-key')).toBeNull();
  });

  it('returns stored value within TTL', () => {
    setCache('test-key', { score: 42 }, 60);
    expect(getCached('test-key')).toEqual({ score: 42 });
  });

  it('returns null after TTL expires', () => {
    vi.useFakeTimers();
    setCache('test-key', 'hello', 1); // 1 second TTL
    vi.advanceTimersByTime(1001);
    expect(getCached('test-key')).toBeNull();
    vi.useRealTimers();
  });

  it('overwrites existing cache entry', () => {
    setCache('test-key', 'first', 60);
    setCache('test-key', 'second', 60);
    expect(getCached('test-key')).toBe('second');
  });

  it('invalidateCache removes a specific key', () => {
    setCache('test-key', 'value', 60);
    invalidateCache('test-key');
    expect(getCached('test-key')).toBeNull();
  });

  it('invalidateCacheByPrefix removes all matching keys', () => {
    setCache('test:games-2025-04-01', [1, 2, 3], 60);
    setCache('test:games-2025-04-02', [4, 5, 6], 60);
    setCache('test:odds', { x: 1 }, 60);
    invalidateCacheByPrefix('test:games');
    expect(getCached('test:games-2025-04-01')).toBeNull();
    expect(getCached('test:games-2025-04-02')).toBeNull();
    expect(getCached('test:odds')).toEqual({ x: 1 }); // unaffected
  });

  it('stores arrays correctly', () => {
    const data = [{ id: 1 }, { id: 2 }];
    setCache('test-key', data, 60);
    expect(getCached('test-key')).toEqual(data);
  });
});
