import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PointsProvider, usePoints } from './contexts/PointsContext';
import { Tab, ParentalTab } from './types/app';
import { tabs } from './config/tabs';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import ChildSelector from './components/auth/ChildSelector';
import TimeTracker from './components/layout/TimeTracker';
import SystemModal from './components/ui/SystemModal';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Feature Components (Lazy loaded)
const HomePage = lazy(() => import('./components/HomePage'));
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

// ─── Loading Fallback ────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
  </div>
);

// ─── Main App Content ────────────────────────────────────
function AppContent() {
  const { session, children, selectedChild, setSelectedChild, signOut } = useAuth();
  const { addStars } = usePoints();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [parentalActiveTab, setParentalActiveTab] = useState<ParentalTab>('overview');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [systemModal, setSystemModal] = useState<{
    show: boolean;
    type: 'limit' | 'bedtime';
    message: string;
  }>({ show: false, type: 'limit', message: '' });

  const showChildSelector = !selectedChild && activeTab !== 'parental';

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => setIsSidebarCollapsed(window.innerWidth < 1280);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Daily challenge notification
  useEffect(() => {
    if (!selectedChild || !('Notification' in window)) return;

    const checkNotification = async () => {
      const today = new Date().toISOString().split('T')[0];
      const notificationKey = `daily_notif_${selectedChild.id}_${today}`;

      if (!localStorage.getItem(notificationKey)) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        if (Notification.permission === 'granted') {
          const hour = new Date().getHours();
          if (hour >= 7 && hour < 12) {
            new Notification('☀️ Bonjour !', {
              body: 'Tes nouveaux défis du jour sont prêts ! Viens découvrir le mot et le problème du jour.',
              icon: '/icons/icon-192x192.png'
            });
            localStorage.setItem(notificationKey, 'true');
          }
        }
      }
    };
    checkNotification();
  }, [selectedChild]);

  const handleLimitReached = useCallback((message: string) => {
    setSystemModal({ show: true, type: 'limit', message });
  }, []);

  const handleBedtimeReached = useCallback((message: string) => {
    setSystemModal({ show: true, type: 'bedtime', message });
  }, []);

  // ─── Content Router ────────────────────────────────────
  const renderContent = () => {
    const commonProps = { onEarnPoints: addStars, gradeLevel: selectedChild?.grade_level };

    switch (activeTab) {
      case 'home': return <HomePage setActiveTab={setActiveTab} />;
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

  // ─── Auth Gate ─────────────────────────────────────────
  if (!session) return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <AuthPage />
    </Suspense>
  );

  // ─── Child Selector ────────────────────────────────────
  if (showChildSelector) {
    return (
      <>
        <TimeTracker activeTab={activeTab} setTimeLeft={setTimeLeft} onLimitReached={handleLimitReached} onBedtimeReached={handleBedtimeReached} />
        <ChildSelector children={children} setSelectedChild={setSelectedChild} setActiveTab={setActiveTab} signOut={signOut} />
      </>
    );
  }

  // ─── Visible Tabs (respecting blocked topics) ──────────
  const visibleTabs = tabs.filter(t =>
    !selectedChild?.blocked_topics?.includes(t.id) || ['home', 'dashboard', 'profile', 'parental'].includes(t.id)
  );

  // ─── Main Layout ───────────────────────────────────────
  return (
    <>
      <TimeTracker activeTab={activeTab} setTimeLeft={setTimeLeft} onLimitReached={handleLimitReached} onBedtimeReached={handleBedtimeReached} />

      <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <Sidebar
          tabs={visibleTabs}
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
          <Header activeTab={activeTab} tabs={tabs} selectedChild={selectedChild} timeLeft={timeLeft} setIsMobileNavOpen={setIsMobileNavOpen} />

          <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    {renderContent()}
                  </Suspense>
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          tabs={visibleTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          parentalActiveTab={parentalActiveTab}
          setParentalActiveTab={setParentalActiveTab}
        />
      </div>

      <SystemModal
        open={systemModal.show}
        type={systemModal.type}
        message={systemModal.message}
        onClose={() => setSystemModal(prev => ({ ...prev, show: false }))}
      />
    </>
  );
}

// ─── Root App ────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <PointsProvider>
        <AppContent />
      </PointsProvider>
    </AuthProvider>
  );
}
