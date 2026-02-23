import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogOut, Plus } from 'lucide-react';
import { Child } from '../../lib/supabase';

interface ChildSelectorProps {
    children: Child[];
    setSelectedChild: (child: Child | null) => void;
    setActiveTab: (tab: any) => void;
    signOut: () => void;
}

export default function ChildSelector({ children, setSelectedChild, setActiveTab, signOut }: ChildSelectorProps) {
    return (
        <div className="min-h-screen magical-gradient flex items-center justify-center p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/95 backdrop-blur-2xl p-8 md:p-14 rounded-[3.5rem] shadow-2xl w-full max-w-5xl text-center border border-white/20"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-2 leading-tight">
                        Bonjour ! 👋
                    </h2>
                    <p className="text-slate-500 font-bold text-lg mb-12 italic">
                        Qui va vivre une aventure aujourd'hui ?
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {children.map((child, index) => (
                        <motion.button
                            key={child.id}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedChild(child)}
                            className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 hover:border-indigo-400 hover:shadow-2xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />

                            <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-4xl mx-auto mb-6 shadow-inner border-2 border-white relative z-10 overflow-hidden">
                                {child.avatar_url ? (
                                    <img src={child.avatar_url} alt={child.name} className="w-full h-full object-cover" />
                                ) : (
                                    child.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 relative z-10">{child.name}</h3>
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full relative z-10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{child.grade_level}</span>
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-2 relative z-10">
                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                <span className="text-xs font-bold text-slate-500">{child.stars} points</span>
                            </div>
                        </motion.button>
                    ))}

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ y: -8 }}
                        onClick={() => setActiveTab('parental')}
                        className="border-2 border-dashed border-slate-200 p-8 rounded-[3rem] flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-slate-50 transition-all group"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-all">
                            <Plus className="w-8 h-8" />
                        </div>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] group-hover:text-indigo-500 transition-all">Ajouter un enfant</p>
                    </motion.button>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 flex flex-col items-center gap-6"
                >
                    <button
                        onClick={() => setActiveTab('parental')}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-100/50 rounded-2xl text-slate-500 font-bold hover:bg-slate-100 transition-all text-sm uppercase tracking-widest"
                    >
                        <ShieldCheck className="w-5 h-5" />
                        Zone Parents
                    </button>

                    <button
                        onClick={signOut}
                        className="text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all group"
                    >
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        Déconnecter la famille
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
