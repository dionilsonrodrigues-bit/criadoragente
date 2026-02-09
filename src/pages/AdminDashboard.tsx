import React from 'react';
import { Building2, Globe, Key, Activity, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Empresas', value: '124', icon: Building2, color: 'text-blue-600' },
    { label: 'Agentes Criados', value: '458', icon: Activity, color: 'text-green-600' },
    { label: 'Agentes Ativos', value: '98', icon: Globe, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className={`${stat.color} bg-gray-50 p-3 rounded-xl border`}>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações Globais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Webhook Base n8n</label>
                <Input defaultValue="https://n8n.atendipro.com.br/webhook" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Token de Integração</label>
                <div className="flex gap-2">
                  <Input type="password" value="sk_test_123456789" readOnly />
                  <Button variant="outline" size="icon">
                    <Key size={16} />
                  </Button>
                </div>
              </div>
              <Button className="w-full">Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Empresas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Empresas Cadastradas</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input className="pl-10" placeholder="Buscar empresa..." />
            </div>
          </div>
          
          {[1, 2, 3].map((i) => (
            <Card key={i} className="hover:border-blue-200 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                      C{i}
                    </div>
                    <div>
                      <h4 className="font-bold">Empresa Exemplo {i}</h4>
                      <p className="text-xs text-gray-500">ID: #00{i} | Criada em 12/05/2024</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-400">Agentes</p>
                      <p className="font-bold">4</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">Ativa</Badge>
                    <Button variant="outline" size="sm">Gerenciar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;