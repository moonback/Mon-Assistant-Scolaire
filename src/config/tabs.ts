import {
    Home, Trophy, MessageCircle, Brain, Calculator,
    Palette, Camera, Book, BookA, Lightbulb,
    User, ShieldCheck, Layers
} from 'lucide-react';
import { TabItem } from '../types/app';

export const tabs: TabItem[] = [
    { id: 'home', label: 'Accueil', icon: Home, color: 'from-blue-500 to-sky-400', desc: 'Ton centre de mission' },
    { id: 'dashboard', label: 'Progression', icon: Trophy, color: 'from-yellow-500 to-amber-400', desc: 'Voir mes exploits' },
    { id: 'challenges', label: 'Défis AI', icon: Brain, color: 'from-orange-500 to-red-400', desc: 'Tes missions du jour' },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, color: 'from-teal-500 to-cyan-400', desc: 'Révise tes notions' },
    { id: 'assistant', label: 'Assistant', icon: MessageCircle, color: 'from-purple-500 to-indigo-400', desc: 'Pose tes questions' },
    { id: 'quiz', label: 'Quiz', icon: Brain, color: 'from-violet-500 to-purple-400', desc: 'Teste tes connaissances' },
    { id: 'math', label: 'Calcul', icon: Calculator, color: 'from-emerald-500 to-teal-400', desc: 'Deviens un pro des chiffres' },
    { id: 'drawing', label: 'L\'Atelier', icon: Palette, color: 'from-pink-500 to-rose-400', desc: 'Ton espace d\'artiste' },
    { id: 'homework', label: 'Aide Photo', icon: Camera, color: 'from-blue-600 to-indigo-500', desc: 'Aide aux devoirs' },
    { id: 'story', label: 'Histoires', icon: Book, color: 'from-orange-500 to-amber-400', desc: 'Crée tes propres contes' },
    { id: 'dictionary', label: 'Dico', icon: BookA, color: 'from-cyan-500 to-sky-400', desc: 'Découvre des mots' },
    { id: 'fact', label: 'Infos', icon: Lightbulb, color: 'from-yellow-400 to-orange-400', desc: 'Le savais-tu ?' },
    { id: 'profile', label: 'Mon Profil', icon: User, color: 'from-indigo-500 to-purple-500', desc: 'Ton avatar secret' },
    { id: 'parental', label: 'Zone Parents', icon: ShieldCheck, color: 'from-slate-700 to-slate-800', desc: 'Réglages et sécurité' },
];
