import type { IssueType, OverallLabel } from '../types/practice';

export const ISSUE_TYPE_STYLES: Record<IssueType, string> = {
  MEANING: 'bg-red-500/15 text-red-400 border border-red-500/30',
  GRAMMAR: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  WORD_ORDER: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  NATURALNESS: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  ALTERNATIVE: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  MINOR: 'bg-zinc-500/15 text-zinc-400 border border-zinc-600',
};

export const OVERALL_LABEL_STYLES: Record<OverallLabel, string> = {
  Excellent: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Good: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  'Understandable but Unnatural': 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  'Needs Improvement': 'bg-red-500/15 text-red-400 border border-red-500/30',
};
