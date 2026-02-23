/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  MessageCircle, Brain, Book, BookA, Calculator,
  Lightbulb, Star, Home, Trophy, LogOut, Palette,
  Menu, X, ChevronRight, Settings, Bell, GraduationCap
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

type Tab = 'home' | 'assistant' | 'quiz' | 'story' | 'dictionary' | 'math' | 'fact' | 'dashboard' | 'drawing';

function AppContent() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If not logged in, show Auth Page
  if (!session) {
    return <AuthPage />;
  }

  const addStars = async (amount: number, activityType: string, subject: string = 'General') => {
    if (!profile) return;

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    try {
      await supabase.rpc('increment_stars', { row_id: profile.id, count: amount });
      await supabase.from('progress').insert({
        user_id: profile.id,
        score: amount,
        activity_type: activityType,
        subject: subject,
        date: new Date().toISOString()
      });
      refreshProfile();
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
    { id: 'drawing', label: 'Dessin', icon: Palette, color: 'from-pink-500 to-rose-400', desc: 'Dessine librement' },
    { id: 'story', label: 'Histoires', icon: Book, color: 'from-orange-500 to-amber-400', desc: 'Crée des histoires' },
    { id: 'dictionary', label: 'Dico', icon: BookA, color: 'from-cyan-500 to-sky-400', desc: 'Cherche un mot' },
    { id: 'fact', label: 'Infos', icon: Lightbulb, color: 'from-yellow-400 to-orange-400', desc: 'Découvre des faits' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8 pb-12">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="magical-gradient rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group"
            >
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl transition-all group-hover:bg-white/20" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-white/10 rounded-full blur-2xl transition-all group-hover:bg-white/20" />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase mb-4 shadow-sm"
                  >
                    Prêt pour l'aventure ?
                  </motion.span>
                  <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                    Bonjour, {profile?.username || 'l\'ami'} ! 👋
                  </h2>
                  <p className="text-white/90 text-lg md:text-xl font-medium max-w-xl">
                    C'est une magnifique journée pour apprendre et s'amuser. Quelle sera ta première mission aujourd'hui ?
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
                    <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-white/20">
                      <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                      <span className="font-bold text-lg">{profile?.stars || 0} étoiles obtenues</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-white/20">
                      <GraduationCap className="w-5 h-5" />
                      <span className="font-bold text-lg">Classe : {profile?.grade_level || 'Non définie'}</span>
                    </div>
                  </div>
                </div>

                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-48 h-48 md:w-64 md:h-64 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl relative"
                >
                  <Brain className="w-24 h-24 md:w-32 md:h-32 text-white drop-shadow-xl" />
                  {/* Floating sparkles */}
                  <motion.div
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-10 right-10"
                  >
                    <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Quick Actions Grid */}
            <div>
              <div className="flex items-center justify-between mb-8 px-4">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tes Activités</h3>
                <button className="text-indigo-600 font-bold hover:underline flex items-center gap-1">
                  Voir tout <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                {tabs.filter(t => t.id !== 'home' && t.id !== 'dashboard').map((tab, idx) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setActiveTab(tab.id as Tab)}
                      className="group relative bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all border border-slate-100 hover:border-indigo-100 text-left flex flex-col items-start gap-5 interactive-card overflow-hidden"
                    >
                      {/* Hover background effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />

                      <div className={`p-5 rounded-[1.5rem] bg-gradient-to-br ${tab.color} text-white shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-xl font-bold text-slate-800">{tab.label}</h4>
                        <p className="text-slate-500 font-medium mt-1 leading-tight">{tab.desc}</p>
                      </div>

                      {/* Arrow icon */}
                      <div className="mt-2 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all ml-auto">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Dashboard />
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Le Savais-tu ?
                  </h4>
                  <p className="text-slate-600 leading-relaxed italic">
                    "Les abeilles peuvent reconnaître les visages humains, tout comme nous !"
                  </p>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-xl">
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    Prochain Défi
                  </h4>
                  <p className="opacity-90 font-medium mb-6">Complète un quiz aujourd'hui pour gagner 50 étoiles bonus !</p>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="w-full bg-white text-indigo-700 font-bold py-3.5 rounded-2xl shadow-lg hover:bg-slate-50 transition-colors"
                  >
                    C'est parti !
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'dashboard': return <div className="p-4"><Dashboard /></div>;
      case 'assistant': return <Assistant onEarnPoints={(pts) => addStars(pts, 'assistant')} gradeLevel={profile?.grade_level} />;
      case 'quiz': return <Quiz onEarnPoints={(pts) => addStars(pts, 'quiz')} gradeLevel={profile?.grade_level} />;
      case 'math': return <MathGame onEarnPoints={(pts) => addStars(pts, 'math')} />;
      case 'story': return <Story />;
      case 'drawing': return <DrawingBoard />;
      case 'dictionary': return <Dictionary />;
      case 'fact': return <DidYouKnow />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-800">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                rotate: [0, 360, 0]
              }}
              className="text-[12rem] filter drop-shadow-2xl"
            >
              ⭐
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-72 bg-white border-r border-slate-100 shadow-xl fixed h-screen z-40 transition-all duration-300`}>
        <div className="p-8">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="magical-gradient p-3 rounded-2xl text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Magic École
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Assistant Scolaire</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all relative group ${isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActive"
                    className="absolute left-0 w-1.5 h-8 bg-indigo-600 rounded-r-full"
                  />
                )}
                <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-600' : 'group-hover:text-indigo-500 transition-colors'}`} />
                <span className="font-bold">{tab.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{profile?.username}</p>
                <p className="text-xs text-slate-500">{profile?.grade_level}</p>
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-72 min-h-screen">
        {/* Mobile Header / Desktop Top Bar */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <div className="magical-gradient p-2 rounded-xl text-white shadow-lg">
              <Brain className="w-6 h-6" />
            </div>
            <h1 className="font-black text-slate-800">Magic École</h1>
          </div>

          <div className="hidden md:block">
            <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="text-slate-600 capitalize">{activeTab}</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 border border-yellow-100 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-black text-yellow-700 text-sm">{profile?.stars || 0}</span>
            </div>

            <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all md:hidden">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navigation (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-2 py-2 z-50 flex items-center justify-around shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
        {tabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-400'
                }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-2 px-3 text-slate-400"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] mt-1">Menu</span>
        </button>
      </nav>

      {/* Mobile Fullscreen Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8 p-4 bg-white/10 rounded-3xl border border-white/20">
              <div className="flex items-center gap-3">
                <div className="magical-gradient p-2 rounded-xl text-white">
                  <Brain className="w-6 h-6" />
                </div>
                <h1 className="text-white font-black">Menu École</h1>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 grid grid-cols-2 gap-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as Tab);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] transition-all border shadow-lg ${isActive
                      ? 'bg-white text-indigo-700 border-white shadow-indigo-500/20'
                      : 'bg-white/5 text-white border-white/10'
                      }`}
                  >
                    <div className={`p-4 rounded-2xl ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white/10 text-white'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={signOut}
              className="mt-8 bg-white/10 text-white border border-white/20 py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-white/20 transition-all active:scale-95"
            >
              <LogOut className="w-6 h-6" />
              DéConnexion
            </button>
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


