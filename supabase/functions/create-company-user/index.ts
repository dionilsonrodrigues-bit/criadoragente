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
      name, atendi_id, email, password, phone, description, 
      plan_id, status, due_day, recurrence, logo_url 
    } = await req.json()
    
    console.log(`[create-company-user] Iniciando cadastro: ${name} / ${email}`);

    // 1. Criar a Empresa no Banco Local
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .insert([{ 
        name, 
        atendi_id,
        phone,
        description,
        plan_id: plan_id || null,
        status: status || 'active',
        due_day: due_day ? parseInt(due_day) : null,
        recurrence: recurrence || 'monthly',
        logo_url: logo_url || null
      }])
      .select()
      .single()

    if (companyError) throw companyError

    // 2. Criar o Usuário no Auth do Supabase
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { company_id: company.id }
    })

    if (authError) throw authError

    // 3. Vincular o perfil à empresa localmente
    await new Promise(r => setTimeout(r, 500));
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ 
        company_id: company.id, 
        role: 'company_admin',
        email: email
      })
      .eq('id', authUser.user.id)

    if (profileError) throw profileError

    // 4. Integração com API Externa
    console.log(`[create-company-user] Enviando dados para sistema externo...`);
    
    // Buscar limites do plano para enviar à API
    let maxUsers = 1;
    let maxConnections = 1;
    
    if (plan_id) {
      const { data: planData } = await supabaseClient
        .from('plans')
        .select('user_limit, connection_limit')
        .eq('id', plan_id)
        .single();
        
      if (planData) {
        maxUsers = planData.user_limit || 1;
        maxConnections = planData.connection_limit || 1;
      }
    }

    const externalPayload = {
      status: status || 'active',
      name: name,
      maxUsers: maxUsers,
      maxConnections: maxConnections,
      acceptTerms: true,
      email: email,
      password: password,
      userName: name, // Usando o nome da empresa como nome do usuário principal
      profile: "admin"
    };

    // NOTA: Substitua a URL abaixo pela URL real da sua API externa
    const EXTERNAL_API_URL = 'https://api.externalsystem.com/tenants'; 
    
    try {
      const externalResponse = await fetch(EXTERNAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Caso precise de token, adicione aqui:
          // 'Authorization': 'Bearer SEU_TOKEN_AQUI'
        },
        body: JSON.stringify(externalPayload)
      });

      if (!externalResponse.ok) {
        const errorText = await externalResponse.text();
        console.error(`[create-company-user] Erro na API externa: ${errorText}`);
        // Opcional: Você pode decidir se falha o cadastro todo ou apenas loga o erro
      } else {
        console.log(`[create-company-user] Integração externa concluída com sucesso.`);
      }
    } catch (extError) {
      console.error(`[create-company-user] Falha crítica ao chamar API externa:`, extError);
    }

    return new Response(JSON.stringify({ success: true, companyId: company.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(`[create-company-user] Erro:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})