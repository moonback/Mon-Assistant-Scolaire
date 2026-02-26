import { motion } from 'motion/react';
import { Zap, ArrowRight } from 'lucide-react';
import { getTheme } from './types';
import SectionHeader from '../ui/SectionHeader';
import AppCard from '../ui/AppCard';
import ProgressPill from '../ui/ProgressPill';

interface FlashcardSelectProps {
  subjects: string[];
  dueCount: number;
  onStartSession: (subject: string) => void;
  onStartReview: () => void;
  onOpenCollection: () => void;
}

export default function FlashcardSelect({
  subjects, dueCount, onStartSession, onStartReview, onOpenCollection
}: FlashcardSelectProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        title="Mes Flashcards 📚"
        subtitle="Écris ta réponse avant de voir le corrigé."
        action={
          <ProgressPill
            label="Cartes du jour"
            value={`${subjects.length * 5}`}
            tone="indigo"
          />
        }
      />

      {dueCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-8 flex cursor-pointer items-center justify-between overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-xl shadow-orange-100 group"
          onClick={onStartReview}
        >
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-white/10 blur-3xl transition-colors group-hover:bg-white/20" />
          <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/20 shadow-inner backdrop-blur-md">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-widest opacity-80">Révisions prioritaires</p>
              <h3 className="text-xl font-black tracking-tight">{dueCount} notion{dueCount > 1 ? 's' : ''} à consolider</h3>
              <p className="text-sm font-bold opacity-90">Ne les laisse pas s'échapper de ton cerveau !</p>
            </div>
          </div>
          <ArrowRight className="h-8 w-8 shrink-0 opacity-40 transition-transform group-hover:translate-x-2" />
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <AppCard
          as={motion.button}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenCollection}
          className="relative flex flex-col items-center justify-center gap-5 overflow-hidden border-none bg-slate-900 p-7 text-left"
        >
          <div className="absolute right-0 top-0 -mr-12 -mt-12 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl shadow-inner">📚</div>
          <div className="relative z-10 text-center">
            <p className="mb-0.5 text-base font-black tracking-tight text-white">Ma Collection</p>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Voir tes cartes</p>
          </div>
        </AppCard>

        {subjects.map((subject, i) => {
          const th = getTheme(subject);
          return (
            <AppCard
              as={motion.button}
              key={subject}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStartSession(subject)}
              className="flex flex-col items-center justify-center gap-5 border-none p-7 text-left"
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${th.color} text-3xl shadow-lg shadow-slate-100 transition-transform duration-500 hover:scale-110`}>
                {th.icon}
              </div>
              <div className="text-center">
                <p className="mb-0.5 text-base font-black tracking-tight text-slate-900">{subject}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">5 nouvelles cartes</p>
              </div>
            </AppCard>
          );
        })}
      </div>
    </div>
  );
}
