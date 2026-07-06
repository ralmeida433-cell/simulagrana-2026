import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchFinanceData, FinanceData as FinanceDataType } from '../services/financeService';

interface FinanceContextType {
  financeData: FinanceDataType | null;
  isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType>({
  financeData: null,
  isLoading: true,
});

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider: React.FC<{ children: React.ReactNode; initialData: FinanceDataType | null; isLoading: boolean }> = ({ children, initialData, isLoading }) => {
  return (
    <FinanceContext.Provider value={{ financeData: initialData, isLoading }}>
      {children}
    </FinanceContext.Provider>
  );
};
