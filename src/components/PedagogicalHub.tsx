import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BookCheck, BrainCircuit, CalendarCheck2, Gauge, RefreshCcw, ShieldAlert, Sparkles, Target } from 'lucide-react';
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
  if (score >= 8) return { label: 'Consolidé', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (score >= 6) return { label: 'Maîtrisé', tone: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
  if (score >= 4) return { label: 'En cours', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Découverte', tone: 'text-rose-700 bg-rose-50 border-rose-200' };
}

function nextReviewLabel(avg: number, seen: number) {
  if (avg < 4) return 'Demain';
  if (avg < 6 || seen < 3) return 'Dans 3 jours';
  if (avg < 8) return 'Dans 7 jours';
  return 'Dans 14 jours';
}

export default function PedagogicalHub({ childId, gradeLevel, stats, onEarnPoints }: PedagogicalHubProps) {
  const today = new Date().toISOString().split('T')[0];
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [savingMissionId, setSavingMissionId] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState('');
  const [explanationPrompt, setExplanationPrompt] = useState('Explique avec tes mots comment tu vérifies que ta réponse est juste.');
  const [explanationSaving, setExplanationSaving] = useState(false);
  const [latestExplanation, setLatestExplanation] = useState<ExplanationRecord | null>(null);

  const subjectInsights = useMemo(() => {
    const grouped = new Map<string, number[]>();

    stats.forEach((stat) => {
      const subject = normalizeSubject(stat);
      const score = Number(stat.score || 0);
      const arr = grouped.get(subject) || [];
      arr.push(score);
      grouped.set(subject, arr);
    });

    return Array.from(grouped.entries()).map(([subject, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
      const lowScoreCount = scores.filter((s) => s <= 4).length;
      return {
        subject,
        avg,
        attempts: scores.length,
        lowScoreCount,
      };
    }).sort((a, b) => a.avg - b.avg);
  }, [stats]);

  const weakestSubjects = subjectInsights.slice(0, 2).map((s) => s.subject);
  const strongestSubject = subjectInsights.at(-1)?.subject || 'Compétences générales';

  const missions = useMemo<Mission[]>(() => {
    const consolidationSubject = strongestSubject;
    const progressionSubject = weakestSubjects[0] || 'Maths';
    const reactivationSubject = weakestSubjects[1] || 'Français';

    return [
      {
        id: `${today}-consolidation`,
        title: 'Consolidation rapide',
        description: `3 questions courtes sur ${consolidationSubject}.`,
        objective: 'Renforcer ce qui est déjà acquis pour sécuriser la confiance.',
        points: 6,
        subject: consolidationSubject,
      },
      {
        id: `${today}-progression`,
        title: 'Mission progression',
        description: `1 exercice guidé sur ${progressionSubject} avec indice progressif.`,
        objective: 'Travailler la compréhension sur la notion la plus fragile.',
        points: 8,
        subject: progressionSubject,
      },
      {
        id: `${today}-reactivation`,
        title: 'Réactivation intelligente',
        description: `Carte mémoire + auto-correction sur ${reactivationSubject}.`,
        objective: 'Réactiver les acquis sans lassitude via un format différent.',
        points: 6,
        subject: reactivationSubject,
      },
    ];
  }, [today, strongestSubject, weakestSubjects]);

  useEffect(() => {
    const loadMissionState = async () => {
      if (!childId) return;

      const { data, error } = await supabase
        .from('pedagogical_daily_missions')
        .select('completed_mission_ids')
        .eq('child_id', childId)
        .eq('date', today)
        .maybeSingle<MissionRecord>();

      if (error) {
        console.error('Failed to load mission state:', error);
        setCompletedMissionIds([]);
        return;
      }

      if (data?.completed_mission_ids) {
        setCompletedMissionIds(data.completed_mission_ids);
        return;
      }

      const { error: insertError } = await supabase
        .from('pedagogical_daily_missions')
        .insert({
          child_id: childId,
          date: today,
          grade_level: gradeLevel,
          generated_missions: missions,
          completed_mission_ids: [],
        });

      if (insertError) {
        console.error('Failed to initialize mission row:', insertError);
      }

      setCompletedMissionIds([]);
    };

    loadMissionState();
  }, [childId, today, gradeLevel, missions]);


  useEffect(() => {
    const prompts = [
      `Explique en une ou deux phrases comment tu résous un exercice de ${weakestSubjects[0] || 'maths'}.`,
      `Tu as fait une erreur en ${weakestSubjects[0] || 'maths'} : comment la corriges-tu ?`,
      `Décris ta méthode pas à pas pour réussir en ${strongestSubject}.`,
    ];
    setExplanationPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  }, [weakestSubjects, strongestSubject]);

  useEffect(() => {
    const loadLatestExplanation = async () => {
      if (!childId) return;

      const { data, error } = await supabase
        .from('pedagogical_explanations')
        .select('id, prompt_text, child_text, understanding_score, ai_feedback_summary, created_at')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<ExplanationRecord>();

      if (error) {
        console.error('Failed to load latest explanation:', error);
        return;
      }

      setLatestExplanation(data || null);
    };

    loadLatestExplanation();
  }, [childId]);

  const spacedReviewPlan = useMemo(() => {
    return subjectInsights.slice(0, 4).map((item) => ({
      ...item,
      nextReview: nextReviewLabel(item.avg, item.attempts),
    }));
  }, [subjectInsights]);

  const completeMission = async (mission: Mission) => {
    if (completedMissionIds.includes(mission.id) || !childId) return;

    const next = [...completedMissionIds, mission.id];
    setCompletedMissionIds(next);
    setSavingMissionId(mission.id);

    const { error } = await supabase
      .from('pedagogical_daily_missions')
      .upsert({
        child_id: childId,
        date: today,
        grade_level: gradeLevel,
        generated_missions: missions,
        completed_mission_ids: next,
      }, { onConflict: 'child_id,date' });

    if (error) {
      console.error('Failed to persist mission completion:', error);
      setCompletedMissionIds((prev) => prev.filter((id) => id !== mission.id));
      setSavingMissionId(null);
      return;
    }

    await supabase.from('pedagogical_mission_events').insert({
      child_id: childId,
      date: today,
      mission_id: mission.id,
      mission_subject: mission.subject,
      points_awarded: mission.points,
      grade_level: gradeLevel,
    });

    onEarnPoints(mission.points, 'pedagogy_mission', mission.subject);
    setSavingMissionId(null);
  };


  const submitExplanation = async () => {
    if (!childId || !explanationText.trim()) return;

    const text = explanationText.trim();
    const hasReasoning = /parce que|donc|d'abord|ensuite|puis|j'ai vérifié/i.test(text);
    const lengthScore = Math.min(6, Math.floor(text.length / 25));
    const understandingScore = Math.min(10, lengthScore + (hasReasoning ? 4 : 2));

    const feedback = understandingScore >= 8
      ? 'Très bien ! Ton explication est claire et montre ton raisonnement.'
      : understandingScore >= 6
        ? 'Bonne base. Ajoute davantage les étapes de ta méthode.'
        : 'Essaye de détailler: ce que tu fais d’abord, puis comment tu vérifies.';

    setExplanationSaving(true);

    const { data, error } = await supabase
      .from('pedagogical_explanations')
      .insert({
        child_id: childId,
        prompt_text: explanationPrompt,
        child_text: text,
        understanding_score: understandingScore,
        ai_feedback_summary: feedback,
      })
      .select('id, prompt_text, child_text, understanding_score, ai_feedback_summary, created_at')
      .single<ExplanationRecord>();

    if (error) {
      console.error('Failed to save explanation:', error);
      setExplanationSaving(false);
      return;
    }

    setLatestExplanation(data);
    setExplanationText('');
    setExplanationSaving(false);
    onEarnPoints(4, 'pedagogy_explanation', weakestSubjects[0] || 'Compréhension');
  };

  const completionRate = Math.round((completedMissionIds.length / missions.length) * 100);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <CalendarCheck2 className="h-4 w-4 text-indigo-600" />
              Mission quotidienne intelligente
            </h3>
            <p className="text-sm text-slate-500">Plan personnalisé pour {gradeLevel} : consolidation, progression et réactivation.</p>
          </div>
          <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{completionRate}% terminé</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {missions.map((mission, i) => {
            const done = completedMissionIds.includes(mission.id);
            const isSaving = savingMissionId === mission.id;
            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{mission.subject}</p>
                <h4 className="mt-1 text-sm font-semibold text-slate-900">{mission.title}</h4>
                <p className="mt-1 text-xs text-slate-600">{mission.description}</p>
                <p className="mt-2 text-xs text-slate-500">🎯 {mission.objective}</p>
                <button
                  onClick={() => completeMission(mission)}
                  disabled={done || isSaving}
                  className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300'}`}
                >
                  {done ? `Terminé +${mission.points} pts` : isSaving ? 'Enregistrement...' : `Marquer terminé (+${mission.points})`}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Gauge className="h-4 w-4 text-indigo-600" />
            Maîtrise par niveaux
          </h3>

          <div className="space-y-2">
            {subjectInsights.length === 0 && <p className="text-sm text-slate-500">Pas assez de données pour calculer les niveaux.</p>}
            {subjectInsights.slice(0, 5).map((item) => {
              const mastery = masteryLabel(item.avg);
              return (
                <div key={item.subject} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.subject}</p>
                    <p className="text-xs text-slate-500">{item.attempts} activités • moyenne {item.avg.toFixed(1)}/10</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${mastery.tone}`}>{mastery.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <RefreshCcw className="h-4 w-4 text-indigo-600" />
            Révision espacée anti-lassitude
          </h3>

          <div className="space-y-2">
            {spacedReviewPlan.length === 0 && <p className="text-sm text-slate-500">Les prochaines révisions apparaîtront après quelques activités.</p>}
            {spacedReviewPlan.map((item) => (
              <div key={item.subject} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{item.subject}</p>
                  <span className="text-xs font-semibold text-indigo-700">{item.nextReview}</span>
                </div>
                <p className="text-xs text-slate-500">Format conseillé: quiz court, mini-jeu, puis explication “avec tes mots”.</p>
              </div>
            ))}
          </div>
        </section>
      </div>


      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <BookCheck className="h-4 w-4 text-indigo-600" />
          Atelier “Explique avec tes mots”
        </h3>
        <p className="mb-3 text-sm text-slate-600">{explanationPrompt}</p>
        <textarea
          value={explanationText}
          onChange={(e) => setExplanationText(e.target.value)}
          placeholder="J'ai trouvé... parce que..."
          className="h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-indigo-400"
        />
        <button
          onClick={submitExplanation}
          disabled={explanationSaving || !explanationText.trim()}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {explanationSaving ? 'Enregistrement...' : 'Envoyer mon explication (+4)'}
        </button>

        {latestExplanation && (
          <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-xs font-semibold text-indigo-700">Dernière explication • score compréhension: {latestExplanation.understanding_score ?? '-'} / 10</p>
            <p className="mt-1 text-xs text-indigo-800">{latestExplanation.ai_feedback_summary}</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <ShieldAlert className="h-4 w-4 text-indigo-600" />
            Détection des difficultés
          </h3>

          {subjectInsights.filter((s) => s.lowScoreCount >= 2).length === 0 ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Aucune difficulté persistante détectée pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {subjectInsights.filter((s) => s.lowScoreCount >= 2).map((s) => (
                <div key={s.subject} className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-sm font-semibold text-rose-800">{s.subject}</p>
                  <p className="text-xs text-rose-700">{s.lowScoreCount} erreurs récurrentes détectées. Proposer 4 micro-sessions de remédiation.</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <BookCheck className="h-4 w-4 text-indigo-600" />
            Plan parent / enseignant (hebdo)
          </h3>

          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Objectifs prioritaires (7 jours)</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                <li>Consolider {weakestSubjects[0] || 'Maths'} avec 10 minutes par jour.</li>
                <li>Maintenir {strongestSubject} avec une mission “expliquer la méthode” 2 fois/semaine.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4" /> Feedback adulte conseillé</p>
              <p className="mt-1 text-xs">“Tu as fait des efforts, explique-moi comment tu as réfléchi.”</p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <BrainCircuit className="h-4 w-4 text-indigo-600" />
          Portefeuille de progrès long terme
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Compétence la plus solide</p>
            <p className="text-sm font-semibold text-slate-900">{strongestSubject}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Compétence à renforcer</p>
            <p className="text-sm font-semibold text-slate-900">{weakestSubjects[0] || 'Maths'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Objectif du mois</p>
            <p className="text-sm font-semibold text-slate-900">Atteindre 70% de missions terminées</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-indigo-50/60 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-indigo-800"><Target className="h-4 w-4" /> Apprentissage actif intégré</p>
        <p className="mt-1 text-xs text-indigo-700">Dans chaque mission, l’enfant doit faire, expliquer puis corriger : la progression récompense l’effort et la compréhension, pas seulement la bonne réponse.</p>
      </section>
    </div>
  );
}
