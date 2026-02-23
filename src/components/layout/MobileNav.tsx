import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { TabItem, Tab } from '../../types/app';

interface MobileNavProps {
    isOpen: boolean;
    onClose: () => void;
    tabs: TabItem[];
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

export default function MobileNav({ isOpen, onClose, tabs, activeTab, setActiveTab }: MobileNavProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] p-6 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-white font-black text-2xl tracking-tight">Menu Magique</h1>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all"
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pb-8 scrollbar-hide">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); onClose(); }}
                                    className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${isActive
                                            ? 'bg-white text-indigo-600 border-white shadow-xl scale-105'
                                            : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`p-3 rounded-2xl ${isActive ? 'bg-indigo-50' : 'bg-white/10'}`}>
                                        <tab.icon className="w-6 h-6" />
                                    </div>
                                    <span className="font-black text-[10px] uppercase tracking-widest">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
