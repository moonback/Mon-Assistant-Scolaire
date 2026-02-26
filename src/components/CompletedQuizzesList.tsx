import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Star, ChevronRight, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CompletedQuizzesList({ childId, limit }: { childId?: string, limit?: number }) {
    const { selectedChild } = useAuth();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            {quizzes.map((quiz, i) => (
                <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-5 bg-white border border-slate-100 shadow-sm rounded-3xl hover:border-indigo-100 transition-colors"
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

                    <div className="text-right">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-black text-amber-700">{quiz.stars_earned}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 mr-1">
                            {quiz.score}/{quiz.questions.length} Corrects
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
