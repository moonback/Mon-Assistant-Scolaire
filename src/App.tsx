/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { MessageCircle, Brain, Book, BookA, Calculator, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Assistant from './components/Assistant';
import Quiz from './components/Quiz';
import Story from './components/Story';
import Dictionary from './components/Dictionary';
import MathGame from './components/MathGame';
import DidYouKnow from './components/DidYouKnow';

type Tab = 'assistant' | 'quiz' | 'story' | 'dictionary' | 'math' | 'fact';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('assistant');

  const tabs = [
    { id: 'assistant', label: 'Assistant', icon: MessageCircle, color: 'bg-sky-500' },
    { id: 'quiz', label: 'Quiz', icon: Brain, color: 'bg-violet-500' },
    { id: 'story', label: 'Histoires', icon: Book, color: 'bg-pink-500' },
    { id: 'dictionary', label: 'Dico', icon: BookA, color: 'bg-orange-500' },
    { id: 'math', label: 'Calcul', icon: Calculator, color: 'bg-emerald-500' },
    { id: 'fact', label: 'Infos', icon: Lightbulb, color: 'bg-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-sky-400 to-violet-500 p-2 rounded-xl text-white">
              <Brain className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-violet-600">
              Mon École Magique
            </h1>
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
            {activeTab === 'assistant' && <Assistant />}
            {activeTab === 'quiz' && <Quiz />}
            {activeTab === 'story' && <Story />}
            {activeTab === 'dictionary' && <Dictionary />}
            {activeTab === 'math' && <MathGame />}
            {activeTab === 'fact' && <DidYouKnow />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation (Mobile) & Sidebar (Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:top-20 md:bottom-auto md:left-4 md:right-auto md:w-20 md:h-[calc(100vh-6rem)] md:bg-transparent md:border-none md:flex md:flex-col md:gap-4 z-20">
        <div className="flex justify-around items-center h-16 md:h-auto md:flex-col md:gap-4 md:justify-start">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`relative flex flex-col items-center justify-center w-full h-full md:w-14 md:h-14 md:rounded-2xl transition-all ${
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
                
                {/* Desktop Tooltip */}
                <div className="hidden md:block absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


