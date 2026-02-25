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
        { id: 'rewards' as ParentalTab, label: 'Récompenses', icon: Gift },
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
                            <p className="text-sm font-semibold text-slate-900">Mon Assistant</p>
                            <p className="text-xs text-slate-500">{isParentMode ? 'Espace parent' : 'Espace élève'}</p>
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

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {isParentMode ? (
                    <>
                        <button
                            onClick={() => setActiveTab('home')}
                            className={`mb-3 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-white ${isCollapsed ? 'justify-center px-0' : ''}`}
                            title={isCollapsed ? 'Retour' : ''}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            {!isCollapsed && <span>Retour à l'app</span>}
                        </button>

                        {parentalMenuItems.map((item) => {
                            const isActive = parentalActiveTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setParentalActiveTab(item.id)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                                        isActive
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:bg-white'
                                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                    title={isCollapsed ? item.label : ''}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {!isCollapsed && <span>{item.label}</span>}
                                </button>
                            );
                        })}
                    </>
                ) : (
                    tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                                    isActive
                                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-600 hover:bg-white'
                                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                title={isCollapsed ? tab.label : ''}
                            >
                                <tab.icon className="h-4 w-4" />
                                {!isCollapsed && <span>{tab.label}</span>}
                                {isActive && !isCollapsed && (
                                    <motion.div layoutId="activeTabIndicator" className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                                )}
                            </button>
                        );
                    })
                )}
            </nav>

            <div className="mt-auto space-y-2 border-t border-slate-200/80 p-3">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors ${activeTab === 'profile' ? 'bg-white ring-1 ring-slate-200' : 'hover:bg-white'} ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {selectedChild?.avatar_url ? (
                            <img src={selectedChild.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                            selectedChild?.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 text-left">
                            <p className="truncate text-sm font-medium text-slate-800">{selectedChild?.name}</p>
                            <p className="truncate text-xs text-slate-500">{selectedChild?.grade_level}</p>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => setSelectedChild(null)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm text-slate-500 transition-colors hover:bg-white hover:text-slate-900 ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title="Changer d'enfant"
                >
                    <LogOut className="h-4 w-4 rotate-180" />
                    {!isCollapsed && <span>Changer d'enfant</span>}
                </button>
            </div>
        </aside>
    );
}
