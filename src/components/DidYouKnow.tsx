import { useState, useEffect } from 'react';
import { askGemini } from '../services/gemini';
import { Lightbulb, RefreshCw, Sparkles, BookOpen, Microscope, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
      setFact("Oups ! Une petite erreur technique. Appuie sur le bouton pour réessayer ! 🔄");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFact();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <header className="text-center space-y-2 mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-500 mb-4 shadow-inner"
        >
          <Lightbulb className="w-8 h-8" />
        </motion.div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Le savais-tu ? ✨</h1>
        <p className="text-slate-500 font-medium">Découvre chaque jour un secret incroyable sur le monde !</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        {/* Magic Glow behind */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-indigo-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

        <section className="relative rounded-[2.5rem] border border-white/60 bg-white/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl shadow-slate-200/50 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100/30 rounded-full blur-3xl -ml-16 -mb-16" />

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400"
              >
                <RefreshCw className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="font-bold text-lg animate-pulse">L'IA parcourt l'encyclopédie...</p>
              </motion.div>
            ) : (
              <motion.div
                key={fact}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="prose prose-slate max-w-none"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <div className="flex items-center gap-3 mt-8 first:mt-0 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                          {children?.toString().includes('ACCROCHE') ? <Sparkles className="w-5 h-5" /> :
                            children?.toString().includes('EXPLICATION') ? <BookOpen className="w-5 h-5" /> :
                              children?.toString().includes('PREUVE') ? <Microscope className="w-5 h-5" /> :
                                <Globe className="w-5 h-5" />}
                        </div>
                        <h2 className="text-xl font-black text-slate-800 m-0 uppercase tracking-tight">{children}</h2>
                      </div>
                    ),
                    p: ({ children }) => <p className="text-lg leading-relaxed text-slate-600 font-medium mb-6 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="text-indigo-600 font-black">{children}</strong>
                  }}
                >
                  {fact}
                </ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </motion.div>

      <div className="flex justify-center pt-8">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={getFact}
          disabled={loading}
          className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-black text-white shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all disabled:opacity-50 border-b-4 border-indigo-800 active:border-b-0"
        >
          {loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
          Une autre info magique !
        </motion.button>
      </div>
    </div>
  );
}
