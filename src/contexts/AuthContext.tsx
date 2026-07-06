import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

interface UserProfile {
  uid: string;
  name: string;
  username?: string;
  bio?: string;
  avatar: string;
  walletVisibility: 'public' | 'followers' | 'private';
  privacySettings: {
    assets: 'assets_only' | 'assets_qty' | 'assets_values' | 'hidden';
    segments: {
      stocksBR: boolean;
      stocksUS: boolean;
      fiis: boolean;
    };
    indicators: {
      profitability: boolean;
      dividends: boolean;
    };
  };
  preferences: {
    showValues: boolean;
    showAssets: boolean;
    showTransactions: boolean;
    showPerformance: boolean;
    theme?: 'light' | 'dark' | 'deep-dark' | 'system';
    accentColor?: string;
  };
  location?: string;
  kycStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
  profileViewsCount?: number;
  aiCreditsRemaining?: number;
  aiCreditsLastReset?: string;
  score?: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticating: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        try {
          const docSnap = await getDoc(userRef);
          if (!docSnap.exists()) {
            // Create new user profile matching the schema
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Investidor',
              username: `@${(currentUser.displayName || currentUser.uid.substring(0, 5)).toLowerCase().replace(/\s/g, '_')}`,
              avatar: currentUser.photoURL || '',
              walletVisibility: 'private',
              privacySettings: {
                assets: 'assets_only',
                segments: {
                  stocksBR: true,
                  stocksUS: true,
                  fiis: true,
                },
                indicators: {
                  profitability: true,
                  dividends: true,
                }
              },
              preferences: {
                showValues: true,
                showAssets: true,
                showTransactions: true,
                showPerformance: true,
              },
              aiCreditsRemaining: 5,
              aiCreditsLastReset: ""
            };
            
            await setDoc(userRef, {
              ...newProfile,
              createdAt: Date.now()
            });
            
            // Private info subcollection for PII
            await setDoc(doc(db, 'users', currentUser.uid, 'private', 'info'), {
               email: currentUser.email
            });

            // Create base wallet
            await setDoc(doc(db, 'wallets', currentUser.uid), {
              userId: currentUser.uid,
              isPublic: false,
              visibilityMode: 'custom',
              assets: [],
              updatedAt: Date.now()
            });
          }
          
          // Subscribe to real-time changes
          unsubProfile = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            }
            setLoading(false);
          }, (err) => {
            console.error("Profile subscription error:", err);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error setting up user profile", error);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const login = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      const errorCode = error.code || '';
      const errorMessage = error.message || '';
      
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
        // Just ignore if the user closed it or it was cancelled (probably duplicate click)
        console.log('Login popup interaction ended:', errorCode);
        return; // Early return to avoid throwing
      }

      console.error('Error signing in with Google', error);
      
      if (errorCode === 'auth/unauthorized-domain') {
        alert(
          'Domínio não Autorizado:\n\n' +
          'O domínio "' + window.location.hostname + '" não está autorizado no seu Firebase Console.\n\n' +
          'Para corrigir:\n' +
          '1. Vá ao Firebase Console\n' +
          '2. Authentication > Settings > Authorized Domains\n' +
          '3. Adicione "' + window.location.hostname + '" à lista.'
        );
      } else if (errorCode === 'auth/network-request-failed') {
        alert(
          'Erro de Conexão ou Bloqueio de Navegador:\n\n' +
          'Não foi possível conectar aos servidores de autenticação do Google.\n' +
          'Possíveis causas:\n' +
          '1. Você está usando um bloqueador de anúncios (AdBlock) ou navegador focado em privacidade (Brave).\n' +
          '2. Bloqueio de cookies de terceiros.\n' +
          '3. Problemas temporários de conexão com a Internet.\n\n' +
          'Por favor, tente desativar temporariamente as extensões de bloqueio ou tentar em uma aba anônima (com cookies habilitados).'
        );
      } else if (errorCode === 'auth/popup-blocked') {
        alert(
          'Popup Bloqueado:\n\n' +
          'O seu navegador bloqueou a janela de login. Por favor, permita popups para este site ou tente clicar no botão novamente.'
        );
      } else if (errorCode === 'auth/internal-error' || errorMessage.includes('internal-error')) {
        alert(
          'Erro Interno de Autenticação:\n\n' +
          'Isso geralmente acontece quando o domínio atual (' + window.location.hostname + ') não está na lista de "Domínios Autorizados" ou quando o Firebase não consegue se comunicar com o provedor.\n\n' +
          'Verifique as configurações no Firebase Console.'
        );
      } else {
        alert('Erro ao entrar com Google: ' + errorMessage + ' (' + errorCode + ')');
      }
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => signOut(auth);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            ...data
        });
        setProfile({ ...profile, ...data });

        // Update wallet visibility if profile visibility changed
        if (data.walletVisibility) {
            const walletRef = doc(db, 'wallets', user.uid);
            await setDoc(walletRef, {
               isPublic: data.walletVisibility !== 'private',
               visibilityMode: data.walletVisibility
            }, { merge: true });
        }
    } catch (error) {
        console.error("Error updating profile", error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthenticating, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
