export interface FIIData {
  ticker: string;
  name: string;
  price: number;
  lastDividend: number;
  dividendYield: number;
  logourl?: string;
}

export async function searchFIIData(ticker: string): Promise<FIIData | null> {
  try {
    const response = await fetch(`/api/fin/${encodeURIComponent(ticker)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch FII data');
    }
    
    const data = await response.json();
    
    // Calculate an estimated last monthly dividend based on the annual rate
    let lastDividend = data.trailingAnnualDividendRate ? data.trailingAnnualDividendRate / 12 : 0;
    
    // Fallback: if lastDividend is 0 but we have a dividend yield, calculate it from the yield
    if (lastDividend === 0 && data.dividendYield > 0 && data.price > 0) {
      lastDividend = (data.price * (data.dividendYield / 100)) / 12;
    }
    
    return {
      ticker: data.ticker,
      name: data.name,
      price: data.price,
      lastDividend: lastDividend,
      dividendYield: data.dividendYield,
      logourl: data.logourl
    };
  } catch (error) {
    console.error("Erro ao buscar dados do FII:", error);
    return null;
  }
}
