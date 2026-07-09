import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  LineChart, Line, CartesianGrid 
} from 'recharts';
import { 
  Wallet, Plus, TrendingUp, TrendingDown, Calendar as CalendarIcon, 
  ArrowUpCircle, ArrowDownCircle, Info, ChevronRight, ChevronDown, ChevronUp, X, AlertCircle, Layers, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Check, FileUp, Loader2, Search as SearchIcon, Activity as ActivityIcon, Users as UsersIcon, Globe as GlobeIcon
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetHoverMenu } from './shared/AssetHoverMenu';
import { AssetPrice } from './shared/AssetPrice';
import { useAuth } from '../contexts/AuthContext';
import { loadTransactions, saveTransactions, saveWalletSnapshot, Transaction, AssetClass } from '../services/portfolioService';
import { buildPortfolioLedger, DividendEvent } from '../services/portfolioEngine';
import { searchStockData } from '../services/stockService';
import { fetchFinanceData } from '../services/financeService';
import { analyzeDividendPattern } from '../services/dividendPatternService';
import { Trash2 } from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect';

// Cores das Classes de Ativos baseadas na nova identidade
const ASSET_COLORS: Record<AssetClass, string> = {
  'Ações': '#0284c7', // light blue-600
  'FIIs': '#00c17c',  // Verde Angra (Primary Identity)
  'Stocks': '#eab308', // yellow-500
  'REITs': '#8b5cf6', // violet-500
  'BDRs': '#f43f5e', // rose-500
  'ETFs': '#06b6d4', // cyan-500
  'Tesouro Direto': '#64748b', // slate-500
  'Renda Fixa': '#84cc16', // lime-500
  'Criptomoedas': '#d946ef', // fuchsia-500
};

// Dados Mockados para Demonstração do Funcional
const mockTransactions: Transaction[] = [
  { id: '1', ticker: 'BBAS3', date: '2025-01-15', type: 'COMPRA', assetClass: 'Ações', quantity: 100, price: 54.20, costs: 0.50 },
  { id: '2', ticker: 'MXRF11', date: '2025-02-10', type: 'COMPRA', assetClass: 'FIIs', quantity: 500, price: 10.30, costs: 0 },
  { id: '3', ticker: 'WEGE3', date: '2025-03-05', type: 'COMPRA', assetClass: 'Ações', quantity: 50, price: 38.45, costs: 0.50 },
  { id: '4', ticker: 'BTLG11', date: '2025-04-20', type: 'COMPRA', assetClass: 'FIIs', quantity: 100, price: 102.15, costs: 0 },
  { id: '5', ticker: 'AAPL', date: '2025-11-20', type: 'COMPRA', assetClass: 'Stocks', quantity: 10, price: 850.00, costs: 5.00 }, // Preço em BRL simulado
];

// Comportamento preditivo mockado (Em produção viria da API)
const dividendPatterns: Record<string, number[]> = {
  'BBAS3': [2, 3, 5, 6, 8, 9, 11, 12], // Paga nesses meses
  'WEGE3': [2, 3, 8],
  'MXRF11': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Mensal
  'BTLG11': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Mensal
  'AAPL': [2, 5, 8, 11], // Quarterly
}

