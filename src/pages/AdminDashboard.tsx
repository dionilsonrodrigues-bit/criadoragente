import React, { useState, useEffect } from 'react';
import { Building2, Globe, Key, Activity, Search, Plus, Loader2, Trash2, Edit2, MoreVertical, UserPlus, Phone, Calendar, Save, X, Mail, Lock } from 'lucide-react';
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [createAdmin, setCreateAdmin] = useState(true);
  
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
    
    const [companiesRes, plansRes] = await Promise.all([
      supabase.from('companies').select('*, agents(id, status), profiles(id, email, role)').order('created_at', { ascending: false }),
      supabase.from('plans').select('id, name').eq('status', 'active')
    ]);

    if (companiesRes.error) {
      toast.error('Erro ao carregar empresas');
    } else {
      setCompanies(companiesRes.data || []);
      const totalAgents = companiesRes.data?.reduce((acc, comp) => acc + (comp.agents?.length || 0), 0) || 0;
      const activeAgents = companiesRes.data?.reduce((acc, comp) => 
        acc + (comp.agents?.filter((a: any) => a.status === 'active').length || 0), 0
      ) || 0;

      setStats({
        totalCompanies: companiesRes.data?.length || 0,
        totalAgents,
        activeAgents
      });
    }

    if (plansRes.data) {
      setPlans(plansRes.data);
    }
    
    setIsLoading(false);
  };

  const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const companyData: any = {
      name: formData.get('companyName') as string,
      atendi_id: formData.get('atendiId') as string,
      phone: formData.get('phone') as string,
      description: formData.get('description') as string,
      plan_id: formData.get('planId') as string || null,
      status: formData.get('status') as string,
      due_day: formData.get('dueDay') ? parseInt(formData.get('dueDay') as string) : null,
      recurrence: formData.get('recurrence') as string,
    };

    try {
      if (editingCompany) {
        // Atualização via Edge Function para permitir editar Auth User
        const { error } = await supabase.functions.invoke('update-company-full', {
          body: { 
            company_id: editingCompany.id,
            ...companyData,
            admin_email: formData.get('adminEmail') as string,
            admin_password: formData.get('adminPassword') as string || null
          }
        });

        if (error) throw error;
        toast.success('Empresa e Gestor atualizados!');
      } else {
        // Criação (Novo)
        const adminData = {
          email: formData.get('adminEmail') as string,
          password: formData.get('adminPassword') as string,
        };

        if (createAdmin) {
          const { error } = await supabase.functions.invoke('create-company-user', {
            body: { ...companyData, ...adminData }
          });
          if (error) throw error;
          toast.success('Empresa e Usuário criados!');
        } else {
          const { error } = await supabase.from('companies').insert([companyData]);
          if (error) throw error;
          toast.success('Empresa cadastrada!');
        }
      }
      
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(`Erro: ${err.message || 'Falha ao processar'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a empresa "${name}"? Esta ação não pode ser desfeita.`)) return;
    
    try {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
      toast.success('Empresa excluída com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error(`Erro ao excluir: ${err.message}`);
    }
  };

  const openNewDialog = () => {
    setEditingCompany(null);
    setAdminUser(null);
    setCreateAdmin(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (company: any) => {
    setEditingCompany(company);
    const admin = company.profiles?.find((p: any) => p.role === 'company_admin');
    setAdminUser(admin || null);
    setCreateAdmin(false);
    setIsDialogOpen(true);
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.atendi_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
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
                <div className={`${stat.color} bg-white p-3 rounded-xl border shadow-sm`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <Button className="w-full bg-slate-900">Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">Empresas Cadastradas</h3>
            <div className="flex gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  className="pl-10" 
                  placeholder="Buscar empresa..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="gap-2" onClick={openNewDialog}>
                <Plus size={18} /> Nova Empresa
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {isLoading ? (
              <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-10 text-gray-400 italic">Nenhuma empresa encontrada.</div>
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
                          <Badge variant="outline" className="text-[10px] bg-slate-50">ID: {company.atendi_id}</Badge>
                          {company.status === 'inactive' && (
                             <Badge variant="destructive" className="text-[10px]">Inativo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Mail size={12}/> {company.profiles?.find((p:any)=>p.role==='company_admin')?.email || 'Sem gestor'}</span>
                          <span className="text-slate-300">|</span>
                          <span>#{company.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-medium text-gray-400 uppercase">Agentes</p>
                        <p className="font-bold">{company.agents?.length || 0}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">Ações <MoreVertical size={14} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(company)}>
                            <Edit2 size={14} className="mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCompany(company.id, company.name)}>
                            <Trash2 size={14} className="mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveCompany}>
            <DialogHeader>
              <DialogTitle>{editingCompany ? 'Editar Empresa e Gestor' : 'Cadastrar Nova Empresa'}</DialogTitle>
              <DialogDescription>
                {editingCompany ? `Atualizando dados da empresa ${editingCompany.name}` : 'Crie uma instância e configure os dados contratuais.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
              {/* Dados Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input name="companyName" defaultValue={editingCompany?.name} placeholder="Ex: Acme Corp" required />
                </div>
                <div className="space-y-2">
                  <Label>ID AtendiPRO</Label>
                  <Input name="atendiId" defaultValue={editingCompany?.atendi_id} placeholder="Ex: 550" required />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input name="phone" defaultValue={editingCompany?.phone} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingCompany?.status || "active"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea name="description" defaultValue={editingCompany?.description} placeholder="Observações sobre a empresa..." rows={2} />
              </div>

              {/* Dados do Plano */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 font-bold">Plano e Pagamento</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select name="planId" defaultValue={editingCompany?.plan_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Recorrência</Label>
                  <Select name="recurrence" defaultValue={editingCompany?.recurrence || "monthly"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="bimestral">Bimestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dia de Vencimento</Label>
                  <Select name="dueDay" defaultValue={editingCompany?.due_day?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seção do Gestor (Sempre visível agora) */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 font-bold">Dados de Acesso (Gestor)</span>
                </div>
              </div>

              {!editingCompany && (
                <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg">
                  <Checkbox id="createAdmin" checked={createAdmin} onCheckedChange={(v) => setCreateAdmin(!!v)} />
                  <Label htmlFor="createAdmin" className="text-sm font-medium cursor-pointer">
                    Criar conta de usuário para o gestor da empresa
                  </Label>
                </div>
              )}

              {(createAdmin || editingCompany) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail size={14}/> E-mail do Gestor</Label>
                      <Input name="adminEmail" type="email" defaultValue={adminUser?.email} placeholder="gestor@empresa.com" required />
                      {editingCompany && <p className="text-[10px] text-amber-600 font-medium">Nota: Alterar o e-mail mudará o login do usuário.</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Lock size={14}/> {editingCompany ? 'Nova Senha (Opcional)' : 'Senha Temporária'}</Label>
                      <Input name="adminPassword" type="password" placeholder={editingCompany ? "Deixe em branco para manter" : "••••••••"} required={!editingCompany} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingCompany ? <Save size={18} /> : <UserPlus size={18} />)}
                {editingCompany ? 'Salvar Alterações' : 'Cadastrar Empresa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;