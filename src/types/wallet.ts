import { LucideIcon } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

export interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
  total: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface WalletData {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  transactions: Transaction[];
  categories: CategoryInfo[];
  goals: FinancialGoal[];
  insights: string[];
}

export interface PublicProfile {
  id: string;
  name: string;
  username: string;
  location: string;
  avatar: string | null;
  followers: number;
  following: number;
  publicWalletsCount: number;
  activeWallet?: PortfolioWallet;
  visibility?: 'public' | 'followers' | 'private';
}

export interface PortfolioAsset {
  ticker: string;
  name: string;
  category: 'Ações' | 'FIIs' | 'ETFs' | 'Renda Fixa' | 'Cripto';
  icon?: string;
  percentage: number;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  rentability: number;
  dailyVariation: number;
  dividendsPaid: number;
  dividendsAwaiting: number;
}

export interface PortfolioWallet {
  id: string;
  name: string;
  totalRentability: string;
  totalValue: number;
  openPatrimony: number;
  assets: PortfolioAsset[];
  history: { date: string; value: number; benchmark: number }[];
  dividends: { month: string; amount: number; yield: number }[];
  privacy: {
    showValues: boolean;
    showRentability: boolean;
    showTransactions: boolean;
    showPercentages: boolean;
  };
}
