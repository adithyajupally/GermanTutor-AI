import { useState } from 'react';
import type { NotebookEntry, NotebookFilter } from '../types/practice';
import { ISSUE_TYPE_STYLES } from '../utils/styleMap';
import { formatRelativeTime, capitalizeFirst } from '../utils/format';

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS: NotebookFilter[] = [
  'all',
  'cases',
  'word_order',
  'prepositions',
  'verb_placement',
  'separable_verbs',
  'tenses',
];

const FILTER_LABELS: Record<NotebookFilter, string> = {
  all: 'All',
  cases: 'Cases',
  word_order: 'Word Order',
  prepositions: 'Prepositions',
  verb_placement: 'Verb Placement',
  separable_verbs: 'Separable Verbs',
  tenses: 'Tenses',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NotebookPage({ entries }: { entries: NotebookEntry[] }) {
  const [activeFilter, setActiveFilter] = useState<NotebookFilter>('all');

  const filtered =
    activeFilter === 'all' ? entries : entries.filter((e) => e.grammarTag === activeFilter);

  // Only show chips that have at least one matching entry (plus "all")
  const visibleFilters = FILTERS.filter(
    (f) => f === 'all' || entries.some((e) => e.grammarTag === f),
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-sm font-medium text-zinc-400">Notebook is empty</p>
        <p className="mt-1 text-sm text-zinc-600">
          Mistakes from your practice sessions will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Error Notebook</h2>
        <span className="text-xs text-zinc-500">{entries.length} entries</span>
      </div>

      {/* Filter chips — only rendered when there's more than one tag category */}
      {visibleFilters.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {visibleFilters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeFilter === f
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {FILTER_LABELS[f]}
              {f !== 'all' && (
                <span className="ml-1.5 opacity-60">
                  {entries.filter((e) => e.grammarTag === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <p className="text-sm text-zinc-500">No entries for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${ISSUE_TYPE_STYLES[entry.issueType]}`}
                  >
                    {entry.issueType.replace('_', ' ')}
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                    {entry.level} · {capitalizeFirst(entry.difficulty)}
                  </span>
                  {entry.savedManually && (
                    <span className="text-xs text-zinc-600">Manual</span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-zinc-600">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>

              {/* English source */}
              <p className="text-xs leading-snug text-zinc-500">
                <span className="font-medium text-zinc-400">EN: </span>
                {entry.english}
              </p>

              {/* Error detail */}
              <div className="space-y-1.5 rounded-lg bg-zinc-800/60 px-3 py-2.5">
                <p className="text-sm">
                  <span className="text-zinc-500">You wrote: </span>
                  <span className="text-red-400 line-through">{entry.original}</span>
                </p>
                {entry.correction && (
                  <p className="text-sm">
                    <span className="text-zinc-500">Better: </span>
                    <span className="text-emerald-400">{entry.correction}</span>
                  </p>
                )}
              </div>

              <p className="text-sm leading-relaxed text-zinc-300">{entry.explanation}</p>

              {entry.grammarTag && (
                <p className="text-xs text-zinc-600">
                  Tag: {entry.grammarTag.replace('_', ' ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
