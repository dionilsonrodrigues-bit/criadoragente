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

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) throw new Error('Não autorizado')

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') throw new Error('Apenas super admins podem gerenciar usuários')

    const body = await req.json()
    const action = body.action || 'create'

    if (action === 'delete') {
      const userId = body.user_id

      if (!userId) throw new Error('Usuário não informado')
      if (userId === user.id) throw new Error('Você não pode excluir seu próprio usuário')

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) throw deleteError

      console.log(`[manage-users] Usuário ${userId} excluído com sucesso`)

      return new Response(JSON.stringify({ message: 'Usuário excluído com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { email, password, role, company_id, first_name } = body

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name }
    })

    if (createError) throw createError

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
    console.error('[manage-users] Erro:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
