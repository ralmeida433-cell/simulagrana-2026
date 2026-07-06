import React from 'react';
import { X, Download, Maximize2, Minimize2, Table as TableIcon, BarChart3, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

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

interface FinancingTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FinancingRow[];
  summary: {
    loanAmount: number;
    totalPaid: number;
    totalInterest: number;
    effectiveMonths: number;
    originalMonths: number;
  };
  initialViewMode?: 'table' | 'chart';
}

export default function FinancingTableModal({ isOpen, onClose, data, summary, initialViewMode = 'table' }: FinancingTableModalProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'table' | 'chart'>(initialViewMode);

  React.useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode, isOpen]);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleClose = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
    onClose();
  };

  const downloadCSV = () => {
    const headers = ['Mes', 'Prestacao', 'Amortizacao', 'Juros', 'Amort_Extra', 'Saldo_Devedor', 'Percent_Pago', 'Valor_Real_INPC'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.month,
        row.installment.toFixed(2),
        row.amortization.toFixed(2),
        row.interest.toFixed(2),
        row.extraAmortization.toFixed(2),
        row.balance.toFixed(2),
        row.percentPaid.toFixed(2),
        row.inflationCorrectedInstallment.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `simulacao_financiamento_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 50)) === 0 || i === data.length - 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`bg-card flex flex-col overflow-hidden shadow-2xl border border-border transition-all duration-300 ${
            isFullscreen ? 'fixed inset-0 rounded-none' : 'w-full max-w-7xl h-[90vh] rounded-3xl'
          }`}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-border bg-slate-50 dark:bg-slate-900/50 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Evolução Detalhada</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Análise completa do fluxo de caixa e amortização
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mr-2 md:mr-4">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'table' 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  Tabela
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'chart' 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Gráfico
                </button>
              </div>

              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl transition-colors text-sm font-bold"
                title="Baixar Planilha (CSV)"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:hover:bg-red-500/20 dark:hover:text-red-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-card border-b border-border">
            <div className="p-4 bg-muted/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Total Pago</p>
              <p className="text-base font-bold text-foreground">{formatCurrency(summary.totalPaid)}</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
              <p className="text-[10px] text-orange-600 dark:text-orange-400 uppercase font-bold mb-1">Total de Juros</p>
              <p className="text-base font-bold text-orange-700 dark:text-orange-300">{formatCurrency(summary.totalInterest)}</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">Prazo Efetivo</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                {summary.effectiveMonths} meses
              </p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold mb-1">Redução de Prazo</p>
              <p className="text-base font-bold text-indigo-700 dark:text-indigo-300">
                {summary.originalMonths - summary.effectiveMonths} meses
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Custo/Imóvel</p>
              <p className="text-base font-bold text-foreground">
                {(summary.totalPaid / summary.loanAmount).toFixed(2)}x o valor
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {viewMode === 'table' ? (
              <div className="flex-1 overflow-auto p-6">
                <div className="min-w-[1000px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="sticky top-0 bg-card p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Mês</th>
                        <th className="sticky top-0 bg-card p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Prestação</th>
                        <th className="sticky top-0 bg-card p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Amortização</th>
                        <th className="sticky top-0 bg-card p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Juros</th>
                        <th className="sticky top-0 bg-card p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Amort. Extra</th>
                        <th className="sticky top-0 bg-card p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Saldo Devedor</th>
                        <th className="sticky top-0 bg-card p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">% Pago</th>
                        <th className="sticky top-0 bg-card p-4 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Renda Mínima (30%)</th>
                        <th className="sticky top-0 bg-card p-4 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Valor Real (INPC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {data.map((row) => (
                        <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 text-xs font-medium text-slate-900 dark:text-slate-300">{row.month}</td>
                          <td className="p-4 text-xs font-bold text-foreground">{formatCurrency(row.installment)}</td>
                          <td className="p-4 text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(row.amortization)}</td>
                          <td className="p-4 text-xs text-orange-600 dark:text-orange-400">{formatCurrency(row.interest)}</td>
                          <td className="p-4 text-xs text-indigo-600 dark:text-indigo-400 font-bold">{row.extraAmortization > 0 ? formatCurrency(row.extraAmortization) : '-'}</td>
                          <td className="p-4 text-xs font-medium text-slate-700 dark:text-slate-400">{formatCurrency(row.balance)}</td>
                          <td className="p-4 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500" 
                                  style={{ width: `${row.percentPaid}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">{row.percentPaid.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-bold text-foreground">{formatCurrency(row.suggestedIncome)}</td>
                          <td className="p-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(row.inflationCorrectedInstallment)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-8">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      label={{ value: 'Meses', position: 'insideBottom', offset: -5, fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      name="Saldo Devedor"
                      stroke="#6366f1" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativePaid" 
                      name="Total Pago Acumulado"
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPaid)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
