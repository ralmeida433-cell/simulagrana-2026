import React, { useMemo } from 'react';
import { 
  Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Line, ComposedChart, Legend
} from 'recharts';
import { Info } from 'lucide-react';

interface HistoricalPrice {
  date: string;
  price: number;
}

interface HistoricalProfit {
  year: string;
  profit: number;
  revenue: number;
  netIncome: number;
}

interface ProfitVsQuoteChartProps {
  ticker: string;
  historicalPrices: HistoricalPrice[];
  historicalProfits: HistoricalProfit[];
  currency?: string;
}

export function ProfitVsQuoteChart({ ticker, historicalPrices, historicalProfits, currency = 'R$' }: ProfitVsQuoteChartProps) {
  const chartData = useMemo(() => {
    if (!historicalProfits || historicalProfits.length === 0 || !historicalPrices || historicalPrices.length === 0) return [];

    return historicalProfits.map(profitItem => {
      const year = profitItem.year;
      
      // Find prices for that year (formats: "M/YYYY", "MM/YYYY", "M / YYYY", etc.)
      const yearPrices = historicalPrices.filter(p => {
        const dateStr = String(p.date);
        return dateStr.endsWith(year) || dateStr.includes(`/${year}`) || dateStr.endsWith(` ${year}`);
      });
      
      const yearEndPrice = yearPrices.length > 0 
        ? yearPrices[yearPrices.length - 1].price 
        : null;

      return {
        year,
        'Lucro Líquido': profitItem.netIncome,
        'Cotação': yearEndPrice,
      };
    }).filter(item => item.Cotação !== null && item['Lucro Líquido'] !== undefined);
  }, [historicalPrices, historicalProfits]);

  if (chartData.length < 2) return null;

  const formatValue = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (absVal >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (absVal >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toFixed(0);
  };

  return (
    <div className="bg-card border border-border rounded-xl sm:rounded-[2.5rem] shadow-sm p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter uppercase">Lucro vs Cotação - {ticker}</h3>
        <p className="text-sm text-muted-foreground font-medium mt-1">Comparativo de lucro líquido (barras) versus preço de mercado (linha) por ano.</p>
      </div>

      <div className="h-[350px] sm:h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted-foreground/10" />
            <XAxis 
              dataKey="year" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 700, fill: 'currentColor' }} 
              className="text-muted-foreground/60"
            />
            {/* Y1: Lucro Líquido (Bar) */}
            <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#10b981' }} 
                tickFormatter={(value) => `${currency} ${formatValue(value)}`} 
                width={80}
            />
            {/* Y2: Cotação (Line) */}
            <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#ef4444' }} 
                tickFormatter={(value) => `${currency} ${value.toFixed(0)}`}
                width={60}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
              labelStyle={{ fontSize: '14px', fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase', color: 'var(--primary)' }}
              formatter={(value: number, name: string) => {
                if (name === 'Cotação') return [`${currency} ${value.toFixed(2)}`, 'Cotação'];
                return [`${currency} ${Number(value).toLocaleString('pt-BR')}`, 'Lucro Líquido'];
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="Lucro Líquido" 
              fill="#10b981" 
              radius={[6, 6, 0, 0]} 
              barSize={Math.min(40, 100 / chartData.length)} 
              className="opacity-70 hover:opacity-100 transition-opacity" 
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="Cotação" 
              stroke="#ef4444" 
              strokeWidth={4} 
              dot={{ r: 6, strokeWidth: 3, fill: 'white' }} 
              activeDot={{ r: 8, strokeWidth: 0 }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-8 flex items-start gap-4 text-[10px] sm:text-xs font-bold text-muted-foreground leading-relaxed bg-muted/20 p-4 sm:p-6 rounded-2xl border border-border/50">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-foreground font-black uppercase tracking-wider">Por que observar essa relação?</p>
          <p>No longo prazo, o preço de uma ação tende a seguir a trajetória dos seus lucros. Quando o lucro sobe e a cotação não acompanha, pode haver uma oportunidade de valor. Por outro lado, lucros em queda com preços subindo podem indicar exuberância ou mudança nos fundamentos.</p>
        </div>
      </div>
    </div>
  );
}
