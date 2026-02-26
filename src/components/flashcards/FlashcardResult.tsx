import { motion } from 'motion/react';
import { RefreshCcw, CheckCircle2, XCircle, Star } from 'lucide-react';
import type { CardResult } from './types';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import SectionHeader from '../ui/SectionHeader';

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
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 to-teal-50/30 p-6">
      <div className="mx-auto max-w-2xl">
        <SectionHeader
          title="Session terminée !"
          subtitle={selectedSubject}
        />

        <AppCard
          as={motion.div}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-8 overflow-hidden border-none p-10 text-center"
        >
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-indigo-50 opacity-50 blur-3xl" />

          <div className="relative z-10 mb-6 text-6xl drop-shadow-md">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}</div>

          <div className="relative z-10 mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-100/50 bg-emerald-50 p-4 shadow-inner">
              <p className="text-2xl font-black tracking-tight text-emerald-600">{successCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-500">Réussies</p>
            </div>
            <div className="rounded-2xl border border-rose-100/50 bg-rose-50 p-4 shadow-inner">
              <p className="text-2xl font-black tracking-tight text-rose-600">{results.length - successCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-rose-500">À revoir</p>
            </div>
            <div className="rounded-2xl border border-indigo-100/50 bg-indigo-50 p-4 shadow-inner">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-black tracking-tight text-indigo-600">+{sessionPoints}</p>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-indigo-500">Points</p>
            </div>
          </div>

          <div className="relative z-10 mb-8 h-2 overflow-hidden rounded-full bg-slate-100 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full bg-indigo-500"
            />
          </div>

          <div className="relative z-10 flex gap-4">
            <AppButton onClick={onReplay} className="flex-1 text-xs uppercase tracking-widest" leftIcon={<RefreshCcw className="h-4 w-4" />}>
              Rejouer
            </AppButton>
            <AppButton onClick={onBackToSelect} variant="secondary" className="flex-1 text-xs uppercase tracking-widest">
              Choisir
            </AppButton>
          </div>
        </AppCard>

        <div className="space-y-4">
          <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500">Détail de la session</p>
          {results.map((r, i) => (
            <AppCard
              as={motion.div}
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${r.success ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'} flex gap-4 p-5`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${r.success ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                {r.success ? <CheckCircle2 className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white" />}
              </div>
              <div className="min-w-0 text-left">
                <p className="mb-1 truncate text-xs font-black text-slate-700">{r.card.front}</p>
                <p className="text-xs font-bold text-slate-500">Ta réponse : <span className="italic">"{r.childAnswer || '(vide)'}"</span></p>
                <p className="mt-1 text-xs font-bold text-teal-600">Corrigé : {r.card.back}</p>
              </div>
            </AppCard>
          ))}
        </div>
      </div>
    </div>
  );
}
