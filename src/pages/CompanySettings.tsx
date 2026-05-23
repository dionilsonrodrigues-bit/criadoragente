import React, { useState, useEffect } from 'react';
import { Key, Save, Loader2, Copy, Check, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const CompanySettings = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isSuperAdmin = profile?.role === 'super_admin';

  useEffect(() => {
    if (profile) {
      initSettings();
    }
  }, [profile]);

  const initSettings = async () => {
    setIsLoading(true);
    try {
      if (isSuperAdmin) {
        // Super Admin pode listar todas as empresas para gerenciar seus tokens
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, api_key')
          .order('name');

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);

        if (companiesData && companiesData.length > 0) {
          // Seleciona a primeira empresa por padrão ou a do perfil se houver
          const defaultCompany = companiesData.find(c => c.id === profile.company_id) || companiesData[0];
          setSelectedCompanyId(defaultCompany.id);
          setApiKey(defaultCompany.api_key || '');
        }
      } else if (profile.company_id) {
        // Admin de empresa comum busca apenas a sua própria empresa
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('name, api_key')
          .eq('id', profile.company_id)
          .maybeSingle();

        if (companyError) throw companyError;
        if (companyData) {
          setApiKey(companyData.api_key || '');
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualiza o input de API Key quando o Super Admin troca de empresa selecionada
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const comp = companies.find(c => c.id === companyId);
    setApiKey(comp?.api_key || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const targetCompanyId = isSuperAdmin ? selectedCompanyId : profile?.company_id;

    if (!targetCompanyId) {
      toast.error('Nenhuma empresa selecionada ou vinculada.');
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({ api_key: apiKey })
        .eq('id', targetCompanyId);

      if (error) throw error;

      toast.success('Token de integração salvo com sucesso!');
      
      // Se for super admin, atualiza a lista local de empresas para manter o estado sincronizado
      if (isSuperAdmin) {
        setCompanies(prev => prev.map(c => c.id === targetCompanyId ? { ...c, api_key: apiKey } : c));
      }
    } catch (error: any) {
      console.error('Erro ao salvar token:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('Token copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Token de Integração</h1>
        <p className="text-gray-500 mt-1">Cadastre e gerencie a chave de texto/token da sua empresa para integrações externas.</p>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Key className="text-blue-600" size={20} />
            Configuração de Token
          </CardTitle>
          <CardDescription>
            Este token pode ser utilizado para autenticar requisições de APIs externas ou conectar com outros sistemas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {isSuperAdmin && companies.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="company-select" className="flex items-center gap-1.5">
                    <Building size={16} className="text-slate-400" />
                    Selecionar Empresa (Visão Super Admin)
                  </Label>
                  <Select value={selectedCompanyId || ''} onValueChange={handleCompanyChange}>
                    <SelectTrigger id="company-select">
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="api_key">Token / Chave de Integração</Label>
                <div className="flex gap-2">
                  <Input
                    id="api_key"
                    type="text"
                    placeholder="Insira o token ou chave de texto aqui..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                  {apiKey && (
                    <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                      {copied ? <Check className="text-green-600" size={16} /> : <Copy size={16} />}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Insira qualquer chave de texto, token de API ou credencial necessária para a integração da sua empresa.
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Salvar Token
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySettings;
