import { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Brain, CheckCircle, XCircle, RefreshCw, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

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

  const startQuiz = async () => {
    setLoading(true);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsCorrect(null);

    try {
      const json = await askGemini(topic || "Culture générale", 'quiz', gradeLevel);
      const data = JSON.parse(json);
      setQuestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return; // Prevent multiple clicks

    setSelectedOption(index);
    const correct = index === questions[currentQuestion].correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(s => s + 1);
      onEarnPoints?.(10); // 10 points per correct answer
    }

    // Wait a bit before next question
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-lg p-6 border-4 border-violet-200">
        <div className="flex items-center gap-3 mb-6 text-violet-600">
          <Brain className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Le Grand Quiz</h2>
        </div>

        {!questions.length && !loading && (
          <div className="space-y-4">
            <p className="text-slate-600 text-lg">Choisis un sujet pour ton quiz !</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Les dinosaures, Les planètes..."
                className="flex-1 p-3 rounded-xl border-2 border-slate-200 focus:border-violet-400 outline-none"
              />
              <button
                onClick={startQuiz}
                className="bg-violet-500 hover:bg-violet-600 text-white font-bold px-6 rounded-xl transition-colors"
              >
                C'est parti !
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {['Animaux', 'Espace', 'Histoire', 'Géographie', 'Sciences'].map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="bg-violet-50 text-violet-600 px-3 py-1 rounded-full text-sm hover:bg-violet-100"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Je prépare tes questions...</p>
          </div>
        )}

        {questions.length > 0 && !showResult && !loading && (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-wider">
              <span>Question {currentQuestion + 1} / {questions.length}</span>
              <span>Score: {score}</span>
            </div>

            <h3 className="text-xl font-bold text-slate-800">
              {questions[currentQuestion].question}
            </h3>

            <div className="grid gap-3">
              {questions[currentQuestion].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedOption !== null}
                  className={`p-4 rounded-xl text-left font-medium transition-all border-2 ${
                    selectedOption === idx
                      ? isCorrect
                        ? 'bg-green-100 border-green-400 text-green-800'
                        : 'bg-red-100 border-red-400 text-red-800'
                      : selectedOption !== null && idx === questions[currentQuestion].correctAnswer
                        ? 'bg-green-50 border-green-200 text-green-700' // Show correct answer if wrong
                        : 'bg-slate-50 border-slate-100 hover:border-violet-300 hover:bg-violet-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    {option}
                    {selectedOption === idx && (
                      isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedOption !== null && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm"
              >
                💡 <strong>Explication :</strong> {questions[currentQuestion].explanation}
              </motion.div>
            )}
          </motion.div>
        )}

        {showResult && (
          <div className="text-center py-8 space-y-6">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto" />
            <div>
              <h3 className="text-3xl font-bold text-slate-800 mb-2">Quiz terminé !</h3>
              <p className="text-xl text-slate-600">
                Ton score : <span className="font-bold text-violet-600">{score} / {questions.length}</span>
              </p>
            </div>
            <p className="text-slate-500">
              {score === questions.length ? "Incroyable ! Tu es un génie ! 🌟" : 
               score > 0 ? "Bravo ! Beau travail ! 👍" : "Ne t'inquiète pas, tu feras mieux la prochaine fois ! 💪"}
            </p>
            <button
              onClick={() => { setQuestions([]); setTopic(''); }}
              className="bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Rejouer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
