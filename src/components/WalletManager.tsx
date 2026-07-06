import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Target, 
  Lightbulb,
  ChevronRight,
  Download,
  Link as LinkIcon,
  Calendar,
  DollarSign,
  FileUp,
  FileText,
  AlertCircle,
  RefreshCw,
  Fuel,
  ShoppingCart,
  Pill,
  PartyPopper,
  Briefcase,
  Home,
  Utensils,
  X,
  Save
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Alimentação': <Utensils className="w-5 h-5" />,
  'Transporte': <Fuel className="w-5 h-5" />,
  'Supermercado': <ShoppingCart className="w-5 h-5" />,
  'Saúde': <Pill className="w-5 h-5" />,
  'Lazer': <PartyPopper className="w-5 h-5" />,
  'Moradia': <Home className="w-5 h-5" />,
  'Educação': <Briefcase className="w-5 h-5" />,
  'Outros': <Wallet className="w-5 h-5" />,
};
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line,
  CartesianGrid
} from 'recharts';
import { WalletData, Transaction, CategoryInfo, FinancialGoal } from '../types/wallet';
import { getMockWalletData, CATEGORIES, categorizeTransaction } from '../services/walletService';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { processTransactionsWithAI, analyzeFinancialHealth, FinancialInsights } from '../services/financialIntelligenceService';

