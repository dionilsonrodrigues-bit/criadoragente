import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Power, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao buscar agentes');
    } else {
      setAgents(data || []);
    }
    setIsLoading(false);
  };

  const toggleAgent = async (id: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    // Se estivermos ativando um agente, desativamos todos os outros (regra de 1 ativo por vez)
    if (newStatus === 'active') {
      await supabase
        .from('agents')
        .update({ status: 'inactive' })
        .neq('id', id);
    }

    const { error } = await supabase
      .from('agents')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(`${name} agora está ${newStatus === 'active' ? 'ativo' : 'inativo'}`);
      fetchAgents();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agente?')) return;
    
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir agente');
    } else {
      toast.success('Agente excluído com sucesso');
      fetchAgents();
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel de Agentes</h1>
          <p className="text-gray-500 mt-1">Gerencie a inteligência artificial do seu atendimento.</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/agents/new">
            <Plus size={18} />
            Criar Novo Agente
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : agents.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <CardDescription>Você ainda não criou nenhum agente de IA.</CardDescription>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/agents/new">Criar meu primeiro agente</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className={agent.status === 'active' ? "border-blue-500 shadow-md ring-1 ring-blue-500" : ""}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={agent.status === 'active' ? "default" : "outline"} className={agent.status === 'active' ? "bg-blue-600 hover:bg-blue-600" : ""}>
                    {agent.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/agents/edit/${agent.id}`} className="cursor-pointer">Editar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 cursor-pointer"
                        onClick={() => handleDelete(agent.id)}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="mt-4 text-xl">{agent.name}</CardTitle>
                <CardDescription className="truncate">Objetivo: {agent.objective || 'Não definido'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center py-2 border-y border-gray-100">
                    <span className="text-sm text-gray-500">Tipo</span>
                    <span className="text-sm font-semibold uppercase">{agent.type || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Power size={14} className={agent.status === 'active' ? "text-green-500" : "text-gray-400"} />
                      <span className="text-sm font-medium">Status do Agente</span>
                    </div>
                    <Switch 
                      checked={agent.status === 'active'} 
                      onCheckedChange={() => toggleAgent(agent.id, agent.status, agent.name)}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" className="w-full gap-2" size="sm" asChild>
                      <Link to={`/agents/edit/${agent.id}`}>Configurar</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
  );
};

export default Dashboard;