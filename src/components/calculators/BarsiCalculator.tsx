import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Info, Search, RefreshCw, DollarSign, HelpCircle, Loader2 } from 'lucide-react';
import { searchStockData, StockData } from '../../services/stockService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
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

export default function BarsiCalculator() {
  const [ticker, setTicker] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ticker') || '';
    }
    return '';
  });
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetYield, setTargetYield] = useState<number>(9);

  // Initial search on mount
  useEffect(() => {
    if (ticker) {
      doSearch(ticker);
    }
  }, []);

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
    setError(null);
    setStockData(null);
    
    try {
      const data = await searchStockData(targetTicker);
      if (data) {
        setStockData(data);
      } else {
        setError('Ativo não encontrado ou sem dados de dividendos.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados do ativo.');
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

  const dps = stockData ? stockData.price * (stockData.dividendYield / 100) : 0;
  const precoTeto = targetYield > 0 ? dps / (targetYield / 100) : 0;
  const margemSeguranca = stockData ? ((precoTeto - stockData.price) / stockData.price) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4 sm:space-y-8 dark:bg-slate-900  dark:border-slate-800 overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg sm:rounded-xl text-emerald-700">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="text-sm sm:text-xl font-bold text-foreground ">Método Luiz Barsi <span className="hidden sm:inline">(Preço Teto Estimado)</span></h2>
          <p className="text-slate-500 text-[10px] sm:text-sm">Calcule o preço teto para garantir seu Dividend Yield alvo.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 relative">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => ticker.length >= 2 && setShowSuggestions(true)}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none uppercase text-xs sm:text-base dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            placeholder="Digite o ticker (ex: TAEE11)"
          />
          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[250px] overflow-y-auto">
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
        <button onClick={handleSearch} disabled={loading} className="px-4 py-2 sm:px-6 sm:py-2.5 bg-emerald-600 text-white rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-base">
          {loading ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Search className="w-4 h-4 sm:w-5 sm:h-5" />}
          Buscar
        </button>
      </div>

      {error && <p className="text-red-500 text-xs sm:text-sm font-medium">{error}</p>}

      {stockData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-border dark:bg-slate-800 ">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                {stockData.logourl ? (
                  <img 
                    src={stockData.logourl} 
                    alt={`Logo ${stockData.ticker}`} 
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-contain bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm sm:text-lg shadow-sm ${stockData.logourl ? 'hidden' : ''}`}>
                  {stockData.ticker.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-lg text-foreground">Dados Atuais</h3>
                  <p className="text-slate-500 text-[10px] sm:text-sm">{stockData.ticker}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div><p className="text-[10px] sm:text-sm text-slate-500">Preço Atual</p><p className="text-sm sm:text-xl font-bold text-foreground"><AssetPrice price={stockData.price} currency={stockData.currency} ticker={stockData.ticker} /></p></div>
                <div><p className="text-[10px] sm:text-sm text-slate-500">Dividend Yield</p><p className="text-sm sm:text-xl font-bold text-foreground">{(stockData.dividendYield || 0).toFixed(2)}%</p></div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl border border-slate-200 dark:bg-slate-900  dark:border-slate-800 ">
              <h3 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4 flex items-center">
                Simulação de Preço Teto Estimado
                <InfoTooltip content={
                  <div className="space-y-1 sm:space-y-2">
                    <p><strong>Fórmula de Barsi:</strong></p>
                    <p><code>Preço Teto = (Dividendo por Ação) / (Yield Alvo)</code></p>
                    <p>Calcula o preço máximo a pagar por uma ação para garantir o rendimento desejado com base nos dividendos pagos.</p>
                  </div>
                } />
              </h3>
              <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2 dark:text-slate-300">Yield Alvo (%):</label>
              <input type="number" step="0.1" value={targetYield} onChange={(e) => setTargetYield(Number(e.target.value))} className="w-full px-3 py-1.5 sm:p-2 border rounded-lg sm:rounded-xl mb-3 sm:mb-4 outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-base dark:bg-slate-800 dark:border-slate-700" />
              
              <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl dark:bg-slate-800 ">
                <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-400">Preço Teto Estimado para {targetYield}% de Yield</p>
                <p className="text-xl sm:text-3xl font-bold text-foreground "><AssetPrice price={precoTeto} currency={stockData.currency} ticker={stockData.ticker} /></p>
              </div>
              <p className={cn("text-center mt-2 text-[10px] sm:text-sm font-bold", margemSeguranca > 0 ? "text-slate-600 dark:text-slate-400" : "text-amber-600 dark:text-amber-500")}>
                {margemSeguranca > 0 ? `Margem de Segurança: ${margemSeguranca.toFixed(1)}%` : `Acima do Preço Teto Estimado`}
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-border dark:bg-slate-800 ">
            <h3 className="font-bold text-sm sm:text-lg mb-2 sm:mb-4">Sobre o Método</h3>
            <p className="text-slate-600 text-[10px] sm:text-sm leading-relaxed dark:text-slate-400 ">
              O método de Luiz Barsi foca em comprar ações que pagam bons dividendos a preços que garantam um retorno mínimo (Yield) sobre o capital investido.
              <br /><br className="hidden sm:block" />
              <strong>Preço Teto Estimado = (Dividendo por Ação) / (Yield Alvo)</strong>
              <br /><br className="hidden sm:block" />
              Se o preço de mercado estiver abaixo do Preço Teto Estimado, a ação apresenta um yield projetado superior ao alvo estabelecido.
            </p>
          </div>
        </div>
      )}
      {/* Novos Dados Fundamentais */}
      {stockData && (
        <div className="bg-slate-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border dark:bg-slate-800 ">
          <h3 className="text-sm sm:text-lg font-bold text-slate-900 mb-3 sm:mb-6 flex items-center gap-2 dark:text-slate-100 ">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /> Dados Fundamentais <span className="hidden sm:inline">(Brapi Real-Time)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-6">
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">P/L</p>
              <p className="text-xs sm:text-sm font-bold text-foreground ">{(stockData.peRatio || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">P/VP</p>
              <p className="text-xs sm:text-sm font-bold text-foreground ">{(stockData.pvp || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">ROE</p>
              <p className="text-xs sm:text-sm font-bold text-foreground ">{(stockData.roe || 0).toFixed(2)}%</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">LPA</p>
              <p className="text-xs sm:text-sm font-bold text-foreground ">R$ {(stockData.eps || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">VPA</p>
              <p className="text-xs sm:text-sm font-bold text-foreground ">R$ {(stockData.bvps || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">Div. Líquida</p>
              <p className="text-xs sm:text-sm font-bold text-foreground ">R$ {((stockData.netDebt || 0) / 1e9).toFixed(2)}B</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">Margem Líq.</p>
              <p className="text-xs sm:text-sm font-bold text-foreground ">{(stockData.netMargin || 0).toFixed(2)}%</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">Payout</p>
              <p className="text-xs sm:text-sm font-bold text-foreground ">{(stockData.payoutRatio || 0).toFixed(2)}%</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">DY</p>
              <p className="text-xs sm:text-sm font-bold text-foreground ">{(stockData.dividendYield || 0).toFixed(2)}%</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 sm:p-0 rounded-lg sm:rounded-none sm:bg-transparent dark:sm:bg-transparent flex flex-col justify-center">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 sm:mb-1">Setor</p>
              <p className="text-[10px] sm:text-sm font-bold text-slate-900 truncate dark:text-slate-100 " title={stockData.sector}>{stockData.sector}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
