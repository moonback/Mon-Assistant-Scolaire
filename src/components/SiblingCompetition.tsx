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

    const getOpponentName = (comp: Competition) => {
        const id = comp.challenger_id === selectedChild?.id ? comp.opponent_id : comp.challenger_id;
        return children.find(c => c.id === id)?.name || 'Frère/Sœur';
    };

    const otherSiblings = children.filter(c => c.id !== selectedChild?.id);

    if (otherSiblings.length === 0) return null;

    return (
        <section className="space-y-4">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 mb-2">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Swords className="h-5 w-5 text-indigo-600" /> Duels de Famille
                    </h2>
                    <p className="text-slate-500 font-semibold text-sm">Défie tes frères et sœurs pour gagner plus d'étoiles !</p>
                </div>
                <button
                    onClick={() => setShowDuelModal(true)}
                    className="group relative inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:-translate-y-0.5"
                >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Nouveau Duel
                    </span>
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitions.length > 0 ? (
                    competitions.map(comp => {
                        const isIncoming = comp.opponent_id === selectedChild?.id && comp.status === 'pending_acceptance';
                        const isActive = comp.status === 'active';

                        return (
                            <motion.div
                                key={comp.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`premium-card p-6 border-none shadow-sm flex items-center justify-between group transition-all relative overflow-hidden ${isActive ? 'ring-2 ring-indigo-500/20' : 'opacity-80'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                                )}
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border-4 border-white transform transition-transform group-hover:rotate-6 group-hover:scale-110 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                        {isActive ? '⚔️' : isIncoming ? '🔔' : '⏳'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black text-slate-900">Contre {getOpponentName(comp)}</h3>
                                            {isActive && (
                                                <span className="px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white uppercase tracking-widest rounded-full">En cours</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            {comp.status === 'pending_approval' ? '⏳ Validation parentale...' :
                                                comp.status === 'pending_acceptance' && !isIncoming ? '🕰️ En attente du frère/sœur' :
                                                    isIncoming ? '✨ Nouveau défi reçu !' :
                                                        `${comp.subject} • ${comp.activity_type.replace('_', ' ')}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    {isActive && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="p-2 bg-indigo-50 rounded-xl"
                                        >
                                            <TrendingUp className="h-4 w-4 text-indigo-600" />
                                        </motion.div>
                                    )}
                                    {isIncoming && (
                                        <button
                                            onClick={() => acceptDuel(comp.id)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                        >
                                            Accepter
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 text-center premium-card border-none bg-slate-50/50 shadow-inner flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl mb-4 grayscale opacity-50">
                            🎭
                        </div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Aucun duel actif</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Défie tes frères et sœurs dès maintenant !</p>
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
                                        {(selectedChild?.allowed_subjects?.length
                                            ? selectedChild.allowed_subjects
                                            : ['Mathématiques', 'Français', 'Sciences', 'Histoire', 'Géographie', 'Anglais', 'Code', 'Général']
                                        ).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
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
