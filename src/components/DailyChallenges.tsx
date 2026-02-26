import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Brain, ChevronRight, CheckCircle2, Sparkles, Lightbulb, Palette, Globe, Rocket, Leaf, History, FlaskConical } from 'lucide-react';
import { dailyChallengeService, DailyChallenges as DailyChallengesType } from '../services/dailyChallengeService';
import { useAuth } from '../contexts/AuthContext';
import SectionHeader from './ui/SectionHeader';
import AppButton from './ui/AppButton';
import AppCard from './ui/AppCard';
import EmptyStateKid from './ui/EmptyStateKid';

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
    { id: 'Géographie', label: 'Géo', icon: Globe, color: 'from-sky-400 to-blue-500' },
    { id: 'Code', label: 'Code', icon: Brain, color: 'from-slate-700 to-slate-900' },
    { id: 'Art', label: 'Art', icon: Palette, color: 'from-pink-500 to-rose-600' },
];

export default function DailyChallenges({ childId, gradeLevel, onEarnPoints }: DailyChallengesProps) {
    const { selectedChild } = useAuth();

    // Filter themes based on allowed subjects
    const filteredThemes = THEMES.filter(t => {
        if (!selectedChild?.allowed_subjects?.length) return true;
        if (t.id === 'Général') return true;
        return selectedChild.allowed_subjects.includes(t.id);
    });

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
            <SectionHeader
                title="Missions Magiques ✨"
                subtitle="Tes défis personnalisés générés par l'IA."
                action={
                    <div className="flex flex-wrap gap-2">
                        {filteredThemes.map((t) => (
                            <AppButton
                                key={t.id}
                                onClick={() => handleThemeChange(t.id)}
                                variant={theme === t.id ? 'primary' : 'secondary'}
                                className="px-3 text-xs uppercase tracking-widest"
                                leftIcon={<t.icon className="h-3.5 w-3.5" />}
                            >
                                {t.label}
                            </AppButton>
                        ))}
                    </div>
                }
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-64 bg-slate-100 rounded-[3rem] animate-pulse" />
                    ))}
                </div>
            ) : !challenges ? (
                <EmptyStateKid
                    icon={<Sparkles className="h-6 w-6" />}
                    title="Impossible de générer tes défis"
                    description="Vérifie ta connexion puis réessaie dans quelques instants."
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Word of the Day */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                        <AppCard className="h-full flex flex-col relative overflow-hidden rounded-[2.5rem] p-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1">Vocabulaire ✨</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Challenge Littéraire</p>
                                    </div>
                                </div>
                                {challenges.wordCompleted && (
                                    <div className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Appris !
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4 relative z-10 mt-6">
                                <h4 className="text-2xl font-black text-indigo-600 tracking-tight leading-none uppercase">{challenges.word.word}</h4>
                                <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                                    {challenges.word.definition}
                                </p>
                                <div className="bg-slate-50/50 p-5 rounded-2xl border border-white shadow-inner relative group/quote">
                                    <p className="text-slate-400 italic font-bold text-xs leading-relaxed">
                                        "{challenges.word.example}"
                                    </p>
                                </div>
                            </div>

                            {!challenges.wordCompleted ? (
                                <AppButton
                                    onClick={handleWordDone}
                                    className="relative z-10 mt-8 w-full text-xs uppercase tracking-widest"
                                    rightIcon={<ChevronRight className="h-4 w-4" />}
                                >
                                    C'est dans la poche !
                                </AppButton>
                            ) : (
                                <div className="mt-10 flex flex-wrap gap-2 pt-6 border-t border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Synonymes :</span>
                                    {challenges.word.synonyms?.map(s => (
                                        <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{s}</span>
                                    ))}
                                </div>
                            )}
                        </AppCard>
                    </motion.div>

                    {/* Problem of the Day */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="group relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-[2.5rem] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                        <AppCard className="h-full flex flex-col relative overflow-hidden rounded-[2.5rem] p-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1">Logique ✨</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Casse-tête du jour</p>
                                    </div>
                                </div>
                                {challenges.problemCompleted && (
                                    <div className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Résolu !
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 relative z-10 mt-6">
                                <div className="bg-orange-50/30 p-6 rounded-2xl border border-white shadow-inner mb-6">
                                    <p className="text-slate-800 font-bold text-sm leading-relaxed">
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
                                <AppButton
                                    onClick={handleProblemDone}
                                    className="relative z-10 mt-8 w-full bg-orange-500 text-xs uppercase tracking-widest hover:bg-orange-600"
                                    rightIcon={<ChevronRight className="h-4 w-4" />}
                                >
                                    Vérifier la réponse
                                </AppButton>
                            ) : !revealProblem && (
                                <AppButton
                                    onClick={() => setRevealProblem(true)}
                                    variant="secondary"
                                    className="mt-10 w-full text-base"
                                >
                                    Afficher le corrigé
                                </AppButton>
                            )}
                        </AppCard>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
