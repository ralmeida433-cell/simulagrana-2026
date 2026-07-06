import { generateContentWithRetry } from './aiService';

export interface BrokerOperation {
  ativo: string;
  quantidade: number;
  preco: number;
  tipo: 'COMPRA' | 'VENDA';
  data: string;
}

export async function parseBrokerNoteBase64(base64Pdf: string): Promise<string> {
  const response = await fetch('/api/parse-local-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ base64: base64Pdf }),
  });

  if (!response.ok) {
    throw new Error('Falha ao processar o PDF da nota de corretagem no servidor.');
  }

  const data = await response.json();
  if (!data.text) {
    throw new Error('Nenhum texto extraído do PDF.');
  }

  return data.text;
}

export async function extractOperationsFromText(text: string): Promise<BrokerOperation[]> {
  const prompt = `
Aqui está o texto extraído de uma ou mais Notas de Corretagem brasileiras:

"""
${text.substring(0, 30000) /* limit to avoid token issues */}
"""

Sua tarefa é extrair todas as operações de compra e venda de ativos (Ações, FIIs, BDRs, ETFs) descritas nesta nota de corretagem.
Seja muito preciso. Não inclua taxas ou emolumentos como operações.
Extraia exatamente para um array JSON correspondente ao schema abaixo, sem formatação markdown ou texto extra:
{
  "operations": [
    {
      "ativo": "TICKER_DO_ATIVO (ex: VALE3, MXRF11)",
      "quantidade": 100, // numero inteiro
      "preco": 65.50, // numero decimal com ponto
      "tipo": "COMPRA" | "VENDA",
      "data": "YYYY-MM-DD" // data do pregao, inferir do cabeçalho da nota
    }
  ]
}

Se não houver operações válidas, retorne {"operations": []}. Retorne SOMENTE o JSON.
  `;

  try {
    const aiResponse = await generateContentWithRetry({
      model: 'gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = aiResponse.text;
    if (!responseText) throw new Error('Resposta vazia da IA.');

    const parsed = JSON.parse(responseText);
    return parsed.operations || [];
  } catch (error: any) {
    console.error('Erro na IA ao extrair operações:', error);
    if (error.message?.includes('AUTH_REQUIRED') || error.message?.includes('CREDITS_EXHAUSTED')) {
      throw error;
    }
    throw new Error('Erro ao interpretar a nota de corretagem via Inteligência Artificial.');
  }
}
