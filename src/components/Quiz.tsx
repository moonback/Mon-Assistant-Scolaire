import { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Brain, CheckCircle, XCircle, RefreshCw, Trophy, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizProps {
  onEarnPoints?: (amount: number, type: string, subject: string) => void;
  gradeLevel?: string;
}

export default function Quiz({ onEarnPoints, gradeLevel = 'CM1' }: QuizProps) {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const startQuiz = async (selectedTopic?: string) => {
    const finalTopic = selectedTopic || topic || 'Culture générale';
    setLoading(true);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsCorrect(null);

    try {
      const json = await askGemini(finalTopic, 'quiz', gradeLevel);
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

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(index);
    const correct = index === questions[currentQuestion].correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
      onEarnPoints?.(10, 'quiz', topic || 'Général');
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((c) => c + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
      }
    }, 1800);
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
                      (isCorrectAnswer ? <CheckCircle className="h-4 w-4" /> : isSelected ? <XCircle className="h-4 w-4" /> : null)}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Explication</p>
                <p className="mt-1 text-sm text-slate-700">{questions[currentQuestion].explanation}</p>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
