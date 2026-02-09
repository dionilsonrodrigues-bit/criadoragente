export interface AgentData {
  name: string;
  objective: string;
  type: string;
  tone: string;
  responseSize: string;
  allowEmoji: boolean;
  basePrompt: string;
  businessContext: string;
  transferRule: string;
  transferDept: string;
}

export const generateFinalPrompt = (data: AgentData) => {
  const emojiRule = data.allowEmoji 
    ? "Use emojis de forma moderada para tornar a conversa amigável." 
    : "Não use emojis em nenhuma circunstância.";

  const sizeRule = {
    curtas: "Suas respostas devem ser curtas, diretas e objetivas.",
    medias: "Mantenha respostas de tamanho médio, equilibrando detalhe e rapidez.",
    explicativas: "Seja detalhado e explicativo, garantindo que o cliente entenda todos os pontos."
  }[data.responseSize as keyof typeof sizeRule] || "";

  return `
# IDENTIDADE E PAPEL
Você é um ${data.type || 'Assistente Virtual'} da Empresa Demo. Seu nome é ${data.name}.
Seu tom de voz deve ser ${data.tone}.

# OBJETIVO PRINCIPAL
${data.objective}.

# REGRAS DE COMPORTAMENTO
- ${sizeRule}
- ${emojiRule}
- ${data.basePrompt}

# CONTEXTO DO NEGÓCIO E CONHECIMENTO
${data.businessContext}

# REGRAS DE TRANSBORDO (TRANSFERÊNCIA)
Quando ocorrer a seguinte situação: "${data.transferRule}", você deve informar ao cliente que irá transferi-lo para o setor de ${data.transferDept}.
NUNCA tente inventar informações que não estejam no Contexto do Negócio.
  `.trim();
};