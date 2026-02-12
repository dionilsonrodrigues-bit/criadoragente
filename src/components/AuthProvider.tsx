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
    try {
      console.log("[Auth] Iniciando busca de perfil para:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("[Auth] Erro retornado pela API (404 ou outro):", error.message);
      } else if (data) {
        console.log("[Auth] Perfil carregado com sucesso.");
        setProfile(data);
      } else {
        console.warn("[Auth] Sessão ativa mas nenhum perfil encontrado na tabela 'profiles'.");
      }
    } catch (err) {
      console.error("[Auth] Erro inesperado ao buscar perfil:", err);
    } finally {
      // GARANTE que o loading acaba, não importa o que aconteça
      setLoading(false);
    }
  };

  useEffect(() => {
    // Inicialização manual do estado
    const init = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id);
      } else {
        setLoading(false);
      }
    };

    init();

    // Ouvinte de mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("[Auth] Mudança de estado:", event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Se trocou de usuário ou logou, busca o perfil
        await fetchProfile(currentSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
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