import React, { useState, useEffect } from 'react';
import { 
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Trash2,
  DollarSign,
  AlertCircle,
  Briefcase,
  Building2,
  BarChart3,
  Globe,
  Loader2,
  PieChart,
  HelpCircle
} from 'lucide-react';
import { useFavorites, FavoriteAsset, AssetCategory } from '../contexts/FavoritesContext';
import { cn } from '../lib/utils';
import { AssetPrice } from './shared/AssetPrice';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssetDetailsData {
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  currency: string;
  historicalData: any[];
  fundamentals: any;
  loading: boolean;
  error: boolean;
  logourl?: string;
}

const formatLargeNumber = (num?: number) => {
  if (!num) return 'N/D';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + ' B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + ' M';
  return num.toFixed(2);
};

const formatPercent = (val?: number) => {
  if (val === undefined || isNaN(val)) return 'N/D';
  return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
};

// 1. Dicionário determinístico de cores de marcas conhecidas para maior harmonia visual imediata
const BRAND_PRESET_COLORS: Record<string, string> = {
  // Brazilian stocks
  'ITUB4': '#ec7000', // Itaú Orange
  'ITUB3': '#ec7000',
  'BBDC4': '#e8112d', // Bradesco Red
  'BBDC3': '#e8112d',
  'BBAS3': '#fed300', // Banco do Brasil Yellow (accent) or Blue
  'VALE3': '#007e7a', // Vale Teal/Green
  'PETR4': '#00a859', // Petrobras Green
  'PETR3': '#00a859',
  'ABEV3': '#003366', // Ambev Dark Blue
  'MGLU3': '#0086ff', // Magalu Blue
  'ITSA4': '#003d7c', // Itaúsa Blue
  'ITSA3': '#003d7c',
  'WEGE3': '#00579c', // Weg Blue
  'SANB11': '#ec0000', // Santander Red
  'SANB3': '#ec0000',
  'SANB4': '#ec0000',
  'B3SA3': '#002244', // B3 Blue
  'XPBR31': '#ffca00', // XP Yellow
  'ROXO34': '#820ad1', // Nubank Purple
  'NUBR33': '#820ad1',
  'ELET3': '#0072ce', // Eletrobras Blue
  'ELET6': '#0072ce',
  'LREN3': '#e30613', // Renner Red
  'CIEL3': '#0066b2', // Cielo Blue
  'GGBR4': '#003366', // Gerdau Blue
  'USIM5': '#006a4d', // Usiminas Green
  'CSNA3': '#1d4ed8', // CSN Blue

  // US Stocks & Tech
  'AAPL': '#333333',  // Apple Gray/Black
  'MSFT': '#f25022',  // Microsoft Red
  'AMZN': '#ff9900',  // Amazon Orange
  'GOOG': '#4285f4',  // Google Blue
  'GOOGL': '#4285f4',
  'META': '#0081fb',  // Meta Blue
  'NVDA': '#76b900',  // Nvidia Green
  'TSLA': '#cc0000',  // Tesla Red
  'NFLX': '#e50914',  // Netflix Red
  'DIS': '#113ccf',   // Disney Blue
  'NKE': '#111111',   // Nike Black
  'V': '#1a1f71',     // Visa Dark Blue
  'MA': '#eb001b',    // Mastercard Red/Orange
  'JPM': '#0a2240',    // JPMorgan Blue
  'KO': '#f40009',    // Coca-Cola Red
  'PEP': '#004b93',   // Pepsi Blue
  'WMT': '#0071ce',   // Walmart Blue
  'AMD': '#000000',   // AMD Black
  'PYPL': '#003087',  // PayPal Blue
  'SQ': '#00d632',    // Block Green
  'COIN': '#0052ff',  // Coinbase Blue
};

