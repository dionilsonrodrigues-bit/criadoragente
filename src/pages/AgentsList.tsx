import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Power, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AgentsList = () => {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchAgents();
    }
  }, [profile]);

  const fetchAgents = async () => {
    setIsLoading(true);
    const query = supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Erro ao buscar agentes');
    } else {
      setAgents(data || []);
    }
    setIsLoading(false);
  };

  const toggleAgent = async (id: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    // Desativa outros se estiver ativando este (apenas dentro da mesma empresa)
    if (newStatus === 'active') {
      const updateQuery = supabase
        .from('agents')
        .update({ status: 'inactive' })
        .neq('id', id);
      
      if (profile?.company_id) {
        updateQuery.eq('company_id', profile.company_id);
      }
      
      await updateQuery;
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
    <div className="space-y-8">
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meus Agentes</h1>
          <p className="text-gray-500 mt-1">Configure a inteligência artificial do seu atendimento.</p>
        </div>
        <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Link to="/agents/new">
            <Plus size={18} />
            Criar Agente
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : agents.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-slate-50">
          <CardDescription className="mb-4">Você ainda não criou nenhum agente de IA para esta empresa.</CardDescription>
          <Button asChild variant="outline">
            <Link to="/agents/new">Criar meu primeiro agente</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className={cn(
              "border-none shadow-sm ring-1 transition-all duration-300",
              agent.status === 'active' ? "ring-blue-500 shadow-md shadow-blue-500/10" : "ring-slate-200"
            )}>
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
                <CardTitle className="mt-4 text-xl font-bold text-slate-900">{agent.name}</CardTitle>
                <CardDescription className="truncate text-slate-500">Objetivo: {agent.objective || 'Não definido'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center py-3 border-y border-slate-50 text-sm">
                    <span className="text-slate-500">Tipo</span>
                    <span className="font-semibold text-slate-900 uppercase tracking-tighter">{agent.type || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Power size={14} className={agent.status === 'active' ? "text-green-500" : "text-slate-400"} />
                      <span>Status do Agente</span>
                    </div>
                    <Switch 
                      checked={agent.status === 'active'} 
                      onCheckedChange={() => toggleAgent(agent.id, agent.status, agent.name)}
                    />
                  </div>
                  <Button variant="secondary" className="w-full mt-2" asChild>
                    <Link to={`/agents/edit/${agent.id}`}>Configurar Cérebro</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentsList;