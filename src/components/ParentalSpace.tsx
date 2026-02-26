import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { supabase, Progress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ParentalTab as Tab } from '../types/app';

import ParentalOverview from './parental/ParentalOverview';
import ParentalChildren from './parental/ParentalChildren';
import ParentalRewards from './parental/ParentalRewards';
import ParentalMissionsManagement from './parental/ParentalMissionsManagement';
import ParentalSecurity from './parental/ParentalSecurity';
import ParentalCompetitions from './parental/ParentalCompetitions';
import AppCard from './ui/AppCard';
import AppButton from './ui/AppButton';
import SectionHeader from './ui/SectionHeader';

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
            <AppCard className="mx-auto mt-20 max-w-md text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                    <Lock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Espace Parents</h2>
                <p className="mb-8 text-xs font-bold uppercase tracking-widest text-slate-500">Zone sécurisée</p>
                <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-6">
                    <input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="PIN"
                        autoComplete="current-password"
                        className="w-full text-center text-3xl tracking-widest font-black p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                    {error && <p className="text-red-500 font-bold text-xs">{error}</p>}
                    <AppButton type="submit" className="w-full text-xs uppercase tracking-widest">
                        Accéder au tableau de bord
                    </AppButton>
                    <AppButton type="button" variant="ghost" onClick={onExit} className="w-full text-xs uppercase tracking-widest">Retour à l'accueil</AppButton>
                </form>
            </AppCard>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-20">
            <SectionHeader
                title="Espace Parents"
                subtitle="Suivez les progrès et ajustez les paramètres en toute sécurité."
                action={
                    <AppButton
                        variant="ghost"
                        onClick={onExit}
                        leftIcon={<Lock className="h-4 w-4" />}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                        Quitter la zone parent
                    </AppButton>
                }
            />

            <div className="flex justify-end gap-4">
                {success && (
                    <div className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-semibold text-xs tracking-wide">
                        <ShieldCheck className="mr-2 h-4 w-4" />{success}
                    </div>
                )}
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

                {activeTab === 'missions' && (
                    <ParentalMissionsManagement
                        childrenContext={children}
                        refreshChildren={refreshChildren}
                        setSuccess={setSuccess}
                        setError={setError}
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
