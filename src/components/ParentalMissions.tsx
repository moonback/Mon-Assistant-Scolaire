import React from 'react';
import { motion } from 'motion/react';
import { Gift, Star, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ParentalMissions() {
    const { selectedChild } = useAuth();

    if (!selectedChild || !selectedChild.reward_goals || selectedChild.reward_goals.length === 0) {
        return null;
    }

    const goals = selectedChild.reward_goals as any[];

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Gift className="h-6 w-6 text-pink-500" /> Missions des Parents
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tes objectifs secrets</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => {
                    const progress = Math.min((selectedChild.stars || 0) / goal.target * 100, 100);
                    const isCompleted = (selectedChild.stars || 0) >= goal.target;

                    return (
                        <motion.div
                            key={goal.id}
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 relative overflow-hidden group"
                        >
                            <div className="flex items-center gap-5 mb-6">
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner border-4 border-white ${isCompleted ? 'bg-emerald-50' : 'bg-pink-50'}`}>
                                    {goal.icon || '🎁'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-slate-800 leading-tight">{goal.label}</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Objectif : <span className="text-indigo-600">{goal.target} ⭐</span>
                                    </p>
                                </div>
                                {isCompleted && (
                                    <div className="absolute top-4 right-4 animate-bounce">
                                        <Sparkles className="h-6 w-6 text-emerald-500" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-tighter">
                                    <span className={isCompleted ? 'text-emerald-600' : 'text-slate-400'}>
                                        {isCompleted ? 'Objectif Atteint !' : `${selectedChild.stars} / ${goal.target} étoiles`}
                                    </span>
                                    <span className="text-indigo-600">{Math.floor(progress)}%</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full p-0.5 border border-slate-50 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className={`h-full rounded-full ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-pink-400 to-indigo-500'}`}
                                    />
                                </div>
                            </div>

                            {isCompleted && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase text-center border border-emerald-100"
                                >
                                    Demande ta récompense aux parents ! 🎉
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
