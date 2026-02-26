// ─── Learning DNA Types ─────────────────────────────────

export type MemoryType = 'visuelle' | 'verbale' | 'logique';
export type PaceType = 'rapide' | 'normal' | 'lent';
export type ErrorToleranceType = 'high' | 'medium' | 'low';

export interface LearningProfile {
  memory: MemoryType;
  pace: PaceType;
  errorTolerance: ErrorToleranceType;
  generatedAt: string;
  source: 'diagnostic' | 'manual';
}

// ─── Diagnostic Quiz ────────────────────────────────────

export interface DiagnosticQuestion {
  id: number;
  question: string;
  options: DiagnosticOption[];
  dimension: 'memory' | 'pace' | 'errorTolerance';
}

export interface DiagnosticOption {
  label: string;
  value: string;
  icon: string;
}

// ─── Display Constants ──────────────────────────────────

export const MEMORY_LABELS: Record<MemoryType, { label: string; icon: string; description: string; color: string }> = {
  visuelle: { label: 'Visuelle', icon: '👁️', description: 'Tu retiens mieux avec des images et des schémas', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  verbale: { label: 'Verbale', icon: '💬', description: 'Tu retiens mieux en lisant et en écoutant', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  logique: { label: 'Logique', icon: '🧩', description: 'Tu retiens mieux en comprenant le raisonnement', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

export const PACE_LABELS: Record<PaceType, { label: string; icon: string; description: string; color: string }> = {
  rapide: { label: 'Rapide', icon: '⚡', description: 'Tu aimes aller vite et relever des défis', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  normal: { label: 'Normal', icon: '🚶', description: 'Tu avances à ton rythme, bien et régulier', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  lent: { label: 'Posé', icon: '🐢', description: 'Tu prends le temps de bien comprendre', color: 'text-teal-600 bg-teal-50 border-teal-200' },
};

export const ERROR_TOLERANCE_LABELS: Record<ErrorToleranceType, { label: string; icon: string; description: string; color: string }> = {
  high: { label: 'Aventurier', icon: '🦁', description: 'Les erreurs ne te font pas peur !', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  medium: { label: 'Équilibré', icon: '🌟', description: 'Tu acceptes les erreurs mais tu préfères réussir', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  low: { label: 'Perfectionniste', icon: '💎', description: 'Tu aimes faire les choses bien du premier coup', color: 'text-rose-600 bg-rose-50 border-rose-200' },
};
