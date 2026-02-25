import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Gift, Sparkles, CheckCircle2, AlertCircle, Star } from 'lucide-react';
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
                    <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px]">
                        <Trophy className="w-3.5 h-3.5" />
                        Boutique Magique
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Échange tes <span className="text-gradient">récompenses</span> ✨
                    </h1>
                    <p className="text-slate-500 font-semibold text-sm">Récompense tes efforts avec tes étoiles !</p>
                </div>

                <div className="glass-card px-6 py-3 rounded-[2rem] border-none flex flex-col items-center shrink-0 shadow-lg shadow-indigo-100/50">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Mon Solde</span>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-slate-900">{child.stars}</span>
                        <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
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
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`premium-card p-8 border-none shadow-sm overflow-hidden relative group ${!canAfford && 'opacity-80'}`}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="text-4xl text-center mb-6 drop-shadow-sm group-hover:scale-110 transition-transform duration-500">
                                        {goal.icon || '🎁'}
                                    </div>
                                    <h3 className="text-base font-black text-slate-900 text-center mb-6 leading-tight flex-1 tracking-tight px-2">
                                        {goal.label}
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coût magique</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-base font-black ${canAfford ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                    {goal.target}
                                                </span>
                                                <Star className={`w-4 h-4 ${canAfford ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                            </div>
                                        </div>

                                        {!canAfford && (
                                            <div className="space-y-1.5">
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">{progress}% accompli</p>
                                            </div>
                                        )}

                                        <button
                                            disabled={!canAfford || buyingId === goal.id}
                                            onClick={() => handleClaim(goal)}
                                            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg
                                                ${canAfford
                                                    ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95'
                                                    : 'bg-slate-50 text-slate-400 shadow-none border border-slate-100 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {buyingId === goal.id
                                                ? 'Magie...'
                                                : canAfford
                                                    ? 'Débloquer !'
                                                    : `Encore ${goal.target - child.stars} ⭐`
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
                        <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Boutique vide !</h2>
                        <p className="text-slate-500 font-medium">Demande à tes parents d'ajouter de nouvelles récompenses. ✨</p>
                    </div>
                )}

                {/* Claimed History */}
                {claimedGoals.length > 0 && (
                    <div className="pt-10 border-t border-slate-100">
                        <header className="mb-6 px-4">
                            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                Mes Trésors Obtenus
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">L'étagère de tes victoires</p>
                        </header>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                            {claimedGoals.map((goal, idx) => (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-slate-50 border-2 border-white rounded-[2rem] p-6 flex flex-col items-center text-center group hover:bg-white hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-50/30 transition-all duration-500 shadow-inner"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100">
                                        {goal.icon || '🎁'}
                                    </div>
                                    <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-tight leading-tight flex-1 mb-3">{goal.label}</h3>
                                    {goal.claimed_at && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full">
                                            <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                                            <p className="text-[9px] uppercase font-black tracking-widest text-emerald-600">
                                                {new Date(goal.claimed_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
