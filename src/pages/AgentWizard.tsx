import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Copy
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateFinalPrompt, AgentData } from '@/lib/prompt-engine';

const steps = [
  { id: 1, title: 'Identificação', icon: Info },
  { id: 2, title: 'Objetivo', icon: Target },
  { id: 3, title: 'Personalidade', icon: MessageSquare },
  { id: 4, title: 'Cérebro (Base)', icon: BrainCircuit },
  { id: 5, title: 'Conhecimento', icon: Settings2 },
  { id: 6, title: 'Regras Operacionais', icon: ShieldAlert },
  { id: 7, title: 'Revisão', icon: Check },
];

const AgentWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AgentData>({
    name: '',
    objective: '',
    type: '',
    tone: 'amigável',
    responseSize: 'médias',
    allowEmoji: true,
    basePrompt: '',
    businessContext: '',
    transferRule: '',
    transferDept: '',
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSave = () => {
    toast.success('Agente salvo com sucesso!');
    navigate('/');
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
                <Label>Objetivo Principal</Label>
                <Select onValueChange={(v) => setFormData({...formData, objective: v})}>
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
              </div>
              <div className="space-y-2">
                <Label>Tipo de Agente</Label>
                <Select onValueChange={(v) => setFormData({...formData, type: v})}>
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
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tom de Voz</Label>
                <Select defaultValue="amigável" onValueChange={(v) => setFormData({...formData, tone: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional">Profissional e formal</SelectItem>
                    <SelectItem value="amigavel">Amigável e acolhedor</SelectItem>
                    <SelectItem value="direto">Direto e objetivo</SelectItem>
                    <SelectItem value="persuasivo">Persuasivo e focado em vendas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tamanho das Respostas</Label>
                <Select defaultValue="médias" onValueChange={(v) => setFormData({...formData, responseSize: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="curtas">Curtas e rápidas</SelectItem>
                    <SelectItem value="medias">Tamanho médio</SelectItem>
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
            <Label>Como esse agente deve agir? (Cérebro)</Label>
            <Textarea 
              placeholder="Descreva as regras comportamentais, prioridades e a estratégia de conversa..." 
              className="min-h-[200px]"
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
              <Label>Quando transferir para um humano?</Label>
              <Textarea 
                placeholder="Ex: Quando o cliente pedir falar com atendente ou estiver irritado..." 
                value={formData.transferRule}
                onChange={(e) => setFormData({...formData, transferRule: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Setor de Destino</Label>
              <Select onValueChange={(v) => setFormData({...formData, transferDept: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="suporte">Suporte Técnico</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
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
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <span className="bg-slate-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">{currentStep}</span>
                {steps[currentStep - 1].title}
              </h3>
              <p className="text-gray-500 text-sm mt-1">Preencha os campos abaixo para configurar o comportamento da IA.</p>
            </div>
            {renderStepContent()}
          </div>

          <div className="flex justify-between items-center mt-12 py-6 border-t border-slate-100">
            <Button 
              variant="ghost" 
              onClick={prevStep} 
              disabled={currentStep === 1}
              className="gap-2 text-gray-500 hover:text-slate-900"
            >
              <ChevronLeft size={18} />
              Voltar
            </Button>

            {currentStep === steps.length ? (
              <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 px-8">
                <Save size={18} />
                Salvar Agente
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