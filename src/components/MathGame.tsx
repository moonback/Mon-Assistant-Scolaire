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
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Calcul Mental 🔢</h1>
          <p className="text-slate-500 font-semibold text-sm">Deviens un champion du calcul !</p>
        </div>
      </header>

      {/* Score bar */}
      <div className="premium-card p-5 border-none shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shadow-inner">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1 tracking-widest">Gains</p>
            <p className="text-sm font-black text-slate-900 leading-none tracking-tight">{score * 5} étoiles</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-all ${streak >= 3 ? 'bg-orange-50 text-orange-500 scale-110 shadow-sm' : 'bg-slate-50 text-slate-300'}`}>
            <Flame className="h-5 w-5" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1 tracking-widest">Série</p>
            <p className={`text-sm font-black leading-none tracking-tight ${streak >= 3 ? 'text-orange-500' : 'text-slate-900'}`}>
              {streak} d'affilée
            </p>
          </div>
        </div>
      </div>

      {/* Main problem card */}
      <motion.div
        className="premium-card p-10 border-none shadow-sm text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
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
                <div className="text-5xl mb-2">🔥</div>
                <p className="text-xl font-black text-orange-600">Série x3 !</p>
                <p className="text-orange-500 font-bold text-sm">+10 étoiles bonus !</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${num1}-${num2}-${operator}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-10 relative z-10"
          >
            <p className="text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-5">
              <span>{num1}</span>
              <span className="text-indigo-500 text-4xl">{operatorLabel}</span>
              <span>{num2}</span>
              <span className="text-slate-300">=</span>
            </p>
          </motion.div>
        </AnimatePresence>

        <form onSubmit={checkAnswer} className="space-y-4">
          <div className="relative z-10">
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="..."
              className={`w-full rounded-2xl border-4 px-6 py-5 text-center text-4xl font-black outline-none transition-all shadow-inner ${status === 'correct'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : status === 'wrong'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-50 bg-slate-50 text-slate-900 focus:border-indigo-200 focus:bg-white focus:shadow-xl'
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
            className="w-full rounded-xl bg-indigo-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 relative z-10"
          >
            {status === 'correct' ? 'Excellent !' : status === 'wrong' ? 'On ne baisse pas les bras !' : 'Vérifier la réponse'}
          </motion.button>
        </form>
      </motion.div>

      {/* Tips */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="premium-card p-5 border-none shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Astuce</p>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">Pense aux dizaines d'abord !</p>
          </div>
        </div>
        <div className="premium-card p-5 border-none shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Série</p>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">3 réponses justes = Bonus !</p>
          </div>
        </div>
      </div>
    </div>
  );
}
