import React from 'react';
import { USDConverter } from './USDConverter';
import { formatCurrency } from '../../lib/utils';
import { useFinance } from '../../contexts/FinanceContext';

interface AssetPriceProps {
  price?: number;
  currency?: string; 
  ticker?: string;
  className?: string;
  usdClassName?: string;
  brlClassName?: string;
  showIcon?: boolean;
  isAlreadyBrl?: boolean;
}

export function AssetPrice({ 
  price, 
  currency, 
  ticker = '',
  className = '',
  usdClassName,
  brlClassName,
  showIcon = false,
  isAlreadyBrl = false
}: AssetPriceProps) {
  const { financeData } = useFinance();

  if (price === undefined || price === null || isNaN(price)) {
    return <span className={className || usdClassName}>—</span>;
  }
  
  // Use currency property first, if missing fallback to heuristic
  let isUSD = false;
  if (currency) {
    isUSD = currency === 'USD';
  } else if (ticker) {
    const hasNumbers = /\d/.test(ticker);
    const hasSA = ticker.toUpperCase().endsWith('.SA');
    isUSD = !hasNumbers && !hasSA;
  }

  if (isUSD) {
    let usdPrice = price;
    if (isAlreadyBrl && financeData?.usd) {
      usdPrice = price / financeData.usd;
    }

    return (
      <USDConverter 
        valueUsd={usdPrice} 
        className={className}
        usdClassName={usdClassName || className} // Fallback to className if no specific usdClassName
        brlClassName={brlClassName}
        showIcon={showIcon}
      />
    );
  }

  return (
    <span className={className || usdClassName}>{formatCurrency(price, 'BRL')}</span>
  );
}
