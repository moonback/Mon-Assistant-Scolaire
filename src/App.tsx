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

  // Time Limit Enforcement
  useEffect(() => {
    if (!selectedChild?.daily_time_limit) return;

    const childId = selectedChild.id;
    const sessionStart = sessionStorage.getItem(`session_start_${childId}`) || Date.now().toString();

    if (!sessionStorage.getItem(`session_start_${childId}`)) {
      sessionStorage.setItem(`session_start_${childId}`, sessionStart);
    }

    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - parseInt(sessionStart)) / (60000);
      if (elapsedMinutes > selectedChild.daily_time_limit) {
        alert("🛑 C'est l'heure de faire une pause ! Ton temps d'écran est terminé pour aujourd'hui.");
        setSelectedChild(null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedChild, setSelectedChild]);

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
              className="magical-gradient rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">
                  Bonjour, <span className="text-yellow-200">{selectedChild?.name}</span> ! 👋
                </h2>
                <p className="text-white/80 text-lg font-medium max-w-xl leading-relaxed mb-6">
                  Prêt pour tes missions du jour ?
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 flex items-center gap-3 transition-transform hover:scale-105">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg text-lg">
                      ⭐
                    </div>
                    <span className="font-black text-xl">{selectedChild?.stars} <span className="text-sm opacity-80">pts</span></span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 flex items-center gap-3 transition-transform hover:scale-105">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg text-white text-sm">
                      🎓
                    </div>
                    <span className="font-black text-xl uppercase tracking-wider">{selectedChild?.grade_level}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tabs
                .filter(t => !['home', 'dashboard', 'parental', 'profile'].includes(t.id))
                .map((tab, idx) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className="bg-white p-8 rounded-[3rem] border border-slate-100 hover:shadow-2xl transition-all text-left group overflow-hidden relative"
                  >
                    <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${tab.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tab.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform`}>
                      <tab.icon className="w-7 h-7" />
                    </div>
                    <h4 className="text-xl font-black text-slate-800">{tab.label}</h4>
                    <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">{tab.desc}</p>
                  </motion.button>
                ))}
            </div>
          </div>
        );
      case 'dashboard': return <Dashboard />;
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
        tabs={tabs}
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
        tabs={tabs}
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
