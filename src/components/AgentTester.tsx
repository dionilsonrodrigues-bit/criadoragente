import React, { useState } from 'react';
import { Send, Bot, User, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: 'agent' | 'user';
  text: string;
}

const AgentTester = ({ agentName, onClose }: { agentName: string; onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', text: `Olá! Eu sou o ${agentName}. Como posso te ajudar hoje?` }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user' as const, text: input }];
    setMessages(newMessages);
    setInput('');

    // Simulando resposta da IA
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: "Entendi sua dúvida. Como este é um simulador, estou processando sua mensagem com base nas regras que você definiu!" 
      }]);
    }, 1000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l flex flex-col z-50 animate-in slide-in-from-right">
      <div className="p-4 border-b bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-blue-400" />
          <span className="font-bold">Testando: {agentName}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-800">
          <X size={20} />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </ScrollArea>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input 
            placeholder="Digite sua mensagem..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button size="icon" onClick={handleSend}>
            <Send size={18} />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Modo de Teste: As respostas são simuladas localmente.
        </p>
      </div>
    </div>
  );
};

export default AgentTester;