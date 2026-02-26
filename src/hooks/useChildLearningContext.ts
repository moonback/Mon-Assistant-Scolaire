import { useMemo } from 'react';
import { Progress } from '../lib/supabase';

interface ChildLite {
  name: string;
  grade_level?: string;
  stars?: number;
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
  lastQuestion: string | undefined,
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

    return `Prénom : ${child.name}
Niveau scolaire : ${child.grade_level || fallbackGradeLevel}
Étoiles accumulées : ${child.stars || 0} ⭐
Nombre d'activités réalisées : ${childStats.length}
Matières les plus faibles : ${weakest}
Matière la plus forte : ${strongest}
${lastQuestion ? `Dernière question posée : "${lastQuestion}"` : ''}

Adapte tes explications et ton ton au profil de cet enfant. Appelle-le par son prénom quand c'est naturel.`;
  }, [child, childStats.length, subjectAverages, fallbackGradeLevel, lastQuestion]);

  const topSubjects = useMemo(
    () => [...subjectAverages].sort((a, b) => b.avg - a.avg).slice(0, 3),
    [subjectAverages]
  );

  return { childContext, subjectAverages, topSubjects };
}
