import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Check, Minus, Zap } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import type { Plan } from '../../types/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURE_LABELS: Record<string, string> = {
  daily_challenges_basic: 'Defis quotidiens',
  daily_challenges_themes: 'Themes personnalises',
  ai_assistant_text: 'Assistant IA (texte)',
  ai_assistant_image: 'Assistant IA (image)',
  ai_assistant_voice: 'Assistant IA (voix)',
  math_game_basic: 'Calcul mental',
  math_game_advanced: 'Calcul avance',
  quiz_basic: 'Quiz',
  quiz_unlimited: 'Quiz illimites',
  dictionary: 'Dictionnaire',
  did_you_know: 'Le savais-tu ?',
  drawing_board: 'Atelier dessin',
  dashboard_basic: 'Tableau de bord',
  dashboard_charts: 'Graphiques detailles',
  dashboard_analytics: 'Analyses avancees',
  flashcards_full: 'Flashcards & SRS',
  homework_helper: 'Aide aux devoirs (photo)',
  story_creator: 'Createur d\'histoires',
  parental_time_limit: 'Limite de temps',
  parental_topic_blocking: 'Bloquer des sujets',
  parental_bedtime: 'Heure de coucher',
  parental_competitions: 'Competitions fratrie',
  badges_all: 'Tous les badges',
  avatars_basic: 'Avatars de base',
  avatars_all: 'Tous les avatars',
  pedagogical_hub: 'Hub pedagogique',
  sibling_competitions: 'Defis entre freres/soeurs',
  star_marketplace: 'Boutique de recompenses',
};

const DISPLAY_FEATURES = [
  'daily_challenges_basic',
  'daily_challenges_themes',
  'ai_assistant_text',
  'ai_assistant_image',
  'ai_assistant_voice',
  'quiz_basic',
  'quiz_unlimited',
  'flashcards_full',
  'homework_helper',
  'story_creator',
  'dashboard_charts',
  'pedagogical_hub',
  'sibling_competitions',
  'star_marketplace',
  'badges_all',
  'avatars_all',
];

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (isOpen) {
      subscriptionService.getPlans().then(setPlans);
    }
  }, [isOpen]);

  const freePlan = plans.find(p => p.name === 'free');
  const premiumPlan = plans.find(p => p.name === 'premium');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl"
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-6 border-b border-slate-100 flex items-center justify-between z-20 rounded-t-[2.5rem]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Passer en Premium</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toutes les fonctionnalites</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Plan cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Free */}
                <div className="rounded-2xl border-2 border-slate-200 p-6">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Gratuit</p>
                  <p className="text-4xl font-black text-slate-800">0 &euro;</p>
                  <p className="text-sm text-slate-500 font-bold mt-1">pour toujours</p>
                  <div className="mt-3 text-xs font-bold text-slate-500">
                    {freePlan && <>
                      <p>{(freePlan.limits as any).max_children} enfants max</p>
                      <p>{(freePlan.limits as any).ai_messages_per_day} messages IA/jour</p>
                      <p>{(freePlan.limits as any).quizzes_per_day} quiz/jour</p>
                    </>}
                  </div>
                </div>

                {/* Premium */}
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/30 p-6 relative">
                  <div className="absolute -top-3 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Populaire
                  </div>
                  <p className="text-sm font-black text-amber-600 uppercase tracking-widest mb-1">Premium</p>
                  <p className="text-4xl font-black text-slate-800">
                    {premiumPlan ? `${(premiumPlan.price_monthly / 100).toFixed(2)}` : '7.99'} &euro;
                  </p>
                  <p className="text-sm text-slate-500 font-bold mt-1">/ mois</p>
                  <div className="mt-3 text-xs font-bold text-amber-700">
                    {premiumPlan && <>
                      <p>{(premiumPlan.limits as any).max_children} enfants max</p>
                      <p>Messages IA illimites</p>
                      <p>Quiz illimites</p>
                    </>}
                  </div>
                </div>
              </div>

              {/* Feature comparison */}
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <span>Fonctionnalite</span>
                  <span className="text-center">Gratuit</span>
                  <span className="text-center text-amber-600">Premium</span>
                </div>
                {DISPLAY_FEATURES.map(featureKey => {
                  const freeHas = freePlan?.features.includes(featureKey as any);
                  const premiumHas = premiumPlan?.features.includes(featureKey as any);
                  return (
                    <div key={featureKey} className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-bold text-slate-700">
                        {FEATURE_LABELS[featureKey] || featureKey}
                      </span>
                      <span className="flex justify-center">
                        {freeHas ? <Check className="w-4 h-4 text-emerald-500" /> : <Minus className="w-4 h-4 text-slate-300" />}
                      </span>
                      <span className="flex justify-center">
                        {premiumHas ? <Check className="w-4 h-4 text-amber-500" /> : <Minus className="w-4 h-4 text-slate-300" />}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-8 text-center space-y-3">
                <button
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-amber-200 hover:scale-[1.02] transition-all"
                  onClick={onClose}
                >
                  Bientot disponible !
                </button>
                <p className="text-xs text-slate-400 font-bold">
                  Le paiement sera active prochainement. Restez informe !
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
