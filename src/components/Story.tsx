import { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Book, Wand2, RefreshCw, User, MapPin, Volume2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpeechSynthesis } from '../hooks/useSpeech';

export default function Story() {
  const [hero, setHero] = useState('');
  const [place, setPlace] = useState('');
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  const generateStory = async () => {
    if (!hero.trim()) return;
    setLoading(true);
    setStory('');
    stop();

    const prompt = `Héros: ${hero}, Lieu: ${place || 'un endroit mystérieux'}`;
    try {
      const result = await askGemini(prompt, 'story');
      setStory(result);
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
            <Book className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Conte Magique</h2>
            <p className="text-xs font-semibold text-slate-500">Décris un héros et un lieu pour créer une aventure.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <User className="h-3 w-3" /> Héros
            </span>
            <input
              type="text"
              value={hero}
              onChange={(e) => setHero(e.target.value)}
              placeholder="Ex: un robot curieux"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-sm"
            />
          </label>
          <label className="space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <MapPin className="h-3 w-3" /> Lieu
            </span>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Ex: une planète lointaine"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-sm"
            />
          </label>
        </div>

        <button
          onClick={generateStory}
          disabled={loading || !hero}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all disabled:opacity-60"
        >
          {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          {loading ? 'Génération...' : 'Créer mon histoire'}
        </button>
      </motion.section>

      <AnimatePresence mode="wait">
        {story && (
          <motion.section key="story" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 tracking-tight">Ton aventure magique</h3>
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stop();
                  } else {
                    speak(story.replace(/[*_#`]/g, ''));
                  }
                }}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600"
                title={isSpeaking ? "Arrêter" : "Écouter"}
              >
                {isSpeaking ? <StopCircle className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>

            <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-6 text-xs font-semibold leading-relaxed text-slate-700 shadow-inner">{story}</p>

            <button
              onClick={() => {
                setStory('');
                setHero('');
                setPlace('');
                stop();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <RefreshCw className="h-4 w-4" /> Nouvelle histoire
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
