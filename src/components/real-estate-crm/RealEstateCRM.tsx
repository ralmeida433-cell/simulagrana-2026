import React, { useState, useEffect } from 'react';
import { FinanceData } from '../../services/financeService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Calculator, X,
  Map as MapIcon,
  Radar as RadarIcon,
  Home
} from 'lucide-react';
import { cn } from '../../lib/utils';
import FinancingCalculator from '../calculators/FinancingCalculator';
import NearbyPropertiesMap from './NearbyPropertiesMap';
import PropertiesAdsView from './PropertiesAdsView';
import PropertyRadar from './PropertyRadar';

interface RealEstateCRMProps {
  financeData: FinanceData;
  userBirthdate?: string | null;
}

type CrmTab = 'properties' | 'map' | 'radar';

const TABS: { id: CrmTab; label: string; icon: any }[] = [
  { id: 'properties', label: 'Marketplace', icon: Building2 },
  { id: 'radar', label: 'Radar OS', icon: RadarIcon },
  { id: 'map', label: 'Explorar Mapa', icon: MapIcon },
];

// SHARED MOCK DATA WITH COORDINATES
const INITIAL_PROPERTIES = [
  { 
    id: '1', 
    title: 'Apartamento Duplex Premium', 
    description: 'Excelente apartamento duplex com acabamento de alto padrão, vista panorâmica e automação residencial completa. O imóvel conta com piso em madeira nobre, ar condicionado central e varanda gourmet integrada.',
    location: 'Vila Olímpia, São Paulo', 
    price: 1250000, 
    type: 'Venda', 
    status: 'Oportunidade', 
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    beds: 3, baths: 4, parking: 2, area: 180,
    tags: ['Varanda Gourmet', 'Automação', 'Alto Padrão'],
    date: 'Há 2 dias',
    agent: 'Roberto Almeida',
    lat: -23.595, lng: -46.685 // Vila Olímpia
  },
  { 
    id: '2', 
    title: 'Casa em Condomínio Fechado', 
    description: 'Casa espetacular em condomínio de luxo com segurança 24h. Área de lazer privativa com piscina aquecida e espaço gourmet. Salas amplas integradas à natureza.',
    location: 'Alphaville, Barueri', 
    price: 3200000, 
    type: 'Venda', 
    status: 'Destaque', 
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    beds: 4, baths: 5, parking: 4, area: 350,
    tags: ['Piscina', 'Segurança 24h', 'Suíte Master'],
    date: 'Hoje',
    agent: 'Roberto Almeida',
    lat: -23.475, lng: -46.855 // Alphaville
  },
  { 
    id: '3', 
    title: 'Studio Moderno', 
    description: 'Studio compacto e otimizado, ideal para investimento ou moradia. Prédio com infraestrutura completa: coworking, academia, lavanderia e piscina.',
    location: 'Pinheiros, São Paulo', 
    price: 4500, 
    type: 'Aluguel', 
    status: 'Novo', 
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    beds: 1, baths: 1, parking: 1, area: 45,
    tags: ['Coworking', 'Academia', 'Mobiliado'],
    date: 'Ontem',
    agent: 'Julia Costa',
    lat: -23.565, lng: -46.695 // Pinheiros
  },
  // Adding some near standard lat (0,0) if user doesn't have loc, 
  // but better to shift these to user loc on first run for demo
];

