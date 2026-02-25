import React, { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Brain, CheckCircle, XCircle, RefreshCw, Trophy, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
      const json = await askGemini(finalTopic, 'quiz', gradeLevel, undefined, undefined, selectedChild?.weak_points);
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

      const resultJson = await askGemini(prompt, 'ai_evaluation', gradeLevel);
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
      // Fallback in case of AI error
      setIsCorrect(true);
    } finally {
      setAiLoading(false);
    }
  };

  const currentProgress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8">
      <AnimatePresence mode="wait">
        {!questions.length && !loading ? (
          <motion.section
            key="setup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Quiz</h2>
                <p className="text-sm text-slate-500">Choisis un sujet et lance une série de questions.</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Espace, Animaux, Histoire..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:bg-white"
              />

              <button
                onClick={() => startQuiz()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white"
              >
                Générer le quiz
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="flex flex-wrap gap-2 pt-1">
                {['Dinosaures', 'Espace', 'Histoire', 'Maths', 'Nature'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTopic(t);
                      startQuiz(t);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
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
            className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Quiz terminé</h3>
            <p className="mt-1 text-sm text-slate-500">Score: {score} / {questions.length}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Précision</p>
                <p className="text-lg font-semibold text-slate-900">{Math.round((score / questions.length) * 100)}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Étoiles</p>
                <p className="flex items-center justify-center gap-1 text-lg font-semibold text-slate-900">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> +{score * 10}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setQuestions([]);
                setTopic('');
              }}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Recommencer
            </button>
          </motion.section>
        ) : (
          <motion.section key="quiz" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                Question {currentQuestion + 1} / {questions.length}
              </p>
              <p className="text-sm font-semibold text-slate-900">Score: {score}</p>
            </div>

            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600 transition-all duration-200" style={{ width: `${currentProgress}%` }} />
            </div>

            <h3 className="mb-4 text-lg font-semibold text-slate-900">{questions[currentQuestion].question}</h3>

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
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Valider ma réponse
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
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-colors ${style}`}
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
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Explication</p>
                <p className="text-sm text-slate-700">{questions[currentQuestion].explanation}</p>
                {questions[currentQuestion].funFact && (
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <p className="text-xs text-slate-500 italic">{questions[currentQuestion].funFact}</p>
                  </div>
                )}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