export default function InvestmentPortfolio() {
  const { profile, updateProfile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'resumo' | 'proventos' | 'rentabilidade' | 'lancamentos' | 'calendario'>('resumo');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [compareList, setCompareList] = useState<string[]>([]);
  const [chartPeriod, setChartPeriod] = useState('12M');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Efeito para carregar transações do Firebase
  useEffect(() => {
    if (user) {
      loadTransactions(user.uid).then(data => {
        setTransactions(data.length > 0 ? data : []); // you can seed mockTransactions if empty, but instructions ask for empty wallet initially
      });
    } else {
      setTransactions([]);
    }
  }, [user]);

  // Estados Comparador de Benchmarks
  const [benchmarks, setBenchmarks] = useState<string[]>(['^BVSP']);
  const [benchmarkHistory, setBenchmarkHistory] = useState<Record<string, { date: string, price: number }[]>>({});
  
  useEffect(() => {
    // Load default benchmark history
    const loadDefaultBenchmark = async () => {
      try {
        const data = await searchStockData('^BVSP');
        if (data && data.historicalPrices) {
          setBenchmarkHistory(prev => ({
            ...prev,
            '^BVSP': data.historicalPrices
          }));
        }
      } catch (e) {
        console.log('Could not load ^BVSP');
      }
    };
    loadDefaultBenchmark();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);

  // Carregar análises salvas do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('simulagrana_portfolio_analyses');
    if (saved) {
      try {
        setSavedAnalyses(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar análises:', e);
      }
    }
  }, []);

  const saveAnalysis = () => {
    const name = prompt('Dê um nome para esta comparação:');
    if (!name) return;

    const newAnalysis = {
      id: Date.now(),
      name,
      benchmarks,
      benchmarkHistory
    };

    const updated = [...savedAnalyses, newAnalysis];
    setSavedAnalyses(updated);
    localStorage.setItem('simulagrana_portfolio_analyses', JSON.stringify(updated));
  };

  const loadAnalysis = (analysis: any) => {
    setBenchmarks(analysis.benchmarks);
    setBenchmarkHistory(analysis.benchmarkHistory);
  };

  const deleteAnalysis = (id: number) => {
    const updated = savedAnalyses.filter(a => a.id !== id);
    setSavedAnalyses(updated);
    localStorage.setItem('simulagrana_portfolio_analyses', JSON.stringify(updated));
  };

  // Índices e Indicadores fixos para busca
  const VIRTUAL_ASSETS = [
    { ticker: 'CDI', name: 'Certificado de Depósito Interbancário', type: 'indicator' },
    { ticker: 'IPCA', name: 'Índice de Preços ao Consumidor Amplo', type: 'indicator' },
    { ticker: 'SELIC', name: 'Taxa Selic Over', type: 'indicator' },
    { ticker: '^BVSP', name: 'Ibovespa', type: 'index' },
    { ticker: '^IFIX', name: 'IFIX (Índice de FIIs)', type: 'index' },
    { ticker: 'WALL-BRUNO', name: 'Carteira: Bruno Invest (Top 1% Follow)', type: 'wallet' },
    { ticker: 'WALL-MARIA', name: 'Carteira: Maria Dividendos (Top Follow)', type: 'wallet' }
  ];

  // Efeito para busca de sugestões (Autocomplemento)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.length < 1) {
        setSuggestions([]);
        return;
      }
      
      const q = searchQuery.toUpperCase();
      // Filtrar virtuais localmente
      const virtualMatch = VIRTUAL_ASSETS.filter(a => 
        a.ticker.includes(q) || a.name.toUpperCase().includes(q)
      );

      if (q.length < 2) {
        setSuggestions(virtualMatch);
        return;
      }

      try {
        const res = await fetch(`/api/fin/search/${encodeURIComponent(q)}`);
        if (res.ok) {
          const apiData = await res.json();
          // Unir e evitar duplicatas
          const combined = [...virtualMatch];
          apiData.forEach((item: any) => {
            if (!combined.some(c => c.ticker === item.ticker)) {
              combined.push(item);
            }
          });
          setSuggestions(combined.slice(0, 8));
        } else {
          setSuggestions(virtualMatch);
        }
      } catch (e) {
        setSuggestions(virtualMatch);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const addBenchmark = async (asset: any) => {
    const ticker = asset.ticker;
    if (benchmarks.includes(ticker)) return;
    
    setIsLoadingBenchmark(true);
    try {
      // Lógica para ativos virtuais/indicadores
      if (asset.type === 'indicator' || asset.type === 'wallet') {
        const mockHistory = Array.from({ length: 12 }, (_, i) => {
          let growth = 1;
          if (ticker === 'CDI') growth = 1.008; // ~10% aa
          if (ticker === 'IPCA') growth = 1.004; // ~5% aa
          if (ticker === 'SELIC') growth = 1.009;
          if (ticker === 'WALL-BRUNO') growth = 1.015;
          if (ticker === 'WALL-MARIA') growth = 1.012;
          
          const prevPrice = i === 0 ? 100 : 0; // base logic elsewhere or accumulate here
          return {
            date: `Month ${i+1}`,
            price: 100 * Math.pow(growth, i)
          };
        });
        setBenchmarkHistory(prev => ({ ...prev, [ticker]: mockHistory }));
        setBenchmarks(prev => [...prev, ticker]);
      } else {
        const res = await fetch(`/api/fin/${ticker}`);
        if (res.ok) {
          const data = await res.json();
          if (data.historicalPrices) {
            setBenchmarkHistory(prev => ({
              ...prev,
              [ticker]: data.historicalPrices
            }));
            setBenchmarks(prev => [...prev, ticker]);
          }
        }
      }
    } catch (e) {
      console.error('Erro ao carregar benchmark:', e);
    } finally {
      setIsLoadingBenchmark(false);
      setSearchQuery('');
      setSuggestions([]);
    }
  };

  const removeBenchmark = (ticker: string) => {
    setBenchmarks(prev => prev.filter(t => t !== ticker));
  };
  
  const BENCHMARK_COLORS = ['#64748b', '#00c17c', '#0284c7', '#eab308', '#f43f5e', '#8b5cf6'];

  // Estados Form Modal
  const [formType, setFormType] = useState<Transaction['type']>('COMPRA');
  const [formAssetClass, setFormAssetClass] = useState<AssetClass>('Ações');
  const [formTicker, setFormTicker] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [isImportingNote, setIsImportingNote] = useState(false);
  const [tickerSuggestions, setTickerSuggestions] = useState<any[]>([]);
  const [showTickerSuggestions, setShowTickerSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!formTicker || formTicker.length < 1 || !showTickerSuggestions) {
        setTickerSuggestions([]);
        return;
      }
      
      const q = formTicker.toUpperCase();
      try {
        const res = await fetch(`/api/fin/search/${encodeURIComponent(q)}`);
        if (res.ok) {
          const apiData = await res.json();
          setTickerSuggestions(apiData.slice(0, 5));
        } else {
          setTickerSuggestions([]);
        }
      } catch (e) {
        setTickerSuggestions([]);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [formTicker, showTickerSuggestions]);

  const handleImportNote = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, envie uma Nota de Corretagem em formato PDF.');
      return;
    }

    setIsImportingNote(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      const { parseBrokerNoteBase64, extractOperationsFromText } = await import('../services/brokerNoteService');
      const text = await parseBrokerNoteBase64(base64Data);
      const parsedOperations = await extractOperationsFromText(text);

      if (parsedOperations.length === 0) {
        alert('Nenhuma operação detectada nesta nota de corretagem.');
      } else {
        const newTrans: Transaction[] = parsedOperations.map(op => ({
          id: Math.random().toString(36).substring(7),
          date: op.data,
          ticker: op.ativo,
          assetClass: (op.ativo.endsWith('11') ? 'FIIs' : 'Ações') as AssetClass,
          type: op.tipo,
          quantity: op.quantidade,
          price: op.preco,
          costs: 0
        }));

        setTransactions(prev => {
          const updated = [...newTrans, ...prev];
          if (user) saveTransactions(user.uid, updated);
          return updated;
        });
        alert(`${newTrans.length} operação(ões) importada(s) com sucesso da nota!`);
      }
    } catch (e: any) {
      alert(`Erro ao importar nota: ${e.message}`);
    } finally {
      setIsImportingNote(false);
      if (event.target) event.target.value = '';
    }
  };

  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [liveDividends, setLiveDividends] = useState<Record<string, number>>({});
  const [realDividendHistory, setRealDividendHistory] = useState<DividendEvent[]>([]);

  // Atualizar preços dos ativos na carteira
  useEffect(() => {
    const fetchPrices = async () => {
      const uniqueTickers = Array.from(new Set(transactions.map(t => t.ticker)));
      if (uniqueTickers.length === 0) return;

      const newLivePrices: Record<string, number> = {};
      const newLiveDividends: Record<string, number> = {};
      const newDivHistory: DividendEvent[] = [];
      
      await Promise.all(uniqueTickers.map(async (ticker) => {
        try {
          const data = await searchStockData(ticker);
          if (data && data.price) {
            let p = data.price;
            let d = data.trailingAnnualDividendRate || 0;
            let currentUsdRate = 1;
            // Conversão de USD
            if (!data.currency?.includes('BRL') && !data.currency?.includes('R$')) {
              const fd = await fetchFinanceData();
              currentUsdRate = fd?.usd || 5.0;
              p = p * currentUsdRate;
              d = d * currentUsdRate;
            }
            newLivePrices[ticker] = p;
            newLiveDividends[ticker] = d;
            
            if (data.historicalPrices && data.historicalPrices.length > 0) {
              const adjustedHistory = data.historicalPrices.map((h: any) => ({
                ...h,
                price: h.price * currentUsdRate
              }));
              setBenchmarkHistory(prev => ({ ...prev, [ticker]: adjustedHistory }));
            }
            
            if (data.dividendsData?.cashDividends) {
               data.dividendsData.cashDividends.forEach((div: any) => {
                 let rate = div.rate || div.value || 0;
                 if (currentUsdRate > 1) rate = rate * currentUsdRate;
                 if (rate > 0) {
                   newDivHistory.push({
                     ticker,
                     exDate: (div.exDate || div.lastDatePrior || '').split('T')[0],
                     paymentDate: (div.paymentDate || div.exDate || div.lastDatePrior || '').split('T')[0],
                     rate
                   });
                 }
               });
            }
          }
        } catch {
          // fallback silencioso
        }
      }));
      if (Object.keys(newLivePrices).length > 0) {
        setLivePrices(prev => ({ ...prev, ...newLivePrices }));
      }
      if (Object.keys(newLiveDividends).length > 0) {
        setLiveDividends(prev => ({ ...prev, ...newLiveDividends }));
      }
      if (newDivHistory.length > 0) {
         setRealDividendHistory(prev => {
            const map = new Map(prev.map(h => [h.ticker + h.exDate, h]));
            newDivHistory.forEach(h => map.set(h.ticker + h.exDate, h));
            return Array.from(map.values());
         });
      }
    };
    
    // throttle
    const timeoutDescrip = setTimeout(() => fetchPrices(), 1000);
    return () => clearTimeout(timeoutDescrip);
  }, [transactions]);
  
  // Processamento da Carteira Atual Event-Driven
  const { positions, events } = useMemo(() => {
    const rawResult = buildPortfolioLedger(transactions, realDividendHistory);
    
    // Format into array for the display and inject livePrices
    const positionsArray = Object.values(rawResult.positions)
      .filter(p => p.quantity > 0 || p.realizedProfit !== 0 || p.receivedDividends !== 0)
      .map(p => {
        const currentPrice = livePrices[p.ticker] || p.averagePrice;
        const currentTotal = p.quantity * currentPrice;
        const profit = (currentTotal - p.totalInvested) + p.realizedProfit + p.receivedDividends;
        const unrealizedProfit = currentTotal - p.totalInvested;
        const profitPerc = p.totalInvested > 0 ? (profit / p.totalInvested) * 100 : 0;
        
        return {
          ...p,
          currentPrice,
          currentTotal,
          profit,
          unrealizedProfit,
          profitPerc
        };
      });
      
    // Sort events inside out
    return { positions: positionsArray, events: rawResult.events };
  }, [transactions, realDividendHistory, livePrices]);

  const totalPatrimony = positions.reduce((acc, p) => acc + p.currentTotal, 0);
  const totalInvested = positions.reduce((acc, p) => acc + p.totalInvested, 0);
  const totalRealizedProfit = positions.reduce((acc, p) => acc + (p.realizedProfit || 0), 0);
  const totalReceivedDividends = positions.reduce((acc, p) => acc + (p.receivedDividends || 0), 0);
  const generalProfit = (totalPatrimony - totalInvested) + totalRealizedProfit + totalReceivedDividends;
  const generalProfitPerc = totalInvested > 0 ? (generalProfit / totalInvested) * 100 : 0;
  
  const chartData = useMemo(() => {
    const historicalSeries: any[] = [];
    
    // We need 13 months of states to calculate 12 months of TWR (Time-Weighted Returns) using Quotas
    const monthsData: Array<{
      year: number; month: number; monthLabel: string; histLabel: string;
      pastPositions: Record<string, any>;
    }> = [];
    
    for (let i = 12; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const targetDate = new Date(year, month + 1, 0).getTime();
      const pastTxs = transactions.filter(t => new Date(t.date).getTime() <= targetDate);
      const { positions: pastPositions } = buildPortfolioLedger(pastTxs, realDividendHistory, targetDate);
      
      const histLabel = `${String(month + 1).padStart(2, '0')}/${year}`;
      const monthLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][month];
      
      monthsData.push({
        year, month, monthLabel, histLabel, pastPositions
      });
    }

    let quotaPrice = 100; // Base 100 for the portfolio Return
    
    // Calculate month-over-month pure market performance
    for (let i = 1; i < monthsData.length; i++) {
        const prevMonth = monthsData[i-1];
        const currMonth = monthsData[i];
        
        let prevPortfolioValueAtPrevPrices = 0;
        let prevPortfolioValueAtCurrPrices = 0;
        
        // Evaluate prevMonth's positions against its own prices AND currMonth's prices
        // This completely isolates market performance from cash flows within currMonth
        Object.values(prevMonth.pastPositions).forEach(p => {
           if (p.quantity <= 0) return;
           const history = benchmarkHistory[p.ticker];
           
           let prevPrice = p.averagePrice || 0;
           let currPrice = prevPrice;
           
           if (history && history.length > 0) {
              const histPrev = history.find((h: any) => h.date === prevMonth.histLabel);
              if (histPrev) prevPrice = histPrev.price;
              
              const histCurr = history.find((h: any) => h.date === currMonth.histLabel);
              if (histCurr) {
                currPrice = histCurr.price;
              } else if (i === monthsData.length - 1) { // Current live month fallback
                currPrice = livePrices[p.ticker] || prevPrice;
              } else {
                currPrice = prevPrice;
              }
           } else {
              prevPrice = livePrices[p.ticker] || p.averagePrice || 1;
              currPrice = prevPrice;
           }
           
           prevPortfolioValueAtPrevPrices += p.quantity * prevPrice;
           prevPortfolioValueAtCurrPrices += p.quantity * currPrice;
        });
        
        let returnFactor = 1;
        if (prevPortfolioValueAtPrevPrices > 0) {
           returnFactor = prevPortfolioValueAtCurrPrices / prevPortfolioValueAtPrevPrices;
        }
        
        quotaPrice = quotaPrice * returnFactor;
        
        const entry: any = { name: currMonth.monthLabel, carteira: quotaPrice };
        
        // Match benchmarks starting exact 12 months ago
        benchmarks.forEach(ticker => {
            const history = benchmarkHistory[ticker] || (ticker === '^BVSP' ? benchmarkHistory['^BVSP'] : null);
            if (history && history.length > 0) {
              const basePoint = history.find((h:any) => h.date === monthsData[0].histLabel) || history[0];
              const baseVal = basePoint?.price || 100;
              const histPoint = history.find((h: any) => h.date === currMonth.histLabel);
              const currentVal = histPoint ? histPoint.price : (history[history.length - 1]?.price || 100);
              entry[ticker] = baseVal > 0 ? (currentVal / baseVal) * 100 : 100;
            } else {
              entry[ticker] = 100;
            }
        });
        
        historicalSeries.push(entry);
    }
    
    // If portfolio is entirely empty, just draw a flat 100 line.
    if (historicalSeries.every((s: any) => s.carteira === 100) && transactions.length === 0) {
       historicalSeries.forEach((s: any) => s.carteira = 100);
    }
    
    return historicalSeries;
  }, [transactions, benchmarks, benchmarkHistory, realDividendHistory, livePrices]);

  const patrimonyData = useMemo(() => {
    const historicalSeries: any[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][month];
      
      const targetDate = new Date(year, month + 1, 0).getTime();
      const pastTxs = transactions.filter(t => new Date(t.date).getTime() <= targetDate);
      
      const { positions: pastPositions } = buildPortfolioLedger(pastTxs, realDividendHistory, targetDate);
      
      let investedAtTime = 0;
      let realizedProfitAtTime = 0;
      let portfoliomonthValue = 0;
      const histLabel = `${String(month + 1).padStart(2, '0')}/${year}`;

      Object.values(pastPositions).forEach(p => {
        investedAtTime += p.totalInvested;
        realizedProfitAtTime += p.realizedProfit + p.receivedDividends;
        
        if (p.quantity > 0) {
          const history = benchmarkHistory[p.ticker];
          let price = p.averagePrice || 0;
          if (history && history.length > 0) {
            const histPoint = history.find((h: any) => h.date === histLabel);
            if (i === 0) {
              price = livePrices[p.ticker] || histPoint?.price || price;
            } else {
              price = histPoint ? histPoint.price : (livePrices[p.ticker] || price);
            }
          } else {
            price = livePrices[p.ticker] || price;
          }
          portfoliomonthValue += p.quantity * price;
        }
      });
      
      const ganho = (portfoliomonthValue - investedAtTime) + realizedProfitAtTime;
      
      historicalSeries.push({
         name: monthLabel,
         aplicado: investedAtTime,
         ganho: ganho
      });
    }
    return historicalSeries;
  }, [transactions, benchmarkHistory, livePrices, realDividendHistory]);

  const proventosData = useMemo(() => {
    // Construir métricas dos proventos
    const proventosPorMes: Record<string, { recebidos: number, aReceber: number }> = {};
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const histLabel = `${String(month + 1).padStart(2, '0')}/${year}`;
      proventosPorMes[histLabel] = { recebidos: 0, aReceber: 0 };
    }

    events.forEach(t => {
      if (t.type === 'RENDIMENTO') {
        const [yyyy, mm] = t.date.split('-');
        if (yyyy && mm) {
          const histLabel = `${mm}/${yyyy}`;
          if (proventosPorMes[histLabel]) {
            // Check if paymentDate is in the future
            if (new Date(t.date).getTime() > new Date().getTime()) {
               proventosPorMes[histLabel].aReceber += t.amount || 0;
            } else {
               proventosPorMes[histLabel].recebidos += t.amount || 0;
            }
          }
        }
      }
    });

    return Object.entries(proventosPorMes).map(([label, data]) => {
       const [mesStr, anoStr] = label.split('/');
       const monthIdx = parseInt(mesStr) - 1;
       const monthLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][monthIdx];
       return {
         mes: `${monthLabel}/${anoStr}`,
         recebidos: data.recebidos,
         aReceber: data.aReceber
       };
    });
  }, [events]);

  const dynamicPatterns = useMemo(() => {
    const patterns: Record<string, { typicalMonths: Set<number>, monthlyExpectedRate: Record<number, number>, provisionedRate: Record<number, number>, firstPurchaseDate: Date | null }> = {};
    
    // Agrupa histórico real da API por ticker
    const historyByTicker: Record<string, any[]> = {};
    realDividendHistory.forEach(h => {
      const cleanTicker = h.ticker.replace('.SA', '');
      if (!historyByTicker[cleanTicker]) historyByTicker[cleanTicker] = [];
      historyByTicker[cleanTicker].push({
        exDate: h.exDate,
        paymentDate: h.paymentDate,
        lastDatePrior: h.exDate || h.paymentDate,
        rate: h.rate
      });
    });

    // Encontra a data da primeira compra (earliest purchase date)
    const firstPurchaseByTicker: Record<string, Date> = {};
    transactions.forEach(t => {
      if (t.type === 'COMPRA') {
        const cleanTicker = t.ticker.replace('.SA', '');
        const currentEarliest = firstPurchaseByTicker[cleanTicker];
        const tDate = new Date(t.date);
        if (!currentEarliest || tDate < currentEarliest) {
          firstPurchaseByTicker[cleanTicker] = tDate;
        }
      }
    });

    // Análise preditiva por ativo na carteira
    positions.forEach(p => {
      const cleanTicker = p.ticker.replace('.SA', '');
      const h = historyByTicker[cleanTicker] || [];
      const isFii = p.assetClass === 'FIIs' || cleanTicker.endsWith('11');
      
      let { typicalMonths, monthlyExpectedRate, provisionedRate } = analyzeDividendPattern(p.ticker, h, isFii);
      patterns[cleanTicker] = {
        typicalMonths,
        monthlyExpectedRate,
        provisionedRate,
        firstPurchaseDate: firstPurchaseByTicker[cleanTicker] || null
      };
    });

    // Injetar histórico de recebimentos reais da carteira (ajuda para casos em que a API não tenha histórico ou seja novo)
    events.forEach(e => {
      if (e.type === 'RENDIMENTO') {
        const date = new Date(e.date);
        if (!isNaN(date.getTime())) {
          const m = date.getMonth() + 1;
          const cleanTicker = e.ticker.replace('.SA', '');
          if (!patterns[cleanTicker]) {
             patterns[cleanTicker] = { typicalMonths: new Set(), monthlyExpectedRate: {}, provisionedRate: {}, firstPurchaseDate: firstPurchaseByTicker[cleanTicker] || null };
          }
          if (patterns[cleanTicker].typicalMonths.size === 0) {
             patterns[cleanTicker].typicalMonths.add(m);
             patterns[cleanTicker].monthlyExpectedRate[m] = e.amount / Math.max(1, (positions.find(po => po.ticker.replace('.SA','') === cleanTicker)?.quantity || 1));
          }
        }
      }
    });

    // Fallback: se ainda estiver vazio, usamos mocks antigos se existirem
    Object.entries(dividendPatterns).forEach(([ticker, months]) => {
      const cleanTicker = ticker.replace('.SA', '');
      if (!patterns[cleanTicker] || patterns[cleanTicker].typicalMonths.size === 0) {
        if (!patterns[cleanTicker]) {
          patterns[cleanTicker] = { typicalMonths: new Set(), monthlyExpectedRate: {}, provisionedRate: {}, firstPurchaseDate: firstPurchaseByTicker[cleanTicker] || null };
        }
        months.forEach(m => patterns[cleanTicker].typicalMonths.add(m));
      }
    });

    return patterns;
  }, [realDividendHistory, events, positions, transactions]);

  // Pie Chart Data (Asset Allocation)
  const allocationByCategory = useMemo(() => {
    const alloc: Record<string, number> = {};
    positions.forEach(p => {
      alloc[p.assetClass] = (alloc[p.assetClass] || 0) + p.currentTotal;
    });
    return Object.entries(alloc).map(([key, value]) => ({ name: key, value }));
  }, [positions]);

  const groupedPositions = useMemo(() => {
    const groups: Partial<Record<AssetClass, typeof positions>> = {};
    positions.forEach(p => {
      if (!groups[p.assetClass]) groups[p.assetClass] = [];
      groups[p.assetClass]!.push(p);
    });
    return groups;
  }, [positions]);

  useEffect(() => {
    if (!user || profile?.walletVisibility === 'private' || positions.length === 0) return;
    
    // Construct snapshot
    const snapshot = {
      name: profile?.name ? `Carteira de ${profile.name}` : "Carteira Principal",
      totalValue: totalPatrimony,
      totalRentability: generalProfitPerc > 0 ? `+${generalProfitPerc.toFixed(2)}%` : `${generalProfitPerc.toFixed(2)}%`,
      openPatrimony: 100,
      assets: positions.map(p => ({
         ticker: p.ticker,
         name: p.ticker, 
         category: p.assetClass,
         percentage: totalPatrimony > 0 ? Number(((p.currentTotal / totalPatrimony) * 100).toFixed(2)) : 0,
         quantity: p.quantity,
         averagePrice: p.averagePrice,
         currentPrice: p.currentPrice,
         rentability: p.profitPerc ? Number(p.profitPerc.toFixed(2)) : 0,
         dailyVariation: 0, 
         dividendsPaid: p.receivedDividends,
         dividendsAwaiting: 0 
      })),
      history: chartData.map(d => ({ date: d.name, value: Number(d.carteira.toFixed(2)), benchmark: 100 })),
      dividends: proventosData.map(d => ({
         month: d.mes,
         amount: d.recebidos,
         yield: totalPatrimony > 0 ? Number(((d.recebidos / totalPatrimony) * 100).toFixed(2)) : 0
      }))
    };
    
    const timeout = setTimeout(() => {
      saveWalletSnapshot(user.uid, snapshot).catch(console.error);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [user, profile?.walletVisibility, profile?.name, positions, totalPatrimony, generalProfitPerc, chartData, proventosData]);

  const toggleCategory = (cat: string) => setExpandedCategories(prev => ({...prev, [cat]: !prev[cat]}));
  
  const toggleCompare = (ticker: string) => {
    setCompareList(prev => {
      if (prev.includes(ticker)) return prev.filter(t => t !== ticker);
      if (prev.length >= 4) return prev;
      return [...prev, ticker];
    });
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(7),
      date: formDate,
      ticker: formTicker.toUpperCase(),
      assetClass: formAssetClass,
      type: formType,
      quantity: Number(formQty),
      price: Number(formPrice),
      costs: 0
    };
    
    const updatedTransactions = [newTx, ...transactions];
    setTransactions(updatedTransactions);
    setIsAddModalOpen(false);
    
    // Save to Firebase
    if (user) {
      try {
        await saveTransactions(user.uid, updatedTransactions);
      } catch (err) {
        console.error("Falha ao salvar transação:", err);
      }
    }
    
    // Reset form
    setFormTicker('');
    setFormQty('');
    setFormPrice('');
  };
  
  const handleTickerBlur = async () => {
    if (!formTicker) return;
    try {
      const stockData = await searchStockData(formTicker.toUpperCase());
      if (stockData && stockData.price) {
        let priceToSet = stockData.price;
        let newIsStock = formAssetClass === 'Stocks';
        // Auto-select asset class based on string ends
        if (formTicker.toUpperCase().endsWith('11')) {
           setFormAssetClass('FIIs');
           newIsStock = false;
        } else if (stockData.currency?.includes('BRL') || stockData.currency?.includes('R$') || formTicker.toUpperCase().endsWith('.SA')) {
           setFormAssetClass('Ações');
           newIsStock = false;
        } else if (stockData.currency && stockData.currency.includes('USD')) {
           setFormAssetClass('Stocks');
           newIsStock = true;
        }

        // Se for Stock internacional e a cotação não for em BRL, usa a cotação oficial
        if (newIsStock && !stockData.currency?.includes('BRL') && !stockData.currency?.includes('R$')) {
           const financeData = await fetchFinanceData();
           priceToSet = stockData.price * (financeData?.usd || 5.0); 
        }
        setFormPrice(priceToSet.toString());
      }
    } catch (e) {
      console.log('Preço não encontrado automaticamente');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja apagar este lançamento?')) return;
    
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    
    try {
      await saveTransactions(user.uid, updatedTransactions);
    } catch(err) {
      console.error("Falha ao remover transação", err);
    }
  };

  const handleSyncAppliedValue = async () => {
    if (!user) return;
    if (!window.confirm('Atenção: Isso irá apagar todo o seu histórico de lançamentos e recriar as posições atuais baseado nas cotações REAIS em tempo real. Esta ação sincroniza o Valor Aplicado com o Saldo Atual e Corrige a Rentabilidade para ZERO na data de hoje. Deseja continuar?')) return;
    
    try {
      const newTransactions: Transaction[] = [];
      const now = new Date();
      // Set to today's date so historical past becomes zero, avoiding huge negative spikes in history.
      const syncDate = now.toISOString().split('T')[0];

      await Promise.all(positions.map(async (pos, i) => {
        if (pos.quantity <= 0) return;
        
        let currentPriceValue = livePrices[pos.ticker] || pos.averagePrice || 1;
        try {
          const res = await fetch(`/api/fin/${pos.ticker}`);
          if (res.ok) {
             const data = await res.json();
             let price = data.price || data.regularMarketPrice || currentPriceValue;
             // US stock conversion fallback
             if (data.currency && !data.currency.includes('BRL') && !data.currency.includes('R$')) {
                const fd = await fetchFinanceData();
                price = price * (fd?.usd || 5.0);
             }
             currentPriceValue = price;
          }
        } catch(e) {
          console.warn('Sync failed to fetch live price for', pos.ticker);
        }

        newTransactions.push({
          id: `sync_${now.getTime()}_${i}`,
          ticker: pos.ticker,
          date: syncDate,
          type: 'COMPRA',
          assetClass: pos.assetClass as AssetClass,
          quantity: pos.quantity,
          price: currentPriceValue,
          costs: 0
        });
      }));

      setTransactions(newTransactions);
      await saveTransactions(user.uid, newTransactions);
      alert('Valor Aplicado sincronizado com sucesso utilizando cotações reais! O histórico foi recalculado.');
    } catch (error) {
      console.error('Erro ao sincronizar Valor Aplicado:', error);
      alert('Erro ao sincronizar. Tente novamente.');
    }
  };

  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 w-full animate-in fade-in duration-500">
      
      {/* Top Mobile-friendly Navigation */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex overflow-x-auto gap-2 scrollbar-none snap-x sticky top-0 z-30 shadow-md">
        <button onClick={() => setActiveTab('resumo')} className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold whitespace-nowrap snap-center transition-colors", activeTab === 'resumo' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>Resumo</button>
        <button onClick={() => setActiveTab('proventos')} className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold whitespace-nowrap snap-center transition-colors", activeTab === 'proventos' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>Proventos</button>
        <button onClick={() => setActiveTab('rentabilidade')} className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold whitespace-nowrap snap-center transition-colors", activeTab === 'rentabilidade' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>Rentabilidade</button>
        <button onClick={() => setActiveTab('lancamentos')} className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold whitespace-nowrap snap-center transition-colors", activeTab === 'lancamentos' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>Lançamentos</button>
        <button onClick={() => setActiveTab('calendario')} className={cn("px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold whitespace-nowrap snap-center transition-colors flex items-center gap-1.5 sm:gap-2", activeTab === 'calendario' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}><CalendarIcon className="w-3.5 h-3.5 sm:w-4 h-4"/> Preditivo</button>
        
        <div className="flex-1" />
        <label className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg sm:rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm shrink-0 cursor-pointer shadow-lg shadow-primary/20 transition-all">
          {isImportingNote ? <Loader2 className="w-3.5 h-3.5 sm:w-4 h-4 animate-spin" /> : <FileUp className="w-3.5 h-3.5 sm:w-4 h-4" />}
          <span className="hidden xs:inline">Importar Nota</span>
          <span className="xs:hidden">Nota</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleImportNote} disabled={isImportingNote} />
        </label>
        <button onClick={() => setIsAddModalOpen(true)} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg sm:rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm shrink-0">
          <Plus className="w-3.5 h-3.5 sm:w-4 h-4" /> <span className="hidden xs:inline">Lançamento</span>
        </button>
      </div>

      {/* GLOBAL INDICATORS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-border shadow-sm relative overflow-hidden">
          <p className="text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">Patrimônio</p>
          <h3 className="text-lg sm:text-2xl font-black text-foreground truncate">{formatCurrency(totalPatrimony)}</h3>
          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
            <span className={cn("text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md", generalProfit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
              {generalProfit >= 0 ? '+' : ''}{generalProfitPerc.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-border shadow-sm relative overflow-hidden">
          <p className="text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">Lucro Total</p>
          <h3 className="text-lg sm:text-2xl font-black text-emerald-500 truncate">+{formatCurrency(generalProfit)}</h3>
          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
             <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Desde início</span>
          </div>
        </div>

        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-border shadow-sm relative overflow-hidden">
          <p className="text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">Proventos Recebidos</p>
          <h3 className="text-lg sm:text-2xl font-black text-primary truncate">{formatCurrency(positions.reduce((acc, p) => acc + p.receivedDividends, 0))}</h3>
          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
             <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Automático + Manuais</span>
          </div>
        </div>

        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-border shadow-sm relative overflow-hidden flex flex-col justify-between">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className={cn("w-2 h-2 rounded-full", (profile?.walletVisibility && profile.walletVisibility !== 'private') ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
               <p className="text-muted-foreground text-[9px] sm:text-xs font-bold uppercase tracking-wider">Carteira {(profile?.walletVisibility && profile.walletVisibility !== 'private') ? 'Pública' : 'Privada'}</p>
             </div>
             <button 
               onClick={() => updateProfile({ walletVisibility: (!profile?.walletVisibility || profile.walletVisibility === 'private') ? 'public' : 'private' })}
               className={cn(
                 "w-10 h-5 rounded-full transition-all relative",
                 (profile?.walletVisibility && profile.walletVisibility !== 'private') ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
               )}
             >
               <motion.div 
                 animate={{ x: (profile?.walletVisibility && profile.walletVisibility !== 'private') ? 22 : 2 }}
                 transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                 className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
               />
             </button>
           </div>
           <div className="mt-2">
             <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
               {(profile?.walletVisibility && profile.walletVisibility !== 'private')
                 ? "Sua carteira está visível para outros usuários." 
                 : "Sua carteira está oculta da comunidade."}
             </p>
             <button 
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'perfil');
                window.history.pushState({}, '', url.toString());
                window.dispatchEvent(new Event('popstate'));
              }}
              className="text-[10px] text-primary font-bold hover:underline mt-1"
             >
               Privacidade Avançada
             </button>
           </div>
        </div>
        
        {/* Ad-hoc Mobile entry for secondary highlight if needed */}
        <div className="sm:hidden bg-card border border-border rounded-xl p-4 flex flex-col justify-center items-center text-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase text-primary">Live Data</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">Sincronizado</p>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Allocation */}
          <div className="lg:col-span-1 bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-6">Alocação por Categoria</h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationByCategory}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {allocationByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name as AssetClass] || '#64748b'} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-xs text-muted-foreground font-bold uppercase">Patrimônio</span>
                <span className="text-lg font-black text-foreground">{formatCurrency(totalPatrimony)}</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {allocationByCategory.map(cat => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ASSET_COLORS[cat.name as AssetClass] || '#ccc' }} />
                    <span className="text-sm font-medium text-foreground/80">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">{((cat.value / totalPatrimony) * 100).toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-6">Meus Ativos ({positions.length})</h3>
            <div className="overflow-y-auto pr-2 space-y-6 flex-1">
              {Object.entries(groupedPositions).map(([catName, posList]) => {
                const catTotal = posList!.reduce((acc, p) => acc + p.currentTotal, 0);
                const catInvested = posList!.reduce((acc, p) => acc + p.totalInvested, 0);
                const catProfit = catTotal - catInvested;
                const catProfitPerc = catInvested > 0 ? (catProfit / catInvested) * 100 : 0;
                const isExpanded = expandedCategories[catName];
                
                return (
                  <div key={catName} className="bg-background/50 backdrop-blur-sm border border-border rounded-3xl p-5 shadow-sm transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCategory(catName)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-80" style={{ backgroundColor: `${ASSET_COLORS[catName as AssetClass] || '#ccc'}20` }}>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ASSET_COLORS[catName as AssetClass] || '#ccc' }} />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground flex items-center gap-2">{catName} <span className="text-xs font-normal text-muted-foreground">({posList!.length} ativos)</span></h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <span className="font-black text-foreground">{formatCurrency(catTotal)}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>
                    
                    {!isExpanded && (
                      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm border-t border-border pt-4 cursor-pointer" onClick={() => toggleCategory(catName)}>
                         <div>
                           <span className="text-slate-500 text-xs font-medium block mb-1">Valor total</span>
                           <span className="font-bold text-foreground">{formatCurrency(catTotal)}</span>
                         </div>
                         <div>
                           <span className="text-slate-500 text-xs font-medium block mb-1">Variação</span>
                           <span className={cn("font-bold flex items-center gap-1", catProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                             {catProfit >= 0 ? '+' : ''}{formatCurrency(catProfit)}
                           </span>
                         </div>
                         <div>
                           <span className="text-slate-500 text-xs font-medium block mb-1">Rentabilidade</span>
                           <span className={cn("font-bold flex items-center gap-1", catProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                             {catProfit >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                             {catProfitPerc.toFixed(2)}%
                           </span>
                         </div>
                         <div>
                           <span className="text-slate-500 text-xs font-medium block mb-1">% na Carteira</span>
                           <span className="font-bold text-foreground">{((catTotal / totalPatrimony) * 100).toFixed(2)}% / {(100/Object.keys(groupedPositions).length).toFixed(0)}%</span>
                         </div>
                      </div>
                    )}
                    
                    {isExpanded && (
                      <div className="mt-4 sm:mt-6 pt-0 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse mt-4">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-700/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500">
                                <th className="pb-3 font-black w-1/4">Ativo</th>
                                <th className="pb-3 font-black text-right">Preço Médio</th>
                                <th className="pb-3 font-black text-right">Preço Atual</th>
                                <th className="pb-3 font-black text-right">Valor Total</th>
                                <th className="pb-3 font-black text-right">Rentabilidade</th>
                                <th className="pb-3 font-black text-center w-24">Comparar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {posList!.map((pos, idx) => (
                                <tr key={`${pos.ticker}-${idx}`} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                        <img 
                                          src={`https://s3-symbol-logo.tradingview.com/${pos.ticker.replace('.SA', '').toLowerCase()}--big.svg`}
                                          alt={pos.ticker}
                                          className="w-full h-full object-contain p-1"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (!target.src.includes('brapi.dev')) {
                                              target.src = `https://brapi.dev/favicon.ico?ticker=${pos.ticker}`;
                                            } else {
                                              target.src = 'https://picsum.photos/seed/wallet/40/40';
                                            }
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <div className="font-bold text-foreground text-sm">
                                          <AssetHoverMenu ticker={pos.ticker}>{pos.ticker}</AssetHoverMenu>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium">{pos.quantity} cotas</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 text-right tabular-nums text-xs font-medium dark:text-slate-300 text-slate-600">
                                    <AssetPrice price={pos.totalInvested / pos.quantity} ticker={pos.ticker} isAlreadyBrl />
                                  </td>
                                  <td className="py-4 text-right tabular-nums text-xs font-medium dark:text-slate-300 text-slate-600">
                                    <AssetPrice price={pos.currentPrice} ticker={pos.ticker} isAlreadyBrl />
                                  </td>
                                  <td className="py-4 text-right tabular-nums text-xs font-bold dark:text-slate-100 text-slate-900">
                                    <AssetPrice price={pos.currentTotal} ticker={pos.ticker} isAlreadyBrl />
                                  </td>
                                  <td className="py-4 text-right">
                                    <div className={cn("text-xs font-bold tabular-nums", pos.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                      {pos.profit >= 0 ? '+' : ''}{formatCurrency(pos.profit)}
                                    </div>
                                    <div className={cn("text-[10px] font-black flex items-center justify-end gap-1 mt-0.5", pos.profit >= 0 ? "text-emerald-500/70" : "text-rose-500/70")}>
                                      {pos.profit >= 0 ? <TrendingUp className="w-2.5 h-2.5"/> : <TrendingDown className="w-2.5 h-2.5"/>}
                                      {pos.profitPerc.toFixed(2)}%
                                    </div>
                                  </td>
                                  <td className="py-4 text-center">
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); toggleCompare(pos.ticker); }}
                                       className={cn("p-1.5 rounded-lg border transition-all inline-flex items-center justify-center", 
                                        compareList.includes(pos.ticker) ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-300 dark:border-slate-600 text-slate-400 hover:text-indigo-500 hover:border-indigo-500")}
                                     >
                                       {compareList.includes(pos.ticker) ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                                     </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden space-y-3 mt-4">
                          {posList!.map((pos, idx) => (
                            <div key={`${pos.ticker}-${idx}`} className="bg-muted/30 border border-border rounded-xl p-3 flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                    <img 
                                      src={`https://s3-symbol-logo.tradingview.com/${pos.ticker.replace('.SA', '').toLowerCase()}--big.svg`}
                                      alt={pos.ticker}
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (!target.src.includes('brapi.dev')) {
                                          target.src = `https://brapi.dev/favicon.ico?ticker=${pos.ticker}`;
                                        } else {
                                          target.src = 'https://picsum.photos/seed/wallet/40/40';
                                        }
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <span className="font-black text-foreground text-sm block">
                                      <AssetHoverMenu ticker={pos.ticker}>{pos.ticker}</AssetHoverMenu>
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block font-bold mt-0.5">{pos.quantity} cotas • PM: <AssetPrice price={pos.totalInvested / pos.quantity} ticker={pos.ticker} isAlreadyBrl /></span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-black text-foreground block"><AssetPrice price={pos.currentTotal} ticker={pos.ticker} isAlreadyBrl /></span>
                                  <div className={cn("text-[10px] font-black flex items-center justify-end gap-1", pos.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                    {pos.profit >= 0 ? '+' : ''}{pos.profitPerc.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                  Preço Atual: <span className="text-foreground"><AssetPrice price={pos.currentPrice} ticker={pos.ticker} isAlreadyBrl /></span>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleCompare(pos.ticker); }}
                                  className={cn("px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest transition-all", 
                                    compareList.includes(pos.ticker) ? "bg-indigo-500 border-indigo-500 text-white" : "border-border text-muted-foreground")}
                                >
                                  {compareList.includes(pos.ticker) ? 'Comparando' : 'Comparar'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {positions.length === 0 && (
                 <div className="text-center py-12 text-slate-500">Nenhum ativo na carteira ainda. O primeiro aporte é o mais importante!</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'proventos' && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h3 className="text-xl font-bold text-foreground">Evolução de Proventos</h3>
            <div className="flex items-center gap-2">
              <CustomSelect 
                value="12 meses"
                onChange={() => {}}
                options={[
                  { value: '12 meses', label: '12 meses' },
                  { value: '6 meses', label: '6 meses' },
                  { value: 'Max', label: 'Max' }
                ]}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Recebidos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900"></div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">A receber</span>
            </div>
          </div>

          <div className="h-64 sm:h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={proventosData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)} 
                  contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontSize: '11px' }} 
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="recebidos" name="Recebidos" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="aReceber" name="A Receber" stackId="a" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'rentabilidade' && (
        <div className="space-y-6 w-full animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Comparador de Ativos (if anything is selected) */}
          <AnimatePresence>
            {compareList.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 overflow-hidden relative">
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <LineChartIcon className="w-5 h-5 text-indigo-400" /> Comparador de Ativos
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm justify-center">
                    {compareList.map((ticker, i) => {
                       const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
                       return (
                         <div key={`${ticker}-${i}`} className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }}></div>
                           <span className="font-bold text-white text-xs">{ticker}</span>
                           <button onClick={() => toggleCompare(ticker)} className="ml-1 text-slate-400 hover:text-white"><X className="w-3 h-3"/></button>
                         </div>
                       )
                    })}
                  </div>
                </div>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `${val.toFixed(0)}`} />
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }} formatter={(val: number) => [`${val.toFixed(2)}`, '']} />
                      {compareList.map((ticker, i) => {
                         const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
                         return <Line key={`${ticker}-${i}`} type="monotone" dataKey={ticker} stroke={colors[i]} strokeWidth={3} dot={{ r: 4, fill: colors[i], strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Evolução do Patrimônio</h3>
              <div className="flex gap-4 w-28">
                <CustomSelect 
                  value="12M"
                  onChange={() => {}}
                  options={[
                    { value: '12M', label: '12M' },
                    { value: '6M', label: '6M' },
                    { value: 'YTD', label: 'YTD' }
                  ]}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-slate-500 font-medium">Aplicado</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-300 dark:bg-emerald-700"></div><span className="text-xs text-slate-500 font-medium">Ganho</span></div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patrimonyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${(Math.abs(val)/1000).toFixed(0)}k`} dx={-10} />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)} 
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff' }} 
                    cursor={{fill: 'transparent'}}
                  />
                  <Bar dataKey="aplicado" name="Valor Aplicado" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="ganho" name="Ganho de Capital" stackId="a" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Carteira vs Benchmarks</h3>
                <p className="text-sm text-muted-foreground mt-1">Comparação normalizada (Base 100) de rentabilidade acumulada.</p>
              </div>

              <div className="flex bg-muted/50 p-1 rounded-xl w-fit">
                {['1M', '6M', '1Y', 'MAX'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                      chartPeriod === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              
              <div className="relative w-full md:w-72">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Adicionar benchmark (Ativo, Índice...)"
                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isLoadingBenchmark && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                    >
                      {suggestions.map((s, idx) => (
                        <button 
                          key={`${s.ticker}-${idx}`}
                          onClick={() => addBenchmark(s)}
                          className="w-full p-3 hover:bg-muted flex items-center justify-between text-left transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              s.type === 'indicator' ? "bg-amber-500/10 text-amber-500" : 
                              s.type === 'wallet' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              {s.type === 'indicator' ? <ActivityIcon className="w-4 h-4" /> : 
                               s.type === 'wallet' ? <UsersIcon className="w-4 h-4" /> : <GlobeIcon className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground">{s.ticker}</div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{s.name}</div>
                            </div>
                          </div>
                          <Plus className="w-3 h-3 text-emerald-500" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Minha Carteira</span>
              </div>
              {benchmarks.map((ticker, i) => (
                <div key={ticker} className="flex items-center gap-2 bg-muted border border-border px-3 py-1.5 rounded-full group">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BENCHMARK_COLORS[i % BENCHMARK_COLORS.length] }} />
                  <span className="text-xs font-bold uppercase">{ticker}</span>
                  <button onClick={() => removeBenchmark(ticker)} className="text-muted-foreground hover:text-rose-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <div className="flex-1" />
              
              <button 
                onClick={saveAnalysis}
                className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-1.5 rounded-full text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Salvar Análise
              </button>
            </div>

            {savedAnalyses.length > 0 && (
              <div className="mb-6">
                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Análises Salvas</div>
                <div className="flex flex-wrap gap-3">
                  {savedAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl hover:border-primary transition-all group cursor-pointer" onClick={() => loadAnalysis(analysis)}>
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-bold text-foreground">{analysis.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteAnalysis(analysis.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val.toFixed(0)}`} dx={-10} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', background: 'hsl(var(--card))', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', color: 'hsl(var(--foreground))' }}
                    formatter={(val: number) => [`${val.toFixed(2)}`, '']}
                  />
                  <Line type="monotone" dataKey="carteira" name="Carteira" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  {benchmarks.map((ticker, i) => (
                    <Line 
                      key={ticker} 
                      type="monotone" 
                      dataKey={ticker} 
                      name={ticker} 
                      stroke={BENCHMARK_COLORS[i % BENCHMARK_COLORS.length]} 
                      strokeWidth={2} 
                      strokeDasharray={i === 0 ? "0" : "5 5"} 
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Rentabilidade Relativa</div>
                <div className="text-lg font-black text-emerald-500">
                  +{((chartData[chartData.length - 1].carteira / chartData[0].carteira - 1) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Benchmark Principal</div>
                <div className="text-lg font-black text-slate-500">
                   {benchmarks[0] || 'Nenhum'}
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Alfa vs {benchmarks[0]}</div>
                <div className="text-lg font-black text-indigo-500">
                   {benchmarks[0] && benchmarkHistory[benchmarks[0]] ? (
                     (chartData[chartData.length-1].carteira - chartData[chartData.length-1][benchmarks[0]]).toFixed(1)
                   ) : '0.0'}%
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Volatilidade (12M)</div>
                <div className="text-lg font-black text-amber-500">12.4%</div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {activeTab === 'lancamentos' && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
             <h3 className="text-lg font-bold text-foreground">Histórico de Lançamentos</h3>
             <button 
               onClick={handleSyncAppliedValue}
               className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-primary/20"
             >
               <Layers className="w-4 h-4" />
               Sincronizar Valor Aplicado (Correção)
             </button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                   <th className="pb-3 font-semibold">Data</th>
                   <th className="pb-3 font-semibold">Ativo</th>
                   <th className="pb-3 font-semibold">Operação</th>
                   <th className="pb-3 font-semibold text-right">Qtd</th>
                   <th className="pb-3 font-semibold text-right">Preço</th>
                   <th className="pb-3 font-semibold text-right">Total</th>
                   <th className="pb-3 font-semibold text-center w-12"></th>
                 </tr>
               </thead>
               <tbody>
                 {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                   <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors text-sm">
                     <td className="py-4 text-muted-foreground">{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                     <td className="py-4 font-bold text-foreground">{t.ticker}</td>
                     <td className="py-4">
                       <span className={cn("px-2 py-1 text-xs font-bold rounded-md", t.type === 'COMPRA' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : (t.type === 'VENDA' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"))}>
                         {t.type}
                       </span>
                     </td>
                     <td className="py-4 text-right text-muted-foreground">{t.quantity}</td>
                     <td className="py-4 text-right tabular-nums text-muted-foreground">{formatCurrency(t.price)}</td>
                     <td className="py-4 text-right font-bold tabular-nums text-foreground">{formatCurrency((t.quantity * t.price) + t.costs)}</td>
                     <td className="py-4 text-center">
                       <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'calendario' && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
             <div>
               <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
                 <CalendarIcon className="w-6 h-6 text-indigo-500" />
                 Calendário Preditivo de Dividendos
               </h3>
               <p className="text-muted-foreground text-sm mt-1">Organize sua carteira providenciária para receber uma "bola de neve" de renda passiva todos os meses do ano.</p>
             </div>
             <div className="px-4 py-2 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-xl flex block flex items-start gap-2 max-w-sm">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  As projeções são baseadas em dados históricos de distribuição (limitado aos últimos 5 anos) e não constituem garantia de pagamentos futuros, podendo sofrer variações conforme condições de mercado e decisões das empresas.
                </p>
             </div>
          </div>

          {/* Grid Anual */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {months.map((month, index) => {
              const monthNum = index + 1;
              let projectedTotal = 0;
              let hasProvisionedAny = false;
              const monthAssets: Array<{ ticker: string, total: number, isProvisioned: boolean }> = [];

              const payingTickers = positions.filter(p => {
                const cleanTicker = p.ticker.replace('.SA', '');
                const pattern = dynamicPatterns[cleanTicker];
                if (!pattern) return false;
                
                if (pattern.firstPurchaseDate) {
                  const purchaseYear = pattern.firstPurchaseDate.getFullYear();
                  const purchaseMonth = pattern.firstPurchaseDate.getMonth() + 1;
                  if (currentYear < purchaseYear) return false;
                  if (currentYear === purchaseYear && monthNum < purchaseMonth) return false;
                }

                const expected = pattern.typicalMonths.has(monthNum);
                const provRate = pattern.provisionedRate[monthNum];
                const isProvisioned = !!provRate;
                
                // If expected historically OR has provisioned officially
                if (expected || isProvisioned) {
                   const expectedRate = pattern.monthlyExpectedRate[monthNum] || 0;
                   // Usa o provRate se existe, senão o esperado conservador
                   const finalRate = isProvisioned ? provRate : expectedRate;
                   const tickerTotal = (finalRate * p.quantity);
                   projectedTotal += tickerTotal;
                   monthAssets.push({ ticker: p.ticker, total: tickerTotal, isProvisioned });
                   if (isProvisioned) hasProvisionedAny = true;
                   return true;
                }
                return false;
              });
              
              const isAlert = monthAssets.length === 0;

              return (
                <div key={month} className={cn(
                  "p-4 rounded-2xl border flex flex-col min-h-[140px] transition-all relative overflow-hidden",
                  isAlert ? "bg-slate-50 dark:bg-slate-800/30 border-border border-dashed" : "bg-card border-indigo-100 dark:border-indigo-900 shadow-sm"
                )}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-foreground">{month} <span className="font-normal text-xs text-slate-400 dark:text-slate-500">{currentYear}</span></h4>
                    {isAlert && <AlertCircle className="w-4 h-4 text-rose-400" />}
                  </div>
                  
                  <div className="flex-1">
                    {monthAssets.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {monthAssets.sort((a, b) => {
                          if (a.isProvisioned && !b.isProvisioned) return -1;
                          if (!a.isProvisioned && b.isProvisioned) return 1;
                          return b.total - a.total;
                        }).map(a => (
                          <div key={a.ticker} className={cn(
                            "flex flex-col px-2 py-1.5 rounded-[8px] border shadow-sm transition-colors",
                            a.isProvisioned ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20 shadow-emerald-500/10" 
                            : "bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-100/50 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                          )}>
                            <div className="flex items-center gap-1 mb-0.5">
                              {a.isProvisioned && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Provisionado Oficial"></div>}
                              <span className="font-black text-[10px] sm:text-xs leading-none tracking-tight">{a.ticker}</span>
                            </div>
                            <span className="text-[8.5px] font-medium opacity-75 leading-none tabular-nums">
                              {a.total > 0 ? formatCurrency(a.total) : '---'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 font-medium h-full flex flex-col justify-center items-center text-center">
                        <span className="opacity-60 mb-1">Mês vazio</span>
                        <span onClick={() => setActiveTab('resumo')} className="text-[10px] text-rose-500 border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-500/10 px-2 py-0.5 rounded cursor-pointer hover:bg-rose-100 transition-colors">Ver Oportunidades</span>
                      </div>
                    )
                  }
                  </div>
                  
                  {monthAssets.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border mt-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{hasProvisionedAny ? 'Garantido + Projeção' : 'Previsão Conservadora'}</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-emerald-500">
                        +{formatCurrency(projectedTotal)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL NOVO LANÇAMENTO */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-card rounded-3xl p-6 md:p-8 w-full max-w-md relative z-10 shadow-2xl border border-border"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full"><X className="w-5 h-5"/></button>
              
              <h2 className="text-xl font-bold text-foreground mb-6">Adicionar Lançamento</h2>
              
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                 <button onClick={() => setFormType('COMPRA')} className={cn("py-2 text-sm font-bold rounded-lg transition-all", formType === 'COMPRA' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500")}>COMPRA</button>
                 <button onClick={() => setFormType('VENDA')} className={cn("py-2 text-sm font-bold rounded-lg transition-all", formType === 'VENDA' ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm" : "text-slate-500")}>VENDA</button>
                 <button onClick={() => setFormType('RENDIMENTO')} className={cn("py-2 text-sm font-bold rounded-lg transition-all", formType === 'RENDIMENTO' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500")}>PROVENTO</button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Classe de Ativo</label>
                  <CustomSelect 
                    value={formAssetClass} 
                    onChange={(value) => setFormAssetClass(value as AssetClass)} 
                    options={Object.keys(ASSET_COLORS).map(ac => ({ value: ac, label: ac }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Ticker / Código</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="EX: GOOG" 
                      value={formTicker} 
                      onChange={(e) => {
                        setFormTicker(e.target.value);
                        setShowTickerSuggestions(true);
                      }} 
                      onBlur={() => {
                        setTimeout(() => setShowTickerSuggestions(false), 200);
                        handleTickerBlur();
                      }} 
                      onFocus={() => setShowTickerSuggestions(true)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-foreground font-bold uppercase outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all" 
                    />
                    {showTickerSuggestions && tickerSuggestions.length > 0 && (
                      <ul className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {tickerSuggestions.map((item, i) => (
                          <li 
                            key={i} 
                            onMouseDown={() => {
                              setFormTicker(item.ticker);
                              setShowTickerSuggestions(false);
                            }}
                            className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex flex-col"
                          >
                            <span className="font-bold text-sm text-foreground">{item.ticker}</span>
                            <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Data</label>
                    <input required type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-foreground font-medium outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Quantidade</label>
                    <input required type="number" min="0" step="any" placeholder="0" value={formQty} onChange={(e) => setFormQty(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-foreground font-medium outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Preço Unitário (R$)</label>
                    <input required type="number" min="0" step="any" placeholder="0,00" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-foreground font-medium outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all" />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-between items-center mb-6">
                  <span className="text-slate-500 text-sm font-bold">Valor Total</span>
                  <span className="text-xl font-black text-foreground">
                    {formatCurrency(Number(formQty || 0) * Number(formPrice || 0))}
                  </span>
                </div>

                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
                  Salvar Lançamento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
