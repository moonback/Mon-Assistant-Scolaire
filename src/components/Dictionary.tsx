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

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setWord(searchTerm);
    setLoading(true);
    setDefinition('');
    stop();

    try {
      const result = await askGemini(searchTerm, 'definition');
      setDefinition(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    performSearch(word);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dico Magique 📚</h1>
          <p className="text-slate-500 font-semibold text-sm">Cherche n'importe quel mot et découvre sa magie.</p>
        </div>
      </header>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-8 border-none shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

        <div className="mb-8 flex items-start gap-4 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
            <BookA className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1.5">Le Petit Larousse IA</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none outline-none">Exploration de vocabulaire</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Écris un mot à explorer..."
              className="w-full rounded-2xl border-2 border-transparent bg-slate-50 p-4 pl-11 text-xs font-bold text-slate-800 outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
            />
          </div>
          <button type="submit" disabled={loading || !word} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Chercher le sens'}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2 relative z-10">
          {['Renaissance', 'Archipel', 'Photosynthèse', 'Perspective', 'Algorithme'].map((suggested) => (
            <button key={suggested} onClick={() => performSearch(suggested)} className="rounded-full border border-slate-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm transition-all">
              {suggested}
            </button>
          ))}
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {definition && (
          <motion.section key="definition" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="premium-card p-8 border-none shadow-sm relative overflow-hidden">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize">{word}</h3>
              </div>
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stop();
                  } else {
                    const cleanText = `${word}. ${definition}`.replace(/[*_#`]/g, '');
                    speak(cleanText);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isSpeaking ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'}`}
              >
                {isSpeaking ? (
                  <>
                    <StopCircle className="h-3.5 w-3.5" /> Arrêter
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" /> Écouter
                  </>
                )}
              </button>
            </div>
            <div className="rounded-3xl border border-white bg-slate-50/50 p-8 text-sm font-semibold leading-relaxed text-slate-700 shadow-inner">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
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
