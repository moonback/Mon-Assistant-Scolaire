import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Trophy, Target, TrendingUp, Users, Plus, Trash2 } from 'lucide-react';
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

export default function SiblingCompetition() {
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
    }, [selectedChild]);

    const fetchMyCompetitions = async () => {
        if (!selectedChild) return;
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .or(`challenger_id.eq.${selectedChild.id},opponent_id.eq.${selectedChild.id}`)
            .neq('status', 'completed');

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

    const getOpponentName = (comp: Competition) => {
        const id = comp.challenger_id === selectedChild?.id ? comp.opponent_id : comp.challenger_id;
        return children.find(c => c.id === id)?.name || 'Frère/Sœur';
    };

    const otherSiblings = children.filter(c => c.id !== selectedChild?.id);

    if (otherSiblings.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Swords className="h-6 w-6 text-indigo-600" /> Duels de Famille
                </h3>
                <button
                    onClick={() => setShowDuelModal(true)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
                >
                    <Plus className="h-4 w-4" /> Défier un frère
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitions.length > 0 ? (
                    competitions.map(comp => {
                        const isIncoming = comp.opponent_id === selectedChild?.id && comp.status === 'pending_acceptance';

                        return (
                            <motion.div
                                key={comp.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-5 rounded-[2rem] border-2 flex items-center justify-between group transition-all ${comp.status === 'pending_approval' || comp.status === 'pending_acceptance'
                                        ? 'bg-slate-50 border-slate-100'
                                        : 'bg-white border-indigo-100 shadow-xl shadow-indigo-100/20'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${comp.status === 'active' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                        {comp.status === 'active' ? '⚔️' : isIncoming ? '🔔' : '⏳'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">Duel contre {getOpponentName(comp)}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {comp.status === 'pending_approval' ? 'En attente des parents' :
                                                comp.status === 'pending_acceptance' && !isIncoming ? 'Attente réponse frère/sœur' :
                                                    isIncoming ? 'Nouveau défi reçu !' :
                                                        `${comp.subject} • ${comp.activity_type.replace('_', ' ')}`}
                                        </p>
                                    </div>
                                </div>
                                {comp.status === 'active' && (
                                    <div className="animate-pulse">
                                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                                    </div>
                                )}
                                {isIncoming && (
                                    <button
                                        onClick={() => acceptDuel(comp.id)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-indigo-100 transition-all active:scale-95"
                                    >
                                        Accepter
                                    </button>
                                )}
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aucun duel actif</p>
                        <p className="text-[10px] text-slate-400 mt-1">Défie tes frères et sœurs pour gagner plus d'étoiles !</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showDuelModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowDuelModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 w-full max-w-md relative z-10 shadow-2xl"
                        >
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <Swords className="h-6 w-6 text-indigo-600" /> Nouveau Défi
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Choisir un frère ou une sœur</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {otherSiblings.map(sib => (
                                            <button
                                                key={sib.id}
                                                onClick={() => setOpponentId(sib.id)}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${opponentId === sib.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm overflow-hidden p-1">
                                                    <img src={sib.avatar_url} alt={sib.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-800">{sib.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quelle matière ?</label>
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 outline-none focus:border-indigo-500"
                                    >
                                        <option value="Mathématiques">Mathématiques 🔢</option>
                                        <option value="Français">Français ✍️</option>
                                        <option value="Sciences">Sciences 🧪</option>
                                        <option value="Général">Culture Générale 🌍</option>
                                    </select>
                                </div>

                                <button
                                    onClick={proposeDuel}
                                    disabled={!opponentId}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-xl shadow-lg shadow-indigo-200 transition-all"
                                >
                                    Envoyer le défi ! 🏹
                                </button>
                                <p className="text-center text-[10px] font-bold text-slate-400 uppercase">
                                    Tes parents recevront une notification pour valider.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
