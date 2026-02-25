import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
