import React, { useState, useEffect, useRef } from 'react';
import { X, Calculator, TrendingUp, Info, ArrowRight, Minus, Maximize2, ChevronDown, ChevronUp, MapPin, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface IpcaData {
  data: string;
  valor: string;
}

interface IpcaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'standard' | 'advanced';
type IndexType = 'IPCA' | 'INPC' | 'REGIONAL';

// Códigos corretos conforme a API IBGE Agregados v3
// N1 = Brasil, N7 = Região Metropolitana, N6 = Município
const REGIONS = [
  { id: '1',       name: 'Brasil',              level: 'N1' },
  { id: '1501',    name: 'Belém (RM)',           level: 'N7' },
  { id: '2301',    name: 'Fortaleza (RM)',        level: 'N7' },
  { id: '2601',    name: 'Recife (RM)',           level: 'N7' },
  { id: '2901',    name: 'Salvador (RM)',         level: 'N7' },
  { id: '3101',    name: 'Belo Horizonte (RM)',   level: 'N7' },
  { id: '3301',    name: 'Rio de Janeiro (RM)',   level: 'N7' },
  { id: '3501',    name: 'São Paulo (RM)',        level: 'N7' },
  { id: '4101',    name: 'Curitiba (RM)',         level: 'N7' },
  { id: '4301',    name: 'Porto Alegre (RM)',     level: 'N7' },
  { id: '5201',    name: 'Goiânia (RM)',          level: 'N7' },
  { id: '5300108', name: 'Brasília',              level: 'N6' },
  { id: '5002704', name: 'Campo Grande',          level: 'N6' },
  { id: '1200401', name: 'Rio Branco',            level: 'N6' },
  { id: '2111300', name: 'São Luís',              level: 'N6' },
  { id: '2800308', name: 'Aracaju',               level: 'N6' },
  { id: '3205309', name: 'Vitória',               level: 'N6' },
];

const extractSerie = (ibgeData: any[]): Record<string, string> => {
  if (!Array.isArray(ibgeData) || ibgeData.length === 0) return {};
  const resultados = ibgeData[0]?.resultados;
  if (!Array.isArray(resultados) || resultados.length === 0) return {};
  const series = resultados[0]?.series;
  if (!Array.isArray(series) || series.length === 0) return {};
  const serie = series[0]?.serie;
  if (!serie || typeof serie !== 'object') return {};
  return serie;
};

const parseIbgeSerie = (serie: Record<string, string>): IpcaData[] => {
  return Object.entries(serie)
    .filter(([, valor]) => valor !== '-' && valor !== '...' && valor !== null)
    .map(([periodo, valor]) => ({
      data: `01/${periodo.slice(4, 6)}/${periodo.slice(0, 4)}`, // YYYYMM → DD/MM/YYYY
      valor: String(valor),
    }));
};

const sortByDate = (data: IpcaData[]): IpcaData[] =>
  data.sort((a, b) => {
    const [dA, mA, yA] = a.data.split('/');
    const [dB, mB, yB] = b.data.split('/');
    return new Date(`${yA}-${mA}-${dA}`).getTime() - new Date(`${yB}-${mB}-${dB}`).getTime();
  });

export default function IpcaCalculatorModal({ isOpen, onClose }: IpcaCalculatorModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<Mode>('standard');
  const [indexType, setIndexType] = useState<IndexType>('IPCA');
  const [region, setRegion] = useState('1');

  const [series, setSeries] = useState<IpcaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialMonth, setInitialMonth] = useState('');
  const [finalMonth, setFinalMonth] = useState('');
  const [initialValue, setInitialValue] = useState<number>(1000);
  const [investmentReturn, setInvestmentReturn] = useState<number>(10);

  const [result, setResult] = useState<{
    correctedValue: number;
    variation: number;
    realReturn: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, indexType, region]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSeries([]);

    try {
      let data: IpcaData[] = [];

      if (indexType === 'IPCA' || indexType === 'INPC') {
        // BCB SGS — série 433 = IPCA, 188 = INPC
        const seriesId = indexType === 'IPCA' ? '433' : '188';
        const url = `/api/bcb/${seriesId}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);

        const raw = await res.json();
        // BCB já retorna { data: "DD/MM/YYYY", valor: "X.XX" }
        data = raw.filter((item: any) => item.valor && item.valor !== '');

      } else {
        // IBGE SIDRA
        const regionData = REGIONS.find(r => r.id === region)!;
        const localidades =
          regionData.level === 'N1'
            ? 'N1[all]'
            : `${regionData.level}[${regionData.id}]`;

        if (regionData.level === 'N1') {
          // Tabela 1737 tem a série histórica completa para o Brasil
          const url = `/api/ibge/1737/63?localidades=${encodeURIComponent(localidades)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);
          const raw = await res.json();
          data = parseIbgeSerie(extractSerie(raw));
        } else {
          // Para regiões (N6, N7), a tabela 1737 não funciona (retorna 500).
          // Precisamos juntar a 7060 (2020+) e 1419 (2012-2019) para ter os últimos 10 anos.
          const url7060 = `/api/ibge/7060/63?localidades=${encodeURIComponent(localidades)}`;
          const url1419 = `/api/ibge/1419/63?localidades=${encodeURIComponent(localidades)}`;
          
          const [res7060, res1419] = await Promise.all([
            fetch(url7060),
            fetch(url1419)
          ]);
          
          if (!res7060.ok) throw new Error(`Servidor (7060) retornou ${res7060.status}`);
          if (!res1419.ok) throw new Error(`Servidor (1419) retornou ${res1419.status}`);
          
          const raw7060 = await res7060.json();
          const raw1419 = await res1419.json();
          
          const serie7060 = extractSerie(raw7060);
          const serie1419 = extractSerie(raw1419);
          
          data = parseIbgeSerie({ ...serie1419, ...serie7060 });
        }
      }

      const sorted = sortByDate(data);

      if (sorted.length === 0) {
        throw new Error('Nenhum dado disponível para o período solicitado.');
      }

      setSeries(sorted);
      setInitialMonth(sorted[sorted.length - 13]?.data ?? sorted[0].data);
      setFinalMonth(sorted[sorted.length - 1].data);

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message ?? 'Erro desconhecido ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const calculate = () => {
    if (!series.length) return;

    const startIdx = series.findIndex(s => s.data === initialMonth);
    const endIdx   = series.findIndex(s => s.data === finalMonth);

    if (startIdx === -1 || endIdx === -1) return;

    const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    const periodData = series.slice(from, to + 1);

    let cumulativeFactor = 1;
    periodData.forEach(item => {
      const val = parseFloat(item.valor.replace(',', '.'));
      if (!isNaN(val)) cumulativeFactor *= 1 + val / 100;
    });

    const variation  = (cumulativeFactor - 1) * 100;
    const realReturn = ((1 + investmentReturn / 100) / cumulativeFactor - 1) * 100;

    setResult({
      correctedValue: initialValue * cumulativeFactor,
      variation,
      realReturn,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{
          opacity: 1, scale: 1, y: 0,
          width:  isMinimized ? 280 : 500,
          height: isMinimized ? 'auto' : 650,
        }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-[100] bg-card rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-emerald-600 p-4 text-white flex items-center justify-between cursor-move">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <span className="font-bold text-sm">Calculadora de Inflação Real</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-lg">
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Modo */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
              <button
                onClick={() => { setMode('standard'); setIndexType('IPCA'); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${mode === 'standard' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
              >
                Básico (BCB)
              </button>
              <button
                onClick={() => { setMode('advanced'); setIndexType('REGIONAL'); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${mode === 'advanced' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
              >
                Avançado (SIDRA)
              </button>
            </div>

            {/* Índice */}
            {mode === 'standard' && (
              <div className="grid grid-cols-2 gap-2">
                {(['IPCA', 'INPC'] as IndexType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setIndexType(type)}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-colors ${indexType === type ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-500'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {/* Região */}
            {mode === 'advanced' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Região / Município</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs"
                >
                  {REGIONS.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                <strong>Erro:</strong> {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-center text-xs text-slate-400 py-4 animate-pulse">
                Carregando dados…
              </div>
            )}

            {/* Seleção de período */}
            {!loading && series.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Início</label>
                    <select
                      value={initialMonth}
                      onChange={(e) => setInitialMonth(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs"
                    >
                      {series.map(s => (
                        <option key={s.data} value={s.data}>{s.data}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fim</label>
                    <select
                      value={finalMonth}
                      onChange={(e) => setFinalMonth(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs"
                    >
                      {series.map(s => (
                        <option key={s.data} value={s.data}>{s.data}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Valor (R$)</label>
                    <input
                      type="number"
                      value={initialValue}
                      onChange={(e) => setInitialValue(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Retorno Nominal (%)</label>
                    <input
                      type="number"
                      value={investmentReturn}
                      onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={calculate}
                  className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm hover:bg-emerald-700 transition-colors"
                >
                  Calcular Rentabilidade Real
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Resultado */}
            {result && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Rentabilidade Real</span>
                  <span className={`text-lg font-bold ${result.realReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {result.realReturn.toFixed(2)}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px]">
                  <div>
                    <p className="text-slate-400 font-bold uppercase">Inflação Acumulada</p>
                    <p className="font-bold">{result.variation.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase">Valor Corrigido</p>
                    <p className="font-bold">{formatCurrency(result.correctedValue)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
