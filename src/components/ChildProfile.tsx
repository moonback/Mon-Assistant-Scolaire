import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Trophy,
  GraduationCap,
  Camera,
  User,
  Sparkles,
  Zap,
  BookOpen,
  Sword,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BadgeCollection from './BadgeCollection';
import SiblingCompetition from './SiblingCompetition';
import LearningDNACard from './LearningDNACard';
import LearningDiagnostic from './LearningDiagnostic';
import ChildPortfolio from './ChildPortfolio';

type TabId = 'journey' | 'avatar' | 'success' | 'duels';

export default function ChildProfile() {
  const { selectedChild, refreshChildren } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('journey');

  const avatars = [
    { name: 'Explorateur', seed: selectedChild?.name || 'Explorer' },
    { name: 'Magicien', seed: 'Midnight' },
    { name: 'Scientifique', seed: 'Genius' },
    { name: 'Astronaute', seed: 'Space' },
    { name: 'Super-Héros', seed: 'Hero' },
    { name: 'Artiste', seed: 'Artist' },
    { name: 'Gardien', seed: 'Forest' },
    { name: 'Champion', seed: 'Racer' },
  ];

  const tabs = [
    { id: 'journey', label: 'Mon Parcours', icon: Activity, color: 'indigo' },
    { id: 'avatar', label: 'Personnalisation', icon: Camera, color: 'pink' },
    { id: 'success', label: 'Mes Succès', icon: Trophy, color: 'amber' },
    { id: 'duels', label: 'Défis & Duels', icon: Sword, color: 'emerald' },
  ] as const;

  const updateAvatar = async (seed: string) => {
    if (!selectedChild) return;
    setLoading(true);
    try {
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
      const { error } = await supabase.from('children').update({ avatar_url: avatarUrl }).eq('id', selectedChild.id);

      if (error) throw error;
      setSuccess(true);
      await refreshChildren();
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentLevel = Math.floor((selectedChild?.stars || 0) / 100) + 1;
  const progressToNextLevel = (selectedChild?.stars || 0) % 100;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12 animate-in fade-in duration-500">
      {/* 1. Global Profile Header (Always visible) */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-8 border-none shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32" />

        {/* Avatar Display */}
        <div className="relative z-10 shrink-0">
          <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center p-2 shadow-inner border-4 border-white">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedChild?.avatar_url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                src={selectedChild?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChild?.name}`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg border border-indigo-50 flex items-center justify-center text-xl"
          >
            ✨
          </motion.div>
        </div>

        {/* Core Stats */}
        <div className="flex-1 text-center md:text-left z-10 space-y-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedChild?.name}</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Classe de {selectedChild?.grade_level}
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
              <GraduationCap className="h-4 w-4" /> Niveau {currentLevel}
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl text-xs font-black uppercase tracking-widest cursor-default">
              <Star className="w-4 h-4 fill-amber-500" /> {selectedChild?.stars || 0} Étoiles au total
            </span>
          </div>
        </div>

        {/* EXP Bar (Right side on desktop) */}
        <div className="w-full md:w-64 z-10 bg-slate-50 p-4 justify-center rounded-3xl border border-slate-100">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
            <span className="text-amber-500 flex items-center gap-1"><Zap className="w-3 h-3 fill-amber-500" /> EXP</span>
            <span className="text-indigo-600">{progressToNextLevel}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 border border-white shadow-inner mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextLevel}%` }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
            {100 - progressToNextLevel} étoiles avant niv {currentLevel + 1}
          </p>
        </div>
      </motion.header>

      {/* 2. Tab Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 p-2 bg-white rounded-[2rem] shadow-sm border border-slate-100 sticky top-4 z-40">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`relative flex items-center gap-2 px-6 py-4 rounded-3xl text-sm font-black uppercase tracking-widest transition-colors whitespace-nowrap outline-none ${isActive ? `text-${tab.color}-600` : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className={`absolute inset-0 bg-${tab.color}-50 rounded-3xl`}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className={`w-5 h-5 relative z-10 ${isActive ? `text-${tab.color}-600` : ''}`} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content Area */}
      <div className="min-h-[50vh]">
        <AnimatePresence mode="wait">

          {/* TAB: JOURNEY (ADN & General Info) */}
          {activeTab === 'journey' && (
            <motion.div
              key="journey"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <LearningDNACard
                profile={selectedChild?.learning_profile}
                onStartDiagnostic={() => setShowDiagnostic(true)}
              />
            </motion.div>
          )}

          {/* TAB: AVATAR STUDIO */}
          {activeTab === 'avatar' && (
            <motion.section
              key="avatar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="premium-card p-10 border-none shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="flex items-center gap-3 text-2xl font-black text-slate-900 tracking-tight">
                    <Camera className="h-7 w-7 text-pink-500" /> Atelier des Avatars
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Choisis ton apparence magique</p>
                </div>
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-emerald-100"
                    >
                      <Sparkles className="h-4 w-4" /> LOOK APPROUVÉ
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                {avatars.map((av, idx) => {
                  const isSelected = selectedChild?.avatar_url?.includes(av.seed);
                  return (
                    <motion.button
                      key={av.seed}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => updateAvatar(av.seed)}
                      disabled={loading}
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative group rounded-[2.5rem] border-4 p-6 text-center transition-all duration-300 ${isSelected
                          ? 'bg-pink-50 border-pink-400 shadow-xl shadow-pink-100'
                          : 'bg-slate-50 border-white hover:border-pink-200 hover:bg-white hover:shadow-lg hover:shadow-slate-100'
                        }`}
                    >
                      <div className={`mx-auto mb-4 h-24 w-24 overflow-hidden rounded-[2rem] border-4 transition-all duration-500 group-hover:scale-110 ${isSelected ? 'border-pink-400 shadow-lg' : 'border-white shadow-inner'
                        }`}>
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}`} alt={av.name} className="h-full w-full object-cover" />
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${isSelected ? 'text-pink-600' : 'text-slate-500'}`}>
                        {av.name}
                      </span>

                      {isSelected && (
                        <motion.div
                          layoutId="selected-avatar-check"
                          className="absolute -top-3 -right-3 w-8 h-8 bg-white text-pink-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-pink-100"
                        >
                          <Sparkles className="h-4 w-4 fill-current" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* TAB: SUCCESS (Badges & Portfolio) */}
          {activeTab === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-12"
            >
              <BadgeCollection earnedBadgeIds={selectedChild?.badges || []} />
              <div className="border-t border-slate-100 pt-10">
                <ChildPortfolio />
              </div>
            </motion.div>
          )}

          {/* TAB: COMPETITION (Duels) */}
          {activeTab === 'duels' && (
            <motion.div
              key="duels"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="pt-4"
            >
              <SiblingCompetition standalone={true} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Learning DNA Diagnostic Modal */}
      <AnimatePresence>
        {showDiagnostic && (
          <LearningDiagnostic
            onComplete={() => setShowDiagnostic(false)}
            onClose={() => setShowDiagnostic(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
