import React from 'react';
import { motion } from 'motion/react';
import { Star, Menu, Clock, ShieldCheck, Lock } from 'lucide-react';
import { TabItem } from '../../types/app';
import { Child } from '../../lib/supabase';

interface HeaderProps {
    activeTab: string;
    tabs: TabItem[];
    selectedChild: Child | null;
    timeLeft?: number | null;
    setIsMobileNavOpen: (open: boolean) => void;
}

export default function Header({ activeTab, tabs, selectedChild, timeLeft, setIsMobileNavOpen }: HeaderProps) {
    const currentTab = tabs.find(t => t.id === activeTab);
    const isHome = activeTab === 'home';
    const isParental = activeTab === 'parental';

    return (
        <header className="bg-white/70 backdrop-blur-2xl sticky top-0 z-30 border-b border-white/50 px-6 lg:px-12 py-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-3.5 rounded-2xl bg-gradient-to-br shadow-premium md:hidden transition-all duration-500 ${isParental ? 'from-slate-800 to-slate-950 scale-105' : (currentTab?.color || 'from-indigo-600 to-purple-600')} text-white ring-4 ring-white shadow-lg`}
                >
                    {isParental ? <ShieldCheck className="w-6 h-6" /> : (currentTab && <currentTab.icon className="w-6 h-6" />)}
                </motion.div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <motion.h2
                            key={activeTab}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-xl font-black text-slate-900 tracking-tight leading-none"
                        >
                            {isParental ? 'Espace Parent' : (isHome ? `Salut ${selectedChild?.name} !` : (currentTab?.label || 'Family AI'))}
                        </motion.h2>
                        {isHome && <span className="text-xl hidden md:inline animate-bounce-slow">👋</span>}
                    </div>
                    <motion.p
                        key={`${activeTab}-desc`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="hidden md:block text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] mt-2 opacity-80"
                    >
                        {isParental ? 'Sécurité & Contrôle' : (isHome ? 'Prêt pour tes missions ?' : (currentTab?.desc || 'Apprentissage intelligent'))}
                    </motion.p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {isParental ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 px-6 py-3 rounded-[1.25rem] flex items-center gap-3.5 border border-slate-800 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Lock className="w-4 h-4 text-emerald-400 relative z-10" />
                        <span className="font-black text-white text-[10px] uppercase tracking-[0.2em] relative z-10">Accès Sécurisé</span>
                    </motion.div>
                ) : (
                    <div className="flex items-center gap-4">
                        {timeLeft !== null && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex items-center gap-3 px-5 py-3 rounded-[1.25rem] border transition-all duration-500 shadow-sm ${timeLeft < 10
                                    ? 'bg-red-50/80 border-red-100 text-red-600 animate-pulse ring-4 ring-red-50'
                                    : 'bg-slate-50 border-slate-100 text-slate-600'
                                    }`}>
                                <div className={`relative ${timeLeft < 10 ? 'animate-spin-slow' : ''}`}>
                                    <Clock className={`w-4 h-4 ${timeLeft < 10 ? 'text-red-500' : 'text-slate-400'}`} />
                                    {timeLeft < 10 && <div className="absolute inset-0 bg-red-400/20 rounded-full blur-sm" />}
                                </div>
                                <span className="font-black text-[11px] uppercase tracking-[0.15em] leading-none">
                                    {timeLeft} MIN
                                </span>
                            </motion.div>
                        )}

                        <div className="hidden sm:flex items-center gap-3 bg-white px-5 py-3 rounded-[1.25rem] border border-slate-100 shadow-sm">
                            <span className="text-lg filter drop-shadow-sm">🎓</span>
                            <span className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em]">{selectedChild?.grade_level || 'CP'}</span>
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-slate-950 px-5 py-3 rounded-[1.25rem] flex items-center gap-4 border border-slate-800 shadow-premium group cursor-default relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-xl shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 relative z-10">
                                <Star className="w-4 h-4 text-white fill-white" />
                            </div>
                            <div className="flex flex-col relative z-10">
                                <span className="font-black text-white text-base tracking-tight leading-none">
                                    {selectedChild?.stars || 0}
                                </span>
                                <span className="text-[8px] text-amber-400/60 font-black uppercase tracking-widest mt-1">Points</span>
                            </div>
                        </motion.div>
                    </div>
                )}

                <button
                    onClick={() => setIsMobileNavOpen(true)}
                    className="md:hidden p-4 bg-white border border-slate-100 rounded-2xl text-slate-900 shadow-premium hover:bg-slate-50 transition-all active:scale-95"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
}

