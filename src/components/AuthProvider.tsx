import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const isFetching = useRef(false);

  const loadProfile = async (userId: string) => {
    if (isFetching.current) return null;
    isFetching.current = true;
    
    console.log("[Auth] Buscando perfil para ID:", userId);
    try {
      // Usando select normal em vez de maybeSingle para evitar travamentos de query
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, role, company_id')
        .eq('id', userId);
      
      if (error) {
        console.error("[Auth] Erro Supabase:", error.message, "Status:", status);
        return null;
      }

      if (data && data.length > 0) {
        console.log("[Auth] Perfil encontrado com sucesso!");
        return data[0] as Profile;
      }
      
      console.warn("[Auth] Nenhum registro de perfil encontrado para este ID.");
      return null;
    } catch (err) {
      console.error("[Auth] Exceção na busca de perfil:", err);
      return null;
    } finally {
      isFetching.current = false;
    }
  };

  const retryProfile = async () => {
    if (!user) return;
    setLoading(true);
    const p = await loadProfile(user.id);
    setProfile(p);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log("[Auth] Inicializando...");
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        const p = await loadProfile(initialSession.user.id);
        if (mounted) setProfile(p);
      }
      
      if (mounted) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("[Auth] Evento:", event);
      
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user && !profile) {
          const p = await loadProfile(currentSession.user.id);
          if (mounted) setProfile(p);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
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