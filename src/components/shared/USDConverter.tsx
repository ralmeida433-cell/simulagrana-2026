import React, { useState } from 'react';
import { useFinance } from '../../contexts/FinanceContext';
import { formatCurrency } from '../../lib/utils';
import { DollarSign, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface USDConverterProps {
  valueUsd?: number;
  className?: string;
  usdClassName?: string;
  brlClassName?: string;
  showIcon?: boolean;
}

export function USDConverter({ 
  valueUsd, 
  className = '', 
  usdClassName = 'text-foreground font-bold', 
  brlClassName = 'text-muted-foreground text-xs font-medium',
  showIcon = false 
}: USDConverterProps) {
  const { financeData } = useFinance();
  const [showTooltip, setShowTooltip] = useState(false);

  if (valueUsd === undefined || valueUsd === null || isNaN(valueUsd)) {
    return <span className={className || usdClassName}>—</span>;
  }

  if (!financeData?.usd) {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={usdClassName}>{formatCurrency(valueUsd, 'USD')}</span>
      </div>
    );
  }

  const exchangeRate = financeData.usd;
  // Option: Consider 1.1% IOF (common for retail investments in Brazil)
  const iofConfig = 1.011; 
  const iofPercentage = "1,1%";
  
  const valueBrlGross = valueUsd * exchangeRate;
  const valueBrlNet = valueBrlGross * iofConfig;

  return (
    <div 
      className={`relative inline-flex flex-col ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-1">
        {showIcon && <DollarSign className="w-3.5 h-3.5 text-emerald-500" />}
        <span className={usdClassName}>{formatCurrency(valueUsd, 'USD')}</span>
      </div>
      <div className="flex items-center gap-1 cursor-help">
        <span className={brlClassName}>~{formatCurrency(valueBrlNet, 'BRL')}</span>
        <Info className="w-3 h-3 text-muted-foreground/50" />
      </div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-card border border-border shadow-xl rounded-xl p-3 z-[100] text-sm pointer-events-none"
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-medium text-xs">Cotação Atual</span>
                <span className="font-bold text-emerald-500">{formatCurrency(exchangeRate, 'BRL')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Original (USD)</span>
                <span className="font-bold">{formatCurrency(valueUsd, 'USD')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">IOF Aplicado</span>
                <span className="font-bold text-amber-500">{iofPercentage}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <span className="text-muted-foreground font-medium text-xs">Aproximado</span>
                <span className="font-bold">{formatCurrency(valueBrlNet, 'BRL')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
