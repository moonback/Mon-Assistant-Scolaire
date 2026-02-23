import { useState, FormEvent } from 'react';
import { askGemini } from '../services/gemini';
import { Search, BookA, RefreshCw } from 'lucide-react';

export default function Dictionary() {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    
    setLoading(true);
    setDefinition('');
    
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
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-lg p-6 border-4 border-orange-200">
        <div className="flex items-center gap-3 mb-6 text-orange-600">
          <BookA className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Le Super Dico</h2>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Écris un mot difficile..."
            className="flex-1 p-3 rounded-xl border-2 border-slate-200 focus:border-orange-400 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !word}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 rounded-xl transition-colors"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Search />}
          </button>
        </form>

        {definition && (
          <div className="bg-orange-50 p-6 rounded-2xl border-l-4 border-orange-400">
            <h3 className="text-xl font-bold text-orange-800 mb-2 capitalize">{word}</h3>
            <div className="prose prose-orange text-slate-700 whitespace-pre-wrap">
              {definition}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
