import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { askGemini } from '../services/gemini';
import { Send, Sparkles, Eraser, History, Trash2, Clock, CheckCircle2, Mic, Volume2, StopCircle, Image as ImageIcon, X, ChevronRight, User, RefreshCw, Trophy, Lightbulb } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col xl:flex-row gap-10">
        {/* Main Interaction Zone */}
        <div className="flex-1 space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3.5rem] blur opacity-15 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative bg-white/90 backdrop-blur-2xl rounded-[3.5rem] shadow-premium border border-white/50 p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Dis-moi tout...
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ton assistant intelligent est prêt</p>
                      </div>
                    </div>
                  </div>

                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm"
                    >
                      <div className="flex gap-1">
                        <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-red-500 rounded-full" />
                        <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1 bg-red-500 rounded-full" />
                        <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1 bg-red-500 rounded-full" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">En écoute</span>
                    </motion.div>
                  )}
                </div>

                <div className="relative group/textarea">
                  <textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Pose n&apos;importe quelle question... &#10;Ex: Explique-moi le cycle de l&apos;eau."
                    className="w-full h-48 p-8 rounded-[2.5rem] bg-slate-50/50 border-2 border-transparent focus:border-indigo-400 focus:bg-white focus:ring-[12px] focus:ring-indigo-50/50 outline-none transition-all resize-none text-xl font-medium pr-20 placeholder:text-slate-300 leading-relaxed shadow-inner"
                  />

                  <div className="absolute right-6 bottom-6 flex flex-col gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={isListening ? stopListening : startListening}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl ${isListening
                        ? 'bg-red-500 text-white shadow-red-200 ring-4 ring-red-50'
                        : 'bg-white text-slate-400 hover:text-indigo-600 hover:bg-slate-50 border border-slate-100'
                        }`}
                    >
                      {isListening ? <StopCircle className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                    </motion.button>
                  </div>
                </div>

                {/* Image Preview */}
                <AnimatePresence>
                  {selectedImage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative inline-block group/img"
                    >
                      <img src={selectedImage} alt="Aperçu" className="h-40 w-auto rounded-3xl border-4 border-white shadow-2xl transition-transform group-hover/img:scale-[1.02]" />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-xl p-2.5 shadow-xl hover:bg-red-600 transition-all border-2 border-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-500 bg-red-50/50 p-5 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100"
                  >
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <X className="w-4 h-4 text-red-500" />
                    </div>
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-5">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white hover:bg-slate-50 text-slate-600 font-black py-5 px-8 rounded-2xl border-2 border-slate-100 transition-all flex items-center gap-3 shadow-sm"
                  >
                    <ImageIcon className="w-6 h-6 text-indigo-500" />
                    <span className="hidden sm:inline uppercase tracking-widest text-[10px]">Analyser une photo</span>
                  </motion.button>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white font-black py-5 px-10 rounded-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-4">
                      {loading ? (
                        <>
                          <RefreshCw className="w-6 h-6 animate-spin" />
                          <span className="uppercase tracking-widest text-[10px]">Préparation de la magie...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          <span className="uppercase tracking-widest text-[10px]">Envoyer ma question</span>
                        </>
                      )}
                    </span>
                  </motion.button>

                  {(question || selectedImage) && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClear}
                      className="bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 font-bold px-6 rounded-2xl transition-all border border-slate-100"
                    >
                      <Eraser className="w-6 h-6" />
                    </motion.button>
                  )}
                </div>
              </form>
            </div>
          </motion.section>

          {/* Response Area */}
          <AnimatePresence mode="wait">
            {response && (
              <motion.section
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[3.5rem] blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
                <div className="relative bg-white/95 backdrop-blur-2xl rounded-[3.5rem] shadow-premium border border-white/50 p-10 lg:p-14 space-y-12">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-200 ring-8 ring-emerald-50">
                        <Sparkles className="w-9 h-9" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Réponse Magique</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Explications à ton niveau</p>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => isSpeaking ? stopSpeaking() : speak(response)}
                      className={`w-14 h-14 rounded-2xl transition-all shadow-xl flex items-center justify-center border-2 ${isSpeaking
                        ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                        : 'bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-100 border-slate-100/50'
                        }`}
                    >
                      {isSpeaking ? <StopCircle className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                    </motion.button>
                  </div>

                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500/20 to-transparent rounded-full" />
                    <div className="pl-10">
                      <div className="prose prose-xl prose-emerald max-w-none whitespace-pre-wrap leading-relaxed font-semibold text-slate-700/90 tracking-tight">
                        {response}
                      </div>
                    </div>
                  </div>

                  {/* Verification Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="relative"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-[3rem] opacity-20 blur-sm"></div>
                    <div className="relative bg-emerald-50/50 backdrop-blur-sm rounded-[3rem] p-10 border border-emerald-100/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="font-black text-emerald-900 text-2xl tracking-tight">As-tu bien compris ?</h3>
                          </div>
                          <p className="text-emerald-800/60 font-medium text-lg italic">
                            &quot;Relis bien la fin, j&apos;ai glissé une petite question...&quot;
                          </p>
                        </div>

                        <div className="flex items-center gap-3 bg-white/60 px-5 py-3 rounded-2xl border border-emerald-100 shadow-sm">
                          <span className="text-emerald-700 font-black text-xs uppercase tracking-widest">Récompense</span>
                          <span className="text-emerald-800 font-black">+20 ⭐</span>
                        </div>
                      </div>

                      <form onSubmit={handleVerificationSubmit} className="mt-8 flex flex-col sm:flex-row gap-5">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={verificationAnswer}
                            onChange={(e) => setVerificationAnswer(e.target.value)}
                            placeholder="Ta réponse magique ici..."
                            className="w-full p-6 rounded-[2rem] bg-white border-2 border-emerald-100 focus:border-emerald-500 focus:ring-[10px] focus:ring-emerald-50 outline-none transition-all font-bold placeholder:text-emerald-200 text-emerald-900"
                            disabled={checkingVerification || !!verificationFeedback}
                          />
                        </div>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={checkingVerification || !verificationAnswer || !!verificationFeedback}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-10 py-6 rounded-[2rem] transition-all shadow-xl shadow-emerald-200 whitespace-nowrap uppercase tracking-widest text-[10px] flex items-center gap-3"
                        >
                          {checkingVerification ? <Sparkles className="animate-spin w-5 h-5" /> : (
                            <>
                              <span>Vérifier</span>
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </motion.button>
                      </form>

                      <AnimatePresence>
                        {verificationFeedback && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 p-8 bg-white rounded-[2.5rem] border-2 border-emerald-200 shadow-xl relative overflow-hidden group"
                          >
                            <div className={`absolute top-0 left-0 w-full h-2 ${verificationFeedback.includes('Bravo') ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            <div className="flex items-start gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${verificationFeedback.includes('Bravo') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {verificationFeedback.includes('Bravo') ? <Trophy className="w-8 h-8" /> : <Lightbulb className="w-8 h-8" />}
                              </div>
                              <p className="text-slate-800 font-black text-xl leading-relaxed">
                                {verificationFeedback}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Historique */}
        <aside className="w-full xl:w-96 space-y-8">
          <section className="bg-white/90 backdrop-blur-xl rounded-[3.5rem] shadow-premium p-10 border border-slate-100 sticky top-28 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

            <div className="relative z-10 flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Mémoire</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Tes expéditions</p>
                </div>
              </div>

              {history.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.1, color: '#ef4444' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={clearHistory}
                  className="text-slate-300 transition-colors p-3 bg-slate-50 rounded-2xl"
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            <div className="relative">
              <div className="space-y-4 max-h-[calc(100vh-450px)] overflow-y-auto pr-3 custom-scrollbar py-2">
                {history.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full group relative"
                  >
                    <div className="absolute inset-0 bg-indigo-600 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity blur-sm scale-95" />
                    <div className="relative p-5 rounded-[2rem] bg-slate-50/80 border border-transparent group-hover:border-white/50 group-hover:bg-white group-hover:shadow-xl transition-all flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0 overflow-hidden ring-4 ring-slate-100 group-hover:ring-indigo-50 transition-all">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Clock className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 group-hover:text-indigo-900 line-clamp-2 text-sm leading-tight transition-colors">
                          {item.question || "Analyse visuelle"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <p className="text-[9px] font-black text-slate-400 group-hover:text-indigo-300 uppercase tracking-[0.1em] transition-colors">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-200 group-hover:text-indigo-600 group-hover:shadow-md transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.button>
                ))}

                {history.length === 0 && (
                  <div className="text-center py-20 px-6">
                    <div className="w-24 h-24 bg-slate-50/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200">
                      <History className="w-10 h-10 text-slate-200" />
                    </div>
                    <h4 className="text-slate-400 font-black text-sm uppercase tracking-widest leading-relaxed">Prêt à entamer ton premier voyage ?</h4>
                  </div>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

