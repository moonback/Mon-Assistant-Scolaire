import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, GraduationCap, Camera, User, Heart, Shield, Sparkles, Award, Zap, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import BadgeCollection from './BadgeCollection';
import SiblingCompetition from './SiblingCompetition';
import LearningDNACard from './LearningDNACard';
import LearningDiagnostic from './LearningDiagnostic';

export default function ChildProfile() {
  const { selectedChild, refreshChildren } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

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
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Header Section */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group pt-4"
      >
        <div className="absolute -left-4 top-0 w-1 h-12 bg-indigo-600 rounded-full group-hover:h-16 transition-all duration-300" />
        <h1 className="flex items-center gap-3 text-2xl font-black text-slate-900 tracking-tight">
          <User className="h-7 w-7 text-indigo-600" /> Mon Espace Magique
        </h1>
        <p className="text-slate-500 font-bold ml-11 uppercase text-xs tracking-[0.2em] mt-1">
          Personnalise ton aventure, {selectedChild?.name} !
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Profile Card & Quick Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main Avatar Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="premium-card p-10 border-none shadow-sm text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform" />

            <motion.div
              layoutId="profile-avatar"
              className="mx-auto mb-6 relative"
            >
              <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-2 shadow-inner border-4 border-white overflow-hidden mx-auto relative z-10">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedChild?.avatar_url}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    src={selectedChild?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChild?.name}`}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                </AnimatePresence>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-lg border border-indigo-50 flex items-center justify-center text-2xl z-20"
              >
                ✨
              </motion.div>
            </motion.div>

            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{selectedChild?.name}</h2>
            <div className="flex flex-col items-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
                <GraduationCap className="h-4 w-4" /> Niveau {currentLevel}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                Classe: {selectedChild?.grade_level}
              </span>
            </div>
          </motion.div>

          {/* Experience Progress */}
          <div className="premium-card p-8 border-none shadow-sm">
            <header className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500" /> Expérience
                </h3>
                <span className="text-sm font-black text-indigo-600">{progressToNextLevel}%</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none outline-none">Vers le niveau {currentLevel + 1}</p>
            </header>

            <div className="h-4 overflow-hidden rounded-full bg-slate-50 p-1 border border-white shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-100"
              />
            </div>
            <p className="mt-4 text-[10px] text-slate-400 font-black uppercase text-center tracking-widest flex items-center justify-center gap-2">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              Encore {100 - progressToNextLevel} étoiles !
            </p>
          </div>

          {/* Learning DNA Card */}
          <LearningDNACard
            profile={selectedChild?.learning_profile}
            onStartDiagnostic={() => setShowDiagnostic(true)}
          />
        </div>

        {/* Right Column: Avatar Selection & Achievements */}
        <div className="lg:col-span-8 space-y-8">
          {/* Avatar Shop/Selector */}
          <section className="premium-card p-10 border-none shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
                  <Camera className="h-6 w-6 text-indigo-600" /> Atelier des Avatars
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none outline-none mt-1">Personnalisation Magique</p>
              </div>
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-emerald-100"
                  >
                    <Sparkles className="h-4 w-4" /> LOOK APPROUVÉ !
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              {avatars.map((av, idx) => (
                <motion.button
                  key={av.seed}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => updateAvatar(av.seed)}
                  disabled={loading}
                  whileHover={{ y: -8, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative group rounded-[2.5rem] border-2 p-6 text-center transition-all duration-500 shadow-sm ${selectedChild?.avatar_url?.includes(av.seed)
                    ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-200'
                    : 'bg-slate-50 border-white hover:border-indigo-100 hover:bg-white hover:shadow-lg hover:shadow-slate-100'
                    }`}
                >
                  <div className={`mx-auto mb-4 h-20 w-20 overflow-hidden rounded-[1.5rem] border-4 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ${selectedChild?.avatar_url?.includes(av.seed) ? 'border-indigo-400 shadow-lg' : 'border-white shadow-inner'
                    }`}>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}`} alt={av.name} className="h-full w-full object-cover" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedChild?.avatar_url?.includes(av.seed) ? 'text-white' : 'text-slate-500'
                    }`}>{av.name}</span>

                  {selectedChild?.avatar_url?.includes(av.seed) && (
                    <motion.div
                      layoutId="selected-avatar-check"
                      className="absolute -top-3 -right-3 w-8 h-8 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-indigo-100"
                    >
                      <Sparkles className="h-4 w-4 fill-current" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Trophy Room & Badges */}
          <BadgeCollection earnedBadgeIds={selectedChild?.badges || []} />

          {/* Social / Competitions Section */}
          <div className="pt-8 mt-8 border-t border-slate-100">
            <SiblingCompetition standalone={true} />
          </div>
        </div>
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
