import { Star, Zap, Book, Shield, Trophy, Heart, Sparkles, Brain, Clock, Target, Lightbulb, Rocket } from 'lucide-react';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji or Lucide icon name
    category: 'progression' | 'consistency' | 'excellence' | 'curiosity' | 'social';
    secret?: boolean;
}

export const BADGE_DEFINITIONS: Badge[] = [
    // Progression
    { id: 'first_steps', name: 'Premiers Pas', description: 'Gagne tes 10 premières étoiles', icon: '🌱', category: 'progression' },
    { id: 'star_collector', name: 'Collectionneur', description: 'Atteins 100 étoiles', icon: '⭐', category: 'progression' },
    { id: 'star_expert', name: 'Expert des Étoiles', description: 'Atteins 500 étoiles', icon: '🌟', category: 'progression' },
    { id: 'milky_way', name: 'Voie Lactée', description: 'Atteins 1000 étoiles', icon: '🌌', category: 'progression' },

    // Excellence
    { id: 'perfect_quiz', name: 'Sans Faute', description: 'Réussis un quiz avec 100% de bonnes réponses', icon: '🎯', category: 'excellence' },
    { id: 'brain_master', name: 'Cerveau de Génie', description: 'Réussis 10 quiz sans aucune erreur', icon: '🧠', category: 'excellence' },
    { id: 'quick_thinker', name: 'Rapide comme l\'éclair', description: 'Réponds correctement en moins de 5 secondes', icon: '⚡', category: 'excellence' },

    // Curiosity
    { id: 'curious_mind', name: 'Esprit Curieux', description: 'Pose 5 questions à l\'assistant', icon: '🤔', category: 'curiosity' },
    { id: 'explorer', name: 'Grand Explorateur', description: 'Découvre toutes les matières de l\'app', icon: '🧭', category: 'curiosity' },
    { id: 'science_fan', name: 'Petit Scientifique', description: 'Réalise 3 activités de sciences', icon: '🔬', category: 'curiosity' },
    { id: 'history_buff', name: 'Historien en herbe', description: 'Apprends 5 faits historiques', icon: '📜', category: 'curiosity' },

    // Consistency
    { id: 'weekly_warrior', name: 'Guerrier Hebdo', description: 'Connecte-toi 7 jours d\'affilée', icon: '🛡️', category: 'consistency' },
    { id: 'early_bird', name: 'Lève-tôt', description: 'Fais une activité avant 8h du matin', icon: '🌅', category: 'consistency' },
    { id: 'night_owl', name: 'Chouette du Savoir', description: 'Fais un quiz après 19h', icon: '🦉', category: 'consistency' },

    // Specials
    { id: 'artist', name: 'Picasso Jr', description: 'Crée ton premier dessin dans l\'atelier', icon: '🎨', category: 'progression' },
    { id: 'word_master', name: 'Maître des Mots', description: 'Découvre 10 nouveaux mots de vocabulaire', icon: '📚', category: 'curiosity' },
    { id: 'math_wizard', name: 'Mage des Chiffres', description: 'Résous 20 problèmes de calcul', icon: '🔢', category: 'excellence' },
];

export const getBadgeIcon = (id: string) => {
    const badge = BADGE_DEFINITIONS.find(b => b.id === id);
    return badge?.icon || '🏅';
};
