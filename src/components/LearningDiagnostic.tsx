import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronRight, Sparkles, X } from 'lucide-react';
import { DIAGNOSTIC_QUESTIONS } from '../config/learningDiagnostic';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type {
  LearningProfile,
  MemoryType,
  PaceType,
  ErrorToleranceType,
  MEMORY_LABELS,
  PACE_LABELS,
  ERROR_TOLERANCE_LABELS,
} from '../types/learningProfile';
import {
  MEMORY_LABELS as memoryLabels,
  PACE_LABELS as paceLabels,
  ERROR_TOLERANCE_LABELS as errorLabels,
} from '../types/learningProfile';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

function computeProfile(answers: Record<number, string>): LearningProfile {
  const tally = (dim: string): string => {
    const vals = DIAGNOSTIC_QUESTIONS
      .filter((q) => q.dimension === dim)
      .map((q) => answers[q.id])
      .filter(Boolean);
    const counts: Record<string, number> = {};
    for (const v of vals) counts[v] = (counts[v] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  return {
    memory: tally('memory') as MemoryType,
    pace: tally('pace') as PaceType,
    errorTolerance: tally('errorTolerance') as ErrorToleranceType,
    generatedAt: new Date().toISOString(),
    source: 'diagnostic',
  };
}

export default function LearningDiagnostic({ onComplete, onClose }: Props) {
  const { selectedChild, refreshChildren } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<LearningProfile | null>(null);
  const [saving, setSaving] = useState(false);

  const total = DIAGNOSTIC_QUESTIONS.length;
  const currentQ = DIAGNOSTIC_QUESTIONS[step];
  const progress = ((step) / total) * 100;

  const handleAnswer = (value: string) => {
    const updated = { ...answers, [currentQ.id]: value };
    setAnswers(updated);

    if (step < total - 1) {
      setTimeout(() => setStep((s) => s + 1), 350);
    } else {
      const profile = computeProfile(updated);
      setResult(profile);
    }
  };

  const handleSave = async () => {
    if (!selectedChild || !result) return;
    setSaving(true);
    try {
      await supabase
        .from('children')
        .update({ learning_profile: result })
        .eq('id', selectedChild.id);
      await refreshChildren();
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-lg premium-card p-8 border-none shadow-xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all z-20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60" />

        {!result ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Ton profil d'apprentissage</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Question {step + 1} sur {total}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-slate-100 mb-8 overflow-hidden relative z-10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="relative z-10"
              >
                <p className="text-base font-bold text-slate-800 mb-6">{currentQ.question}</p>

                <div className="space-y-3">
                  {currentQ.options.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(opt.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                        answers[currentQ.id] === opt.value
                          ? 'border-indigo-300 bg-indigo-50 shadow-md'
                          : 'border-slate-100 bg-white hover:border-indigo-100 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{opt.icon}</span>
                      <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300 ml-auto shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          /* ── Result Screen ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center relative z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-200"
            >
              <Sparkles className="h-10 w-10 text-white" />
            </motion.div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
              Ton ADN d'apprentissage !
            </h2>
            <p className="text-sm text-slate-500 font-semibold mb-8">
              Voici comment ton cerveau aime apprendre
            </p>

            <div className="space-y-4 text-left mb-8">
              {/* Memory */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border ${memoryLabels[result.memory].color}`}>
                <span className="text-3xl">{memoryLabels[result.memory].icon}</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mémoire</p>
                  <p className="text-sm font-black">{memoryLabels[result.memory].label}</p>
                  <p className="text-xs font-semibold opacity-80">{memoryLabels[result.memory].description}</p>
                </div>
              </div>

              {/* Pace */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border ${paceLabels[result.pace].color}`}>
                <span className="text-3xl">{paceLabels[result.pace].icon}</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Rythme</p>
                  <p className="text-sm font-black">{paceLabels[result.pace].label}</p>
                  <p className="text-xs font-semibold opacity-80">{paceLabels[result.pace].description}</p>
                </div>
              </div>

              {/* Error tolerance */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border ${errorLabels[result.errorTolerance].color}`}>
                <span className="text-3xl">{errorLabels[result.errorTolerance].icon}</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Face aux erreurs</p>
                  <p className="text-sm font-black">{errorLabels[result.errorTolerance].label}</p>
                  <p className="text-xs font-semibold opacity-80">{errorLabels[result.errorTolerance].description}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
            >
              {saving ? (
                'Enregistrement...'
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Enregistrer mon profil
                </>
              )}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
