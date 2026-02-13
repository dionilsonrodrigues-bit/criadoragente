import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit2, 
  MoreVertical, 
  Package, 
  Image as ImageIcon,
  CheckCircle2,
  XCircle
} from 'lucide-react';
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
import { Switch } from "@/components/ui/switch";
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

const MENUS = [
  { id: 'groups', label: 'Grupos' },
  { id: 'mass_message', label: 'Disparo em massa' },
  { id: 'kanban', label: 'Kanban e funil' },
  { id: 'teams', label: 'Equipes' },
  { id: 'tasks', label: 'Tarefas' },
  { id: 'campaigns', label: 'Campanhas' },
  { id: 'chatbot', label: 'Chatbot' },
  { id: 'reports', label: 'Relatórios' },
  { id: 'api', label: 'API' },
  { id: 'chat', label: 'Chat' },
];

const CHANNELS = [
  { id: 'waba', label: 'WhatsApp Official (WABA)' },
  { id: 'baileys', label: 'WhatsApp Baileys (QRCode)' },
  { id: 'webjs', label: 'WhatsApp WebJs (QRCode)' },
  { id: 'meow', label: 'WhatsApp Meow (QRCode)' },
  { id: 'evolution2', label: 'WhatsApp Evolution 2 (QRCode)' },
  { id: 'zapi', label: 'Z-API (QRCode)' },
  { id: 'uazapi', label: 'Uazapi (QRCode)' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'hub_notificame', label: 'Hub Notificame' },
  { id: 'webchat', label: 'WebChat' },
  { id: 'webmail', label: 'WebMail' },
];

