import { useState, FormEvent, useEffect } from 'react';
import { Calculator, Check, X, RefreshCw, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MathGameProps {
  onEarnPoints?: (amount: number, activityType: string, subject?: string) => void;
}

export default function MathGame({ onEarnPoints }: MathGameProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const generateProblem = () => {
    const ops = ['+', '-', 'x'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    setOperator(op);

    let n1;
    let n2;
    if (op === 'x') {
      n1 = Math.floor(Math.random() * 10) + 1;
      n2 = Math.floor(Math.random() * 10) + 1;
    } else {
      n1 = Math.floor(Math.random() * 50) + 1;
      n2 = Math.floor(Math.random() * 50) + 1;
    }

    if (op === '-' && n1 < n2) [n1, n2] = [n2, n1];

    setNum1(n1);
    setNum2(n2);
    setAnswer('');
    setMessage('');
    setStatus('idle');
  };

  useEffect(() => {
    generateProblem();
  }, []);

  const checkAnswer = (e: FormEvent) => {
    e.preventDefault();
    if (!answer) return;

    const val = parseInt(answer, 10);
    let correct;

    switch (operator) {
      case '+':
        correct = num1 + num2;
        break;
      case '-':
        correct = num1 - num2;
        break;
      case 'x':
        correct = num1 * num2;
        break;
      default:
        correct = 0;
    }

    if (val === correct) {
      setMessage('Bravo !');
      setStatus('correct');
      setScore((s) => s + 1);
      onEarnPoints?.(5, 'math');
      setTimeout(generateProblem, 900);
    } else {
      setMessage('Réessaie');
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 900);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Calcul mental</h2>
              <p className="text-sm text-slate-500">Une opération à la fois.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Score: {score}</div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {score * 5}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${num1}-${num2}-${operator}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center"
          >
            <p className="text-4xl font-semibold text-slate-900 sm:text-5xl">
              {num1} <span className="text-indigo-600">{operator}</span> {num2} = ?
            </p>
          </motion.div>
        </AnimatePresence>

        <form onSubmit={checkAnswer} className="mx-auto max-w-sm space-y-3">
          <div className="relative">
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="0"
              className={`w-full rounded-xl border px-4 py-4 text-center text-3xl font-semibold outline-none transition ${status === 'correct'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : status === 'wrong'
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-300'
                }`}
              autoFocus
            />
            {status === 'correct' && <Check className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />}
            {status === 'wrong' && <X className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600" />}
          </div>

          <button
            type="submit"
            disabled={!answer || status !== 'idle'}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            Vérifier
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm font-medium ${status === 'correct' ? 'text-emerald-700' : 'text-red-700'}`}>
            {message}
          </p>
        )}
      </motion.section>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="mb-1 text-sm font-semibold text-slate-900">Conseil</h4>
          <p className="text-sm text-slate-500">Respire et répond calmement pour éviter les erreurs.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="mb-1 text-sm font-semibold text-slate-900">Objectif</h4>
          <p className="text-sm text-slate-500">Enchaîne plusieurs bonnes réponses pour progresser.</p>
        </div>
      </div>
    </div>
  );
}
