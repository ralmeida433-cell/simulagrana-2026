import { useState, FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Loader2, 
  TrendingUp, 
  AlertCircle, 
  BarChart3, 
  DollarSign, 
  Activity, 
  Info, 
  Play, 
  FileText, 
  Brain, 
  Users, 
  Building, 
  Building2,
  Globe, 
  LineChart as LineChartIcon,
  Scale,
  Scaling,
  Target,
  Zap,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  BrainCircuit,
  PieChart,
  Download,
  Sparkles
} from 'lucide-react';

const getTopicIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t === 'financials' || t.includes('indicadores')) return <LineChartIcon className="w-5 h-5 text-blue-500" />;
  if (t === 'chart' || t.includes('lucro') || t.includes('cotacao')) return <Activity className="w-5 h-5 text-emerald-500" />;
  if (t === 'users' || t.includes('acion') || t.includes('investidor')) return <Users className="w-5 h-5 text-purple-500" />;
  if (t === 'globe' || t.includes('macro')) return <Globe className="w-5 h-5 text-orange-500" />;
  if (t === 'building' || t.includes('governanca')) return <Building2 className="w-5 h-5 text-indigo-500" />;
  if (t === 'valuation' || t.includes('valor')) return <Scaling className="w-5 h-5 text-rose-500" />;
  if (t === 'risk' || t.includes('risco')) return <ShieldAlert className="w-5 h-5 text-red-500" />;
  if (t === 'eficiencia' || t.includes('receita')) return <Zap className="w-5 h-5 text-cyan-500" />;
  if (t === 'brain' || t.includes('inteligencia')) return <BrainCircuit className="w-5 h-5 text-violet-500" />;
  if (t === 'target' || t.includes('tese')) return <Target className="w-5 h-5 text-indigo-500" />;
  if (t === 'info' || t.includes('fonte')) return <Info className="w-5 h-5 text-slate-500" />;
  return <PieChart className="w-5 h-5 text-indigo-500" />;
};
import Markdown from 'react-markdown';
import { isAIConfigured, generateContentWithRetry } from '../services/aiService';
import ReportAudioPlayer from './ReportAudioPlayer';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';
import { AssetComparisonChart } from './shared/AssetComparisonChart';
import { AssetPrice } from './shared/AssetPrice';

// Tooltip Component
const InfoTooltip = ({ content }: { content: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      <Info className="w-4 h-4 text-slate-400 hover:text-emerald-500 cursor-help transition-colors" />
      {isVisible && (
        <div className="absolute z-50 w-64 p-3 mt-2 -ml-32 text-sm bg-slate-800 text-white rounded-lg shadow-xl border border-slate-700">
          {content}
          <div className="absolute top-0 left-1/2 -mt-2 -ml-1 border-4 border-transparent border-b-slate-800"></div>
        </div>
      )}
    </div>
  );
};

const IndicatorRow = ({ label, value, tooltip }: { label: string, value: string | number, tooltip: React.ReactNode }) => (
  <div className="flex justify-between items-center pb-3 border-b border-border">
    <div className="flex items-center">
      <span className="text-slate-500 text-sm">{label}</span>
      <InfoTooltip content={tooltip} />
    </div>
    <span className="font-bold text-slate-800 dark:text-slate-200 ">{value}</span>
  </div>
);

const safeFormat = (val: any, isPercent: boolean = false, allowZero: boolean = true) => {
  if (val === null || val === undefined) return 'N/D';
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return 'N/D';
  if (num === 0 && !allowZero) return 'N/D';
  return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${isPercent ? '%' : ''}`;
};

export interface DeepAnalysisData {
  header: {
    score: number;
    classification: string;
  };
  executiveSummary: {
    insights: string[];
  };
  topics: {
    title: string;
    iconType: string;
    indicators: {
      label: string;
      value: string;
      status: 'positivo' | 'neutro' | 'risco';
      insight: string;
      progress?: number; 
    }[];
    conclusion: string;
  }[];
  methods?: {
    investor: string;
    verdict: string;
    status: 'positivo' | 'neutro' | 'risco';
    explanation: string;
  }[];
  scenarios: {
    optimistic: string;
    conservative: string;
    pessimistic: string;
  };
  finalCheck: {
    question: string;
    answer: string;
    status: 'positivo' | 'neutro' | 'risco';
  }[];
  strategicDecision: {
    decision: 'Compra' | 'Neutro' | 'Venda';
    justification: string;
  };
  narrationText?: string;
}

const getStatusColor = (status: string) => {
  if (status.includes('positivo')) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
  if (status.includes('risco') || status.includes('negativo') || status.includes('venda')) return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
};

const getStatusIcon = (status: string) => {
  if (status.includes('positivo')) return '✔️';
  if (status.includes('risco') || status.includes('negativo')) return '❌';
  return '⚠️';
};

const MiniSparkline = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;
  const isPositive = data[data.length - 1]?.close >= data[0]?.close;
  
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke={isPositive ? "#10b981" : "#ef4444"} 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const ComparisonBar = ({ label, value, median, unit = '' }: { label: string, value: number, median: number, unit?: string }) => {
  const valuePos = median !== 0 ? (value / median) * 50 : 50;
  const finalValuePos = Math.min(100, Math.max(5, valuePos));
  
  const isBetter = value > median; 

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>{label}</span>
        <span className={isBetter ? "text-emerald-600" : "text-amber-600"}>{value?.toFixed(1)}{unit}</span>
      </div>
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden flex items-center">
        <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-slate-400 z-10 opacity-50"></div>
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", isBetter ? "bg-emerald-500" : "bg-amber-500")} 
          style={{ width: `${finalValuePos}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-[9px] text-slate-400">
        <span>0</span>
        <span className="absolute left-[50%] -translate-x-1/2">Setor: {median}{unit}</span>
        <span>2x Setor</span>
      </div>
    </div>
  );
};