export default function RealEstateCRM({ financeData, userBirthdate }: RealEstateCRMProps) {
  const [activeTab, setActiveTab] = useState<CrmTab>('properties');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [properties, setProperties] = useState(INITIAL_PROPERTIES);
  const [selectedPropertyFromRadar, setSelectedPropertyFromRadar] = useState<string | null>(null);

  // Shift properties to user location on mount so they always see something on radar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setProperties(prev => prev.map((p, i) => ({
          ...p,
          // Spreading them around the user
          lat: latitude + (Math.random() - 0.5) * 0.02,
          lng: longitude + (Math.random() - 0.5) * 0.02
        })));
      }, () => {}, { enableHighAccuracy: false, timeout: 5000 });
    }
  }, []);

  const handlePropertyClick = (id: string) => {
    setSelectedPropertyFromRadar(id);
    setActiveTab('properties');
  };

  // Render sub-components based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case 'properties': 
        return <PropertiesAdsView 
          sharedProperties={properties} 
          setSharedProperties={setProperties}
          initialHighlightId={selectedPropertyFromRadar}
          onClearHighlight={() => setSelectedPropertyFromRadar(null)}
        />;
      case 'radar':
        return <PropertyRadar properties={properties} onPropertyClick={handlePropertyClick} />;
      case 'map': 
        return <NearbyPropertiesMap />;
      default: return <PropertiesAdsView sharedProperties={properties} setSharedProperties={setProperties} />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 relative min-h-[calc(100vh-12rem)]">
      {/* Header / Intro With SimulaLar animated Identity */}
      <div className="bg-emerald-950 text-white relative overflow-hidden rounded-3xl sm:rounded-[40px] shadow-2xl mb-4 border border-emerald-900 group">
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-10 relative z-20 gap-6">
          <div className="flex items-center gap-4 sm:gap-6 group-hover:scale-105 transition-transform duration-500">
             {/* Animated House Icon container */}
             <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-emerald-500/20 rounded-2xl overflow-hidden shrink-0 border border-emerald-500/30">
               <Home className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 relative z-10 animate-[float-house_3s_ease-in-out_infinite,house-build_0.8s_ease-out_forwards]" />
               <div className="absolute inset-0 rounded-2xl animate-[pulse-glow_2s_infinite]" />
             </div>
             
             <div className="flex flex-col">
               <div className="flex items-baseline overflow-hidden -ml-1">
                 <span className="text-white font-black text-3xl sm:text-4xl tracking-tight translate-y-full opacity-0 animate-[slide-up_0.6s_ease-out_0.6s_forwards]">Simula</span>
                 <span className="text-emerald-400 font-black text-3xl sm:text-4xl tracking-tight translate-y-full opacity-0 animate-[slide-up_0.6s_ease-out_0.7s_forwards]">Lar</span>
               </div>
               <p className="text-emerald-200/80 mt-1 font-medium text-sm sm:text-base translate-y-full opacity-0 animate-[slide-up_0.6s_ease-out_0.8s_forwards]">Gestão Inteligente e Valuation de Imóveis</p>
             </div>
          </div>
        </div>

        {/* Dynamic Animated Background elements for the hero */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 animate-[pulse-glow_4s_infinite]" />
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-900" />
          <div className="absolute bottom-0 left-0 w-1/3 h-[2px] bg-emerald-400 animate-[car-line_3s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all snap-start",
              activeTab === tab.id 
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                : "bg-card border border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <tab.icon className={cn("w-4 h-4 shrink-0", tab.id === 'radar' && activeTab === 'radar' && "animate-pulse")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>

      {/* Floating Action Button for Calculator */}
      <button
        onClick={() => setIsCalculatorOpen(true)}
        className="fixed bottom-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] md:bottom-8 right-4 md:right-8 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all z-30 group"
        title="Calculadora de Financiamento"
      >
        <Calculator className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-emerald-950"></span>
        </span>
      </button>

      {/* Calculator Modal */}
      <AnimatePresence>
        {isCalculatorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCalculatorOpen(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full md:max-w-5xl h-[100dvh] md:h-[85vh] md:max-h-[850px] bg-card md:border md:border-border shadow-2xl md:rounded-3xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-md md:rounded-t-3xl z-10 shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calculator className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg leading-none">Simulador de Imóveis</h3>
                </div>
                <button
                  onClick={() => setIsCalculatorOpen(false)}
                  className="p-2 rounded-full bg-muted/50 hover:bg-accent text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-[max(2rem,env(safe-area-inset-bottom))] bg-muted/5">
                <FinancingCalculator financeData={financeData} userBirthdate={userBirthdate} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
