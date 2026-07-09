export interface StockData {
  ticker: string;
  name: string;
  longName?: string;
  shortName?: string;
  type?: string;
  logourl?: string;
  industry?: string;
  sector: string;
  price: number;
  eps: number;
  fcf: number | null;
  operatingCashflow: number | null;
  capex: number | null;
  bvps: number;
  totalDebt: number;
  totalCash: number;
  netDebt: number;
  sharesOutstanding: number;
  dividendYield: number;
  trailingAnnualDividendRate: number;
  payoutRatio: number;
  peRatio: number;
  pvp: number;
  roe: number;
  ebitda: number;
  netMargin: number;
  assetTurnover: number;
  currency: string;
  change: number;
  changePercent: number;
  historicalPrices: { date: string; price: number }[];
  historicalProfits: { year: string; profit: number }[];
  dividendsData?: { cashDividends?: any[] };
}

const cache = new Map<string, {data: StockData, timestamp: number}>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes cache

export const searchStockData = async (ticker: string): Promise<StockData | null> => {
  try {
    let queryTicker = ticker.trim().toUpperCase();
    
    // Check Cache First
    const cached = cache.get(queryTicker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data;
    }
    
    // Common typos correction map

    const tickerCorrections: Record<string, string> = {
      'PTR4': 'PETR4',
      'PTR4.SA': 'PETR4.SA',
      'PTR3': 'PETR3',
      'PTR3.SA': 'PETR3.SA',
      'BBSA3': 'BBAS3',
      'BBSA3.SA': 'BBAS3.SA',
      'NUBR33': 'ROXO34',
      'NUBR33.SA': 'ROXO34.SA',
      'KLAB4': 'KLBN4',
      'KLAB4.SA': 'KLBN4.SA',
      'KLAB11': 'KLBN11',
      'KLAB11.SA': 'KLBN11.SA',
      'TTWO.SA': 'TTWO34.SA',
      'AAPL.SA': 'AAPL34.SA',
      'MSFT.SA': 'MSFT34.SA',
      'AMZO.SA': 'AMZO34.SA',
      'GOGL.SA': 'GOGL34.SA',
      'NFLX.SA': 'NFLX34.SA',
      'TSLA.SA': 'TSLA34.SA',
      'META.SA': 'META34.SA',
      'NVDA.SA': 'NVDA34.SA',
    };

    if (tickerCorrections[queryTicker]) {
      queryTicker = tickerCorrections[queryTicker];
    }

    // Tenta primeiro via servidor local (desenvolvimento)
    const response = await fetch(`/api/fin/${queryTicker}`);
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        cache.set(queryTicker, { data, timestamp: Date.now() });
        return data;
      }
    }
    if (response.status === 404) return null;

    let msg = 'Ativo não encontrado ou erro na rede';
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json().catch(() => ({}));
      msg = errorData.message || errorData.error || msg;
    }
    
    if (typeof msg !== 'string') {
      msg = 'Erro na requisição.';
    }
    
    throw new Error(msg);
  } catch (error: any) {
    console.warn(`Could not fetch data for ${ticker}:`, error.message);
    throw new Error('Dados não encontrados ou temporariamente indisponíveis.');
  }
};

