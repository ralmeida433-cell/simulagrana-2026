import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Flame, 
  Sun, 
  Home, 
  Briefcase,
  ArrowRight,
  Info,
  Zap,
  Car,
  Activity,
  DollarSign,
  TrendingDown,
  Newspaper,
  LayoutGrid,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FinanceData } from '../services/financeService';
import { formatCurrency, cn } from '../lib/utils';
import { AssetHoverMenu } from './shared/AssetHoverMenu';
import AdUnit from './AdUnit';
import { isAIConfigured, generateContentWithRetry } from '../services/aiService';
import MarketBubbles from './MarketBubbles';
import MarketComposition from './MarketComposition';

interface MarketTrend {
  ticker: string;
  name: string;
  change: number;
  price: number;
  logourl?: string;
}

interface HeatmapItem {
  ticker: string;
  change: number;
  marketCap: number;
}

interface DashboardProps {
  onNavigate: (tab: any) => void;
  financeData: FinanceData;
  onOpenIpca: () => void;
  onOpenDollarConverter: () => void;
}

export default function Dashboard({ onNavigate, financeData, onOpenIpca, onOpenDollarConverter }: DashboardProps) {
  const [trends, setTrends] = useState<{ gainers: MarketTrend[], losers: MarketTrend[], heatmap: HeatmapItem[] } | null>(null);
  const [heatmapMarket, setHeatmapMarket] = useState<'B3' | 'US'>('B3');
  const [assetType, setAssetType] = useState<'stock' | 'fund' | 'bdr' | 'etf' | 'index'>('stock');
  const [feed, setFeed] = useState<{ id: number, text: string, type: string, link?: string }[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);

  // Visibility states - All closed by default as requested
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isTrendsOpen, setIsTrendsOpen] = useState(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isCompositionOpen, setIsCompositionOpen] = useState(false);

  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoadingTrends(true);
      try {
        const typeQuery = heatmapMarket === 'B3' ? `&type=${assetType}` : '';
        const trendsRes = await fetch(`/api/fin/market-overview?market=${heatmapMarket}${typeQuery}`);
        
        if (trendsRes.ok) {
          const contentType = trendsRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await trendsRes.json();
            setTrends(data);
          } else {
            console.warn('Trends API returned non-JSON response:', await trendsRes.text().then(t => t.slice(0, 100)));
          }
        }
      } catch (e) {
        console.error('Failed to fetch trends');
      } finally {
        setIsLoadingTrends(false);
      }
    };

    fetchTrends();
  }, [heatmapMarket, assetType]);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const feedRes = await fetch('/api/fin/feed');
        if (feedRes.ok) {
          const contentType = feedRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await feedRes.json();
            const formattedData = data.map((item: any) => ({
              id: item.id,
              text: `${item.time} - ${item.title}: ${item.impact}`,
              type: item.type,
              link: item.link
            }));
            setFeed(formattedData);
            return;
          } else {
             console.warn('Feed API returned non-JSON response:', await feedRes.text().then(t => t.slice(0, 100)));
          }
        }
      } catch (e) {
        console.error('Failed to fetch feed', e);
      }
      
      // Fallback
      setFeed([
        { id: 1, text: "Bolsa americana opera em alta após dados de emprego.", type: "positive" },
        { id: 2, text: "Petróleo recua com expectativas de aumento na produção.", type: "negative" },
        { id: 3, text: "Mercado aguarda decisão do COPOM sobre taxa Selic.", type: "warning" },
        { id: 4, text: "Setor de tecnologia lidera ganhos no pregão de hoje.", type: "positive" },
      ]);
    };

    fetchFeed();
  }, []);

  const cards = [
    {
      id: 'portfolio',
      title: 'Gestão de Carteira',
      description: 'Acompanhe seu portfólio, proventos, lance transações e compare com benchmarks.',
      icon: Briefcase,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      id: 'compound',
      title: 'Juros Compostos',
      description: 'Simule o crescimento do seu patrimônio ao longo do tempo com aportes mensais.',
      icon: TrendingUp,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      id: 'magic',
      title: 'Magic Number FII',
      description: 'Calcule quantas cotas de um FII você precisa para que os dividendos comprem uma nova cota.',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      id: 'solar',
      title: 'Energia Solar',
      description: 'Calcule o payback e a economia gerada pela instalação de painéis fotovoltaicos.',
      icon: Sun,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      id: 'financing',
      title: 'Financiamento',
      description: 'Simule parcelas de financiamento imobiliário e compare com o aluguel.',
      icon: Home,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    },
    {
      id: 'mei',
      title: 'Impostos MEI',
      description: 'Calcule seus impostos mensais e DAS como Microempreendedor Individual.',
      icon: Briefcase,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      id: 'bazin',
      title: 'Dividendos Bazin',
      description: 'Identifique ações com alto rendimento de dividendos e preço atrativo.',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      id: 'vehicle',
      title: 'Depreciação Veículos',
      description: 'Calcule a depreciação e valorização do seu veículo usando dados da Tabela FIPE.',
      icon: Car,
      color: 'bg-rose-500',
      lightColor: 'bg-rose-50',
      textColor: 'text-rose-700'
    },
    {
      id: 'electric-vs-gas',
      title: 'Elétrico vs Gasolina',
      description: 'Compare o custo real de uso e a economia de um carro elétrico vs gasolina.',
      icon: Zap,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-8 sm:pb-0">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 sm:gap-6">
        <div className="max-w-2xl px-1">
          <div className="mb-4 sm:mb-6 flex flex-col items-center sm:items-start group cursor-default">
            {/* Animated Logo Icon */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3 bg-[#ECFDF5] dark:bg-emerald-950/40 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/60 dark:border-emerald-500/20 shadow-lg transition-transform duration-700 ease-out group-hover:scale-105 mx-auto sm:mx-0">
               
               {/* Chart Bars */}
               <div className="absolute bottom-4 sm:bottom-5 flex items-end gap-1 sm:gap-1.5">
                 <div className="w-2.5 sm:w-3 bg-[#10B981] rounded-t-sm h-6 sm:h-8 animate-[grow_1s_ease-out_forwards] origin-bottom opacity-0" />
                 <div className="w-2.5 sm:w-3 bg-[#059669] rounded-t-sm h-9 sm:h-11 animate-[grow_1s_ease-out_0.15s_forwards] origin-bottom opacity-0" />
                 <div className="w-2.5 sm:w-3 bg-[#059669] rounded-t-sm h-11 sm:h-14 animate-[grow_1s_ease-out_0.3s_forwards] origin-bottom opacity-0" />
                 <div className="w-2.5 sm:w-3 bg-[#064E3B] dark:bg-emerald-400 rounded-t-sm h-14 sm:h-17 animate-[grow_1s_ease-out_0.45s_forwards] origin-bottom opacity-0" />
               </div>

               {/* Upward Arrow with White Contrast, Heavy Shadow & Persistent Float */}
               <div className="absolute top-4 sm:top-5 right-4 sm:right-5 text-white drop-shadow-[0_2px_8px_rgba(4,120,87,0.9)] dark:drop-shadow-[0_2px_8px_rgba(4,120,87,1)] opacity-0 animate-[fade-in-up_1s_ease-out_0.8s_forwards,float-arrow-premium_3s_ease-in-out_1.8s_infinite]">
                  <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={3} />
               </div>
            </div>

            {/* Text Logo */}
            <div className="flex flex-col sm:items-start items-center">
              <div className="flex items-baseline mb-0.5">
                 <span className="text-3xl sm:text-4xl font-extrabold text-emerald-900 dark:text-emerald-50 tracking-tight">
                   Simula
                 </span>
                 <span className="text-3xl sm:text-4xl font-extrabold text-emerald-500 tracking-tight animate-pulse">
                   Grana
                 </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em] sm:tracking-[0.3em] overflow-hidden mt-1">
                 <span className="block translate-y-full opacity-0 animate-[slide-up_0.8s_ease-out_0.6s_forwards]">
                   O seu futuro financeiro
                 </span>
              </span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed transition-colors duration-200 text-center sm:text-left max-w-[90%] sm:max-w-none mx-auto sm:mx-0">
            Sua central de ferramentas financeiras premium com taxas atualizadas em tempo real.
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 snap-x snap-mandatory overflow-x-auto sm:overflow-visible scrollbar-hide">
          <div className="bg-card border border-border p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-colors duration-200">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Selic Atual</p>
              <p className="text-sm sm:text-lg font-bold text-foreground">{financeData.selic}%</p>
            </div>
          </div>
          <div className="bg-card border border-border p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-colors duration-200">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1">
                <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Ibovespa</p>
                {financeData.ibovespa?.change !== undefined && (
                  <span className={cn(
                    "text-[8px] font-bold px-1 rounded scale-90",
                    financeData.ibovespa.change >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                  )}>
                    {financeData.ibovespa.change >= 0 ? '+' : ''}{financeData.ibovespa.change.toFixed(2)}%
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-lg font-bold text-foreground leading-tight">
                {financeData.ibovespa?.points ? financeData.ibovespa.points.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '126.300'} pts
              </p>
              <p className="text-[8px] sm:text-[10px] text-muted-foreground">
                BOVA11: <span className="font-semibold text-foreground">R$ {financeData.bova11?.price ? financeData.bova11.price.toFixed(2) : '121.50'}</span>
              </p>
            </div>
          </div>
          <div 
            onClick={onOpenIpca}
            className="bg-card border border-border p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-all duration-200 cursor-pointer hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5"
          >
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-50 dark:bg-orange-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <Info className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-tight">IPCA (12m)</p>
              <p className="text-sm sm:text-lg font-bold text-foreground">{financeData.ipca}%</p>
            </div>
          </div>
          <div className="bg-card border border-border p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-colors duration-200">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-rose-50 dark:bg-rose-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Activity className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-tight">INPC (12m)</p>
              <p className="text-sm sm:text-lg font-bold text-foreground">{financeData.inpc}%</p>
            </div>
          </div>
          <div className="bg-card border border-border p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-colors duration-200">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Briefcase className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Salário Mínimo</p>
              <p className="text-sm sm:text-lg font-bold text-foreground truncate max-w-[80px] sm:max-w-none">{formatCurrency(financeData.minimumWage)}</p>
            </div>
          </div>
          <div 
            onClick={onOpenDollarConverter}
            className="bg-card border border-border p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-all duration-200 cursor-pointer hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5"
          >
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Dólar (USD)</p>
              <p className="text-sm sm:text-lg font-bold text-foreground truncate max-w-[80px] sm:max-w-none">R$ {financeData.usd?.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className="group bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10 transition-all duration-300 text-left flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.lightColor.replace('bg-', 'dark:bg-').replace('50', '500/10')} ${card.lightColor} rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.textColor.replace('700', '400')} ${card.textColor}`} />
              </div>
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                REAL-TIME
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 sm:mb-2">{card.title}</h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 flex-1 line-clamp-2 md:line-clamp-none">
              {card.description}
            </p>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm">
              Começar Simulação
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {/* Market Intelligence Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Mercado em Tempo Real</h3>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Global Market Intelligence</p>
            </div>
          </div>
          
          <div className="flex bg-muted rounded-xl p-1 w-full sm:w-auto">
            <button
              onClick={() => setHeatmapMarket('B3')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2 text-xs font-black rounded-lg transition-all",
                heatmapMarket === 'B3' 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              BRASIL (B3)
            </button>
            <button
              onClick={() => setHeatmapMarket('US')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2 text-xs font-black rounded-lg transition-all",
                heatmapMarket === 'US' 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              USA (STOCKS)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Feed */}
          <div className="lg:col-span-1 bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-fit">
            <button 
              onClick={() => setIsFeedOpen(!isFeedOpen)}
              className="w-full p-4 border-b border-border flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Market Feed</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600">LIVE</span>
                </div>
                {isFeedOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
            
            <AnimatePresence>
              {isFeedOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {feed.map((item) => (
                      <div key={item.id} className="flex gap-3 group cursor-default">
                        <div className={cn(
                          "w-1 shrink-0 rounded-full transition-all group-hover:w-1.5",
                          item.type === 'positive' ? "bg-emerald-500" : item.type === 'warning' ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                        )} />
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs leading-relaxed text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            {item.text}
                          </a>
                        ) : (
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {item.text}
                          </p>
                        )}
                      </div>
                    ))}
                    {feed.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-50">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sincronizando...</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Market Trends (Gainers/Losers) */}
          <div className="lg:col-span-2 flex flex-col h-fit">
             <button 
              onClick={() => setIsTrendsOpen(!isTrendsOpen)}
              className="w-full bg-card p-4 rounded-2xl border border-border flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors mb-4"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold">Destaques do Dia</h3>
              </div>
              {isTrendsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>

            <AnimatePresence>
              {isTrendsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4">
                    {heatmapMarket === 'B3' && (
                      <div className="flex bg-muted rounded-xl p-1 overflow-x-auto scrollbar-hide border border-border/50">
                        {[
                          { id: 'stock', label: 'Ações' },
                          { id: 'fund', label: 'FIIs' },
                          { id: 'bdr', label: 'BDRs' },
                          { id: 'etf', label: 'ETFs' },
                          { id: 'index', label: 'Índices' }
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setAssetType(type.id as any)}
                            className={cn(
                              "flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all",
                              assetType === type.id 
                                ? "bg-card text-foreground shadow-sm border border-border/50" 
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Gainers */}
                      <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center gap-2 bg-emerald-50/30 dark:bg-emerald-500/5">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">Maiores Altas</h3>
                        </div>
                        <div className="divide-y divide-border">
                        {(trends?.gainers || []).slice(0, 10).map((stock, i) => (
                          <div key={`${stock.ticker}-${i}`} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              {stock.logourl ? (
                                <img 
                                  src={stock.logourl} 
                                  alt={stock.ticker} 
                                  className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-border"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : null}
                              <div className={`w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] ${stock.logourl ? 'hidden' : ''}`}>
                                {stock.ticker.substring(0, 2)}
                              </div>
                              <div className="flex flex-col">
                                <AssetHoverMenu ticker={stock.ticker}>
                                  <span className="text-xs font-bold uppercase tracking-tight">{stock.ticker}</span>
                                </AssetHoverMenu>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{stock.name}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-mono font-bold">{heatmapMarket === 'US' ? '$' : 'R$'} {stock.price.toFixed(2)}</span>
                              <span className="text-[10px] font-bold text-emerald-500">+{stock.change.toFixed(2)}%</span>
                            </div>
                          </div>
                        ))}
                        {isLoadingTrends && Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="p-3 flex items-center justify-between animate-pulse">
                            <div className="space-y-2">
                              <div className="h-3 w-12 bg-muted rounded" />
                              <div className="h-2 w-20 bg-muted/50 rounded" />
                            </div>
                            <div className="space-y-2 items-end flex flex-col">
                              <div className="h-3 w-16 bg-muted rounded" />
                              <div className="h-2 w-10 bg-emerald-100/50 dark:bg-emerald-500/10 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Losers */}
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                      <div className="p-4 border-b border-border flex items-center gap-2 bg-red-50/30 dark:bg-red-500/5">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Maiores Baixas</h3>
                      </div>
                      <div className="divide-y divide-border">
                        {(trends?.losers || []).slice(0, 10).map((stock, i) => (
                          <div key={`${stock.ticker}-${i}`} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              {stock.logourl ? (
                                <img 
                                  src={stock.logourl} 
                                  alt={stock.ticker} 
                                  className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-border"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : null}
                              <div className={`w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-[10px] ${stock.logourl ? 'hidden' : ''}`}>
                                {stock.ticker.substring(0, 2)}
                              </div>
                              <div className="flex flex-col">
                                <AssetHoverMenu ticker={stock.ticker}>
                                  <span className="text-xs font-bold uppercase tracking-tight">{stock.ticker}</span>
                                </AssetHoverMenu>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{stock.name}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-mono font-bold">{heatmapMarket === 'US' ? '$' : 'R$'} {stock.price.toFixed(2)}</span>
                              <span className="text-[10px] font-bold text-red-500">{stock.change.toFixed(2)}%</span>
                            </div>
                          </div>
                        ))}
                        {isLoadingTrends && Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="p-3 flex items-center justify-between animate-pulse">
                            <div className="space-y-2">
                              <div className="h-3 w-12 bg-muted rounded" />
                              <div className="h-2 w-20 bg-muted/50 rounded" />
                            </div>
                            <div className="space-y-2 items-end flex flex-col">
                              <div className="h-3 w-16 bg-muted rounded" />
                              <div className="h-2 w-10 bg-red-100/50 dark:bg-red-500/10 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Market Heatmap Section */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button 
          onClick={() => setIsHeatmapOpen(!isHeatmapOpen)}
          className="w-full p-4 border-b border-border flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Mapa de Mercado</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Alta</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Baixa</span>
              </div>
            </div>
            {isHeatmapOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        <AnimatePresence>
          {isHeatmapOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-2 sm:p-4 h-[350px] sm:h-[550px] relative">
                {isLoadingTrends ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Carregando Mapa...</span>
                    </div>
                  </div>
                ) : (
                  <MarketBubbles data={trends?.heatmap || []} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Market Composition Section */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button 
          onClick={() => setIsCompositionOpen(!isCompositionOpen)}
          className="w-full p-4 border-b border-border flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Composição do Mercado</h3>
          </div>
          {isCompositionOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {isCompositionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className=""
            >
              <div className="p-4">
                <MarketComposition initialMarket={heatmapMarket} showHeader={false} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

      {/* AdSense Unit */}
      <AdUnit slot="XXXXXXXXXX" className="rounded-2xl bg-card border border-border p-4" />

      <div className="bg-emerald-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Salário Mínimo {new Date().getFullYear()}</h2>
          <p className="text-emerald-100/90 text-sm sm:text-base mb-6 leading-relaxed">
            O valor base para o cálculo do MEI e diversos benefícios é de <span className="font-bold text-white">{formatCurrency(financeData.minimumWage)}</span>. Mantenha seu planejamento em dia!
          </p>
          <button 
            onClick={() => onNavigate('mei')}
            className="w-full sm:w-auto bg-background text-foreground px-6 py-3 rounded-xl font-bold hover:bg-muted transition-colors text-sm"
          >
            Ver Impostos MEI
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/50 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-700/30 rounded-full -mr-10 -mb-10 blur-2xl" />
      </div>
    </div>
  );
}

