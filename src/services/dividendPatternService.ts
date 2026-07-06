import { StockData } from './stockService';

export interface DividendPatternResult {
  typicalMonths: Set<number>;
  monthlyExpectedRate: Record<number, number>;
  provisionedRate: Record<number, number>; // Mês -> Taxa oficial anunciada para o ano atual
}

/**
 * Analisa o histórico de proventos e determina em quais meses do ano
 * um ativo costuma pagar dividendos/JCP com base na Data Ex.
 * Separa os provisionados oficiais das projeções baseadas em média com margem de segurança conservadora.
 */
export function analyzeDividendPattern(ticker: string, cashDividends?: any[], isAssetClassFii?: boolean): DividendPatternResult {
  const cleanTicker = ticker.replace('.SA', '').toUpperCase();
  const isFii = isAssetClassFii || cleanTicker.endsWith('11');
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  
  if (!cashDividends || cashDividends.length === 0) {
    if (isFii) {
      const allMonths = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      return { typicalMonths: allMonths, monthlyExpectedRate: {}, provisionedRate: {} };
    }
    return { typicalMonths: new Set(), monthlyExpectedRate: {}, provisionedRate: {} };
  }

  const paymentsByYear: Record<number, Record<number, number[]>> = {};
  const provisionedRate: Record<number, number> = {};
  
  cashDividends.forEach(div => {
    // Prioriza Data Ex (lastDatePrior / recordDate / exDate)
    const dateStr = div.exDate || div.lastDatePrior || div.recordDate || div.paymentDate || div.approvedOn || div.date;
    if (!dateStr) return;
    
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return;
    
    const month = dt.getUTCMonth() + 1;
    const year = dt.getUTCFullYear();
    const rate = div.rate || div.value || 0;

    // Se é do ano atual e a Data Ex está no futuro ou muito recente
    // Podemos considerar como 'provisionado' oficial daquele mês para o grid
    if (year === currentYear && dt >= now) {
       provisionedRate[month] = (provisionedRate[month] || 0) + rate;
    }
    
    if (!paymentsByYear[year]) {
      paymentsByYear[year] = {};
    }
    if (!paymentsByYear[year][month]) {
      paymentsByYear[year][month] = [];
    }
    paymentsByYear[year][month].push(rate);
  });

  const yearsWithData = Object.keys(paymentsByYear).map(Number).sort((a, b) => b - a);
  // Limita a 5 anos de amostragem histórica
  const recentYears = yearsWithData.slice(0, 5);
  const numYears = recentYears.length;

  if (numYears === 0) {
    if (isFii) {
      const allMonths = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      return { typicalMonths: allMonths, monthlyExpectedRate: {}, provisionedRate };
    }
    return { typicalMonths: new Set(), monthlyExpectedRate: {}, provisionedRate };
  }

  const monthFrequency: Record<number, number> = {};
  const monthSums: Record<number, number[]> = {};
  for (let i = 1; i <= 12; i++) {
    monthFrequency[i] = 0;
    monthSums[i] = [];
  }

  let totalPayments = 0;
  recentYears.forEach(year => {
    const monthsPaidInfo = paymentsByYear[year];
    Object.keys(monthsPaidInfo).map(Number).forEach(m => {
      monthFrequency[m]++;
      totalPayments++;
      const sumForMonth = monthsPaidInfo[m].reduce((a, b) => a + b, 0);
      monthSums[m].push(sumForMonth);
    });
  });

  const avgPaymentsPerYear = totalPayments / numYears;
  const typicalMonths = new Set<number>();
  const monthlyExpectedRate: Record<number, number> = {};

  // Para FIIs muito consistentes
  if (isFii && avgPaymentsPerYear >= 10) {
    const lastYearMonths = paymentsByYear[recentYears[0]] || {};
    let lastKnownRate = 0;
    
    for (let m = 12; m >= 1; m--) {
      if (lastYearMonths[m] && lastYearMonths[m].length > 0) {
        // CUIDADO CONSERVADOR PARA FII: Desconto de 2%
        lastKnownRate = (lastYearMonths[m].reduce((a, b) => a + b, 0) / lastYearMonths[m].length) * 0.98;
        break;
      }
    }

    for (let i = 1; i <= 12; i++) {
      typicalMonths.add(i);
      monthlyExpectedRate[i] = lastKnownRate;
    }
    return { typicalMonths, monthlyExpectedRate, provisionedRate };
  }

  // Estatística de recorrência mínima: 50% dos últimos 4-5 anos ou 35% se < 3 anos.
  const thresholdRate = numYears >= 3 ? 0.49 : 0.35; 

  for (let m = 1; m <= 12; m++) {
    const rate = monthFrequency[m] / numYears;
    if (rate >= thresholdRate) {
      typicalMonths.add(m);
      const rates = monthSums[m];
      if (rates.length > 0) {
        // CUIDADO CONSERVADOR PARA AÇÕES: Desconto de 15% na média histórica real, por causa de eventuais altas sazonais/lucros não recorrentes
        const conservativeFactor = 0.85; 
        monthlyExpectedRate[m] = (rates.reduce((a, b) => a + b, 0) / rates.length) * conservativeFactor;
      }
    }
  }
  
  if (typicalMonths.size === 0) {
    const mostRecentYear = Math.max(...recentYears);
    const monthsPaidInRecent = paymentsByYear[mostRecentYear];
    if (monthsPaidInRecent) {
      Object.keys(monthsPaidInRecent).map(Number).forEach(m => {
        typicalMonths.add(m);
        monthlyExpectedRate[m] = monthsPaidInRecent[m].reduce((a, b) => a + b, 0) * 0.85;
      });
    }
  }

  return { typicalMonths, monthlyExpectedRate, provisionedRate };
}

