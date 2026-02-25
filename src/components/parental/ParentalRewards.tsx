import React from 'react';
import { motion } from 'motion/react';
import { Gift, TrendingUp } from 'lucide-react';
import { Child } from '../../lib/supabase';

interface ParentalRewardsProps {
    childrenContext: Child[];
}

export default function ParentalRewards({ childrenContext }: ParentalRewardsProps) {
    return (
        <div className="space-y-8 ">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center">
                <div className="w-20 h-20 bg-yellow-50 rounded-3xl flex items-center justify-center text-yellow-500 mx-auto mb-6">
                    <Gift className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-800 mb-2">Objectifs & Récompenses</h2>
                <p className="text-slate-500 font-bold mb-10 max-w-md mx-auto">Suivez les défis en cours pour chaque enfant !</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {childrenContext.map(child => (
                        child.reward_goals?.map((goal: any) => {
                            const progress = Math.min(100, Math.round((child.stars / goal.target) * 100));
                            return (
                                <div key={goal.id} className="p-8 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden group hover:border-indigo-200 transition-all">
                                    <TrendingUp className="absolute -right-2 -bottom-2 w-20 h-20 text-indigo-50 group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <span className="bg-white p-3 rounded-2xl text-2xl shadow-sm">{goal.icon || '🎁'}</span>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${progress === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {progress === 100 ? 'Terminé ! ✨' : 'En cours'}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-slate-800 text-lg">{goal.label}</h4>
                                        <p className="text-xs font-bold text-slate-400 mb-4">Pour {child.name}</p>
                                        <div className="h-4 bg-white rounded-full overflow-hidden border border-slate-100 p-1">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className={`h-full rounded-full ${progress === 100 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600'}`}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-xs font-semibold text-slate-400 uppercase">Progression</span>
                                            <span className="text-xs font-semibold text-indigo-600 uppercase">{child.stars} / {goal.target} ⭐</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ))}
                    {childrenContext.every(c => !c.reward_goals?.length) && (
                        <div className="col-span-full p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-wide">Aucun objectif actif. Ajoutez-en un dans la gestion des enfants !</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
