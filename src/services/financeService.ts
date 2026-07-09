/// <reference types="vite/client" />
import { format } from 'date-fns';

export interface FinanceData {
  selic: number;
  ipca: number;
  inpc: number;
  usd: number;
  minimumWage: number;
  avgKwhPrice: number;
  solarCostPerKwp: number;
  mortgageRates: {
    bank: string;
    rate: number;
  }[];
  lastUpdate: string;
  brapiTokenSet: boolean;
  ibovespa?: { points: number; change: number };
  bova11?: { price: number; change: number };
}

export interface EnergyTariff {
  concessionaria: string;
  uf: string;
  tarifa_cheia: number;
  fio_b: number;
  bandeira: string;
  data_atualizacao: string;
}

const DEFAULT_DATA: FinanceData = {
  selic: 11.25,
  ipca: 4.5,
  inpc: 4.2,
  usd: 5.0,
  minimumWage: 1512,
  avgKwhPrice: 0.85,
  solarCostPerKwp: 3500,
  mortgageRates: [
    { bank: 'Caixa Econômica', rate: 10.55 },
    { bank: 'Banco do Brasil', rate: 11.35 },
    { bank: 'Itaú Unibanco', rate: 10.95 },
    { bank: 'Bradesco', rate: 12.85 },
    { bank: 'Santander', rate: 11.15 },
    { bank: 'BRB', rate: 10.75 },
  ],
  lastUpdate: new Date().toISOString(),
  brapiTokenSet: false,
};

// Verifica se o token da Brapi está disponível via configuração do servidor
async function checkBrapiToken(): Promise<boolean> {
  try {
    const configRes = await fetch('/api/finance-config');
    if (configRes.ok) {
      const config = await configRes.json();
      return !!config.brapiTokenSet;
    }
  } catch (e) {
    console.error('Failed to check brapi token config:', e);
  }
  return false;
}

export async function fetchFinanceData(): Promise<FinanceData> {
  try {
    // Fetch indicators from our backend proxy to avoid CORS and get real-time data
    const indicatorsRes = await fetch('/api/fin/indicators').catch(() => null);

    let usdValue = DEFAULT_DATA.usd;
    let selic = DEFAULT_DATA.selic;
    let ipca = DEFAULT_DATA.ipca;
    let inpc = DEFAULT_DATA.inpc;
    let minimumWage = DEFAULT_DATA.minimumWage;
    let ibovespa = { points: 126300, change: 0.45 };
    let bova11 = { price: 121.50, change: 0.42 };

    if (indicatorsRes && indicatorsRes.ok) {
      const contentType = indicatorsRes.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await indicatorsRes.json();
        const { selic: selicData, ipca: ipcaData, inpc: inpcData, wage: wageData, usd: usdDataBcb, ibovespa: ibovData, bova11: bova11Data } = data;
        
        if (selicData && Array.isArray(selicData) && selicData[0]) selic = parseFloat(selicData[0].valor);
        
        if (ipcaData && Array.isArray(ipcaData) && ipcaData.length > 0) {
          const accumulated = (ipcaData.reduce((acc: number, curr: any) => acc * (1 + parseFloat(curr.valor) / 100), 1) - 1) * 100;
          ipca = parseFloat(accumulated.toFixed(2));
        }

        if (inpcData && Array.isArray(inpcData) && inpcData.length > 0) {
          const accumulated = (inpcData.reduce((acc: number, curr: any) => acc * (1 + parseFloat(curr.valor) / 100), 1) - 1) * 100;
          inpc = parseFloat(accumulated.toFixed(2));
        }

        if (wageData && Array.isArray(wageData) && wageData[0]) minimumWage = parseFloat(wageData[0].valor);
        if (usdDataBcb && Array.isArray(usdDataBcb) && usdDataBcb[0]) usdValue = parseFloat(usdDataBcb[0].valor);
        
        if (ibovData) ibovespa = ibovData;
        if (bova11Data) bova11 = bova11Data;
      } else {
        console.warn('Indicators API returned non-JSON response:', await indicatorsRes.text().then(t => t.slice(0, 100)));
      }
    }

    const isTokenSet = await checkBrapiToken();

    return {
      ...DEFAULT_DATA,
      selic,
      ipca,
      inpc,
      minimumWage,
      usd: usdValue,
      ibovespa,
      bova11,
      brapiTokenSet: isTokenSet,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return {
      ...DEFAULT_DATA,
      brapiTokenSet: false,
    };
  }
}

export async function fetchConcessionaires(uf: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/energy/concessionaires?uf=${encodeURIComponent(uf)}`);
    if (!response.ok) throw new Error('Failed to fetch concessionaires');
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error fetching concessionaires:', error);
    return [];
  }
}

export async function fetchEnergyTariff(query: string): Promise<EnergyTariff | null> {
  try {
    const response = await fetch(`/api/energy/tariffs?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to fetch tariff');
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error fetching energy tariff:', error);
    return null;
  }
}
