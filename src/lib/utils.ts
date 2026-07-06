import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = 'BRL') {
  // Map common symbols to ISO codes
  const currencyMap: Record<string, string> = {
    'R$': 'BRL',
    'US$': 'USD',
    '$': 'USD',
  };

  const currencyCode = currencyMap[currency] || currency;

  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  } catch (e) {
    // Fallback if currency code is still invalid
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
  }).format(value / 100);
}
