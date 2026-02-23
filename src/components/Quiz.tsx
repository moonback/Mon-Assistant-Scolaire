import { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Brain, CheckCircle, XCircle, RefreshCw, Trophy, ChevronRight, Star, Sparkles, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizProps {
  onEarnPoints?: (amount: number) => void;
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
    const finalTopic = selectedTopic || topic || "Culture générale";
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
      setQuestions(data);
    } catch (e) {
      console.error(e);
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
      setScore(s => s + 1);
      onEarnPoints?.(10);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
      }
    }, 3000);
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <AnimatePresence mode="wait">
        {!questions.length && !loading ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[3rem] shadow-xl p-10 md:p-12 border border-slate-100 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-purple-100 mx-auto mb-8">
              <Brain className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-4">Le Grand Quiz Magique</h2>
            <p className="text-slate-500 font-medium text-lg mb-10">Prêt à tester tes connaissances et gagner des étoiles ?</p>

            <div className="max-w-md mx-auto space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Les dinosaures, L'espace..."
                  className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-purple-400 focus:bg-white outline-none transition-all font-bold text-center text-lg"
                />
              </div>

              <button
                onClick={() => startQuiz()}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-purple-100 text-xl flex items-center justify-center gap-3 active:scale-95"
              >
                Commencer l'Aventure
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="pt-8">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quelques idées de sujets</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['Animaux 🦁', 'Espace 🚀', 'Histoire 🏰', 'Sciences 🧪', 'Nature 🌿'].map(t => (
                    <button
                      key={t}
                      onClick={() => startQuiz(t)}
                      className="bg-slate-50 text-slate-600 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-purple-50 hover:text-purple-600 border border-slate-100 transition-all hover:scale-110 active:scale-95"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[3rem] shadow-xl p-20 text-center border border-slate-100"
          >
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-purple-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Préparation de la Magie...</h3>
            <p className="text-slate-400 font-bold">Je crée tes questions sur mesure !</p>
          </motion.div>
        ) : questions.length > 0 && !showResult ? (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="space-y-8"
          >
            {/* Header / Progress */}
            <div className="bg-white rounded-[2rem] shadow-sm p-6 border border-slate-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Progression</p>
                  <h3 className="text-xl font-black text-slate-800">Question {currentQuestion + 1} <span className="text-slate-300">/ {questions.length}</span></h3>
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 fill-purple-700" />
                  Score: {score}
                </div>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-[3rem] shadow-xl p-10 md:p-12 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />

              <h3 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight mb-10 relative z-10">
                {questions[currentQuestion].question}
              </h3>

              <div className="grid gap-4 relative z-10">
                {questions[currentQuestion].options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === questions[currentQuestion].correctAnswer;

                  return (
                    <motion.button
                      key={idx}
                      whileHover={selectedOption === null ? { scale: 1.02, x: 10 } : {}}
                      whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedOption !== null}
                      className={`p-6 rounded-2xl text-left font-bold text-lg transition-all border-4 flex justify-between items-center group ${selectedOption === null
                          ? 'bg-slate-50 border-transparent hover:border-purple-200 hover:bg-white text-slate-600'
                          : isSelected
                            ? isCorrect
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : 'bg-red-50 border-red-500 text-red-700'
                            : isCorrectAnswer
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600'
                              : 'bg-slate-50 border-transparent opacity-50 text-slate-400'
                        }`}
                    >
                      <span className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${selectedOption === null
                            ? 'bg-white text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600'
                            : isCorrectAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {option}
                      </span>
                      {selectedOption !== null && (
                        isSelected ? (
                          isCorrect ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <XCircle className="w-8 h-8 text-red-500" />
                        ) : isCorrectAnswer ? (
                          <CheckCircle className="w-6 h-6 text-emerald-400" />
                        ) : null
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedOption !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-10 p-8 rounded-[2rem] flex items-start gap-5 relative overflow-hidden ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                      }`}
                  >
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                      <Target className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80 decoration-white/20 underline underline-offset-4">Explications de l'expert</p>
                      <p className="text-lg font-bold leading-relaxed">{questions[currentQuestion].explanation}</p>
                    </div>

                    {/* Animated sparkle for correct answer */}
                    {isCorrect && (
                      <motion.div
                        initial={{ scale: 0, rotate: 0 }}
                        animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full flex items-center justify-center"
                      >
                        <Star className="w-10 h-10 text-yellow-300 fill-yellow-300 shadow-xl" />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : showResult ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] shadow-2xl p-12 md:p-16 text-center border border-slate-100 relative overflow-hidden"
          >
            {/* Celebration background */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0, x: Math.random() * 800 - 400, opacity: 1 }}
                  animate={{ y: 800, opacity: 0 }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  className="absolute text-2xl"
                  style={{ left: '50%' }}
                >
                  {['✨', '⭐', '🎈', '🎉'][Math.floor(Math.random() * 4)]}
                </motion.div>
              ))}
            </div>

            <div className="relative z-10">
              <div className="relative w-32 h-32 mx-auto mb-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-2xl shadow-yellow-200"
                >
                  <Trophy className="w-16 h-16 drop-shadow-lg" />
                </motion.div>
              </div>

              <h3 className="text-4xl font-black text-slate-800 mb-4">Quiz terminé !</h3>
              <p className="text-2xl text-slate-500 font-bold mb-10">
                Tu as remporté <span className="text-purple-600 underline decoration-purple-100 underline-offset-8 decoration-4">{score} / {questions.length}</span> bonnes réponses !
              </p>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-12 flex flex-col md:flex-row items-center justify-center gap-8 border border-slate-100">
                <div className="text-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Étoiles gagnées</p>
                  <p className="text-4xl font-black text-yellow-500 flex items-center gap-2 justify-center">
                    <Star className="w-8 h-8 fill-yellow-500" />
                    +{score * 10}
                  </p>
                </div>
                <div className="h-10 w-px bg-slate-200 hidden md:block" />
                <div className="text-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Performance</p>
                  <p className="text-4xl font-black text-indigo-600">
                    {Math.round((score / questions.length) * 100)}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setQuestions([]); setTopic(''); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-12 rounded-2xl transition-all shadow-xl shadow-indigo-100 text-xl active:scale-95"
              >
                Nouvelle Aventure
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
