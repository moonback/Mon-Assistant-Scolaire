import { useState, useEffect } from 'react';
import { askGemini } from '../services/gemini';
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
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
    <div className="mx-auto max-w-3xl space-y-4 pb-8">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Le savais-tu ?</h2>
            <p className="text-sm text-slate-500">Une information courte pour apprendre chaque jour.</p>
          </div>
        </div>

        <div className="min-h-40 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" /> Chargement...
              </motion.div>
            ) : (
              <motion.p key={fact} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-sm leading-relaxed text-slate-700">
                {fact}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <button onClick={getFact} disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60">
          <Sparkles className="h-4 w-4" /> Nouvelle info
        </button>
      </motion.section>
    </div>
  );
}
