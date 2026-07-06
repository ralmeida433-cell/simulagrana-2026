import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, TrendingUp, DollarSign, PieChart, AlertCircle, CheckCircle, Info, ShieldCheck, Target, Activity, BarChart3, HelpCircle, Loader2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { formatCurrency, cn } from '../../lib/utils';
import { searchStockData, StockData } from '../../services/stockService';
import { AssetComparisonChart } from '../shared/AssetComparisonChart';
import { AssetPrice } from '../shared/AssetPrice';

const InfoTooltip = ({ content }: { content: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-flex items-center justify-center ml-1.5"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-indigo-400 cursor-help transition-colors" />
      
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

export default function BazinCalculator() {
  const [ticker, setTicker] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ticker') || '';
    }
    return '';
  });
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Bazin Inputs
  const [desiredYield, setDesiredYield] = useState(6);
  const [customDividend, setCustomDividend] = useState<number | ''>('');
  const [marginOfSafety, setMarginOfSafety] = useState(20);

  // Initial search on mount
  useEffect(() => {
    if (ticker) {
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

  const doSearch = async (targetTicker: string) => {
    if (!targetTicker) return;
    setLoading(true);
    setError('');
    try {
      const data = await searchStockData(targetTicker.toUpperCase());
      if (data) {
        setStockData(data);
        setCustomDividend(data.trailingAnnualDividendRate || 0);
      } else {
        setError('Ticker não encontrado na B3.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
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
      if (e.key === 'Enter') {
        handleSearch();
        setShowSuggestions(false);
      }
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
      } else {
        handleSearch();
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    doSearch(ticker);
  };

  const getBazinDiagnosis = (dy: number, minYield: number) => {
    if (dy >= minYield * 1.5) return { label: 'Yield Significativamente Acima da Meta', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800/50', icon: CheckCircle };
    if (dy >= minYield) return { label: 'Yield Acima da Meta', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800/50', icon: CheckCircle };
    if (dy >= minYield * 0.7) return { label: 'Yield Próximo à Meta', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: AlertCircle };
    return { label: 'Yield Abaixo da Meta', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/30', icon: AlertCircle };
  };

  const calculateScore = (dy: number, payout: number, minYield: number) => {
    let score = 0;
    // Yield score (up to 5 points)
    if (dy >= minYield) score += 5;
    else if (dy >= minYield * 0.8) score += 3;
    else if (dy >= minYield * 0.5) score += 1;

    // Payout score (up to 3 points)
    if (payout > 0 && payout <= 70) score += 3;
    else if (payout > 70 && payout <= 90) score += 1;
    else if (payout > 90) score += 0;

    // Consistency (Mocked as 2 points for now, assuming profitable)
    score += 2;

    return Math.min(10, score);
  };

  const dividendToUse = customDividend === '' ? 0 : Number(customDividend);
  const bazinFairPrice = desiredYield > 0 ? dividendToUse / (desiredYield / 100) : 0;
  const recommendedPrice = bazinFairPrice * (1 - marginOfSafety / 100);
  
  const diagnosis = stockData ? getBazinDiagnosis(stockData.dividendYield, desiredYield) : null;
  const score = stockData ? calculateScore(stockData.dividendYield, stockData.payoutRatio, desiredYield) : 0;

  // Generate chart data comparing Price vs Bazin Price
  const chartData = stockData?.historicalPrices.map(h => ({
    ...h,
    bazinPrice: bazinFairPrice
  })) || [];

// ... (inside the component)

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 pb-12">
      <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
        <h1 className="text-xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2 dark:text-slate-100 ">Valuation Bazin <span className="hidden sm:inline">(Dividendos)</span></h1>
        <p className="text-slate-500 mb-4 sm:mb-8 text-[10px] sm:text-base">O método Bazin avalia ações com base no rendimento de dividendos, buscando empresas que paguem dividendos consistentes acima de um yield mínimo considerado atrativo.</p>
        
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <label className="block text-[10px] sm:text-sm font-bold text-slate-700 mb-1 sm:mb-2 dark:text-slate-300 ">Ticker da Ação</label>
            <input
              ref={inputRef}
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => ticker.length >= 2 && setShowSuggestions(true)}
              placeholder="Ex: BBAS3"
              className="w-full p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:border-slate-800 text-xs sm:text-base dark:bg-slate-900/50"
            />
            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                {isSearchingSuggestions ? (
                  <div className="p-3 sm:p-4 flex items-center justify-center text-slate-500">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                    <span className="text-xs sm:text-sm font-medium">Buscando ativos...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-1 sm:py-2">
                    {suggestions.map((item, index) => (
                      <button
                        key={`${item.ticker}-${index}`}
                        type="button"
                        className={cn(
                          "w-full text-left px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                          index === activeSuggestionIndex ? "bg-slate-50 dark:bg-slate-800" : ""
                        )}
                        onClick={() => {
                          isSelectingRef.current = true;
                          setTicker(item.ticker);
                          setShowSuggestions(false);
                          inputRef.current?.blur();
                          doSearch(item.ticker);
                        }}
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden shrink-0">
                          {item.logourl ? (
                            <img src={item.logourl} alt={item.ticker} className="w-full h-full object-contain p-0.5 sm:p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          ) : (
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.ticker.substring(0, 2)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-xs sm:text-sm text-foreground">{item.ticker}</span>
                            <span className="text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                              {item.exchange || item.type}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-slate-500 truncate">{item.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 text-center text-slate-500 text-xs sm:text-sm font-medium">
                    Nenhum ativo encontrado para "{ticker}"
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
          <div className="flex-1 md:w-32">
            <label className="block text-[10px] sm:text-sm font-bold text-slate-700 mb-1 sm:mb-2 dark:text-slate-300 ">Yield Mínimo (%)</label>
            <input
              type="number"
              value={desiredYield}
              onChange={(e) => setDesiredYield(Number(e.target.value))}
              placeholder="Ex: 6"
              className="w-full p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:border-slate-800 text-xs sm:text-base"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full md:w-auto bg-emerald-600 text-white px-4 py-2 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-base mt-2 sm:mt-0 h-[36px] sm:h-[56px]"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" /> {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          </div>
        </div>
        {error && <div className="text-red-500 mt-2 flex items-center gap-2 text-xs sm:text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}
      </div>

      {stockData && diagnosis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-8"
        >
          {/* Inputs Secundários */}
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-6 items-center dark:bg-slate-900  dark:border-slate-800 ">
            <div className="flex-1 w-full">
              <label className="block text-[10px] sm:text-sm font-bold text-slate-700 mb-1 sm:mb-2 dark:text-slate-300 ">Dividendos Pagos (12m)</label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs sm:text-base">R$</span>
                <input
                  type="number"
                  value={customDividend}
                  onChange={(e) => setCustomDividend(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 pl-8 sm:p-3 sm:pl-10 rounded-lg sm:rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:border-slate-800 text-xs sm:text-base"
                />
              </div>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] sm:text-sm font-bold text-slate-700 mb-1 sm:mb-2 dark:text-slate-300 ">Margem de Segurança (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={marginOfSafety}
                  onChange={(e) => setMarginOfSafety(Number(e.target.value))}
                  className="w-full p-2 pr-8 sm:p-3 sm:pr-10 rounded-lg sm:rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:border-slate-800 text-xs sm:text-base"
                />
                <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs sm:text-base">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center dark:bg-slate-900  dark:border-slate-800 ">
              <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
                {stockData.logourl ? (
                  <img 
                    src={stockData.logourl} 
                    alt={`Logo ${stockData.ticker}`} 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-contain bg-white p-1 border border-border shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm sm:text-lg shadow-sm ${stockData.logourl ? 'hidden' : ''}`}>
                  {stockData.ticker.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase">Preço Atual</h3>
                  <p className="text-slate-500 text-[10px] sm:text-sm">{stockData.ticker}</p>
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-black text-foreground truncate" title={String(stockData.price)}><AssetPrice price={stockData.price} currency={stockData.currency} ticker={stockData.ticker} /></p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center dark:bg-slate-900  dark:border-slate-800 ">
              <h3 className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
                Preço Bazin
                <InfoTooltip content={
                  <div className="space-y-1 sm:space-y-2">
                    <p><strong>Fórmula de Bazin:</strong></p>
                    <p><code>Preço Estimado = Dividendos (12m) / Yield Mínimo</code></p>
                    <p>Calcula o valor máximo a pagar por uma ação para garantir um retorno mínimo em dividendos (geralmente 6%).</p>
                  </div>
                } />
              </h3>
              <p className="text-xl sm:text-3xl font-black text-foreground truncate" title={String(bazinFairPrice)}><AssetPrice price={bazinFairPrice} currency={stockData.currency} ticker={stockData.ticker} /></p>
              <p className={`text-[9px] sm:text-sm font-bold mt-1 ${stockData.price <= bazinFairPrice ? 'text-slate-600 dark:text-slate-400' : 'text-amber-600 dark:text-amber-500'}`}>
                {stockData.price <= bazinFairPrice ? 'Abaixo do Preço Estimado' : 'Acima do Preço Estimado'}
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center dark:bg-slate-900  dark:border-slate-800 ">
              <h3 className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase mb-1 sm:mb-2">Dividend Yield 12m</h3>
              <p className="text-xl sm:text-3xl font-black text-foreground ">{(stockData.dividendYield || 0).toFixed(2)}%</p>
              <p className="text-slate-500 text-[9px] sm:text-sm mt-0.5 sm:mt-1">Últimos 12 meses</p>
            </div>
            <div className={`p-4 sm:p-6 rounded-xl sm:rounded-3xl border shadow-sm flex flex-col justify-center ${diagnosis.bg} border-${diagnosis.color.split('-')[1]}-200`}>
              <h3 className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase mb-1 sm:mb-2">Status</h3>
              <div className="flex items-center gap-2 sm:gap-3">
                <diagnosis.icon className={`w-5 h-5 sm:w-8 sm:h-8 ${diagnosis.color} shrink-0`} />
                <p className={`text-[11px] sm:text-lg font-black leading-tight ${diagnosis.color}`}>{diagnosis.label}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Preço Teto Estimado */}
            <div className="lg:col-span-2 bg-slate-900 p-4 sm:p-8 rounded-xl sm:rounded-3xl shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10">
                <Target className="w-16 h-16 sm:w-32 sm:h-32" />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] sm:text-sm mb-1 sm:mb-2">Preço Teto Estimado</h3>
                <p className="text-slate-300 mb-3 sm:mb-6 max-w-md text-[10px] sm:text-base">Preço máximo calculado aplicando uma margem de segurança de {marginOfSafety}% sobre o Preço Estimado Bazin.</p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-6 mt-auto">
                  <div>
                    <p className="text-slate-400 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Preço Teto</p>
                    <p className="text-3xl sm:text-5xl font-black text-white truncate" title={String(recommendedPrice)}><AssetPrice price={recommendedPrice} currency={stockData.currency} ticker={stockData.ticker} usdClassName="text-white font-bold" /></p>
                  </div>
                  <div className="pb-1">
                    <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-sm font-bold ${stockData.price <= recommendedPrice ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {stockData.price <= recommendedPrice ? 'ABAIXO DO TETO' : 'ACIMA DO TETO'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 border-t border-slate-700/50 pt-3 sm:pt-6">
                  <div>
                    <p className="text-slate-400 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Preço Bazin</p>
                    <p className="text-sm sm:text-xl font-bold truncate" title={String(bazinFairPrice)}><AssetPrice price={bazinFairPrice} currency={stockData.currency} ticker={stockData.ticker} /></p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Margem</p>
                    <p className="text-sm sm:text-xl font-bold">{marginOfSafety}%</p>
                  </div>
                </div>
                <p className="text-[8px] sm:text-xs text-slate-500 mt-4 sm:mt-6 italic leading-relaxed">
                  Importante: esta análise é baseada em dados e modelos automatizados, podendo conter distorções. Não constitui recomendação de investimento. O investidor deve realizar avaliação própria e considerar outros fatores antes de tomar qualquer decisão.
                </p>
              </div>
            </div>

            {/* Score Bazin */}
            <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col dark:bg-slate-900  dark:border-slate-800 ">
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2 dark:text-slate-100 ">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" /> Score Bazin
              </h3>
              
              <div className="flex-1 flex flex-col justify-center items-center mb-4 sm:mb-6">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="3"
                      className="dark:stroke-slate-800"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={score >= 7 ? '#475569' : score >= 5 ? '#94a3b8' : '#cbd5e1'}
                      strokeWidth="3"
                      strokeDasharray={`${score * 10}, 100`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl sm:text-3xl font-black text-foreground ">{score.toFixed(1)}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">/ 10</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 text-[11px] sm:text-sm">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 sm:bg-transparent dark:sm:bg-transparent rounded-lg sm:rounded-none">
                  <span className="text-slate-500">Dividend Yield</span>
                  <span className="font-bold text-foreground ">{(stockData.dividendYield || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 sm:bg-transparent dark:sm:bg-transparent rounded-lg sm:rounded-none">
                  <span className="text-slate-500">Payout</span>
                  <span className="font-bold text-foreground ">{(stockData.payoutRatio || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 sm:bg-transparent dark:sm:bg-transparent rounded-lg sm:rounded-none">
                  <span className="text-slate-500">Histórico</span>
                  <span className="font-bold text-slate-600 dark:text-slate-400">Consistente</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6 dark:text-slate-100 ">Preço vs Preço Estimado Bazin</h3>
            <div className="h-64 sm:h-80 -ml-4 sm:ml-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="price" name="Preço Histórico" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="bazinPrice" name="Preço Estimado Bazin" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparador de Ativos */}
          <AssetComparisonChart stockData={stockData} ipcaAnual={4.5} />

          {/* Novos Dados Fundamentais */}
          <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h3 className="text-sm sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2 dark:text-slate-100 ">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" /> Dados Fundamentais <span className="hidden sm:inline">(Brapi Real-Time)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">P/L</p>
                <p className="text-xs sm:text-lg font-bold text-foreground ">{(stockData.peRatio || 0).toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">P/VP</p>
                <p className="text-xs sm:text-lg font-bold text-foreground ">{(stockData.pvp || 0).toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">ROE</p>
                <p className="text-xs sm:text-lg font-bold text-foreground ">{(stockData.roe || 0).toFixed(2)}%</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">LPA</p>
                <p className="text-xs sm:text-lg font-bold text-foreground "><AssetPrice price={stockData.eps} currency={stockData.currency} ticker={stockData.ticker} /></p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">VPA</p>
                <p className="text-xs sm:text-lg font-bold text-foreground "><AssetPrice price={stockData.bvps} currency={stockData.currency} ticker={stockData.ticker} /></p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">Div. Líquida</p>
                <p className="text-xs sm:text-lg font-bold text-foreground "><AssetPrice price={stockData.netDebt} currency={stockData.currency} ticker={stockData.ticker} /></p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">Margem Líquida</p>
                <p className="text-xs sm:text-lg font-bold text-foreground ">{(stockData.netMargin || 0).toFixed(2)}%</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">Payout</p>
                <p className="text-xs sm:text-lg font-bold text-foreground ">{(stockData.payoutRatio || 0).toFixed(2)}%</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">Dividend Yield</p>
                <p className="text-xs sm:text-lg font-bold text-foreground ">{(stockData.dividendYield || 0).toFixed(2)}%</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent flex flex-col justify-center">
                <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">Setor</p>
                <p className="text-[10px] sm:text-lg font-bold text-slate-900 truncate dark:text-slate-100 " title={stockData.sector}>{stockData.sector}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
