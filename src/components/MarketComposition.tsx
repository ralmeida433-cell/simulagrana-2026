import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon, RefreshCw } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

interface CompositionData {
  companies: {
    symbol: string;
    name: string;
    marketCap: number;
    weight: number;
    sector: string;
    category: string;
  }[];
  sectors: {
    name: string;
    value: number;
    weight: number;
  }[];
}

const COLORS = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#ea580c', '#4f46e5', '#16a34a'];

export default function MarketComposition({ initialMarket, showHeader = true }: { initialMarket?: 'B3' | 'US', showHeader?: boolean }) {
  const [market, setMarket] = useState<'B3' | 'US'>(initialMarket || 'B3');
  const [viewType, setViewType] = useState<'companies' | 'sectors'>('companies');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Large Cap' | 'Mid Cap' | 'Small Cap'>('All');
  const [data, setData] = useState<CompositionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (initialMarket) setMarket(initialMarket);
  }, [initialMarket]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/fin/composition?market=${market}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const json = await res.json();
            setData(json);
          } else {
            console.warn('Composition API returned non-JSON response:', await res.text().then(t => t.slice(0, 100)));
          }
        }
      } catch (error) {
        console.error('Failed to fetch composition data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [market]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold pointer-events-none">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
          <p className="text-white font-bold text-sm mb-1">{data.symbol || data.name}</p>
          {data.name && data.symbol && <p className="text-slate-400 text-xs mb-2">{data.name}</p>}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Market Cap:</span>
              <span className="text-white font-medium">{formatCurrency(data.marketCap || data.value, market === 'US' ? 'USD' : 'BRL')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Peso:</span>
              <span className="text-emerald-400 font-bold">{data.weight.toFixed(2)}%</span>
            </div>
            {data.sector && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Setor:</span>
                <span className="text-white">{data.sector}</span>
              </div>
            )}
            {data.category && data.category !== 'All' && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Categoria:</span>
                <span className="text-white">{data.category}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  let chartData: any[] = viewType === 'companies' ? (data?.companies || []) : (data?.sectors || []);
  
  if (viewType === 'companies' && categoryFilter !== 'All' && chartData.length > 0) {
    chartData = chartData.filter((c: any) => c.category === categoryFilter || c.symbol === 'OUTRAS');
    // Recalculate weights for filtered data
    const totalMarketCap = chartData.reduce((sum: number, c: any) => sum + (c.marketCap || 0), 0);
    chartData = chartData.map((c: any) => ({
      ...c,
      weight: totalMarketCap > 0 ? ((c.marketCap || 0) / totalMarketCap) * 100 : 0
    }));
  }

  // Generate distinct colors based on index
  const getColors = (count: number) => {
    const baseColors = [
      '#059669', // emerald
      '#2563eb', // blue
      '#d97706', // amber
      '#dc2626', // red
      '#7c3aed', // violet
      '#db2777', // pink
      '#0891b2', // cyan
      '#ea580c', // orange
      '#4f46e5', // indigo
      '#16a34a', // green
      '#ca8a04', // yellow
      '#c026d3', // fuchsia
      '#0284c7', // light blue
      '#b91c1c', // dark red
      '#4338ca', // dark indigo
      '#64748b'  // slate (for "Outras")
    ];
    
    return Array.from({ length: count }).map((_, i) => {
      if (chartData && chartData[i] && (chartData[i] as any).symbol === 'OUTRAS') {
        return '#64748b'; // Always slate for "Outras"
      }
      return baseColors[i % baseColors.length];
    });
  };

  const colors = chartData ? getColors(chartData.length) : [];

  // Custom legend to handle wrapping better
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col gap-y-2 text-[10px] max-h-[300px] overflow-y-auto scrollbar-hide px-2">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-sm flex-shrink-0" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground truncate max-w-[120px]" title={entry.value}>
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={cn("bg-card rounded-2xl overflow-hidden", showHeader && "border border-border")}>
      {showHeader && (
        <div className="p-4 border-b border-border flex flex-col lg:flex-row items-start lg:items-center justify-between bg-muted/50 gap-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Composição do Mercado</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setMarket('B3')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                  market === 'B3' 
                    ? "bg-white dark:bg-slate-700 text-foreground shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                IBOV
              </button>
              <button
                onClick={() => setMarket('US')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                  market === 'US' 
                    ? "bg-white dark:bg-slate-700 text-foreground shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                EUA
              </button>
            </div>

            <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewType('companies')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                  viewType === 'companies' 
                    ? "bg-white dark:bg-slate-700 text-foreground shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Empresas
              </button>
              <button
                onClick={() => setViewType('sectors')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                  viewType === 'sectors' 
                    ? "bg-white dark:bg-slate-700 text-foreground shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Setores
              </button>
            </div>
          
            {viewType === 'companies' && (
              <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
                {['All', 'Large Cap', 'Mid Cap', 'Small Cap'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat as any)}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                      categoryFilter === cat 
                        ? "bg-white dark:bg-slate-700 text-foreground shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    {cat === 'All' ? 'Todas' : cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Internal Controls for when used without parent header */}
      {!showHeader && (
        <div className="px-4 pt-4 flex flex-wrap items-center gap-4">
           <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewType('companies')}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md transition-all",
                viewType === 'companies' 
                  ? "bg-white dark:bg-slate-700 text-foreground shadow-sm px-4" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              Empresas
            </button>
            <button
              onClick={() => setViewType('sectors')}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md transition-all",
                viewType === 'sectors' 
                  ? "bg-white dark:bg-slate-700 text-foreground shadow-sm px-4" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              Setores
            </button>
          </div>

          {viewType === 'companies' && (
            <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto scrollbar-hide">
              {['All', 'Large Cap', 'Mid Cap', 'Small Cap'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat as any)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap",
                    categoryFilter === cat 
                      ? "bg-white dark:bg-slate-700 text-foreground shadow-sm px-4" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {cat === 'All' ? 'Todas' : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4 h-[550px] sm:h-[500px] w-full">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 opacity-50">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Carregando Dados...</span>
            </div>
          </div>
        ) : chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart margin={{ top: 40, right: 0, bottom: 40, left: 0 }}>
              <Pie
                data={chartData}
                cx={isMobile ? "50%" : "40%"}
                cy={isMobile ? "50%" : "50%"}
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={isMobile ? 100 : 130}
                innerRadius={viewType === 'sectors' ? (isMobile ? 50 : 70) : 0}
                fill="#8884d8"
                dataKey={viewType === 'companies' ? 'marketCap' : 'value'}
                nameKey={viewType === 'companies' ? 'symbol' : 'name'}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={2}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index]} 
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={renderLegend} 
                layout={isMobile ? "horizontal" : "vertical"}
                verticalAlign={isMobile ? "bottom" : "middle"}
                align={isMobile ? "center" : "right"}
                wrapperStyle={isMobile ? { bottom: 0, width: '100%' } : { right: '5%', top: '50%', transform: 'translateY(-50%)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            Nenhum dado disponível.
          </div>
        )}
      </div>
    </div>
  );
}
