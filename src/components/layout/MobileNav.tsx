import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LayoutDashboard, Users, Gift, Settings as SettingsIcon, ChevronLeft, ShieldCheck, Swords, Accessibility } from 'lucide-react';
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
    isOpen,
    onClose,
    tabs,
    activeTab,
    setActiveTab,
    parentalActiveTab,
    setParentalActiveTab,
}: MobileNavProps) {
    const isParentMode = activeTab === 'parental';

    const parentalMenuItems = [
        { id: 'overview' as ParentalTab, label: 'Vue d\'ensemble', icon: LayoutDashboard },
        { id: 'children' as ParentalTab, label: 'Mes enfants', icon: Users },
        { id: 'missions' as ParentalTab, label: 'Missions AI', icon: ShieldCheck },
        { id: 'competitions' as ParentalTab, label: 'Compétitions', icon: Swords },
        { id: 'rewards' as ParentalTab, label: 'Récompenses', icon: Gift },
        { id: 'accessibility' as ParentalTab, label: 'Accessibilité', icon: Accessibility },
        { id: 'security' as ParentalTab, label: 'Sécurité', icon: SettingsIcon },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-slate-950/35 p-4 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 16, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mx-auto flex h-full max-w-md flex-col rounded-2xl border border-slate-200 bg-[#FAFAFA] p-4"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h1 className="text-base font-semibold text-slate-900">
                                {isParentMode ? 'Navigation parent' : 'Navigation'}
                            </h1>
                            <button
                                onClick={onClose}
                                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-2">
                            {isParentMode ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setActiveTab('home');
                                            onClose();
                                        }}
                                        className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Retour à l'app
                                    </button>

                                    {parentalMenuItems.map((item) => {
                                        const isActive = parentalActiveTab === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setParentalActiveTab(item.id);
                                                    onClose();
                                                }}
                                                className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs ${isActive
                                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-200 bg-white text-slate-700'
                                                    }`}
                                            >
                                                <item.icon className="h-4 w-4" />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </>
                            ) : (
                                <>
                                    {[
                                        { title: "Mon Espace", ids: ['home', 'dashboard', 'market'] },
                                        { title: "Apprentissage", ids: ['assistant', 'homework', 'flashcards', 'dictionary', 'fact'] },
                                        { title: "Entraînement & Jeux", ids: ['challenges', 'quiz', 'math', 'story', 'drawing'] }
                                    ].map((group, gIdx) => {
                                        const groupTabs = tabs.filter(t => group.ids.includes(t.id));
                                        if (groupTabs.length === 0) return null;

                                        return (
                                            <React.Fragment key={group.title}>
                                                <div className={`col-span-2 ${gIdx !== 0 ? 'mt-4' : ''}`}>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {group.title}
                                                    </h4>
                                                </div>
                                                {groupTabs.map((tab) => {
                                                    const isActive = activeTab === tab.id;
                                                    return (
                                                        <button
                                                            key={tab.id}
                                                            onClick={() => {
                                                                setActiveTab(tab.id);
                                                                onClose();
                                                            }}
                                                            className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs transition-colors ${isActive
                                                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <tab.icon className="h-5 w-5" />
                                                            <span className="font-semibold">{tab.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
