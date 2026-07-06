import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Eye, EyeOff, Table as TableIcon, Cake, BarChart3, AreaChart as AreaChartIcon } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { FinanceData } from '../../services/financeService';
import { differenceInYears, addMonths, parseISO } from 'date-fns';

interface CompoundInterestProps {
  financeData: FinanceData;
  userBirthdate: string | null;
  onOpenBirthdateModal?: () => void;
}

export default function CompoundInterest({ financeData, userBirthdate, onOpenBirthdateModal }: CompoundInterestProps) {
  const [initialValue, setInitialValue] = useState<string | number>('');
  const [monthlyValue, setMonthlyValue] = useState<string | number>('');
  const [interestRate, setInterestRate] = useState<string | number>('');
  const [period, setPeriod] = useState<string | number>('');
  const [periodType, setPeriodType] = useState<'years' | 'months'>('years');
  const [tablePeriod, setTablePeriod] = useState<'years' | 'months'>('years');
  const [showValues, setShowValues] = useState(() => {
    const saved = localStorage.getItem('simulagrana_show_values');
    return saved !== 'false';
  });
  const [chartType, setChartType] = useState<'evolution' | 'equity'>('evolution');
  const [vizType, setVizType] = useState<'area' | 'bar'>('area');
  const [toggledTableFields, setToggledTableFields] = useState<Set<string>>(new Set());
  const [toggledSummary, setToggledSummary] = useState<Set<string>>(new Set());
  const [toggledReturns, setToggledReturns] = useState<Set<string>>(new Set());

  const toggleGlobalVisibility = () => {
    const newValue = !showValues;
    setShowValues(newValue);
    localStorage.setItem('simulagrana_show_values', String(newValue));
    setToggledTableFields(new Set());
    setToggledSummary(new Set());
    setToggledReturns(new Set());
  };

  const toggleReturn = (key: string) => {
    const newToggled = new Set(toggledReturns);
    if (newToggled.has(key)) {
      newToggled.delete(key);
    } else {
      newToggled.add(key);
    }
    setToggledReturns(newToggled);
  };

  const toggleSummary = (field: string) => {
    const newToggled = new Set(toggledSummary);
    if (newToggled.has(field)) {
      newToggled.delete(field);
    } else {
      newToggled.add(field);
    }
    setToggledSummary(newToggled);
  };

  const toggleTableField = (idx: number, field: string) => {
    const key = `row-${idx}-${field}`;
    const newToggled = new Set(toggledTableFields);
    if (newToggled.has(key)) {
      newToggled.delete(key);
    } else {
      newToggled.add(key);
    }
    setToggledTableFields(newToggled);
  };

  const simulationData = useMemo(() => {
    const p = Number(period) || 0;
    const months = periodType === 'years' ? p * 12 : p;
    const rate = (Number(interestRate) || 0) / 100;
    // IPCA is fetched from the BCB API (last 12 months accumulated).
    // If you are comparing with a manual calculation that uses a fixed IPCA (e.g., 4.81%),
    // there might be a slight divergence because the API value updates automatically.
    const ipcaAnnual = financeData.ipca / 100;
    const ipcaMonthly = Math.pow(1 + ipcaAnnual, 1 / 12) - 1;
    const realRate = (1 + rate) / (1 + ipcaMonthly) - 1;
    
    const data = [];
    
    const iv = Number(initialValue) || 0;
    const mv = Number(monthlyValue) || 0;

    let totalInvested = iv;
    let totalAmount = iv;
    let totalSimpleAmount = iv;
    let totalRealAmount = iv;

    data.push({
      month: 0,
      totalAmount,
      totalSimpleAmount,
      totalRealAmount,
      totalInvested,
      totalInterest: 0,
      totalSimpleInterest: 0,
      periodInterest: 0,
      periodInvested: iv,
      monthlyNominalReturn: 0,
      monthlyRealReturn: 0,
      inflationImpact: 0,
      accumulatedNominalReturn: 0,
      accumulatedRealReturn: 0,
    });

    for (let i = 1; i <= months; i++) {
      const interest = totalAmount * rate;
      totalInvested += mv;
      totalAmount = (totalAmount + mv) * (1 + rate);
      totalRealAmount = (totalRealAmount + mv) * (1 + realRate);
      
      // Simple interest calculation
      let simpleInterest = iv * rate * i;
      for (let j = 1; j <= i; j++) {
        simpleInterest += mv * rate * (i - j);
      }
      totalSimpleAmount = totalInvested + simpleInterest;

      const monthlyNominalReturn = rate * 100;
      const monthlyRealReturn = realRate * 100;
      const inflationImpact = monthlyRealReturn - monthlyNominalReturn;

      const accumulatedNominalReturn = totalInvested > 0 ? ((totalAmount - totalInvested) / totalInvested) * 100 : 0;
      const accumulatedRealReturn = totalInvested > 0 ? ((totalRealAmount - totalInvested) / totalInvested) * 100 : 0;
      
      data.push({
        month: i,
        year: Math.floor(i / 12),
        totalAmount: Math.round(totalAmount),
        totalSimpleAmount: Math.round(totalSimpleAmount),
        totalRealAmount: Math.round(totalRealAmount),
        totalInvested: Math.round(totalInvested),
        totalInterest: Math.round(totalAmount - totalInvested),
        totalSimpleInterest: Math.round(simpleInterest),
        periodInterest: Math.round(totalAmount - (totalAmount / (1 + rate))),
        periodInvested: mv,
        monthlyNominalReturn,
        monthlyRealReturn,
        inflationImpact,
        accumulatedNominalReturn,
        accumulatedRealReturn,
      });
    }

    return data;
  }, [initialValue, monthlyValue, interestRate, period, periodType, financeData.ipca]);

  const tableData = useMemo(() => {
    if (tablePeriod === 'months') return simulationData;
    return simulationData.filter(row => row.month === 0 || row.month % 12 === 0 || row.month === simulationData[simulationData.length - 1].month);
  }, [simulationData, tablePeriod]);

  const ValueDisplay = ({ 
    value, 
    isHidden, 
    onToggle,
    className = ""
  }: { 
    value: number | string, 
    isHidden?: boolean,
    onToggle?: () => void,
    className?: string
  }) => {
    return (
      <span 
        onClick={onToggle}
        className={`${isHidden ? "bg-slate-200 dark:bg-slate-700  text-transparent select-none rounded px-2 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" : "cursor-pointer"} ${className}`}
      >
        {isHidden ? "••••••" : (typeof value === 'number' ? formatCurrency(value) : value)}
      </span>
    );
  };

  const finalResult = simulationData[simulationData.length - 1];

  const projectedAge = useMemo(() => {
    if (!userBirthdate || !period) return null;
    const birthDate = parseISO(userBirthdate);
    const months = periodType === 'years' ? Number(period) * 12 : Number(period);
    const targetDate = addMonths(new Date(), months);
    return differenceInYears(targetDate, birthDate);
  }, [userBirthdate, period, periodType]);

  const returnsData = useMemo(() => {
    const rate = (Number(interestRate) || 0) / 100; // monthly rate
    // IPCA is fetched from the BCB API (last 12 months accumulated).
    // If you are comparing with a manual calculation that uses a fixed IPCA (e.g., 4.81%),
    // there might be a slight divergence because the API value updates automatically.
    const ipcaAnnual = financeData.ipca / 100; // annual inflation
    const ipcaMonthly = Math.pow(1 + ipcaAnnual, 1 / 12) - 1;
    const realRate = (1 + rate) / (1 + ipcaMonthly) - 1;
    const iv = Number(initialValue) || 0;
    const mv = Number(monthlyValue) || 0;

    const periods = [1, 3, 12, 24, 60, 120];
    
    return periods.map(months => {
      let totalInvested = iv;
      let totalAmount = iv;
      let totalRealAmount = iv;
      
      for (let i = 1; i <= months; i++) {
        totalInvested += mv;
        totalAmount = (totalAmount + mv) * (1 + rate);
        totalRealAmount = (totalRealAmount + mv) * (1 + realRate);
      }
      
      const nominalReturn = totalInvested > 0 ? (totalAmount - totalInvested) / totalInvested : 0;
      const realReturn = totalInvested > 0 ? (totalRealAmount - totalInvested) / totalInvested : 0;
      
      return {
        months,
        nominal: nominalReturn * 100,
        real: realReturn * 100,
        impact: (realReturn - nominalReturn) * 100
      };
    });
  }, [initialValue, monthlyValue, interestRate, financeData.ipca]);

  const renderSummaryItem = (label: string, value: number, field: string, isLarge = false) => {
    const isHidden = showValues ? toggledSummary.has(field) : !toggledSummary.has(field);
    return (
      <div className="group relative">
        <p className="text-xs text-emerald-600 font-medium">{label}</p>
        <div className="flex items-center gap-2">
          <div className={`${isLarge ? 'text-2xl font-bold text-emerald-900' : 'text-lg font-bold text-emerald-800'}`}>
            <ValueDisplay value={value} isHidden={isHidden} onToggle={() => toggleSummary(field)} />
          </div>
        </div>
      </div>
    );
  };

  const formatChartValue = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  return (
    <div className="space-y-3 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24 sm:pb-12 max-w-[100vw] overflow-hidden px-4 sm:px-0">
      {/* Header with Global Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-4 bg-white p-3 sm:p-6 rounded-xl sm:rounded-[32px] border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 bg-emerald-500 rounded-lg sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <AreaChartIcon className="w-4 h-4 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-2xl font-black text-foreground tracking-tight truncate leading-none">Juros Compostos</h2>
              <p className="text-[9px] sm:text-xs font-medium text-slate-400 uppercase tracking-widest mt-1 truncate">Evolução Patrimonial</p>
            </div>
          </div>
          <button 
            onClick={toggleGlobalVisibility}
            className={`p-2 rounded-lg transition-all shrink-0 ml-2 ${!showValues ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:hover:text-slate-300'}`}
            title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
          >
            {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
      {/* Inputs */}
      <div className="lg:col-span-1 space-y-3 sm:space-y-6">
        <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
          <div className="flex items-center gap-2 mb-3 sm:mb-6">
            <div className="w-1.5 h-4 sm:h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-sm sm:text-lg font-bold text-foreground tracking-tight">Configurações</h3>
          </div>
          
          <div className="space-y-3 sm:space-y-5">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Investimento Inicial</label>
              <div className="relative group">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-medium">R$</span>
                <input 
                  type="number" 
                  value={initialValue}
                  onChange={(e) => setInitialValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 sm:pl-12 pr-3 py-2 sm:py-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-800/50 text-sm sm:text-lg font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Aporte Mensal</label>
              <div className="relative group">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm font-medium">R$</span>
                <input 
                  type="number" 
                  value={monthlyValue}
                  onChange={(e) => setMonthlyValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 sm:pl-12 pr-3 py-2 sm:py-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-800/50 text-sm sm:text-lg font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Taxa de Juros (% ao mês)</label>
              <div className="relative group">
                <input 
                  type="number" 
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="0,0"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-800/50 text-sm sm:text-lg font-semibold"
                />
                <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm font-bold">%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Período</label>
                <input 
                  type="number" 
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-800/50 text-sm sm:text-lg font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Unidade</label>
                <select 
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as any)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-800/50 text-xs sm:text-sm font-bold"
                >
                  <option value="years">Anos</option>
                  <option value="months">Meses</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3 sm:mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 sm:h-6 bg-emerald-500 rounded-full" />
              <h4 className="text-sm sm:text-xl font-bold text-foreground tracking-tight">Resultado</h4>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Acumulado (Nominal)</p>
              <div className="text-2xl sm:text-4xl font-light text-foreground tracking-tight truncate">
                <ValueDisplay 
                  value={finalResult.totalAmount} 
                  isHidden={showValues ? toggledSummary.has('totalAmount') : !toggledSummary.has('totalAmount')} 
                  onToggle={() => toggleSummary('totalAmount')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 pt-3 sm:pt-6 border-t border-border/50">
              <div className="space-y-0.5 min-w-0">
                <p className="text-[10px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Investido</p>
                <div className="text-sm sm:text-lg font-semibold text-slate-700 dark:text-slate-300 truncate">
                  <ValueDisplay 
                    value={finalResult.totalInvested} 
                    isHidden={showValues ? toggledSummary.has('totalInvested') : !toggledSummary.has('totalInvested')} 
                    onToggle={() => toggleSummary('totalInvested')}
                  />
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[10px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Em Juros</p>
                <div className="text-sm sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  <ValueDisplay 
                    value={finalResult.totalInterest} 
                    isHidden={showValues ? toggledSummary.has('totalInterest') : !toggledSummary.has('totalInterest')} 
                    onToggle={() => toggleSummary('totalInterest')}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 sm:pt-6 border-t border-border/50 space-y-2 sm:space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Rentabilidade Real</span>
                <span className="text-sm sm:text-lg font-light text-emerald-600 truncate max-w-[50%] text-right">
                  <ValueDisplay 
                    value={`+${(isNaN(finalResult.accumulatedRealReturn) ? 0 : finalResult.accumulatedRealReturn).toFixed(2)}%`}
                    isHidden={showValues ? toggledSummary.has('accumulatedRealReturn') : !toggledSummary.has('accumulatedRealReturn')}
                    onToggle={() => toggleSummary('accumulatedRealReturn')}
                  />
                </span>
              </div>
              <div className={`h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex transition-all ${!showValues ? 'opacity-0' : 'opacity-100'}`}>
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${finalResult.totalAmount > 0 ? Math.min(100, (finalResult.totalInterest / finalResult.totalAmount) * 100) : 0}%` }} 
                />
                <div 
                  className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-1000" 
                  style={{ width: `${finalResult.totalAmount > 0 ? Math.min(100, (finalResult.totalInvested / finalResult.totalAmount) * 100) : 0}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Juros</span>
                <span>Investido</span>
              </div>
            </div>

            {/* PROJECTED AGE VIEW */}
            {period ? (
              <div className="pt-4 mt-2 border-t border-border/50">
                {projectedAge !== null ? (
                  <div className="bg-emerald-500/10 p-4 rounded-2xl flex items-center gap-4 border border-emerald-500/20 w-full group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                      <Cake className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 z-10">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black text-emerald-600/80 uppercase tracking-[0.2em] leading-none mb-1">Visão de Futuro</p>
                        <button 
                          onClick={onOpenBirthdateModal}
                          className="text-[9px] font-bold text-emerald-600 uppercase hover:underline opacity-60"
                        >
                          Editar Idade
                        </button>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        Ao fim do período, você terá <span className="text-lg font-black text-emerald-500 inline-block">
                          <ValueDisplay 
                            value={`${projectedAge} anos`} 
                            isHidden={showValues ? toggledSummary.has('projectedAge') : !toggledSummary.has('projectedAge')} 
                            onToggle={() => toggleSummary('projectedAge')}
                          />
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={onOpenBirthdateModal}
                    className="w-full bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                      <Cake className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none mb-1">Idade Projetada</p>
                      <p className="text-xs font-bold text-muted-foreground truncate">Clique para informar sua idade e ver</p>
                    </div>
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="lg:col-span-2 space-y-4 sm:space-y-8">
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border border-slate-200 shadow-sm h-[400px] sm:h-[450px] flex flex-col dark:bg-slate-900  dark:border-slate-800 ">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 sm:w-2 sm:h-5 bg-emerald-500 rounded-full" />
            <h3 className="text-sm sm:text-lg font-bold text-foreground tracking-tight">Evolução Patrimonial</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex justify-between sm:justify-start gap-2">
              <div className="flex border border-border dark:border-slate-800 p-0.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <button
                  onClick={() => setVizType('area')}
                  className={`p-1.5 sm:p-2 rounded-md transition-all ${vizType === 'area' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-slate-200/50 dark:border-slate-700/50' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Gráfico de Área"
                >
                  <AreaChartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => setVizType('bar')}
                  className={`p-1.5 sm:p-2 rounded-md transition-all ${vizType === 'bar' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-slate-200/50 dark:border-slate-700/50' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Gráfico de Barras"
                >
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              <div className="flex border border-border dark:border-slate-800 p-0.5 rounded-lg flex-1 sm:flex-none bg-slate-50 dark:bg-slate-900/50">
                <button
                  onClick={() => setChartType('evolution')}
                  className={`flex-1 sm:flex-none px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold transition-all rounded-md tracking-wide ${chartType === 'evolution' ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm border border-slate-200/50 dark:border-slate-700/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Acumulado
                </button>
                <button
                  onClick={() => setChartType('equity')}
                  className={`flex-1 sm:flex-none px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold transition-all rounded-md tracking-wide ${chartType === 'equity' ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm border border-slate-200/50 dark:border-slate-700/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Nom x Real
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {chartType === 'evolution' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span>Juros</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full" />
                    <span>Investido</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span>Nominal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Real</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
          <div className={`flex-1 min-h-[300px] sm:min-h-0 -ml-4 sm:ml-0 transition-all duration-500 ${!showValues ? 'blur-xl grayscale opacity-20 pointer-events-none' : ''}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              {vizType === 'area' ? (
                <AreaChart data={simulationData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(val) => periodType === 'years' ? `${Math.floor(val / 12)}a` : `${val}m`}
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={600}
                    minTickGap={30}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={formatChartValue}
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={600}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Mês ${label}`}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(4px)',
                      fontSize: '12px'
                    }}
                  />
                  {chartType === 'evolution' ? (
                    <>
                      <Area 
                        type="monotone" 
                        dataKey="totalInvested" 
                        stackId="1"
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        fillOpacity={0.8} 
                        fill="url(#colorInvested)" 
                        name="Total Investido"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalInterest" 
                        stackId="1"
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={0.8} 
                        fill="url(#colorInterest)" 
                        name="Juros Acumulados"
                      />
                    </>
                  ) : (
                    <>
                      <Area 
                        type="monotone" 
                        dataKey="totalAmount" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={0.3} 
                        fill="url(#colorInterest)" 
                        name="Patrimônio Nominal"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalRealAmount" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fillOpacity={0.3} 
                        fill="url(#colorReal)"
                        name="Patrimônio Real (IPCA)"
                      />
                    </>
                  )}
                </AreaChart>
              ) : (
                <BarChart data={simulationData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(val) => periodType === 'years' ? `${Math.floor(val / 12)}a` : `${val}m`}
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={600}
                    minTickGap={30}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={formatChartValue}
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={600}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Mês ${label}`}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(4px)',
                      fontSize: '12px'
                    }}
                  />
                  {chartType === 'evolution' ? (
                    <>
                      <Bar 
                        dataKey="totalInvested" 
                        stackId="1"
                        fill="#94a3b8" 
                        name="Total Investido"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar 
                        dataKey="totalInterest" 
                        stackId="1"
                        fill="#10b981" 
                        name="Juros Acumulados"
                        radius={[4, 4, 0, 0]}
                      />
                    </>
                  ) : (
                    <>
                      <Bar 
                        dataKey="totalAmount" 
                        fill="#10b981" 
                        name="Patrimônio Nominal"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="totalRealAmount" 
                        fill="#3b82f6" 
                        name="Patrimônio Real (IPCA)"
                        radius={[4, 4, 0, 0]}
                      />
                    </>
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-[32px] border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-4">Poder dos Juros</p>
            <div className="flex items-end gap-1.5 mb-1 sm:mb-2">
              <span className="text-xl sm:text-4xl font-light text-emerald-600 truncate break-all">
                <ValueDisplay 
                  value={`${finalResult.totalAmount > 0 ? Math.round((finalResult.totalInterest / finalResult.totalAmount) * 100) : 0}%`}
                  isHidden={showValues ? toggledSummary.has('interestPower') : !toggledSummary.has('interestPower')}
                  onToggle={() => toggleSummary('interestPower')}
                />
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 mb-0.5 sm:mb-2 uppercase tracking-tight">do total</span>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-[32px] border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-4 truncate">Rend. Sugerido</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-0.5 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-xl sm:text-4xl font-light text-foreground truncate break-all group relative cursor-pointer" title={formatCurrency(finalResult.totalAmount * (Number(interestRate) / 100))}>
                <ValueDisplay 
                  value={formatCurrency(finalResult.totalAmount * (Number(interestRate) / 100)).split(',')[0]} 
                  isHidden={showValues ? toggledSummary.has('monthlyReturn') : !toggledSummary.has('monthlyReturn')} 
                  onToggle={() => toggleSummary('monthlyReturn')}
                />
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 mb-0 sm:mb-2 uppercase tracking-tight">/mês</span>
            </div>
          </div>
        </div>

        {/* Rentabilidade Table */}
        <div className="bg-white rounded-xl sm:rounded-[32px] border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden mb-6">
          <div className="p-3 sm:p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/30 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 sm:w-2 sm:h-6 bg-blue-500 rounded-full" />
              <h3 className="text-sm sm:text-lg font-bold text-foreground  tracking-tight">Rentabilidade</h3>
            </div>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
              IPCA: <ValueDisplay 
                value={`${(financeData.ipca || 0).toFixed(2)}% a.a.`} 
                isHidden={showValues ? toggledSummary.has('ipca') : !toggledSummary.has('ipca')} 
                onToggle={() => toggleSummary('ipca')}
              />
            </span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[320px] sm:min-w-[600px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800">
                    <th className="px-2 py-2 sm:px-8 sm:py-4 text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/30 sticky left-0">Métrica</th>
                    {returnsData.map((data, idx) => (
                      <th key={idx} className="px-2 py-2 sm:px-4 sm:py-4 text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center bg-slate-50/50 dark:bg-slate-800/30">{data.months < 12 ? `${data.months}m` : `${data.months/12}a`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  <tr>
                    <td className="px-2 py-2.5 sm:px-8 sm:py-6 text-[10px] sm:text-sm font-bold text-slate-700 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">Nominal</td>
                    {returnsData.map((data, idx) => {
                      const key = `nominal-${idx}`;
                      const isHidden = showValues ? toggledReturns.has(key) : !toggledReturns.has(key);
                      return (
                        <td key={idx} className="px-2 py-2.5 sm:px-4 sm:py-6 text-center group relative">
                          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                            <span className="text-[10px] sm:text-lg font-bold sm:font-light text-emerald-600">
                              <ValueDisplay 
                                value={`+${(isNaN(data.nominal) ? 0 : data.nominal).toFixed(1)}%`} 
                                isHidden={isHidden} 
                                onToggle={() => toggleReturn(key)}
                              />
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="px-2 py-2.5 sm:px-8 sm:py-6 text-[10px] sm:text-sm font-bold text-slate-700 dark:text-slate-200 sticky left-0 bg-slate-50 dark:bg-slate-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">Real</td>
                    {returnsData.map((data, idx) => {
                      const key = `real-${idx}`;
                      const isHidden = showValues ? toggledReturns.has(key) : !toggledReturns.has(key);
                      return (
                        <td key={idx} className="px-2 py-2.5 sm:px-4 sm:py-6 text-center group relative">
                          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                            <span className="text-[10px] sm:text-lg font-bold sm:font-light text-blue-600">
                              <ValueDisplay 
                                value={`+${(isNaN(data.real) ? 0 : data.real).toFixed(1)}%`} 
                                isHidden={isHidden} 
                                onToggle={() => toggleReturn(key)}
                              />
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Table - Moved to bottom, spans full width */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl sm:rounded-[32px] border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-3 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-muted/50  dark:border-slate-800 ">
            <div className="flex items-center gap-2">
              <TableIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-400 " />
              <h3 className="text-sm sm:text-lg font-bold text-foreground ">Evolução</h3>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex bg-slate-200/50 dark:bg-slate-800/50 w-full sm:w-auto p-0.5 sm:p-1 rounded-lg">
                <button
                  onClick={() => setTablePeriod('months')}
                  className={`flex-1 sm:flex-none px-2 py-1.5 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${tablePeriod === 'months' ? 'bg-white dark:bg-slate-700  text-foreground  shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200'}`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setTablePeriod('years')}
                  className={`flex-1 sm:flex-none px-2 py-1.5 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${tablePeriod === 'years' ? 'bg-white dark:bg-slate-700  text-foreground  shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200'}`}
                >
                  Anual
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[500px] sm:min-w-[600px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-border dark:bg-slate-800 ">
                    <th className="px-2 py-2 sm:px-6 sm:py-4 text-[8px] sm:text-[10px] font-bold text-muted-foreground  uppercase tracking-wider border-r border-border" rowSpan={2}>Período</th>
                    <th className="px-2 py-2 sm:px-6 sm:py-4 text-[8px] sm:text-[10px] font-bold text-muted-foreground  uppercase tracking-wider border-r border-border" rowSpan={2}>Investido</th>
                    <th className="px-2 py-1 sm:px-6 sm:py-2 text-[8px] sm:text-[10px] font-bold text-muted-foreground  uppercase tracking-wider text-center border-b border-r border-border bg-emerald-50/20 dark:bg-emerald-900/10" colSpan={2}>Juros Compostos</th>
                    <th className="px-2 py-1 sm:px-6 sm:py-2 text-[8px] sm:text-[10px] font-bold text-muted-foreground  uppercase tracking-wider text-center border-b border-border bg-blue-50/20 dark:bg-blue-900/10" colSpan={3}>Rentabilidade Real</th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-border dark:bg-slate-800 ">
                    <th className="px-2 py-1 sm:px-6 sm:py-2 text-[8px] sm:text-[10px] font-bold text-muted-foreground  uppercase tracking-wider text-center bg-emerald-50/20 dark:bg-emerald-900/10">Juros Acum.</th>
                    <th className="px-2 py-1 sm:px-6 sm:py-2 text-[8px] sm:text-[10px] font-bold text-muted-foreground  uppercase tracking-wider text-center border-r border-border bg-emerald-50/20 dark:bg-emerald-900/10">Total</th>
                    <th className="px-2 py-1 sm:px-6 sm:py-2 text-[8px] sm:text-[10px] font-bold text-muted-foreground  uppercase tracking-wider text-center bg-blue-50/20 dark:bg-blue-900/10">Nominal</th>
                    <th className="px-2 py-1 sm:px-6 sm:py-2 text-[8px] sm:text-[10px] font-bold text-muted-foreground  uppercase tracking-wider text-center bg-blue-50/20 dark:bg-blue-900/10">Real</th>
                    <th className="px-2 py-1 sm:px-6 sm:py-2 text-[8px] sm:text-[10px] font-bold text-muted-foreground  uppercase tracking-wider text-center bg-blue-50/20 dark:bg-blue-900/10">Impacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 contrast:divide-slate-700/50">
                  {tableData.map((row, idx) => {
                    const isFieldHidden = (field: string) => showValues ? toggledTableFields.has(`row-${idx}-${field}`) : !toggledTableFields.has(`row-${idx}-${field}`);
                    const prevRow = idx > 0 ? tableData[idx - 1] : null;
                    
                    // Calculate periodic returns (since last row)
                    let periodicNominal = 0;
                    let periodicReal = 0;
                    let periodicImpact = 0;

                    if (prevRow) {
                      const investedInPeriod = row.totalInvested - prevRow.totalInvested;
                      if ((prevRow.totalAmount + investedInPeriod) > 0) {
                        // For annual mode, we want the return of that year
                        // For monthly mode, we want the return of that month
                        periodicNominal = ((row.totalAmount / (prevRow.totalAmount + investedInPeriod)) - 1) * 100;
                        periodicReal = ((row.totalRealAmount / (prevRow.totalRealAmount + investedInPeriod)) - 1) * 100;
                        periodicImpact = periodicReal - periodicNominal;
                      }
                    }

                    let prevPeriodicReal = 0;
                    if (idx > 1) {
                      const pRow = tableData[idx-1];
                      const ppRow = tableData[idx-2];
                      const pInvested = pRow.totalInvested - ppRow.totalInvested;
                      if ((ppRow.totalRealAmount + pInvested) > 0) {
                        prevPeriodicReal = ((pRow.totalRealAmount / (ppRow.totalRealAmount + pInvested)) - 1) * 100;
                      }
                    }
                    
                    const isRealFalling = prevRow && idx > 0 ? periodicReal < prevPeriodicReal : false;
                    const isInflationWorsening = idx > 1 && periodicImpact < -0.5;
                    const showRed = periodicReal < 0 || isRealFalling;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 contrast:hover:bg-slate-700/50 transition-colors group dark:bg-slate-800 ">
                        <td className="px-2 py-2 sm:px-6 sm:py-4 border-r border-slate-50 dark:border-slate-800 ">
                          <span className="font-mono text-[10px] sm:text-sm text-muted-foreground ">
                            <ValueDisplay 
                              value={row.month === 0 ? 'Início' : (tablePeriod === 'years' && row.month % 12 === 0 ? `${row.month / 12}º ano` : `${row.month}º mês`)}
                              isHidden={isFieldHidden('period')}
                              onToggle={() => toggleTableField(idx, 'period')}
                            />
                          </span>
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 border-r border-slate-50 dark:border-slate-800 ">
                          <span className="text-[10px] sm:text-sm font-medium text-slate-600 dark:text-slate-400 ">
                            <ValueDisplay value={row.totalInvested} isHidden={isFieldHidden('invested')} onToggle={() => toggleTableField(idx, 'invested')} />
                          </span>
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 text-center bg-emerald-50/30 dark:bg-emerald-900/20 ">
                          <span className="text-[10px] sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 ">
                            <ValueDisplay value={row.totalInterest} isHidden={isFieldHidden('interest')} onToggle={() => toggleTableField(idx, 'interest')} />
                          </span>
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 text-center border-r border-slate-50 dark:border-slate-800  bg-emerald-50/30 dark:bg-emerald-900/20 ">
                          <span className="text-[10px] sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 ">
                            <ValueDisplay value={row.totalAmount} isHidden={isFieldHidden('total')} onToggle={() => toggleTableField(idx, 'total')} />
                          </span>
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 text-center bg-blue-50/10 dark:bg-blue-900/10">
                          <span className="text-[10px] sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 ">
                            {row.month === 0 ? '-' : (
                              <ValueDisplay 
                                value={`+${(isNaN(periodicNominal) ? 0 : periodicNominal).toFixed(2)}%`} 
                                isHidden={isFieldHidden('nominal')} 
                                onToggle={() => toggleTableField(idx, 'nominal')} 
                              />
                            )}
                          </span>
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 text-center bg-blue-50/10 dark:bg-blue-900/10">
                          <span className={`text-[10px] sm:text-sm font-bold ${showRed ? 'text-red-600 dark:text-red-400 ' : 'text-emerald-600 dark:text-emerald-400 '}`}>
                            {row.month === 0 ? '-' : (
                              <ValueDisplay 
                                value={`+${(isNaN(periodicReal) ? 0 : periodicReal).toFixed(2)}%`} 
                                isHidden={isFieldHidden('real')} 
                                onToggle={() => toggleTableField(idx, 'real')} 
                              />
                            )}
                          </span>
                        </td>
                        <td className="px-2 py-2 sm:px-6 sm:py-4 text-center bg-blue-50/10 dark:bg-blue-900/10">
                          <span className={`text-[10px] sm:text-sm font-medium ${periodicImpact < -0.5 || isInflationWorsening ? 'text-red-500 dark:text-red-400 ' : 'text-muted-foreground'}`}>
                            {row.month === 0 ? '-' : (
                              <ValueDisplay 
                                value={`${(isNaN(periodicImpact) ? 0 : periodicImpact).toFixed(2)}%`} 
                                isHidden={isFieldHidden('impact')} 
                                onToggle={() => toggleTableField(idx, 'impact')} 
                              />
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
