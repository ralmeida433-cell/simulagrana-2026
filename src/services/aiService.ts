import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Defining types manually since we remove the frontend GenAI SDK to avoid exposing keys
export interface GenerateContentParameters {
  model: string;
  contents: string | any[];
  config?: any;
}

export type GenerateContentResponse = any;

/**
 * Service to interact with the Gemini AI API via backend proxy
 */

/**
 * Generates content using the Gemini AI proxy.
 */
export async function generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params })
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to generate content via proxy");
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error calling AI proxy:", error);
    throw error;
  }
}

/**
 * Helper function to generate content with a retry mechanism for robustness.
 */
export async function generateContentWithRetry(
  params: GenerateContentParameters,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<GenerateContentResponse> {
  // 1. Verify User Authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("AUTH_REQUIRED: Para usar as funcionalidades de Inteligência Artificial do SimulaGrana, você precisa estar cadastrado e logado.");
  }

  // 2. Fetch and Check/Reset AI Credits
  const userRef = doc(db, 'users', currentUser.uid);
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) {
    throw new Error("USER_PROFILE_NOT_FOUND: Perfil de usuário não encontrado no Firestore. Recarregue a página.");
  }

  const userData = docSnap.data();
  let credits = userData?.aiCreditsRemaining !== undefined ? userData.aiCreditsRemaining : 10;
  const lastReset = userData?.aiCreditsLastReset || "";

  // Get true server time to reset credits every 24 hours
  let serverTimeMs = Date.now();
  try {
    const res = await fetch('/api/time');
    const timeData = await res.json();
    if (timeData.timestamp) {
       serverTimeMs = timeData.timestamp;
    } else if (timeData.iso) {
       serverTimeMs = new Date(timeData.iso).getTime();
    }
  } catch (err) {
    console.error("Erro ao obter data do servidor, usando data local:", err);
  }

  // Handle both old date string format "YYYY-MM-DD" and new timestamp format
  let shouldReset = false;
  if (!lastReset) {
    shouldReset = true;
  } else if (lastReset.includes('-')) {
    // Old format, reset if it's not today's date (fallback)
    const todayStr = new Date(serverTimeMs).toISOString().split('T')[0];
    if (lastReset !== todayStr) shouldReset = true;
  } else {
    // New format (timestamp in milliseconds)
    const lastResetMs = parseInt(lastReset, 10);
    if (serverTimeMs - lastResetMs >= 24 * 60 * 60 * 1000) {
      shouldReset = true;
    }
  }

  if (shouldReset) {
    credits = 10;
    await updateDoc(userRef, {
      aiCreditsRemaining: 10,
      aiCreditsLastReset: serverTimeMs.toString()
    });
  }

  if (credits <= 0) {
    throw new Error("CREDITS_EXHAUSTED: Seu limite de 10 análises de IA foi atingido. Ele será renovado 24 horas após o último reset!");
  }

  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await generateContent(params);
      
      // AI generation succeeded, consume 1 credit
      await updateDoc(userRef, {
        aiCreditsRemaining: credits - 1
      });

      return response;
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.status === 429 || 
                          error?.message?.includes('429') || 
                          error?.message?.includes('RESOURCE_EXHAUSTED') || 
                          error?.message?.includes('quota');
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Checks if the AI service is configured by pinging a lightweight backend check.
 * Since the frontend can't safely know if the backend has the key, we assume it's true 
 * or handle failures gracefully. For now, we return true and let the backend fail if unconfigured.
 */
export function isAIConfigured(): boolean {
  return true;
}

// Emulate GoogleGenAI Type enum for existing code
export const Type = {
  STRING: "string",
  NUMBER: "number",
  INTEGER: "integer",
  BOOLEAN: "boolean",
  ARRAY: "array",
  OBJECT: "object",
};

export interface CarSpecs {
  name: string;
  type: 'combustion' | 'electric' | 'hybrid';
  price: number;
  consumption: number;
  maintenance: number;
  insurance: number;
  ipva: number;
  depreciation: number;
}

export interface VehicleAnalysis {
  depreciationRate: number;
  marketAnalysis: string;
  maintenanceCost: number;
  insuranceCost: number;
  isDiscontinued: boolean;
  adjustedValue: number;
  liquidity: 'Alta' | 'Média' | 'Baixa';
  score: number;
}

export interface SolarRegionalData {
  concessionaria: string;
  tarifa_cheia: number;
  fio_b: number;
  hsp: number;
  capex_sugerido: number;
  taxa_minima: number;
  aliquota_icms: number;
  autoconsumo: number;
}

