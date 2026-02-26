import { LucideIcon } from 'lucide-react';

// ─── Grade Levels ────────────────────────────────────────
export type GradeLevel = 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | '6ème';

export const GRADE_LEVELS: GradeLevel[] = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème'];

// ─── Navigation ──────────────────────────────────────────
export type Tab = 'home' | 'assistant' | 'quiz' | 'story' | 'dictionary' | 'math' | 'fact' | 'dashboard' | 'drawing' | 'homework' | 'parental' | 'profile' | 'challenges' | 'flashcards' | 'market';

export type ParentalTab = 'overview' | 'children' | 'missions' | 'rewards' | 'security' | 'competitions';

export interface TabItem {
    id: Tab;
    label: string;
    icon: LucideIcon;
    color: string;
    desc: string;
}

// ─── Reward Goal ─────────────────────────────────────────
export interface RewardGoal {
    id: number;
    label: string;
    target: number;
    icon: string;
    claimed?: boolean;
    claimed_at?: string;
}

// ─── Parental Mission ────────────────────────────────────
export type MissionStatus = 'pending' | 'completed' | 'verified';
export type MissionCategory = 'education' | 'home' | 'behavior' | 'sport';

export interface ParentalMission {
    id: string;
    label: string;
    description?: string;
    reward: number; // stars
    icon: string;
    status: MissionStatus;
    category: MissionCategory;
    due_date?: string;
    completed_at?: string;
}

// ─── Activity Types ──────────────────────────────────────
export type ActivityType =
    | 'quiz'
    | 'math'
    | 'assistant'
    | 'homework'
    | 'drawing'
    | 'story'
    | 'flashcard'
    | 'challenge'
    | 'pedagogy_mission'
    | 'pedagogy_explanation';

// ─── Common Props ────────────────────────────────────────
export interface EarnPointsProps {
    onEarnPoints: (amount: number, activityType: string, subject?: string) => void;
}

export interface ChildActivityProps extends EarnPointsProps {
    gradeLevel?: GradeLevel;
}

// ─── Weekly Plan ─────────────────────────────────────────
export interface RecommendedActivity {
    title: string;
    desc: string;
}

export interface ParentFeedbackScript {
    tip: string;
    context: string;
}

export interface WeeklyPlan {
    id: string;
    objectives: string[];
    recommended_activities: RecommendedActivity[];
    parent_feedback_scripts: ParentFeedbackScript[];
}
