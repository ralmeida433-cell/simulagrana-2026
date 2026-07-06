import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Zap, Fuel, TrendingUp, Battery, CheckCircle2, XCircle, Search, RefreshCw, Sparkles } from 'lucide-react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, LineChart, Line, Legend } from 'recharts';
import { formatCurrency } from '../../lib/utils';
import { fetchCarSpecs } from '../../services/aiService';

type VehicleType = 'combustion' | 'electric' | 'hybrid';

interface Vehicle {
  name: string;
  type: VehicleType;
  price: number;
  consumption: number; // km/l or km/kWh
  maintenance: number;
  insurance: number;
  ipva: number;
  depreciation: number;
}

const DEFAULT_CAR_1: Vehicle = {
  name: 'Carro a Combustão (Ex: Onix)',
  type: 'combustion',
  price: 90000,
  consumption: 12.0,
  maintenance: 2500,
  insurance: 3000,
  ipva: 3600,
  depreciation: 10
};

const DEFAULT_CAR_2: Vehicle = {
  name: 'Carro Elétrico (Ex: Dolphin)',
  type: 'electric',
  price: 149800,
  consumption: 6.5,
  maintenance: 1000,
  insurance: 4500,
  ipva: 0,
  depreciation: 15
};

export default function ElectricVsGasCalculator() {
  const [car1, setCar1] = useState<Vehicle>(DEFAULT_CAR_1);
  const [car2, setCar2] = useState<Vehicle>(DEFAULT_CAR_2);
  const [isSearching1, setIsSearching1] = useState(false);
  const [isSearching2, setIsSearching2] = useState(false);
  
  // Fuel Prices
  const [gasPrice, setGasPrice] = useState(5.80);
  const [energyPrice, setEnergyPrice] = useState(0.85);
  
  // Usage
  const [kmPerMonth, setKmPerMonth] = useState(1500);
  
  // Advanced
  const [batteryDegradation, setBatteryDegradation] = useState(2); // % per year

  const handleAISearch = async (index: 1 | 2) => {
    const car = index === 1 ? car1 : car2;
    const setCar = index === 1 ? setCar1 : setCar2;
    const setIsSearching = index === 1 ? setIsSearching1 : setIsSearching2;

    if (!car.name || car.name.length < 3) return;

    setIsSearching(true);
    try {
      const specs = await fetchCarSpecs(car.name);
      if (specs) {
        setCar(specs);
      }
    } catch (error) {
      console.error("Error in AI search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const results = useMemo(() => {
    const calculateMonthlyFuel = (car: Vehicle, year: number = 0) => {
      let currentConsumption = car.consumption;
      if (car.type === 'electric' && year > 0) {
        currentConsumption = currentConsumption * Math.pow(1 - (batteryDegradation / 100), year);
      }
      const pricePerUnit = car.type === 'electric' ? energyPrice : gasPrice;
      return (kmPerMonth / (currentConsumption || 1)) * pricePerUnit;
    };

    const monthlyFuel1 = calculateMonthlyFuel(car1);
    const monthlyFuel2 = calculateMonthlyFuel(car2);
    
    const annualExtras1 = car1.maintenance + car1.insurance + car1.ipva;
    const annualExtras2 = car2.maintenance + car2.insurance + car2.ipva;
    
    const totalMonthly1 = monthlyFuel1 + (annualExtras1 / 12);
    const totalMonthly2 = monthlyFuel2 + (annualExtras2 / 12);
    
    // We define "savings" as the difference between the two cars.
    // Let's assume the user is considering Car 2 as the "upgrade" or "alternative" to Car 1.
    const monthlySavings = totalMonthly1 - totalMonthly2; 
    
    const priceDifference = car2.price - car1.price;
    const paybackMonths = priceDifference > 0 && monthlySavings > 0 ? priceDifference / monthlySavings : 0;
    
    // 10-year projection
    let cumulative1 = car1.price;
    let cumulative2 = car2.price;
    
    const projectionData = [];
    
    for (let year = 0; year <= 10; year++) {
      if (year > 0) {
        cumulative1 += (calculateMonthlyFuel(car1, year) * 12) + annualExtras1;
        cumulative2 += (calculateMonthlyFuel(car2, year) * 12) + annualExtras2;
      }
      
      const resale1 = car1.price * Math.pow(1 - (car1.depreciation / 100), year);
      const resale2 = car2.price * Math.pow(1 - (car2.depreciation / 100), year);
      
      projectionData.push({
        year,
        Car1Name: car1.name,
        Car2Name: car2.name,
        CustoReal1: Math.round(cumulative1 - resale1),
        CustoReal2: Math.round(cumulative2 - resale2),
      });
    }
    
    const tenYearSavings = projectionData[10].CustoReal1 - projectionData[10].CustoReal2;
    const isWorthIt = tenYearSavings > 0;

    return {
      monthlyFuel1,
      monthlyFuel2,
      totalMonthly1,
      totalMonthly2,
      monthlySavings,
      priceDifference,
      paybackMonths,
      projectionData,
      tenYearSavings,
      isWorthIt
    };
  }, [car1, car2, gasPrice, energyPrice, kmPerMonth, batteryDegradation]);

  const renderVehicleColumn = (
    car: Vehicle, 
    setCar: React.Dispatch<React.SetStateAction<Vehicle>>, 
    title: string,
    index: 1 | 2,
    isSearching: boolean
  ) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 dark:bg-slate-900  dark:border-slate-800 ">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 min-w-[200px] flex-1 dark:text-slate-100 ">
          {car.type === 'electric' ? <Zap className="w-4 h-4 text-emerald-500 shrink-0" /> : <Fuel className="w-4 h-4 text-red-500 shrink-0" />}
          <span className="truncate">{title}</span>
        </h3>
        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 shrink-0">
          <Sparkles className="w-3 h-3" />
          AI POWERED
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Veículo (Marca/Modelo)</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              value={car.name} 
              onChange={e => setCar({...car, name: e.target.value})} 
              placeholder="Ex: BYD Dolphin Mini"
              className="flex-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-foreground  dark:border-slate-800  dark:bg-slate-800 " 
            />
            <button
              onClick={() => handleAISearch(index)}
              disabled={isSearching || !car.name}
              className="bg-indigo-600 text-white px-4 py-3 sm:py-0 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 sm:min-w-[100px] w-full sm:w-auto"
              title="Preencher automaticamente com IA"
            >
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="text-xs font-bold">Pesquisar</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
            <select value={car.type} onChange={e => setCar({...car, type: e.target.value as VehicleType})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:border-slate-800  dark:bg-slate-800 ">
              <option value="combustion">Combustão</option>
              <option value="electric">Elétrico</option>
              <option value="hybrid">Híbrido</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Preço (R$)</label>
            <input type="number" value={car.price} onChange={e => setCar({...car, price: Number(e.target.value)})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:border-slate-800  dark:bg-slate-800 " />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Consumo ({car.type === 'electric' ? 'km/kWh' : 'km/L'})</label>
          <input type="number" step="0.1" value={car.consumption} onChange={e => setCar({...car, consumption: Number(e.target.value)})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:border-slate-800  dark:bg-slate-800 " />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" title="Manutenção Anual">Manut. (Ano)</label>
            <input type="number" value={car.maintenance} onChange={e => setCar({...car, maintenance: Number(e.target.value)})} className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none dark:border-slate-800  dark:bg-slate-800 " />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" title="Seguro Anual">Seguro (Ano)</label>
            <input type="number" value={car.insurance} onChange={e => setCar({...car, insurance: Number(e.target.value)})} className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none dark:border-slate-800  dark:bg-slate-800 " />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1" title="IPVA Anual">IPVA (Ano)</label>
            <input type="number" value={car.ipva} onChange={e => setCar({...car, ipva: Number(e.target.value)})} className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none dark:border-slate-800  dark:bg-slate-800 " />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Depreciação (%/ano)</label>
          <input type="number" value={car.depreciation} onChange={e => setCar({...car, depreciation: Number(e.target.value)})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:border-slate-800  dark:bg-slate-800 " />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100 ">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Comparador de Veículos Inteligente
          </h2>
          <p className="text-slate-500">Compare custos de combustão, híbridos e elétricos com preenchimento automático via IA.</p>
        </div>
      </div>

      {/* Global Settings */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 dark:text-slate-100 ">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Uso e Preços Globais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">KM rodados por mês</label>
            <input type="number" value={kmPerMonth} onChange={e => setKmPerMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:border-slate-800  dark:bg-slate-800 " />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Preço Gasolina (R$)</label>
            <input type="number" step="0.01" value={gasPrice} onChange={e => setGasPrice(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:border-slate-800  dark:bg-slate-800 " />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Preço Energia (R$/kWh)</label>
            <input type="number" step="0.01" value={energyPrice} onChange={e => setEnergyPrice(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:border-slate-800  dark:bg-slate-800 " />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">Degradação Bateria (%/ano)</label>
            <input type="number" step="0.1" value={batteryDegradation} onChange={e => setBatteryDegradation(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:border-slate-800  dark:bg-slate-800 " />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderVehicleColumn(car1, setCar1, "Veículo 1 (Referência)", 1, isSearching1)}
        {renderVehicleColumn(car2, setCar2, "Veículo 2 (Comparação)", 2, isSearching2)}
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        
        {/* Decision Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-3xl border ${results.isWorthIt ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} flex items-start gap-4`}
        >
          <div className={`p-3 rounded-2xl ${results.isWorthIt ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {results.isWorthIt ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${results.isWorthIt ? 'text-emerald-900' : 'text-red-900'}`}>
              {results.isWorthIt ? `O ${car2.name} é mais vantajoso no longo prazo!` : `O ${car1.name} ainda é mais vantajoso.`}
            </h3>
            <p className={`mt-1 ${results.isWorthIt ? 'text-emerald-700' : 'text-red-700'}`}>
              {results.isWorthIt 
                ? `Considerando todos os custos e a revenda, você economizará ${formatCurrency(results.tenYearSavings)} em 10 anos escolhendo o Veículo 2.` 
                : `O custo extra não se paga com a economia mensal. O Veículo 1 é ${formatCurrency(Math.abs(results.tenYearSavings))} mais barato em 10 anos.`}
            </p>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Diferença Mensal</h4>
            <p className={`text-3xl font-black ${results.monthlySavings > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {results.monthlySavings > 0 ? '+' : ''}{formatCurrency(results.monthlySavings)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Economia do Veículo 2 vs 1</p>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Payback (Retorno)</h4>
            <p className="text-3xl font-black text-foreground ">
              {results.paybackMonths > 0 
                ? `${Math.floor(results.paybackMonths / 12)} anos e ${Math.round(results.paybackMonths % 12)} meses` 
                : (results.priceDifference <= 0 ? 'Imediato (Mais barato)' : 'Nunca se paga')}
            </p>
            <p className="text-sm text-slate-500 mt-1">Tempo para compensar diferença de preço</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Diferença em 10 Anos</h4>
            <p className={`text-3xl font-black ${results.tenYearSavings > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {results.tenYearSavings > 0 ? '+' : ''}{formatCurrency(results.tenYearSavings)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Custo Real (Gasto - Revenda)</p>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 dark:bg-slate-900  dark:border-slate-800 ">
          <h3 className="text-lg font-bold text-foreground ">Custo Real Acumulado (10 Anos)</h3>
          <p className="text-sm text-slate-500 -mt-4 mb-4">Inclui aquisição, combustível/energia, IPVA, seguro, manutenção e desconta o valor de revenda.</p>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={results.projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="year" 
                  tickFormatter={(val) => `Ano ${val}`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={80}
                />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Ano ${label}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  name={car1.name}
                  dataKey="CustoReal1" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  name={car2.name}
                  dataKey="CustoReal2" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900  dark:border-slate-800 ">
          <h3 className="text-lg font-bold text-slate-900 mb-4 dark:text-slate-100 ">Detalhamento Mensal</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border dark:bg-slate-800 ">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">Categoria</th>
                  <th className="px-4 py-3">{car1.name}</th>
                  <th className="px-4 py-3 rounded-tr-xl">{car2.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground ">Combustível / Energia</td>
                  <td className="px-4 py-3 text-red-600">{formatCurrency(results.monthlyFuel1)}</td>
                  <td className="px-4 py-3 text-emerald-600">{formatCurrency(results.monthlyFuel2)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground ">Manutenção (Mensalizada)</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 ">{formatCurrency(car1.maintenance / 12)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 ">{formatCurrency(car2.maintenance / 12)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground ">Seguro (Mensalizado)</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 ">{formatCurrency(car1.insurance / 12)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 ">{formatCurrency(car2.insurance / 12)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground ">IPVA (Mensalizado)</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 ">{formatCurrency(car1.ipva / 12)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 ">{formatCurrency(car2.ipva / 12)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold dark:bg-slate-800 ">
                  <td className="px-4 py-4 text-foreground ">Custo Total Mensal</td>
                  <td className="px-4 py-4 text-red-600">{formatCurrency(results.totalMonthly1)}</td>
                  <td className="px-4 py-4 text-emerald-600">{formatCurrency(results.totalMonthly2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

