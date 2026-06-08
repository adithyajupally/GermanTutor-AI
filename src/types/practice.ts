// ─── Primitive types ──────────────────────────────────────────────────────────

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type CEFRLevel = (typeof CEFR_LEVELS)[number];

export type Difficulty = 'easy' | 'medium' | 'hard';

export const CATEGORIES = [
  'Any',
  'Daily Life',
  'Work',
  'Travel',
  'School',
  'Relationships',
  'Technology',
  'Emotions',
  'German Exam Prep',
] as const;
export type Category = (typeof CATEGORIES)[number];

export type PracticeView = 'setup' | 'translating' | 'result';

// SPEC §2.4 / §4
export type GrammarTag =
  | 'cases'
  | 'word_order'
  | 'prepositions'
  | 'verb_placement'
  | 'separable_verbs'
  | 'tenses';

// SPEC §7.1
export type Strictness = 'relaxed' | 'normal' | 'exam';

// ─── Evaluation types ─────────────────────────────────────────────────────────

export type IssueType =
  | 'MEANING'
  | 'GRAMMAR'
  | 'WORD_ORDER'
  | 'NATURALNESS'
  | 'ALTERNATIVE'
  | 'MINOR';

export type Severity = 'blocking' | 'major' | 'minor';

export type OverallLabel =
  | 'Excellent'
  | 'Good'
  | 'Understandable but Unnatural'
  | 'Needs Improvement';

export type ExplainTier = 'a1' | 'a2' | 'b1';

export type AlternativeLabel = 'Natural' | 'Formal' | 'Casual' | 'Other';

export type VocabItemType =
  | 'noun'
  | 'verb'
  | 'separable_verb'
  | 'collocation'
  | 'pattern';

export interface Issue {
  type: IssueType;
  severity: Severity;
  original: string;
  correction?: string;
  explanation: string;
}

export interface AlternativeTranslation {
  label: AlternativeLabel;
  translation: string;
}

export interface VocabItem {
  word: string;
  type: VocabItemType;
  note: string;
}

export interface Explanation {
  a1?: string;
  a2?: string;
  b1?: string;
}

export interface GeneratedSentence {
  english: string;
  referenceTranslations: string[];
}

export interface EvaluationResult {
  verdict: string;
  overallLabel: OverallLabel;
  isUserAnswerValid: boolean;
  scores: {
    meaning: number;
    grammar: number;
    wordOrder: number;
    naturalness: number;
  };
  issues: Issue[];
  whyNotMyVersion: string;
  alternatives: AlternativeTranslation[];
  vocabulary: VocabItem[];
  explanations: Explanation;
}

// SPEC §2.4 / §9 — stored in gta_history (max 20)
export interface AttemptSummary {
  id: string;
  timestamp: number; // ms since epoch
  english: string;
  level: CEFRLevel;
  difficulty: Difficulty;
  overallLabel: OverallLabel;
  scores: {
    meaning: number;
    grammar: number;
    wordOrder: number;
    naturalness: number;
  };
  grammarTag?: GrammarTag;
}

// SPEC §2.4 / §9 — stored in gta_notebook
export type NotebookFilter =
  | 'all'
  | 'cases'
  | 'word_order'
  | 'prepositions'
  | 'verb_placement'
  | 'separable_verbs'
  | 'tenses';

export interface NotebookEntry {
  id: string;
  timestamp: number;
  english: string;
  userGerman: string;
  level: CEFRLevel;
  difficulty: Difficulty;
  issueType: IssueType;
  severity: Severity;
  original: string;
  correction?: string;
  explanation: string;
  grammarTag?: GrammarTag;
  savedManually: boolean;
}
export interface WordExample {
  german: string;
  english: string;
}

export interface SimilarWord {
  word: string;
  meaning: string;
  difference: string;
}

export interface WordExplanation {
  word: string;
  meaning: string;
  baseForm: string;
  partOfSpeech: string;
  grammarTopic: string;
  explanation: string;

  exampleSentences: WordExample[];

  relatedForms: string[];

  commonPatterns: string[];

  similarWords: SimilarWord[];
}
