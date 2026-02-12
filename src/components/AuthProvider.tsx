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
    console.log("[Auth] Buscando perfil para UID:", userId);
    
    try {
      // Usamos uma consulta simples sem maybeSingle para ser mais direto
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, company_id')
        .eq('id', userId);
      
      if (error) {
        console.error("[Auth] Erro na consulta:", error.message);
        return null;
      } 
      
      if (data && data.length > 0) {
        console.log("[Auth] Perfil carregado:", data[0].role);
        return data[0] as Profile;
      }
      
      console.warn("[Auth] Perfil não encontrado no banco.");
      return null;
    } catch (err) {
      console.error("[Auth] Erro inesperado:", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          const userProfile = await fetchProfile(initialSession.user.id);
          if (mounted) setProfile(userProfile);
        }
      } catch (err) {
        console.error("[Auth] Erro na inicialização:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("[Auth] Evento:", event);
      
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (event === 'SIGNED_IN' && currentSession?.user) {
        setLoading(true);
        const userProfile = await fetchProfile(currentSession.user.id);
        if (mounted) {
          setProfile(userProfile);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
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
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
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