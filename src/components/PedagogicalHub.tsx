import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { BookCheck, BrainCircuit, CalendarCheck2, Gauge, RefreshCcw, ShieldAlert, Sparkles, Target, Award, TrendingUp, HelpCircle, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
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

interface WeeklyPlan {
  id: string;
  objectives: string[];
  recommended_activities: any[];
  parent_feedback_scripts: any[];
}

export default function PedagogicalHub({ childId, gradeLevel, stats, onEarnPoints }: PedagogicalHubProps) {
  const { selectedChild, refreshChildren } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [savingMissionId, setSavingMissionId] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState('');
  const [explanationPrompt, setExplanationPrompt] = useState('Comment expliquerais-tu cette notion à un ami ?');
  const [explanationSaving, setExplanationSaving] = useState(false);
  const [latestExplanation, setLatestExplanation] = useState<ExplanationRecord | null>(null);
  const [srsCards, setSrsCards] = useState<SRSCard[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [showFullPlan, setShowFullPlan] = useState(false);

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

  const missions = useMemo<Mission[]>(() => [
    {
      id: `${today}-consolidation`,
      title: 'Maîtrise & Confiance',
      description: `Exercice sur ${strongestSubject}`,
      objective: 'Valider tes acquis avec brio.',
      points: 5,
      subject: strongestSubject,
      autonomyBonus: 2
    },
    {
      id: `${today}-progression`,
      title: 'Défi du Jour',
      description: `Notion cible: ${weakestSubjects[0] || 'Maths'}`,
      objective: 'Dépasser ta difficulté actuelle.',
      points: 10,
      subject: weakestSubjects[0] || 'Maths',
      autonomyBonus: 5
    },
    {
      id: `${today}-reactivation`,
      title: 'Mémoire Flash',
      description: `Rappel sur ${weakestSubjects[1] || 'Français'}`,
      objective: 'Ne pas oublier ce que tu as appris hier.',
      points: 7,
      subject: weakestSubjects[1] || 'Français',
      autonomyBonus: 3
    }
  ], [today, strongestSubject, weakestSubjects]);

  // 2. Data Loading
  useEffect(() => {
    const loadPedagogicalData = async () => {
      if (!childId) return;

      // Monday of current week
      const now = new Date();
      const day = now.getDay() || 7;
      const monday = new Date(now.setDate(now.getDate() - day + 1)).toISOString().split('T')[0];

      const [missionRes, srsRes, milestoneRes, explanationRes, planRes] = await Promise.all([
        supabase.from('pedagogical_daily_missions').select('completed_mission_ids').eq('child_id', childId).eq('date', today).maybeSingle(),
        supabase.from('pedagogical_srs_cards').select('*').eq('child_id', childId).order('next_review_at', { ascending: true }).limit(5),
        supabase.from('pedagogical_milestones').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(3),
        supabase.from('pedagogical_explanations').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('pedagogical_weekly_plans').select('*').eq('child_id', childId).eq('week_start_date', monday).maybeSingle()
      ]);

      if (missionRes.data) setCompletedMissionIds(missionRes.data.completed_mission_ids);
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
  const completeMission = async (mission: Mission) => {
    if (completedMissionIds.includes(mission.id) || !childId) return;
    setSavingMissionId(mission.id);

    const nextIds = [...completedMissionIds, mission.id];
    const { error } = await supabase.from('pedagogical_daily_missions').upsert({
      child_id: childId, date: today, grade_level: gradeLevel,
      generated_missions: missions, completed_mission_ids: nextIds
    }, { onConflict: 'child_id,date' });

    if (!error) {
      setCompletedMissionIds(nextIds);
      const totalPoints = mission.points + (mission.autonomyBonus || 0);
      onEarnPoints(totalPoints, 'pedagogy_mission', mission.subject);

      // Auto-milestone for completing all 3
      if (nextIds.length === 3) {
        await supabase.from('pedagogical_milestones').insert({
          child_id: childId, title: 'Grand Chelem Quotidien', icon: '🔥', category: 'regularity'
        });
      }
    }
    setSavingMissionId(null);
  };

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
      {/* 1. Daily Missions Section */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-black text-slate-800 tracking-tight">
              <CalendarCheck2 className="h-5 w-5 text-indigo-600" /> Missions du Jour
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Programme personnalisé de {gradeLevel}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex gap-1">
              {missions.map(m => (
                <div key={m.id} className={`w-3 h-3 rounded-full ${completedMissionIds.includes(m.id) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-100'}`} />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase">{completedMissionIds.length}/3 TERMINÉES</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {missions.map((m, idx) => {
            const isDone = completedMissionIds.includes(m.id);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative group p-6 rounded-[2rem] border-2 transition-all ${isDone ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-50 hover:border-indigo-100 hover:bg-white'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{m.subject}</span>
                  {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </div>
                <h4 className="font-black text-slate-800 text-base mb-2">{m.title}</h4>
                <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">{m.description}</p>
                <div className="bg-white/50 rounded-xl p-3 mb-4 border border-white/50 italic text-[10px] text-slate-400">
                  🎯 {m.objective}
                </div>
                <button
                  onClick={() => completeMission(m)}
                  disabled={isDone || savingMissionId === m.id}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDone
                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95'
                    }`}
                >
                  {isDone ? 'Ménage Fait !' : savingMissionId === m.id ? 'Magie en cours...' : `C'est Parti ! (+${m.points + (m.autonomyBonus || 0)})`}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Stats Column */}
        <div className="lg:col-span-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mastery Table */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
              <h3 className="flex items-center gap-2 text-base font-black text-slate-800 mb-6">
                <Gauge className="h-4 w-4 text-indigo-600" /> Tableau de Maîtrise
              </h3>
              <div className="space-y-3">
                {subjectInsights.slice(0, 4).map(item => {
                  const m = masteryLabel(item.avg);
                  return (
                    <div key={item.subject} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.tone.split(' ')[1]}`}>
                          <m.icon className={`h-5 w-5 ${m.tone.split(' ')[0]}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{item.subject}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.attempts} ACTIVITÉS</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${m.tone}`}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SRS Section */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
              <h3 className="flex items-center gap-2 text-base font-black text-slate-800 mb-6">
                <RefreshCcw className="h-4 w-4 text-indigo-600" /> Révision Espacée
              </h3>
              <div className="space-y-4">
                {srsCards.length > 0 ? srsCards.map(card => (
                  <div key={card.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-slate-100">
                    <div>
                      <p className="text-sm font-black text-slate-800">{card.notion}</p>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase">{card.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Prochain rappel</p>
                      <p className="text-xs font-black text-slate-800">{new Date(card.next_review_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <Zap className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase italic leading-tight px-4">Tes prochaines révisions arriveront ici bientôt !</p>
                  </div>
                )}
              </div>
            </section>

            {/* Difficulty Mapping / Diagnostic */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
              <h3 className="flex items-center gap-2 text-base font-black text-slate-800 mb-6">
                <ShieldAlert className="h-4 w-4 text-amber-500" /> Diagnostic IA
              </h3>
              {subjectInsights.some(item => item.lowScoreCount > 0) ? (
                <div className="space-y-4">
                  {subjectInsights.filter(item => item.lowScoreCount > 0).slice(0, 1).map(item => (
                    <div key={item.subject} className="p-4 rounded-2xl bg-amber-50/30 border border-amber-100">
                      <h4 className="font-black text-slate-800 text-sm mb-1">{item.subject}</h4>
                      <p className="text-[10px] text-slate-600 font-medium mb-3">Focus sur les erreurs récurrentes.</p>
                      <div className="bg-white/80 p-3 rounded-xl border border-amber-100/50 italic text-[10px] text-slate-700 leading-relaxed font-bold">
                        "Reprends les bases via l'Atelier 'Explique avec tes mots'."
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Parcours fluide !</p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Workspace & Insights */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Explanation Workshop */}
          <section className="md:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="flex items-center gap-2 text-base font-black text-slate-800">
                <BookCheck className="h-4 w-4 text-indigo-600" /> Atelier "Explique avec tes mots"
              </h3>
              {latestExplanation && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">SCORE: {latestExplanation.understanding_score}/10</span>}
            </div>
            <p className="text-xs text-slate-500 font-semibold mb-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50 italic">
              <Sparkles className="h-3.5 w-3.5 inline mr-2 text-indigo-600" /> "{explanationPrompt}"
            </p>
            <textarea
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              placeholder="Écris ton explication ici... (Astuce: utilise 'parce que' pour gagner plus de points !)"
              className="w-full h-32 p-6 rounded-3xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-100 outline-none text-slate-800 font-medium transition-all"
            />
            <button
              onClick={submitExplanation}
              disabled={explanationSaving || !explanationText.trim()}
              className="mt-4 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              {explanationSaving ? 'Analyse par l\'IA...' : 'Valider mon explication (+5 Étoiles)'}
            </button>
            {latestExplanation?.ai_feedback_summary && (
              <div className="mt-6 flex gap-4 p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                <BrainCircuit className="h-6 w-6 shrink-0" />
                <p className="text-xs font-bold leading-relaxed">{latestExplanation.ai_feedback_summary}</p>
              </div>
            )}
          </section>

          {/* Portfolio Snapshot */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
            <h3 className="flex items-center gap-2 text-base font-black text-slate-800 mb-6">
              <Award className="h-4 w-4 text-indigo-600" /> Mon Portfolio
            </h3>
            <div className="space-y-6">
              {milestones.map(m => (
                <div key={m.id} className="flex gap-4 group">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:rotate-12 transition-transform">
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{m.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(m.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
              {milestones.length === 0 && <p className="text-xs font-bold text-slate-400 text-center py-10 uppercase italic">Tes premiers trophées apparaitront ici !</p>}

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Statistiques de Survie</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black">
                    <span className="text-slate-500 uppercase">AUTONOMIE</span>
                    <span className="text-indigo-600">85%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-indigo-600" />
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
                      {weeklyPlan?.parent_feedback_scripts.map((script: any, i: number) => (
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
                      {weeklyPlan?.recommended_activities.map((act: any, i: number) => (
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
