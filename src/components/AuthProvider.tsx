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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    console.time("[Auth] Tempo de resposta perfil");
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, company_id')
        .eq('id', userId)
        .maybeSingle(); // Mais rápido para busca por ID único
      
      if (error) {
        console.error("[Auth] Erro na query de perfil:", error);
        return null;
      }
      
      console.timeEnd("[Auth] Tempo de resposta perfil");
      return data as Profile;
    } catch (err) {
      console.error("[Auth] Exceção ao buscar perfil:", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      console.log("[Auth] Iniciando verificação de sessão...");
      try {
        // Pega a sessão local (muito rápido)
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          console.log("[Auth] Sessão encontrada, buscando perfil...");
          setSession(initialSession);
          setUser(initialSession.user);
          const userProfile = await fetchProfile(initialSession.user.id);
          if (mounted) setProfile(userProfile);
        } else {
          console.log("[Auth] Nenhuma sessão ativa encontrada.");
        }
      } catch (err) {
        console.error("[Auth] Falha crítica na inicialização:", err);
      } finally {
        if (mounted) {
          console.log("[Auth] Inicialização concluída.");
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("[Auth] Mudança de estado detectada:", event);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        const userProfile = await fetchProfile(currentSession.user.id);
        if (mounted) setProfile(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
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
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
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