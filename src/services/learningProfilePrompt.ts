import type { LearningProfile } from '../types/learningProfile';

const MEMORY_DIRECTIVES: Record<string, string> = {
  visuelle: `MÉMOIRE VISUELLE : Utilise beaucoup d'analogies visuelles, de schémas décrits en texte (ex: "imagine un camembert coupé en parts"), d'émojis illustratifs. Propose de dessiner ou de visualiser.`,
  verbale: `MÉMOIRE VERBALE : Utilise des histoires courtes, des rimes, des phrases mnémotechniques. Raconte des anecdotes pour ancrer les concepts. Favorise les explications orales détaillées.`,
  logique: `MÉMOIRE LOGIQUE : Explique le POURQUOI avant le COMMENT. Décompose en étapes numérotées. Montre les liens de cause à effet. Utilise des "si… alors…" pour le raisonnement.`,
};

const PACE_DIRECTIVES: Record<string, string> = {
  rapide: `RYTHME RAPIDE : Sois concis (max 3-4 lignes par idée). Va droit au but. Propose des défis bonus pour maintenir l'engagement. Évite les répétitions.`,
  normal: `RYTHME NORMAL : Équilibre entre concision et détail. Une explication claire avec un exemple suffit. Vérifie la compréhension avant de passer à la suite.`,
  lent: `RYTHME POSÉ : Explique chaque notion en détail. Répète les concepts importants sous différentes formes. Fais des pauses en posant des questions de vérification. Donne 2-3 exemples par concept.`,
};

const ERROR_DIRECTIVES: Record<string, string> = {
  high: `TOLÉRANCE AUX ERREURS ÉLEVÉE : Tu peux proposer des défis ambitieux. Quand l'enfant se trompe, dis simplement "Pas tout à fait, essaie autrement !" et relance rapidement.`,
  medium: `TOLÉRANCE AUX ERREURS MOYENNE : Quand l'enfant se trompe, rassure-le ("C'est normal, on apprend en essayant !") puis guide-le vers la bonne réponse avec un indice.`,
  low: `TOLÉRANCE AUX ERREURS BASSE : Sois TRÈS encourageant. Ne dis jamais "c'est faux". Utilise "Tu es sur la bonne piste !" ou "Presque ! Regarde bien…". Commence par ce qui est juste avant de corriger. Célèbre chaque petit progrès.`,
};

export function buildLearningProfileDirectives(profile: LearningProfile | undefined): string {
  if (!profile) return '';

  return `
🧬 PROFIL D'APPRENTISSAGE (Learning DNA) :
${MEMORY_DIRECTIVES[profile.memory]}
${PACE_DIRECTIVES[profile.pace]}
${ERROR_DIRECTIVES[profile.errorTolerance]}
Adapte TOUTES tes réponses à ce profil.`.trim();
}
