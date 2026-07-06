import { Transaction } from './portfolioService';

export interface DividendEvent {
  ticker: string;
  exDate: string; // YYYY-MM-DD
  paymentDate: string; // YYYY-MM-DD
  rate: number; // Value per share (BRL or mapped to BRL)
}

export interface PositionState {
  ticker: string;
  assetClass: string;
  quantity: number;
  totalInvested: number;
  realizedProfit: number;
  receivedDividends: number;
  averagePrice: number;
}

export interface AssetLedgerResult {
  positions: Record<string, PositionState>;
  events: Array<{
     date: string;
     type: 'COMPRA' | 'VENDA' | 'RENDIMENTO';
     ticker: string;
     amount: number;
     qty: number;
     price: number;
  }>;
}

export function buildPortfolioLedger(transactions: Transaction[], dividendHistory: DividendEvent[], targetDateMs?: number): AssetLedgerResult {
  const posMap: Record<string, PositionState> = {};
  const events: AssetLedgerResult['events'] = [];

  // Sort explicitly
  const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Create a timeline of daily states for each active ticket to check ex-dates
  // First, process user TXs sequentially and record all events
  
  const ensurePos = (ticker: string, assetClass: string) => {
    if (!posMap[ticker]) {
      posMap[ticker] = {
        ticker,
        assetClass,
        quantity: 0,
        totalInvested: 0,
        realizedProfit: 0,
        receivedDividends: 0,
        averagePrice: 0
      };
    }
  };

  sortedTx.forEach(t => {
    ensurePos(t.ticker, t.assetClass);
    const p = posMap[t.ticker];
    
    if (t.type === 'COMPRA') {
      p.quantity += t.quantity;
      p.totalInvested += (t.quantity * t.price) + t.costs;
      p.averagePrice = p.quantity > 0 ? p.totalInvested / p.quantity : 0;
      events.push({ date: t.date, type: 'COMPRA', ticker: t.ticker, amount: (t.quantity * t.price) + t.costs, qty: t.quantity, price: t.price });
    } else if (t.type === 'VENDA') {
      const pm = p.averagePrice;
      const sellAmount = (t.quantity * t.price);
      const sellProfit = sellAmount - (t.quantity * pm) - t.costs;
      
      p.realizedProfit += sellProfit;
      p.quantity -= t.quantity;
      p.totalInvested -= (t.quantity * pm); // Reduce proportionally
      if (p.quantity === 0) p.totalInvested = 0; // Handle precision issues
      p.averagePrice = p.quantity > 0 ? p.totalInvested / p.quantity : 0;
      events.push({ date: t.date, type: 'VENDA', ticker: t.ticker, amount: sellAmount, qty: t.quantity, price: t.price });
    } else if (t.type === 'RENDIMENTO') {
      p.receivedDividends += (t.quantity * t.price);
      events.push({ date: t.date, type: 'RENDIMENTO', ticker: t.ticker, amount: t.quantity * t.price, qty: t.quantity, price: t.price });
    }
  });

  const autoDivEvents: AssetLedgerResult['events'] = [];
  const paramNow = targetDateMs ?? new Date().getTime();
  
  dividendHistory.forEach(div => {
    const payTime = new Date(div.paymentDate).getTime();
    if (payTime > paramNow && targetDateMs) return; // Se for para gerar histórico retroativo, ignoramos proventos que não foram pagos no target date. Isso garante que a timeline seja puramente temporal no patrimônio.
    
    const dataComTimestamp = new Date(div.exDate).getTime() - 86400000;
    let qtyAtCom = 0;
    sortedTx.forEach(t => {
      if (t.ticker !== div.ticker) return;
      const tTime = new Date(t.date).getTime();
      if (tTime <= dataComTimestamp) {
         if (t.type === 'COMPRA') qtyAtCom += t.quantity;
         if (t.type === 'VENDA') qtyAtCom -= t.quantity;
      }
    });

    if (qtyAtCom > 0) {
      const totalAmount = qtyAtCom * div.rate;
      
      if (payTime <= paramNow) {
        ensurePos(div.ticker, 'Ações'); 
        posMap[div.ticker].receivedDividends += totalAmount;
      }
      
      autoDivEvents.push({
        date: div.paymentDate,
        type: 'RENDIMENTO',
        ticker: div.ticker,
        amount: totalAmount,
        qty: qtyAtCom,
        price: div.rate
      });
    }
  });
  
  // Combine all events
  autoDivEvents.forEach(e => {
    const isDup = events.some(manual => manual.type === 'RENDIMENTO' && manual.ticker === e.ticker && manual.date === e.date);
    if (!isDup && new Date(e.date).getTime() <= paramNow) {
      events.push(e);
    }
  });

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { positions: posMap, events };
}
