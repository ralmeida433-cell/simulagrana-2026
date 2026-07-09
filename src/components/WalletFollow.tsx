import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Globe, Users, Trophy, ChevronRight, Share2, Heart, MessageCircle, ArrowLeft, Send, Sparkles, Loader2, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { Avatar } from './ui/Avatar';
import PublicPortfolio from './PublicPortfolio';
import { PublicProfile } from '../types/wallet';
import { socialService, Post } from '../services/socialService';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import PostCard from './social/PostCard';
import MessagesView from './social/MessagesView';
import { motion } from 'motion/react';
import { CustomSelect } from './ui/CustomSelect';

const AnimatedWalletLogo = ({ size = 'md' }: { size?: 'md' | 'lg' }) => {
  const isLg = size === 'lg';
  const containerSize = isLg ? 'w-48 h-48' : 'w-24 h-24';
  const imgSize = isLg ? 'w-32 h-32' : 'w-16 h-16';

  return (
    <div className={cn("relative flex items-center justify-center", containerSize)}>
      {/* Outer Orbit */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border border-dashed border-primary/30"
      >
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
      </motion.div>

      {/* Inner Orbit */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className={cn("absolute rounded-full border border-primary/20", isLg ? "inset-4" : "inset-2")}
      >
        <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full shadow-[0_0_8px_rgba(var(--secondary),0.6)]" />
      </motion.div>

      {/* Pulse Background */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-primary/10 rounded-full blur-xl"
      />

      {/* Floating Logo */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={cn("relative z-10 drop-shadow-2xl", imgSize)}
      >
        <img 
          src="/logo_walletfollow.svg" 
          alt="WalletFollow Logo" 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </div>
  );
};

export default function WalletFollow() {
  const { user, profile, login, updateProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'ranking' | 'my_profile' | 'messages'>('feed');
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [publicUsers, setPublicUsers] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');

  useEffect(() => {
    if (!user || loading) return;
    const q = query(
      collection(db, 'users'), 
      where('walletVisibility', '!=', 'private'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPublicUsers(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    
    return () => unsubscribe();
  }, [user, loading]);

  useEffect(() => {
    if (!user || loading) return;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Post));
      setPosts(fetchedPosts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });
    return () => unsubscribe();
  }, [user, loading]);

  useEffect(() => {
    // Handle deep-link to profile via query param
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('userId');
    if (userIdParam && userIdParam !== selectedProfile?.id) {
       handleProfileClick(userIdParam);
    }
  }, [loading]);
  
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    try {
      await socialService.createPost(
        newPostContent, 
        profile ? { name: profile.name, avatar: profile.avatar, username: `@${user?.email?.split('@')[0] || 'investidor'}` } : undefined
      );
      setNewPostContent('');
    } catch (e: any) {
      console.error('Failed to create post:', e);
      // Extra check for permission denied which is the most common user issue
      if (e.code === 'permission-denied' || e.message?.includes('permissions')) {
        alert('Erro de Permissão: Você precisa estar logado com um perfil válido para postar. Verifique se seu login foi concluído com sucesso.');
      } else {
        alert('Erro ao publicar: ' + e.message);
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleProfileClick = async (userId: string) => {
    // Optimization: If user is already in our public list, use that data first
    const existingUser = publicUsers.find(u => u.id === userId || u.uid === userId);
    if (existingUser) {
        // We still fetch full profile because the list might be partial
        // but we can show it immediately if we want (not doing it here to keep activeWallet loading logic)
        console.log('User found in public list, fetching full profile...');
    }

    setProfileLoading(true);
    try {
      // Direct Firestore fetch to avoid server-side IAM issues
      const { doc, getDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      let profileData: any = null;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Construct the profile with expected fields from PublicProfile
        profileData = { 
          id: userDoc.id, 
          name: userData.name || 'Investidor',
          username: userData.username || `@${userData.name?.toLowerCase().replace(/\s/g, '_') || userDoc.id.substring(0, 5)}`,
          avatar: userData.avatar || null,
          location: userData.location || 'Brasil',
          followers: userData.followers || 0,
          following: userData.following || 0,
          publicWalletsCount: userData.walletVisibility === 'private' ? 0 : 1,
          ...userData 
        };
      } else if (existingUser) {
        // Use data we already have if Firestore fetch fails but user was in our list
        profileData = {
          id: userId,
          name: existingUser.name || 'Investidor',
          username: existingUser.username || `@${existingUser.name?.toLowerCase().replace(/\s/g, '_') || userId.substring(0, 5)}`,
          avatar: existingUser.avatar || null,
          location: existingUser.location || 'Brasil',
          followers: existingUser.followers || 0,
          following: existingUser.following || 0,
          publicWalletsCount: 1,
          ...existingUser
        };
      }

      if (profileData) {
        // Still call API to get the activeWallet and calculated performance 
        // because the backend logic handles the complex financial aggregation
        try {
          let headers: any = {};
          if (user) {
            const idToken = await user.getIdToken();
            headers['Authorization'] = `Bearer ${idToken}`;
          }

          const response = await fetch(`/api/users/${userId}?_t=${Date.now()}`, { 
            headers,
            cache: 'no-store'
          });
          if (response.ok) {
            const apiData = await response.json();
            setSelectedProfile({ ...profileData, ...apiData });
          } else {
            console.warn(`API returned ${response.status}, attempting frontend wallet fetch fallback`);
            const walletRef = doc(db, 'wallets', userId);
            const walletDoc = await getDoc(walletRef);
            let activeWallet = null;

            if (walletDoc.exists()) {
                const wData = walletDoc.data();
                activeWallet = wData.publicSnapshot || {
                    id: userId,
                    name: 'Carteira Principal',
                    totalValue: 0,
                    totalRentability: '0%',
                    openPatrimony: 100,
                    assets: [],
                    dividends: [],
                    history: [],
                };
            } else if (profileData.walletVisibility && profileData.walletVisibility !== 'private') {
                activeWallet = {
                    id: userId,
                    name: 'Carteira Principal',
                    totalValue: 0,
                    totalRentability: '0%',
                    openPatrimony: 100,
                    assets: [],
                    dividends: [],
                    history: [],
                };
            }

            if (activeWallet) {
                // Ensure privacy settings are attached
                activeWallet.privacy = profileData.privacySettings || {
                   showValues: true,
                   showRentability: true,
                   showTransactions: false,
                   showPercentages: true
                };
                profileData.activeWallet = activeWallet;
            }

            setSelectedProfile(profileData as PublicProfile);
          }
        } catch (apiError) {
          console.warn('API fallback failed, using gathered data:', apiError);
          setSelectedProfile(profileData as PublicProfile);
        }
      } else {
        // Fallback to API directly if we have NO data yet
        const response = await fetch(`/api/users/${userId}?_t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Dados do usuário não encontrados em nenhuma fonte');
        const apiProfile = await response.json();
        setSelectedProfile(apiProfile);
      }
    } catch (error: any) {
      console.error('Error in handleProfileClick:', error);
      alert('Não foi possível carregar o perfil completo. Verifique sua conexão ou se o usuário ainda existe.');
    } finally {
      setProfileLoading(false);
    }
  };

  const formattedPublicUsers = publicUsers.map(u => ({
    id: u.uid || u.id,
    name: u.name,
    username: u.username || `@${u.name?.toLowerCase().replace(/\s/g, '_') || (u.uid || u.id).substring(0, 5)}`,
    avatar: u.avatar,
    performance: u.performance || (Math.random() * 10 + 5).toFixed(1), // Fallback performance
    followers: u.followers || 0,
    risk: u.risk || 'Moderado'
  })).sort((a, b) => Number(b.performance) - Number(a.performance));

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="mb-8">
          <AnimatedWalletLogo size="lg" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Comunidade WalletFollow</h2>
        <p className="text-muted-foreground mb-8">
          Conecte-se com outros investidores, acompanhe carteiras públicas de sucesso e compartilhe sua estratégia. Faça login para acessar.
        </p>
        <button className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl" onClick={login}>
           Entrar na Comunidade
        </button>
      </div>
    );
  }

  if (selectedProfile) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedProfile(null)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4 group px-4 py-2 bg-muted/50 rounded-xl w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Comunidade
        </button>
        <PublicPortfolio profile={selectedProfile} onBack={() => setSelectedProfile(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-0 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-30 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="hidden sm:block">
              <AnimatedWalletLogo size="md" />
            </div>
            <div className="flex-1 mt-0">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Comunidade
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm font-medium tracking-tight mt-0.5">Explore ideias e invista melhor juntos</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-64 shrink-0">
             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
             </div>
             <input
                type="text"
                placeholder="Pesquisar @usuario..."
                className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border/50 rounded-full text-sm focus:ring-1 focus:ring-emerald-500 outline-none transition-all focus:bg-background"
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
             />
          </div>
        </div>

        {/* Tab Navigation X-Style */}
        <div className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory">
            <button
              onClick={() => setActiveTab('feed')}
              className={cn(
                "px-4 py-4 text-sm font-bold transition-all flex items-center justify-center whitespace-nowrap snap-center shrink-0 relative flex-1 sm:flex-none",
                activeTab === 'feed' ? "text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/20"
              )}
            >
              Feed
              {activeTab === 'feed' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={cn(
                "px-4 py-4 text-sm font-bold transition-all flex items-center justify-center whitespace-nowrap snap-center shrink-0 relative flex-1 sm:flex-none",
                activeTab === 'ranking' ? "text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/20"
              )}
            >
              Rankings
              {activeTab === 'ranking' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={cn(
                "px-4 py-4 text-sm font-bold transition-all flex items-center justify-center whitespace-nowrap snap-center shrink-0 relative flex-1 sm:flex-none",
                activeTab === 'messages' ? "text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/20"
              )}
            >
              Mensagens
              {activeTab === 'messages' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('my_profile')}
              className={cn(
                "px-4 py-4 text-sm font-bold transition-all flex items-center justify-center whitespace-nowrap snap-center shrink-0 relative flex-1 sm:flex-none",
                activeTab === 'my_profile' ? "text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/20"
              )}
            >
              Meu Perfil
              {activeTab === 'my_profile' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
            </button>
          </div>
      </div>

      {communitySearchQuery.trim() !== '' ? (
        <div className="space-y-4 pt-4">
           <h3 className="text-lg font-bold">Resultados da Pesquisa</h3>
           {formattedPublicUsers.filter(w => 
              w.name?.toLowerCase().includes(communitySearchQuery.toLowerCase()) || 
              (w as any).username?.toLowerCase().includes(communitySearchQuery.toLowerCase())
           ).map((wallet: any, index) => (
              <div 
                  key={wallet.id} 
                  onClick={() => handleProfileClick(wallet.id)}
                  className="grid grid-cols-[auto_1fr] gap-4 p-4 bg-card border border-border rounded-xl items-center hover:bg-muted/30 transition-colors cursor-pointer relative"
              >
                 <Avatar src={wallet.avatar || undefined} alt={wallet.name} size="md" className="w-12 h-12 shrink-0" />
                 <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{wallet.name}</div>
                    <div className="text-xs text-muted-foreground">{wallet.username}</div>
                 </div>
                 <div className="text-right">
                    <div className="text-sm font-bold text-emerald-500">+{wallet.performance}%</div>
                    <div className="text-xs text-muted-foreground">{wallet.followers} seguindo</div>
                 </div>
              </div>
           ))}
           {formattedPublicUsers.filter(w => 
              w.name?.toLowerCase().includes(communitySearchQuery.toLowerCase()) || 
              (w as any).username?.toLowerCase().includes(communitySearchQuery.toLowerCase())
           ).length === 0 && (
              <div className="text-center p-8 text-muted-foreground border border-dashed rounded-xl">
                 Nenhum usuário encontrado para "{communitySearchQuery}".
              </div>
           )}
        </div>
      ) : activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              <div className="flex gap-4">
                <Avatar src={profile?.avatar || user?.photoURL || undefined} size="md" />
                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="O que está acontecendo na sua carteira hoje?" 
                  className="flex-1 bg-muted/30 border-none resize-none h-24 rounded-xl p-4 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-foreground placeholder:text-muted-foreground transition-all"
                />
              </div>
              <div className="flex justify-between items-center pl-16">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Ativos reais verificados
                </div>
                <button 
                  onClick={handleCreatePost}
                  disabled={isPosting || !newPostContent.trim()}
                  className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {isPosting ? 'Publicando...' : <><Send className="w-3 h-3" /> Publicar</>}
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} onProfileClick={handleProfileClick} />
              ))}
              {posts.length === 0 && (
                <div className="p-12 text-center bg-card border border-dashed border-border rounded-2xl">
                   <p className="text-muted-foreground text-sm">Seja o primeiro a postar na comunidade!</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                <Trophy className="w-4 h-4 text-amber-500" />
                Carteiras em Destaque
              </h3>
              <div className="space-y-4">
                {formattedPublicUsers.map(wallet => (
                  <div 
                    key={wallet.id} 
                    onClick={() => handleProfileClick(wallet.id)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer border border-transparent hover:border-border relative"
                  >
                    {profileLoading && <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center z-10"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>}
                    <div className="flex items-center gap-3">
                       <Avatar size="sm" alt={wallet.name} />
                       <div>
                         <p className="text-sm font-semibold group-hover:text-primary transition-colors">{wallet.name}</p>
                         <p className="text-xs text-muted-foreground">{wallet.followers} seguidores</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-500">+{wallet.performance}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{wallet.risk}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1">
                Ver Ranking Completo <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ranking' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Top Performances</h3>
                <p className="text-sm text-muted-foreground">Investidores com maior rentabilidade acumulada nos últimos 12 meses.</p>
              </div>
            </div>
            <div className="hidden md:block">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">Atualizado hoje</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6">Investidor</div>
              <div className="col-span-3 text-right">Rentabilidade</div>
              <div className="col-span-2 text-right">Seguidores</div>
            </div>
            <div className="divide-y divide-border flex flex-col">
              {formattedPublicUsers.map((wallet, index) => (
                <div 
                  key={wallet.id} 
                  onClick={() => handleProfileClick(wallet.id)}
                  className="grid grid-cols-[auto_1fr] md:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4 items-center hover:bg-muted/30 transition-colors group cursor-pointer relative"
                >
                  {profileLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
                  <div className="md:col-span-1 text-center flex justify-center items-center">
                    <span className={cn(
                      "text-sm font-black w-6 h-6 flex items-center justify-center rounded-full bg-muted/50",
                      index === 0 ? "text-amber-500 text-lg bg-amber-500/10" : 
                      index === 1 ? "text-slate-400 bg-slate-400/10" : 
                      index === 2 ? "text-amber-700 bg-amber-700/10" : "text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="md:col-span-6 flex items-center gap-3">
                    <Avatar src={wallet.avatar || undefined} alt={wallet.name} size="sm" className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm group-hover:text-primary transition-colors truncate">{wallet.name}</div>
                      <div className="text-[10px] px-2 py-0.5 bg-muted rounded-full w-fit mt-1 font-bold text-muted-foreground uppercase">Risco {wallet.risk}</div>
                    </div>
                  </div>
                  <div className="col-span-full md:col-span-3 flex justify-between md:block text-right border-t border-border/50 md:border-0 pt-2 md:pt-0 mt-2 md:mt-0">
                    <div className="text-left md:text-right">
                       <div className="text-[10px] md:hidden text-muted-foreground uppercase font-bold">Rentabilidade</div>
                       <div className="text-sm font-black text-emerald-500">+{wallet.performance}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] md:hidden text-muted-foreground uppercase font-bold">Seguidores</div>
                      <div className="text-sm font-bold md:hidden">{wallet.followers}</div>
                      <div className="text-[10px] text-muted-foreground hidden md:block">vs IBOV +5.2%</div>
                    </div>
                  </div>
                  <div className="hidden md:block col-span-2 text-right">
                    <div className="text-sm font-bold">{wallet.followers}</div>
                    <div className="text-[10px] text-muted-foreground">seguidores</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border text-center">
            <p className="text-xs text-muted-foreground">
              Quer aparecer no ranking? Ative a <b>Visibilidade da Carteira</b> nas configurações do seu perfil.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'my_profile' && (
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-primary/20 rounded-full blur-[80px] animate-[pulse-glow_4s_ease-in-out_infinite]" />
          
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 pointer-events-none transition-opacity duration-700">
            <Globe size={160} className="animate-[spin_40s_linear_infinite]" />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 mb-8 relative z-10">
            <div className="relative">
              {/* Animated Profile Ring */}
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-primary to-emerald-600 rounded-full opacity-70 animate-[profile-ring_4s_linear_infinite] blur-sm group-hover:opacity-100 transition-opacity" />
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-emerald-500 rounded-full animate-[profile-ring_3s_linear_infinite_reverse]" />
              
              <div className="relative p-1 rounded-full bg-card z-10 animate-[profile-glow_3s_ease-in-out_infinite]">
                <Avatar 
                  src={profile?.avatar || user?.photoURL || undefined} 
                  className="w-32 h-32 md:w-40 md:h-40 border-4 border-card relative z-20" 
                />
                {/* Floating Particles Around Avatar */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                  <div className="absolute top-1/4 left-0 w-2 h-2 bg-emerald-400 rounded-full animate-[profile-particles_2s_ease-out_infinite]" />
                  <div className="absolute top-1/2 right-0 w-1.5 h-1.5 bg-primary rounded-full animate-[profile-particles_2.5s_ease-out_infinite_0.5s]" />
                  <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-emerald-300 rounded-full animate-[profile-particles_2.2s_ease-out_infinite_1s]" />
                </div>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{profile?.name || user?.displayName}</h3>
              <p className="text-emerald-500 font-medium">@{user?.email?.split('@')[0] || 'investidor'}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                <div className="px-4 py-2 bg-muted/50 rounded-2xl border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                  <span className="text-foreground font-bold text-lg mr-1 block sm:inline">0</span> 
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Seguidores</span>
                </div>
                <div className="px-4 py-2 bg-muted/50 rounded-2xl border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                  <span className="text-foreground font-bold text-lg mr-1 block sm:inline">0</span> 
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Seguindo</span>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-emerald-500/20 p-5 rounded-2xl w-full md:w-auto relative group hover:border-emerald-500/50 transition-colors shadow-sm">
              <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-center md:text-left">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-3 flex items-center justify-center md:justify-start gap-2">
                  <Sparkles className="w-4 h-4" /> Configurações
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Visibilidade da Carteira</span>
                    <div className="w-48">
                      <CustomSelect 
                        value={profile?.walletVisibility || 'private'}
                        onChange={(value) => updateProfile({ walletVisibility: value as any })}
                        options={[
                          { value: 'private', label: '🔒 Privada' },
                          { value: 'followers', label: '👥 Acesso para Seguidores' },
                          { value: 'public', label: '🌍 Público' }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="border-t border-border pt-6">
            <h4 className="font-bold mb-4">Minhas Atividades</h4>
            <div className="space-y-4">
                {posts.filter(p => p.userId === user?.uid).map(post => (
                  <PostCard key={post.id} post={post} onProfileClick={handleProfileClick} />
                ))}
                {posts.filter(p => p.userId === user?.uid).length === 0 && (
                  <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center">
                      <p className="text-sm text-muted-foreground">Você ainda não fez nenhuma publicação.</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="w-full h-[70vh] min-h-[600px] bg-card rounded-2xl border border-border overflow-hidden">
          <MessagesView />
        </div>
      )}
    </div>
  );
}
