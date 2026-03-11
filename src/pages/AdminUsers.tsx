import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Shield, User, Loader2, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [usersRes, companiesRes] = await Promise.all([
      supabase.from('profiles').select('*, companies(name)').order('first_name'),
      supabase.from('companies').select('id, name').order('name')
    ]);

    setUsers(usersRes.data || []);
    setCompanies(companiesRes.data || []);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const first_name = formData.get('first_name') as string;
    const role = formData.get('role') as string;
    const company_id = formData.get('company_id') as string;

    if (editingUser) {
      // Atualizar perfil existente
      const { error } = await supabase
        .from('profiles')
        .update({ 
          first_name, 
          role, 
          company_id: company_id === 'null' ? null : company_id 
        })
        .eq('id', editingUser.id);

      if (error) toast.error(error.message);
      else {
        toast.success('Usuário atualizado!');
        fetchData();
        setIsDialogOpen(false);
      }
    } else {
      // Criar novo via Edge Function
      try {
        const { data, error } = await supabase.functions.invoke('manage-users', {
          body: { 
            email, 
            password, 
            role, 
            company_id: company_id === 'null' ? null : company_id,
            first_name
          }
        });

        if (error) throw error;
        toast.success('Usuário criado com sucesso!');
        fetchData();
        setIsDialogOpen(false);
      } catch (err: any) {
        toast.error(`Erro: ${err.message}`);
      }
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-gray-500">Controle quem acessa o sistema e suas permissões.</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingUser(null); setIsDialogOpen(true); }}>
          <Plus size={18} /> Novo Usuário
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Usuário</TableHead>
                  <TableHead className="font-bold">Empresa</TableHead>
                  <TableHead className="font-bold">Nível</TableHead>
                  <TableHead className="text-right font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{u.first_name || 'Sem nome'}</span>
                          <span className="text-xs text-gray-400">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Building size={14} className="text-slate-400" />
                        {u.companies?.name || <span className="text-gray-300 italic text-xs">Acesso Global</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        u.role === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role === 'super_admin' ? 'Super Admin' : 'Admin Empresa'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setIsDialogOpen(true); }}>
                        <Edit2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Atualize os dados e acessos.' : 'Crie uma nova conta de acesso.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome</Label>
                  <Input id="first_name" name="first_name" defaultValue={editingUser?.first_name} placeholder="João" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingUser?.email} disabled={!!editingUser} placeholder="joao@email.com" required />
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha Inicial</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" required />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Acesso</Label>
                  <Select name="role" defaultValue={editingUser?.role || 'company_admin'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company_admin">Admin de Empresa</SelectItem>
                      <SelectItem value="super_admin">Super Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vincular Empresa</Label>
                  <Select name="company_id" defaultValue={editingUser?.company_id || 'null'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Nenhuma (Acesso Global)</SelectItem>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving && <Loader2 className="animate-spin mr-2" size={16} />}
                {editingUser ? 'Salvar Alterações' : 'Criar Conta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;