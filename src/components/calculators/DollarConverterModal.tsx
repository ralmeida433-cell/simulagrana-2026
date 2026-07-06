import React, { useState, useEffect } from 'react';
import { X, DollarSign, ArrowRight, Minus, Maximize2, Info, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DollarConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRate?: number;
}

export default function DollarConverterModal({ isOpen, onClose, initialRate = 5.0 }: DollarConverterModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [usdValue, setUsdValue] = useState<string>('1');
  const [rate, setRate] = useState<number>(initialRate);
  const [loading, setLoading] = useState(false);
  const [iofType, setIofType] = useState<'cash' | 'card'>('cash');

  // IOF Rates (approximate for 2024/2025)
  const IOF_CASH = 0.011; // 1.1%
  const IOF_CARD = 0.0438; // 4.38% (gradual reduction started in 2023)

  const fetchRate = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      const data = await response.json();
      if (data.USDBRL) {
        setRate(parseFloat(data.USDBRL.bid));
      }
    } catch (error) {
      console.error('Error fetching dollar rate:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRate();
    }
  }, [isOpen]);

  const usd = parseFloat(usdValue) || 0;
  const brlBase = usd * rate;
  const iofRate = iofType === 'cash' ? IOF_CASH : IOF_CARD;
  const iofValue = brlBase * iofRate;
  const totalBrl = brlBase + iofValue;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: isMinimized ? 240 : 320,
          height: isMinimized ? 'auto' : 'auto'
        }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-[100] bg-card rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col"
        style={{ touchAction: 'none' }}
      >
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-emerald-500 p-3 text-white flex items-center justify-between cursor-move select-none">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="font-bold text-xs truncate">Conversor de Dólar</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={fetchRate}
              disabled={loading}
              className={`p-1 hover:bg-white/10 rounded-lg transition-colors ${loading ? 'animate-spin' : ''}`}
              title="Atualizar Cotação"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsMinimized(!isMinimized)} 
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-4 space-y-4">
            {/* Rate Info */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>Cotação Atual</span>
              <span className="text-emerald-600 dark:text-emerald-400">R$ {rate.toFixed(4)}</span>
            </div>

            {/* Input USD */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Valor em USD</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input 
                  type="number"
                  value={usdValue}
                  onChange={(e) => setUsdValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pl-7 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* IOF Selector */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
              <button
                onClick={() => setIofType('cash')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${iofType === 'cash' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
              >
                Espécie (1.1%)
              </button>
              <button
                onClick={() => setIofType('card')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${iofType === 'card' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
              >
                Cartão (4.38%)
              </button>
            </div>

            {/* Results */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-bold uppercase">Base (Câmbio)</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(brlBase)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-bold uppercase">IOF ({(iofRate * 100).toFixed(2)}%)</span>
                <span className="font-bold text-rose-500">{formatCurrency(iofValue)}</span>
              </div>
              <div className="pt-2 border-t border-emerald-100 dark:border-emerald-500/10 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase">Total em BRL</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalBrl)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 leading-tight">
              <Info className="w-3 h-3 flex-shrink-0" />
              <p>Valores aproximados baseados na cotação comercial. Taxas de bancos/corretoras não inclusas.</p>
            </div>
          </div>
        )}

        {isMinimized && (
          <div className="p-2.5 flex items-center justify-between bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500">${usd} = {formatCurrency(totalBrl)}</span>
            </div>
            <button 
              onClick={() => setIsMinimized(false)}
              className="text-[10px] font-bold text-emerald-600 hover:underline"
            >
              Abrir
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
