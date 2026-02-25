import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Gift, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface StarMarketProps {
    childId: string;
}

export default function StarMarket({ childId }: StarMarketProps) {
    const { children, refreshChildren } = useAuth();
    const child = children.find(c => c.id === childId);

    const [buyingId, setBuyingId] = useState<number | null>(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    if (!child) return null;

    const availableGoals = child.reward_goals?.filter(g => !g.claimed) || [];
    const claimedGoals = child.reward_goals?.filter(g => g.claimed) || [];

    const handleClaim = async (goal: any) => {
        if (child.stars < goal.target) {
            setErrorMsg("Tu n'as pas assez d'étoiles pour cette récompense !");
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }

        setBuyingId(goal.id);
        setErrorMsg('');

        try {
            // Deduct stars
            await supabase.rpc('increment_child_stars', { child_id: child.id, count: -goal.target });

            // Mark goal as claimed
            const updatedGoals = child.reward_goals?.map(g =>
                g.id === goal.id ? { ...g, claimed: true, claimed_at: new Date().toISOString() } : g
            ) || [];

            await supabase.from('children').update({ reward_goals: updatedGoals }).eq('id', child.id);

            setSuccessMsg(`Bravo ! Tu as débloqué : ${goal.label} ! 🎉`);
            setTimeout(() => setSuccessMsg(''), 5000);
            await refreshChildren();
        } catch (err: any) {
            console.error(err);
            setErrorMsg("Oups, une erreur est survenue !");
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setBuyingId(null);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-600 font-bold tracking-wider uppercase text-[10px]">
                        <Trophy className="w-3.5 h-3.5" />
                        La Boutique aux Étoiles
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Échange tes <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">récompenses</span>
                    </h1>
                    <p className="text-slate-500 font-semibold text-sm">Découvre ce que tes parents ont préparé pour toi !</p>
                </div>

                <div className="bg-white px-5 py-3 rounded-[2rem] border-2 border-yellow-100 shadow-xl shadow-yellow-100/50 flex flex-col items-center shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mon Solde</span>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-yellow-500">{child.stars}</span>
                        <span className="text-2xl">⭐</span>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mx-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-600 px-6 py-4 rounded-2xl font-bold flex items-center justify-between gap-4 shadow-xl shadow-emerald-100/50">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                            {successMsg}
                        </div>
                    </motion.div>
                )}
                {errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mx-4 bg-red-50 border-2 border-red-100 text-red-600 px-6 py-4 rounded-2xl font-bold flex items-center justify-between gap-4 shadow-xl shadow-red-100/50">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6" />
                            {errorMsg}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-4 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableGoals.map((goal, idx) => {
                        const canAfford = child.stars >= goal.target;
                        const progress = Math.min(100, Math.round((child.stars / goal.target) * 100));

                        return (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative bg-white rounded-[3rem] p-8 border-4 transition-all overflow-hidden ${canAfford
                                    ? 'border-yellow-200 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-200/50 shadow-lg shadow-slate-100'
                                    : 'border-slate-100 shadow-sm opacity-90'
                                    }`}
                            >
                                {canAfford && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full -mr-16 -mt-16 blur-2xl opacity-50 pointer-events-none" />
                                )}

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="text-5xl text-center mb-6">
                                        {goal.icon || '🎁'}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 text-center mb-6 leading-tight flex-1">
                                        {goal.label}
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coût</span>
                                            <span className={`text-base font-black ${canAfford ? 'text-yellow-600' : 'text-slate-500'}`}>
                                                {goal.target} ⭐
                                            </span>
                                        </div>

                                        {!canAfford && (
                                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        )}

                                        <button
                                            disabled={!canAfford || buyingId === goal.id}
                                            onClick={() => handleClaim(goal)}
                                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all
                                                ${canAfford
                                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-xl shadow-yellow-200 hover:-translate-y-1 active:scale-95'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {buyingId === goal.id
                                                ? 'Déblocage...'
                                                : canAfford
                                                    ? 'Débloquer !'
                                                    : `Manque ${goal.target - child.stars} ⭐`
                                            }
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {availableGoals.length === 0 && (
                    <div className="bg-white p-12 rounded-[3rem] border-4 border-dashed border-slate-200 text-center flex flex-col items-center">
                        <Gift className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-2xl font-black text-slate-700 mb-2">Boutique vide !</h3>
                        <p className="text-slate-500 font-medium">Demande à tes parents d'ajouter de nouvelles récompenses. ✨</p>
                    </div>
                )}

                {/* Claimed History */}
                {claimedGoals.length > 0 && (
                    <div className="pt-10 border-t border-slate-100">
                        <h4 className="flex items-center gap-3 text-base font-black text-slate-800 tracking-tight mb-6 px-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            Mes Trésors Obtenus
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                            {claimedGoals.map((goal, idx) => (
                                <div key={goal.id} className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 flex flex-col items-center text-center group hover:bg-white hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-50 transition-all">
                                    <span className="text-3xl mb-3 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all group-hover:scale-110 duration-300">{goal.icon || '🎁'}</span>
                                    <p className="font-bold text-slate-600 text-xs leading-tight flex-1">{goal.label}</p>
                                    {goal.claimed_at && (
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-4">
                                            {new Date(goal.claimed_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
