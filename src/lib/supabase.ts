/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export type Profile = {
  id: string; // auth.uid()
  username: string; // Parent name or family name
  avatar_url: string;
  created_at: string;
  parent_pin: string | null;
  ai_model: string | null;
};

export type Child = {
  id: string;
  parent_id: string;
  name: string;
  avatar_url: string;
  grade_level: string; // CP, CE1, CE2, CM1, CM2
  stars: number;
  daily_time_limit: number; // In minutes, 0 means no limit
  bedtime?: string;
  reward_goals?: any[];
  blocked_topics: string[];
  created_at: string;
};

export type Progress = {
  id: string;
  user_id: string; // Parent ID
  child_id: string; // Linked child
  subject: string;
  activity_type: string;
  score: number;
  date: string;
};
