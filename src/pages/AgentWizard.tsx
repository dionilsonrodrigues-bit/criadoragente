import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Info,
  MessageSquare,
  Settings2,
  BrainCircuit,
  ShieldAlert,
  Target,
  Loader2,
  Edit3,
  List
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateFinalPrompt, AgentData } from '@/lib/prompt-engine';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const steps = [
  { id: 1, title: 'Identificação', icon: Info },
  { id: 2, title: 'Objetivo', icon: Target },
  { id: 3, title: 'Personalidade', icon: MessageSquare },
  { id: 4, title: 'Cérebro (Base)', icon: BrainCircuit },
  { id: 5, title: 'Conhecimento', icon: Settings2 },
  { id: 6, title: 'Regras Operacionais', icon: ShieldAlert },
  { id: 7, title: 'Revisão', icon: Check },
];

const DEFAULT_BRAIN_TEMPLATE = `# DIRETRIZES DE COMPORTAMENTO
- Seja sempre cordial, empático e profissional.
- Responda de forma objetiva, evitando textos excessivamente longos.
- Se não souber uma resposta, nunca invente.

# ESTRATÉGIA DE ATENDIMENTO
1. Saudação: Inicie sempre com uma recepção calorosa.
2. Escuta Ativa: Demonstre que entendeu o problema.
3. Resolução: Forneça a informação baseada no contexto.
4. Fechamento: Pergunte se há algo mais em que possa ajudar.`;

const DEFAULT_TRANSFER_TEMPLATE = `- Quando o cliente solicitar falar com um atendente humano.
- Quando o assunto envolver negociações financeiras complexas.`;

const AgentWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);

  const [isCustomObjective, setIsCustomObjective] = useState(false);
  
  const [formData, setFormData] = useState<AgentData>({
    name: '',
    objective: '',
    type: '',
    tone: 'amigável',
    responseSize: 'médias',
    allowEmoji: true,
    basePrompt: DEFAULT_BRAIN_TEMPLATE,
    businessContext: '',
    transferRule: DEFAULT_TRANSFER_TEMPLATE,
    transferDept: '',
  });

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await fetchDepartments();
      if (id) {
        await fetchAgentData();
      }
      setIsLoading(false);
    };
    initData();
  }, [id, profile]);

  const fetchDepartments = async () => {
    const query = supabase.from('departments').select('id, name');
    if (profile?.company_id) {
      query.eq('company_id', profile.company_id);
    }
    const { data } = await query;
    setDepartments(data || []);
  };

  const fetchAgentData = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Erro ao carregar dados do agente');
      navigate('/agents');
    } else {
      setFormData({
        name: data.name,
        objective: data.objective || '',
        type: data.type || '',
        tone: data.tone || 'amigável',
        responseSize: data.response_size || 'médias',
        allowEmoji: data.allow_emoji ?? true,
        basePrompt: data.base_prompt || DEFAULT_BRAIN_TEMPLATE,
        businessContext: data.business_context || '',
        transferRule: data.transfer_rule || DEFAULT_TRANSFER_TEMPLATE,
        transferDept: data.transfer_dept_id || '',
      });
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSave = async () => {
    setIsLoading(true);
    
    if (!formData.name) {
      toast.error('O nome do agente é obrigatório');
      setCurrentStep(1);
      setIsLoading(false);
      return;
    }

    const payload: any = {
      name: formData.name,
      objective: formData.objective,
      type: formData.type,
      tone: formData.tone,
      response_size: formData.responseSize,
      allow_emoji: formData.allowEmoji,
      base_prompt: formData.basePrompt,
      business_context: formData.businessContext,
      transfer_rule: formData.transferRule,
      transfer_dept_id: formData.transferDept || null,
      updated_at: new Date().toISOString()
    };

    // Vincular à empresa do usuário logado
    if (profile?.company_id) {
      payload.company_id = profile.company_id;
    }

    let error;
    if (id) {
      const { error: updateError } = await supabase
        .from('agents')
        .update(payload)
        .eq('id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('agents')
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      toast.error(`Erro ao salvar agente: ${error.message}`);
    } else {
      toast.success(id ? 'Agente atualizado!' : 'Agente criado!');
      navigate('/agents');
    }
    setIsLoading(false);
  };

  const finalPrompt = generateFinalPrompt(formData);

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Agente</Label>
              <Input 
                id="name" 
                placeholder="Ex: Agente de Suporte Premium" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <p className="text-xs text-gray-500">Dê um nome interno para identificar seu agente.</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Objetivo Principal</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] h-6 px-2 gap-1"
                    onClick={() => {
                      setIsCustomObjective(!isCustomObjective);
                      if (!isCustomObjective) setFormData({...formData, objective: ''});
                    }}
                  >
                    {isCustomObjective ? <List size={12} /> : <Edit3 size={12} />}
                    {isCustomObjective ? 'Ver Lista' : 'Personalizar'}
                  </Button>
                </div>
                {isCustomObjective ? (
                  <Input 
                    placeholder="Digite o objective personalizado..."
                    value={formData.objective}
                    onChange={(e) => setFormData({...formData, objective: e.target.value})}
                  />
                ) : (
                  <Select value={formData.objective} onValueChange={(v) => setFormData({...formData, objective: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o que o agente deve fazer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vender">Vender produtos/serviços</SelectItem>
                      <SelectItem value="qualificar">Qualificar Leads</SelectItem>
                      <SelectItem value="suporte">Responder dúvidas (Suporte)</SelectItem>
                      <SelectItem value="triagem">Direcionar atendimento</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tom de Voz</Label>
                <Select value={formData.tone} onValueChange={(v) => setFormData({...formData, tone: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional">Profissional e formal</SelectItem>
                    <SelectItem value="amigável">Amigável e acolhedor</SelectItem>
                    <SelectItem value="direto">Direto e objetivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tamanho das Respostas</Label>
                <Select value={formData.responseSize} onValueChange={(v) => setFormData({...formData, responseSize: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="curtas">Curtas e rápidas</SelectItem>
                    <SelectItem value="médias">Tamanho médio</SelectItem>
                    <SelectItem value="explicativas">Detalhadas e explicativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <Label>Como esse agente deve agir? (Cérebro)</Label>
            <Textarea 
              className="min-h-[250px] font-mono text-sm leading-relaxed"
              value={formData.basePrompt}
              onChange={(e) => setFormData({...formData, basePrompt: e.target.value})}
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <Label>Conhecimento do Negócio</Label>
            <Textarea 
              placeholder="Cole aqui informações sobre sua empresa..." 
              className="min-h-[200px]"
              value={formData.businessContext}
              onChange={(e) => setFormData({...formData, businessContext: e.target.value})}
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
              <Label>Quando transferir para um humano?</Label>
              <Textarea 
                className="min-h-[150px] font-mono text-sm leading-relaxed"
                value={formData.transferRule}
                onChange={(e) => setFormData({...formData, transferRule: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Setor de Destino</Label>
              <Select value={formData.transferDept} onValueChange={(v) => setFormData({...formData, transferDept: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-y-auto max-h-60 leading-relaxed">
              <pre className="whitespace-pre-wrap">{finalPrompt}</pre>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="relative flex justify-between">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10" />
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => step.id < currentStep && setCurrentStep(step.id)}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
              currentStep === step.id ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110" : 
              currentStep > step.id ? "bg-green-500 border-green-500 text-white" : 
              "bg-white border-gray-300 text-gray-400"
            )}>
              {currentStep > step.id ? <Check size={20} /> : <step.icon size={20} />}
            </div>
          </div>
        ))}
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardContent className="pt-8 px-10">
          <div className="min-h-[420px]">
            <h3 className="text-2xl font-black text-slate-800 mb-8">{steps[currentStep - 1].title}</h3>
            {renderStepContent()}
          </div>

          <div className="flex justify-between items-center mt-12 py-6 border-t border-slate-100">
            <Button variant="ghost" onClick={prevStep} disabled={currentStep === 1 || isLoading}>
              <ChevronLeft size={18} className="mr-2" /> Voltar
            </Button>

            {currentStep === steps.length ? (
              <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 px-8">
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="mr-2" />}
                Salvar Agente
              </Button>
            ) : (
              <Button onClick={nextStep} className="bg-slate-900 px-8">
                Continuar <ChevronRight size={18} className="ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentWizard;