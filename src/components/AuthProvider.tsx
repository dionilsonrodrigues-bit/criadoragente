import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthApiError, Session, User } from '@supabase/supabase-js';
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

  const clearLocalState = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const clearBrokenSession = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore local cleanup errors
    }
    clearLocalState();
  };

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, company_id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        const isAbort = error.details?.includes('AbortError') || error.message?.includes('AbortError');
        if (isAbort) {
          console.warn('[Auth] Busca de perfil abortada, seguindo sem travar a interface.');
          return null;
        }
        throw error;
      }

      return (data as Profile | null) ?? null;
    } catch (err: any) {
      const isAbort = err?.details?.includes('AbortError') || err?.message?.includes('AbortError');
      if (isAbort) {
        console.warn('[Auth] Busca de perfil abortada, seguindo sem travar a interface.');
        return null;
      }

      console.error('[Auth] Erro ao carregar perfil:', err);
      return null;
    }
  };

  const fetchProfileWithRetry = async (userId: string): Promise<Profile | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await fetchProfile(userId);
      if (result) return result;
      await wait(250);
    }
    return null;
  };

  const applySession = async (nextSession: Session | null) => {
    if (!nextSession) {
      clearLocalState();
      return;
    }

    setSession(nextSession);
    setUser(nextSession.user);

    void fetchProfileWithRetry(nextSession.user.id).then((nextProfile) => {
      setProfile(nextProfile);
    });
  };

  const retryProfile = async () => {
    if (!user) return;
    const nextProfile = await fetchProfileWithRetry(user.id);
    setProfile(nextProfile);
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          if (error instanceof AuthApiError) {
            console.warn('[Auth] Sessão inválida ao iniciar:', error.message);
          }
          await clearBrokenSession();
          return;
        }

        await applySession(data.session);
      } catch (error) {
        console.error('[Auth] Falha na inicialização:', error);
        await clearBrokenSession();
      } finally {
        setLoading(false);
      }
    };

    const refreshFromCurrentSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          await clearBrokenSession();
          return;
        }
        await applySession(data.session);
      } catch (error) {
        console.error('[Auth] Falha ao recuperar sessão ativa:', error);
        await clearBrokenSession();
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        clearLocalState();
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        await applySession(currentSession);
        setLoading(false);
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshFromCurrentSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signOut = async () => {
    await clearBrokenSession();
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
