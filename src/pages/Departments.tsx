import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, Building2, Fingerprint, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
      toast.error('Erro ao carregar departamentos');
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

      if (error) {
        console.error("Erro ao atualizar:", error);
        toast.error(`Erro ao atualizar: ${error.message}`);
      } else {
        toast.success('Departamento atualizado!');
        fetchDepartments();
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from('departments')
        .insert([payload]);

      if (error) {
        console.error("Erro ao criar:", error);
        toast.error(`Erro ao criar: ${error.message}`);
      } else {
        toast.success('Departamento criado com sucesso!');
        fetchDepartments();
        setIsDialogOpen(false);
      }
    }
    
    setEditingDept(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) toast.error('Erro ao remover departamento');
    else {
      toast.success('Departamento removido.');
      fetchDepartments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Departamentos</h1>
          <p className="text-gray-500">Defina os setores para transferência de chamados pela IA.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditingDept(null)}>
              <Plus size={18} />
              Novo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>{editingDept ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do setor. O ID AtendiPRO é necessário para a integração de transbordo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Setor</Label>
                    <Input id="name" name="name" defaultValue={editingDept?.name} placeholder="Ex: Comercial" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="atendiId">ID AtendiPRO</Label>
                    <Input id="atendiId" name="atendiId" defaultValue={editingDept?.atendi_id} placeholder="Ex: 12345" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição Interna</Label>
                  <Textarea id="description" name="description" defaultValue={editingDept?.description} placeholder="Para que serve este setor?" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Departamento</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Nome / ID</TableHead>
                  <TableHead className="font-bold">Descrição</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">Nenhum departamento cadastrado.</TableCell>
                  </TableRow>
                ) : departments.map((dept) => (
                  <TableRow key={dept.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Building2 size={16} className="text-slate-400" />
                          {dept.name}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 font-mono uppercase">
                          <Fingerprint size={10} />
                          ID: {dept.atendi_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">{dept.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1 font-normal text-xs">
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-500"
                        onClick={() => {
                          setEditingDept(dept);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(dept.id)}
                      >
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