import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShieldCheck, Lock, Unlock, Clock, Ban,
    TrendingUp, Calendar, ChevronRight, Save,
    Settings, Activity, AlertCircle, CheckCircle2,
    Plus, User, Trash2, Edit2, X, Star
} from 'lucide-react';
import { supabase, Progress, Child } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ParentalSpace() {
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
    const [childBlockedTopics, setChildBlockedTopics] = useState<string[]>([]);
    const [stats, setStats] = useState<Progress[]>([]);

    useEffect(() => {
        if (isAuthenticated && session) {
            fetchGlobalStats();
        }
    }, [isAuthenticated, session]);

    const fetchGlobalStats = async () => {
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
        setSuccess('');
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ parent_pin: newPin || profile.parent_pin })
                .eq('id', profile.id);
            if (error) throw error;
            setSuccess('Code PIN mis à jour ! 🔐');
            await refreshProfile();
            setNewPin('');
        } catch (err) {
            setError('Erreur lors de la sauvegarde...');
        } finally {
            setLoading(false);
        }
    };

    const saveChild = async () => {
        if (!session) return;
        setLoading(true);
        setError('');
        try {
            const payload = {
                parent_id: session.user.id,
                name: childName,
                grade_level: childGrade,
                daily_time_limit: childTimeLimit,
                blocked_topics: childBlockedTopics,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${childName}`
            };

            let err;
            if (editingChild) {
                const { error } = await supabase.from('children').update(payload).eq('id', editingChild.id);
                err = error;
            } else {
                const { error } = await supabase.from('children').insert([payload]);
                err = error;
            }

            if (err) throw err;

            setSuccess(editingChild ? 'Profil mis à jour ! ✨' : 'Nouvel enfant ajouté ! 🎨');
            await refreshChildren();
            resetChildForm();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la sauvegarde...');
        } finally {
            setLoading(false);
        }
    };

    const deleteChild = async (id: string) => {
        if (!window.confirm('Es-tu sûr de vouloir supprimer ce profil ? Toutes les étoiles seront perdues ! 😱')) return;
        try {
            await supabase.from('children').delete().eq('id', id);
            await refreshChildren();
        } catch (err) {
            setError('Erreur lors de la suppression');
        }
    };

    const resetChildForm = () => {
        setShowAddChild(false);
        setEditingChild(null);
        setChildName('');
        setChildGrade('CP');
        setChildTimeLimit(30);
        setChildBlockedTopics([]);
    };

    const openEditChild = (child: Child) => {
        setEditingChild(child);
        setChildName(child.name);
        setChildGrade(child.grade_level);
        setChildTimeLimit(child.daily_time_limit);
        setChildBlockedTopics(child.blocked_topics);
        setShowAddChild(true);
    };

    const toggleTopic = (topic: string) => {
        setChildBlockedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[3rem] shadow-2xl border border-slate-100 text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-8 shadow-inner">
                    <Lock className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Espace Parents</h2>
                <p className="text-slate-500 font-bold mb-10 italic">
                    {profile?.parent_pin ? "Entre le code PIN de la famille" : "Crée ton code PIN de sécurité"}
                </p>

                <div className="space-y-6">
                    <input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="XXXX"
                        className="w-full text-center text-5xl tracking-[0.8em] font-black p-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none transition-all placeholder:tracking-normal placeholder:text-xl"
                    />
                    {error && <p className="text-red-500 font-bold text-sm bg-red-50 py-2 rounded-xl">{error}</p>}
                    <button onClick={handleAuth} className="w-full magical-gradient text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg">
                        Déverrouiller
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 flex items-center gap-4">
                        <ShieldCheck className="w-10 h-10 text-indigo-600" />
                        Gestion de la Famille
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Gérez vos enfants et la sécurité</p>
                </div>
                <button onClick={() => setIsAuthenticated(false)} className="px-8 py-3 bg-slate-100 rounded-2xl text-slate-500 font-black hover:bg-slate-200 transition-all">Verrouiller</button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Children Management */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-slate-800">Mes Enfants</h3>
                            <button onClick={() => setShowAddChild(true)} className="magical-gradient text-white p-3 rounded-2xl shadow-lg hover:rotate-90 transition-all">
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {children.map(child => (
                                <div key={child.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm">
                                            {child.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-lg">{child.name}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{child.grade_level}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditChild(child)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => deleteChild(child.id)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-red-500 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                            {children.length === 0 && (
                                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                                    <p className="text-slate-400 font-bold">Aucun enfant enregistré. Ajoutez le premier ! 🚀</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                        <h3 className="text-2xl font-black text-slate-800 mb-8">Sécurité Famille</h3>
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 items-end">
                                <div className="flex-1 space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Changer le code PIN Parents</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Nouveau code (4 chiffres)"
                                        className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-black text-xl"
                                    />
                                </div>
                                <button onClick={saveParentSettings} className="px-8 py-5 magical-gradient text-white font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">Mettre à jour</button>
                            </div>
                            {success && <p className="text-emerald-500 font-bold text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</p>}
                        </div>
                    </div>
                </div>

                {/* Global Activity */}
                <div className="space-y-8">
                    <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                        <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2">Stats Globales</h3>
                        <div className="space-y-4">
                            <div className="bg-white/10 p-4 rounded-2xl">
                                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Total Étoiles Famille</p>
                                <p className="text-3xl font-black">{children.reduce((acc, c) => acc + c.stars, 0)} ⭐</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl">
                                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Activités cette semaine</p>
                                <p className="text-3xl font-black">{stats.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-black text-slate-800 mb-6">Derniers Exploits</h3>
                        <div className="space-y-4 text-sm font-medium">
                            {stats.slice(0, 4).map(s => (
                                <div key={s.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 uppercase tracking-tighter text-[10px]">
                                    <span className="text-slate-400 font-black">{new Date(s.date).toLocaleDateString()}</span>
                                    <span className="text-slate-700 font-black">{s.subject}</span>
                                    <span className="text-indigo-600 font-black">+{s.score} PTS</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Child Modal */}
            <AnimatePresence>
                {showAddChild && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetChildForm} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[3rem] p-10 w-full max-w-2xl relative z-10 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-black text-slate-800">{editingChild ? 'Modifier le Profil' : 'Ajouter un Enfant'}</h3>
                                <button onClick={resetChildForm} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Prénom de l'enfant</label>
                                        <input value={childName} onChange={e => setChildName(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-bold" placeholder="Ex: Léo" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Classe / Niveau</label>
                                        <select value={childGrade} onChange={e => setChildGrade(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-bold appearance-none">
                                            {['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Limite de temps quotidienne</label>
                                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-black text-sm">{childTimeLimit === 0 ? 'Illimité' : `${childTimeLimit} min`}</span>
                                    </div>
                                    <input type="range" min="0" max="120" step="15" value={childTimeLimit} onChange={e => setChildTimeLimit(Number(e.target.value))} className="w-full accent-indigo-600" />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Matières à restreindre</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Maths', 'Français', 'Histoire', 'Sciences', 'Dessin'].map(topic => (
                                            <button key={topic} onClick={() => toggleTopic(topic)} className={`px-4 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${childBlockedTopics.includes(topic) ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                {topic}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={saveChild} disabled={loading || !childName} className="w-full magical-gradient text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                                    {loading ? 'Sauvegarde...' : 'C\'est parti !'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
