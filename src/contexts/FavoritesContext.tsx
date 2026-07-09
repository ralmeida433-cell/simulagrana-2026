import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, auth } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AssetCategory = 'Ações BR' | 'Ações EUA' | 'ETFs Nacionais' | 'ETFs Globais' | 'ETFs' | 'FIIs' | 'Fiagros' | 'REITs' | string;

export interface FavoriteAsset {
  ticker: string;
  name: string;
  category: AssetCategory;
  favoritedAt: string; // ISO date string
  priceAtFavoritation: number;
  currency: 'BRL' | 'USD';
}

interface FavoritesContextType {
  favorites: FavoriteAsset[];
  addFavorite: (asset: Omit<FavoriteAsset, 'favoritedAt'>) => void;
  removeFavorite: (ticker: string) => void;
  isFavorite: (ticker: string) => boolean;
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
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteAsset[]>([]);

  // 1. Load initial favorites from localStorage for non-logged in state or until Firebase loads
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('simulagrana_favorites');
      if (saved) {
        try {
          let parsed = JSON.parse(saved);
          let migrated = false;
          parsed = parsed.map(f => {
            let newCat = f.category;
            if (f.category === 'ETFs') {
               newCat = (f.ticker.endsWith('.SA') || /^[A-Z0-9]{4}\d{1,2}$/.test(f.ticker)) ? 'ETFs Nacionais' : 'ETFs Globais';
            } else if (f.category === 'FIIs' && f.name) {
               if (f.name.toUpperCase().includes('FIAGRO') || f.name.toUpperCase().includes('AGRO')) {
                 newCat = 'Fiagros';
               }
            }
            if (newCat !== f.category) {
              migrated = true;
              return { ...f, category: newCat };
            }
            return f;
          });
          if (migrated) {
            localStorage.setItem('simulagrana_favorites', JSON.stringify(parsed));
          }
          setFavorites(parsed);
        } catch (e) {
          console.error('Failed to parse local favorites', e);
        }
      } else {
        setFavorites([]);
      }
    }
  }, [user]);

  // 2. Load and sync favorites from Firestore when logged in
  useEffect(() => {
    let active = true;
    const loadAndSyncFavorites = async () => {
      if (!user) return;
      
      const docRef = doc(db, 'wallets', user.uid);
      try {
        const docSnap = await getDoc(docRef);
        
        // Get local favorites as backup/merge candidate
        const localSaved = localStorage.getItem('simulagrana_favorites');
        let localFavs: FavoriteAsset[] = [];
        if (localSaved) {
          try {
            localFavs = JSON.parse(localSaved);
          } catch (e) {
            console.error(e);
          }
        }

        if (docSnap.exists()) {
          const data = docSnap.data();
          const firestoreFavs = (data.favorites as FavoriteAsset[]) || [];
          
          // Merge local & firestore favorites to prevent data loss
          const merged = [...localFavs, ...firestoreFavs];
          let unique = merged.filter((item, index, self) => 
             self.findIndex(t => t.ticker === item.ticker) === index
          );
          
          // Migrate categories
          let migrated = false;
          unique = unique.map(f => {
            let newCat = f.category;
            if (f.category === 'ETFs') {
               newCat = (f.ticker.endsWith('.SA') || /^[A-Z0-9]{4}\d{1,2}$/.test(f.ticker)) ? 'ETFs Nacionais' : 'ETFs Globais';
            } else if (f.category === 'FIIs' && f.name) {
               if (f.name.toUpperCase().includes('FIAGRO') || f.name.toUpperCase().includes('AGRO')) {
                 newCat = 'Fiagros';
               }
            }
            if (newCat !== f.category) {
              migrated = true;
              return { ...f, category: newCat };
            }
            return f;
          });
          
          if (active) {
            setFavorites(unique);
            // Sync merge back to Firestore if new favorites were added locally
            if (unique.length > firestoreFavs.length || migrated) {
              await setDoc(docRef, { favorites: unique, updatedAt: Date.now() }, { merge: true });
            }
          }
        } else {
          // Document does not exist yet (though AuthContext usually handles wallet initialization)
          if (active) {
            setFavorites(localFavs);
          }
          await setDoc(docRef, {
            userId: user.uid,
            isPublic: false,
            visibilityMode: 'private',
            assets: [],
            favorites: localFavs,
            updatedAt: Date.now()
          }, { merge: true });
        }
      } catch (error) {
        if (active) {
          handleFirestoreError(error, OperationType.GET, `wallets/${user.uid}`);
        }
      }
    };

    loadAndSyncFavorites();

    return () => {
      active = false;
    };
  }, [user]);

  // Save favorites to either Firestore or localStorage
  const saveFavoritesData = async (newFavorites: FavoriteAsset[]) => {
    if (user) {
      const docRef = doc(db, 'wallets', user.uid);
      try {
        await setDoc(docRef, {
          favorites: newFavorites,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `wallets/${user.uid}`);
      }
    } else {
      localStorage.setItem('simulagrana_favorites', JSON.stringify(newFavorites));
    }
  };

  const addFavorite = (asset: Omit<FavoriteAsset, 'favoritedAt'>) => {
    const newFav: FavoriteAsset = { ...asset, favoritedAt: new Date().toISOString() };
    setFavorites(prev => {
      if (prev.some(f => f.ticker === asset.ticker)) return prev;
      const updated = [...prev, newFav];
      saveFavoritesData(updated);
      return updated;
    });
  };

  const removeFavorite = (ticker: string) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f.ticker !== ticker);
      saveFavoritesData(updated);
      return updated;
    });
  };

  const isFavorite = (ticker: string) => {
    return favorites.some(f => f.ticker === ticker);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
