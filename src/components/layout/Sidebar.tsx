import React from 'react';
import { motion } from 'motion/react';
import {
    ChevronLeft, Brain, LogOut,
    LayoutDashboard, Users, Gift, Settings as SettingsIcon, ShieldCheck, Lock
} from 'lucide-react';
import { TabItem, ParentalTab } from '../../types/app';
import { Child } from '../../lib/supabase';

interface SidebarProps {
    tabs: TabItem[];
    activeTab: string;
    setActiveTab: (id: any) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    selectedChild: Child | null;
    setSelectedChild: (child: Child | null) => void;
    parentalActiveTab: ParentalTab;
    setParentalActiveTab: (tab: ParentalTab) => void;
}

export default function Sidebar({
    tabs, activeTab, setActiveTab, isCollapsed, setIsCollapsed, selectedChild, setSelectedChild,
    parentalActiveTab, setParentalActiveTab
}: SidebarProps) {

    const parentalMenuItems = [
        { id: 'overview' as ParentalTab, label: 'Vue d\'ensemble', icon: LayoutDashboard },
        { id: 'children' as ParentalTab, label: 'Mes Enfants', icon: Users },
        { id: 'rewards' as ParentalTab, label: 'Récompenses', icon: Gift },
        { id: 'security' as ParentalTab, label: 'Sécurité', icon: SettingsIcon },
    ];

    const isParentMode = activeTab === 'parental';

    return (
        <aside className={`hidden md:flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-100 fixed h-screen z-40 transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <div className="magical-gradient p-2 rounded-xl text-white shadow-lg">
                            {isParentMode ? <ShieldCheck className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                        </div>
                        <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            {isParentMode ? 'Espace Parent' : 'Family AI'}
                        </h1>
                    </motion.div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2 scrollbar-hide">
                {isParentMode ? (
                    <>
                        <button
                            onClick={() => setActiveTab('home')}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-slate-400 hover:bg-slate-50 hover:text-indigo-600 mb-4 group"
                            title={isCollapsed ? 'Retour' : ''}
                        >
                            <div className="w-5 h-5 flex items-center justify-center transition-transform group-hover:-translate-x-1">
                                <ChevronLeft className="w-5 h-5" />
                            </div>
                            {!isCollapsed && <span className="font-bold text-sm">Retour à l'App</span>}
                        </button>

                        <div className="space-y-1.5">
                            {parentalMenuItems.map((item) => {
                                const isActive = parentalActiveTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setParentalActiveTab(item.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative group ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                            } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                        </div>
                                        {!isCollapsed && (
                                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative group ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                title={isCollapsed ? tab.label : ''}
                            >
                                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    <tab.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                </div>
                                {!isCollapsed && (
                                    <span className="font-bold text-sm tracking-tight">{tab.label}</span>
                                )}
                                {isActive && !isCollapsed && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute right-2 w-1.5 h-1.5 bg-indigo-600 rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })
                )}
            </nav>

            <div className="p-4 mt-auto space-y-2 border-t border-slate-50">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full p-2.5 flex items-center gap-3 rounded-2xl transition-all group ${activeTab === 'profile' ? 'bg-indigo-50 ring-1 ring-indigo-200 shadow-sm' : 'hover:bg-slate-50'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs overflow-hidden shadow-lg border-2 border-white">
                        {selectedChild?.avatar_url ? (
                            <img src={selectedChild.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            selectedChild?.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="text-left flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-[11px] truncate leading-none mb-1">{selectedChild?.name}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{selectedChild?.grade_level}</p>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => setSelectedChild(null)}
                    className={`w-full p-2.5 flex items-center gap-3 rounded-2xl transition-all text-slate-400 hover:text-indigo-600 hover:bg-slate-50 group ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title="Changer d'enfant"
                >
                    <div className="w-9 h-9 flex items-center justify-center">
                        <LogOut className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
                    </div>
                    {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Changer d'enfant</span>}
                </button>
            </div>
        </aside>
    );
}
