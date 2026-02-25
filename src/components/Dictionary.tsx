import { useState, FormEvent } from 'react';
import { askGemini } from '../services/gemini';
import { Search, BookA, RefreshCw, Volume2, StopCircle } from 'lucide-react';
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
    <div className="mx-auto max-w-4xl space-y-4 pb-8">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600">
            <BookA className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Dictionnaire</h2>
            <p className="text-sm text-slate-500">Cherche un mot et lis sa définition.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Écris un mot"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
            />
          </div>
          <button type="submit" disabled={loading || !word} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Chercher'}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {['Curiosité', 'Éphémère', 'Symphonie', 'Galaxie'].map((suggested) => (
            <button key={suggested} onClick={() => setWord(suggested)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              {suggested}
            </button>
          ))}
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {definition && (
          <motion.section key="definition" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize text-slate-900">{word}</h3>
              <button
                onClick={() => (isSpeaking ? stop() : speak(`${word}. ${definition}`))}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600"
              >
                {isSpeaking ? <StopCircle className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{definition}</p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
