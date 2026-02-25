import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { askGemini } from '../services/gemini';
import { Send, Sparkles, Eraser, History, Trash2, Clock, CheckCircle2, Mic, Volume2, StopCircle, Image as ImageIcon, X } from 'lucide-react';
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
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setHistory(
          data.map((item) => ({
            id: item.id,
            question: item.question,
            response: item.response,
            date: item.created_at,
            image_url: item.image_url,
          })),
        );
      }
    }
    fetchHistory();
  }, [selectedChild]);

  useEffect(() => {
    if (transcript) {
      setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
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
            question,
            response: answer,
            image_url: selectedImage || undefined,
          })
          .select()
          .single();

        if (!insertError && newItem) {
          setHistory((prev) => [
            {
              id: newItem.id,
              question: newItem.question,
              response: newItem.response,
              date: newItem.created_at,
              image_url: newItem.image_url,
            },
            ...prev,
          ]);
        }
      }
    } catch {
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
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Assistant IA</h2>
                <p className="text-sm text-slate-500">Pose une question claire pour obtenir une meilleure explication.</p>
              </div>

              <div className="relative">
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Exemple : Explique-moi la division étape par étape."
                  className="h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 pr-14 text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg border ${isListening ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-600'}`}
                  title="Parler"
                >
                  {isListening ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>

              <AnimatePresence>
                {selectedImage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative inline-block">
                    <img src={selectedImage} alt="Aperçu" className="h-24 rounded-xl border border-slate-200" />
                    <button type="button" onClick={() => setSelectedImage(null)} className="absolute -right-2 -top-2 rounded-full border border-slate-200 bg-white p-1 text-slate-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="flex flex-wrap gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <ImageIcon className="h-4 w-4" /> Photo
                </button>

                <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {loading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? 'Analyse...' : 'Envoyer'}
                </button>

                {(question || selectedImage) && (
                  <button type="button" onClick={handleClear} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <Eraser className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          </motion.section>

          <AnimatePresence mode="wait">
            {response && (
              <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Réponse</h3>
                  <button onClick={() => (isSpeaking ? stopSpeaking() : speak(response))} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600">
                    {isSpeaking ? <StopCircle className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{response}</div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Vérifie ta compréhension
                  </div>
                  <form onSubmit={handleVerificationSubmit} className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={verificationAnswer}
                      onChange={(e) => setVerificationAnswer(e.target.value)}
                      placeholder="Ta réponse"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      disabled={checkingVerification || !!verificationFeedback}
                    />
                    <button type="submit" disabled={checkingVerification || !verificationAnswer || !!verificationFeedback} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                      Vérifier
                    </button>
                  </form>

                  {verificationFeedback && <p className="text-sm text-slate-700">{verificationFeedback}</p>}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <aside>
          <section className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <History className="h-4 w-4 text-indigo-600" /> Historique
              </h2>
              {history.length > 0 && (
                <button onClick={clearHistory} className="rounded-lg p-1.5 text-slate-400 hover:text-red-600" title="Effacer tout">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="max-h-[calc(100vh-240px)] space-y-2 overflow-y-auto pr-1">
              {history.map((item) => (
                <button key={item.id} onClick={() => loadHistoryItem(item)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:bg-white">
                  <p className="line-clamp-2 text-sm font-medium text-slate-800">{item.question || "Analyse d'image"}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                </button>
              ))}

              {history.length === 0 && <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">Aucune question pour le moment.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
