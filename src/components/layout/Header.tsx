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
        <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-100 px-8 py-4 flex items-center justify-between transition-all">
            <div className="flex items-center gap-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-3 rounded-2xl bg-gradient-to-br shadow-premium md:hidden ${isParental ? 'from-slate-700 to-slate-900' : (currentTab?.color || 'from-indigo-600 to-purple-600')} text-white`}
                >
                    {isParental ? <ShieldCheck className="w-6 h-6" /> : (currentTab && <currentTab.icon className="w-6 h-6" />)}
                </motion.div>

                <div className="flex flex-col">
                    <motion.h2
                        key={activeTab}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none"
                    >
                        {isParental ? 'Admin Parent' : (isHome ? `Salut ${selectedChild?.name} ! 👋` : (currentTab?.label || 'Family AI'))}
                    </motion.h2>
                    <motion.p
                        key={`${activeTab}-desc`}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="hidden md:block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5"
                    >
                        {isParental ? 'Sécurité et gestion du profil' : (isHome ? 'Tes missions magiques du jour' : (currentTab?.desc || 'Apprentissage intelligent'))}
                    </motion.p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {isParental ? (
                    <div className="bg-slate-900 px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-slate-800 shadow-premium">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span className="font-black text-white text-[10px] uppercase tracking-widest">Connexion Sécurisée</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        {timeLeft !== null && (
                            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all shadow-sm ${timeLeft < 10
                                    ? 'bg-red-50 border-red-100 text-red-600 animate-pulse'
                                    : 'bg-slate-50 border-slate-100 text-slate-600'
                                }`}>
                                <Clock className={`w-4 h-4 ${timeLeft < 10 ? 'text-red-500' : 'text-slate-400'}`} />
                                <span className="font-black text-xs uppercase tracking-widest leading-none">
                                    {timeLeft} MIN
                                </span>
                            </div>
                        )}

                        <div className="hidden sm:flex items-center gap-2.5 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm">
                            <span className="text-base filter drop-shadow-sm">🎓</span>
                            <span className="font-black text-indigo-700 text-[10px] uppercase tracking-[0.1em]">{selectedChild?.grade_level}</span>
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-amber-50 px-4 py-2 rounded-2xl flex items-center gap-3 border border-amber-100 shadow-premium group cursor-default"
                        >
                            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 rounded-xl shadow-lg group-hover:rotate-12 transition-transform">
                                <Star className="w-3.5 h-3.5 text-white fill-white" />
                            </div>
                            <span className="font-black text-amber-900 text-sm tracking-tight leading-none">
                                {selectedChild?.stars || 0}
                                <span className="text-[9px] text-amber-600/60 ml-1 font-black uppercase">pts</span>
                            </span>
                        </motion.div>
                    </div>
                )}

                <button
                    onClick={() => setIsMobileNavOpen(true)}
                    className="md:hidden p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 shadow-premium hover:bg-slate-50 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
}

