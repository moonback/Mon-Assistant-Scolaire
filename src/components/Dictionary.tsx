import { useState, FormEvent } from 'react';
import { askGemini } from '../services/gemini';
import { Search, BookA, RefreshCw, Sparkles, Languages, ArrowRight, Volume2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpeechSynthesis } from '../hooks/useSpeech';

export default function Dictionary() {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [loading, setLoading] = useState(false);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    setDefinition('');
    stop();

    try {
      const result = await askGemini(word, 'definition');
      setDefinition(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-600 rounded-[4rem] blur opacity-15 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-white/90 backdrop-blur-2xl rounded-[4rem] shadow-premium border border-white/50 p-10 md:p-16 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-100/50 rounded-full blur-3xl -mr-40 -mt-40 opacity-40 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl -ml-32 -mb-32 opacity-40 animate-pulse" />

          <div className="relative z-10">
            <header className="flex flex-col md:flex-row items-center gap-8 mb-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white shadow-2xl shadow-orange-100 ring-8 ring-orange-50">
                <BookA className="w-10 h-10" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Le Super <span className="text-orange-600">Dico</span></h2>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Explore la magie des mots</p>
                </div>
              </div>
            </header>

            <form onSubmit={handleSearch} className="relative group/form max-w-3xl mx-auto">
              <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none z-10">
                <Search className="w-7 h-7 text-slate-400 group-focus-within/form:text-orange-500 group-focus-within/form:scale-110 transition-all" />
              </div>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Quel mot magique cherches-tu ?"
                className="w-full pl-20 pr-44 py-8 rounded-[2.5rem] bg-slate-50/50 border-2 border-transparent focus:border-orange-400 focus:bg-white focus:ring-[15px] focus:ring-orange-50/50 outline-none transition-all text-2xl font-bold placeholder:text-slate-300 shadow-inner"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, x: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || !word}
                className="absolute right-3 top-3 bottom-3 bg-slate-900 hover:bg-orange-600 text-white font-black px-10 rounded-[2rem] transition-all shadow-xl flex items-center gap-3 active:scale-95 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-3 uppercase tracking-widest text-[10px]">
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Chercher</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {['Exploration', 'Imaginaire', 'Curiosité', 'Symphonie', 'Constellation'].map((suggested, idx) => (
                <motion.button
                  key={suggested}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -2, backgroundColor: '#fff7ed', borderColor: '#fed7aa', color: '#ea580c' }}
                  onClick={() => { setWord(suggested); }}
                  className="px-6 py-3 bg-white text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 shadow-sm"
                >
                  {suggested}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {definition && (
          <motion.div
            key="definition"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-600 rounded-[4rem] blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
            <div className="relative bg-white/95 backdrop-blur-2xl rounded-[4rem] shadow-premium border border-white/50 p-12 lg:p-16 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-200"
                >
                  <Languages className="w-8 h-8" />
                </motion.div>
              </div>

              <div className="max-w-4xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-100">
                      <Sparkles className="w-8 h-8 fill-current" />
                    </div>
                    <h3 className="text-5xl font-black text-slate-900 capitalize tracking-tight">{word}</h3>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => isSpeaking ? stop() : speak(`${word}. ${definition}`)}
                    className={`p-6 rounded-3xl transition-all shadow-xl border-2 ${isSpeaking
                      ? 'bg-orange-500 text-white border-orange-400 animate-pulse'
                      : 'bg-white text-orange-500 hover:bg-orange-50 border-slate-100/50'
                      }`}
                  >
                    {isSpeaking ? <StopCircle className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
                  </motion.button>
                </div>

                <div className="relative pl-12 pr-6">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-500/30 via-orange-500/10 to-transparent rounded-full" />
                  <div className="prose prose-2xl prose-orange max-w-none">
                    <p className="text-2xl font-semibold leading-relaxed text-slate-700/90 italic tracking-tight">
                      {definition}
                    </p>
                  </div>
                </div>

                <div className="mt-16 p-8 bg-orange-50/30 rounded-[2.5rem] border border-orange-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                  <p className="text-orange-900/60 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3">
                    <Sparkles className="w-4 h-4" />
                    Chaque nouveau mot est une clé pour ton imagination
                  </p>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-orange-100 shadow-sm">
                    <span className="text-orange-600 font-black text-[9px] uppercase tracking-widest">Points d&apos;érudition</span>
                    <span className="text-orange-800 font-bold">+5 ⭐</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
