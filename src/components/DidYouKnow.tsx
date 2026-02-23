import { useState, useEffect } from 'react';
import { askGemini } from '../services/gemini';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

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
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-lg p-6 border-4 border-yellow-200 text-center">
        <div className="flex items-center justify-center gap-3 mb-6 text-yellow-600">
          <Lightbulb className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Le Saviez-vous ?</h2>
        </div>

        <div className="min-h-[200px] flex items-center justify-center">
          {loading ? (
            <RefreshCw className="w-12 h-12 text-yellow-400 animate-spin" />
          ) : (
            <motion.div
              key={fact}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="prose prose-lg prose-yellow text-slate-700 font-medium"
            >
              {fact}
            </motion.div>
          )}
        </div>

        <button
          onClick={getFact}
          disabled={loading}
          className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 px-8 rounded-xl transition-colors"
        >
          Une autre anecdote !
        </button>
      </div>
    </div>
  );
}
