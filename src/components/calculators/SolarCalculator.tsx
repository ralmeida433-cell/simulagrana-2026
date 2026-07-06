import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Search, MapPin, Zap, Info, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { FinanceData, fetchEnergyTariff, EnergyTariff, fetchConcessionaires } from '../../services/financeService';
import { fetchSolarData } from '../../services/aiService';

interface SolarCalculatorProps {
  financeData: FinanceData;
}

export default function SolarCalculator({ financeData }: SolarCalculatorProps) {
  const [monthlyBill, setMonthlyBill] = useState<string | number>('');
  const [monthlyConsumption, setMonthlyConsumption] = useState<string | number>(500);
  const [teTariff, setTeTariff] = useState<string | number>(0.40);
  const [tusdTariff, setTusdTariff] = useState<string | number>(0.45);
  const [icms, setIcms] = useState<string | number>(25);
  const [fioB, setFioB] = useState<string | number>(0.25);
  const [clientType, setClientType] = useState<'GD1' | 'GD2'>('GD2');
  const [selfConsumption, setSelfConsumption] = useState<string | number>(30);
  const [connectionType, setConnectionType] = useState<'monofasico' | 'bifasico' | 'trifasico'>('bifasico');
  const [hsp, setHsp] = useState<string | number>(5.2);
  const [availableArea, setAvailableArea] = useState<string | number>('');
  const [capexPerKwp, setCapexPerKwp] = useState<string | number>(financeData.solarCostPerKwp);
  const [availabilityCost, setAvailabilityCost] = useState<string | number>(50); 
  const [maintenanceRate, setMaintenanceRate] = useState<string | number>(0.5); 
  const [panelDegradation, setPanelDegradation] = useState<string | number>(0.5);
  const [efficiency, setEfficiency] = useState<string | number>(95); 
  const [energyInflation, setEnergyInflation] = useState<string | number>(8); 
  const [locationQuery, setLocationQuery] = useState('');
  const [concessionaires, setConcessionaires] = useState<string[]>([]);
  const [isFetchingTariff, setIsFetchingTariff] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTariff, setActiveTariff] = useState<EnergyTariff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fullTariff = useMemo(() => {
    const te = Number(teTariff) || 0;
    const tusd = Number(tusdTariff) || 0;
    const tax = Number(icms) || 0;
    return (te + tusd) * (1 + tax / 100);
  }, [teTariff, tusdTariff, icms]);

  // Adjust availability cost based on connection type
  // The AI returns the BIFÁSICO value (50kWh) as baseline
  const currentAvailabilityCost = useMemo(() => {
    const base = Number(availabilityCost) || 0;
    if (connectionType === 'monofasico') return (base * 30 / 50).toFixed(2);
    if (connectionType === 'trifasico') return (base * 100 / 50).toFixed(2);
    return base.toFixed(2);
  }, [availabilityCost, connectionType]);

  const handleAISearch = async () => {
    const query = locationQuery.trim();
    if (!query) return;

    setIsAiLoading(true);
    setError(null);
    try {
      const data = await fetchSolarData(query);
      if (data) {
        // Split tarifa_cheia into TE and TUSD (roughly 45/55)
        setTeTariff((data.tarifa_cheia * 0.45).toFixed(4));
        setTusdTariff((data.tarifa_cheia * 0.55).toFixed(4));
        setFioB(data.fio_b.toFixed(4));
        setHsp(data.hsp);
        setIcms(data.aliquota_icms * 100);
        setCapexPerKwp(data.capex_sugerido);
        setAvailabilityCost(data.taxa_minima);
        setSelfConsumption(data.autoconsumo * 100);
        setLocationQuery(data.concessionaria);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError('IA não conseguiu obter dados para esta região. Tente informar o estado.');
      }
    } catch (err) {
      setError('Erro ao consultar IA. Tente novamente.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSearch = async () => {
    const query = locationQuery.trim().toUpperCase();
    if (!query) return;
    
    setIsFetchingTariff(true);
    setError(null);
    setShowSuccess(false);
    setConcessionaires([]);

    try {
      if (query.length === 2) {
        const list = await fetchConcessionaires(query);
        if (list && list.length > 0) {
          setConcessionaires(list);
          if (list.length === 1) {
            handleSelectConcessionaire(list[0]);
          }
        } else {
          setError(`Nenhuma concessionária encontrada para o estado ${query}.`);
        }
      } else {
        const data = await fetchEnergyTariff(query);
        if (data) {
          // Estimate TE and TUSD from full tariff (roughly 45/55 split)
          setTeTariff((data.tarifa_cheia * 0.45).toFixed(4));
          setTusdTariff((data.tarifa_cheia * 0.55).toFixed(4));
          setFioB(data.fio_b);
          setActiveTariff(data);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } else {
          setError('Não encontramos dados para esta busca. Tente a UF (ex: SP).');
        }
      }
    } catch (err) {
      setError('Erro ao buscar dados. Tente novamente.');
    } finally {
      setIsFetchingTariff(false);
    }
  };

  const handleSelectConcessionaire = async (name: string) => {
    setIsFetchingTariff(true);
    setError(null);
    setLocationQuery(name);
    try {
      const data = await fetchEnergyTariff(name);
      if (data) {
        setTeTariff((data.tarifa_cheia * 0.45).toFixed(4));
        setTusdTariff((data.tarifa_cheia * 0.55).toFixed(4));
        setFioB(data.fio_b);
        setActiveTariff(data);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setConcessionaires([]);
      } else {
        setError('Não foi possível carregar a tarifa para esta concessionária.');
      }
    } catch (err) {
      setError('Erro ao buscar tarifa da concessionária.');
    } finally {
      setIsFetchingTariff(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const solarInfo = useMemo(() => {
    const consumptionKwh = Number(monthlyConsumption) || (Number(monthlyBill) / (fullTariff || 1)) || 500;
    const eff = Number(efficiency) || 0;
    const h = Number(hsp) || 5.2;
    
    // kWp = (kWh/month) / (HSP * 30 days * 0.80 efficiency)
    const neededKwp = (consumptionKwh / (h * 30 * 0.80)) * (eff / 100); 
    const suggestedCost = neededKwp * Number(capexPerKwp);
    
    return { consumptionKwh, neededKwp, suggestedCost };
  }, [monthlyConsumption, monthlyBill, fullTariff, efficiency, hsp, capexPerKwp]);

  const [systemCost, setSystemCost] = useState<string | number>(Math.round(solarInfo.suggestedCost));

  // Update system cost when suggested cost changes significantly
  React.useEffect(() => {
    setSystemCost(Math.round(solarInfo.suggestedCost));
  }, [solarInfo.suggestedCost]);

  const simulation = useMemo(() => {
    const data = [];
    let accumulatedSavings = 0;
    let accumulatedCostWithoutSolar = 0;
    let accumulatedCostWithSolar = 0;
    
    const consumptionKwh = Number(monthlyConsumption) || (Number(monthlyBill) / (fullTariff || 1)) || 500;
    const bill = consumptionKwh * fullTariff;
    const initialCost = Number(systemCost) || 0;
    const eff = Number(efficiency) || 0;
    const inf = Number(energyInflation) || 0;
    const selfConsRate = (Number(selfConsumption) || 30) / 100;
    const deg = (Number(panelDegradation) || 0.5) / 100;
    const maintRate = (Number(maintenanceRate) || 0.5) / 100;
    const availCost = Number(currentAvailabilityCost) || 0;
    const fB = Number(fioB) || 0;
    
    let currentFullTariff = fullTariff;
    let currentFioB = fB;
    let currentGeneration = consumptionKwh * (eff / 100);
    let currentAvailCost = availCost;
    let paybackFound = false;
    let paybackYear = 0;

    // Initial investment is a negative cash flow
    accumulatedCostWithSolar = initialCost;

    for (let year = 1; year <= 25; year++) {
      // Annual consumption
      const annualConsumptionKwh = consumptionKwh * 12;
      const annualGenerationKwh = currentGeneration * 12;
      
      // Self-consumption: energy used directly
      const selfConsumedAnnual = annualGenerationKwh * selfConsRate;
      // Injected energy: energy sent to the grid
      const injectedAnnual = annualGenerationKwh * (1 - selfConsRate);
      
      // Savings from self-consumption (100% of tariff)
      const savingsSelfCons = selfConsumedAnnual * currentFullTariff;
      
      // Savings from injected energy (compensated)
      // For GD2 in 2026: pays 60% of Fio B
      const fioBCharge = clientType === 'GD2' ? (currentFioB * 0.6) : 0;
      const compensatedTariff = currentFullTariff - fioBCharge;
      
      // We can only compensate up to the consumption (simplified)
      const compensatedKwh = Math.min(injectedAnnual, annualConsumptionKwh - selfConsumedAnnual);
      const savingsInjected = compensatedKwh * compensatedTariff;
      
      const annualSavings = savingsSelfCons + savingsInjected;
      
      // Maintenance cost
      const annualMaintenance = initialCost * maintRate;
      
      const annualCostWithoutSolar = annualConsumptionKwh * currentFullTariff;
      accumulatedCostWithoutSolar += annualCostWithoutSolar;
      
      // Cost with solar: (Remaining Consumption * Tariff) + Fio B Charges + Availability Cost + Maintenance
      // Simplified: CostWithoutSolar - Savings + Availability + Maintenance
      const annualCostWithSolar = Math.max(currentAvailCost * 12, annualCostWithoutSolar - annualSavings) + annualMaintenance;
      accumulatedCostWithSolar += annualCostWithSolar;

      // Real savings for payback: CostWithoutSolar - CostWithSolar
      const realAnnualSavings = annualCostWithoutSolar - (Math.max(currentAvailCost * 12, annualCostWithoutSolar - annualSavings) + annualMaintenance);
      accumulatedSavings += realAnnualSavings;

      if (!paybackFound && accumulatedSavings >= initialCost) {
        paybackFound = true;
        paybackYear = year;
      }

      data.push({
        year,
        annualSavings: Math.round(realAnnualSavings),
        accumulatedSavings: Math.round(accumulatedSavings),
        costWithoutSolar: Math.round(accumulatedCostWithoutSolar),
        costWithSolar: Math.round(accumulatedCostWithSolar),
        balance: Math.round(accumulatedSavings - initialCost),
        isPayback: paybackFound && paybackYear === year
      });

      // Annual updates
      currentFullTariff *= (1 + inf / 100);
      currentFioB *= (1 + inf / 100);
      currentGeneration *= (1 - deg);
      currentAvailCost *= (1 + inf / 100);
    }

    return { data, paybackYear, totalSavings: accumulatedSavings, totalCostWithoutSolar: accumulatedCostWithoutSolar };
  }, [monthlyBill, systemCost, efficiency, energyInflation, selfConsumption, panelDegradation, fioB, fullTariff, clientType, solarInfo.consumptionKwh, maintenanceRate, availabilityCost]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-slate-100 ">
            <Zap className="w-5 h-5 text-yellow-500" />
            Dados da Instalação
          </h3>
          
          <div className="space-y-4">
            {/* ANEEL & AI Search */}
            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4 dark:border-slate-800  dark:bg-slate-800 ">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Localização (Estado ou Concessionária)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Ex: MG ou CEMIG"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-slate-900  dark:border-slate-800 "
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={isFetchingTariff || isAiLoading || !locationQuery}
                  className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
                  title="Buscar na ANEEL"
                >
                  {isFetchingTariff ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
                <button 
                  onClick={handleAISearch}
                  disabled={isAiLoading || isFetchingTariff || !locationQuery}
                  className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                  title="Preencher com IA (2026)"
                >
                  {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span className="text-[10px] font-bold hidden sm:inline">IA</span>
                </button>
              </div>
              
              {(isFetchingTariff || isAiLoading) && (
                <p className="mt-2 text-[10px] text-slate-400 animate-pulse">
                  {isAiLoading ? 'IA consultando dados regionais 2026...' : 'Buscando dados na ANEEL...'}
                </p>
              )}

              {concessionaires.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Selecione sua Concessionária:</p>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 dark:border-slate-800 ">
                    {concessionaires.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleSelectConcessionaire(name)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors flex items-center justify-between group dark:text-slate-300 "
                      >
                        <span className="truncate">{name}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-2 text-[10px] text-red-500 font-medium">{error}</p>
              )}
              {showSuccess && !error && (
                <p className="mt-2 text-[10px] text-emerald-500 font-bold animate-bounce">✓ Tarifa atualizada com sucesso!</p>
              )}
              {activeTariff && !error && (
                <div className="mt-3 text-[10px] text-emerald-600 font-bold flex flex-col gap-0.5">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {activeTariff.concessionaria} ({activeTariff.uf})
                  </span>
                  <span className="flex items-center gap-1">
                    Bandeira: {activeTariff.bandeira} | Fio B: R$ {activeTariff.fio_b}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Consumo Mensal Médio (kWh)</label>
              <input 
                type="number" 
                value={monthlyConsumption}
                onChange={(e) => setMonthlyConsumption(e.target.value)}
                className="w-full px-4 py-2 bg-white border-2 border-emerald-500 rounded-xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-lg font-bold text-slate-900 dark:bg-slate-900 dark:text-white"
                placeholder="Ex: 500"
              />
              <p className="text-[10px] text-slate-400 mt-1">O valor que você gasta hoje em kWh.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Tipo de Conexão (Custo Disp.)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['monofasico', 'bifasico', 'trifasico'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setConnectionType(type)}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition-all capitalize ${
                      connectionType === type 
                      ? 'bg-yellow-500 border-yellow-500 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-yellow-500 dark:bg-slate-900 dark:border-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">HSP (Horas Sol)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={hsp}
                  onChange={(e) => setHsp(e.target.value)}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Área Disponível (m²)</label>
                <input 
                  type="number" 
                  value={availableArea}
                  onChange={(e) => setAvailableArea(e.target.value)}
                  disabled
                  placeholder="Automático"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Tipo de Cliente (Lei 14.300)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setClientType('GD1')}
                  disabled
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-not-allowed opacity-70 ${
                    clientType === 'GD1' 
                    ? 'bg-yellow-500 border-yellow-500 text-white' 
                    : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                  }`}
                >
                  GD1 (Isento)
                </button>
                <button
                  onClick={() => setClientType('GD2')}
                  disabled
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-not-allowed opacity-70 ${
                    clientType === 'GD2' 
                    ? 'bg-yellow-500 border-yellow-500 text-white' 
                    : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                  }`}
                >
                  GD2 (Taxado)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">TE (R$/kWh)</label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={teTariff}
                  onChange={(e) => setTeTariff(e.target.value)}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">TUSD (R$/kWh)</label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={tusdTariff}
                  onChange={(e) => setTusdTariff(e.target.value)}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">ICMS (%)</label>
                <input 
                  type="number" 
                  value={icms}
                  onChange={(e) => setIcms(e.target.value)}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Fio B (R$/kWh)</label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={fioB}
                  onChange={(e) => setFioB(e.target.value)}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Custo Disponib. (R$)</label>
                <input 
                  type="number" 
                  value={currentAvailabilityCost}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Manutenção Anual (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={maintenanceRate}
                  onChange={(e) => setMaintenanceRate(e.target.value)}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Custo de Instalação (R$/kWp)</label>
              <input 
                type="number" 
                value={capexPerKwp}
                onChange={(e) => setCapexPerKwp(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none dark:border-slate-800 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Autoconsumo Instantâneo (%)</label>
              <input 
                type="number" 
                value={selfConsumption}
                onChange={(e) => setSelfConsumption(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none dark:border-slate-800 dark:bg-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">Energia usada na hora, sem passar pela rede.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Degradação Anual Painéis (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={panelDegradation}
                onChange={(e) => setPanelDegradation(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none dark:border-slate-800 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Conta de Luz Mensal</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                <input 
                  type="number" 
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all dark:border-slate-800  dark:bg-slate-800 "
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Tarifa calculada: R$ {fullTariff.toFixed(2)}/kWh</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Investimento (CAPEX) - R$</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                <input 
                  type="number" 
                  value={systemCost}
                  onChange={(e) => setSystemCost(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none dark:border-slate-800 dark:bg-slate-800"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sugerido para {solarInfo.neededKwp.toFixed(1)} kWp: {formatCurrency(solarInfo.suggestedCost)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Redução Esperada (%)</label>
              <input 
                type="number" 
                value={efficiency}
                onChange={(e) => setEfficiency(e.target.value)}
                disabled
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300 ">Inflação Energética Anual (%)</label>
              <input 
                type="number" 
                value={energyInflation}
                onChange={(e) => setEnergyInflation(e.target.value)}
                disabled
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none dark:border-slate-800 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-bold text-emerald-600 mb-1.5 uppercase tracking-wider">Sua Conta de Luz</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                <input 
                  type="number" 
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(e.target.value)}
                  placeholder="Ex: 500"
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-emerald-500 rounded-xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-lg font-bold text-slate-900 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">Insira o valor médio da sua conta para comparar a economia real.</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
          <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-4">Retorno do Investimento</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-yellow-900">{simulation.paybackYear}</span>
            <span className="text-lg font-bold text-yellow-700">anos</span>
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            Tempo estimado para recuperar o valor investido considerando a Lei 14.300 e inflação energética.
          </p>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
          <h3 className="text-lg font-bold text-slate-900 mb-6 dark:text-slate-100  flex items-center justify-between">
            Fluxo de Caixa e Comparativo
            <span className="text-xs font-normal text-slate-500">Projeção de 25 anos</span>
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={simulation.data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="costWithoutSolar" name="Custo Sem Solar" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.3} />
                <Bar dataKey="costWithSolar" name="Custo Com Solar" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-slate-400 opacity-30"></div>
              <span>Custo Acumulado Sem Solar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
              <span>Custo Acumulado Com Solar (Investimento + Taxas)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 items-start md:col-span-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-blue-800 leading-relaxed">
              <span className="font-bold">Nota sobre Lei 14.300:</span> Esta simulação considera a cobrança gradual do Fio B (TUSD) sobre a energia injetada na rede. Em 2026, o encargo é de 60% do valor do Fio B da sua concessionária, impactando levemente o payback em comparação a anos anteriores.
            </div>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2">Economia Total (25 anos)</h4>
            <p className="text-2xl font-bold text-emerald-900">{formatCurrency(simulation.totalSavings)}</p>
            <p className="text-xs text-emerald-600 mt-1">Lucro líquido: {formatCurrency(simulation.totalSavings - Number(systemCost))}</p>
            <p className="text-[10px] text-emerald-700 mt-2 font-medium">Custo evitado sem solar: {formatCurrency(simulation.totalCostWithoutSolar)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Valorização do Imóvel</h4>
            <p className="text-slate-600 text-sm leading-relaxed dark:text-slate-400 ">
              Estudos indicam que sistemas solares podem valorizar seu imóvel em até <span className="font-bold text-emerald-600">4-6%</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
