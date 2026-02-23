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
  id: string;
  username: string;
  avatar_url: string;
  grade_level: string; // CP, CE1, CE2, CM1, CM2
  stars: number;
  created_at: string;
  parent_pin?: string;
  daily_time_limit?: number; // In minutes, 0 means no limit
  blocked_topics?: string[];
};

export type Progress = {
  id: string;
  user_id: string;
  subject: string; // Math, Français, Science, etc.
  score: number;
  date: string;
};