const Plans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [isTrial, setIsTrial] = useState(false);
  const [useAsaas, setUseAsaas] = useState(false);
  const [visibleMenus, setVisibleMenus] = useState<string[]>([]);
  const [allowedChannels, setAllowedChannels] = useState<string[]>([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error('Erro ao carregar planos');
    else setPlans(data || []);
    setIsLoading(false);
  };

  const resetForm = () => {
    setEditingPlan(null);
    setIsTrial(false);
    setUseAsaas(false);
    setVisibleMenus([]);
    setAllowedChannels([]);
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setIsTrial(plan.is_trial);
    setUseAsaas(plan.use_asaas);
    setVisibleMenus(plan.visible_menus || []);
    setAllowedChannels(plan.allowed_channels || []);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      user_limit: parseInt(formData.get('user_limit') as string),
      connection_limit: parseInt(formData.get('connection_limit') as string),
      identity: formData.get('identity') as string,
      is_trial: isTrial,
      trial_days: isTrial ? parseInt(formData.get('trial_days') as string) : null,
      use_asaas: useAsaas,
      asaas_token: useAsaas ? formData.get('asaas_token') as string : null,
      asaas_customer_id: useAsaas ? formData.get('asaas_customer_id') as string : null,
      visible_menus: visibleMenus,
      allowed_channels: allowedChannels,
      price: parseFloat(formData.get('price') as string),
      currency: formData.get('currency') as string,
      status: formData.get('status') as string,
      image_url: formData.get('image_url') as string,
    };

    try {
      if (editingPlan) {
        const { error } = await supabase.from('plans').update(payload).eq('id', editingPlan.id);
        if (error) throw error;
        toast.success('Plano atualizado!');
      } else {
        const { error } = await supabase.from('plans').insert([payload]);
        if (error) throw error;
        toast.success('Plano criado!');
      }
      setIsDialogOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este plano?')) return;
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else {
      toast.success('Plano removido');
      fetchPlans();
    }
  };

  const toggleMenu = (id: string) => {
    setVisibleMenus(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const toggleChannel = (id: string) => {
    setAllowedChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Planos</h1>
          <p className="text-gray-500">Configure as ofertas e limitações para as empresas.</p>
        </div>
        <Button className="gap-2" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus size={18} /> Novo Plano
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input 
          className="pl-10" 
          placeholder="Buscar planos..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full h-40 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : filteredPlans.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400">Nenhum plano cadastrado.</div>
        ) : filteredPlans.map(plan => (
          <Card key={plan.id} className="overflow-hidden border-none shadow-sm ring-1 ring-black/5 hover:ring-blue-200 transition-all">
            <div className="h-32 bg-slate-100 relative">
              {plan.image_url ? (
                <img src={plan.image_url} alt={plan.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Package size={48} />
                </div>
              )}
              <Badge className="absolute top-3 right-3" variant={plan.status === 'active' ? 'default' : 'secondary'}>
                {plan.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{plan.description}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(plan)}><Edit2 size={14} className="mr-2" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(plan.id)}><Trash2 size={14} className="mr-2" /> Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Valor</span>
                <span className="font-bold text-lg">{plan.currency} {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded">Usuários: <b>{plan.user_limit}</b></div>
                <div className="bg-slate-50 p-2 rounded">Conexões: <b>{plan.connection_limit}</b></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
              <DialogDescription>Configure os limites e recursos deste plano.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input name="name" defaultValue={editingPlan?.name} required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea name="description" defaultValue={editingPlan?.description} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Limite de Usuários</Label>
                    <Input name="user_limit" type="number" defaultValue={editingPlan?.user_limit ?? 1} />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite de Conexões</Label>
                    <Input name="connection_limit" type="number" defaultValue={editingPlan?.connection_limit ?? 1} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Identidade</Label>
                  <Input name="identity" placeholder="Ex: Premium" defaultValue={editingPlan?.identity} />
                </div>
                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <div className="flex gap-2">
                    <Input name="image_url" placeholder="https://..." defaultValue={editingPlan?.image_url} />
                    <Button type="button" variant="outline" size="icon"><ImageIcon size={16} /></Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex flex-col">
                      <span>Modo Trial</span>
                      <span className="text-[10px] text-gray-400 font-normal">Oferecer período de teste gratuito</span>
                    </Label>
                    <Switch checked={isTrial} onCheckedChange={setIsTrial} />
                  </div>
                  {isTrial && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs">Dias de Trial</Label>
                      <Input name="trial_days" type="number" defaultValue={editingPlan?.trial_days ?? 7} />
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex flex-col">
                      <span>Integração Asaas</span>
                      <span className="text-[10px] text-gray-400 font-normal">Habilitar cobrança via Asaas</span>
                    </Label>
                    <Switch checked={useAsaas} onCheckedChange={setUseAsaas} />
                  </div>
                  {useAsaas && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <Label className="text-xs">Token Asaas</Label>
                        <Input name="asaas_token" defaultValue={editingPlan?.asaas_token} />
                      </div>
                      <div>
                        <Label className="text-xs">CustomerID Asaas</Label>
                        <Input name="asaas_customer_id" defaultValue={editingPlan?.asaas_customer_id} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input name="price" type="number" step="0.01" defaultValue={editingPlan?.price ?? 0} />
                  </div>
                  <div className="space-y-2">
                    <Label>Moeda</Label>
                    <Select name="currency" defaultValue={editingPlan?.currency ?? 'BRL'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">BRL (R$)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingPlan?.status ?? 'active'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2 border-t mt-4 pt-4">
              <div className="space-y-3">
                <Label className="font-bold text-slate-800">Menus Visíveis</Label>
                <div className="grid grid-cols-2 gap-2">
                  {MENUS.map(menu => (
                    <div key={menu.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`menu-${menu.id}`} 
                        checked={visibleMenus.includes(menu.id)}
                        onCheckedChange={() => toggleMenu(menu.id)}
                      />
                      <label htmlFor={`menu-${menu.id}`} className="text-xs cursor-pointer">{menu.label}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-slate-800">Canais Permitidos</Label>
                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-2">
                  {CHANNELS.map(channel => (
                    <div key={channel.id} className="flex items-center space-x-2 p-1 hover:bg-slate-50 rounded">
                      <Checkbox 
                        id={`channel-${channel.id}`} 
                        checked={allowedChannels.includes(channel.id)}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      <label htmlFor={`channel-${channel.id}`} className="text-xs cursor-pointer">{channel.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Plano</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Plans;