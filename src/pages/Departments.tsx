import React, { useState } from 'react';
import { Plus, Users, Edit2, Trash2, Building2 } from 'lucide-react';
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

const initialDepts = [
  { id: 1, name: 'Vendas', description: 'Equipe responsável por fechamentos e orçamentos', staff: 4 },
  { id: 2, name: 'Suporte Técnico', description: 'Atendimento N1 e dúvidas de uso', staff: 6 },
  { id: 3, name: 'Financeiro', description: 'Boletos, notas e cobrança', staff: 2 },
];

const Departments = () => {
  const [departments, setDepartments] = useState(initialDepts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (editingDept) {
      setDepartments(prev => prev.map(d => d.id === editingDept.id ? { ...d, name, description } : d));
      toast.success('Departamento atualizado!');
    } else {
      const newDept = {
        id: Date.now(),
        name,
        description,
        staff: 0
      };
      setDepartments(prev => [...prev, newDept]);
      toast.success('Departamento criado com sucesso!');
    }
    
    setIsDialogOpen(false);
    setEditingDept(null);
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
                  Preencha os dados do setor. A IA usará esses nomes para informar ao cliente sobre o transbordo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Setor</Label>
                  <Input id="name" name="name" defaultValue={editingDept?.name} placeholder="Ex: Comercial, Financeiro..." required />
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
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Nome</TableHead>
                <TableHead className="font-bold">Descrição</TableHead>
                <TableHead className="font-bold">Staff</TableHead>
                <TableHead className="text-right font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-blue-600">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      {dept.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 max-w-xs truncate">{dept.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <Users size={12} />
                      {dept.staff} pessoas
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
                      onClick={() => {
                        setDepartments(prev => prev.filter(d => d.id !== dept.id));
                        toast.error('Departamento removido.');
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Departments;