import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogOut, Plus, Star } from 'lucide-react';
import { Child } from '../../lib/supabase';

interface ChildSelectorProps {
    children: Child[];
    setSelectedChild: (child: Child | null) => void;
    setActiveTab: (tab: any) => void;
    signOut: () => void;
}

// Fun avatar background colors
const AVATAR_COLORS = [
    'bg-indigo-100 text-indigo-700',
    'bg-pink-100 text-pink-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
];

export default function ChildSelector({ children, setSelectedChild, setActiveTab, signOut }: ChildSelectorProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-white/95 backdrop-blur-2xl p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-4xl text-center border border-white/40"
            >
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-10"
                >
                    <div className="text-6xl mb-4">👋</div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-3 leading-tight">
                        Bonjour !
                    </h2>
                    <p className="text-slate-500 font-bold text-xl">
                        C'est qui qui va apprendre aujourd'hui ?
                    </p>
                </motion.div>

                {/* Child cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                    {children.map((child, index) => {
                        const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
                        return (
                            <motion.button
                                key={child.id}
                                initial={{ opacity: 0, scale: 0.85, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.15 + index * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
                                whileHover={{ y: -8, scale: 1.03 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setSelectedChild(child)}
                                className="bg-white p-7 rounded-[2.5rem] border-2 border-slate-100 hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-100/60 transition-all group relative overflow-hidden text-left"
                            >
                                {/* Decorative bubble */}
                                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50 rounded-full -mr-14 -mt-14 group-hover:scale-150 transition-transform duration-700 opacity-60" />

                                {/* Avatar */}
                                <div className={`w-20 h-20 rounded-[1.5rem] ${colorClass} flex items-center justify-center font-black text-4xl mx-auto mb-5 shadow-sm border-2 border-white relative z-10 overflow-hidden`}>
                                    {child.avatar_url ? (
                                        <img src={child.avatar_url} alt={child.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{child.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>

                                {/* Name */}
                                <h3 className="text-2xl font-black text-slate-800 text-center relative z-10 mb-2">{child.name}</h3>

                                {/* Grade */}
                                <div className="flex justify-center mb-4 relative z-10">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-black uppercase tracking-wider">
                                        {child.grade_level}
                                    </span>
                                </div>

                                {/* Stars */}
                                <div className="flex items-center justify-center gap-2 relative z-10">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <span className="text-base font-black text-slate-600">{child.stars ?? 0} étoiles</span>
                                </div>

                                {/* Arrow hint on hover */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    className="absolute bottom-4 right-5 text-indigo-400 text-2xl font-black z-10"
                                >
                                    →
                                </motion.div>
                            </motion.button>
                        );
                    })}

                    {/* Add child button */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + children.length * 0.08 }}
                        whileHover={{ y: -8 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setActiveTab('parental')}
                        className="border-2 border-dashed border-slate-200 p-7 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group min-h-[200px]"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-all">
                            <Plus className="w-8 h-8" />
                        </div>
                        <p className="text-slate-400 font-black text-sm uppercase tracking-widest group-hover:text-indigo-500 transition-all">Ajouter un enfant</p>
                    </motion.button>
                </div>

                {/* Footer actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <button
                        onClick={() => setActiveTab('parental')}
                        className="flex items-center gap-3 px-7 py-4 bg-slate-100 rounded-2xl text-slate-600 font-black hover:bg-slate-200 transition-all text-sm uppercase tracking-widest"
                    >
                        <ShieldCheck className="w-5 h-5" />
                        Zone Parents
                    </button>

                    <button
                        onClick={signOut}
                        className="text-slate-400 hover:text-red-500 font-black text-sm uppercase tracking-widest flex items-center gap-2.5 transition-all group px-5 py-3 rounded-2xl hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        Déconnecter la famille
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
