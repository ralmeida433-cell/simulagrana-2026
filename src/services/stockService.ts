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

async function fetchFromBrapiDirect(ticker: string, token: string): Promise<StockData | null> {
  // Brapi usually doesn't need .SA for B3 stocks
  const cleanTicker = ticker.replace('.SA', '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleanTicker) return null;
  
  // Try with modules first
  let url = `https://brapi.dev/api/quote/${cleanTicker}?modules=summaryProfile,financialData,defaultKeyStatistics&dividends=true&token=${token}`;
  let res = await fetch(url);
  
  if (!res.ok) {
    if (res.status === 404) return null;
    
    // If 400, try without modules (some tokens have restrictions)
    if (res.status === 400) {
      console.warn(`Brapi 400 for ${cleanTicker} with modules, trying simple quote...`);
      url = `https://brapi.dev/api/quote/${cleanTicker}?token=${token}`;
      res = await fetch(url);
    }
    
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`Brapi error: ${res.status} for URL: ${url}`);
      throw new Error(`Brapi error: ${res.status}`);
    }
  }

  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;

  const result = data.results[0];
  const fd = result.financialData || {};
  const dks = result.defaultKeyStatistics || {};
  const sp = result.summaryProfile || {};

  const price = result.regularMarketPrice || 0;
  const name = result.longName || result.shortName || ticker;
  const longName = result.longName || name;
  const shortName = result.shortName || name;
  const sector = sp.sector || 'N/A';
  const industry = sp.industry || 'N/A';
  const currency = result.currency === 'BRL' ? 'R$' : (result.currency === 'USD' ? 'US$' : (result.currency || 'R$'));
  const change = result.regularMarketChange || 0;
  const changePercent = result.regularMarketChangePercent || 0;

  let type = 'stock';
  const quoteType = result.type || '';
  if (quoteType === 'ETF') type = 'etf';
  else if (quoteType === 'FUND' || quoteType === 'MUTUALFUND') type = 'fund';
  else if (ticker.endsWith('34.SA') || ticker.endsWith('39.SA') || ticker.endsWith('34') || ticker.endsWith('39')) type = 'bdr';
  else if ((ticker.endsWith('11.SA') || ticker.endsWith('11')) && sector === 'Real Estate') type = 'fund'; // FII

  const logourl = result.logourl || `https://s3-symbol-logo.tradingview.com/${cleanTicker}--big.svg`;

  const eps = result.earningsPerShare || dks.trailingEps || 0;
  const bvps = result.bookValue || dks.bookValue || 0;
  const sharesOutstanding = result.sharesOutstanding || dks.sharesOutstanding || 0;
  const totalDebt = fd.totalDebt || 0;
  const totalCash = fd.totalCash || 0;
  const netDebt = totalDebt - totalCash;
  const operatingCashflow = fd.operatingCashflow || 0;
  const fcf = fd.freeCashflow || 0;
  const capex = 0;

  const peRatio = result.priceEarnings || dks.trailingPE || 0;
  const pvp = dks.priceToBook || (bvps > 0 ? price / bvps : 0);
  const roe = (fd.returnOnEquity || 0) * 100;
  const ebitda = fd.ebitda || 0;
  const netMargin = (fd.profitMargins || 0) * 100;
  const assetTurnover = 0;

  let dividendYield = 0;
  let trailingAnnualDividendRate = 0;
  if (result.dividendsData?.cashDividends) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentDivs = result.dividendsData.cashDividends.filter((d: any) => {
      const paymentDate = new Date(d.paymentDate || d.approvedOn);
      return paymentDate >= oneYearAgo;
    });
    trailingAnnualDividendRate = recentDivs.reduce((sum: number, d: any) => sum + (d.rate || 0), 0);
    if (price > 0) dividendYield = (trailingAnnualDividendRate / price) * 100;
  }

  const payoutRatio = eps > 0 ? (trailingAnnualDividendRate / eps) * 100 : 0;

  // Histórico de preços simulado (sem acesso ao Yahoo Finance no cliente)
  const historicalPrices: { date: string; price: number }[] = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    historicalPrices.push({
      date: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
      price: price * (1 + (Math.random() * 0.3 - 0.15)),
    });
  }

  const historicalProfits: { year: string; profit: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    historicalProfits.push({
      year: (new Date().getFullYear() - i).toString(),
      profit: Number((eps * (1 + (Math.random() * 0.2 - 0.1))).toFixed(2)),
    });
  }

  const resObj: any = {
    ticker,
    name,
    longName,
    shortName,
    type,
    logourl,
    industry,
    sector,
    price,
    eps,
    fcf,
    operatingCashflow,
    capex,
    bvps,
    totalDebt,
    totalCash,
    netDebt,
    sharesOutstanding,
    dividendYield,
    trailingAnnualDividendRate,
    payoutRatio,
    peRatio,
    pvp,
    roe,
    ebitda,
    netMargin,
    assetTurnover,
    currency,
    change,
    changePercent,
    historicalPrices,
    historicalProfits,
  };

  // Sanitize numerical fields to avoid NaN or Infinity values
  for (const key of Object.keys(resObj)) {
    const val = resObj[key];
    if (typeof val === 'number') {
      if (isNaN(val) || !isFinite(val)) {
        resObj[key] = 0;
      }
    }
  }

  return resObj;
}
