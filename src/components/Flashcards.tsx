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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 p-6 md:p-10">
                <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200">
                                <Layers className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mes Flashcards</h1>
                                <p className="text-sm text-slate-500 font-medium">Écris ta réponse avant de voir le corrigé 🧠</p>
                            </div>
                        </div>
                    </motion.div>

                    {dueCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white cursor-pointer shadow-lg shadow-orange-200"
                            onClick={startReviewSession}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">⚡ Révisions urgentes</p>
                                    <h3 className="font-black text-xl">{dueCount} carte{dueCount > 1 ? 's' : ''} à revoir maintenant</h3>
                                    <p className="text-sm opacity-90 mt-1">Ces notions risquent de disparaître de ta mémoire !</p>
                                </div>
                                <ArrowRight className="h-8 w-8 opacity-80 shrink-0" />
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Collection Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
                            onClick={async () => {
                                setPhase('loading');
                                const coll = await getCollection(childId);
                                setCollectionCards(coll);
                                setPhase('collection');
                            }}
                            className="p-6 rounded-3xl bg-slate-900 border-2 border-slate-800 hover:shadow-xl transition-all text-left flex flex-col justify-between"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl mb-4 text-white">
                                📚
                            </div>
                            <div>
                                <p className="font-black text-white">Ma Collection</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Voir tes cartes apprises</p>
                            </div>
                        </motion.button>

                        {subjects.map((subject, i) => {
                            const th = getTheme(subject);
                            return (
                                <motion.button
                                    key={subject}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => startSession(subject)}
                                    className="p-6 rounded-3xl bg-white border-2 border-slate-100 hover:border-transparent hover:shadow-xl transition-all text-left group"
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${th.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                                        {th.icon}
                                    </div>
                                    <p className="font-black text-slate-800">{subject}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">5 cartes générées par IA</p>
                                </motion.button>
                            );
                        })}
                    </div>
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
                <h3 className="text-xl font-black text-slate-800 mb-2">L'IA prépare tes cartes...</h3>
                <p className="text-sm text-slate-500 font-medium">Génération de 5 flashcards sur {selectedSubject}</p>
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
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-[3rem] shadow-2xl shadow-teal-100 p-10 text-center mb-6"
                    >
                        <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}</div>
                        <h2 className="text-3xl font-black text-slate-900 mb-1">Session terminée !</h2>
                        <p className="text-slate-500 font-medium mb-6">{selectedSubject}</p>
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                <p className="text-3xl font-black text-emerald-600">{successCount}</p>
                                <p className="text-[10px] font-black uppercase text-emerald-400">Réussies</p>
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                                <p className="text-3xl font-black text-rose-600">{results.length - successCount}</p>
                                <p className="text-[10px] font-black uppercase text-rose-400">À revoir</p>
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                                <p className="text-3xl font-black text-amber-600">+{sessionPoints}</p>
                                <p className="text-[10px] font-black uppercase text-amber-400">Points</p>
                            </div>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full"
                            />
                        </div>
                        <p className="text-sm font-bold text-slate-500 mb-8">{pct}% de réussite</p>
                        <div className="flex gap-3">
                            <button onClick={() => startSession(selectedSubject)}
                                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-200 hover:scale-[1.02] transition-transform">
                                <RefreshCcw className="h-4 w-4 inline mr-2" /> Rejouer
                            </button>
                            <button onClick={() => setPhase('select')}
                                className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition">
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
                    <header className="flex items-center justify-between mb-8">
                        <div>
                            <button onClick={() => setPhase('select')} className="text-slate-500 text-sm font-bold hover:text-slate-800 mb-2 block">
                                ← Retour
                            </button>
                            <h1 className="text-3xl font-black text-slate-900">Ma Collection 📚</h1>
                            <p className="text-sm text-slate-500 font-medium">Toutes les notions que tu as déjà travaillées.</p>
                        </div>
                        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <Star className="h-6 w-6 fill-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Total Réussites</p>
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
                                        className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between"
                                    >
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
                                            <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight">{card.front || card.notion}</h3>
                                            <p className="text-sm text-slate-600 font-medium line-clamp-2 italic mb-1">
                                                {card.back || 'Pas encore de corrigé détaillé.'}
                                            </p>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2 space-y-2">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Ta dernière réponse :</p>
                                                    <p className="text-xs font-bold text-indigo-600 italic">"{card.last_answer || '(vide)'}"</p>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                                                    <p className="text-[10px] font-black uppercase text-slate-400">Étoiles gagnées :</p>
                                                    <p className="text-xs font-black text-amber-600 flex items-center gap-1">
                                                        {card.success_count || 0} <Star className="h-3 w-3 fill-amber-500" />
                                                    </p>
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
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setPhase('select')} className="text-slate-500 text-sm font-bold hover:text-slate-800 transition">
                        ← Retour
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{selectedSubject}</p>
                        <p className="font-black text-slate-700">{currentIndex + 1} / {cards.length}</p>
                    </div>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
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
                                <div className={`rounded-[2.5rem] bg-gradient-to-br ${theme.color} text-white shadow-2xl p-8`}>
                                    <div className="flex items-center gap-2 mb-5 opacity-70">
                                        <Brain className="h-4 w-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Question n°{currentIndex + 1}</p>
                                    </div>
                                    <p className="text-xl font-black leading-relaxed">{currentCard?.front}</p>
                                </div>

                                {/* Answer input area */}
                                <div className="bg-white rounded-3xl border-2 border-slate-100 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <PenLine className="h-4 w-4 text-teal-500" />
                                        <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Écris ta réponse</p>
                                    </div>
                                    <textarea
                                        ref={textareaRef}
                                        value={childAnswer}
                                        onChange={e => setChildAnswer(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey && childAnswer.trim()) handleReveal(); }}
                                        placeholder="Écris ce que tu penses être la bonne réponse... (Ctrl+Entrée pour valider)"
                                        className="w-full h-28 resize-none outline-none text-slate-800 font-medium placeholder:text-slate-300 text-sm leading-relaxed"
                                    />
                                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50">
                                        {/* Hint button */}
                                        {!showHint ? (
                                            <button
                                                onClick={() => setShowHint(true)}
                                                className="flex items-center gap-1.5 text-amber-500 text-xs font-bold hover:text-amber-600 transition"
                                            >
                                                <Lightbulb className="h-3.5 w-3.5" /> Voir un indice
                                            </button>
                                        ) : (
                                            <p className="text-xs text-amber-600 font-bold italic">💡 {currentCard?.hint}</p>
                                        )}

                                        {/* Reveal button */}
                                        <motion.button
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleReveal}
                                            disabled={!childAnswer.trim()}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${childAnswer.trim()
                                                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Eye className="h-4 w-4" /> Voir la réponse
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
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-5 rounded-[2.5rem] border-2 flex items-center gap-4 ${isValidating
                                                    ? 'bg-slate-50 border-slate-100 animate-pulse'
                                                    : aiFeedback?.isCorrect
                                                        ? 'bg-emerald-50 border-emerald-100/50'
                                                        : 'bg-amber-50 border-amber-100/50'}`}
                                            >
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isValidating
                                                    ? 'bg-slate-200'
                                                    : aiFeedback?.isCorrect
                                                        ? 'bg-emerald-500'
                                                        : 'bg-amber-500'}`}>
                                                    {isValidating ? <RefreshCcw className="h-6 w-6 text-slate-400 animate-spin" /> :
                                                        aiFeedback?.isCorrect ? <CheckCircle2 className="h-6 w-6 text-white" /> : <Brain className="h-6 w-6 text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">L'avis de Magic ✨</p>
                                                    <div className="space-y-2">
                                                        {history.slice(0, -1).map((h, i) => (
                                                            <div key={i} className="text-[10px] text-slate-400 font-medium border-l-2 border-slate-100 pl-2 py-1 italic">
                                                                <p>Toi: {h.child}</p>
                                                                <p>Magic: {h.ai}</p>
                                                            </div>
                                                        ))}
                                                        <p className={`text-base font-black ${isValidating ? 'text-slate-400' : 'text-slate-800'}`}>
                                                            {isValidating ? 'Analyse de ta réponse...' : aiFeedback?.feedback}
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
                                                        className="w-full p-4 pr-12 rounded-3xl bg-white border-2 border-indigo-100 shadow-sm text-sm font-medium resize-none h-20 outline-none focus:border-indigo-300 transition-all"
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

                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => handleRate(aiFeedback.isCorrect)}
                                                    className={`w-full py-5 rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${aiFeedback.isCorrect
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200'
                                                        : 'bg-slate-900 text-white shadow-slate-200'
                                                        }`}
                                                >
                                                    {aiFeedback.isCorrect ? 'Super, Suivant !' : 'D\'accord, Suivant'}
                                                    <ArrowRight className="h-6 w-6" />
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
