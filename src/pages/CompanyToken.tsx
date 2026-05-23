import React, { useEffect, useState } from 'react';
import { Copy, Loader2, Save, KeyRound } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const CompanyToken = () => {
  const { profile } = useAuth();
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
      fetchToken();
    }
  }, [profile]);

  const fetchToken = async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('companies')
      .select('api_key')
      .eq('id', profile.company_id)
      .single();

    if (error) {
      toast.error('Erro ao carregar token');
    } else {
      setToken(data?.api_key || '');
      setSavedToken(data?.api_key || '');
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!profile?.company_id) {
      toast.error('Usuário sem empresa vinculada');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('companies')
      .update({ api_key: token })
      .eq('id', profile.company_id);

    if (error) {
      toast.error(`Erro ao salvar token: ${error.message}`);
    } else {
      setSavedToken(token);
      toast.success('Token salvo com sucesso!');
    }
    setIsSaving(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(savedToken || token);
    toast.success('Token copiado!');
  };

  if (!profile) {
    return <div className="rounded-lg border bg-white p-6 text-slate-500">Carregando perfil...</div>;
  }

  if (profile.role !== 'super_admin') {
    return (
      <div className="rounded-lg border bg-white p-6 text-slate-500">
        Este menu é destinado ao Super Admin.
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Token da Empresa</h1>
        <p className="text-gray-500">Cadastre e copie o token usado pela empresa selecionada.</p>

      </div>

      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <KeyRound size={18} className="text-blue-600" />
            Chave de Integração
          </CardTitle>
          <CardDescription>
            Salve aqui o token em texto para uso nas integrações da empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="h-24 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Cole ou digite o token aqui"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Salvar Token
                </Button>
                <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
                  <Copy size={16} />
                  Copiar Token
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyToken;
