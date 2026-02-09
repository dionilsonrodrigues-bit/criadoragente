import React, { useState } from 'react';
import { Plus, MoreVertical, Play, Power, Copy, ExternalLink, Bot } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// Mock de dados para visualização inicial
const initialAgents = [
  { id: '1', name: 'Agente de Vendas Natal', status: 'active', type: 'SDR', objective: 'Vender', updated: '2 horas atrás' },
  { id: '2', name: 'Suporte Técnico N1', status: 'inactive', type: 'Suporte', objective: 'Responder dúvidas', updated: '1 dia atrás' },
  { id: '3', name: 'Triagem Inicial', status: 'inactive', type: 'Recepcionista', objective: 'Direcionar atendimento', updated: '3 dias atrás' },
];

const Dashboard = () => {
  const [agents, setAgents] = useState(initialAgents);

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === id) {
        const newState = agent.status === 'active' ? 'inactive' : 'active';
        if (newState === 'active') {
          // Desativa todos os outros se este estiver sendo ativado
          toast.success(`${agent.name} agora é o agente ativo.`);
          return { ...agent, status: 'active' };
        }
        return { ...agent, status: 'inactive' };
      }
      // Se outro agente for ativado, este deve ser inativado
      return { ...agent, status: 'inactive' };
    }));
  };

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className={agent.status === 'active' ? "border-blue-500 shadow-md ring-1 ring-blue-500" : ""}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <Badge variant={agent.status === 'active' ? "default" : "outline"} className={agent.status === 'active' ? "bg-blue-600 hover:bg-blue-600" : ""}>
                  {agent.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </div>
              <CardTitle className="mt-4 text-xl">{agent.name}</CardTitle>
              <CardDescription>Objetivo: {agent.objective}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center py-2 border-y border-gray-100">
                  <span className="text-sm text-gray-500">Tipo</span>
                  <span className="text-sm font-semibold">{agent.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Power size={14} className={agent.status === 'active' ? "text-green-500" : "text-gray-400"} />
                    <span className="text-sm font-medium">Status do Agente</span>
                  </div>
                  <Switch 
                    checked={agent.status === 'active'} 
                    onCheckedChange={() => toggleAgent(agent.id)}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" className="flex-1 gap-2" size="sm" asChild>
                    <Link to={`/agents/edit/${agent.id}`}>Editar</Link>
                  </Button>
                  <Button variant="secondary" className="gap-2" size="sm">
                    <Play size={14} />
                    Testar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
          <div className="flex-1 bg-white p-3 rounded-md border font-mono text-sm text-gray-600 flex justify-between items-center">
            https://n8n.atendipro.com.br/webhook/triagem-zpro/12345
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
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