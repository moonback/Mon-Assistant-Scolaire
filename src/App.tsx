import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Clock } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { Tab, ParentalTab } from './types/app';
import { tabs } from './config/tabs';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import ChildSelector from './components/auth/ChildSelector';

// Feature Components
import Assistant from './components/Assistant';
import Quiz from './components/Quiz';
import Story from './components/Story';
import Dictionary from './components/Dictionary';
import MathGame from './components/MathGame';
import DidYouKnow from './components/DidYouKnow';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import DrawingBoard from './components/DrawingBoard';
import HomeworkHelper from './components/HomeworkHelper';
import ParentalSpace from './components/ParentalSpace';
import ChildProfile from './components/ChildProfile';
import DailyChallenges from './components/DailyChallenges';
import Flashcards from './components/Flashcards';

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

  // Time Limit Enforcement & Tracking
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Don't enforce or track time if no child is selected OR if we are in the parental space
    if (!selectedChild || activeTab === 'parental') {
      setTimeLeft(null);
      return;
    }

    const childId = selectedChild.id;
    const today = new Date().toISOString().split('T')[0];

    const fetchAndTimeTracking = async () => {
      // 1. Fetch current time spent from Supabase
      const { data } = await supabase
        .from('daily_child_stats')
        .select('time_spent_minutes')
        .eq('child_id', childId)
        .eq('date', today)
        .maybeSingle();

      if (!isMounted) return;

      let timeSpent = data?.time_spent_minutes || 0;

      const updateTime = () => {
        if (!selectedChild) return false;

        // Bedtime Enforcement
        if (selectedChild.bedtime) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const [bedHour, bedMin] = selectedChild.bedtime.split(':').map(Number);
          const bedtimeMinutes = bedHour * 60 + bedMin;
          const wakeUpMinutes = 7 * 60; // 07:00 AM wakeup

          let isSleepTime = false;
          if (bedtimeMinutes > wakeUpMinutes) {
            isSleepTime = currentMinutes >= bedtimeMinutes || currentMinutes < wakeUpMinutes;
          } else {
            isSleepTime = currentMinutes >= bedtimeMinutes && currentMinutes < wakeUpMinutes;
          }

          if (isSleepTime) {
            setSystemModal({
              show: true,
              type: 'bedtime',
              message: `🌙 C'est l'heure de dormir pour ${selectedChild.name} ! Ton espace magique se ferme jusqu'à 07:00.`
            });
            setSelectedChild(null);
            return true;
          }
        }

        // Daily Limit Enforcement
        if (selectedChild.daily_time_limit > 0) {
          const remaining = Math.max(0, selectedChild.daily_time_limit - timeSpent);
          setTimeLeft(remaining);

          if (remaining <= 0) {
            setSystemModal({
              show: true,
              type: 'limit',
              message: `🛑 ${selectedChild.name}, c'est l'heure de faire une pause ! Tes ${selectedChild.daily_time_limit} minutes d'écran sont terminées pour aujourd'hui.`
            });
            setSelectedChild(null);
            return true;
          }
        } else {
          setTimeLeft(null);
        }
        return false;
      };

      // Initial check
      const blocked = updateTime();
      if (blocked) return;

      // Start interval
      intervalId = setInterval(async () => {
        timeSpent += 1;
        const nowBlocked = updateTime();

        if (nowBlocked) {
          if (intervalId) clearInterval(intervalId);
          return;
        }

        // Update Supabase
        await supabase
          .from('daily_child_stats')
          .upsert({
            child_id: childId,
            date: today,
            time_spent_minutes: timeSpent
          }, { onConflict: 'child_id,date' });
      }, 60000);
    };

    fetchAndTimeTracking();

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedChild, activeTab, setSelectedChild]);

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
          <div className="space-y-4 pb-10">
            <div className="max-w-2xl space-y-1">
              <h3 className="text-xl font-semibold text-slate-900">Activités</h3>
              <p className="text-sm text-slate-500">Choisis une seule activité pour te concentrer.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tabs
                .filter(t => !['home', 'dashboard', 'parental', 'profile'].includes(t.id))
                .filter(t => !selectedChild?.blocked_topics?.includes(t.id))
                .map((tab, idx) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setActiveTab(tab.id)}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition-shadow hover:shadow-sm"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600">
                      <tab.icon className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-900">{tab.label}</h4>
                    <p className="mt-1 text-sm text-slate-500">{tab.desc}</p>
                  </motion.button>
                ))}
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
      case 'parental': return <ParentalSpace activeSubTab={parentalActiveTab} setActiveSubTab={setParentalActiveTab} onExit={() => setActiveTab('home')} />;
      default: return null;
    }
  };

  if (!session) return <AuthPage />;

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
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="text-8xl">✨</div>
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
              {renderContent()}
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
