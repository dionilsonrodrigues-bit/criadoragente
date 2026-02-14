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

    const { company_id } = await req.json()
    console.log(`[delete-company-full] Iniciando exclusão da empresa: ${company_id}`);

    // 1. Buscar todos os usuários vinculados a esta empresa
    const { data: profiles, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('company_id', company_id);

    if (fetchError) throw fetchError;

    // 2. Excluir os usuários do Supabase Auth
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        console.log(`[delete-company-full] Removendo usuário Auth: ${profile.id}`);
        await supabaseClient.auth.admin.deleteUser(profile.id);
      }
    }

    // 3. Excluir a empresa (isso vai disparar o cascade no DB se o SQL acima for executado)
    const { error: deleteError } = await supabaseClient
      .from('companies')
      .delete()
      .eq('id', company_id);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(`[delete-company-full] Erro:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})