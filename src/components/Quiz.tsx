import { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Brain, CheckCircle, XCircle, RefreshCw, Trophy, ChevronRight, Star, Sparkles, Target, Zap, ArrowLeft, HelpCircle } from 'lucide-react';
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
      onEarnPoints?.(10, 'quiz', topic || 'Général');
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
      }
    }, 2500);
  };

  const currentProgress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <AnimatePresence mode="wait">
        {!questions.length && !loading ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 p-8 md:p-10 text-center"
          >
            {/* Background blobs for depth */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl -ml-16 -mb-16" />

            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="relative z-10"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 mx-auto mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <Brain className="w-10 h-10" />
              </div>

              <h2 className="text-3xl font-black text-slate-800 mb-2 leading-tight">Le Grand Quiz</h2>
              <p className="text-slate-500 font-bold mb-8 text-sm uppercase tracking-widest">Prêt à récoleter des étoiles ? ✨</p>

              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Sujet du quiz (ex: L'espace, Animaux...)"
                    className="w-full p-4 pl-6 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-400 outline-none transition-all font-bold text-slate-700 shadow-sm"
                  />
                  <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>

                <button
                  onClick={() => startQuiz()}
                  className="w-full magical-gradient text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-indigo-200/50 hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-2 group"
                >
                  Générer le quiz
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggestions</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Dinosaures 🦖', 'Espace 🚀', 'Histoire 🏰', 'Maths ➕', 'Nature 🌿'].map(t => (
                      <button
                        key={t}
                        onClick={() => startQuiz(t)}
                        className="bg-white text-slate-600 px-4 py-2 rounded-xl font-bold text-xs border border-slate-100 shadow-sm hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all hover:-translate-y-1 active:scale-95"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-16 text-center border border-white/50"
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-indigo-100 rounded-full border-t-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-1">Magie en cours...</h3>
            <p className="text-slate-400 font-bold text-sm tracking-wide">Je concocte tes questions sur mesure !</p>
          </motion.div>
        ) : questions.length > 0 && !showResult ? (
          <div className="space-y-4">
            {/* Compact Header */}
            <header className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-white/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Progression</h4>
                  <p className="text-sm font-black text-slate-800 leading-none">
                    {currentQuestion + 1} <span className="text-slate-300">/ {questions.length}</span>
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-[120px] mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProgress}%` }}
                  className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                />
              </div>
              <div className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-2 border border-yellow-100">
                <Trophy className="w-3.5 h-3.5" />
                {score * 10} pts
              </div>
            </header>

            {/* Question Card */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[2rem] shadow-xl p-6 md:p-8 border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 -z-10" />

              <div className="flex gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
                  {questions[currentQuestion].question}
                </h3>
              </div>

              <div className="grid gap-3">
                {questions[currentQuestion].options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === questions[currentQuestion].correctAnswer;

                  let style = "bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-white hover:border-indigo-100";
                  if (selectedOption !== null) {
                    if (isSelected) {
                      style = isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-500" : "bg-red-50 text-red-700 border-red-500";
                    } else if (isCorrectAnswer) {
                      style = "bg-emerald-50 text-emerald-600 border-emerald-200";
                    } else {
                      style = "bg-slate-50 text-slate-300 border-transparent opacity-50";
                    }
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileHover={selectedOption === null ? { scale: 1.01, x: 4 } : {}}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedOption !== null}
                      className={`p-4 md:p-5 rounded-2xl text-left font-bold text-sm md:text-base flex items-center justify-between transition-all ${style}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${selectedOption === null ? "bg-white text-slate-400 group-hover:text-indigo-600" :
                            isCorrectAnswer ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                          }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {option}
                      </div>
                      <AnimatePresence>
                        {selectedOption !== null && (
                          isSelected ? (
                            isCorrect ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />
                          ) : isCorrectAnswer ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : null
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback Message */}
              <AnimatePresence>
                {selectedOption !== null && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 pt-6 border-t border-slate-100"
                  >
                    <div className={`p-5 rounded-2xl flex gap-4 ${isCorrect ? 'bg-emerald-50 border border-emerald-100' : 'bg-indigo-50 border border-indigo-100'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}>
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCorrect ? 'text-emerald-700' : 'text-indigo-700'}`}>Le savais-tu ?</h5>
                        <p className={`text-sm font-bold leading-relaxed ${isCorrect ? 'text-emerald-800' : 'text-indigo-800'}`}>{questions[currentQuestion].explanation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        ) : showResult ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 text-center border border-slate-100"
          >
            {/* Celebration elements */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 500, opacity: [0, 1, 0] }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  className="absolute text-xl"
                  style={{ left: `${Math.random() * 100}%` }}
                >
                  {['✨', '⭐', '🎈', '🎉'][Math.floor(Math.random() * 4)]}
                </motion.div>
              ))}
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-24 h-24 bg-yellow-400 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-yellow-100 mx-auto mb-6"
              >
                <Trophy className="w-12 h-12" />
              </motion.div>

              <h2 className="text-3xl font-black text-slate-800 mb-2">Bravo !</h2>
              <p className="text-slate-500 font-bold mb-8">Score final : {score} / {questions.length}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Étoiles</p>
                  <p className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 fill-indigo-600" /> +{score * 10}
                  </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Précision</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {Math.round((score / questions.length) * 100)}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setQuestions([]); setTopic(''); }}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Refaire un quiz
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