// 2. Extrai ou gera deterministicamente uma cor de acento visual a partir do ticker
function getTickerHexColor(ticker: string): string {
  const clean = ticker.replace('.SA', '').trim().toUpperCase();
  const preset = BRAND_PRESET_COLORS[clean];
  if (preset) return preset;

  // Se não houver preset, gera um hash bonito e estável para o ativo
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Mapeia para HSL equilibrado e converte para Hex
  const h = Math.abs(hash) % 360;
  const s = 65; // Saturação estável para cores modernas
  const l = 45; // Luminosidade equilibrada para excelente visibilidade em temas claros
  
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function darkenHexColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.floor(rgb.r * (1 - percent)));
  const g = Math.max(0, Math.floor(rgb.g * (1 - percent)));
  const b = Math.max(0, Math.floor(rgb.b * (1 - percent)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lightenHexColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * percent));
  const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * percent));
  const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * percent));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 3. Função obrigatória de tratamento de contraste
function adjustColorForContrast(hexColor: string): { bg: string; border: string; text: string; textOnAccent: string; accent: string } {
  const rgb = hexToRgb(hexColor) || { r: 120, g: 120, b: 120 };
  
  // Luminância relativa (padrão WCAG)
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const luminance = a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  
  let adjustedHex = hexColor;
  
  // Se for muito clara no fundo claro (limite > 0.7), escurecemos ela para manter excelente contraste de bordas e textos
  if (luminance > 0.7) {
    adjustedHex = darkenHexColor(hexColor, 0.35);
  } else if (luminance < 0.08) {
    // Se for extremamente escura, clareamos um pouco
    adjustedHex = lightenHexColor(hexColor, 0.25);
  }
  
  const isColorDark = luminance < 0.5;
  const textOnAccent = isColorDark ? '#ffffff' : '#0f172a';
  
  return {
    accent: adjustedHex,
    bg: `${adjustedHex}0c`, // Tint de fundo extremamente sutil (5% opacidade)
    border: `${adjustedHex}2e`, // Borda suave (18% opacidade)
    text: adjustedHex,
    textOnAccent
  };
}

// Componente para exibir o Logo do ativo com fila de fallback dinâmica para evitar links quebrados
interface AssetLogoProps {
  ticker: string;
  logoUrl?: string;
  className?: string;
  accentColors: { bg: string; border: string; text: string; textOnAccent: string; accent: string };
}

const AssetLogo: React.FC<AssetLogoProps> = ({ ticker, logoUrl, className, accentColors }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgStatus, setImgStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  const cleanTicker = ticker.replace('.SA', '').toUpperCase();
  const displayLetters = cleanTicker.slice(0, 2);

  useEffect(() => {
    setImgStatus('loading');
    
    // Lista ordenada de URLs para tentar carregar sequencialmente
    const urlsToTry: string[] = [];
    if (logoUrl) urlsToTry.push(logoUrl);
    urlsToTry.push(`https://s3-symbol-logo.tradingview.com/${cleanTicker.toLowerCase()}--big.svg`);
    urlsToTry.push(`https://assets.brapi.dev/v2/logo/${cleanTicker}.png`);
    urlsToTry.push(`https://logo.clearbit.com/${cleanTicker.toLowerCase()}.com`);
    
    let currentIndex = 0;
    
    const tryLoadImage = (url: string) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        setImgSrc(url);
        setImgStatus('success');
      };
      img.onerror = () => {
        currentIndex++;
        if (currentIndex < urlsToTry.length) {
          tryLoadImage(urlsToTry[currentIndex]);
        } else {
          setImgStatus('error');
        }
      };
      img.src = url;
    };

    if (urlsToTry.length > 0) {
      tryLoadImage(urlsToTry[0]);
    } else {
      setImgStatus('error');
    }
  }, [ticker, logoUrl]);

  if (imgStatus === 'success' && imgSrc) {
    return (
      <div 
        className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border bg-white overflow-hidden p-1 sm:p-1.5 shadow-sm shrink-0",
          className
        )}
        style={{ borderColor: accentColors.border }}
      >
        <img 
          src={imgSrc} 
          alt={ticker} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-lg sm:rounded-xl"
        />
      </div>
    );
  }

  // Fallback se todas as tentativas falharem ou estiver carregando
  return (
    <div 
      className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm shrink-0 select-none",
        className
      )}
      style={{ 
        backgroundColor: accentColors.bg, 
        borderColor: accentColors.border,
        color: accentColors.text 
      }}
    >
      {displayLetters}
    </div>
  );
};

