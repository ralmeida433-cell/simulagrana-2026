import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Info, TrendingUp, TrendingDown, Minus, HelpCircle, 
  RefreshCw, BarChart3, LineChart as LineChartIcon, DollarSign, 
  Calculator, ShieldCheck, AlertTriangle, Target, Award, 
  Eye, EyeOff, ChevronDown, ChevronUp,
  Loader2, Bell, LayoutGrid, Activity,
  Zap, CheckCircle2, ArrowRight, X, ChevronRight, History,
  Calendar, AlertCircle, ArrowUpRight, ArrowDownRight, ShieldAlert
} from 'lucide-react';
import { searchStockData, StockData } from '../../services/stockService';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, 
  ComposedChart, Area, Cell, AreaChart, PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketHistory, HistoryRecord } from '../../hooks/useMarketHistory';
import { FinanceData } from '../../services/financeService';
import { AssetComparisonChart } from '../shared/AssetComparisonChart';
import { AssetPrice } from '../shared/AssetPrice';

// --- Sparkline Component ---
const Sparkline = ({ data, color }: { data: any[], color: string }) => (
  <div className="w-16 h-8">
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <LineChart data={data}>
        <Line 
          type="monotone" 
          dataKey="price" 
          stroke={color} 
          strokeWidth={2} 
          dot={false} 
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// --- Tooltip Component ---
const InfoTooltip = ({ content }: { content: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-flex items-center justify-center ml-1.5"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-emerald-400 cursor-help transition-colors" />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-slate-100 text-xs rounded-xl shadow-xl z-50 pointer-events-none text-left font-normal normal-case tracking-normal leading-relaxed"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface GrahamCalculatorProps {
  financeData?: FinanceData | null;
}

const ValueDisplay = ({ value, isHidden, onToggle }: { value: string | number | React.ReactNode, isHidden: boolean, onToggle: (e?: React.MouseEvent) => void }) => (
  <span 
    onClick={(e) => {
      e.stopPropagation();
      e.preventDefault();
      onToggle(e);
    }} 
    className={cn(
      "cursor-pointer transition-all duration-300", 
      isHidden ? "opacity-40" : "opacity-100 hover:opacity-80"
    )}
  >
    {isHidden ? '•••••' : value}
  </span>
);

export default function GrahamCalculator({ financeData }: GrahamCalculatorProps) {
  const { history, saveRecord, removeRecord } = useMarketHistory();
  const [ticker, setTicker] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ticker') || '';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [customEps, setCustomEps] = useState<number | ''>('');
  const [customBvps, setCustomBvps] = useState<number | ''>('');
  const [error, setError] = useState('');
  
  const [showCalculation, setShowCalculation] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'1m' | '3m' | '6m' | '1y' | '2y' | '5y' | '10y' | 'max'>('1y');
  const [ipcaAnual, setIpcaAnual] = useState<number>(financeData?.ipca || 4.5); // IPCA médio anual estimado

  // Initial search on mount
  useEffect(() => {
    if (ticker) {
      // Just do it once on mount
      doSearch(ticker);
    }
  }, []);

  // Hook into URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTicker = params.get('ticker');
      if (urlTicker && urlTicker !== ticker) {
        setTicker(urlTicker);
        doSearch(urlTicker);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [ticker]);

  useEffect(() => {
    if (financeData?.ipca) {
      setIpcaAnual(financeData.ipca);
    }
  }, [financeData?.ipca]);

  const doSearch = async (targetTicker: string) => {
    if (!targetTicker || targetTicker.toUpperCase() === 'SCANNER') return;

    setLoading(true);
    setError('');
    setStockData(null);
    setCustomEps('');
    setCustomBvps('');

    try {
      const data = await searchStockData(targetTicker.toUpperCase());
      if (data) {
        setStockData(data);
        saveRecord({
          tipo: 'analise',
          ativo: targetTicker.toUpperCase(),
          dados: {
            ticker: targetTicker.toUpperCase(),
            stockData: data,
            ipcaAnual,
            periodFilter
          }
        });
      } else {
        setError('Ticker não encontrado na B3 ou dados indisponíveis.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na busca. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    doSearch(ticker);
  };
  const [visibleRentabilidadeRows, setVisibleRentabilidadeRows] = useState<Record<string, boolean>>({});
  const [visibleSimulationRows, setVisibleSimulationRows] = useState<Record<number, boolean>>({});
  
  // Visibility toggle
  const [showValues, setShowValues] = useState(() => {
    const saved = localStorage.getItem('simulagrana_show_values');
    return saved !== 'false';
  });
  const [toggledSummary, setToggledSummary] = useState<Set<string>>(new Set());

  const handleToggleValues = () => {
    const newValue = !showValues;
    setShowValues(newValue);
    setToggledSummary(new Set()); // Reset individual toggles when global toggle changes
    localStorage.setItem('simulagrana_show_values', String(newValue));
  };

  const toggleSummary = (key: string) => {
    setToggledSummary(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isFieldHidden = (key: string) => {
    return showValues ? toggledSummary.has(key) : !toggledSummary.has(key);
  };

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    diagnostico: true,
    analiseRentabilidade: false,
    contextoNoticias: false,
    cenarios: false,
    conclusao: true,
    b3List: false,
    usList: false,
    history: false
  });

  const isFirstRender = React.useRef(true);
  const prevStockData = React.useRef(stockData);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only save simulation if stockData is the same (not a new search)
    if (stockData && prevStockData.current === stockData) {
      const timeoutId = setTimeout(() => {
        saveRecord({
          tipo: 'simulacao',
          ativo: stockData.ticker,
          dados: {
            ticker: stockData.ticker,
            stockData,
            ipcaAnual,
            periodFilter
          }
        });
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
    
    prevStockData.current = stockData;
  }, [ipcaAnual, periodFilter, stockData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // --- Efeito: Live Mode Polling ---
  useEffect(() => {
    if (!isLiveMode || !ticker) return;

    const interval = setInterval(() => {
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(syntheticEvent);
    }, 10000); // 10s no modo live

    return () => clearInterval(interval);
  }, [isLiveMode, ticker]);

  const calculateGrahamValue = (eps: number, bvps: number) => {
    if (eps <= 0 || bvps <= 0) return 0;
    return Math.sqrt(22.5 * eps * bvps);
  };

  const epsToUse = customEps === '' ? (stockData?.eps || 0) : Number(customEps);
  const bvpsToUse = customBvps === '' ? (stockData?.bvps || 0) : Number(customBvps);

  const intrinsicValue = stockData ? calculateGrahamValue(epsToUse, bvpsToUse) : 0;
  const marginOfSafety = stockData && intrinsicValue > 0 
    ? ((intrinsicValue - stockData.price) / intrinsicValue) * 100 
    : 0;

  // --- Efeito: Sistema de Alertas ---
  useEffect(() => {
    if (!stockData) return;
    
    const newAlerts: string[] = [];
    
    if (stockData.price < intrinsicValue * 0.7) {
      newAlerts.push(`📊 INDICADOR: ${stockData.ticker} apresenta preço 30%+ abaixo do valor estimado pelo modelo.`);
    }
    
    if (stockData.changePercent && stockData.changePercent < -5) {
      newAlerts.push(`📉 VOLATILIDADE: ${stockData.ticker} apresentou variação de ${stockData.changePercent.toFixed(2)}% hoje.`);
    }

    if (marginOfSafety > 50) {
      newAlerts.push(`🔍 ANÁLISE: Margem de segurança teórica calculada acima de 50%.`);
    }

    setAlerts(newAlerts);
  }, [stockData, intrinsicValue, marginOfSafety]);

  const toggleRentabilidadeRow = (rowId: string) => {
    setVisibleRentabilidadeRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const toggleSimulationRow = (index: number) => {
    setVisibleSimulationRows(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleScannerClick = (sTicker: string) => {
    setTicker(sTicker);
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSearch(syntheticEvent);
    // Auto-scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!ticker || ticker.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        return;
      }

      setIsSearchingSuggestions(true);
      try {
        const res = await fetch(`/api/fin/search/${encodeURIComponent(ticker)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          
          if (document.activeElement === inputRef.current) {
            setShowSuggestions(true);
          }
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsSearchingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [ticker]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch(e);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[activeSuggestionIndex];
        isSelectingRef.current = true;
        setTicker(selected.ticker);
        setShowSuggestions(false);
        inputRef.current?.blur();
        doSearch(selected.ticker);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Cálculos de Rentabilidade Real
  const profitabilityMetrics = useMemo(() => {
    if (!stockData || !stockData.historicalPrices || stockData.historicalPrices.length < 2) return null;

    const prices = stockData.historicalPrices;
    
    // Filter prices based on periodFilter
    let filteredPrices = [...prices];
    const monthsMap = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12,
      '2y': 24,
      '5y': 60,
      '10y': 120,
      'max': 999
    };
    
    const monthsToLookBack = monthsMap[periodFilter];
    if (periodFilter !== 'max') {
      filteredPrices = prices.slice(-Math.min(monthsToLookBack + 1, prices.length));
    }

    if (filteredPrices.length < 2) return null;

    const firstPrice = filteredPrices[0].price;
    const lastPrice = filteredPrices[filteredPrices.length - 1].price;
    
    const nominalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    // Estimativa de IPCA acumulado para o período
    const actualMonths = filteredPrices.length - 1;
    const ipcaAcumulado = (Math.pow(1 + (ipcaAnual / 100), actualMonths / 12) - 1) * 100;
    
    const realReturn = (((1 + (nominalReturn / 100)) / (1 + (ipcaAcumulado / 100))) - 1) * 100;

    let status = '';
    let color = '';
    let bg = '';
    let border = '';
    let icon = Minus;

    if (realReturn > 2) {
      status = 'Ganhou da inflação';
      color = 'text-emerald-500';
      bg = 'bg-emerald-500/10';
      border = 'border-emerald-500/20';
      icon = TrendingUp;
    } else if (realReturn >= -2 && realReturn <= 2) {
      status = 'Empatou com a inflação';
      color = 'text-amber-500';
      bg = 'bg-amber-500/10';
      border = 'border-amber-500/20';
      icon = Minus;
    } else {
      status = 'Perdeu para a inflação';
      color = 'text-red-500';
      bg = 'bg-red-500/10';
      border = 'border-red-500/20';
      icon = TrendingDown;
    }

    return { nominalReturn, ipcaAcumulado, realReturn, status, color, bg, border, icon, periodLabel: periodFilter === 'max' ? 'Máximo' : periodFilter.replace('m', ' Mês(es)').replace('y', ' Ano(s)') };
  }, [stockData, ipcaAnual, periodFilter]);

  // Score System
  const scoreMetrics = useMemo(() => {
    if (!stockData || !profitabilityMetrics) return null;

    let valuationScore = 0;
    if (intrinsicValue === 0) valuationScore = 0;
    else if (marginOfSafety > 20) valuationScore = 10;
    else if (marginOfSafety > 0) valuationScore = 7;
    else if (marginOfSafety > -20) valuationScore = 4;
    else valuationScore = 0;

    let realReturnScore = 0;
    if (profitabilityMetrics.realReturn > 10) realReturnScore = 10;
    else if (profitabilityMetrics.realReturn > 0) realReturnScore = 7;
    else if (profitabilityMetrics.realReturn > -10) realReturnScore = 4;
    else realReturnScore = 0;

    let consistencyScore = 0;
    const profits = stockData.historicalProfits;
    const positiveYears = profits.filter(p => p.profit > 0).length;
    if (positiveYears === profits.length && profits.length > 0) consistencyScore = 10;
    else if (positiveYears >= profits.length * 0.8) consistencyScore = 7;
    else if (positiveYears >= profits.length * 0.5) consistencyScore = 4;
    else consistencyScore = 0;

    let dividendScore = 0;
    if (stockData.dividendYield > 6) dividendScore = 10;
    else if (stockData.dividendYield > 3) dividendScore = 7;
    else if (stockData.dividendYield > 0) dividendScore = 4;
    else dividendScore = 0;

    const finalScore = (valuationScore * 0.3) + (realReturnScore * 0.3) + (consistencyScore * 0.2) + (dividendScore * 0.2);

    let classification = '';
    let color = '';
    if (finalScore >= 8) { classification = 'Alta Aderência'; color = 'text-slate-700 dark:text-slate-300'; }
    else if (finalScore >= 6) { classification = 'Aderência Moderada'; color = 'text-slate-600 dark:text-slate-400'; }
    else if (finalScore >= 4) { classification = 'Baixa Aderência'; color = 'text-amber-600 dark:text-amber-500'; }
    else { classification = 'Fora do Perfil'; color = 'text-slate-500 dark:text-slate-500'; }

    return { finalScore, classification, color, details: { valuationScore, realReturnScore, consistencyScore, dividendScore } };
  }, [stockData, marginOfSafety, profitabilityMetrics, intrinsicValue]);

  // Insight Automático
  const getInsight = () => {
    if (!stockData || !profitabilityMetrics) return null;
    
    if (intrinsicValue === 0) {
      return "A fórmula de Graham não pode ser aplicada a este ativo devido a Lucro por Ação (LPA) ou Valor Patrimonial por Ação (VPA) negativos ou zerados.";
    }

    if (marginOfSafety > 0 && profitabilityMetrics.realReturn < 0) {
      return "O modelo sugere um possível desconto no preço, porém o histórico indica retorno real negativo no período analisado. Requer avaliação aprofundada dos fundamentos.";
    } else if (marginOfSafety > 0 && profitabilityMetrics.realReturn > 0) {
      return "Os indicadores apontam para um potencial desconto em relação ao modelo teórico, acompanhado de um histórico de retorno real positivo.";
    } else if (marginOfSafety <= 0 && profitabilityMetrics.realReturn > 0) {
      return "O histórico apresenta geração de valor real, mas o modelo quantitativo sugere que o preço atual pode estar acima do valor estimado.";
    } else {
      return "As métricas atuais indicam preço de mercado possivelmente acima do valor estimado, aliado a um histórico de retorno real negativo.";
    }
  };

  const simulationData = useMemo(() => {
    if (!stockData || !stockData.historicalPrices || stockData.historicalPrices.length === 0) return [];
    
    const prices = stockData.historicalPrices;
    const currentPrice = prices[prices.length - 1].price;
    
    const periods = [
      { label: '1 Mês', months: 1 },
      { label: '3 Meses', months: 3 },
      { label: '6 Meses', months: 6 },
      { label: '1 Ano', months: 12 },
      { label: '2 Anos', months: 24 },
      { label: '3 Anos', months: 36 },
      { label: '4 Anos', months: 48 },
      { label: '5 Anos', months: 60 },
    ];

    return periods.map(period => {
      const startIndex = Math.max(0, prices.length - 1 - period.months);
      const startPrice = prices[startIndex].price;
      const actualMonths = prices.length - 1 - startIndex;
      
      if (actualMonths === 0) return null;
      
      // Skip if we don't have at least 80% of the requested period, unless it's the longest we have
      if (actualMonths < period.months * 0.8 && period.months !== 60) {
         return null;
      }

      const stockReturn = ((currentPrice - startPrice) / startPrice) * 100;
      
      // Mocks based on typical Brazilian market historical averages
      const ipcaReturn = (Math.pow(1 + (ipcaAnual / 100), actualMonths / 12) - 1) * 100;
      const cdiReturn = (Math.pow(1.105, actualMonths / 12) - 1) * 100; // ~10.5% a.a.
      const ibovReturn = stockReturn * 0.6 + (Math.random() * 10 - 5) * (actualMonths / 12);
      const ivvb11Return = (Math.pow(1.15, actualMonths / 12) - 1) * 100; // ~15% a.a.

      let label = period.label;
      if (actualMonths < period.months) {
        // If it's the max we have but less than requested
        label = `Máx (${Math.floor(actualMonths / 12)}a ${actualMonths % 12}m)`;
      }

      return {
        label,
        months: actualMonths,
        stock: stockReturn,
        cdi: cdiReturn,
        ibov: ibovReturn,
        ipca: ipcaReturn,
        ivvb11: ivvb11Return
      };
    }).filter(Boolean).filter((item, index, self) => 
      // Remove duplicates if multiple periods fall back to the same "Max" data
      index === self.findIndex((t) => t?.months === item?.months)
    );
  }, [stockData, ipcaAnual]);

  const rentabilidadeData = useMemo(() => {
    if (!stockData || !stockData.historicalPrices || stockData.historicalPrices.length === 0) return null;
    
    const prices = stockData.historicalPrices;
    const currentPrice = prices[prices.length - 1].price;
    
    const periods = [
      { label: '1 mês', months: 1 },
      { label: '3 meses', months: 3 },
      { label: '1 ano', months: 12 },
      { label: '2 anos', months: 24 },
      { label: '5 anos', months: 60 },
      { label: '10 anos', months: 120 },
    ];

    return periods.map(period => {
      const startIndex = Math.max(0, prices.length - 1 - period.months);
      const startPrice = prices[startIndex].price;
      const actualMonths = prices.length - 1 - startIndex;
      
      if (actualMonths === 0) return { label: period.label, nominal: 0, real: 0, hasData: false };
      
      const nominalReturn = ((currentPrice - startPrice) / startPrice) * 100;
      const ipcaReturn = (Math.pow(1 + (ipcaAnual / 100), actualMonths / 12) - 1) * 100;
      const realReturn = (((1 + (nominalReturn / 100)) / (1 + (ipcaReturn / 100))) - 1) * 100;

      return {
        label: period.label,
        nominal: nominalReturn,
        real: realReturn,
        hasData: actualMonths >= period.months * 0.8 // Only show if we have enough data
      };
    });
  }, [stockData, ipcaAnual]);

  const b3Stocks = [
    'VALE3', 'PETR4', 'ITUB4', 'BBDC4', 'BBAS3', 'ABEV3', 'WEGE3', 'ITSA4', 'BPAC11', 'JBSS3',
    'RENT3', 'SUZB3', 'GGBR4', 'B3SA3', 'EQTL3', 'RADL3', 'VIVT3', 'BBSE3', 'RAIL3', 'SBSP3',
    'CPLE6', 'CSAN3', 'HYPE3', 'EMBR3', 'CMIG4', 'LREN3', 'ELET3', 'ELET6', 'PRIO3', 'RDOR3',
    'RUM3', 'TOTS3', 'UGPA3', 'VBBR3', 'BRFS3', 'CCRO3', 'CIEL3', 'COGN3', 'CSNA3', 'CYRE3',
    'DXCO3', 'ECOR3', 'EGIE3', 'ENGI11', 'ENMT4', 'EZTC3', 'FLRY3', 'GOAU4', 'GOLL4', 'IRBR3',
    'JHSF3', 'KLBN11', 'MGLU3', 'MRFG3', 'MRVE3', 'MULT3', 'NTCO3', 'PCAR3', 'PETR3', 'POSI3',
    'QUAL3', 'SANB11', 'SMTO3', 'TAEE11', 'TIMS3', 'USIM5', 'YDUQ3', 'ALPA4', 'ARZZ3', 'BEEF3',
    'BRAP4', 'BRKM5', 'CASH3', 'CVCB3', 'GMAT3', 'LWSA3', 'PETZ3', 'RRRP3', 'SLCE3', 'STBP3',
    'TRPL4', 'VAMO3', 'AMER3', 'AZUL4', 'BPAN4', 'IGTI11', 'LOGN3', 'MDIA3', 'MOVI3', 'MYPK3',
    'ODPV3', 'POMO4', 'RAPT4', 'ROMI3', 'SIMH3', 'TEND3', 'UNIP6', 'NEOE3'
  ];

  const usStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'V', 'UNH',
    'JNJ', 'WMT', 'JPM', 'MA', 'PG', 'HD', 'CVX', 'LLY', 'ABBV', 'MRK',
    'KO', 'PEP', 'ORCL', 'COST', 'AVGO', 'TMO', 'MCD', 'PFE', 'ABT', 'DHR',
    'NKE', 'DIS', 'LIN', 'NEE', 'ADBE', 'TXN', 'PM', 'VZ', 'CRM', 'UPS',
    'CMCSA', 'AMAT', 'RTX', 'HON', 'LOW', 'UNP', 'COP', 'IBM', 'CAT', 'QCOM',
    'GS', 'SBUX', 'MS', 'INTU', 'GE', 'DE', 'PLD', 'AMGN', 'ISRG', 'SPGI',
    'BLK', 'MDT', 'SYK', 'T', 'ELV', 'BKNG', 'NOW', 'AMT', 'TJX', 'MMC',
    'ADP', 'ADI', 'LMT', 'GILD', 'CB', 'MDLZ', 'MO', 'ZTS', 'CI', 'REGN',
    'CVS', 'VRTX', 'BSX', 'FISV', 'ITW', 'HUM', 'EQIX', 'DUQ', 'ICE', 'ETN',
    'SLB', 'TFC', 'BDX', 'CME', 'CL', 'EW', 'SO', 'NSC', 'WM', 'NOC'
  ];

  // --- Estratégia Recomendada (Lógica Automática) ---
  const strategyRecommendation = useMemo(() => {
    if (!stockData || !profitabilityMetrics) return null;
    
    if (intrinsicValue === 0) {
      return {
        title: "FÓRMULA INAPLICÁVEL",
        desc: "A fórmula de Graham não pode ser aplicada a este ativo devido a Lucro por Ação (LPA) ou Valor Patrimonial por Ação (VPA) negativos ou zerados.",
        color: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800/30",
        icon: AlertTriangle
      };
    }

    const isUndervalued = marginOfSafety > 20;
    const isFairValue = marginOfSafety > -10 && marginOfSafety <= 20;
    const isOvervalued = marginOfSafety <= -10;
    const beatsInflation = profitabilityMetrics.realReturn > 2;
    const highGrahamScore = scoreMetrics && scoreMetrics.finalScore >= 7;

    if (isUndervalued && beatsInflation && highGrahamScore) {
      return {
        title: "INDICADOR FUNDAMENTALISTA (ANÁLISE QUANTITATIVA)",
        desc: "Ativo com métricas que sugerem potencial desconto em relação a modelos teóricos de valuation.",
        color: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-100 dark:bg-slate-800/50",
        border: "border-slate-200 dark:border-slate-700",
        icon: BarChart3
      };
    } else if (isFairValue && beatsInflation) {
      return {
        title: "ANÁLISE FUNDAMENTALISTA",
        desc: "Indicadores sugerem preço de mercado próximo ao valor estimado, com histórico de geração de valor real.",
        color: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-100 dark:bg-slate-800/50",
        border: "border-slate-200 dark:border-slate-700",
        icon: Activity
      };
    } else if (isOvervalued || !beatsInflation) {
      return {
        title: "RESULTADO DE ANÁLISE AUTOMATIZADA",
        desc: "Os dados indicam possíveis discrepâncias entre preço de mercado e valor estimado por modelos quantitativos.",
        color: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800/30",
        icon: AlertTriangle
      };
    }
    
    return {
      title: "ANÁLISE NEUTRA",
      desc: "Indicadores sugerem possível diferença entre preço e valor estimado. Avalie o ativo com maior profundidade.",
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-800/30",
      border: "border-slate-200 dark:border-slate-700",
      icon: Minus
    };
  }, [stockData, marginOfSafety, profitabilityMetrics, scoreMetrics, intrinsicValue]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-7xl mx-auto space-y-4 sm:space-y-8 px-3 sm:px-6 py-6 transition-all duration-500 pb-28`}
    >
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3 transition-transform hover:rotate-0">
             <Calculator className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter leading-none">Graham Pro</h1>
              <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Valuation Intrínseco</p>
            </div>
            <button 
               onClick={handleToggleValues}
               className="p-2 sm:p-2.5 bg-card hover:bg-muted border border-border rounded-xl transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
               title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
            >
               {showValues ? <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-md p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-border/50 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[60px] pointer-events-none" />
        
        <form onSubmit={handleSearch} className="space-y-4 sm:space-y-6 relative z-10 w-full min-w-0">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-end w-full">
            <div className="flex-1 w-full relative min-w-0">
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Ticker da Ação</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  ref={inputRef}
                  type="text"
                  autoComplete="off"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => ticker.length >= 2 && setShowSuggestions(true)}
                  placeholder="EX: PETR4 OU AAPL"
                  className="w-full pl-12 pr-4 py-3 sm:py-4 bg-muted/30 border border-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none uppercase font-black tracking-widest text-sm sm:text-base dark:text-white transition-all placeholder:text-muted-foreground/40"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  {isSearchingSuggestions ? (
                    <div className="p-6 flex items-center justify-center text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      <span className="text-xs font-black uppercase tracking-widest">Buscando...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="py-2">
                      {suggestions.map((item, index) => (
                        <button
                          key={`${item.ticker}-${index}`}
                          type="button"
                          className={`w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors border-b last:border-0 border-border/50 ${index === activeSuggestionIndex ? "bg-muted/50" : ""}`}
                          onClick={() => {
                            isSelectingRef.current = true;
                            setTicker(item.ticker);
                            setShowSuggestions(false);
                            inputRef.current?.blur();
                            doSearch(item.ticker);
                          }}
                        >
                          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {item.logourl ? (
                              <img src={item.logourl} alt={item.ticker} className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-xs font-black text-indigo-500 uppercase">{item.ticker.substring(0, 2)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-foreground tracking-tight">{item.ticker}</span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase opacity-70">
                                {item.exchange || item.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate opacity-60">{item.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs font-black uppercase tracking-widest opacity-50">
                      Nenhum ativo encontrado
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full lg:w-48">
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">IPCA Anual Est. (%)</label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.1"
                  value={ipcaAnual}
                  onChange={(e) => setIpcaAnual(Number(e.target.value))}
                  className="w-full px-5 py-3 sm:py-4 bg-muted/30 border border-border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-black text-sm sm:text-base dark:text-white transition-all text-center"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                   <button type="button" onClick={() => setIpcaAnual(prev => Number((prev + 0.1).toFixed(1)))} className="text-slate-400 hover:text-indigo-500 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                   <button type="button" onClick={() => setIpcaAnual(prev => Number((prev - 0.1).toFixed(1)))} className="text-slate-400 hover:text-indigo-500 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !ticker}
              className="w-full lg:w-auto bg-indigo-600 text-white px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 h-[52px] sm:h-[60px] shadow-xl shadow-indigo-500/20 border border-indigo-500/30"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Analisar
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-200">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-xs font-black text-red-500 uppercase tracking-wider">{error}</span>
          </div>
        )}
      </div>

      {/* HISTÓRICO RETRATIL ESTILIZADO */}
      <div className="mt-8 space-y-4">
        <button 
          onClick={() => toggleSection('history')}
          className={cn(
            "w-full flex items-center justify-between p-4 sm:p-6 bg-card border border-border rounded-xl sm:rounded-[2rem] hover:border-indigo-500/30 transition-all shadow-sm",
            expandedSections.history && "rounded-b-none border-b-transparent"
          )}
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <History className="w-4 h-4 text-indigo-500" />
             </div>
             <div className="flex items-center gap-3">
                <h3 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-[0.15em]">Últimas Análises e Simulações</h3>
                <span className="text-[9px] font-black bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{history.length}</span>
             </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", expandedSections.history && "rotate-180")} />
        </button>

        <AnimatePresence>
          {expandedSections.history && history.length > 0 && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden bg-muted/10 border-x border-b border-border rounded-b-xl sm:rounded-b-[2rem]"
            >
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {history.map(record => (
                  <div key={record.id} className="p-5 bg-card border border-border rounded-[1.5rem] hover:border-indigo-500/40 transition-all group relative animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-start mb-4">
                      <span className={cn(
                        "text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-[0.2em] shadow-sm",
                        record.tipo === 'analise' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      )}>
                        {record.tipo}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeRecord(record.id); }} 
                        className="text-muted-foreground hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="text-3xl font-black text-foreground tracking-tighter mb-1">{record.ativo}</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-6 flex items-center gap-1.5 opacity-60">
                      <Calendar className="w-3 h-3" />
                      {new Date(record.data).toLocaleDateString('pt-BR', { dateStyle: 'short' })}
                    </p>
                    <button 
                      onClick={() => {
                        setTicker(record.dados.ticker);
                        setStockData(record.dados.stockData);
                        setIpcaAnual(record.dados.ipcaAnual);
                        setPeriodFilter(record.dados.periodFilter as any);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-3 bg-muted/50 border border-border rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-foreground hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all active:scale-95 shadow-sm"
                    >
                      Carregar
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {stockData && profitabilityMetrics && scoreMetrics && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {/* VALUATION RESULT HERO CARD */}
          {(() => {
            const upside = intrinsicValue > 0 ? ((intrinsicValue - stockData.price) / stockData.price) * 100 : 0;
            let themeClass = 'from-slate-500/10 to-slate-600/5 border-slate-200 text-slate-500';
            let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
            let statusText = 'Indefinido';
            let statusIcon = <Minus className="w-4 h-4" />;
            let explanation = 'Não foi possível calcular o valor justo devido a dados inconsistentes (LPA ou VPA negativos).';
            let explanationColor = 'text-slate-600 dark:text-slate-400';

            if (intrinsicValue > 0) {
              if (upside > 15) {
                themeClass = 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-500';
                badgeClass = 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20';
                statusText = 'Desconto Atrativo';
                statusIcon = <CheckCircle2 className="w-4 h-4" />;
                explanation = 'Este ativo está sendo negociado abaixo do seu valor justo estimado, indicando uma oportunidade de compra com margem de segurança.';
                explanationColor = 'text-emerald-700 dark:text-emerald-400';
              } else if (upside >= -10 && upside <= 15) {
                themeClass = 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-500';
                badgeClass = 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20';
                statusText = 'Preço Equilibrado';
                statusIcon = <AlertCircle className="w-4 h-4" />;
                explanation = 'O ativo está próximo do seu valor intrínseco. A margem de segurança é reduzida, exigindo cautela na entrada.';
                explanationColor = 'text-amber-700 dark:text-amber-400';
              } else {
                themeClass = 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-500';
                badgeClass = 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20';
                statusText = 'Sobrevalorizado';
                statusIcon = <TrendingDown className="w-4 h-4" />;
                explanation = 'O Preço de Mercado supera o Valor Justo de Graham. O risco de correção é mais elevado segundo este modelo.';
                explanationColor = 'text-red-700 dark:text-red-400';
              }
            }

            return (
              <motion.div 
                key={stockData.ticker}
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="relative group w-full"
              >
                <div className={cn(
                  "bg-card p-4 sm:p-8 lg:p-12 rounded-3xl sm:rounded-[4rem] border border-border/60 shadow-xl sm:shadow-2xl relative overflow-hidden transition-all duration-500"
                )}>
                  {/* Decorative Gradient Background */}
                  <div className={cn("absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full blur-[100px] sm:blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/3 bg-gradient-to-br", themeClass)} />
                  <div className="absolute bottom-0 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] rounded-full blur-[80px] sm:blur-[100px] opacity-5 translate-y-1/2 -translate-x-1/3 bg-indigo-500" />
                  
                  <div className="relative z-10 flex flex-col gap-6 sm:gap-12">
                    {/* Header: Company & Status */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-8">
                      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.5rem] bg-white dark:bg-slate-900 border border-border p-2 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                          {stockData.logourl ? (
                            <img src={stockData.logourl} alt={stockData.ticker} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-xl sm:text-2xl font-black text-emerald-500">{stockData.ticker.substring(0, 2)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex flex-col items-start w-full sm:w-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tighter truncate leading-none">{stockData.ticker}</h2>
                            <span className="px-1.5 py-0.5 bg-muted rounded text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">STK</span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-muted-foreground opacity-70 truncate max-w-full sm:max-w-[250px]">{stockData.longName || stockData.name}</p>
                          <div className="inline-flex items-center gap-1.5 mt-1 sm:mt-2 px-2.5 py-1 bg-muted/60 rounded-full border border-border hidden sm:flex">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[150px]">{stockData.sector}</span>
                          </div>
                        </div>
                      </div>

                      <div className={cn("flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-full border sm:border-2 font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[9px] sm:text-xs shadow-sm sm:shadow-lg transition-all w-full md:w-auto justify-center", badgeClass)}>
                        {statusIcon}
                        {statusText}
                      </div>
                    </div>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                      <div className="p-4 sm:p-6 bg-muted/20 border border-border rounded-2xl sm:rounded-[2rem] hover:bg-muted/30 transition-all flex flex-col justify-center">
                        <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 sm:mb-3">Cotação Atual</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-4xl font-black text-foreground tracking-tighter">
                            <ValueDisplay value={<AssetPrice price={stockData.price} currency={stockData.currency} ticker={stockData.ticker} />} isHidden={isFieldHidden('cotacao')} onToggle={() => toggleSummary('cotacao')} />
                          </span>
                        </div>
                        <div className={cn("flex items-center gap-1 mt-1 sm:mt-1.5 font-black text-[10px] sm:text-xs", (stockData.changePercent || 0) >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {(stockData.changePercent || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <ValueDisplay value={`${(stockData.changePercent || 0).toFixed(2)}% (24h)`} isHidden={isFieldHidden('change')} onToggle={() => toggleSummary('change')} />
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 bg-emerald-600 rounded-2xl sm:rounded-[2rem] text-white shadow-lg shadow-emerald-600/20 group/card relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl sm:blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-1 sm:mb-3">
                            <p className="text-[9px] sm:text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Preço Justo</p>
                            <InfoTooltip content="Teto sugerido baseado em Graham." />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-4xl font-black text-white tracking-tighter">
                             <ValueDisplay value={intrinsicValue > 0 ? <AssetPrice price={intrinsicValue} currency={stockData.currency} ticker={stockData.ticker} /> : 'N/A'} isHidden={isFieldHidden('valorJusto')} onToggle={() => toggleSummary('valorJusto')} />
                            </span>
                          </div>
                          <p className="text-[9px] sm:text-[10px] font-bold text-white/60 mt-1 sm:mt-2 whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-widest"><ValueDisplay value={`LPA: ${epsToUse.toFixed(2)} | VPA: ${bvpsToUse.toFixed(2)}`} isHidden={isFieldHidden('valorJustoInfo')} onToggle={() => toggleSummary('valorJustoInfo')} /></p>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 bg-muted/20 border border-border rounded-2xl sm:rounded-[2rem] hover:bg-muted/30 transition-all flex flex-col justify-center col-span-1 sm:col-span-2 md:col-span-1">
                        <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 sm:mb-3">Margem / Upside</p>
                        <div className="flex items-baseline gap-2">
                          <span className={cn(
                            "text-2xl sm:text-4xl font-black tracking-tighter",
                            upside > 0 ? "text-emerald-500" : "text-red-500",
                            isFieldHidden('upside') ? "opacity-40" : ""
                          )}>
                            <ValueDisplay value={intrinsicValue > 0 ? `${upside > 0 ? '+' : ''}${upside.toFixed(1)}%` : 'N/A'} isHidden={isFieldHidden('upside')} onToggle={() => toggleSummary('upside')} />
                          </span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1 sm:h-1.5 mt-2 sm:mt-5 overflow-hidden border border-border shadow-inner">
                          <div 
                             className={cn("h-full transition-all duration-1000 rounded-full", upside > 0 ? "bg-emerald-500" : "bg-red-500")}
                             style={{ width: `${Math.min(Math.max(Math.abs(upside), 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Insights & Small Fundamentals */}
                    <div className="flex flex-col lg:flex-row gap-3 sm:gap-6 items-stretch">
                      <div className={cn("flex-1 p-4 sm:p-5 rounded-2xl border flex items-start gap-3 sm:gap-4 bg-muted/10", themeClass)}>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <p className="text-[11px] sm:text-sm font-bold leading-relaxed opacity-90">{explanation}</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full lg:w-auto">
                        {[
                          { label: 'P/L', val: (stockData.peRatio || 0).toFixed(2) },
                          { label: 'P/VP', val: (stockData.pvp || 0).toFixed(2) },
                          { label: 'D.Y.', val: `${(stockData.dividendYield || 0).toFixed(1)}%` },
                          { label: 'ROE', val: `${(stockData.roe || 0).toFixed(1)}%` }
                        ].map((fund, idx) => (
                          <div key={idx} className="p-3 sm:p-4 bg-muted/20 border border-border rounded-xl sm:rounded-2xl flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] hover:border-indigo-500/30 transition-colors">
                            <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 sm:mb-1 opacity-60">{fund.label}</span>
                            <span className="text-xs sm:text-sm font-black text-foreground">
                              <ValueDisplay value={fund.val} isHidden={isFieldHidden(`fund_${idx}`)} onToggle={() => toggleSummary(`fund_${idx}`)} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* PAINEL DE AJUSTE DE PARÂMETROS */}
          <div className="bg-card p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] border border-border shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Calculator className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-foreground">Ajustar Parâmetros de Entrada</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Ajuste as métricas se os dados da API estiverem indisponíveis ou inconsistentes.</p>
                </div>
              </div>
              {(customEps !== '' || customBvps !== '') && (
                <button
                  onClick={() => {
                    setCustomEps('');
                    setCustomBvps('');
                  }}
                  className="text-[9px] sm:text-xs font-bold text-indigo-500 hover:text-indigo-600 underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} /> Restaurar Originais
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex-1 w-full">
                <label className="block text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-70">
                  Lucro por Ação (LPA) {customEps !== '' && <span className="text-indigo-500 font-bold">(Ajustado)</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs sm:text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={customEps}
                    placeholder={(stockData?.eps || 0).toFixed(2)}
                    onChange={(e) => setCustomEps(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 pl-9 sm:p-3 sm:pl-10 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm bg-muted/20 text-foreground transition-all"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Valor original da API: <span className="font-semibold text-foreground">R$ {(stockData?.eps || 0).toFixed(2)}</span></p>
              </div>

              <div className="flex-1 w-full">
                <label className="block text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-70">
                  Valor Patrimonial por Ação (VPA) {customBvps !== '' && <span className="text-indigo-500 font-bold">(Ajustado)</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs sm:text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={customBvps}
                    placeholder={(stockData?.bvps || 0).toFixed(2)}
                    onChange={(e) => setCustomBvps(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 pl-9 sm:p-3 sm:pl-10 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm bg-muted/20 text-foreground transition-all"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Valor original da API: <span className="font-semibold text-foreground">R$ {(stockData?.bvps || 0).toFixed(2)}</span></p>
              </div>
            </div>
          </div>

          {/* REAL-TIME ALERTS & STRATEGY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-stretch">
            <div className="lg:col-span-4 space-y-3 sm:space-y-4">
              <AnimatePresence>
                {alerts.length > 0 && alerts.map((alert, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="p-4 sm:p-5 bg-emerald-600 text-white rounded-2xl sm:rounded-[1.5rem] flex items-center gap-3 sm:gap-4 shadow-lg shadow-emerald-600/20 border border-emerald-400/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                       <Bell className="w-4 h-4 animate-ring" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{alert}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Score Card Compact */}
              <div className="bg-card p-5 sm:p-6 rounded-3xl sm:rounded-[2rem] border border-border shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className={cn("absolute inset-0 opacity-5 sm:opacity-10 bg-gradient-to-br transition-all duration-700 group-hover:opacity-15", scoreMetrics.color.replace('text-', 'from-'))} />
                <Award className={cn("w-10 h-10 mb-2 sm:mb-3 relative z-10 transition-transform duration-500 group-hover:scale-110", scoreMetrics.color)} />
                <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 relative z-10">Score Final</h3>
                <div className="flex items-baseline gap-1 mb-3 sm:mb-4 relative z-10">
                  <span className={cn("text-5xl sm:text-6xl font-black tracking-tighter", scoreMetrics.color)}>
                    <ValueDisplay value={scoreMetrics.finalScore.toFixed(1)} isHidden={isFieldHidden('score')} onToggle={() => toggleSummary('score')} />
                  </span>
                  <span className="text-sm sm:text-lg font-bold text-muted-foreground opacity-50">/10</span>
                </div>
                <div className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border relative z-10", scoreMetrics.color, "border-current bg-transparent opacity-80 backdrop-blur-sm")}>
                  {scoreMetrics.classification}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              {strategyRecommendation && (
                <div className={cn(
                  "h-full p-5 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border flex flex-col justify-center relative overflow-hidden group shadow-md sm:shadow-lg transition-all hover:shadow-xl",
                  strategyRecommendation.bg, strategyRecommendation.border
                )}>
                  {/* Background Icon */}
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                     <strategyRecommendation.icon className="w-40 h-40 sm:w-56 sm:h-56" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-10">
                    <div className={cn("w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shrink-0 border-2 sm:border-4 border-white dark:border-slate-800 transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-xl", strategyRecommendation.bg)}>
                       <strategyRecommendation.icon className={cn("w-8 h-8 sm:w-12 sm:h-12", strategyRecommendation.color)} />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 mb-2 sm:mb-3">
                         <h3 className={cn("text-lg sm:text-2xl font-black uppercase tracking-tight", strategyRecommendation.color)}>{strategyRecommendation.title}</h3>
                         <div className="hidden sm:block h-4 w-px bg-current opacity-20" />
                         <span className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60", strategyRecommendation.color)}>Análise Automatizada</span>
                      </div>
                      <p className="text-[11px] sm:text-sm font-bold text-foreground/80 leading-relaxed mb-4 sm:mb-5">{strategyRecommendation.desc}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-10">
                         <div className="flex flex-col">
                            <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase opacity-60 mb-0.5">Grau de Confiança</span>
                            <span className="text-base sm:text-xl font-black text-foreground">{(scoreMetrics.finalScore * 10).toFixed(0)}%</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase opacity-60 mb-0.5">Abordagem Sugerida</span>
                            <span className="text-xs sm:text-sm font-black text-indigo-500 uppercase">Value Investing</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
             {/* Retorno Real Intel */}
             <div className="bg-card p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-border shadow-sm sm:shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-110 group-hover:bg-indigo-500/10" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-sm transition-transform group-hover:rotate-3">
                         <Target className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-widest">Performance Real</h3>
                        <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase opacity-60">Acima do IPCA</p>
                      </div>
                   </div>
                   <div className="flex bg-muted/40 p-1 rounded-xl sm:rounded-2xl border border-border/50 w-full sm:w-auto overflow-x-auto no-scrollbar">
                      {(['1m', '6m', '1y', '5y', 'max'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriodFilter(p)}
                          className={cn(
                            "px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black rounded-lg sm:rounded-xl transition-all flex-1 sm:flex-none whitespace-nowrap",
                            periodFilter === p ? 'bg-card text-indigo-500 shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {p.toUpperCase()}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col justify-center relative z-10">
                   <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 sm:mb-8">
                      <div className="flex flex-col">
                         <div className="flex items-center gap-2 mb-1 sm:mb-2">
                           <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{profitabilityMetrics.periodLabel}</span>
                           <InfoTooltip content="Descontada a inflação acumulada no período." />
                         </div>
                         <p className={cn("text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none transition-all duration-700", profitabilityMetrics.realReturn > 0 ? "text-emerald-500" : "text-red-500")}>
                           {profitabilityMetrics.realReturn.toFixed(1)}%
                         </p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border shadow-sm w-full sm:w-auto justify-center transition-transform hover:scale-105",
                        profitabilityMetrics.bg, profitabilityMetrics.color, profitabilityMetrics.border
                      )}>
                         <profitabilityMetrics.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                         {profitabilityMetrics.status}
                      </div>
                   </div>

                   <div className="space-y-3 sm:space-y-4 pt-5 sm:pt-6 border-t border-border">
                      <div className="flex justify-between items-center group/row">
                         <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover/row:text-foreground transition-colors">Rentabilidade Nominal</span>
                         <span className="text-xs sm:text-sm font-black text-foreground">{profitabilityMetrics.nominalReturn.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center group/row">
                         <div className="flex flex-col">
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover/row:text-foreground transition-colors">IPCA Acumulado</span>
                            <span className="text-[8px] sm:text-[9px] font-black text-red-500/70 uppercase">Perda de Poder de Compra</span>
                         </div>
                         <span className="text-xs sm:text-sm font-black text-slate-400">{profitabilityMetrics.ipcaAcumulado.toFixed(2)}%</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Dynamic Insight Card */}
             <div className="bg-muted/10 border border-border p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] flex flex-col justify-between group hover:border-indigo-500/20 transition-all shadow-sm sm:shadow-md hover:shadow-lg hover:bg-muted/20">
                <div>
                   <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm transition-transform group-hover:rotate-3">
                         <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                      </div>
                      <h4 className="text-[10px] sm:text-xs font-black text-foreground uppercase tracking-[0.2em]">Conclusão da Análise</h4>
                   </div>
                   <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed mb-4 sm:mb-6 group-hover:text-foreground transition-colors">
                      {getInsight()}
                   </p>
                </div>
                <div className="flex items-center gap-3 pt-5 sm:pt-6 border-t border-border/50">
                   <div className="flex -space-x-2">
                       <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 border-2 border-background" />
                       <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500 border-2 border-background" />
                       <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 border-2 border-background" />
                   </div>
                   <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Análise Multicritério Ativa</span>
                </div>
             </div>
          </div>

          {/* RENTABILIDADE TABLE */}
          {rentabilidadeData && (
            <div className="bg-card p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-border shadow-sm sm:shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/30 to-indigo-500/30 opacity-20" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 transition-transform group-hover:rotate-3">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-[11px] sm:text-xs font-black text-foreground uppercase tracking-widest">Histórico de Retorno</h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Períodos de fechamento</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleValues}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground rounded-lg sm:rounded-xl border border-border transition-all flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest"
                >
                  {showValues ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showValues ? "Ocultar" : "Mostrar"}</span>
                </button>
              </div>

              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
                <div className="overflow-hidden border border-border rounded-xl shadow-sm min-w-full">
                  <table className="min-w-full divide-y divide-border/50">
                    <thead className="bg-muted/30">
                      <tr>
                        <th scope="col" className="py-2.5 px-4 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">Métrica</th>
                        {rentabilidadeData.map((col, i) => (
                          <th key={i} scope="col" className="py-2.5 px-2 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30 bg-card/50">
                      {/* Rentabilidade Nominal */}
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-[10px] sm:text-xs text-foreground bg-muted/10">Nominal</td>
                        {rentabilidadeData.map((col, i) => (
                          <td key={i} className="py-3 px-2 text-center font-black text-[10px] sm:text-xs">
                            {col.hasData ? (
                              <span className={cn(
                                "tabular-nums",
                                col.nominal >= 0 ? 'text-emerald-500' : 'text-red-500'
                              )}>
                                {(showValues || visibleRentabilidadeRows['nominal']) ? `${col.nominal >= 0 ? '+' : ''}${col.nominal.toFixed(1)}%` : '••%'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      {/* Rentabilidade Real */}
                      <tr className="hover:bg-muted/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-[10px] sm:text-xs text-foreground bg-muted/10">Real</td>
                        {rentabilidadeData.map((col, i) => (
                          <td key={i} className="py-3 px-2 text-center font-black text-[10px] sm:text-xs">
                            {col.hasData ? (
                              <span className={cn(
                                "tabular-nums",
                                col.real >= 0 ? 'text-emerald-500' : 'text-red-500'
                              )}>
                                {(showValues || visibleRentabilidadeRows['real']) ? `${col.real >= 0 ? '+' : ''}${col.real.toFixed(1)}%` : '••%'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAINEL DE GRÁFICOS: LINHA, COLUNA E PIZZA */}
          <div className="space-y-6">
            <AssetComparisonChart stockData={stockData} ipcaAnual={ipcaAnual} />
          </div>

          {/* SIMULATION TABLE */}
          <div className="bg-card p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-border shadow-sm sm:shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 transition-transform group-hover:-rotate-3">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-[11px] sm:text-xs font-black text-foreground uppercase tracking-widest">Simulação de Performance</h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Benchmarks vs Ativo</p>
                </div>
              </div>
              <button
                onClick={handleToggleValues}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground rounded-lg sm:rounded-xl border border-border transition-all flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest"
              >
                {showValues ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showValues ? "Ocultar" : "Mostrar"}</span>
              </button>
            </div>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
              <div className="overflow-hidden border border-border rounded-xl shadow-sm bg-card min-w-[500px] sm:min-w-full">
                <table className="min-w-full divide-y divide-border/50">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border/50">
                      <th className="py-3 px-4 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">Período</th>
                      <th className="py-3 px-2 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        {stockData.ticker}
                      </th>
                      <th className="py-3 px-2 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">CDI</th>
                      <th className="py-3 px-2 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">IBOV</th>
                      <th className="py-3 px-2 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest text-red-500/50">IPCA</th>
                      <th className="py-3 px-2 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">IVVB11</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 bg-card/50">
                    {simulationData.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-[10px] sm:text-xs text-foreground bg-muted/10">{row.label}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black tabular-nums",
                              row.stock >= 0 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                          )}>
                            {(showValues || visibleSimulationRows[i]) ? `${row.stock >= 0 ? '+' : ''}${row.stock.toFixed(1)}%` : '••%'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-[10px] sm:text-xs font-black tabular-nums hidden sm:table-cell opacity-70">
                          {(showValues || visibleSimulationRows[i]) ? `${row.cdi.toFixed(1)}%` : '••%'}
                        </td>
                        <td className="py-3 px-2 text-center text-[10px] sm:text-xs font-black tabular-nums text-foreground/80">
                          {(showValues || visibleSimulationRows[i]) ? `${row.ibov.toFixed(1)}%` : '••%'}
                        </td>
                        <td className="py-3 px-2 text-center text-[10px] sm:text-xs font-black tabular-nums text-red-500/50">
                          {(showValues || visibleSimulationRows[i]) ? `${row.ipca.toFixed(1)}%` : '••%'}
                        </td>
                        <td className="py-3 px-2 text-center text-[10px] sm:text-xs font-black tabular-nums hidden sm:table-cell opacity-70">
                          {(showValues || visibleSimulationRows[i]) ? `${row.ivvb11.toFixed(1)}%` : '••%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FUNDAMENTALS GRID PRO */}
          <div className="bg-card p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-border shadow-sm sm:shadow-md relative overflow-hidden group hover:shadow-lg transition-all duration-500">
             <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm transition-transform group-hover:-rotate-6">
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                </div>
                <h3 className="text-[11px] sm:text-xs font-black text-foreground uppercase tracking-widest">Indicadores Chave</h3>
             </div>
             <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6">
               {[
                 { label: 'P/L', val: (stockData.peRatio || 0).toFixed(1), tooltip: 'Preço sobre Lucro.' },
                 { label: 'P/VP', val: (stockData.pvp || 0).toFixed(1), tooltip: 'Preço sobre Valor Patrimonial.' },
                 { label: 'ROE', val: `${(stockData.roe || 0).toFixed(0)}%`, tooltip: 'Retorno sobre Patrimônio Líquido.' },
                 { label: 'D.Y.', val: `${(stockData.dividendYield || 0).toFixed(1)}%`, tooltip: 'Dividend Yield dos últimos 12m.' },
                 { label: 'LPA', val: epsToUse ? formatCurrency(epsToUse) : '—', tooltip: 'Lucro por Ação.' },
                 { label: 'VPA', val: bvpsToUse ? formatCurrency(bvpsToUse) : '—', tooltip: 'Valor Patrimonial por Ação.' }
               ].map((indicator, i) => (
                 <div key={i} className="flex flex-col p-3 sm:p-5 bg-muted/10 sm:bg-transparent rounded-2xl border border-border/50 sm:border-0 hover:bg-muted/30 sm:hover:bg-slate-50 dark:sm:hover:bg-slate-800/10 transition-colors group/indicator">
                   <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                     <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 group-hover/indicator:opacity-100 transition-opacity whitespace-nowrap">{indicator.label}</span>
                     <InfoTooltip content={indicator.tooltip} />
                   </div>
                   <p className="text-sm sm:text-2xl font-black text-foreground tracking-tight">{indicator.val}</p>
                   <div className="hidden sm:block w-4 h-0.5 bg-indigo-500/30 mt-2 sm:mt-3 group-hover/indicator:w-full transition-all duration-500" />
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
