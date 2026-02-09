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
  Target
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
  const [formData, setFormData] = useState({
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

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
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
          <div className="space-y-6">
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
          <div className="space-y-6">
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
          <div className="space-y-4">
            <Label>Como esse agente deve agir? (Cérebro)</Label>
            <Textarea 
              placeholder="Descreva as regras comportamentais, prioridades e a estratégia de conversa..." 
              className="min-h-[200px]"
              value={formData.basePrompt}
              onChange={(e) => setFormData({...formData, basePrompt: e.target.value})}
            />
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 flex gap-2">
              <BrainCircuit className="shrink-0" size={16} />
              Dica: Defina o que o agente PODE e o que NÃO PODE fazer.
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
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
          <div className="space-y-6">
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
          <div className="space-y-6 border rounded-lg p-6 bg-slate-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Nome:</span>
                <span className="font-semibold">{formData.name || 'Não definido'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Objetivo:</span>
                <span className="font-semibold capitalize">{formData.objective || 'Não definido'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Personalidade:</span>
                <span className="font-semibold">Tom {formData.tone}, Respostas {formData.responseSize}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Emoji:</span>
                <span className="font-semibold">{formData.allowEmoji ? 'Sim' : 'Não'}</span>
              </div>
            </div>
            <div className="space-y-2 p-4 bg-white border rounded shadow-sm">
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Preview do Prompt Final</h4>
              <p className="text-xs text-gray-600 italic">
                "Você é um {formData.type || 'Agente'} da Empresa Demo. Seu objetivo é {formData.objective}. 
                Use um tom {formData.tone}. {formData.basePrompt.substring(0, 100)}..."
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="relative flex justify-between">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 -z-10" />
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
              currentStep === step.id ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110" : 
              currentStep > step.id ? "bg-green-500 border-green-500 text-white" : 
              "bg-white border-gray-300 text-gray-400"
            )}>
              {currentStep > step.id ? <Check size={20} /> : <step.icon size={20} />}
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-tight",
              currentStep === step.id ? "text-blue-600" : "text-gray-400"
            )}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* Content */}
      <Card className="shadow-xl">
        <CardContent className="pt-6">
          <div className="min-h-[400px]">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {steps[currentStep - 1].title}
            </h3>
            {renderStepContent()}
          </div>

          <div className="flex justify-between items-center mt-12 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft size={18} />
              Anterior
            </Button>

            {currentStep === steps.length ? (
              <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
                <Save size={18} />
                Finalizar e Salvar Agente
              </Button>
            ) : (
              <Button onClick={nextStep} className="gap-2">
                Próximo
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