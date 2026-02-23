import { LucideIcon } from 'lucide-react';

export type Tab = 'home' | 'assistant' | 'quiz' | 'story' | 'dictionary' | 'math' | 'fact' | 'dashboard' | 'drawing' | 'homework' | 'parental' | 'profile';

export interface TabItem {
    id: Tab;
    label: string;
    icon: LucideIcon;
    color: string;
    desc: string;
}
