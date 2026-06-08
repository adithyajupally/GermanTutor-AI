import { useState, useRef } from 'react';
import type { WordExplanation } from '../types/practice';
import { explainWord } from '../services/explainWord';
import { ErrorBanner } from '../components';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toUserMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('VITE_GEMINI_API_KEY')) {
      return 'No API key found. Add VITE_GEMINI_API_KEY to your .env file.';
    }
    if (
      err.message.includes('401') ||
      err.message.includes('403') ||
      err.message.includes('API_KEY_INVALID')
    ) {
      return 'Invalid API key. Check your VITE_GEMINI_API_KEY in .env.';
    }
    if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')) {
      return 'Rate limit reached. Wait a moment and try again.';
    }
    if (err.message.includes('UNAVAILABLE') || err.message.includes('INTERNAL')) {
      return 'Gemini is temporarily unavailable. Try again in a moment.';
    }
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      return 'Network error. Check your internet connection and try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

const POS_STYLES: Record<string, string> = {
  noun: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  verb: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  adjective: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  adverb: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  preposition: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  conjunction: 'bg-pink-500/15 text-pink-400 border border-pink-500/30',
  pronoun: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  article: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  particle: 'bg-zinc-500/15 text-zinc-400 border border-zinc-600',
  other: 'bg-zinc-500/15 text-zinc-400 border border-zinc-600',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ResultView({ result }: { result: WordExplanation }) {
  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">{result.word}</h2>
            <p className="mt-1 text-base text-zinc-300">{result.meaning}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                POS_STYLES[result.partOfSpeech] ?? POS_STYLES.other
              }`}
            >
              {result.partOfSpeech}
            </span>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
              {result.grammarTopic}
            </span>
          </div>
        </div>

        {result.baseForm && result.baseForm !== result.word && (
          <p className="mt-3 text-sm text-zinc-500">
            Base form:{' '}
            <span className="font-semibold text-zinc-300">{result.baseForm}</span>
          </p>
        )}
      </div>

      {/* Explanation */}
      <Section title="Explanation">
        <p className="text-sm leading-relaxed text-zinc-300">{result.explanation}</p>
      </Section>

      {/* Example sentences */}
      <Section title="Example Sentences">
        <div className="space-y-3">
          {result.exampleSentences.map((ex, i) => (
            <div key={i} className="rounded-lg bg-zinc-800/60 px-4 py-3 space-y-1">
              <p className="text-sm font-medium text-white">{ex.german}</p>
              <p className="text-sm text-zinc-400">{ex.english}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Related forms */}
      {result.relatedForms.length > 0 && (
        <Section title="Related Forms">
          <div className="flex flex-wrap gap-2">
            {result.relatedForms.map((form) => (
              <span
                key={form}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  form === result.word
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {form}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Common patterns */}
      {result.commonPatterns.length > 0 && (
        <Section title="Common Patterns">
          <div className="space-y-2">
            {result.commonPatterns.map((pattern, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 shrink-0 text-emerald-500">→</span>
                <p className="text-sm text-zinc-300">{pattern}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Similar words */}
      {result.similarWords.length > 0 && (
        <Section title="Similar Words">
          <div className="space-y-3">
            {result.similarWords.map((sw) => (
              <div key={sw.word} className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-white">{sw.word}</span>
                  <span className="text-sm text-zinc-400">— {sw.meaning}</span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">{sw.difference}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function WordExplorerPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<WordExplanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch() {
    const word = query.trim();
    if (!word) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const explanation = await explainWord({ word });
      setResult(explanation);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
  }

  function handleClear() {
    setQuery('');
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Word Explorer</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Look up any German word for a detailed grammar explanation.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. würde, spazieren gehen, trotzdem…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? 'Looking up…' : 'Explain'}
        </button>
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} />}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="h-7 w-32 rounded bg-zinc-800" />
            <div className="mt-2 h-4 w-48 rounded bg-zinc-800" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-4 h-3 w-24 rounded bg-zinc-800" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-zinc-800" />
                <div className="h-4 w-4/5 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {!isLoading && result && <ResultView result={result} />}
    </div>
  );
}
