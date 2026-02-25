import React from 'react';
import { Star, Menu, Clock, ShieldCheck, Lock } from 'lucide-react';
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
    const currentTab = tabs.find((t) => t.id === activeTab);
    const isHome = activeTab === 'home';
    const isParental = activeTab === 'parental';

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-[#FAFAFA]/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
                <div className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                    {isParental ? <ShieldCheck className="h-4 w-4" /> : (currentTab && <currentTab.icon className="h-4 w-4" />)}
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-slate-900 md:text-base">
                        {isParental ? 'Espace parent' : isHome ? `Bonjour ${selectedChild?.name}` : currentTab?.label || 'Mon Assistant'}
                    </h2>
                    <p className="hidden text-xs text-slate-500 md:block">
                        {isParental ? 'Gestion des profils et de la sécurité' : isHome ? 'Choisis une activité pour continuer' : currentTab?.desc}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isParental ? (
                    <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 sm:flex">
                        <Lock className="h-3.5 w-3.5" />
                        Zone sécurisée
                    </div>
                ) : (
                    <>
                        {timeLeft !== null && (
                            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600">
                                <Clock className={`h-3.5 w-3.5 ${timeLeft < 10 ? 'text-red-500' : ''}`} />
                                <span className="font-medium">{timeLeft} min</span>
                            </div>
                        )}

                        <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 sm:flex">
                            <span>{selectedChild?.grade_level}</span>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-slate-800">{selectedChild?.stars || 0}</span>
                        </div>
                    </>
                )}

                <button
                    onClick={() => setIsMobileNavOpen(true)}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 md:hidden"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}
