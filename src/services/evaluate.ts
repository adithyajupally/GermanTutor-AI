import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import type {
  CEFRLevel,
  Difficulty,
  EvaluationResult,
  GrammarTag,
  Strictness,
} from '../types/practice';

// ─── Input / output ───────────────────────────────────────────────────────────

// SPEC §4 + §7 — evaluate call inputs
export interface EvaluateInput {
  level: CEFRLevel;
  difficulty: Difficulty;
  strictness: Strictness;
  english: string;
  userGerman: string;
  referenceTranslations: string[];
  targetGrammarTag?: GrammarTag; // from generate output
  memoryContext?: string[]; // up to 2 notebook entries (SPEC §4)
}

// Output is EvaluationResult directly — no wrapper needed
export type EvaluateOutput = EvaluationResult;

// ─── Prompt builders ──────────────────────────────────────────────────────────

const STRICTNESS_INSTRUCTIONS: Record<Strictness, string> = {
  relaxed: 'Be lenient. Minor errors (spelling, missing umlauts, capitalisation, punctuation) should appear in issues[] with severity "minor" but must NOT reduce any score. Focus feedback on meaning and grammar.',
  normal: 'Standard evaluation. Minor errors appear in issues[] with severity "minor" for display only — they do not reduce scores. Penalise grammar and word-order errors appropriately.',
  exam: 'Strict evaluation. All errors including minor ones (spelling, umlauts, capitalisation, punctuation) must reduce the relevant score.',
};

const SYSTEM_PROMPT = `You are an expert German language teacher evaluating a student's translation.

Respond with ONLY a valid JSON object — no markdown, no code fences, no preamble.

Required JSON shape:
{
  "verdict": "string — 1–2 sentence teacher-tone summary with encouragement",
  "overallLabel": "Excellent" | "Good" | "Understandable but Unnatural" | "Needs Improvement",
  "isUserAnswerValid": boolean,
  "scores": {
    "meaning": number (0–10),
    "grammar": number (0–10),
    "wordOrder": number (0–10),
    "naturalness": number (0–10)
  },
  "issues": [
    {
      "type": "MEANING" | "GRAMMAR" | "WORD_ORDER" | "NATURALNESS" | "ALTERNATIVE" | "MINOR",
      "severity": "blocking" | "major" | "minor",
      "original": "string — the problematic fragment from the user's translation",
      "correction": "string — corrected form (omit if no fix needed)",
      "explanation": "string — clear teacher explanation of why this is wrong and what the rule is"
    }
  ],
  "whyNotMyVersion": "string — explain specifically why the user's translation is suboptimal or wrong (skip if isUserAnswerValid is true)",
  "alternatives": [
    { "label": "Natural" | "Formal" | "Casual" | "Other", "translation": "string" }
  ],
  "vocabulary": [
    {
      "word": "string",
      "type": "noun" | "verb" | "separable_verb" | "collocation" | "pattern",
      "note": "string — usage note, gender for nouns, auxiliary for verbs, etc."
    }
  ],
  "explanations": {
    "a1": "string — explain the key grammar point in very simple terms for a beginner",
    "a2": "string — explain using basic grammar terminology",
    "b1": "string — explain using proper grammar terms (e.g. Verbzweitstellung, Konjunktiv)"
  }
}

Evaluation rules:
- Issue priority order: MEANING → GRAMMAR → WORD_ORDER → NATURALNESS → MINOR
- If the user's translation is a valid alternative (not identical to reference but correct), set isUserAnswerValid=true and use type "ALTERNATIVE" — do NOT reduce scores
- overallLabel mapping: Excellent (all scores ≥8), Good (no score <6), Understandable but Unnatural (meaning≥7 but naturalness or word_order <6), Needs Improvement (meaning<7 or grammar<5)
- whyNotMyVersion: only populate when isUserAnswerValid is false; explain the gap between the user's version and a correct translation
- vocabulary: include 3–5 key items from the sentence — focus on words/patterns a learner at this level should study
- explanations: always provide all three tiers (a1, a2, b1) for the most important grammar point in the sentence
- alternatives: provide exactly 3 items with labels Natural, Formal, Casual`;

function buildUserPrompt(input: EvaluateInput): string {
  const strictnessNote = STRICTNESS_INSTRUCTIONS[input.strictness];

  const memoryLines =
    input.memoryContext && input.memoryContext.length > 0
      ? `\nKnown weak areas for this learner:\n${input.memoryContext.map((m) => `- ${m}`).join('\n')}`
      : '';

  const focusLine = input.targetGrammarTag
    ? `\nThis sentence was designed to practise: ${input.targetGrammarTag.replace('_', ' ')}`
    : '';

  return `Evaluate this translation attempt.

CEFR level: ${input.level}
Difficulty: ${input.difficulty}
Strictness: ${input.strictness} — ${strictnessNote}${focusLine}${memoryLines}

English source:
${input.english}

Reference translations:
${input.referenceTranslations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Student's translation:
${input.userGerman}

Return the JSON object only.`;
}

// ─── Service function ─────────────────────────────────────────────────────────

export async function evaluate(input: EvaluateInput): Promise<EvaluateOutput> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const modelName = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-1.5-flash';

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.3, // low variance — consistent, reliable evaluation
      responseMimeType: 'application/json',
    },
  });

  let raw: string;
  try {
    const result = await model.generateContent(buildUserPrompt(input));
    raw = result.response.text();
  } catch (err) {
    if (err instanceof GoogleGenerativeAIFetchError) {
      throw new Error(`Gemini error ${err.status}: ${err.message}`);
    }
    throw err;
  }

  if (!raw?.trim()) throw new Error('Empty response from Gemini');

  const parsed = JSON.parse(raw) as EvaluationResult;

  // Validate minimum required fields
  if (typeof parsed.verdict !== 'string' || !parsed.verdict.trim()) {
    throw new Error('Invalid response: missing verdict');
  }
  if (!Array.isArray(parsed.issues)) {
    throw new Error('Invalid response: issues must be an array');
  }
  if (!parsed.scores || typeof parsed.scores.meaning !== 'number') {
    throw new Error('Invalid response: missing scores');
  }

  // NOTE (SPEC §8): scores are intentionally LLM-provided for now.
  // When scoring.ts is implemented, replace parsed.scores with
  // computeScores(parsed.issues, input.strictness) here.

  return parsed;
}
