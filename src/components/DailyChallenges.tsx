import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Brain, ChevronRight, CheckCircle2, Sparkles, Lightbulb, Palette, Globe, Rocket, Leaf, History, FlaskConical } from 'lucide-react';
import { dailyChallengeService, DailyChallenges as DailyChallengesType } from '../services/dailyChallengeService';

interface DailyChallengesProps {
    childId: string;
    gradeLevel: string;
    onEarnPoints: (amount: number, activityType: string, subject: string) => void;
}

const THEMES = [
    { id: 'Général', label: 'Aléatoire', icon: Globe, color: 'from-blue-500 to-indigo-500' },
    { id: 'Espace', label: 'Espace', icon: Rocket, color: 'from-purple-600 to-indigo-700' },
    { id: 'Nature', label: 'Nature', icon: Leaf, color: 'from-emerald-500 to-teal-600' },
    { id: 'Histoire', label: 'Histoire', icon: History, color: 'from-amber-600 to-orange-700' },
    { id: 'Sciences', label: 'Sciences', icon: FlaskConical, color: 'from-cyan-500 to-blue-600' },
];

export default function DailyChallenges({ childId, gradeLevel, onEarnPoints }: DailyChallengesProps) {
    const [theme, setTheme] = useState(localStorage.getItem('preferred_challenge_theme') || 'Général');
    const [challenges, setChallenges] = useState<DailyChallengesType | null>(null);
    const [loading, setLoading] = useState(true);
    const [revealProblem, setRevealProblem] = useState(false);

    useEffect(() => {
        async function fetchChallenges() {
            if (!childId) return;
            setLoading(true);
            const data = await dailyChallengeService.getChallenges(childId, gradeLevel, theme);
            setChallenges(data);
            setRevealProblem(data?.problemCompleted || false);
            setLoading(false);
        }
        fetchChallenges();
    }, [childId, gradeLevel, theme]);

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('preferred_challenge_theme', newTheme);
    };

    const handleWordDone = async () => {
        if (challenges?.id && !challenges.wordCompleted) {
            await dailyChallengeService.completeWord(childId, challenges.id);
            setChallenges({ ...challenges, wordCompleted: true });
            onEarnPoints(5, 'daily_challenge', 'French');
        }
    };

    const handleProblemDone = async () => {
        if (challenges?.id && !challenges.problemCompleted) {
            await dailyChallengeService.completeProblem(childId, challenges.id);
            setChallenges({ ...challenges, problemCompleted: true });
            onEarnPoints(10, 'daily_challenge', 'Math');
        }
        setRevealProblem(true);
    };

    return (
        <div className="space-y-8">
            {/* Header section with Theme Selector */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-wider uppercase text-xs">
                        <Palette className="w-4 h-4" />
                        Défis Personnalisés
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Tes missions <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI du jour</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Choisis ton thème favori pour les défis d'aujourd'hui !</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleThemeChange(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${theme === t.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30'
                                }`}
                        >
                            <t.icon className={`w-4 h-4 ${theme === t.id ? 'text-white' : 'text-slate-400'}`} />
                            {t.label}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-64 bg-slate-100 rounded-[3rem] animate-pulse" />
                    ))}
                </div>
            ) : !challenges ? (
                <div className="p-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 font-bold">Impossible de générer tes défis. Vérifie ta connexion !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Word of the Day */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[3rem] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 h-full flex flex-col relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
                                        <BookOpen className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Le Mot Magistral</h3>
                                        <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest">Français & Vocabulaire</p>
                                    </div>
                                </div>
                                {challenges.wordCompleted && (
                                    <div className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Appris !
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <h4 className="text-4xl font-black text-indigo-600 capitalize">{challenges.word.word}</h4>
                                <p className="text-slate-600 text-lg font-medium leading-relaxed">
                                    {challenges.word.definition}
                                </p>
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative group/quote">
                                    <div className="absolute -top-3 left-6 px-3 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase">Exemple d'usage</div>
                                    <p className="text-slate-500 italic font-medium leading-relaxed">
                                        "{challenges.word.example}"
                                    </p>
                                </div>
                            </div>

                            {!challenges.wordCompleted ? (
                                <button
                                    onClick={handleWordDone}
                                    className="mt-10 w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    C'est dans ma poche ! (+5⭐)
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <div className="mt-10 flex flex-wrap gap-2 pt-6 border-t border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Synonymes :</span>
                                    {challenges.word.synonyms?.map(s => (
                                        <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{s}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Problem of the Day */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="group relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-[3rem] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 h-full flex flex-col relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-xl shadow-orange-100">
                                        <Brain className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Le Grand Casse-Tête</h3>
                                        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest">Maths & Logique</p>
                                    </div>
                                </div>
                                {challenges.problemCompleted && (
                                    <div className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Résolu !
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border border-orange-100 mb-6">
                                    <p className="text-slate-800 font-bold text-xl leading-relaxed">
                                        {challenges.problem.question}
                                    </p>
                                </div>

                                <AnimatePresence>
                                    {revealProblem && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="space-y-4"
                                        >
                                            <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-3xl flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">La Solution</p>
                                                    <p className="text-xl font-black text-emerald-700">{challenges.problem.answer}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white border-2 border-orange-100 p-6 rounded-3xl flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                    <Lightbulb className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-orange-800 uppercase tracking-widest mb-1">Le secret de la réponse</p>
                                                    <p className="text-slate-600 font-medium leading-relaxed">{challenges.problem.explanation}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {!challenges.problemCompleted ? (
                                <button
                                    onClick={handleProblemDone}
                                    className="mt-10 w-full py-5 rounded-2xl bg-orange-500 text-white font-black text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Vérifier ma réponse (+10⭐)
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : !revealProblem && (
                                <button
                                    onClick={() => setRevealProblem(true)}
                                    className="mt-10 w-full py-5 rounded-2xl bg-slate-100 text-slate-600 font-black text-lg hover:bg-slate-200 transition-all"
                                >
                                    Afficher le corrigé
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
