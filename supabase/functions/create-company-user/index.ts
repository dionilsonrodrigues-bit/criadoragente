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

    const { name, atendi_id, email, password } = await req.json()
    console.log(`[create-company-user] Iniciando cadastro: ${name} / ${email}`);

    // 1. Criar a Empresa
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .insert([{ name, atendi_id }])
      .select()
      .single()

    if (companyError) throw companyError

    // 2. Criar o Usuário no Auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { company_id: company.id }
    })

    if (authError) throw authError

    // 3. Vincular o perfil à empresa (o perfil é criado via trigger automática)
    // Damos um pequeno delay para garantir que o trigger de perfil já rodou
    await new Promise(r => setTimeout(r, 500));
    
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ company_id: company.id, role: 'company_admin' })
      .eq('id', authUser.user.id)

    if (profileError) throw profileError

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