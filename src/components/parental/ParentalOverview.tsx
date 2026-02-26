import React from 'react';
import { Zap, BookOpen, History, Star } from 'lucide-react';
import { Progress, Child } from '../../lib/supabase';
import CompletedQuizzesList from '../CompletedQuizzesList';

interface ParentalOverviewProps {
    childrenContext: Child[];
    stats: Progress[];
}

export default function ParentalOverview({ childrenContext, stats }: ParentalOverviewProps) {
    return (
        <div className="space-y-8 ">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 p-8 rounded-2xl text-white shadow-sm relative overflow-hidden group">
                    <Zap className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    <h3 className="text-indigo-100 text-xs font-semibold uppercase tracking-wide mb-4">Total Stars</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-semibold">{childrenContext.reduce((acc, c) => acc + c.stars, 0)}</span>
                        <span className="text-indigo-200 text-lg font-bold mb-1">⭐</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-4">Moyenne d'Étude</h3>
                    <div className="flex items-end gap-2 text-slate-800">
                        <span className="text-3xl font-semibold">{Math.round(stats.length / (childrenContext.length || 1))}</span>
                        <span className="text-slate-500 text-sm font-bold mb-1">ACT/KID</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-4">Matière Favorite</h3>
                    <div className="flex items-end gap-2 text-slate-800">
                        <span className="text-2xl font-semibold uppercase">{stats[0]?.subject || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                        <History className="w-6 h-6 text-indigo-600" /> Historique Récent
                    </h3>
                </div>
                <div className="space-y-4">
                    {stats.length > 0 ? stats.slice(0, 5).map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <BookOpen className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{s.subject}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase">{childrenContext.find(c => c.id === s.child_id)?.name || 'Anonyme'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-indigo-600">+{s.score} PTS</p>
                                <p className="text-xs font-bold text-slate-400 uppercase">{new Date(s.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="py-10 text-center text-slate-400 font-bold italic">Aucune activité pour le moment...</div>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> Historique des Quiz
                    </h3>
                </div>
                <CompletedQuizzesList childId="all" limit={5} />
            </div>
        </div>
    );
}
