import { useState, useEffect } from 'react';
import { askGemini } from '../services/gemini';
import { Send, Sparkles, Eraser, History, Trash2, Clock } from 'lucide-react';

interface HistoryItem {
  id: string;
  question: string;
  response: string;
  date: number;
}

export default function Assistant() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('school_assistant_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('school_assistant_history', JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Tu dois écrire une question !');
      return;
    }
    
    setError('');
    setLoading(true);
    setResponse('');

    try {
      const answer = await askGemini(question, 'assistant');
      setResponse(answer);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        question: question,
        response: answer,
        date: Date.now()
      };
      setHistory(prev => [newItem, ...prev]);
    } catch (err) {
      setError("Je n'ai pas réussi à trouver la réponse. Réessaie !");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion('');
    setResponse('');
    setError('');
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setQuestion(item.question);
    setResponse(item.response);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    if (confirm('Veux-tu vraiment effacer tout ton historique ?')) {
      setHistory([]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Zone de saisie */}
      <section className="bg-white rounded-3xl shadow-sm p-6 border-2 border-sky-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="question" className="block text-lg font-medium text-slate-700">
            Quelle est ta question aujourd'hui ?
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Exemple : Comment on fait une division ? Qui est Louis XIV ?"
            className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 outline-none transition-all resize-none text-lg"
          />
          
          {error && (
            <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm font-medium animate-pulse">
              ⚠️ {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Je réfléchis...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Envoyer ma question
                </>
              )}
            </button>
            
            {question && (
              <button
                type="button"
                onClick={handleClear}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 px-4 rounded-xl transition-colors"
                aria-label="Effacer"
              >
                <Eraser className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Zone de réponse */}
      {response && (
        <section className="bg-white rounded-3xl shadow-md p-6 border-l-8 border-emerald-400 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Voici la réponse :
          </h2>
          <div className="prose prose-lg prose-slate max-w-none whitespace-pre-wrap leading-relaxed">
            {response}
          </div>
        </section>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <section className="bg-white/80 rounded-3xl shadow-sm p-6 border-2 border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-600 flex items-center gap-2">
              <History className="w-5 h-5" />
              Mes anciennes questions
            </h2>
            <button
              onClick={clearHistory}
              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm flex items-center gap-1"
              title="Effacer l'historique"
            >
              <Trash2 className="w-4 h-4" />
              Tout effacer
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className="w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-700 group-hover:text-sky-700 line-clamp-1">
                      {item.question}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(item.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
