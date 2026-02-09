import React, { useState } from 'react';
import { Building2, Globe, Key, Activity, Search, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([
    { id: 1, name: 'Empresa Alpha', agents: 4, status: 'Ativa', created: '12/05/2024' },
    { id: 2, name: 'Beta Tech', agents: 2, status: 'Ativa', created: '15/05/2024' },
    { id: 3, name: 'Gama Services', agents: 0, status: 'Pendente', created: '20/05/2024' },
  ]);

  const stats = [
    { label: 'Total Empresas', value: companies.length.toString(), icon: Building2, color: 'text-blue-600' },
    { label: 'Agentes Criados', value: '458', icon: Activity, color: 'text-green-600' },
    { label: 'Agentes Ativos', value: '98', icon: Globe, color: 'text-purple-600' },
  ];

  const handleAddCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('companyName') as string;
    
    setCompanies(prev => [
      { id: Date.now(), name, agents: 0, status: 'Ativa', created: new Date().toLocaleDateString() },
      ...prev
    ]);
    toast.success('Empresa cadastrada com sucesso!');
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-1 text-slate-900">{stat.value}</h3>
                </div>
                <div className={`${stat.color} bg-white p-3 rounded-xl border shadow-sm`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configurações Globais */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-black/5">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg">Configurações Globais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Webhook Base n8n</Label>
                <Input defaultValue="https://n8n.atendipro.com.br/webhook" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Token de Integração</Label>
                <div className="flex gap-2">
                  <Input type="password" value="sk_test_123456789" readOnly />
                  <Button variant="outline" size="icon">
                    <Key size={16} />
                  </Button>
                </div>
              </div>
              <Button className="w-full bg-slate-900">Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Empresas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Empresas Cadastradas</h3>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input className="pl-10" placeholder="Buscar empresa..." />
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus size={18} /> Nova Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddCompany}>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                      <DialogDescription>
                        Crie uma nova instância para um cliente. Ele terá seu próprio painel de agentes.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nome da Empresa</Label>
                        <Input id="companyName" name="companyName" placeholder="Ex: Atacadão S.A." required />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Cadastrar Empresa</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="space-y-3">
            {companies.map((company) => (
              <Card key={company.id} className="hover:border-blue-200 transition-colors border-none shadow-sm ring-1 ring-black/5">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{company.name}</h4>
                        <p className="text-xs text-gray-500">ID: #{company.id} | Criada em {company.created}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-400 uppercase">Agentes</p>
                        <p className="font-bold">{company.agents}</p>
                      </div>
                      <Badge variant={company.status === 'Ativa' ? 'default' : 'secondary'} className={company.status === 'Ativa' ? 'bg-green-500' : ''}>
                        {company.status}
                      </Badge>
                      <Button variant="outline" size="sm">Gerenciar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;