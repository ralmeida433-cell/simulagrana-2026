import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, PieChart, Target, Landmark, 
  FileSearch, Building2, Wand2, ZoomIn 
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Mapeamento dos módulos e suas rotas/icons
export const ALL_MODULES = [
  // Ações
  { id: 'bazin', label: 'Método Bazin', icon: PieChart, types: ['acao'] },
  { id: 'graham', label: 'Valuation Graham', icon: LineChart, types: ['acao'] },
  { id: 'peter-lynch', label: 'PEG Ratio (Peter Lynch)', icon: Target, types: ['acao'] },
  { id: 'pesquisa', label: 'Pesquisa Detalhada', icon: ZoomIn, types: ['acao', 'fii'] },
  { id: 'fundamental-analysis', label: 'Análise Fundamentalista', icon: FileSearch, types: ['acao'] },
  
  // FIIs
  { id: 'fii-analysis', label: 'Análise Fundamentalista FII', icon: Building2, types: ['fii'] },
  { id: 'magic', label: 'Magic Number FII', icon: Wand2, types: ['fii'] }
];

interface AssetHoverMenuProps {
  ticker: string;
  type?: 'acao' | 'fii';
  children: React.ReactNode;
  className?: string;
}

export function AssetHoverMenu({ ticker, type, children, className }: AssetHoverMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Identifica o tipo automaticamente se não for passado
  const assetType = type || (() => {
    const cleanTicker = ticker.trim().toUpperCase();
    // Verifica se contém 11 (característica de FII/ETF no BR)
    return cleanTicker.includes('11') ? 'fii' : 'acao';
  })();

  // Filtra as opções baseadas no tipo de ativo
  const options = ALL_MODULES.filter(mod => mod.types.includes(assetType));

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    // Calcula posição antes de abrir
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top, // Use viewport-relative for fixed
        left: rect.left + rect.width / 2
      });
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const handleNavigate = (tabId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    
    // Limpa o ticker para busca (remove .SA se existir)
    const cleanTicker = ticker.trim().split('.')[0].toUpperCase();
    url.searchParams.set('ticker', cleanTicker);
    
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new Event('popstate'));
    
    setIsOpen(false);
  };

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{ 
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: 'translate(-50%, calc(-100% - 12px))',
            pointerEvents: 'auto'
          }}
          className="w-56 sm:w-64 bg-card border border-border shadow-2xl rounded-xl z-[9999] overflow-hidden"
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md overflow-hidden bg-white shrink-0 flex items-center justify-center p-0.5">
                <img 
                  src={`https://s3-symbol-logo.tradingview.com/${ticker.replace('.SA', '').toLowerCase()}--big.svg`}
                  alt={ticker}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('brapi.dev')) {
                      target.src = `https://brapi.dev/favicon.ico?ticker=${ticker}`;
                    } else {
                      target.style.display = 'none';
                    }
                  }}
                />
              </div>
              <span className="text-[10px] font-black text-foreground truncate max-w-[100px] leading-tight">{ticker.split('.')[0]}</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-background px-1.5 py-0.5 rounded border border-border">{assetType === 'acao' ? 'Ações' : 'FIIs'}</span>
          </div>
          <div className="flex flex-col py-1">
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNavigate(option.id);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-primary/10 hover:text-primary transition-colors group"
                >
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-border" />
          <div className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-card" />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div 
      ref={triggerRef}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cursor-help decoration-dashed decoration-slate-400 dark:decoration-slate-600 underline underline-offset-4 hover:text-primary transition-colors">
        {children}
      </div>
      
      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
