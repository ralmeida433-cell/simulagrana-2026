import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Flame, 
  Sun, 
  Moon,
  Contrast,
  Home, 
  Briefcase, 
  LayoutDashboard,
  Search,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  Wallet,
  BarChart3,
  Car,
  Zap,
  DollarSign,
  Info,
  Mail,
  FileText,
  Video,
  Building2,
  Calculator,
  LineChart,
  PieChart,
  Target,
  Activity,
  Landmark,
  Wand2,
  FileSearch,
  PiggyBank,
  ShieldCheck,
  Key,
  Globe,
  User,
  MessageSquare,
  Handshake,
  HelpCircle,
  Star,
  BrainCircuit,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useAuth } from './contexts/AuthContext';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/tooltip';
import { fetchFinanceData, FinanceData } from './services/financeService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Components
import { AnimatedLogo } from './components/common/AnimatedLogo';
import { SplashScreen } from './components/SplashScreen';
import Dashboard from './components/Dashboard';
import { GuidedTour } from './components/GuidedTour';
import CompoundInterest from './components/calculators/CompoundInterest';
import SolarCalculator from './components/calculators/SolarCalculator';
import RealEstateCRM from './components/real-estate-crm/RealEstateCRM';
import MEICalculator from './components/calculators/MEICalculator';
import MagicNumberCalculator from './components/calculators/MagicNumberCalculator';
import GrahamCalculator from './components/calculators/GrahamCalculator';
import BazinCalculator from './components/calculators/BazinCalculator';
import PeterLynch from './components/calculators/PeterLynch';
import VehicleCalculator from './components/calculators/VehicleCalculator';
import ElectricVsGasCalculator from './components/calculators/ElectricVsGasCalculator';
import BarsiCalculator from './components/calculators/BarsiCalculator';
import FixedIncomeCalculator from './components/calculators/FixedIncomeCalculator';
import TesouroDiretoCalculator from './components/calculators/TesouroDiretoCalculator';
import BuyAndHold from './components/calculators/BuyAndHold';
import Marketplace from './components/marketplace/Marketplace';
import WalletManager from './components/WalletManager';
import InvestmentPortfolio from './components/InvestmentPortfolio';
import Profile from './components/Profile';
import IpcaCalculatorModal from './components/calculators/IpcaCalculatorModal';
import DollarConverterModal from './components/calculators/DollarConverterModal';
import DisclaimerModal from './components/DisclaimerModal';
import BirthdateModal from './components/BirthdateModal';

import FundamentalAnalysis from './components/FundamentalAnalysis';
import FiiAnalysis from './components/FiiAnalysis';
import Pesquisa from './components/Pesquisa';
import Favoritos from './components/Favoritos';
import CreatorModeSettings from './components/CreatorModeSettings';
import CameraWidget from './components/CameraWidget';
import RecordingStudio from './components/RecordingStudio';
import { CreatorModeProvider } from './contexts/CreatorModeContext';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import { UserMenu } from './components/UserMenu';
import WalletFollow from './components/WalletFollow';
import NotificationCenter from './components/social/NotificationCenter';
import { FinanceProvider } from './contexts/FinanceContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import InstallPWA from './components/InstallPWA';

// Legal & Info Pages
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfService from './components/legal/TermsOfService';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import MessagesView from './components/social/MessagesView';
import NegotiationsDashboard from './components/negotiations/NegotiationsDashboard';

type Tab = 'dashboard' | 'pesquisa' | 'favoritos' | 'buy-and-hold' | 'compound' | 'solar' | 'financing' | 'mei' | 'magic' | 'portfolio' | 'graham' | 'bazin' | 'wallet' | 'vehicle' | 'electric-vs-gas' | 'peter-lynch' | 'barsi' | 'fixed-income' | 'tesouro-direto' | 'fundamental-analysis' | 'fii-analysis' | 'creator-mode' | 'walletfollow' | 'perfil' | 'privacy' | 'terms' | 'about' | 'contact' | 'negotiations' | 'messages';

