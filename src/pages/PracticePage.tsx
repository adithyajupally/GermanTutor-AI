import { useState } from 'react';
import {
  type Difficulty,
  type EvaluationResult,
  type PracticeView,
  type Strictness,
  type AttemptSummary,
  type NotebookEntry,
} from '../types/practice';
import { generate, type GenerateOutput } from '../services/generate';
import { evaluate } from '../services/evaluate';
import { useSession } from '../hooks/useSession';
import { SegmentGroup, ErrorBanner, ResultScreen } from '../components';

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toUserMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('VITE_GEMINI_API_KEY')) {
      return 'No API key found. Add VITE_GEMINI_API_KEY to your .env file.';
    }
    if (err.message.includes('401') || err.message.includes('403') || err.message.includes('API_KEY_INVALID')) {
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

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PracticePageProps {
  onAttemptSaved: (a: Omit<AttemptSummary, 'id' | 'timestamp'>) => void;
  onNotebookSave: (entries: Omit<NotebookEntry, 'id' | 'timestamp'>[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PracticePage({ onAttemptSaved, onNotebookSave }: PracticePageProps) {
  const [view, setView] = useState<PracticeView>('setup');
  const { level, difficulty, category, setLevel, setDifficulty} = useSession();
  const [strictness] = useState<Strictness>('normal');
  const [germanTranslation, setGermanTranslation] = useState('');
  const [generatedSentence, setGeneratedSentence] = useState<GenerateOutput | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [evaluateError, setEvaluateError] = useState<string | null>(null);
  // Tracks auto-saved entries for current attempt — used by manual save to dedup
  const [currentAutoEntries, setCurrentAutoEntries] = useState<
    Omit<NotebookEntry, 'id' | 'timestamp'>[]
  >([]);

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError(null);
    setGermanTranslation('');
    try {
      const result = await generate({ level, difficulty, category });
      setGeneratedSentence(result);
      setView('translating');
    } catch (err) {
      setGenerateError(toUserMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCheckTranslation() {
    if (!generatedSentence) return;
    setIsEvaluating(true);
    setEvaluateError(null);
    try {
      const result = await evaluate({
        level,
        difficulty,
        strictness,
        english: generatedSentence.english,
        userGerman: germanTranslation,
        referenceTranslations: generatedSentence.referenceTranslations,
        targetGrammarTag: generatedSentence.targetGrammarTag,
      });
      setEvaluationResult(result);
      setView('result');

      onAttemptSaved({
        english: generatedSentence.english,
        level,
        difficulty,
        overallLabel: result.overallLabel,
        scores: result.scores,
        grammarTag: generatedSentence.targetGrammarTag,
      });

      // Auto-save blocking + major issues (SPEC §2.4)
      const autoEntries = result.issues
        .filter((i) => i.severity === 'blocking' || i.severity === 'major')
        .map((i) => ({
          english: generatedSentence.english,
          userGerman: germanTranslation,
          level,
          difficulty,
          issueType: i.type,
          severity: i.severity,
          original: i.original,
          correction: i.correction,
          explanation: i.explanation,
          grammarTag: generatedSentence.targetGrammarTag,
          savedManually: false,
        }));
      if (autoEntries.length > 0) onNotebookSave(autoEntries);
      setCurrentAutoEntries(autoEntries);
    } catch (err) {
      setEvaluateError(toUserMessage(err));
      // Translation intentionally preserved — user can retry without retyping
    } finally {
      setIsEvaluating(false);
    }
  }

  function handleTryAgain() {
    setGermanTranslation('');
    setEvaluationResult(null);
    setEvaluateError(null);
    setView('translating');
  }

  function handleNextSentence() {
    setGermanTranslation('');
    setGeneratedSentence(null);
    setEvaluationResult(null);
    setGenerateError(null);
    setEvaluateError(null);
    setCurrentAutoEntries([]);
    setView('setup');
  }

  function handleManualNotebookSave() {
    if (!generatedSentence || !evaluationResult) return;
    const allEntries = evaluationResult.issues
      .filter((i) => i.severity !== 'minor')
      .map((i) => ({
        english: generatedSentence.english,
        userGerman: germanTranslation,
        level,
        difficulty,
        issueType: i.type,
        severity: i.severity,
        original: i.original,
        correction: i.correction,
        explanation: i.explanation,
        grammarTag: generatedSentence.targetGrammarTag,
        savedManually: true,
      }));
    // Only save entries not already auto-saved
    const newEntries = allEntries.filter(
      (e) =>
        !currentAutoEntries.some(
          (saved) => saved.original === e.original && saved.issueType === e.issueType,
        ),
    );
    if (newEntries.length > 0) onNotebookSave(newEntries);
  }

  // ── Result view ─────────────────────────────────────────────────────────────

  if (view === 'result' && evaluationResult) {
    return (
      <ResultScreen
        result={evaluationResult}
        userTranslation={germanTranslation}
        level={level}
        difficulty={difficulty}
        category={category}
        onTryAgain={handleTryAgain}
        onNextSentence={handleNextSentence}
        onSaveToNotebook={handleManualNotebookSave}
      />
    );
  }

  // ── Setup + translating views ────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Practice</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {view === 'setup'
            ? 'Select your level and options, then generate a sentence to translate.'
            : 'Translate the sentence into German, then check your answer.'}
        </p>
      </div>

      {view === 'setup' && 
        <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <SegmentGroup
            label="CEFR Level"
            value={level}
            onChange={setLevel} options={[]}          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-300">Difficulty</legend>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    difficulty === d.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                  aria-pressed={difficulty === d.id}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-300">Category</legend>
            <div className="flex flex-wrap gap-2">
                <button
                
                  type="button"
                  
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {
                  ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                  
                >
                  
                </button>
            </div>
          </fieldset>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {isGenerating ? 'Generating…' : 'Generate Sentence'}
            </button>
            {generateError && <ErrorBanner message={generateError} />}
          </div>
        </div>
      }

      {view === 'translating' && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setView('setup')}
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            ← Back
          </button>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm font-medium text-zinc-400">English</p>
            <p className="mt-2 text-lg text-white">{generatedSentence?.english}</p>
          </div>

          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <label htmlFor="german-translation" className="text-sm font-medium text-zinc-300">
              Your German translation
            </label>
            <textarea
              id="german-translation"
              value={germanTranslation}
              onChange={(e) => setGermanTranslation(e.target.value)}
              rows={4}
              placeholder="Type your German translation here…"
              className="mt-2 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {evaluateError && <ErrorBanner message={evaluateError} />}
            <button
              type="button"
              onClick={handleCheckTranslation}
              disabled={!germanTranslation.trim() || isEvaluating}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {isEvaluating ? 'Checking…' : 'Check Translation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
