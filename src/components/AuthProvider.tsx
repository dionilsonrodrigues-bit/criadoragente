import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  role: 'super_admin' | 'company_admin';
  company_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  retryProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, company_id')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return (data as Profile | null) ?? null;
    } catch (err) {
      console.error('[Auth] Erro ao carregar perfil:', err);
      return null;
    }
  };

  const fetchProfileWithRetry = async (userId: string): Promise<Profile | null> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await fetchProfile(userId);
      if (result) return result;
      await wait(400);
    }

    return null;
  };

  const retryProfile = async () => {
    if (!user) return;
    setLoading(true);
    const nextProfile = await fetchProfileWithRetry(user.id);
    setProfile(nextProfile);
    setLoading(false);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          const nextProfile = await fetchProfileWithRetry(initialSession.user.id);
          setProfile(nextProfile);
        }
      } catch (e) {
        console.error('[Auth] Falha na inicialização:', e);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setLoading(true);

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          const nextProfile = await fetchProfileWithRetry(currentSession.user.id);
          setProfile(nextProfile);
        }

        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, retryProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
