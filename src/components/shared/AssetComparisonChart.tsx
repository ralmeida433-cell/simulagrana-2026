import React, { useState, useMemo } from 'react';
import { 
  LineChart as LineChartIcon, Search, X, Loader2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { searchStockData, StockData } from '../../services/stockService';

export interface CompareAsset {
  ticker: string;
  data: StockData | null;
  loading: boolean;
  error: boolean;
  color: string;
}

const COMPARE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];

interface AssetComparisonChartProps {
  stockData: StockData | null;
  ipcaAnual: number;
}

export function AssetComparisonChart({ stockData, ipcaAnual }: AssetComparisonChartProps) {
  const [compareList, setCompareList] = useState<CompareAsset[]>([]);
  const [compareTickerInput, setCompareTickerInput] = useState('');
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [useRealReturn, setUseRealReturn] = useState(false);
  const [timeRange, setTimeRange] = useState<'1y' | '5y' | '10y' | 'max'>('1y');

  const handleAddCompare = async () => {
    if (!compareTickerInput || !stockData) return;
    const ticker = compareTickerInput.toUpperCase();
    
    if (ticker === stockData.ticker || compareList.some(c => c.ticker === ticker)) {
      setCompareTickerInput('');
      return;
    }
    
    if (compareList.length >= 6) return;

    const newColor = COMPARE_COLORS[compareList.length % COMPARE_COLORS.length];
    
    const newAsset: CompareAsset = {
      ticker,
      data: null,
      loading: true,
      error: false,
      color: newColor
    };
    
    setCompareList(prev => [...prev, newAsset]);
    setIsCompareLoading(true);
    setCompareTickerInput('');

    try {
      const data = await searchStockData(ticker);
      if (data) {
        setCompareList(prev => prev.map(c => c.ticker === ticker ? { ...c, data, loading: false } : c));
      } else {
        setCompareList(prev => prev.map(c => c.ticker === ticker ? { ...c, error: true, loading: false } : c));
      }
    } catch (e) {
      setCompareList(prev => prev.map(c => c.ticker === ticker ? { ...c, error: true, loading: false } : c));
    } finally {
      setIsCompareLoading(false);
    }
  };

  const handleRemoveCompare = (tickerToRemove: string) => {
    setCompareList(prev => {
      const filtered = prev.filter(c => c.ticker !== tickerToRemove);
      return filtered.map((c, i) => ({
        ...c,
        color: COMPARE_COLORS[i % COMPARE_COLORS.length]
      }));
    });
  };

  const chartData = useMemo(() => {
    if (!stockData || !stockData.historicalPrices) return [];
    
    // Filter data based on timeRange
    const monthsMap = {
      '1y': 12,
      '5y': 60,
      '10y': 120,
      'max': 999
    };
    
    const monthsToLookBack = monthsMap[timeRange];
    const filteredPrices = timeRange === 'max' 
      ? stockData.historicalPrices 
      : stockData.historicalPrices.slice(-Math.min(monthsToLookBack + 1, stockData.historicalPrices.length));
      
    if (filteredPrices.length === 0) return [];

    const firstPrice = filteredPrices[0]?.price || 1;
    
    const compareStarts: Record<string, number> = {};
    const validCompares = compareList.filter(c => c.data && c.data.historicalPrices && c.data.historicalPrices.length > 0);
    
    validCompares.forEach(c => {
      const match = c.data!.historicalPrices.find(p => p.date === filteredPrices[0].date);
      if (match) {
        compareStarts[c.ticker] = match.price;
      } else {
        const cLen = c.data!.historicalPrices.length;
        compareStarts[c.ticker] = c.data!.historicalPrices[Math.max(0, cLen - filteredPrices.length)]?.price || 1;
      }
    });

    const monthlyIpca = (Math.pow(1 + (ipcaAnual / 100), 1/12) - 1) * 100;

    return filteredPrices.map((item, index) => {
      const monthsElapsed = index;
      const currentIpcaCompounded = (Math.pow(1 + (monthlyIpca / 100), monthsElapsed) - 1) * 100;
      
      const nominalReturn = ((item.price - firstPrice) / firstPrice) * 100;
      const realReturn = (((1 + (nominalReturn / 100)) / (1 + (currentIpcaCompounded / 100))) - 1) * 100;

      const baseValue = useRealReturn ? realReturn : nominalReturn;
      
      const res: any = {
        date: item.date,
        [stockData.ticker]: Number((100 + baseValue).toFixed(2)),
        price: item.price,
        'Retorno Real (%)': Number(realReturn.toFixed(2)),
        'IPCA Acumulado (%)': Number(currentIpcaCompounded.toFixed(2)),
      };

      validCompares.forEach(c => {
        const match = c.data!.historicalPrices.find(p => p.date === item.date);
        let cPrice = compareStarts[c.ticker];
        if (match) {
          cPrice = match.price;
        } else {
          const cLen = c.data!.historicalPrices.length;
          cPrice = c.data!.historicalPrices[Math.max(0, cLen - filteredPrices.length + index)]?.price || compareStarts[c.ticker];
        }
        const cNominalReturn = ((cPrice - compareStarts[c.ticker]) / compareStarts[c.ticker]) * 100;
        const cRealReturn = (((1 + (cNominalReturn / 100)) / (1 + (currentIpcaCompounded / 100))) - 1) * 100;

        res[c.ticker] = Number((100 + (useRealReturn ? cRealReturn : cNominalReturn)).toFixed(2));
      });

      return res;
    });
  }, [stockData, ipcaAnual, timeRange, compareList, useRealReturn]);

  if (!stockData) return null;

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="font-bold text-foreground leading-tight">Comparador de Ativos</h3>
          </div>
          <span className="text-xs text-slate-500 mt-1">Comparação Interativa de Performance (Base 100)</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setUseRealReturn(!useRealReturn)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
              useRealReturn 
                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/50' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            Descontar Inflação
          </button>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(['1y', '5y', '10y', 'max'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm'
                    : 'text-muted-foreground  hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controles de Comparação */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
          <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{stockData.ticker}</span>
        </div>
        
        {compareList.map(c => (
          <div key={c.ticker} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            {c.loading ? (
               <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
            ) : (
               <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></div>
            )}
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{c.ticker}</span>
            <button onClick={() => handleRemoveCompare(c.ticker)} className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-3 h-3"/></button>
          </div>
        ))}

        {compareList.length < 6 && (
          <div className="relative inline-flex items-center ml-2">
            <input
              type="text"
              value={compareTickerInput}
              onChange={(e) => setCompareTickerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCompare();
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-full px-3 py-1 pr-8 text-xs font-bold uppercase outline-none w-32 placeholder:normal-case placeholder:font-medium transition-colors dark:text-white"
              placeholder="Adicionar ativo"
              disabled={isCompareLoading}
            />
            <button 
              onClick={handleAddCompare} 
              disabled={isCompareLoading}
              className="absolute right-2 text-slate-400 hover:text-indigo-500"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} minTickGap={30} />
            <YAxis axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(value) => `${value}`} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: 'var(--tw-colors-slate-900, #0f172a)', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number, name: string) => [`${value}`, name]}
            />
            <ReferenceLine y={100} stroke="#94a3b8" className="dark:stroke-slate-600" strokeWidth={2} strokeDasharray="4 4" />
            <Line type="monotone" dataKey={stockData.ticker} stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            {compareList.map(c => {
              if (!c.data || c.error) return null;
              return <Line key={c.ticker} type="monotone" dataKey={c.ticker} stroke={c.color} strokeWidth={2} dot={false} />;
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
