import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { ShieldCheck } from 'lucide-react';

const SuperLogin = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && profile?.role === 'super_admin') {
      navigate('/admin');
    }
  }, [session, profile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-red-600 p-3 rounded-2xl mb-4">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Portal Super Admin</h1>
          <p className="text-slate-500 text-sm">Acesso restrito à gestão de empresas</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          localization={{
            variables: {
              sign_in: { email_label: 'E-mail Master', password_label: 'Senha', button_label: 'Entrar no Sistema' }
            }
          }}
        />
      </div>
    </div>
  );
};

export default SuperLogin;