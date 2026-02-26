import { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Book, Wand2, RefreshCw, User, MapPin, Volume2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpeechSynthesis } from '../hooks/useSpeech';
import { useAuth } from '../contexts/AuthContext';

export default function Story() {
  const { selectedChild } = useAuth();
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
      const result = await askGemini(prompt, 'story', selectedChild?.grade_level || 'CM1', undefined, undefined, undefined, selectedChild?.learning_profile);
      setStory(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Conte Magique 📖</h1>
          <p className="text-slate-500 font-semibold text-sm">Crée des aventures extraordinaires avec l'IA !</p>
        </div>
      </header>

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-8 border-none shadow-sm">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
            <Book className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Nouvelle Histoire</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Configure ton aventure</p>
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
          <motion.section key="story" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="premium-card p-8 border-none shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

            <div className="mb-6 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Ton aventure magique</h3>
              </div>
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stop();
                  } else {
                    speak(story.replace(/[*_#`]/g, ''));
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

            <div className="rounded-3xl border border-white bg-slate-50/50 p-8 text-sm font-semibold leading-relaxed text-slate-700 shadow-inner mb-6 relative z-10 whitespace-pre-wrap">
              {story}
            </div>

            <button
              onClick={() => {
                setStory('');
                setHero('');
                setPlace('');
                stop();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all relative z-10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Nouvelle aventure
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
