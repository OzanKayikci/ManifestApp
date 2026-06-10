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
  isMock: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const isPlaceholder = process.env.EXPO_PUBLIC_SUPABASE_URL === undefined || 
                      process.env.EXPO_PUBLIC_SUPABASE_URL === '' || 
                      process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder-project');

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  isMock: isPlaceholder,

  initialize: async () => {
    if (isPlaceholder) {
      console.warn("Using MOCK Auth mode because Supabase keys are placeholders.");
      set({ session: null, user: null, loading: false });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, loading: session ? true : false });
      
      if (session) {
        await get().refreshProfile();
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.warn('Supabase getSession failed, falling back to mock mode:', err);
      set({ session: null, user: null, loading: false, isMock: true });
    }

    try {
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (get().isMock) return;
        set({ session, loading: session ? true : false });
        if (session) {
          await get().refreshProfile();
        } else {
          set({ user: null, loading: false });
        }
      });
    } catch (err) {
      console.warn('Supabase auth listener setup failed:', err);
    }
  },

  refreshProfile: async () => {
    if (get().isMock) return;
    const { session } = get();
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.warn('Profile not found in public.users:', error);
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
    if (get().isMock) {
      set({ loading: true });
      const mockSession = {
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: { id: 'mock-user-id', email }
      } as any;
      const mockProfile: UserProfile = {
        id: 'mock-user-id',
        username: email.split('@')[0],
        points: 120,
        current_multiplier: 1.0,
        created_at: new Date().toISOString()
      };
      setTimeout(() => {
        set({ session: mockSession, user: mockProfile, loading: false });
      }, 500);
      return { error: null };
    }

    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) set({ loading: false });
    return { error };
  },

  signUp: async (email, password, username) => {
    if (get().isMock) {
      set({ loading: true });
      const mockSession = {
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: { id: 'mock-user-id', email }
      } as any;
      const mockProfile: UserProfile = {
        id: 'mock-user-id',
        username,
        points: 0,
        current_multiplier: 1.0,
        created_at: new Date().toISOString()
      };
      setTimeout(() => {
        set({ session: mockSession, user: mockProfile, loading: false });
      }, 500);
      return { error: null };
    }

    set({ loading: true });
    const { error } = await supabase.auth.signUp({
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
    if (get().isMock) {
      set({ session: null, user: null, loading: false });
      return { error: null };
    }

    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    set({ session: null, user: null, loading: false });
    return { error };
  },
}));
