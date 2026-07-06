import React, { useState } from 'react';
import { 
  Briefcase, Car, Building2, TrendingUp, Handshake, CreditCard, 
  Wallet, ShieldCheck, Search, Filter, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, Clock, XCircle, AlertCircle, Banknote, RefreshCw,
  QrCode, Landmark, Link as LinkIcon, Download, Smartphone
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type InteractionType = 'compra' | 'venda' | 'troca';
type ItemCategory = 'veiculo' | 'imovel';
type Status = 'andamento' | 'concluido' | 'cancelado' | 'pendente_pagamento' | 'pago';

interface Negotiation {
  id: string;
  type: InteractionType;
  category: ItemCategory;
  itemTitle: string;
  itemImage: string;
  valueAnnounced: number;
  valueNegotiated: number;
  status: Status;
  date: string;
  otherParty: {
    name: string;
    rating: number;
    verified: boolean;
  };
}

const MOCK_NEGOTIATIONS: Negotiation[] = [
  {
    id: 'NEG-1045',
    type: 'compra',
    category: 'veiculo',
    itemTitle: 'Porsche 911 Carrera S 2021',
    itemImage: 'https://images.unsplash.com/photo-1503376712341-b0be1caed81c?w=500&q=80',
    valueAnnounced: 850000,
    valueNegotiated: 835000,
    status: 'pago',
    date: '28 Abr 2026',
    otherParty: { name: 'AutoPremium Plus', rating: 4.9, verified: true }
  },
  {
    id: 'NEG-1046',
    type: 'venda',
    category: 'imovel',
    itemTitle: 'Apartamento Duplex - Vila Olímpia',
    itemImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=80',
    valueAnnounced: 1250000,
    valueNegotiated: 1200000,
    status: 'pendente_pagamento',
    date: '27 Abr 2026',
    otherParty: { name: 'Carlos Santos', rating: 4.7, verified: true }
  },
  {
    id: 'NEG-1047',
    type: 'troca',
    category: 'veiculo',
    itemTitle: 'BMW X5 2022 x Audi Q8 2023',
    itemImage: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&q=80',
    valueAnnounced: 450000,
    valueNegotiated: 450000,
    status: 'andamento',
    date: '25 Abr 2026',
    otherParty: { name: 'Marcos Oliveira', rating: 4.8, verified: false }
  },
  {
    id: 'NEG-1048',
    type: 'compra',
    category: 'imovel',
    itemTitle: 'Casa de Praia - Riviera',
    itemImage: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=500&q=80',
    valueAnnounced: 2800000,
    valueNegotiated: 2750000,
    status: 'concluido',
    date: '15 Abr 2026',
    otherParty: { name: 'Litoral Imóveis Real', rating: 5.0, verified: true }
  },
  {
    id: 'NEG-1049',
    type: 'venda',
    category: 'veiculo',
    itemTitle: 'Tesla Model 3 Performance',
    itemImage: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=500&q=80',
    valueAnnounced: 320000,
    valueNegotiated: 305000,
    status: 'cancelado',
    date: '10 Abr 2026',
    otherParty: { name: 'Julia Costa', rating: 4.5, verified: true }
  }
];

export default function NegotiationsDashboard() {
  const [filterType, setFilterType] = useState<InteractionType | 'todos'>('todos');
  const [filterCategory, setFilterCategory] = useState<ItemCategory | 'todos'>('todos');
  const [filterStatus, setFilterStatus] = useState<Status | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredData = MOCK_NEGOTIATIONS.filter(item => {
    if (filterType !== 'todos' && item.type !== filterType) return false;
    if (filterCategory !== 'todos' && item.category !== filterCategory) return false;
    if (filterStatus !== 'todos' && item.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.id.toLowerCase().includes(q) || item.itemTitle.toLowerCase().includes(q) || item.otherParty.name.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusInfo = (status: Status) => {
    switch(status) {
      case 'andamento': return { label: 'Em Andamento', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'concluido': return { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'pendente_pagamento': return { label: 'Pendente Pagto.', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'pago': return { label: 'Pago', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-600/10' };
      case 'cancelado': return { label: 'Cancelado', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' };
    }
  };

  const getCategoryIcon = (category: ItemCategory) => {
    return category === 'veiculo' ? <Car className="w-4 h-4" /> : <Building2 className="w-4 h-4" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-3xl overflow-hidden relative border border-border shadow-sm">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-border bg-card">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
          <Handshake className="w-8 h-8 text-indigo-500" />
          Central de Negociações
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas compras, vendas e trocas de ponta a ponta com segurança.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 space-y-8 pb-32">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Comprado', value: formatCurrency(3585000), icon: ArrowDownRight, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Total Vendido', value: formatCurrency(1200000), icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Em Andamento', value: formatCurrency(450000), icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Ticket Médio', value: formatCurrency(1318000), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' }
          ].map((metric, i) => (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-xl", metric.bg, metric.color)}>
                  <metric.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{metric.label}</p>
                <h3 className="text-lg md:text-xl font-black">{metric.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por ID, item ou pessoa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-background border border-border rounded-lg p-1">
              <button 
                onClick={() => setFilterType('todos')}
                className={cn("px-3 py-1.5 rounded-md font-medium transition-colors", filterType === 'todos' ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
              >Todos</button>
              <button 
                onClick={() => setFilterType('compra')}
                className={cn("px-3 py-1.5 rounded-md font-medium transition-colors", filterType === 'compra' ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
              >Compras</button>
              <button 
                onClick={() => setFilterType('venda')}
                className={cn("px-3 py-1.5 rounded-md font-medium transition-colors", filterType === 'venda' ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
              >Vendas</button>
              <button 
                onClick={() => setFilterType('troca')}
                className={cn("px-3 py-1.5 rounded-md font-medium transition-colors", filterType === 'troca' ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
              >Trocas</button>
            </div>

            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todos">Todos Itens</option>
              <option value="veiculo">Veículos (SimulaCar)</option>
              <option value="imovel">Imóveis (SimulaLar)</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider font-bold border-b border-border">
                <tr>
                  <th className="px-6 py-4">Negociação</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Participante</th>
                  <th className="px-6 py-4">Valor Acordado</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-accent/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            item.type === 'compra' ? "bg-rose-500/10 text-rose-500" :
                            item.type === 'venda' ? "bg-emerald-500/10 text-emerald-500" :
                            "bg-indigo-500/10 text-indigo-500"
                          )}>
                            {item.type === 'compra' ? <ArrowDownRight className="w-5 h-5" /> : 
                             item.type === 'venda' ? <ArrowUpRight className="w-5 h-5" /> : 
                             <RefreshCw className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-foreground capitalize">{item.type}</p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">{item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={item.itemImage} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted" />
                          <div className="max-w-[200px]">
                            <p className="font-semibold text-foreground truncate" title={item.itemTitle}>{item.itemTitle}</p>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground uppercase font-bold">
                              {getCategoryIcon(item.category)} {item.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.otherParty.name}</span>
                          {item.otherParty.verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-medium">Avaliação: {item.otherParty.rating} ⭐</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-black text-[15px]">{formatCurrency(item.valueNegotiated)}</span>
                          {item.valueNegotiated < item.valueAnnounced && (
                            <span className="text-[10px] text-muted-foreground font-bold line-through">
                              {formatCurrency(item.valueAnnounced)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit", statusInfo.bg, statusInfo.color)}>
                          <statusInfo.icon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-medium text-sm">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedNegotiation(item)}
                          className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs rounded-lg transition-colors"
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Handshake className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhuma negociação encontrada com os filtros atuais.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedNegotiation && !showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="uppercase text-[10px] font-black tracking-wider text-muted-foreground">ID {selectedNegotiation.id}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                      selectedNegotiation.type === 'compra' ? "bg-rose-500/20 text-rose-500" :
                      selectedNegotiation.type === 'venda' ? "bg-emerald-500/20 text-emerald-500" :
                      "bg-indigo-500/20 text-indigo-500"
                    )}>{selectedNegotiation.type}</span>
                  </div>
                  <h2 className="text-xl font-black">Detalhes da Negociação</h2>
                </div>
                <button onClick={() => setSelectedNegotiation(null)} className="p-2 hover:bg-accent rounded-full text-muted-foreground">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {/* Item Summary */}
                <div className="flex gap-4 items-start">
                  <img src={selectedNegotiation.itemImage} alt="" className="w-24 h-24 rounded-xl object-cover bg-muted" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg leading-tight mb-1">{selectedNegotiation.itemTitle}</h3>
                    <p className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-2">
                       {getCategoryIcon(selectedNegotiation.category)} Módulo {selectedNegotiation.category === 'veiculo' ? 'SimulaCar' : 'SimulaLar'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4 bg-muted/50 p-3 rounded-xl border border-border">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Valor Anunciado</p>
                        <p className="font-medium text-sm line-through opacity-70">{formatCurrency(selectedNegotiation.valueAnnounced)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-emerald-600 mb-0.5">Fechamento</p>
                        <p className="font-black text-lg text-emerald-600 dark:text-emerald-500">{formatCurrency(selectedNegotiation.valueNegotiated)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress / Status */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <ShieldCheck className="w-32 h-32" />
                  </div>
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> Transação Segura via Plataforma
                  </h4>
                  <div className="flex flex-col gap-4 relative">
                    <div className="flex items-center gap-4 z-10">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                         <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Proposta Aceita</p>
                        <p className="text-xs text-muted-foreground">{selectedNegotiation.date}</p>
                      </div>
                    </div>
                    
                    {/* Line connector */}
                    <div className="absolute left-4 top-8 bottom-4 w-px bg-border -z-0" />

                    <div className="flex items-center gap-4 z-10">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2", 
                        selectedNegotiation.status === 'pago' ? "bg-emerald-500 border-emerald-500 text-white" :
                        selectedNegotiation.status === 'pendente_pagamento' ? "bg-blue-500 border-blue-500 text-white" :
                        "bg-card border-border text-muted-foreground"
                      )}>
                         {selectedNegotiation.status === 'pago' ? <CheckCircle2 className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">Pagamento</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedNegotiation.status === 'pago' ? 'Confirmado pelo gateway' : 
                           selectedNegotiation.status === 'pendente_pagamento' ? 'Aguardando ação' : 'Cancelado/Indisponível'}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Action Rules */}
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <h4 className="font-bold text-sm mb-2">Comunicação e Termos</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A negociação está vinculada aos termos de uso da {selectedNegotiation.category === 'veiculo' ? 'SimulaCar' : 'SimulaLar'}. 
                    O valor acordado será mantido em custódia (split) no gateway parceiro até a confirmação de entrega do bem/transferência de documentação.
                    Este processo está em total conformidade com a LGPD e regulamentações do BACEN.
                  </p>
                </div>
              </div>

              {/* Modals Footer Actions */}
              <div className="p-6 border-t border-border bg-card flex justify-end gap-3">
                <button className="px-6 py-2.5 rounded-xl font-bold bg-muted hover:bg-accent transition-colors text-sm">
                  Imprimir Recibo
                </button>
                {selectedNegotiation.status === 'pendente_pagamento' && selectedNegotiation.type === 'compra' && (
                  <button 
                    onClick={() => { setShowPaymentModal(true); }}
                    className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm text-sm"
                  >
                    Efetuar Pagamento
                  </button>
                )}
                {selectedNegotiation.status === 'pago' && (
                  <button className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm text-sm flex items-center gap-2">
                    <Download className="w-4 h-4" /> Baixar Contrato
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout / Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedNegotiation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col md:items-center justify-end md:justify-center bg-black/60 backdrop-blur-md p-0 md:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-card w-full md:max-w-[480px] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col h-[90vh] md:h-auto max-h-[850px] overflow-hidden border border-border"
            >
              <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-sm">Checkout Seguro</span>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-accent rounded-full text-foreground"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="text-center">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total a Pagar</p>
                  <h2 className="text-4xl font-black text-foreground tracking-tighter">
                    {formatCurrency(selectedNegotiation.valueNegotiated)}
                  </h2>
                  <p className="text-sm font-medium mt-2 text-muted-foreground line-clamp-1">{selectedNegotiation.itemTitle}</p>
                </div>

                <div className="space-y-3">
                  <p className="font-bold text-sm">Método de Pagamento</p>
                  
                  {/* PIX Option */}
                  <label className="flex items-center justify-between p-4 border-2 border-emerald-500 bg-emerald-500/5 rounded-2xl cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">PIX</p>
                        <p className="text-xs text-muted-foreground">Aprovação imediata</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-4 border-emerald-500 bg-white" />
                  </label>

                  {/* TED Option */}
                  <label className="flex items-center justify-between p-4 border border-border hover:border-primary/50 transitoin-colors rounded-2xl cursor-pointer bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-foreground">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">TED / Transferência</p>
                        <p className="text-xs text-muted-foreground">Até 1 dia útil</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-border" />
                  </label>
                  
                  {/* Tokenized Card Option */}
                  <label className="flex items-center justify-between p-4 border border-border hover:border-primary/50 transitoin-colors rounded-2xl cursor-pointer bg-card opacity-50 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-foreground">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">Cartão de Crédito</p>
                        <p className="text-xs text-muted-foreground">Indisponível para este valor</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-border" />
                  </label>

                </div>

                <div className="bg-muted p-4 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Split de Pagamento Ativo:</strong> Seu valor vai diretamente para uma conta escrow controlada pela plataforma e será liberado ao vendedor ({selectedNegotiation.otherParty.name}) apenas após a assinatura do contrato e entrega do bem.
                  </div>
                </div>

              </div>
              
              <div className="p-4 md:p-6 bg-card border-t border-border shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button 
                  onClick={() => {
                    alert("Simulação de pagamento PIX concluída com sucesso via API do Gateway.");
                    setShowPaymentModal(false);
                    setSelectedNegotiation({ ...selectedNegotiation, status: 'pago' });
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-lg rounded-xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-5 h-5" /> Gerar Código PIX
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
