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
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#dc2626',
                  brandAccent: '#b91c1c',
                }
              }
            }
          }}
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail Master',
                password_label: 'Senha',
                button_label: 'Entrar no Sistema',
                loading_button_label: 'Entrando...',
                email_input_placeholder: 'Seu e-mail master',
                password_input_placeholder: 'Sua senha',
              },
              forgotten_password: {
                link_text: 'Esqueceu sua senha?',
                button_label: 'Enviar instruções de recuperação',
                loading_button_label: 'Enviando...',
                email_label: 'E-mail',
                email_input_placeholder: 'Seu e-mail cadastrado',
              }
            }
          }}
        />
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 italic">
            Atendimento exclusivo para administradores de infraestrutura AtendiPRO.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperLogin;