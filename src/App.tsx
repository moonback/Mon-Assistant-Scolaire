import { Suspense, lazy, useCallback, useEffect, useState, useMemo } from 'react';
import SiblingCompetition from './components/SiblingCompetition';
import ParentalMissions from './components/ParentalMissions';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Clock, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { Tab, ParentalTab } from './types/app';
import { tabs } from './config/tabs';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import ChildSelector from './components/auth/ChildSelector';
import TimeTracker from './components/layout/TimeTracker';

// Feature Components (Lazy loaded)
const Assistant = lazy(() => import('./components/Assistant'));
const Quiz = lazy(() => import('./components/Quiz'));
const Story = lazy(() => import('./components/Story'));
const Dictionary = lazy(() => import('./components/Dictionary'));
const MathGame = lazy(() => import('./components/MathGame'));
const DidYouKnow = lazy(() => import('./components/DidYouKnow'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const DrawingBoard = lazy(() => import('./components/DrawingBoard'));
const HomeworkHelper = lazy(() => import('./components/HomeworkHelper'));
const ParentalSpace = lazy(() => import('./components/ParentalSpace'));
const ChildProfile = lazy(() => import('./components/ChildProfile'));
const DailyChallenges = lazy(() => import('./components/DailyChallenges'));
const Flashcards = lazy(() => import('./components/Flashcards'));
const StarMarket = lazy(() => import('./components/StarMarket'));
import { checkAndAwardBadges } from './services/badgeService';
import { BADGE_DEFINITIONS } from './config/badges';

function AppContent() {
  const { session, children, selectedChild, setSelectedChild, signOut, refreshChildren } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [parentalActiveTab, setParentalActiveTab] = useState<ParentalTab>('overview');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [systemModal, setSystemModal] = useState<{
    show: boolean;
    type: 'limit' | 'bedtime';
    message: string;
  }>({ show: false, type: 'limit', message: '' });

  const showChildSelector = !selectedChild && activeTab !== 'parental';

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth < 1280);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Setup handled via TimeTracker
  const handleLimitReached = useCallback((message: string) => {
    setSystemModal({ show: true, type: 'limit', message });
  }, []);

  const handleBedtimeReached = useCallback((message: string) => {
    setSystemModal({ show: true, type: 'bedtime', message });
  }, []);

  // Daily Challenge Notifications
  useEffect(() => {
    if (!selectedChild || !('Notification' in window)) return;

    const checkNotification = async () => {
      const today = new Date().toISOString().split('T')[0];
      const notificationKey = `daily_notif_${selectedChild.id}_${today}`;
      const alreadyShown = localStorage.getItem(notificationKey);

      if (!alreadyShown) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
          // Check if it's morning (before 12:00)
          const hour = new Date().getHours();
          if (hour >= 7 && hour < 12) {
            new Notification('☀️ Bonjour !', {
              body: `Tes nouveaux défis du jour sont prêts ! Viens découvrir le mot et le problème du jour.`,
              icon: '/icons/icon-192x192.png'
            });
            localStorage.setItem(notificationKey, 'true');
          }
        }
      }
    };

    checkNotification();
  }, [selectedChild]);

  const [newBadges, setNewBadges] = useState<string[]>([]);

  // Points/Stars Logic
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
        subject: subject,
        date: new Date().toISOString()
      });

      // Badge logic
      const currentStars = (selectedChild.stars || 0) + amount;
      const earnedBadges = await checkAndAwardBadges(selectedChild.id, currentStars, selectedChild.badges || []);
      if (earnedBadges.length > 0) {
        setNewBadges(prev => [...prev, ...earnedBadges]);
      }

      await refreshChildren();
    } catch (e) {
      console.error('Failed to update stars:', e);
    }
  }, [selectedChild, session, refreshChildren]);

  // Content Dispatcher
  const renderContent = () => {
    const commonProps = {
      onEarnPoints: addStars,
      gradeLevel: selectedChild?.grade_level
    };

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 pb-10 max-w-8xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ton Bureau Magique ✨</h1>
                <p className="text-slate-500 font-semibold text-sm">Choisis ton aventure du jour, {selectedChild?.name} !</p>
              </div>
            </header>

            <SiblingCompetition />
            <ParentalMissions />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Mission du jour */}
              {!selectedChild?.blocked_topics?.includes('challenges') && (
                <motion.button
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('challenges')}
                  className="col-span-1 md:col-span-2 rounded-[2rem] bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-6 md:p-7 text-left shadow-xl shadow-indigo-200/40 flex items-center gap-6 relative overflow-hidden group"
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
              )}

              {/* Cerveau Magique */}
              {!selectedChild?.blocked_topics?.includes('assistant') && (
                <motion.button
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab('assistant')}
                  className="premium-card p-7 flex flex-col items-center text-center gap-5 border-none shadow-sm"
                >
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl relative z-10">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 mb-0.5 tracking-tight">Cerveau Magique</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pose toutes tes questions !</p>
                  </div>
                </motion.button>
              )}

              {/* Boutique */}
              {!selectedChild?.blocked_topics?.includes('market') && (
                <motion.button
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab('market')}
                  className="premium-card p-7 flex flex-col items-center text-center gap-5 border-none shadow-sm"
                >
                  <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-yellow-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl relative z-10">🎁</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 mb-0.5 tracking-tight">La Boutique</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Échange tes étoiles !</p>
                  </div>
                </motion.button>
              )}

              {/* Cartes Mémoire */}
              {!selectedChild?.blocked_topics?.includes('flashcards') && (
                <motion.button
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab('flashcards')}
                  className="premium-card p-7 flex flex-col items-center text-center gap-5 border-none shadow-sm"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl relative z-10">📚</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 mb-0.5 tracking-tight">Cartes Mémoire</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Révise en t'amusant !</p>
                  </div>
                </motion.button>
              )}

              {/* Calcul Mental */}
              {!selectedChild?.blocked_topics?.includes('math') && (
                <motion.button
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab('math')}
                  className="premium-card p-7 flex flex-col items-center text-center gap-5 border-none shadow-sm"
                >
                  <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-teal-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl relative z-10">🔢</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 mb-0.5 tracking-tight">Calcul Mental</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deviens un champion !</p>
                  </div>
                </motion.button>
              )}
            </div>

            {/* Other activities section */}
            <div className="pt-6 mt-2 border-t-2 border-slate-100">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 px-2">Plus d'activités</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tabs
                  .filter(t => !['home', 'dashboard', 'parental', 'profile', 'challenges', 'assistant', 'flashcards', 'market', 'math'].includes(t.id))
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
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner group-hover:bg-indigo-100 transition-colors">
                        <tab.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-black text-slate-700 tracking-tight">{tab.label}</span>
                    </motion.button>
                  ))}
              </div>
            </div>
          </div>
        );
      case 'dashboard': return <Dashboard onEarnPoints={addStars} />;
      case 'challenges': return <DailyChallenges {...commonProps} childId={selectedChild?.id || ''} />;
      case 'flashcards': return <Flashcards childId={selectedChild?.id || ''} gradeLevel={selectedChild?.grade_level || 'CM1'} onEarnPoints={addStars} />;
      case 'assistant': return <Assistant {...commonProps} />;
      case 'quiz': return <Quiz {...commonProps} />;
      case 'math': return <MathGame onEarnPoints={addStars} />;
      case 'story': return <Story />;
      case 'drawing': return <DrawingBoard />;
      case 'homework': return <HomeworkHelper {...commonProps} />;
      case 'dictionary': return <Dictionary />;
      case 'fact': return <DidYouKnow />;
      case 'profile': return <ChildProfile />;
      case 'market': return <StarMarket {...commonProps} childId={selectedChild?.id || ''} />;
      case 'parental': return <ParentalSpace activeSubTab={parentalActiveTab} setActiveSubTab={setParentalActiveTab} onExit={() => setActiveTab('home')} />;
      default: return null;
    }
  };

  if (!session) return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <AuthPage />
    </Suspense>
  );

  const content = showChildSelector ? (
    <ChildSelector
      children={children}
      setSelectedChild={setSelectedChild}
      setActiveTab={setActiveTab}
      signOut={signOut}
    />
  ) : (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900">
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

      <Sidebar
        tabs={tabs.filter(t => !selectedChild?.blocked_topics?.includes(t.id) || ['home', 'dashboard', 'profile', 'parental'].includes(t.id))}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        selectedChild={selectedChild}
        setSelectedChild={setSelectedChild}
        parentalActiveTab={parentalActiveTab}
        setParentalActiveTab={setParentalActiveTab}
      />

      <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header
          activeTab={activeTab}
          tabs={tabs}
          selectedChild={selectedChild}
          timeLeft={timeLeft}
          setIsMobileNavOpen={setIsMobileNavOpen}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        tabs={tabs.filter(t => !selectedChild?.blocked_topics?.includes(t.id) || ['home', 'dashboard', 'profile', 'parental'].includes(t.id))}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parentalActiveTab={parentalActiveTab}
        setParentalActiveTab={setParentalActiveTab}
      />
    </div>
  );

  return (
    <>
      <TimeTracker
        activeTab={activeTab}
        setTimeLeft={setTimeLeft}
        onLimitReached={handleLimitReached}
        onBedtimeReached={handleBedtimeReached}
      />
      {content}

      {/* System Status Modal (Time up / Bedtime) */}
      <AnimatePresence>
        {systemModal.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setSystemModal({ ...systemModal, show: false })}
            />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg relative z-10 shadow-2xl border border-white/20 text-center"
            >
              <div className={`mx-auto w-24 h-24 rounded-3xl flex items-center justify-center mb-8 ${systemModal.type === 'bedtime' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'
                }`}>
                {systemModal.type === 'bedtime' ? (
                  <Moon className="w-12 h-12" />
                ) : (
                  <Clock className="w-12 h-12" />
                )}
              </div>

              <h2 className="text-3xl font-black text-slate-800 mb-4 leading-tight">
                {systemModal.type === 'bedtime' ? 'Bonne nuit ! 🌙' : 'Pause nécessaire ! 🛑'}
              </h2>

              <p className="text-slate-600 font-bold text-lg mb-10 leading-relaxed">
                {systemModal.message}
              </p>

              <button
                onClick={() => setSystemModal({ ...systemModal, show: false })}
                className={`w-full py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all ${systemModal.type === 'bedtime'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                  }`}
              >
                C'est compris !
              </button>
            </motion.div>
          </div>
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
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
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
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
