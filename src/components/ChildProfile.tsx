import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, GraduationCap, Camera, User, Heart, Shield, Sparkles, Award, Zap, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChildProfile() {
  const { selectedChild, refreshChildren } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
        <h1 className="flex items-center gap-3 text-3xl font-black text-slate-800 tracking-tight">
          <User className="h-8 w-8 text-indigo-600" /> Mon Espace Magique
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
            className="rounded-[3rem] bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />

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

            <h2 className="text-3xl font-black text-slate-800 mb-2">{selectedChild?.name}</h2>
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
          <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wider">
                <Zap className="h-4 w-4 text-yellow-500" /> Expérience
              </h3>
              <span className="text-xs font-black text-indigo-600">{progressToNextLevel}/100</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-100 p-1 border border-slate-50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm"
              />
            </div>
            <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase text-center tracking-tight">
              Encore {100 - progressToNextLevel} points pour le prochain niveau !
            </p>
          </div>
        </div>

        {/* Right Column: Avatar Selection & Achievements */}
        <div className="lg:col-span-8 space-y-8">
          {/* Avatar Shop/Selector */}
          <section className="rounded-[3rem] bg-white p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="flex items-center gap-3 text-xl font-black text-slate-800">
                  <Camera className="h-6 w-6 text-indigo-600" /> Atelier des Avatars
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-wider">Choisis ton nouveau look magique</p>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {avatars.map((av, idx) => (
                <motion.button
                  key={av.seed}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => updateAvatar(av.seed)}
                  disabled={loading}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative group rounded-[2rem] border-2 p-4 text-center transition-all ${selectedChild?.avatar_url?.includes(av.seed)
                      ? 'bg-indigo-50 border-indigo-200 shadow-lg shadow-indigo-100'
                      : 'bg-slate-50 border-slate-50 hover:border-indigo-200 hover:bg-white'
                    }`}
                >
                  <div className={`mx-auto mb-3 h-16 w-16 overflow-hidden rounded-2xl border-2 transition-transform group-hover:rotate-6 ${selectedChild?.avatar_url?.includes(av.seed) ? 'border-white shadow-md' : 'border-white/50'
                    }`}>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}`} alt={av.name} className="h-full w-full object-cover" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${selectedChild?.avatar_url?.includes(av.seed) ? 'text-indigo-600' : 'text-slate-500'
                    }`}>{av.name}</span>

                  {selectedChild?.avatar_url?.includes(av.seed) && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
                      <Zap className="h-3 w-3 fill-current" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Trophy Room & Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group"
            >
              <Award className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-yellow-300" />
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tighter">Salle des Trophées</h4>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 group-hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-amber-300 fill-current" />
                      <div>
                        <p className="text-sm font-black">Collectionneur d'Étoiles</p>
                        <p className="text-[10px] font-bold text-white/60 uppercase">Total: {selectedChild?.stars} ⭐</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 group-hover:bg-white/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-pink-300 fill-current" />
                      <div>
                        <p className="text-sm font-black">Matière Favorite</p>
                        <p className="text-[10px] font-bold text-white/60 uppercase">Français (Expert)</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center group"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-4 group-hover:rotate-12 transition-transform duration-500">
                <Shield className="h-10 w-10 fill-emerald-500/10" />
              </div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Titre Honorifique</h4>
              <p className="text-2xl font-black text-slate-800 italic">"Apprenti Sage"</p>
              <div className="mt-6 w-full h-px bg-slate-100" />
              <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                Continue tes quêtes pour débloquer <br />le titre de <span className="text-indigo-600 font-black">"Maître du Savoir"</span>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