export default function WalletManager() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'transactions' | 'goals'>('overview');
  const [isImporting, setIsImporting] = useState(false);
  
  // Create Goal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: 0, currentAmount: 0 });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const fileName = file.name.toLowerCase();

    try {
      let transactions: Transaction[] = [];

      if (fileName.endsWith('.pdf')) {
        transactions = await parsePDF(file);
        console.log('PDF transactions:', transactions);
      } else {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });

        if (fileName.endsWith('.ofx') || content.includes('<OFX>')) {
          transactions = await parseOFX(content);
          console.log('OFX transactions:', transactions);
        } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt') || content.includes(',')) {
          transactions = parseCSV(content);
          console.log('CSV transactions:', transactions);
        } else {
          throw new Error('Formato de arquivo não suportado. Use .csv, .ofx ou .pdf');
        }
      }

      if (transactions.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo.');
      }

      await processImportedTransactions(transactions);
    } catch (error: any) {
      console.error('Import error:', error);
      alert('Erro ao importar arquivo: ' + error.message);
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const parsePDF = async (file: File): Promise<Transaction[]> => {
    try {
      const pdfjsLib = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/build/pdf.min.mjs' as any);
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/build/pdf.worker.min.mjs';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let transactions: Transaction[] = [];
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group items by their vertical position to form lines
        const items = textContent.items as any[];
        const linesMap = new Map<number, string[]>();
        
        items.forEach(item => {
          // Round y position to group items on the same line (allow small variations)
          const y = Math.round(item.transform[5] / 2) * 2;
          if (!linesMap.has(y)) {
            linesMap.set(y, []);
          }
          linesMap.get(y)!.push(item.str);
        });
        
        // Sort lines from top to bottom (highest Y to lowest Y in PDF coordinates)
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
        
        for (const y of sortedY) {
          const lineStr = linesMap.get(y)!.join(' ').trim();
          if (!lineStr) continue;
          
          fullText += lineStr + '\n';
          
          // Look for date (DD/MM or DD/MM/YYYY or DD-MM) 
          const dateMatch = lineStr.match(/(\d{2}[\/\-]\d{2}(?:[\/\-]\d{2,4})?)/);
          // Look for amount (e.g., 1.234,56 or -123,45 or 1234.56 or R$ 100,00)
          const amountMatch = lineStr.match(/(-?\s*(?:R\$)?\s*(?:\d{1,3}(?:[.,]\d{3})*|\d+)[.,]\d{2})/);
          
          if (dateMatch && amountMatch) {
            const dateStr = dateMatch[1];
            const amountStrRaw = amountMatch[1];
            
            // Extract description by removing date and amount
            let description = lineStr
              .replace(dateStr, '')
              .replace(amountStrRaw, '')
              .replace(/\s+/g, ' ')
              .trim();
              
            // Clean up description
            description = description.replace(/^[-\s]+|[-\s]+$/g, '');
            if (!description || description.length < 2) description = 'Transação ' + dateStr;
            
            // Parse amount
            let cleanAmount = amountStrRaw.replace(/R\$\s*/g, '').replace(/\s/g, '');
            // Handle Brazilian format (1.234,56) vs US format (1,234.56)
            if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
              const lastComma = cleanAmount.lastIndexOf(',');
              const lastDot = cleanAmount.lastIndexOf('.');
              if (lastComma > lastDot) {
                // Brazilian: remove dots, replace comma with dot
                cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
              } else {
                // US: remove commas
                cleanAmount = cleanAmount.replace(/,/g, '');
              }
            } else if (cleanAmount.includes(',')) {
              cleanAmount = cleanAmount.replace(',', '.');
            }
            
            const amountVal = parseFloat(cleanAmount);
            
            // Parse date
            let dateObj = new Date();
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 2) {
              dateObj = new Date(new Date().getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[0]));
            } else if (parts.length === 3) {
              let year = parseInt(parts[2]);
              if (year < 100) year += 2000;
              dateObj = new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            
            if (!isNaN(amountVal) && amountVal !== 0) {
              transactions.push({
                id: `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                date: dateObj.toISOString().split('T')[0],
                description,
                amount: Math.abs(amountVal),
                category: categorizeTransaction(description),
                type: amountVal > 0 ? 'income' : 'expense'
              });
            }
          }
        }
      }
      
      console.log('PDF Text Extracted:', fullText);
      return transactions;
    } catch (error) {
      console.error('PDF Parse error:', error);
      throw new Error('Falha ao processar arquivo PDF. O formato pode não ser suportado ou o arquivo está protegido.');
    }
  };

  const parseCSV = (content: string): Transaction[] => {
    const results = Papa.parse(content, { header: true, skipEmptyLines: true });
    
    return results.data.map((row: any, index: number) => {
      // Try to find columns regardless of exact name (pt-BR or en)
      const date = row.data || row.date || row.Data || row.Date;
      const description = row.descricao || row.description || row.Descricao || row.Description || row.Historico;
      const amountStr = row.valor || row.amount || row.Valor || row.Amount;
      
      if (!date || !description || !amountStr) return null;

      const amount = parseFloat(amountStr.toString().replace(',', '.'));
      
      return {
        id: `csv-${index}-${Date.now()}`,
        date: new Date(date).toISOString().split('T')[0],
        description,
        amount: Math.abs(amount),
        category: categorizeTransaction(description),
        type: amount > 0 ? 'income' : 'expense'
      } as Transaction;
    }).filter(Boolean) as Transaction[];
  };

  const parseOFX = async (content: string): Promise<Transaction[]> => {
    try {
      const response = await fetch('/api/parse-ofx', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: content,
      });
      if (!response.ok) throw new Error('Failed to parse OFX');
      const stmtTrn = await response.json();
      
      if (!stmtTrn || stmtTrn.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo OFX.');
      }

      const transactions = Array.isArray(stmtTrn) ? stmtTrn : (stmtTrn.transactions || [stmtTrn]);

      return transactions.map((t: any, index: number) => {
        const amount = parseFloat(t.TRNAMT);
        // OFX date format is YYYYMMDD...
        const rawDate = t.DTPOSTED || '';
        const date = rawDate.length >= 8 
          ? `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`
          : new Date().toISOString().split('T')[0];

        return {
          id: `ofx-${index}-${Date.now()}`,
          date,
          description: t.MEMO || t.NAME || 'Transação',
          amount: Math.abs(amount),
          category: categorizeTransaction(t.MEMO || t.NAME || ''),
          type: amount > 0 ? 'income' : 'expense'
        } as Transaction;
      });
    } catch (error: any) {
      console.error('OFX Parse error:', error);
      throw new Error('Falha ao processar arquivo OFX. Verifique se o formato é válido.');
    }
  };

  const processImportedTransactions = async (transactions: Transaction[]) => {
    // Processar transações com IA
    const processed = await processTransactionsWithAI(transactions);
    const insights = await analyzeFinancialHealth(processed, transactions);
    setInsights(insights);
    
    // Atualizar transações com dados da IA
    const updatedTransactions = transactions.map(t => {
      const aiData = processed.find(p => p.id === t.id);
      return aiData ? {
        ...t,
        description: aiData.merchant,
        category: aiData.category,
        type: aiData.type
      } : t;
    });

    const totalIncome = updatedTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const totalExpenses = updatedTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const categoryTotals: Record<string, number> = {};
    updatedTransactions.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const categories: CategoryInfo[] = Object.entries(categoryTotals).map(([name, total]) => ({
      name,
      total,
      icon: CATEGORIES[name]?.icon || '🧾',
      color: CATEGORIES[name]?.color || '#64748B',
    }));

    const importedData: WalletData = {
      balance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      transactions: updatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      categories,
      goals: [
        { id: '1', title: 'Reserva de Emergência', targetAmount: 10000, currentAmount: 3500 },
        { id: '2', title: 'Viagem Fim de Ano', targetAmount: 5000, currentAmount: 1200 },
      ],
      insights: [
        "Dados importados e analisados pela IA com sucesso.",
        `Total de ${updatedTransactions.length} transações processadas.`,
        "Dica: Conecte via Open Finance para atualizações automáticas."
      ]
    };

    setWalletData(importedData);
    setIsConnected(true);
  };

  const handleConnect = async () => {
    try {
      // 1. Fetch the connect token from our backend
      const response = await fetch('/api/wallet/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const err = await response.json();
        if (err.error && err.error.includes('not configured')) {
          console.warn('Pluggy API keys not configured. Falling back to mock data.');
          setIsConnected(true);
          setWalletData(getMockWalletData());
          return;
        }
        throw new Error(err.error || 'Failed to get connect token');
      }
      
      const { accessToken } = await response.json();

      // 2. Initialize Pluggy Connect
      // @ts-ignore
      const pluggyConnect = new window.PluggyConnect({
        connectToken: accessToken,
        onSuccess: (itemData: any) => {
          console.log('Success!', itemData);
          fetchRealData(itemData.item.id);
        },
        onError: (error: any) => {
          console.error('Error!', error);
          alert('Erro ao conectar: ' + error.message);
        },
        onClose: () => {
          console.log('Closed!');
        }
      });

      pluggyConnect.init();
    } catch (error: any) {
      console.error('Connection error:', error);
      alert('Erro ao iniciar conexão: ' + error.message + '. Verifique se as chaves da API do Pluggy estão configuradas.');
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.title || newGoal.targetAmount <= 0 || !walletData) return;
    
    const goal: FinancialGoal = {
      id: Math.random().toString(36).substr(2, 9),
      title: newGoal.title,
      targetAmount: newGoal.targetAmount,
      currentAmount: newGoal.currentAmount
    };
    
    setWalletData({
      ...walletData,
      goals: [...walletData.goals, goal]
    });
    
    setNewGoal({ title: '', targetAmount: 0, currentAmount: 0 });
    setShowGoalModal(false);
  };

  const fetchRealData = async (itemId: string) => {
    try {
      const response = await fetch(`/api/wallet/data/${itemId}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      
      // Transform Pluggy data to our WalletData format
      const transformedData: WalletData = {
        balance: data.accounts.reduce((acc: number, accnt: any) => acc + accnt.balance, 0),
        totalIncome: data.transactions
          .filter((t: any) => t.amount > 0)
          .reduce((acc: number, t: any) => acc + t.amount, 0),
        totalExpenses: Math.abs(data.transactions
          .filter((t: any) => t.amount < 0)
          .reduce((acc: number, t: any) => acc + t.amount, 0)),
        transactions: data.transactions.map((t: any) => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: Math.abs(t.amount),
          category: t.category || 'Outros',
          type: t.amount > 0 ? 'income' : 'expense'
        })),
        categories: [], // Would need more logic to group by category
        goals: [
          { id: '1', title: 'Reserva de Emergência', targetAmount: 10000, currentAmount: 3500 },
          { id: '2', title: 'Viagem Fim de Ano', targetAmount: 5000, currentAmount: 1200 },
        ],
        insights: [
          "Análise em tempo real ativada.",
          "Seus dados estão sendo sincronizados via Open Finance.",
        ]
      };

      // Calculate categories from real transactions
      const categoryTotals: Record<string, number> = {};
      transformedData.transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

      transformedData.categories = Object.entries(categoryTotals).map(([name, total]) => ({
        name,
        total,
        icon: CATEGORIES[name]?.icon || '🧾',
        color: CATEGORIES[name]?.color || '#64748B',
      }));

      setWalletData(transformedData);
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching real data:', error);
    }
  };

  useEffect(() => {
    // Load Pluggy Connect script
    const script = document.createElement('script');
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2/index.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm dark:bg-slate-900  dark:border-slate-800 "
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-8">
            <Wallet className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4 dark:text-slate-100 ">Conecte sua Carteira</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">
            Conecte suas contas bancárias de forma segura para analisar seus gastos, 
            identificar economias e planejar seu futuro financeiro automaticamente.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-border dark:bg-slate-800 ">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-3">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-800 mb-1 dark:text-slate-200 ">Análise Visual</h4>
              <p className="text-xs text-slate-500">Gráficos automáticos de suas despesas e receitas.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-border dark:bg-slate-800 ">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mb-3">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-800 mb-1 dark:text-slate-200 ">Insights com IA</h4>
              <p className="text-xs text-slate-500">Dicas inteligentes para economizar e investir melhor.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-border dark:bg-slate-800 ">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-3">
                <Target className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-800 mb-1 dark:text-slate-200 ">Metas Reais</h4>
              <p className="text-xs text-slate-500">Defina objetivos e acompanhe seu progresso visualmente.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <button 
              onClick={handleConnect}
              className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
            >
              <LinkIcon className="w-5 h-5" />
              Conectar via Open Finance
            </button>

            <div className="relative group">
              <input 
                type="file" 
                accept=".csv,.ofx,.pdf" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isImporting}
              />
              <div className={cn(
                "bg-white border-2 border-dashed border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group-hover:border-emerald-400 group-hover:text-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:group-hover:border-emerald-500 dark:group-hover:text-emerald-500",
                isImporting && "opacity-50 cursor-not-allowed"
              )}>
                {isImporting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <FileUp className="w-5 h-5" />
                )}
                {isImporting ? 'Processando...' : 'Importar OFX, CSV ou PDF'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400 uppercase font-bold tracking-widest">
            <AlertCircle className="w-3 h-3" />
            <span>Solução 100% Gratuita e Privada</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!walletData) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Wallet Management Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-sm dark:bg-slate-900 gap-4 mb-2 min-w-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Minha Carteira
          </h2>
          <p className="text-sm text-muted-foreground">Gerencie suas finanças e controle de gastos</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
             onClick={() => {
               const url = new URL(window.location.href);
               url.searchParams.set('tab', 'perfil');
               window.dispatchEvent(new Event('popstate'));
               window.history.pushState({}, '', url.toString());
             }}
             className="px-4 py-2 border border-border rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-muted/50 transition-colors"
          >
            <PieChartIcon className="w-4 h-4" />
            Privacidade da Carteira
          </button>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 "
        >
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Saldo Disponível</p>
          <h3 className="text-3xl font-black text-foreground ">{formatCurrency(walletData.balance)}</h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>+12.5% este mês</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 "
        >
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Receitas (Mês)</p>
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="w-8 h-8 text-emerald-500" />
            <h3 className="text-2xl font-bold text-foreground ">{formatCurrency(walletData.totalIncome)}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 "
        >
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Despesas (Mês)</p>
          <div className="flex items-center gap-3">
            <ArrowDownCircle className="w-8 h-8 text-rose-500" />
            <h3 className="text-2xl font-bold text-foreground ">{formatCurrency(walletData.totalExpenses)}</h3>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts & Insights */}
        <div className="lg:col-span-2 space-y-8">
          {/* Expenses Chart */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-foreground ">Distribuição de Gastos</h3>
              <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold outline-none dark:border-slate-800  dark:bg-slate-800 ">
                <option>Março 2024</option>
                <option>Fevereiro 2024</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={walletData.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="total"
                    >
                      {walletData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {walletData.categories.sort((a, b) => b.total - a.total).slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${cat.color}20` }}>
                        {cat.icon}
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 ">{cat.name}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground ">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="bg-emerald-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center dark:bg-slate-900 ">
                  <Lightbulb className="w-6 h-6 text-emerald-300" />
                </div>
                <h3 className="text-xl font-bold">Análise Inteligente</h3>
              </div>
              
              <div className="space-y-4">
                {walletData.insights.map((insight, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 dark:bg-slate-900 "
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 shrink-0" />
                    <p className="text-sm text-emerald-50 leading-relaxed">{insight}</p>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-emerald-300 font-bold uppercase mb-1">Economia Possível</p>
                  <p className="text-2xl font-black">{formatCurrency(450)} / mês</p>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Sugerido para Investimento</p>
                </div>
                <button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-950/20">
                  Simular Investimento
                </button>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full -mr-20 -mt-20 blur-3xl" />
          </div>

          {/* Savings Potential & Projections */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <h3 className="text-xl font-bold text-slate-900 mb-6 dark:text-slate-100 ">Projeção de Patrimônio</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={[
                  { month: 'Mar', value: 5000 },
                  { month: 'Abr', value: 5450 },
                  { month: 'Mai', value: 5900 },
                  { month: 'Jun', value: 6350 },
                  { month: 'Jul', value: 6800 },
                  { month: 'Ago', value: 7250 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4 font-medium">
              Projeção baseada em um investimento mensal de <span className="text-emerald-600 font-bold">{formatCurrency(450)}</span>
            </p>
          </div>
        </div>

        {/* Right Column: Goals & Recent Activity */}
        <div className="space-y-8">
          {/* Financial Goals */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground ">Metas Financeiras</h3>
              <button 
                onClick={() => setShowGoalModal(true)}
                className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors dark:bg-slate-800 "
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-6">
              {walletData.goals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ">{goal.title}</span>
                      <span className="text-xs font-bold text-emerald-600">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span>Meta: {formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xs text-blue-800 font-medium leading-relaxed">
                <span className="font-bold">Dica:</span> Com sua economia atual, você atingirá a meta "Viagem Fim de Ano" em 4 meses.
              </p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900  dark:border-slate-800 ">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground ">Atividade Recente</h3>
              <button className="text-xs font-bold text-emerald-600 hover:underline">Ver Todas</button>
            </div>
            
            <div className="space-y-4">
              {walletData.transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between group gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg",
                      t.type === 'income' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
                    )}>
                      {CATEGORY_ICONS[t.category] || CATEGORY_ICONS['Outros']}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate dark:text-slate-200 ">{t.description}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-bold shrink-0 ml-2",
                    t.type === 'income' ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Section */}
          {insights && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold">Insights Inteligentes da IA</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-indigo-200 uppercase mb-3">Assinaturas Detectadas</h4>
                  <ul className="space-y-2">
                    {insights.subscriptions.map((sub, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span>{sub.merchant}</span>
                        <span className="font-bold">{formatCurrency(sub.amount)} ({sub.frequency})</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-200 uppercase mb-3">Alertas de Anomalias</h4>
                  <ul className="space-y-2">
                    {insights.anomalies.map((anom, i) => (
                      <li key={i} className="text-sm text-rose-300">
                        {anom.alert}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {/* Goal Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoalModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Nova Meta Financeira</h3>
                <button onClick={() => setShowGoalModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Título da Meta</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Reserva, Viagem, Carro..." 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Valor Alvo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newGoal.targetAmount || ''}
                        onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Valor Atual</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newGoal.currentAmount || ''}
                        onChange={(e) => setNewGoal({ ...newGoal, currentAmount: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleAddGoal}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="w-5 h-5" />
                  Salvar Meta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
