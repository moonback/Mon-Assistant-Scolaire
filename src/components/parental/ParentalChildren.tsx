import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, User, Trash2, Edit2, X, Moon } from 'lucide-react';
import { supabase, Child } from '../../lib/supabase';

interface ParentalChildrenProps {
    childrenContext: Child[];
    dailyStats: any[];
    refreshChildren: () => Promise<void>;
    session: any;
    setError: (e: string) => void;
    setSuccess: (s: string) => void;
}

export default function ParentalChildren({
    childrenContext,
    dailyStats,
    refreshChildren,
    session,
    setError,
    setSuccess
}: ParentalChildrenProps) {
    const [showAddChild, setShowAddChild] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [childName, setChildName] = useState('');
    const [childGrade, setChildGrade] = useState('CP');
    const [childTimeLimit, setChildTimeLimit] = useState(30);
    const [childBedtime, setChildBedtime] = useState('20:00');
    const [childBlockedTopics, setChildBlockedTopics] = useState<string[]>([]);
    const [childWeakPoints, setChildWeakPoints] = useState<string[]>([]);
    const [rewardGoals, setRewardGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const saveChild = async () => {
        if (!session) return;
        setLoading(true);
        setError('');
        try {
            const payload: any = {
                name: childName,
                grade_level: childGrade,
                daily_time_limit: childTimeLimit,
                bedtime: childBedtime,
                reward_goals: rewardGoals,
                blocked_topics: childBlockedTopics,
                weak_points: childWeakPoints,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${childName}`
            };

            let result;
            if (editingChild) {
                result = await supabase.from('children').update(payload).eq('id', editingChild.id);
            } else {
                payload.parent_id = session.user.id;
                payload.stars = 0;
                result = await supabase.from('children').insert([payload]);
            }

            if (result.error) {
                console.error('Supabase Error:', result.error);
                throw new Error(result.error.message);
            }

            setSuccess('Modifications enregistrées ! ✨');
            await refreshChildren();
            resetChildForm();
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
        } finally {
            setLoading(false);
        }
    };

    const deleteChild = async (id: string) => {
        if (!window.confirm('Supprimer ce profil ?')) return;
        setLoading(true);
        setError('');
        try {
            const { error: err } = await supabase.from('children').delete().eq('id', id);
            if (err) throw err;
            await refreshChildren();
            setSuccess('Profil supprimé ! 👋');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Impossible de supprimer ce profil.');
        } finally {
            setLoading(false);
        }
    };

    const resetChildForm = () => {
        setShowAddChild(false);
        setEditingChild(null);
        setChildName('');
        setChildGrade('CP');
        setChildTimeLimit(30);
        setChildBedtime('20:00');
        setChildBlockedTopics([]);
        setChildWeakPoints([]);
        setRewardGoals([]);
    };

    const openEditChild = (child: Child) => {
        setEditingChild(child);
        setChildName(child.name);
        setChildGrade(child.grade_level);
        setChildTimeLimit(child.daily_time_limit);
        setChildBedtime(child.bedtime || '20:00');
        setChildBlockedTopics(child.blocked_topics || []);
        setChildWeakPoints(child.weak_points || []);
        setRewardGoals(child.reward_goals || []);
        setShowAddChild(true);
    };

    const toggleTopic = (topic: string) => {
        setChildBlockedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    const addRewardGoal = () => {
        setRewardGoals([...rewardGoals, { id: Date.now(), label: '', target: 100, icon: '🎁' }]);
    };

    const updateRewardGoal = (id: number, field: string, value: any) => {
        setRewardGoals(rewardGoals.map(g => g.id === id ? { ...g, [field]: value } : g));
    };

    const removeRewardGoal = (id: number) => {
        setRewardGoals(rewardGoals.filter(g => g.id !== id));
    };

    return (
        <div className="space-y-8 ">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-800">Gestion des Profils</h2>
                <button onClick={() => setShowAddChild(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-sm  transition-all">
                    <Plus className="w-5 h-5" /> Ajouter un enfant
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {childrenContext.map(child => (
                    <div key={child.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group relative">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm group-hover:rotate-3 transition-transform">
                                {child.avatar_url ? (
                                    <img src={child.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : <User className="w-8 h-8 text-indigo-300" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-slate-800">{child.name}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider">{child.grade_level}</span>
                                    <span className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider">{child.stars} ⭐</span>
                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider">{child.daily_time_limit} MIN</span>
                                    {child.bedtime && (
                                        <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider">🌙 {child.bedtime}</span>
                                    )}
                                    {/* Time Spent (Conso) Sync */}
                                    {(() => {
                                        const spent = dailyStats.find(s => s.child_id === child.id)?.time_spent_minutes || 0;
                                        return (
                                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider">
                                                Utilisé: {spent}m
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => openEditChild(child)} className="flex-1 p-4 bg-slate-50 text-slate-600 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                                <Edit2 className="w-4 h-4" /> Configurer
                            </button>
                            <button onClick={() => deleteChild(child.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Child Modal */}
            <AnimatePresence>
                {showAddChild && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetChildForm} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-2xl p-10 w-full max-w-2xl relative z-10 shadow-sm overflow-y-auto max-h-[90vh]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-semibold text-slate-800">{editingChild ? 'Modifier le Profil' : 'Ajouter un Enfant'}</h3>
                                <button onClick={resetChildForm} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Prénom</label>
                                        <input value={childName} onChange={e => setChildName(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all font-bold" placeholder="Léo" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Classe</label>
                                        <select value={childGrade} onChange={e => setChildGrade(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all font-bold appearance-none">
                                            {['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Limite de temps</label>
                                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-semibold text-sm">{childTimeLimit} min</span>
                                        </div>
                                        <input type="range" min="15" max="180" step="15" value={childTimeLimit} onChange={e => setChildTimeLimit(Number(e.target.value))} className="w-full accent-indigo-600" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Heure du coucher</label>
                                            <Moon className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <input
                                            type="time"
                                            value={childBedtime}
                                            onChange={e => setChildBedtime(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Objectifs de Récompense</label>
                                        <button type="button" onClick={addRewardGoal} className="text-indigo-600 font-semibold text-xs uppercase tracking-wide flex items-center gap-1 hover:underline">
                                            <Plus className="w-3 h-3" /> Ajouter
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {rewardGoals.map(goal => (
                                            <div key={goal.id} className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <input
                                                    value={goal.icon}
                                                    onChange={e => updateRewardGoal(goal.id, 'icon', e.target.value)}
                                                    className="w-10 bg-white p-2 rounded-xl text-center border border-slate-200"
                                                    placeholder="🎁"
                                                />
                                                <input
                                                    value={goal.label}
                                                    onChange={e => updateRewardGoal(goal.id, 'label', e.target.value)}
                                                    placeholder="Cadeau secret..."
                                                    className="flex-1 bg-white p-2 rounded-xl border border-slate-200 text-xs font-bold"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={goal.target}
                                                        onChange={e => updateRewardGoal(goal.id, 'target', parseInt(e.target.value))}
                                                        className="w-16 bg-white p-2 rounded-xl text-center border border-slate-200 text-xs font-semibold"
                                                    />
                                                    <span className="text-xs font-semibold text-slate-400">⭐</span>
                                                </div>
                                                <button onClick={() => removeRewardGoal(goal.id)} className="p-2 text-red-300 hover:text-red-500 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {rewardGoals.length === 0 && (
                                            <p className="text-center py-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-400 uppercase tracking-wide">Aucun objectif défini</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Applications autorisées</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'assistant', label: 'IA' }, { id: 'quiz', label: 'Quiz' },
                                            { id: 'math', label: 'Calcul' }, { id: 'drawing', label: 'Atelier' },
                                            { id: 'homework', label: 'Aide Photo' }, { id: 'story', label: 'Contes' },
                                            { id: 'dictionary', label: 'Dico' }, { id: 'fact', label: 'Curiosité' }
                                        ].map(feature => (
                                            <button
                                                key={feature.id}
                                                type="button"
                                                onClick={() => toggleTopic(feature.id)}
                                                className={`px-4 py-3 rounded-2xl text-xs font-semibold border-2 transition-all flex items-center justify-between ${!childBlockedTopics.includes(feature.id) ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}
                                            >
                                                <span>{feature.label}</span>
                                                <div className={`w-2 h-2 rounded-full ${!childBlockedTopics.includes(feature.id) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 border-t border-slate-100 pt-8">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Points faibles de l'enfant (Identifiés par l'IA)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {childWeakPoints.map(wp => (
                                            <span key={wp} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-2 border border-red-100">
                                                {wp}
                                                <button type="button" onClick={() => setChildWeakPoints(prev => prev.filter(p => p !== wp))} className="hover:text-red-800 p-0.5 rounded-full hover:bg-red-100 transition-colors"><X className="w-3 h-3" /></button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            placeholder="Ajouter une notion (ex: Tables de 7)..."
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const val = e.currentTarget.value.trim();
                                                    if (val && !childWeakPoints.includes(val)) {
                                                        setChildWeakPoints(prev => [...prev, val]);
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                            className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 font-semibold"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">L'IA adaptera sa pédagogie pour faire travailler ces notions en priorité.</p>
                                </div>

                                <button onClick={saveChild} disabled={loading || !childName} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-semibold text-xl shadow-sm  active:scale-95 transition-all mt-8">
                                    {loading ? 'Enregistrement...' : 'Sauvegarder le Profil'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
