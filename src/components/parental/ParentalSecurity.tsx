import React from 'react';
import { ShieldCheck, Moon, Award, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/supabase';
import { ParentalTab } from '../../types/app';

interface ParentalSecurityProps {
    profile: Profile | null;
    newPin: string;
    setNewPin: (pin: string) => void;
    saveParentSettings: () => void;
    refreshProfile: () => void;
    setActiveTab: (tab: ParentalTab) => void;
}

export default function ParentalSecurity({
    profile,
    newPin,
    setNewPin,
    saveParentSettings,
    refreshProfile,
    setActiveTab
}: ParentalSecurityProps) {
    return (
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
    );
}
