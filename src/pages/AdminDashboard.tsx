import React, { useState, useEffect } from 'react';
import { Building2, Globe, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalAgents: 0,
    activeAgents: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id, 
          agents(id, status)
        `);

      if (error) {
        toast.error('Erro ao buscar estatísticas.');
      } else {
        const totalAgents = data?.reduce((acc, comp) => acc + (comp.agents?.length || 0), 0) || 0;
        const activeAgents = data?.reduce((acc, comp) => 
          acc + (comp.agents?.filter((a: any) => a.status === 'active').length || 0), 0
        ) || 0;

        setStats({
          totalCompanies: data?.length || 0,
          totalAgents,
          activeAgents
        });
      }
    } catch (err) {
      console.error("[Admin] Falha ao carregar estatísticas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Administrativo</h1>
        <p className="text-gray-500 mt-1">Visão geral do sistema e infraestrutura de IA.</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Empresas', value: stats.totalCompanies, icon: Building2, color: 'text-blue-600' },
            { label: 'Agentes Criados', value: stats.totalAgents, icon: Activity, color: 'text-green-600' },
            { label: 'Agentes Ativos', value: stats.activeAgents, icon: Globe, color: 'text-purple-600' },
          ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm ring-1 ring-black/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <h3 className="text-3xl font-bold mt-1 text-slate-900">{stat.value}</h3>
                  </div>
                  <div className={`${stat.color} bg-slate-50 p-3 rounded-xl border shadow-sm`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="border-none shadow-sm ring-1 ring-black/5 p-6 bg-slate-50">
          <h3 className="font-bold text-slate-800 mb-2">Estado do Sistema</h3>
          <p className="text-sm text-slate-600">Todas as instâncias do n8n e gateways de WhatsApp estão operando normalmente.</p>
          <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-bold">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Operacional
          </div>
        </Card>
        
        <Card className="border-none shadow-sm ring-1 ring-black/5 p-6 bg-slate-50">
          <h3 className="font-bold text-slate-800 mb-2">Atualizações Recentes</h3>
          <p className="text-sm text-slate-600">O motor de IA foi atualizado para suporte a prompts mais longos e melhorias no transbordo.</p>
          <div className="mt-4 text-xs text-slate-400">Versão 1.2.0-stable</div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;