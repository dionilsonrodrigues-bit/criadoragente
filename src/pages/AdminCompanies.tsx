import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, Loader2, Trash2, Edit2, MoreVertical, UserPlus, Phone, Save, Mail, Lock, AlertCircle, Calendar, CreditCard, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
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

const AdminCompanies = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [companiesRes, plansRes] = await Promise.all([
        supabase
          .from('companies')
          .select(`
            *, 
            plans(name),
            agents(id, status), 
            profiles:profiles!company_id(id, email, role)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('plans').select('id, name').eq('status', 'active')
      ]);

      if (companiesRes.error) {
        toast.error('Erro ao buscar empresas.');
      } else {
        setCompanies(companiesRes.data || []);
      }

      if (plansRes.data) setPlans(plansRes.data);
    } catch (err) {
      console.error("[Admin] Falha ao carregar dados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, '');
    let formatted = numbers;
    if (numbers.length > 2) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length > 7) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    setPhoneValue(formatted);
  };

  const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const companyData: any = {
      name: formData.get('companyName') as string,
      atendi_id: formData.get('atendiId') as string,
      phone: phoneValue,
      description: formData.get('description') as string,
      plan_id: formData.get('planId') as string || null,
      status: formData.get('status') as string,
      due_day: formData.get('dueDay') ? parseInt(formData.get('dueDay') as string) : null,
      recurrence: formData.get('recurrence') as string,
      logo_url: logoUrl,
    };

    try {
      if (editingCompany) {
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
        const { error } = await supabase.functions.invoke('create-company-user', {
          body: { 
            ...companyData, 
            email: formData.get('adminEmail') as string,
            password: formData.get('adminPassword') as string
          }
        });
        if (error) throw error;
        toast.success('Empresa e Usuário criados!');
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
    if (!confirm(`Tem certeza que deseja excluir a empresa "${name}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Empresa excluída com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(`Erro ao excluir: ${err.message}`);
    }
  };

  const openNewDialog = () => {
    setEditingCompany(null);
    setAdminUser(null);
    setPhoneValue('');
    setLogoUrl('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (company: any) => {
    setEditingCompany(company);
    const admin = company.profiles?.find((p: any) => p.role === 'company_admin');
    setAdminUser(admin || null);
    setPhoneValue(company.phone || '');
    setLogoUrl(company.logo_url || '');
    setIsDialogOpen(true);
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.atendi_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Empresas</h1>
          <p className="text-gray-500">Gerencie as instâncias e acessos das empresas clientes.</p>
        </div>
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
      
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-20 text-gray-400 italic border rounded-lg bg-slate-50 border-dashed">Nenhuma empresa encontrada.</div>
        ) : filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:border-blue-200 transition-colors border-none shadow-sm ring-1 ring-black/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 uppercase overflow-hidden border">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      company.name.charAt(0)
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800">{company.name}</h4>
                      <Badge variant="outline" className="text-[10px] bg-slate-50">ID: {company.atendi_id}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail size={12}/> 
                        {company.profiles?.find((p:any)=>p.role==='company_admin')?.email || (
                          <span className="text-red-400 flex items-center gap-1"><AlertCircle size={10}/> Gestor sem perfil</span>
                        )}
                      </span>
                      {company.phone && <span className="flex items-center gap-1"><Phone size={12}/> {company.phone}</span>}
                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <CreditCard size={12}/>
                        {company.plans?.name || 'Sem Plano'}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Calendar size={12}/>
                        Venc: Dia {company.due_day || '--'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Badge variant={company.status === 'active' ? 'default' : 'secondary'} className={company.status === 'active' ? 'bg-green-600' : ''}>
                     {company.status === 'active' ? 'Ativo' : 'Inativo'}
                   </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(company)}>
                        <Edit2 size={14} className="mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50" 
                        onClick={() => handleDeleteCompany(company.id, company.name)}
                      >
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveCompany}>
            <DialogHeader>
              <DialogTitle>{editingCompany ? 'Editar Empresa e Gestor' : 'Cadastrar Nova Empresa'}</DialogTitle>
              <DialogDescription>
                Configure os dados da instância e as informações de acesso do administrador.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <div className="w-24 h-24 bg-white rounded-lg border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-300" size={32} />
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <Label>URL da Logomarca (Quadrada)</Label>
                  <Input 
                    placeholder="https://exemplo.com/logo.png" 
                    value={logoUrl} 
                    onChange={(e) => setLogoUrl(e.target.value)} 
                    className="bg-white"
                  />
                  <p className="text-[10px] text-slate-500 italic">Recomendado: 512x512px. Cole o link da imagem hospedada.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input name="companyName" defaultValue={editingCompany?.name} placeholder="Ex: Acme Corp" required />
                </div>
                <div className="space-y-2">
                  <Label>ID AtendiPRO (Instância)</Label>
                  <Input name="atendiId" defaultValue={editingCompany?.atendi_id} placeholder="Ex: 550" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone de Contato</Label>
                  <Input value={phoneValue} onChange={handlePhoneChange} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Plano de Assinatura</Label>
                  <Select name="planId" defaultValue={editingCompany?.plan_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição / Notas Internas</Label>
                <Textarea name="description" defaultValue={editingCompany?.description} placeholder="Notas sobre a empresa..." rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingCompany?.status || 'active'}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dia de Vencimento</Label>
                  <Input name="dueDay" type="number" min="1" max="31" defaultValue={editingCompany?.due_day || 10} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Recorrência</Label>
                  <Select name="recurrence" defaultValue={editingCompany?.recurrence || 'monthly'}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative pt-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 font-bold">Dados de Acesso (Gestor)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail size={14}/> E-mail do Gestor</Label>
                  <Input name="adminEmail" type="email" defaultValue={adminUser?.email} placeholder="gestor@empresa.com" required />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Lock size={14}/> {editingCompany ? 'Nova Senha (Opcional)' : 'Senha de Acesso'}</Label>
                  <Input name="adminPassword" type="password" placeholder={editingCompany ? "Manter atual" : "••••••••"} required={!editingCompany} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
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

export default AdminCompanies;