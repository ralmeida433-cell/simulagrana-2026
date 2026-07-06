import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Search, 
  Briefcase, 
  LayoutDashboard, 
  Calculator, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  FileText,
  Users,
  Layers,
  Percent,
  PlayCircle,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  tab: string;
  badge: string;
  icon: React.ComponentType<any>;
  highlightText: string;
  concepts: string[];
  tips: string;
  selector?: string;
  preview: {
    title: string;
    metrics: { label: string; value: string; positive?: boolean }[];
  };
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = [
    {
      title: 'Boas-vindas ao SimulaGrana! 🚀',
      subtitle: 'Seu Cockpit de Inteligência Financeira',
      badge: '01. INTRODUÇÃO',
      icon: Sparkles,
      tab: 'dashboard',
      description: 'O SimulaGrana foi projetado para transformar dados complexos do mercado financeiro em simuladores práticos e análises acionáveis. Aqui você consolida sua visão de mercado, compara índices macroeconômicos e testa premissas matemáticas reais antes de alocar seu capital.',
      concepts: [
        'Acompanhamento de índices em tempo real (IBOV, CDI, IPCA, SELIC).',
        'Notícias financeiras integradas e atualizadas por canais dinâmicos.',
        'Atalhos rápidos para as calculadoras de valuation mais consagradas.'
      ],
      tips: 'Defina seu perfil de investidor na aba Configurações e use os simuladores para alinhar suas expectativas de longo prazo com a realidade matemática.',
      highlightText: 'Painel Central unificado com cotações, taxas de inflação e notícias filtradas.',
      preview: {
        title: 'Painel de Indicadores',
        metrics: [
          { label: 'IBOVESPA', value: '119.852 pts', positive: true },
          { label: 'CDI Anual', value: '10,75%', positive: true },
          { label: 'IPCA 12M', value: '4,52%', positive: false }
        ]
      }
    },
    {
      title: 'Pesquisa Avançada & Análise CVM 🔍',
      subtitle: 'Raio-X de Ações, FIIs e Documentos Oficiais',
      badge: '02. ANÁLISE DE ATIVOS',
      icon: Search,
      tab: 'pesquisa',
      selector: '#nav-item-pesquisa',
      description: 'A ferramenta de Pesquisa de Ativos vai muito além de uma simples cotação. Você pode explorar balanços consolidados, histórico de dividendos e analisar relatórios em PDF oficiais enviados à CVM. Através de um proxy exclusivo, você abre relatórios e usa o suporte de IA para extrair insights.',
      concepts: [
        'Pesquisa de Tickers integrada com banco de dados de cotações nacionais.',
        'Análise de dividendos acumulados, dividend yield e proventos provisionados.',
        'Visualizador integrado de PDFs oficiais da CVM com proxy seguro de carregamento.'
      ],
      tips: 'Digite o ticker de sua escolha (ex: VALE3 ou MXRF11) e navegue pelas abas "Notícias" e "Documentos" para ver os relatórios emitidos na semana.',
      highlightText: 'Acesso direto aos documentos oficiais das empresas sem sair da aplicação.',
      preview: {
        title: 'Busca Ativa: PETR4',
        metrics: [
          { label: 'Cotação', value: 'R$ 38,42', positive: true },
          { label: 'P/L Histórico', value: '4.12x', positive: true },
          { label: 'Dividend Yield', value: '12,4%', positive: true }
        ]
      }
    },
    {
      title: 'Gestão de Carteira Inteligente 💼',
      subtitle: 'Controle de Aportes, Evolução e Rentabilidade',
      badge: '03. MINHA CARTEIRA',
      icon: Briefcase,
      tab: 'portfolio',
      selector: '#nav-item-portfolio',
      description: 'Registre suas movimentações e compras de ativos de forma modular. O sistema calcula automaticamente o preço médio, ponderação de classes e gera gráficos elegantes que comparam seu portfólio diretamente com o CDI e o IBOVESPA ao longo do tempo.',
      concepts: [
        'Registro ágil de compras, vendas e proventos recebidos.',
        'Gráfico histórico "Evolução vs Benchmark" com amortização de aportes.',
        'Mapeador de Alocação de Ativos para evitar riscos de sobre-concentração.'
      ],
      tips: 'Mantenha seus preços médios sempre atualizados. Uma carteira bem diversificada protege o patrimônio contra oscilações severas do mercado.',
      highlightText: 'Gráfico interativo de rentabilidade real ponderada por aportes temporais.',
      preview: {
        title: 'Desempenho da Carteira',
        metrics: [
          { label: 'Patrimônio', value: 'R$ 48.250,00', positive: true },
          { label: 'Retorno Total', value: '+18,4%', positive: true },
          { label: 'Proventos/Mês', value: 'R$ 320,40', positive: true }
        ]
      }
    },
    {
      title: 'Calculadoras de Valuation Clássicas 🔢',
      subtitle: 'A Filosofia dos Grandes Mestres em Código',
      badge: '04. VALUATION',
      icon: Calculator,
      tab: 'dashboard',
      selector: '#nav-item-graham',
      description: 'Desenvolvemos módulos matemáticos com as fórmulas originais de lendas do investimento. Estime o preço justo de ações usando o modelo de Graham (P/L e P/VP máximos), o método Décio Bazin (dividend yield mínimo), a consistência de Luiz Barsi e o PEG Ratio de Peter Lynch.',
      concepts: [
        'Fórmula de Benjamin Graham: Limite de preço com margem de segurança de 22.5.',
        'Método Bazin: Filtro de segurança baseado em distribuição reuniões constantes.',
        'Fórmula de Joel Greenblatt: Ranking de empresas eficientes (Fórmula Mágica).'
      ],
      tips: 'Use as calculadoras como uma primeira linha de triagem para identificar ativos potencialmente subavaliados ou negociados com grande margem de desconto.',
      highlightText: 'Fórmulas puras, sem dados simulados arbitrários. Total transparência nos cálculos.',
      preview: {
        title: 'Valuation Benjamin Graham',
        metrics: [
          { label: 'Preço Atual', value: 'R$ 22,00', positive: true },
          { label: 'Preço Justo', value: 'R$ 31,50', positive: true },
          { label: 'Margem Seg.', value: '43,1%', positive: true }
        ]
      }
    },
    {
      title: 'Simuladores de Longo Prazo & Projetores ⏱️',
      subtitle: 'Do Juros Compostos ao Financiamento Inteligente',
      badge: '05. PROJEÇÕES',
      icon: Percent,
      tab: 'dashboard',
      selector: '#nav-item-compound',
      description: 'Simule o efeito da bola de neve através do simulador de Juros Compostos. Compare também alternativas de financiamento imobiliário e automotivo (tabelas SAC e PRICE), compare a eficiência de veículos Elétricos vs Combustão e projete aportes mensais necessários para sua liberdade financeira.',
      concepts: [
        'Simulador de Juros Compostos detalhado com tabelas anuais de evolução.',
        'Simulador SAC/PRICE para amortização e planejamento de quitações.',
        'Renda Fixa & Tesouro Direto: Calculadora de rendimento líquido pós-impostos.'
      ],
      tips: 'A consistência do aporte mensal e o tempo de exposição aos juros compostos são as variáveis mais poderosas para a construção de riqueza.',
      highlightText: 'Curva gráfica projetiva de juros acumulados e patrimônio líquido.',
      preview: {
        title: 'Simulador Juros Compostos',
        metrics: [
          { label: 'Total Investido', value: 'R$ 120.000', positive: true },
          { label: 'Juros Acumulados', value: 'R$ 245.300', positive: true },
          { label: 'Total Acumulado', value: 'R$ 365.300', positive: true }
        ]
      }
    },
    {
      title: 'Rede de Carteiras & Modos Criadores 🌟',
      subtitle: 'Conexão Social e Ferramentas Multimídia',
      badge: '06. CONEXÃO & SOCIAL',
      icon: Users,
      tab: 'dashboard',
      selector: '#nav-item-creator-mode',
      description: 'O SimulaGrana traz recursos de ponta para criadores de conteúdo e investidores sociais. Siga carteiras públicas de outros membros (Wallet Follow), participe do ranking de rentabilidade da comunidade e utilize o "Modo Criador" para ocultar valores confidenciais e gravar relatórios em áudio!',
      concepts: [
        'Wallet Follow: Rede social de portfólios públicos com rankings auditados.',
        'Modo Criador: Estúdio de gravação de relatórios em áudio e player global.',
        'Negociações & Propostas: Simulações interativas de termos de investimento.'
      ],
      tips: 'Nas configurações do seu Perfil, você escolhe se sua carteira é Privada ou Pública. Ative o Modo Criador caso queira produzir vídeos sem expor seus saldos.',
      highlightText: 'Sincronização de portfólios e compartilhamento seguro com a comunidade.',
      preview: {
        title: 'Rede Social de Investidores',
        metrics: [
          { label: 'Seguidores', value: '1.240', positive: true },
          { label: 'Posição Ranking', value: '12º lugar', positive: true },
          { label: 'Visibilidade', value: 'Ativa', positive: true }
        ]
      }
    },
    {
      title: 'Tudo Configurado! Bons Investimentos 🚀',
      subtitle: 'Você está no comando do seu futuro financeiro',
      badge: '07. CONCLUSÃO',
      icon: CheckCircle,
      tab: 'dashboard',
      description: 'Parabéns! Você concluiu a apresentação didática do SimulaGrana. Agora você tem o conhecimento necessário para explorar as ferramentas com total autonomia e extrair o máximo do mercado financeiro.',
      concepts: [
        'Acesse o "Tour pelo Dashboard" a qualquer momento no menu lateral se precisar.',
        'Explore e configure suas metas pessoais no menu Perfil.',
        'Nosso motor matemático e nossa IA estão prontos para apoiar suas análises.'
      ],
      tips: 'O mercado financeiro premia a paciência e a disciplina. Estude, simule e invista com sabedoria!',
      highlightText: 'Navegação lateral liberada. Comece agora buscando seu primeiro ativo!',
      preview: {
        title: 'SimulaGrana Ativo',
        metrics: [
          { label: 'Status', value: 'Pronto', positive: true },
          { label: 'Módulos', value: '24 Ativos', positive: true },
          { label: 'Suporte IA', value: 'Online', positive: true }
        ]
      }
    }
  ];

  // Dynamically change tabs to match the tour step
  useEffect(() => {
    if (isOpen && steps[currentStep]) {
      const stepTab = steps[currentStep].tab;
      if (activeTab !== stepTab) {
        setActiveTab(stepTab);
      }
    }
  }, [currentStep, isOpen]);

  // Track the bounding rectangle of the active element being spotlighted
  useEffect(() => {
    if (!isOpen) {
      setSpotlightRect(null);
      return;
    }

    const updateSpotlight = () => {
      const step = steps[currentStep];
      if (step && step.selector) {
        const element = document.querySelector(step.selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if element is visible and has width/height
          if (rect.width > 0 && rect.height > 0) {
            setSpotlightRect(rect);
            return;
          }
        }
      }
      setSpotlightRect(null);
    };

    // Call immediately and again with a short delay to let layout shift/tabs transition finish
    updateSpotlight();
    const timeoutId = setTimeout(updateSpotlight, 300);

    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [currentStep, isOpen, activeTab]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('simulagrana_tour_completed', 'true');
    onClose();
    setCurrentStep(0);
  };

  const handleSkip = () => {
    localStorage.setItem('simulagrana_tour_completed', 'true');
    onClose();
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const IconComponent = step.icon;
  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <div 
        id="dashboard-tour-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        {/* Dynamic Glowing Spotlight Focus Mask */}
        {spotlightRect ? (
          <motion.div
            key={`spotlight-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              boxShadow: [
                '0 0 0 9999px rgba(2, 6, 23, 0.9), 0 0 15px 4px rgba(99, 102, 241, 0.55)',
                '0 0 0 9999px rgba(2, 6, 23, 0.9), 0 0 25px 8px rgba(99, 102, 241, 0.75)',
                '0 0 0 9999px rgba(2, 6, 23, 0.9), 0 0 15px 4px rgba(99, 102, 241, 0.55)'
              ]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              boxShadow: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              },
              opacity: { duration: 0.3 }
            }}
            className="fixed pointer-events-none z-40 border-2 border-primary rounded-xl"
            style={{
              left: spotlightRect.left - 6,
              top: spotlightRect.top - 6,
              width: spotlightRect.width + 12,
              height: spotlightRect.height + 12,
            }}
          />
        ) : (
          /* General Backdrop if no target element exists or is visible */
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-40 pointer-events-none transition-all duration-300" />
        )}

        {/* Tour Modal Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-card text-card-foreground border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative my-8 z-50"
        >
          {/* Top colored accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-indigo-600 z-10" />

          {/* Left Column: List of Steps (Sidebar) */}
          <div className="w-full md:w-80 bg-muted/35 border-r border-border p-6 flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-primary animate-bounce" />
                <span className="font-mono text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Jornada Didática
                </span>
              </div>

              <div className="space-y-2">
                {steps.map((s, idx) => {
                  const isActive = idx === currentStep;
                  const isPassed = idx < currentStep;

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0",
                        isActive 
                          ? "bg-primary-foreground/20 text-primary-foreground" 
                          : isPassed 
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                            : "bg-muted-foreground/10 text-muted-foreground"
                      )}>
                        {isPassed ? "✓" : idx + 1}
                      </div>
                      <div className="truncate">
                        <p className={cn(
                          "text-xs font-bold leading-tight",
                          isActive ? "text-primary-foreground" : "text-foreground/90"
                        )}>
                          {s.title.split('!')[0].split('🚀')[0].split('🔍')[0].split('💼')[0].split('🔢')[0].split('⏱️')[0].split('🌟')[0]}
                        </p>
                        <p className={cn(
                          "text-[9px] uppercase tracking-wider font-semibold",
                          isActive ? "text-primary-foreground/75" : "text-muted-foreground"
                        )}>
                          {s.badge.split('.')[1].trim()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border/60 hidden md:block">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Navegue pelas etapas para aprender a utilizar o potencial máximo do SimulaGrana. Cancelamentos e reinícios são suportados a qualquer momento.
              </p>
            </div>
          </div>

          {/* Right Column: Active Step Content */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-card">
            {/* Header / Dismiss */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest font-black text-primary px-3 py-1 bg-primary/10 rounded-full">
                {step.badge}
              </span>
              <button 
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-xl"
                title="Sair do Tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Information */}
            <div className="space-y-6 flex-1">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                    <IconComponent className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {step.subtitle}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mt-4">
                  {step.description}
                </p>
              </div>

              {/* Concepts / Didactic checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Conceitos Práticos Ensinados:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {step.concepts.map((concept, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2.5 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-ping" />
                      <p className="text-xs text-muted-foreground leading-normal">
                        {concept}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Mockup Preview Area */}
              <div className="border border-border/60 bg-muted/20 rounded-2xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    Mockup Interativo: {step.preview.title}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-mono font-bold px-1.5 py-0.5 rounded">
                    Demonstração
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {step.preview.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="bg-card border border-border/40 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
                      <p className={cn(
                        "text-xs md:text-sm font-black mt-0.5",
                        m.positive === true ? "text-emerald-500" : m.positive === false ? "text-rose-500" : "text-foreground"
                      )}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Professional Tip banner */}
              <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
                <div className="p-1 bg-primary/10 text-primary rounded-lg shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
                    Dica Profissional
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.tips}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="border-t border-border mt-6 pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-card">
              {/* Progress Bar for mobile */}
              <div className="w-full sm:w-1/3 bg-border h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleSkip}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors py-2.5 px-4 hover:bg-muted rounded-xl mr-auto sm:mr-0"
                >
                  Pular Tour
                </button>

                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-xs font-bold border border-border text-foreground hover:bg-muted py-2.5 px-4 rounded-xl transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 px-5 rounded-xl shadow-lg shadow-primary/25 transition-all"
                >
                  {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo Passo'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
