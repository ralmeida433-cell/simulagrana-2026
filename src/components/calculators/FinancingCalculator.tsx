import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '../../lib/utils';
import { FinanceData } from '../../services/financeService';
import { 
  Building2, 
  ChevronDown, 
  Cake, 
  Table2, 
  TrendingDown, 
  Percent, 
  Info, 
  CheckCircle2, 
  Circle,
  Briefcase,
  TrendingUp,
  Zap,
  BarChart3,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { parseISO, addYears, differenceInYears } from 'date-fns';
import FinancingTableModal from './FinancingTableModal';
import AmortizationGuide from './AmortizationGuide';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface FinancingCalculatorProps {
  financeData: FinanceData;
  userBirthdate?: string | null;
}

interface FinancingRow {
  month: number;
  installment: number;
  amortization: number;
  interest: number;
  extraAmortization: number;
  balance: number;
  inflationCorrectedInstallment: number;
  cumulativePaid: number;
  cumulativeInterest: number;
  percentPaid: number;
  suggestedIncome: number;
}

export default function FinancingCalculator({ financeData, userBirthdate }: FinancingCalculatorProps) {
  const [propertyValue, setPropertyValue] = useState<string | number>('');
  const [downPayment, setDownPayment] = useState<string | number>('');
  const [selectedBank, setSelectedBank] = useState(financeData.mortgageRates[0]);
  const [customRate, setCustomRate] = useState<string | number>(selectedBank.rate);
  
  // Term state
  const [termValue, setTermValue] = useState<string | number>('360');
  const [termType, setTermType] = useState<'MONTHS' | 'YEARS'>('MONTHS');
  
  const [useCustomRate, setUseCustomRate] = useState(false);
  
  // New features state
  const [system, setSystem] = useState<'PRICE' | 'SAC'>('SAC');
  const [extraAmortization, setExtraAmortization] = useState<string | number>('');
  const [extraAmortizationType, setExtraAmortizationType] = useState<'TERM' | 'INSTALLMENT'>('TERM');
  const [showComparison, setShowComparison] = useState(false);
  const [userIncome, setUserIncome] = useState<string | number>('');
  
  // TR State
  const [trRate, setTrRate] = useState<string | number>('1.2'); // 1.2% a.a. is a reasonable default for TR
  
  // INPC State
  const [inflationRate, setInflationRate] = useState<string | number>(financeData.ipca.toFixed(2));
  const [isFetchingINPC, setIsFetchingINPC] = useState(false);
  
  useEffect(() => {
    if (financeData?.ipca) {
      setInflationRate(financeData.ipca.toFixed(2));
    }
  }, [financeData?.ipca]);

  const [showTableModal, setShowTableModal] = useState(false);
  const [showAmortizationGuide, setShowAmortizationGuide] = useState(false);
  const [tableInitialViewMode, setTableInitialViewMode] = useState<'table' | 'chart'>('table');
  
  // Insurance and Fees
  const [insuranceValue, setInsuranceValue] = useState<string | number>('30');
  const [feesValue, setFeesValue] = useState<string | number>('25');
  
  // Visibility state
  const [showValues, setShowValues] = useState(true);
  const [toggledSummary, setToggledSummary] = useState<Set<string>>(new Set());

  const toggleSummary = (id: string) => {
    const next = new Set(toggledSummary);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setToggledSummary(next);
  };

  const toggleGlobalVisibility = () => {
    setShowValues(!showValues);
    setToggledSummary(new Set());
  };

  const ValueDisplay = ({ value, isHidden, onToggle }: { value: string | number, isHidden: boolean, onToggle: () => void }) => (
    <div className="flex items-center gap-1 group/val transition-all inline-flex max-w-full">
      <span className={cn(
        "transition-all duration-300 truncate",
        isHidden ? "blur-[8px] select-none opacity-40 scale-95" : "blur-0 opacity-100 scale-100"
      )}>
        {typeof value === 'number' ? formatCurrency(value) : value}
      </span>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="opacity-0 group-hover/val:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all shrink-0"
      >
        {isHidden ? <Eye className="w-3 h-3 text-slate-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
      </button>
    </div>
  );

  // Installment input for reverse calculation
  const [installmentInput, setInstallmentInput] = useState<string | number>('');
  const [isCalculatingTerm, setIsCalculatingTerm] = useState(false);

  const currentRate = useCustomRate ? Number(customRate) || 0 : selectedBank.rate;

  const simulationData = useMemo(() => {
    const propVal = Number(propertyValue) || 0;
    const down = Number(downPayment) || 0;
    
    // Convert term to months
    const rawTerm = Number(termValue) || 0;
    const m = termType === 'YEARS' ? rawTerm * 12 : rawTerm;
    
    const extra = Number(extraAmortization) || 0;
    const inflation = Number(inflationRate) || 0;
    const tr = Number(trRate) || 0;
    const insurance = Number(insuranceValue) || 0;
    const fees = Number(feesValue) || 0;
    
    const principal = propVal - down;
    const annualRate = currentRate;

    if (principal <= 0 || annualRate <= 0 || m <= 0) {
      return { 
        rows: [],
        summary: null,
        baseSim: { rows: [], summary: null },
        otherSystemSim: { rows: [], summary: null },
        healthScore: 0,
        incomeScenarios: { conservative: 0, ideal: 0, aggressive: 0 },
        realInstallmentFuture: 0,
        totalCost: 0,
        rentVsBuy: { estimatedMonthlyRent: 0, opportunityCostDownPayment: 0, totalRentPaid: 0 }
      };
    }

    const calculateSimulation = (sys: 'SAC' | 'PRICE', extraAmt: number) => {
      let balance = principal;
      // Convert annual rate to monthly (compounded)
      const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
      // TR is usually added linearly or compounded, let's assume linear monthly addition for simplicity or compounded
      const monthlyTr = Math.pow(1 + tr / 100, 1 / 12) - 1;
      const combinedMonthlyRate = monthlyRate + monthlyTr;
      
      const monthlyInflation = Math.pow(1 + inflation / 100, 1 / 12) - 1;
      
      const rows: FinancingRow[] = [];
      let currentMonth = 1;
      let remainingMonths = m;

      // Initial values
      let initialFixedPmt = sys === 'PRICE' 
        ? (balance * combinedMonthlyRate * Math.pow(1 + combinedMonthlyRate, remainingMonths)) / (Math.pow(1 + combinedMonthlyRate, remainingMonths) - 1)
        : 0;
        
      let initialFixedAmortization = sys === 'SAC' ? balance / remainingMonths : 0;
      
      let currentFixedPmt = initialFixedPmt;
      let currentFixedAmortization = initialFixedAmortization;

      let totalPaid = 0;
      let totalInterest = 0;
      let totalInsurance = 0;
      let totalFees = 0;
      let totalExtra = 0;

      while (balance > 0.01 && currentMonth <= 1200) {
        const interest = balance * combinedMonthlyRate;
        let amortization = 0;
        let installment = 0;

        if (sys === 'PRICE') {
          // If reducing installment, we recalculate the fixed payment based on new balance and remaining term
          if (extraAmortizationType === 'INSTALLMENT' && currentMonth > 1 && extraAmt > 0) {
            currentFixedPmt = (balance * combinedMonthlyRate * Math.pow(1 + combinedMonthlyRate, remainingMonths)) / (Math.pow(1 + combinedMonthlyRate, remainingMonths) - 1);
          }
          // If reducing term, we keep the original fixed payment
          installment = currentFixedPmt;
          amortization = installment - interest;
        } else {
          // SAC
          if (extraAmortizationType === 'INSTALLMENT' && currentMonth > 1 && extraAmt > 0) {
            currentFixedAmortization = balance / remainingMonths;
          }
          amortization = currentFixedAmortization;
          installment = amortization + interest;
        }

        // Adjust for final payment
        if (amortization > balance) {
          amortization = balance;
          installment = amortization + interest;
        }

        let actualExtra = 0;
        if (extraAmt > 0) {
          actualExtra = Math.min(extraAmt, balance - amortization);
        }

        balance -= (amortization + actualExtra);
        if (balance < 0) balance = 0;

        const totalInstallment = installment + insurance + fees;
        const realInstallment = totalInstallment / Math.pow(1 + monthlyInflation, currentMonth);

        totalPaid += totalInstallment + actualExtra;
        totalInterest += interest;
        totalInsurance += insurance;
        totalFees += fees;
        totalExtra += actualExtra;

        rows.push({
          month: currentMonth,
          installment: totalInstallment,
          amortization,
          interest,
          extraAmortization: actualExtra,
          balance,
          inflationCorrectedInstallment: realInstallment,
          cumulativePaid: totalPaid,
          cumulativeInterest: totalInterest,
          percentPaid: ((principal - balance) / principal) * 100,
          suggestedIncome: totalInstallment / 0.3
        });

        currentMonth++;
        remainingMonths--;
        
        // Safety break
        if (remainingMonths <= 0 && balance > 0.01 && extraAmt === 0) {
           // This shouldn't happen with correct math unless there's rounding
           break;
        }
        if (remainingMonths <= 0 && balance > 0.01) {
           remainingMonths = 1; // Keep going if balance remains (shouldn't happen in 'INSTALLMENT' mode)
        }
      }

      const summary = {
        loanAmount: principal,
        totalPaid,
        totalInterest,
        totalInterestRatio: (totalInterest / totalPaid) * 100,
        totalInsurance,
        totalFees,
        totalExtra,
        effectiveMonths: rows.length,
        originalMonths: m,
        firstInstallment: rows[0]?.installment || 0,
        lastInstallment: rows[rows.length - 1]?.installment || 0,
        interestRatio: (totalInterest / totalPaid) * 100,
        savings: 0,
        totalCost: totalPaid + down
      };

      return { rows, summary };
    };

    const mainSim = calculateSimulation(system, extra);
    const baseSim = calculateSimulation(system, 0);
    const otherSystemSim = calculateSimulation(system === 'SAC' ? 'PRICE' : 'SAC', extra);

    // Calculate savings
    if (mainSim.summary && baseSim.summary) {
      mainSim.summary.savings = baseSim.summary.totalPaid - mainSim.summary.totalPaid;
    }

    // Health Score & Income Analysis
    const firstPmt = mainSim.summary?.firstInstallment || 0;
    const incomeScenarios = {
      conservative: firstPmt / 0.25,
      ideal: firstPmt / 0.30,
      aggressive: firstPmt / 0.35
    };

    let healthScore = 0;
    if (mainSim.summary) {
      const commitment = userIncome ? (firstPmt / Number(userIncome)) : 0.30;
      const termRisk = m > 360 ? 20 : m > 300 ? 10 : 0;
      const interestRisk = mainSim.summary.interestRatio > 60 ? 30 : mainSim.summary.interestRatio > 40 ? 15 : 0;
      const commitmentRisk = commitment > 0.40 ? 50 : commitment > 0.30 ? 25 : 0;
      healthScore = Math.max(0, 100 - termRisk - interestRisk - commitmentRisk);
    }

    return {
      ...mainSim,
      baseSim,
      otherSystemSim,
      incomeScenarios,
      healthScore,
      realInstallmentFuture: mainSim.rows[Math.min(180, mainSim.rows.length - 1)]?.inflationCorrectedInstallment || 0,
      totalCost: mainSim.summary?.totalCost || 0,
      rentVsBuy: {
        estimatedMonthlyRent: propVal * 0.004, // 0.4% is a common rent yield in Brazil
        opportunityCostDownPayment: down * (financeData.selic / 100),
        totalRentPaid: (propVal * 0.004) * m * 1.5 // Rough estimate with inflation
      }
    };
  }, [propertyValue, downPayment, currentRate, termValue, termType, system, extraAmortization, extraAmortizationType, inflationRate, trRate, insuranceValue, feesValue, userIncome, financeData.selic]);

  // Update installment input when simulation changes, but only if we're not currently typing in it
  useEffect(() => {
    if (simulationData.summary && !isCalculatingTerm) {
      setInstallmentInput(simulationData.summary.firstInstallment.toFixed(2));
    }
  }, [simulationData.summary, isCalculatingTerm]);

  // Reverse calculation: Term from Installment
  const handleInstallmentChange = (value: string) => {
    setInstallmentInput(value);
    const pmt = Number(value);
    const propVal = Number(propertyValue) || 0;
    const down = Number(downPayment) || 0;
    const principal = propVal - down;
    const annualRate = currentRate;
    const monthlyRate = annualRate / 100 / 12;
    const insurance = Number(insuranceValue) || 0;
    const fees = Number(feesValue) || 0;

    if (principal <= 0 || annualRate <= 0 || pmt <= (principal * monthlyRate + insurance + fees)) {
      return;
    }

    setIsCalculatingTerm(true);
    const basePmt = pmt - insurance - fees;

    if (system === 'SAC') {
      // Pmt1 = (Principal / n) + (Principal * i)
      // n = Principal / (Pmt1 - Principal * i)
      const n = principal / (basePmt - principal * monthlyRate);
      if (n > 0 && n <= 1200) {
        setTermValue(Math.round(n).toString());
        setTermType('MONTHS');
      }
    } else {
      // PRICE
      // n = ln(R / (R - 1)) / ln(1+i) where R = Pmt / (Principal * i)
      const R = basePmt / (principal * monthlyRate);
      if (R > 1) {
        const n = Math.log(R / (R - 1)) / Math.log(1 + monthlyRate);
        if (n > 0 && n <= 1200) {
          setTermValue(Math.round(n).toString());
          setTermType('MONTHS');
        }
      }
    }
    
    // Reset flag after a short delay to allow simulationData to update
    setTimeout(() => setIsCalculatingTerm(false), 100);
  };

  const projectedAge = useMemo(() => {
    if (!userBirthdate || !simulationData.summary) return null;
    try {
      const birthDate = parseISO(userBirthdate);
      const targetDate = addYears(new Date(), simulationData.summary.effectiveMonths / 12);
      return differenceInYears(targetDate, birthDate);
    } catch (e) {
      return null;
    }
  }, [userBirthdate, simulationData.summary]);

  return (
    <div className="space-y-3 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24 sm:pb-12 max-w-[100vw] overflow-hidden px-4 sm:px-0">
      {/* Header with Global Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-4 bg-white p-3 sm:p-6 rounded-xl sm:rounded-[32px] border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 bg-indigo-600 rounded-lg sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Building2 className="w-4 h-4 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-2xl font-black text-foreground tracking-tight truncate leading-none">Financiamento</h2>
              <p className="text-[9px] sm:text-xs font-medium text-slate-400 uppercase tracking-widest mt-1 truncate">SAC e PRICE</p>
            </div>
          </div>
          <button 
            onClick={toggleGlobalVisibility}
            className={`p-2 rounded-lg transition-all shrink-0 ml-2 ${!showValues ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:hover:text-slate-300'}`}
            title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
          >
            {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        <div className="lg:col-span-1 space-y-3 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6 dark:text-slate-100 ">Dados do Imóvel</h3>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Valor do Imóvel</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">R$</span>
                <input 
                  type="number" 
                  value={propertyValue}
                  onChange={(e) => setPropertyValue(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:border-slate-800  dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 dark:text-slate-300 ">Entrada</label>
                <span className="text-[9px] sm:text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 sm:px-2 py-0.5 rounded-full dark:bg-indigo-500/10 dark:text-indigo-400">
                  {propertyValue && downPayment ? ((Number(downPayment) / Number(propertyValue)) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">R$</span>
                <input 
                  type="number" 
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:border-slate-800  dark:bg-slate-800 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Prazo</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden dark:bg-slate-800 dark:border-slate-700   focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                  <input 
                    type="number" 
                    value={termValue}
                    onChange={(e) => {
                      setTermValue(e.target.value);
                      setIsCalculatingTerm(false);
                    }}
                    placeholder={termType === 'MONTHS' ? "360" : "30"}
                    className="w-full px-2 sm:px-4 py-1.5 sm:py-2 bg-transparent outline-none dark:text-slate-100 min-w-0 text-xs sm:text-sm"
                  />
                  <select
                    value={termType}
                    onChange={(e) => {
                      setTermType(e.target.value as 'MONTHS' | 'YEARS');
                      setIsCalculatingTerm(false);
                    }}
                    className="bg-transparent border-l border-slate-200 px-1 sm:px-2 py-1.5 sm:py-2 text-[10px] sm:text-sm font-medium text-slate-600 outline-none cursor-pointer dark:border-slate-700 dark:text-slate-300 w-full"
                  >
                    <option value="MONTHS">Meses</option>
                    <option value="YEARS">Anos</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Valor da Parcela</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">R$</span>
                  <input 
                    type="number" 
                    value={installmentInput}
                    onChange={(e) => handleInstallmentChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:border-slate-800  dark:bg-slate-800 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Seguros <span className="hidden sm:inline">(Mensal)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">R$</span>
                  <input 
                    type="number" 
                    value={insuranceValue}
                    onChange={(e) => setInsuranceValue(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:border-slate-800  dark:bg-slate-800 text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Taxas <span className="hidden sm:inline">(Mensal)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">R$</span>
                  <input 
                    type="number" 
                    value={feesValue}
                    onChange={(e) => setFeesValue(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:border-slate-800  dark:bg-slate-800 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="block text-[10px] sm:text-sm font-medium text-slate-700 dark:text-slate-300 ">Sistema</label>
                  <div className="relative group/tooltip hidden sm:block">
                    <Info className="w-3 h-3 text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all shadow-xl z-50 pointer-events-none">
                      <p className="font-bold mb-1">SAC (Amortização Constante)</p>
                      <p className="mb-2 text-slate-300">Parcelas diminuem com o tempo.</p>
                      <p className="font-bold mb-1">PRICE (Tabela Price)</p>
                      <p className="text-slate-300">Todas as parcelas com mesmo valor.</p>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <select 
                    value={system}
                    onChange={(e) => setSystem(e.target.value as 'PRICE' | 'SAC')}
                    className="w-full appearance-none px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer text-[10px] sm:text-sm font-medium text-slate-700 pr-6 sm:pr-8 dark:bg-slate-800  dark:border-slate-800  dark:text-slate-300 "
                  >
                    <option value="SAC">SAC</option>
                    <option value="PRICE">PRICE</option>
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5 dark:text-slate-300 ">
                  <Building2 className="w-3 h-3 text-slate-400 hidden sm:block" />
                  Banco (Taxas 26)
                </label>
                <div className="relative group">
                  <select 
                    value={useCustomRate ? 'custom' : selectedBank.bank}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setSelectedBank({ bank: 'custom', rate: Number(customRate) || 0 });
                        setUseCustomRate(true);
                      } else {
                        const bank = financeData.mortgageRates.find(b => b.bank === e.target.value);
                        if (bank) {
                          setSelectedBank(bank);
                          setCustomRate(bank.rate);
                          setUseCustomRate(false);
                        }
                      }
                    }}
                    className="w-full appearance-none px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer text-[10px] sm:text-sm font-medium text-slate-700 pr-6 sm:pr-8 shadow-sm hover:border-indigo-300 dark:bg-slate-900  dark:border-slate-800  dark:text-slate-300 truncate"
                  >
                    {financeData.mortgageRates.map((bank) => (
                      <option key={bank.bank} value={bank.bank}>
                        {bank.bank} - {bank.rate}%
                      </option>
                    ))}
                    <option value="custom">Outra Taxa</option>
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            </div>

            {useCustomRate && (
              <div>
                <label className="block text-[10px] sm:text-sm font-medium text-slate-700 mb-1 pt-1 sm:pt-2 dark:text-slate-300 ">Taxa Juros Anual (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={customRate}
                  onChange={(e) => {
                    setCustomRate(e.target.value);
                    setUseCustomRate(true);
                  }}
                  placeholder="0"
                  className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-[10px] sm:text-sm dark:border-slate-800  dark:bg-slate-800 "
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2 dark:text-slate-100 ">
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
            Simulação Inteligente
          </h3>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-indigo-900 dark:text-indigo-300">Cenários Rápidos</p>
                <p className="text-[10px] sm:text-xs text-indigo-700/80 dark:text-indigo-400/80 mt-0.5 sm:mt-1">
                  Veja como pequenas mudanças impactam o custo total.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button 
                onClick={() => {
                  setExtraAmortization(100);
                  setExtraAmortizationType('TERM');
                }}
                className="w-full text-center sm:text-left px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-[10px] sm:text-xs font-medium dark:border-slate-700 dark:hover:bg-indigo-500/10 dark:text-slate-300"
              >
                +R$ 100/mês <span className="hidden sm:inline">(Prazo)</span>
              </button>
              <button 
                onClick={() => {
                  setExtraAmortization(500);
                  setExtraAmortizationType('TERM');
                }}
                className="w-full text-center sm:text-left px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-[10px] sm:text-xs font-medium dark:border-slate-700 dark:hover:bg-indigo-500/10 dark:text-slate-300"
              >
                +R$ 500/mês <span className="hidden sm:inline">(Prazo)</span>
              </button>
              <button 
                onClick={() => {
                  const halfTerm = Math.round((Number(termValue) || 0) / 2);
                  setTermValue(halfTerm);
                }}
                className="w-full text-center sm:text-left px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-[10px] sm:text-xs font-medium dark:border-slate-700 dark:hover:bg-indigo-500/10 dark:text-slate-300"
              >
                Quitar em Metade do Tempo
              </button>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 dark:text-slate-100 ">
                  Amortização Extra
                </label>
                <button 
                  onClick={() => setShowAmortizationGuide(!showAmortizationGuide)}
                  className="text-[9px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 uppercase tracking-wider"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Prazo ou Prestação?</span>
                  <span className="sm:hidden">Ajuda</span>
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-0 bottom-2 text-slate-400 text-sm sm:text-lg">R$</span>
                <input 
                  type="number" 
                  value={extraAmortization}
                  onChange={(e) => setExtraAmortization(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-6 sm:pl-8 py-1.5 sm:py-2 bg-transparent border-b-2 border-slate-300 focus:border-indigo-500 outline-none transition-all text-lg sm:text-xl font-medium dark:border-slate-700 dark:text-white dark:focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => setExtraAmortizationType('TERM')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium rounded-xl border-2 transition-all ${
                    extraAmortizationType === 'TERM'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 dark:border-indigo-500 dark:text-indigo-300 dark:bg-indigo-500/10'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  {extraAmortizationType === 'TERM' ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-600" />
                  )}
                  Prazo
                </button>
                <button
                  onClick={() => setExtraAmortizationType('INSTALLMENT')}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm font-medium rounded-xl border-2 transition-all ${
                    extraAmortizationType === 'INSTALLMENT'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 dark:border-indigo-500 dark:text-indigo-300 dark:bg-indigo-500/10'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  {extraAmortizationType === 'INSTALLMENT' ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-600" />
                  )}
                  Prestação
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showAmortizationGuide && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 pt-6 border-t border-border">
                    <AmortizationGuide />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2 dark:text-slate-300 ">
                <Percent className="w-4 h-4 text-slate-400" />
                TR Estimada (% a.a.)
                <div className="relative group/tooltip">
                  <Info className="w-3 h-3 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                    Taxa Referencial. Atualmente em torno de 1.2% a.a. É somada aos juros do banco.
                  </div>
                </div>
              </label>
              <input 
                type="number" 
                step="0.01"
                value={trRate}
                onChange={(e) => setTrRate(e.target.value)}
                placeholder="1.2"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:border-slate-800  dark:bg-slate-800 "
              />
            </div>

            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2 dark:text-slate-300 ">
                <Percent className="w-4 h-4 text-slate-400" />
                Inflação Estimada (INPC % a.a.)
                <div className="relative group/tooltip">
                  <Info className="w-3 h-3 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                    Índice Nacional de Preços ao Consumidor. Usado para calcular o valor real das parcelas no futuro.
                  </div>
                </div>
              </label>
              <input 
                type="number" 
                step="0.1"
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
                placeholder="4.5"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:border-slate-800  dark:bg-slate-800 "
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <h3 className="text-lg sm:text-xl font-bold text-foreground ">Análise do Financiamento</h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  showComparison 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{showComparison ? 'Voltar' : `Comparar com ${system === 'SAC' ? 'PRICE' : 'SAC'}`}</span>
                <span className="sm:hidden">{showComparison ? 'Voltar' : 'Comparar'}</span>
              </button>
              {simulationData.summary && (
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <button
                    onClick={() => {
                      setTableInitialViewMode('chart');
                      setShowTableModal(true);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-indigo-100 transition-colors dark:bg-indigo-500/10 dark:text-indigo-400"
                    title="Ver impacto da amortização no gráfico"
                  >
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Gráfico</span>
                  </button>
                  <button
                    onClick={() => {
                      setTableInitialViewMode('table');
                      setShowTableModal(true);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 text-slate-600 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    <Table2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Tabela</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {simulationData.summary ? (
            <div className="space-y-6 sm:space-y-8">
              {showComparison && simulationData.otherSystemSim.summary && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-xl sm:rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase leading-tight">Dif. Total de Juros</p>
                    <p className={`text-sm sm:text-lg font-bold ${simulationData.summary.totalInterest < simulationData.otherSystemSim.summary.totalInterest ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <ValueDisplay 
                        value={Math.abs(simulationData.summary.totalInterest - simulationData.otherSystemSim.summary.totalInterest)}
                        isHidden={!showValues && !toggledSummary.has('diff-interest')}
                        onToggle={() => toggleSummary('diff-interest')}
                      />
                      <span className="block sm:inline text-[9px] sm:text-xs font-normal sm:ml-2 text-slate-500 mt-0.5 sm:mt-0">
                        ({simulationData.summary.totalInterest < simulationData.otherSystemSim.summary.totalInterest ? 'Economia no ' : 'A mais no '}{system})
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase leading-tight">Dif. na 1ª Parcela</p>
                    <p className="text-sm sm:text-xl font-bold text-foreground mt-auto">
                      <ValueDisplay 
                        value={Math.abs(simulationData.summary.firstInstallment - simulationData.otherSystemSim.summary.firstInstallment)}
                        isHidden={!showValues && !toggledSummary.has('diff-installment')}
                        onToggle={() => toggleSummary('diff-installment')}
                      />
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl">
                      <p className="text-[10px] sm:text-sm text-slate-500 mb-1">Valor Financiado</p>
                      <ValueDisplay 
                        value={simulationData.summary.loanAmount}
                        isHidden={!showValues && !toggledSummary.has('loan-amount')}
                        onToggle={() => toggleSummary('loan-amount')}
                      />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl">
                      <p className="text-[10px] sm:text-sm text-slate-500 mb-1">Custo Total (Imóvel)</p>
                      <span className="text-sm sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        <ValueDisplay 
                          value={simulationData.totalCost}
                          isHidden={!showValues && !toggledSummary.has('total-cost')}
                          onToggle={() => toggleSummary('total-cost')}
                        />
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-orange-100 dark:border-orange-500/20">
                      <p className="text-[10px] sm:text-sm text-slate-500 mb-1">Total de Juros</p>
                      <span className="text-sm sm:text-xl font-bold text-orange-600">
                        <ValueDisplay 
                          value={simulationData.summary.totalInterest}
                          isHidden={!showValues && !toggledSummary.has('total-interest')}
                          onToggle={() => toggleSummary('total-interest')}
                        />
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                      <p className="text-[10px] sm:text-sm text-slate-500 mb-1">Economia de Tempo</p>
                      <p className="text-sm sm:text-xl font-bold text-emerald-600">{simulationData.summary.originalMonths - simulationData.summary.effectiveMonths} meses</p>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-muted/50 rounded-xl sm:rounded-2xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                       <div className="text-[10px] sm:text-sm font-bold text-foreground flex items-center gap-1.5 sm:gap-2">
                        <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                        Capacidade de Pagamento
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase ${
                        simulationData.healthScore > 70 ? 'bg-emerald-100 text-emerald-700' :
                        simulationData.healthScore > 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {simulationData.healthScore > 70 ? 'Seguro' : simulationData.healthScore > 40 ? 'Atenção' : 'Risco Alto'}
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4">Renda mínima recomendada (30%): <span className="font-bold text-foreground break-all">
                      <ValueDisplay 
                        value={simulationData.incomeScenarios.ideal}
                        isHidden={!showValues && !toggledSummary.has('income-ideal')}
                        onToggle={() => toggleSummary('income-ideal')}
                      />
                    </span></p>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between items-center text-[10px] sm:text-xs bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-lg">
                        <span className="text-slate-500">Conservador (25%)</span>
                        <span className="font-medium">
                          <ValueDisplay 
                            value={simulationData.incomeScenarios.conservative}
                            isHidden={!showValues && !toggledSummary.has('income-conservative')}
                            onToggle={() => toggleSummary('income-conservative')}
                          />
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] sm:text-xs bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-lg">
                        <span className="text-slate-500">Limite (35%)</span>
                        <span className="font-medium text-rose-500">
                          <ValueDisplay 
                            value={simulationData.incomeScenarios.aggressive}
                            isHidden={!showValues && !toggledSummary.has('income-aggressive')}
                            onToggle={() => toggleSummary('income-aggressive')}
                          />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                    <div className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                      Inteligência Financeira
                      <div className="relative group/tooltip">
                        <Info className="w-3 h-3 text-emerald-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                          Insights automáticos baseados nos seus dados.
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-2">
                       <li className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5 sm:gap-2 leading-relaxed">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                        <span>Você pagará <span className="font-bold text-foreground">{Math.round(simulationData.summary.interestRatio)}%</span> do valor total em juros.</span>
                      </li>
                      {Number(extraAmortization) > 0 && (
                        <li className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5 sm:gap-2 leading-relaxed">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                          <span>Amortizando extra, economiza <span className="font-bold text-emerald-600">{formatCurrency(simulationData.summary.savings)}</span>.</span>
                        </li>
                      )}
                      <li className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5 sm:gap-2 leading-relaxed">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                        <span>A parcela hoje vale aprox. <span className="font-bold text-indigo-600">{formatCurrency(simulationData.realInstallmentFuture)}</span> em 15 anos (valor real).</span>
                      </li>
                    </ul>
                  </div>

                  {/* Financial Life Simulation */}
                  <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-xl sm:rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10">
                      <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                    <h4 className="text-[10px] sm:text-sm font-bold mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                      Simulação de Vida Financeira
                    </h4>
                    <div className="space-y-3 sm:space-y-4 relative z-10">
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold mb-0.5 sm:mb-1">Impacto da Inflação</p>
                        <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed">
                          Em 15 anos, a parcela terá o "peso" de <span className="text-yellow-400 font-bold">
                            <ValueDisplay 
                              value={simulationData.realInstallmentFuture}
                              isHidden={!showValues && !toggledSummary.has('installment-future')}
                              onToggle={() => toggleSummary('installment-future')}
                            />
                          </span> em valores de hoje.
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold mb-0.5 sm:mb-1">Crescimento de Renda</p>
                        <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed">
                          Se a renda acompanhar a inflação, o comprometimento cai de <span className="text-white font-bold">{((simulationData.summary.firstInstallment / (Number(userIncome) || simulationData.incomeScenarios.ideal)) * 100).toFixed(1)}%</span> para <span className="text-emerald-400 font-bold">{((simulationData.realInstallmentFuture / (Number(userIncome) || simulationData.incomeScenarios.ideal)) * 100).toFixed(1)}%</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-border dark:bg-slate-800 ">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          stroke="currentColor"
                          strokeWidth="10%"
                          fill="transparent"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          stroke="currentColor"
                          strokeWidth="10%"
                          fill="transparent"
                          strokeDasharray={283}
                          strokeDashoffset={283 - (283 * simulationData.summary.interestRatio) / 100}
                          className="text-orange-500 transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                        <span className="text-lg sm:text-2xl font-black text-foreground leading-none">{Math.round(simulationData.summary.interestRatio)}%</span>
                        <span className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-400 mt-0.5">Juros</span>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-6 text-center w-full">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-1.5">Saúde Financeira</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 sm:h-2 w-24 sm:w-32 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              simulationData.healthScore > 70 ? 'bg-emerald-500' :
                              simulationData.healthScore > 40 ? 'bg-yellow-500' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${simulationData.healthScore}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">{simulationData.healthScore}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl sm:rounded-2xl">
                      <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold mb-0.5 sm:mb-1">1ª Parcela</p>
                      <div className="text-sm sm:text-lg font-bold text-foreground">
                        <ValueDisplay 
                          value={simulationData.summary.firstInstallment}
                          isHidden={!showValues && !toggledSummary.has('pmt-first')}
                          onToggle={() => toggleSummary('pmt-first')}
                        />
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl sm:rounded-2xl">
                      <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold mb-0.5 sm:mb-1">Última Parcela</p>
                      <div className="text-sm sm:text-lg font-bold text-foreground">
                        <ValueDisplay 
                          value={simulationData.summary.lastInstallment}
                          isHidden={!showValues && !toggledSummary.has('pmt-last')}
                          onToggle={() => toggleSummary('pmt-last')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-indigo-900 text-white rounded-xl sm:rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10">
                      <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                    <h4 className="text-[10px] sm:text-sm font-bold mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                      <BarChart3 className="w-3.5 h-3.5 sm:w-4 h-4 text-indigo-400" />
                      Comparativo Aluguel
                    </h4>
                    <div className="space-y-3 sm:space-y-4 relative z-10">
                      <div className="flex justify-between items-end gap-2">
                        <div>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold mb-0.5 sm:mb-1 line-clamp-1">Aluguel Estimado</p>
                          <div className="text-sm sm:text-lg font-bold text-white">
                            <ValueDisplay 
                              value={simulationData.rentVsBuy.estimatedMonthlyRent}
                              isHidden={!showValues && !toggledSummary.has('rent-estimated')}
                              onToggle={() => toggleSummary('rent-estimated')}
                            />
                            <span className="text-[10px] font-normal text-slate-400">/m</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold mb-0.5 sm:mb-1 line-clamp-1">Custo Oportunidade</p>
                          <div className="text-[10px] sm:text-sm font-medium text-rose-400">
                            <ValueDisplay 
                              value={simulationData.rentVsBuy.opportunityCostDownPayment / 12}
                              isHidden={!showValues && !toggledSummary.has('opp-cost')}
                              onToggle={() => toggleSummary('opp-cost')}
                            />
                            <span className="text-[8px] font-normal text-slate-400 opacity-70">/m</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed">
                        Ao financiar, você "troca" o aluguel e o rendimento da entrada pela parcela. 
                        {simulationData.summary.firstInstallment < (simulationData.rentVsBuy.estimatedMonthlyRent + (simulationData.rentVsBuy.opportunityCostDownPayment / 12)) 
                          ? " Neste cenário, a parcela é menor que o custo do aluguel + perda de rendimento."
                          : " Neste cenário, o aluguel seria mais barato no curto prazo."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-20" />
              <p className="text-xs sm:text-base text-center px-4">Preencha os dados do imóvel para ver a simulação</p>
            </div>
          )}
        </div>

        {simulationData.summary && Number(extraAmortization) > 0 && !showComparison && (
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 dark:text-slate-100">Resultado da simulação</h4>
            
            {extraAmortizationType === 'TERM' ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-border">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl">
                  <p className="text-[10px] sm:text-sm text-slate-500 mb-1">Prazo atual</p>
                  <p className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{simulationData.summary.originalMonths} meses</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-[10px] sm:text-sm text-slate-500 mb-1">Novo prazo</p>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{simulationData.summary.effectiveMonths} meses</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-border">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl">
                  <p className="text-[10px] sm:text-sm text-slate-500 mb-1">Prestação (1ª)</p>
                  <div className="text-sm sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 break-all">
                    <ValueDisplay 
                      value={system === 'PRICE' 
                        ? (simulationData.summary.loanAmount * (currentRate / 100 / 12) * Math.pow(1 + (currentRate / 100 / 12), simulationData.summary.originalMonths)) / (Math.pow(1 + (currentRate / 100 / 12), simulationData.summary.originalMonths) - 1)
                        : (simulationData.summary.loanAmount / simulationData.summary.originalMonths) + (simulationData.summary.loanAmount * (currentRate / 100 / 12))
                      }
                      isHidden={!showValues && !toggledSummary.has('pmt-orig-1')}
                      onToggle={() => toggleSummary('pmt-orig-1')}
                    />
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-[10px] sm:text-sm text-slate-500 mb-1">Nova (1ª)</p>
                  <div className="text-sm sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 break-all">
                    <ValueDisplay 
                      value={simulationData.summary.firstInstallment}
                      isHidden={!showValues && !toggledSummary.has('pmt-new-1')}
                      onToggle={() => toggleSummary('pmt-new-1')}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4 text-[10px] sm:text-base">
              <div className="flex justify-between items-center py-1.5 sm:py-0 border-b border-slate-100 sm:border-0 dark:border-slate-800">
                <span className="text-muted-foreground mr-2">Amortização extra</span>
                <span className="font-medium text-foreground text-right">
                  <ValueDisplay 
                    value={Number(extraAmortization)}
                    isHidden={!showValues && !toggledSummary.has('extra-amort')}
                    onToggle={() => toggleSummary('extra-amort')}
                  />
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 sm:py-0 border-b border-slate-100 sm:border-0 dark:border-slate-800">
                <span className="text-muted-foreground mr-2">Economia de tempo</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 text-right">
                  {simulationData.summary.originalMonths - simulationData.summary.effectiveMonths} m 
                  <span className="whitespace-nowrap ml-1 text-slate-400 font-normal">
                    ({((simulationData.summary.originalMonths - simulationData.summary.effectiveMonths) / 12).toFixed(1)} a)
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 sm:py-0 border-b border-slate-100 sm:border-0 dark:border-slate-800">
                <span className="text-muted-foreground mr-2">Economia em Juros</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">
                  <ValueDisplay 
                    value={simulationData.summary.savings}
                    isHidden={!showValues && !toggledSummary.has('savings-juros')}
                    onToggle={() => toggleSummary('savings-juros')}
                  />
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 sm:py-0">
                <span className="text-muted-foreground mr-2">Juros totais</span>
                <span className="font-medium text-orange-600 dark:text-orange-400 text-right">
                  <ValueDisplay 
                    value={simulationData.summary.totalInterest}
                    isHidden={!showValues && !toggledSummary.has('total-interest-summary')}
                    onToggle={() => toggleSummary('total-interest-summary')}
                  />
                </span>
              </div>
            </div>
            
            <div className="mt-6 sm:mt-8 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] sm:text-sm text-indigo-900 dark:text-indigo-300 leading-relaxed">
                Ao pagar <span className="font-bold">{formatCurrency(Number(extraAmortization))}</span> a mais por mês, você reduz o custo do financiamento em <span className="font-bold text-emerald-600">{formatCurrency(simulationData.summary.savings)}</span>.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
          <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
            Comparativo entre Bancos
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {financeData.mortgageRates.map((bank) => {
              const monthlyRate = Math.pow(1 + bank.rate / 100, 1 / 12) - 1;
              const monthlyTr = Math.pow(1 + Number(trRate) / 100, 1 / 12) - 1;
              const combinedRate = monthlyRate + monthlyTr;
              const propVal = Number(propertyValue) || 0;
              const down = Number(downPayment) || 0;
              const principal = propVal - down;
              const m = termType === 'YEARS' ? (Number(termValue) || 0) * 12 : (Number(termValue) || 0);
              
              let firstPmt = 0;
              if (principal > 0 && m > 0) {
                if (system === 'PRICE') {
                  firstPmt = (principal * combinedRate * Math.pow(1 + combinedRate, m)) / (Math.pow(1 + combinedRate, m) - 1);
                } else {
                  firstPmt = (principal / m) + (principal * combinedRate);
                }
                firstPmt += Number(insuranceValue) + Number(feesValue);
              }

              return (
                <div 
                  key={bank.bank}
                  onClick={() => {
                    setSelectedBank(bank);
                    setCustomRate(bank.rate);
                    setUseCustomRate(false);
                  }}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedBank.bank === bank.bank && !useCustomRate
                      ? 'border-indigo-600 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-500/5'
                      : 'border-slate-100 hover:border-border dark:hover:border-slate-700 dark:border-slate-800'
                  }`}
                >
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-0.5 sm:mb-1 truncate">{bank.bank}</p>
                  <p className="text-sm sm:text-lg font-bold text-foreground">{bank.rate}% <span className="text-[9px] sm:text-[10px] font-normal text-slate-500">a.a.</span></p>
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 line-clamp-2">
                    1ª Parc: <span className="font-bold text-slate-700 dark:text-slate-300 block sm:inline">
                      <ValueDisplay 
                        value={firstPmt}
                        isHidden={!showValues && !toggledSummary.has(`bank-${bank.bank}`)}
                        onToggle={() => toggleSummary(`bank-${bank.bank}`)}
                      />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {simulationData.summary && (
        <FinancingTableModal 
          isOpen={showTableModal}
          onClose={() => setShowTableModal(false)}
          data={simulationData.rows}
          summary={simulationData.summary}
          initialViewMode={tableInitialViewMode}
        />
      )}
    </div>
    </div>
  );
}

