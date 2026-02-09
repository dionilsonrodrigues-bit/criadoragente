import React from 'react';
import { Plus, Users, Edit2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Departments = () => {
  const depts = [
    { id: 1, name: 'Vendas', description: 'Equipe responsável por fechamentos e orçamentos', staff: 4 },
    { id: 2, name: 'Suporte Técnico', description: 'Atendimento N1 e dúvidas de uso', staff: 6 },
    { id: 3, name: 'Financeiro', description: 'Boletos, notas e cobrança', staff: 2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Departamentos</h1>
          <p className="text-gray-500">Gerencie os setores para onde sua IA pode transferir atendimentos.</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          Novo Departamento
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[150px]">Colaboradores</TableHead>
                <TableHead className="text-right w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depts.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-semibold text-blue-600">{dept.name}</TableCell>
                  <TableCell className="text-gray-600">{dept.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      {dept.staff} vinculados
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
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