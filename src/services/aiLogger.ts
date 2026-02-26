export type AiLogStage = 'request' | 'response' | 'error';

interface AiLogPayload {
  mode: string;
  stage: AiLogStage;
  durationMs?: number;
  promptLength?: number;
  responseLength?: number;
  gradeLevel?: string;
  hasImage?: boolean;
  error?: string;
}

const MAX_LOGS = 200;
const STORAGE_KEY = 'ai_debug_logs';

export function logAiEvent(payload: AiLogPayload) {
  const enriched = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.debug('[AI_LOG]', enriched);
  }

  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as AiLogPayload[];
    const next = [enriched, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // no-op: logging ne doit jamais casser l'UX
  }
}
