import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, BarChart3, Minus, Calculator, RefreshCw, AlertTriangle, ShieldCheck, Zap, History,
  Search, Info, ChevronRight, FileSearch, ArrowRight, X, Eye, EyeOff, LayoutGrid, Award, Loader2, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchStockData, StockData } from '../../services/stockService';
import { formatCurrency } from '../../lib/utils';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line
} from 'recharts';
import { FinanceData } from '../../services/financeService';

export default function BuyAndHold() {
  const [simInitial, setSimInitial] = useState<number>(0);
  const [simMonthly, setSimMonthly] = useState<number>(0);
  const [simYears, setSimYears] = useState<number>(0);
  const [simRate, setSimRate] = useState<number>(0); // Annual %

  const [simData, setSimData] = useState<any[]>([]);
  const [simFinalValue, setSimFinalValue] = useState(0);
  const [simInvestedValue, setSimInvestedValue] = useState(0);
  const [simGain, setSimGain] = useState(0);

  useEffect(() => {
    const data = [];
    let currentTotal = simInitial;
    let totalInvested = simInitial;
    
    // Starting point
    data.push({
      year: 0,
      total: currentTotal,
      invested: totalInvested,
      gains: 0
    });

    const monthlyRate = (Math.pow(1 + (simRate / 100), 1/12) - 1);

    for (let i = 1; i <= simYears; i++) {
       for(let m = 1; m <= 12; m++) {
          currentTotal = (currentTotal + simMonthly) * (1 + monthlyRate);
          totalInvested += simMonthly;
       }
       data.push({
         year: i,
         total: Math.round(currentTotal),
         invested: Math.round(totalInvested),
         gains: Math.round(currentTotal - totalInvested)
       });
    }

    setSimData(data);
    setSimFinalValue(currentTotal);
    setSimInvestedValue(totalInvested);
    setSimGain(currentTotal - totalInvested);

  }, [simInitial, simMonthly, simYears, simRate]);

  // Asset Analysis
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stock, setStock] = useState<StockData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker) return;
    setLoading(true);
    setError('');
    setStock(null);

    try {
      const data = await searchStockData(ticker.toUpperCase());
      if (data) {
        setStock(data);
        if (data.dividendYield !== undefined && !isNaN(data.dividendYield)) {
          setSimRate(Number(data.dividendYield.toFixed(2)));
        }
      } else {
        setError('Ativo não encontrado ou dados indisponíveis.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  const getStockEvaluation = () => {
    if (!stock) return null;
    
    // Very simplified heuristic for demonstration
    const pe = stock.peRatio;
    let evalStatus = '';
    let evalColor = '';
    
    if (pe < 0 || pe === 0) {
      evalStatus = 'Desconto extremo ou Prejuízo';
      evalColor = 'text-amber-500';
    } else if (pe < 10) {
      evalStatus = 'Barato';
      evalColor = 'text-emerald-500';
    } else if (pe < 15) {
      evalStatus = 'Justo';
      evalColor = 'text-yellow-500';
    } else {
      evalStatus = 'Caro';
      evalColor = 'text-red-500';
    }

    const hasConsistentProfit = stock.historicalProfits && stock.historicalProfits.filter(p => p.profit > 0).length >= stock.historicalProfits.length * 0.8;

    return {
      evalStatus,
      evalColor,
      hasConsistentProfit
    };
  };

  const evaluation = getStockEvaluation();

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 sm:p-4 pb-12 overflow-hidden">

      <div className="flex items-center mb-1">
        <h2 className="text-xl sm:text-3xl font-black text-foreground flex items-center gap-2 sm:gap-3">
          <ShieldCheck className="w-5 h-5 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
          Método Buy and Hold

          <div className="group relative flex items-center ml-1 sm:ml-2">
            <Info className="w-4 h-4 sm:w-6 sm:h-6 text-slate-400 group-hover:text-indigo-500 transition-colors cursor-help" />
            <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 w-64 sm:w-80 p-3 sm:p-4 bg-slate-900 border border-slate-700 text-slate-300 text-xs sm:text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl pointer-events-none">
              <strong className="block mb-2 text-indigo-400 font-bold">O que é a estratégia?</strong>
              <p className="mb-3 leading-relaxed">Foco absoluto no longo prazo. Compre empresas sólidas e mantenha por anos (ou décadas). Ignore as oscilações de curto prazo e foque nos lucros.</p>
              <strong className="block mb-2 text-indigo-400 font-bold">O que avaliar?</strong>
              <p className="leading-relaxed">Busque lucros e margens consistentes, múltiplos justos (para não pagar caro por lucros futuros encarecidos) e use os Juros Compostos a seu favor.</p>
            </div>
          </div>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        
        {/* Card Principal: O Método */}
        <div className="lg:col-span-3 bg-card p-3 sm:p-8 rounded-xl sm:rounded-3xl border border-border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-10 sm:-mr-20 sm:-mt-20 pointer-events-none" />
          
          <div className="max-w-4xl relative z-10">
            <h3 className="text-xl sm:text-4xl font-extrabold text-foreground mb-1 sm:mb-2 tracking-tight">Buy and Hold <span className="block sm:inline text-indigo-600 dark:text-indigo-400 text-sm sm:text-4xl">(Comprar e Segurar)</span></h3>
            <p className="text-sm sm:text-xl text-muted-foreground font-medium mb-3 sm:mb-8">Estratégia de acumulação e geração de longo prazo.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-8 mb-3 sm:mb-8">
              <div className="space-y-3 sm:space-y-6">
                <div>
                  <h4 className="text-sm sm:text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" /> Como Funciona
                  </h4>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 sm:mt-2 shrink-0"/> Compra de ativos resilientes</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 sm:mt-2 shrink-0"/> Manutenção por anos ou décadas</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 sm:mt-2 shrink-0"/> Desconsideração de oscilações de curto prazo</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm sm:text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Por Que Funciona
                  </h4>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 sm:mt-2 shrink-0"/> Crescimento dos resultados acompanha a cotação</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 sm:mt-2 shrink-0"/> Efeito bola de neve (reinvestimento)</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 sm:mt-2 shrink-0"/> Redução de custos transacionais</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted/50 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-border">
                <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 mb-2 sm:mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> Inspiração & Exemplos
                </h4>
                <div className="space-y-2 sm:space-y-4">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <img src="https://ui-avatars.com/api/?name=Warren+Buffett&background=4f46e5&color=fff" alt="Warren Buffett" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">Warren Buffett</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">"Nosso prazo de investimento favorito é para sempre."</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[11px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">Exemplos Clássicos:</h5>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      <span className="px-2 py-1 sm:px-3 sm:py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-semibold">ITUB4</span>
                      <span className="px-2 py-1 sm:px-3 sm:py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-semibold">WEGE3</span>
                      <span className="px-2 py-1 sm:px-3 sm:py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-semibold">EGIE3</span>
                      <span className="px-2 py-1 sm:px-3 sm:py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-semibold">AAPL</span>
                      <span className="px-2 py-1 sm:px-3 sm:py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-semibold">KO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
              <div className="flex-1 min-w-0 sm:min-w-[200px] bg-emerald-50 dark:bg-emerald-900/20 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                <p className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-0.5 sm:mb-1"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4"/> Ponto Forte</p>
                <p className="text-[10px] sm:text-sm text-emerald-700 dark:text-emerald-300 leading-tight sm:leading-normal">Simplicidade, consistência e exige menos acompanhamento.</p>
              </div>
              <div className="flex-1 min-w-0 sm:min-w-[200px] bg-amber-50 dark:bg-amber-900/20 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-100 dark:border-amber-800/30">
                <p className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-amber-800 dark:text-amber-400 mb-0.5 sm:mb-1"><AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4"/> Ponto Fraco</p>
                <p className="text-[10px] sm:text-sm text-amber-700 dark:text-amber-300 leading-tight sm:leading-normal">Exige controle emocional, paciência e seleção rigorosa.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Simulador de Investimento */}
        <div className="lg:col-span-1 bg-card p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-border shadow-sm flex flex-col min-w-0">
          <h3 className="text-sm sm:text-xl font-bold text-foreground flex items-center gap-2 mb-3 sm:mb-6">
            <Calculator className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-500" />
            Simulador de Crescimento
          </h3>
          
          <div className="space-y-3 sm:space-y-4 flex-1">
            <div>
              <label className="block text-[10px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Aporte Inicial (R$)</label>
              <input 
                type="number" 
                value={simInitial} 
                onChange={e => setSimInitial(Number(e.target.value))} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow dark:text-white text-xs sm:text-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Aporte Mensal (R$)</label>
              <input 
                type="number" 
                value={simMonthly} 
                onChange={e => setSimMonthly(Number(e.target.value))} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow dark:text-white text-xs sm:text-sm" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[10px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Prazo (Anos)</label>
                <input 
                  type="number" 
                  value={simYears} 
                  onChange={e => setSimYears(Number(e.target.value))} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow dark:text-white text-xs sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Taxa a.a (%)</label>
                <input 
                  type="number" 
                  value={simRate} 
                  onChange={e => setSimRate(Number(e.target.value))} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow dark:text-white text-xs sm:text-sm" 
                />
              </div>
            </div>
          </div>

          <div className="mt-3 sm:mt-6 pt-3 sm:pt-6 border-t border-border">
            <div className="flex flex-col gap-2 sm:gap-5">
              <div>
                <p className="text-[10px] sm:text-sm font-medium text-slate-500 mb-0.5 sm:mb-1">Montante Final</p>
                <p className="text-xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 truncate" title={formatCurrency(simFinalValue, 'BRL')}>{formatCurrency(simFinalValue, 'BRL')}</p>
              </div>
              
              <div className="pt-2 sm:pt-4 border-t border-border">
                <p className="text-[10px] sm:text-sm font-medium text-slate-500 mb-0.5 sm:mb-1">Valor Investido</p>
                <p className="text-sm sm:text-xl font-bold text-slate-700 dark:text-slate-300 truncate" title={formatCurrency(simInvestedValue, 'BRL')}>{formatCurrency(simInvestedValue, 'BRL')}</p>
              </div>
              
              <div className="pt-2 sm:pt-4 border-t border-border flex justify-between items-center">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest">Em Juros</p>
                <p className="text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[50%]" title={'+' + formatCurrency(simGain, 'BRL')}>+{formatCurrency(simGain, 'BRL')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Análise de Ativos */}
        <div className="lg:col-span-2 bg-card p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-border shadow-sm flex flex-col">
          <h3 className="text-sm sm:text-xl font-bold text-foreground flex items-center gap-2 mb-3 sm:mb-6">
            <FileSearch className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-500" />
            Análise Rápida de Ativos
          </h3>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3 sm:mb-8">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Ex: WEGE3, AAPL..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-2xl pl-10 sm:pl-12 pr-4 py-1.5 sm:py-3.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium sm:text-lg uppercase transition-shadow dark:text-white text-xs sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !ticker}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-8 py-1.5 sm:py-3.5 rounded-lg sm:rounded-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] sm:min-w-[120px] flex items-center justify-center text-xs sm:text-base"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analisar"}
            </button>
          </form>

          {error && (
            <div className="p-2 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg sm:rounded-xl border border-red-200 dark:border-red-900/30 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              {error}
            </div>
          )}

          {stock && evaluation && (
            <div className="animate-in fade-in slide-in-from-bottom-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-8">
                {stock.logourl && (
                  <img src={stock.logourl} alt={stock.ticker} className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-contain bg-white border border-slate-200" onError={(e) => e.currentTarget.style.display = 'none'} />
                )}
                <div>
                  <h4 className="text-lg sm:text-2xl font-black text-foreground leading-tight">{stock.ticker}</h4>
                  <p className="text-[9px] sm:text-sm font-medium text-slate-500 truncate max-w-[120px] sm:max-w-xs">{stock.name}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-base sm:text-3xl font-black text-foreground leading-tight">{formatCurrency(stock.price, stock.currency)}</p>
                  <p className={`text-[9px] sm:text-sm font-bold flex items-center justify-end gap-0.5 sm:gap-1 ${(stock.changePercent || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {(stock.changePercent || 0) >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4"/> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4"/>}
                    {Math.abs(stock.changePercent || 0).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-8">
                <div className="bg-slate-50 dark:bg-slate-800 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">P/L Atual</p>
                  <p className="text-xs sm:text-lg font-bold text-foreground">{(stock.peRatio || 0).toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Div Yield</p>
                  <p className="text-xs sm:text-lg font-bold text-foreground">{(stock.dividendYield || 0).toFixed(2)}%</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">ROE</p>
                  <p className="text-xs sm:text-lg font-bold text-foreground">{(stock.roe || 0).toFixed(2)}%</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">P/VP</p>
                  <p className="text-xs sm:text-lg font-bold text-foreground">{(stock.pvp || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Avaliação Automática & Validação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-auto">
                <div className="bg-muted/50 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                    <h5 className="font-bold text-[11px] sm:text-base text-slate-800 dark:text-slate-200">Termômetro de Múltiplos</h5>
                  </div>
                  <div className="text-center py-1 sm:py-4">
                    <span className={`text-sm sm:text-3xl font-black ${evaluation.evalColor}`}>{evaluation.evalStatus}</span>
                    <p className="text-[9px] sm:text-xs text-slate-500 mt-1 sm:mt-2">Baseado no P/L histórico relativo (simulação).</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                    <h5 className="font-bold text-[11px] sm:text-base text-slate-800 dark:text-slate-200">Validação Buy & Hold</h5>
                  </div>
                  <ul className="space-y-1.5 sm:space-y-3">
                    <li className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-sm font-medium text-slate-600 dark:text-slate-400">Lucros Consistentes</span>
                      {evaluation.hasConsistentProfit ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />}
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-sm font-medium text-slate-600 dark:text-slate-400">Rentabilidade (ROE &gt; 10%)</span>
                      {stock.roe > 10 ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />}
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-sm font-medium text-slate-600 dark:text-slate-400">Resiliência (Histórico Longo)</span>
                      {(stock.historicalPrices && stock.historicalPrices.length > 60) ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />}
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          )}

          {!stock && !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-3 sm:p-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mt-3 sm:mt-0">
              <Search className="w-6 h-6 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mb-1 sm:mb-4" />
              <p className="text-slate-500 font-medium text-[10px] sm:text-base max-w-sm">Busque uma ação para avaliar se ela se encaixa nos moldes.</p>
            </div>
          )}
        </div>
        {/* Tabela de Evolução */}
        <div className="lg:col-span-3 bg-card p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col mt-2 sm:mt-4">
          <h3 className="text-sm sm:text-xl font-bold text-foreground flex items-center gap-2 mb-3 sm:mb-6">
            <History className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-500" />
            Evolução Patrimonial Anual
          </h3>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[400px] sm:min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 sm:py-4 px-3 sm:px-4 font-bold text-[9px] sm:text-sm text-muted-foreground uppercase tracking-wider">Ano</th>
                  <th className="py-2 sm:py-4 px-3 sm:px-4 font-bold text-[9px] sm:text-sm text-muted-foreground uppercase tracking-wider">Investido</th>
                  <th className="py-2 sm:py-4 px-3 sm:px-4 font-bold text-[9px] sm:text-sm text-muted-foreground uppercase tracking-wider">Juros Acum.</th>
                  <th className="py-2 sm:py-4 px-3 sm:px-4 font-bold text-[9px] sm:text-sm text-muted-foreground uppercase tracking-wider">Montante Final</th>
                </tr>
              </thead>
              <tbody>
                {simData.map((row, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-1.5 sm:py-4 px-3 sm:px-4 font-medium text-[10px] sm:text-base text-foreground">Ano {row.year}</td>
                    <td className="py-1.5 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-base text-slate-700 dark:text-slate-300 font-medium">{formatCurrency(row.invested, 'BRL')}</td>
                    <td className="py-1.5 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-base text-emerald-600 dark:text-emerald-400 font-medium">+{formatCurrency(row.gains, 'BRL')}</td>
                    <td className="py-1.5 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-base text-indigo-600 dark:text-indigo-400 font-bold">{formatCurrency(row.total, 'BRL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// Icon Definitions included directly or passed via lucide-react above
import { CheckCircle2, Star, TrendingDown, Activity, Target } from 'lucide-react';
