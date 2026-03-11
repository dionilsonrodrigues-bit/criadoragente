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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar se quem está chamando é super_admin
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader?.replace('Bearer ', '') ?? '')
    
    if (authError || !user) throw new Error('Não autorizado')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') throw new Error('Apenas super admins podem gerenciar usuários')

    const { email, password, role, company_id, first_name } = await req.json()

    // 1. Criar usuário no Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name }
    })

    if (createError) throw createError

    // 2. Atualizar o perfil criado pelo trigger ou criar se não existir
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role, company_id, first_name })
      .eq('id', newUser.user.id)

    if (profileError) throw profileError

    console.log(`[manage-users] Usuário ${email} criado com sucesso`)

    return new Response(JSON.stringify({ message: 'Usuário criado com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[manage-users] Erro:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})