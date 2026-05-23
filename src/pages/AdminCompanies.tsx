import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, KeyRound } from 'lucide-react';

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
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const AdminCompanies = () => {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [tokenValue, setTokenValue] = useState('');
  const [integrationUrl, setIntegrationUrl] = useState('');

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchCompanies();
    }
  }, [profile]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Erro ao buscar empresas");
    } else {
      setCompanies(data || []);
    }
    setIsLoading(false);
  };

  const openCreateDialog = () => {
    setEditingCompany(null);
    setTokenValue('');
    setIntegrationUrl('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (company: any) => {
    setEditingCompany(company);
    setTokenValue(company.api_key || '');
    setIntegrationUrl(company.integration_url || '');
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const atendi_id = formData.get('atendiId') as string;
    const description = formData.get('description') as string;

    const payload = {
      name,
      atendi_id,
      description,
      status: 'active',
      api_key: tokenValue.trim() || null,
      integration_url: integrationUrl.trim() || null,
    };

    if (editingCompany) {
      const { error } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', editingCompany.id);

      if (error) toast.error(`Erro: ${error.message}`);
      else {
        toast.success('Empresa atualizada!');
        fetchCompanies();
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from('companies')
        .insert([payload]);

      if (error) toast.error(`Erro: ${error.message}`);
      else {
        toast.success('Empresa cadastrada!');
        fetchCompanies();
        setIsDialogOpen(false);
      }
    }
  };

  const handleDeleteToken = async () => {
    if (!editingCompany) return;

    const { error } = await supabase
      .from('companies')
      .update({ api_key: null })
      .eq('id', editingCompany.id);

    if (error) {
      toast.error(`Erro ao remover token: ${error.message}`);
      return;
    }

    setTokenValue('');
    setEditingCompany((current: any) => current ? { ...current, api_key: null } : current);
    setCompanies((current) =>
      current.map((company) =>
        company.id === editingCompany.id ? { ...company, api_key: null } : company
      )
    );
    toast.success('Token removido com sucesso!');
  };

  const handleDeleteIntegrationUrl = async () => {
    if (!editingCompany) return;

    const { error } = await supabase
      .from('companies')
      .update({ integration_url: null })
      .eq('id', editingCompany.id);

    if (error) {
      toast.error(`Erro ao remover URL de integração: ${error.message}`);
      return;
    }

    setIntegrationUrl('');
    setEditingCompany((current: any) => current ? { ...current, integration_url: null } : current);
    setCompanies((current) =>
      current.map((company) =>
        company.id === editingCompany.id ? { ...company, integration_url: null } : company
      )
    );
    toast.success('URL de integração removida com sucesso!');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta empresa? Todos os agentes vinculados serão perdidos.')) return;
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) toast.error('Erro ao remover');
    else {
      toast.success('Empresa removida.');
      fetchCompanies();
    }
  };

  if (!profile) {
    return (
      <div className="rounded-lg border bg-white p-6 text-slate-500">
        Carregando perfil do usuário...
      </div>
    );
  }

  if (profile.role !== 'super_admin') {
    return (
      <div className="rounded-lg border bg-white p-6 text-slate-500">
        Acesso restrito ao Super Admin.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Empresas</h1>
          <p className="text-gray-500">Adicione, gerencie e mantenha o token das empresas.</p>
        </div>
        
        <Button className="gap-2" onClick={openCreateDialog}>
          <Plus size={18} /> Nova Empresa
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : companies.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Nenhuma empresa cadastrada.</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Empresa / ID Externo</TableHead>
                  <TableHead className="font-bold">Descrição</TableHead>
                  <TableHead className="font-bold">Token</TableHead>
                  <TableHead className="font-bold">URL Integração</TableHead>
                  <TableHead className="text-right font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{company.name}</span>
                        <span className="text-xs text-gray-400">ID: {company.atendi_id || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-gray-600">
                      {company.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <KeyRound size={14} className="text-slate-400" />
                        {company.api_key ? 'Token cadastrado' : <span className="text-gray-300 italic text-xs">Sem token</span>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-gray-600">
                      {company.integration_url || <span className="text-gray-300 italic text-xs">Sem URL</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(company)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(company.id)}>
                        <Trash2 size={14} />
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
              <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</DialogTitle>
              <DialogDescription>Insira as informações básicas da empresa cliente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input id="name" name="name" defaultValue={editingCompany?.name} placeholder="Ex: Atacadão S.A." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="atendiId">ID Externo (Atendi)</Label>
                <Input id="atendiId" name="atendiId" defaultValue={editingCompany?.atendi_id} placeholder="Ex: 123456" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" defaultValue={editingCompany?.description} placeholder="Breve resumo sobre a empresa..." />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <KeyRound size={16} className="text-slate-400" />
                    Token da Empresa
                  </Label>
                  {editingCompany?.api_key && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={handleDeleteToken}
                    >
                      Apagar token
                    </Button>
                  )}
                </div>
                <Input
                  id="apiKey"
                  name="apiKey"
                  value={tokenValue}
                  onChange={(e) => setTokenValue(e.target.value)}
                  placeholder="Insira o token da empresa"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400">
                  Você pode adicionar, alterar ou remover o token desta empresa aqui mesmo.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="integrationUrl">URL de Integração</Label>
                  {editingCompany?.integration_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={handleDeleteIntegrationUrl}
                    >
                      Apagar URL
                    </Button>
                  )}
                </div>
                <Input
                  id="integrationUrl"
                  name="integrationUrl"
                  value={integrationUrl}
                  onChange={(e) => setIntegrationUrl(e.target.value)}
                  placeholder="https://sua-api.com/webhook"
                />
                <p className="text-xs text-gray-400">
                  Use este campo para salvar o endereço da integração da empresa.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Salvar Empresa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompanies;