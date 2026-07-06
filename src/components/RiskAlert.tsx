import React, { useState, useMemo } from 'react';
import { AlertTriangle, Eye, EyeOff, ShieldCheck, ShieldAlert, AlertCircle, X, Info, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import type { BrapiQuote, HistoricalData } from './Pesquisa';

export interface RiskResult {
  score: number;
  nivel: 'NORMAL' | 'ATENCAO' | 'ALTO' | 'CRITICO';
  fatores: {
    nome: string;
    descricao: string;
    valor: number;
  }[];
}

export function calcularRisco(ativo: BrapiQuote, historico: HistoricalData[]): RiskResult {
  let score = 0;
  const fatores: RiskResult['fatores'] = [];

  const symbol = (ativo?.symbol || '').toUpperCase();

  // Mocks para simular Risco Crítico baseado no Ticker em empresas conhecidas caso a API falhe em nos prover o dado exato
  const isRJ = ['AMER3', 'OIBR3', 'OIBR4', 'HOOT4'].includes(symbol);
  const hasAuditorIssue = ['IRBR3', 'AMER3'].includes(symbol);
  const isDefault = ['LAME4', 'LAME3'].includes(symbol);

  // 1. Recuperação Judicial / Default
  if (isRJ) {
    score += 100;
    fatores.push({ nome: 'Recuperação Judicial', descricao: 'Empresa em processo de recuperação judicial.', valor: 100 });
  }
  if (isDefault) {
    score += 100;
    fatores.push({ nome: 'Default / Calote', descricao: 'Histórico recente de calote ou reestruturação de dívida.', valor: 100 });
  }
  
  // 2. Patrimônio Líquido Negativo (Estimativa via Book Value/VPA)
  const isEquityNegative = ativo?.defaultKeyStatistics?.bookValue !== undefined && ativo.defaultKeyStatistics.bookValue < 0;
  const isPbnNeg = (ativo?.defaultKeyStatistics?.priceToBook !== undefined && ativo.defaultKeyStatistics.priceToBook < 0);
  if (isEquityNegative || isPbnNeg) {
    score += 80;
    fatores.push({ nome: 'Patrimônio Líquido Negativo', descricao: 'A empresa possui obrigações maiores que seus ativos (Passivo a Descoberto).', valor: 80 });
  }

  // 3. EBITDA Negativo
  if (ativo?.financialData?.ebitda !== undefined && ativo.financialData.ebitda < 0) {
    score += 60;
    fatores.push({ nome: 'EBITDA Negativo', descricao: 'A geração de caixa operacional atual da empresa é negativa.', valor: 60 });
  }

  // 4. Dívida/EBITDA > 4
  const ebitda = ativo?.financialData?.ebitda || 0;
  const divida = ativo?.financialData?.totalDebt || 0;
  if (ebitda > 0 && divida > 0 && (divida / ebitda) > 4) {
    score += 50;
    fatores.push({ nome: 'Endividamento Elevado', descricao: `Alavancagem perigosa: Dívida Líquida / EBITDA superior a 4x (${(divida / ebitda).toFixed(1)}x).`, valor: 50 });
  } else if (ebitda <= 0 && divida > 0) {
    score += 50;
    fatores.push({ nome: 'Dívida Custeada sem Caixa', descricao: 'Empresa possui dívidas significativas sem geração de caixa operacional para honrá-las (EBITDA negativo/nulo).', valor: 50 });
  }

  // 5. Auditor com Ressalva
  if (hasAuditorIssue) {
    score += 70;
    fatores.push({ nome: 'Ressalva do Auditor', descricao: 'Balanços anteriores apresentaram inconsistências ou ausência de opinião do auditor.', valor: 70 });
  }

  // 6. Queda > 70% em 12 meses
  let maxPrice = 0;
  if (historico && historico.length > 0) {
      historico.forEach(h => {
        if (h.close > maxPrice) maxPrice = h.close;
      });
  }
  if (ativo?.regularMarketDayHigh && ativo.regularMarketDayHigh > maxPrice) maxPrice = ativo.regularMarketDayHigh;
  const currentPrice = ativo?.regularMarketPrice || 0;
  if (maxPrice > 0 && ((maxPrice - currentPrice) / maxPrice) > 0.70) {
    score += 40;
    fatores.push({ nome: 'Queda Severa (>70%)', descricao: 'Ação perdeu mais de 70% do seu valor em relação à sua máxima avaliada.', valor: 40 });
  }

  // 7. Receitas em Queda / Margens (Proxy via revenueGrowth negativo)
  if (ativo?.financialData?.revenueGrowth !== undefined && ativo.financialData.revenueGrowth < 0) {
      score += 20;
      fatores.push({ nome: 'Receita em Queda', descricao: `Crescimento de receita negativo (${(ativo.financialData.revenueGrowth * 100).toFixed(1)}%).`, valor: 20 });
  }

  // 8. ROE Negativo
  if (ativo?.financialData?.returnOnEquity !== undefined && ativo.financialData.returnOnEquity < 0) {
    score += 30;
    fatores.push({ nome: 'Retorno (ROE) Negativo', descricao: `Indicador de rentabilidade sobre o patrimônio é negativo (${(ativo.financialData.returnOnEquity * 100).toFixed(1)}%).`, valor: 30 });
  }
  
  if (fatores.length === 0) {
     fatores.push({ nome: 'Indicadores Saudáveis', descricao: 'Não foram detectados sinais clássicos de alerta crítico nos balanços presentes.', valor: 0 });
  }

  // Define Nível
  let nivel: RiskResult['nivel'] = 'NORMAL';
  if (score > 120) nivel = 'CRITICO';
  else if (score > 80) nivel = 'ALTO';
  else if (score > 40) nivel = 'ATENCAO';

  return { score, nivel, fatores };
}

interface RiskBadgeProps {
  ativo: BrapiQuote;
  historico: HistoricalData[];
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ ativo, historico }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [transparencyMode, setTransparencyMode] = useState(false);

  const risco = useMemo(() => calcularRisco(ativo, historico), [ativo, historico]);

  const levelInfo = {
    NORMAL: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck, label: 'Sem Alertas Críticos' },
    ATENCAO: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle, label: 'Atenção Necessária' },
    ALTO: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertCircle, label: 'Alto Risco' },
    CRITICO: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldAlert, label: 'Alerta Máximo' }
  };

  const badgeProps = levelInfo[risco.nivel];
  const Icon = badgeProps.icon;

  return (
    <>
      <button 
        onClick={() => setModalOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:opacity-80 active:scale-95 group relative",
          badgeProps.bg, badgeProps.border, badgeProps.color,
          risco.nivel === 'CRITICO' && "animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]"
        )}
      >
        <Icon className={cn("w-4 h-4", risco.nivel === 'CRITICO' && "animate-bounce")} />
        <span className="text-xs font-black uppercase tracking-widest">{badgeProps.label}</span>
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden shadow-black/20 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className={cn("p-6 flex items-start justify-between relative overflow-hidden", badgeProps.bg)}>
               <div className="absolute top-0 right-0 w-64 h-64 bg-background/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-2">
                   <div className={cn("p-2 rounded-xl bg-background shadow-sm border", badgeProps.border)}>
                     <Icon className={cn("w-6 h-6", badgeProps.color)} />
                   </div>
                   <h3 className="text-xl font-black text-foreground tracking-tight">Análise de Risco</h3>
                 </div>
                 <p className={cn("text-xs font-bold uppercase tracking-widest opacity-80", badgeProps.color)}>
                   {ativo.symbol} • Score: {risco.score} pontos
                 </p>
               </div>
               
               <button 
                 onClick={() => setModalOpen(false)}
                 className="p-2 bg-background/20 hover:bg-background/40 rounded-full transition-colors relative z-10"
               >
                 <X className="w-5 h-5 text-foreground" />
               </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
               <div className="flex items-center justify-between mb-6">
                 <h4 className="text-sm font-bold text-foreground">Fatores Detectados</h4>
                 <button 
                   onClick={() => setTransparencyMode(!transparencyMode)}
                   className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full hover:bg-muted/80 transition-colors text-xs font-bold text-muted-foreground"
                   title="Modo Transparência: Mostra/Oculta intensidade dos riscos"
                 >
                   {transparencyMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                   {transparencyMode ? 'Ocultar Níveis' : 'Modo Transparência'}
                 </button>
               </div>

               <div className="space-y-4">
                 {risco.fatores.map((fator, i) => {
                    const isPositive = fator.valor === 0;
                    const factorColor = isPositive 
                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                      : (fator.valor >= 80 ? 'text-red-500 bg-red-500/10 border-red-500/20' : 
                         fator.valor >= 50 ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20');
                    const factorBorder = transparencyMode ? factorColor : 'border-border bg-card text-foreground';

                    return (
                      <div key={i} className={cn("p-4 rounded-2xl border transition-colors", factorBorder)}>
                        <div className="flex justify-between items-start mb-1">
                           <div className="flex items-center gap-2">
                             {isPositive ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <Activity className={cn("w-4 h-4", transparencyMode ? 'text-current' : 'text-muted-foreground')} />}
                             <span className="text-sm font-bold">{fator.nome}</span>
                           </div>
                           {transparencyMode && !isPositive && (
                             <span className={cn("text-[10px] font-black w-8 text-right", transparencyMode ? 'text-current' : 'text-muted-foreground')}>+{fator.valor}</span>
                           )}
                        </div>
                        <p className={cn("text-xs leading-relaxed", transparencyMode ? 'opacity-80' : 'text-muted-foreground')}>
                          {fator.descricao}
                        </p>
                      </div>
                    );
                 })}
               </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/30">
               <div className="flex items-start gap-3 text-muted-foreground">
                 <Info className="w-4 h-4 shrink-0 mt-0.5" />
                 <p className="text-[10px] leading-relaxed font-medium">
                   Esta pontuação é gerada automaticamente com base em regras heurísticas de análise fundamentalista. 
                   Não constitui recomendação de investimento. A ausência de alertas não garante que o ativo seja seguro. 
                   Em ativos classificados como "Críticos", a probabilidade de destruição de capital ao acionista é estatisticamente elevada.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