export async function analyzeVehicleDepreciation(
  fipeData: any,
  details?: {
    anoFabricacao?: string;
    quilometragem?: string;
    estadoConservacao?: string;
    historico?: string;
    versao?: string;
  }
): Promise<VehicleAnalysis | null> {
  try {
    const detailsText = details ? `
      Detalhes Adicionais informados pelo usuário:
      - Ano de Fabricação: ${details.anoFabricacao || 'Não informado'}
      - Quilometragem: ${details.quilometragem || 'Não informada'}
      - Estado de Conservação: ${details.estadoConservacao || 'Não informado'}
      - Histórico: ${details.historico || 'Não informado'}
      - Versão/Opcionais: ${details.versao || 'Não informado'}
    ` : '';

    const response = await generateContentWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: `Analise o seguinte veículo com base nos dados da Tabela FIPE e nos principais fatores de avaliação de mercado:
      
      Dados Base:
      Marca: ${fipeData.Marca}
      Modelo: ${fipeData.Modelo}
      Ano: ${fipeData.AnoModelo}
      Valor FIPE: ${fipeData.Valor}
      ${detailsText}
      
      Fatores a considerar na sua análise e cálculo do Valor Ajustado:
      1. Referência de preço de mercado: A Tabela FIPE é a base, mas considere o preço médio praticado em plataformas como Webmotors, OLX e iCarros.
      2. Ano de fabricação e modelo: Carros com ano de modelo mais novo que o de fabricação costumam valer mais.
      3. Quilometragem: 10 mil a 15 mil km por ano é o uso normal. Muito acima disso desvaloriza, muito abaixo valoriza.
      4. Estado de conservação: Avalie o impacto de Exterior (pintura, funilaria), Interior (bancos, painel) e Mecânica (motor, câmbio, suspensão).
      5. Histórico do veículo: Passagem por leilão, sinistro ou restrições desvalorizam significativamente o veículo.
      6. Versão e opcionais: Versões completas têm maior valor agregado e liquidez do que versões básicas.
      7. Demanda do mercado (Liquidez): Veículos fora de linha (ex: Ford Ka) ou com baixa procura sofrem maior desvalorização e têm menor liquidez.
      8. Custos de manutenção e impostos: IPVA, Seguro e Consumo afetam o custo-benefício e a atratividade do veículo.
      
      Forneça uma análise de mercado realista para este veículo no Brasil.
      Calcule um "Valor de Mercado Ajustado" (adjustedValue) em Reais, partindo do Valor FIPE e aplicando ágios ou deságios com base na quilometragem, estado, histórico, versão, liquidez e se o veículo saiu de linha.
      Estime a taxa de depreciação anual realista (em %), custos anuais de manutenção e seguro.
      A análise de mercado deve ser um texto explicativo detalhando como esses fatores influenciaram o valor ajustado e a liquidez do veículo.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            depreciationRate: { type: Type.NUMBER, description: "Taxa de depreciação anual estimada (%)" },
            marketAnalysis: { type: Type.STRING, description: "Análise de mercado detalhada baseada nos 8 fatores (liquidez, histórico, conservação, etc.)" },
            maintenanceCost: { type: Type.NUMBER, description: "Custo de manutenção anual estimado em Reais (R$)" },
            insuranceCost: { type: Type.NUMBER, description: "Custo de seguro anual estimado em Reais (R$)" },
            isDiscontinued: { type: Type.BOOLEAN, description: "Verdadeiro se o veículo ou marca saiu de linha no Brasil" },
            adjustedValue: { type: Type.NUMBER, description: "Valor de mercado ajustado em Reais (R$), considerando FIPE + os fatores informados" },
            liquidity: { type: Type.STRING, enum: ["Alta", "Média", "Baixa"], description: "Demanda do mercado / Liquidez" },
            score: { type: Type.NUMBER, description: "Nota geral de custo-benefício e revenda do veículo (0 a 10)" },
          },
          required: ["depreciationRate", "marketAnalysis", "maintenanceCost", "insuranceCost", "isDiscontinued", "adjustedValue", "liquidity", "score"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as VehicleAnalysis;
  } catch (error: any) {
    console.error("Error analyzing vehicle with AI:", error);
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('quota')) {
      throw new Error('⚠️ Limite de requisições da IA atingido (Cota Excedida). Por favor, aguarde alguns minutos e tente novamente.');
    }
    return null;
  }
}

export async function searchFipeWithAI(query: string) {
  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: `Extraia a marca, modelo e ano do veículo a partir do texto: "${query}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marca: { type: Type.STRING },
            modelo: { type: Type.STRING },
            ano: { type: Type.STRING },
          },
          required: ["marca", "modelo", "ano"],
        }
      }
    });
    
    const text = response.text;
    if (!text) return null;
    const { marca, modelo, ano } = JSON.parse(text);
    
    // Fetch marcas
    const marcasRes = await fetch('/api/fipe/marcas');
    const marcas = await marcasRes.json();
    const matchedMarca = marcas.find((m: any) => m.nome.toLowerCase().includes(marca.toLowerCase()));
    if (!matchedMarca) return null;
    
    // Fetch modelos
    const modelosRes = await fetch(`/api/fipe/marcas/${matchedMarca.codigo}/modelos`);
    const modelosData = await modelosRes.json();
    const modelos = modelosData.modelos;
    // Find closest model
    const matchedModelo = modelos.find((m: any) => m.nome.toLowerCase().includes(modelo.toLowerCase()));
    if (!matchedModelo) return null;
    
    // Fetch anos
    const anosRes = await fetch(`/api/fipe/marcas/${matchedMarca.codigo}/modelos/${matchedModelo.codigo}/anos`);
    const anos = await anosRes.json();
    const matchedAno = anos.find((a: any) => a.nome.includes(ano));
    if (!matchedAno) return null;
    
    // Fetch valor
    const valorRes = await fetch(`/api/fipe/marcas/${matchedMarca.codigo}/modelos/${matchedModelo.codigo}/anos/${matchedAno.codigo}`);
    const fipeData = await valorRes.json();
    
    return {
      fipeData,
      marcaCodigo: matchedMarca.codigo,
      modeloCodigo: matchedModelo.codigo,
      anoCodigo: matchedAno.codigo
    };
  } catch (error) {
    console.error("Error searching FIPE with AI:", error);
    return null;
  }
}

export async function fetchCarSpecs(query: string): Promise<CarSpecs | null> {
  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: `Forneça as especificações técnicas médias para o veículo: "${query}". 
      Considere valores realistas para o mercado brasileiro em 2024/2025.
      Se for elétrico, o consumo deve ser em km/kWh. Se for combustão ou híbrido, em km/L (gasolina).
      O IPVA deve ser uma estimativa anual (geralmente 4% do valor, mas elétricos podem ter isenção em alguns estados, considere 0 para elétricos se for o caso comum).
      A manutenção e seguro devem ser estimativas anuais.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nome completo do modelo" },
            type: { type: Type.STRING, enum: ["combustion", "electric", "hybrid"], description: "Tipo de motorização" },
            price: { type: Type.NUMBER, description: "Preço médio de mercado em Reais (R$)" },
            consumption: { type: Type.NUMBER, description: "Consumo médio (km/L ou km/kWh)" },
            maintenance: { type: Type.NUMBER, description: "Custo de manutenção anual estimado em Reais (R$)" },
            insurance: { type: Type.NUMBER, description: "Custo de seguro anual estimado em Reais (R$)" },
            ipva: { type: Type.NUMBER, description: "Custo de IPVA anual estimado em Reais (R$)" },
            depreciation: { type: Type.NUMBER, description: "Taxa de depreciação anual estimada (%)" },
          },
          required: ["name", "type", "price", "consumption", "maintenance", "insurance", "ipva", "depreciation"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as CarSpecs;
  } catch (error) {
    console.error("Error fetching car specs with AI:", error);
    return null;
  }
}

export async function fetchSolarData(estado: string): Promise<SolarRegionalData | null> {
  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: `Aja como um motor de dados para energia solar no Brasil em 2026 (Lei 14.300). 
O usuário informará o estado "${estado}". 
Sua função é retornar um JSON com os seguintes dados automáticos para a principal distribuidora desse estado:

- concessionaria: Nome da principal distribuidora.
- tarifa_cheia: Valor total do kWh (TE + TUSD) com impostos (R$/kWh).
- fio_b: Valor em Reais da parcela Fio B desta tarifa (R$/kWh).
- hsp: Índice de sol pleno (HSP) médio do estado.
- capex_sugerido: Custo médio por kWp instalado no estado para 2026 (R$/kWp).
- taxa_minima: Custo de disponibilidade para uma conexão BIFÁSICA (valor em R$).
- aliquota_icms: Alíquota efetiva de ICMS sobre a energia injetada no estado (considerando isenções).
- autoconsumo: Índice de autoconsumo instantâneo sugerido para perfil residencial (ex: 0.30 para 30%).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concessionaria: { type: Type.STRING },
            tarifa_cheia: { type: Type.NUMBER },
            fio_b: { type: Type.NUMBER },
            hsp: { type: Type.NUMBER },
            capex_sugerido: { type: Type.NUMBER },
            taxa_minima: { type: Type.NUMBER },
            aliquota_icms: { type: Type.NUMBER },
            autoconsumo: { type: Type.NUMBER },
          },
          required: ["concessionaria", "tarifa_cheia", "fio_b", "hsp", "capex_sugerido", "taxa_minima", "aliquota_icms", "autoconsumo"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as SolarRegionalData;
  } catch (error) {
    console.error("Error fetching solar data with AI:", error);
    return null;
  }
}
