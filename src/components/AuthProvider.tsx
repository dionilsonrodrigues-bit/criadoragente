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

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    // Se já estiver buscando, não inicia outra busca paralela
    if (isFetching.current) return null;
    isFetching.current = true;
    
    console.log("[Auth] Iniciando busca de perfil no banco...");

    // Aumentamos o timeout para 20 segundos para conexões mais lentas
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => {
        console.warn("[Auth] Timeout de 20s atingido ao buscar perfil.");
        resolve(null);
      }, 20000)
    );

    const queryPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error("[Auth] Erro na tabela profiles:", error.message);
          return null;
        }

        if (data) {
          console.log("[Auth] Perfil carregado com sucesso:", data.role);
          return data as Profile;
        }

        console.warn("[Auth] Registro de perfil não encontrado.");
        return null;
      } catch (err) {
        console.error("[Auth] Erro inesperado ao buscar perfil:", err);
        return null;
      }
    })();

    const result = await Promise.race([queryPromise, timeoutPromise]);
    isFetching.current = false;
    return result;
  };

  const retryProfile = async () => {
    if (!user) return;
    setLoading(true);
    const p = await fetchProfile(user.id);
    setProfile(p);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const startApp = async () => {
      console.log("[Auth] Verificando sessão local...");
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (activeSession) {
        console.log("[Auth] Usuário logado detectado.");
        setSession(activeSession);
        setUser(activeSession.user);
        const p = await fetchProfile(activeSession.user.id);
        if (mounted) setProfile(p);
      }
      
      if (mounted) setLoading(false);
    };

    startApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("[Auth] Mudança de estado:", event);
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          // Se mudou o usuário ou não tem profile, busca
          const p = await fetchProfile(currentSession.user.id);
          if (mounted) setProfile(p);
        }
        setLoading(false);
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