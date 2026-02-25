import { useState, FormEvent } from 'react';
import { askGemini } from '../services/gemini';
import { Search, BookA, RefreshCw, Volume2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpeechSynthesis } from '../hooks/useSpeech';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Le Petit Larousse IA</h2>
            <p className="text-xs font-semibold text-slate-500">Cherche n'importe quel mot et découvre sa magie.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Écris un mot..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-xs font-semibold outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-sm"
            />
          </div>
          <button type="submit" disabled={loading || !word} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60 shadow-lg shadow-indigo-100 transition-all">
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Chercher'}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {['Curiosité', 'Éphémère', 'Symphonie', 'Galaxie'].map((suggested) => (
            <button key={suggested} onClick={() => setWord(suggested)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-200 hover:text-indigo-600 transition-all">
              {suggested}
            </button>
          ))}
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {definition && (
          <motion.section key="definition" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 tracking-tight capitalize">{word}</h3>
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stop();
                  } else {
                    const cleanText = `${word}. ${definition}`.replace(/[*_#`]/g, '');
                    speak(cleanText);
                  }
                }}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600"
              >
                {isSpeaking ? <StopCircle className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-xs font-semibold leading-relaxed text-slate-700 shadow-inner">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-black text-indigo-700" {...props} />
                }}
              >
                {definition}
              </ReactMarkdown>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
