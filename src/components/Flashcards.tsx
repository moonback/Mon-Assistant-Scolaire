import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Layers, RefreshCcw, CheckCircle2, XCircle,
    Lightbulb, Zap, ArrowRight, BookOpen, Brain,
    PenLine, Eye, Star
} from 'lucide-react';
import {
    generateFlashcards,
    getDueCards,
    getChildSubjects,
    rateCard,
    saveSession,
    getCollection,
    validateFlashcardAnswer,
    followUpValidation,
    Flashcard,
} from '../services/flashcardService';

interface FlashcardsProps {
    childId: string;
    gradeLevel: string;
    onEarnPoints: (amount: number, activityType: string, subject?: string) => void;
}

const SUBJECT_THEMES: Record<string, { color: string; icon: string }> = {
    'Mathématiques': { color: 'from-blue-500 to-indigo-600', icon: '🔢' },
    'Maths': { color: 'from-blue-500 to-indigo-600', icon: '🔢' },
    'Français': { color: 'from-purple-500 to-pink-600', icon: '📖' },
    'Sciences': { color: 'from-emerald-500 to-teal-600', icon: '🔬' },
    'Histoire': { color: 'from-amber-500 to-orange-600', icon: '🏛️' },
    'Géographie': { color: 'from-cyan-500 to-sky-600', icon: '🌍' },
    'Lecture': { color: 'from-rose-500 to-red-600', icon: '📚' },
    'Résolution de problèmes': { color: 'from-violet-500 to-purple-600', icon: '🧩' },
};

function getTheme(subject: string) {
    return SUBJECT_THEMES[subject] || { color: 'from-teal-500 to-cyan-600', icon: '⭐' };
}

// CardStep defines the 3-step flow for each card
// 1. 'question' — show the question, child writes their answer
// 2. 'reveal'   — show correct answer alongside child's answer
type CardStep = 'question' | 'reveal';
type Phase = 'select' | 'loading' | 'session' | 'result' | 'collection';

