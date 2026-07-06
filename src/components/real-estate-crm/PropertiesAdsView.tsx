import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Search, Filter, Plus, Heart, 
  Share2, MessageCircle, ChevronRight, Bed, Bath, 
  Car, Maximize2, ShieldCheck, Sparkles, X, ChevronLeft, Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

// MOCK DATA
const MOCK_PROPERTIES = [
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
    agent: 'Roberto Almeida'
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
    agent: 'Roberto Almeida'
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
    agent: 'Julia Costa'
  },
  { 
    id: '4', 
    title: 'Cobertura Penthouse', 
    description: 'Cobertura com vista 360 graus, piscina privativa com borda infinita, teto retrátil na sala e acabamentos em mármore importado.',
    location: 'Itaim Bibi, São Paulo', 
    price: 5500000, 
    type: 'Venda', 
    status: 'Exclusivo', 
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    beds: 4, baths: 6, parking: 5, area: 420,
    tags: ['Piscina Privativa', 'Vista 360', 'Decorado'],
    date: 'Há 1 semana',
    agent: 'Paulo Souza'
  },
  { 
    id: '5', 
    title: 'Apto 2 Dorms Próximo ao Metrô', 
    description: 'Ótimo apartamento a 5 minutos da estação de metrô. Condomínio clube completo.',
    location: 'Vila Mariana, São Paulo', 
    price: 3200, 
    type: 'Aluguel', 
    status: 'Disponível', 
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ff2d6c411?w=800&q=80',
    beds: 2, baths: 2, parking: 1, area: 68,
    tags: ['Próximo ao Metrô', 'Lazer Completo'],
    date: 'Há 3 dias',
    agent: 'Julia Costa'
  },
  { 
    id: '6', 
    title: 'Casa Térrea Moderna', 
    description: 'Casa térrea recém-construída em bairro tranquilo. Quintal espaçoso com churrasqueira e potencial para piscina.',
    location: 'Campinas, SP', 
    price: 890000, 
    type: 'Venda', 
    status: 'Novo', 
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    beds: 3, baths: 3, parking: 2, area: 150,
    tags: ['Térrea', 'Churrasqueira', 'Quintal'],
    date: 'Há 5 dias',
    agent: 'Roberto Almeida'
  }
];

interface PropertiesAdsViewProps {
  sharedProperties: any[];
  setSharedProperties: React.Dispatch<React.SetStateAction<any[]>>;
  initialHighlightId?: string | null;
  onClearHighlight?: () => void;
}

