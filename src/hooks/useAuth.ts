import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  username: string;
  points: number;
  current_multiplier: number;
  created_at: string;
}

interface AuthState {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,

  initialize: async () => {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, loading: session ? true : false });
    
    if (session) {
      await get().refreshProfile();
    } else {
      set({ loading: false });
    }

    // Listen to changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, loading: session ? true : false });
      if (session) {
        await get().refreshProfile();
      } else {
        set({ user: null, loading: false });
      }
    });
  },

  refreshProfile: async () => {
    const { session } = get();
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        // If profile not created yet, retry or set loading false
        console.warn('Profile not found in public.users, retrying...', error);
        set({ loading: false });
        return;
      }
      set({ user: data, loading: false });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) set({ loading: false });
    return { error };
  },

  signUp: async (email, password, username) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    if (error) set({ loading: false });
    return { error };
  },

  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    set({ session: null, user: null, loading: false });
    return { error };
  },
}));
