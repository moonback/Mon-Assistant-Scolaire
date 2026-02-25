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
        <aside className={`hidden md:flex flex-col bg-white/90 backdrop-blur-2xl border-r border-slate-100 fixed h-screen z-40 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${isCollapsed ? 'w-24' : 'w-72'}`}>
            <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="magical-gradient p-2.5 rounded-2xl text-white shadow-premium animate-pulse-glow">
                            {isParentMode ? <ShieldCheck className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight leading-none">
                                {isParentMode ? 'PARENT' : 'FAMILY'}
                            </h1>
                            <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">
                                {isParentMode ? 'Espace Sécurisé' : 'Assistant IA'}
                            </span>
                        </div>
                    </motion.div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100 hover:border-indigo-100 shadow-sm ${isCollapsed ? 'mt-4' : ''}`}
                >
                    <ChevronLeft className={`w-5 h-5 transition-transform duration-700 ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4 scrollbar-hide">
                {isParentMode ? (
                    <>
                        <button
                            onClick={() => setActiveTab('home')}
                            className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-slate-400 hover:bg-slate-50 hover:text-indigo-600 mb-6 group border border-transparent hover:border-slate-100 ${isCollapsed ? 'justify-center px-0' : ''}`}
                            title={isCollapsed ? 'Retour' : ''}
                        >
                            <div className="w-6 h-6 flex items-center justify-center transition-transform group-hover:-translate-x-1">
                                <ChevronLeft className="w-6 h-6" />
                            </div>
                            {!isCollapsed && <span className="font-black text-sm uppercase tracking-widest">Retour App</span>}
                        </button>

                        <div className="space-y-1.5">
                            {parentalMenuItems.map((item) => {
                                const isActive = parentalActiveTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setParentalActiveTab(item.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all relative group border ${isActive
                                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-premium'
                                            : 'text-slate-400 border-transparent hover:bg-slate-50 hover:text-slate-600'
                                            } ${isCollapsed ? 'justify-center px-0 mx-auto' : ''}`}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <div className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                        </div>
                                        {!isCollapsed && (
                                            <span className="font-black text-sm tracking-tight uppercase">{item.label}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="space-y-1.5">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all relative group border ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm'
                                        : 'text-slate-400 border-transparent hover:bg-slate-50 hover:text-slate-600'
                                        } ${isCollapsed ? 'justify-center px-0 mx-auto' : ''}`}
                                    title={isCollapsed ? tab.label : ''}
                                >
                                    <div className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        <tab.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                    </div>
                                    {!isCollapsed && (
                                        <span className="font-black text-sm tracking-tight uppercase">{tab.label}</span>
                                    )}
                                    {isActive && !isCollapsed && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute right-4 w-1.5 h-1.5 bg-indigo-600 rounded-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </nav>

            <div className="p-6 mt-auto space-y-3 border-t border-slate-50 bg-slate-50/50">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full p-3 flex items-center gap-4 rounded-[2rem] transition-all group ${activeTab === 'profile' ? 'bg-white border-indigo-100 shadow-premium scale-105 ring-1 ring-indigo-50' : 'hover:bg-white/80 border border-transparent'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm overflow-hidden shadow-lg border-2 border-white ring-4 ring-indigo-50 group-hover:ring-indigo-100 transition-all">
                            {selectedChild?.avatar_url ? (
                                <img src={selectedChild.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                selectedChild?.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="text-left flex-1 min-w-0">
                            <p className="font-black text-slate-800 text-[13px] truncate leading-none mb-1.5 uppercase">{selectedChild?.name}</p>
                            <div className="bg-indigo-50 inline-block px-2 py-0.5 rounded-lg border border-indigo-100">
                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{selectedChild?.grade_level}</p>
                            </div>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => setSelectedChild(null)}
                    className={`w-full p-4 flex items-center gap-4 rounded-3xl transition-all text-slate-400 hover:text-red-600 hover:bg-red-50 group border border-transparent hover:border-red-100 ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title="Changer d'enfant"
                >
                    <div className="w-6 h-6 flex items-center justify-center">
                        <LogOut className="w-5 h-5 transition-transform group-hover:rotate-12" />
                    </div>
                    {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quitter l'espace</span>}
                </button>
            </div>
        </aside>
    );
}
