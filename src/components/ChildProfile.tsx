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
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <header>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <User className="w-8 h-8 text-indigo-600" />
                    Mon Profil Magique
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1 ml-11">Personnalise ton espace</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Avatar & Identity */}
                <div className="md:col-span-1 space-y-6">
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 magical-gradient" />

                        <div className="relative inline-block mb-6">
                            <div className="w-40 h-40 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center overflow-hidden border-4 border-indigo-100 shadow-inner group">
                                <img
                                    src={selectedChild?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChild?.name}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-xl shadow-lg"
                            >
                                <Sparkles className="w-5 h-5 fill-current" />
                            </motion.div>
                        </div>

                        <h2 className="text-2xl font-black text-slate-800 mb-1">{selectedChild?.name}</h2>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {selectedChild?.grade_level}
                        </div>
                    </motion.div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                        <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                        <h3 className="text-lg font-black mb-4 flex items-center gap-2">Exploits</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Étoiles</span>
                                <span className="text-2xl font-black">{selectedChild?.stars} ⭐</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((selectedChild?.stars || 0) / 10, 100)}%` }}
                                    className="h-full bg-yellow-400"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-indigo-100 opacity-80 uppercase tracking-widest">En route vers le prochain rang !</p>
                        </div>
                    </div>
                </div>

                {/* Right: Customization */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <Camera className="w-6 h-6 text-indigo-500" />
                                Change ton Avatar
                            </h3>
                            {success && (
                                <motion.span
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-emerald-500 font-bold text-sm"
                                >
                                    C'est fait ! ✨
                                </motion.span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {avatars.map((av) => (
                                <button
                                    key={av.seed}
                                    onClick={() => updateAvatar(av.seed)}
                                    disabled={loading}
                                    className="group flex flex-col items-center p-4 rounded-3xl hover:bg-slate-50 border-2 border-transparent hover:border-indigo-100 transition-all"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 mb-3 overflow-hidden group-hover:scale-110 transition-transform">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}`} alt={av.name} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-center">{av.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <p className="text-xs font-bold text-slate-500 text-center italic">
                                Sais-tu que ton avatar est unique ? Choisis celui qui te ressemble le plus aujourd'hui !
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500">
                                <Heart className="w-6 h-6 fill-current" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ma Matière</p>
                                <p className="font-black text-slate-800">Français</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <Shield className="w-6 h-6 fill-current" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mon Titre</p>
                                <p className="font-black text-slate-800">Apprenti Sage</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
