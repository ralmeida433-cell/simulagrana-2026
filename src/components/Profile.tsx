import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Settings, Shield, Globe, Users, Lock, ChevronRight, 
  MapPin, Calendar, Camera, LayoutGrid, BarChart3, PieChart,
  Eye, Save, Check, AlertCircle, Share2, Palette, Bell, RefreshCw, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatCurrency } from '../lib/utils';
import { Avatar } from './ui/Avatar';
import ProfileVisitors from './social/ProfileVisitors';
import ProfileFollowers from './social/ProfileFollowers';
import KycVerification from './kyc/KycVerification';

interface ProfileProps {
  onNavigate?: (tab: string) => void;
}

export default function Profile({ onNavigate }: ProfileProps) {
  const { user, profile, updateProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'privacy' | 'appearance' | 'account' | 'visitors' | 'requests' | 'kyc'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [realMetrics, setRealMetrics] = useState({ followers: profile?.followersCount || 0, following: profile?.followingCount || 0, views: profile?.profileViewsCount || 0 });

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const section = params.get('section');
      if (section && ['overview', 'privacy', 'appearance', 'account', 'visitors', 'requests', 'kyc'].includes(section)) {
        setActiveSection(section as any);
      }
    };
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      import('../services/socialService').then(({ socialService }) => {
        socialService.getProfileMetrics(user.uid).then(metrics => {
          setRealMetrics(metrics);
        }).catch(console.error);
      });
    }
  }, [user]);

  // Profile Settings State
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    walletVisibility: profile?.walletVisibility || 'private',
    privacySettings: profile?.privacySettings || {
      assets: 'assets_only',
      segments: { stocksBR: true, stocksUS: true, fiis: true },
      indicators: { profitability: true, dividends: true }
    },
    preferences: profile?.preferences || {
      showValues: true,
      showAssets: true,
      showTransactions: true,
      showPerformance: true,
      theme: 'dark',
      accentColor: '#10B981'
    }
  });

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionChange = (section: any) => {
    setActiveSection(section);
    const url = new URL(window.location.href);
    // If not currently on tab=perfil, make sure to set it?
    // Wait, we are already on tab=perfil to view Profile.
    url.searchParams.set('section', section);
    window.history.pushState({}, '', url.toString());
    
    // Scroll automatically to the content area on mobile
    if (window.innerWidth < 768) {
      setTimeout(() => {
        const contentEl = document.getElementById('profile-content');
        if (contentEl) {
           const yOffset = -80; // Offset for fixed navbar if any
           const y = contentEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
           window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handleViewAsVisitor = () => {
    if (!profile?.uid) return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'walletfollow');
    url.searchParams.set('userId', profile.uid);
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 w-full animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-card border border-border rounded-[2.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <User size={200} />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10 w-full min-w-0">
          <div className="group relative shrink-0">
            <div className="p-1.5 rounded-full border-4 border-emerald-500/30 bg-emerald-500/5 transition-colors group-hover:border-emerald-500/50">
              <Avatar 
                src={profile?.avatar} 
                alt={profile?.name || 'User'} 
                size="xl" 
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 border-4 border-background shadow-xl" 
              />
            </div>
            <button className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-primary text-white p-2 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all">
              <Camera size={18} />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4 min-w-0 w-full">
            <div>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground truncate max-w-full flex items-center gap-2">
                  {profile?.name || 'Investidor'}
                  {profile?.isVerified && (
                    <div title="Usuário Verificado (KYC)" className="bg-emerald-500 text-white rounded-full p-1 border-2 border-background shadow-sm shrink-0">
                      <Check className="w-5 h-5" strokeWidth={3} />
                    </div>
                  )}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-muted/50 rounded-full text-xs font-bold text-muted-foreground border border-border truncate max-w-full">
                    {profile?.username || '@investidor'}
                  </span>
                  {profile?.walletVisibility !== 'private' && (
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <Globe size={10} /> Perfil Público
                    </span>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto md:mx-0 text-sm leading-relaxed px-4 md:px-0">
                {profile?.bio || 'Nenhuma biografia definida. Adicione algo sobre sua jornada como investidor.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-2"><MapPin size={16} className="text-emerald-500" /> {profile?.location || 'Brasil'}</span>
              <span className="flex items-center gap-2"><Calendar size={16} className="text-emerald-500" /> Membro desde Jan 2024</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
              <button 
                onClick={handleViewAsVisitor}
                className="px-6 py-2.5 bg-muted/50 hover:bg-muted text-foreground text-sm font-bold rounded-2xl transition-all flex items-center gap-2"
              >
                <Eye size={18} /> Visualizar como visitante
              </button>
              <button 
                onClick={() => {
                   if (profile?.uid) {
                       const url = new URL(window.location.href);
                       url.searchParams.set('tab', 'walletfollow');
                       url.searchParams.set('userId', profile.uid);
                       navigator.clipboard.writeText(url.toString());
                       alert('Link do seu perfil público copiado!');
                   }
                }}
                className="p-2.5 bg-muted/50 hover:bg-muted text-foreground rounded-2xl transition-all"
                title="Compartilhar Link da Carteira"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 border-t border-border pt-8">
           <ProfileStat label="Seguidores" value={realMetrics.followers.toString()} onClick={() => handleSectionChange('requests')} />
           <ProfileStat label="Seguindo" value={realMetrics.following.toString()} />
           <ProfileStat label="Visualizações" value={realMetrics.views.toString()} />
           <ProfileStat label="Score" value={(profile?.score || 10).toString()} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-3 space-y-2 flex flex-col">
           <NavButton 
             active={activeSection === 'overview'} 
             onClick={() => handleSectionChange('overview')} 
             icon={LayoutGrid} 
             label="Meu Perfil" 
           />
           <NavButton 
             active={false} 
             onClick={() => {
                if (onNavigate) {
                  onNavigate('messages');
                }
             }} 
             icon={MessageSquare} 
             label="Mensagens" 
           />
           <NavButton 
             active={activeSection === 'privacy'} 
             onClick={() => handleSectionChange('privacy')} 
             icon={Shield} 
             label="Segurança e Privacidade" 
           />
           <NavButton 
             active={activeSection === 'appearance'} 
             onClick={() => handleSectionChange('appearance')} 
             icon={Palette} 
             label="Aparência" 
           />
           <NavButton 
             active={activeSection === 'visitors'} 
             onClick={() => handleSectionChange('visitors')} 
             icon={Eye} 
             label="Visitantes (Privado)" 
           />
           <NavButton 
             active={activeSection === 'requests'} 
             onClick={() => handleSectionChange('requests')} 
             icon={Users} 
             label="Seguidores" 
           />
           <NavButton 
             active={activeSection === 'kyc'} 
             onClick={() => handleSectionChange('kyc')} 
             icon={Check} 
             label="Verificação KYC" 
           />
           <NavButton 
             active={activeSection === 'account'} 
             onClick={() => handleSectionChange('account')} 
             icon={Settings} 
             label="Configurações da Conta" 
           />
        </div>

        {/* Form Content */}
        <div id="profile-content" className="md:col-span-9 bg-card border border-border rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px] w-full min-w-0">
          <AnimatePresence mode="wait">
            {activeSection === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 min-w-0 w-full overflow-hidden"
              >
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 truncate">
                  Informações Básicas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0 w-full">
                  <div className="space-y-2 min-w-0 w-full">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 truncate block">Nome de Exibição</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-muted/30 border border-border rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all truncate"
                    />
                  </div>
                  <div className="space-y-2 min-w-0 w-full">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 truncate block">Username</label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-muted/30 border border-border rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono truncate"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2 min-w-0 w-full">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 truncate block">Bio</label>
                    <textarea 
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full bg-muted/30 border border-border rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none min-w-0"
                    />
                  </div>
                  <div className="space-y-2 min-w-0 w-full">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 truncate block">Localização</label>
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-muted/30 border border-border rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all truncate"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-end items-center gap-3">
                   {showSaveSuccess && (
                     <div className="flex items-center justify-center gap-2 text-emerald-500 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-right-4 w-full sm:w-auto mt-2 sm:mt-0 order-last sm:order-first">
                       <Check size={18} /> Alterações salvas!
                     </div>
                   )}
                   <button 
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-3 sm:px-8 bg-primary text-primary-foreground font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                   >
                     {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                     Salvar Perfil
                   </button>
                </div>
              </motion.div>
            )}

            {activeSection === 'visitors' && (
              <motion.div 
                key="visitors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full min-w-0"
              >
                <ProfileVisitors />
              </motion.div>
            )}

            {activeSection === 'requests' && (
              <motion.div 
                key="requests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full min-w-0"
              >
                <ProfileFollowers />
              </motion.div>
            )}

            {activeSection === 'kyc' && (
              <motion.div 
                key="kyc"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full min-w-0 p-4 sm:p-6 md:p-8"
              >
                <KycVerification />
              </motion.div>
            )}

            {activeSection === 'privacy' && (
              <motion.div 
                key="privacy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 min-w-0 w-full overflow-hidden"
              >
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 truncate">
                    Privacidade da Carteira
                  </h3>
                  <p className="text-sm text-muted-foreground w-full break-words">Controle quem pode ver seus investimentos e qual nível de detalhe será exibido.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <PrivacyOption 
                     active={formData.walletVisibility === 'public'} 
                     onClick={() => setFormData({...formData, walletVisibility: 'public'})}
                     icon={Globe}
                     label="Público"
                     desc="Qualquer um pode ver sua carteira"
                   />
                   <PrivacyOption 
                     active={formData.walletVisibility === 'followers'} 
                     onClick={() => setFormData({...formData, walletVisibility: 'followers'})}
                     icon={Users}
                     label="Seguidores"
                     desc="Apenas quem te segue vê seu perfil"
                   />
                   <PrivacyOption 
                     active={formData.walletVisibility === 'private'} 
                     onClick={() => setFormData({...formData, walletVisibility: 'private'})}
                     icon={Lock}
                     label="Privado"
                     desc="Só você tem acesso aos dados"
                   />
                </div>

                <div className={cn(
                  "space-y-6 pt-6 border-t border-border transition-all duration-500",
                  formData.walletVisibility === 'private' ? "opacity-30 pointer-events-none blur-[2px]" : "opacity-100"
                )}>
                  <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-primary">Nível de Detalhe</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <DetailToggle 
                         label="Somente Ativos" 
                         active={formData.privacySettings.assets === 'assets_only'} 
                         onClick={() => setFormData({...formData, privacySettings: {...formData.privacySettings, assets: 'assets_only'}})}
                       />
                       <DetailToggle 
                         label="Ativos + Quantidades" 
                         active={formData.privacySettings.assets === 'assets_qty'} 
                         onClick={() => setFormData({...formData, privacySettings: {...formData.privacySettings, assets: 'assets_qty'}})}
                       />
                       <DetailToggle 
                         label="Valores Completos" 
                         active={formData.privacySettings.assets === 'assets_values'} 
                         onClick={() => setFormData({...formData, privacySettings: {...formData.privacySettings, assets: 'assets_values'}})}
                       />
                       <DetailToggle 
                         label="Ocultar Ativos" 
                         active={formData.privacySettings.assets === 'hidden'} 
                         onClick={() => setFormData({...formData, privacySettings: {...formData.privacySettings, assets: 'hidden'}})}
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary">Segmentos Visíveis</h4>
                      <div className="space-y-3">
                        <CheckboxItem 
                          label="Ações Brasil" 
                          checked={formData.privacySettings.segments.stocksBR} 
                          onChange={(v) => setFormData({...formData, privacySettings: {...formData.privacySettings, segments: {...formData.privacySettings.segments, stocksBR: v}}})} 
                        />
                        <CheckboxItem 
                          label="Stocks (EUA)" 
                          checked={formData.privacySettings.segments.stocksUS} 
                          onChange={(v) => setFormData({...formData, privacySettings: {...formData.privacySettings, segments: {...formData.privacySettings.segments, stocksUS: v}}})} 
                        />
                        <CheckboxItem 
                          label="FIIs" 
                          checked={formData.privacySettings.segments.fiis} 
                          onChange={(v) => setFormData({...formData, privacySettings: {...formData.privacySettings, segments: {...formData.privacySettings.segments, fiis: v}}})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary">Indicadores</h4>
                      <div className="space-y-3">
                        <CheckboxItem 
                          label="Exibir Rentabilidade" 
                          checked={formData.privacySettings.indicators.profitability} 
                          onChange={(v) => setFormData({...formData, privacySettings: {...formData.privacySettings, indicators: {...formData.privacySettings.indicators, profitability: v}}})} 
                        />
                        <CheckboxItem 
                          label="Exibir Proventos" 
                          checked={formData.privacySettings.indicators.dividends} 
                          onChange={(v) => setFormData({...formData, privacySettings: {...formData.privacySettings, indicators: {...formData.privacySettings.indicators, dividends: v}}})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end items-center gap-3">
                   {showSaveSuccess && (
                     <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold animate-in fade-in slide-in-from-right-4">
                       <Check size={18} /> Alterações salvas!
                     </div>
                   )}
                   <button 
                     onClick={handleUpdateProfile}
                     disabled={isSaving}
                     className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                   >
                     {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                     Salvar Privacidade
                   </button>
                </div>
              </motion.div>
            )}

            {activeSection === 'appearance' && (
               <motion.div 
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 min-w-0 w-full overflow-hidden"
              >
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 truncate">
                    Aparência e Temas
                  </h3>
                  <p className="text-sm text-muted-foreground w-full break-words">Personalize as cores e o tema do seu perfil para que outros vejam conforme seu gosto.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                     <h4 className="text-sm font-black uppercase tracking-widest text-primary">Esquema de Cores</h4>
                     <div className="flex flex-wrap gap-2 sm:gap-3">
                        {['#10B981', '#3B82F6', '#F43F5E', '#A855F7', '#F59E0B', '#6366F1'].map(color => (
                          <button 
                            key={color}
                            onClick={() => setFormData({...formData, preferences: {...formData.preferences, accentColor: color}})}
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-sm transition-all shrink-0",
                              formData.preferences.accentColor === color ? "ring-4 ring-offset-2 sm:ring-offset-4 ring-primary scale-110" : "hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                     </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary">Tema do Perfil</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                         <DetailToggle small label="Claro" active={formData.preferences.theme === 'light'} onClick={() => setFormData({...formData, preferences: {...formData.preferences, theme: 'light'}})} />
                         <DetailToggle small label="Escuro" active={formData.preferences.theme === 'dark'} onClick={() => setFormData({...formData, preferences: {...formData.preferences, theme: 'dark'}})} />
                         <DetailToggle small label="OLED" active={formData.preferences.theme === 'deep-dark'} onClick={() => setFormData({...formData, preferences: {...formData.preferences, theme: 'deep-dark'}})} />
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end items-center gap-3">
                   {showSaveSuccess && (
                     <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold animate-in fade-in slide-in-from-right-4">
                       <Check size={18} /> Alterações salvas!
                     </div>
                   )}
                   <button 
                    onClick={handleUpdateProfile}
                    className="w-full sm:w-auto px-6 py-3 sm:px-8 bg-primary text-primary-foreground font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                     Aplicar Mudanças
                   </button>
                </div>
              </motion.div>
            )}

            {activeSection === 'account' && (
              <motion.div 
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 min-w-0 w-full overflow-hidden"
              >
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-rose-500 truncate">
                    Zona de Perigo
                  </h3>
                  <p className="text-sm text-muted-foreground w-full break-words">Ações críticas relacionadas à sua conta.</p>
                </div>
                
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 space-y-4">
                  <h4 className="font-bold text-rose-600">Excluir Conta</h4>
                  <p className="text-sm text-rose-600/80">Esta ação é irreversível. Todos os seus dados, carteiras e configurações serão apagados permanentemente.</p>
                  <button className="px-6 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                    Excluir Minha Conta
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ label, value, onClick }: { label: string, value: string, onClick?: () => void }) {
  return (
    <div 
      className={cn(
        "text-center p-2 rounded-xl transition-all",
        onClick ? "cursor-pointer hover:bg-muted/20 active:scale-95" : ""
      )}
      onClick={onClick}
    >
       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
       <p className="text-2xl font-black text-foreground mt-1">{value}</p>
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-6 py-4 rounded-3xl font-bold text-sm transition-all text-left",
        active 
          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" 
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon size={20} />
      {label}
      {active && <ChevronRight size={16} className="ml-auto" />}
    </button>
  );
}

function PrivacyOption({ active, onClick, icon: Icon, label, desc }: { active: boolean, onClick: () => void, icon: any, label: string, desc: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-6 rounded-[2rem] border-2 transition-all text-left space-y-2 group shadow-sm",
        active 
          ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
          : "border-border bg-muted/20 hover:border-muted-foreground/30"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
        active ? "bg-primary text-white scale-110" : "bg-muted text-muted-foreground group-hover:scale-105"
      )}>
        <Icon size={24} />
      </div>
      <div>
        <p className={cn("font-black text-sm", active ? "text-primary" : "text-foreground")}>{label}</p>
        <p className="text-[10px] text-muted-foreground font-medium leading-tight">{desc}</p>
      </div>
    </button>
  );
}

function DetailToggle({ label, active, onClick, small }: { label: string, active: boolean, onClick: () => void, small?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-center text-center p-4 rounded-2xl border transition-all text-xs font-bold",
        active 
          ? "border-primary bg-primary/5 text-primary shadow-sm" 
          : "border-border bg-muted/10 text-muted-foreground hover:bg-muted/30",
        small ? "py-3 px-2" : "py-4 px-4"
      )}
    >
      {label}
    </button>
  );
}

function CheckboxItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-border hover:bg-muted/20 transition-all cursor-pointer" onClick={() => onChange(!checked)}>
       <span className="text-sm font-bold text-foreground">{label}</span>
       <div className={cn(
         "w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all",
         checked ? "bg-primary border-primary text-primary-foreground" : "border-border"
       )}>
         {checked && <Check size={14} strokeWidth={4} />}
       </div>
    </div>
  );
}
