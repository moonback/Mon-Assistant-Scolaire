import type { Flashcard } from '../../services/flashcardService';

export type CardStep = 'question' | 'reveal';
export type Phase = 'select' | 'loading' | 'session' | 'result' | 'collection';

export interface CardResult {
  card: Flashcard;
  success: boolean;
  childAnswer: string;
}

export const SUBJECT_THEMES: Record<string, { color: string; icon: string }> = {
  'Mathématiques': { color: 'from-blue-500 to-indigo-600', icon: '🔢' },
  'Maths': { color: 'from-blue-500 to-indigo-600', icon: '🔢' },
  'Français': { color: 'from-purple-500 to-pink-600', icon: '📖' },
  'Sciences': { color: 'from-emerald-500 to-teal-600', icon: '🔬' },
  'Histoire': { color: 'from-amber-500 to-orange-600', icon: '🏛️' },
  'Géographie': { color: 'from-cyan-500 to-sky-600', icon: '🌍' },
  'Lecture': { color: 'from-rose-500 to-red-600', icon: '📚' },
  'Résolution de problèmes': { color: 'from-violet-500 to-purple-600', icon: '🧩' },
};

export function getTheme(subject: string) {
  return SUBJECT_THEMES[subject] || { color: 'from-teal-500 to-cyan-600', icon: '⭐' };
}
