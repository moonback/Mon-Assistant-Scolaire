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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="group relative"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3.5rem] blur opacity-15 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white/90 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/50 h-full flex flex-col shadow-premium">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
                                <BookOpen className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Le Mot du Jour</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Enrichis ton vocabulaire</p>
                                </div>
                            </div>
                        </div>
                        {challenges.wordCompleted ? (
                            <div className="bg-emerald-50 p-2 rounded-full ring-4 ring-emerald-50/50">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>
                        ) : (
                            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+5 ⭐</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="relative inline-block">
                            <h2 className="text-4xl font-black text-slate-900 capitalize tracking-tight relative z-10">{challenges.word.word}</h2>
                            <div className="absolute bottom-1 left-0 w-full h-3 bg-indigo-100/50 -z-0 rounded-full" />
                        </div>

                        <p className="text-slate-600 font-medium text-lg leading-relaxed">
                            {challenges.word.definition}
                        </p>

                        <div className="bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100 relative group/example">
                            <Lightbulb className="absolute -top-3 -right-3 w-8 h-8 text-amber-300 opacity-30 group-hover/example:rotate-12 transition-transform" />
                            <p className="text-slate-500 text-sm italic leading-relaxed">
                                &quot;{challenges.word.example}&quot;
                            </p>
                        </div>
                    </div>

                    {!challenges.wordCompleted && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleWordDone}
                            className="mt-8 w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl group/btn"
                        >
                            <Sparkles className="w-4 h-4 text-indigo-400 group-hover/btn:rotate-12 transition-transform" />
                            J&apos;ai appris ce mot !
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* Problem of the Day */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-600 rounded-[3.5rem] blur opacity-15 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white/90 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/50 h-full flex flex-col shadow-premium">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-100 ring-4 ring-orange-50">
                                <Brain className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Le Défi du Jour</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Fais chauffer tes méninges</p>
                                </div>
                            </div>
                        </div>
                        {challenges.problemCompleted ? (
                            <div className="bg-emerald-50 p-2 rounded-full ring-4 ring-emerald-50/50">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>
                        ) : (
                            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+10 ⭐</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 mb-6">
                            <p className="text-slate-800 font-bold text-lg leading-relaxed">
                                {challenges.problem.question}
                            </p>
                        </div>

                        <AnimatePresence>
                            {revealProblem && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    <div className="bg-emerald-50/80 border border-emerald-100 p-5 rounded-[2rem] flex items-start gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                            <Sparkles className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">La Solution</p>
                                            <p className="text-lg font-black text-emerald-900 tracking-tight">{challenges.problem.answer}</p>
                                        </div>
                                    </div>
                                    <div className="bg-orange-50/80 border border-orange-100 p-5 rounded-[2rem] flex items-start gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                            <Lightbulb className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-1">L&apos;Explication</p>
                                            <p className="text-sm font-medium text-orange-900/80 leading-relaxed">{challenges.problem.explanation}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {!challenges.problemCompleted ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleProblemDone}
                            className="mt-8 w-full py-5 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                            Révéler la réponse
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    ) : !revealProblem && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRevealProblem(true)}
                            className="mt-8 w-full py-5 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                        >
                            Voir l&apos;explication complète
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
