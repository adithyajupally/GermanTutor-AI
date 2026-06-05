import { useState, useCallback } from 'react';
import type { NotebookEntry } from '../types/practice';

const STORAGE_KEY = 'gta_notebook';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadNotebook(): NotebookEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotebook(entries: NotebookEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota / private browsing — fail silently
  }
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotebook() {
  const [entries, setEntries] = useState<NotebookEntry[]>(loadNotebook);

  /** Add one or more entries (deduplicates by english + original + issueType) */
  const addEntries = useCallback((incoming: Omit<NotebookEntry, 'id' | 'timestamp'>[]) => {
    if (incoming.length === 0) return;
    setEntries((prev) => {
      let next = [...prev];
      for (const item of incoming) {
        // Avoid duplicating the same mistake for the same sentence
        const isDupe = next.some(
          (e) =>
            e.english === item.english &&
            e.original === item.original &&
            e.issueType === item.issueType,
        );
        if (!isDupe) {
          next = [{ ...item, id: makeId(), timestamp: Date.now() }, ...next];
        }
      }
      saveNotebook(next);
      return next;
    });
  }, []);

  return { entries, addEntries };
}
