/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MessageCircle, Brain, Book, BookA, Calculator, Lightbulb, Star, Home, Trophy, LogOut, Palette } from 'lucide-react';
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

  // If not logged in, show Auth Page
  if (!session) {
    return <AuthPage />;
  }

  const addStars = async (amount: number, activityType: string, subject: string = 'General') => {
    if (!profile) return;

    // Optimistic update
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);

    try {
      // Update local state via refreshProfile after DB update
      await supabase.rpc('increment_stars', { row_id: profile.id, count: amount });
      
      // Log progress
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
    { id: 'home', label: 'Accueil', icon: Home, color: 'bg-slate-500' },
    { id: 'dashboard', label: 'Progression', icon: Trophy, color: 'bg-yellow-500', desc: 'Voir mes stats' },
    { id: 'assistant', label: 'Assistant', icon: MessageCircle, color: 'bg-sky-500', desc: 'Pose tes questions' },
    { id: 'quiz', label: 'Quiz', icon: Brain, color: 'bg-violet-500', desc: 'Teste tes connaissances' },
    { id: 'math', label: 'Calcul', icon: Calculator, color: 'bg-emerald-500', desc: 'Entraîne-toi en maths' },
    { id: 'story', label: 'Histoires', icon: Book, color: 'bg-pink-500', desc: 'Crée des histoires' },
    { id: 'drawing', label: 'Dessin', icon: Palette, color: 'bg-indigo-500', desc: 'Dessine librement' },
    { id: 'dictionary', label: 'Dico', icon: BookA, color: 'bg-orange-500', desc: 'Cherche un mot' },
    { id: 'fact', label: 'Infos', icon: Lightbulb, color: 'bg-yellow-500', desc: 'Découvre des faits' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-sky-400 to-violet-500 rounded-3xl p-8 text-white shadow-lg mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Bonjour {profile?.username || 'l\'ami'} ! 👋</h2>
                <p className="opacity-90 text-lg">Prêt à apprendre de nouvelles choses aujourd'hui ?</p>
                <div className="mt-2 inline-block bg-white/20 px-3 py-1 rounded-lg text-sm font-medium">
                  Classe : {profile?.grade_level || 'Non définie'}
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm text-center">
                <p className="text-sm font-bold uppercase tracking-wider opacity-80">Étoiles</p>
                <p className="text-4xl font-black">{profile?.stars || 0}</p>
              </div>
            </div>

            {tabs.filter(t => t.id !== 'home').map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-all border-2 border-slate-100 hover:border-sky-200 group text-left flex flex-col items-start gap-4"
                >
                  <div className={`p-4 rounded-2xl ${tab.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{tab.label}</h3>
                    <p className="text-slate-500">{tab.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        );
      case 'dashboard': return <Dashboard />;
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24 md:pb-0">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          <div className="absolute animate-ping text-6xl">⭐</div>
          <div className="absolute animate-bounce text-6xl delay-100 translate-x-10">🌟</div>
          <div className="absolute animate-pulse text-6xl delay-200 -translate-x-10">✨</div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => setActiveTab('home')}
          >
            <div className="bg-gradient-to-br from-sky-400 to-violet-500 p-2 rounded-xl text-white">
              <Brain className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-violet-600 hidden sm:block">
              Mon École Magique
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-yellow-50 border-2 border-yellow-200 px-4 py-2 rounded-full flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-700">{profile?.stars || 0}</span>
            </div>
            <button 
              onClick={signOut}
              className="bg-slate-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Se déconnecter"
            >
               <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:top-20 md:bottom-auto md:left-4 md:right-auto md:w-20 md:h-[calc(100vh-6rem)] md:bg-transparent md:border-none md:flex md:flex-col md:gap-4 z-20">
        <div className="flex justify-around items-center h-20 md:h-auto md:flex-col md:gap-4 md:justify-start overflow-x-auto px-4 md:px-0">
          {tabs.filter(t => t.id !== 'home').map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`relative flex flex-col items-center justify-center min-w-[3.5rem] h-full md:w-14 md:h-14 md:rounded-2xl transition-all ${
                  isActive ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                } md:bg-white md:shadow-sm md:hover:scale-110`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 ${tab.color} opacity-10 md:rounded-2xl`}
                  />
                )}
                <Icon className={`w-6 h-6 mb-1 md:mb-0 ${isActive ? `text-${tab.color.split('-')[1]}-600` : ''}`} />
                <span className="text-[10px] font-medium md:hidden">{tab.label}</span>
                
                <div className="hidden md:block absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg">
                  {tab.label}
                </div>
              </button>
            );
          })}
          
          <button
            onClick={() => setActiveTab('home')}
            className="md:hidden absolute -top-6 left-1/2 -translate-x-1/2 bg-sky-500 text-white p-4 rounded-full shadow-lg border-4 border-slate-50"
          >
            <Home className="w-6 h-6" />
          </button>
        </div>
      </nav>
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


