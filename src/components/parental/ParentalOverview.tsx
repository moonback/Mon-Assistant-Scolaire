import React from 'react';
import { Zap, BookOpen, History, Star, Brain, Camera, Palette, MessageCircle, Gamepad2, Sparkles } from 'lucide-react';
import { Progress, Child } from '../../lib/supabase';
import CompletedQuizzesList from '../CompletedQuizzesList';

interface ParentalOverviewProps {
    childrenContext: Child[];
    stats: Progress[];
}

const getActivityConfig = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('quiz')) return { icon: Brain, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Quiz' };
    if (t.includes('homework')) return { icon: Camera, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Devoirs Photo' };
    if (t.includes('story')) return { icon: BookOpen, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', label: 'Conte' };
    if (t.includes('drawing')) return { icon: Palette, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', label: 'Atelier' };
    if (t.includes('math') || t.includes('calcul')) return { icon: Gamepad2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Jeu Math' };
    if (t.includes('assistant') || t.includes('chat')) return { icon: MessageCircle, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', label: 'IA' };
    if (t.includes('fact')) return { icon: Sparkles, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100', label: 'Curiosité' };

    return { icon: Star, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100', label: type || 'Activité' };
};

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
                    {stats.length > 0 ? stats.slice(0, 5).map(s => {
                        const childName = childrenContext.find(c => c.id === s.child_id)?.name || 'Anonyme';
                        const config = getActivityConfig(s.activity_type || '');
                        const Icon = config.icon;

                        return (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all group cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${config.bg} ${config.border} ${config.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm capitalize">{s.subject}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                            {childName} • {config.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-lg">
                                        <span className="text-xs font-black text-emerald-600">+{s.score} PTS</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                                        {new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="py-10 text-center text-slate-400 font-bold bg-slate-50 border border-slate-100 rounded-2xl uppercase tracking-widest text-xs">Aucune activité pour le moment</div>
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