export default function App() {
  const { user, profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as Tab;
      if (tab) return tab;
    }
    return 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIpcaOpen, setIsIpcaOpen] = useState(false);
  const [isDollarConverterOpen, setIsDollarConverterOpen] = useState(false);
  const [marketIndices, setMarketIndices] = useState<any[]>([]);
  const [userBirthdate, setUserBirthdate] = useState<string | null>(null);
  const [isBirthdateModalOpen, setIsBirthdateModalOpen] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isGuidedTourOpen, setIsGuidedTourOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Geral': true,
    'Investimentos & Ações': false,
    'Renda Fixa & Aposentadoria': false,
    'Bens & Financiamentos': false,
    'Negócios': false,
    'Criadores de Conteúdo': false,
    'Informações': false
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  type Theme = 'light' | 'dark' | 'deep-dark';
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved && ['light', 'dark', 'deep-dark'].includes(saved)) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const sidebarExpanded = isSidebarOpen || isMobileMenuOpen;

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as Tab;
      if (tab && tab !== activeTab) setActiveTab(tab);
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [activeTab]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== activeTab) {
      url.searchParams.set('tab', activeTab);
      window.history.pushState({}, '', url.toString());
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl or Meta (Cmd on Mac) is pressed
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        
        if (key === 'i') {
          e.preventDefault();
          setIsIpcaOpen(prev => !prev);
        } else if (key === 'd') {
          e.preventDefault();
          setIsDollarConverterOpen(prev => !prev);
        } else if (key === 'g') {
          e.preventDefault();
          setActiveTab('creator-mode');
          setIsMobileMenuOpen(false);
        }
      }

      // Fullscreen handling
      if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error(`Erro ao tentar entrar em tela cheia: ${err.message}`);
          });
        } else {
          document.exitFullscreen();
        }
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'theme-contrast', 'deep-dark');
    
    let currentThemeColor = '#ffffff';

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      currentThemeColor = '#000000'; // Make notch pure black always in dark modes
    } else if (theme === 'deep-dark') {
      document.documentElement.classList.add('deep-dark', 'dark');
      currentThemeColor = '#000000'; 
    }

    localStorage.setItem('theme', theme);
    
    // Update theme-color meta tag dynamically
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    // Note: We remove the media queries since we are explicitly setting it now
    if (metaThemeColor.hasAttribute('media')) {
      metaThemeColor.removeAttribute('media');
    }
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => {
      el.setAttribute('content', currentThemeColor);
      el.removeAttribute('media');
    });

  }, [theme]);

  useEffect(() => {
    if (profile?.preferences?.theme) {
      const userTheme = profile.preferences.theme as Theme;
      if (userTheme && ['light', 'dark', 'deep-dark'].includes(userTheme)) {
        setTheme(userTheme);
      }
    }
  }, [profile?.preferences?.theme]);

  const cycleTheme = () => {
    let nextTheme: Theme = 'light';
    if (theme === 'light') nextTheme = 'dark';
    else if (theme === 'dark') nextTheme = 'deep-dark';
    else nextTheme = 'light';

    setTheme(nextTheme);

    if (user && profile && updateProfile) {
      updateProfile({
        preferences: {
          ...profile.preferences,
          theme: nextTheme
        }
      }).catch(err => console.error('Error updating profile theme:', err));
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchFinanceData();
      setFinanceData(data);
      setIsLoading(false);
      
      // Fetch indices for ticker
      try {
        const res = await fetch('/api/fin/indices');
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const indices = await res.json();
            setMarketIndices(indices);
          } else {
             console.warn('Indices API returned non-JSON response:', await res.text().then(t => t.slice(0, 100)));
          }
        }
      } catch (e) {
        console.error('Failed to fetch indices');
      }
    };
    
    loadData();
    
    // Set up refresh interval (every 10 minutes)
    const interval = setInterval(loadData, 10 * 60 * 1000);

    // Check terms and birthdate
    const termsAccepted = localStorage.getItem('simulagrana_terms_accepted') === 'true';
    setIsTermsAccepted(termsAccepted);

    const savedBirthdate = localStorage.getItem('userBirthdate');
    if (savedBirthdate) {
      setUserBirthdate(savedBirthdate);
      // Auto-trigger tour on mount if terms and birthdate are done
      const tourCompleted = localStorage.getItem('simulagrana_tour_completed') === 'true';
      if (!tourCompleted) {
        setIsGuidedTourOpen(true);
      }
    } else if (termsAccepted) {
      setIsBirthdateModalOpen(true);
    }

    return () => clearInterval(interval);
  }, []);

  const handleTermsAccept = () => {
    setIsTermsAccepted(true);
    const savedBirthdate = localStorage.getItem('userBirthdate');
    if (!savedBirthdate) {
      setIsBirthdateModalOpen(true);
    } else {
      const tourCompleted = localStorage.getItem('simulagrana_tour_completed') === 'true';
      if (!tourCompleted) {
        setIsGuidedTourOpen(true);
      }
    }
  };

  const handleBirthdateSave = (birthdate: string) => {
    setUserBirthdate(birthdate);
    localStorage.setItem('userBirthdate', birthdate);
    setIsBirthdateModalOpen(false);
    
    const tourCompleted = localStorage.getItem('simulagrana_tour_completed') === 'true';
    if (!tourCompleted) {
      setIsGuidedTourOpen(true);
    }
  };

  const menuGroups = [
    {
      title: 'Destaques & Principais',
      items: [
        { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
        { id: 'portfolio', label: 'Gestão de Carteira', icon: Briefcase, highlight: true },
        { id: 'buy-and-hold', label: 'Buy and Hold', icon: ShieldCheck, highlight: true },
        { id: 'fii-analysis', label: 'Análise de FIIs (IA)', icon: Building2, highlight: true },
        { id: 'walletfollow', label: 'Comunidade (WalletFollow)', icon: Globe, highlight: true },
        { id: 'creator-mode', label: 'Análise Preview', icon: Video, highlight: true },
      ]
    },
    {
      title: 'Explorar',
      items: [
        { id: 'pesquisa', label: 'Pesquisa de Ativos', icon: Search },
        { id: 'fundamental-analysis', label: 'Análise Fundamentalista', icon: FileSearch },
        { id: 'favoritos', label: 'Ativos Favoritos', icon: Star },
        { id: 'messages', label: 'Mensagens e Alertas', icon: MessageSquare },
        { id: 'perfil', label: 'Meu Perfil', icon: User },
      ]
    },
    {
      title: 'Calculadoras de Ações',
      items: [
        { id: 'compound', label: 'Juros Compostos', icon: Calculator },
        { id: 'graham', label: 'Valuation Graham', icon: LineChart },
        { id: 'bazin', label: 'Dividendos Bazin', icon: PieChart },
        { id: 'peter-lynch', label: 'Peter Lynch (PEG)', icon: Target },
        { id: 'barsi', label: 'Método Luiz Barsi', icon: Landmark },
        { id: 'magic', label: 'Magic Number FII', icon: Wand2 },
      ]
    },
    {
      title: 'Renda Fixa & Conexão',
      items: [
        { id: 'fixed-income', label: 'Renda Fixa (CDB/LCI/LCA)', icon: PiggyBank },
        { id: 'tesouro-direto', label: 'Tesouro Direto', icon: ShieldCheck },
        { id: 'wallet', label: 'Conexão Bancária (Open Finance)', icon: Wallet },
      ]
    },
    {
      title: 'Bens & Financiamentos',
      items: [
        { id: 'vehicle', label: 'Simulador SimulaCar', icon: Car },
        { id: 'financing', label: 'Simulador SimulaLar', icon: Building2 },
        { id: 'negotiations', label: 'Central de Negociações', icon: Handshake },
        { id: 'electric-vs-gas', label: 'Elétrico vs Gasolina', icon: Zap },
        { id: 'solar', label: 'Energia Solar', icon: Sun },
      ]
    },
    {
      title: 'Negócios & Sistema',
      items: [
        { id: 'mei', label: 'Simulador Tributário Pro', icon: Briefcase },
        { id: 'tour', label: 'Tour pelo Dashboard', icon: HelpCircle },
        { id: 'about', label: 'Sobre Nós', icon: Info },
        { id: 'contact', label: 'Contato', icon: Mail },
        { id: 'privacy', label: 'Privacidade e Termos', icon: ShieldCheck },
      ]
    }
  ];

  const allMenuItems = menuGroups.flatMap(group => group.items);

  const renderContent = () => {
    if (isLoading || !financeData) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-muted-foreground  font-medium">Atualizando taxas reais...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} financeData={financeData} onOpenIpca={() => setIsIpcaOpen(true)} onOpenDollarConverter={() => setIsDollarConverterOpen(true)} />;
      case 'pesquisa': return <Pesquisa />;
      case 'favoritos': return <Favoritos />;
      case 'portfolio': return <InvestmentPortfolio />;
      case 'buy-and-hold': return <BuyAndHold />;
      case 'compound': return <CompoundInterest financeData={financeData} userBirthdate={userBirthdate} onOpenBirthdateModal={() => setIsBirthdateModalOpen(true)} />;
      case 'magic': return <MagicNumberCalculator userBirthdate={userBirthdate} />;
      case 'wallet': return <WalletManager />;
      case 'solar': return <SolarCalculator financeData={financeData} />;
      case 'financing': return <RealEstateCRM financeData={financeData} userBirthdate={userBirthdate} />;
      case 'mei': return <MEICalculator financeData={financeData} />;
      case 'graham': return <GrahamCalculator financeData={financeData} />;
      case 'bazin': return <BazinCalculator />;
      case 'peter-lynch': return <PeterLynch />;
      case 'vehicle': return <Marketplace />;
      case 'electric-vs-gas': return <ElectricVsGasCalculator />;
      case 'barsi': return <BarsiCalculator />;
      case 'fixed-income': return <FixedIncomeCalculator financeData={financeData} userBirthdate={userBirthdate} />;
      case 'tesouro-direto': return <TesouroDiretoCalculator financeData={financeData} userBirthdate={userBirthdate} />;
      case 'fundamental-analysis': return <FundamentalAnalysis />;
      case 'fii-analysis': return <FiiAnalysis />;
      case 'walletfollow': return <WalletFollow />;
      case 'negotiations': return <NegotiationsDashboard />;
      case 'perfil': return <Profile onNavigate={(tab: any) => setActiveTab(tab)} />;
      case 'messages': return <MessagesView />;
      case 'creator-mode': return <CreatorModeSettings />;
      case 'about': return <About />;
      case 'contact': return <Contact />;
      case 'privacy': return <PrivacyPolicy />;
      case 'terms': return <TermsOfService />;
      default: return <Dashboard onNavigate={setActiveTab} financeData={financeData} onOpenIpca={() => setIsIpcaOpen(true)} onOpenDollarConverter={() => setIsDollarConverterOpen(true)} />;
    }
  };

  return (
    <FinanceProvider initialData={financeData} isLoading={isLoading}>
    <FavoritesProvider>
    <AudioPlayerProvider>
      <CreatorModeProvider>
        <TooltipProvider delay={200}>
          <AnimatePresence>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
          </AnimatePresence>
          <div className="flex h-[100dvh] bg-background text-foreground font-sans overflow-hidden transition-colors duration-200">
          <DisclaimerModal onAccept={handleTermsAccept} />
          <BirthdateModal isOpen={isBirthdateModalOpen} onSave={handleBirthdateSave} />
          <CameraWidget />
          <RecordingStudio />
          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-[2px]"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <aside 
            id="sidebar-nav-container"
            className={cn(
              "bg-card border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-[transform,opacity,width] duration-300 ease-in-out flex flex-col fixed md:relative z-50 h-[100dvh] pt-safe pb-safe md:pt-0 md:pb-0",
              sidebarExpanded ? "w-72" : "w-20",
              isMobileMenuOpen 
                ? "translate-x-0 opacity-100 pointer-events-auto" 
                : "-translate-x-full opacity-0 pointer-events-none md:translate-x-0 md:opacity-100 md:pointer-events-auto"
            )}
          >
            <div className="p-4 md:p-6 flex items-center justify-between border-b border-border">
              {sidebarExpanded && (
                <div className="flex items-center gap-3">
                  <img 
                    src="/simulagranalogo.svg" 
                    alt="SimulaGrana Logo" 
                    className="w-12 h-12 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-bold text-xl tracking-tighter text-foreground">SimulaGrana</span>
                </div>
              )}
              {!sidebarExpanded && (
                <img 
                  src="/simulagranalogo.svg" 
                  alt="Logo" 
                  className="w-12 h-12 object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              )}
              {isMobileMenuOpen && (
                <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {menuGroups.map((group, groupIndex) => {
                const isGroupExpanded = expandedGroups[group.title] !== false;
                
                return (
                  <div key={groupIndex} className="space-y-1">
                    {groupIndex > 0 && (
                      <div className={cn("mx-3 my-4 border-t border-border/40", !sidebarExpanded && "mx-4 my-3")} />
                    )}

                    {sidebarExpanded && (
                      <button 
                        onClick={() => toggleGroup(group.title)}
                        className={cn(
                          "w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest mb-1.5 mt-2 transition-all duration-200 group text-left",
                          group.title === 'Destaques & Principais' 
                            ? "text-emerald-700 dark:text-emerald-400/90 hover:text-emerald-600 dark:hover:text-emerald-300" 
                            : "text-muted-foreground/60 hover:text-foreground/90"
                        )}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          {group.title === 'Destaques & Principais' && <Star className="w-3.5 h-3.5" />}
                          {group.title}
                        </span>
                        <ChevronDown className={cn(
                          "w-3.5 h-3.5 transition-transform duration-250 ease-in-out shrink-0", 
                          group.title === 'Destaques & Principais' ? "text-emerald-600/50 group-hover:text-emerald-500" : "text-muted-foreground/40 group-hover:text-foreground/70",
                          isGroupExpanded ? "" : "-rotate-90"
                        )} />
                      </button>
                    )}
                    
                    <AnimatePresence initial={false}>
                      {(!sidebarExpanded || isGroupExpanded) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="space-y-1 overflow-hidden"
                        >
                          {group.items.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                              <Tooltip key={item.id}>
                                <TooltipTrigger render={(triggerProps) => (
                                  <button
                                    {...triggerProps}
                                    id={`nav-item-${item.id}`}
                                    onClick={() => {
                                      if (item.id === 'tour') {
                                        setIsGuidedTourOpen(true);
                                        setIsMobileMenuOpen(false);
                                      } else {
                                        setActiveTab(item.id as Tab);
                                        setIsMobileMenuOpen(false);
                                      }
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-250 ease-in-out group relative text-left text-sm z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                                      isActive 
                                        ? "text-primary font-semibold bg-primary/[0.06] border border-primary/10 shadow-sm active:scale-[0.98] active:bg-primary/[0.12]" 
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40 active:scale-[0.98] active:bg-muted/60",
                                      item.highlight && !isActive && "text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent hover:from-emerald-500/20 hover:to-emerald-500/5",
                                      !sidebarExpanded && "justify-center px-0 py-3"
                                    )}
                                  >
                                    {isActive && (
                                      <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute inset-0 bg-primary/10 rounded-xl z-[-1]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                      />
                                    )}
                                    
                                    {/* Active subtle left accent indicator */}
                                    {isActive && (
                                      <div className={cn(
                                        "absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-primary rounded-r",
                                        !sidebarExpanded && "left-0.5"
                                      )} />
                                    )}

                                    {/* Hover subtle background for non-active */}
                                    {!isActive && (
                                      <div className="absolute inset-0 rounded-xl bg-accent scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-10 transition-all duration-300 z-[-1]" />
                                    )}

                                    <item.icon className={cn(
                                      "w-5 h-5 shrink-0 transition-transform duration-250 ease-out",
                                      isActive ? "text-primary scale-110" : (item.highlight ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground group-hover:scale-105")
                                    )} />
                                    
                                    {sidebarExpanded && (
                                      <span className={cn(
                                        "flex-1 truncate transition-colors duration-200",
                                        item.highlight && "pr-2"
                                      )}>
                                        {item.label}
                                      </span>
                                    )}
                                    
                                    {item.highlight && sidebarExpanded && (
                                      <span className="ml-auto flex shrink-0 items-center justify-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider border border-emerald-500/30">
                                        Novo
                                      </span>
                                    )}
                                    
                                    {isActive && sidebarExpanded && !item.highlight && (
                                      <motion.div
                                        initial={{ x: -5, opacity: 0 }}
                                        animate={{ x: 0, opacity: 0.6 }}
                                        transition={{ delay: 0.05, duration: 0.2 }}
                                      >
                                        <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />
                                      </motion.div>
                                    )}
                                  </button>
                                )} />
                                <TooltipContent side="right" align="center" className="font-semibold text-xs py-1.5 px-3">
                                  {item.label}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* Status / Version */}
            <div className="px-3 py-4 border-t border-border space-y-1">
              {sidebarExpanded ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs px-2 py-1 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">Versão</span>
                    <span className="font-mono font-bold text-foreground">1.3.0</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('Deseja forçar a limpeza do cache e atualizar a página?')) {
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.getRegistrations().then(registrations => {
                            for (const registration of registrations) {
                              registration.unregister();
                            }
                            window.location.reload();
                          }).catch(() => window.location.reload());
                        } else {
                          window.location.reload();
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-[10px] uppercase tracking-wider font-bold text-primary hover:bg-primary/5 rounded-lg transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Forçar Atualização
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="v1.3.0 Online" />
                </div>
              )}
            </div>

            <div className="hidden md:flex p-4 border-t border-border gap-2">
              <Tooltip>
                <TooltipTrigger render={(triggerProps) => (
                  <button 
                    {...triggerProps}
                    onClick={cycleTheme}
                    className="flex-1 flex items-center justify-center p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                  >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : theme === 'dark' ? <h3 className="font-bold text-xs px-2 py-0.5 bg-card rounded-md">OLED</h3> : <Sun className="w-5 h-5" />}
                  </button>
                )} />
                <TooltipContent side="top" align="center" className="font-semibold text-xs py-1.5 px-3">
                  {theme === 'light' ? "Alternar para Escuro Intermediário" : theme === 'dark' ? "Alternar para Escuro Profundo" : "Alternar para Claro"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={(triggerProps) => (
                  <button 
                    {...triggerProps}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="flex-1 flex items-center justify-center p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                  >
                    {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                )} />
                <TooltipContent side="top" align="center" className="font-semibold text-xs py-1.5 px-3">
                  {isSidebarOpen ? "Recolher Menu" : "Expandir Menu"}
                </TooltipContent>
              </Tooltip>
            </div>
          </aside>

      {/* Main Content */}
      <main id="main-content-panel" className="flex-1 overflow-x-hidden overflow-y-auto w-full flex flex-col relative h-[100dvh]">
        <header className="pt-safe pb-2 min-h-[4rem] bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-safe md:px-8 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-3 flex-1 min-w-0 mt-2">
            <Tooltip>
              <TooltipTrigger render={(triggerProps) => (
                <button 
                  {...triggerProps}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center -ml-2 text-muted-foreground hover:bg-accent rounded-lg cursor-pointer"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )} />
              <TooltipContent side="bottom" align="start" className="font-semibold text-xs py-1.5 px-3">
                Abrir Menu de Navegação
              </TooltipContent>
            </Tooltip>
            <h2 className="text-lg font-semibold text-foreground truncate min-w-0 pr-2">
              {allMenuItems.find(i => i.id === activeTab)?.label}
            </h2>
            
            {/* Market Ticker */}
            <div className="hidden lg:flex flex-1 mx-8 overflow-hidden relative min-w-0">
              <div className="flex animate-marquee whitespace-nowrap gap-8 py-1">
                {marketIndices.length > 0 ? (
                  [...marketIndices, ...marketIndices].map((index, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] font-mono whitespace-nowrap">
                      {index.logourl ? (
                        <img 
                          src={index.logourl || undefined} 
                          alt={index.symbol} 
                          className="w-4 h-4 rounded-sm object-contain bg-white p-0.5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <span className="text-slate-400 uppercase">{index.symbol.replace('^', '')}</span>
                      <span className="font-bold">{index.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className={cn(
                        "font-bold",
                        index.change >= 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest animate-pulse">
                    Carregando índices de mercado...
                  </div>
                )}
              </div>
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Tooltip>
              <TooltipTrigger render={(triggerProps) => (
                <button 
                  {...triggerProps}
                  onClick={cycleTheme}
                  className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : theme === 'dark' ? <h3 className="font-bold text-xs px-2 py-0.5 bg-slate-800 rounded-md">OLED</h3> : <Sun className="w-5 h-5" />}
                </button>
              )} />
              <TooltipContent side="bottom" align="center" className="font-semibold text-xs py-1.5 px-3">
                {theme === 'light' ? "Alternar para Escuro Intermediário" : theme === 'dark' ? "Alternar para Escuro Profundo" : "Alternar para Claro"}
              </TooltipContent>
            </Tooltip>
            {financeData && (
              <div className="hidden md:flex flex-col items-end shrink-0">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Última Atualização</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {format(new Date(financeData.lastUpdate), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}
            <div className="relative group flex items-center hidden sm:flex shrink-0">
              <div className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full cursor-help">
                Taxas Reais
              </div>
              <div className="absolute right-0 top-full mt-2 w-56 p-2 bg-popover text-popover-foreground border border-border text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center">
                Dados atualizados via API do Banco Central e outras fontes confiáveis.
              </div>
            </div>
            <NotificationCenter onNavigate={(tab) => setActiveTab(tab as Tab)} />
            {user && (
              <Tooltip>
                <TooltipTrigger render={(triggerProps) => (
                  <div 
                    {...triggerProps}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary cursor-help transition-all hover:bg-primary/15 shrink-0"
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                    <span>{(profile?.aiCreditsRemaining ?? 5)}/5 IA</span>
                  </div>
                )} />
                <TooltipContent side="bottom" align="center" className="font-semibold text-xs py-1.5 px-3">
                  Você possui {(profile?.aiCreditsRemaining ?? 5)} de 5 créditos diários de Inteligência Artificial restantes para hoje.
                </TooltipContent>
              </Tooltip>
            )}
            <UserMenu />
          </div>
        </header>

        <div className={cn(
          "w-full relative flex flex-col min-h-0",
          activeTab === 'messages' 
            ? "flex-1 absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 top-[4rem] md:top-[4.5rem]"
            : "shrink-0 grow"
        )}>
          <div className={cn(
            "w-full max-w-full min-w-0 mx-auto flex flex-col",
            activeTab === 'messages'
              ? "flex-1 p-0 md:pb-0 overflow-hidden h-full absolute inset-0"
              : "shrink-0 grow p-3 sm:p-4 md:p-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 overflow-x-hidden"
          )}>
            {financeData && !financeData.brapiTokenSet && activeTab !== 'messages' && (
              <div className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl sm:rounded-2xl flex items-start gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-2 w-full">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 min-w-0">
                <p className="font-bold mb-1">Configuração Necessária</p>
                <p>A chave da API Brapi não foi configurada. As calculadoras de ações não funcionarão sem o <strong>BRAPI_TOKEN</strong>.</p>
              </div>
            </div>
          )}
          {renderContent()}
          
          {/* Footer for AdSense Compliance */}
          {activeTab !== 'messages' && (
            <footer className="mt-8 md:mt-20 pt-8 border-t border-border w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-8 break-words text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">S</div>
                    <span className="font-bold text-xl tracking-tight dark:text-white truncate">SimulaGrana</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm max-w-sm">
                    Sua plataforma completa de simulação e análise financeira. Tome decisões baseadas em dados e metodologias comprovadas.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-foreground uppercase text-[10px] tracking-widest">Links Rápidos</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><button onClick={() => setActiveTab('dashboard')} className="hover:text-primary transition-colors py-1 flex items-center">Dashboard</button></li>
                    <li><button onClick={() => setActiveTab('about')} className="hover:text-primary transition-colors py-1 flex items-center">Sobre Nós</button></li>
                    <li><button onClick={() => setActiveTab('contact')} className="hover:text-primary transition-colors py-1 flex items-center">Contato</button></li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-foreground uppercase text-[10px] tracking-widest">Legal</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><button onClick={() => setActiveTab('privacy')} className="hover:text-primary transition-colors py-1 flex items-center">Política de Privacidade</button></li>
                    <li><button onClick={() => setActiveTab('terms')} className="hover:text-primary transition-colors py-1 flex items-center">Termos de Uso</button></li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border/50 text-[10px] sm:text-xs text-slate-400 text-center sm:text-left">
                <p>© 2026 SimulaGrana. Todos os direitos reservados.</p>
                <p>O SimulaGrana não fornece recomendações.</p>
              </div>
            </footer>
          )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation - Seamless Edge-to-Edge */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-card/95 backdrop-blur-xl border-t border-border z-50 shadow-xl pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
            { id: 'portfolio', icon: Briefcase, label: 'Carteira' },
            { id: 'pesquisa', icon: Search, label: 'Pesquisa' },
            { id: 'walletfollow', icon: Globe, label: 'Comunidade' },
            { id: 'perfil', icon: User, label: 'Perfil' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all relative overflow-hidden",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="mobileTabGlow"
                    className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn("w-5 h-5 transition-transform shrink-0", isActive && "scale-110")} />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none truncate w-full px-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <IpcaCalculatorModal isOpen={isIpcaOpen} onClose={() => setIsIpcaOpen(false)} />
      <DollarConverterModal isOpen={isDollarConverterOpen} onClose={() => setIsDollarConverterOpen(false)} initialRate={financeData?.usd} />
      <InstallPWA />
      <GuidedTour 
        isOpen={isGuidedTourOpen} 
        onClose={() => setIsGuidedTourOpen(false)} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
    </div>
        </TooltipProvider>
    </CreatorModeProvider>
    <GlobalAudioPlayer />
    </AudioPlayerProvider>
    </FavoritesProvider>
    </FinanceProvider>
  );
}

