import { useState, FormEvent } from 'react';
import { Calculator, Check, X, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface MathGameProps {
  onEarnPoints?: (amount: number) => void;
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

    let n1, n2;
    if (op === 'x') {
      n1 = Math.floor(Math.random() * 10) + 1;
      n2 = Math.floor(Math.random() * 10) + 1;
    } else {
      n1 = Math.floor(Math.random() * 50) + 1;
      n2 = Math.floor(Math.random() * 50) + 1;
    }

    if (op === '-' && n1 < n2) [n1, n2] = [n2, n1]; // Avoid negative results

    setNum1(n1);
    setNum2(n2);
    setAnswer('');
    setMessage('');
    setStatus('idle');
  };

  // Init
  if (num1 === 0) generateProblem();

  const checkAnswer = (e: FormEvent) => {
    e.preventDefault();
    const val = parseInt(answer);
    let correct;
    
    switch(operator) {
      case '+': correct = num1 + num2; break;
      case '-': correct = num1 - num2; break;
      case 'x': correct = num1 * num2; break;
      default: correct = 0;
    }

    if (val === correct) {
      setMessage('Bravo ! 🎉');
      setStatus('correct');
      setScore(s => s + 1);
      onEarnPoints?.(5); // 5 points per correct answer
      setTimeout(generateProblem, 1500);
    } else {
      setMessage('Essaie encore ! 🤔');
      setStatus('wrong');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-lg p-6 border-4 border-emerald-200 text-center">
        <div className="flex items-center justify-center gap-3 mb-6 text-emerald-600">
          <Calculator className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Calcul Mental</h2>
        </div>

        <div className="text-6xl font-bold text-slate-700 mb-8 font-mono">
          {num1} {operator} {num2} = ?
        </div>

        <form onSubmit={checkAnswer} className="max-w-xs mx-auto space-y-4">
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className={`w-full text-center text-3xl p-4 rounded-2xl border-4 outline-none transition-colors ${
              status === 'correct' ? 'border-green-400 bg-green-50' :
              status === 'wrong' ? 'border-red-400 bg-red-50' :
              'border-slate-200 focus:border-emerald-400'
            }`}
            autoFocus
          />
          
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors text-lg"
          >
            Vérifier
          </button>
        </form>

        {message && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`mt-6 text-xl font-bold ${status === 'correct' ? 'text-green-600' : 'text-red-500'}`}
          >
            {message}
          </motion.div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-slate-400 font-bold uppercase tracking-wider text-sm">Score actuel</p>
          <p className="text-4xl font-black text-emerald-500">{score}</p>
        </div>
      </div>
    </div>
  );
}
