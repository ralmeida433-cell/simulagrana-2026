import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export type AssetClass = 'Ações' | 'FIIs' | 'Stocks' | 'REITs' | 'BDRs' | 'ETFs' | 'Tesouro Direto' | 'Renda Fixa' | 'Criptomoedas';

export interface Transaction {
  id: string;
  ticker: string;
  date: string;
  type: 'COMPRA' | 'VENDA' | 'RENDIMENTO';
  assetClass: AssetClass;
  quantity: number;
  price: number;
  costs: number;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('Missing or insufficient permissions') || errorMessage.includes('permission-denied')) {
    const errInfo: FirestoreErrorInfo = {
      error: errorMessage,
      authInfo: {
        userId: 'known' // not accessing auth context here directly to keep it simple, you get the idea
      },
      operationType,
      path
    };
    console.error('Firestore Permission Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  console.error(`Firestore ${operationType} Error at ${path}:`, errorMessage);
  throw error;
}

export const loadTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!userId) return [];
  try {
    const docRef = doc(db, 'wallets', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let transactions = (data.assets as Transaction[]) || [];
      
      // Sanitização para corrigir ativos BR que foram salvos incorretamente como Stocks
      transactions = transactions.map(t => {
        if (t.assetClass === 'Stocks') {
          const upperTicker = t.ticker.toUpperCase();
          if (upperTicker.endsWith('11') || upperTicker.endsWith('11.SA')) {
            return { ...t, assetClass: 'FIIs' };
          }
          if (upperTicker.endsWith('.SA') || /^[A-Z]{4}\d{1,2}$/.test(upperTicker)) {
            return { ...t, assetClass: 'Ações' };
          }
        }
        return t;
      });

      return transactions;
    } else {
      // Initialize if doesn't exist
      await setDoc(docRef, {
        userId,
        isPublic: true,
        visibilityMode: 'followers',
        assets: [],
        updatedAt: Date.now()
      });
      return [];
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};

export const saveTransactions = async (userId: string, transactions: Transaction[]) => {
  if (!userId) return;
  const docRef = doc(db, 'wallets', userId);
  try {
    const existingSnap = await getDoc(docRef);
    let payload: any = {
      assets: transactions,
      updatedAt: Date.now()
    };
    
    if (existingSnap.exists()) {
       const existingData = existingSnap.data();
       // Only add missing fields that are safe to update
       if (!('visibilityMode' in existingData)) {
         payload.visibilityMode = 'followers';
       }
       if (!('isPublic' in existingData)) {
         payload.isPublic = true;
       }
       // DO NOT SET userId on update, it breaks hasOnly strict rules
    } else {
       payload.userId = userId;
       payload.isPublic = true;
       payload.visibilityMode = 'followers';
    }

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `wallets/${userId}`);
  }
};

export const saveWalletSnapshot = async (userId: string, snapshot: any) => {
  if (!userId) return;
  const docRef = doc(db, 'wallets', userId);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        userId: userId,
        isPublic: false,
        visibilityMode: 'private',
        publicSnapshot: snapshot,
        updatedAt: Date.now(),
        assets: []
      });
    } else {
      await updateDoc(docRef, {
        publicSnapshot: snapshot,
        updatedAt: Date.now()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `wallets/${userId}/publicSnapshot`);
  }
};
