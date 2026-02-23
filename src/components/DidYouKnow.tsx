import { useState, useEffect } from 'react';
import { askGemini } from '../services/gemini';
import { Lightbulb, RefreshCw, Sparkles, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DidYouKnow() {
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);

  const getFact = async () => {
    setLoading(true);
    try {
      const result = await askGemini('', 'fact');
      setFact(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFact();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-xl p-10 md:p-16 border border-amber-100 relative overflow-hidden text-center"
      >
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-50 rounded-full blur-3xl -ml-24 -mb-24 opacity-60" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex flex-col items-center mb-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-xl shadow-amber-100 mb-6"
            >
              <Lightbulb className="w-10 h-10" />
            </motion.div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Le Saviez-vous ?</h2>
            <p className="text-amber-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Culture & Curiosités Magiques</p>
          </div>

          <div className="min-h-[250px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <RefreshCw className="w-12 h-12 text-amber-400 animate-spin" />
                  <p className="text-slate-400 font-bold">Je cherche une info incroyable...</p>
                </motion.div>
              ) : (
                <motion.div
                  key={fact}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="relative">
                    <div className="absolute -left-4 -top-4 text-amber-100">
                      <Star className="w-8 h-8 fill-current" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold leading-relaxed text-slate-700 italic px-8">
                      "{fact}"
                    </p>
                    <div className="absolute -right-4 -bottom-4 text-amber-100">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={getFact}
            disabled={loading}
            className="mt-12 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 disabled:opacity-50 text-amber-950 font-black py-5 px-10 rounded-2xl transition-all shadow-xl shadow-amber-100 flex items-center gap-3 mx-auto active:scale-95 group"
          >
            <Zap className="w-5 h-5 group-hover:fill-current transition-all" />
            Apprendre autre chose !
          </button>
        </div>
      </motion.div>

      {/* Stats/Flavor cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 mb-1">Deviens un Génie</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Chaque anecdote est vérifiée par nos experts magiques pour t'aider à briller en classe !</p>
          </div>
        </div>
        <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 flex gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
            <Star className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 mb-1">Partage l'Info</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Impressionne tes amis et tes professeurs avec ces secrets du monde entier.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
