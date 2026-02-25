import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LayoutDashboard, Users, Gift, Settings as SettingsIcon, ChevronLeft, Sparkles } from 'lucide-react';
import { TabItem, Tab, ParentalTab } from '../../types/app';

interface MobileNavProps {
    isOpen: boolean;
    onClose: () => void;
    tabs: TabItem[];
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    parentalActiveTab: ParentalTab;
    setParentalActiveTab: (tab: ParentalTab) => void;
}

export default function MobileNav({
    isOpen, onClose, tabs, activeTab, setActiveTab,
    parentalActiveTab, setParentalActiveTab
}: MobileNavProps) {
    const isParentMode = activeTab === 'parental';

    const parentalMenuItems = [
        { id: 'overview' as ParentalTab, label: 'Vue d\'ensemble', icon: LayoutDashboard },
        { id: 'children' as ParentalTab, label: 'Mes Enfants', icon: Users },
        { id: 'rewards' as ParentalTab, label: 'Récompenses', icon: Gift },
        { id: 'security' as ParentalTab, label: 'Sécurité', icon: SettingsIcon },
    ];
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl z-[100] p-6 lg:p-12 flex flex-col justify-center items-center"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-2xl bg-slate-900/80 rounded-[4rem] border border-white/10 shadow-2xl p-8 lg:p-12 relative overflow-hidden"
                    >
                        {/* Background glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h1 className="text-white font-black text-3xl tracking-tight">
                                        {isParentMode ? 'Espace Parent' : 'Menu Magique'}
                                    </h1>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-2xl text-white/60 transition-all border border-white/10"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide py-2">
                                {isParentMode ? (
                                    <>
                                        <button
                                            onClick={() => { setActiveTab('home'); onClose(); }}
                                            className="col-span-2 p-6 rounded-[2rem] bg-indigo-600 text-white border border-indigo-400 flex items-center justify-center gap-4 mb-4 shadow-xl hover:bg-indigo-500 transition-all group"
                                        >
                                            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                                            <span className="font-black text-xs uppercase tracking-[0.2em]">Retour à l&apos;Application</span>
                                        </button>
                                        {parentalMenuItems.map((item, idx) => {
                                            const isActive = parentalActiveTab === item.id;
                                            return (
                                                <motion.button
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    onClick={() => { setParentalActiveTab(item.id); onClose(); }}
                                                    className={`p-8 rounded-[3rem] border-2 flex flex-col items-center gap-4 transition-all group ${isActive
                                                        ? 'bg-white text-slate-900 border-white shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] scale-[1.02]'
                                                        : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    <div className={`p-4 rounded-2xl transition-all duration-500 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-white/10 group-hover:rotate-6'}`}>
                                                        <item.icon className="w-8 h-8" />
                                                    </div>
                                                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-center">{item.label}</span>
                                                </motion.button>
                                            );
                                        })}
                                    </>
                                ) : (
                                    tabs.map((tab, idx) => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <motion.button
                                                key={tab.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => { setActiveTab(tab.id); onClose(); }}
                                                className={`p-8 rounded-[3rem] border-2 flex flex-col items-center gap-4 transition-all group ${isActive
                                                    ? 'bg-white text-indigo-600 border-white shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] scale-[1.02]'
                                                    : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                <div className={`p-4 rounded-2xl transition-all duration-500 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-white/10 group-hover:rotate-6'}`}>
                                                    <tab.icon className="w-8 h-8" />
                                                </div>
                                                <span className="font-black text-[10px] uppercase tracking-[0.2em]">{tab.label}</span>
                                            </motion.button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
