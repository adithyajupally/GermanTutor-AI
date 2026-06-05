import type { AttemptSummary } from '../types/practice';
import { OVERALL_LABEL_STYLES } from '../utils/styleMap';
import { formatRelativeTime, capitalizeFirst } from '../utils/format';

function ScorePip({ score }: { score: number }) {
  const color = score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export function HistoryPage({ entries }: { entries: AttemptSummary[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-sm font-medium text-zinc-400">No attempts yet</p>
        <p className="mt-1 text-sm text-zinc-600">Complete a translation to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">History</h2>
        <span className="text-xs text-zinc-500">{entries.length} / 20</span>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${OVERALL_LABEL_STYLES[entry.overallLabel]}`}
              >
                {entry.overallLabel}
              </span>
              <span className="shrink-0 text-xs text-zinc-500">
                {formatRelativeTime(entry.timestamp)}
              </span>
            </div>

            <p className="mt-2.5 line-clamp-2 text-sm leading-snug text-zinc-200">
              {entry.english}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                {entry.level} · {capitalizeFirst(entry.difficulty)}
              </span>

              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <ScorePip score={entry.scores.meaning} />
                <ScorePip score={entry.scores.grammar} />
                <ScorePip score={entry.scores.wordOrder} />
                <ScorePip score={entry.scores.naturalness} />
                <span className="ml-1 tabular-nums">
                  {Math.round(
                    (entry.scores.meaning +
                      entry.scores.grammar +
                      entry.scores.wordOrder +
                      entry.scores.naturalness) / 4,
                  )}
                  /10
                </span>
              </span>

              {entry.grammarTag && (
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                  {entry.grammarTag.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
