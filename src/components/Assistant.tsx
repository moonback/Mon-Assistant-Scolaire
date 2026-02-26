import React, { useState, useEffect, FormEvent, useRef, useMemo, useCallback } from 'react';
import { askGemini, buildAssistantSystemPrompt } from '../services/gemini';
import {
  Send, Sparkles, Eraser, History, Trash2, Clock, CheckCircle2,
  Mic, Volume2, StopCircle, Image as ImageIcon, X, Radio, Brain, Star
} from 'lucide-react';
import { useSpeechRecognition, useSpeechSynthesis } from '../hooks/useSpeech';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Progress } from '../lib/supabase';
import { useChildLearningContext } from '../hooks/useChildLearningContext';
import GeminiLiveModal from './GeminiLiveModal';
import SectionHeader from './ui/SectionHeader';
import AppCard from './ui/AppCard';
import AppButton from './ui/AppButton';
import EmptyStateKid from './ui/EmptyStateKid';

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
  const [historyPage, setHistoryPage] = useState(1);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [childStats, setChildStats] = useState<Progress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();


  useEffect(() => {
    setHistoryPage(1);
  }, [selectedChild?.id]);

  // ── Load child data: history + progress stats ──
  useEffect(() => {
    async function fetchData() {
      if (!selectedChild) {
        setHistory([]);
        setChildStats([]);
        return;
      }

      const start = (historyPage - 1) * 20;
      const end = start + 19;
      const [convRes, progressRes] = await Promise.all([
        supabase
          .from('conversations')
          .select('*')
          .eq('child_id', selectedChild.id)
          .order('created_at', { ascending: false })
          .range(start, end),
        supabase
          .from('progress')
          .select('*')
          .eq('child_id', selectedChild.id)
          .limit(100),
      ]);

      if (convRes.data) {
        const mapped = convRes.data.map((item) => ({
          id: item.id,
          question: item.question,
          response: item.response,
          date: item.created_at,
          image_url: item.image_url,
        }));
        setHistory((prev) => (historyPage === 1 ? mapped : [...prev, ...mapped]));
      }
      if (progressRes.data) setChildStats(progressRes.data);
    }

    fetchData();
  }, [selectedChild, historyPage]);

  const { childContext, topSubjects } = useChildLearningContext(
    selectedChild,
    childStats,
    history[0]?.question,
    gradeLevel
  );

  // ── System prompt for Gemini Live ──
  const liveSystemPrompt = useMemo(() =>
    buildAssistantSystemPrompt(selectedChild?.grade_level || gradeLevel, childContext, selectedChild?.weak_points, selectedChild?.learning_profile),
    [selectedChild?.grade_level, selectedChild?.weak_points, selectedChild?.learning_profile, gradeLevel, childContext]
  );

  // ── Voice input → textarea ──
  useEffect(() => {
    if (transcript) {
      setQuestion(prev => prev ? `${prev} ${transcript}` : transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() && !selectedImage) {
      setError('Tu dois écrire une question ou envoyer une image !');
      return;
    }
    setError(''); setLoading(true); setResponse('');
    setVerificationAnswer(''); setVerificationFeedback('');
    stopSpeaking();
    try {
      const answer = await askGemini(question, 'assistant', gradeLevel, selectedImage || undefined, childContext, selectedChild?.weak_points, selectedChild?.learning_profile);
      setResponse(answer);
      if (selectedChild) {
        const { data: newItem, error: insertError } = await supabase.from('conversations')
          .insert({ child_id: selectedChild.id, question, response: answer, image_url: selectedImage || undefined })
          .select().single();
        if (!insertError && newItem) {
          setHistory(prev => [{
            id: newItem.id, question: newItem.question,
            response: newItem.response, date: newItem.created_at, image_url: newItem.image_url,
          }, ...prev]);
        }
      }
    } catch {
      setError("Je n'ai pas réussi à trouver la réponse. Réessaie !");
    } finally {
      setLoading(false);
      setSelectedImage(null);
    }
  }, [question, selectedImage, stopSpeaking, gradeLevel, childContext, selectedChild]);

  const handleVerificationSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!verificationAnswer.trim()) return;
    setCheckingVerification(true);
    try {
      const prompt = `Contexte : Question élève : "${question}" — Ta réponse : "${response}"\nRéponse vérification de l'élève : "${verificationAnswer}"\nTâche : Dis si c'est bon. Commence par [CORRECT] ou [INCORRECT].`;
      const feedback = await askGemini(prompt, 'assistant', gradeLevel, undefined, childContext, selectedChild?.weak_points, selectedChild?.learning_profile);
      const isCorrect = feedback.includes('[CORRECT]');
      setVerificationFeedback(feedback.replace('[CORRECT]', '').replace('[INCORRECT]', '').trim());
      if (isCorrect) onEarnPoints?.(20, 'assistant', 'Général');
    } finally {
      setCheckingVerification(false);
    }
  }, [verificationAnswer, question, response, gradeLevel, childContext, selectedChild, onEarnPoints]);

  const handleClear = useCallback(() => {
    setQuestion(''); setResponse(''); setError('');
    setVerificationAnswer(''); setVerificationFeedback('');
    setSelectedImage(null); stopSpeaking();
  }, [stopSpeaking]);

  const loadHistoryItem = useCallback((item: HistoryItem) => {
    setQuestion(item.question); setResponse(item.response);
    setSelectedImage(item.image_url || null);
    setError(''); setVerificationAnswer(''); setVerificationFeedback('');
  }, []);

  const clearHistory = useCallback(async () => {
    if (confirm('Veux-tu vraiment tout effacer ?') && selectedChild) {
      await supabase.from('conversations').delete().eq('child_id', selectedChild.id);
      setHistory([]);
    }
  }, [selectedChild]);

  const hasGeminiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      <SectionHeader
        className="px-1"
        title="Cerveau Magique 🤖"
        subtitle="Pose tes questions, reçois une explication simple, puis vérifie ta compréhension."
      />

      {/* Gemini Live Modal */}
      <GeminiLiveModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        systemPrompt={liveSystemPrompt}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">

          {/* Live Voice Banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shadow-lg shadow-indigo-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Radio className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-white tracking-tight">Conversation Vocale IA</p>
                <p className="text-[10px] text-white/70 font-semibold mt-0.5">Parle directement avec Gemini Live</p>
              </div>
            </div>
            <button
              onClick={() => setShowLiveModal(true)}
              disabled={!hasGeminiKey}
              title={!hasGeminiKey ? 'VITE_GEMINI_API_KEY manquante dans .env' : ''}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${hasGeminiKey
                ? 'bg-white text-indigo-700 hover:scale-[1.03] shadow-lg'
                : 'bg-white/20 text-white/50 cursor-not-allowed'
                }`}
            >
              <Mic className="h-3.5 w-3.5" /> Parler
            </button>
          </motion.div>

          {/* Child context chip */}
          {selectedChild && childStats.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap items-center gap-2 px-1"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                <Brain className="h-3 w-3 text-indigo-500" /> Contexte IA
              </span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-black text-indigo-600">
                {selectedChild.name} · {selectedChild.grade_level}
              </span>
              {topSubjects.map(s => (
                <span key={s.subject} className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600">
                  {s.subject}: {s.avg.toFixed(0)}/10
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-600 flex items-center gap-1">
                <Star className="h-2.5 w-2.5" /> {selectedChild.stars} étoiles
              </span>
            </motion.div>
          )}

          {/* Question form */}
          <AppCard as={motion.section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">Assistant IA</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {selectedChild ? `${selectedChild.name}` : 'Tuteur Intelligent'}
                  </p>
                </div>
              </div>

              <div className="relative">
                <textarea
                  id="question"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Exemple : Explique-moi la division étape par étape."
                  className="h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 pr-14 text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white text-xs font-semibold leading-relaxed"
                />
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg border ${isListening ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-600'}`}
                  title="Dicter ma question"
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
                <AppButton variant="secondary" type="button" onClick={() => fileInputRef.current?.click()} className="px-3 text-xs" leftIcon={<ImageIcon className="h-3.5 w-3.5" />}>
                  Photo
                </AppButton>
                <AppButton type="submit" loading={loading} className="px-4 text-xs uppercase tracking-widest" leftIcon={!loading ? <Send className="h-3.5 w-3.5" /> : undefined}>
                  {loading ? 'Analyse...' : 'Envoyer'}
                </AppButton>
                {(question || selectedImage) && (
                  <button type="button" onClick={handleClear} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <Eraser className="h-4 w-4" />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </form>
          </AppCard>

          {/* Response */}
          <AnimatePresence mode="wait">
            {response && (
              <AppCard as={motion.section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Réponse Magique</h3>
                  <button
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                      } else {
                        speak(response.replace(/[*_#`]/g, ''));
                      }
                    }}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600"
                    title="Lire à voix haute"
                  >
                    {isSpeaking ? <StopCircle className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs font-semibold leading-relaxed whitespace-pre-wrap text-slate-700">{response}</div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Vérifie ta compréhension
                  </div>
                  <form onSubmit={handleVerificationSubmit} className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={verificationAnswer}
                      onChange={e => setVerificationAnswer(e.target.value)}
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
              </AppCard>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside>
          <AppCard as="section" className="sticky top-24 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest">
                <History className="h-3.5 w-3.5 text-indigo-600" /> Historique
              </h2>
              {history.length > 0 && (
                <button onClick={clearHistory} className="rounded-lg p-1.5 text-slate-400 hover:text-red-600" title="Effacer tout">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="max-h-[calc(100vh-240px)] space-y-2 overflow-y-auto pr-1">
              {history.map(item => (
                <button key={item.id} onClick={() => loadHistoryItem(item)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:bg-white text-xs font-bold text-slate-800">
                  <p className="line-clamp-2">{item.question || "Analyse d'image"}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> {new Date(item.date).toLocaleDateString()}
                  </p>
                </button>
              ))}
              {history.length >= historyPage * 20 && (
                <button
                  type="button"
                  onClick={() => setHistoryPage((prev) => prev + 1)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Charger plus
                </button>
              )}
              {history.length === 0 && (
                <EmptyStateKid
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Aucune question pour le moment"
                  description="Écris ta première question et ton historique apparaîtra ici."
                />
              )}
            </div>
          </AppCard>
        </aside>
      </div>
    </div >
  );
}
