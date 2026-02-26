import { useState, useEffect } from 'react';
import { askGemini } from '../services/gemini';
import { Lightbulb, RefreshCw, Sparkles, BookOpen, Microscope, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';

export default function DidYouKnow() {
  const { selectedChild } = useAuth();
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);

  const getFact = async () => {
    setLoading(true);
    try {
      const result = await askGemini('', 'fact', selectedChild?.grade_level || 'CM1', undefined, undefined, undefined, selectedChild?.learning_profile);
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
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Le savais-tu ? ✨</h1>
          <p className="text-slate-500 font-semibold text-sm">Découvre chaque jour un secret incroyable sur le monde !</p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group px-4"
      >
        <section className="premium-card p-10 md:p-14 border-none shadow-sm relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-60" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -ml-24 -mb-24 opacity-60" />

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center justify-center py-24 gap-6 text-slate-400 relative z-10"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-200 blur-xl opacity-20 animate-pulse" />
                  <RefreshCw className="h-12 w-12 animate-spin text-indigo-500 relative z-10" />
                </div>
                <div className="text-center">
                  <p className="font-black text-lg text-slate-800 tracking-tight uppercase">L'IA parcourt l'encyclopédie...</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Un instant, petit génie</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={fact}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="prose prose-slate max-w-none relative z-10"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <div className="flex items-center gap-4 mt-12 first:mt-0 mb-6">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 border border-white shadow-inner flex items-center justify-center text-indigo-600 shrink-0">
                          {children?.toString().includes('ACCROCHE') ? <Sparkles className="w-6 h-6" /> :
                            children?.toString().includes('EXPLICATION') ? <BookOpen className="w-6 h-6" /> :
                              children?.toString().includes('PREUVE') ? <Microscope className="w-6 h-6" /> :
                                <Globe className="w-6 h-6" />}
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 m-0 tracking-tight leading-none">{children}</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Secret du Savoir</p>
                        </div>
                      </div>
                    ),
                    p: ({ children }) => <p className="text-lg leading-relaxed text-slate-700 font-semibold mb-8 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="text-indigo-700 font-black">{children}</strong>
                  }}
                >
                  {fact}
                </ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </motion.div>

      <div className="flex justify-center px-4">
        <motion.button
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={getFact}
          disabled={loading}
          className="group relative inline-flex items-center gap-4 rounded-3xl bg-slate-900 px-10 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-indigo-100 transition-all disabled:opacity-50"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center gap-4">
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            Une autre info magique !
          </span>
        </motion.button>
      </div>
    </div>
  );
}
