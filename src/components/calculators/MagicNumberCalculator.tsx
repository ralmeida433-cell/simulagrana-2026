import React, { useState, useMemo, useEffect } from 'react';
import { Search, Info, Calculator, TrendingUp, HelpCircle, RefreshCw, Cake } from 'lucide-react';
import { searchFIIData, FIIData } from '../../services/fiiService';
import { formatCurrency } from '../../lib/utils';
import { differenceInYears, addMonths, parseISO } from 'date-fns';

interface MagicNumberCalculatorProps {
  userBirthdate: string | null;
}

export default function MagicNumberCalculator({ userBirthdate }: MagicNumberCalculatorProps) {
  const [ticker, setTicker] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ticker') || '';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [fiiData, setFiiData] = useState<FIIData | null>(null);
  const [error, setError] = useState('');

  const [desiredIncome, setDesiredIncome] = useState<number>(1000);
  const [incomePeriod, setIncomePeriod] = useState<'daily' | 'monthly' | 'annual'>('monthly');
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [currentQuotas, setCurrentQuotas] = useState<number>(0);

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
    try {
      const data = await searchFIIData(targetTicker.toUpperCase());
      if (data) setFiiData(data);
      else setError('Ticker não encontrado.');
    } catch (err) {
      setError('Erro na busca.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Busca
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    doSearch(ticker);
  };

  // Lógica Matemática do Magic Number
  // Fórmula: Preço da Cota / Último Rendimento
  const magicNumber = fiiData && fiiData.lastDividend > 0 ? Math.ceil(fiiData.price / fiiData.lastDividend) : 0;
  const totalInvestment = fiiData ? magicNumber * fiiData.price : 0;
  const monthlyIncome = fiiData ? magicNumber * fiiData.lastDividend : 0;

  // Lógica Matemática do Simulador
  let targetMonthlyIncome = desiredIncome;
  if (incomePeriod === 'daily') targetMonthlyIncome = desiredIncome * 30;
  if (incomePeriod === 'annual') targetMonthlyIncome = desiredIncome / 12;

  const requiredQuotas = fiiData && fiiData.lastDividend > 0 ? Math.ceil(targetMonthlyIncome / fiiData.lastDividend) : 0;
  const simTotalInvestment = fiiData ? requiredQuotas * fiiData.price : 0;
  const estimatedMonthlyIncome = fiiData ? requiredQuotas * fiiData.lastDividend : 0;

  const timeToGoal = useMemo(() => {
    if (!fiiData || requiredQuotas <= currentQuotas || (monthlyContribution <= 0 && currentQuotas * fiiData.lastDividend <= 0)) return null;
    
    let quotas = currentQuotas;
    let months = 0;
    const target = requiredQuotas;
    const price = fiiData.price;
    const dividend = fiiData.lastDividend;
    
    // Simple simulation: each month add contribution + dividends, buy as many quotas as possible
    while (quotas < target && months < 1200) { // 100 years limit
      months++;
      const availableCash = monthlyContribution + (quotas * dividend);
      const newQuotas = Math.floor(availableCash / price);
      quotas += newQuotas;
    }
    
    return months;
  }, [fiiData, requiredQuotas, currentQuotas, monthlyContribution]);

  const projectedAge = useMemo(() => {
    if (!userBirthdate || timeToGoal === null) return null;
    const birthDate = parseISO(userBirthdate);
    const targetDate = addMonths(new Date(), timeToGoal);
    return differenceInYears(targetDate, birthDate);
  }, [userBirthdate, timeToGoal]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200 shrink-0">
          Magic Number FII
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Atualização</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Agora</p>
          </div>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
            Taxas Reais
          </span>
        </div>
      </div>

      {/* Card de Busca */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Digite o Ticker do FII (Ex: MXRF11)"
            className="flex-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-medium dark:border-slate-800 dark:bg-slate-800"
          />
          <button
            disabled={loading || !ticker.trim()}
            className="bg-emerald-600 text-white w-full sm:w-auto px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors shrink-0"
          >
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Buscar'}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2 font-medium px-2">{error}</p>}
      </div>

      {/* Exibição dos Resultados */}
      {fiiData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Card: FII Info */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col dark:bg-slate-900  dark:border-slate-800 ">
              <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                <div className="flex items-center gap-3 min-w-0 max-w-[80%]">
                  {fiiData.logourl ? (
                    <img 
                      src={fiiData.logourl} 
                      alt={`Logo ${fiiData.ticker}`} 
                      className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div className={`w-10 h-10 shrink-0 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm ${fiiData.logourl ? 'hidden' : ''}`}>
                    {fiiData.ticker.substring(0, 2)}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground truncate min-w-0" title={fiiData.ticker}>{fiiData.ticker}</h2>
                </div>
                <span className="bg-[#dcfce7] text-[#166534] text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0 mt-2 sm:mt-0 ml-auto">
                  Dados Reais
                </span>
              </div>
              <p className="text-slate-500 text-sm mb-8">{fiiData.name}</p>
              
              <div className="mt-auto space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800 ">
                  <span className="text-slate-500 text-sm">Preço Atual</span>
                  <span className="font-bold text-foreground ">{formatCurrency(fiiData.price)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800 ">
                  <span className="text-slate-500 text-sm">Último Rendimento</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(fiiData.lastDividend)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 text-sm">Dividend Yield (Mensal)</span>
                  <span className="font-bold text-foreground ">{fiiData.dividendYield.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Right Card: Magic Number */}
            <div className="lg:col-span-8 bg-[#065f46] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col items-center justify-center shadow-lg md:text-center text-center">
              <div className="relative z-10 w-full text-center flex flex-col items-center justify-center">
                <p className="text-emerald-300 text-xs font-bold tracking-wider uppercase mb-2">Magic Number</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4 w-full px-4">
                  <span className="text-5xl sm:text-7xl lg:text-8xl font-black shrink-0 max-w-full truncate">{magicNumber}</span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-400 mt-2 sm:mt-4">cotas</span>
                </div>
                <p className="text-emerald-100 text-sm leading-relaxed max-w-lg mx-auto">
                  Ao atingir <strong>{magicNumber} cotas</strong>, o rendimento mensal de <strong>{formatCurrency(monthlyIncome)}</strong> será suficiente para comprar uma nova cota de <strong>{formatCurrency(fiiData.price)}</strong> sem tirar dinheiro do bolso.
                </p>
              </div>
              
              <div className="relative z-10 bg-[#064e3b]/50 rounded-2xl p-6 border border-emerald-700/50 backdrop-blur-sm mt-8 min-w-[260px] w-full max-w-md mx-auto text-center">
                <p className="text-emerald-300 text-[10px] font-bold tracking-wider uppercase mb-1">Investimento Necessário</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totalInvestment)}</p>
                
                <div className="h-px bg-emerald-700/50 my-5 mx-auto w-3/4" />
                
                <div className="flex items-center justify-center gap-2 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" />
                  <span>Efeito Bola de Neve Ativado</span>
                </div>
              </div>
              
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full -mr-20 -mt-20 blur-[100px] opacity-30 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400 rounded-full -ml-20 -mb-20 blur-[80px] opacity-20 pointer-events-none" />
            </div>
          </div>

          {/* Bottom Card: Simulador */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground ">Simulador de Renda Desejada</h3>
            </div>
            <p className="text-slate-500 text-sm mb-8">Quanto você quer receber de renda passiva com o <strong>{fiiData.ticker}</strong>?</p>
            
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Renda Desejada (R$)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-bold">R$</span>
                    </div>
                    <input
                      type="number"
                      value={desiredIncome || ''}
                      onChange={(e) => setDesiredIncome(Number(e.target.value))}
                      className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none dark:text-slate-100  dark:border-slate-800  dark:bg-slate-800 "
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Período da Renda</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 dark:border-slate-800  dark:bg-slate-800 ">
                    {(['daily', 'monthly', 'annual'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setIncomePeriod(period)}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                          incomePeriod === period 
                            ? 'bg-white text-blue-600 shadow-sm border border-slate-100 dark:bg-slate-700 dark:text-blue-400 dark:border-slate-600' 
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        {period === 'daily' ? 'Diário' : period === 'monthly' ? 'Mensal' : 'Anual'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Aporte Mensal (R$)</label>
                    <input
                      type="number"
                      value={monthlyContribution || ''}
                      onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100 dark:border-slate-800 dark:bg-slate-800"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Cotas Atuais</label>
                    <input
                      type="number"
                      value={currentQuotas || ''}
                      onChange={(e) => setCurrentQuotas(Number(e.target.value))}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100 dark:border-slate-800 dark:bg-slate-800"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Results Box */}
              <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-center shadow-lg min-w-0 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-6 w-full">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider shrink-0">Cotas Necessárias</span>
                  <span className="text-2xl sm:text-3xl font-black text-blue-400 truncate max-w-full">{requiredQuotas.toLocaleString('pt-BR')}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-6 w-full">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider shrink-0">Investimento Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-white truncate max-w-full">{formatCurrency(simTotalInvestment)}</span>
                </div>
                
                <div className="h-px bg-slate-800 my-6 w-full" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 w-full">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider shrink-0">Renda Mensal Estimada</span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-400 truncate max-w-full">{formatCurrency(estimatedMonthlyIncome)}</span>
                </div>

                {timeToGoal !== null && (
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 w-full">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider shrink-0">Tempo Estimado</span>
                      <span className="text-xl sm:text-2xl font-bold text-blue-400 truncate max-w-full">
                        {timeToGoal >= 12 ? `${Math.floor(timeToGoal / 12)} anos e ${timeToGoal % 12} meses` : `${timeToGoal} meses`}
                      </span>
                    </div>
                    {projectedAge !== null && (
                      <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                          <Cake className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Idade Projetada</p>
                          <p className="text-xs font-bold text-white">
                            Você terá <span className="text-emerald-400">{projectedAge} anos</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-slate-500 text-[10px] italic mt-6">
                  * Baseado no último rendimento de {formatCurrency(fiiData.lastDividend)} por cota.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}