import { useState, FormEvent, useEffect } from 'react';
import { Search, Loader2, TrendingUp, TrendingDown, AlertCircle, Info, Sparkles, LineChart as LineChartIcon, Activity, ShieldAlert, AlertTriangle, CheckCircle2, Zap, Tag, ShieldCheck, ArrowRight, HelpCircle, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateContentWithRetry } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import Markdown from 'react-markdown';
import ReportAudioPlayer from '../ReportAudioPlayer';
import AdUnit from '../AdUnit';
import { motion, AnimatePresence } from 'motion/react';
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
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-slate-100 text-xs rounded-xl shadow-xl z-50 pointer-events-none text-left font-normal normalcase tracking-normal leading-relaxed"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function PeterLynch() {
  const { user, login } = useAuth();
  const [ticker, setTicker] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ticker') || '';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<any>(null);
  const [error, setError] = useState('');

  const [customGrowth, setCustomGrowth] = useState<number>(15);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

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
    setError('');
    setStockData(null);
    setAiAnalysis('');

    try {
      const cleanTicker = targetTicker.trim().toUpperCase();
      const formattedTicker = cleanTicker.endsWith('.SA') 
        ? cleanTicker 
        : `${cleanTicker}.SA`;
        
      const response = await fetch(`/api/fin/${formattedTicker}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados da ação.');
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

      // Calculate historical CAGR if available
      if (data.historicalProfits && data.historicalProfits.length >= 2) {
        const first = data.historicalProfits[0].profit;
        const last = data.historicalProfits[data.historicalProfits.length - 1].profit;
        const years = data.historicalProfits.length - 1;
        if (first > 0 && last > 0) {
          const cagr = (Math.pow(last / first, 1 / years) - 1) * 100;
          setCustomGrowth(Number(cagr.toFixed(2))); // Allow negative
        } else if (last <= 0) {
          setCustomGrowth(-10);
        } else if (first <= 0 && last > 0) {
          setCustomGrowth(10);
        } else {
          setCustomGrowth(0);
        }
      }

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

  const getHistoricalCagr = () => {
    if (!stockData || !stockData.historicalProfits || stockData.historicalProfits.length < 2) return 0;
    const first = stockData.historicalProfits[0].profit;
    const last = stockData.historicalProfits[stockData.historicalProfits.length - 1].profit;
    const years = stockData.historicalProfits.length - 1;
    
    if (first > 0 && last > 0) {
      return (Math.pow(last / first, 1 / years) - 1) * 100;
    } else if (last <= 0) {
      return -10; // Indicador de crescimento negativo
    } else if (first <= 0 && last > 0) {
      return 10; // Turnaround em andamento
    }
    return -100; // Represents negative or zero growth
  };

  const cagr = getHistoricalCagr();

  const getAverageProfit = () => {
    if (!stockData || !stockData.historicalProfits) return 0;
    const profits = stockData.historicalProfits.map((p: any) => p.profit);
    if (profits.length === 0) return 0;
    const sum = profits.reduce((a: number, b: number) => a + b, 0);
    return sum / profits.length;
  };

  const calculateQualityScore = () => {
    if (!stockData) return 0;
    let score = 0;

    // ROE > 15: 25
    if (stockData.roe > 15) score += 25;
    else if (stockData.roe > 10) score += 15;

    // Margem Líquida > 10: 20
    if (stockData.netMargin > 10) score += 20;
    else if (stockData.netMargin > 5) score += 10;

    // Crescimento > 5: 25
    if (cagr > 5) score += 25;
    else if (cagr > 0) score += 15;

    // Dívida < 50: 15 (Assumindo netDebt/Equity ou similar, aqui usamos netDebt < 0 como proxy de caixa líquido)
    if ((stockData.netDebt || 0) < 0) score += 15;

    // Payout < 80: 15
    if (stockData.payoutRatio > 0 && stockData.payoutRatio < 80) score += 15;

    return Math.max(0, Math.min(100, score));
  };

  const getStockCategory = () => {
    if (!stockData) return '';
    const g = cagr;
    if (g < 0) return 'TURNAROUND';
    if (g < 8) return 'SLOW_GROWER';
    if (g < 15) return 'STALWART';
    return 'FAST_GROWER';
  };

  const detectValueTrap = () => {
    if (!stockData) return false;
    // P/L < 5, crescimento < 0 e margem < 10
    return stockData.peRatio < 5 && cagr < 0 && stockData.netMargin < 10;
  };

  const calculateRecoveryProbability = () => {
    if (!stockData) return 0;
    let prob = 30; // Base 30%
    if (stockData.roe > 0) prob += 10;
    if (stockData.roe > 10) prob += 10;
    if (stockData.netMargin > 5) prob += 10;
    if (stockData.netDebt <= 0) prob += 20; // Caixa líquido ajuda muito na sobrevivência
    if (stockData.peRatio < 10) prob += 10; // Preço baixo ajuda na margem de segurança
    if (calculateQualityScore() > 60) prob += 10;
    return Math.min(90, prob);
  };

  const calculateProjectedPrice = (g: number) => {
    if (!stockData || !stockData.eps || !stockData.price) return { price: 0, min: 0, max: 0, isRange: false, normalizedLpa: 0 };
    
    const qualityScore = calculateQualityScore();
    const category = getStockCategory();
    
    if (category === 'TURNAROUND' || g < 0) {
      // MODO 2 — TURNAROUND (RECUPERACAO)
      // Etapa 1 — Lucro Normalizado
      const avgProfit = getAverageProfit();
      const currentProfit = stockData.historicalProfits?.[stockData.historicalProfits.length - 1]?.profit || 1;
      const normalizedLpa = currentProfit !== 0 ? stockData.eps * (avgProfit / currentProfit) : stockData.eps;

      // Etapa 2 — Faixa de Múltiplo (8x a 12x)
      let min = Math.max(0, normalizedLpa) * 8;
      let max = Math.max(0, normalizedLpa) * 12;

      // Ajuste por Qualidade
      if (qualityScore > 80) { min *= 1.1; max *= 1.1; }
      if (qualityScore < 60) { min *= 0.8; max *= 0.8; }

      // Probabilidade de Recuperação impacta o valor esperado
      const prob = calculateRecoveryProbability() / 100;
      const avg = ((min + max) / 2) * prob;

      return { price: avg, min, max, isRange: true, normalizedLpa };
    } else {
      // MODO 1 — LYNCH PADRÃO
      const growthFactor = 1 + (g / 100);
      let basePrice = stockData.eps * growthFactor * 15;
      
      if (qualityScore > 80) basePrice *= 1.1;
      if (qualityScore < 60) basePrice *= 0.8;
      
      return { price: basePrice, min: basePrice * 0.9, max: basePrice * 1.1, isRange: false, normalizedLpa: 0 };
    }
  };

  const calculateUpside = (projectedPrice: number) => {
    if (!stockData || !stockData.price) return 0;
    return ((projectedPrice / stockData.price) - 1) * 100;
  };

  const pegRatio = cagr > 0 ? stockData?.peRatio / cagr : null;
  const pegAjustado = cagr > 0 && (cagr + (stockData?.dividendYield || 0)) !== 0 
    ? stockData?.peRatio / (cagr + (stockData?.dividendYield || 0)) 
    : null;

  const generateAIAnalysis = async () => {
    if (!stockData) return;
    if (!user) {
      try {
        await login();
      } catch (err) {
        console.error("Login failed:", err);
      }
      return;
    }
    setLoadingAi(true);
    try {
      const prompt = `
Você é um analista fundamentalista sênior especializado no mercado brasileiro (B3), com foco na metodologia de Peter Lynch.
Faça uma análise profunda e estruturada sobre a ação ${stockData.name} (${stockData.ticker}).

Dados atuais (Lynch Engine v2):
- Categoria Sugerida: ${getStockCategory()}
- P/L: ${stockData.peRatio?.toFixed(2)}
- P/VP: ${stockData.pvp?.toFixed(2)}
- ROE: ${stockData.roe?.toFixed(2)}%
- Margem Líquida: ${stockData.netMargin?.toFixed(2)}%
- Dividend Yield: ${stockData.dividendYield?.toFixed(2)}%
- Payout Ratio: ${stockData.payoutRatio?.toFixed(2)}%
- Crescimento Histórico (CAGR 5A): ${cagr > -100 ? cagr.toFixed(2) + '%' : 'Negativo/Irregular'}
- PEG Ratio: ${pegRatio ? pegRatio.toFixed(2) : 'N/A'}
- Quality Score: ${calculateQualityScore()}/100
- Possível Value Trap: ${detectValueTrap() ? 'SIM (ALERTA CRÍTICO)' : 'NÃO'}
- Modo de Valuation Aplicado: ${getStockCategory() === 'TURNAROUND' ? 'Recuperação (Lucro Normalizado)' : 'Lynch Padrão (Crescimento)'}
- Probabilidade de Recuperação (se Turnaround): ${getStockCategory() === 'TURNAROUND' ? calculateRecoveryProbability() + '%' : 'N/A'}

Responda aos seguintes pontos de forma concisa e profissional (nível institucional):
1. Ciclo Econômico: Em qual momento do ciclo a empresa se encontra? (Considere dados macroeconômicos relevantes para o setor de ${stockData.sector}).
2. Recorrência de Lucros: Os lucros parecem sustentáveis ou há indícios de não-recorrência?
3. Sustentabilidade de Dividendos: O Payout e a geração de caixa suportam os dividendos atuais?
4. Principais Riscos: Quais as maiores ameaças à tese de investimento?
5. Veredito Peter Lynch: Como Peter Lynch classificaria e avaliaria esta ação hoje? (Considere se é um Turnaround real ou uma armadilha).
`;
      const response = await generateContentWithRetry({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });
      setAiAnalysis(response.text || 'Não foi possível gerar a análise.');
    } catch (err: any) {
      console.error(err);
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota')) {
        setAiAnalysis('⚠️ Limite de requisições da IA atingido (Cota Excedida). Por favor, aguarde alguns minutos e tente novamente.');
      } else {
        setAiAnalysis(err.message || 'Erro ao gerar análise com IA.');
      }
    } finally {
      setLoadingAi(false);
    }
  };

  const chartData = [0, 1, 2, 3, 4, 5].map(year => {
    const basePrice = stockData?.price || 0;
    const projectedResult = calculateProjectedPrice(customGrowth);
    const projectedFV = projectedResult.price;
    const currentFV = projectedFV / Math.pow(1 + customGrowth / 100, 5);
    
    return {
      year: `Ano ${year}`,
      'Pessimista (0%)': basePrice,
      'Conservador (8%)': basePrice * Math.pow(1 + 0.08, year),
      'Base (15%)': basePrice * Math.pow(1 + 0.15, year),
      'Otimista (22%)': basePrice * Math.pow(1 + 0.22, year),
      'Personalizado': basePrice * Math.pow(1 + customGrowth / 100, year),
      'Valor Estimado Dinâmico': currentFV * Math.pow(1 + customGrowth / 100, year),
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900  dark:border-slate-800 ">
        <div className="flex items-center gap-4 mb-6">
          {stockData?.logourl ? (
            <img 
              src={stockData.logourl} 
              alt={`Logo ${stockData.ticker}`} 
              className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className={`w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center ${stockData?.logourl ? 'hidden' : ''}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 ">Radar Peter Lynch</h2>
            <p className="text-slate-500">Análise avançada de crescimento e valuation.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="PETR4"
            className="w-full pl-4 pr-32 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg uppercase dark:border-slate-800  dark:bg-slate-800 "
          />
          <button
            type="submit"
            disabled={loading || !ticker}
            className="absolute right-2 top-2 bottom-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Buscar
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {stockData && (
        <>
          {/* Context Badges & Diagnóstico */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full dark:bg-slate-800  group relative cursor-help">
                <Tag className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ">
                  Categoria: <span className="text-emerald-600">{getStockCategory()}</span>
                </span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl pointer-events-none">
                  <p className="font-bold mb-1">Categorias de Lynch:</p>
                  <ul className="space-y-1 opacity-90">
                    <li>• <span className="text-emerald-400">Fast Grower:</span> Cresce 20-25% ao ano.</li>
                    <li>• <span className="text-blue-400">Stalwart:</span> Gigante sólida (10-12%).</li>
                    <li>• <span className="text-amber-400">Slow Grower:</span> Madura, paga dividendos.</li>
                    <li>• <span className="text-red-400">Turnaround:</span> Em recuperação.</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full dark:bg-slate-800  group relative cursor-help">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ">
                  Score de Qualidade: <span className={calculateQualityScore() > 70 ? 'text-emerald-600' : calculateQualityScore() > 40 ? 'text-amber-600' : 'text-red-600'}>
                    {calculateQualityScore()}/100
                  </span>
                </span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl pointer-events-none">
                  Avaliação algorítmica baseada em ROE, Margens, Crescimento de Lucro e Endividamento. Acima de 70 indica fundamentos excepcionais.
                </div>
              </div>
              
              {/* Semáforo de Decisão */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm dark:bg-slate-900  dark:border-slate-800  group relative cursor-help">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Risco:</span>
                <div className="flex gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${
                    (getStockCategory() === 'FAST_GROWER' || getStockCategory() === 'STALWART') && calculateQualityScore() > 60 && !detectValueTrap()
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                    : 'bg-slate-200'
                  }`} />
                  <div className={`w-3 h-3 rounded-full ${
                    (getStockCategory() === 'SLOW_GROWER' || getStockCategory() === 'TURNAROUND') && !detectValueTrap() && calculateQualityScore() >= 40
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                    : 'bg-slate-200'
                  }`} />
                  <div className={`w-3 h-3 rounded-full ${
                    detectValueTrap() || calculateQualityScore() < 40
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                    : 'bg-slate-200'
                  }`} />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center">
                  Verde: Compra potencial<br/>Amarelo: Atenção/Hold<br/>Vermelho: Alto Risco
                </div>
              </div>
            </div>

            {detectValueTrap() && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800">⚠️ POSSÍVEL ARMADILHA DE VALOR (VALUE TRAP)</p>
                  <p className="text-xs text-red-700 mt-1">
                    Esta empresa apresenta P/L muito baixo combinado com crescimento negativo e margens comprimidas. 
                    Lynch alerta: "O que parece barato pode ser uma empresa em deterioração terminal."
                  </p>
                </div>
              </div>
            )}

            {stockData.payoutRatio > 80 && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <span className="font-bold">Alerta de Payout:</span> Payout alto ({stockData.payoutRatio?.toFixed(1)}%) + DY {stockData.dividendYield?.toFixed(1)}% é atraente, mas sensível a queda de lucros (margem líquida de apenas {stockData.netMargin?.toFixed(2)}%).
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bloco 1: Diagnóstico */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-border dark:bg-slate-800  h-full">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 dark:text-slate-200  flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Diagnóstico Lynch
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase mb-1">Classificação</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-200 ">{getStockCategory()}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {getStockCategory() === 'TURNAROUND' ? 'Empresa em recuperação. Foco em lucro normalizado.' :
                       getStockCategory() === 'FAST_GROWER' ? 'Crescimento agressivo. Foco em PEG e manutenção de margens.' :
                       getStockCategory() === 'STALWART' ? 'Empresa sólida. Foco em dividendos e crescimento estável.' :
                       'Crescimento lento. Foco em dividendos e proteção de capital.'}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 font-medium uppercase mb-2">Modo de Valuation</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStockCategory() === 'TURNAROUND' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {getStockCategory() === 'TURNAROUND' ? 'RECUPERAÇÃO (LPA Normalizado)' : 'LYNCH PADRÃO (Crescimento)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Valuation */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 dark:text-slate-200  flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  {getStockCategory() === 'TURNAROUND' ? 'Valuation por Recuperação' : 'Valuation & Simulação'}
                </h3>

                {getStockCategory() === 'TURNAROUND' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl dark:bg-slate-800">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">LPA Normalizado</p>
                        <p className="text-lg font-bold text-foreground">
                         <AssetPrice price={calculateProjectedPrice(0).normalizedLpa} currency={stockData.currency} ticker={stockData.ticker} />
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl dark:bg-slate-800">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Prob. Recuperação</p>
                        <p className="text-lg font-bold text-amber-600">
                          {calculateRecoveryProbability()}%
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-amber-700 mb-2 flex items-center justify-center">
                        Faixa de Valor Estimado (8x - 12x)
                        <InfoTooltip content={
                          <div className="space-y-2">
                            <p><strong>Faixa de Valor Estimado:</strong></p>
                            <p>Baseado na premissa de Peter Lynch de que o P/L justo de uma empresa em crescimento é igual à sua taxa de crescimento (PEG = 1).</p>
                            <p>A faixa de 8x a 12x o lucro é frequentemente usada como uma margem conservadora para empresas maduras.</p>
                          </div>
                        } />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xl font-black text-slate-800 dark:text-slate-900">
                          <AssetPrice price={calculateProjectedPrice(0).min} currency={stockData.currency} ticker={stockData.ticker} />
                        </p>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <p className="text-xl font-black text-slate-800 dark:text-slate-900">
                          <AssetPrice price={calculateProjectedPrice(0).max} currency={stockData.currency} ticker={stockData.ticker} />
                        </p>
                      </div>
                      <p className="text-[10px] text-amber-600 mt-2 font-medium">
                        *Baseado em lucro médio histórico. Não há previsão de crescimento confiável.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center justify-center">
                        Valor Estimado Ajustado (Probabilidade)
                        <InfoTooltip content="Média ponderada baseada na probabilidade de crescimento da empresa (PEG Ratio)." />
                      </div>
                      <p className="text-2xl font-black text-slate-800">
                       <AssetPrice price={calculateProjectedPrice(0).price} currency={stockData.currency} ticker={stockData.ticker} />
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 italic">Alta incerteza operacional</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-xl dark:bg-slate-800">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">P/L Atual</p>
                        <p className="text-lg font-bold text-foreground">{stockData.peRatio?.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl dark:bg-slate-800">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">CAGR 5A</p>
                        <p className="text-lg font-bold text-foreground">{cagr.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Crescimento Projetado</span>
                        <span className={`text-sm font-bold ${customGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{customGrowth.toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="25"
                        step="0.5"
                        value={customGrowth}
                        onChange={(e) => setCustomGrowth(Number(e.target.value))}
                        className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${customGrowth >= 0 ? 'accent-emerald-600' : 'accent-red-600'}`}
                      />
                      
                      <div className={`p-4 rounded-xl text-center border mt-4 ${calculateUpside(calculateProjectedPrice(customGrowth).price) >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center justify-center">
                          Preço Estimado Projetado
                          <InfoTooltip content="Projeção do preço da ação no futuro, considerando a taxa de crescimento personalizada inserida." />
                        </div>
                        <p className={`text-2xl font-black ${calculateUpside(calculateProjectedPrice(customGrowth).price) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          <AssetPrice price={calculateProjectedPrice(customGrowth).price} currency={stockData.currency} ticker={stockData.ticker} />
                        </p>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mt-2 ${calculateUpside(calculateProjectedPrice(customGrowth).price) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {calculateUpside(calculateProjectedPrice(customGrowth).price) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {calculateUpside(calculateProjectedPrice(customGrowth).price).toFixed(1)}% Upside
                        </div>
                      </div>

                      {/* Gráfico de Projeção */}
                      <div className="mt-6 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="year" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#94a3b8' }} 
                            />
                            <YAxis 
                              hide 
                              domain={['auto', 'auto']} 
                            />
                            <RechartsTooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: number) => [`${stockData.currency} ${value.toFixed(2)}`]}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="Personalizado" 
                              stroke="#10b981" 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} 
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="Base (15%)" 
                              stroke="#94a3b8" 
                              strokeWidth={1} 
                              strokeDasharray="4 4" 
                              dot={false} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bloco 3: Risco & Qualidade */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-900  dark:border-slate-800  h-full">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 dark:text-slate-200  flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Análise de Risco
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-xs text-slate-400 font-medium uppercase">Score de Qualidade</p>
                      <p className={`text-lg font-bold ${calculateQualityScore() > 70 ? 'text-emerald-600' : calculateQualityScore() > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {calculateQualityScore()}/100
                      </p>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                      <div 
                        className={`h-full transition-all duration-500 ${calculateQualityScore() > 70 ? 'bg-emerald-500' : calculateQualityScore() > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${calculateQualityScore()}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${detectValueTrap() ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      {detectValueTrap() ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      <div>
                        <p className={`text-xs font-bold ${detectValueTrap() ? 'text-red-800' : 'text-emerald-800'}`}>
                          {detectValueTrap() ? 'VALUE TRAP DETECTADA' : 'LIVRE DE VALUE TRAP'}
                        </p>
                        <p className="text-[10px] text-slate-500">Baseado em P/L, Crescimento e Margens.</p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${(stockData.netDebt || 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      {(stockData.netDebt || 0) > 0 ? <Zap className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      <div>
                        <p className={`text-xs font-bold ${(stockData.netDebt || 0) > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                          {(stockData.netDebt || 0) > 0 ? 'ALAVANCAGEM PRESENTE' : 'CAIXA LÍQUIDO / DÍVIDA BAIXA'}
                        </p>
                        <p className="text-[10px] text-slate-500">Dívida Líquida: <AssetPrice price={stockData.netDebt || 0} currency={stockData.currency} ticker={stockData.ticker} /></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados Fundamentais */}
            <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 ">Dados Fundamentais (Brapi Real-Time)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">P/L</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 ">{stockData.peRatio?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">P/VP</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 ">{stockData.pvp?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">ROE</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 ">{stockData.roe?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">LPA</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 "><AssetPrice price={stockData.eps} currency={stockData.currency} ticker={stockData.ticker} /></p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">VPA</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 "><AssetPrice price={stockData.bvps} currency={stockData.currency} ticker={stockData.ticker} /></p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">Dív. Líquida</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 ">{stockData.currency} {((stockData.netDebt || 0) / 1e9).toFixed(2)}B</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">Margem Líq.</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 ">{stockData.netMargin?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">Payout</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 ">{stockData.payoutRatio?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">DY</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 ">{stockData.dividendYield?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase">Setor</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 ">{stockData.sector}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guia de Interpretação */}
          <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-400">Guia de Interpretação</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    LPA Normalizado
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500 leading-relaxed">
                    Em empresas em recuperação (Turnaround), o lucro atual pode estar distorcido. Usamos a média histórica para estimar quanto a empresa ganharia em condições normais.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    PEG Ratio
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500 leading-relaxed">
                    É o P/L dividido pelo crescimento. Lynch buscava empresas com PEG abaixo de 1.0, indicando que você está pagando pouco pelo crescimento futuro.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Value Trap
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500 leading-relaxed">
                    "Armadilha de Valor". Acontece quando uma ação parece barata (P/L baixo) mas o negócio está morrendo. O radar detecta isso cruzando margens e crescimento.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Upside
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500 leading-relaxed">
                    Potencial de valorização até o "Preço Estimado". Um upside positivo indica que a ação pode estar descontada em relação ao seu valor estimado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Button */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold">Análise Rápida IA</h3>
            </div>
            
            {!aiAnalysis ? (
              <button
                onClick={generateAIAnalysis}
                disabled={loadingAi}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 dark:bg-slate-900 "
              >
                {loadingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gerar Análise Peter Lynch'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown>{aiAnalysis}</Markdown>
                </div>
                <ReportAudioPlayer text={aiAnalysis} title={`Análise Peter Lynch: ${stockData.ticker}`} colorTheme="emerald" />
              </div>
            )}
          </div>

          {/* AdSense Unit */}
          <AdUnit slot="YYYYYYYYYY" className="bg-card border border-border p-4 rounded-2xl" />
        </>
      )}
    </div>
  );
}
