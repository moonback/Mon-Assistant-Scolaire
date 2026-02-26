import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Target, CheckCircle2, Trash2, Clock, Star, Info, X } from 'lucide-react';
import { supabase, Child } from '../../lib/supabase';
import { ParentalMission, MissionCategory } from '../../types/app';
import AppButton from '../ui/AppButton';

interface ParentalMissionsManagementProps {
    childrenContext: Child[];
    refreshChildren: () => Promise<void>;
    setSuccess: (s: string) => void;
    setError: (e: string) => void;
}

export default function ParentalMissionsManagement({
    childrenContext,
    refreshChildren,
    setSuccess,
    setError
}: ParentalMissionsManagementProps) {
    const [selectedChildId, setSelectedChildId] = useState<string>(childrenContext[0]?.id || '');
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states
    const [label, setLabel] = useState('');
    const [reward, setReward] = useState(10);
    const [category, setCategory] = useState<MissionCategory>('home');
    const [icon, setIcon] = useState('🎯');

    const selectedChild = childrenContext.find(c => c.id === selectedChildId);
    const missions = (selectedChild?.missions || []) as ParentalMission[];

    const categories: { id: MissionCategory; label: string; icon: string }[] = [
        { id: 'education', label: 'Éducation', icon: '📚' },
        { id: 'home', label: 'Maison', icon: '🏠' },
        { id: 'behavior', label: 'Comportement', icon: '🤝' },
        { id: 'sport', label: 'Sport', icon: '⚽' },
    ];

    const handleAddMission = async () => {
        if (!selectedChild || !label) return;
        setLoading(true);

        const newMission: ParentalMission = {
            id: crypto.randomUUID(),
            label,
            reward,
            category,
            icon,
            status: 'pending'
        };

        try {
            const { error: err } = await supabase
                .from('children')
                .update({
                    missions: [...missions, newMission]
                })
                .eq('id', selectedChild.id);

            if (err) throw err;

            setSuccess('Mission ajoutée ! 🎯');
            await refreshChildren();
            setShowAddModal(false);
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyMission = async (missionId: string) => {
        if (!selectedChild) return;
        setLoading(true);

        const updatedMissions = missions.map(m =>
            m.id === missionId ? { ...m, status: 'verified' as const } : m
        );

        try {
            const { error: err } = await supabase
                .from('children')
                .update({
                    missions: updatedMissions
                })
                .eq('id', selectedChild.id);

            if (err) throw err;

            setSuccess('Mission validée ! ⭐');
            await refreshChildren();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMission = async (missionId: string) => {
        if (!selectedChild || !window.confirm('Supprimer cette mission ?')) return;
        setLoading(true);

        const updatedMissions = missions.filter(m => m.id !== missionId);

        try {
            const { error: err } = await supabase
                .from('children')
                .update({
                    missions: updatedMissions
                })
                .eq('id', selectedChild.id);

            if (err) throw err;

            setSuccess('Mission supprimée ! 👋');
            await refreshChildren();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setLabel('');
        setReward(10);
        setCategory('home');
        setIcon('🎯');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500">
                            <Target className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Missions Quotidiennes</h2>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Créez des défis pour encourager vos enfants</p>
                        </div>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
                        {childrenContext.map(child => (
                            <button
                                key={child.id}
                                onClick={() => setSelectedChildId(child.id)}
                                className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${selectedChildId === child.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                <img src={child.avatar_url} className="w-6 h-6 rounded-lg pointer-events-none" />
                                {child.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddModal(true)}
                        className="p-10 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:rotate-90 transition-all duration-500">
                            <Plus className="w-8 h-8" />
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest">Nouvelle Mission</span>
                    </motion.button>

                    {missions.map((mission) => (
                        <div key={mission.id} className={`p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all ${mission.status === 'verified' ? 'opacity-60' : ''}`}>
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="text-3xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
                                        {mission.icon}
                                    </div>
                                    <div className="px-3 py-1 rounded-lg bg-white border border-slate-100 flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        <span className="text-xs font-black text-slate-700">+{mission.reward}</span>
                                    </div>
                                </div>

                                <h4 className="font-black text-slate-800 text-lg leading-tight mb-2">{mission.label}</h4>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="px-2 py-0.5 rounded-md bg-white text-[10px] font-black uppercase text-slate-400 border border-slate-100 tracking-tighter">
                                        {categories.find(c => c.id === mission.category)?.label}
                                    </span>
                                    {mission.status === 'completed' && (
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[10px] font-black uppercase text-emerald-600 border border-emerald-200 animate-pulse">
                                            À Valider !
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {mission.status === 'completed' && (
                                        <AppButton
                                            onClick={() => handleVerifyMission(mission.id)}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-[10px] font-black uppercase tracking-widest"
                                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                                        >
                                            Valider
                                        </AppButton>
                                    )}
                                    <button
                                        onClick={() => handleDeleteMission(mission.id)}
                                        className="p-3 bg-white text-slate-400 hover:text-rose-500 rounded-xl border border-slate-200 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {missions.length === 0 && (
                    <div className="mt-8 p-12 text-center bg-indigo-50/30 rounded-3xl border-2 border-dashed border-indigo-100">
                        <Info className="w-10 h-10 text-indigo-300 mx-auto mb-4" />
                        <p className="text-indigo-900 font-bold mb-1 uppercase text-xs">Aucune mission pour le moment</p>
                        <p className="text-indigo-400 text-xs font-semibold">Créez votre première mission pour {selectedChild?.name} !</p>
                    </div>
                )}
            </div>

            {/* Modal de création */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg relative z-10 shadow-2xl border border-slate-100"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nouvelle Mission</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Description du défi</label>
                                    <input
                                        value={label}
                                        onChange={e => setLabel(e.target.value)}
                                        className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
                                        placeholder="Ex: Ranger les jouets..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Récompense</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={reward}
                                                onChange={e => setReward(parseInt(e.target.value))}
                                                className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
                                            />
                                            <Star className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 fill-amber-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Icone</label>
                                        <input
                                            value={icon}
                                            onChange={e => setIcon(e.target.value)}
                                            className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all text-2xl text-center"
                                            placeholder="🎯"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Catégorie</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setCategory(cat.id);
                                                    setIcon(cat.icon);
                                                }}
                                                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${category === cat.id ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'}`}
                                            >
                                                <span className="text-xl">{cat.icon}</span>
                                                <span className="text-[10px] font-black uppercase tracking-tight">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <AppButton
                                    onClick={handleAddMission}
                                    loading={loading}
                                    disabled={!label}
                                    className="w-full py-6 rounded-2xl text-lg font-black uppercase tracking-widest mt-4 shadow-xl shadow-indigo-200"
                                >
                                    Créer la mission
                                </AppButton>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
