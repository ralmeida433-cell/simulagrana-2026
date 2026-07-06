import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Users, Briefcase, Plus, TrendingUp, TrendingDown, 
  ChevronDown, ChevronRight, Info, Calendar, PieChart as PieChartIcon,
  Search, ArrowRight, Share2, DollarSign, Building2, Bell, BellOff, Globe, Check, Activity, MessageSquare, Clock,
  Lock, Unlock, ShieldCheck
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency, formatPercent } from '../lib/utils';
import { Avatar } from './ui/Avatar';
import { PortfolioAsset, PublicProfile, PortfolioWallet } from '../types/wallet';
import { socialService } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';

interface PublicPortfolioProps {
  profile: PublicProfile;
  onBack?: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Ações': TrendingUp,
  'FIIs': Building2,
  'ETFs': PieChartIcon,
  'Renda Fixa': DollarSign
};

const WalletOpeningAnimation = ({ 
  profile, 
  wallet, 
  onComplete 
}: { 
  profile: PublicProfile, 
  wallet: PortfolioWallet | undefined | null, 
  onComplete: () => void 
}) => {
  const isPrivate = !wallet || wallet.assets.length === 0;
  const isPartial = !isPrivate && (!wallet?.privacy?.showValues || !wallet?.privacy?.showRentability);

  useEffect(() => {
    // Wait slightly longer if it's public to let the user enjoy the opening state
    const timer = setTimeout(() => {
      onComplete();
    }, isPrivate ? 2500 : 3500);
    return () => clearTimeout(timer);
  }, [onComplete, isPrivate]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[20%] left-[30%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
         <div className="absolute bottom-[20%] right-[30%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '700ms' }} />
      </div>

      <motion.div 
        initial={{ scale: 0.9, y: 30, opacity: 0, rotateX: 20 }}
        animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
        exit={{ scale: 1.1, opacity: 0, filter: 'blur(10px)', rotateX: -10 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md p-8 bg-card/60 backdrop-blur-3xl border border-white/10 dark:border-white/5 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ transformPerspective: 1000 }}
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
        
        <div className="relative w-32 h-32 mb-6 flex items-center justify-center" style={{ perspective: '1000px' }}>
           <motion.div 
             className="relative w-24 h-16"
             initial={{ rotateX: 60, rotateZ: -20, y: 10 }}
             animate={{ rotateX: 20, rotateZ: 0, y: 0 }}
             transition={{ duration: 0.8, ease: 'easeOut' }}
             style={{ transformStyle: 'preserve-3d' }}
           >
              {/* Wallet Base (Back) */}
              <div 
                className="absolute inset-0 bg-slate-800 rounded-xl shadow-2xl border border-slate-700" 
                style={{ transform: 'translateZ(-2px)' }}
              />
              
              {/* Cards inside (slide out if public) */}
              <motion.div 
                 initial={{ y: 0, z: -1 }}
                 animate={{ y: isPrivate ? 0 : -25, z: -1 }}
                 transition={{ delay: 0.6, duration: 0.8, ease: "easeInOut" }}
                 className={cn("absolute top-1 left-2 right-2 h-12 rounded-lg shadow-lg border p-2 flex justify-between",
                   isPartial ? "bg-gradient-to-tr from-amber-400 to-orange-500 border-white/20" : "bg-gradient-to-tr from-primary to-primary/80 border-primary-foreground/20"
                 )}
                 style={{ transform: 'translateZ(-1px)' }}
              >
                  <div className="w-4 h-3 bg-white/30 rounded-sm" />
                  <div className="w-6 h-6 rounded-full bg-white/20" />
              </motion.div>

              <motion.div 
                 initial={{ y: 0, z: 0 }}
                 animate={{ y: (isPrivate || isPartial) ? 0 : -10, z: 0 }}
                 transition={{ delay: 0.7, duration: 0.8, ease: "easeInOut" }}
                 className="absolute top-2 left-3 right-3 h-12 bg-gradient-to-tr from-slate-600 to-slate-500 rounded-lg shadow-lg border border-white/10"
              />

              {/* Wallet Front Flap (Opens up) */}
              <motion.div
                 className="absolute inset-0 origin-bottom"
                 initial={{ rotateX: 0 }}
                 animate={{ rotateX: isPrivate ? -15 : -110 }}
                 transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
                 style={{ transformStyle: 'preserve-3d' }}
              >
                  {/* Front/Outer face */}
                  <div 
                    className="absolute inset-0 bg-slate-900 rounded-xl border border-slate-700 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center z-20"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                     <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 shadow-inner">
                        {isPrivate ? <Lock className="w-3 h-3 text-rose-500" /> : isPartial ? <Unlock className="w-3 h-3 text-amber-500" /> : <ShieldCheck className="w-3 h-3 text-primary" />}
                     </div>
                  </div>
                  {/* Inner face of the flap */}
                  <div 
                    className="absolute inset-0 bg-slate-800 rounded-xl border border-slate-700 flex flex-col justify-end p-2 z-10"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
                  >
                      <div className="w-full h-1 bg-slate-700/50 rounded-full mb-1" />
                      <div className="w-2/3 h-1 bg-slate-700/50 rounded-full" />
                  </div>
              </motion.div>
           </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-black text-foreground tracking-tight mb-2 relative z-10">
            {isPrivate ? 'Acesso Restrito' : isPartial ? 'Acesso Parcial Liberado' : 'Acesso Integral Concedido'}
          </h2>
          <p className="text-sm font-medium text-muted-foreground max-w-[260px] mx-auto relative z-10">
            {isPrivate 
              ? 'Este perfil limitou o acesso às suas informações financeiras. Algumas áreas estão bloqueadas.'
              : isPartial 
              ? 'Valores absolutos ocultos. Exibindo estratégia e percentuais do portfólio.'
              : 'Descriptografando terminal. Carregando dados completos do portfólio...'}
          </p>
        </motion.div>

        <div className="mt-8 w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden relative z-10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: isPrivate ? '30%' : isPartial ? '70%' : '100%' }}
            transition={{ duration: isPrivate ? 1.5 : 2.5, ease: "easeInOut" }}
            className={cn(
              "h-full rounded-full",
              isPrivate ? "bg-rose-500" : isPartial ? "bg-amber-500" : "bg-primary"
            )}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground relative z-10"
        >
          <ShieldCheck className="w-3 h-3" />
          Protocolo de Segurança Integrado
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default function PublicPortfolio({ profile, onBack }: PublicPortfolioProps) {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'assets' | 'dividends' | 'wallets' | 'discussions'>('assets');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Ações', 'FIIs', 'ETFs', 'Renda Fixa']);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isNavigatingChat, setIsNavigatingChat] = useState(false);
  const [realMetrics, setRealMetrics] = useState({ followers: profile.followers || 0, following: profile.following || 0 });
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isOpening, setIsOpening] = useState(true);

  useEffect(() => {
    if (!user || loading) return;
    
    // Register visitor
    if (profile.id && user.uid !== profile.id && profile.id !== 'andre-silva') {
      const myProfile = {
         name: user.displayName || 'Investidor',
         avatar: user.photoURL
      };
      socialService.visitProfile(profile.id, myProfile).catch(() => {});
      
      // Fetch Real Metrics
      socialService.getProfileMetrics(profile.id).then(metrics => {
         setRealMetrics({ followers: metrics.followers, following: metrics.following });
      }).catch(console.error);
    }

    const followId = `${user.uid}_${profile.id}`;
    const unsubscribe = onSnapshot(doc(db, 'follows', followId), (doc) => {
      if (doc.exists()) {
        setFollowStatus(doc.data().status || 'accepted');
        setAlertsEnabled(doc.data().alertsEnabled || false);
      } else {
        setFollowStatus('none');
        setAlertsEnabled(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `follows/${followId}`);
    });
    return () => unsubscribe();
  }, [user, loading, profile.id]);

  useEffect(() => {
    if (!profile.id) return;
    const q = query(
      collection(db, 'portfolio_comments'),
      where('portfolioId', '==', profile.id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      // It might fail if index is missing, safe fallback
      console.warn("Could not load comments realtime", error);
    });
    return () => unsubscribe();
  }, [profile.id]);

  const handlePostComment = async () => {
    if (!user || !newComment.trim()) return;
    setIsPostingComment(true);
    try {
      await addDoc(collection(db, 'portfolio_comments'), {
        portfolioId: profile.id,
        userId: user.uid,
        userName: user.displayName || 'Investidor',
        userAvatar: user.photoURL,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (error) {
      console.error(error);
      alert('Erro ao publicar comentário.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      if (followStatus !== 'none') {
        const confirm = window.confirm("Deseja realmente parar de seguir?");
        if (confirm) await socialService.unfollowUser(profile.id);
      } else {
        await socialService.followUser(profile.id);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      alert("Faça login para conversar.");
      return;
    }
    setIsNavigatingChat(true);
    try {
      const { chatService } = await import('../services/chatService');
      const chatId = await chatService.getOrCreateChat(profile.id);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'perfil');
      url.searchParams.set('section', 'messages');
      url.searchParams.set('chatId', chatId);
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new Event('popstate'));
    } catch (e: any) {
      alert("Erro ao iniciar conversa (pode faltar permissão ou ser um perfil mock)");
      setIsNavigatingChat(false);
    }
  };

  const handleToggleAlerts = async () => {
    if (!user || (followStatus !== 'accepted' && followStatus !== 'pending')) return;
    setIsUpdating(true);
    try {
      await socialService.toggleAlerts(profile.id, !alertsEnabled);
      alert(!alertsEnabled ? "Alertas ativados com sucesso!" : "Alertas desativados.");
    } catch (e: any) {
      console.error(e);
      alert("Erro ao alterar alertas: " + (e.message || String(e)));
    } finally {
      setIsUpdating(false);
    }
  };

  const wallet = profile.activeWallet;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const groupedAssets = useMemo(() => {
    if (!wallet) return {};
    return wallet.assets.reduce((acc, asset) => {
      if (!acc[asset.category]) acc[asset.category] = [];
      acc[asset.category].push(asset);
      return acc;
    }, {} as Record<string, PortfolioAsset[]>);
  }, [wallet]);

  const isEmpty = !wallet || wallet.assets.length === 0;

  return (
    <>
      <AnimatePresence>
        {isOpening && (
          <WalletOpeningAnimation 
            profile={profile} 
            wallet={wallet} 
            onComplete={() => setIsOpening(false)} 
          />
        )}
      </AnimatePresence>

      {!isOpening && (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
          {/* Header Profile Section with CSS3 Animated Effects */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-primary/20 rounded-full blur-[80px] animate-[pulse-glow_4s_ease-in-out_infinite]" />
        
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 pointer-events-none transition-opacity duration-700">
          <Globe size={160} className="animate-[spin_40s_linear_infinite]" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <div className="relative">
            {/* Animated Profile Ring */}
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-primary to-emerald-600 rounded-full opacity-70 animate-[profile-ring_4s_linear_infinite] blur-sm group-hover:opacity-100 transition-opacity" />
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-emerald-500 rounded-full animate-[profile-ring_3s_linear_infinite_reverse]" />
            
            <div className="relative p-1 rounded-full bg-card z-10 animate-[profile-glow_3s_ease-in-out_infinite]">
              <Avatar 
                src={profile.avatar || undefined} 
                alt={profile.name} 
                size="xl" 
                className="w-32 h-32 md:w-40 md:h-40 border-4 border-card relative z-20" 
              />
              
              {/* Floating Particles Around Avatar */}
              <div className="absolute inset-0 z-30 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-2 h-2 bg-emerald-400 rounded-full animate-[profile-particles_2s_ease-out_infinite]" />
                <div className="absolute top-1/2 right-0 w-1.5 h-1.5 bg-primary rounded-full animate-[profile-particles_2.5s_ease-out_infinite_0.5s]" />
                <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-emerald-300 rounded-full animate-[profile-particles_2.2s_ease-out_infinite_1s]" />
              </div>
            </div>
            
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg z-20 animate-[float-badge_3s_ease-in-out_infinite] group-hover:rotate-12 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center justify-center md:justify-start gap-3">
                  {profile.name}
                  <span className="text-sm font-medium text-muted-foreground px-2 py-0.5 bg-muted rounded-lg">
                    {profile.username}
                  </span>
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-muted-foreground text-sm font-medium">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {profile.location}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {realMetrics.followers} Seguidores</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {profile.publicWalletsCount} Carteiras Públicas</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartChat}
                  disabled={isNavigatingChat}
                  className="px-4 py-2.5 bg-muted/50 hover:bg-muted text-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-border"
                  title="Mensagem Direta"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Conversar</span>
                </button>
                {(followStatus === 'accepted' || followStatus === 'pending') && (
                  <button 
                    onClick={handleToggleAlerts}
                    disabled={isUpdating}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl transition-all shadow-sm border",
                      alertsEnabled 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                        : "bg-muted text-muted-foreground hover:bg-accent border-transparent"
                    )}
                    title={alertsEnabled ? "Desativar alertas" : "Ativar alertas de movimentação"}
                  >
                    {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                )}
                <button 
                  onClick={handleFollow}
                  disabled={isUpdating}
                  className={cn(
                    "px-6 py-2.5 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2",
                    followStatus === 'accepted' || followStatus === 'pending'
                      ? "bg-muted border border-border text-foreground hover:bg-accent" 
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  )}
                >
                  {followStatus === 'accepted' ? (
                    <><Check className="w-4 h-4" /> Seguindo</>
                  ) : followStatus === 'pending' ? (
                    <><Clock className="w-4 h-4 opacity-70" /> Solicitado</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Seguir Carteira</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/50 pt-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
             Carteira Pública: <span className="text-emerald-500">{wallet?.name || 'Oculta'}</span>
          </h2>

          {wallet ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard 
                label="Rentabilidade Total" 
                value={wallet.privacy.showRentability ? wallet.totalRentability : 'Oculto'} 
                subtitle="YTD" 
                positive={true} 
              />
              <SummaryCard 
                label="Valor Total" 
                value={wallet.privacy.showValues ? formatCurrency(wallet.totalValue) : 'R$ •••••'} 
                subtitle="Atualizado" 
              />
              <SummaryCard 
                label="Patrimônio Aberto" 
                value={`${wallet.openPatrimony}%`} 
                subtitle="Visibilidade" 
              />
              <div className="bg-muted/30 p-4 rounded-2xl h-24">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={wallet.history.slice(-10)}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="100%">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 p-12 rounded-3xl text-center border border-dashed border-border">
               <Globe className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-foreground">Perfil Restrito</h3>
               <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                 Este usuário optou por manter suas carteiras privadas. Você pode segui-lo para receber alertas se ele decidir tornar uma carteira pública.
               </p>
            </div>
          )}
        </div>
      </div>

      {wallet ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Navigation */}
            <div className="flex bg-muted/50 p-1.5 rounded-2xl w-max border border-border shadow-inner">
              <TabButton 
                active={activeTab === 'assets'} 
                onClick={() => setActiveTab('assets')} 
                label="Ativos da Carteira" 
              />
              <TabButton 
                active={activeTab === 'dividends'} 
                onClick={() => setActiveTab('dividends')} 
                label="Proventos" 
              />
              <TabButton 
                active={activeTab === 'wallets'} 
                onClick={() => setActiveTab('wallets')} 
                label="Carteiras & Patrimônio" 
              />
              <TabButton 
                active={activeTab === 'discussions'} 
                onClick={() => setActiveTab('discussions')} 
                label="Discussão da Comunidade" 
              />
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'assets' && (
                <motion.div 
                  key="assets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm"
                >
                  <div className="p-4 md:p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      Ativos da Carteira
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="search" 
                          placeholder="Pesquisar ativo..." 
                          className="pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 outline-none w-48 md:w-64"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ativo</th>
                          <th className="px-4 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Classe</th>
                          <th className="px-4 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">% Carteira</th>
                          <th className="px-4 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Qtd</th>
                          {wallet.privacy.showValues && <th className="px-4 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Custo Médio</th>}
                          <th className="px-4 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Cotação Atual</th>
                          <th className="px-4 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Rentabilidade</th>
                          <th className="px-4 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Oscilação</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Proventos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {Object.keys(groupedAssets).length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-12 text-center text-muted-foreground">
                              <Globe className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" />
                              <p className="font-medium text-lg text-foreground">Carteira Pública Vazia</p>
                              <p className="text-sm">Este usuário ainda não publicou ativos na sua carteira.</p>
                            </td>
                          </tr>
                        ) : (
                          Object.keys(groupedAssets).map((category) => (
                            <React.Fragment key={category}>
                            <tr 
                              className="bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
                              onClick={() => toggleCategory(category)}
                            >
                              <td colSpan={wallet.privacy.showValues ? 9 : 8} className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  {expandedCategories.includes(category) ? <ChevronDown className="w-4 h-4 text-emerald-500" /> : <ChevronRight className="w-4 h-4 text-emerald-500" />}
                                  {React.createElement(CATEGORY_ICONS[category] || Info, { className: "w-4 h-4 text-emerald-500" })}
                                  <span className="text-sm font-bold text-foreground">{category}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({groupedAssets[category].length} ativos)</span>
                                </div>
                              </td>
                            </tr>
                            <AnimatePresence>
                              {expandedCategories.includes(category) && groupedAssets[category].map((asset, idx) => (
                                <motion.tr 
                                  key={`${asset.ticker}-${idx}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="hover:bg-muted/5 transition-colors group"
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center p-1.5 border border-border group-hover:border-emerald-500/30 transition-colors">
                                        <img 
                                          src={asset.icon || `https://s3-symbol-logo.tradingview.com/${asset.ticker.replace('.SA', '').toLowerCase()}--big.svg`} 
                                          alt={asset.ticker} 
                                          className="w-full h-full object-contain rounded-sm"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (asset.icon && target.src === asset.icon) {
                                              target.src = `https://s3-symbol-logo.tradingview.com/${asset.ticker.replace('.SA', '').toLowerCase()}--big.svg`;
                                            } else if (!target.src.includes('brapi.dev')) {
                                              target.src = `https://brapi.dev/favicon.ico?ticker=${asset.ticker}`;
                                            } else {
                                              target.src = 'https://picsum.photos/seed/wallet/40/40';
                                            }
                                          }}
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm tracking-tight">{asset.ticker}</p>
                                        <p className="text-[10px] text-muted-foreground truncate w-32">{asset.name}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-xs font-semibold">{asset.category}</td>
                                  <td className="px-4 py-4 text-right">
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm font-bold">{asset.percentage}%</span>
                                      <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                        <div 
                                          className="h-full bg-emerald-500 rounded-full" 
                                          style={{ width: `${asset.percentage}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-right text-sm font-medium">{asset.quantity}</td>
                                  {wallet.privacy.showValues && <td className="px-4 py-4 text-right text-sm font-medium">{formatCurrency(asset.averagePrice)}</td>}
                                  <td className="px-4 py-4 text-right text-sm font-bold">{formatCurrency(asset.currentPrice)}</td>
                                  <td className={cn(
                                    "px-4 py-4 text-right text-sm font-black",
                                    asset.rentability > 0 ? "text-emerald-500" : "text-rose-500"
                                  )}>
                                    {asset.rentability > 0 ? '+' : ''}{asset.rentability}%
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                       <span className={cn(
                                         "text-xs font-bold",
                                         asset.dailyVariation > 0 ? "text-emerald-500" : "text-rose-500"
                                       )}>
                                         {asset.dailyVariation > 0 ? '+' : ''}{asset.dailyVariation}%
                                       </span>
                                       <div className="w-16 h-8">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={Array.from({length: 10}, (_, i) => ({v: Math.random()}))}>
                                              <Line type="monotone" dataKey="v" stroke={asset.dailyVariation > 0 ? "#10B981" : "#F43F5E"} strokeWidth={1.5} dot={false} />
                                            </LineChart>
                                          </ResponsiveContainer>
                                       </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium space-y-1">
                                    {asset.dividendsPaid > 0 && <p className="text-muted-foreground"><span className="text-foreground">Pago:</span> {formatCurrency(asset.dividendsPaid)}</p>}
                                    {asset.dividendsAwaiting > 0 && <p className="text-emerald-500/80"><span className="text-emerald-600 font-bold">Aguardando:</span> {formatCurrency(asset.dividendsAwaiting)}</p>}
                                    {asset.dividendsPaid === 0 && asset.dividendsAwaiting === 0 && <span className="text-muted-foreground opacity-50 space-y-1">-</span>}
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </React.Fragment>
                        )))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'dividends' && (
                <motion.div 
                  key="dividends"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm">
                         <h4 className="font-bold mb-6 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            Proventos Mensais
                         </h4>
                         <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {wallet.dividends.map((div, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all">
                                 <div>
                                    <p className="text-sm font-bold">{div.month}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Rendimento: {div.yield}%</p>
                                 </div>
                                 <p className="text-base font-black text-emerald-500">{formatCurrency(div.amount)}</p>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="md:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-sm">
                         <h4 className="font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Histórico de Proventos Mensais
                         </h4>
                         <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={wallet.dividends.slice().reverse()}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                  <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                  />
                                  <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={24} />
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'wallets' && (
                <motion.div 
                  key="wallets"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                   <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <h4 className="font-bold mb-6 flex items-center gap-2">
                         <PieChartIcon className="w-5 h-5 text-amber-500" />
                         Visão Geral de Alocação
                      </h4>
                      <div className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie
                                  data={Object.keys(groupedAssets).map(cat => ({ 
                                    name: cat, 
                                    value: groupedAssets[cat].reduce((sum, a) => sum + a.percentage, 0) 
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                               >
                                  {Object.keys(groupedAssets).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#6366F1'][index % 4]} />
                                  ))}
                               </Pie>
                               <Tooltip />
                               <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <h4 className="font-bold mb-6 flex items-center gap-2">
                         <Globe className="w-5 h-5 text-indigo-500" />
                         Distribuição Setorial (Top 8)
                      </h4>
                      <div className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie
                                  data={[
                                    { name: 'Financeiro', value: 35 },
                                    { name: 'Energia Elétrica', value: 25 },
                                    { name: 'Saneamento', value: 15 },
                                    { name: 'Logística', value: 10 },
                                    { name: 'Imobiliário', value: 15 },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  labelLine={false}
                               >
                                  {[0,1,2,3,4].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'][index % 5]} />
                                  ))}
                               </Pie>
                               <Tooltip />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'discussions' && (
                <motion.div 
                  key="discussions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6"
                >
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                    Discussão da Carteira
                  </h3>
                  
                  <div className="flex gap-4">
                    <Avatar src={user?.photoURL || undefined} alt={user?.displayName || 'Você'} size="md" />
                    <div className="flex-1 space-y-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="O que você achou dessa carteira? Tem alguma dúvida ou sugestão para o investidor?"
                        className="w-full min-h-[100px] p-4 bg-muted/30 border border-border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handlePostComment}
                          disabled={!newComment.trim() || isPostingComment}
                          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPostingComment ? 'Enviando...' : 'Comentar'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 mt-8 pt-8 border-t border-border">
                    {comments.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-3" />
                        <p className="text-muted-foreground">Nenhum comentário ainda. Seja o primeiro a iniciar a discussão!</p>
                      </div>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="flex gap-4">
                          <Avatar src={comment.userAvatar} alt={comment.userName} size="md" />
                          <div className="flex-1">
                            <div className="bg-muted/30 border border-border rounded-2xl rounded-tl-none p-4 shadow-sm inline-block min-w-[200px] max-w-full">
                              <p className="font-bold text-sm text-foreground mb-1">{comment.userName}</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 ml-1">
                              {comment.createdAt?.seconds 
                                ? new Date(comment.createdAt.seconds * 1000).toLocaleString('pt-BR') 
                                : 'Agora mesmo'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Insights */}
          <div className="lg:col-span-4 space-y-6">
             {/* Benchmarking */}
             <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                   <TrendingUp className="w-4 h-4 text-emerald-500" />
                   Rentabilidade & Oscilação
                </h3>
                <div className="space-y-6">
                   <div>
                      <h4 className="text-xs font-bold text-muted-foreground mb-3 flex justify-between">
                         Desempenho da Carteira vs. IBOV <span>Últimos 12 meses</span>
                      </h4>
                      <div className="h-40">
                         <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={wallet.history}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                              <Tooltip contentStyle={{ borderRadius: '12px' }} />
                              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} name="Carteira" />
                              <Line type="monotone" dataKey="benchmark" stroke="#F59E0B" strokeWidth={2} dot={false} name="IBOV" />
                           </LineChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-border">
                      <h4 className="text-xs font-bold text-muted-foreground mb-3">Evolução do Patrimônio</h4>
                      <div className="h-40">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={wallet.history.slice(-6)}>
                               <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>
             </div>

             {/* High/Low Movers */}
             <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                   <Activity className="w-4 h-4 text-indigo-500" />
                   Principais Oscilações (Hoje)
                </h3>
                <div className="space-y-3">
                   {wallet.assets.sort((a, b) => Math.abs(b.dailyVariation) - Math.abs(a.dailyVariation)).slice(0, 5).map((asset, idx) => (
                     <div key={`${asset.ticker}-${idx}`} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center p-1 border border-border">
                             <img 
                               src={asset.icon || `https://s3-symbol-logo.tradingview.com/${asset.ticker.replace('.SA', '').toLowerCase()}--big.svg`} 
                               alt={asset.ticker} 
                               className="w-full h-full object-contain"
                               onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 if (asset.icon && target.src === asset.icon) {
                                   target.src = `https://s3-symbol-logo.tradingview.com/${asset.ticker.replace('.SA', '').toLowerCase()}--big.svg`;
                                 } else if (!target.src.includes('brapi.dev')) {
                                   target.src = `https://brapi.dev/favicon.ico?ticker=${asset.ticker}`;
                                 } else {
                                   target.src = 'https://picsum.photos/seed/wallet/40/40';
                                 }
                               }}
                               referrerPolicy="no-referrer"
                             />
                           </div>
                           <span className="text-sm font-bold">{asset.ticker}</span>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1.5 text-xs font-black",
                          asset.dailyVariation > 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                           {asset.dailyVariation > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                           {asset.dailyVariation > 0 ? '+' : ''}{asset.dailyVariation}%
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Recommendation/Follow Info */}
             <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/30 overflow-hidden relative">
                <div className="absolute -right-8 -bottom-8 opacity-20 transform -rotate-12">
                   <Briefcase size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                   <h4 className="text-lg font-black leading-tight">Gostou da estratégia do {profile.name}?</h4>
                   <p className="text-indigo-100 text-sm leading-relaxed opacity-90">
                      Acompanhe em tempo real todas as movimentações e proventos desta carteira recebendo notificações exclusivas.
                   </p>
                   <button 
                     onClick={alertsEnabled ? handleToggleAlerts : async () => {
                       if (!user) {
                         alert("Faça login para continuar.");
                         return;
                       }
                       setIsUpdating(true);
                       try {
                         if (followStatus === 'none') {
                           await socialService.followUser(profile.id);
                         }
                         await socialService.toggleAlerts(profile.id, true);
                         alert("Alertas ativados com sucesso!");
                       } catch (e: any) {
                         console.error(e);
                         alert("Erro ao ativar alertas: " + (e.message || String(e)));
                       } finally {
                         setIsUpdating(false);
                       }
                     }}
                     disabled={isUpdating}
                     className={cn(
                       "w-full py-3 font-bold rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2", 
                       alertsEnabled ? "bg-indigo-700 text-indigo-100 hover:bg-indigo-800" : "bg-white text-indigo-600 hover:bg-indigo-50"
                     )}
                   >
                     {alertsEnabled ? (
                       <>
                         <BellOff className="w-5 h-5" />
                         Desativar Alertas
                       </>
                     ) : (
                       <>
                         <Bell className="w-5 h-5" />
                         Ativar Alertas de Carteira
                       </>
                     )}
                   </button>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/10 p-12 rounded-3xl text-center border border-dashed border-border/50">
           <p className="text-muted-foreground">Nenhuma carteira pública disponível para exibição.</p>
        </div>
      )}
        </div>
      )}
    </>
  );
}

function SummaryCard({ label, value, subtitle, positive }: { label: string, value: string, subtitle: string, positive?: boolean }) {
  return (
    <div className="bg-card border border-border p-4 rounded-2xl hover:border-emerald-500/30 transition-all duration-300">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={cn("text-xl font-black tracking-tight", positive ? "text-emerald-500" : "text-foreground")}>
          {value}
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground font-medium mt-1">{subtitle}</p>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 text-xs font-bold rounded-xl transition-all duration-300",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/40"
      )}
    >
      {label}
    </button>
  );
}
