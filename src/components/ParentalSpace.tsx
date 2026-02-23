import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShieldCheck, Lock, Unlock, Clock, Ban,
    TrendingUp, Calendar, ChevronRight, Save,
    Settings, Activity, AlertCircle, CheckCircle2
} from 'lucide-react';
import { supabase, Progress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ParentalSpace() {
    const { profile, refreshProfile } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Settings state
    const [newPin, setNewPin] = useState('');
    const [timeLimit, setTimeLimit] = useState(profile?.daily_time_limit || 0);
    const [blockedTopics, setBlockedTopics] = useState<string[]>(profile?.blocked_topics || []);
    const [stats, setStats] = useState<Progress[]>([]);

    useEffect(() => {
        if (isAuthenticated && profile) {
            fetchStats();
        }
    }, [isAuthenticated, profile]);

    const fetchStats = async () => {
        if (!profile) return;
        const { data } = await supabase
            .from('progress')
            .select('*')
            .eq('user_id', profile.id)
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
            // First time setting PIN
            setIsAuthenticated(true);
        }
    };

    const saveSettings = async () => {
        if (!profile) return;
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const updates = {
                parent_pin: newPin || profile.parent_pin,
                daily_time_limit: Number(timeLimit),
                blocked_topics: blockedTopics,
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profile.id);

            if (error) throw error;

            setSuccess('Paramètres sauvegardés avec succès ! 🛡️');
            await refreshProfile();
            setNewPin('');
        } catch (err) {
            setError('Erreur lors de la sauvegarde...');
        } finally {
            setLoading(false);
        }
    };

    const toggleTopic = (topic: string) => {
        setBlockedTopics(prev =>
            prev.includes(topic)
                ? prev.filter(t => t !== topic)
                : [...prev, topic]
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-[3rem] shadow-2xl border border-slate-100 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                    <Lock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Espace Parents</h2>
                <p className="text-slate-500 font-bold mb-8 italic">
                    {profile?.parent_pin
                        ? "Entre ton code à 4 chiffres pour accéder aux réglages."
                        : "Crée ton code PIN de sécurité."}
                </p>

                <div className="space-y-4">
                    <input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="XXXX"
                        className="w-full text-center text-4xl tracking-[1em] font-black p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none transition-all placeholder:tracking-normal placeholder:text-lg"
                    />

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-bold flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </motion.p>
                    )}

                    <button
                        onClick={handleAuth}
                        className="w-full magical-gradient text-white font-black py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all mt-4"
                    >
                        {profile?.parent_pin ? "Déverrouiller" : "Initialiser l'Espace"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <ShieldCheck className="w-6 h-6" />
                        <h1 className="text-3xl font-black tracking-tight text-slate-800">Contrôle Parental</h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Gérez l'expérience de votre enfant</p>
                </div>
                <button
                    onClick={() => setIsAuthenticated(false)}
                    className="px-6 py-2 border-2 border-slate-100 rounded-xl text-slate-400 font-black hover:bg-slate-50 transition-all text-xs"
                >
                    Verrouiller l'accès
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Quick Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            Activité Récente
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Points aujourd\'hui', value: stats.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.score, 0) },
                                { label: 'Total Missions', value: stats.length },
                                { label: 'Sujet favori', value: stats.length > 0 ? Array.from(new Set(stats.map(s => s.subject))).sort((a, b) => stats.filter(s => s.subject === b).length - stats.filter(s => s.subject === a).length)[0] : 'Aucun' }
                            ].map((s, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-sm font-bold text-slate-500">{s.label}</span>
                                    <span className="font-black text-slate-800 capitalize">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl">
                        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-200" />
                            Temps d'écran
                        </h3>
                        <p className="text-indigo-100 text-sm font-medium mb-6 leading-relaxed">
                            Limitez le temps d'utilisation quotidien pour protéger les yeux de votre enfant.
                        </p>
                        <div className="space-y-4">
                            <input
                                type="range"
                                min="0"
                                max="120"
                                step="15"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                className="w-full accent-white"
                            />
                            <div className="flex justify-between font-black text-sm">
                                <span>Sans limite</span>
                                <span className="bg-white/20 px-3 py-1 rounded-lg">{timeLimit === 0 ? 'Illimité' : `${timeLimit} min`}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Security & Filters */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <Settings className="w-6 h-6 text-slate-400" />
                                Sécurité & Filtres
                            </h3>
                            <AnimatePresence>
                                {success && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-emerald-500 font-bold text-sm flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> {success}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Change PIN */}
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-600 uppercase tracking-widest px-1">Changer le PIN</label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Nouveau code (4 chiffres)"
                                    className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-bold"
                                />
                            </div>

                            {/* Block Content */}
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-600 uppercase tracking-widest px-1">Matières à bloquer</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Maths', 'Français', 'Histoire', 'Sciences', 'Dessin'].map((topic) => (
                                        <button
                                            key={topic}
                                            onClick={() => toggleTopic(topic)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${blockedTopics.includes(topic)
                                                    ? 'bg-red-50 border-red-200 text-red-600'
                                                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'
                                                }`}
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-50">
                            <button
                                onClick={saveSettings}
                                disabled={loading}
                                className="w-full magical-gradient text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-6 h-6" />
                                        <span>Sauvegarder les modifications</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-orange-900 mb-1">Rapport d'activité bientôt disponible</h4>
                            <p className="text-orange-700/70 text-sm font-medium leading-relaxed">
                                Nous travaillons sur une fonctionnalité d'envoi automatique de rapports par email pour suivre les progrès de votre enfant chaque semaine !
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
