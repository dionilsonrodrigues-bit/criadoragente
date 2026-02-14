import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      company_id, name, atendi_id, phone, description, plan_id, status, due_day, recurrence,
      admin_email, admin_password 
    } = await req.json()

    console.log(`[update-company-full] Atualizando empresa ID: ${company_id}`);

    // 1. Atualizar a Empresa
    const { error: companyError } = await supabaseClient
      .from('companies')
      .update({ 
        name, atendi_id, phone, description, plan_id, status, 
        due_day: parseInt(due_day), recurrence 
      })
      .eq('id', company_id);

    if (companyError) throw companyError;

    // 2. Localizar o Admin da Empresa no Profiles
    const { data: profile, error: profileFetchError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('company_id', company_id)
      .eq('role', 'company_admin')
      .maybeSingle();

    if (profileFetchError) throw profileFetchError;

    // 3. Atualizar o Usuário no Auth se houver perfil e dados de login
    if (profile && (admin_email || admin_password)) {
      const updatePayload: any = {};
      if (admin_email) updatePayload.email = admin_email;
      if (admin_password) updatePayload.password = admin_password;

      const { error: authUpdateError } = await supabaseClient.auth.admin.updateUserById(
        profile.id,
        updatePayload
      );

      if (authUpdateError) throw authUpdateError;

      // Se mudou o e-mail, atualiza também no profile
      if (admin_email) {
        await supabaseClient
          .from('profiles')
          .update({ email: admin_email })
          .eq('id', profile.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(`[update-company-full] Erro:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})