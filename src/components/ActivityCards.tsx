import React from 'react';
import { motion } from 'motion/react';
import { TabItem } from '../types/app';
import { Child } from '../lib/supabase';

interface ActivityCardsProps {
    tabs: TabItem[];
    activeTab: string;
    setActiveTab: (id: any) => void;
    selectedChild: Child | null;
}

export default function ActivityCards({ tabs, activeTab, setActiveTab, selectedChild }: ActivityCardsProps) {
    const filteredTabs = tabs
        .filter(t => !['home', 'dashboard', 'parental', 'profile'].includes(t.id))
        .filter(t => !selectedChild?.blocked_topics?.includes(t.id));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredTabs.map((tab, idx) => (
                <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: idx * 0.05,
                        duration: 0.5,
                        ease: [0.23, 1, 0.32, 1]
                    }}
                    whileHover={{
                        y: -8,
                        scale: 1.02,
                        transition: { duration: 0.3 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium hover:shadow-premium-hover transition-all text-left overflow-hidden h-full flex flex-col"
                >
                    {/* Background Decorative Element */}
                    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${tab.color} opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity animate-pulse`} />

                    <div className="relative z-10">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tab.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform duration-500`}>
                            <tab.icon className="w-7 h-7" />
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                {tab.label}
                            </h4>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed line-clamp-2 italic">
                                {tab.desc}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                            Découvrir
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-indigo-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Left Border Indicator */}
                    <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${tab.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </motion.button>
            ))}
        </div>
    );
}
