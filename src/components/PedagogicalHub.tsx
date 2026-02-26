import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { BookCheck, BrainCircuit, CalendarCheck2, Gauge, RefreshCcw, ShieldAlert, Sparkles, Target, Award, TrendingUp, HelpCircle, ArrowRight, CheckCircle2, Zap, Mic, MessageSquare, Send, Quote } from 'lucide-react';
import { Progress, supabase } from '../lib/supabase';

interface PedagogicalHubProps {
  childId: string;
  gradeLevel: string;
  stats: Progress[];
  onEarnPoints: (amount: number, activityType: string, subject?: string) => void;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  objective: string;
  points: number;
  subject: string;
  autonomyBonus?: number;
}

interface MissionRecord {
  completed_mission_ids: string[];
}

interface ExplanationRecord {
  id: string;
  prompt_text: string;
  child_text: string;
  understanding_score: number | null;
  ai_feedback_summary: string | null;
  created_at: string;
}

interface SRSCard {
  id: string;
  subject: string;
  notion: string;
  mastery_level: number;
  next_review_at: string;
  front?: string;
  back?: string;
  hint?: string;
}

interface Milestone {
  id: string;
  title: string;
  icon: string;
  category: string;
  created_at: string;
}

function normalizeSubject(stat: Progress) {
  if (stat.subject && stat.subject.toLowerCase() !== 'general') return stat.subject;
  const map: Record<string, string> = {
    quiz: 'Français',
    math: 'Maths',
    assistant: 'Compréhension',
    homework: 'Résolution de problèmes',
    drawing: 'Expression écrite',
  };
  return map[stat.activity_type] || 'Compétences générales';
}

function masteryLabel(score: number) {
  if (score >= 8) return { label: 'Consolidé', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Award };
  if (score >= 6) return { label: 'Maîtrisé', tone: 'text-indigo-700 bg-indigo-50 border-indigo-200', icon: TrendingUp };
  if (score >= 4) return { label: 'En cours', tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: Target };
  return { label: 'Découverte', tone: 'text-rose-700 bg-rose-50 border-rose-200', icon: Sparkles };
}

interface RecommendedActivity {
  title: string;
  desc: string;
}

interface ParentFeedbackScript {
  tip: string;
  context: string;
}

interface WeeklyPlan {
  id: string;
  objectives: string[];
  recommended_activities: RecommendedActivity[];
  parent_feedback_scripts: ParentFeedbackScript[];
}

