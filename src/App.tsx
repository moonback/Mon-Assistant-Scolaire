import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { Tab } from './types/app';
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
    const storageKey = `time_spent_${childId}_${today}`;

    // Get time spent today (in minutes)
    let timeSpent = parseInt(localStorage.getItem(storageKey) || '0');

    const updateTime = () => {
      // 1. Bedtime Enforcement
      if (selectedChild.bedtime) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [bedHour, bedMin] = selectedChild.bedtime.split(':').map(Number);
        const bedtimeMinutes = bedHour * 60 + bedMin;
        const wakeUpMinutes = 7 * 60; // 07:00 AM hardcoded wakeup

        let isSleepTime = false;
        if (bedtimeMinutes > wakeUpMinutes) {
          // Night bedtime (e.g., 20:00 to 07:00)
          isSleepTime = currentMinutes >= bedtimeMinutes || currentMinutes < wakeUpMinutes;
        } else {
          // Unusual bedtime (e.g., 01:00 to 07:00)
          isSleepTime = currentMinutes >= bedtimeMinutes && currentMinutes < wakeUpMinutes;
        }

        if (isSleepTime) {
          alert(`🌙 C'est l'heure de dormir pour ${selectedChild.name} ! Ton espace magique se ferme jusqu'à 07:00.`);
          setSelectedChild(null);
          return;
        }
      }

      // 2. Daily Limit Enforcement
      if (selectedChild.daily_time_limit > 0) {
        const remaining = Math.max(0, selectedChild.daily_time_limit - timeSpent);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          alert(`🛑 ${selectedChild.name}, c'est l'heure de faire une pause ! Tes ${selectedChild.daily_time_limit} minutes d'écran sont terminées pour aujourd'hui.`);
          setSelectedChild(null);
        }
      } else {
        setTimeLeft(null); // Unlimited
      }
    };

    updateTime();

    const interval = setInterval(() => {
      timeSpent += 1;
      localStorage.setItem(storageKey, timeSpent.toString());
      updateTime();
    }, 60000);

    return () => clearInterval(interval);
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
          <div className="space-y-6 pb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tabs
                .filter(t => !['home', 'dashboard', 'parental', 'profile'].includes(t.id))
                .filter(t => !selectedChild?.blocked_topics?.includes(t.id))
                .map((tab, idx) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:shadow-2xl transition-all text-left group overflow-hidden relative"
                  >
                    <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${tab.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tab.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:rotate-6 transition-transform`}>
                      <tab.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800">{tab.label}</h4>
                    <p className="text-slate-500 font-medium text-xs mt-2 leading-relaxed line-clamp-2">{tab.desc}</p>
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
      case 'parental': return <ParentalSpace />;
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
