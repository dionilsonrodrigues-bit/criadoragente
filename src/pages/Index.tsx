import React, { useState, useEffect } from 'react';
import { Bot, Copy, ExternalLink, Loader2, Activity, Globe, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalDepartments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    const [agentsRes, deptsRes] = await Promise.all([
      supabase.from('agents').select('status'),
      supabase.from('departments').select('id', { count: 'exact' })
    ]);

    setStats({
      totalAgents: agentsRes.data?.length || 0,
      activeAgents: agentsRes.data?.filter(a => a.status === 'active').length || 0,
      totalDepartments: deptsRes.count || 0
    });
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral da sua operação de IA.</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Agentes</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.totalAgents}</h3>
                </div>
                <Bot className="text-blue-600" size={24} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Agentes Ativos</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.activeAgents}</h3>
                </div>
                <Activity className="text-green-600" size={24} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Departamentos</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.totalDepartments}</h3>
                </div>
                <Globe className="text-purple-600" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-slate-50 border-dashed border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink size={18} className="text-blue-600" />
              Integração com n8n
            </CardTitle>
            <CardDescription>
              Use o webhook abaixo no seu fluxo do n8n para consumir o agente ativo da sua empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex-1 bg-white p-3 rounded-md border font-mono text-sm text-gray-600 flex justify-between items-center overflow-x-auto">
              <span className="whitespace-nowrap">https://n8n.atendipro.com.br/webhook/triagem-zpro/12345</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-4 shrink-0" onClick={() => {
                navigator.clipboard.writeText('https://n8n.atendipro.com.br/webhook/triagem-zpro/12345');
                toast.success('URL copiada para a área de transferência!');
              }}>
                <Copy size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;