import { motion } from 'motion/react';
import { RefreshCcw, Star } from 'lucide-react';
import type { SRSCard, Flashcard } from '../../services/flashcardService';
import { getTheme } from './types';

interface FlashcardCollectionProps {
  collectionCards: SRSCard[];
  onBackToSelect: () => void;
  onReviewCard: (card: Flashcard) => void;
}

export default function FlashcardCollection({
  collectionCards, onBackToSelect, onReviewCard
}: FlashcardCollectionProps) {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <button
              onClick={onBackToSelect}
              className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 mb-2 block transition-colors"
            >
              ← Retour
            </button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ma Collection ✨</h1>
            <p className="text-slate-500 font-semibold text-sm">Tes trésors de connaissances appris avec Magic.</p>
          </div>
          <div className="premium-card px-6 py-4 border-none shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
              <Star className="h-6 w-6 fill-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Mérite Total</p>
              <p className="text-xl font-black text-slate-900 leading-none">
                {collectionCards.reduce((acc, card) => acc + (card.success_count || 0), 0)} ⭐
              </p>
            </div>
          </div>
        </header>

        {collectionCards.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">Tu n'as pas encore de cartes dans ta collection.</p>
            <button
              onClick={onBackToSelect}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm"
            >
              Commencer à apprendre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collectionCards.map((card, i) => {
              const th = getTheme(card.subject);
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="premium-card p-8 border-none shadow-sm flex flex-col justify-between group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-12 -mt-12 opacity-50 group-hover:bg-indigo-100 transition-colors" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${th.color} text-white text-[10px] font-black uppercase tracking-widest`}>
                        {card.subject}
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} className={`w-2 h-2 rounded-full ${idx < card.mastery_level ? 'bg-amber-400' : 'bg-slate-100'}`} />
                        ))}
                      </div>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-2 leading-tight tracking-tight relative z-10">
                      {card.front || card.notion}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold line-clamp-2 italic mb-1 relative z-10">
                      {card.back || 'Pas encore de corrigé détaillé.'}
                    </p>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-white mt-4 space-y-3 relative z-10 shadow-inner">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Dernier essai</p>
                        <p className="text-xs font-bold text-indigo-600 italic">"{card.last_answer || '(vide)'}"</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Émerveillement</p>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                          <span className="text-xs font-black text-amber-600">{card.success_count || 0}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Dernière révision: {new Date(card.last_reviewed_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => onReviewCard({
                        front: card.front || card.notion,
                        back: card.back || card.notion,
                        hint: card.hint || '',
                        subject: card.subject
                      })}
                      className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
