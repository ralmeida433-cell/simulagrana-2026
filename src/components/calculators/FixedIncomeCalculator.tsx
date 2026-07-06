import React, { useState, useMemo } from 'react';
import { parseISO, addMonths, differenceInYears } from 'date-fns';
import { FinanceData } from '../../services/financeService';
import { DollarSign, TrendingUp, Calendar, Info, BarChart3, AlertCircle, Scale, Eye, EyeOff, Table, ChevronDown, ChevronUp, RotateCcw, Cake } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  financeData: FinanceData;
  userBirthdate: string | null;
}

export default function FixedIncomeCalculator({ financeData, userBirthdate }: Props) {
  const [showValues, setShowValues] = useState(true);
  const [showIrTable, setShowIrTable] = useState(false);
  const [tablePeriod, setTablePeriod] = useState<'years' | 'months'>('years');
  const [presentationMode, setPresentationMode] = useState(false);
  const [visibleRows, setVisibleRows] = useState<Set<number>>(new Set());
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [investmentStr, setInvestmentStr] = useState<string>('0');
  const [monthlyContributionStr, setMonthlyContributionStr] = useState<string>('0');
  const [yearsStr, setYearsStr] = useState<string>('0');
  const [withdrawalMonthsStr, setWithdrawalMonthsStr] = useState<string>(''); // Empty means end of term
  const [type, setType] = useState<'CDB' | 'LCI' | 'LCA' | 'COMPARE'>('CDB');
  
  const [rateStr, setRateStr] = useState<string>('0'); // % of CDI for single
  const [rateCdbStr, setRateCdbStr] = useState<string>('0');
  const [rateLciStr, setRateLciStr] = useState<string>('0');
  const [rateLcaStr, setRateLcaStr] = useState<string>('0');

  const cdi = Math.max(0, financeData.selic - 0.1); // CDI is usually Selic - 0.1%

  const calculateForType = (
    inv: number, 
    monthly: number, 
    ratePct: number, 
    totalMonths: number, 
    withdrawMonths: number, 
    invType: 'CDB' | 'LCI' | 'LCA'
  ) => {
    const annualRate = (cdi * (ratePct / 100)) / 100;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    
    const monthsToCalc = withdrawMonths > 0 ? Math.min(withdrawMonths, totalMonths) : totalMonths;

    let finalValue = inv * Math.pow(1 + monthlyRate, monthsToCalc);
    for (let i = 1; i <= monthsToCalc; i++) {
      finalValue += monthly * Math.pow(1 + monthlyRate, monthsToCalc - i);
    }

    const totalInvested = inv + (monthly * monthsToCalc);
    const grossProfit = finalValue - totalInvested;
    
    // Official IR calculation (Tabela Regressiva)
    let ir = 0;
    let irRate = 0;
    if (invType === 'CDB') {
      const days = monthsToCalc * 30; // Approximation
      irRate = 0.225;
      if (days > 720) irRate = 0.15;
      else if (days > 360) irRate = 0.175;
      else if (days > 180) irRate = 0.20;
      
      ir = grossProfit * irRate;
    }

    const netProfit = grossProfit - ir;
    const finalNetValue = totalInvested + netProfit;

    // Generate chart data
    const chartData = [];
    let currentVal = inv;
    let currentInvested = inv;
    
    for (let m = 0; m <= monthsToCalc; m++) {
      if (m > 0) {
        currentVal = currentVal * (1 + monthlyRate) + monthly;
        currentInvested += monthly;
      }
      
      let currentGrossProfit = currentVal - currentInvested;
      let currentIr = 0;
      if (invType === 'CDB') {
        const currentDays = m * 30;
        let currentIrRate = 0.225;
        if (currentDays > 720) currentIrRate = 0.15;
        else if (currentDays > 360) currentIrRate = 0.175;
        else if (currentDays > 180) currentIrRate = 0.20;
        currentIr = currentGrossProfit * currentIrRate;
      }
      
      chartData.push({
        month: m,
        investido: currentInvested,
        bruto: currentVal,
        ir: currentIr,
        rendimento: currentGrossProfit,
        liquido: currentVal - currentIr
      });
    }

    return { 
      finalValue, 
      grossProfit, 
      ir, 
      irRate,
      netProfit, 
      finalNetValue, 
      totalInvested, 
      monthsToCalc,
      chartData,
      monthlyRate
    };
  };

  const results = useMemo(() => {
    const inv = Number(investmentStr) || 0;
    const monthly = Number(monthlyContributionStr) || 0;
    const totalMonths = (Number(yearsStr) || 0) * 12;
    const withdrawMonths = Number(withdrawalMonthsStr) || 0;

    const cdbRate = type === 'COMPARE' ? Number(rateCdbStr) || 0 : type === 'CDB' ? Number(rateStr) || 0 : Number(rateCdbStr) || 0;
    const lciRate = type === 'COMPARE' ? Number(rateLciStr) || 0 : type === 'LCI' ? Number(rateStr) || 0 : Number(rateLciStr) || 0;
    const lcaRate = type === 'COMPARE' ? Number(rateLcaStr) || 0 : type === 'LCA' ? Number(rateStr) || 0 : Number(rateLcaStr) || 0;

    const cdbResult = calculateForType(inv, monthly, cdbRate, totalMonths, withdrawMonths, 'CDB');
    const lciResult = calculateForType(inv, monthly, lciRate, totalMonths, withdrawMonths, 'LCI');
    const lcaResult = calculateForType(inv, monthly, lcaRate, totalMonths, withdrawMonths, 'LCA');

    const mergedChartData = cdbResult.chartData.map((row, i) => ({
      month: row.month,
      investido: row.investido,
      cdbBruto: row.bruto,
      cdbIr: row.ir,
      cdbRendimento: row.rendimento,
      cdbLiquido: row.liquido,
      lciBruto: lciResult.chartData[i].bruto,
      lciIr: lciResult.chartData[i].ir,
      lciRendimento: lciResult.chartData[i].rendimento,
      lciLiquido: lciResult.chartData[i].liquido,
      lcaBruto: lcaResult.chartData[i].bruto,
      lcaIr: lcaResult.chartData[i].ir,
      lcaRendimento: lcaResult.chartData[i].rendimento,
      lcaLiquido: lcaResult.chartData[i].liquido,
    }));

    const isCompare = type === 'COMPARE';
    
    let single = null;
    if (!isCompare) {
      single = type === 'CDB' ? cdbResult : type === 'LCI' ? lciResult : lcaResult;
    }

    const compareCards = [
      { title: 'CDB', data: cdbResult, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
      { title: 'LCI', data: lciResult, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
      { title: 'LCA', data: lcaResult, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' }
    ].sort((a, b) => b.data.finalNetValue - a.data.finalNetValue);

    return {
      isCompare,
      single,
      compareCards,
      mergedChartData,
      monthsToCalc: cdbResult.monthsToCalc
    };
  }, [investmentStr, monthlyContributionStr, rateStr, rateCdbStr, rateLciStr, rateLcaStr, yearsStr, withdrawalMonthsStr, type, cdi]);

  const projectedAge = useMemo(() => {
    if (!userBirthdate || results.monthsToCalc <= 0) return null;
    try {
      const birthDate = parseISO(userBirthdate);
      const targetDate = addMonths(new Date(), results.monthsToCalc);
      return differenceInYears(targetDate, birthDate);
    } catch (e) {
      return null;
    }
  }, [userBirthdate, results.monthsToCalc]);

  const tableData = useMemo(() => {
    if (tablePeriod === 'months') return results.mergedChartData;
    return results.mergedChartData.filter(row => row.month === 0 || row.month % 12 === 0 || row.month === results.mergedChartData[results.mergedChartData.length - 1].month);
  }, [results.mergedChartData, tablePeriod]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const renderValue = (val: number, isCurrency = true, suffix = '', cardId?: string) => {
    const isVisible = showValues || (cardId && revealedCards.has(cardId));
    if (!isVisible) return '••••••';
    if (isCurrency) return formatCurrency(val);
    return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
  };

  const toggleCard = (cardId: string) => {
    const newRevealed = new Set(revealedCards);
    if (newRevealed.has(cardId)) newRevealed.delete(cardId);
    else newRevealed.add(cardId);
    setRevealedCards(newRevealed);
  };

  const toggleRow = (month: number) => {
    const newVisible = new Set(visibleRows);
    if (newVisible.has(month)) {
      newVisible.delete(month);
    } else {
      newVisible.add(month);
    }
    setVisibleRows(newVisible);
  };

  const renderTableCell = (val: number, month: number, colorClass: string = 'text-slate-600 dark:text-slate-400 ') => {
    const isRowVisible = !presentationMode || visibleRows.has(month);
    if (!isRowVisible) {
      return <div className="h-6 bg-slate-200/70 dark:bg-slate-700/70  rounded w-20"></div>;
    }
    return <span className={colorClass}>{renderValue(val)}</span>;
  };

  const resetFields = () => {
    setInvestmentStr('0');
    setMonthlyContributionStr('0');
    setYearsStr('0');
    setWithdrawalMonthsStr('');
    setRateStr('0');
    setRateCdbStr('0');
    setRateLciStr('0');
    setRateLcaStr('0');
    setType('CDB');
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900  dark:border-slate-800 ">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100 ">
          <DollarSign className="text-emerald-600" /> Simulador CDB / LCI / LCA
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFields}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 contrast:hover:bg-emerald-500/10 rounded-full transition-colors dark:text-slate-400 "
            title="Limpar campos"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 contrast:hover:bg-slate-700 rounded-full transition-colors dark:text-slate-400 "
            title={showValues ? "Ocultar valores" : "Mostrar valores"}
          >
            {showValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Tipo de Simulação</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as any)} 
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:border-slate-800  dark:bg-slate-800 "
            >
              <option value="CDB">CDB (Com IR)</option>
              <option value="LCI">LCI (Isento de IR)</option>
              <option value="LCA">LCA (Isento de IR)</option>
              <option value="COMPARE">Comparar Todos</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Valor Inicial (R$)</label>
              <input 
                type="number" 
                value={investmentStr} 
                onChange={(e) => setInvestmentStr(e.target.value)} 
                placeholder="Ex: 10000"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:border-slate-800 " 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Aporte Mensal (R$)</label>
              <input 
                type="number" 
                value={monthlyContributionStr} 
                onChange={(e) => setMonthlyContributionStr(e.target.value)} 
                placeholder="Ex: 500"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:border-slate-800 " 
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4 dark:border-slate-800  dark:bg-slate-800 ">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ">Taxas (% do CDI)</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-medium">CDI Atual: {cdi.toFixed(2)}%</span>
            </div>
            
            {type === 'COMPARE' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Taxa CDB</label>
                  <input type="number" value={rateCdbStr} onChange={(e) => setRateCdbStr(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm dark:border-slate-800 " />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Taxa LCI</label>
                    <input type="number" value={rateLciStr} onChange={(e) => setRateLciStr(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm dark:border-slate-800 " />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Taxa LCA</label>
                    <input type="number" value={rateLcaStr} onChange={(e) => setRateLcaStr(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm dark:border-slate-800 " />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Taxa do {type}</label>
                <input type="number" value={rateStr} onChange={(e) => setRateStr(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm dark:border-slate-800 " />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Prazo (Anos)</label>
              <input 
                type="number" 
                value={yearsStr} 
                onChange={(e) => setYearsStr(e.target.value)} 
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:border-slate-800 " 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Resgate em (Meses)</label>
              <input 
                type="number" 
                value={withdrawalMonthsStr} 
                onChange={(e) => setWithdrawalMonthsStr(e.target.value)} 
                placeholder="Opcional"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:border-slate-800 " 
              />
            </div>
          </div>
          
          {Number(withdrawalMonthsStr) > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Simulando resgate antecipado em {withdrawalMonthsStr} meses. O IR será recalculado para este prazo.</p>
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800 ">
            <button 
              onClick={() => setShowIrTable(!showIrTable)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700 contrast:hover:bg-slate-600 transition-colors text-sm font-medium text-slate-700 dark:bg-slate-800  dark:text-slate-300 "
            >
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500" />
                Tabela de Imposto de Renda
              </span>
              {showIrTable ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {showIrTable && (
              <div className="p-4 bg-white text-xs text-slate-600 space-y-3 border-t border-slate-200 dark:bg-slate-900  dark:border-slate-800  dark:text-slate-400 ">
                <p>O Imposto de Renda sobre investimentos de Renda Fixa (como CDB) segue a tabela regressiva. LCI e LCA são isentos.</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-border">
                    <span>Até 180 dias (6 meses)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 ">22,5%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border">
                    <span>De 181 a 360 dias (6 a 12 meses)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 ">20,0%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border">
                    <span>De 361 a 720 dias (12 a 24 meses)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 ">17,5%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Acima de 720 dias (mais de 24 meses)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 ">15,0%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8 space-y-6">
          {!results.isCompare && results.single && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group dark:border-slate-800  dark:bg-slate-800 ">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs text-slate-500">Total Investido</p>
                  {!showValues && (
                    <button onClick={() => toggleCard('totalInvested')} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 ">
                      {revealedCards.has('totalInvested') ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 ">{renderValue(results.single.totalInvested, true, '', 'totalInvested')}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group dark:border-slate-800  dark:bg-slate-800 ">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs text-slate-500">Rendimento Bruto</p>
                  {!showValues && (
                    <button onClick={() => toggleCard('grossProfit')} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 ">
                      {revealedCards.has('grossProfit') ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-lg font-bold text-emerald-600">+{renderValue(results.single.grossProfit, true, '', 'grossProfit')}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group dark:border-slate-800  dark:bg-slate-800 ">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs text-slate-500">
                    IR Pago {results.single.irRate > 0 ? `(${renderValue(results.single.irRate * 100, false, '%', 'ir')})` : '(Isento)'}
                  </p>
                  {!showValues && (
                    <button onClick={() => toggleCard('ir')} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 ">
                      {revealedCards.has('ir') ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-lg font-bold text-red-500">-{renderValue(results.single.ir, true, '', 'ir')}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group dark:border-slate-800  dark:bg-slate-800 ">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs text-slate-500">Taxa Mensal</p>
                  {!showValues && (
                    <button onClick={() => toggleCard('monthlyRate')} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 ">
                      {revealedCards.has('monthlyRate') ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-lg font-bold text-indigo-600">{renderValue(results.single.monthlyRate * 100, false, '% a.m.', 'monthlyRate')}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group dark:border-slate-800  dark:bg-slate-800 ">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs text-slate-500">Média Mensal (Líquida)</p>
                  {!showValues && (
                    <button onClick={() => toggleCard('netProfit')} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 ">
                      {revealedCards.has('netProfit') ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-lg font-bold text-indigo-600">+{renderValue(results.single.netProfit / (results.single.monthsToCalc || 1), true, '', 'netProfit')}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 relative group">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs text-emerald-700">Valor Líquido Final</p>
                  {!showValues && (
                    <button onClick={() => toggleCard('finalNetValue')} className="text-emerald-600/60 hover:text-emerald-700">
                      {revealedCards.has('finalNetValue') ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-xl font-bold text-emerald-700">{renderValue(results.single.finalNetValue, true, '', 'finalNetValue')}</p>
              </div>
              {projectedAge !== null && (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3 dark:bg-indigo-900/20 dark:border-indigo-800/50">
                  <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-800">
                    <Cake className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">Sua idade ao final</p>
                    <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{projectedAge} anos</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {results.isCompare && (
            <div className="space-y-4">
              {projectedAge !== null && (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3 dark:bg-indigo-900/20 dark:border-indigo-800/50">
                  <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-800">
                    <Cake className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">Sua idade ao final do período</p>
                    <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{projectedAge} anos</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {results.compareCards.map((item, index) => {
                const isWinner = index === 0;
                return (
                  <div key={item.title} className={`p-4 rounded-xl border relative ${isWinner ? item.bg + ' ' + item.border : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                    {isWinner && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Vencedor
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <h4 className={`font-bold ${item.color}`}>{item.title}</h4>
                      {!showValues && (
                        <button onClick={() => toggleCard(`compare_${item.title}`)} className={`${item.color} opacity-60 hover:opacity-100`}>
                          {revealedCards.has(`compare_${item.title}`) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bruto:</span>
                        <span className="font-medium">{renderValue(item.data.finalValue, true, '', `compare_${item.title}`)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">IR:</span>
                        <span className="text-red-500 font-medium">-{renderValue(item.data.ir, true, '', `compare_${item.title}`)}</span>
                      </div>
                      <div className="flex justify-between pt-2 mt-2 border-t border-slate-200/50 dark:border-slate-800 ">
                        <span className="text-slate-500">Taxa a.m.:</span>
                        <span className="font-medium">{renderValue(item.data.monthlyRate * 100, false, '%', `compare_${item.title}`)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Média/mês:</span>
                        <span className={`font-medium ${item.color}`}>+{renderValue(item.data.netProfit / (item.data.monthsToCalc || 1), true, '', `compare_${item.title}`)}</span>
                      </div>
                      <div className="flex justify-between pt-2 mt-2 border-t border-slate-200/50 dark:border-slate-800 ">
                        <span className="font-bold text-slate-700 dark:text-slate-300 ">Líquido:</span>
                        <span className={`font-bold ${item.color}`}>{renderValue(item.data.finalNetValue, true, '', `compare_${item.title}`)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 dark:text-slate-200 ">
              <Scale className="w-4 h-4 text-indigo-600" /> Evolução do Investimento
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={results.mergedChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickFormatter={(val) => `${val}m`} stroke="#94a3b8" fontSize={12} />
                  <YAxis tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} stroke="#94a3b8" fontSize={12} width={60} />
                  <Tooltip 
                    formatter={(value: number) => renderValue(value)}
                    labelFormatter={(label) => `Mês ${label}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="investido" name="Valor Investido" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cdbLiquido" name="CDB Líquido" stroke="#4f46e5" strokeWidth={type === 'CDB' || type === 'COMPARE' ? 3 : 2} dot={false} />
                  <Line type="monotone" dataKey="lciLiquido" name="LCI Líquido" stroke="#10b981" strokeWidth={type === 'LCI' || type === 'COMPARE' ? 3 : 2} dot={false} />
                  <Line type="monotone" dataKey="lcaLiquido" name="LCA Líquido" stroke="#d97706" strokeWidth={type === 'LCA' || type === 'COMPARE' ? 3 : 2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl border border-slate-100 shadow-sm overflow-x-auto dark:bg-slate-900  dark:border-slate-800 ">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200 ">
            <Table className="w-5 h-5 text-slate-500" /> Tabela de Evolução Comparativa
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-800  p-1 rounded-lg">
              <button
                onClick={() => setTablePeriod('months')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tablePeriod === 'months' ? 'bg-white dark:bg-slate-700  text-foreground  shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setTablePeriod('years')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tablePeriod === 'years' ? 'bg-white dark:bg-slate-700  text-foreground  shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200'}`}
              >
                Anual
              </button>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700  hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 tracking-wider hidden sm:inline">MODO APRESENTAÇÃO</span>
              <button
                onClick={() => {
                  setPresentationMode(!presentationMode);
                  setVisibleRows(new Set());
                }}
                className={`p-2 rounded-lg transition-colors ${presentationMode ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700  contrast:hover:bg-slate-600'}`}
                title={presentationMode ? "Desativar Modo Apresentação" : "Ativar Modo Apresentação"}
              >
                {presentationMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
                <thead className="text-xs text-slate-500 uppercase border-b border-border">
                  <tr>
                  <th className="px-4 py-4 font-bold border-r border-border" rowSpan={2}>Mês</th>
                  <th className="px-4 py-4 font-bold border-r border-border" rowSpan={2}>Investido</th>
                  <th className="px-4 py-2 font-bold text-center border-b border-r border-border" colSpan={3}>Rendimento Bruto</th>
                  <th className="px-4 py-2 font-bold text-center border-b border-r border-border" colSpan={3}>IR Acumulado</th>
                  <th className="px-4 py-2 font-bold text-center border-b border-border" colSpan={3}>Valor Líquido</th>
                  <th className="px-4 py-4 w-10" rowSpan={2}></th>
                </tr>
                <tr>
                  <th className="px-2 py-2 font-bold text-center">CDB</th>
                  <th className="px-2 py-2 font-bold text-center">LCI</th>
                  <th className="px-2 py-2 font-bold text-center border-r border-border">LCA</th>
                  <th className="px-2 py-2 font-bold text-center">CDB</th>
                  <th className="px-2 py-2 font-bold text-center">LCI</th>
                  <th className="px-2 py-2 font-bold text-center border-r border-border">LCA</th>
                  <th className="px-2 py-2 font-bold text-center">CDB</th>
                  <th className="px-2 py-2 font-bold text-center">LCI</th>
                  <th className="px-2 py-2 font-bold text-center">LCA</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => {
                  const isVisible = !presentationMode || visibleRows.has(row.month);
                  const maxLiquido = Math.max(row.cdbLiquido, row.lciLiquido, row.lcaLiquido);
                  return (
                    <tr key={row.month} className="border-b border-slate-50 dark:border-slate-800  last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 contrast:hover:bg-slate-700/50 group transition-colors dark:bg-slate-800 ">
                      <td className="px-4 py-4 font-medium text-slate-700 border-r border-slate-50 dark:border-slate-800  dark:text-slate-300 ">
                        {row.month === 0 ? 'Início' : (tablePeriod === 'years' && row.month % 12 === 0 ? `${row.month / 12}º ano` : `${row.month}º mês`)}
                      </td>
                      <td className="px-4 py-4 border-r border-slate-50 dark:border-slate-800 ">{renderTableCell(row.investido, row.month, 'text-slate-600 dark:text-slate-400 ')}</td>
                      
                      <td className="px-2 py-4 text-center">{renderTableCell(row.cdbRendimento, row.month, 'text-slate-600 dark:text-slate-400 ')}</td>
                      <td className="px-2 py-4 text-center">{renderTableCell(row.lciRendimento, row.month, 'text-slate-600 dark:text-slate-400 ')}</td>
                      <td className="px-2 py-4 text-center border-r border-slate-50 dark:border-slate-800 ">{renderTableCell(row.lcaRendimento, row.month, 'text-slate-600 dark:text-slate-400 ')}</td>
                      
                      <td className="px-2 py-4 text-center">{renderTableCell(row.cdbIr, row.month, 'text-red-400')}</td>
                      <td className="px-2 py-4 text-center">{renderTableCell(row.lciIr, row.month, 'text-red-400')}</td>
                      <td className="px-2 py-4 text-center border-r border-slate-50 dark:border-slate-800 ">{renderTableCell(row.lcaIr, row.month, 'text-red-400')}</td>
                      
                      <td className="px-2 py-4 text-center">{renderTableCell(row.cdbLiquido, row.month, `text-indigo-600 ${row.cdbLiquido === maxLiquido && row.month > 0 ? 'font-bold' : ''}`)}</td>
                      <td className="px-2 py-4 text-center">{renderTableCell(row.lciLiquido, row.month, `text-emerald-600 ${row.lciLiquido === maxLiquido && row.month > 0 ? 'font-bold' : ''}`)}</td>
                      <td className="px-2 py-4 text-center">{renderTableCell(row.lcaLiquido, row.month, `text-amber-600 ${row.lcaLiquido === maxLiquido && row.month > 0 ? 'font-bold' : ''}`)}</td>
                      
                      <td className="px-4 py-4 text-right">
                        {presentationMode && (
                          <button 
                            onClick={() => toggleRow(row.month)} 
                            className={`transition-opacity ${isVisible ? 'text-slate-400 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-500'}`}
                          >
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
