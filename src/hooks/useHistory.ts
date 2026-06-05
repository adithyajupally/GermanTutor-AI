import { useState, useCallback } from 'react';
import type { AttemptSummary } from '../types/practice';

const STORAGE_KEY = 'gta_history';
const MAX_ENTRIES = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadHistory(): AttemptSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: AttemptSummary[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota / private browsing — fail silently
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHistory() {
  const [entries, setEntries] = useState<AttemptSummary[]>(loadHistory);

  const addEntry = useCallback((attempt: Omit<AttemptSummary, 'id' | 'timestamp'>) => {
    setEntries((prev) => {
      const next: AttemptSummary[] = [
        {
          ...attempt,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, MAX_ENTRIES);
      saveHistory(next);
      return next;
    });
  }, []);

  return { entries, addEntry };
}