export default function PedagogicalHub({ childId, gradeLevel, stats, onEarnPoints }: PedagogicalHubProps) {
  const { selectedChild, refreshChildren } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [explanationText, setExplanationText] = useState('');
  const EXPLANATION_PROMPTS = [
    "Comment expliquerais-tu cette notion à un ami ?",
    "Qu'est-ce qui a été le plus facile à comprendre aujourd'hui ?",
    "Si tu devais dessiner cette idée, que représenterais-tu ?",
    "Quelle est la 'règle d'or' à retenir pour ce sujet ?",
    "Pourquoi est-il important de connaître cette notion selon toi ?"
  ];
  const [explanationPrompt, setExplanationPrompt] = useState(EXPLANATION_PROMPTS[0]);
  const [explanationSaving, setExplanationSaving] = useState(false);
  const [latestExplanation, setLatestExplanation] = useState<ExplanationRecord | null>(null);
  const [srsCards, setSrsCards] = useState<SRSCard[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [showFullPlan, setShowFullPlan] = useState(false);

  const shufflePrompt = () => {
    const currentIndex = EXPLANATION_PROMPTS.indexOf(explanationPrompt);
    const nextIndex = (currentIndex + 1) % EXPLANATION_PROMPTS.length;
    setExplanationPrompt(EXPLANATION_PROMPTS[nextIndex]);
  };

  // ... subjectInsights and missions definitions ...
  const subjectInsights = useMemo(() => {
    const grouped = new Map<string, number[]>();
    stats.forEach(stat => {
      const subject = normalizeSubject(stat);
      const score = Number(stat.score || 0);
      const arr = grouped.get(subject) || [];
      arr.push(score);
      grouped.set(subject, arr);
    });

    return Array.from(grouped.entries()).map(([subject, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
      const lowScoreCount = scores.filter(s => s <= 4).length;
      return { subject, avg, attempts: scores.length, lowScoreCount };
    }).sort((a, b) => a.avg - b.avg);
  }, [stats]);

  const { weakestSubjects, strongestSubject } = useMemo(() => {
    const weakest = subjectInsights.slice(0, 2).map(s => s.subject);
    const strongest = subjectInsights.at(-1)?.subject || 'Compétences générales';
    return { weakestSubjects: weakest, strongestSubject: strongest };
  }, [subjectInsights]);


  // 2. Data Loading
  useEffect(() => {
    const loadPedagogicalData = async () => {
      if (!childId) return;

      // Monday of current week
      const now = new Date();
      const day = now.getDay() || 7;
      const monday = new Date(now.setDate(now.getDate() - day + 1)).toISOString().split('T')[0];

      const [srsRes, milestoneRes, explanationRes, planRes] = await Promise.all([
        supabase.from('pedagogical_srs_cards').select('*').eq('child_id', childId).order('next_review_at', { ascending: true }).limit(5),
        supabase.from('pedagogical_milestones').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(3),
        supabase.from('pedagogical_explanations').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('pedagogical_weekly_plans').select('*').eq('child_id', childId).eq('week_start_date', monday).maybeSingle()
      ]);

      if (srsRes.data) setSrsCards(srsRes.data);
      if (milestoneRes.data) setMilestones(milestoneRes.data);
      if (explanationRes.data) setLatestExplanation(explanationRes.data);

      if (planRes.data) {
        setWeeklyPlan(planRes.data);
      } else {
        // Generate plan if missing
        const defaultPlan = {
          child_id: childId,
          week_start_date: monday,
          objectives: [
            `Améliorer la maîtrise en ${weakestSubjects[0] || 'Mathématiques'}`,
            `Pratiquer la lecture active (15 min/jour)`,
            `Renforcer l'autonomie en ${strongestSubject}`
          ],
          recommended_activities: [
            { title: "Défi Flash", desc: "3 minutes pour trouver 5 mots en rapport avec le thème de la semaine." },
            { title: "Calcul Mental", desc: "Pratiquer les tables de multiplication sous forme de jeu pendant le repas." },
            { title: "Exploration Libre", desc: "Laisser 20 minutes d'utilisation libre de l'assistant pour poser des questions de curiosité." }
          ],
          parent_feedback_scripts: [
            { tip: "Encouragez l'effort plutôt que le résultat final.", context: "Difficulté" },
            { tip: "Demandez 'Comment as-tu trouvé cette réponse ?' même si c'est juste.", context: "Curiosité" },
            { tip: "Célébrez les petites victoires avec un high-five !", context: "Motivation" }
          ]
        };
        const { data: newPlan } = await supabase.from('pedagogical_weekly_plans').insert(defaultPlan).select().single();
        if (newPlan) setWeeklyPlan(newPlan);
      }
    };

    loadPedagogicalData();
  }, [childId, today, weakestSubjects, strongestSubject]);

  // 3. Actions

  const submitExplanation = async () => {
    if (!childId || !explanationText.trim()) return;
    setExplanationSaving(true);

    const text = explanationText.trim();
    const hasReasoning = /parce que|donc|pourquoi|car/i.test(text);
    const score = Math.min(10, Math.floor(text.length / 15) + (hasReasoning ? 5 : 2));

    const { data, error } = await supabase.from('pedagogical_explanations').insert({
      child_id: childId, prompt_text: explanationPrompt, child_text: text,
      understanding_score: score, ai_feedback_summary: score >= 8 ? 'Explication brillante !' : 'Continue à détailler ton raisonnement.'
    }).select().single();

    if (data && !error) {
      setLatestExplanation(data);
      setExplanationText('');
      onEarnPoints(5, 'pedagogy_explanation');
    }
    setExplanationSaving(false);
  };

  return (
    <div className="space-y-8">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Stats Column */}


        {/* Workspace & Insights */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Explanation Workshop */}
          <section className="md:col-span-2 premium-card p-0 border-none shadow-xl relative overflow-hidden flex flex-col min-h-[500px]">
            {/* Header with Gradient Background */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30">
                    <BookCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight leading-none mb-1">Atelier "Explique avec tes mots"</h3>
                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest opacity-80">Développe ta pensée critique ✨</p>
                  </div>
                </div>
                {latestExplanation && (
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1 opacity-70">Dernier score</span>
                    <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-300" />
                      <span className="text-sm font-black">{latestExplanation.understanding_score}/10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col space-y-6 relative z-10">
              {/* Question Bubble */}
              <div className="relative">
                <div className="absolute -left-2 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-full" />
                <div className="pl-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-indigo-500" /> La question de l'IA
                  </p>
                  <p className="text-base font-bold text-slate-700 italic leading-relaxed">
                    "{explanationPrompt}"
                  </p>
                  <button
                    onClick={shufflePrompt}
                    className="mt-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-700 transition-colors"
                  >
                    <RefreshCcw className="h-3 w-3" /> Changer de question
                  </button>
                </div>
              </div>

              {/* Text Area Container */}
              <div className="relative group">
                <textarea
                  value={explanationText}
                  onChange={(e) => setExplanationText(e.target.value)}
                  placeholder="Explique ici comme si tu parlais à un ami..."
                  className="w-full h-44 p-8 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 focus:border-indigo-500/30 focus:bg-white outline-none text-slate-800 font-bold text-sm leading-relaxed transition-all shadow-inner resize-none appearance-none"
                />

                {/* Floating controls in Textarea */}
                <div className="absolute right-6 bottom-6 flex items-center gap-3">
                  {explanationText.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500">{explanationText.length} caractères</span>
                    </motion.div>
                  )}
                  <button
                    className="p-3 bg-white hover:bg-slate-50 rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
                    title="Utiliser la dictée vocale"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Action area */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={submitExplanation}
                  disabled={explanationSaving || !explanationText.trim()}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${explanationSaving
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-100 active:scale-95'
                    }`}
                >
                  {explanationSaving ? (
                    <>
                      <RefreshCcw className="h-4 w-4 animate-spin text-indigo-500" /> Analayse du raisonnement...
                    </>
                  ) : (
                    <>
                      Valider mon explication <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Interactive AI Feedback */}
              <AnimatePresence>
                {latestExplanation?.ai_feedback_summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute -right-6 -bottom-6 opacity-10">
                      <BrainCircuit className="h-24 w-24 text-indigo-600" />
                    </div>
                    <div className="flex gap-5 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Feedback de l'IA</p>
                        <p className="text-sm font-bold text-indigo-900 leading-relaxed italic">
                          <Quote className="h-3 w-3 inline-block -mt-2 mr-2 opacity-30" />
                          {latestExplanation.ai_feedback_summary}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Portfolio Snapshot */}
          <section className="premium-card p-6 border-none shadow-sm h-full">
            <h3 className="flex items-center gap-2 text-base font-black text-slate-900 tracking-tight mb-6">
              <Award className="h-5 w-5 text-indigo-500" /> Mon Portfolio
            </h3>
            <div className="space-y-4">
              {milestones.slice(0, 3).map(m => (
                <div key={m.id} className="flex gap-4 group items-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-none mb-1 tracking-tight">{m.title}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase leading-none">{new Date(m.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {milestones.length === 0 && <p className="text-xs font-bold text-slate-400 text-center py-10 uppercase italic">Tes premiers trophées apparaitront ici !</p>}

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Autonomie</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black">
                    <span className="text-slate-400 uppercase tracking-widest">Maîtrise</span>
                    <span className="text-indigo-600">85%</span>
                  </div>
                  <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full w-[85%] bg-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Weekly Support Section */}
        <div className="lg:col-span-12">
          <section className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <TrendingUp className="absolute -right-10 -bottom-10 w-60 h-60 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <span className="px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest leading-none mb-4 inline-block">Plan Parent-Enfant Hebdo</span>
                <h3 className="text-2xl font-black tracking-tight mb-4">Objectifs de la Semaine</h3>
                <div className="space-y-4 mt-6">
                  {weeklyPlan?.objectives?.map((obj, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-indigo-500' : 'bg-amber-500'}`}>{idx + 1}</div>
                      <p className="text-xs font-semibold">{obj}</p>
                    </div>
                  )) || (
                      <div className="animate-pulse space-y-4">
                        <div className="h-16 bg-white/5 rounded-2xl" />
                        <div className="h-16 bg-white/5 rounded-2xl" />
                      </div>
                    )}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10">
                  <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-2">Conseil pour l'adulte</p>
                  <p className="text-sm italic font-medium leading-relaxed opacity-90">
                    {weeklyPlan?.parent_feedback_scripts?.[0]?.tip || `"Demandez à ${selectedChild?.name} de vous expliquer SON erreur. Ne donnez pas la solution tout de suite, valorisez le chemin plutôt que le résultat."`}
                  </p>
                  <button
                    onClick={() => setShowFullPlan(true)}
                    className="mt-6 flex items-center gap-2 text-xs font-black uppercase text-indigo-300 hover:text-white transition-colors"
                  >
                    Voir le plan complet <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showFullPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullPlan(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[3rem] shadow-2xl p-10"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Plan Hebdomadaire Complet</h2>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Soutien pédagogique & Accompagnement</p>
                </div>
                <button
                  onClick={() => setShowFullPlan(false)}
                  className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-600" /> Objectifs Prioritaires
                    </h3>
                    <div className="space-y-3">
                      {weeklyPlan?.objectives.map((obj, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-4 items-start">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</span>
                          <p className="text-sm font-bold text-slate-700">{obj}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-indigo-600" /> Scripts & Retours Parents
                    </h3>
                    <div className="space-y-3">
                      {weeklyPlan?.parent_feedback_scripts.map((script, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                          <p className="text-[10px] font-black text-indigo-500 uppercase mb-1">{script.context}</p>
                          <p className="text-sm italic font-medium text-slate-700">"{script.tip}"</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-indigo-600" /> Activités Recommandées
                    </h3>
                    <div className="space-y-4">
                      {weeklyPlan?.recommended_activities.map((act, i) => (
                        <div key={i} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
                          <h4 className="font-black text-slate-800 mb-2">{act.title}</h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{act.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                    <h4 className="font-black mb-2">Besoin d'aide ?</h4>
                    <p className="text-xs opacity-90 leading-relaxed">Ce plan est mis à jour chaque lundi en fonction des progrès réels constatés par l'IA.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
