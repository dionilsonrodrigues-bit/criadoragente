import React, { useState, useEffect } from 'react';
import { Bot, Copy, ExternalLink, Loader2, Activity, Globe, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const Index = () => {
  const { profile, user, retryProfile } = useAuth();
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalDepartments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    setIsLoading(true);
    const companyQuery = profile?.company_id ? { company_id: profile.company_id } : {};
    
    const [agentsRes, deptsRes] = await Promise.all([
      supabase.from('agents').select('status').match(companyQuery),
      supabase.from('departments').select('id', { count: 'exact' }).match(companyQuery)
    ]);

    setStats({
      totalAgents: agentsRes.data?.length || 0,
      activeAgents: agentsRes.data?.filter(a => a.status === 'active').length || 0,
      totalDepartments: deptsRes.count || 0
    });
    setIsLoading(false);
  };

  const handlePromoteMe = async () => {
    if (!user) return;
    setIsPromoting(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', user.id);

    if (error) {
      toast.error("Erro ao promover: " + error.message);
    } else {
      toast.success("Agora você é Super Admin! Atualizando...");
      await retryProfile();
      // Opcional: recarregar a página para garantir que o layout atualize
      window.location.reload();
    }
    setIsPromoting(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {profile?.company_id ? 'Gerencie os agentes da sua empresa.' : 'Bem-vindo ao AtendiPRO IA.'}
          </p>
        </div>

        {/* Botão Temporário de Promoção */}
        {profile?.role !== 'super_admin' && (
          <Button 
            variant="destructive" 
            className="gap-2 animate-pulse" 
            onClick={handlePromoteMe}
            disabled={isPromoting}
          >
            {isPromoting ? <Loader2 className="animate-spin" size={16} /> : <ShieldAlert size={16} />}
            Me tornar Super Admin
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Agentes</p>
                  <h3 className="text-2xl font-bold mt-1 text-slate-900">{stats.totalAgents}</h3>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Bot className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Agentes Ativos</p>
                  <h3 className="text-2xl font-bold mt-1 text-slate-900">{stats.activeAgents}</h3>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <Activity className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Departamentos</p>
                  <h3 className="text-2xl font-bold mt-1 text-slate-900">{stats.totalDepartments}</h3>
                </div>
                <div className="bg-purple-50 p-2 rounded-lg">
                  <Globe className="text-purple-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-white border-dashed border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <ExternalLink size={18} className="text-blue-600" />
            Integração Webhook
          </CardTitle>
          <CardDescription>
            Envie as mensagens do chat para este endpoint para processar com a IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex-1 bg-slate-50 p-4 rounded-lg border font-mono text-sm text-slate-600 flex justify-between items-center overflow-x-auto">
            <span className="whitespace-nowrap select-all">https://api.atendipro.com.br/v1/agent/active</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-4 shrink-0 hover:bg-white" onClick={() => {
              navigator.clipboard.writeText('https://api.atendipro.com.br/v1/agent/active');
              toast.success('URL copiada!');
            }}>
              <Copy size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;