const getRiskAlerts = (fundamentals: any, currentPrice: number, basePrice: number, type: AssetCategory) => {
  const alerts = [];
  const rentabilidade = ((currentPrice - basePrice) / basePrice) * 100;

  if (rentabilidade < -15) {
    alerts.push({ type: 'danger', message: `Queda acentuada de ${Math.abs(rentabilidade).toFixed(1)}% desde que você favoritou o ativo.` });
  }

  if (fundamentals) {
    // Debt alerts (for stocks)
    if (type.includes('Ações') && fundamentals.enterpriseToEbitda && fundamentals.enterpriseToEbitda > 15) {
      alerts.push({ type: 'warning', message: `Múltiplo EV/EBITDA alto (${fundamentals.enterpriseToEbitda.toFixed(1)}x), indicando possível endividamento ou precificação esticada.` });
    }
    
    // Profit margin drops
    if (fundamentals.profitMargins && fundamentals.profitMargins < 0.05 && fundamentals.profitMargins > -1) {
      alerts.push({ type: 'warning', message: `Margem de lucro estreita (${(fundamentals.profitMargins * 100).toFixed(1)}%). A empresa tem pouco espaço para erro.` });
    } else if (fundamentals.profitMargins && fundamentals.profitMargins < 0) {
      alerts.push({ type: 'danger', message: 'A empresa está apresentando prejuízo (margem líquida negativa).' });
    }

    // P/E alerts
    if (fundamentals.trailingPE && fundamentals.trailingPE > 30) {
      alerts.push({ type: 'warning', message: `P/L muito elevado (${fundamentals.trailingPE.toFixed(1)}x), o que pode indicar sobrevalorização em relação ao lucro atual.` });
    } else if (fundamentals.trailingPE && fundamentals.trailingPE < 0) {
       alerts.push({ type: 'danger', message: 'Preço/Lucro negativo, indicando que a empresa não está gerando lucros.' });
    }

    // P/B for FIIs
    if ((type === 'FIIs' || type === 'REITs') && fundamentals.priceToBook) {
      if (fundamentals.priceToBook > 1.2) {
        alerts.push({ type: 'warning', message: `Sendo negociado com ágio relevante (P/VP de ${fundamentals.priceToBook.toFixed(2)}).` });
      } else if (fundamentals.priceToBook < 0.7) {
         alerts.push({ type: 'warning', message: `Desconto muito forte (P/VP de ${fundamentals.priceToBook.toFixed(2)}), pode indicar estresse no portfólio ou oportunidade.` });
      }
    }
  }

  return alerts;
};

