import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import type {
  CEFRLevel,
  Category,
  Difficulty,
  GeneratedSentence,
  GrammarTag,
} from '../types/practice';

// ─── Input / output ───────────────────────────────────────────────────────────

// SPEC §4 — generate call inputs
export interface GenerateInput {
  level: CEFRLevel;
  difficulty: Difficulty;
  category?: Category;
  focusTag?: GrammarTag;
  memoryContext?: string[]; // up to 2 notebook entries (SPEC §4)
}

// SPEC §5 — generate call output
export interface GenerateOutput extends GeneratedSentence {
  targetGrammarTag?: GrammarTag;
  generationNotes?: string; // e.g. "Practicing: Dativ"
}

// Expected shape of the JSON the model returns
interface GenerateApiResponse {
  english: string;
  referenceTranslations: string[];
  targetGrammarTag?: GrammarTag;
  generationNotes?: string;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, string> = {
  easy: 'Short sentence (~8–12 words). Simple present or simple past tense only. One main clause, no subordination. Common everyday vocabulary.',
  medium: 'Typical textbook sentence for this CEFR level. Standard complexity and length.',
  hard: 'Push the upper bound of this CEFR level. Use subordinate clauses, richer vocabulary, and more complex grammar (e.g. Perfekt/Präteritum mix at B1+, double infinitives at B2+, passive or Konjunktiv at C1). Still must not exceed the stated level.',
};

const SYSTEM_PROMPT = `You are a German language tutor generating English sentences for translation practice.

Respond with ONLY a valid JSON object — no markdown, no code fences, no preamble.

Required JSON shape:
{
  "english": "string — the English sentence to translate",
  "referenceTranslations": ["string", "string"],
  "targetGrammarTag": "one of: cases | word_order | prepositions | verb_placement | separable_verbs | tenses",
  "generationNotes": "string — brief internal note, e.g. 'Practicing: Dativ prepositions'"
}

Rules:
- referenceTranslations must contain exactly 2 valid, natural German translations
- targetGrammarTag must identify the primary grammar concept the sentence exercises
- generationNotes is a short hint for the tutor UI (e.g. "Practicing: Perfekt with sein")
- The English sentence must be natural and unambiguous`;

function buildUserPrompt(input: GenerateInput): string {
  const category =
    !input.category || input.category === 'Any'
      ? 'any everyday topic'
      : input.category;

  const focusLine = input.focusTag
    ? `\nFocus grammar concept: ${input.focusTag.replace('_', ' ')}`
    : '';

  const memoryLines =
    input.memoryContext && input.memoryContext.length > 0
      ? `\nThe learner has struggled with these recently — prefer to practise them:\n${input.memoryContext.map((m) => `- ${m}`).join('\n')}`
      : '';

  return `Generate one English sentence for translation practice.

CEFR level: ${input.level}
Difficulty: ${input.difficulty} — ${DIFFICULTY_INSTRUCTIONS[input.difficulty]}
Category: ${category}${focusLine}${memoryLines}

Return the JSON object only.`;
}

// ─── Service function ─────────────────────────────────────────────────────────

export async function generate(input: GenerateInput): Promise<GenerateOutput> {
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
      temperature: 0.9, // variety in sentence generation
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

  const parsed = JSON.parse(raw) as GenerateApiResponse;

  // Validate minimum required fields
  if (typeof parsed.english !== 'string' || !parsed.english.trim()) {
    throw new Error('Invalid response: missing english field');
  }
  if (
    !Array.isArray(parsed.referenceTranslations) ||
    parsed.referenceTranslations.length < 2
  ) {
    throw new Error('Invalid response: referenceTranslations must have at least 2 entries');
  }

  return {
    english: parsed.english.trim(),
    referenceTranslations: parsed.referenceTranslations,
    targetGrammarTag: parsed.targetGrammarTag,
    generationNotes: parsed.generationNotes,
  };
}
