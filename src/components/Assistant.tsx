import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { askGemini } from '../services/gemini';
import { Send, Sparkles, Eraser, History, Trash2, Clock, CheckCircle2, Mic, Volume2, StopCircle, Image as ImageIcon, X, ChevronRight, User } from 'lucide-react';
import { useSpeechRecognition, useSpeechSynthesis } from '../hooks/useSpeech';
import { motion, AnimatePresence } from 'motion/react';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface HistoryItem {
  id: string;
  question: string;
  response: string;
  date: string;
  image_url?: string;
}

interface AssistantProps {
  onEarnPoints?: (amount: number, activityType: string, subject: string) => void;
  gradeLevel?: string;
}

export default function Assistant({ onEarnPoints, gradeLevel = 'CM1' }: AssistantProps) {
  const { selectedChild } = useAuth();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

  useEffect(() => {
    async function fetchHistory() {
      if (!selectedChild) return;
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setHistory(data.map(item => ({
          id: item.id,
          question: item.question,
          response: item.response,
          date: item.created_at,
          image_url: item.image_url
        })));
      }
    }
    fetchHistory();
  }, [selectedChild]);

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

      if (selectedChild) {
        const { data: newItem, error: insertError } = await supabase
          .from('conversations')
          .insert({
            child_id: selectedChild.id,
            question: question,
            response: answer,
            image_url: selectedImage || undefined
          })
          .select()
          .single();

        if (!insertError && newItem) {
          setHistory(prev => [{
            id: newItem.id,
            question: newItem.question,
            response: newItem.response,
            date: newItem.created_at,
            image_url: newItem.image_url
          }, ...prev]);
        }
      }
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
        onEarnPoints?.(20, 'assistant', 'General');
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
    setSelectedImage(item.image_url || null);
    setError('');
    setVerificationAnswer('');
    setVerificationFeedback('');
  };

  const clearHistory = async () => {
    if (confirm('Veux-tu vraiment effacer tout ton historique ?') && selectedChild) {
      await supabase.from('conversations').delete().eq('child_id', selectedChild.id);
      setHistory([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Interaction Zone */}
        <div className="flex-1 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Pose ta question...
                </h2>
              </div>

              <div className="relative group">
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Exemple : Comment on fait une division ? Qui est Louis XIV ?"
                  className="w-full h-40 p-6 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white focus:ring-8 focus:ring-indigo-50 outline-none transition-all resize-none text-lg font-medium pr-16"
                />
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-4 bottom-4 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-red-200'
                    : 'bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                  title="Parler"
                >
                  {isListening ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
              </div>

              {/* Image Preview */}
              <AnimatePresence>
                {selectedImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative inline-block"
                  >
                    <img src={selectedImage} alt="Aperçu" className="h-32 w-auto rounded-3xl border-4 border-white shadow-xl" />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 bg-red-50 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  {error}
                </motion.div>
              )}

              <div className="flex gap-4">
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
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 px-6 rounded-2xl transition-all flex items-center gap-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Photo</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-100 group"
                >
                  {loading ? (
                    <>
                      <Sparkles className="w-6 h-6 animate-spin" />
                      <span>Je réfléchis...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      <span>Poser ma question</span>
                    </>
                  )}
                </button>

                {(question || selectedImage) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 font-bold py-4 px-4 rounded-2xl transition-all border border-slate-100"
                  >
                    <Eraser className="w-6 h-6" />
                  </button>
                )}
              </div>
            </form>
          </motion.section>

          {/* Response Area */}
          <AnimatePresence mode="wait">
            {response && (
              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[3rem] shadow-xl p-8 md:p-10 border border-indigo-50 relative overflow-hidden space-y-8"
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16" />

                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Magic Réponse</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Explications claires</p>
                      </div>
                    </div>

                    <button
                      onClick={() => isSpeaking ? stopSpeaking() : speak(response)}
                      className={`w-12 h-12 rounded-2xl transition-all shadow-md flex items-center justify-center ${isSpeaking
                        ? 'bg-emerald-500 text-white animate-pulse shadow-emerald-200'
                        : 'bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      title={isSpeaking ? "Arrêter la lecture" : "Lire la réponse"}
                    >
                      {isSpeaking ? <StopCircle className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                  </div>

                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                    <div className="prose prose-lg prose-indigo max-w-none whitespace-pre-wrap leading-relaxed font-semibold text-slate-700">
                      {response}
                    </div>
                  </div>
                </div>

                {/* Verification Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2.5rem] p-8 border border-emerald-100/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h3 className="font-black text-emerald-800 text-xl">Mission Comprise ?</h3>
                  </div>
                  <p className="text-emerald-700/80 font-bold mb-6 italic">
                    "Une petite question magique se cache à la fin de ma réponse... Peux-tu y répondre ?"
                  </p>

                  <form onSubmit={handleVerificationSubmit} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={verificationAnswer}
                        onChange={(e) => setVerificationAnswer(e.target.value)}
                        placeholder="Ta réponse magique ici..."
                        className="w-full p-5 rounded-2xl bg-white border-2 border-emerald-100 focus:border-emerald-400 outline-none transition-all font-bold placeholder:text-emerald-200"
                        disabled={checkingVerification || !!verificationFeedback}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={checkingVerification || !verificationAnswer || !!verificationFeedback}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-8 py-5 rounded-2xl transition-all shadow-lg shadow-emerald-100 whitespace-nowrap active:scale-95"
                    >
                      {checkingVerification ? <Sparkles className="animate-spin w-6 h-6" /> : 'Vérifier ma réponse'}
                    </button>
                  </form>

                  <AnimatePresence>
                    {verificationFeedback && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 p-6 bg-white rounded-2xl border-2 border-emerald-200 shadow-sm"
                      >
                        <p className="text-emerald-800 font-black text-lg flex items-center gap-2">
                          {verificationFeedback.includes('Bravo') ? '🌟' : '💡'} {verificationFeedback}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Historique */}
        <aside className="w-full lg:w-80 space-y-6">
          <section className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-100 sticky top-28">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                <History className="w-6 h-6 text-indigo-500" />
                Mémoire
              </h2>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-slate-300 hover:text-red-500 transition-colors p-2"
                  title="Effacer tout"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => loadHistoryItem(item)}
                  className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group relative"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                      {item.image_url ? <ImageIcon className="w-5 h-5 text-indigo-400" /> : <Clock className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-700 group-hover:text-indigo-700 line-clamp-2 leading-snug">
                        {item.question || "Analyse d'image"}
                      </p>
                      <p className="text-[10px] font-black text-slate-300 mt-2 uppercase tracking-widest">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 mt-1" />
                  </div>
                </motion.button>
              ))}

              {history.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm px-4">Tes questions apparaîtront ici !</p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

