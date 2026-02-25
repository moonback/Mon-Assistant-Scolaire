import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShieldCheck, Lock, Clock, Ban,
    TrendingUp, Plus, User, Trash2, Edit2, X, Star,
    LayoutDashboard, Users, Gift, Settings as SettingsIcon,
    Moon, Zap, BookOpen, ChevronRight, Award, History
} from 'lucide-react';
import { supabase, Progress, Child } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

import { ParentalTab as Tab } from '../types/app';

interface ParentalSpaceProps {
    activeSubTab: Tab;
    setActiveSubTab: (tab: Tab) => void;
    onExit: () => void;
}

export default function ParentalSpace({ activeSubTab: activeTab, setActiveSubTab: setActiveTab, onExit }: ParentalSpaceProps) {
    const { profile, children, session, refreshProfile, refreshChildren } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Parental Settings
    const [newPin, setNewPin] = useState('');

    // Multi-child Management
    const [showAddChild, setShowAddChild] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [childName, setChildName] = useState('');
    const [childGrade, setChildGrade] = useState('CP');
    const [childTimeLimit, setChildTimeLimit] = useState(30);
    const [childBedtime, setChildBedtime] = useState('20:00');
    const [childBlockedTopics, setChildBlockedTopics] = useState<string[]>([]);
    const [childWeakPoints, setChildWeakPoints] = useState<string[]>([]);
    const [rewardGoals, setRewardGoals] = useState<any[]>([]);
    const [stats, setStats] = useState<Progress[]>([]);
    const [dailyStats, setDailyStats] = useState<any[]>([]);

    useEffect(() => {
        if (isAuthenticated && session) {
            fetchStats();
            fetchDailyStats();
        }
    }, [isAuthenticated, session]);

    const fetchDailyStats = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('daily_child_stats')
            .select('*')
            .eq('date', today);
        if (data) setDailyStats(data);
    };

    const fetchStats = async () => {
        if (!session) return;
        const { data } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', session.user.id)
            .order('date', { ascending: false });
        if (data) setStats(data);
    };

    const handleAuth = () => {
        if (profile?.parent_pin) {
            if (pin === profile.parent_pin) {
                setIsAuthenticated(true);
                setError('');
            } else {
                setError('Code PIN incorrect ! 🤫');
                setPin('');
            }
        } else {
            setIsAuthenticated(true);
        }
    };

    const saveParentSettings = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const { error: err } = await supabase.from('profiles').update({ parent_pin: newPin }).eq('id', profile.id);
            if (err) throw err;
            setSuccess('PIN mis à jour ! 🔐');
            await refreshProfile();
            setNewPin('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                // For insert, we need the parent_id
                payload.parent_id = session.user.id;
                payload.stars = 0; // Initialize stars
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

    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                    <Lock className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-800 mb-2">Espace Parents</h2>
                <p className="text-slate-500 font-bold mb-8 text-sm uppercase tracking-wide">Zone Sécurisée</p>
                <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-6">
                    <input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="PIN"
                        autoComplete="current-password"
                        className="w-full text-center text-4xl tracking-wide font-semibold p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                    />
                    {error && <p className="text-red-500 font-bold text-xs">{error}</p>}
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-sm  transition-all outline-none">
                        Accéder au Tableau de Bord
                    </button>
                    <button type="button" onClick={onExit} className="text-slate-400 text-xs font-bold uppercase hover:text-indigo-600 transition-colors w-full">Retour à l'accueil</button>
                </form>
            </div>
        );
    }


    return (
        <div className="max-w-7xl mx-auto pb-20 ">
            <div className="flex justify-end mb-4">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                >
                    <Lock className="w-3.5 h-3.5" />
                    Quitter la zone parent
                </button>
            </div>
            {/* Main Content Area - Sidebar removed as it's now in main layout */}
            <main className="flex-1 space-y-8">
                {activeTab === 'overview' && (
                    <div className="space-y-8 ">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-indigo-600 p-8 rounded-2xl text-white shadow-sm relative overflow-hidden group">
                                <Zap className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                                <h3 className="text-indigo-100 text-xs font-semibold uppercase tracking-wide mb-4">Total Stars</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-semibold">{children.reduce((acc, c) => acc + c.stars, 0)}</span>
                                    <span className="text-indigo-200 text-lg font-bold mb-1">⭐</span>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-4">Moyenne d'Étude</h3>
                                <div className="flex items-end gap-2 text-slate-800">
                                    <span className="text-3xl font-semibold">{Math.round(stats.length / (children.length || 1))}</span>
                                    <span className="text-slate-500 text-sm font-bold mb-1">ACT/KID</span>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-4">Matière Favorite</h3>
                                <div className="flex items-end gap-2 text-slate-800">
                                    <span className="text-2xl font-semibold uppercase">{stats[0]?.subject || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                                    <History className="w-6 h-6 text-indigo-600" /> Historique Récent
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {stats.length > 0 ? stats.slice(0, 5).map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <BookOpen className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{s.subject}</p>
                                                <p className="text-xs font-bold text-slate-400 uppercase">{children.find(c => c.id === s.child_id)?.name || 'Anonyme'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-indigo-600">+{s.score} PTS</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase">{new Date(s.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 text-center text-slate-400 font-bold italic">Aucune activité pour le moment...</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'children' && (
                    <div className="space-y-8 ">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-slate-800">Gestion des Profils</h2>
                            <button onClick={() => setShowAddChild(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-sm  transition-all">
                                <Plus className="w-5 h-5" /> Ajouter un enfant
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {children.map(child => (
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
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="space-y-8 ">
                        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center">
                            <div className="w-20 h-20 bg-yellow-50 rounded-3xl flex items-center justify-center text-yellow-500 mx-auto mb-6">
                                <Gift className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-semibold text-slate-800 mb-2">Objectifs & Récompenses</h2>
                            <p className="text-slate-500 font-bold mb-10 max-w-md mx-auto">Suivez les défis en cours pour chaque enfant !</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                {children.map(child => (
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
                                {children.every(c => !c.reward_goals?.length) && (
                                    <div className="col-span-full p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold uppercase text-xs tracking-wide">Aucun objectif actif. Ajoutez-en un dans la gestion des enfants !</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 ">
                        <h2 className="text-2xl font-semibold text-slate-800 mb-8 flex items-center gap-3">
                            <ShieldCheck className="w-7 h-7 text-indigo-600" /> Sécurité & Contrôles
                        </h2>
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Code PIN Parent</h4>
                                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Requis pour accéder à cet espace</p>
                                    </div>
                                </div>
                                <form onSubmit={(e) => { e.preventDefault(); saveParentSettings(); }} className="flex flex-col md:flex-row gap-4">
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                        placeholder="0000"
                                        autoComplete="new-password"
                                        className="flex-1 p-5 bg-slate-50 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-2xl tracking-wide text-center"
                                    />
                                    <button type="submit" className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-sm  transition-all">
                                        Sauvegarder
                                    </button>
                                </form>
                            </div>

                            <div className="pt-10 border-t border-slate-100 space-y-8">
                                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Cerveau de l'IA (OpenRouter)</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Choisis le modèle à utiliser</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select
                                            value={profile?.ai_model || localStorage.getItem('openrouter_model') || 'google/gemini-2.0-flash-lite-preview-02-05:free'}
                                            onChange={async (e) => {
                                                const model = e.target.value;
                                                localStorage.setItem('openrouter_model', model);
                                                if (profile) {
                                                    await supabase.from('profiles').update({ ai_model: model }).eq('id', profile.id);
                                                    await refreshProfile();
                                                }
                                            }}
                                            className="w-full p-5 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold appearance-none shadow-sm"
                                        >
                                            <optgroup label="Modèles Gratuits (Recommandés)">
                                                <option value="z-ai/glm-4.7-flash">glm-4.7-flash</option>
                                                <option value="deepseek/deepseek-v3.2">deepseek-v3.2</option>
                                            </optgroup>
                                        </select>
                                        <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 flex items-center gap-3">
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Status OpenRouter</p>
                                                <div className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    Connecté
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs text-slate-400 font-bold leading-relaxed px-2">
                                        💡 Note: Certains modèles peuvent être plus lents ou moins précis selon le sujet. Gemini 2.0 Flash Lite est recommandé pour les enfants pour sa rapidité.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <Moon className="w-6 h-6 text-indigo-600 mb-4" />
                                        <h4 className="font-semibold text-slate-800">Mode Sommeil</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-2 mb-4">Bloquer l'accès automatiquement après une certaine heure (ex: 20:00).</p>
                                        <button
                                            onClick={() => setActiveTab('children')}
                                            className="text-indigo-600 font-semibold text-xs uppercase tracking-wide hover:underline"
                                        >
                                            Configurer l'horaire
                                        </button>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <Award className="w-6 h-6 text-yellow-600 mb-4" />
                                        <h4 className="font-semibold text-slate-800">Détection d'IA</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-2 mb-4">Recevoir un rapport quand l'enfant utilise l'aide aux devoirs.</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-5 bg-indigo-600 rounded-full relative">
                                                <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                                            </div>
                                            <span className="font-semibold text-xs text-indigo-600 uppercase">Activé</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Add/Edit Child Modal (Simplified for the new layout) */}
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
