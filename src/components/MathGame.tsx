import { useState, FormEvent, useEffect } from 'react';
import { Calculator, Check, X, RefreshCw, Trophy, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

    const val = parseInt(answer);
    let correct;

    switch (operator) {
      case '+': correct = num1 + num2; break;
      case '-': correct = num1 - num2; break;
      case 'x': correct = num1 * num2; break;
      default: correct = 0;
    }

    if (val === correct) {
      setMessage('Bravo ! 🎉');
      setStatus('correct');
      setScore(s => s + 1);
      onEarnPoints?.(5);
      setTimeout(generateProblem, 1000);
    } else {
      setMessage('Réessaie ! ⚡');
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 1000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[3rem] shadow-xl p-10 md:p-12 border border-emerald-100 relative overflow-hidden text-center"
      >
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-50 rounded-full blur-3xl -ml-24 -mb-24 opacity-60" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-100">
                <Calculator className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Calcul Mental</h2>
                <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Arcade des Maths</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Score</p>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <p className="text-2xl font-black text-slate-700">{score}</p>
                </div>
              </div>
              <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 text-center">Étoiles</p>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <p className="text-2xl font-black text-amber-600">{score * 5}</p>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${num1}-${num2}-${operator}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mb-12 py-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100"
            >
              <div className="text-7xl md:text-8xl font-black text-slate-800 tracking-tighter flex items-center justify-center gap-8">
                <span>{num1}</span>
                <span className="text-emerald-400">{operator}</span>
                <span>{num2}</span>
                <span className="text-slate-300">=</span>
                <span className="text-indigo-600">?</span>
              </div>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={checkAnswer} className="max-w-xs mx-auto space-y-6">
            <div className="relative group">
              <input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="0"
                className={`w-full text-center text-5xl font-black p-8 rounded-[2rem] border-4 outline-none transition-all shadow-lg ${status === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-8 ring-emerald-100' :
                    status === 'wrong' ? 'border-rose-500 bg-rose-50 text-rose-700 ring-8 ring-rose-100' :
                      'border-slate-200 focus:border-indigo-400 focus:bg-white focus:ring-8 focus:ring-indigo-50 text-slate-700'
                  }`}
                autoFocus
              />
              <AnimatePresence>
                {status === 'correct' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-200"
                  >
                    <Check className="w-8 h-8 stroke-[3]" />
                  </motion.div>
                )}
                {status === 'wrong' && (
                  <motion.div
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-rose-200"
                  >
                    <X className="w-8 h-8 stroke-[3]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={!answer || status !== 'idle'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-6 rounded-2xl transition-all shadow-xl shadow-indigo-100 text-xl group active:scale-95"
            >
              Envoyer la réponse
            </button>
          </form>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className={`mt-10 inline-flex items-center gap-3 px-8 py-3 rounded-full font-black text-lg ${status === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
              >
                {status === 'correct' ? <Zap className="w-5 h-5 fill-current" /> : <RefreshCw className="w-5 h-5" />}
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Tips */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Zap, label: "Rapidité", desc: "Plus tu vas vite, plus ton cerveau devient musclé !" },
          { icon: Star, label: "Précision", desc: "Gagne 5 étoiles par calcul réussi." },
          { icon: Trophy, label: "Record", desc: "Tente de battre ton meilleur score." }
        ].map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-white/80 p-6 rounded-[2rem] border border-slate-100 shadow-sm"
          >
            <tip.icon className="w-6 h-6 text-emerald-500 mb-3" />
            <h4 className="font-black text-slate-800 mb-1">{tip.label}</h4>
            <p className="text-sm text-slate-500 font-medium">{tip.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
