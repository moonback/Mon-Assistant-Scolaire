import { motion } from 'motion/react';
import { Zap, ArrowRight, Star } from 'lucide-react';
import { getTheme } from './types';

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
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mes Flashcards 📚</h1>
          <p className="text-slate-500 font-semibold text-sm">Écris ta réponse avant de voir le corrigé.</p>
        </div>
      </header>

      {dueCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-6 rounded-[2.5rem] bg-gradient-to-r from-amber-500 to-orange-500 text-white cursor-pointer shadow-xl shadow-orange-100 flex items-center justify-between group overflow-hidden relative"
          onClick={onStartReview}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-colors" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner border border-white/30">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">Révisions prioritaires</p>
              <h3 className="font-black text-xl tracking-tight">{dueCount} notion{dueCount > 1 ? 's' : ''} à consolider</h3>
              <p className="text-xs font-bold opacity-90">Ne les laisse pas s'échapper de ton cerveau !</p>
            </div>
          </div>
          <ArrowRight className="h-8 w-8 opacity-40 shrink-0 group-hover:translate-x-2 transition-transform" />
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Collection Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenCollection}
          className="premium-card p-7 text-left flex flex-col items-center justify-center gap-5 border-none shadow-sm group bg-slate-900 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow-inner relative z-10">
            📚
          </div>
          <div className="text-center relative z-10">
            <p className="font-black text-white text-base tracking-tight mb-0.5">Ma Collection</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Voir tes cartes</p>
          </div>
        </motion.button>

        {subjects.map((subject, i) => {
          const th = getTheme(subject);
          return (
            <motion.button
              key={subject}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStartSession(subject)}
              className="premium-card p-7 text-left flex flex-col items-center justify-center gap-5 border-none shadow-sm group"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${th.color} flex items-center justify-center text-3xl shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform duration-500`}>
                {th.icon}
              </div>
              <div className="text-center">
                <p className="font-black text-slate-900 text-base tracking-tight mb-0.5">{subject}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">5 nouvelles cartes</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
