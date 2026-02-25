import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Star } from 'lucide-react';
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
import ActivityCards from './components/ActivityCards';

function AppContent() {
  const { session, children, selectedChild, setSelectedChild, signOut, refreshChildren } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [parentalActiveTab, setParentalActiveTab] = useState<ParentalTab>('overview');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    if (!selectedChild) {
      setTimeLeft(null);
      return;
    }

    const childId = selectedChild.id;
    const today = new Date().toISOString().split('T')[0];

    const fetchAndTimeTracking = async () => {
      // 1. Fetch current time spent from Supabase
      const { data, error } = await supabase
        .from('daily_child_stats')
        .select('time_spent_minutes')
        .eq('child_id', childId)
        .eq('date', today)
        .maybeSingle();

      let timeSpent = data?.time_spent_minutes || 0;

      const updateTime = () => {
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
            alert(`🌙 C'est l'heure de dormir pour ${selectedChild.name} ! Ton espace magique se ferme jusqu'à 07:00.`);
            setSelectedChild(null);
            return;
          }
        }

        // Daily Limit Enforcement
        if (selectedChild.daily_time_limit > 0) {
          const remaining = Math.max(0, selectedChild.daily_time_limit - timeSpent);
          setTimeLeft(remaining);

          if (remaining <= 0) {
            alert(`🛑 ${selectedChild.name}, c'est l'heure de faire une pause ! Tes ${selectedChild.daily_time_limit} minutes d'écran sont terminées pour aujourd'hui.`);
            setSelectedChild(null);
          }
        } else {
          setTimeLeft(null);
        }
      };

      updateTime();

      const interval = setInterval(async () => {
        timeSpent += 1;
        updateTime();

        // Update Supabase
        await supabase
          .from('daily_child_stats')
          .upsert({
            child_id: childId,
            date: today,
            time_spent_minutes: timeSpent
          }, { onConflict: 'child_id,date' });
      }, 60000);

      return interval;
    };

    let intervalId: NodeJS.Timeout;
    fetchAndTimeTracking().then(id => {
      if (id) intervalId = id;
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedChild, setSelectedChild]);

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
          <div className="space-y-10 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-premium relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-indigo-100/50 transition-colors duration-1000" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50/30 rounded-full -ml-32 -mb-32 blur-3xl" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="relative">
                  <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl rotate-3 group-hover:rotate-6 transition-transform duration-500 animate-float">
                    <span className="text-5xl">✨</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white">
                    <Star className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>

                <div className="text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4">
                    Salut <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 capitalize">{selectedChild?.name}</span> ! 👋
                  </h3>
                  <p className="text-slate-500 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                    Ton espace magique est prêt. Quelle aventure incroyable vas-tu choisir aujourd'hui ?
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-8">
              <div className="flex items-center gap-6 px-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Activités recommandées</h4>
                <div className="h-px bg-slate-100 w-full" />
              </div>
              <ActivityCards
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                selectedChild={selectedChild}
              />
            </div>
          </div>
        );
      case 'dashboard': return <Dashboard onEarnPoints={addStars} />;
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

  if (showChildSelector) {
    return (
      <ChildSelector
        children={children}
        setSelectedChild={setSelectedChild}
        setActiveTab={setActiveTab}
        signOut={signOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="text-[12rem] animate-bounce">✨⭐✨</div>
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

        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
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
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
