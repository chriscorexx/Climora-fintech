import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { MAX_SCORE_HISTORY_ENTRIES, ScoreHistoryEntry, appendScoreEntry } from './scoreHistory';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
});

beforeEach(() => {
  (globalThis.localStorage as unknown as MemoryStorage).clear();
});

function entry(index: number): ScoreHistoryEntry {
  return {
    profileId: 'msme_001',
    score: index,
    timestamp: new Date(2026, 0, 1, 0, index).toISOString(),
  };
}

describe('Score history', () => {
  it('appends entries in order', () => {
    const result = appendScoreEntry([entry(1)], entry(2));
    expect(result.map((e) => e.score)).toEqual([1, 2]);
  });

  it('caps history at the maximum entry count keeping the newest', () => {
    let entries: ScoreHistoryEntry[] = [];
    for (let i = 1; i <= MAX_SCORE_HISTORY_ENTRIES + 10; i++) {
      entries = appendScoreEntry(entries, entry(i));
    }
    expect(entries).toHaveLength(MAX_SCORE_HISTORY_ENTRIES);
    expect(entries[entries.length - 1].score).toBe(MAX_SCORE_HISTORY_ENTRIES + 10);
    expect(entries[0].score).toBe(11);
  });

  it('tolerates undefined input', () => {
    expect(appendScoreEntry(undefined, entry(5))).toHaveLength(1);
  });
});
