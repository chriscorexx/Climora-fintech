export interface ScoreHistoryEntry {
  profileId: string;
  score: number;
  timestamp: string;
}

const SCORE_HISTORY_KEY = 'climora_score_history_v1';
export const MAX_SCORE_HISTORY_ENTRIES = 30;

export function appendScoreEntry(
  entries: ScoreHistoryEntry[] | undefined,
  entry: ScoreHistoryEntry,
): ScoreHistoryEntry[] {
  const next = [...(entries ?? []), entry];
  if (next.length <= MAX_SCORE_HISTORY_ENTRIES) return next;
  return next.slice(next.length - MAX_SCORE_HISTORY_ENTRIES);
}

function readHistory(): ScoreHistoryEntry[] {
  try {
    const raw = localStorage.getItem(SCORE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScoreHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: ScoreHistoryEntry[]): void {
  try {
    localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to persist score history:', err);
  }
}

export function getScoreHistory(): ScoreHistoryEntry[] {
  return readHistory();
}

export function getProfileScoreHistory(
  profileId: string,
  currentScore?: number,
): ScoreHistoryEntry[] {
  const entries = readHistory().filter((entry) => entry.profileId === profileId);
  if (currentScore === undefined || currentScore === null) return entries;
  const latest = entries[entries.length - 1];
  if (latest && Math.abs(latest.score - currentScore) < 0.5) return entries;
  const pending: ScoreHistoryEntry = {
    profileId,
    score: Math.max(0, Math.min(100, Math.round(Number(currentScore)))),
    timestamp: new Date().toISOString(),
  };
  return appendScoreEntry(entries, pending);
}

export function recordProfileScore(profileId: string, score: number): ScoreHistoryEntry[] {
  const entry: ScoreHistoryEntry = {
    profileId,
    score: Math.max(0, Math.min(100, Math.round(Number(score ?? 0)))),
    timestamp: new Date().toISOString(),
  };
  const updated = appendScoreEntry(readHistory(), entry);
  writeHistory(updated);
  return updated;
}
