import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../lib/utils';
import { FinanceData } from '../../services/financeService';
import { Building2, TrendingUp, AlertTriangle, CheckCircle2, Info, PieChart as PieChartIcon, BarChart3, X, Users, Briefcase, Calculator, Download, ChevronRight, ArrowRight, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

interface MEICalculatorProps {
  financeData: FinanceData;
}

type ActivityType = 'comercio' | 'servico' | 'servico_intelectual' | 'industria';
type TabType = 'comparativo' | 'clt_pj' | 'crescimento' | 'distribuicao';

interface TaxResult {
  regime: string;
  monthlyTax: number;
  annualTax: number;
  effectiveRate: number;
  breakdown: { name: string; value: number }[];
  isAllowed: boolean;
  disallowReason?: string;
  explanation: string[];
}

export default function MEICalculator({ financeData }: MEICalculatorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('comparativo');
  const [revenue, setRevenue] = useState<string | number>(15000);
  const [activityType, setActivityType] = useState<ActivityType>('servico_intelectual');
  const [profitMargin, setProfitMargin] = useState<string | number>(30);
  const [payroll, setPayroll] = useState<string | number>(0);
  const [proLabore, setProLabore] = useState<string | number>(4236); // 3 salários mínimos
  const [issRate, setIssRate] = useState<string | number>(5);
  const [cltSalary, setCltSalary] = useState<string | number>(10000);
  const [growthRate, setGrowthRate] = useState<string | number>(20);
  const [selectedRegimeName, setSelectedRegimeName] = useState<string | null>(null);

  // Helper functions for taxes
  const calculateINSS = (salary: number) => {
    let inss = 0;
    if (salary <= 1412) inss = salary * 0.075;
    else if (salary <= 2666.68) inss = 1412 * 0.075 + (salary - 1412) * 0.09;
    else if (salary <= 4000.03) inss = 1412 * 0.075 + (2666.68 - 1412) * 0.09 + (salary - 2666.68) * 0.12;
    else if (salary <= 7786.02) inss = 1412 * 0.075 + (2666.68 - 1412) * 0.09 + (4000.03 - 2666.68) * 0.12 + (salary - 4000.03) * 0.14;
    else inss = 1412 * 0.075 + (2666.68 - 1412) * 0.09 + (4000.03 - 2666.68) * 0.12 + (7786.02 - 4000.03) * 0.14;
    return inss;
  };

  const calculateIRPF = (base: number) => {
    if (base <= 2259.20) return 0;
    if (base <= 2826.65) return base * 0.075 - 169.44;
    if (base <= 3751.05) return base * 0.15 - 381.44;
    if (base <= 4664.68) return base * 0.225 - 662.77;
    return base * 0.275 - 896.00;
  };

  const getSimplesRate = (annualRev: number, anexo: number) => {
    if (anexo === 3) {
      if (annualRev <= 180000) return { rate: 0.06, ded: 0 };
      if (annualRev <= 360000) return { rate: 0.112, ded: 9360 };
      if (annualRev <= 720000) return { rate: 0.135, ded: 17640 };
      if (annualRev <= 1800000) return { rate: 0.16, ded: 35640 };
      if (annualRev <= 3600000) return { rate: 0.21, ded: 125640 };
      return { rate: 0.33, ded: 648000 };
    }
    if (anexo === 5) {
      if (annualRev <= 180000) return { rate: 0.155, ded: 0 };
      if (annualRev <= 360000) return { rate: 0.18, ded: 4500 };
      if (annualRev <= 720000) return { rate: 0.195, ded: 9900 };
      if (annualRev <= 1800000) return { rate: 0.205, ded: 17100 };
      if (annualRev <= 3600000) return { rate: 0.23, ded: 62100 };
      return { rate: 0.305, ded: 540000 };
    }
    if (anexo === 1) {
      if (annualRev <= 180000) return { rate: 0.04, ded: 0 };
      if (annualRev <= 360000) return { rate: 0.073, ded: 5940 };
      if (annualRev <= 720000) return { rate: 0.095, ded: 13860 };
      if (annualRev <= 1800000) return { rate: 0.107, ded: 22500 };
      if (annualRev <= 3600000) return { rate: 0.143, ded: 87300 };
      return { rate: 0.19, ded: 378000 };
    }
    if (anexo === 2) {
      if (annualRev <= 180000) return { rate: 0.045, ded: 0 };
      if (annualRev <= 360000) return { rate: 0.078, ded: 5940 };
      if (annualRev <= 720000) return { rate: 0.10, ded: 13860 };
      if (annualRev <= 1800000) return { rate: 0.112, ded: 22500 };
      if (annualRev <= 3600000) return { rate: 0.147, ded: 85500 };
      return { rate: 0.30, ded: 720000 };
    }
    return { rate: 0.06, ded: 0 };
  };

  const results = useMemo(() => {
    const monthlyRevenue = Number(revenue) || 0;
    const margin = Number(profitMargin) || 0;
    const monthlyPayroll = Number(payroll) || 0;
    const monthlyProLabore = Number(proLabore) || 0;
    const iss = Number(issRate) || 5;
    
    const annualRevenue = monthlyRevenue * 12;
    const monthlyProfit = monthlyRevenue * (margin / 100);
    const annualProfit = monthlyProfit * 12;

    const res: TaxResult[] = [];

    // 1. MEI
    const meiLimit = 81000;
    const isMeiAllowed = annualRevenue <= meiLimit && activityType !== 'industria' && activityType !== 'servico_intelectual';
    const minWage = financeData.minimumWage || 1412;
    const inssMei = minWage * 0.05;
    const meiMonthlyTax = inssMei + (activityType === 'servico' ? 5 : 1);

    res.push({
      regime: 'MEI',
      monthlyTax: meiMonthlyTax,
      annualTax: meiMonthlyTax * 12,
      effectiveRate: monthlyRevenue > 0 ? (meiMonthlyTax / monthlyRevenue) * 100 : 0,
      breakdown: [
        { name: 'INSS', value: inssMei },
        { name: activityType === 'servico' ? 'ISS' : 'ICMS', value: activityType === 'servico' ? 5 : 1 }
      ],
      isAllowed: isMeiAllowed,
      disallowReason: annualRevenue > meiLimit ? 'Faturamento excede o limite anual de R$ 81.000' : 'Atividade não permitida para MEI',
      explanation: [
        '✔ Pagamento fixo mensal (DAS)',
        '✔ Isento de IRPF na distribuição de lucros (dentro do limite)',
        '✔ Menor carga tributária possível',
        '❌ Limite de faturamento baixo e restrição de atividades'
      ]
    });

    // 2. Simples Nacional
    const isFatorR = activityType === 'servico_intelectual';
    const fatorRRatio = monthlyRevenue > 0 ? (monthlyPayroll + monthlyProLabore) / monthlyRevenue : 0;
    const usesAnexoIII = isFatorR && fatorRRatio >= 0.28;
    
    let anexo = 3; // servico
    if (activityType === 'comercio') anexo = 1;
    else if (activityType === 'industria') anexo = 2;
    else if (isFatorR) anexo = usesAnexoIII ? 3 : 5;

    const { rate: sRate, ded: sDed } = getSimplesRate(annualRevenue, anexo);
    let simplesAnnualTax = Math.max(0, (annualRevenue * sRate) - sDed);
    
    // Calculate Pro-labore taxes for Simples
    const inssProLabore = monthlyProLabore * 0.11; // 11% for Simples
    const irpfProLabore = calculateIRPF(monthlyProLabore - inssProLabore);
    const monthlyProLaboreTaxes = inssProLabore + irpfProLabore;

    const simplesMonthlyTax = (simplesAnnualTax / 12) + monthlyProLaboreTaxes;
    simplesAnnualTax = simplesMonthlyTax * 12;

    const simplesExplanation = [
      `✔ Enquadrado no Anexo ${anexo === 3 ? 'III' : anexo === 5 ? 'V' : anexo === 1 ? 'I' : 'II'}`,
      '✔ Imposto unificado em guia única (DAS)',
      isFatorR ? `✔ Fator R: ${(fatorRRatio * 100).toFixed(1)}% (${usesAnexoIII ? 'Vantajoso, Anexo III' : 'Abaixo de 28%, caiu no Anexo V'})` : '✔ Sem incidência de Fator R',
      `✔ Inclui impostos sobre pró-labore de ${formatCurrency(monthlyProLabore)}`
    ];

    res.push({
      regime: 'Simples Nacional',
      monthlyTax: simplesMonthlyTax,
      annualTax: simplesAnnualTax,
      effectiveRate: annualRevenue > 0 ? (simplesAnnualTax / annualRevenue) * 100 : 0,
      breakdown: [
        { name: 'DAS (Imposto Empresa)', value: (simplesAnnualTax / 12) - monthlyProLaboreTaxes },
        { name: 'INSS Pró-labore', value: inssProLabore },
        { name: 'IRPF Pró-labore', value: irpfProLabore }
      ],
      isAllowed: annualRevenue <= 4800000,
      disallowReason: annualRevenue > 4800000 ? 'Faturamento excede o limite anual de R$ 4.800.000' : undefined,
      explanation: simplesExplanation
    });

    // 3. Lucro Presumido
    const isService = activityType === 'servico' || activityType === 'servico_intelectual';
    const presumpIRPJ = isService ? 0.32 : 0.08;
    const presumpCSLL = isService ? 0.32 : 0.12;
    
    const baseIRPJ = monthlyRevenue * presumpIRPJ;
    const baseCSLL = monthlyRevenue * presumpCSLL;

    const irpj = baseIRPJ * 0.15 + (baseIRPJ > 20000 ? (baseIRPJ - 20000) * 0.10 : 0);
    const csll = baseCSLL * 0.09;
    const pis = monthlyRevenue * 0.0065;
    const cofins = monthlyRevenue * 0.03;
    const issIcms = isService ? monthlyRevenue * (iss / 100) : monthlyRevenue * 0.18;

    // Pro-labore taxes for Presumido (20% patronal + 11% retido)
    const inssProLaborePresumido = monthlyProLabore * 0.11;
    const inssPatronal = monthlyProLabore * 0.20;
    const irpfProLaborePresumido = calculateIRPF(monthlyProLabore - inssProLaborePresumido);

    const presumidoMonthlyTax = irpj + csll + pis + cofins + issIcms + inssProLaborePresumido + inssPatronal + irpfProLaborePresumido;

    res.push({
      regime: 'Lucro Presumido',
      monthlyTax: presumidoMonthlyTax,
      annualTax: presumidoMonthlyTax * 12,
      effectiveRate: monthlyRevenue > 0 ? (presumidoMonthlyTax / monthlyRevenue) * 100 : 0,
      breakdown: [
        { name: 'IRPJ + CSLL', value: irpj + csll },
        { name: 'PIS/COFINS', value: pis + cofins },
        { name: isService ? `ISS (${iss}%)` : 'ICMS', value: issIcms },
        { name: 'Encargos Pró-labore', value: inssProLaborePresumido + inssPatronal + irpfProLaborePresumido }
      ],
      isAllowed: annualRevenue <= 78000000,
      disallowReason: annualRevenue > 78000000 ? 'Faturamento excede o limite anual de R$ 78.000.000' : undefined,
      explanation: [
        '✔ Impostos federais fixos sobre a presunção de lucro',
        `✔ ISS municipal considerado a ${iss}%`,
        '❌ Custo alto de folha e pró-labore (20% patronal)',
        '✔ Ideal para margens de lucro reais muito altas'
      ]
    });

    // 4. Autônomo (PF)
    const inssPf = Math.min(monthlyRevenue, 7786.02) * 0.20;
    const baseIrpf = monthlyRevenue - inssPf;
    const irpf = calculateIRPF(baseIrpf);
    const issPf = isService ? monthlyRevenue * (iss / 100) : 0;

    const pfMonthlyTax = inssPf + Math.max(0, irpf) + issPf;

    res.push({
      regime: 'Autônomo (PF)',
      monthlyTax: pfMonthlyTax,
      annualTax: pfMonthlyTax * 12,
      effectiveRate: monthlyRevenue > 0 ? (pfMonthlyTax / monthlyRevenue) * 100 : 0,
      breakdown: [
        { name: 'INSS (20%)', value: inssPf },
        { name: 'IRPF (Carnê-Leão)', value: Math.max(0, irpf) },
        { name: 'ISS', value: issPf }
      ],
      isAllowed: true,
      explanation: [
        '✔ Não precisa abrir CNPJ',
        '❌ Carga tributária altíssima (IRPF até 27,5%)',
        '❌ INSS de 20% sobre o rendimento',
        '✔ Recomendado apenas para rendimentos muito baixos'
      ]
    });

    return res;
  }, [revenue, activityType, profitMargin, payroll, proLabore, issRate, financeData.minimumWage]);

  const allowedResults = results.filter(r => r.isAllowed);
  const bestRegime = allowedResults.length > 0 ? allowedResults.reduce((prev, curr) => prev.annualTax < curr.annualTax ? prev : curr) : null;
  const worstRegime = allowedResults.length > 0 ? allowedResults.reduce((prev, curr) => prev.annualTax > curr.annualTax ? prev : curr) : null;
  
  const selectedRegime = results.find(r => r.regime === selectedRegimeName) || bestRegime;

  const chartData = allowedResults.map(r => ({
    name: r.regime,
    'Imposto Anual': r.annualTax,
    'Economia': worstRegime ? worstRegime.annualTax - r.annualTax : 0
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  // CLT vs PJ Data
  const cltVsPjData = useMemo(() => {
    const gross = Number(cltSalary) || 0;
    const inss = calculateINSS(gross);
    const irpf = calculateIRPF(gross - inss);
    const netClt = gross - inss - irpf;

    // Equivalent PJ (Simples Nacional Anexo III for simplicity)
    const pjRevenue = gross * 1.3; // Assuming company pays 30% more for PJ
    const { rate, ded } = getSimplesRate(pjRevenue * 12, 3);
    const pjTax = Math.max(0, (pjRevenue * 12 * rate) - ded) / 12;
    const netPj = pjRevenue - pjTax;

    return {
      gross,
      clt: { inss, irpf, net: netClt },
      pj: { revenue: pjRevenue, tax: pjTax, net: netPj }
    };
  }, [cltSalary]);

  // Growth Projection Data
  const growthData = useMemo(() => {
    const data = [];
    let currentRev = Number(revenue) || 10000;
    const rate = (Number(growthRate) || 0) / 100;

    for (let year = 1; year <= 5; year++) {
      const annualRev = currentRev * 12;
      
      // Calculate Simples
      const { rate: sRate, ded: sDed } = getSimplesRate(annualRev, 3);
      const simplesTax = Math.max(0, (annualRev * sRate) - sDed);

      // Calculate Presumido
      const baseIRPJ = currentRev * 0.32;
      const baseCSLL = currentRev * 0.32;
      const irpj = baseIRPJ * 0.15 + (baseIRPJ > 20000 ? (baseIRPJ - 20000) * 0.10 : 0);
      const csll = baseCSLL * 0.09;
      const pis = currentRev * 0.0065;
      const cofins = currentRev * 0.03;
      const issIcms = currentRev * 0.05;
      const presumidoTax = (irpj + csll + pis + cofins + issIcms) * 12;

      data.push({
        ano: `Ano ${year}`,
        faturamento: annualRev,
        simples: simplesTax,
        presumido: presumidoTax,
        melhor: simplesTax < presumidoTax ? 'Simples' : 'Presumido'
      });

      currentRev = currentRev * (1 + rate);
    }
    return data;
  }, [revenue, growthRate]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground ">Simulador Tributário Pro</h2>
            <p className="text-muted-foreground text-sm">Planejamento tributário avançado, Fator R, CLT vs PJ e projeções.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-border dark:bg-slate-800 ">
          <button
            onClick={() => setActiveTab('comparativo')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'comparativo' ? 'bg-white dark:bg-slate-700  text-indigo-600 dark:text-indigo-400  shadow-sm border border-slate-200 dark:border-slate-600 ' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 contrast:hover:bg-slate-700'
            }`}
          >
            Comparativo de Regimes
          </button>
          <button
            onClick={() => setActiveTab('clt_pj')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'clt_pj' ? 'bg-white dark:bg-slate-700  text-indigo-600 dark:text-indigo-400  shadow-sm border border-slate-200 dark:border-slate-600 ' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 contrast:hover:bg-slate-700'
            }`}
          >
            CLT vs PJ
          </button>
          <button
            onClick={() => setActiveTab('crescimento')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'crescimento' ? 'bg-white dark:bg-slate-700  text-indigo-600 dark:text-indigo-400  shadow-sm border border-slate-200 dark:border-slate-600 ' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 contrast:hover:bg-slate-700'
            }`}
          >
            Projeção de Crescimento
          </button>
          <button
            onClick={() => setActiveTab('distribuicao')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'distribuicao' ? 'bg-white dark:bg-slate-700  text-indigo-600 dark:text-indigo-400  shadow-sm border border-slate-200 dark:border-slate-600 ' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 contrast:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 contrast:hover:bg-slate-700'
            }`}
          >
            Distribuição de Lucros
          </button>
        </div>

        {/* Tab Content: Comparativo */}
        {activeTab === 'comparativo' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Faturamento Mensal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500  font-bold">R$</span>
                  <input 
                    type="number" 
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-lg dark:border-slate-800  dark:bg-slate-800 "
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Tipo de Atividade</label>
                <select 
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as ActivityType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 dark:border-slate-800  dark:bg-slate-800  dark:text-slate-300 "
                >
                  <option value="servico">Serviços Simples</option>
                  <option value="servico_intelectual">Serviços Intelectuais (Fator R)</option>
                  <option value="comercio">Comércio</option>
                  <option value="industria">Indústria</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Pró-labore Mensal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500  font-bold">R$</span>
                  <input 
                    type="number" 
                    value={proLabore}
                    onChange={(e) => setProLabore(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-lg dark:border-slate-800  dark:bg-slate-800 "
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Folha de Pagamento</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500  font-bold">R$</span>
                  <input 
                    type="number" 
                    value={payroll}
                    onChange={(e) => setPayroll(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-lg dark:border-slate-800  dark:bg-slate-800 "
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Alíquota ISS Municipal (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={issRate}
                    onChange={(e) => setIssRate(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-lg dark:border-slate-800  dark:bg-slate-800 "
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500  font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Fator R Indicator */}
            {activityType === 'servico_intelectual' && Number(revenue) > 0 && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                ((Number(payroll) + Number(proLabore)) / Number(revenue)) >= 0.28 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20  border-emerald-200 dark:border-emerald-800  text-emerald-800 dark:text-emerald-300 ' 
                  : 'bg-amber-50 dark:bg-amber-900/20  border-amber-200 dark:border-amber-800  text-amber-800 dark:text-amber-300 '
              }`}>
                <Zap className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Análise do Fator R</p>
                  <p className="text-sm mt-1">
                    Sua proporção de folha/pró-labore sobre o faturamento é de <strong>{(((Number(payroll) + Number(proLabore)) / Number(revenue)) * 100).toFixed(1)}%</strong>.
                  </p>
                  {((Number(payroll) + Number(proLabore)) / Number(revenue)) >= 0.28 ? (
                    <p className="text-sm mt-1 font-medium">✅ Você atingiu 28% e será tributado no Anexo III (alíquotas menores).</p>
                  ) : (
                    <p className="text-sm mt-1 font-medium">⚠️ Abaixo de 28%. Você será tributado no Anexo V (alíquotas maiores). Aumente seu pró-labore para economizar impostos.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: CLT vs PJ */}
        {activeTab === 'clt_pj' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="max-w-md">
              <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Salário Bruto CLT</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500  font-bold">R$</span>
                <input 
                  type="number" 
                  value={cltSalary}
                  onChange={(e) => setCltSalary(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-lg dark:border-slate-800  dark:bg-slate-800 "
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-border dark:bg-slate-800 ">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 dark:text-slate-100 ">
                  <Briefcase className="w-5 h-5 text-muted-foreground" /> Como CLT
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Salário Bruto</span>
                    <span className="font-medium">{formatCurrency(cltVsPjData.gross)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Desconto INSS</span>
                    <span>-{formatCurrency(cltVsPjData.clt.inss)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Desconto IRPF</span>
                    <span>-{formatCurrency(cltVsPjData.clt.irpf)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center dark:border-slate-800 ">
                    <span className="font-bold text-foreground ">Líquido Mensal</span>
                    <span className="text-xl font-black text-foreground ">{formatCurrency(cltVsPjData.clt.net)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20  p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800 ">
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100  mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" /> Como PJ (Estimativa)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700 dark:text-indigo-300 ">Faturamento PJ (+30%)</span>
                    <span className="font-medium text-indigo-900 dark:text-indigo-100 ">{formatCurrency(cltVsPjData.pj.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Impostos (Simples Nac.)</span>
                    <span>-{formatCurrency(cltVsPjData.pj.tax)}</span>
                  </div>
                  <div className="pt-3 border-t border-indigo-200 flex justify-between items-center">
                    <span className="font-bold text-indigo-900 dark:text-indigo-100 ">Líquido Mensal</span>
                    <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 ">{formatCurrency(cltVsPjData.pj.net)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20  p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800  flex items-center justify-between">
              <div>
                <p className="text-emerald-800 dark:text-emerald-300  font-bold">Vantagem Financeira PJ</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 ">Diferença líquida mensal estimada</p>
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 ">
                +{formatCurrency(cltVsPjData.pj.net - cltVsPjData.clt.net)}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Crescimento */}
        {activeTab === 'crescimento' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Faturamento Atual</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500  font-bold">R$</span>
                  <input 
                    type="number" 
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-lg dark:border-slate-800  dark:bg-slate-800 "
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 dark:text-slate-300 ">Taxa de Crescimento Anual (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={growthRate}
                    onChange={(e) => setGrowthRate(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-lg dark:border-slate-800  dark:bg-slate-800 "
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500  font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="h-80 w-full mt-8">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSimples" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPresumido" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="ano" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="simples" name="Imposto Simples" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSimples)" />
                  <Area type="monotone" dataKey="presumido" name="Imposto Presumido" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPresumido)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-border dark:bg-slate-800 ">
              <h4 className="font-bold text-slate-900 mb-2 dark:text-slate-100 ">Análise de Break-even</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 ">
                Observe o gráfico acima. Se a linha laranja (Presumido) cruzar para baixo da linha azul (Simples), este é o momento exato em que valerá a pena mudar de regime tributário devido ao crescimento do seu faturamento.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Distribuição de Lucros */}
        {activeTab === 'distribuicao' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-4">A Mágica da Distribuição de Lucros</h3>
              <p className="text-emerald-50 mb-6 max-w-2xl">
                No Brasil, a distribuição de lucros de uma empresa para seus sócios é <strong>isenta de Imposto de Renda Pessoa Física (IRPF)</strong> e de INSS. Esta é a principal vantagem de ter um CNPJ.
              </p>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 dark:bg-slate-900 ">
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Faturamento Mensal</p>
                  <p className="text-2xl font-bold">{formatCurrency(Number(revenue))}</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Impostos + Despesas (Est.)</p>
                  <p className="text-2xl font-bold text-red-200">-{formatCurrency(Number(revenue) * 0.4)}</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Lucro Distribuído (Isento)</p>
                  <p className="text-3xl font-black text-white">{formatCurrency(Number(revenue) * 0.6)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-3xl border border-border dark:bg-slate-800 ">
              <h4 className="font-bold text-slate-900 mb-4 dark:text-slate-100 ">Como funciona na prática:</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 ">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Você define um <strong>Pró-labore</strong> (salário do sócio) baixo, apenas para contribuir com o INSS e não pagar muito IRPF.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>A empresa paga seus impostos normais (Simples Nacional, por exemplo).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>O que sobra no caixa da empresa é o Lucro.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Você transfere esse lucro para sua conta Pessoa Física <strong>sem pagar nenhum imposto adicional</strong>.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Results Section (Only for Comparativo) */}
      {activeTab === 'comparativo' && Number(revenue) > 0 && (
        <>
          {/* Best Regime Highlight */}
          {bestRegime && worstRegime && (
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-indigo-200 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Regime Ideal Recomendado</span>
                  </div>
                  <h3 className="text-4xl font-black mb-4">{bestRegime.regime}</h3>
                  
                  <div className="bg-white/10 rounded-2xl p-4 inline-block border border-white/20 dark:bg-slate-900 ">
                    <p className="text-indigo-200 text-sm mb-1">Economia anual vs pior cenário ({worstRegime.regime})</p>
                    <p className="text-3xl font-bold text-emerald-300">
                      💰 {formatCurrency(worstRegime.annualTax - bestRegime.annualTax)} / ano
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl min-w-[250px] shrink-0 dark:bg-slate-900 ">
                  <p className="text-indigo-200 text-sm font-medium mb-1">Custo Total Mensal Estimado</p>
                  <p className="text-3xl font-bold mb-4">{formatCurrency(bestRegime.monthlyTax)}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-indigo-200">Carga Tributária Efetiva</span>
                    <span className="font-bold bg-white/20 px-2 py-1 rounded-lg dark:bg-slate-900 ">{bestRegime.effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl dark:bg-slate-900 " />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full -ml-10 -mb-10 blur-2xl" />
            </div>
          )}

          {/* Visual Advantage Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h3 className="text-lg font-bold text-slate-900 mb-6 dark:text-slate-100 ">Custo Tributário Relativo</h3>
            <div className="space-y-4">
              {chartData.sort((a, b) => a['Imposto Anual'] - b['Imposto Anual']).map((item) => {
                const maxTax = worstRegime?.annualTax || 1;
                const percentage = (item['Imposto Anual'] / maxTax) * 100;
                const isBest = item.name === bestRegime?.regime;
                
                return (
                  <div key={item.name} className="relative">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300 ">{item.name}</span>
                      <span className="font-bold text-foreground ">{formatCurrency(item['Imposto Anual'] / 12)} / mês</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800  rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isBest ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600 '}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {results.map((res) => (
              <button
                key={res.regime}
                onClick={() => setSelectedRegimeName(res.regime)}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  selectedRegime?.regime === res.regime 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30  border-indigo-200 dark:border-indigo-700  ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 contrast:ring-offset-slate-800' 
                    : 'bg-white dark:bg-slate-800  border-slate-200 dark:border-slate-700  hover:border-indigo-300 dark:hover:border-indigo-500 contrast:hover:border-indigo-500 hover:shadow-md'
                } ${!res.isAllowed ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-foreground ">{res.regime}</h4>
                  {bestRegime?.regime === res.regime && (
                    <span className="bg-emerald-100 dark:bg-emerald-900/40  text-emerald-700 dark:text-emerald-300  text-[10px] font-bold px-2 py-1 rounded-md uppercase">Melhor</span>
                  )}
                </div>
                
                {res.isAllowed ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Mensal</p>
                      <p className="text-lg font-bold text-foreground ">{formatCurrency(res.monthlyTax)}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Alíquota</span>
                      <span className="text-sm font-bold text-indigo-600">{res.effectiveRate.toFixed(2)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" /> Não permitido
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{res.disallowReason}</p>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Detailed View */}
          {selectedRegime && selectedRegime.isAllowed && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Breakdown */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-foreground ">Composição: {selectedRegime.regime}</h3>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-48 h-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={selectedRegime.breakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {selectedRegime.breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex-1 w-full space-y-3">
                    {selectedRegime.breakdown.map((item, index) => (
                      <div key={item.name} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl dark:bg-slate-800 ">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ">{item.name}</span>
                        </div>
                        <span className="font-bold text-foreground ">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20  rounded-xl border border-indigo-100 dark:border-indigo-800  mt-4">
                      <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100 ">Total Mensal</span>
                      <span className="font-black text-indigo-700 dark:text-indigo-300 ">{formatCurrency(selectedRegime.monthlyTax)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
                <div className="flex items-center gap-2 mb-6">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-foreground ">Por que escolher este regime?</h3>
                </div>
                
                <ul className="space-y-4">
                  {selectedRegime.explanation.map((exp, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className={`mt-0.5 ${exp.startsWith('✔') ? 'text-emerald-500' : exp.startsWith('❌') ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {exp.charAt(0)}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 ">{exp.substring(1).trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
