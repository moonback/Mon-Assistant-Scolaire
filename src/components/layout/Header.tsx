import React from 'react';
import { Star, Menu, Clock, ShieldCheck, Lock, Moon } from 'lucide-react';
import { TabItem } from '../../types/app';
import { Child } from '../../lib/supabase';
import ExpBar from './ExpBar';

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
                    <div className="hidden items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-2 text-xs font-bold text-indigo-600 sm:flex shadow-sm">
                        <Lock className="h-4 w-4" />
                        ZONE SÉCURISÉE
                    </div>
                ) : (
                    <>
                        {/* Status Badges for Active Controls */}
                        <div className="hidden lg:flex items-center gap-2 mr-2">
                            {selectedChild?.daily_time_limit && selectedChild.daily_time_limit > 0 ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
                                    <Clock className="h-3 w-3" />
                                    Limite Active
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-black uppercase tracking-wider opacity-60">
                                    <Clock className="h-3 w-3" />
                                    Sans Limite
                                </div>
                            )}

                            {selectedChild?.bedtime ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black uppercase tracking-wider">
                                    <Moon className="h-3 w-3" />
                                    Coucher: {selectedChild.bedtime}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-black uppercase tracking-wider opacity-60">
                                    <Moon className="h-3 w-3" />
                                    Pas de Coucher
                                </div>
                            )}
                        </div>

                        {timeLeft !== null && (
                            <div className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 font-black transition-all shadow-sm text-sm ${timeLeft < 5
                                ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                                : timeLeft < 15
                                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}>
                                <span className="text-lg">{timeLeft < 5 ? '⏰' : timeLeft < 15 ? '⌛' : '🕐'}</span>
                                <span>{timeLeft} min</span>
                            </div>
                        )}

                        <ExpBar stars={selectedChild?.stars || 0} />

                        <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-1.5 text-sm shadow-sm">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]" />
                            <span className="font-black text-amber-700">{selectedChild?.stars || 0}</span>
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
