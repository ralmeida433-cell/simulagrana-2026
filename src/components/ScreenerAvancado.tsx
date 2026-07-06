import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, ChevronDown, Activity, DollarSign, TrendingUp, ShieldAlert, Award, Star, ListFilter, ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/utils';

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Constantes
const SELIC_ATUAL = 10.5;
const SETORES_PERENES = ['Energia Elétrica', 'Saneamento', 'Seguros', 'Bancos', 'Telecomunicações'];
const PAGE_SIZE = 100;

const TICKERS_BR = [
  "TAEE11","VIVT3","EGIE3","BBSE3","CSMG3","TRPL4","WEGE3","RENT3",
  "RADL3","TOTS3","PRIO3","VALE3","PETR4","BBAS3","ITUB4","BBDC4",
  "CMIG4","GGBR4","CPLE6","EZTC3","SBSP3","LREN3","MGLU3", "CXSE3", "SANB11"
];

// Tipos
type Method = 'bazin' | 'graham' | 'buyhold' | 'dy';

interface AtivoData {
  ticker: string;
  nome: string;
  setor: string;
  preco_atual: number;
  pl: number;
  pvp: number;
  dy_12m: number;
  roe: number;
  margem_liquida: number;
  lpa: number;
  vpa: number;
  payout: number;
  dpa_medio_3a: number;
  anos_pagando_dividendos: number;
  divida_liquida_ebitda: number;
  cagr_lucro_5a: number;
  divida_liquida_pl: number;
  roic: number;
  lucro_positivo_3_anos: boolean;
  roe_minimo_5_anos: number;
  dy_ano1: number;
  dy_ano2: number;
  scores: Record<string, string | null>;
}

