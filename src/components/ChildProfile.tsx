import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
    Star, Trophy, GraduationCap, Camera,
    Settings, Save, User, Sparkles,
    Heart, Shield, Ghost, Dog
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChildProfile() {
    const { selectedChild, refreshChildren } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Avatar presets
    const avatars = [
        { name: 'Aventure', seed: selectedChild?.name || 'Aventure' },
        { name: 'Magie', seed: 'Magie123' },
        { name: 'Génie', seed: 'Genius' },
        { name: 'Espace', seed: 'Space' },
        { name: 'Héros', seed: 'Hero' },
        { name: 'Artiste', seed: 'Artist' },
        { name: 'Nature', seed: 'Nature' },
        { name: 'Sport', seed: 'Sport' },
    ];

    const updateAvatar = async (seed: string) => {
        if (!selectedChild) return;
        setLoading(true);
        try {
            const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            const { error } = await supabase
                .from('children')
                .update({ avatar_url: avatarUrl })
                .eq('id', selectedChild.id);

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

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
                            <User className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Mon Profil <span className="text-indigo-600">Magique</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] ml-16">Personnalise ton identité secrète</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-premium flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Profil Actif</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Avatar & Identity Card */}
                <div className="lg:col-span-4 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[4rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                        <div className="relative bg-white/90 backdrop-blur-2xl p-10 rounded-[4rem] shadow-premium border border-white/50 text-center overflow-hidden">
                            {/* Animated background rings */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-50 rounded-full blur-3xl opacity-50" />

                            <div className="relative inline-block mb-8">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 2 }}
                                    className="w-48 h-48 rounded-[3.5rem] bg-indigo-50 flex items-center justify-center overflow-hidden border-8 border-white shadow-2xl relative z-10"
                                >
                                    <img
                                        src={selectedChild?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChild?.name}`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 10, -10, 0]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-3 rounded-2xl shadow-xl z-20 ring-4 ring-white"
                                >
                                    <Sparkles className="w-6 h-6 fill-current" />
                                </motion.div>
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{selectedChild?.name}</h2>
                            <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em]">
                                <GraduationCap className="w-4 h-4" />
                                {selectedChild?.grade_level}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                        <Trophy className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-700" />

                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                </span>
                                Mes Exploits
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-indigo-200/60 text-[10px] font-black uppercase tracking-[0.2em]">Étoiles Magiques</span>
                                    <span className="text-3xl font-black">{selectedChild?.stars} <span className="text-yellow-400">⭐</span></span>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((selectedChild?.stars || 0) / 10, 100)}%` }}
                                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative"
                                        >
                                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[move-stripe_2s_linear_infinite]" />
                                        </motion.div>
                                    </div>
                                    <p className="text-[10px] font-black text-indigo-200/40 uppercase tracking-[0.2em] text-center">
                                        Plus que {1000 - (selectedChild?.stars || 0)} pts pour le rang Héros !
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right: Customization & Stats */}
                <div className="lg:col-span-8 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-2xl p-10 rounded-[4rem] shadow-premium border border-slate-100 relative"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Galerie d&apos;Avatar</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Choisis ton apparence du jour</p>
                                </div>
                            </div>

                            <AnimatePresence>
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">C&apos;est fait !</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            {avatars.map((av, idx) => (
                                <motion.button
                                    key={av.seed}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => updateAvatar(av.seed)}
                                    disabled={loading}
                                    className="group relative flex flex-col items-center p-6 rounded-[2.5rem] border-2 border-slate-50 hover:border-indigo-100 hover:bg-slate-50/50 transition-all"
                                >
                                    <div className="w-20 h-20 rounded-3xl bg-white mb-4 overflow-hidden shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 group-hover:shadow-md border border-slate-100">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}`} alt={av.name} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors">{av.name}</span>

                                    {selectedChild?.avatar_url?.includes(av.seed) && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white ring-4 ring-white shadow-lg">
                                            <Shield className="w-3 h-3 fill-current" />
                                        </div>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        <div className="mt-10 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 text-center">
                            <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span>Chaque avatar a ses propres super-pouvoirs magiques !</span>
                            </p>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white/90 p-8 rounded-[3rem] border border-slate-100 shadow-premium flex items-center gap-6 group"
                        >
                            <div className="w-16 h-16 rounded-[1.5rem] bg-pink-50 flex items-center justify-center text-pink-500 shadow-inner group-hover:scale-110 transition-transform">
                                <Heart className="w-8 h-8 fill-pink-500/20" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Matière Préférée</p>
                                <p className="text-xl font-black text-slate-800 tracking-tight">Français <span className="text-pink-400">📖</span></p>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white/90 p-8 rounded-[3rem] border border-slate-100 shadow-premium flex items-center gap-6 group"
                        >
                            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                                <Shield className="w-8 h-8 fill-emerald-500/20" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Titre Honorifique</p>
                                <p className="text-xl font-black text-slate-800 tracking-tight">Apprenti Sage <span className="text-emerald-400">🧙‍♂️</span></p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes move-stripe {
                    from { background-position: 0 0; }
                    to { background-position: 40px 0; }
                }
            `}</style>
        </div>
    );
}
