import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { usePoints } from '../contexts/PointsContext';
import { tabs } from '../config/tabs';
import SiblingCompetition from './SiblingCompetition';
import ParentalMissions from './ParentalMissions';
import type { Tab } from '../types/app';
import { Brain } from 'lucide-react';

interface HomePageProps {
  setActiveTab: (tab: Tab) => void;
}

const FEATURED_TABS: Tab[] = ['home', 'dashboard', 'parental', 'profile', 'challenges', 'assistant', 'flashcards', 'market', 'math'];

export default function HomePage({ setActiveTab }: HomePageProps) {
  const { selectedChild, children } = useAuth();
  const { addStars } = usePoints();

  return (
    <div className="space-y-6 pb-10 max-w-8xl mx-auto">


      {/* Learning DNA Banner */}
      {selectedChild && !selectedChild.learning_profile && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('profile')}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-100 p-5 flex items-center gap-4 text-left transition-all hover:shadow-md group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-md">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Découvre ton ADN d'apprentissage !</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              6 questions pour que l'IA s'adapte à toi
            </p>
          </div>
          <span className="text-indigo-400 group-hover:text-indigo-600 transition-colors text-lg shrink-0">→</span>
        </motion.button>
      )}

      <SiblingCompetition />
      <ParentalMissions onEarnPoints={addStars} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Featured Activity Cards */}
        <ActivityCard
          hidden={selectedChild?.blocked_topics?.includes('assistant')}
          onClick={() => setActiveTab('assistant')}
          emoji="🤖" bgClass="bg-blue-50" title="Cerveau Magique" subtitle="Pose toutes tes questions !"
        />
        <ActivityCard
          hidden={selectedChild?.blocked_topics?.includes('quiz')}
          onClick={() => setActiveTab('quiz')}
          emoji="🧠" bgClass="bg-purple-50" title="Générateur de Quiz" subtitle="Teste tes connaissances !"
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
        <ActivityCard
          hidden={selectedChild?.blocked_topics?.includes('story')}
          onClick={() => setActiveTab('story')}
          emoji="📖" bgClass="bg-orange-50" title="Créateur de Histoires" subtitle="Invente tes propres contes !"
        />
        <ActivityCard
          hidden={selectedChild?.blocked_topics?.includes('homework')}
          onClick={() => setActiveTab('homework')}
          emoji="📸" bgClass="bg-indigo-50" title="Aide aux devoirs" subtitle="Prends tes devoirs en photo !"
        />

        {/* Duels - Takes full width on mobile/tablet, single slot on desktop */}
        {children.filter(c => c.id !== selectedChild?.id).length > 0 && (
          <div className="md:col-span-2 lg:col-span-3 mt-4">
            <MissionBanner
              icon="⚔️"
              title="Lancer un Duel"
              desc="Défie tes frères et sœurs et montre qui est le meilleur !"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-duel-modal'));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

interface MissionBannerProps {
  onClick: () => void;
  icon?: string;
  title?: string;
  desc?: string;
}

function MissionBanner({ onClick, icon = "🎯", title = "Mission du Jour", desc = "Gagne tes étoiles en relevant tes défis quotidiens !" }: MissionBannerProps) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full rounded-[2rem] bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-6 md:p-7 text-left shadow-xl shadow-indigo-200/40 flex items-center gap-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/20 transition-colors" />
      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner border border-white/30 relative z-10">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="flex-1 text-white relative z-10">
        <h3 className="text-lg font-black mb-0.5 tracking-tight">{title}</h3>
        <p className="text-white/80 font-bold text-sm leading-snug max-w-sm">
          {desc}
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
