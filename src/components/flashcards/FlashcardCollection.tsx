import { motion } from 'motion/react';
import { RefreshCcw, Star, BookOpen } from 'lucide-react';
import type { SRSCard, Flashcard } from '../../services/flashcardService';
import { getTheme } from './types';
import SectionHeader from '../ui/SectionHeader';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import EmptyStateKid from '../ui/EmptyStateKid';
import ProgressPill from '../ui/ProgressPill';

interface FlashcardCollectionProps {
  collectionCards: SRSCard[];
  onBackToSelect: () => void;
  onReviewCard: (card: Flashcard) => void;
}

export default function FlashcardCollection({
  collectionCards, onBackToSelect, onReviewCard
}: FlashcardCollectionProps) {
  const meritTotal = collectionCards.reduce((acc, card) => acc + (card.success_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          title="Ma Collection ✨"
          subtitle="Tes trésors de connaissances appris avec Magic."
          action={<ProgressPill label="Mérite total" value={`${meritTotal} ⭐`} tone="amber" />}
        />

        <div className="mb-8 mt-4">
          <AppButton variant="ghost" onClick={onBackToSelect} className="text-xs uppercase tracking-wide">
            ← Retour
          </AppButton>
        </div>

        {collectionCards.length === 0 ? (
          <EmptyStateKid
            icon={<BookOpen className="h-6 w-6" />}
            title="Tu n'as pas encore de cartes"
            description="Lance une session de flashcards pour remplir ta collection."
            ctaLabel="Commencer à apprendre"
            onCta={onBackToSelect}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {collectionCards.map((card, i) => {
              const th = getTheme(card.subject);
              return (
                <AppCard
                  as={motion.div}
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative flex flex-col justify-between overflow-hidden border-none p-8"
                >
                  <div className="absolute right-0 top-0 -mr-12 -mt-12 h-24 w-24 rounded-full bg-indigo-50 opacity-50 blur-2xl transition-colors group-hover:bg-indigo-100" />
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ${th.color}`}>
                        {card.subject}
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} className={`h-2 w-2 rounded-full ${idx < card.mastery_level ? 'bg-amber-400' : 'bg-slate-100'}`} />
                        ))}
                      </div>
                    </div>
                    <h3 className="relative z-10 mb-2 text-base font-black tracking-tight text-slate-900">{card.front || card.notion}</h3>
                    <p className="relative z-10 mb-1 line-clamp-2 text-xs font-semibold italic text-slate-500">{card.back || 'Pas encore de corrigé détaillé.'}</p>
                    <div className="relative z-10 mt-4 space-y-3 rounded-2xl border border-white bg-slate-50/50 p-4 shadow-inner">
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Dernier essai</p>
                        <p className="text-xs font-bold italic text-indigo-600">"{card.last_answer || '(vide)'}"</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Émerveillement</p>
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5">
                          <span className="text-xs font-black text-amber-600">{card.success_count || 0}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dernière révision: {new Date(card.last_reviewed_at).toLocaleDateString()}</p>
                    <AppButton
                      variant="ghost"
                      onClick={() => onReviewCard({ front: card.front || card.notion, back: card.back || card.notion, hint: card.hint || '', subject: card.subject })}
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </AppButton>
                  </div>
                </AppCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
