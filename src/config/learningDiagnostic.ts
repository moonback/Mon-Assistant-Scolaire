import type { DiagnosticQuestion } from '../types/learningProfile';

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  // ── Mémoire (2 questions) ──
  {
    id: 1,
    question: "Quand tu apprends un nouveau mot, qu'est-ce qui t'aide le plus ?",
    dimension: 'memory',
    options: [
      { label: 'Voir une image ou un dessin du mot', value: 'visuelle', icon: '🖼️' },
      { label: 'Entendre le mot dans une phrase ou une histoire', value: 'verbale', icon: '📖' },
      { label: "Comprendre pourquoi ce mot existe et d'où il vient", value: 'logique', icon: '🔍' },
    ],
  },
  {
    id: 2,
    question: "Comment préfères-tu qu'on t'explique quelque chose de difficile ?",
    dimension: 'memory',
    options: [
      { label: 'Avec un schéma ou un dessin', value: 'visuelle', icon: '✏️' },
      { label: 'Avec une histoire ou un exemple', value: 'verbale', icon: '📚' },
      { label: 'Étape par étape, en raisonnant ensemble', value: 'logique', icon: '🧠' },
    ],
  },
  // ── Rythme (2 questions) ──
  {
    id: 3,
    question: 'Quand tu fais un exercice, tu préfères...',
    dimension: 'pace',
    options: [
      { label: 'Finir vite et passer à la suite !', value: 'rapide', icon: '🏃' },
      { label: "Prendre le temps qu'il faut, tranquille", value: 'normal', icon: '🚶' },
      { label: 'Relire et vérifier plusieurs fois avant de valider', value: 'lent', icon: '🔎' },
    ],
  },
  {
    id: 4,
    question: 'En classe, quand le maître/la maîtresse explique...',
    dimension: 'pace',
    options: [
      { label: 'Tu comprends souvent du premier coup', value: 'rapide', icon: '💡' },
      { label: "Tu as besoin d'entendre l'explication une fois", value: 'normal', icon: '👂' },
      { label: "Tu préfères qu'on t'explique doucement, avec des pauses", value: 'lent', icon: '🐌' },
    ],
  },
  // ── Tolérance à l'erreur (2 questions) ──
  {
    id: 5,
    question: 'Quand tu te trompes à un exercice, tu te sens comment ?',
    dimension: 'errorTolerance',
    options: [
      { label: "C'est pas grave, je recommence !", value: 'high', icon: '💪' },
      { label: "C'est un peu embêtant mais je continue", value: 'medium', icon: '🤷' },
      { label: "Ça me met un peu triste, j'aurais voulu réussir", value: 'low', icon: '😔' },
    ],
  },
  {
    id: 6,
    question: 'Si tu ne connais pas la réponse à une question...',
    dimension: 'errorTolerance',
    options: [
      { label: "J'essaie quand même, on verra bien !", value: 'high', icon: '🎲' },
      { label: 'Je réfléchis un peu, puis je tente ma chance', value: 'medium', icon: '🤔' },
      { label: 'Je préfère ne pas répondre plutôt que de me tromper', value: 'low', icon: '🙈' },
    ],
  },
];
