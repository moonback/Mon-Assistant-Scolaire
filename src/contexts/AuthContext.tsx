import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { supabase, Profile, Child } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  children: Child[];
  selectedChild: Child | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSelectedChild: (child: Child | null) => void;
  refreshChildren: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children: childrenProp }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChildState] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchChildren(session.user.id);
      }
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchChildren(session.user.id);
      }
      else {
        setProfile(null);
        setChildren([]);
        setSelectedChildState(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Restore selected child from localStorage
  useEffect(() => {
    if (children.length > 0) {
      const savedChildId = localStorage.getItem('selected_child_id');
      if (savedChildId) {
        const child = children.find(c => c.id === savedChildId);
        if (child) setSelectedChildState(child);
      }
    }
  }, [children]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data);
      if (data.ai_model) {
        localStorage.setItem('openrouter_model', data.ai_model);
      }
    }
  };

  const fetchChildren = async (userId: string) => {
    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', userId);

    if (data) {
      setChildren(data);
      // Sync selected child if it exists
      if (selectedChild) {
        const updated = data.find(c => c.id === selectedChild.id);
        if (updated) setSelectedChildState(updated);
      }
    }
    setLoading(false);
  };

  const setSelectedChild = useCallback((child: Child | null) => {
    setSelectedChildState(child);
    if (child) localStorage.setItem('selected_child_id', child.id);
    else localStorage.removeItem('selected_child_id');
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await fetchProfile(session.user.id);
  }, [session?.user.id]);

  const refreshChildren = useCallback(async () => {
    if (session?.user.id) await fetchChildren(session.user.id);
  }, [session?.user.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setChildren([]);
    setSelectedChild(null);
    setSession(null);
    localStorage.removeItem('selected_child_id');
  }, [setSelectedChild]);

  const value = useMemo(() => ({
    session, profile, children, selectedChild, loading,
    signOut, refreshProfile, setSelectedChild, refreshChildren
  }), [session, profile, children, selectedChild, loading, signOut, refreshProfile, setSelectedChild, refreshChildren]);

  return (
    <AuthContext.Provider value={value}>
      {childrenProp}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
