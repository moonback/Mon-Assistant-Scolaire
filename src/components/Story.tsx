import { useState } from 'react';
import { askGemini } from '../services/gemini';
import { Book, Wand2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

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
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-lg p-6 border-4 border-pink-200">
        <div className="flex items-center gap-3 mb-6 text-pink-600">
          <Book className="w-8 h-8" />
          <h2 className="text-2xl font-bold">La Fabrique à Histoires</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">Qui est le héros ?</label>
            <input
              type="text"
              value={hero}
              onChange={(e) => setHero(e.target.value)}
              placeholder="Ex: Un petit robot, Une licorne..."
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-pink-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">Où ça se passe ?</label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Ex: Dans l'espace, Sous la mer..."
              className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-pink-400 outline-none"
            />
          </div>
        </div>

        <button
          onClick={generateStory}
          disabled={loading || !hero}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 mb-8"
        >
          {loading ? <RefreshCw className="animate-spin" /> : <Wand2 />}
          {loading ? 'Écriture en cours...' : 'Inventer une histoire'}
        </button>

        {story && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-lg prose-pink max-w-none bg-pink-50 p-6 rounded-2xl border-2 border-pink-100"
          >
            <div className="whitespace-pre-wrap font-serif leading-relaxed text-slate-800">
              {story}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
