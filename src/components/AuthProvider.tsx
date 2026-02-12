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

  // Função centralizada para buscar perfil
  const loadProfile = async (userId: string) => {
    console.log("[Auth] Tentando carregar perfil...");
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, company_id')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile;
    } catch (err) {
      console.error("[Auth] Erro ao carregar perfil:", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Função única de inicialização
    const init = async () => {
      console.log("[Auth] Iniciando sistema...");
      
      // 1. Pega a sessão atual (rápido, vem do localStorage)
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        
        // 2. Busca o perfil apenas se houver sessão
        const userProfile = await loadProfile(initialSession.user.id);
        if (mounted) setProfile(userProfile);
      }
      
      if (mounted) {
        console.log("[Auth] Pronto.");
        setLoading(false);
      }
    };

    init();

    // Ouvinte para mudanças de login/logout (apenas para ações do usuário)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("[Auth] Evento Auth:", event);
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && currentSession && !profile) {
        setSession(currentSession);
        setUser(currentSession.user);
        const userProfile = await loadProfile(currentSession.user.id);
        if (mounted) setProfile(userProfile);
        setLoading(false);
      }
    });

    // Timeout de segurança: Se em 10s ainda estiver carregando, libera a tela
    const safetyTimer = setTimeout(() => {
      if (loading && mounted) {
        console.warn("[Auth] Tempo limite de carregamento atingido.");
        setLoading(false);
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [profile, loading]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
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