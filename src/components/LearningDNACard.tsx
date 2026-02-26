import { motion } from 'motion/react';
import { Brain, RefreshCw } from 'lucide-react';
import type { LearningProfile } from '../types/learningProfile';
import { MEMORY_LABELS, PACE_LABELS, ERROR_TOLERANCE_LABELS } from '../types/learningProfile';

interface Props {
  profile: LearningProfile | undefined;
  onStartDiagnostic: () => void;
}

export default function LearningDNACard({ profile, onStartDiagnostic }: Props) {
  if (!profile) {
    return (
      <motion.div
        whileHover={{ y: -3 }}
        className="premium-card p-8 border-none shadow-sm text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -ml-16 -mt-16 opacity-60" />

        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center shadow-inner border border-white">
            <Brain className="h-8 w-8 text-indigo-500" />
          </div>

          <h3 className="text-sm font-black text-slate-900 tracking-tight mb-1">ADN d'apprentissage</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Pas encore configuré
          </p>
          <p className="text-xs text-slate-500 font-semibold mb-6">
            Découvre comment ton cerveau aime apprendre en répondant à 6 questions !
          </p>

          <button
            onClick={onStartDiagnostic}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
          >
            <Brain className="h-3.5 w-3.5" /> Lancer le diagnostic
          </button>
        </div>
      </motion.div>
    );
  }

  const mem = MEMORY_LABELS[profile.memory];
  const pace = PACE_LABELS[profile.pace];
  const err = ERROR_TOLERANCE_LABELS[profile.errorTolerance];

  const dimensions = [
    { label: 'Mémoire', ...mem },
    { label: 'Rythme', ...pace },
    { label: 'Face aux erreurs', ...err },
  ];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="premium-card p-8 border-none shadow-sm relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-full blur-3xl -mr-16 -mt-16" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none">ADN d'apprentissage</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Learning DNA</p>
            </div>
          </div>

          <button
            onClick={onStartDiagnostic}
            title="Refaire le diagnostic"
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {dimensions.map((dim, idx) => (
            <motion.div
              key={dim.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl border ${dim.color}`}
            >
              <span className="text-xl shrink-0">{dim.icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{dim.label}</p>
                <p className="text-xs font-black leading-tight">{dim.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
