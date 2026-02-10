import React, { useState, useEffect } from 'react';
import { Building2, Globe, Key, Activity, Search, Plus, Loader2, Fingerprint } from 'lucide-react';
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
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalAgents: 0,
    activeAgents: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select(`
        *,
        agents (id, status)
      `)
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error("Erro ao buscar empresas:", companiesError);
      toast.error('Erro ao carregar empresas');
    } else {
      setCompanies(companiesData || []);
      
      const totalAgents = companiesData?.reduce((acc, comp) => acc + (comp.agents?.length || 0), 0) || 0;
      const activeAgents = companiesData?.reduce((acc, comp) => 
        acc + (comp.agents?.filter((a: any) => a.status === 'active').length || 0), 0
      ) || 0;

      setStats({
        totalCompanies: companiesData?.length || 0,
        totalAgents,
        activeAgents
      });
    }
    
    setIsLoading(false);
  };

  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('companyName') as string;
    const atendi_id = formData.get('atendiId') as string;
    
    const { error } = await supabase
      .from('companies')
      .insert([{ name, atendi_id }]);

    if (error) {
      console.error("Erro detalhado ao cadastrar empresa:", error);
      toast.error(`Erro: ${error.message || 'Falha ao cadastrar'}`);
    } else {
      toast.success('Empresa cadastrada com sucesso!');
      setIsDialogOpen(false);
      fetchData();
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.atendi_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsConfig = [
    { label: 'Total Empresas', value: stats.totalCompanies.toString(), icon: Building2, color: 'text-blue-600' },
    { label: 'Agentes Criados', value: stats.totalAgents.toString(), icon: Activity, color: 'text-green-600' },
    { label: 'Agentes Ativos', value: stats.activeAgents.toString(), icon: Globe, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsConfig.map((stat) => (
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">Empresas Cadastradas</h3>
            <div className="flex gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  className="pl-10" 
                  placeholder="Buscar empresa ou ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                      <div className="space-y-2">
                        <Label htmlFor="atendiId">ID da Empresa no AtendiPRO</Label>
                        <Input id="atendiId" name="atendiId" placeholder="Ex: 12345" required />
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
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" />
              </div>
            ) : filteredCompanies.length === 0 ? (
              <p className="text-center py-10 text-gray-400 italic">Nenhuma empresa encontrada.</p>
            ) : filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:border-blue-200 transition-colors border-none shadow-sm ring-1 ring-black/5">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 uppercase">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800">{company.name}</h4>
                          <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-slate-50">
                            ID: {company.atendi_id || 'N/A'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          UUID: #{company.id.substring(0, 8)} | Criada em {new Date(company.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-400 uppercase">Agentes</p>
                        <p className="font-bold">{company.agents?.length || 0}</p>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        Ativa
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