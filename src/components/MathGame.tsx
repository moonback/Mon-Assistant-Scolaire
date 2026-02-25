import { useState, FormEvent, useEffect } from 'react';
import { Check, X, Star, Zap, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface MathGameProps {
  onEarnPoints?: (amount: number, activityType: string, subject?: string) => void | Promise<void>;
}

// Difficulty config based on grade level
function getDifficultyConfig(gradeLevel?: string) {
  const grade = gradeLevel || 'CM1';
  switch (grade) {
    case 'CP':
      return { maxNum: 10, ops: ['+'], maxMult: 5 };
    case 'CE1':
      return { maxNum: 20, ops: ['+', '-'], maxMult: 5 };
    case 'CE2':
      return { maxNum: 30, ops: ['+', '-', 'x'], maxMult: 6 };
    case 'CM1':
      return { maxNum: 50, ops: ['+', '-', 'x'], maxMult: 9 };
    case 'CM2':
      return { maxNum: 100, ops: ['+', '-', 'x'], maxMult: 12 };
    case '6ème':
    case '5ème':
    case '4ème':
    case '3ème':
      return { maxNum: 200, ops: ['+', '-', 'x'], maxMult: 15 };
    default:
      return { maxNum: 50, ops: ['+', '-', 'x'], maxMult: 9 };
  }
}

export default function MathGame({ onEarnPoints }: MathGameProps) {
  const { selectedChild } = useAuth();
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);

  const gradeLevel = selectedChild?.grade_level;

  const generateProblem = () => {
    const config = getDifficultyConfig(gradeLevel);
    const op = config.ops[Math.floor(Math.random() * config.ops.length)];
    setOperator(op);

    let n1: number;
    let n2: number;
    if (op === 'x') {
      n1 = Math.floor(Math.random() * config.maxMult) + 1;
      n2 = Math.floor(Math.random() * config.maxMult) + 1;
    } else {
      n1 = Math.floor(Math.random() * config.maxNum) + 1;
      n2 = Math.floor(Math.random() * config.maxNum) + 1;
    }

    if (op === '-' && n1 < n2) [n1, n2] = [n2, n1];

    setNum1(n1);
    setNum2(n2);
    setAnswer('');
    setStatus('idle');
    setCorrectAnswer(null);
  };

  useEffect(() => {
    generateProblem();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeLevel]);

  const computeCorrect = () => {
    switch (operator) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case 'x': return num1 * num2;
      default: return 0;
    }
  };

  const checkAnswer = (e: FormEvent) => {
    e.preventDefault();
    if (!answer || status !== 'idle') return;

    const val = parseInt(answer, 10);
    const correct = computeCorrect();

    if (val === correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setScore((s) => s + 1);
      setStatus('correct');

      const bonus = newStreak > 0 && newStreak % 3 === 0;
      if (bonus) setShowStreakBonus(true);

      onEarnPoints?.(bonus ? 10 : 5, 'math');
      setTimeout(() => {
        setShowStreakBonus(false);
        generateProblem();
      }, 1200);
    } else {
      setStreak(0);
      setCorrectAnswer(correct);
      setStatus('wrong');
      setTimeout(() => {
        setStatus('idle');
        setCorrectAnswer(null);
        generateProblem();
      }, 1800);
    }
  };

  const operatorLabel = operator === 'x' ? '×' : operator;

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-8">
      {/* Score bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="text-lg font-black text-slate-800">{score * 5} étoiles</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className={`h-5 w-5 ${streak >= 3 ? 'text-orange-500' : 'text-slate-300'}`} />
          <span className={`text-sm font-black ${streak >= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
            {streak > 0 ? `${streak} d'affilée !` : 'Série: 0'}
          </span>
        </div>
        {gradeLevel && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-xl text-xs font-black text-indigo-600 uppercase tracking-wider">
            <Zap className="h-3 w-3" />
            {gradeLevel}
          </div>
        )}
      </div>

      {/* Main problem card */}
      <motion.div
        className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center relative overflow-hidden"
      >
        {/* Streak bonus flash */}
        <AnimatePresence>
          {showStreakBonus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center bg-amber-50/90 backdrop-blur-sm z-10 rounded-3xl"
            >
              <div className="text-center">
                <div className="text-6xl mb-2">🔥</div>
                <p className="text-2xl font-black text-orange-600">Série x3 !</p>
                <p className="text-orange-500 font-bold">+10 étoiles bonus !</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${num1}-${num2}-${operator}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-8"
          >
            <p className="text-6xl font-black text-slate-900 tracking-tight">
              {num1} <span className="text-indigo-500">{operatorLabel}</span> {num2} <span className="text-slate-400">=</span> <span className="text-slate-300">?</span>
            </p>
          </motion.div>
        </AnimatePresence>

        <form onSubmit={checkAnswer} className="space-y-4">
          <div className="relative">
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Ta réponse..."
              className={`w-full rounded-2xl border-2 px-6 py-5 text-center text-4xl font-black outline-none transition-all ${
                status === 'correct'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : status === 'wrong'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-400 focus:bg-white focus:shadow-lg'
              }`}
              autoFocus
              disabled={status !== 'idle'}
            />
            {status === 'correct' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <Check className="h-8 w-8 text-emerald-500" />
              </motion.div>
            )}
            {status === 'wrong' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="h-8 w-8 text-red-500" />
              </motion.div>
            )}
          </div>

          {/* Wrong answer: show correct answer */}
          <AnimatePresence>
            {status === 'wrong' && correctAnswer !== null && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center"
              >
                <p className="text-red-600 font-black text-lg">
                  La réponse était <span className="text-2xl">{correctAnswer}</span> 😊
                </p>
                <p className="text-red-400 text-sm font-medium mt-1">Pas grave, continue !</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={!answer || status !== 'idle'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl bg-indigo-600 py-5 text-xl font-black text-white shadow-lg shadow-indigo-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700"
          >
            {status === 'correct' ? '✅ Bravo !' : status === 'wrong' ? '❌ Prochaine question...' : '✅ Vérifier !'}
          </motion.button>
        </form>
      </motion.div>

      {/* Tips */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-slate-700 mb-1">💡 Astuce</p>
          <p className="text-sm text-slate-500">Prends le temps de réfléchir, la rapidité vient avec la pratique !</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-slate-700 mb-1">🎯 Objectif</p>
          <p className="text-sm text-slate-500">Enchaîne 3 bonnes réponses pour un bonus de série !</p>
        </div>
      </div>
    </div>
  );
}
