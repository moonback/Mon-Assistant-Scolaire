import { useState, FormEvent } from 'react';
import { askGemini } from '../services/gemini';
import { Search, BookA, RefreshCw, Sparkles, Languages, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dictionary() {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    setDefinition('');

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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-xl p-8 md:p-12 border border-orange-100 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-50 rounded-full blur-3xl -ml-24 -mb-24 opacity-60" />

        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-orange-100">
              <BookA className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Le Super Dico</h2>
              <p className="text-orange-500 font-bold uppercase tracking-widest text-xs">Découvre le sens des mots</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-6 h-6 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Écris un mot difficile..."
              className="w-full pl-16 pr-32 py-6 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-orange-400 focus:bg-white focus:ring-8 focus:ring-orange-50 outline-none transition-all text-xl font-bold placeholder:text-slate-300"
            />
            <button
              type="submit"
              disabled={loading || !word}
              className="absolute right-3 top-3 bottom-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-black px-8 rounded-2xl transition-all shadow-lg shadow-orange-100 flex items-center gap-2 group active:scale-95"
            >
              {loading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Chercher</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex justify-center gap-3">
            {['Curiosité', 'Éphémère', 'Symphonie', 'Galaxie'].map(suggested => (
              <button
                key={suggested}
                onClick={() => { setWord(suggested); }}
                className="px-4 py-2 bg-slate-50 text-slate-500 rounded-full text-sm font-bold hover:bg-orange-50 hover:text-orange-600 transition-colors border border-transparent hover:border-orange-100"
              >
                {suggested}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {definition && (
          <motion.div
            key="definition"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-12 border border-orange-50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-400 opacity-50">
                <Languages className="w-6 h-6" />
              </div>
            </div>

            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-8 h-8 text-orange-500 fill-orange-500" />
                <h3 className="text-4xl font-black text-slate-800 capitalize tracking-tight">{word}</h3>
              </div>

              <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border border-orange-100">
                <div className="prose prose-lg prose-orange max-w-none">
                  <p className="text-xl font-medium leading-relaxed text-slate-700 italic">
                    {definition}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
