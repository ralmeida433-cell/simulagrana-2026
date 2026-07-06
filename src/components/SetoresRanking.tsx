import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface Asset {
  stock: string;
  name: string;
  sector: string;
  dividendYield: number;
  priceEarnings: number;
  priceToBook: number;
  roe: number;
  close: number;
  logo: string;
}

interface SectorData {
  sector: string;
  count: number;
  topDividends: Asset[];
  topROE: Asset[];
  undervalued: Asset[];
}

export function SetoresRanking({ onSelectAsset }: { onSelectAsset: (ticker: string) => void }) {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fin/sectors');
      if (!res.ok) throw new Error('Erro ao carregar dados setoriais');
      const data = await res.json();
      setSectors(data.sectors || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center bg-card border border-border rounded-2xl animate-in fade-in">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-black text-foreground mb-2">Analisando Setores...</h3>
        <p className="text-sm text-muted-foreground">Classificando ativos por fundamentos em seus respectivos segmentos.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 text-destructive rounded-xl border border-destructive/20 font-bold uppercase tracking-widest text-xs">
        {error}
      </div>
    );
  }

  const renderAssetCard = (asset: Asset, highlight: string) => (
    <div 
      key={asset.stock} 
      onClick={() => onSelectAsset(asset.stock)}
      className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/80 border border-border rounded-lg cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-3">
         {asset.logo ? (
            <img src={asset.logo} alt={asset.stock} className="w-8 h-8 rounded-full bg-background" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
         ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
              {asset.stock.substring(0, 2)}
            </div>
         )}
         <div>
           <div className="font-bold text-sm group-hover:text-primary transition-colors">{asset.stock}</div>
           <div className="text-[10px] text-muted-foreground truncate w-24 sm:w-32">{asset.name}</div>
         </div>
      </div>
      <div className="text-right">
        <div className="font-black text-sm text-foreground">
          {highlight === 'dy' && `${asset.dividendYield?.toFixed(2) || 0}%`}
          {highlight === 'roe' && `${asset.roe?.toFixed(2) || 0}%`}
          {highlight === 'graham' && `${asset.priceEarnings?.toFixed(2) || 0}x`}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {highlight === 'dy' && 'DY'}
          {highlight === 'roe' && 'ROE'}
          {highlight === 'graham' && 'P/L'}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto pb-4 border-b border-border">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-3">Análise Setorial Inteligente</h2>
        <p className="text-sm text-muted-foreground">
          Os ativos estão agrupados e classificados por performance dentro de seus setores, utilizando metodologias consagradas como Bazin (Dividendos) e Graham (Valuation).
        </p>
      </div>

      {sectors.map((sector) => (
        <div key={sector.sector} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-muted px-6 py-4 flex items-center justify-between border-b border-border">
            <h3 className="text-xl font-black text-foreground capitalize tracking-tight">{sector.sector}</h3>
            <div className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              {sector.count} Ativos
            </div>
          </div>
          
          <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Top Dividendos (Bazin) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-3 h-3" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Top Dividendos</h4>
              </div>
              <div className="space-y-2">
                {sector.topDividends.length > 0 ? sector.topDividends.map((a) => renderAssetCard(a, 'dy')) : <div className="text-xs text-muted-foreground p-3">Dados insuficientes</div>}
              </div>
            </div>

            {/* Maior ROE (Qualidade) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Maior ROE</h4>
              </div>
              <div className="space-y-2">
                 {sector.topROE.length > 0 ? sector.topROE.map((a) => renderAssetCard(a, 'roe')) : <div className="text-xs text-muted-foreground p-3">Dados insuficientes</div>}
              </div>
            </div>

            {/* Subavaliadas (Graham) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Activity className="w-3 h-3" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Subavaliadas (Valor)</h4>
              </div>
              <div className="space-y-2">
                 {sector.undervalued.length > 0 ? sector.undervalued.map((a) => renderAssetCard(a, 'graham')) : <div className="text-xs text-muted-foreground p-3">Dados insuficientes</div>}
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}
