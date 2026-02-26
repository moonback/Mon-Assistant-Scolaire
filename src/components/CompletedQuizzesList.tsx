import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Star, ChevronRight, Brain, ChevronDown, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CompletedQuizzesList({ childId, limit }: { childId?: string, limit?: number }) {
    const { selectedChild } = useAuth();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

    const targetId = childId || selectedChild?.id;

    useEffect(() => {
        // If childId is 'all' or no specific child is selected/provided (targetId is undefined), fetch all.
        // Otherwise, fetch for the specific targetId.

        let query = supabase.from('completed_quizzes')
            .select('*, children(name)')
            .order('created_at', { ascending: false });

        if (targetId && targetId !== 'all') {
            query = query.eq('child_id', targetId);
        }

        if (limit) {
            query = query.limit(limit);
        }

        query.then(({ data }) => {
            setQuizzes(data || []);
            setLoading(false);
        });
    }, [targetId, limit]);

    if (loading) return null;
    if (!quizzes.length) return (
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-center text-slate-500 text-sm font-semibold">
            <Brain className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            Aucun quiz terminé pour le moment.
        </div>
    );

    return (
        <div className="space-y-4">
            {quizzes.map((quiz, i) => {
                const isExpanded = expandedQuizId === quiz.id;
                return (
                    <motion.div
                        key={quiz.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${isExpanded ? 'border-indigo-200' : 'border-slate-100 hover:border-indigo-100'}`}
                    >
                        <div
                            className="flex items-center justify-between p-5 cursor-pointer"
                            onClick={() => setExpandedQuizId(isExpanded ? null : quiz.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                                    <Trophy className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 tracking-tight capitalize">{quiz.topic}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {quiz.children?.name ? `${quiz.children.name} • ` : ''}{new Date(quiz.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        <span className="text-sm font-black text-amber-700">{quiz.stars_earned}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 mr-1">
                                        {quiz.score}/{quiz.questions.length} Corrects
                                    </p>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-indigo-50 bg-indigo-50/20"
                                >
                                    <div className="p-6 space-y-6">
                                        {quiz.questions.map((q: any, qIdx: number) => (
                                            <div key={qIdx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                                <p className="text-sm font-bold text-slate-800 mb-4 tracking-tight"><span className="text-indigo-500 mr-2">{qIdx + 1}.</span> {q.question}</p>

                                                {q.type === 'open' ? (
                                                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex gap-3">
                                                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-1">Réponse attendue</p>
                                                            <p className="text-sm font-semibold text-emerald-900 leading-relaxed">{q.correctAnswerText || q.explanation}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {q.options?.map((opt: string, oIdx: number) => {
                                                            const isCorrect = oIdx === q.correctAnswer;
                                                            return (
                                                                <div
                                                                    key={oIdx}
                                                                    className={`flex items-center gap-3 p-3 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                                                                >
                                                                    {isCorrect ? (
                                                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                    ) : (
                                                                        <div className="w-4 h-4 rounded-full bg-slate-200 shrink-0" />
                                                                    )}
                                                                    <span className={`text-xs font-bold leading-tight ${isCorrect ? 'text-emerald-800' : 'text-slate-500'}`}>{opt}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {q.explanation && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 items-start">
                                                        <span className="text-lg leading-none">💡</span>
                                                        <p className="text-[11px] font-semibold text-slate-500 leading-relaxed italic">{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