const DeepAnalysisBoard = ({ data, ticker, stockData }: { data: DeepAnalysisData, ticker: string, stockData: any }) => {
  const scoreColor = data.header.score >= 70 ? 'text-emerald-600' : data.header.score <= 40 ? 'text-red-600' : 'text-yellow-500';
  const scoreBgLine = data.header.score >= 70 ? 'bg-emerald-500' : data.header.score <= 40 ? 'bg-red-500' : 'bg-yellow-500';
  
  const historyData = stockData?.historicalPrices?.slice(-30) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4" id="deep-analysis-result">
      
      {/* Header Card */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-400 tracking-wider mb-1">MARKET INTELLIGENCE FEED</h2>
              <h1 className="text-3xl font-extrabold flex items-center gap-3">
                {ticker.toUpperCase()}
                <span className={cn("text-xs md:text-lg px-3 py-1 rounded-full font-bold whitespace-nowrap", getStatusColor(data.header.classification.toLowerCase()))}>
                  {data.header.classification}
                </span>
              </h1>
              {stockData?.price && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-2xl font-bold"><AssetPrice price={stockData.price} currency={stockData.currency} ticker={stockData.ticker} /></span>
                  <MiniSparkline data={historyData} />
                </div>
              )}
            </div>
          </div>
          <div className="text-center md:text-right bg-slate-800/80 p-4 rounded-xl border border-slate-700 backdrop-blur-sm min-w-[150px]">
             <p className="text-sm text-slate-400 font-medium mb-1">Score Fundamentalista</p>
             <div className="text-4xl font-black">
               <span className={scoreColor}>{data.header.score}</span><span className="text-slate-500 text-2xl">/100</span>
             </div>
             <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
               <div className={cn("h-full rounded-full transition-all duration-1000", scoreBgLine)} style={{ width: `${data.header.score}%` }}></div>
             </div>
          </div>
        </div>
      </div>

      {/* Comparison & Insights Top */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executive Summary */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Insights Estratégicos</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
            {data.executiveSummary.insights.map((insight, idx) => (
              <li key={idx} className="bg-white/80 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-3 text-muted-foreground text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual Comparison Card */}
        <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-5">
             <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
               <Scale className="w-5 h-5" />
             </div>
             <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Painel Comparativo</h3>
          </div>
          <div className="space-y-6">
             {stockData && (
                <>
                  <ComparisonBar label="ROE" value={stockData.roe || 0} median={12} unit="%" />
                  <ComparisonBar label="Margem Líq." value={stockData.netMargin || 0} median={10} unit="%" />
                  <ComparisonBar label="P/L" value={stockData.peRatio || 0} median={15} />
                </>
             )}
          </div>
        </div>
      </div>

      {/* Deep Analysis Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {data.topics.map((topic, idx) => (
          <div key={idx} className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col h-full">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-5 pb-3 border-b border-border flex items-center gap-2">
               {getTopicIcon(topic.title)}
               {topic.title}
            </h4>
            <div className="space-y-4 flex-1">
              {topic.indicators.map((ind, i) => (
                <div key={i} className="flex justify-between items-start gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium mb-1">{ind.label}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ind.value}</p>
                  </div>
                  <div className="text-right max-w-[50%]">
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider mb-2", getStatusColor(ind.status.toLowerCase()))}>
                      {getStatusIcon(ind.status.toLowerCase())} {ind.status}
                    </span>
                    <p className="text-xs text-muted-foreground leading-tight">{ind.insight}</p>
                  </div>
                </div>
              ))}
            </div>
            {topic.conclusion && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  {topic.conclusion}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modern Methods Analysis (Graham, Buffett, etc) */}
      {data.methods && data.methods.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            Análise por Métodos Consagrados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.methods.map((m, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">{m.investor}</h4>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase", getStatusColor(m.status))}>
                    {m.verdict}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground italic">"{m.explanation}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenarios & Valuation */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-500" />
          Cenários de Valuation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">🟢 Otimista</h4>
            <p className="text-sm text-muted-foreground">{data.scenarios.optimistic}</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">🟡 Conservador</h4>
            <p className="text-sm text-muted-foreground">{data.scenarios.conservative}</p>
          </div>
          <div className="p-5 rounded-xl bg-red-50 border border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
            <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">🔴 Pessimista</h4>
            <p className="text-sm text-muted-foreground">{data.scenarios.pessimistic}</p>
          </div>
        </div>
      </div>

      {/* Final Check */}
      <div className="bg-muted/50 border border-border rounded-2xl p-5 sm:p-6 md:p-8 shadow-inner">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Check Final Rápido</h3>
        <div className="flex flex-wrap gap-3">
          {data.finalCheck.map((check, i) => (
             <div key={i} className={cn("px-4 py-3 rounded-xl border flex items-center gap-3 bg-card shadow-sm flex-1 min-w-[250px]", 
               check.status.toLowerCase().includes('positivo') ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'
             )}>
                <span className="text-lg">{getStatusIcon(check.status.toLowerCase())}</span>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{check.question}</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{check.answer}</p>
                </div>
             </div>
          ))}
        </div>
      </div>

      {/* Strategic Conclusion */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 sm:p-6 md:p-8 rounded-2xl shadow-xl text-center md:text-left border border-slate-700">
         <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-4">Decisão Estratégica</h2>
         <p className="text-xl md:text-2xl text-white font-medium leading-relaxed italic md:pr-12 border-l-4 border-emerald-500 pl-6">
            "{data.strategicDecision.justification}"
         </p>
      </div>
    </div>
  );
};

export default function FundamentalAnalysis() {
  const { user, profile, login } = useAuth();
  const [ticker, setTicker] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ticker') || '';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stockData, setStockData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docError, setDocError] = useState('');
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null);
  const [docAnalysis, setDocAnalysis] = useState<string>('');
  const [docAnalysisError, setDocAnalysisError] = useState<string>('');
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  
  // Deep Analysis states
  const [deepAnalysis, setDeepAnalysis] = useState<string>('');
  const [deepAnalysisData, setDeepAnalysisData] = useState<DeepAnalysisData | null>(null);
  const [analyzingDeep, setAnalyzingDeep] = useState(false);
  const [deepAnalysisError, setDeepAnalysisError] = useState<string>('');

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
      if (e.key === 'Enter') handleSearch(e as any);
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
        handleSearch(e as any);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const fetchDocuments = async (ticker: string) => {
    setLoadingDocs(true);
    setDocuments([]);
    setDocError('');
    
    const cleanTicker = ticker.trim().toUpperCase().replace(/\.SA$/, '');
    
    try {
      const response = await fetch(`/api/companies/${cleanTicker}/announcements`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return;
        }
        throw new Error('Não foi possível carregar os documentos.');
      }
      
      const data = await response.json();
      
      if (data.announcements && data.announcements.length > 0) {
        setDocuments(data.announcements);
      }
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
      setDocError('Erro ao buscar documentos oficiais.');
    } finally {
      setLoadingDocs(false);
    }
  };

  const analyzeDocument = async (doc: any) => {
    if (!isAIConfigured()) return;
    
    setAnalyzingDoc(doc.url);
    setDocAnalysis('');
    setDocAnalysisError('');
    
    try {
      // 1. Extract text from PDF via server
      const extractResponse = await fetch('/api/fii/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: doc.url })
      });
      
      const extractData = await extractResponse.json();
      
      if (!extractResponse.ok) {
        throw new Error('Servidor de PDF indisponível ou documento protegido.');
      }
      
      // 2. Analyze text with Gemini
      const prompt = `
Atue como um analista financeiro sênior especializado na interpretação de relatórios de empresas listadas em bolsa (Ações). Sua função é analisar o conteúdo do documento abaixo e gerar um parecer profissional, claro, objetivo e acessível, utilizando uma linguagem simples, adequada até mesmo para leitores leigos no mercado financeiro.

--- TEXTO DO DOCUMENTO (${doc.title}) ---
${extractData.text}
--- FIM DO TEXTO ---

DIRETRIZES DE COMUNICAÇÃO:
1. Linguagem Simples e Didática: Utilize termos de fácil compreensão. Sempre que empregar termos técnicos (ex.: EBITDA, Margem Líquida, ROE, P/L, Capex, Alavancagem), inclua uma breve explicação entre parênteses ou em uma nota.
2. Objetividade e Clareza: Destaque apenas os pontos mais relevantes do relatório. Evite excesso de jargões financeiros e informações desnecessárias.
3. Interpretação dos Dados: Não apenas apresente números; explique o que eles significam para o investidor. Sempre que possível, compare os resultados com períodos anteriores mencionados no texto.
4. Tom e Estilo: Profissional, imparcial e educativo. Evite recomendações explícitas de compra ou venda. Utilize listas e subtítulos para facilitar a leitura.

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO (Use Markdown):

### Resumo Executivo:
Forneça uma visão geral do desempenho da empresa no período analisado (trimestre ou ano).

### Principais Indicadores:
Utilize uma lista com marcadores (•). Apresente e explique as métricas encontradas (ex: Receita Líquida, EBITDA, Lucro Líquido, Margens, Endividamento). Explique o que cada uma indica sobre a saúde financeira da companhia de forma simples.

### Pontos Positivos:
Utilize uma lista com marcadores (•). Destaque os aspectos que contribuíram favoravelmente para o desempenho da empresa (ex: crescimento de vendas, redução de custos, novos projetos).

### Pontos de Atenção:
Utilize uma lista com marcadores (•). Aponte riscos, quedas de desempenho, aumento de dívida, pressões inflacionárias ou eventos relevantes que exijam cautela.

### Conclusão:
Apresente uma síntese interpretativa do cenário atual e as perspectivas futuras para a empresa com base nos dados analisados.

"Analise os dados fornecidos e gere um relatório mensal claro, objetivo e de fácil compreensão, destacando os principais pontos positivos, riscos e conclusões, sempre com linguagem acessível ao público leigo."
`;

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: prompt
      });

      setDocAnalysis(response.text || 'Não foi possível gerar a análise do documento.');
      
      // Scroll to analysis
      setTimeout(() => {
        const element = document.getElementById('doc-analysis-result');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error('Erro ao analisar documento:', err);
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota')) {
        setDocAnalysisError('⚠️ Limite de requisições da IA atingido (Cota Excedida). Por favor, aguarde alguns minutos e tente novamente.');
      } else {
        setDocAnalysisError(err.message || 'Erro ao processar documento.');
      }
      
      // Scroll to error
      setTimeout(() => {
        const element = document.getElementById('doc-analysis-error');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setAnalyzingDoc(null);
    }
  };

  const doSearch = async (targetTicker: string) => {
    if (!targetTicker) return;

    setLoading(true);
    setError('');
    setStockData(null);
    setAnalysis('');
    setDocuments([]);
    setDocError('');

    try {
      const formattedTicker = targetTicker.trim().toUpperCase();
      
      // Fetch documents in parallel
      fetchDocuments(formattedTicker);
      
      const response = await fetch(`/api/fin/${formattedTicker}`);
      
      if (!response.ok) {
        throw new Error('Dados da ação não encontrados ou indisponíveis.');
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta inválida do servidor de dados.');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setStockData(data);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    doSearch(ticker);
  };

  const handleGenerateAnalysis = async () => {
    if (!stockData) return;
    if (!user) {
      try {
        await login();
      } catch (err) {
        console.error("Login failed:", err);
      }
      return;
    }
    if (profile?.aiCreditsRemaining !== undefined && profile.aiCreditsRemaining <= 0) {
      return;
    }
    setAnalyzing(true);
    await generateAnalysis(stockData);
    setAnalyzing(false);
  };

  const generateAnalysis = async (data: any) => {
    if (!isAIConfigured()) {
      setAnalysis('A chave da API do Gemini não foi configurada. Por favor, configure a variável de ambiente VITE_GEMINI_API_KEY (ou GEMINI_API_KEY) no seu servidor ou em Configurações.');
      return;
    }

    try {
      const prompt = `
Você é um assistente especializado em análise fundamentalista de ações dos mercados brasileiro (B3) e americano (NYSE/NASDAQ). Sua análise deve ser objetiva, técnica, clara e sempre comparada com parâmetros típicos do setor da empresa.
Evite aberturas artificiais como "Como analista fundamentalista...". Use abordagens mais naturais e diretas, como "De acordo com a análise...", "Com base nos dados analisados...", ou "A análise indica que...".

Empresa: ${data.name} - ${data.ticker}
Setor: ${data.sector || 'Não especificado'}
Moeda: ${data.currency}

Aqui estão TODOS os dados extraídos:
- Preço Atual: ${data.currency} ${data.price}
- P/L: ${data.peRatio?.toFixed(2)}
- P/VP: ${data.pvp?.toFixed(2)}
- EV/EBITDA: ${data.evEbitda?.toFixed(2)}
- EV/EBIT: ${data.evEbit?.toFixed(2)}
- P/EBITDA: ${data.pEbitda?.toFixed(2)}
- P/EBIT: ${data.pEbit?.toFixed(2)}
- P/Ativo: ${data.pAtivo?.toFixed(2)}
- P/SR: ${data.pSr?.toFixed(2)}
- P/Cap. Giro: ${data.pCapGiro?.toFixed(2)}
- P/Ativo Circ. Liq.: ${data.pAtivoCircLiq?.toFixed(2)}
- Margem Bruta: ${data.grossMargin?.toFixed(2)}%
- Margem EBITDA: ${(data.ebitda / data.totalRevenue * 100)?.toFixed(2) || 0}%
- Margem EBIT: ${(data.ebit / data.totalRevenue * 100)?.toFixed(2) || 0}%
- Margem Líquida: ${data.netMargin?.toFixed(2)}%
- Dívida Líquida/PL: ${((data.netDebt || 0) / (data.bvps * data.sharesOutstanding || 1))?.toFixed(2)}
- Dívida Líquida/EBITDA: ${((data.netDebt || 0) / (data.ebitda || 1))?.toFixed(2)}
- Dívida Líquida/EBIT: ${((data.netDebt || 0) / (data.ebit || 1))?.toFixed(2)}
- Passivos/Ativos: ${data.passivosAtivos?.toFixed(2)}
- PL/Ativos: ${data.plAtivos?.toFixed(2)}
- Liquidez Corrente: ${data.liquidezCorrente?.toFixed(2)}
- ROE: ${data.roe?.toFixed(2)}%
- ROA: ${data.roa?.toFixed(2)}%
- ROIC: ${data.roic?.toFixed(2)}%
- Giro de Ativos: ${data.assetTurnover?.toFixed(2)}
- Dividend Yield: ${data.dividendYield?.toFixed(2)}%
- Payout Ratio: ${data.payoutRatio?.toFixed(2)}%
- Valor de Mercado: ${data.currency} ${((data.marketCap || 0) / 1e9).toFixed(2)} Bilhões
- Dívida Líquida: ${data.currency} ${((data.netDebt || 0) / 1e9).toFixed(2)} Bilhões
- Histórico de Lucros: ${data.historicalProfits ? JSON.stringify(data.historicalProfits) : 'Não disponível'}

Instruções obrigatórias:
1. Analise CADA indicador importante e compare explicitamente com os benchmarks do setor da empresa.
2. Seja direto: diga frases como "A dívida está ALTA para o setor", "O ROE está MUITO acima da média", etc.
3. Avalie a sustentabilidade dos dividendos.
4. Mencione riscos específicos da empresa/setor.

Estrutura da resposta EXATAMENTE assim (use títulos e bullets):

**1. Visão Geral**
**2. Valuation** (está barata, justa ou cara?)
**3. Rentabilidade e Margens**
**4. Endividamento e Estrutura**
**5. Crescimento e Eficiência**
**6. Dividendos e Proventos**
**7. Riscos e Fatores de Atenção**
**8. Síntese Estratégica**
   - Nota de 0 a 10 (Aderência Fundamentalista)
   - Classificação: Alta Aderência / Aderência Moderada / Baixa Aderência
   - Justificativa curta e direta (sem recomendações de compra/venda)

Responda APENAS em português brasileiro, linguagem acessível para investidores comuns, sem jargão desnecessário. Seja honesto sobre pontos fracos. Não invente dados. Não adicione gráficos ou tabelas.
`;

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      setAnalysis(response.text || 'Não foi possível gerar a análise.');
    } catch (err: any) {
      console.error('Erro ao gerar análise:', err);
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota')) {
        setAnalysis('⚠️ Limite de requisições da IA atingido (Cota Excedida). Por favor, aguarde alguns minutos e tente novamente.');
      } else {
        setAnalysis('Erro ao gerar análise com IA. Verifique sua conexão ou tente novamente mais tarde.');
      }
    }
  };

  const handleGenerateDeepAnalysis = async () => {
    if (!stockData) return;
    if (!user) {
      try {
        await login();
      } catch (err) {
        console.error("Login failed:", err);
      }
      return;
    }
    setAnalyzingDeep(true);
    setDeepAnalysisError('');
    setDeepAnalysis('');
    setDeepAnalysisData(null);
    
    if (!isAIConfigured()) {
      setDeepAnalysisError('A chave da API do Gemini não foi configurada. Por favor, configure a variável de ambiente VITE_GEMINI_API_KEY (ou GEMINI_API_KEY) no seu servidor ou em Configurações.');
      setAnalyzingDeep(false);
      return;
    }

    try {
      const prompt = `
Você é um analista quantitativo e fundamentalista sênior. Realize uma Análise Profunda de IA para a ação ${stockData.ticker} (${stockData.name}).
Sua análise deve ser estruturada EXATAMENTE conforme o modelo abaixo, preenchendo os dados fornecidos e utilizando sua inteligência para interpretar e gerar os insights solicitados.

DADOS FORNECIDOS (brAPI Pro):
- Preço Atual: ${stockData.currency} ${stockData.price}
- P/L: ${stockData.peRatio?.toFixed(2)}
- P/VP: ${stockData.pvp?.toFixed(2)}
- ROE: ${stockData.roe?.toFixed(2)}%
- ROIC: ${stockData.roic?.toFixed(2)}%
- Margem EBITDA: ${(stockData.ebitda / stockData.totalRevenue * 100)?.toFixed(2) || 0}%
- Dívida Líquida/EBITDA: ${((stockData.netDebt || 0) / (stockData.ebitda || 1))?.toFixed(2)}
- Liquidez Corrente: ${stockData.liquidezCorrente?.toFixed(2)}
- Volume Médio: ${stockData.regularMarketVolume || 'N/A'}
- Histórico de Lucros: ${stockData.historicalProfits ? JSON.stringify(stockData.historicalProfits) : 'Não disponível'}

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (JSON):
INSTRUÇÃO CRÍTICA: Sua resposta deve ser EXATAMENTE um objeto JSON válido. NÃO inclua formatação markdown (como \`\`\`json) e NÃO adicione nenhum texto antes ou depois das chaves { }. 

Você DEVE preencher OBRIGATORIAMENTE os seguintes 18 tópicos na análise (separados conforme a estrutura JSON baixo):
1. Indicadores Financeiros (Base)
2. Lucro vs Cotação (Leitura de Valor)
3. Preço vs Fundamentos
4. Estrutura Acionária
5. Fluxo de Capital e Risco de Saída
6. Tese de Longo Prazo (TEG LONG)
7. Receita e Previsibilidade
8. Mercado de Opções
9. Recompra de Ações (Buyback)
10. Grandes Investidores
11. Inteligência de Mercado
12. Macro e Geopolítica
13. Governança e Gestão
14. Valuation (Múltiplos e Comparáveis)
15. Análise por Métodos Consagrados (Graham, Buffett, Lynch, etc.)
16. Fontes e Metodologia
17. Cenários (Projeções)
18. Check Final e Decisão

O JSON deve seguir a seguinte estrutura:

{
  "header": {
    "score": [Número de 0 a 100 com o score geral],
    "classification": "[🟢 Compra, 🟡 Neutro ou 🔴 Venda]"
  },
  "executiveSummary": {
    "insights": [
      "[Um insight executivo 1]",
      "[Um insight executivo 2]",
      "[Um insight executivo 3]"
    ]
  },
  "topics": [
    {
      "title": "1. Indicadores Financeiros",
      "iconType": "financials",
      "indicators": [
        { "label": "P/L", "value": "${stockData.peRatio?.toFixed(2) || 'N/A'}", "status": "[positivo, neutro ou risco]", "insight": "..." },
        { "label": "ROE", "value": "${stockData.roe?.toFixed(2) || 0}%", "status": "...", "insight": "..." },
        { "label": "Endividamento", "value": "...", "status": "...", "insight": "..." }
      ],
      "conclusion": "..."
    },
    { "title": "2. Lucro vs Cotação", "iconType": "chart", "indicators": [...], "conclusion": "..." },
    { "title": "3. Preço vs Fundamentos", "iconType": "brain", "indicators": [...], "conclusion": "..." },
    { "title": "4. Estrutura Acionária", "iconType": "users", "indicators": [...], "conclusion": "..." },
    { "title": "5. Fluxo de Capital", "iconType": "risk", "indicators": [...], "conclusion": "..." },
    { "title": "6. Tese Long Term", "iconType": "target", "indicators": [...], "conclusion": "..." },
    { "title": "7. Receita e Previsibilidade", "iconType": "eficiencia", "indicators": [...], "conclusion": "..." },
    { "title": "8. Mercado de Opções", "iconType": "financials", "indicators": [...], "conclusion": "..." },
    { "title": "9. Recompra de Ações", "iconType": "financials", "indicators": [...], "conclusion": "..." },
    { "title": "10. Grandes Investidores", "iconType": "users", "indicators": [...], "conclusion": "..." },
    { "title": "11. Inteligência de Mercado", "iconType": "brain", "indicators": [...], "conclusion": "..." },
    { "title": "12. Macro e Geopolítica", "iconType": "globe", "indicators": [...], "conclusion": "..." },
    { "title": "13. Governança e Gestão", "iconType": "building", "indicators": [...], "conclusion": "..." },
    { "title": "14. Valuation Detalhado", "iconType": "valuation", "indicators": [...], "conclusion": "..." },
    { "title": "16. Fontes e Metodologia", "iconType": "info", "indicators": [...], "conclusion": "..." }
  ],
  "methods": [
    { "investor": "Benjamin Graham", "verdict": "...", "status": "...", "explanation": "..." },
    { "investor": "Warren Buffett", "verdict": "...", "status": "...", "explanation": "..." }
  ],
  "scenarios": {
    "optimistic": "...",
    "conservative": "...",
    "pessimistic": "..."
  },
  "finalCheck": [
    { "question": "Fundamentos sólidos?", "answer": "...", "status": "..." }
  ],
  "strategicDecision": {
    "decision": "...",
    "justification": "..."
  },
  "narrationText": "IMPORTANTE: Escreva aqui um resumo executivo da análise completa em linguagem natural e fluida (como um texto de rádio ou podcast), sem usar símbolos técnicos, markdown ou formato JSON. O texto deve ter entre 3 e 4 parágrafos e ser perfeito para ser lido em voz alta por um narrador, resumindo a tese, os lucros, os riscos e a decisão final."
}

INSTRUÇÕES FINAIS:
- Responda apenas em PORTUGUÊS BRASILEIRO.
- Não use markdown na resposta.
- Certifique-se de que a resposta seja um JSON válido e COMPLETO com todos os tópicos.
- O campo narrationText é OBRIGATÓRIO e deve conter texto natural para narração.
`;

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const rawText = response.text || '';
      const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const parsedData = JSON.parse(jsonString) as DeepAnalysisData;
        setDeepAnalysisData(parsedData);
      } catch (parseError) {
        console.error('Failed to parse AI JSON:', parseError, jsonString);
        setDeepAnalysisError('A inteligência artificial retornou um formato inválido. Tente novamente.');
      }
      
      setDeepAnalysis(rawText);
      
      setTimeout(() => {
        const element = document.getElementById('deep-analysis-result');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error('Erro ao gerar análise profunda:', err);
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota')) {
        setDeepAnalysisError('⚠️ Limite de requisições da IA atingido (Cota Excedida). Por favor, aguarde alguns minutos e tente novamente.');
      } else {
        setDeepAnalysisError('Erro ao gerar análise profunda com IA. Verifique sua conexão ou tente novamente mais tarde.');
      }
    } finally {
      setAnalyzingDeep(false);
    }
  };

  // Prepare chart data
  const chartData = stockData?.historicalProfits?.map((p: any) => ({
    year: p.year,
    Receita: p.revenue / 1e9,
    Lucro: p.netIncome / 1e9,
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">Análise Fundamentalista</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Digite um ticker da B3 ou mercado americano para visualizar os dados</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => ticker.length >= 2 && setShowSuggestions(true)}
              placeholder="Ex: PETR4, AAPL, WEGE3, TSLA"
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 text-slate-900 placeholder-slate-400 uppercase dark:text-slate-100  dark:border-slate-800  dark:bg-slate-800 "
              required
            />
            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                {isSearchingSuggestions ? (
                  <div className="p-4 flex items-center justify-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm font-medium">Buscando ativos...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map((item, index) => (
                      <button
                        key={`${item.ticker}-${index}`}
                        type="button"
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
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
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden shrink-0">
                          {item.logourl ? (
                            <img src={item.logourl} alt={item.ticker} className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.ticker.substring(0, 2)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{item.ticker}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                              {item.exchange || item.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{item.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm font-medium">
                    Nenhum ativo encontrado para "{ticker}"
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !ticker}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Buscar</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {stockData && (
        <div className="space-y-6">
          {/* Header da Empresa */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left w-full md:w-auto">
              {stockData.logourl ? (
                <img 
                  src={stockData.logourl} 
                  alt={`Logo ${stockData.ticker}`} 
                  className="w-16 h-16 rounded-xl object-contain bg-white p-1 border border-border shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div className={`w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-2xl shadow-sm ${stockData.logourl ? 'hidden' : ''}`}>
                {stockData.ticker.substring(0, 2)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 ">{stockData.ticker}</h3>
                <p className="text-slate-500">{stockData.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-lg text-slate-800 dark:text-slate-200 "><AssetPrice price={stockData.price} currency={stockData.currency} ticker={stockData.ticker} /></span>
                  <span className={`text-sm font-medium ${stockData.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent?.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={handleGenerateAnalysis}
                disabled={analyzing || (user && profile?.aiCreditsRemaining !== undefined && profile.aiCreditsRemaining <= 0)}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors w-full md:w-auto justify-center shrink-0 shadow-sm"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gerando Análise...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-5 h-5 text-indigo-200" />
                    <span>
                      {!user ? 'Entrar para Gerar Análise' : 'Gerar Análise com IA'}
                    </span>
                  </>
                )}
              </button>
              
              {user && (
                <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span>Créditos de IA hoje: <strong className="font-mono text-slate-700 dark:text-slate-300">{profile?.aiCreditsRemaining ?? 5}/5</strong></span>
                </div>
              )}
            </div>
          </div>

          {!user && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-3 text-sm text-amber-800 dark:text-amber-200 animate-in fade-in slide-in-from-top-2">
              <span className="text-lg">🔒</span>
              <div>
                <strong>Faça login ou cadastre-se</strong> para gerar análises fundamentalistas automáticas e completas com a inteligência artificial do SimulaGrana. Cada usuário ganha <strong>5 créditos diários grátis</strong>, renovados automaticamente!
              </div>
            </div>
          )}

          {user && profile?.aiCreditsRemaining !== undefined && profile.aiCreditsRemaining <= 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-start gap-3 text-sm text-red-800 dark:text-red-200 animate-in fade-in slide-in-from-top-2">
              <span className="text-lg">⚠️</span>
              <div>
                <strong>Limite diário atingido!</strong> Seus 5 créditos de Inteligência Artificial para hoje foram totalmente consumidos. Seu limite será zerado e renovado para mais 5 amanhã!
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Valuation */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Valuation
              </h4>
              <div className="space-y-1">
                <IndicatorRow label="P/L" value={safeFormat(stockData.peRatio, false, false)} tooltip={<><p><strong>Preço sobre Lucro.</strong></p><p>Indica quantos anos levaria para reaver o capital investido considerando o lucro atual.</p><p><em>Ex: P/L de 10 significa 10 anos.</em></p></>} />
                <IndicatorRow label="P/VP" value={safeFormat(stockData.pvp, false, false)} tooltip={<><p><strong>Preço sobre Valor Patrimonial.</strong></p><p>Indica o quanto o mercado está pagando pelo patrimônio da empresa.</p><p><em>Ex: P/VP &lt; 1 pode indicar desconto.</em></p></>} />
                <IndicatorRow label="EV/EBITDA" value={safeFormat(stockData.evEbitda, false, false)} tooltip={<><p><strong>Enterprise Value sobre EBITDA.</strong></p><p>Avalia o valor da firma em relação à sua geração de caixa operacional.</p></>} />
                <IndicatorRow label="EV/EBIT" value={safeFormat(stockData.evEbit, false, false)} tooltip={<><p><strong>Enterprise Value sobre EBIT.</strong></p><p>Semelhante ao EV/EBITDA, mas considera a depreciação e amortização.</p></>} />
                <IndicatorRow label="P/EBITDA" value={safeFormat(stockData.pEbitda, false, false)} tooltip={<><p><strong>Preço sobre EBITDA.</strong></p><p>Múltiplo de mercado em relação à geração de caixa.</p></>} />
                <IndicatorRow label="P/EBIT" value={safeFormat(stockData.pEbit, false, false)} tooltip={<><p><strong>Preço sobre EBIT.</strong></p><p>Múltiplo de mercado em relação ao lucro operacional.</p></>} />
                <IndicatorRow label="P/Ativo" value={safeFormat(stockData.pAtivo, false, false)} tooltip={<><p><strong>Preço sobre Ativos Totais.</strong></p><p>Avalia o preço da ação em relação aos ativos da empresa.</p></>} />
                <IndicatorRow label="P/SR" value={safeFormat(stockData.pSr, false, false)} tooltip={<><p><strong>Preço sobre Receita (Price to Sales).</strong></p><p>Útil para empresas que ainda não dão lucro.</p></>} />
              </div>
            </div>

            {/* Rentabilidade e Margens */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" /> Rentabilidade e Margens
              </h4>
              <div className="space-y-1">
                <IndicatorRow label="ROE" value={safeFormat(stockData.roe, true, true)} tooltip={<><p><strong>Return on Equity (Retorno sobre Patrimônio).</strong></p><p>Mede a capacidade de gerar lucro com o dinheiro dos acionistas.</p><p><em>Ex: ROE &gt; 15% é considerado bom.</em></p></>} />
                <IndicatorRow label="ROA" value={safeFormat(stockData.roa, true, true)} tooltip={<><p><strong>Return on Assets (Retorno sobre Ativos).</strong></p><p>Mede a eficiência em gerar lucro com os ativos totais.</p></>} />
                <IndicatorRow label="ROIC" value={safeFormat(stockData.roic, true, true)} tooltip={<><p><strong>Return on Invested Capital.</strong></p><p>Mede a rentabilidade sobre o capital total investido (próprio + terceiros).</p></>} />
                <IndicatorRow label="Margem Bruta" value={safeFormat(stockData.grossMargin, true, true)} tooltip={<><p><strong>Margem Bruta.</strong></p><p>Lucro bruto sobre a receita líquida.</p></>} />
                <IndicatorRow label="Margem EBITDA" value={stockData.totalRevenue > 0 ? safeFormat((stockData.ebitda / stockData.totalRevenue) * 100, true, true) : 'N/D'} tooltip={<><p><strong>Margem EBITDA.</strong></p><p>Geração de caixa operacional sobre a receita.</p></>} />
                <IndicatorRow label="Margem EBIT" value={stockData.totalRevenue > 0 ? safeFormat((stockData.ebit / stockData.totalRevenue) * 100, true, true) : 'N/D'} tooltip={<><p><strong>Margem EBIT.</strong></p><p>Lucro operacional sobre a receita.</p></>} />
                <IndicatorRow label="Margem Líquida" value={safeFormat(stockData.netMargin, true, true)} tooltip={<><p><strong>Margem Líquida.</strong></p><p>Lucro líquido sobre a receita. O que "sobra" no final.</p></>} />
                <IndicatorRow label="Giro de Ativos" value={safeFormat(stockData.assetTurnover, false, false)} tooltip={<><p><strong>Giro de Ativos.</strong></p><p>Receita sobre ativos totais. Mede a eficiência no uso dos ativos.</p></>} />
              </div>
            </div>

            {/* Endividamento e Estrutura */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" /> Endividamento e Estrutura
              </h4>
              <div className="space-y-1">
                <IndicatorRow label="Dívida Líquida/PL" value={(stockData.bvps && stockData.sharesOutstanding) ? safeFormat((stockData.netDebt || 0) / (stockData.bvps * stockData.sharesOutstanding), false, true) : 'N/D'} tooltip={<><p><strong>Dívida Líquida sobre Patrimônio Líquido.</strong></p><p>Mede o grau de alavancagem da empresa.</p><p><em>Ex: Valores &gt; 1 indicam mais dívida que patrimônio.</em></p></>} />
                <IndicatorRow label="Dívida Líquida/EBITDA" value={stockData.ebitda ? safeFormat((stockData.netDebt || 0) / stockData.ebitda, false, true) : 'N/D'} tooltip={<><p><strong>Dívida Líquida sobre EBITDA.</strong></p><p>Quantos anos de geração de caixa levariam para pagar a dívida.</p><p><em>Ex: Valores &lt; 3 são considerados saudáveis.</em></p></>} />
                <IndicatorRow label="Dívida Líquida/EBIT" value={stockData.ebit ? safeFormat((stockData.netDebt || 0) / stockData.ebit, false, true) : 'N/D'} tooltip={<><p><strong>Dívida Líquida sobre EBIT.</strong></p><p>Semelhante ao Dívida/EBITDA, mas usando lucro operacional.</p></>} />
                <IndicatorRow label="Passivos/Ativos" value={safeFormat(stockData.passivosAtivos, false, true)} tooltip={<><p><strong>Passivos sobre Ativos.</strong></p><p>Proporção dos ativos financiados por dívidas.</p></>} />
                <IndicatorRow label="PL/Ativos" value={safeFormat(stockData.plAtivos, false, true)} tooltip={<><p><strong>Patrimônio Líquido sobre Ativos.</strong></p><p>Proporção dos ativos financiados por capital próprio.</p></>} />
                <IndicatorRow label="Liquidez Corrente" value={safeFormat(stockData.liquidezCorrente, false, false)} tooltip={<><p><strong>Liquidez Corrente.</strong></p><p>Capacidade de pagar dívidas de curto prazo.</p><p><em>Ex: &gt; 1 indica que possui mais bens que dívidas no curto prazo.</em></p></>} />
                <IndicatorRow label="Dividend Yield" value={safeFormat(stockData.dividendYield, true, true)} tooltip={<><p><strong>Dividend Yield.</strong></p><p>Rendimento de dividendos pagos nos últimos 12 meses.</p></>} />
                <IndicatorRow label="Payout Ratio" value={safeFormat(stockData.payoutRatio, true, true)} tooltip={<><p><strong>Payout Ratio.</strong></p><p>Porcentagem do lucro distribuída como dividendos.</p></>} />
              </div>
            </div>
          </div>

          {/* Gráficos */}
          {(chartData.length > 0 || (stockData?.historicalPrices && stockData.historicalPrices.length > 0)) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {chartData.length > 0 && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 sm:mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" /> Evolução de Receita e Lucro (Bilhões)
                  </h4>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="year" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Legend />
                        <Bar dataKey="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {stockData?.historicalPrices && stockData.historicalPrices.length > 0 && (
                <div className="col-span-1 lg:col-span-2">
                  <AssetComparisonChart stockData={stockData} ipcaAnual={4.5} />
                </div>
              )}
            </div>
          )}

          {/* Análise da IA */}
          {analysis && (
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-border">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 ">Relatório de Análise (IA)</h3>
              </div>
              
              <div className="space-y-8">
                <div className="prose prose-slate dark:prose-invert prose-emerald max-w-none">
                  <Markdown>{analysis}</Markdown>
                </div>
                <ReportAudioPlayer text={analysis} title={`Análise de ${ticker.toUpperCase()}`} colorTheme="emerald" />
              </div>
            </div>
          )}

          {/* Documentos e Comunicados */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200  flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                Documentos e Comunicados
              </h3>
            </div>

            {loadingDocs ? (
              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Buscando documentos oficiais...</p>
              </div>
            ) : docError ? (
              <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium whitespace-pre-wrap">{docError}</p>
              </div>
            ) : documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col gap-3 hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 p-2 rounded-lg ${doc.type === 'fato_relevante' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : doc.type === 'relatorio' || doc.type === 'resultado' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground line-clamp-2" title={doc.title}>{doc.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{doc.date}</p>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-3 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedDocUrl(doc.url)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Visualizar
                        </button>
                        <button
                          onClick={() => analyzeDocument(doc)}
                          disabled={!!analyzingDoc}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {analyzingDoc === doc.url ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          Analisar IA
                        </button>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-center text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        Download Direto
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-4 bg-white rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400 dark:bg-slate-800">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-slate-500 italic font-medium">
                  Nenhum documento recente encontrado para este ativo.
                </p>
              </div>
            )}

            {/* Visualizador de PDF */}
            {selectedDocUrl && (
              <div className="pt-8 border-t border-border animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-foreground">Visualização do Documento</h4>
                  </div>
                  <button 
                    onClick={() => setSelectedDocUrl(null)}
                    className="text-sm text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Fechar Visualizador
                  </button>
                </div>
                <div className="aspect-[3/4] w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                  <iframe 
                    src={`/api/fii/proxy-pdf?url=${encodeURIComponent(selectedDocUrl)}`}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                    className="w-full h-full border-none relative z-10 bg-white"
                    title="PDF Viewer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900 z-0">
                    <div className="max-w-xs">
                      <Loader2 className="w-8 h-8 text-emerald-500 mx-auto mb-4 animate-spin" />
                      <p className="text-slate-500 text-sm">
                        Carregando documento...
                      </p>
                      <p className="text-slate-400 text-xs mt-2">
                        Se o documento não aparecer em alguns segundos, tente o botão abaixo.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <a 
                    href={selectedDocUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-600 font-medium hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    Abrir em nova aba / Download Direto
                  </a>
                </div>
              </div>
            )}

            {/* Resultado da Análise do Documento */}
            {docAnalysisError && (
              <div id="doc-analysis-error" className="pt-8 border-t border-border animate-in fade-in slide-in-from-top-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Erro na Análise do Documento</p>
                    <p className="text-sm text-red-700">{docAnalysisError}</p>
                  </div>
                </div>
              </div>
            )}

            {docAnalysis && (
              <div id="doc-analysis-result" className="pt-8 border-t border-border animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    <Play className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground">Análise Detalhada do Documento</h4>
                </div>
                
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 dark:bg-slate-800/50 dark:border-emerald-900/30">
                  <div className="prose prose-slate prose-emerald max-w-none dark:prose-invert">
                    <Markdown>{docAnalysis}</Markdown>
                  </div>
                  
                  <div className="mt-8">
                    <ReportAudioPlayer 
                      text={docAnalysis} 
                      title={`Análise de Documento - ${ticker.toUpperCase()}`} 
                      colorTheme="emerald" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Análise Profunda de IA */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  Análise Profunda de IA
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Gere um relatório completo e detalhado combinando dados da brAPI Pro com inteligência artificial avançada.
                </p>
              </div>
              <button
                onClick={handleGenerateDeepAnalysis}
                disabled={analyzingDeep || !stockData}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                {analyzingDeep ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gerando Análise...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Gerar Análise Profunda</span>
                  </>
                )}
              </button>
            </div>

            {deepAnalysisError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-800">Erro na Análise Profunda</p>
                  <p className="text-sm text-red-700">{deepAnalysisError}</p>
                </div>
              </div>
            )}

            {deepAnalysisData && (
              <DeepAnalysisBoard data={deepAnalysisData} ticker={ticker} stockData={stockData} />
            )}
            
            {deepAnalysis && !deepAnalysisData && (
              <div id="deep-analysis-result" className="bg-indigo-50/30 dark:bg-indigo-900/10 p-6 md:p-8 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 animate-in fade-in slide-in-from-top-4">
                <div className="prose prose-slate dark:prose-invert prose-indigo max-w-none">
                  <Markdown>{deepAnalysis}</Markdown>
                </div>
              </div>
            )}
            
            {deepAnalysis && (
              <div className="mt-8 pt-6 border-t border-border">
                <ReportAudioPlayer 
                  text={deepAnalysisData?.narrationText || deepAnalysis} 
                  title={`Análise Profunda - ${ticker.toUpperCase()}`} 
                  colorTheme="emerald" 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
