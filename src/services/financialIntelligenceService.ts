import { generateContentWithRetry } from './aiService';
import { Type } from "@google/genai";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  type?: 'income' | 'expense';
  merchant?: string;
}

export interface ProcessedTransaction {
  id: string;
  merchant: string;
  category: string;
  type: 'income' | 'expense';
}

export async function processTransactionsWithAI(transactions: Transaction[]): Promise<ProcessedTransaction[]> {
  const hasApiKey = !!((window as any).process?.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY);
  if (!hasApiKey) {
    console.warn("Gemini API Key não configurada. Usando classificação básica.");
    return transactions.map(t => ({
      id: t.id,
      merchant: t.description,
      category: t.category || 'Outros',
      type: t.type || 'expense'
    }));
  }

  const prompt = `
    Analise as seguintes transações financeiras e limpe as descrições para identificar o estabelecimento real, 
    classifique-as em categorias padrão e defina o tipo (income ou expense).
    
    Transações:
    ${JSON.stringify(transactions.map(t => ({ id: t.id, desc: t.description, amount: t.amount })))}
    
    Retorne um JSON array com a estrutura: [{ id: string, merchant: string, category: string, type: 'income' | 'expense' }]
    Categorias permitidas: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Assinaturas, Salário, Investimentos, Outros.
  `;

  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              merchant: { type: Type.STRING },
              category: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ["id", "merchant", "category", "type"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao processar transações com IA:", error);
    return transactions.map(t => ({
      id: t.id,
      merchant: t.description,
      category: t.category || 'Outros',
      type: t.type || 'expense'
    }));
  }
}

export interface FinancialInsights {
  subscriptions: { merchant: string; amount: number; frequency: string }[];
  anomalies: { description: string; alert: string }[];
  cashFlowPrediction: { projectedBalance: number; analysis: string };
  healthScore: { score: number; explanation: string };
}

export async function analyzeFinancialHealth(transactions: ProcessedTransaction[], rawTransactions: Transaction[]): Promise<FinancialInsights> {
  const hasApiKey = !!((window as any).process?.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY);
  if (!hasApiKey) {
    return {
      subscriptions: [],
      anomalies: [],
      cashFlowPrediction: { projectedBalance: 0, analysis: "IA não configurada." },
      healthScore: { score: 50, explanation: "IA não configurada." }
    };
  }

  const prompt = `
    Analise o histórico de transações e forneça insights financeiros avançados:
    
    Transações: ${JSON.stringify(rawTransactions)}
    
    1. Identifique assinaturas recorrentes (mensais, anuais).
    2. Detecte gastos anormais (anomalias) comparando com a média.
    3. Calcule o saldo médio mensal e projete o saldo em 30 dias.
    4. Calcule um score de saúde financeira (0-100).
    
    Retorne um JSON com a estrutura:
    {
      "subscriptions": [{ "merchant": string, "amount": number, "frequency": string }],
      "anomalies": [{ "description": string, "alert": string }],
      "cashFlowPrediction": { "projectedBalance": number, "analysis": string },
      "healthScore": { "score": number, "explanation": string }
    }
  `;

  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Erro na análise financeira:", error);
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('quota')) {
      throw new Error('⚠️ Limite de requisições da IA atingido (Cota Excedida). Por favor, aguarde alguns minutos e tente novamente.');
    }
    throw error;
  }
}

