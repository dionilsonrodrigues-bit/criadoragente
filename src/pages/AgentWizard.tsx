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
  Copy,
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateFinalPrompt, AgentData } from '@/lib/prompt-engine';
import { supabase } from "@/integrations/supabase/client";

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
- Responda de forma objetiva, evitando textos excessivamente longos a menos que solicitado.
- Se não souber uma resposta, nunca invente. Informe que irá consultar o setor responsável.

# ESTRATÉGIA DE ATENDIMENTO
1. Saudação: Inicie sempre com uma recepção calorosa e mencione seu nome.
2. Escuta Ativa: Demonstre que entendeu o problema ou dúvida do cliente.
3. Resolução: Forneça a informação baseada estritamente no seu "Conhecimento do Negócio".
4. Fechamento: Pergunte se há algo mais em que possa ajudar antes de encerrar.

# RESTRIÇÕES E SEGURANÇA
- Nunca mencione nomes de empresas concorrentes.
- Nunca forneça opiniões pessoais sobre política, religião ou temas sensíveis.
- Não prometa descontos ou prazos que não estejam validados no seu contexto.`;

const DEFAULT_TRANSFER_TEMPLATE = `- Quando o cliente solicitar expressamente falar com um atendente humano.
- Quando o cliente demonstrar irritação, impaciência ou usar linguagem inadequada.
- Quando o cliente tiver uma dúvida técnica complexa que não consta no seu conhecimento.
- Quando o assunto envolver negociações financeiras, cancelamentos ou reclamações críticas.`;

const AgentWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // States para controlar inputs personalizados
  const [isCustomObjective, setIsCustomObjective] = useState(false);
  const [isCustomType, setIsCustomType] = useState(false);
  const [isCustomTone, setIsCustomTone] = useState(false);
  
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
      await fetchInitialCompany();
      if (id) {
        await fetchAgentData();
      }
      setIsLoading(false);
    };
    initData();
  }, [id]);

  const fetchInitialCompany = async () => {
    const { data } = await supabase.from('companies').select('id').limit(1).single();
    if (data) {
      setCompanyId(data.id);
    }
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('id, name');
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
      navigate('/');
    } else {
      setFormData({
        name: data.name,
        objective: data.objective || '',
        type: data.type || '',
        tone: data.tone || 'amigável',
        responseSize: data.response_size || 'médias',
        allowEmoji: data.allow_emoji ?? true,
        basePrompt: data.base_prompt || DEFAULT_BRAIN_TEMPLATE,
        business_context: data.business_context || '',
        transfer_rule: data.transfer_rule || DEFAULT_TRANSFER_TEMPLATE,
        transfer_dept_id: data.transfer_dept_id || '',
      } as any);

      // Checar se os valores são personalizados (não estão na lista padrão)
      const defaultObjectives = ['vender', 'qualificar', 'suporte', 'triagem'];
      const defaultTypes = ['sdr', 'suporte', 'recepcionista', 'pos-venda'];
      const defaultTones = ['profissional', 'amigável', 'direto', 'persuasivo'];

      if (data.objective && !defaultObjectives.includes(data.objective)) setIsCustomObjective(true);
      if (data.type && !defaultTypes.includes(data.type)) setIsCustomType(true);
      if (data.tone && !defaultTones.includes(data.tone)) setIsCustomTone(true);
      
      if (data.company_id) setCompanyId(data.company_id);
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

    const payload = {
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
      company_id: companyId,
      updated_at: new Date().toISOString()
    };

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
      console.error("Erro ao salvar:", error);
      toast.error(`Erro ao salvar agente: ${error.message}`);
    } else {
      toast.success(id ? 'Agente atualizado!' : 'Agente criado!');
      navigate('/');
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
                    placeholder="Digite o objetivo personalizado..."
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
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Tipo de Agente</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] h-6 px-2 gap-1"
                    onClick={() => {
                      setIsCustomType(!isCustomType);
                      if (!isCustomType) setFormData({...formData, type: ''});
                    }}
                  >
                    {isCustomType ? <List size={12} /> : <Edit3 size={12} />}
                    {isCustomType ? 'Ver Lista' : 'Personalizar'}
                  </Button>
                </div>
                {isCustomType ? (
                  <Input 
                    placeholder="Digite o cargo personalizado..."
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  />
                ) : (
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo do agente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sdr">SDR / Pré-vendas</SelectItem>
                      <SelectItem value="suporte">Analista de Suporte</SelectItem>
                      <SelectItem value="recepcionista">Recepcionista Virtual</SelectItem>
                      <SelectItem value="pos-venda">Pós-venda</SelectItem>
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
                <div className="flex justify-between items-center">
                  <Label>Tom de Voz</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] h-6 px-2 gap-1"
                    onClick={() => {
                      setIsCustomTone(!isCustomTone);
                      if (!isCustomTone) setFormData({...formData, tone: 'amigável'});
                    }}
                  >
                    {isCustomTone ? <List size={12} /> : <Edit3 size={12} />}
                    {isCustomTone ? 'Ver Lista' : 'Personalizar'}
                  </Button>
                </div>
                {isCustomTone ? (
                  <Input 
                    placeholder="Digite o tom personalizado..."
                    value={formData.tone}
                    onChange={(e) => setFormData({...formData, tone: e.target.value})}
                  />
                ) : (
                  <Select value={formData.tone} onValueChange={(v) => setFormData({...formData, tone: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profissional">Profissional e formal</SelectItem>
                      <SelectItem value="amigável">Amigável e acolhedor</SelectItem>
                      <SelectItem value="direto">Direto e objetivo</SelectItem>
                      <SelectItem value="persuasivo">Persuasivo e focado em vendas</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-0.5">
                <Label className="text-base">Permitir Emojis</Label>
                <p className="text-sm text-gray-500 italic">O agente usará ícones para tornar a conversa mais leve.</p>
              </div>
              <Switch 
                checked={formData.allowEmoji} 
                onCheckedChange={(v) => setFormData({...formData, allowEmoji: v})} 
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <Label>Como esse agente deve agir? (Cérebro)</Label>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-7"
                onClick={() => setFormData({...formData, basePrompt: DEFAULT_BRAIN_TEMPLATE})}
              >
                Resetar para Modelo
              </Button>
            </div>
            <Textarea 
              placeholder="Descreva as regras comportamentais, prioridades e a estratégia de conversa..." 
              className="min-h-[250px] font-mono text-sm leading-relaxed"
              value={formData.basePrompt}
              onChange={(e) => setFormData({...formData, basePrompt: e.target.value})}
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <Label>Conhecimento do Negócio (FAQ, Produtos, Preços)</Label>
            <Textarea 
              placeholder="Cole aqui informações sobre sua empresa, detalhes de produtos, políticas e perguntas frequentes..." 
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
              <div className="flex justify-between items-center">
                <Label>Quando transferir para um humano?</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-7"
                  onClick={() => setFormData({...formData, transferRule: DEFAULT_TRANSFER_TEMPLATE})}
                >
                  Resetar para Modelo
                </Button>
              </div>
              <Textarea 
                placeholder="Ex: Quando o cliente pedir falar com atendente ou estiver irritado..." 
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
                  {departments.length === 0 && <SelectItem value="none" disabled>Nenhum setor cadastrado</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="bg-white p-3 border rounded">
                <span className="text-gray-500 block text-xs uppercase font-bold">Nome do Agente</span>
                <span className="font-semibold">{formData.name || 'Não definido'}</span>
              </div>
              <div className="bg-white p-3 border rounded">
                <span className="text-gray-500 block text-xs uppercase font-bold">Objetivo</span>
                <span className="font-semibold capitalize">{formData.objective || 'Não definido'}</span>
              </div>
            </div>
            
            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <Label className="text-blue-600 font-bold uppercase tracking-wider text-xs">Prompt Final Gerado</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-1 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(finalPrompt);
                    toast.success('Prompt copiado!');
                  }}
                >
                  <Copy size={14} /> Copiar Prompt
                </Button>
              </div>
              <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-y-auto max-h-60 leading-relaxed">
                <pre className="whitespace-pre-wrap">{finalPrompt}</pre>
              </div>
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
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-tight hidden md:block",
              currentStep === step.id ? "text-blue-600" : "text-gray-400"
            )}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-black/5 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardContent className="pt-8 px-10">
          <div className="min-h-[420px]">
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <span className="bg-slate-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">{currentStep}</span>
                    {steps[currentStep - 1].title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">Configure as definições fundamentais do agente.</p>
                </div>
                {id && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Editando Agente #{id.substring(0, 8)}</Badge>
                )}
              </div>
            </div>
            {renderStepContent()}
          </div>

          <div className="flex justify-between items-center mt-12 py-6 border-t border-slate-100">
            <Button 
              variant="ghost" 
              onClick={prevStep} 
              disabled={currentStep === 1 || isLoading}
              className="gap-2 text-gray-500 hover:text-slate-900"
            >
              <ChevronLeft size={18} />
              Voltar
            </Button>

            {currentStep === steps.length ? (
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 px-8"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {id ? 'Atualizar Agente' : 'Salvar Agente'}
              </Button>
            ) : (
              <Button onClick={nextStep} className="gap-2 bg-slate-900 hover:bg-slate-800 px-8">
                Continuar
                <ChevronRight size={18} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentWizard;