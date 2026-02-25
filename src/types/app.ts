import { LucideIcon } from 'lucide-react';

export type Tab = 'home' | 'assistant' | 'quiz' | 'story' | 'dictionary' | 'math' | 'fact' | 'dashboard' | 'drawing' | 'homework' | 'parental' | 'profile' | 'challenges' | 'flashcards';

export type ParentalTab = 'overview' | 'children' | 'rewards' | 'security';

export interface TabItem {
    id: Tab;
    label: string;
    icon: LucideIcon;
    color: string;
    desc: string;
}
