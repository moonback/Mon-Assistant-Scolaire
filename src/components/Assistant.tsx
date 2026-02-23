import { useState, useEffect, FormEvent, useRef } from 'react';
import { askGemini } from '../services/gemini';
import { Send, Sparkles, Eraser, History, Trash2, Clock, CheckCircle2, Mic, Volume2, StopCircle, Image as ImageIcon, X } from 'lucide-react';
import { useSpeechRecognition, useSpeechSynthesis } from '../hooks/useSpeech';

interface HistoryItem {
  id: string;
  question: string;
  response: string;
  date: number;
  image?: string;
}

interface AssistantProps {
  onEarnPoints?: (amount: number) => void;
  gradeLevel?: string;
}

export default function Assistant({ onEarnPoints, gradeLevel = 'CM1' }: AssistantProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);
  
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('school_assistant_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('school_assistant_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (transcript) {
      setQuestion(prev => prev ? prev + ' ' + transcript : transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() && !selectedImage) {
      setError('Tu dois écrire une question ou envoyer une image !');
      return;
    }
    
    setError('');
    setLoading(true);
    setResponse('');
    setVerificationAnswer('');
    setVerificationFeedback('');
    stopSpeaking();

    try {
      const answer = await askGemini(question, 'assistant', gradeLevel, selectedImage || undefined);
      setResponse(answer);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        question: question,
        response: answer,
        date: Date.now(),
        image: selectedImage || undefined
      };
      setHistory(prev => [newItem, ...prev]);
      
      // Auto-speak response if it was a voice query (optional, but nice)
      // speak(answer); 
    } catch (err) {
      setError("Je n'ai pas réussi à trouver la réponse. Réessaie !");
    } finally {
      setLoading(false);
      setSelectedImage(null);
    }
  };

  const handleVerificationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verificationAnswer.trim()) return;

    setCheckingVerification(true);
    try {
      const prompt = `
        Contexte :
        Question élève : "${question}"
        Ta réponse précédente : "${response}"
        
        Réponse de l'élève à ta question de vérification : "${verificationAnswer}"
        
        Tâche : Dis à l'élève si sa réponse est bonne ou non.
        IMPORTANT : Commence ta réponse par [CORRECT] si c'est bon, ou [INCORRECT] si c'est faux.
        Ensuite, explique pourquoi gentiment.
      `;
      const feedback = await askGemini(prompt, 'assistant', gradeLevel);
      
      const isCorrect = feedback.includes('[CORRECT]');
      const cleanFeedback = feedback.replace('[CORRECT]', '').replace('[INCORRECT]', '').trim();
      
      setVerificationFeedback(cleanFeedback);
      
      if (isCorrect) {
        onEarnPoints?.(20); // 20 points for verification
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleClear = () => {
    setQuestion('');
    setResponse('');
    setError('');
    setVerificationAnswer('');
    setVerificationFeedback('');
    setSelectedImage(null);
    stopSpeaking();
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setQuestion(item.question);
    setResponse(item.response);
    setSelectedImage(item.image || null);
    setError('');
    setVerificationAnswer('');
    setVerificationFeedback('');
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
          
          <div className="relative">
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Exemple : Comment on fait une division ? Qui est Louis XIV ?"
              className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 outline-none transition-all resize-none text-lg pr-12"
            />
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`absolute right-3 bottom-3 p-2 rounded-full transition-all ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-sky-100 hover:text-sky-600'
              }`}
              title="Parler"
            >
              {isListening ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          </div>

          {/* Image Preview */}
          {selectedImage && (
            <div className="relative inline-block">
              <img src={selectedImage} alt="Aperçu" className="h-24 w-auto rounded-lg border-2 border-sky-200" />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {error && (
            <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm font-medium animate-pulse">
              ⚠️ {error}
            </p>
          )}

          <div className="flex gap-3 flex-wrap">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 px-4 rounded-xl transition-colors flex items-center gap-2"
              title="Ajouter une image"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Photo</span>
            </button>

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
                  Envoyer
                </>
              )}
            </button>
            
            {(question || selectedImage) && (
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
        <section className="bg-white rounded-3xl shadow-md p-6 border-l-8 border-emerald-400 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Voici la réponse :
              </h2>
              <button
                onClick={() => isSpeaking ? stopSpeaking() : speak(response)}
                className={`p-2 rounded-full transition-colors ${
                  isSpeaking ? 'bg-emerald-200 text-emerald-800 animate-pulse' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
                title={isSpeaking ? "Arrêter la lecture" : "Lire la réponse"}
              >
                {isSpeaking ? <StopCircle className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>
            <div className="prose prose-lg prose-slate max-w-none whitespace-pre-wrap leading-relaxed">
              {response}
            </div>
          </div>

          {/* Section Vérification */}
          <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-100">
            <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              As-tu bien compris ?
            </h3>
            <p className="text-sm text-emerald-700 mb-4">
              Réponds à la petite question posée à la fin de l'explication ci-dessus :
            </p>
            
            <form onSubmit={handleVerificationSubmit} className="flex gap-2">
              <input
                type="text"
                value={verificationAnswer}
                onChange={(e) => setVerificationAnswer(e.target.value)}
                placeholder="Ta réponse..."
                className="flex-1 p-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-400 outline-none"
                disabled={checkingVerification || !!verificationFeedback}
              />
              <button
                type="submit"
                disabled={checkingVerification || !verificationAnswer || !!verificationFeedback}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold px-4 rounded-xl transition-colors"
              >
                {checkingVerification ? <Sparkles className="animate-spin w-5 h-5" /> : 'Vérifier'}
              </button>
            </form>

            {verificationFeedback && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-200 animate-in fade-in slide-in-from-top-2">
                <p className="text-emerald-800 font-medium">{verificationFeedback}</p>
              </div>
            )}
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 group-hover:text-sky-700 line-clamp-1 flex items-center gap-2">
                      {item.image && <ImageIcon className="w-4 h-4 text-sky-500" />}
                      {item.question || "Question avec image"}
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

