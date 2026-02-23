/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  MessageCircle, Brain, Book, BookA, Calculator,
  Lightbulb, Star, Home, Trophy, LogOut, Palette,
  Menu, X, ChevronLeft, ChevronRight, Settings, Bell, GraduationCap, Sparkles, Camera, ShieldCheck, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

// Components
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

type Tab = 'home' | 'assistant' | 'quiz' | 'story' | 'dictionary' | 'math' | 'fact' | 'dashboard' | 'drawing' | 'homework' | 'parental' | 'profile';

function AppContent() {
  const { session, profile, children, selectedChild, setSelectedChild, signOut, refreshChildren } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const showChildSelector = !selectedChild && activeTab !== 'parental';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) setIsSidebarCollapsed(true);
      else setIsSidebarCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Time Limit Check
  useEffect(() => {
    if (!selectedChild?.daily_time_limit) return;

    const sessionStart = sessionStorage.getItem(`session_start_${selectedChild.id}`) || Date.now().toString();
    if (!sessionStorage.getItem(`session_start_${selectedChild.id}`)) {
      sessionStorage.setItem(`session_start_${selectedChild.id}`, sessionStart);
    }

    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - parseInt(sessionStart)) / (1000 * 60);
      if (elapsedMinutes > selectedChild.daily_time_limit) {
        alert("🛑 C'est l'heure de faire une pause ! Ton temps d'écran est terminé pour aujourd'hui.");
        setSelectedChild(null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedChild, setSelectedChild]);

  if (!session) return <AuthPage />;

  const addStars = async (amount: number, activityType: string, subject: string = 'General') => {
    if (!selectedChild) return;
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
      refreshChildren();
    } catch (e) {
      console.error('Error updating stars:', e);
    }
  };

  const tabs = [
    { id: 'home', label: 'Accueil', icon: Home, color: 'from-blue-500 to-sky-400' },
    { id: 'dashboard', label: 'Progression', icon: Trophy, color: 'from-yellow-500 to-amber-400', desc: 'Voir mes stats' },
    { id: 'assistant', label: 'Assistant', icon: MessageCircle, color: 'from-purple-500 to-indigo-400', desc: 'Pose tes questions' },
    { id: 'quiz', label: 'Quiz', icon: Brain, color: 'from-violet-500 to-purple-400', desc: 'Teste tes connaissances' },
    { id: 'math', label: 'Calcul', icon: Calculator, color: 'from-emerald-500 to-teal-400', desc: 'Entraîne-toi en maths' },
    { id: 'drawing', label: 'L\'Atelier', icon: Palette, color: 'from-pink-500 to-rose-400', desc: 'Ton espace d\'artiste' },
    { id: 'homework', label: 'Aide Photo', icon: Camera, color: 'from-blue-600 to-indigo-500', desc: 'Aide aux devoirs par l\'image' },
    { id: 'story', label: 'Histoires', icon: Book, color: 'from-orange-500 to-amber-400', desc: 'Crée des histoires' },
    { id: 'dictionary', label: 'Dico', icon: BookA, color: 'from-cyan-500 to-sky-400', desc: 'Cherche un mot' },
    { id: 'fact', label: 'Infos', icon: Lightbulb, color: 'from-yellow-400 to-orange-400', desc: 'Découvre des faits' },
    { id: 'profile', label: 'Mon Profil', icon: User, color: 'from-indigo-500 to-purple-500', desc: 'Paramètres et avatar' },
    { id: 'parental', label: 'Zone Parents', icon: ShieldCheck, color: 'from-slate-700 to-slate-900', desc: 'Sécurité et limites' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12 pb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="magical-gradient rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-4">Bonjour, <span className="text-yellow-200">{selectedChild?.name || 'l\'ami'}</span> ! 👋</h2>
                <p className="text-white/80 text-xl font-medium">Prêt pour une nouvelle mission magique ?</p>
                <div className="mt-8 flex gap-4">
                  <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3">
                    <Star className="text-yellow-300 fill-current" />
                    <span className="font-black text-xl">{selectedChild?.stars || 0} pts</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3">
                    <GraduationCap className="text-indigo-200" />
                    <span className="font-black text-xl">{selectedChild?.grade_level}</span>
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tabs.filter(t => !['home', 'dashboard', 'parental'].includes(t.id)).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all text-left group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tab.color} text-white flex items-center justify-center mb-4`}>
                    <tab.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800">{tab.label}</h4>
                  <p className="text-slate-500 text-sm mt-1">{tab.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 'dashboard': return <Dashboard />;
      case 'assistant': return <Assistant onEarnPoints={(pts) => addStars(pts, 'assistant')} gradeLevel={selectedChild?.grade_level} />;
      case 'quiz': return <Quiz onEarnPoints={(pts) => addStars(pts, 'quiz')} gradeLevel={selectedChild?.grade_level} />;
      case 'math': return <MathGame onEarnPoints={(pts) => addStars(pts, 'math')} />;
      case 'story': return <Story />;
      case 'drawing': return <DrawingBoard />;
      case 'homework': return <HomeworkHelper onEarnPoints={(pts) => addStars(pts, 'homework')} gradeLevel={selectedChild?.grade_level} />;
      case 'dictionary': return <Dictionary />;
      case 'fact': return <DidYouKnow />;
      case 'profile': return <ChildProfile />;
      case 'parental': return <ParentalSpace />;
      default: return null;
    }
  };

  if (showChildSelector) {
    return (
      <div className="min-h-screen magical-gradient flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/90 backdrop-blur-2xl p-12 rounded-[3.5rem] shadow-2xl w-full max-w-4xl text-center">
          <h2 className="text-4xl font-black text-slate-800 mb-8">Qui va apprendre aujourd'hui ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {children.map(child => (
              <button key={child.id} onClick={() => setSelectedChild(child)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-500 hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-3xl mx-auto mb-4">
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-black">{child.name}</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{child.grade_level}</p>
              </button>
            ))}
            <button onClick={() => setActiveTab('parental')} className="border-2 border-dashed border-slate-200 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-indigo-400 transition-all">
              <ShieldCheck className="w-10 h-10 text-slate-300" />
              <p className="text-slate-400 font-bold text-[10px] uppercase">Zone Parents</p>
            </button>
          </div>
          <button onClick={signOut} className="mt-12 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 mx-auto">
            <LogOut className="w-4 h-4" /> Déconnecter la famille
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      <AnimatePresence>{showConfetti && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"><div className="text-[10rem]">⭐</div></motion.div>}</AnimatePresence>

      <aside className={`hidden md:flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-100 fixed h-screen z-40 transition-all ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Magic École</h1>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400"><ChevronLeft className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:bg-slate-50'}`}>
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight">{tab.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 mt-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full p-2 flex items-center gap-3 rounded-xl transition-all group ${activeTab === 'profile' ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs overflow-hidden">
              {selectedChild?.avatar_url ? (
                <img src={selectedChild.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                selectedChild?.name.charAt(0)
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="text-left">
                <p className="font-bold text-slate-800 text-[11px] truncate">{selectedChild?.name}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase">{selectedChild?.grade_level}</p>
              </div>
            )}
          </button>

          <button
            onClick={() => setSelectedChild(null)}
            className="w-full mt-2 p-2 flex items-center gap-3 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-indigo-600"
            title="Changer d'enfant"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <LogOut className="w-4 h-4 rotate-180" />
            </div>
            {!isSidebarCollapsed && <span className="text-[10px] font-bold">Changer d'enfant</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-all ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 px-8 py-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">{tabs.find(t => t.id === activeTab)?.label}</h2>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-50 px-4 py-1.5 rounded-full flex items-center gap-2 border border-yellow-100">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-black text-yellow-700">{selectedChild?.stars || 0}</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2"><Menu className="w-6 h-6 text-slate-600" /></button>
          </div>
        </header>
        <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>{renderContent()}</motion.div></AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] p-6">
            <div className="flex items-center justify-between mb-8"><h1 className="text-white font-black text-2xl">Menu</h1><button onClick={() => setIsSidebarOpen(false)} className="text-white"><X className="w-8 h-8" /></button></div>
            <div className="grid grid-cols-2 gap-4">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id as Tab); setIsSidebarOpen(false); }} className={`p-6 rounded-3xl border flex flex-col items-center gap-3 ${activeTab === tab.id ? 'bg-white text-indigo-600' : 'bg-white/10 text-white border-white/20'}`}>
                  <tab.icon className="w-6 h-6" />
                  <span className="font-bold text-xs">{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
