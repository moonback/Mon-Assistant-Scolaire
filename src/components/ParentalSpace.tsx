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
        try {
            const payload = {
                parent_id: session.user.id,
                name: childName,
                grade_level: childGrade,
                daily_time_limit: childTimeLimit,
                bedtime: childBedtime,
                reward_goals: rewardGoals,
                blocked_topics: childBlockedTopics,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${childName}`
            };
            if (editingChild) {
                await supabase.from('children').update(payload).eq('id', editingChild.id);
            } else {
                await supabase.from('children').insert([payload]);
            }
            setSuccess('Modifications enregistrées ! ✨');
            await refreshChildren();
            resetChildForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteChild = async (id: string) => {
        if (!window.confirm('Supprimer ce profil ?')) return;
        await supabase.from('children').delete().eq('id', id);
        await refreshChildren();
    };

    const resetChildForm = () => {
        setShowAddChild(false);
        setEditingChild(null);
        setChildName('');
        setChildGrade('CP');
        setChildTimeLimit(30);
        setChildBedtime('20:00');
        setChildBlockedTopics([]);
        setRewardGoals([]);
    };

    const openEditChild = (child: Child) => {
        setEditingChild(child);
        setChildName(child.name);
        setChildGrade(child.grade_level);
        setChildTimeLimit(child.daily_time_limit);
        setChildBedtime(child.bedtime || '20:00');
        setChildBlockedTopics(child.blocked_topics || []);
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
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-12 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-700 to-slate-900" />

                    <div className="w-24 h-24 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mx-auto mb-10 relative group">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-110 group-hover:scale-125 transition-transform" />
                        <Lock className="w-10 h-10 relative z-10" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Espace Parent</h2>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-10">Zone sous haute protection</p>

                    <div className="space-y-8">
                        <div className="relative group">
                            <input
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••"
                                className="w-full text-center text-5xl tracking-[0.5em] font-black p-8 rounded-3xl bg-slate-50 border-2 border-slate-100 focus:border-slate-300 focus:bg-white transition-all outline-none placeholder:text-slate-200"
                            />
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 font-bold text-xs mt-4 uppercase tracking-widest"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </div>

                        <div className="flex flex-col gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAuth}
                                className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl shadow-xl hover:bg-slate-800 transition-all uppercase tracking-[0.2em] text-xs"
                            >
                                Déverrouiller l'accès
                            </motion.button>

                            <button
                                onClick={onExit}
                                className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors py-2"
                            >
                                Retour à l'application
                            </button>
                        </div>
                    </div>
                </motion.div>

                <p className="mt-8 text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] opacity-50 italic">
                    Mon Assistant Scolaire v2.0 • 2025 Standard
                </p>
            </div>
        );
    }


    return (
        <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-10 px-2 lg:px-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Panneau de Contrôle</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Sécurisée</span>
                        </div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onExit}
                    className="flex items-center gap-3 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm"
                >
                    <Lock className="w-4 h-4" />
                    Quitter la zone
                </motion.button>
            </div>
            {/* Main Content Area - Sidebar removed as it's now in main layout */}
            <main className="flex-1 space-y-8">
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-premium relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors" />
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Total Étoiles</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                                            <Star className="w-7 h-7 fill-amber-400" />
                                        </div>
                                        <span className="text-5xl font-black tracking-tight">{children.reduce((acc, c) => acc + c.stars, 0)}</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100 flex flex-col justify-between"
                            >
                                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Activités Moyennes</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <TrendingUp className="w-7 h-7" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-5xl font-black text-slate-900 tracking-tight">
                                            {Math.round(stats.length / (children.length || 1))}
                                        </span>
                                        <span className="text-slate-400 text-[10px] font-black uppercase mb-3  tracking-widest">Actes / Enfant</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100 flex flex-col justify-between"
                            >
                                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Sujet de Prédilection</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <BookOpen className="w-7 h-7" />
                                    </div>
                                    <span className="text-3xl font-black text-slate-900 uppercase tracking-tight truncate">
                                        {stats[0]?.subject || 'N/A'}
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        <div className="bg-white p-10 rounded-[3.5rem] shadow-premium border border-slate-100 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                                        <History className="w-5 h-5" />
                                    </div>
                                    Activités Récentes du Foyer
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temps Réel</span>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {stats.length > 0 ? stats.slice(0, 5).map((s, idx) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between p-6 bg-slate-50 hover:bg-white hover:shadow-premium rounded-3xl border border-transparent hover:border-slate-100 transition-all group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                <div className={`p-3 rounded-xl ${s.activity_type === 'quiz' ? 'bg-violet-50 text-violet-600' :
                                                    s.activity_type === 'math' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
                                                    }`}>
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-base">{s.subject}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                                                        {children.find(c => c.id === s.child_id)?.name || 'Anonyme'}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-2xl text-slate-900 tracking-tight">+{s.score}</p>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none">points</p>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <History className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Aucune activité enregistrée récemment</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'children' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestion des Profils</h2>
                                <p className="text-slate-400 font-medium text-sm mt-1">Gérez le contenu et le temps d'écran pour chaque enfant.</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAddChild(true)}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-premium hover:bg-slate-800 transition-all"
                            >
                                <Plus className="w-5 h-5 text-indigo-400" /> Ajouter un enfant
                            </motion.button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {children.map((child, idx) => (
                                <motion.div
                                    key={child.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-8 rounded-[3.5rem] shadow-premium border border-slate-100 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-50/50 transition-colors" />

                                    <div className="relative z-10">
                                        <div className="flex items-start gap-6">
                                            <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl group-hover:rotate-3 transition-transform duration-500">
                                                {child.avatar_url ? (
                                                    <img src={child.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : <User className="w-10 h-10 text-slate-300" />}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{child.name}</h3>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-indigo-100/50">{child.grade_level}</span>
                                                    <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-100/50">⭐ {child.stars}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-8">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Temps Quotidien</p>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span className="text-sm font-black text-slate-800">{child.daily_time_limit} MIN</span>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Heure Coucher</p>
                                                <div className="flex items-center gap-2">
                                                    <Moon className="w-3.5 h-3.5 text-purple-500" />
                                                    <span className="text-sm font-black text-slate-800">{child.bedtime || '20:00'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-4 bg-indigo-900/5 rounded-2xl border border-indigo-100/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Utilisation Aujourd'hui</p>
                                                <span className="text-[9px] font-black text-indigo-600">
                                                    {dailyStats.find(s => s.child_id === child.id)?.time_spent_minutes || 0} / {child.daily_time_limit} m
                                                </span>
                                            </div>
                                            <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, ((dailyStats.find(s => s.child_id === child.id)?.time_spent_minutes || 0) / child.daily_time_limit) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 flex gap-3">
                                            <button
                                                onClick={() => openEditChild(child)}
                                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg"
                                            >
                                                <Edit2 className="w-4 h-4 text-indigo-400" /> Paramétrer
                                            </button>
                                            <button
                                                onClick={() => deleteChild(child.id)}
                                                className="w-14 h-14 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 px-2">
                        <div className="text-left mb-10">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Récompenses & Objectifs</h2>
                            <p className="text-slate-400 font-medium text-sm mt-1">Créez de la motivation en définissant des objectifs d'étoiles.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            {children.map(child => (
                                child.reward_goals?.map((goal: any, idx: number) => {
                                    const progress = Math.min(100, Math.round((child.stars / goal.target) * 100));
                                    return (
                                        <motion.div
                                            key={goal.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group p-10 bg-white rounded-[3.5rem] shadow-premium border border-slate-100 relative overflow-hidden hover:border-indigo-200 transition-all bg-gradient-to-br from-white to-slate-50/50"
                                        >
                                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-slate-50 group-hover:scale-110 transition-transform duration-500">
                                                        {goal.icon || '🎁'}
                                                    </div>
                                                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border ${progress === 100
                                                        ? 'bg-emerald-500 text-white border-emerald-400'
                                                        : 'bg-white text-indigo-600 border-slate-100'
                                                        }`}>
                                                        {progress === 100 ? 'Complété ! ✨' : 'En progression'}
                                                    </div>
                                                </div>

                                                <h4 className="font-black text-slate-900 text-xl tracking-tight mb-1">{goal.label}</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Pour {child.name}</p>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Étoiles collectées</span>
                                                            <span className="text-2xl font-black text-slate-900 tracking-tight">{child.stars} / {goal.target}</span>
                                                        </div>
                                                        <span className="text-3xl font-black text-indigo-600/20">{progress}%</span>
                                                    </div>

                                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                                            className={`h-full rounded-full ${progress === 100 ? 'magical-gradient shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-indigo-600'}`}
                                                        />
                                                    </div>
                                                </div>

                                                {progress === 100 && (
                                                    <motion.button
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="w-full mt-8 py-4 bg-emerald-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        <Award className="w-4 h-4" /> Marquer comme Offert
                                                    </motion.button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ))}

                            {children.every(c => !c.reward_goals?.length) && (
                                <div className="col-span-full py-32 text-center bg-slate-50 rounded-[3.5rem] border-4 border-dashed border-slate-100">
                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <Gift className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em] max-w-sm mx-auto leading-relaxed">
                                        Aucun objectif actif. Rendez-vous dans "Profils" pour ajouter des récompenses !
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="bg-white p-12 rounded-[4rem] shadow-premium border border-slate-100 animate-in fade-in slide-in-from-bottom-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />

                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
                                <div className="p-3 bg-slate-900 text-white rounded-2xl">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                                Paramètres de Sécurité
                            </h2>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100/50">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                                <Lock className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900">Code PIN Parental</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Accès protégé</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <input
                                                type="password"
                                                maxLength={4}
                                                value={newPin}
                                                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                                placeholder="••••"
                                                className="w-full p-6 bg-white rounded-[1.5rem] border-2 border-slate-100 focus:border-slate-300 outline-none transition-all font-black text-3xl tracking-[0.5em] text-center"
                                            />
                                            <button
                                                onClick={saveParentSettings}
                                                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest text-xs"
                                            >
                                                Mettre à jour le PIN
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                <Zap className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900">Cerveau de l'IA</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Moteur d'apprentissage</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
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
                                                className="w-full p-5 rounded-2xl bg-white border-2 border-indigo-100/50 focus:border-indigo-300 outline-none transition-all font-bold appearance-none shadow-sm cursor-pointer"
                                            >
                                                <optgroup label="Modèles Gratuits (Recommandés)">
                                                    <option value="z-ai/glm-4.7-flash">glm-4.7-flash</option>
                                                    <option value="deepseek/deepseek-v3.2">deepseek-v3.2</option>
                                                </optgroup>
                                            </select>
                                            <div className="bg-white/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Connectivité</span>
                                                <div className="text-[10px] font-black text-emerald-610 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    ONLINE
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-4">Contrôles Avancés</h4>

                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { icon: Moon, title: 'Mode Sommeil', desc: 'Blocage automatique après l\'heure limite', status: 'Actif', color: 'indigo' },
                                            { icon: Award, title: 'Rapport d\'Activités', desc: 'Notification hebdomadaire par email', status: 'Bientôt', color: 'purple' },
                                            { icon: Ban, title: 'Filtre de Sécurité', desc: 'Protection renforcée contre le contenu inapproprié', status: 'Actif', color: 'emerald' },
                                            { icon: History, title: 'Journal d\'Audit', desc: 'Historique complet des changements de session', status: 'Détails', color: 'amber' }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 bg-slate-50 hover:bg-white hover:shadow-premium rounded-3xl border border-transparent hover:border-slate-100 transition-all flex items-center justify-between group cursor-pointer">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-${item.color}-600`}>
                                                        <item.icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-sm">{item.title}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${item.status === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        ))}
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetChildForm} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[4rem] p-12 w-full max-w-2xl relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-100"
                        >
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{editingChild ? 'Configuration Profil' : 'Nouveau Compte Enfant'}</h3>
                                    <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-widest">Étape de personnalisation</p>
                                </div>
                                <button onClick={resetChildForm} className="w-12 h-12 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Prénom de l'enfant</label>
                                        <input
                                            value={childName}
                                            onChange={e => setChildName(e.target.value)}
                                            className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white outline-none transition-all font-black text-lg"
                                            placeholder="Léo"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Niveau Scolaire</label>
                                        <div className="relative">
                                            <select
                                                value={childGrade}
                                                onChange={e => setChildGrade(e.target.value)}
                                                className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white outline-none transition-all font-black text-lg appearance-none cursor-pointer"
                                            >
                                                {['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème'].map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Temps d'écran autorisé</label>
                                            <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black text-xs shadow-lg">{childTimeLimit} min</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="15"
                                            max="180"
                                            step="15"
                                            value={childTimeLimit}
                                            onChange={e => setChildTimeLimit(Number(e.target.value))}
                                            className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-full cursor-pointer"
                                        />
                                        <div className="flex justify-between px-1 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                            <span>15 min</span>
                                            <span>3 heures</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Heure du coucher (Couvre-feu)</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500">
                                                <Moon className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="time"
                                                value={childBedtime}
                                                onChange={e => setChildBedtime(e.target.value)}
                                                className="w-full p-5 pl-14 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white outline-none font-black text-lg transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Objectifs de Récompense</label>
                                        <button
                                            type="button"
                                            onClick={addRewardGoal}
                                            className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-md"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Nouvel Objectif
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {rewardGoals.map(goal => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                key={goal.id}
                                                className="flex gap-3 items-center bg-slate-50 p-4 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-premium transition-all group"
                                            >
                                                <input
                                                    value={goal.icon}
                                                    onChange={e => updateRewardGoal(goal.id, 'icon', e.target.value)}
                                                    className="w-14 h-14 bg-white rounded-2xl text-center text-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"
                                                    placeholder="🎁"
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        value={goal.label}
                                                        onChange={e => updateRewardGoal(goal.id, 'label', e.target.value)}
                                                        placeholder="Vivre une aventure au zoo..."
                                                        className="w-full bg-transparent p-1 border-b border-transparent focus:border-indigo-200 outline-none text-sm font-black text-slate-800 placeholder:text-slate-300 transition-all"
                                                    />
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                                                            <input
                                                                type="number"
                                                                value={goal.target}
                                                                onChange={e => updateRewardGoal(goal.id, 'target', parseInt(e.target.value))}
                                                                className="w-16 bg-transparent text-center outline-none text-xs font-black text-indigo-600"
                                                            />
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Étoiles</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeRewardGoal(goal.id)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </motion.div>
                                        ))}
                                        {rewardGoals.length === 0 && (
                                            <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center">
                                                <Gift className="w-8 h-8 text-slate-200 mb-2" />
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucun objectif défini</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Privilèges & Accès</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {[
                                            { id: 'assistant', label: 'IA Chat', icon: Zap },
                                            { id: 'quiz', label: 'Quiz', icon: Award },
                                            { id: 'math', label: 'Calcul', icon: Zap },
                                            { id: 'drawing', label: 'Dessin', icon: Edit2 },
                                            { id: 'homework', label: 'Devoirs', icon: BookOpen },
                                            { id: 'story', label: 'Contes', icon: BookOpen },
                                            { id: 'dictionary', label: 'Dico', icon: ShieldCheck },
                                            { id: 'fact', label: 'Curiosité', icon: Zap }
                                        ].map(feature => (
                                            <button
                                                key={feature.id}
                                                type="button"
                                                onClick={() => toggleTopic(feature.id)}
                                                className={`p-4 rounded-2.5xl border-2 transition-all flex flex-col items-center gap-3 text-center ${!childBlockedTopics.includes(feature.id)
                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm'
                                                    : 'bg-white border-slate-100 text-slate-300 opacity-60'}`}
                                            >
                                                <feature.icon className="w-6 h-6" />
                                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{feature.label}</span>
                                                <div className={`w-2 h-2 rounded-full ${!childBlockedTopics.includes(feature.id) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={saveChild}
                                    disabled={loading || !childName}
                                    className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all uppercase tracking-[0.1em] mt-6"
                                >
                                    {loading ? 'Traitement en cours...' : (editingChild ? 'Appliquer les changements' : 'Créer le profil maintenant')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
