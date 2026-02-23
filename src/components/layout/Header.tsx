import React from 'react';
import { motion } from 'motion/react';
import { Star, Menu } from 'lucide-react';
import { TabItem } from '../../types/app';
import { Child } from '../../lib/supabase';

interface HeaderProps {
    activeTab: string;
    tabs: TabItem[];
    selectedChild: Child | null;
    setIsMobileNavOpen: (open: boolean) => void;
}

export default function Header({ activeTab, tabs, selectedChild, setIsMobileNavOpen }: HeaderProps) {
    const currentTab = tabs.find(t => t.id === activeTab);

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${currentTab?.color} text-white shadow-sm md:hidden`}>
                    {currentTab && <currentTab.icon className="w-5 h-5" />}
                </div>
                <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">
                        {currentTab?.label || 'Magic École'}
                    </h2>
                    <p className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {currentTab?.desc || 'Apprend en t\'amusant'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-yellow-50 px-4 py-2 rounded-2xl flex items-center gap-2.5 border border-yellow-200 shadow-sm"
                >
                    <div className="bg-yellow-400 p-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                    <span className="font-black text-yellow-700 text-sm">
                        {selectedChild?.stars || 0} <span className="text-[10px] text-yellow-600/60 ml-0.5">PTS</span>
                    </span>
                </motion.div>

                <button
                    onClick={() => setIsMobileNavOpen(true)}
                    className="md:hidden p-2.5 bg-slate-50 rounded-xl text-slate-600 border border-slate-100"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
}
