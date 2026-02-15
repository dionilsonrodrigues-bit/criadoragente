import React, { useState, useEffect } from 'react';
import { Save, Loader2, Webhook, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    webhook_account_creation: '',
    webhook_client_admin: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('settings').select('*');
    
    if (error) {
      toast.error('Erro ao carregar configurações');
    } else if (data) {
      const settingsMap = data.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      setSettings(prev => ({ ...prev, ...settingsMap }));
    }
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updates = Object.entries(settings).map(([key, value]) => 
        supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) throw new Error('Falha ao salvar algumas configurações');

      toast.success('Configurações atualizadas com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-left">Configurações Gerais</h1>
        <p className="text-gray-500 mt-1 text-left">Gerencie os parâmetros globais da plataforma AtendiPRO.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="text-blue-600" size={20} />
              <CardTitle>Integrações e Webhooks</CardTitle>
            </div>
            <CardDescription>
              URLs de destino para eventos do sistema e integrações com o painel do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="webhook_account_creation" className="flex items-center gap-2">
                Webhook de Criação de Conta
                <LinkIcon size={14} className="text-slate-400" />
              </Label>
              <Input 
                id="webhook_account_creation"
                placeholder="https://n8n.seuservidor.com/webhook/..."
                value={settings.webhook_account_creation}
                onChange={(e) => setSettings({...settings, webhook_account_creation: e.target.value})}
              />
              <p className="text-[11px] text-slate-500 italic">Este webhook será disparado sempre que uma nova empresa for cadastrada no sistema.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_client_admin" className="flex items-center gap-2">
                Webhook Padrão (Dashboard do Cliente)
                <LinkIcon size={14} className="text-slate-400" />
              </Label>
              <Input 
                id="webhook_client_admin"
                placeholder="https://n8n.seuservidor.com/webhook/..."
                value={settings.webhook_client_admin}
                onChange={(e) => setSettings({...settings, webhook_client_admin: e.target.value})}
              />
              <p className="text-[11px] text-slate-500 italic">URL exibida no dashboard das empresas clientes para integrações personalizadas.</p>
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-800">
            <strong>Atenção:</strong> Alterar essas URLs pode afetar fluxos de automação externos (n8n, Make, etc) que dependem dessas configurações.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="gap-2 bg-slate-900 px-8">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;