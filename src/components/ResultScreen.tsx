import { useState } from 'react';
import type {
  CEFRLevel,
  Category,
  Difficulty,
  EvaluationResult,
  ExplainTier,
  VocabItem,
} from '../types/practice';
import { ISSUE_TYPE_STYLES, OVERALL_LABEL_STYLES } from '../utils/styleMap';
import { capitalizeFirst } from '../utils/format';
import { ScoreBar } from './ScoreBar';

// ─── Constants ────────────────────────────────────────────────────────────────

const VOCAB_TYPE_LABELS: Record<VocabItem['type'], string> = {
  noun: 'Noun',
  verb: 'Verb',
  separable_verb: 'Separable Verb',
  collocation: 'Collocation',
  pattern: 'Pattern',
};

const EXPLAIN_TIERS: ExplainTier[] = ['a1', 'a2', 'b1'];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ResultScreenProps {
  result: EvaluationResult;
  userTranslation: string;
  level: CEFRLevel;
  difficulty: Difficulty;
  category: Category;
  onTryAgain: () => void;
  onNextSentence: () => void;
  onSaveToNotebook: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResultScreen({
  result,
  userTranslation,
  level,
  difficulty,
  category,
  onTryAgain,
  onNextSentence,
  onSaveToNotebook,
}: ResultScreenProps) {
  const [explainTier, setExplainTier] = useState<ExplainTier>('b1');
  const [minorsOpen, setMinorsOpen] = useState(false);
  const [savedToNotebook, setSavedToNotebook] = useState(false);

  function handleSaveToNotebook() {
    onSaveToNotebook();
    setSavedToNotebook(true);
  }

  const majorIssues = result.issues.filter((i) => i.severity !== 'minor');
  const minorIssues = result.issues.filter((i) => i.severity === 'minor');

  return (
    <div className="space-y-6">
      {/* Back / context */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onTryAgain}
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          ← Try Again
        </button>
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
          {level} · {capitalizeFirst(difficulty)} · {category}
        </span>
      </div>

      {/* Verdict */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="mb-3 flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${OVERALL_LABEL_STYLES[result.overallLabel]}`}
          >
            {result.overallLabel}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-300">{result.verdict}</p>
        {result.isUserAnswerValid && (
          <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
            <p className="text-sm font-medium text-emerald-400">
              ✓ Your translation is a valid answer
            </p>
          </div>
        )}
      </div>

      {/* Scores */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Scores
        </h3>
        <div className="space-y-3">
          <ScoreBar label="Meaning" score={result.scores.meaning} />
          <ScoreBar label="Grammar" score={result.scores.grammar} />
          <ScoreBar label="Word Order" score={result.scores.wordOrder} />
          <ScoreBar label="Naturalness" score={result.scores.naturalness} />
        </div>
      </div>

      {/* Mistakes */}
      {majorIssues.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Mistakes
          </h3>
          <div className="space-y-4">
            {majorIssues.map((issue, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${ISSUE_TYPE_STYLES[issue.type]}`}
                  >
                    {issue.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs capitalize text-zinc-500">{issue.severity}</span>
                </div>
                <div className="space-y-1.5 rounded-lg bg-zinc-800/60 px-4 py-3">
                  <p className="text-sm">
                    <span className="text-zinc-500">You wrote: </span>
                    <span className="text-red-400 line-through">{issue.original}</span>
                  </p>
                  {issue.correction && (
                    <p className="text-sm">
                      <span className="text-zinc-500">Better: </span>
                      <span className="text-emerald-400">{issue.correction}</span>
                    </p>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">{issue.explanation}</p>
              </div>
            ))}
          </div>

          {minorIssues.length > 0 && (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setMinorsOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                <span>{minorsOpen ? '▾' : '▸'}</span>
                Minor notes ({minorIssues.length})
              </button>
              {minorsOpen && (
                <div className="mt-3 space-y-3">
                  {minorIssues.map((issue, i) => (
                    <div key={i} className="space-y-1.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${ISSUE_TYPE_STYLES[issue.type]}`}
                      >
                        {issue.type.replace('_', ' ')}
                      </span>
                      <p className="text-sm text-zinc-400">{issue.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Why Not My Version */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Why Not My Version?
        </h3>
        <div className="mb-3 rounded-lg bg-zinc-800/60 px-4 py-3">
          <p className="text-sm italic text-zinc-400">"{userTranslation}"</p>
        </div>
        <p className="text-sm leading-relaxed text-zinc-300">{result.whyNotMyVersion}</p>
      </div>

      {/* Alternative translations */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Alternative Translations
        </h3>
        <div className="space-y-3">
          {result.alternatives.map((alt) => (
            <div key={alt.label} className="flex gap-3">
              <span className="mt-0.5 shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                {alt.label}
              </span>
              <p className="text-sm text-zinc-200">{alt.translation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vocabulary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Vocabulary
        </h3>
        <div className="space-y-3">
          {result.vocabulary.map((item) => (
            <div key={item.word} className="flex gap-3">
              <div className="shrink-0 space-y-0.5">
                <p className="text-sm font-semibold text-white">{item.word}</p>
                <p className="text-xs text-zinc-500">{VOCAB_TYPE_LABELS[item.type]}</p>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation tier toggle */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Explanation
          </h3>
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {EXPLAIN_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setExplainTier(tier)}
                className={`px-3 py-1 text-xs font-semibold uppercase transition-colors ${
                  explainTier === tier
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {tier.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-zinc-300">
          {result.explanations[explainTier] ?? 'No explanation available for this tier.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-6">
        <button
          type="button"
          onClick={onTryAgain}
          className="rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={onNextSentence}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Next Sentence
        </button>
        <button
          type="button"
          onClick={handleSaveToNotebook}
          disabled={savedToNotebook}
          className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-default disabled:opacity-60"
        >
          {savedToNotebook ? '✓ Saved' : 'Save to Notebook'}
        </button>
      </div>
    </div>
  );
}
