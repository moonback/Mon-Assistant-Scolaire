import { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Book, Wand2, RefreshCw, Sparkles, MapPin, User, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Story() {
  const [hero, setHero] = useState('');
  const [place, setPlace] = useState('');
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);

  const generateStory = async () => {
    if (!hero.trim()) return;
    setLoading(true);
    setStory('');

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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-xl p-8 md:p-12 border border-rose-100 relative overflow-hidden"
      >
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-50 rounded-full blur-3xl -ml-24 -mb-24 opacity-60" />

        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white shadow-xl shadow-rose-100">
              <Book className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">La Fabrique à Histoires</h2>
              <p className="text-rose-400 font-bold uppercase tracking-widest text-xs">Invente ton propre monde</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                <User className="w-4 h-4" />
                Le Héros
              </label>
              <input
                type="text"
                value={hero}
                onChange={(e) => setHero(e.target.value)}
                placeholder="Ex: Un petit robot curieux..."
                className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-rose-400 focus:bg-white outline-none transition-all font-bold text-lg"
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                <MapPin className="w-4 h-4" />
                Le Lieu
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Ex: Sur une planète de bonbons..."
                className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-rose-400 focus:bg-white outline-none transition-all font-bold text-lg"
              />
            </div>
          </div>

          <button
            onClick={generateStory}
            disabled={loading || !hero}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 text-white font-black py-5 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-100 text-lg group active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Magie en cours...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                <span>Inventer une histoire magique</span>
                <Sparkles className="w-5 h-5 text-rose-200" />
              </>
            )}
          </button>
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {story && (
          <motion.div
            key="story-result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-16 border border-rose-50 relative overflow-hidden"
          >
            <div className="absolute top-8 left-8 text-rose-100">
              <Star className="w-12 h-12 fill-current" />
            </div>
            <div className="absolute bottom-8 right-8 text-rose-100 rotate-12">
              <Book className="w-12 h-12" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="flex justify-center mb-10">
                <div className="px-6 py-2 bg-rose-50 text-rose-600 rounded-full font-black text-xs uppercase tracking-[0.3em]">
                  Ton Conte Magique
                </div>
              </div>
              <div className="prose prose-lg prose-rose max-w-none">
                <div className="whitespace-pre-wrap font-medium leading-[2.2] text-slate-700 text-xl text-center italic font-serif">
                  " {story} "
                </div>
              </div>

              <div className="mt-12 flex justify-center pt-8 border-t border-rose-50">
                <button
                  onClick={() => { setStory(''); setHero(''); setPlace(''); }}
                  className="text-slate-400 font-black hover:text-rose-500 transition-colors uppercase tracking-widest text-xs flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Nouvelle histoire
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
