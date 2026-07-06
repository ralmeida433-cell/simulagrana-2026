import React, { useState, useMemo } from 'react';
import { parseISO, addYears, differenceInYears } from 'date-fns';
import { FinanceData } from '../../services/financeService';
import { TrendingUp, Calendar, DollarSign, Percent, Info, ShieldCheck, ArrowRight, Wallet, Eye, EyeOff, Table, ChevronDown, ChevronUp, Cake } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { formatCurrency } from '../../lib/utils';

interface Props {
  financeData: FinanceData;
  userBirthdate: string | null;
}

type AssetType = 
  | 'TESOURO_SELIC' | 'TESOURO_IPCA' | 'TESOURO_IPCA_SEMESTRAL' | 'TESOURO_PREFIXADO' | 'TESOURO_PREFIXADO_SEMESTRAL'
  | 'DEBENTURES' | 'CRI' | 'CRA'
  | 'FUNDO_DI' | 'FUNDO_RENDA_FIXA';

export default function TesouroDiretoCalculator({ financeData, userBirthdate }: Props) {
  const [assetType, setAssetType] = useState<AssetType>('TESOURO_SELIC');
  const [investmentStr, setInvestmentStr] = useState<string>('10000');
  const [monthlyContributionStr, setMonthlyContributionStr] = useState<string>('500');
  const [yearsStr, setYearsStr] = useState<string>('5');
  const [rateStr, setRateStr] = useState<string>('0.15'); // Default rate for Selic + 0.15%
  const [showValues, setShowValues] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [visibleRows, setVisibleRows] = useState<Set<number>>(new Set());
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [tablePeriod, setTablePeriod] = useState<'years' | 'months'>('years');

  const handleAssetChange = (newType: AssetType) => {
    setAssetType(newType);
    switch (newType) {
      case 'TESOURO_SELIC': setRateStr('0.15'); break;
      case 'TESOURO_IPCA': 
      case 'TESOURO_IPCA_SEMESTRAL': 
      case 'DEBENTURES':
      case 'CRI':
      case 'CRA':
        setRateStr('6.0'); break;
      case 'TESOURO_PREFIXADO': 
      case 'TESOURO_PREFIXADO_SEMESTRAL': 
        setRateStr('11.0'); break;
      case 'FUNDO_DI':
      case 'FUNDO_RENDA_FIXA':
        setRateStr('100'); break;
    }
  };

  const getRateLabel = () => {
    switch (assetType) {
      case 'TESOURO_SELIC': return 'Taxa Adicional (Selic + % ao ano)';
      case 'TESOURO_IPCA': 
      case 'TESOURO_IPCA_SEMESTRAL': 
      case 'DEBENTURES':
      case 'CRI':
      case 'CRA':
        return 'Taxa Fixa (IPCA + % ao ano)';
      case 'TESOURO_PREFIXADO': 
      case 'TESOURO_PREFIXADO_SEMESTRAL': 
        return 'Taxa Anual (%)';
      case 'FUNDO_DI':
      case 'FUNDO_RENDA_FIXA':
        return 'Taxa (% do CDI)';
    }
  };

  const results = useMemo(() => {
    const investment = Number(investmentStr) || 0;
    const monthlyContribution = Number(monthlyContributionStr) || 0;
    const years = Number(yearsStr) || 0;
    const rate = Number(rateStr) || 0;

    const selic = financeData.selic / 100;
    const ipca = financeData.ipca / 100;
    const cdi = Math.max(0, selic - 0.001);

    let annualRate = 0;
    let isTaxFree = false;
    let hasSemiannualCoupon = false;

    switch (assetType) {
      case 'TESOURO_SELIC':
        annualRate = selic + (rate / 100);
        break;
      case 'TESOURO_IPCA':
      case 'TESOURO_IPCA_SEMESTRAL':
      case 'DEBENTURES':
      case 'CRI':
      case 'CRA':
        annualRate = ipca + (rate / 100);
        if (assetType === 'TESOURO_IPCA_SEMESTRAL') hasSemiannualCoupon = true;
        if (assetType === 'CRI' || assetType === 'CRA') isTaxFree = true;
        break;
      case 'TESOURO_PREFIXADO':
      case 'TESOURO_PREFIXADO_SEMESTRAL':
        annualRate = rate / 100;
        if (assetType === 'TESOURO_PREFIXADO_SEMESTRAL') hasSemiannualCoupon = true;
        break;
      case 'FUNDO_DI':
      case 'FUNDO_RENDA_FIXA':
        annualRate = cdi * (rate / 100);
        break;
    }

    const months = years * 12;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

    let balance = investment;
    let totalInvested = investment;
    let totalCouponsNet = 0;
    let totalCouponsGross = 0;
    let totalIrPaid = 0;

    const chartData = [];
    
    chartData.push({
      month: 0,
      investido: investment,
      bruto: investment,
      liquido: investment,
    });

    for (let m = 1; m <= months; m++) {
      balance += monthlyContribution;
      totalInvested += monthlyContribution;

      const interest = balance * monthlyRate;
      balance += interest;

      if (hasSemiannualCoupon && m % 6 === 0) {
        // Approximate coupon as the interest generated in the last 6 months
        const couponGross = balance - totalInvested;
        
        const days = m * 30;
        let irRate = 0;
        if (!isTaxFree) {
          if (days <= 180) irRate = 0.225;
          else if (days <= 360) irRate = 0.20;
          else if (days <= 720) irRate = 0.175;
          else irRate = 0.15;
        }
        
        const ir = couponGross * irRate;
        const couponNet = couponGross - ir;
        
        totalCouponsGross += couponGross;
        totalCouponsNet += couponNet;
        totalIrPaid += ir;
        
        balance -= couponGross;
      }

      // Calculate current net for the chart
      const currentGrossProfit = balance - totalInvested;
      let currentIrRate = 0;
      const currentDays = m * 30;
      if (!isTaxFree) {
        if (currentDays <= 180) currentIrRate = 0.225;
        else if (currentDays <= 360) currentIrRate = 0.20;
        else if (currentDays <= 720) currentIrRate = 0.175;
        else currentIrRate = 0.15;
      }
      const currentIr = currentGrossProfit * currentIrRate;
      const currentNet = balance - currentIr;

      chartData.push({
        month: m,
        investido: Math.round(totalInvested),
        bruto: Math.round(balance + totalCouponsGross),
        ir: Math.round(currentIr + totalIrPaid),
        rendimento: Math.round(currentGrossProfit + totalCouponsGross),
        liquido: Math.round(currentNet + totalCouponsNet),
      });
    }

    const finalGrossProfit = balance - totalInvested;
    let finalIrRate = 0;
    const totalDays = months * 30;
    if (!isTaxFree) {
      if (totalDays <= 180) finalIrRate = 0.225;
      else if (totalDays <= 360) finalIrRate = 0.20;
      else if (totalDays <= 720) finalIrRate = 0.175;
      else finalIrRate = 0.15;
    }

    const finalIr = finalGrossProfit * finalIrRate;
    const finalNetBalance = balance - finalIr;

    const totalNet = finalNetBalance + totalCouponsNet;
    const totalGross = balance + totalCouponsGross;
    const totalIr = finalIr + totalIrPaid;
    const totalProfitNet = totalNet - totalInvested;

    // Real Gain (Inflation Adjusted)
    const accumulatedInflation = Math.pow(1 + ipca, years) - 1;
    const realNetValue = totalNet / (1 + accumulatedInflation);
    const realProfit = realNetValue - totalInvested;

    return {
      totalInvested,
      totalGross,
      totalNet,
      totalIr,
      totalProfitNet,
      totalCouponsNet,
      totalCouponsGross,
      realNetValue,
      realProfit,
      accumulatedInflation,
      chartData,
      isTaxFree,
      hasSemiannualCoupon,
      annualRate
    };
  }, [assetType, investmentStr, monthlyContributionStr, yearsStr, rateStr, financeData]);

  const projectedAge = useMemo(() => {
    if (!userBirthdate) return null;
    try {
      const birthDate = parseISO(userBirthdate);
      const years = Number(yearsStr) || 0;
      const targetDate = addYears(new Date(), years);
      return differenceInYears(targetDate, birthDate);
    } catch (e) {
      return null;
    }
  }, [userBirthdate, yearsStr]);

  const tableData = useMemo(() => {
    if (tablePeriod === 'months') return results.chartData;
    return results.chartData.filter(row => row.month === 0 || row.month % 12 === 0 || row.month === results.chartData[results.chartData.length - 1].month);
  }, [results.chartData, tablePeriod]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-600 w-6 h-6 sm:w-8 sm:h-8" /> 
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight dark:text-slate-100 truncate">
            Renda Fixa
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPresentationMode(!presentationMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
              presentationMode 
                ? 'bg-emerald-600 text-white shadow-sm dark:shadow-emerald-900/20 ' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700   contrast:hover:bg-slate-600'
            }`}
          >
            Apresentação
          </button>
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800 contrast:hover:bg-slate-700 transition-colors dark:text-slate-400 "
            title={showValues ? "Ocultar valores" : "Mostrar valores"}
          >
            {showValues ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-5 dark:bg-slate-900 dark:border-slate-800">
            <div>
              <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Investimento</label>
              <select 
                value={assetType} 
                onChange={(e) => handleAssetChange(e.target.value as AssetType)} 
                className="w-full p-2 sm:p-2.5 border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs sm:text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              >
                <optgroup label="TESOURO DIRETO">
                  <option value="TESOURO_SELIC">Tesouro Selic</option>
                  <option value="TESOURO_IPCA">Tesouro IPCA+</option>
                  <option value="TESOURO_IPCA_SEMESTRAL">Tesouro IPCA+ com Juros Semestrais</option>
                  <option value="TESOURO_PREFIXADO">Tesouro Prefixado</option>
                  <option value="TESOURO_PREFIXADO_SEMESTRAL">Tesouro Prefixado com Juros Semestrais</option>
                </optgroup>
                <optgroup label="MERCADO DE CAPITAIS">
                  <option value="DEBENTURES">Debêntures</option>
                  <option value="CRI">CRI</option>
                  <option value="CRA">CRA</option>
                </optgroup>
                <optgroup label="FUNDOS">
                  <option value="FUNDO_DI">Fundo DI</option>
                  <option value="FUNDO_RENDA_FIXA">Fundo de Renda Fixa</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5 dark:text-slate-300">{getRateLabel()}</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  value={rateStr} 
                  onChange={(e) => setRateStr(e.target.value)} 
                  className="w-full pl-3 pr-8 sm:pl-4 sm:pr-10 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-slate-50 text-sm sm:text-base dark:border-slate-800 dark:bg-slate-800" 
                />
                <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs sm:text-sm">%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5 dark:text-slate-300">Valor Inicial</label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs sm:text-sm">R$</span>
                  <input 
                    type="number" 
                    value={investmentStr} 
                    onChange={(e) => setInvestmentStr(e.target.value)} 
                    className="w-full pl-8 pr-3 sm:pl-10 sm:pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-slate-50 text-sm sm:text-base dark:border-slate-800 dark:bg-slate-800" 
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5 dark:text-slate-300">Aporte Mensal</label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs sm:text-sm">R$</span>
                  <input 
                    type="number" 
                    value={monthlyContributionStr} 
                    onChange={(e) => setMonthlyContributionStr(e.target.value)} 
                    className="w-full pl-8 pr-3 sm:pl-10 sm:pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-slate-50 text-sm sm:text-base dark:border-slate-800 dark:bg-slate-800" 
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5 dark:text-slate-300">Prazo (Anos)</label>
                <input 
                  type="number" 
                  value={yearsStr} 
                  onChange={(e) => setYearsStr(e.target.value)} 
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-slate-50 text-sm sm:text-base dark:border-slate-800 dark:bg-slate-800" 
                />
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-indigo-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-indigo-100">
            <h4 className="text-xs sm:text-sm font-bold text-indigo-900 mb-2 flex items-center gap-1.5 sm:gap-2">
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Detalhes do Título
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-sm text-indigo-800/80">
              <li className="flex justify-between">
                <span>Imposto de Renda:</span>
                <span className="font-semibold">{results.isTaxFree ? 'Isento' : 'Tabela Regressiva'}</span>
              </li>
              <li className="flex justify-between">
                <span>Pagamento de Juros:</span>
                <span className="font-semibold">{results.hasSemiannualCoupon ? 'Semestral (Cupons)' : 'No Vencimento'}</span>
              </li>
              <li className="flex justify-between">
                <span>Rentabilidade Anual Estimada:</span>
                <span className="font-semibold">{(results.annualRate * 100).toFixed(2)}% a.a.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results & Charts */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm group relative dark:bg-slate-900 dark:border-slate-800">
              <p className="text-[10px] sm:text-sm font-medium text-slate-500 mb-1">Total Investido</p>
              <div className="flex items-center justify-between">
                <p className="text-base sm:text-2xl font-bold text-foreground truncate">{renderValue(results.totalInvested, true, '', 'invested')}</p>
                <button onClick={() => toggleCard('invested')} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 contrast:hover:bg-slate-700 rounded transition-all text-slate-400">
                  {revealedCards.has('invested') ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm group relative dark:bg-slate-900 dark:border-slate-800">
              <p className="text-[10px] sm:text-sm font-medium text-slate-500 mb-1">Lucro Líquido</p>
              <div className="flex items-center justify-between">
                <p className="text-base sm:text-2xl font-bold text-emerald-600 truncate">+{renderValue(results.totalProfitNet, true, '', 'profit')}</p>
                <button onClick={() => toggleCard('profit')} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 contrast:hover:bg-slate-700 rounded transition-all text-slate-400">
                  {revealedCards.has('profit') ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              {!results.isTaxFree && (
                <p className="text-[8px] sm:text-xs text-slate-400 mt-1 truncate">Já descontado {renderValue(results.totalIr, true, '', 'ir')} de IR</p>
              )}
            </div>
            <div className="bg-emerald-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-emerald-200 shadow-sm group relative col-span-2 md:col-span-1">
              <p className="text-[10px] sm:text-sm font-medium text-emerald-700 mb-1">Valor Final Líquido</p>
              <div className="flex items-center justify-between">
                <p className="text-xl sm:text-3xl font-bold text-emerald-900 truncate">{renderValue(results.totalNet, true, '', 'total')}</p>
                <button onClick={() => toggleCard('total')} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-emerald-100 rounded transition-all text-emerald-600">
                  {revealedCards.has('total') ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              {results.hasSemiannualCoupon && (
                <p className="text-[8px] sm:text-xs text-emerald-600 mt-1 truncate">Inclui {renderValue(results.totalCouponsNet, true, '', 'coupons')} em cupons</p>
              )}
            </div>
            {projectedAge !== null && (
              <div className="bg-indigo-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-indigo-200 shadow-sm flex items-center gap-3 sm:gap-4 dark:bg-indigo-900/20 dark:border-indigo-800/50 col-span-2 md:col-span-3">
                <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg sm:rounded-xl dark:bg-indigo-800 shrink-0">
                  <Cake className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-sm font-medium text-indigo-700 dark:text-indigo-300">Sua idade ao final</p>
                  <p className="text-base sm:text-2xl font-bold text-indigo-900 dark:text-indigo-100">{projectedAge} anos</p>
                </div>
              </div>
            )}
            <div className="bg-blue-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm group relative col-span-2 md:col-span-3">
              <p className="text-[10px] sm:text-sm font-medium text-blue-700 mb-1">Rendimento Mensal Estimado (Pós-Vencimento)</p>
              <div className="flex items-center justify-between">
                <p className="text-lg sm:text-2xl font-bold text-blue-900 truncate">{renderValue(results.totalNet * (Math.pow(1 + results.annualRate, 1/12) - 1), true, '', 'monthlyYield')}</p>
                <button onClick={() => toggleCard('monthlyYield')} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-all text-blue-600">
                  {revealedCards.has('monthlyYield') ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              <p className="text-[8px] sm:text-xs text-blue-600 mt-1">Quanto o montante final renderia por mês na mesma taxa</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm h-[300px] sm:h-[400px] flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6 shrink-0 dark:text-slate-100">Evolução do Investimento</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLiquido" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(val) => `${Math.floor(val / 12)}a`}
                    stroke="#94a3b8"
                    fontSize={10}
                    minTickGap={20}
                  />
                  <YAxis 
                    tickFormatter={(val) => `R$ ${val / 1000}k`}
                    stroke="#94a3b8"
                    fontSize={10}
                    width={50}
                  />
                  <Tooltip 
                    formatter={(value: number) => renderValue(value)}
                    labelFormatter={(label) => `Mês ${label}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="liquido" 
                    name="Saldo Líquido" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorLiquido)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="investido" 
                    name="Total Investido" 
                    stroke="#94a3b8" 
                    strokeWidth={1.5}
                    fillOpacity={0} 
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Evolution Table - Spans full width */}
        <div className="lg:col-span-12">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-muted/50 dark:border-slate-800 dark:bg-slate-800">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                  <Table className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Tabela de Evolução Detalhada</h3>
                  <p className="text-[10px] sm:text-sm text-slate-500">Visualize o crescimento mês a mês ou ano a ano</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase hidden sm:inline">Modo Apresentação</span>
                  <button 
                    onClick={() => setPresentationMode(!presentationMode)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${presentationMode ? 'bg-emerald-600 text-white shadow-sm dark:shadow-emerald-900/20 ' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 contrast:hover:text-slate-300'}`}
                    title={presentationMode ? "Desativar Modo Apresentação" : "Ativar Modo Apresentação"}
                  >
                    {presentationMode ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
                <div className="w-px h-5 sm:h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg">
                  <button
                    onClick={() => setTablePeriod('months')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${tablePeriod === 'months' ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200'}`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setTablePeriod('years')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${tablePeriod === 'years' ? 'bg-white dark:bg-slate-700 text-foreground shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200'}`}
                  >
                    Anual
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 sm:p-6">
              <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-border">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border dark:bg-slate-800">
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Período</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Investido</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Bruto</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">IR</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Líquido</th>
                      {presentationMode && <th className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Ação</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tableData.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 contrast:hover:bg-slate-700/50 transition-colors dark:bg-slate-800">
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-foreground">
                          {row.month === 0 ? 'Início' : tablePeriod === 'years' ? `${row.month / 12}º ano` : `${row.month}º mês`}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{renderTableCell(row.investido, row.month)}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{renderTableCell(row.bruto, row.month, 'text-indigo-600 font-medium')}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{renderTableCell(row.ir, row.month, 'text-rose-500')}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold">{renderTableCell(row.liquido, row.month, 'text-emerald-600')}</td>
                        {presentationMode && (
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                            <button
                              onClick={() => toggleRow(row.month)}
                              className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                                visibleRows.has(row.month) ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                              }`}
                            >
                              {visibleRows.has(row.month) ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Real Gain (Inflation) - Spans full width */}
        <div className="lg:col-span-12">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 sm:p-6 md:p-8 rounded-xl md:rounded-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 dark:bg-slate-900 "></div>
            
            <div className="relative z-10">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                Simulação com Inflação (Ganho Real)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <div>
                  <p className="text-slate-400 text-[10px] sm:text-sm mb-4 leading-relaxed">
                    A inflação corrói o poder de compra do seu dinheiro. 
                    Considerando a inflação de <span className="text-white font-bold">{(financeData.ipca).toFixed(2)}% ao ano</span>, 
                    este seria o valor real do seu investimento:
                  </p>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-white/10">
                      <span className="text-slate-400 text-xs sm:text-base">Poder de Compra (Real)</span>
                      <span className="text-base sm:text-xl font-bold text-white">{formatCurrency(results.realNetValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs sm:text-base">Lucro Real (Acima da Inflação)</span>
                      <span className="text-base sm:text-xl font-bold text-emerald-400">+{formatCurrency(results.realProfit)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 p-4 sm:p-6 rounded-xl border border-white/5 flex flex-col justify-center">
                  <p className="text-[10px] sm:text-sm text-slate-400 mb-1 sm:mb-2 text-center">Inflação Acumulada no Período</p>
                  <p className="text-2xl sm:text-4xl font-black text-center text-amber-400 mb-1 sm:mb-2">
                    {(results.accumulatedInflation * 100).toFixed(1)}%
                  </p>
                  <p className="text-[8px] sm:text-xs text-slate-500 text-center">
                    O que custa R$ 1.000 hoje, custará aprox. {formatCurrency(1000 * (1 + results.accumulatedInflation))} no final.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
