import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Star, CheckCircle2, Clock, Sparkles, BookOpen, Home, Trophy, Swords } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ParentalMission } from '../types/app';
import AppButton from './ui/AppButton';
import confetti from 'canvas-confetti';

interface ParentalMissionsProps {
    onEarnPoints: (amount: number, activityType: string, subject?: string) => void;
}

export default function ParentalMissions({ onEarnPoints }: ParentalMissionsProps) {
    const { selectedChild, refreshChildren } = useAuth();
    const [activeTab, setActiveTab] = useState<'missions' | 'rewards'>('missions');
    const [completingId, setCompletingId] = useState<string | null>(null);

    if (!selectedChild) {
        return null;
    }

    const missions = (selectedChild.missions || []) as ParentalMission[];
    const goals = (selectedChild.reward_goals || []) as any[];

    // Mock missions for demonstration if none exist
    const displayMissions = missions.length > 0 ? missions : [
        { id: 'm1', label: 'Ranger ma chambre', reward: 10, icon: '🏠', category: 'home', status: 'pending' },
        { id: 'm2', label: 'Lire 15 minutes', reward: 15, icon: '📚', category: 'education', status: 'pending' },
        { id: 'm3', label: 'Faire mes devoirs de maths', reward: 20, icon: '🔢', category: 'education', status: 'pending' }
    ] as ParentalMission[];

    const handleCompleteMission = async (mission: ParentalMission) => {
        setCompletingId(mission.id);

        // Simuler l'effet confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#ec4899', '#f59e0b']
        });

        // Logique de mise à jour (ici on simule si pas de DB réelle, mais on prépare le code)
        try {
            const updatedMissions = displayMissions.map(m =>
                m.id === mission.id ? { ...m, status: 'completed' as const, completed_at: new Date().toISOString() } : m
            );

            const { error } = await supabase
                .from('children')
                .update({
                    missions: updatedMissions
                })
                .eq('id', selectedChild.id);

            if (!error) {
                await refreshChildren();
            }
        } catch (err) {
            console.error('Erreur mission:', err);
        } finally {
            setCompletingId(null);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-pink-100 rounded-2xl">
                        <Gift className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Missions & Cadeaux</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tes objectifs secrets</p>
                    </div>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('missions')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'missions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🎯 Missions
                    </button>
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'rewards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🎁 Cadeaux
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'missions' ? (
                    <motion.div
                        key="missions-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        {displayMissions.filter(m => m.status !== 'verified').map((mission) => (
                            <motion.div
                                key={mission.id}
                                whileHover={{ y: -5 }}
                                className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden group transition-all ${mission.status === 'completed' ? 'opacity-75 grayscale-[0.5]' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border-2 border-white ${mission.category === 'education' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                        {mission.icon || '🎯'}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-black text-amber-700">+{mission.reward}</span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-sm font-black text-slate-900 leading-tight mb-4">{mission.label}</h3>

                                {mission.status === 'pending' ? (
                                    <AppButton
                                        className="w-full text-[10px] font-black uppercase tracking-widest rounded-xl"
                                        onClick={() => handleCompleteMission(mission)}
                                        loading={completingId === mission.id}
                                    >
                                        Marquer comme fini
                                    </AppButton>
                                ) : mission.status === 'completed' ? (
                                    <div className="flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase border border-amber-100 animate-pulse">
                                        <Clock className="h-4 w-4" />
                                        En attente des parents
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Validé ! (+{mission.reward} ⭐)
                                    </div>
                                )}

                                <div className="absolute -bottom-2 -right-2 opacity-5">
                                    {mission.category === 'education' ? <BookOpen className="w-16 h-16" /> : <Home className="w-16 h-16" />}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="rewards-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {goals.length === 0 ? (
                            <div className="col-span-full p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                <Gift className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-bold uppercase text-xs">Pas encore de cadeaux prévus ?</p>
                                <p className="text-slate-400 text-[10px] mt-1">Demande à tes parents d'ajouter un objectif !</p>
                            </div>
                        ) : (
                            goals.map((goal) => {
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
                                                <h3 className="text-base font-black text-slate-900 leading-tight tracking-tight">{goal.label}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    Objectif : <span className="text-indigo-600 font-black">{goal.target} ⭐</span>
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
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
