import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { supabase, Progress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ParentalTab as Tab } from '../types/app';

import ParentalOverview from './parental/ParentalOverview';
import ParentalChildren from './parental/ParentalChildren';
import ParentalRewards from './parental/ParentalRewards';
import ParentalSecurity from './parental/ParentalSecurity';
import ParentalCompetitions from './parental/ParentalCompetitions';

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
            <div className="flex justify-end mb-4 gap-4">
                {success && (
                    <div className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-semibold text-xs tracking-wide">
                        {success}
                    </div>
                )}
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                >
                    <Lock className="w-3.5 h-3.5" />
                    Quitter la zone parent
                </button>
            </div>

            <main className="flex-1 space-y-8">
                {activeTab === 'overview' && (
                    <ParentalOverview childrenContext={children} stats={stats} />
                )}

                {activeTab === 'children' && (
                    <ParentalChildren
                        childrenContext={children}
                        dailyStats={dailyStats}
                        refreshChildren={refreshChildren}
                        session={session}
                        setError={setError}
                        setSuccess={setSuccess}
                    />
                )}

                {activeTab === 'rewards' && (
                    <ParentalRewards childrenContext={children} />
                )}

                {activeTab === 'competitions' && (
                    <ParentalCompetitions childrenContext={children} />
                )}

                {activeTab === 'security' && (
                    <ParentalSecurity
                        profile={profile}
                        newPin={newPin}
                        setNewPin={setNewPin}
                        saveParentSettings={saveParentSettings}
                        refreshProfile={refreshProfile}
                        setActiveTab={setActiveTab}
                    />
                )}
            </main>
        </div>
    );
}
