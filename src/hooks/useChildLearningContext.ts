import { useMemo } from 'react';
import { Progress, Child } from '../lib/supabase';
import type { LearningProfile } from '../types/learningProfile';

interface ChildLite extends Partial<Child> {
  name: string;
}

export interface HistoryItem {
  question: string;
  response: string;
}

export interface SubjectAverage {
  subject: string;
  avg: number;
}

function normalizeSubject(stat: Progress): string {
  if (stat.subject && stat.subject.toLowerCase() !== 'general') return stat.subject;
  const map: Record<string, string> = {
    quiz: 'Français',
    math: 'Maths',
    assistant: 'Compréhension',
    homework: 'Résolution de problèmes',
    drawing: 'Expression',
  };
  return map[stat.activity_type] || 'Général';
}

export function useChildLearningContext(
  child: ChildLite | null | undefined,
  childStats: Progress[],
  history: HistoryItem[],
  fallbackGradeLevel: string
) {
  const subjectAverages = useMemo<SubjectAverage[]>(() => {
    const grouped = new Map<string, number[]>();
    childStats.forEach((stat) => {
      const subject = normalizeSubject(stat);
      const scores = grouped.get(subject) || [];
      scores.push(Number(stat.score || 0));
      grouped.set(subject, scores);
    });

    return Array.from(grouped.entries())
      .map(([subject, scores]) => ({
        subject,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      }))
      .sort((a, b) => a.avg - b.avg);
  }, [childStats]);

  const childContext = useMemo(() => {
    if (!child) return undefined;

    const weakest = subjectAverages.slice(0, 2).map((s) => s.subject).join(', ') || 'non déterminé';
    const strongest = subjectAverages.at(-1)?.subject || 'non déterminé';

    // Extraction des missions actives
    const activeMissions = child.missions?.filter(m => m.status === 'pending').map(m => m.label).join(', ') || 'aucune';

    // Extraction des objectifs de récompense
    const nextReward = child.reward_goals?.filter(r => !r.claimed)[0];
    const rewardContext = nextReward ? `Objectif actuel : "${nextReward.label}" (${child.stars}/${nextReward.target} étoiles)` : 'aucun objectif défini';

    // Badges accumulés
    const badgesContext = child.badges && child.badges.length > 0 ? `Badges obtenus : ${child.badges.join(', ')}` : 'aucun badge pour le moment';

    // Dernières activités
    const recentActivities = childStats.slice(0, 3).map(s => `${normalizeSubject(s)} (Score: ${s.score}/10)`).join(', ') || 'aucune';

    // Historique récent des interactions
    const historyContext = history.length > 0
      ? `HISTORIQUE DES DERNIÈRES INTERACTIONS :\n${history.slice(0, 5).reverse().map(h => `- Enfant : "${h.question}"\n- Toi : "${h.response}"`).join('\n')}`
      : 'Aucun historique récent.';

    return `Prénom : ${child.name}
Niveau scolaire : ${child.grade_level || fallbackGradeLevel}
Étoiles accumulées : ${child.stars || 0} ⭐
${rewardContext}
${badgesContext}
Nombre d'activités réalisées : ${childStats.length}
Dernières activités : ${recentActivities}
Matières les plus faibles : ${weakest}
Matière la plus forte : ${strongest}

MISSIONS DES PARENTS EN COURS : ${activeMissions}

${child.learning_profile ? `TYPE DE MÉMOIRE : ${child.learning_profile.memory}
RYTHME D'APPRENTISSAGE : ${child.learning_profile.pace}
TOLÉRANCE AUX ERREURS : ${child.learning_profile.errorTolerance}` : ''}

${child.weak_points && child.weak_points.length > 0 ? `POINTS FAIBLES DÉTECTÉS : ${child.weak_points.join(', ')}` : ''}
${child.blocked_topics && child.blocked_topics.length > 0 ? `SUJETS À ÉVITER ABSOLUMENT : ${child.blocked_topics.join(', ')}` : ''}
${child.allowed_subjects && child.allowed_subjects.length > 0 ? `SUJETS PRIORITAIRES : ${child.allowed_subjects.join(', ')}` : ''}

${historyContext}

CONSIGNES : 
- Appelle-le par son prénom "${child.name}" régulièrement.
- Utilise l'historique ci-dessus pour ne pas te répéter et pour faire des rappels sur ce qui a déjà été dit si besoin.
- Encourage-le par rapport à ses missions en cours s'il réussit quelque chose.
- Si le sujet s'y prête, encourage-le à atteindre son prochain objectif : "${nextReward?.label || 'gagner plus d\'étoiles'}".
- Adapte ton vocabulaire à ses points faibles et ses forces.`;
  }, [child, childStats, subjectAverages, fallbackGradeLevel, history]);

  const topSubjects = useMemo(
    () => [...subjectAverages].sort((a, b) => b.avg - a.avg).slice(0, 3),
    [subjectAverages]
  );

  return { childContext, subjectAverages, topSubjects };
}
