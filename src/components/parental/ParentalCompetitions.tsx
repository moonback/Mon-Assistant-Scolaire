import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Trophy, Clock, CheckCircle, XCircle, Plus, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase, Child } from '../../lib/supabase';

interface Competition {
    id: string;
    challenger_id: string;
    opponent_id: string;
    subject: string;
    activity_type: string;
    goal_value: number;
    status: 'pending_approval' | 'active' | 'completed' | 'canceled';
    winner_id: string | null;
    created_at: string;
    expires_at: string;
}

interface ParentalCompetitionsProps {
    childrenContext: Child[];
}

export default function ParentalCompetitions({ childrenContext }: ParentalCompetitionsProps) {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [challenger, setChallenger] = useState('');
    const [opponent, setOpponent] = useState('');
    const [activityType, setActivityType] = useState('quiz_score');
    const [goalValue, setGoalValue] = useState(1);
    const [subject, setSubject] = useState('Général');

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setCompetitions(data);
        setLoading(false);
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('competitions')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) fetchCompetitions();
    };

    const createCompetition = async () => {
        if (!challenger || !opponent || challenger === opponent) return;

        const { error } = await supabase
            .from('competitions')
            .insert({
                challenger_id: challenger,
                opponent_id: opponent,
                activity_type: activityType,
                goal_value: goalValue,
                subject: subject,
                status: 'active', // Created by parent, so active immediately
                parent_id: (await supabase.auth.getUser()).data.user?.id
            });

        if (!error) {
            setShowCreateModal(false);
            fetchCompetitions();
        }
    };

    const getChildName = (id: string) => {
        return childrenContext.find(c => c.id === id)?.name || 'Inconnu';
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Swords className="h-7 w-7 text-indigo-600" /> Défis & Compétitions
                    </h2>
                    <p className="text-slate-500 font-medium">Gérez les duels amicaux entre vos enfants.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all"
                >
                    <Plus className="h-5 w-5" /> Nouveau Défi
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Competitions */}
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-500" /> Duels en cours
                    </h3>

                    <div className="space-y-4">
                        {competitions.filter(c => c.status === 'active').map(comp => (
                            <div key={comp.id} className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-center">
                                            <p className="font-black text-slate-800">{getChildName(comp.challenger_id)}</p>
                                        </div>
                                        <span className="text-xs font-black text-indigo-400 italic">VS</span>
                                        <div className="text-center">
                                            <p className="font-black text-slate-800">{getChildName(comp.opponent_id)}</p>
                                        </div>
                                    </div>
                                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black uppercase text-indigo-600 border border-indigo-100">
                                        {comp.activity_type.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Matière</p>
                                        <p className="text-sm font-black text-indigo-900">{comp.subject}</p>
                                    </div>
                                    <button
                                        onClick={() => handleStatusUpdate(comp.id, 'canceled')}
                                        className="text-[10px] font-black text-red-500 uppercase hover:underline"
                                    >
                                        Arrêter le duel
                                    </button>
                                </div>
                            </div>
                        ))}
                        {competitions.filter(c => c.status === 'active').length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-slate-400 font-bold italic">Aucun duel actif pour le moment.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* History & Pending */}
                <div className="space-y-6">
                    <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-500" /> En attente d'approbation
                        </h3>
                        <div className="space-y-3">
                            {competitions.filter(c => c.status === 'pending_approval').map(comp => (
                                <div key={comp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-sm font-bold text-slate-700">
                                        <span className="text-indigo-600">{getChildName(comp.challenger_id)}</span> défie <span className="text-indigo-600">{getChildName(comp.opponent_id)}</span>
                                        <p className="text-[10px] text-slate-400 uppercase mt-0.5">{comp.subject} • {comp.activity_type}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(comp.id, 'active')}
                                            className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                        >
                                            <CheckCircle className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(comp.id, 'canceled')}
                                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <XCircle className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {competitions.filter(c => c.status === 'pending_approval').length === 0 && (
                                <p className="text-center text-slate-400 text-sm font-medium italic">Pas de nouvelles demandes.</p>
                            )}
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-emerald-500" /> Historique des victoires
                        </h3>
                        <div className="space-y-3">
                            {competitions.filter(c => c.status === 'completed').slice(0, 5).map(comp => (
                                <div key={comp.id} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                    <div className="text-sm font-bold text-slate-700">
                                        🏆 <span className="text-emerald-700">{getChildName(comp.winner_id || '')}</span> a gagné !
                                        <p className="text-[10px] text-slate-400 uppercase mt-0.5">Contre {getChildName(comp.challenger_id === comp.winner_id ? comp.opponent_id : comp.challenger_id)}</p>
                                    </div>
                                    <div className="text-xs font-black text-emerald-600 bg-white px-2 py-1 rounded-lg">
                                        +50 ⭐
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Create Competition Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowCreateModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg relative z-10 shadow-2xl"
                        >
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <Swords className="h-6 w-6 text-indigo-600" /> Créer un Duel
                            </h3>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Le Challenger</label>
                                        <select
                                            value={challenger}
                                            onChange={(e) => setChallenger(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">Choisir...</option>
                                            {childrenContext.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">L'Adversaire</label>
                                        <select
                                            value={opponent}
                                            onChange={(e) => setOpponent(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">Choisir...</option>
                                            {childrenContext.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Type d'activité</label>
                                    <select
                                        value={activityType}
                                        onChange={(e) => setActivityType(e.target.value)}
                                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="quiz_score">Meilleur score au Quiz</option>
                                        <option value="stars_earned">Plus d'étoiles gagnées</option>
                                        <option value="time_studied">Plus de temps d'étude</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Matière</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <button
                                    onClick={createCompetition}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-lg shadow-indigo-200 transition-all mt-4"
                                >
                                    Lancer le Duel ! 🔥
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
