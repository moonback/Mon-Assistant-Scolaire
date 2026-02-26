import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import AppCard from '../ui/AppCard';
import { Accessibility, Eye, Type, Zap, MousePointer2, Volume2 } from 'lucide-react';

export default function ParentalAccessibility() {
    const {
        dyslexicFont, setDyslexicFont,
        readingRuler, setReadingRuler,
        highContrast, setHighContrast,
        fontSizeScale, setFontSizeScale,
        reduceMotion, setReduceMotion,
        speechRate, setSpeechRate,
        resetToDefault
    } = useAccessibility();

    const Toggle = ({ checked, onChange, label, description, icon: Icon }: any) => (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${checked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent focus:ring-indigo-200 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Accessibility className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Accessibilité & Inclusion</h2>
                        <p className="text-sm text-slate-500">Adaptez l'expérience pour les besoins spécifiques (DYS, TDAH).</p>
                    </div>
                </div>
                <button
                    onClick={resetToDefault}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
                >
                    Réinitialiser tout
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AppCard title="Confort de Lecture (DYS)" className="space-y-4">
                    <Toggle
                        checked={dyslexicFont}
                        onChange={setDyslexicFont}
                        label="Police Inclusive (Lexend)"
                        description="Police spécialisée pour réduire la fatigue visuelle et les confusions."
                        icon={Type}
                    />
                    <Toggle
                        checked={readingRuler}
                        onChange={setReadingRuler}
                        label="Règle de Lecture"
                        description="Affiche une règle qui suit la souris pour aider l'enfant à ne pas perdre son fil."
                        icon={MousePointer2}
                    />
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Taille de police</h4>
                                    <p className="text-xs text-slate-500">Augmentez la lisibilité des textes.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {[1.0, 1.2, 1.5].map((scale) => (
                                <button
                                    key={scale}
                                    onClick={() => setFontSizeScale(scale)}
                                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${fontSizeScale === scale ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}
                                >
                                    {scale === 1.0 ? 'Standard' : scale === 1.2 ? 'Grand' : 'Très Grand'}
                                </button>
                            ))}
                        </div>
                    </div>
                </AppCard>

                <AppCard title="Paramètres Système" className="space-y-4">
                    <Toggle
                        checked={highContrast}
                        onChange={setHighContrast}
                        label="Haut Contraste"
                        description="Thème sombre avec contrastes accrus pour les besoins de vision."
                        icon={Zap}
                    />
                    <Toggle
                        checked={reduceMotion}
                        onChange={setReduceMotion}
                        label="Réduction des mouvements"
                        description="Limite les animations pour aider à la concentration (TDAH)."
                        icon={Zap}
                    />
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
                                    <Volume2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Vitesse de l'IA</h4>
                                    <p className="text-xs text-slate-500">Ajustez la vitesse de diction de l'assistant.</p>
                                </div>
                            </div>
                            <span className="text-xs font-black text-indigo-600">{speechRate}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.8"
                            max="1.5"
                            step="0.1"
                            value={speechRate}
                            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Plus lent</span>
                            <span>Défaut</span>
                            <span>Plus vite</span>
                        </div>
                    </div>
                </AppCard>
            </div>

            <AppCard className="bg-amber-50 border-amber-100">
                <h4 className="font-bold text-amber-800 text-sm mb-2">💡 Conseil Pédagogique</h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                    Pour un enfant présentant des troubles de type <strong>Dyslexie</strong>, l'activation de la police <em>Lexend</em> et de la <em>Règle de lecture</em> peut réduire significativement la charge cognitive et le stress lié à la lecture.
                </p>
            </AppCard>
        </div>
    );
}
