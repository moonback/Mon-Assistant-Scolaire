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
      console.log('Quiz response received:', json);
      const data = JSON.parse(json);
      const quizQuestions = data.questions || data;

      if (Array.isArray(quizQuestions) && quizQuestions.length > 0) {
        setQuestions(quizQuestions);
      } else {
        throw new Error("Format de quiz invalide");
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
    <div className="max-w-3xl mx-auto px-4 py-12">
      <AnimatePresence mode="wait">
        {!questions.length && !loading ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3.5rem] blur opacity-15 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative bg-white/90 backdrop-blur-2xl rounded-[3.5rem] shadow-premium border border-white/50 p-10 lg:p-14 text-center">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-50 rounded-full blur-3xl -ml-24 -mb-24 opacity-40 animate-pulse" />

              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 mx-auto mb-10 ring-8 ring-indigo-50"
                >
                  <Brain className="w-12 h-12" />
                </motion.div>

                <div className="space-y-3 mb-12">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Défi <span className="text-indigo-600">Génie</span></h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Explore, Apprends, Réussis</p>
                </div>

                <div className="space-y-6 max-w-md mx-auto">
                  <div className="relative group/input">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Quel sujet veux-tu conquérir ?"
                      className="w-full pl-10 pr-16 py-7 rounded-[2rem] bg-slate-50/50 border-2 border-transparent focus:border-indigo-400 focus:bg-white focus:ring-[15px] focus:ring-indigo-50/50 outline-none transition-all text-xl font-bold placeholder:text-slate-300 shadow-inner"
                    />
                    <Zap className="absolute right-7 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400 group-focus-within/input:text-indigo-600 transition-colors" />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startQuiz()}
                    className="w-full h-20 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-slate-200 flex items-center justify-center gap-4 transition-all relative overflow-hidden group/btn uppercase tracking-[0.2em] text-xs"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-4">
                      Lancer le défi
                      <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>

                  <div className="pt-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Défis Populaires</span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      {['Dinosaures 🦖', 'Espace 🚀', 'Histoire 🏰', 'Maths ➕', 'Nature 🌿'].map(t => (
                        <motion.button
                          key={t}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startQuiz(t)}
                          className="bg-white text-slate-600 px-6 py-3 rounded-2xl font-black text-xs border border-slate-100 shadow-sm hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                          {t}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/90 backdrop-blur-2xl rounded-[3.5rem] shadow-premium p-20 text-center border border-white/50"
          >
            <div className="relative w-32 h-32 mx-auto mb-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-[6px] border-indigo-50 rounded-[2.5rem] border-t-indigo-500 shadow-2xl"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Magie en cours...</h3>
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Tes questions arrivent !</p>
            </div>
          </motion.div>
        ) : questions.length > 0 && !showResult ? (
          <div className="space-y-8">
            {/* Header / Stats */}
            <header className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 pr-8 shadow-premium border border-white/50 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <Star className="w-7 h-7 fill-white" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Tes Étoiles</h4>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {score * 10} <span className="text-slate-300 text-sm ml-1">POINTS</span>
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-[200px] mx-8 h-3 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProgress}%` }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                />
              </div>

              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Challenge</p>
                <div className="font-black text-xl text-slate-900 leading-none">
                  {currentQuestion + 1} <span className="text-slate-300">/ {questions.length}</span>
                </div>
              </div>
            </header>

            {/* Question Card */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-indigo-100 rounded-[3.5rem] blur-xl opacity-20 transition duration-1000" />
              <div className="relative bg-white/95 backdrop-blur-2xl rounded-[3.5rem] shadow-premium p-10 md:p-14 border border-white/50 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl -mr-40 -mt-40 -z-10 animate-pulse" />

                <div className="flex gap-8 mb-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 shadow-inner group-hover:rotate-6 transition-transform">
                    <HelpCircle className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-[1.2]">
                    {questions[currentQuestion].question}
                  </h3>
                </div>

                <div className="grid gap-4">
                  {questions[currentQuestion].options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectAnswer = idx === questions[currentQuestion].correctAnswer;

                    let style = "bg-slate-50/50 text-slate-600 border-2 border-transparent hover:border-indigo-200 transition-all duration-300";
                    if (selectedOption !== null) {
                      if (isSelected) {
                        style = isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-xl shadow-emerald-100" : "bg-red-50 text-red-700 border-red-500 shadow-xl shadow-red-100";
                      } else if (isCorrectAnswer) {
                        style = "bg-emerald-50 text-emerald-600 border-emerald-200";
                      } else {
                        style = "bg-slate-50 text-slate-300 border-transparent opacity-40 grayscale-[0.5]";
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={selectedOption === null ? { scale: 1.02, x: 5 } : {}}
                        onClick={() => handleAnswer(idx)}
                        disabled={selectedOption !== null}
                        className={`p-6 md:p-8 rounded-[2rem] text-left font-black text-lg flex items-center justify-between group/opt shadow-sm ${style}`}
                      >
                        <div className="flex items-center gap-6">
                          <span className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-base shadow-sm group-hover/opt:scale-110 transition-all ${selectedOption === null ? "bg-white text-slate-400 group-hover/opt:text-indigo-600" :
                            isCorrectAnswer ? "bg-emerald-500 text-white shadow-emerald-200" : isSelected ? "bg-red-500 text-white shadow-red-200" : "bg-slate-200 text-slate-400"
                            }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-tight">{option}</span>
                        </div>
                        <AnimatePresence>
                          {selectedOption !== null && (
                            <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}>
                              {isSelected ? (
                                isCorrect ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <XCircle className="w-8 h-8 text-red-500" />
                              ) : isCorrectAnswer ? (
                                <CheckCircle className="w-7 h-7 text-emerald-400" />
                              ) : null}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selectedOption !== null && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-12 pt-12 border-t border-slate-100"
                    >
                      <div className={`p-8 rounded-[2.5rem] flex gap-6 relative overflow-hidden group/feedback transition-all duration-500 ${isCorrect ? 'bg-emerald-50 border border-emerald-100 shadow-xl shadow-emerald-50' : 'bg-indigo-50 border border-indigo-100 shadow-xl shadow-indigo-50'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/50 rounded-full blur-2xl -mr-16 -mt-16 opacity-30 group-hover/feedback:scale-150 transition-transform duration-1000" />
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative z-10 shadow-lg ${isCorrect ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-indigo-500 text-white shadow-indigo-200'}`}>
                          <Target className="w-7 h-7" />
                        </div>
                        <div className="relative z-10 flex-1">
                          <h5 className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isCorrect ? 'text-emerald-700' : 'text-indigo-700'}`}>Le savais-tu ?</h5>
                          <p className={`text-lg font-bold leading-relaxed tracking-tight ${isCorrect ? 'text-emerald-900' : 'text-indigo-900'}`}>{questions[currentQuestion].explanation}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        ) : showResult ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded-[4rem] blur opacity-20 animate-pulse transition duration-1000"></div>
            <div className="relative overflow-hidden bg-white/95 backdrop-blur-2xl rounded-[4rem] shadow-premium p-12 lg:p-16 text-center border border-white/50">
              {/* Celebration elements */}
              <div className="absolute inset-0 pointer-events-none opacity-50">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 800, opacity: [0, 1, 0], rotate: 360 }}
                    transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
                    className="absolute text-2xl"
                    style={{ left: `${Math.random() * 100}%` }}
                  >
                    {['✨', '⭐', '🎈', '🎉', '🌟'][Math.floor(Math.random() * 5)]}
                  </motion.div>
                ))}
              </div>

              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[3rem] flex items-center justify-center text-white shadow-2xl shadow-amber-200 mx-auto mb-10 ring-12 ring-amber-50"
                >
                  <Trophy className="w-16 h-16" />
                </motion.div>

                <div className="space-y-3 mb-12">
                  <h2 className="text-5xl font-black text-slate-900 tracking-tight">Magnifique !</h2>
                  <p className="text-slate-400 font-bold tracking-tight text-xl">Score de champion : <span className="text-slate-900">{score} parfaits</span></p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden group/star">
                    <div className="absolute inset-0 bg-amber-50 opacity-0 group-hover/star:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 relative z-10">Butin Récolté</p>
                    <p className="text-4xl font-black text-amber-500 flex items-center justify-center gap-3 relative z-10">
                      <Star className="w-10 h-10 fill-amber-400" /> +{score * 10}
                    </p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium relative overflow-hidden group/accuracy">
                    <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover/accuracy:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 relative z-10">Précision</p>
                    <p className="text-4xl font-black text-emerald-600 relative z-10">
                      {Math.round((score / questions.length) * 100)}%
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setQuestions([]); setTopic(''); }}
                  className="w-full h-24 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700 relative z-10" />
                  <span className="relative z-10">Nouveau Défi Magique</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