export default function Favoritos() {
  const { favorites, removeFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'Todos'>('Todos');
  const [selectedAsset, setSelectedAsset] = useState<FavoriteAsset | null>(null);
  const [assetsData, setAssetsData] = useState<Record<string, AssetDetailsData>>({});

  // 4. Cache persistente de cores para eficiência de renderização
  const [colorCache, setColorCache] = useState<Record<string, { bg: string; border: string; text: string; textOnAccent: string; accent: string }>>(() => {
    const saved = localStorage.getItem('simulagrana_favorites_colors');
    return saved ? JSON.parse(saved) : {};
  });

  const getAssetColors = (ticker: string) => {
    if (colorCache[ticker]) {
      return colorCache[ticker];
    }
    const hex = getTickerHexColor(ticker);
    const adjusted = adjustColorForContrast(hex);
    
    // Atualiza o cache de forma assíncrona para evitar alertas de ciclo de renderização no React
    setTimeout(() => {
      setColorCache(prev => {
        const next = { ...prev, [ticker]: adjusted };
        localStorage.setItem('simulagrana_favorites_colors', JSON.stringify(next));
        return next;
      });
    }, 0);
    
    return adjusted;
  };

  const categories: (AssetCategory | 'Todos')[] = ['Todos', 'Ações BR', 'Ações EUA', 'ETFs', 'FIIs', 'REITs'];

  const filteredFavorites = activeCategory === 'Todos' 
    ? favorites 
    : favorites.filter(f => f.category === activeCategory);

  useEffect(() => {
    // Fetch current data for all favorites
    const fetchAllData = async () => {
      const newAssetsData = { ...assetsData };
      let updated = false;

      for (const asset of favorites) {
        if (!newAssetsData[asset.ticker] || newAssetsData[asset.ticker].error) {
          newAssetsData[asset.ticker] = { loading: true, error: false, regularMarketPrice: 0, regularMarketChangePercent: 0, currency: asset.currency, historicalData: [], fundamentals: null };
          updated = true;
        }
      }
      
      if (updated) {
        setAssetsData(newAssetsData);
      }

      for (const asset of favorites) {
        if (assetsData[asset.ticker] && !assetsData[asset.ticker].loading && !assetsData[asset.ticker].error) {
          continue;
        }

        try {
          const res = await fetch(`/api/fin/${asset.ticker}`);
          if (!res.ok) throw new Error('API Error');
          const data = await res.json();
          
          setAssetsData(prev => ({
            ...prev,
            [asset.ticker]: {
              loading: false,
              error: false,
              regularMarketPrice: data.price || data.regularMarketPrice || 0,
              regularMarketChangePercent: data.changePercent || data.regularMarketChangePercent || 0,
              currency: data.currency || asset.currency,
              fundamentals: data.defaultKeyStatistics || {},
              historicalData: data.historicalPrices || data.historicalDataPrice || [],
              logourl: data.logourl || data.logo || data.logoUrl
            }
          }));
        } catch (error) {
          setAssetsData(prev => ({
            ...prev,
            [asset.ticker]: {
              ...prev[asset.ticker],
              loading: false,
              error: true
            }
          }));
        }
      }
    };

    if (favorites.length > 0) {
      fetchAllData();
    }
  }, [favorites]);

  if (selectedAsset) {
    const data = assetsData[selectedAsset.ticker];
    const isDataLoading = !data || data.loading;
    const currentPrice = data?.regularMarketPrice || selectedAsset.priceAtFavoritation;
    const rentabilidade = ((currentPrice - selectedAsset.priceAtFavoritation) / selectedAsset.priceAtFavoritation) * 100;
    const isPositive = rentabilidade >= 0;
    
    // Obter cores customizadas do ativo
    const colors = getAssetColors(selectedAsset.ticker);

    // Normalização completa do histórico de preços (suporta múltiplos formatos de datas da API e ponto zero)
    const favDate = new Date(selectedAsset.favoritedAt);
    const favTimestamp = favDate.getTime() / 1000;
    
    const parsedHistory = (data?.historicalData || []).map((h: any) => {
      let timestamp = favTimestamp;
      let dateStr = '';
      const close = h.close || h.price || 0;
      
      if (typeof h.date === 'string') {
        const parts = h.date.split('/');
        if (parts.length === 2) {
          const month = parseInt(parts[0], 10) - 1;
          const year = parseInt(parts[1], 10);
          const d = new Date(year, month, 1);
          timestamp = d.getTime() / 1000;
          dateStr = format(d, 'MM/yy');
        } else {
          const d = new Date(h.date);
          timestamp = !isNaN(d.getTime()) ? d.getTime() / 1000 : favTimestamp;
          dateStr = !isNaN(d.getTime()) ? format(d, 'dd/MM') : h.date;
        }
      } else if (typeof h.date === 'number') {
        const isMs = h.date > 5000000000;
        const d = new Date(isMs ? h.date : h.date * 1000);
        timestamp = isMs ? h.date / 1000 : h.date;
        dateStr = format(d, 'dd/MM');
      }
      
      return {
        date: timestamp,
        dateStr,
        close,
        rentabilidade: ((close - selectedAsset.priceAtFavoritation) / selectedAsset.priceAtFavoritation) * 100
      };
    });
    
    // Apenas pontos mais novos ou iguais à data de favoritação
    let filteredHistory = parsedHistory.filter((h: any) => h.date >= favTimestamp - 86400);
    filteredHistory.sort((a, b) => a.date - b.date);
    
    // Garante ponto zero
    if (filteredHistory.length === 0 || filteredHistory[0].date > favTimestamp + 86400) {
       filteredHistory.unshift({
          date: favTimestamp,
          dateStr: format(favDate, 'dd/MM'),
          close: selectedAsset.priceAtFavoritation,
          rentabilidade: 0
       });
    }
    
    // Adiciona ponto atual
    filteredHistory.push({
       date: Date.now() / 1000,
       dateStr: 'Hoje',
       close: currentPrice,
       rentabilidade
    });

    const alerts = getRiskAlerts(data?.fundamentals, currentPrice, selectedAsset.priceAtFavoritation, selectedAsset.category);

    return (
      <div className="w-full min-w-0 space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20 max-w-7xl mx-auto px-1 sm:px-0">
        <button 
          onClick={() => setSelectedAsset(null)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-all duration-200 mb-2 px-3 py-1.5 rounded-xl hover:bg-muted font-bold text-sm w-fit"
        >
          &larr; Voltar para a lista
        </button>

        {/* Card do Ativo Customizado com a Cor de Acento */}
        <div 
          className="w-full bg-card border p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm relative overflow-hidden group transition-all duration-300"
          style={{ borderColor: colors.border }}
        >
          {/* Brilho da cor de acento de marca no fundo */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-10 pointer-events-none"
            style={{ backgroundColor: colors.accent }}
          />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-4 sm:gap-6 md:items-center justify-between">
             <div className="flex items-center gap-3 sm:gap-4">
                <AssetLogo 
                  ticker={selectedAsset.ticker} 
                  logoUrl={data?.logourl} 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border shadow-lg"
                  accentColors={colors}
                />
                <div className="min-w-0">
                   <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tighter truncate max-w-[180px] sm:max-w-md">{selectedAsset.ticker}</h1>
                   <p className="text-sm sm:text-lg text-muted-foreground font-medium truncate max-w-[180px] sm:max-w-md">{selectedAsset.name}</p>
                </div>
             </div>
             
             <div className="flex flex-col md:items-end mt-2 md:mt-0">
               <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Cotação Atual</p>
               {isDataLoading ? (
                 <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-muted-foreground" />
               ) : (
                 <>
                   <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground font-mono">
                     <AssetPrice price={currentPrice} currency={selectedAsset.currency} ticker={selectedAsset.ticker} />
                   </h2>
                   <div className={cn(
                     "flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2 px-3 sm:py-1.5 py-1 rounded-xl text-xs sm:text-sm font-black w-fit border shadow-sm",
                     isPositive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                   )}>
                     {isPositive ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                     <span>Rentabilidade: {formatPercent(rentabilidade)}</span>
                   </div>
                 </>
               )}
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-10 pt-6 border-t border-border/50">
             <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-black uppercase mb-1">Favoritado em</p>
                <p className="text-sm sm:text-lg font-bold">{format(parseISO(selectedAsset.favoritedAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
             </div>
             <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-black uppercase mb-1">Preço Inicial (Ponto Zero)</p>
                <p className="text-sm sm:text-lg font-bold font-mono"><AssetPrice price={selectedAsset.priceAtFavoritation} currency={selectedAsset.currency} ticker={selectedAsset.ticker} /></p>
             </div>
             <div className="flex justify-start sm:col-span-2 md:col-span-1 md:justify-end">
                <button 
                  onClick={() => {
                    removeFavorite(selectedAsset.ticker);
                    setSelectedAsset(null);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-bold text-sm h-fit border border-red-500/10 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" /> Deixar de Acompanhar
                </button>
             </div>
          </div>
        </div>

        {/* Evolução da Rentabilidade com Linha Personalizada de Acordo com a Cor de Acento do Ativo */}
        <div className="bg-card border border-border rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm overflow-hidden">
           <div className="flex items-center gap-3 mb-6">
              <div 
                className="p-2 sm:p-2.5 rounded-xl border"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              >
                 <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-foreground">Evolução da Rentabilidade (Ponto Zero)</h3>
           </div>
           
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={filteredHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                    <XAxis 
                      dataKey="dateStr" 
                      stroke="currentColor" 
                      className="text-muted-foreground text-xs font-bold"
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="currentColor" 
                      className="text-muted-foreground text-xs font-mono font-bold"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
                      domain={['auto', 'auto']}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: colors.border, 
                        borderRadius: '1rem', 
                        color: 'hsl(var(--foreground))', 
                        fontWeight: 'bold',
                        boxShadow: `0 10px 25px -5px ${colors.accent}15`
                      }}
                      itemStyle={{ color: colors.text }}
                      formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, 'Rentabilidade']}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                    <Line 
                      type="monotone" 
                      dataKey="rentabilidade" 
                      stroke={colors.accent} 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: colors.accent }}
                    />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>
        
         {/* Alertas de Risco */}
         {alerts.length > 0 && (
            <div className="bg-card border border-border rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 sm:p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                     <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-foreground">Monitoramento de Risco</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alerts.map((alert, i) => (
                     <div key={i} className={cn(
                        "p-4 rounded-2xl border flex gap-4 items-start shadow-sm",
                        alert.type === 'danger' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                     )}>
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold">{alert.message}</p>
                     </div>
                  ))}
               </div>
            </div>
         )}
         
         {/* Indicadores Fundamentalistas e Dívida customizados */}
         {data?.fundamentals && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="bg-card border rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm"
                style={{ borderColor: colors.border }}
              >
                  <div className="flex items-center gap-3 mb-6">
                     <div 
                       className="p-2 sm:p-2.5 rounded-xl border"
                       style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                     >
                        <BarChart3 className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg sm:text-xl font-black text-foreground">Indicadores Chave</h3>
                  </div>
                  <div className="space-y-4">
                     {data.fundamentals.trailingPE !== undefined && (
                       <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
                         <span className="text-sm font-bold text-muted-foreground">P/L (Preço/Lucro)</span>
                         <span className="font-mono font-black" style={{ color: colors.text }}>{data.fundamentals.trailingPE.toFixed(2)}</span>
                       </div>
                     )}
                     {data.fundamentals.priceToBook !== undefined && (
                       <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
                         <span className="text-sm font-bold text-muted-foreground">P/VP</span>
                         <span className="font-mono font-black" style={{ color: colors.text }}>{data.fundamentals.priceToBook.toFixed(2)}</span>
                       </div>
                     )}
                     {data.fundamentals.yield !== undefined && (
                       <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
                         <span className="text-sm font-bold text-muted-foreground">Dividend Yield</span>
                         <span className="font-mono font-black" style={{ color: colors.text }}>{(data.fundamentals.yield * 100).toFixed(2)}%</span>
                       </div>
                     )}
                     {data.fundamentals.profitMargins !== undefined && (
                       <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
                         <span className="text-sm font-bold text-muted-foreground">Margem Líquida</span>
                         <span className="font-mono font-black" style={{ color: colors.text }}>{(data.fundamentals.profitMargins * 100).toFixed(2)}%</span>
                       </div>
                     )}
                  </div>
              </div>
              
              <div 
                className="bg-card border rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm"
                style={{ borderColor: colors.border }}
              >
                  <div className="flex items-center gap-3 mb-6">
                     <div 
                       className="p-2 sm:p-2.5 rounded-xl border"
                       style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                     >
                        <Briefcase className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg sm:text-xl font-black text-foreground">Contexto de Dívida e Valor</h3>
                  </div>
                  <div className="space-y-4">
                     {data.fundamentals.enterpriseToEbitda !== undefined && (
                       <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
                         <span className="text-sm font-bold text-muted-foreground">EV / EBITDA</span>
                         <span className="font-mono font-black" style={{ color: colors.text }}>{data.fundamentals.enterpriseToEbitda.toFixed(2)}</span>
                       </div>
                     )}
                     {data.fundamentals.enterpriseValue !== undefined && (
                       <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
                         <span className="text-sm font-bold text-muted-foreground">Valor da Firma (EV)</span>
                         <span className="font-mono font-black" style={{ color: colors.text }}>{formatLargeNumber(data.fundamentals.enterpriseValue)}</span>
                       </div>
                     )}
                  </div>
                  <div className="mt-6 p-4 bg-muted/30 border border-border/50 rounded-2xl text-sm text-muted-foreground leading-relaxed">
                     A relação de lucro e dívida ajuda a entender se o preço da ação acompanha o desempenho real do negócio ou apenas especulação do mercado.
                  </div>
              </div>
           </div>
         )}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-20 max-w-7xl mx-auto px-1 sm:px-0">
      <div className="flex flex-col gap-1.5">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl mb-1.5 text-amber-500 border border-amber-500/20 shadow-xl shadow-amber-500/10">
          <Star className="w-6 h-6 sm:w-8 sm:h-8 fill-amber-500" />
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tighter">Meus Favoritos</h1>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Acompanhe o desempenho, risco e fundamentos dos ativos selecionados, a partir do exato momento em que você os favoritou.
        </p>
      </div>

      {favorites.length === 0 ? (
         <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-card border border-border rounded-2xl sm:rounded-[2.5rem] text-center shadow-sm">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
               <Star className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">Nenhum ativo favoritado</h3>
            <p className="text-muted-foreground">Use a pesquisa de ativos para favoritar ações, FIIs e ETFs.</p>
         </div>
      ) : (
        <>
          {/* Categorias */}
          <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2 w-full max-w-full min-w-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0 text-xs sm:text-sm",
                  activeCategory === cat 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de Ativos - Customizada com cores extraídas e Logos reais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full min-w-0">
             {filteredFavorites.map((asset) => {
               const data = assetsData[asset.ticker];
               const isLoading = !data || data.loading;
               
               const currentPrice = data?.regularMarketPrice || asset.priceAtFavoritation;
               const rentabilidade = ((currentPrice - asset.priceAtFavoritation) / asset.priceAtFavoritation) * 100;
               const isPositive = rentabilidade >= 0;

               const colors = getAssetColors(asset.ticker);

               return (
                  <button 
                    key={asset.ticker}
                    onClick={() => setSelectedAsset(asset)}
                    className="w-full bg-card border rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 text-left hover:shadow-xl transition-all duration-300 group flex flex-col justify-between h-[180px] sm:h-[210px] relative overflow-hidden"
                    style={{ 
                      borderColor: 'hsl(var(--border))',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.accent;
                      e.currentTarget.style.boxShadow = `0 12px 30px -5px ${colors.accent}1c`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                     {/* Brilho suave no canto baseado na cor do ativo */}
                     <div 
                       className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 blur-[40px] opacity-10 transition-opacity duration-300 group-hover:opacity-25 pointer-events-none" 
                       style={{ backgroundColor: colors.accent }}
                     />

                     <div className="flex justify-between items-start w-full relative z-10">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                           <AssetLogo 
                             ticker={asset.ticker} 
                             logoUrl={data?.logourl} 
                             accentColors={colors}
                           />
                           <div className="min-w-0">
                              <h3 
                                className="text-lg sm:text-xl font-black text-foreground transition-colors group-hover:text-amber-500 truncate max-w-[100px] sm:max-w-[130px]"
                                style={{ color: 'hsl(var(--foreground))' }}
                              >
                                {asset.ticker}
                              </h3>
                              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">{asset.category}</p>
                           </div>
                        </div>
                        <div 
                          className="p-1.5 sm:p-2 rounded-xl transition-transform duration-200 group-hover:scale-110 shrink-0"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                           <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                        </div>
                     </div>
                     
                     <div className="space-y-1 sm:space-y-1.5 w-full relative z-10">
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-widest">Cotação Atual</p>
                        {isLoading ? (
                           <div className="h-8 w-24 bg-muted animate-pulse rounded-lg" />
                        ) : (
                           <div className="flex items-end justify-between gap-2">
                              <span className="text-xl sm:text-2xl font-black font-mono truncate">
                                 <AssetPrice price={currentPrice} currency={asset.currency} ticker={asset.ticker} />
                              </span>
                              <div className={cn(
                                "flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl shadow-sm border shrink-0",
                                isPositive 
                                  ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/15" 
                                  : "text-red-500 bg-red-500/10 border-red-500/15"
                              )}>
                                {isPositive ? <TrendingUp className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> : <TrendingDown className="w-3 sm:w-3.5 h-3 sm:h-3.5" />}
                                {formatPercent(rentabilidade)}
                              </div>
                           </div>
                        )}
                     </div>
                  </button>
               );
             })}
             {filteredFavorites.length === 0 && (
                <div className="col-span-full p-10 text-center text-muted-foreground border border-dashed border-border rounded-3xl bg-muted/10">
                   Nenhum ativo nesta categoria.
                </div>
             )}
          </div>
        </>
      )}
    </div>
  );
}
