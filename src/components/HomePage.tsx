import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { usePoints } from '../contexts/PointsContext';
import { tabs } from '../config/tabs';
import SiblingCompetition from './SiblingCompetition';
import ParentalMissions from './ParentalMissions';
import type { Tab } from '../types/app';

interface HomePageProps {
  setActiveTab: (tab: Tab) => void;
}

const FEATURED_TABS: Tab[] = ['home', 'dashboard', 'parental', 'profile', 'challenges', 'assistant', 'flashcards', 'market', 'math'];

export default function HomePage({ setActiveTab }: HomePageProps) {
  const { selectedChild, children } = useAuth();

  return (
    <div className="space-y-6 pb-10 max-w-8xl mx-auto">


      <SiblingCompetition />
      <ParentalMissions />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Mission du jour */}
        {!selectedChild?.blocked_topics?.includes('challenges') && (
          <MissionBanner onClick={() => setActiveTab('challenges')} />
        )}

        {/* Featured Activity Cards */}
        <ActivityCard
          hidden={selectedChild?.blocked_topics?.includes('assistant')}
          onClick={() => setActiveTab('assistant')}
          emoji="🤖" bgClass="bg-blue-50" title="Cerveau Magique" subtitle="Pose toutes tes questions !"
        />
        <ActivityCard
          hidden={selectedChild?.blocked_topics?.includes('market')}
          onClick={() => setActiveTab('market')}
          emoji="🎁" bgClass="bg-yellow-50" title="La Boutique" subtitle="Échange tes étoiles !"
        />
        <ActivityCard
          hidden={selectedChild?.blocked_topics?.includes('flashcards')}
          onClick={() => setActiveTab('flashcards')}
          emoji="📚" bgClass="bg-emerald-50" title="Cartes Mémoire" subtitle="Révise en t'amusant !"
        />
        <ActivityCard
          hidden={selectedChild?.blocked_topics?.includes('math')}
          onClick={() => setActiveTab('math')}
          emoji="🔢" bgClass="bg-teal-50" title="Calcul Mental" subtitle="Deviens un pro !"
        />

        {/* Duels */}
        {children.filter(c => c.id !== selectedChild?.id).length > 0 && (
          <ActivityCard
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-duel-modal'));
            }}
            emoji="⚔️" bgClass="bg-rose-50" title="Lancer un Duel" subtitle="Défie tes frères & sœurs !"
          />
        )}
      </div>

      {/* Other activities */}
      <div className="pt-6 mt-2 border-t-2 border-slate-100">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 px-2">Plus d'activités</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tabs
            .filter(t => !FEATURED_TABS.includes(t.id))
            .filter(t => !selectedChild?.blocked_topics?.includes(t.id))
            .map((tab, idx) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className="premium-card p-5 flex flex-col items-center gap-4 border-none shadow-sm"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <tab.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-black text-slate-700 tracking-tight">{tab.label}</span>
              </motion.button>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function MissionBanner({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="col-span-2 lg:col-span-4 rounded-[2rem] bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-6 md:p-7 text-left shadow-xl shadow-indigo-200/40 flex items-center gap-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/20 transition-colors" />
      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner border border-white/30 relative z-10">
        <span className="text-3xl">🎯</span>
      </div>
      <div className="flex-1 text-white relative z-10">
        <h3 className="text-lg font-black mb-0.5 tracking-tight">Mission du Jour</h3>
        <p className="text-white/80 font-bold text-sm leading-snug max-w-sm">
          Gagne tes étoiles en relevant tes défis quotidiens !
        </p>
      </div>
      <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl relative z-10 group-hover:bg-white/20 transition-colors">
        →
      </div>
    </motion.button>
  );
}

interface ActivityCardProps {
  onClick: () => void;
  emoji: string;
  bgClass: string;
  title: string;
  subtitle: string;
  hidden?: boolean;
}

function ActivityCard({ onClick, emoji, bgClass, title, subtitle, hidden }: ActivityCardProps) {
  if (hidden) return null;

  return (
    <motion.button
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="premium-card p-7 flex flex-col items-center text-center gap-5 border-none shadow-sm"
    >
      <div className={`w-16 h-16 ${bgClass} rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden group`}>
        <span className="text-3xl relative z-10">{emoji}</span>
      </div>
      <div>
        <h3 className="text-base font-black text-slate-900 mb-0.5 tracking-tight">{title}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subtitle}</p>
      </div>
    </motion.button>
  );
}
