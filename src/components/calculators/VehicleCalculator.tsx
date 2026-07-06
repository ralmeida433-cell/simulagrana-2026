import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Car, TrendingDown, TrendingUp, Calendar, Info, Search, Gauge, ShieldCheck, Settings2, ChevronDown, Sparkles } from 'lucide-react';

interface FipeOption {
  nome: string;
  codigo: string;
}

function Autocomplete({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled,
  label
}: { 
  options: FipeOption[], 
  value: string, 
  onChange: (codigo: string) => void, 
  placeholder: string,
  disabled?: boolean,
  label: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const selectedOption = Array.isArray(options) ? options.find(o => o.codigo === value) : undefined;
  
  const filteredOptions = Array.isArray(options) ? options.filter(o => 
    o.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50) : [];

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300 ">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : (selectedOption?.nome || '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-2.5 pr-10 border border-slate-300 dark:border-slate-700  rounded-lg bg-card disabled:bg-slate-50 dark:disabled:bg-slate-800 contrast:disabled:bg-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      
      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100 dark:bg-slate-900  dark:border-slate-800 ">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <li
                key={option.codigo}
                onClick={() => {
                  onChange(option.codigo);
                  setSearchTerm(option.nome);
                  setIsOpen(false);
                }}
                className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 dark:border-slate-800  last:border-0 dark:text-slate-300 "
              >
                {option.nome}
              </li>
            ))
          ) : (
            <li className="px-4 py-2.5 text-sm text-slate-400 italic">Nenhum resultado encontrado</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function VehicleCalculator() {
  const [marcas, setMarcas] = useState<FipeOption[]>([]);
  const [modelos, setModelos] = useState<FipeOption[]>([]);
  const [anos, setAnos] = useState<FipeOption[]>([]);
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedModelo, setSelectedModelo] = useState('');
  const [selectedAno, setSelectedAno] = useState('');
  const [fipeData, setFipeData] = useState<any>(null);
  const [valorPago, setValorPago] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [depreciacaoAnual, setDepreciacaoAnual] = useState('10');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // New fields for detailed valuation
  const [anoFabricacao, setAnoFabricacao] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [estadoConservacao, setEstadoConservacao] = useState('Bom');
  const [historico, setHistorico] = useState('Sem restrições');
  const [versao, setVersao] = useState('Intermediária');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const vPago = parseFloat(valorPago) || 0;
  const vVenda = parseFloat(valorVenda) || 0;
  const lucroPrejuizo = vVenda - vPago;
  const percentual = vPago > 0 ? (lucroPrejuizo / vPago) * 100 : 0;

  useEffect(() => {
    fetch('/api/fipe/marcas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMarcas(data);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedMarca) {
      fetch(`/api/fipe/marcas/${selectedMarca}/modelos`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.modelos)) setModelos(data.modelos);
        })
        .catch(err => console.error(err));
    }
  }, [selectedMarca]);

  useEffect(() => {
    if (selectedMarca && selectedModelo) {
      fetch(`/api/fipe/marcas/${selectedMarca}/modelos/${selectedModelo}/anos`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAnos(data);
        })
        .catch(err => console.error(err));
    }
  }, [selectedMarca, selectedModelo]);

  const getAnalysisDetails = () => {
    if (!showAdvanced) return undefined;
    return {
      anoFabricacao,
      quilometragem,
      estadoConservacao,
      historico,
      versao
    };
  };

  const handleCalculate = async () => {
    if (!selectedMarca || !selectedModelo || !selectedAno) return;
    setLoading(true);
    setCalculating(true);
    try {
      const res = await fetch(`/api/fipe/marcas/${selectedMarca}/modelos/${selectedModelo}/anos/${selectedAno}`);
      const data = await res.json();
      setFipeData(data);
      
      // Simple depreciation logic without AI
      const baseDepreciation = 10; // Default 10%
      let adjustedDepreciation = baseDepreciation;
      
      if (estadoConservacao === 'Excelente') adjustedDepreciation -= 2;
      if (estadoConservacao === 'Regular') adjustedDepreciation += 3;
      if (estadoConservacao === 'Ruim') adjustedDepreciation += 7;
      
      if (historico !== 'Sem restrições') adjustedDepreciation += 5;
      
      const km = parseInt(quilometragem);
      if (km > 100000) adjustedDepreciation += 2;
      if (km > 200000) adjustedDepreciation += 5;

      setDepreciacaoAnual(adjustedDepreciation.toString());
    } catch (error) {
      console.error("Error fetching FIPE data:", error);
    } finally {
      setLoading(false);
      setCalculating(false);
    }
  };

  const valorAtual = fipeData ? parseFloat(fipeData.Valor.replace('R$ ', '').replace('.', '').replace(',', '.')) : 0;

  const projectionData = Array.from({ length: 6 }).map((_, i) => ({
    year: new Date().getFullYear() + i,
    value: valorAtual * Math.pow(1 - parseFloat(depreciacaoAnual) / 100, i)
  }));

  return (
    <div className="p-4 sm:p-6 bg-card rounded-xl shadow-md border border-border">
      <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 flex items-center gap-2">
        <Car className="text-indigo-600" /> Calculadora de Veículos
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Autocomplete 
          label="Marca"
          options={marcas} 
          value={selectedMarca} 
          onChange={(val) => {
            setSelectedMarca(val);
            setSelectedModelo('');
            setSelectedAno('');
          }} 
          placeholder="Digite a marca..."
        />
        <Autocomplete 
          label="Modelo"
          options={modelos} 
          value={selectedModelo} 
          onChange={(val) => {
            setSelectedModelo(val);
            setSelectedAno('');
          }} 
          placeholder="Digite o modelo..."
          disabled={!selectedMarca}
        />
        <Autocomplete 
          label="Ano"
          options={anos} 
          value={selectedAno} 
          onChange={(val) => setSelectedAno(val)} 
          placeholder="Digite o ano..."
          disabled={!selectedModelo}
        />
      </div>

      <div className="mb-6">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          {showAdvanced ? 'Ocultar Avaliação Detalhada' : 'Adicionar Detalhes para Avaliação Precisa (Opcional)'}
        </button>
        
        {showAdvanced && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-muted/30 border border-border rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 dark:bg-slate-800/50">
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Fabricação</label>
              <input type="number" placeholder="Ex: 2018" value={anoFabricacao} onChange={(e) => setAnoFabricacao(e.target.value)} className="w-full p-2 text-sm border border-border rounded bg-card" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><Gauge className="w-3 h-3"/> Quilometragem</label>
              <input type="number" placeholder="Ex: 50000" value={quilometragem} onChange={(e) => setQuilometragem(e.target.value)} className="w-full p-2 text-sm border border-border rounded bg-card" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Estado</label>
              <select value={estadoConservacao} onChange={(e) => setEstadoConservacao(e.target.value)} className="w-full p-2 text-sm border border-border rounded bg-card">
                <option value="Excelente">Excelente (Impecável)</option>
                <option value="Bom">Bom (Uso normal)</option>
                <option value="Regular">Regular (Alguns reparos)</option>
                <option value="Ruim">Ruim (Muitos reparos)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Histórico</label>
              <select value={historico} onChange={(e) => setHistorico(e.target.value)} className="w-full p-2 text-sm border border-border rounded bg-card">
                <option value="Sem restrições">Sem restrições</option>
                <option value="Passagem por leilão">Passado por leilão</option>
                <option value="Sinistro recuperado">Sinistro recup.</option>
                <option value="Alienação fiduciária">Alienação fed.</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><Car className="w-3 h-3"/> Versão</label>
              <select value={versao} onChange={(e) => setVersao(e.target.value)} className="w-full p-2 text-sm border border-border rounded bg-card">
                <option value="Básica">Básica</option>
                <option value="Intermediária">Intermediária</option>
                <option value="Completa">Completa (Top)</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      <button onClick={handleCalculate} disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white p-3 rounded-lg font-black uppercase tracking-widest text-xs transition-all active:scale-95 mb-6 sm:mb-8 shadow-lg shadow-slate-800/20">
        {loading ? 'Processando...' : 'Consultar FIPE'}
      </button>

      {fipeData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div className="lg:col-span-1 p-4 sm:p-5 bg-muted/20 border border-border rounded-xl">
              <h3 className="text-[10px] font-black mb-4 text-muted-foreground uppercase tracking-[0.2em] border-b border-border pb-2">Resumo FIPE</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-card p-2 rounded border border-border/50">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Marca</span>
                  <span className="text-xs font-black text-foreground">{fipeData.Marca}</span>
                </div>
                <div className="flex justify-between items-center bg-card p-2 rounded border border-border/50">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Modelo</span>
                  <span className="text-xs font-black text-foreground truncate max-w-[150px]">{fipeData.Modelo}</span>
                </div>
                <div className="flex justify-between items-center bg-card p-2 rounded border border-border/50">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ano</span>
                  <span className="text-xs font-black text-foreground">{fipeData.AnoModelo}</span>
                </div>
                <div className="pt-3 border-t border-border mt-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Preço Sugerido</span>
                  <span className="text-3xl font-black text-foreground tracking-tighter">{fipeData.Valor}</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
                <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Ajuste de Depreciação (%)</label>
                <div className="relative">
                  <input type="number" value={depreciacaoAnual} onChange={(e) => setDepreciacaoAnual(e.target.value)} className="p-2 border border-border rounded-lg w-full bg-card text-sm font-black" />
                  <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 opacity-50" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 h-64 sm:h-80 p-4 border border-border rounded-xl bg-card shadow-sm">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 text-center">Projeção da Desvalorização (6 Anos)</h3>
              <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={0}>
                <LineChart data={projectionData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis hide axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                    labelStyle={{ color: '#6366f1', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(255,255,255,0.95)' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, strokeWidth: 0, fill: '#6366f1' }} activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {calculating && (
            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-indigo-700 font-medium text-center">
                Buscando dados da Tabela FIPE...
              </p>
            </div>
          )}

          <div className="p-4 sm:p-6 bg-card border border-border rounded-xl shadow-sm">
            <h3 className="text-[10px] font-black mb-4 text-muted-foreground uppercase tracking-[0.2em] border-b border-border pb-2">Simulador Transacional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Valor de Compra (R$)</label>
                <input type="number" placeholder="Ex: 45000" value={valorPago} onChange={(e) => setValorPago(e.target.value)} className="w-full p-2.5 sm:p-3 text-sm border border-border rounded-lg bg-card focus:ring-2 focus:ring-indigo-500 outline-none font-black" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Expectativa de Venda (R$)</label>
                <input type="number" placeholder="Ex: 40000" value={valorVenda} onChange={(e) => setValorVenda(e.target.value)} className="w-full p-2.5 sm:p-3 text-sm border border-border rounded-lg bg-card focus:ring-2 focus:ring-indigo-500 outline-none font-black" />
              </div>
            </div>
            {vPago > 0 && vVenda > 0 && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-4 transition-all duration-500 scale-in-center ${lucroPrejuizo >= 0 ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-red-500/5 border border-red-500/20'}`}>
                <div className={`p-3 rounded-full shadow-lg ${lucroPrejuizo >= 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {lucroPrejuizo >= 0 ? <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${lucroPrejuizo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    Resultado Projetado
                  </p>
                  <p className={`text-xl sm:text-2xl font-black tracking-tighter ${lucroPrejuizo >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {lucroPrejuizo >= 0 ? '+' : ''}{formatCurrency(lucroPrejuizo)}
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${lucroPrejuizo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Variação de {percentual.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
