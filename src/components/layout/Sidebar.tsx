import React from 'react';
import { motion } from 'motion/react';
import {
    ChevronLeft,
    Brain,
    LogOut,
    LayoutDashboard,
    Users,
    Gift,
    Settings as SettingsIcon,
    ShieldCheck,
    Swords,
    Accessibility,
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
    tabs,
    activeTab,
    setActiveTab,
    isCollapsed,
    setIsCollapsed,
    selectedChild,
    setSelectedChild,
    parentalActiveTab,
    setParentalActiveTab,
}: SidebarProps) {
    const parentalMenuItems = [
        { id: 'overview' as ParentalTab, label: 'Vue d\'ensemble', icon: LayoutDashboard },
        { id: 'children' as ParentalTab, label: 'Mes enfants', icon: Users },
        { id: 'missions' as ParentalTab, label: 'Missions AI', icon: ShieldCheck },
        { id: 'competitions' as ParentalTab, label: 'Compétitions', icon: Swords },
        { id: 'rewards' as ParentalTab, label: 'Récompenses', icon: Gift },
        { id: 'accessibility' as ParentalTab, label: 'Accessibilité', icon: Accessibility },
        { id: 'security' as ParentalTab, label: 'Sécurité', icon: SettingsIcon },
    ];

    const isParentMode = activeTab === 'parental';

    return (
        <aside
            className={`hidden md:flex fixed z-40 h-screen flex-col border-r border-slate-200/80 bg-[#FAFAFA] transition-all duration-200 ${isCollapsed ? 'w-20' : 'w-64'}`}
        >
            <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-4">
                {!isCollapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-600">
                            {isParentMode ? <ShieldCheck className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">Family IA</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                                {isParentMode ? 'Parents' : 'Enfants'}
                            </p>
                        </div>
                    </motion.div>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-slate-800"
                >
                    <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
                {isParentMode ? (
                    <>
                        <motion.button
                            whileHover={{ x: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab('home')}
                            className={`mb-6 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-colors ${isCollapsed ? 'justify-center px-0' : ''}`}
                            title={isCollapsed ? 'Retour' : ''}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            {!isCollapsed && <span>Retour à l'app</span>}
                        </motion.button>

                        {parentalMenuItems.map((item) => {
                            const isActive = parentalActiveTab === item.id;
                            return (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setParentalActiveTab(item.id)}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-wide transition-all ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-100'
                                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? item.label : ''}
                                >
                                    <item.icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                                    {!isCollapsed && <span>{item.label}</span>}
                                </motion.button>
                            );
                        })}
                    </>
                ) : (
                    <div className="space-y-6">
                        {[
                            { title: "Mon Espace", ids: ['home', 'dashboard', 'market'] },
                            { title: "Apprentissage", ids: ['assistant', 'homework', 'flashcards', 'dictionary', 'fact'] },
                            { title: "Entraînement & Jeux", ids: ['challenges', 'quiz', 'math', 'story', 'drawing'] }
                        ].map(group => {
                            const groupTabs = tabs.filter(t => group.ids.includes(t.id));
                            if (groupTabs.length === 0) return null;

                            return (
                                <div key={group.title} className="space-y-1">
                                    {!isCollapsed && (
                                        <h4 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                            {group.title}
                                        </h4>
                                    )}
                                    {groupTabs.map((tab) => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <motion.button
                                                key={tab.id}
                                                whileHover={{ x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-wide transition-all ${isActive
                                                    ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-100/50'
                                                    : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-100 shadow-sm shadow-transparent hover:shadow-slate-200/50'
                                                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                                title={isCollapsed ? tab.label : ''}
                                            >
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    <tab.icon className="h-4 w-4" />
                                                </div>
                                                {!isCollapsed && <span>{tab.label}</span>}
                                                {isActive && !isCollapsed && (
                                                    <motion.div
                                                        layoutId="activeTabIndicator"
                                                        className="ml-auto h-2 w-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.6)]"
                                                    />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}
            </nav>

            <div className="mt-auto space-y-3 border-t border-slate-200/60 p-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('profile')}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-all ${activeTab === 'profile' ? 'bg-white ring-1 ring-slate-200 shadow-md' : 'hover:bg-white'} ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                    <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 text-sm font-black text-indigo-700 ring-2 ring-white shadow-sm">
                            {selectedChild?.avatar_url ? (
                                <img src={selectedChild.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                                selectedChild?.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 text-left">
                            <p className="truncate text-sm font-black text-slate-800 tracking-tight">{selectedChild?.name}</p>
                            <p className="truncate text-[10px] font-bold uppercase text-slate-400 tracking-wider">Élève {selectedChild?.grade_level}</p>
                        </div>
                    )}
                </motion.button>

                <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedChild(null)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title="Changer d'enfant"
                >
                    <LogOut className="h-4 w-4 rotate-180" />
                    {!isCollapsed && <span>Quitter</span>}
                </motion.button>
            </div>
        </aside>
    );
}
