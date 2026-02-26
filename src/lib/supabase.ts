/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import type { GradeLevel, RewardGoal } from '../types/app';

// ─── Validation ──────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes.\n' +
    'Copie .env.example vers .env et renseigne tes clés Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Database Types ──────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
  parent_pin: string | null;
  ai_model: string | null;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  avatar_url: string;
  grade_level: GradeLevel;
  stars: number;
  daily_time_limit: number;
  bedtime?: string;
  reward_goals?: RewardGoal[];
  blocked_topics: string[];
  allowed_subjects?: string[];
  weak_points?: string[];
  badges?: string[];
  created_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  child_id: string;
  subject: string;
  activity_type: string;
  score: number;
  date: string;
}
