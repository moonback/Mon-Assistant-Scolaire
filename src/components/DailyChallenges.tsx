import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Brain, ChevronRight, CheckCircle2, Sparkles, Lightbulb } from 'lucide-react';
import { dailyChallengeService, DailyChallenges as DailyChallengesType } from '../services/dailyChallengeService';

interface DailyChallengesProps {
    childId: string;
    gradeLevel: string;
    onEarnPoints: (amount: number, activityType: string, subject: string) => void;
}

export default function DailyChallenges({ childId, gradeLevel, onEarnPoints }: DailyChallengesProps) {
    const [challenges, setChallenges] = useState<DailyChallengesType | null>(null);
    const [loading, setLoading] = useState(true);
    const [revealProblem, setRevealProblem] = useState(false);

    useEffect(() => {
        async function fetchChallenges() {
            if (!childId) return;
            setLoading(true);
            const data = await dailyChallengeService.getChallenges(childId, gradeLevel);
            setChallenges(data);
            setRevealProblem(data?.problemCompleted || false);
            setLoading(false);
        }
        fetchChallenges();
    }, [childId, gradeLevel]);

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

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                <div className="h-48 bg-slate-100 rounded-[2rem]"></div>
                <div className="h-48 bg-slate-100 rounded-[2rem]"></div>
            </div>
        );
    }

    if (!challenges) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Word of the Day */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-[2.5rem] -z-10 group-hover:scale-105 transition-transform duration-500" />
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] border border-indigo-100 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 leading-tight">Le Mot du Jour</h3>
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Enrichis ton vocabulaire</p>
                            </div>
                        </div>
                        {challenges.wordCompleted && (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        )}
                    </div>

                    <div className="flex-1">
                        <h2 className="text-3xl font-black text-indigo-600 mb-2 capitalize">{challenges.word.word}</h2>
                        <p className="text-slate-600 font-medium text-sm leading-relaxed mb-4">
                            {challenges.word.definition}
                        </p>
                        <div className="bg-slate-50 p-3 rounded-2xl italic text-xs text-slate-500 border border-slate-100">
                            "{challenges.word.example}"
                        </div>
                    </div>

                    {!challenges.wordCompleted && (
                        <button
                            onClick={handleWordDone}
                            className="mt-6 w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
                        >
                            J'ai appris ce mot !
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Problem of the Day */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-[2.5rem] -z-10 group-hover:scale-105 transition-transform duration-500" />
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] border border-orange-100 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200">
                                <Brain className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 leading-tight">Le Défi du Jour</h3>
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Fais chauffer tes méninges</p>
                            </div>
                        </div>
                        {challenges.problemCompleted && (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        )}
                    </div>

                    <div className="flex-1">
                        <p className="text-slate-700 font-bold text-base leading-relaxed mb-4">
                            {challenges.problem.question}
                        </p>

                        <AnimatePresence>
                            {revealProblem && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3"
                                >
                                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-start gap-2">
                                        <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-black text-emerald-800 uppercase tracking-tighter">Réponse</p>
                                            <p className="text-sm font-bold text-emerald-700">{challenges.problem.answer}</p>
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl flex items-start gap-2">
                                        <Lightbulb className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-black text-orange-800 uppercase tracking-tighter">Explication</p>
                                            <p className="text-xs font-medium text-orange-700 leading-tight">{challenges.problem.explanation}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {!challenges.problemCompleted ? (
                        <button
                            onClick={handleProblemDone}
                            className="mt-6 w-full py-3 rounded-2xl bg-orange-500 text-white font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2 group"
                        >
                            Voir la réponse
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : !revealProblem && (
                        <button
                            onClick={() => setRevealProblem(true)}
                            className="mt-6 w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Afficher le corrigé
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
