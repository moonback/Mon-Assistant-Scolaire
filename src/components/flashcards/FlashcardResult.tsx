import { motion } from 'motion/react';
import { RefreshCcw, CheckCircle2, XCircle, Star } from 'lucide-react';
import type { CardResult } from './types';

interface FlashcardResultProps {
  results: CardResult[];
  selectedSubject: string;
  sessionPoints: number;
  onReplay: () => void;
  onBackToSelect: () => void;
}

export default function FlashcardResult({
  results, selectedSubject, sessionPoints, onReplay, onBackToSelect
}: FlashcardResultProps) {
  const successCount = results.filter(r => r.success).length;
  const pct = Math.round((successCount / results.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="premium-card p-10 text-center mb-8 border-none shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

          <div className="text-6xl mb-6 relative z-10 drop-shadow-md">
            {pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight relative z-10">Session terminée !</h2>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-8 relative z-10">{selectedSubject}</p>

          <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50 shadow-inner">
              <p className="text-2xl font-black text-emerald-600 tracking-tight">{successCount}</p>
              <p className="text-[10px] font-black uppercase text-emerald-400 leading-none mt-1">Réussies</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100/50 shadow-inner">
              <p className="text-2xl font-black text-rose-600 tracking-tight">{results.length - successCount}</p>
              <p className="text-[10px] font-black uppercase text-rose-400 leading-none mt-1">À revoir</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50 shadow-inner">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-black text-indigo-600 tracking-tight">+{sessionPoints}</p>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-[10px] font-black uppercase text-indigo-400 leading-none mt-1">Points</p>
            </div>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner relative z-10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-indigo-500 rounded-full"
            />
          </div>

          <div className="flex gap-4 relative z-10">
            <button
              onClick={onReplay}
              className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <RefreshCcw className="h-4 w-4 inline mr-2" /> Rejouer
            </button>
            <button
              onClick={onBackToSelect}
              className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
            >
              Choisir
            </button>
          </div>
        </motion.div>

        {/* Detailed review */}
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Détail de la session</p>
          {results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-2xl flex gap-4 ${r.success ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.success ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                {r.success ? <CheckCircle2 className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white" />}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-black text-slate-700 mb-1 truncate">{r.card.front}</p>
                <p className="text-[11px] text-slate-500 font-bold">
                  Ta réponse : <span className="italic">"{r.childAnswer || '(vide)'}"</span>
                </p>
                <p className="text-[11px] text-teal-600 font-bold mt-1">Corrigé : {r.card.back}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