export default function Flashcards({ childId, gradeLevel, onEarnPoints }: FlashcardsProps) {
    const [phase, setPhase] = useState<Phase>('select');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardStep, setCardStep] = useState<CardStep>('question');
    const [childAnswer, setChildAnswer] = useState('');
    const [showHint, setShowHint] = useState(false);
    const [results, setResults] = useState<{ card: Flashcard; success: boolean; childAnswer: string }[]>([]);
    const [sessionPoints, setSessionPoints] = useState(0);
    const [dueCount, setDueCount] = useState(0);
    const [collectionCards, setCollectionCards] = useState<any[]>([]);
    const [aiFeedback, setAiFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [history, setHistory] = useState<{ child: string; ai: string }[]>([]);
    const [followUp, setFollowUp] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        async function loadData() {
            if (!childId) return;
            const [childSubjects, due] = await Promise.all([
                getChildSubjects(childId),
                getDueCards(childId),
            ]);
            setSubjects(childSubjects);
            setDueCount(due.length);
        }
        loadData();
    }, [childId]);

    // Auto-focus textarea when question step appears
    useEffect(() => {
        if (cardStep === 'question' && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 350);
        }
    }, [cardStep, currentIndex]);

    const resetCard = () => {
        setCardStep('question');
        setChildAnswer('');
        setShowHint(false);
        setAiFeedback(null);
        setHistory([]);
        setFollowUp('');
    };

    const startSession = useCallback(async (subject: string) => {
        setSelectedSubject(subject);
        setPhase('loading');
        setCards([]);
        setCurrentIndex(0);
        resetCard();
        setResults([]);
        setSessionPoints(0);
        const generated = await generateFlashcards(gradeLevel, subject);
        setCards(generated);
        setPhase('session');
    }, [gradeLevel]);

    const startReviewSession = useCallback(async () => {
        setSelectedSubject('Révision SRS');
        setPhase('loading');
        const due = await getDueCards(childId);
        if (due.length === 0) { setPhase('select'); return; }
        const flashcards: Flashcard[] = due.map(d => ({
            front: d.front || `Explique la notion : ${d.notion}`,
            back: d.back || `Notion de ${d.subject} : ${d.notion}`,
            hint: d.hint || `C'est en rapport avec ${d.subject}.`,
            subject: d.subject,
        }));
        setCards(flashcards);
        setPhase('session');
    }, [childId]);

    const handleReveal = async () => {
        if (!childAnswer.trim()) return;
        setIsValidating(true);
        setCardStep('reveal');
        const validation = await validateFlashcardAnswer(
            gradeLevel,
            cards[currentIndex].front,
            cards[currentIndex].back,
            childAnswer
        );
        setAiFeedback(validation);
        setHistory([{ child: childAnswer, ai: validation.feedback }]);
        setIsValidating(false);
    };

    const handleFollowUp = async () => {
        if (!followUp.trim()) return;
        setIsValidating(true);
        const nextAnswer = followUp.trim();
        setFollowUp('');
        const validation = await followUpValidation(
            gradeLevel,
            cards[currentIndex].front,
            cards[currentIndex].back,
            history,
            nextAnswer
        );
        setAiFeedback(validation);
        setHistory(prev => [...prev, { child: nextAnswer, ai: validation.feedback }]);
        setIsValidating(false);
    };

    const handleRate = useCallback(async (success: boolean) => {
        const current = cards[currentIndex];
        const points = success ? 5 : 2;
        const newResults = [...results, { card: current, success, childAnswer }];
        setResults(newResults);

        await rateCard(childId, {
            notion: current.front,
            subject: current.subject,
            front: current.front,
            back: current.back,
            hint: current.hint,
            last_answer: childAnswer
        }, success);

        if (currentIndex < cards.length - 1) {
            setCurrentIndex(i => i + 1);
            resetCard();
        } else {
            const totalPoints = newResults.filter(r => r.success).length * 5
                + newResults.filter(r => !r.success).length * 2;
            onEarnPoints(totalPoints, 'flashcard', selectedSubject);
            await saveSession(childId, cards, totalPoints);
            setSessionPoints(totalPoints);
            setPhase('result');
        }
    }, [cards, currentIndex, childId, results, childAnswer, onEarnPoints, selectedSubject]);

    const currentCard = cards[currentIndex];
    const theme = getTheme(selectedSubject);
    const progressPct = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

    // ───────────────────────────────────────────────
    // PHASE: SELECT
    // ───────────────────────────────────────────────
    if (phase === 'select') {
        return (
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mes Flashcards 📚</h1>
                        <p className="text-slate-500 font-semibold text-sm">Écris ta réponse avant de voir le corrigé.</p>
                    </div>
                </header>

                {dueCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-6 rounded-[2.5rem] bg-gradient-to-r from-amber-500 to-orange-500 text-white cursor-pointer shadow-xl shadow-orange-100 flex items-center justify-between group overflow-hidden relative"
                        onClick={startReviewSession}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-colors" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner border border-white/30">
                                <Zap className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">⚡ Révisions prioritaires</p>
                                <h3 className="font-black text-xl tracking-tight">{dueCount} notion{dueCount > 1 ? 's' : ''} à consolider</h3>
                                <p className="text-xs font-bold opacity-90">Ne les laisse pas s'échapper de ton cerveau !</p>
                            </div>
                        </div>
                        <ArrowRight className="h-8 w-8 opacity-40 shrink-0 group-hover:translate-x-2 transition-transform" />
                    </motion.div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Collection Button */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }}
                        onClick={async () => {
                            setPhase('loading');
                            const coll = await getCollection(childId);
                            setCollectionCards(coll);
                            setPhase('collection');
                        }}
                        className="premium-card p-7 text-left flex flex-col items-center justify-center gap-5 border-none shadow-sm group bg-slate-900 overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow-inner relative z-10">
                            📚
                        </div>
                        <div className="text-center relative z-10">
                            <p className="font-black text-white text-base tracking-tight mb-0.5">Ma Collection</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Voir tes cartes</p>
                        </div>
                    </motion.button>

                    {subjects.map((subject, i) => {
                        const th = getTheme(subject);
                        return (
                            <motion.button
                                key={subject}
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.07 }}
                                whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }}
                                onClick={() => startSession(subject)}
                                className="premium-card p-7 text-left flex flex-col items-center justify-center gap-5 border-none shadow-sm group"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${th.color} flex items-center justify-center text-3xl shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform duration-500`}>
                                    {th.icon}
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-900 text-base tracking-tight mb-0.5">{subject}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">5 nouvelles cartes</p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ───────────────────────────────────────────────
    // PHASE: LOADING
    // ───────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50/30">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 mb-6"
                />
                <h3 className="text-lg font-black text-slate-800 mb-2">L'IA prépare tes cartes...</h3>
                <p className="text-xs text-slate-500 font-semibold">Génération de 5 flashcards sur {selectedSubject}</p>
            </div>
        );
    }

    // ───────────────────────────────────────────────
    // PHASE: RESULT
    // ───────────────────────────────────────────────
    if (phase === 'result') {
        const successCount = results.filter(r => r.success).length;
        const pct = Math.round((successCount / results.length) * 100);
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="premium-card p-10 text-center mb-8 border-none shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

                        <div className="text-6xl mb-6 relative z-10 drop-shadow-md">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}</div>
                        <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight relative z-10">Session terminée !</h2>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-8 relative z-10">{selectedSubject}</p>

                        <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50 shadow-inner">
                                <p className="text-2xl font-black text-emerald-600 tracking-tight">{successCount}</p>
                                <p className="text-[10px] font-black uppercase text-emerald-400 leading-none mt-1">Réussies</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100/50 shadow-inner">
                                <p className="text-2xl font-black text-rose-600 tracking-tight">{results.length - successCount}</p>
                                <p className="text-[10px] font-black uppercase text-rose-400 leading-none mt-1">À revoir</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50 shadow-inner">
                                <div className="flex items-center justify-center gap-1">
                                    <p className="text-2xl font-black text-indigo-600 tracking-tight">+{sessionPoints}</p>
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                </div>
                                <p className="text-[10px] font-black uppercase text-indigo-400 leading-none mt-1">Points</p>
                            </div>
                        </div>

                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner relative z-10">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="h-full bg-indigo-500 rounded-full"
                            />
                        </div>

                        <div className="flex gap-4 relative z-10">
                            <button onClick={() => startSession(selectedSubject)}
                                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                                <RefreshCcw className="h-4 w-4 inline mr-2" /> Rejouer
                            </button>
                            <button onClick={() => setPhase('select')}
                                className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">
                                Choisir
                            </button>
                        </div>
                    </motion.div>

                    {/* Detailed review of each card */}
                    <div className="space-y-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Détail de la session</p>
                        {results.map((r, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-5 rounded-2xl flex gap-4 ${r.success ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.success ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                    {r.success ? <CheckCircle2 className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white" />}
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-xs font-black text-slate-700 mb-1 truncate">{r.card.front}</p>
                                    <p className="text-[11px] text-slate-500 font-bold">Ta réponse : <span className="italic">"{r.childAnswer || '(vide)'}"</span></p>
                                    <p className="text-[11px] text-teal-600 font-bold mt-1">Corrigé : {r.card.back}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ───────────────────────────────────────────────
    // PHASE: COLLECTION
    // ───────────────────────────────────────────────
    if (phase === 'collection') {
        return (
            <div className="min-h-screen bg-slate-50 p-6 md:p-10">
                <div className="max-w-4xl mx-auto">
                    <header className="flex items-center justify-between mb-10">
                        <div>
                            <button onClick={() => setPhase('select')} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 mb-2 block transition-colors">
                                ← Retour
                            </button>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ma Collection ✨</h1>
                            <p className="text-slate-500 font-semibold text-sm">Tes trésors de connaissances appris avec Magic.</p>
                        </div>
                        <div className="premium-card px-6 py-4 border-none shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
                                <Star className="h-6 w-6 fill-amber-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Mérite Total</p>
                                <p className="text-xl font-black text-slate-900 leading-none">
                                    {collectionCards.reduce((acc, card) => acc + (card.success_count || 0), 0)} ⭐
                                </p>
                            </div>
                        </div>
                    </header>

                    {collectionCards.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">Tu n'as pas encore de cartes dans ta collection.</p>
                            <button onClick={() => setPhase('select')} className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm">
                                Commencer à apprendre
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {collectionCards.map((card, i) => {
                                const th = getTheme(card.subject);
                                return (
                                    <motion.div
                                        key={card.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="premium-card p-8 border-none shadow-sm flex flex-col justify-between group overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-12 -mt-12 opacity-50 group-hover:bg-indigo-100 transition-colors" />
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${th.color} text-white text-[10px] font-black uppercase tracking-widest`}>
                                                    {card.subject}
                                                </div>
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <div key={idx} className={`w-2 h-2 rounded-full ${idx < card.mastery_level ? 'bg-amber-400' : 'bg-slate-100'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <h3 className="text-base font-black text-slate-900 mb-2 leading-tight tracking-tight relative z-10">{card.front || card.notion}</h3>
                                            <p className="text-xs text-slate-500 font-semibold line-clamp-2 italic mb-1 relative z-10">
                                                {card.back || 'Pas encore de corrigé détaillé.'}
                                            </p>
                                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-white mt-4 space-y-3 relative z-10 shadow-inner">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Dernier essai</p>
                                                    <p className="text-xs font-bold text-indigo-600 italic">"{card.last_answer || '(vide)'}"</p>
                                                </div>
                                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Émerveillement</p>
                                                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                                                        <span className="text-xs font-black text-amber-600">{card.success_count || 0}</span>
                                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">
                                                Dernière révision: {new Date(card.last_reviewed_at).toLocaleDateString()}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setCards([{
                                                        front: card.front || card.notion,
                                                        back: card.back || card.notion,
                                                        hint: card.hint || '',
                                                        subject: card.subject
                                                    }]);
                                                    setCurrentIndex(0);
                                                    setCardStep('question');
                                                    setPhase('session');
                                                }}
                                                className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                                            >
                                                <RefreshCcw className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ───────────────────────────────────────────────
    // PHASE: SESSION
    // ───────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setPhase('select')} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">
                        ← Retour
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{selectedSubject}</p>
                        <p className="font-black text-slate-900 tracking-tight">{currentIndex + 1} / {cards.length}</p>
                    </div>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentIndex}-${cardStep}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* ── STEP 1: QUESTION + text input ── */}
                        {cardStep === 'question' && (
                            <div className="space-y-4">
                                {/* Question card */}
                                <div className={`relative rounded-[2.5rem] bg-gradient-to-br ${theme.color} text-white shadow-2xl p-10 overflow-hidden`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                    <div className="flex items-center gap-2 mb-6 opacity-70 relative z-10">
                                        <Brain className="h-4 w-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Question n°{currentIndex + 1}</p>
                                    </div>
                                    <p className="text-xl font-black leading-tight tracking-tight relative z-10">{currentCard?.front}</p>
                                </div>

                                {/* Answer input area */}
                                <div className="premium-card p-8 border-none shadow-sm space-y-6">
                                    <div className="flex items-center gap-2">
                                        <PenLine className="h-4 w-4 text-indigo-500" />
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ton intelligence</p>
                                    </div>
                                    <textarea
                                        ref={textareaRef}
                                        value={childAnswer}
                                        onChange={e => setChildAnswer(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey && childAnswer.trim()) handleReveal(); }}
                                        placeholder="Écris ta réponse ici... (Ctrl + Entrée)"
                                        className="w-full h-32 resize-none outline-none text-slate-800 font-bold placeholder:text-slate-300 text-sm leading-relaxed bg-slate-50/50 rounded-2xl p-6 border-2 border-transparent focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                    />
                                    <div className="flex items-center justify-between pt-2">
                                        {/* Hint button */}
                                        <div className="min-h-[24px]">
                                            {!showHint ? (
                                                <button
                                                    onClick={() => setShowHint(true)}
                                                    className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:text-amber-600 transition"
                                                >
                                                    <Lightbulb className="h-4 w-4" /> Un indice ?
                                                </button>
                                            ) : (
                                                <p className="text-xs text-amber-600 font-bold italic">💡 {currentCard?.hint}</p>
                                            )}
                                        </div>

                                        {/* Reveal button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleReveal}
                                            disabled={!childAnswer.trim()}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${childAnswer.trim()
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                                                }`}
                                        >
                                            <Eye className="h-4 w-4" /> Voir la magie
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: REVEAL — side-by-side comparison ── */}
                        {cardStep === 'reveal' && (
                            <div className="space-y-4">
                                {/* Question reminder */}
                                <div className={`rounded-2xl bg-gradient-to-br ${theme.color} text-white/90 p-4 text-center`}>
                                    <p className="text-xs font-black opacity-70 uppercase tracking-widest mb-1">Question</p>
                                    <p className="font-black text-sm leading-relaxed">{currentCard?.front}</p>
                                </div>

                                {/* Comparison grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Child's answer */}
                                    <div className="bg-slate-50 rounded-3xl p-5 border-2 border-slate-100">
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <PenLine className="h-3.5 w-3.5 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ta réponse</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                            {childAnswer || <span className="text-slate-300">(rien écrit)</span>}
                                        </p>
                                    </div>

                                    {/* Correct answer */}
                                    <div className="bg-teal-50 rounded-3xl p-5 border-2 border-teal-100">
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <BookOpen className="h-3.5 w-3.5 text-teal-500" />
                                            <p className="text-[10px] font-black uppercase text-teal-500 tracking-widest">Corrigé</p>
                                        </div>
                                        <p className="text-sm font-black text-teal-800 leading-relaxed">{currentCard?.back}</p>
                                    </div>
                                </div>

                                {/* Self-evaluation prompt */}
                                <p className="text-center text-xs text-slate-500 font-bold py-1">
                                    Compare ta réponse. Est-ce que tu avais trouvé ?
                                </p>

                                {/* Action Area */}
                                <div className="flex flex-col gap-4">
                                    {/* AI Verdict */}
                                    <AnimatePresence>
                                        {(isValidating || aiFeedback) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`p-6 rounded-[2.5rem] border-none shadow-sm flex items-center gap-5 relative overflow-hidden group transition-all ${isValidating
                                                    ? 'bg-slate-50/50'
                                                    : aiFeedback?.isCorrect
                                                        ? 'bg-emerald-50/50'
                                                        : 'bg-amber-50/50'}`}
                                            >
                                                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-30 ${isValidating ? 'bg-slate-200' : aiFeedback?.isCorrect ? 'bg-emerald-200' : 'bg-amber-200'}`} />

                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner relative z-10 ${isValidating
                                                    ? 'bg-white'
                                                    : aiFeedback?.isCorrect
                                                        ? 'bg-emerald-500'
                                                        : 'bg-amber-500'}`}>
                                                    {isValidating ? <RefreshCcw className="h-7 w-7 text-indigo-400 animate-spin" /> :
                                                        aiFeedback?.isCorrect ? <CheckCircle2 className="h-7 w-7 text-white" /> : <Brain className="h-7 w-7 text-white" />}
                                                </div>
                                                <div className="flex-1 relative z-10">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">L'avis de Magic ✨</p>
                                                    <div className="space-y-2">
                                                        <p className={`text-sm font-black tracking-tight leading-tight ${isValidating ? 'text-slate-400' : 'text-slate-900'}`}>
                                                            {isValidating ? 'Magic analyse ta réponse...' : aiFeedback?.feedback}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Conversation / Next buttons overlay */}
                                    {aiFeedback && !isValidating && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            {/* Chat Input if Magic asks something or if not correct */}
                                            {!aiFeedback.isCorrect && (
                                                <div className="relative">
                                                    <textarea
                                                        value={followUp}
                                                        onChange={e => setFollowUp(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey && followUp.trim()) handleFollowUp(); }}
                                                        placeholder="Répondre à Magic ✨... (Ctrl+Entrée)"
                                                        className="w-full p-4 pr-12 rounded-3xl bg-white border-2 border-indigo-100 shadow-sm text-xs font-semibold resize-none h-20 outline-none focus:border-indigo-300 transition-all"
                                                    />
                                                    <button
                                                        onClick={handleFollowUp}
                                                        disabled={!followUp.trim()}
                                                        className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-30 transition-all"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <button
                                                    onClick={() => handleRate(aiFeedback.isCorrect)}
                                                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${aiFeedback.isCorrect
                                                        ? 'bg-indigo-600 text-white shadow-indigo-100'
                                                        : 'bg-slate-900 text-white shadow-slate-100'
                                                        }`}
                                                >
                                                    {aiFeedback.isCorrect ? 'C\'est gagné ! Suivant' : 'J\'ai compris ! Suivant'}
                                                    <ArrowRight className="h-4 w-4" />
                                                </button>

                                                {/* Small override for the child */}
                                                <button
                                                    onClick={() => handleRate(!aiFeedback.isCorrect)}
                                                    className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-indigo-500 transition-colors"
                                                >
                                                    {aiFeedback.isCorrect ? "Je me suis trompé en fait..." : "Je pense que Magic se trompe, j'avais raison !"}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {cards.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 ${i < results.length
                                ? results[i]?.success ? 'bg-emerald-400 w-3' : 'bg-rose-400 w-3'
                                : i === currentIndex ? 'bg-teal-500 w-5' : 'bg-slate-200 w-2'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
