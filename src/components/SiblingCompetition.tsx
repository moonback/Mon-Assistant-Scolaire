import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Trophy, Target, TrendingUp, Users, Plus, Trash2, ArrowRight, Sparkles, ShieldCheck, Flame, Clock } from 'lucide-react';
import { supabase, Child } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Competition {
    id: string;
    challenger_id: string;
    opponent_id: string;
    subject: string;
    activity_type: string;
    goal_value: number;
    status: 'pending_acceptance' | 'pending_approval' | 'active' | 'completed' | 'canceled';
    winner_id: string | null;
}

interface SiblingCompetitionProps {
    standalone?: boolean;
}

export default function SiblingCompetition({ standalone = false }: SiblingCompetitionProps) {
    const { selectedChild, children } = useAuth();
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDuelModal, setShowDuelModal] = useState(false);

    // Duel form
    const [opponentId, setOpponentId] = useState('');
    const [subject, setSubject] = useState('Général');
    const [type, setType] = useState('quiz_score');

    useEffect(() => {
        if (selectedChild) {
            fetchMyCompetitions();
        }

        const handleOpenModal = () => setShowDuelModal(true);
        window.addEventListener('open-duel-modal', handleOpenModal);
        return () => window.removeEventListener('open-duel-modal', handleOpenModal);
    }, [selectedChild]);

    const fetchMyCompetitions = async () => {
        if (!selectedChild) return;
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .or(`challenger_id.eq.${selectedChild.id},opponent_id.eq.${selectedChild.id}`)
            .in('status', ['active', 'pending_acceptance', 'pending_approval']);

        if (!error && data) setCompetitions(data);
        setLoading(false);
    };

    const proposeDuel = async () => {
        if (!selectedChild || !opponentId) return;

        const { error } = await supabase
            .from('competitions')
            .insert({
                challenger_id: selectedChild.id,
                opponent_id: opponentId,
                subject,
                activity_type: type,
                status: 'pending_acceptance',
                parent_id: selectedChild.parent_id
            });

        if (!error) {
            setShowDuelModal(false);
            fetchMyCompetitions();
        }
    };

    const acceptDuel = async (id: string) => {
        const { error } = await supabase
            .from('competitions')
            .update({ status: 'pending_approval' })
            .eq('id', id);

        if (!error) fetchMyCompetitions();
    };

    const getChildAvatar = (id: string) => {
        return children.find(c => c.id === id)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;
    };

    const getChildName = (id: string) => {
        return children.find(c => c.id === id)?.name || '...';
    };

    const otherSiblings = children.filter(c => c.id !== selectedChild?.id);

    if (otherSiblings.length === 0) return null;

    const hasActiveCompetitions = competitions.length > 0;

    return (
        <>
            {hasActiveCompetitions && (
                <section className="space-y-6">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <Swords className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    Duels de Famille
                                </h2>
                            </div>
                            <p className="text-slate-500 font-bold text-sm ml-11">
                                Qui sera le prochain champion ? ✨
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDuelModal(true)}
                            className="relative group p-[2px] rounded-2xl overflow-hidden shadow-lg shadow-indigo-100/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x" />
                            <div className="relative bg-white font-black text-[10px] uppercase tracking-[0.2em] px-6 py-3 rounded-[14px] flex items-center gap-2 group-hover:bg-transparent group-hover:text-white transition-all">
                                <Plus className="h-4 w-4" /> Nouveau Duel
                            </div>
                        </motion.button>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {competitions.map((comp) => {
                                const isIncoming = comp.opponent_id === selectedChild?.id && comp.status === 'pending_acceptance';
                                const isActive = comp.status === 'active';
                                const isPendingApproval = comp.status === 'pending_approval';
                                const isWaitingForOpponent = comp.status === 'pending_acceptance' && !isIncoming;

                                return (
                                    <motion.div
                                        key={comp.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        whileHover={{ y: -5 }}
                                        className={`group relative p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all ${isActive ? 'ring-2 ring-indigo-500/20' : ''}`}
                                    >
                                        {/* Decorative elements */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {isActive && (
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                                        )}

                                        <div className="flex items-center justify-between gap-4 mb-8">
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className="flex -space-x-4 items-center">
                                                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center p-1">
                                                        <img src={getChildAvatar(comp.challenger_id)} alt="Challenger" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="relative z-0 w-16 h-16 rounded-2xl bg-indigo-50 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center p-1">
                                                        <img src={getChildAvatar(comp.opponent_id)} alt="Opponent" className="w-full h-full object-cover" />
                                                        {!isActive && <div className="absolute inset-0 bg-slate-200/40 backdrop-blur-[2px] flex items-center justify-center">
                                                            <span className="text-xl">⏳</span>
                                                        </div>}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                                            {getChildName(comp.challenger_id)} vs {getChildName(comp.opponent_id)}
                                                        </h3>
                                                        {isActive && (
                                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-100">
                                                                <Flame className="h-3 w-3 fill-rose-600" /> Action
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                        {comp.subject} • {comp.activity_type.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-2xl group-hover:rotate-12 transition-transform">
                                                {isActive ? '⚡' : '🤝'}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut du duel</p>
                                                <div className="flex items-center gap-2">
                                                    {isPendingApproval ? (
                                                        <span className="flex items-center gap-1.5 text-amber-600 font-bold text-xs bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                                                            <ShieldCheck className="h-4 w-4" /> Validation des parents
                                                        </span>
                                                    ) : isIncoming ? (
                                                        <span className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                                                            <ArrowRight className="h-4 w-4" /> Prêt à relever le défi ?
                                                        </span>
                                                    ) : isWaitingForOpponent ? (
                                                        <span className="flex items-center gap-1.5 text-slate-500 font-bold text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                            <Clock className="h-4 w-4" /> En attente de réponse
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 animate-pulse">
                                                            <Trophy className="h-4 w-4" /> Combat féroce !
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {isIncoming && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => acceptDuel(comp.id)}
                                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200"
                                                >
                                                    J'ACCEPTE !
                                                </motion.button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </section>
            )}

            <AnimatePresence>
                {showDuelModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setShowDuelModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] w-full max-w-xl relative z-10 shadow-3xl overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="bg-slate-50 p-10 border-b border-slate-100 relative">
                                <div className="absolute top-0 right-0 p-8 scale-150 opacity-10 rotate-12">
                                    <Swords className="w-16 h-16" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                    Lancer un Duel ⚔️
                                </h3>
                                <p className="text-slate-500 font-bold mt-2">Défie tes frères et sœurs pour la gloire !</p>
                            </div>

                            <div className="p-10 space-y-8">
                                {/* Opponent Selection */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Choisis ton adversaire</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {otherSiblings.map(sib => (
                                            <button
                                                key={sib.id}
                                                onClick={() => setOpponentId(sib.id)}
                                                className={`group relative p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${opponentId === sib.id ? 'border-indigo-600 bg-indigo-50 transform -translate-y-1' : 'border-slate-100 hover:border-indigo-200'}`}
                                            >
                                                <div className={`w-20 h-20 rounded-2xl bg-white shadow-lg overflow-hidden p-1.5 border-4 transition-all ${opponentId === sib.id ? 'border-indigo-100' : 'border-white'}`}>
                                                    <img src={sib.avatar_url} alt={sib.name} className="w-full h-full object-cover rounded-xl" />
                                                </div>
                                                <span className={`text-sm font-black transition-colors ${opponentId === sib.id ? 'text-indigo-600' : 'text-slate-600'}`}>{sib.name}</span>

                                                {opponentId === sib.id && (
                                                    <motion.div
                                                        layoutId="check-sib"
                                                        className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white"
                                                    >
                                                        <Sparkles className="w-4 h-4" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Domaine de Combat</label>
                                        <div className="relative group">
                                            <select
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className="w-full p-4 pl-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                            >
                                                {(selectedChild?.allowed_subjects?.length
                                                    ? selectedChild.allowed_subjects
                                                    : ['Mathématiques', 'Français', 'Sciences', 'Histoire', 'Géographie', 'Anglais', 'Code', 'Général']
                                                ).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                ▼
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Type d'Épreuve</label>
                                        <div className="relative group">
                                            <select
                                                value={type}
                                                onChange={(e) => setType(e.target.value)}
                                                className="w-full p-4 pl-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="quiz_score">🎯 Meilleur Score Quiz</option>
                                                <option value="stars_earned">⭐ Plus d'Étoiles</option>
                                                <option value="activities_completed">🏆 Plus d'Activités</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                ▼
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={proposeDuel}
                                    disabled={!opponentId}
                                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-4"
                                >
                                    LANCER LE DEFI ! 🔥
                                </motion.button>

                                <div className="flex items-center gap-3 justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 py-4 rounded-2xl border border-slate-100">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Validation parentale automatique activée
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
