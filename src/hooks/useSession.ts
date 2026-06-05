import { useState, useEffect } from 'react';
import type { CEFRLevel, Difficulty, Category } from '../types/practice';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  level: CEFRLevel;
  difficulty: Difficulty;
  category: Category;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: Session = {
  level: 'A1',
  difficulty: 'medium',
  category: 'Any',
};

const STORAGE_KEY = 'gta_session';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Session>;
    return {
      level: parsed.level ?? DEFAULTS.level,
      difficulty: parsed.difficulty ?? DEFAULTS.difficulty,
      category: parsed.category ?? DEFAULTS.category,
    };
  } catch {
    return DEFAULTS;
  }
}

function saveSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage unavailable (private browsing quota, etc.) — fail silently
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession() {
  const [session, setSession] = useState<Session>(loadSession);

  // Persist whenever any field changes
  useEffect(() => {
    saveSession(session);
  }, [session]);

  function setLevel(level: CEFRLevel) {
    setSession((s) => ({ ...s, level }));
  }

  function setDifficulty(difficulty: Difficulty) {
    setSession((s) => ({ ...s, difficulty }));
  }

  function setCategory(category: Category) {
    setSession((s) => ({ ...s, category }));
  }

  return {
    level: session.level,
    difficulty: session.difficulty,
    category: session.category,
    setLevel,
    setDifficulty,
    setCategory,
  };
}
