import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import type { WordExplanation } from '../types/practice';

// ─── Input / output ───────────────────────────────────────────────────────────

export interface ExplainWordInput {
  word: string;
}

export type ExplainWordOutput = WordExplanation;

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert German language teacher explaining German words to learners.

Respond with ONLY a valid JSON object — no markdown, no code fences, no preamble.

Required JSON shape:
{
  "word": "string — the word exactly as searched",
  "meaning": "string — concise English translation",
  "baseForm": "string — dictionary/infinitive form",
  "partOfSpeech": "noun" | "verb" | "adjective" | "adverb" | "preposition" | "conjunction" | "pronoun" | "article" | "particle" | "other",
  "grammarTopic": "string — the key grammar concept this word illustrates (e.g. Konjunktiv II, Dativ preposition, separable verb)",
  "explanation": "string — 2–4 sentence explanation of meaning, usage, and any grammar rules",
  "exampleSentences": [
    { "german": "string", "english": "string" }
  ],
  "relatedForms": ["string"],
  "similarWords": [
    { "word": "string", "meaning": "string", "difference": "string" }
  ],
  "commonPatterns": ["string"]
}

Rules:
- exampleSentences: provide exactly 3 natural example sentences
- relatedForms: all conjugations, declensions, or word forms — include at least 4 if applicable
- similarWords: 2–3 words that learners often confuse with this one; explain the distinction concisely
- commonPatterns: 2–4 common sentence patterns or collocations using this word
- If the word is a noun, include gender (der/die/das) in baseForm
- If the word is a verb, include the infinitive and note the auxiliary (haben/sein) for Perfekt`;

function buildUserPrompt(input: ExplainWordInput): string {
  return `Explain the German word: "${input.word}"

Return the JSON object only.`;
}

// ─── Service function ─────────────────────────────────────────────────────────

export async function explainWord(input: ExplainWordInput): Promise<ExplainWordOutput> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const modelName =
    (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-1.5-flash';

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.2, // low variance — factual word explanations should be consistent
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

  const parsed = JSON.parse(raw) as ExplainWordOutput;

  // Validate minimum required fields
  if (typeof parsed.word !== 'string' || !parsed.word.trim()) {
    throw new Error('Invalid response: missing word field');
  }
  if (typeof parsed.explanation !== 'string' || !parsed.explanation.trim()) {
    throw new Error('Invalid response: missing explanation');
  }
  if (!Array.isArray(parsed.exampleSentences) || parsed.exampleSentences.length === 0) {
    throw new Error('Invalid response: exampleSentences must be a non-empty array');
  }

  return parsed;
}
