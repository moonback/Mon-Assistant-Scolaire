import React, { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Brain, CheckCircle, XCircle, RefreshCw, Trophy, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SectionHeader from './ui/SectionHeader';
import AppCard from './ui/AppCard';
import AppButton from './ui/AppButton';

interface Question {
  question: string;
  type?: 'qcm' | 'open';
  options: string[];
  correctAnswer: number;
  correctAnswerText?: string;
  explanation: string;
  funFact?: string;
}

interface QuizProps {
  onEarnPoints?: (amount: number, type: string, subject: string) => void;
  gradeLevel?: string;
}

export default function Quiz({ onEarnPoints, gradeLevel = 'CM1' }: QuizProps) {
  const { selectedChild, refreshChildren } = useAuth();
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const wrongTopicsRef = React.useRef<string[]>([]);

  const startQuiz = async (selectedTopic?: string) => {
    const finalTopic = selectedTopic || topic || 'Culture générale';
    setLoading(true);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setOpenAnswer('');
    setAiFeedback(null);
    wrongTopicsRef.current = [];

    try {
      const json = await askGemini(finalTopic, 'quiz', gradeLevel, undefined, undefined, selectedChild?.weak_points, selectedChild?.learning_profile);
      const data = JSON.parse(json);
      const quizQuestions = data.questions || data;

      if (Array.isArray(quizQuestions) && quizQuestions.length > 0) {
        setQuestions(quizQuestions);
      } else {
        throw new Error('Format de quiz invalide');
      }
    } catch (e) {
      console.error('Erreur lors de la génération du quiz:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setOpenAnswer('');
      setAiFeedback(null);
    } else {
      setShowResult(true);
      if (selectedChild && wrongTopicsRef.current.length > 0) {
        const currentPoints = selectedChild.weak_points || [];
        const newPoints = wrongTopicsRef.current.filter(t => !currentPoints.includes(t));
        if (newPoints.length > 0) {
          const updatedPoints = [...currentPoints, ...newPoints];
          supabase.from('children')
            .update({ weak_points: updatedPoints })
            .eq('id', selectedChild.id)
            .then(() => refreshChildren());
        }
      }
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(index);
    const correct = index === questions[currentQuestion].correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
      onEarnPoints?.(10, 'quiz', topic || 'Général');
    } else {
      const currentTopic = topic || 'Culture générale';
      if (!wrongTopicsRef.current.includes(currentTopic)) {
        wrongTopicsRef.current.push(currentTopic);
      }
    }

    setTimeout(handleNext, 1800);
  };

  const submitOpenAnswer = async () => {
    if (!openAnswer.trim() || aiLoading) return;

    setAiLoading(true);
    try {
      const prompt = `Question : ${questions[currentQuestion].question}
      Réponse de l'enfant : ${openAnswer}
      Réponse attendue : ${questions[currentQuestion].correctAnswerText}`;

      const resultJson = await askGemini(prompt, 'ai_evaluation', gradeLevel, undefined, undefined, undefined, selectedChild?.learning_profile);
      const result = JSON.parse(resultJson);

      setIsCorrect(result.isCorrect);
      setAiFeedback(result.feedback);

      if (result.isCorrect) {
        const earned = Math.max(5, result.score);
        setScore((s) => s + (earned / 10)); // Simple calculation for score display
        onEarnPoints?.(earned, 'ai_quiz', topic || 'Général');
      } else {
        const currentTopic = topic || 'Culture générale';
        if (!wrongTopicsRef.current.includes(currentTopic)) {
          wrongTopicsRef.current.push(currentTopic);
        }
      }
    } catch (e) {
      console.error(e);
      // Show neutral error feedback instead of silently marking as correct
      setIsCorrect(false);
      setAiFeedback("Oups, je n'ai pas pu évaluer ta réponse. Réessaie ou passe à la question suivante !");
    } finally {
      setAiLoading(false);
    }
  };

  const currentProgress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      <SectionHeader
        title="Générateur de Quiz ✨"
        subtitle="Choisis ton sujet et teste tes connaissances !"
      />

      <AnimatePresence mode="wait">
        {!questions.length && !loading ? (
          <AppCard as={motion.section}
            key="setup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-8"
          >
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shrink-0 shadow-inner">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5">Nouveau Challenge</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence Artificielle</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Espace, Animaux, Histoire..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner"
              />

              <AppButton
                onClick={() => startQuiz()}
                className="w-full py-4 text-xs uppercase tracking-widest"
              >
                Générer le quiz
                <ChevronRight className="h-4 w-4" />
              </AppButton>

              <div className="flex flex-wrap gap-2 pt-2">
                {(selectedChild?.allowed_subjects?.length ? selectedChild.allowed_subjects : ['Géographie', 'Histoire', 'Sciences', 'Espace', 'Anglais', 'Nature', 'Art', 'Code']).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTopic(t);
                      startQuiz(t);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </AppCard>
        ) : loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Préparation du quiz...</p>
          </motion.div>
        ) : showResult ? (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-10 border-none shadow-sm text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600">
              <Trophy className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Quiz terminé</h2>
            <p className="mt-1 text-sm text-slate-500">Score: {score} / {questions.length}</p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Précision</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{Math.round((score / questions.length) * 100)}%</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Étoiles</p>
                <p className="flex items-center justify-center gap-1.5 text-xl font-black text-indigo-600 tracking-tight">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> +{score * 10}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setQuestions([]);
                setTopic('');
              }}
              className="mt-6 w-full rounded-xl bg-indigo-50 px-4 py-4 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              Recommencer
            </button>
          </motion.section>
        ) : (
          <motion.section key="quiz" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-8 border-none shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
            <div className="mb-6 flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Question {currentQuestion + 1} / {questions.length}
              </p>
              <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <p className="text-xs font-black text-indigo-600">{score * 10}</p>
              </div>
            </div>

            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600 transition-all duration-200" style={{ width: `${currentProgress}%` }} />
            </div>

            <h3 className="mb-4 text-base font-black text-slate-900 leading-relaxed tracking-tight">{questions[currentQuestion].question}</h3>

            {questions[currentQuestion].type === 'open' ? (
              <div className="space-y-4">
                <textarea
                  value={openAnswer}
                  onChange={(e) => setOpenAnswer(e.target.value)}
                  disabled={isCorrect !== null || aiLoading}
                  placeholder="Tape ta réponse ici..."
                  className="w-full h-32 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:bg-white resize-none"
                />

                {isCorrect === null ? (
                  <button
                    onClick={submitOpenAnswer}
                    disabled={!openAnswer.trim() || aiLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Valider
                  </button>
                ) : (
                  <div className={`rounded-xl border p-4 ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isCorrect ? 'Excellent !' : 'Pas tout à fait...'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{aiFeedback}</p>
                    <button
                      onClick={handleNext}
                      className="mt-4 w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Question suivante
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {questions[currentQuestion].options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === questions[currentQuestion].correctAnswer;

                  let style = 'border-slate-200 bg-white text-slate-700';
                  if (selectedOption !== null) {
                    if (isCorrectAnswer) style = 'border-emerald-200 bg-emerald-50 text-emerald-800';
                    else if (isSelected) style = 'border-red-200 bg-red-50 text-red-700';
                    else style = 'border-slate-200 bg-slate-50 text-slate-500';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedOption !== null}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-colors ${style}`}
                    >
                      <span>{option}</span>
                      {selectedOption !== null &&
                        (isCorrectAnswer ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : isSelected ? <XCircle className="h-4 w-4 text-red-500" /> : null)}
                    </button>
                  );
                })}
              </div>
            )}

            {(selectedOption !== null || (questions[currentQuestion].type === 'open' && isCorrect !== null)) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl bg-indigo-50/50 p-6 border border-indigo-100/50 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Le sais-tu ? ✨</p>
                <p className="text-sm font-semibold text-indigo-900/80 leading-relaxed">{questions[currentQuestion].explanation}</p>
                {questions[currentQuestion].funFact && (
                  <div className="mt-4 pt-4 border-t border-indigo-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-lg">💡</span>
                    </div>
                    <p className="text-xs font-bold text-indigo-800/60 italic leading-relaxed">{questions[currentQuestion].funFact}</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