export function ScreenerAvancado() {
  const [method, setMethod] = useState<Method>('bazin');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [ativos, setAtivos] = useState<AtivoData[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState({ a: 0, b: 0, c: 0, d: 0, total: 0 });

  // Filtros Bazin
  const [bazinDyMin, setBazinDyMin] = useState(6.0);
  const [bazinPayoutMax, setBazinPayoutMax] = useState(80);
  const [bazinMargem, setBazinMargem] = useState(0);

  // Filtros Graham
  const [grahamPlMax, setGrahamPlMax] = useState(15.0);
  const [grahamPvpMax, setGrahamPvpMax] = useState(1.5);
  const [grahamMargem, setGrahamMargem] = useState(25);

  // BuyHold
  const [bhRoeMin, setBhRoeMin] = useState(15);
  const [bhCagrMin, setBhCagrMin] = useState(10);
  const [bhDivPlMax, setBhDivPlMax] = useState(2);

  // DY Ranking
  const [dyMin, setDyMin] = useState(7);

  // Componente de inicialização (Mock API Fetch for Demo)
  useEffect(() => {
    carregarUniverso();
  }, []);

  const carregarUniverso = async () => {
    setLoading(true);
    try {
      // Em uma integração real, bateríamos na brapi.dev aqui para cada ticker
      // Como simulacao, geramos dados factíveis para os tickers de teste baseados nas métricas reais conhecidas
      const mockData: AtivoData[] = TICKERS_BR.map(ticker => {
        const isBancario = ['ITUB4','BBDC4','BBAS3','SANB11'].includes(ticker);
        const isEnergia = ['TAEE11','EGIE3','TRPL4','CMIG4','CPLE6'].includes(ticker);
        
        const preco = Math.random() * 50 + 5;
        const lpa = preco / (Math.random() * 15 + 3);
        const vpa = preco / (Math.random() * 2 + 0.5);
        const dpa = lpa * (Math.random() * 0.5 + 0.2); // payout 20-70%
        
        return {
          ticker,
          nome: ticker + ' S.A.',
          setor: isBancario ? 'Bancos' : isEnergia ? 'Energia Elétrica' : 'Outros',
          preco_atual: preco,
          pl: preco / lpa,
          pvp: preco / vpa,
          dy_12m: (dpa / preco) * 100,
          roe: (lpa / vpa) * 100,
          margem_liquida: Math.random() * 20 + 5,
          lpa,
          vpa,
          payout: (dpa / lpa) * 100,
          dpa_medio_3a: dpa * 0.9,
          anos_pagando_dividendos: Math.floor(Math.random() * 15) + 1,
          divida_liquida_ebitda: isBancario ? 0 : Math.random() * 3 + 0.5,
          cagr_lucro_5a: Math.random() * 15,
          divida_liquida_pl: Math.random() * 2,
          roic: Math.random() * 15 + 5,
          lucro_positivo_3_anos: true,
          roe_minimo_5_anos: (lpa / vpa) * 100 * 0.7,
          dy_ano1: (dpa/preco)*100 * 0.8,
          dy_ano2: (dpa/preco)*100 * 0.9,
          scores: {}
        };
      });
      
      // TAEE11 hardcoded from prompt
      const taee = mockData.find(a => a.ticker === 'TAEE11');
      if (taee) {
        taee.preco_atual = 38.5;
        taee.dpa_medio_3a = 3.15;
        taee.payout = 82;
        taee.dy_12m = 9.8;
      }
      const wege = mockData.find(a => a.ticker === 'WEGE3');
      if (wege) {
        wege.preco_atual = 44.8;
        wege.dpa_medio_3a = 0.82;
        wege.payout = 28;
        wege.dy_12m = 1.8;
      }
      
      setAtivos(mockData);
      // Run first filter
      setTimeout(() => applyFilters(mockData, method, 1), 500);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ativos.length > 0) {
      applyFilters(ativos, method, 1);
    }
  }, [method, bazinDyMin, bazinPayoutMax, bazinMargem, grahamPlMax, grahamPvpMax, grahamMargem, bhRoeMin, bhCagrMin, bhDivPlMax, dyMin]);

  const calcularBazin = (ativo: AtivoData) => {
    const preco_justo = ativo.dpa_medio_3a / 0.06;
    const margem = ((preco_justo - ativo.preco_atual) / preco_justo) * 100;

    let scorePoints = 0;
    if (ativo.dy_12m >= bazinDyMin) scorePoints++;
    if (ativo.payout <= bazinPayoutMax) scorePoints++;
    if (margem >= bazinMargem) scorePoints++;
    if (ativo.anos_pagando_dividendos >= 5) scorePoints++;

    let score = "D";
    if (scorePoints === 4) score = "A";
    else if (scorePoints === 3) score = "B";
    else if (scorePoints === 2) score = "C";

    return { score, preco_justo, margem, scorePoints };
  };

  const calcularGraham = (ativo: AtivoData) => {
    let valor_graham = 0;
    if (ativo.lpa > 0 && ativo.vpa > 0) {
      valor_graham = Math.sqrt(22.5 * ativo.lpa * ativo.vpa);
    }
    const margem = valor_graham > 0 ? ((valor_graham - ativo.preco_atual) / valor_graham) * 100 : -100;

    let scorePoints = 0;
    if (ativo.pl <= grahamPlMax && ativo.pl > 0) scorePoints++;
    if (ativo.pvp <= grahamPvpMax && ativo.pvp > 0) scorePoints++;
    if (ativo.pl * ativo.pvp <= 22.5 && ativo.pl > 0 && ativo.pvp > 0) scorePoints++;
    if (margem >= grahamMargem) scorePoints++;
    if (ativo.lucro_positivo_3_anos) scorePoints++;
    if (ativo.divida_liquida_ebitda <= 3) scorePoints++;

    let score = "D";
    if (scorePoints >= 5) score = "A";
    else if (scorePoints >= 3) score = "B";
    else if (scorePoints >= 2) score = "C";

    return { score, valor_graham, margem, scorePoints };
  };

  const calcularBuyHold = (ativo: AtivoData) => {
    let scorePoints = 0;
    let totalMax = 7;
    if (ativo.roe >= bhRoeMin) scorePoints++;
    if (ativo.roe_minimo_5_anos >= 12) scorePoints++;
    if (ativo.cagr_lucro_5a >= bhCagrMin) scorePoints++;
    if (ativo.divida_liquida_pl <= bhDivPlMax) scorePoints++;
    if (ativo.margem_liquida > 0) scorePoints++;
    if (ativo.roic >= 12) scorePoints++;
    if (SETORES_PERENES.includes(ativo.setor)) scorePoints++;

    const ratio = scorePoints / totalMax;
    let score = "D";
    if (ratio >= 0.85) score = "A";
    else if (ratio >= 0.65) score = "B";
    else if (ratio >= 0.45) score = "C";

    return { score, scorePoints };
  };

  const calcularDy = (ativo: AtivoData) => {
    let scorePoints = 0;
    if (ativo.dy_12m >= dyMin) scorePoints++;
    if (ativo.dy_ano1 < ativo.dy_ano2 && ativo.dy_ano2 < ativo.dy_12m) scorePoints++;
    if (ativo.payout >= 30 && ativo.payout <= 85) scorePoints++;
    if (ativo.anos_pagando_dividendos >= 5) scorePoints++;
    if (ativo.payout <= 100) scorePoints++;
    if (ativo.dy_12m >= (SELIC_ATUAL * 1.2)) scorePoints++;

    let score = "D";
    if (scorePoints >= 5) score = "A";
    else if (scorePoints >= 4) score = "B";
    else if (scorePoints >= 2) score = "C";

    return { score, scorePoints };
  };

  const applyFilters = (universo: AtivoData[], currentMethod: Method, targetPage: number) => {
    let candidatos = [...universo];
    
    // Filtros e Score
    const evaluated = candidatos.map(ativo => {
      let calcData: any = {};
      if (currentMethod === 'bazin') calcData = calcularBazin(ativo);
      if (currentMethod === 'graham') calcData = calcularGraham(ativo);
      if (currentMethod === 'buyhold') calcData = calcularBuyHold(ativo);
      if (currentMethod === 'dy') calcData = calcularDy(ativo);

      return {
        ...ativo,
        ...calcData,
        scoreText: calcData.score,
        scoreVal: calcData.score === 'A' ? 4 : calcData.score === 'B' ? 3 : calcData.score === 'C' ? 2 : 1
      };
    });

    // Ordenação
    evaluated.sort((a, b) => {
      if (a.scoreVal !== b.scoreVal) return b.scoreVal - a.scoreVal; // Score maior primeiro (A > B > C > D)
      
      if (currentMethod === 'bazin' || currentMethod === 'dy') {
        return b.dy_12m - a.dy_12m;
      }
      if (currentMethod === 'graham') {
         return b.margem - a.margem;
      }
      if (currentMethod === 'buyhold') {
         return b.roe - a.roe;
      }
      return 0;
    });

    // Paginacao simulada
    const total = evaluated.length;
    setHasMore(targetPage * PAGE_SIZE < total);
    
    const slice = evaluated.slice(0, targetPage * PAGE_SIZE);
    
    setResultados(slice);
    setPage(targetPage);

    // Calc stats
    const st = { a: 0, b: 0, c: 0, d: 0, total: total };
    evaluated.forEach(e => {
       if(e.scoreText==='A') st.a++;
       else if(e.scoreText==='B') st.b++;
       else if(e.scoreText==='C') st.c++;
       else st.d++;
    });
    setStats(st);
  };

  const getScoreBadge = (score: string) => {
    switch(score) {
      case 'A': return <span className="bg-[#E1F5EE] text-[#0F6E56] rounded-full px-2.5 py-1 text-xs font-bold">A</span>;
      case 'B': return <span className="bg-[#E6F1FB] text-[#185FA5] rounded-full px-2.5 py-1 text-xs font-bold">B</span>;
      case 'C': return <span className="bg-[#FAEEDA] text-[#854F0B] rounded-full px-2.5 py-1 text-xs font-bold">C</span>;
      default: return <span className="bg-[#FCEBEB] text-[#A32D2D] rounded-full px-2.5 py-1 text-xs font-bold">D</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Métodos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Sistema de Filtro de Oportunidades
          </h2>
          <p className="text-sm text-muted-foreground mt-1 text-balance">
            Analise ações brasileiras usando métodos quantitativos, com critérios dinâmicos. Selic Atual: {SELIC_ATUAL}%
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border">
          {[
            { id: 'bazin', label: 'Bazin' },
            { id: 'graham', label: 'Graham' },
            { id: 'buyhold', label: 'Buy & Hold' },
            { id: 'dy', label: 'Ranking DY' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id as Method)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                method === m.id 
                  ? "bg-[#1D9E75] text-white shadow-sm" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Coluna Esquerda: Filtros e Resumo */}
        <div className="space-y-4 sm:space-y-6">
          
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="text-sm font-bold tracking-wider uppercase text-foreground mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Parâmetros: {method.toUpperCase()}
            </h3>

            {method === 'bazin' && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-muted-foreground">DY Mínimo (%)</span>
                    <span className="font-bold text-foreground">{bazinDyMin}%</span>
                  </div>
                  <input type="range" min="2" max="15" step="0.5" value={bazinDyMin} onChange={e => setBazinDyMin(parseFloat(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-muted-foreground">Payout Máximo (%)</span>
                    <span className="font-bold text-foreground">{bazinPayoutMax}%</span>
                  </div>
                  <input type="range" min="40" max="120" step="5" value={bazinPayoutMax} onChange={e => setBazinPayoutMax(parseFloat(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-muted-foreground">Margem Seg. (%)</span>
                    <span className="font-bold text-foreground">{bazinMargem}%</span>
                  </div>
                  <input type="range" min="-20" max="60" step="5" value={bazinMargem} onChange={e => setBazinMargem(parseFloat(e.target.value))} className="w-full accent-primary" />
                </div>
              </div>
            )}

            {method === 'graham' && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-muted-foreground">P/L Máximo (x)</span>
                    <span className="font-bold text-foreground">{grahamPlMax}</span>
                  </div>
                  <input type="range" min="5" max="30" step="0.5" value={grahamPlMax} onChange={e => setGrahamPlMax(parseFloat(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-muted-foreground">P/VP Máximo (x)</span>
                    <span className="font-bold text-foreground">{grahamPvpMax}</span>
                  </div>
                  <input type="range" min="0.5" max="5" step="0.1" value={grahamPvpMax} onChange={e => setGrahamPvpMax(parseFloat(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-muted-foreground">Margem Seg. Mín. (%)</span>
                    <span className="font-bold text-foreground">{grahamMargem}%</span>
                  </div>
                  <input type="range" min="0" max="60" step="5" value={grahamMargem} onChange={e => setGrahamMargem(parseFloat(e.target.value))} className="w-full accent-primary" />
                </div>
              </div>
            )}

            {method === 'buyhold' && (
               <div className="space-y-5">
               <div>
                 <div className="flex justify-between text-xs mb-1.5">
                   <span className="font-semibold text-muted-foreground">ROE Mínimo (%)</span>
                   <span className="font-bold text-foreground">{bhRoeMin}%</span>
                 </div>
                 <input type="range" min="5" max="30" step="1" value={bhRoeMin} onChange={e => setBhRoeMin(parseFloat(e.target.value))} className="w-full accent-primary" />
               </div>
               <div>
                 <div className="flex justify-between text-xs mb-1.5">
                   <span className="font-semibold text-muted-foreground">CAGR Lucro Mínimo (%)</span>
                   <span className="font-bold text-foreground">{bhCagrMin}%</span>
                 </div>
                 <input type="range" min="0" max="25" step="1" value={bhCagrMin} onChange={e => setBhCagrMin(parseFloat(e.target.value))} className="w-full accent-primary" />
               </div>
             </div>
            )}

            {method === 'dy' && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-muted-foreground">DY Mínimo (%)</span>
                    <span className="font-bold text-foreground">{dyMin}%</span>
                  </div>
                  <input type="range" min="2" max="15" step="0.5" value={dyMin} onChange={e => setDyMin(parseFloat(e.target.value))} className="w-full accent-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-4">
              Resumo do Filtro
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-[#E1F5EE]/50 border border-[#E1F5EE] rounded-xl p-3 text-center">
                 <div className="text-2xl font-black text-[#0F6E56]">{stats.a}</div>
                 <div className="text-[10px] uppercase font-bold text-[#0F6E56]/70">Score A</div>
               </div>
               <div className="bg-[#E6F1FB]/50 border border-[#E6F1FB] rounded-xl p-3 text-center">
                 <div className="text-2xl font-black text-[#185FA5]">{stats.b}</div>
                 <div className="text-[10px] uppercase font-bold text-[#185FA5]/70">Score B</div>
               </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Analisados</span>
              <span className="font-bold">{stats.total} ativos</span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Resultados */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Ativo</th>
                    <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Cotação</th>
                    <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Score</th>
                    <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Critérios Destacados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {resultados.map((ativo, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                             {ativo.ticker.substring(0, 4)}
                           </div>
                           <div>
                             <div className="font-bold text-sm text-foreground">{ativo.ticker}</div>
                             <div className="text-xs text-muted-foreground">{ativo.setor}</div>
                           </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="font-medium text-xs sm:text-sm">{formatCurrency(ativo.preco_atual)}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          {method === 'bazin' && `Justo: ${formatCurrency(ativo.preco_justo)}`}
                          {method === 'graham' && ativo.valor_graham > 0 && `Justo: ${formatCurrency(ativo.valor_graham)}`}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                           {getScoreBadge(ativo.scoreText)}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <span className="sm:hidden mb-1 flex w-full">{getScoreBadge(ativo.scoreText)}</span>
                          {method === 'bazin' && (
                            <>
                              {ativo.dy_12m >= bazinDyMin ? (
                                <span className="bg-[#E1F5EE] text-[#0F6E56] border border-[#5DCAA5]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">DY {formatPercentage(ativo.dy_12m)}</span>
                              ) : (
                                <span className="bg-[#FAEEDA] text-[#854F0B] border border-[#EF9F27]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">DY {formatPercentage(ativo.dy_12m)}</span>
                              )}
                              {ativo.margem >= bazinMargem ? (
                                <span className="bg-[#E1F5EE] text-[#0F6E56] border border-[#5DCAA5]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">Margem {formatPercentage(ativo.margem)}</span>
                              ) : (
                                <span className="bg-[#FAEEDA] text-[#854F0B] border border-[#EF9F27]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">Margem {formatPercentage(ativo.margem)}</span>
                              )}
                            </>
                          )}
                          
                          {method === 'graham' && (
                            <>
                              {ativo.pl <= grahamPlMax ? (
                                <span className="bg-[#E1F5EE] text-[#0F6E56] border border-[#5DCAA5]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">P/L {ativo.pl.toFixed(1)}</span>
                              ) : (
                                <span className="bg-[#FAEEDA] text-[#854F0B] border border-[#EF9F27]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">P/L {ativo.pl.toFixed(1)}</span>
                              )}
                              {ativo.pvp <= grahamPvpMax ? (
                                <span className="bg-[#E1F5EE] text-[#0F6E56] border border-[#5DCAA5]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">P/VP {ativo.pvp.toFixed(1)}</span>
                              ) : (
                                <span className="bg-[#FAEEDA] text-[#854F0B] border border-[#EF9F27]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">P/VP {ativo.pvp.toFixed(1)}</span>
                              )}
                            </>
                          )}

                          {method === 'buyhold' && (
                            <>
                              {ativo.roe >= bhRoeMin ? (
                                <span className="bg-[#E1F5EE] text-[#0F6E56] border border-[#5DCAA5]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">ROE {formatPercentage(ativo.roe)}</span>
                              ) : (
                                <span className="bg-[#FAEEDA] text-[#854F0B] border border-[#EF9F27]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">ROE {formatPercentage(ativo.roe)}</span>
                              )}
                            </>
                          )}
                          
                           {method === 'dy' && (
                            <>
                              {ativo.dy_12m >= dyMin ? (
                                <span className="bg-[#E1F5EE] text-[#0F6E56] border border-[#5DCAA5]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">DY {formatPercentage(ativo.dy_12m)}</span>
                              ) : (
                                <span className="bg-[#FAEEDA] text-[#854F0B] border border-[#EF9F27]/50 rounded-full px-2 py-0.5 text-[10px] font-medium">DY {formatPercentage(ativo.dy_12m)}</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {resultados.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">
                        Nenhum ativo atende aos critérios atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasMore && (
               <div className="p-6 border-t border-border flex flex-col items-center justify-center bg-muted/10">
                 <button 
                  onClick={() => applyFilters(ativos, method, page + 1)}
                  className="px-6 py-2 border border-primary text-primary hover:bg-primary/5 rounded-full text-sm font-semibold transition-colors"
                 >
                   Carregar mais 100
                 </button>
                 <p className="text-xs text-muted-foreground mt-3">
                    Exibindo <strong className="text-foreground">{resultados.length}</strong> de <strong className="text-foreground">{stats.total}</strong> ativos filtrados
                 </p>
               </div>
            )}
          </div>
          
          <div className="bg-[#FAEEDA]/50 border border-[#EF9F27]/30 rounded-xl p-4 flex gap-3 text-sm text-[#854F0B]">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold mb-1">Aviso CVM e Metodológico</p>
              <p className="opacity-80 text-xs">Os resultados acima são gerados de forma quantitativa com base nas fórmulas matemáticas de Bazin, Graham e outros. <strong>Não constitui recomendação de compra ou venda de ativos.</strong> Investimentos em renda variável contêm riscos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
