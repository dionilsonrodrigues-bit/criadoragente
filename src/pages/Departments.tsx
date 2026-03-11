import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, Loader2 } from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const Departments = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Erro ao buscar departamentos");
    } else {
      setDepartments(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const atendiId = formData.get('atendiId') as string;
    const description = formData.get('description') as string;

    const payload: any = {
      name,
      atendi_id: atendiId,
      description
    };

    if (editingDept) {
      const { error } = await supabase
        .from('departments')
        .update(payload)
        .eq('id', editingDept.id);

      if (error) toast.error(`Erro: ${error.message}`);
      else {
        toast.success('Departamento atualizado!');
        fetchDepartments();
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from('departments')
        .insert([payload]);

      if (error) toast.error(`Erro: ${error.message}`);
      else {
        toast.success('Departamento criado!');
        fetchDepartments();
        setIsDialogOpen(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir?')) return;
    
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) toast.error('Erro ao remover');
    else {
      toast.success('Removido com sucesso.');
      fetchDepartments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Departamentos</h1>
          <p className="text-gray-500">Setores para transferência de chamados.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditingDept(null)}>
              <Plus size={18} /> Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>{editingDept ? 'Editar' : 'Novo'}</DialogTitle>
                <DialogDescription>Preencha os dados do setor.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" defaultValue={editingDept?.name} placeholder="Ex: Vendas" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="atendiId">ID Externo</Label>
                  <Input id="atendiId" name="atendiId" defaultValue={editingDept?.atendi_id} placeholder="ID do sistema de atendimento" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" defaultValue={editingDept?.description} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Nome / ID</TableHead>
                  <TableHead className="text-right font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-slate-400" />
                        {dept.name} <span className="text-xs text-gray-400 font-normal">({dept.atendi_id})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingDept(dept); setIsDialogOpen(true); }}>
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete(dept.id)}>
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
    </div>
  );
};

export default Departments;