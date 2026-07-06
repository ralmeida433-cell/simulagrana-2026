import { useState, useEffect } from 'react';

export interface HistoryRecord {
  id: string;
  tipo: 'analise' | 'simulacao';
  ativo: string;
  data: string;
  dados: {
    ticker: string;
    stockData: any;
    ipcaAnual: number;
    periodFilter: string;
    timeRange?: string;
  };
}

const HISTORY_KEY = 'app_market_history';
const MAX_HISTORY = 5;

export function useMarketHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  const saveRecord = (record: Omit<HistoryRecord, 'id' | 'data'>) => {
    setHistory(prev => {
      const newRecord: HistoryRecord = {
        ...record,
        id: Math.random().toString(36).substring(2, 9),
        data: new Date().toISOString(),
      };
      
      const newHistory = [newRecord, ...prev].slice(0, MAX_HISTORY);
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error('Failed to save history', e);
      }
      
      return newHistory;
    });
  };

  const removeRecord = (id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error('Failed to save history', e);
      }
      return newHistory;
    });
  };

  return { history, saveRecord, removeRecord };
}
