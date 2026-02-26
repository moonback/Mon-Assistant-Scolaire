import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, PenLine, Eye, Lightbulb, BookOpen,
  CheckCircle2, RefreshCcw, ArrowRight
} from 'lucide-react';
import type { Flashcard } from '../../services/flashcardService';
import { validateFlashcardAnswer, followUpValidation } from '../../services/flashcardService';
import type { CardResult } from './types';
import { getTheme } from './types';

interface FlashcardSessionProps {
  cards: Flashcard[];
  currentIndex: number;
  selectedSubject: string;
  gradeLevel: string;
  onRate: (success: boolean, childAnswer: string) => void;
  onBack: () => void;
  results: CardResult[];
}

export default function FlashcardSession({
  cards, currentIndex, selectedSubject, gradeLevel, onRate, onBack, results
}: FlashcardSessionProps) {
  const [cardStep, setCardStep] = useState<'question' | 'reveal'>('question');
  const [childAnswer, setChildAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [history, setHistory] = useState<{ child: string; ai: string }[]>([]);
  const [followUp, setFollowUp] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentCard = cards[currentIndex];
  const theme = getTheme(selectedSubject);
  const progressPct = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  // Reset state when card changes
  useEffect(() => {
    setCardStep('question');
    setChildAnswer('');
    setShowHint(false);
    setAiFeedback(null);
    setHistory([]);
    setFollowUp('');
  }, [currentIndex]);

  // Auto-focus textarea
  useEffect(() => {
    if (cardStep === 'question' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 350);
    }
  }, [cardStep, currentIndex]);

  const handleReveal = async () => {
    if (!childAnswer.trim()) return;
    setIsValidating(true);
    setCardStep('reveal');
    const validation = await validateFlashcardAnswer(
      gradeLevel, currentCard.front, currentCard.back, childAnswer
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
      gradeLevel, currentCard.front, currentCard.back, history, nextAnswer
    );
    setAiFeedback(validation);
    setHistory(prev => [...prev, { child: nextAnswer, ai: validation.feedback }]);
    setIsValidating(false);
  };

  const handleRate = (success: boolean) => {
    onRate(success, childAnswer);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">
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
            {/* STEP 1: QUESTION */}
            {cardStep === 'question' && (
              <div className="space-y-4">
                <div className={`relative rounded-[2.5rem] bg-gradient-to-br ${theme.color} text-white shadow-2xl p-10 overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="flex items-center gap-2 mb-6 opacity-70 relative z-10">
                    <Brain className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Question n°{currentIndex + 1}</p>
                  </div>
                  <p className="text-xl font-black leading-tight tracking-tight relative z-10">{currentCard?.front}</p>
                </div>

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
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleReveal}
                      disabled={!childAnswer.trim()}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        childAnswer.trim()
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

            {/* STEP 2: REVEAL */}
            {cardStep === 'reveal' && (
              <div className="space-y-4">
                <div className={`rounded-2xl bg-gradient-to-br ${theme.color} text-white/90 p-4 text-center`}>
                  <p className="text-xs font-black opacity-70 uppercase tracking-widest mb-1">Question</p>
                  <p className="font-black text-sm leading-relaxed">{currentCard?.front}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-3xl p-5 border-2 border-slate-100">
                    <div className="flex items-center gap-1.5 mb-3">
                      <PenLine className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ta réponse</p>
                    </div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                      {childAnswer || <span className="text-slate-300">(rien écrit)</span>}
                    </p>
                  </div>
                  <div className="bg-teal-50 rounded-3xl p-5 border-2 border-teal-100">
                    <div className="flex items-center gap-1.5 mb-3">
                      <BookOpen className="h-3.5 w-3.5 text-teal-500" />
                      <p className="text-[10px] font-black uppercase text-teal-500 tracking-widest">Corrigé</p>
                    </div>
                    <p className="text-sm font-black text-teal-800 leading-relaxed">{currentCard?.back}</p>
                  </div>
                </div>

                <p className="text-center text-xs text-slate-500 font-bold py-1">
                  Compare ta réponse. Est-ce que tu avais trouvé ?
                </p>

                <div className="flex flex-col gap-4">
                  {/* AI Verdict */}
                  <AnimatePresence>
                    {(isValidating || aiFeedback) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-6 rounded-[2.5rem] border-none shadow-sm flex items-center gap-5 relative overflow-hidden group transition-all ${
                          isValidating ? 'bg-slate-50/50'
                            : aiFeedback?.isCorrect ? 'bg-emerald-50/50'
                            : 'bg-amber-50/50'
                        }`}
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-30 ${
                          isValidating ? 'bg-slate-200' : aiFeedback?.isCorrect ? 'bg-emerald-200' : 'bg-amber-200'
                        }`} />
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner relative z-10 ${
                          isValidating ? 'bg-white'
                            : aiFeedback?.isCorrect ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}>
                          {isValidating
                            ? <RefreshCcw className="h-7 w-7 text-indigo-400 animate-spin" />
                            : aiFeedback?.isCorrect
                              ? <CheckCircle2 className="h-7 w-7 text-white" />
                              : <Brain className="h-7 w-7 text-white" />
                          }
                        </div>
                        <div className="flex-1 relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">L'avis de Magic ✨</p>
                          <p className={`text-sm font-black tracking-tight leading-tight ${isValidating ? 'text-slate-400' : 'text-slate-900'}`}>
                            {isValidating ? 'Magic analyse ta réponse...' : aiFeedback?.feedback}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  {aiFeedback && !isValidating && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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
                          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                            aiFeedback.isCorrect
                              ? 'bg-indigo-600 text-white shadow-indigo-100'
                              : 'bg-slate-900 text-white shadow-slate-100'
                          }`}
                        >
                          {aiFeedback.isCorrect ? "C'est gagné ! Suivant" : "J'ai compris ! Suivant"}
                          <ArrowRight className="h-4 w-4" />
                        </button>
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
              className={`h-2 rounded-full transition-all duration-300 ${
                i < results.length
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