export default function PropertiesAdsView({ 
  sharedProperties, 
  setSharedProperties, 
  initialHighlightId, 
  onClearHighlight 
}: PropertiesAdsViewProps) {
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Venda' | 'Aluguel' | 'Favoritos' | 'Meus Anúncios'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [showNewAdModal, setShowNewAdModal] = useState(false);

  // Effect to handle highlight from radar
  useEffect(() => {
    if (initialHighlightId) {
      const prop = sharedProperties.find(p => p.id === initialHighlightId);
      if (prop) {
        setSelectedProperty(prop);
        if (onClearHighlight) onClearHighlight();
      }
    }
  }, [initialHighlightId, sharedProperties, onClearHighlight]);

  // New Ad Form State
  const [newAdForm, setNewAdForm] = useState({
    title: '',
    location: '',
    price: '',
    type: 'Venda',
    description: '',
    beds: '',
    baths: '',
    parking: '',
    area: ''
  });

  const filteredProperties = sharedProperties.filter(prop => {
    if (activeFilter === 'Venda' && prop.type !== 'Venda') return false;
    if (activeFilter === 'Aluguel' && prop.type !== 'Aluguel') return false;
    if (activeFilter === 'Meus Anúncios' && prop.agent !== 'Roberto Almeida' && prop.agent !== 'Você') return false;
    // Mock Favoritos (just an example, odds IDs)
    if (activeFilter === 'Favoritos' && parseInt(prop.id) % 2 === 0) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return prop.title.toLowerCase().includes(q) || prop.location.toLowerCase().includes(q);
    }

    return true;
  });

  const handlePublishAd = () => {
    // Capture approximate location for the radar/map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        publishWithLoc(latitude, longitude);
      }, () => {
        publishWithLoc(-23.5505, -46.6333); // Default SP
      });
    } else {
      publishWithLoc(-23.5505, -46.6333);
    }
  };

  const publishWithLoc = (lat: number, lng: number) => {
    const newId = (sharedProperties.length + 100).toString();
    const newProp = {
      id: newId,
      title: newAdForm.title || 'Propriedade Sem Nome',
      description: newAdForm.description || 'Nenhuma descrição fornecida.',
      location: newAdForm.location || 'Localização não informada',
      price: parseInt(newAdForm.price) || 0,
      type: newAdForm.type,
      status: 'Novo',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
      beds: parseInt(newAdForm.beds) || 0,
      baths: parseInt(newAdForm.baths) || 0,
      parking: parseInt(newAdForm.parking) || 0,
      area: parseInt(newAdForm.area) || 0,
      tags: ['Lançamento', 'Novo'],
      date: 'Agora mesmo',
      agent: 'Você',
      // Add a small random offset if desired, or just use user loc
      lat: lat + (Math.random() - 0.5) * 0.005,
      lng: lng + (Math.random() - 0.5) * 0.005
    };

    setSharedProperties(prev => [newProp, ...prev]);
    setShowNewAdModal(false);
    setNewAdForm({ title: '', location: '', price: '', type: 'Venda', description: '', beds: '', baths: '', parking: '', area: '' });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header & Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Marketplace</h2>
            <p className="text-muted-foreground">Gerencie e explore anúncios imobiliários.</p>
          </div>
          <button 
            onClick={() => setShowNewAdModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Anúncio</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por bairro, cidade, título..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {['Todos', 'Venda', 'Aluguel', 'Favoritos', 'Meus Anúncios'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border",
                  activeFilter === filter 
                    ? "bg-foreground text-background border-foreground" 
                    : "bg-card border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
        {filteredProperties.map(prop => (
          <div 
            key={prop.id} 
            onClick={() => setSelectedProperty(prop)}
            className="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-500/50 hover:shadow-xl transition-all"
          >
            {/* Image & Badges */}
            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
              <img src={prop.image} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              
              {/* Top gradient for readability */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
              
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-1 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase shadow-sm",
                  prop.status === 'Oportunidade' ? "bg-emerald-500/90" : 
                  prop.status === 'Destaque' ? "bg-amber-500/90" : 
                  "bg-black/70"
                )}>
                  {prop.status}
                </span>
                <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase shadow-sm">
                  {prop.type}
                </span>
              </div>
              <button 
                className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-rose-500 hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); /* toggle favorite logic */ }}
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 font-medium">
                <MapPin className="w-3.5 h-3.5" /> <span className="truncate">{prop.location}</span>
              </div>
              <h3 className="font-bold text-base leading-snug mb-3 line-clamp-1">{prop.title}</h3>
              
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-foreground mb-4">
                <div className="flex items-center gap-1.5 font-medium"><Bed className="w-4 h-4 text-muted-foreground" /> {prop.beds}</div>
                <div className="flex items-center gap-1.5 font-medium"><Bath className="w-4 h-4 text-muted-foreground" /> {prop.baths}</div>
                <div className="flex items-center gap-1.5 font-medium"><Car className="w-4 h-4 text-muted-foreground" /> {prop.parking}</div>
                <div className="flex items-center gap-1.5 font-medium"><Maximize2 className="w-4 h-4 text-muted-foreground" /> {prop.area}m²</div>
              </div>

              <div className="mt-auto pt-4 border-t border-border flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-bold block mb-0.5">Valor</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-500">
                    R$ {prop.price.toLocaleString('pt-BR')}
                    {prop.type === 'Aluguel' && <span className="text-sm text-muted-foreground font-medium">/mês</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredProperties.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-muted-foreground">Tente alterar os filtros ou termo de busca.</p>
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-card w-full max-w-4xl max-h-full overflow-hidden flex flex-col sm:rounded-2xl border border-border shadow-2xl relative"
            >
              {/* Close Button Mobile (Absolute Top) */}
              <button 
                onClick={() => setSelectedProperty(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white rounded-full transition-colors sm:hidden"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 min-h-[50vh]">
                  {/* Left: Image Gallery */}
                  <div className="relative aspect-square md:aspect-auto md:h-full bg-muted">
                    <img src={selectedProperty.image} alt={selectedProperty.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                      <div className="text-white">
                        <span className="inline-block px-3 py-1 bg-emerald-500 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                          {selectedProperty.type}
                        </span>
                        <h2 className="text-2xl font-black leading-tight drop-shadow-md">{selectedProperty.title}</h2>
                      </div>
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="p-6 md:p-8 flex flex-col">
                    <div className="hidden sm:flex justify-end mb-4">
                      <button 
                        onClick={() => setSelectedProperty(null)}
                        className="p-2 bg-muted hover:bg-accent text-foreground rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground mb-6 font-medium">
                      <MapPin className="w-4 h-4" /> <span>{selectedProperty.location}</span>
                    </div>

                    <div className="flex items-center gap-6 mb-8 py-4 border-y border-border">
                      <div className="flex flex-col items-center gap-1">
                        <Bed className="w-6 h-6 text-emerald-500" />
                        <span className="font-bold">{selectedProperty.beds}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Dorms</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Bath className="w-6 h-6 text-emerald-500" />
                        <span className="font-bold">{selectedProperty.baths}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Banhos</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Car className="w-6 h-6 text-emerald-500" />
                        <span className="font-bold">{selectedProperty.parking}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Vagas</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Maximize2 className="w-6 h-6 text-emerald-500" />
                        <span className="font-bold">{selectedProperty.area}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">m²</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h4 className="font-bold mb-2">Sobre o Imóvel</h4>
                      <p className="text-muted-foreground leading-relaxed text-sm mb-6">
                        {selectedProperty.description}
                      </p>

                      <h4 className="font-bold mb-3">Diferenciais</h4>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {selectedProperty.tags.map((tag: string) => (
                          <span key={tag} className="px-3 py-1 bg-accent text-foreground rounded-lg text-xs font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* AI Recommender Insight */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 mb-6 relative overflow-hidden">
                        <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">Dica IA: Preço Atrativo</p>
                          <p className="text-xs text-muted-foreground">Este imóvel está 5% abaixo da média para a região com estas características.</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-auto pt-6 border-t border-border flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase font-black tracking-wider block mb-0.5">Valor Total</span>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight">
                          R$ {selectedProperty.price.toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="w-12 h-12 flex items-center justify-center bg-muted hover:bg-accent rounded-xl transition-colors">
                          <Heart className="w-5 h-5" />
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                          <MessageCircle className="w-5 h-5" />
                          <span className="hidden sm:inline">Contatar Broker</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Ad Modal */}
      <AnimatePresence>
        {showNewAdModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-card w-full max-w-2xl max-h-full overflow-hidden flex flex-col sm:rounded-2xl border border-border shadow-2xl relative"
            >
              <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black">Adicionar Novo Imóvel</h2>
                  <p className="text-sm text-muted-foreground">Preencha os dados básicos do seu anúncio</p>
                </div>
                <button 
                  onClick={() => setShowNewAdModal(false)}
                  className="p-2 bg-muted hover:bg-accent text-foreground rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="col-span-full">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Título do Anúncio</label>
                    <input 
                      type="text" 
                      value={newAdForm.title}
                      onChange={(e) => setNewAdForm({...newAdForm, title: e.target.value})}
                      placeholder="Ex: Apartamento Moderno na Paulista"
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="col-span-full">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Localização</label>
                    <input 
                      type="text" 
                      value={newAdForm.location}
                      onChange={(e) => setNewAdForm({...newAdForm, location: e.target.value})}
                      placeholder="Ex: Cerqueira César, São Paulo - SP"
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tipo de Negócio</label>
                    <select 
                      value={newAdForm.type}
                      onChange={(e) => setNewAdForm({...newAdForm, type: e.target.value})}
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Venda">Venda</option>
                      <option value="Aluguel">Aluguel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Valor (R$)</label>
                    <input 
                      type="number" 
                      value={newAdForm.price}
                      onChange={(e) => setNewAdForm({...newAdForm, price: e.target.value})}
                      placeholder="Ex: 850000"
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 col-span-full sm:col-span-1">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Dorms</label>
                      <input 
                        type="number" 
                        value={newAdForm.beds}
                        onChange={(e) => setNewAdForm({...newAdForm, beds: e.target.value})}
                        placeholder="Ex: 2"
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Banhos</label>
                      <input 
                        type="number" 
                        value={newAdForm.baths}
                        onChange={(e) => setNewAdForm({...newAdForm, baths: e.target.value})}
                        placeholder="Ex: 2"
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 col-span-full sm:col-span-1">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Vagas</label>
                      <input 
                        type="number" 
                        value={newAdForm.parking}
                        onChange={(e) => setNewAdForm({...newAdForm, parking: e.target.value})}
                        placeholder="Ex: 1"
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Área (m²)</label>
                      <input 
                        type="number" 
                        value={newAdForm.area}
                        onChange={(e) => setNewAdForm({...newAdForm, area: e.target.value})}
                        placeholder="Ex: 65"
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Descrição</label>
                    <textarea 
                      value={newAdForm.description}
                      onChange={(e) => setNewAdForm({...newAdForm, description: e.target.value})}
                      placeholder="Descreva os detalhes do imóvel..."
                      rows={4}
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-border bg-muted/20 flex flex-col sm:flex-row gap-3 sm:justify-end sticky bottom-0">
                <button 
                  onClick={() => setShowNewAdModal(false)}
                  className="px-6 py-3 font-bold bg-card border border-border hover:bg-muted rounded-xl transition-colors text-sm w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePublishAd}
                  className="px-6 py-3 font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm w-full sm:w-auto"
                >
                  Publicar Anúncio
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
