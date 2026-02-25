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
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-[4rem] blur opacity-15 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-white/90 backdrop-blur-2xl rounded-[4rem] shadow-premium border border-white/50 p-10 md:p-16 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl -mr-40 -mt-40 opacity-40 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-40 animate-pulse" />

          <div className="relative z-10">
            <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-200 ring-8 ring-emerald-50">
                  <Calculator className="w-10 h-10" />
                </div>
                <div className="text-left">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cerveau <span className="text-emerald-600">Rapide</span></h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entraîne ton génie</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="bg-slate-50/80 px-6 py-4 rounded-[1.5rem] border border-slate-100 shadow-inner">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-center">Niveau Actuel</p>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <p className="text-2xl font-black text-slate-800">{score}</p>
                  </div>
                </div>
                <div className="bg-amber-50/80 px-6 py-4 rounded-[1.5rem] border border-amber-100 shadow-inner">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5 text-center">Étoiles</p>
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    <p className="text-2xl font-black text-amber-700">{score * 5}</p>
                  </div>
                </div>
              </div>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${num1}-${num2}-${operator}`}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.1, opacity: 0, y: -20 }}
                transition={{ type: 'spring', damping: 15 }}
                className="mb-16 py-12 bg-slate-50/30 rounded-[3.5rem] border border-slate-100 flex items-center justify-center group/problem"
              >
                <div className="text-8xl md:text-9xl font-black text-slate-900 tracking-tighter flex items-center justify-center gap-10">
                  <span className="drop-shadow-sm">{num1}</span>
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-emerald-500 drop-shadow-lg"
                  >
                    {operator === 'x' ? '×' : operator}
                  </motion.span>
                  <span className="drop-shadow-sm">{num2}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            <form onSubmit={checkAnswer} className="max-w-md mx-auto space-y-8">
              <div className="relative group/input">
                <input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="?"
                  className={`w-full text-center text-7xl font-black p-10 rounded-[3rem] border-4 outline-none transition-all shadow-premium ${status === 'correct' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 ring-[15px] ring-emerald-100' :
                    status === 'wrong' ? 'border-rose-500 bg-rose-50/50 text-rose-700 ring-[15px] ring-rose-100' :
                      'border-transparent bg-slate-100/50 focus:border-emerald-400 focus:bg-white focus:ring-[15px] focus:ring-emerald-50 text-slate-800'
                    }`}
                  autoFocus
                />
                <AnimatePresence>
                  {status === 'correct' && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 ring-8 ring-white"
                    >
                      <Check className="w-10 h-10 stroke-[4]" />
                    </motion.div>
                  )}
                  {status === 'wrong' && (
                    <motion.div
                      initial={{ scale: 0, rotate: 45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -right-6 -top-6 w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-rose-200 ring-8 ring-white"
                    >
                      <X className="w-10 h-10 stroke-[4]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!answer || status !== 'idle'}
                className="w-full h-24 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-3xl transition-all shadow-xl shadow-slate-200 text-xl uppercase tracking-[0.2em] relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <span className="relative z-10">Valider ma réponse</span>
              </motion.button>
            </form>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="mt-12 text-center"
                >
                  <div className={`inline-flex items-center gap-4 px-10 py-4 rounded-full font-black text-xl shadow-xl ${status === 'correct' ? 'bg-emerald-100 text-emerald-700 shadow-emerald-100' : 'bg-rose-100 text-rose-700 shadow-rose-100'
                    }`}>
                    {status === 'correct' ? <Zap className="w-6 h-6 fill-current" /> : <RefreshCw className="w-6 h-6" />}
                    {message}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: Zap, label: "Super Vitesse", desc: "Réponds le plus vite possible pour battre les records !", color: "emerald" },
          { icon: Star, label: "Points Magiques", desc: "Chaque bonne réponse te rapproche d'un nouveau badge.", color: "amber" },
          { icon: Trophy, label: "Maître du Calcul", desc: "Débloque des défis secrets en montant de niveau.", color: "indigo" }
        ].map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-premium group"
          >
            <div className={`w-14 h-14 rounded-2xl bg-${tip.color}-50 flex items-center justify-center text-${tip.color}-500 mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all`}>
              <tip.icon className="w-7 h-7" />
            </div>
            <h4 className="font-black text-slate-900 text-lg mb-2 tracking-tight">{tip.label}</h4>
            <p className="text-sm text-slate-400 font-bold leading-relaxed tracking-tight">{tip.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
