import React, { useState, useEffect } from 'react';
import { askGemini } from '../services/gemini';
import { Brain, CheckCircle, XCircle, RefreshCw, Trophy, ChevronRight, Star, Clock, Play, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SectionHeader from './ui/SectionHeader';
import AppCard from './ui/AppCard';
import AppButton from './ui/AppButton';
import { useQuizContext } from '../contexts/QuizContext';

interface QuizProps {
  onEarnPoints?: (amount: number, type: string, subject: string) => void;
  gradeLevel?: string;
}

export default function Quiz({ onEarnPoints, gradeLevel = 'CM1' }: QuizProps) {
  const { selectedChild, refreshChildren } = useAuth();

  const {
    topic, setTopic,
    questions, setQuestions,
    loading,
    currentQuestion, setCurrentQuestion,
    score, setScore,
    earnedStars, setEarnedStars,
    showResult, setShowResult,
    selectedOption, setSelectedOption,
    isCorrect, setIsCorrect,
    openAnswer, setOpenAnswer,
    aiLoading, setAiLoading,
    aiFeedback, setAiFeedback,
    wrongTopicsRef,
    startQuizContext,
    resumeQuizContext,
    activeQuizId,
    hasUsedHint, setHasUsedHint,
    hintText, setHintText,
    hintLoading, setHintLoading,
    resetQuizContext
  } = useQuizContext();

  const [savedQuizzes, setSavedQuizzes] = useState<any[]>([]);

  useEffect(() => {
    if (selectedChild && !questions.length && !loading) {
      supabase.from('saved_quizzes')
        .select('*')
        .eq('child_id', selectedChild.id)
        .order('updated_at', { ascending: false })
        .then(({ data }) => setSavedQuizzes(data || []));
    }
  }, [selectedChild, questions, loading]);

  useEffect(() => {
    if (showResult && selectedChild && questions.length > 0) {
      if (activeQuizId) {
        supabase.from('saved_quizzes').delete().eq('id', activeQuizId).then();
      }

      supabase.from('completed_quizzes').insert({
        child_id: selectedChild.id,
        topic: topic || 'Culture générale',
        grade_level: gradeLevel,
        questions,
        score,
        stars_earned: earnedStars
      }).then();
    }
  }, [showResult]);

  const saveQuizForLater = async () => {
    if (!selectedChild || !questions.length) return;

    const quizData = {
      child_id: selectedChild.id,
      topic,
      grade_level: gradeLevel,
      questions,
      current_question: currentQuestion,
      score,
      stars_earned: earnedStars,
      wrong_topics: wrongTopicsRef.current
    };

    if (activeQuizId) {
      await supabase.from('saved_quizzes').update(quizData).eq('id', activeQuizId);
    } else {
      await supabase.from('saved_quizzes').insert(quizData);
    }

    resetQuizContext();
  }; const startQuiz = async (selectedTopic?: string) => {
    const finalTopic = selectedTopic || topic || 'Culture générale';
    setTopic(finalTopic);
    await startQuizContext(finalTopic, gradeLevel, selectedChild?.weak_points, selectedChild?.learning_profile);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setOpenAnswer('');
      setAiFeedback(null);
      setHasUsedHint(false);
      setHintText(null);
      setHintLoading(false);
    } else {
      setShowResult(true);
      if (selectedChild && wrongTopicsRef.current.length > 0) {
        const currentPoints = selectedChild.weak_points || [];
        const newPoints = wrongTopicsRef.current.filter((t: string) => !currentPoints.includes(t));
        if (newPoints.length > 0) {
          const updatedPoints = [...currentPoints, ...newPoints];
          supabase.from('children')
            .update({ weak_points: updatedPoints })
            .eq('id', selectedChild.id)
            .then(() => refreshChildren());
        }
      }
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(index);
    const correct = index === questions[currentQuestion].correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
      const points = hasUsedHint ? 5 : 10;
      setEarnedStars((prev) => prev + points);
      onEarnPoints?.(points, 'quiz', topic || 'Général');
    } else {
      const currentTopic = topic || 'Culture générale';
      if (!wrongTopicsRef.current.includes(currentTopic)) {
        wrongTopicsRef.current.push(currentTopic);
      }
    }

    setTimeout(handleNext, 1800);
  };

  const submitOpenAnswer = async () => {
    if (!openAnswer.trim() || aiLoading) return;

    setAiLoading(true);
    try {
      const prompt = `Question : ${questions[currentQuestion].question}
      Réponse de l'enfant : ${openAnswer}
      Réponse attendue : ${questions[currentQuestion].correctAnswerText}`;

      const resultJson = await askGemini(prompt, 'ai_evaluation', gradeLevel, undefined, undefined, undefined, selectedChild?.learning_profile);
      const result = JSON.parse(resultJson);

      setIsCorrect(result.isCorrect);
      setAiFeedback(result.feedback);

      if (result.isCorrect) {
        const baseEarned = Math.max(5, result.score);
        const earned = hasUsedHint ? Math.max(2, baseEarned / 2) : baseEarned;
        setScore((s) => s + (earned / 10)); // Simple calculation for score display
        setEarnedStars((prev) => prev + Math.floor(earned));
        onEarnPoints?.(earned, 'ai_quiz', topic || 'Général');
      } else {
        const currentTopic = topic || 'Culture générale';
        if (!wrongTopicsRef.current.includes(currentTopic)) {
          wrongTopicsRef.current.push(currentTopic);
        }
      }
    } catch (e) {
      console.error(e);
      // Show neutral error feedback instead of silently marking as correct
      setIsCorrect(false);
      setAiFeedback("Oups, je n'ai pas pu évaluer ta réponse. Réessaie ou passe à la question suivante !");
    } finally {
      setAiLoading(false);
    }
  };

  const currentProgress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const handleAskHint = async () => {
    if (hintText || hintLoading) return;
    setHasUsedHint(true);
    setHintLoading(true);
    try {
      const prompt = `Donne un indice très court (une phrase maximum) pour aider un enfant de niveau ${gradeLevel} à répondre à cette question, sans jamais donner la réponse directe : "${questions[currentQuestion].question}"`;
      const resultJson = await askGemini(prompt, 'ai_evaluation', gradeLevel, undefined, undefined, undefined, selectedChild?.learning_profile);
      const result = JSON.parse(resultJson);
      setHintText(result.feedback || result.explanation || "Essaie de procéder par élimination ou de penser à un exemple classique !");
    } catch (e) {
      console.error(e);
      setHintText("Je n'ai pas pu trouver d'indice, mais je suis sûr que tu vas y arriver ! 🧠");
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      <SectionHeader
        title="Générateur de Quiz ✨"
        subtitle="Choisis ton sujet et teste tes connaissances !"
      />

      <AnimatePresence mode="wait">
        {!questions.length && !loading ? (
          <AppCard as={motion.section}
            key="setup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-8"
          >
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shrink-0 shadow-inner">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5">Nouveau Challenge</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence Artificielle</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Espace, Animaux, Histoire..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner"
              />

              <AppButton
                onClick={() => startQuiz()}
                className="w-full py-4 text-xs uppercase tracking-widest"
              >
                Générer le quiz
                <ChevronRight className="h-4 w-4" />
              </AppButton>

              <div className="flex flex-wrap gap-2 pt-2">
                {(selectedChild?.allowed_subjects?.length ? selectedChild.allowed_subjects : ['Géographie', 'Histoire', 'Sciences', 'Espace', 'Anglais', 'Nature', 'Art', 'Code']).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      startQuiz(t);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {savedQuizzes.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Quiz en attente ({savedQuizzes.length})</p>
                <div className="space-y-3">
                  {savedQuizzes.map(quiz => (
                    <div key={quiz.id} className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50 border border-indigo-100/50">
                      <div>
                        <p className="text-sm font-bold text-slate-800 capitalize leading-tight">{quiz.topic}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-1">Question {quiz.current_question + 1}/{quiz.questions.length}</p>
                      </div>
                      <button
                        onClick={() => resumeQuizContext(quiz)}
                        className="w-10 h-10 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        <Play className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AppCard>
        ) : loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-10 text-center relative overflow-hidden shadow-sm">
            <RefreshCw className="mx-auto mb-5 h-10 w-10 animate-spin text-indigo-600" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Préparation du quiz en cours...</h3>
            <p className="text-sm font-semibold text-slate-500 mb-8 max-w-sm mx-auto">Notre intelligence artificielle recherche les meilleures questions 🚀</p>

            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50">
              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                <Star className="w-3.5 h-3.5 fill-indigo-600" />
                <span>Tu peux naviguer sur un autre onglet, ton quiz t'attendra ici !</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => resetQuizContext()}
                className="rounded-full border border-slate-200 bg-white px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-red-200 hover:text-red-500 transition-all shadow-sm flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Annuler
              </button>
            </div>
          </motion.div>
        ) : showResult ? (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-10 border-none shadow-sm text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600">
              <Trophy className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Quiz terminé</h2>
            <p className="mt-1 text-sm text-slate-500">Score: {score} / {questions.length}</p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Précision</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{Math.round((score / questions.length) * 100)}%</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Étoiles</p>
                <p className="flex items-center justify-center gap-1.5 text-xl font-black text-indigo-600 tracking-tight">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> +{earnedStars}
                </p>
              </div>
            </div>

            <button
              onClick={() => resetQuizContext()}
              className="mt-6 w-full rounded-xl bg-indigo-50 px-4 py-4 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              Recommencer
            </button>
          </motion.section>
        ) : (
          <motion.section key="quiz" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-8 border-none shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
            <div className="mb-6 flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Question {currentQuestion + 1} / {questions.length}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full text-indigo-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <p className="text-xs font-black">{earnedStars}</p>
                </div>
                <button
                  onClick={() => resetQuizContext()}
                  className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Quitter
                </button>
              </div>
            </div>

            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600 transition-all duration-200" style={{ width: `${currentProgress}%` }} />
            </div>

            <h3 className="mb-4 text-base font-black text-slate-900 leading-relaxed tracking-tight">{questions[currentQuestion].question}</h3>

            {questions[currentQuestion].type === 'open' ? (
              <div className="space-y-4">
                <textarea
                  value={openAnswer}
                  onChange={(e) => setOpenAnswer(e.target.value)}
                  disabled={isCorrect !== null || aiLoading}
                  placeholder="Tape ta réponse ici..."
                  className="w-full h-32 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:bg-white resize-none"
                />

                {isCorrect === null ? (
                  <button
                    onClick={submitOpenAnswer}
                    disabled={!openAnswer.trim() || aiLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Valider
                  </button>
                ) : (
                  <div className={`rounded-xl border p-4 ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isCorrect ? 'Excellent !' : 'Pas tout à fait...'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{aiFeedback}</p>
                    <button
                      onClick={handleNext}
                      className="mt-4 w-full py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Question suivante
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {questions[currentQuestion].options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === questions[currentQuestion].correctAnswer;

                  let style = 'border-slate-200 bg-white text-slate-700';
                  if (selectedOption !== null) {
                    if (isCorrectAnswer) style = 'border-emerald-200 bg-emerald-50 text-emerald-800';
                    else if (isSelected) style = 'border-red-200 bg-red-50 text-red-700';
                    else style = 'border-slate-200 bg-slate-50 text-slate-500';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedOption !== null}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-colors ${style}`}
                    >
                      <span>{option}</span>
                      {selectedOption !== null &&
                        (isCorrectAnswer ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : isSelected ? <XCircle className="h-4 w-4 text-red-500" /> : null)}
                    </button>
                  );
                })}
              </div>
            )}

            {(selectedOption !== null || (questions[currentQuestion].type === 'open' && isCorrect !== null)) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl bg-indigo-50/50 p-6 border border-indigo-100/50 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Le sais-tu ? ✨</p>
                <p className="text-sm font-semibold text-indigo-900/80 leading-relaxed">{questions[currentQuestion].explanation}</p>
                {questions[currentQuestion].funFact && (
                  <div className="mt-4 pt-4 border-t border-indigo-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-lg">💡</span>
                    </div>
                    <p className="text-xs font-bold text-indigo-800/60 italic leading-relaxed">{questions[currentQuestion].funFact}</p>
                  </div>
                )}
              </motion.div>
            )}

            {isCorrect === null && selectedOption === null && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">

                {hintText ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-2xl bg-amber-50 p-6 border border-amber-100 relative">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Indice de l'IA (Récompense -50%)
                    </p>
                    <p className="text-sm font-semibold text-amber-900 leading-relaxed italic">"{hintText}"</p>
                  </motion.div>
                ) : (
                  <button
                    onClick={handleAskHint}
                    disabled={hintLoading}
                    className="flex items-center gap-2 text-[10px] font-black text-amber-500 hover:text-amber-600 transition-colors uppercase tracking-widest px-4 py-2 rounded-full border border-amber-200 hover:bg-amber-50"
                  >
                    {hintLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                    J'ai besoin d'un indice
                  </button>
                )}

                <button
                  onClick={saveQuizForLater}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest px-4 py-2 rounded-full hover:bg-indigo-50"
                >
                  <Clock className="w-4 h-4" />
                  Je ne sais pas, sauvegarder pour plus tard
                </button>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
