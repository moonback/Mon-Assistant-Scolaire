import React from 'react';
import { motion } from 'motion/react';
import { Star, Menu, Clock } from 'lucide-react';
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

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${currentTab?.color || 'from-indigo-500 to-purple-500'} text-white shadow-sm md:hidden`}>
                    {currentTab && <currentTab.icon className="w-5 h-5" />}
                </div>
                <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {isHome ? `Salut ${selectedChild?.name} ! 👋` : (currentTab?.label || 'Magic École')}
                    </h2>
                    <p className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {isHome ? 'Prêt pour tes missions ?' : (currentTab?.desc || 'Apprend en t\'amusant')}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                {timeLeft !== null && (
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <Clock className={`w-3.5 h-3.5 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                        <span className={`font-black text-[10px] md:text-sm ${timeLeft < 10 ? 'text-red-600' : 'text-slate-600'}`}>
                            {timeLeft} MIN
                        </span>
                    </div>
                )}

                <div className="hidden sm:flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                    <span className="text-sm">🎓</span>
                    <span className="font-black text-indigo-700 text-[10px] uppercase tracking-wider">{selectedChild?.grade_level}</span>
                </div>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-yellow-50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-2 border border-yellow-200 shadow-sm"
                >
                    <div className="bg-yellow-400 p-1 rounded-lg">
                        <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-white fill-white" />
                    </div>
                    <span className="font-black text-yellow-700 text-sm">
                        {selectedChild?.stars || 0} <span className="text-[10px] text-yellow-600/60 ml-0.5">PTS</span>
                    </span>
                </motion.div>

                <button
                    onClick={() => setIsMobileNavOpen(true)}
                    className="md:hidden p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
}
