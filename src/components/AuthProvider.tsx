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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileWithTimeout = async (userId: string): Promise<Profile | null> => {
    // Cria uma promessa que rejeita após 3 segundos
    const timeout = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout ao carregar perfil")), 3000)
    );

    try {
      // Tenta buscar o perfil, mas desiste se demorar mais que o timeout
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw error;
          return data as Profile;
        });

      return await Promise.race([profilePromise, timeout]);
    } catch (err) {
      console.error("[Auth] Erro ou Timeout no perfil:", err);
      return null;
    }
  };

  const retryProfile = async () => {
    if (!user) return;
    setLoading(true);
    const p = await fetchProfileWithTimeout(user.id);
    setProfile(p);
    setLoading(false);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          // Buscamos o perfil, mas não deixamos o app travar se ele falhar
          const p = await fetchProfileWithTimeout(initialSession.user.id);
          setProfile(p);
        }
      } catch (e) {
        console.error("[Auth] Falha na inicialização:", e);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          const p = await fetchProfileWithTimeout(currentSession.user.id);
          setProfile(p);
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