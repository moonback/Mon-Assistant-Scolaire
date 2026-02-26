import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { checkAndAwardBadges } from '../services/badgeService';
import { BADGE_DEFINITIONS } from '../config/badges';

interface PointsContextType {
  addStars: (amount: number, activityType: string, subject?: string) => Promise<void>;
  showConfetti: boolean;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const { session, selectedChild, refreshChildren } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const addStars = useCallback(async (amount: number, activityType: string, subject: string = 'General') => {
    if (!selectedChild || !session) return;

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    try {
      await supabase.rpc('increment_child_stars', { child_id: selectedChild.id, count: amount });

      await supabase.from('progress').insert({
        user_id: session.user.id,
        child_id: selectedChild.id,
        score: amount,
        activity_type: activityType,
        subject,
        date: new Date().toISOString()
      });

      const currentStars = (selectedChild.stars || 0) + amount;
      const earnedBadges = await checkAndAwardBadges(selectedChild.id, currentStars, selectedChild.badges || []);
      if (earnedBadges.length > 0) {
        setNewBadges(prev => [...prev, ...earnedBadges]);
      }

      await refreshChildren();
    } catch (e) {
      console.error('Échec de la mise à jour des étoiles:', e);
    }
  }, [selectedChild, session, refreshChildren]);

  return (
    <PointsContext.Provider value={{ addStars, showConfetti }}>
      {children}

      {/* Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
          >
            {['⭐', '🌟', '✨', '💫', '🎉', '🎊', '⭐', '🌟', '✨', '💫', '🎉', '🎊', '⭐', '🌟', '✨', '💫'].map((emoji, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  x: `${Math.random() * 100}vw`,
                  y: -60,
                  scale: Math.random() * 0.8 + 0.6,
                  rotate: 0,
                }}
                animate={{
                  y: '110vh',
                  rotate: Math.random() * 720 - 360,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 1.5 + 1.5,
                  delay: Math.random() * 0.8,
                  ease: 'easeIn',
                }}
                className="absolute text-3xl"
              >
                {emoji}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge Earned Modal */}
      <AnimatePresence>
        {newBadges.length > 0 && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"
              onClick={() => setNewBadges([])}
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white rounded-[3rem] p-12 w-full max-w-sm relative z-10 shadow-3xl text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-6 inline-block"
              >
                ✨
              </motion.div>

              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Incroyable !</h2>
              <p className="text-indigo-600 font-black uppercase tracking-widest text-xs mb-8">Nouveau Badge Débloqué</p>

              <div className="space-y-4">
                {newBadges.map(badgeId => {
                  const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
                  return (
                    <div key={badgeId} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <div className="text-5xl mb-3">{badge?.icon}</div>
                      <h3 className="text-xl font-black text-slate-800 mb-1">{badge?.name}</h3>
                      <p className="text-sm font-medium text-slate-500">{badge?.description}</p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setNewBadges([])}
                className="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-lg shadow-indigo-200"
              >
                C'est génial ! 🚀
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints doit être utilisé dans un PointsProvider');
  }
  return context;
}
