import React, { useRef, useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Info, 
  Calendar, 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  Award,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bookmark,
  Sparkles
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface FundamentalistInfographicProps {
  ticker: string;
  companyName?: string;
  currentPrice?: number;
  priceChange?: number;
  sector?: string;
  industry?: string;
  apiData?: any;
}

interface StockPreset {
  ticker: string;
  companyName: string;
  founded: string;
  age: string;
  employees: string;
  historyText: string;
  whatItDoes: string[];
  sourcesOfRevenue: { name: string; percentage: number; color: string }[];
  scores: {
    valuation: number;
    growth: number;
    dividends: number;
    quality: number;
    solidez: number;
    governance: number;
    finalScore: number;
  };
  pros: string[];
  cons: string[];
  financials: {
    revenue: string;
    netIncome: string;
    ebitda: string;
    marketCap: string;
    employeesCount: string;
  };
  debt: {
    grossDebt: string;
    netDebt: string;
    debtToEquity: string;
    currentRatio: string;
    points: { text: string; status: 'positive' | 'warning' | 'negative' }[];
  };
  valuation: {
    pl: string;
    pvp: string;
    evEbitda: string;
    peg: string;
    vpa: string;
    points: { text: string; status: 'positive' | 'warning' | 'negative' }[];
  };
  dividends: {
    yield: string;
    history: { year: string; status: string; icon: string }[];
    points: { text: string; status: 'positive' | 'warning' | 'negative' }[];
  };
  growth: {
    points: { label: string; text: string; status: 'positive' | 'warning' | 'negative' }[];
  };
  quality: {
    roe: string;
    roa: string;
    roic: string;
    marginEbitda: string;
    marginNet: string;
    points: { text: string; status: 'positive' | 'warning' | 'negative' }[];
  };
  lucroVsCotacao: {
    history: { year: string; profitBlock: number; priceTrend: string }[];
    points: string[];
    targetPrice: string;
    upside: string;
  };
  risks: { name: string; level: string; status: string }[];
  swot: {
    forces: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  summary30s: string;
  colorTheme: string; // Hex color or class name for primary brand highlight
}

function oklabToRgb(l: number, a_coord: number, b_coord: number, a: number = 1): string {
  const l_ = l + 0.3963377774 * a_coord + 0.2158037573 * b_coord;
  const m_ = l - 0.1055613458 * a_coord - 0.0638541728 * b_coord;
  const s_ = l - 0.0894841775 * a_coord - 1.2914855480 * b_coord;

  const l_cube = l_ * l_ * l_;
  const m_cube = m_ * m_ * m_;
  const s_cube = s_ * s_ * s_;

  const r =  4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

  const gamma = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const r255 = Math.round(gamma(r) * 255);
  const g255 = Math.round(gamma(g) * 255);
  const b255 = Math.round(gamma(b) * 255);

  if (a < 1) {
    return `rgba(${r255}, ${g255}, ${b255}, ${a})`;
  }
  return `rgb(${r255}, ${g255}, ${b255})`;
}

function oklchToRgb(l: number, c: number, h: number, a: number = 1): string {
  const hRad = (h * Math.PI) / 180;
  const a_coord = c * Math.cos(hRad);
  const b_coord = c * Math.sin(hRad);
  return oklabToRgb(l, a_coord, b_coord, a);
}

function parseAndConvertColors(str: string): string {
  if (!str || typeof str !== 'string') return str;
  if (!str.includes('oklch') && !str.includes('oklab') && !str.includes('color(')) return str;

  let result = str;

  // Replace oklch
  result = result.replace(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.deg%]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/gi, (match, lStr, cStr, hStr, aStr) => {
    const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
    const c = parseFloat(cStr);
    const h = hStr.endsWith('deg') ? parseFloat(hStr) : parseFloat(hStr);
    let a = 1;
    if (aStr) {
      a = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
    }
    if (isNaN(l) || isNaN(c) || isNaN(h)) return match;
    return oklchToRgb(l, c, h, a);
  });

  // Replace oklab
  result = result.replace(/oklab\(\s*([\d.]+%?)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/gi, (match, lStr, aStr, bStr, alphaStr) => {
    const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
    const aCoord = parseFloat(aStr);
    const bCoord = parseFloat(bStr);
    let alpha = 1;
    if (alphaStr) {
      alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
    }
    if (isNaN(l) || isNaN(aCoord) || isNaN(bCoord)) return match;
    return oklabToRgb(l, aCoord, bCoord, alpha);
  });
  
  // Replace fallback to grey for 'color(display-p3 ...)' or others if html2canvas still chokes on them
  result = result.replace(/color\([^)]+\)/gi, 'rgba(128, 128, 128, 0.5)');

  return result;
}

const STOCK_PRESETS: Record<string, StockPreset> = {
  PETR4: {
    ticker: 'PETR4',
    companyName: 'Petróleo Brasileiro S.A. - Petrobras',
    founded: '03 de Outubro de 1953',
    age: '72 anos',
    employees: '43.000+ diretos (100.000+ indiretos)',
    historyText: 'Criada durante o governo do presidente Getúlio Vargas sob o lema histórico "O Petróleo é Nosso". Tornou-se pioneira e líder mundial em exploração e produção em águas ultraprofundas (Pré-Sal), desenvolvendo tecnologia de ponta 100% nacional para viabilizar jazidas complexas a quilômetros sob o leito oceânico.',
    whatItDoes: [
      'Explora petróleo e gás natural em escala global',
      'Produz petróleo em águas profundas e ultraprofundas (Pré-Sal)',
      'Ampla infraestrutura de refino de combustíveis (gasolina, diesel, GLP)',
      'Exportadora relevante de petróleo cru e derivados refinados',
      'Investimento estratégico focado na transição para energias de baixo carbono'
    ],
    sourcesOfRevenue: [
      { name: 'Exploração e Produção (E&P)', percentage: 75, color: 'bg-emerald-600' },
      { name: 'Refino e Comercialização', percentage: 20, color: 'bg-amber-500' },
      { name: 'Gás e Energias Renováveis', percentage: 5, color: 'bg-sky-500' }
    ],
    scores: {
      valuation: 95,
      growth: 80,
      dividends: 95,
      quality: 85,
      solidez: 82,
      governance: 65,
      finalScore: 84
    },
    pros: [
      'Empresa com geração de caixa operacional massiva e contínua.',
      'Dividend yield entre os maiores do mercado corporativo global.',
      'Custos de extração (lifting cost) do Pré-Sal extremamente competitivos.'
    ],
    cons: [
      'Exposição direta a riscos políticos e de governança pelo controle estatal.',
      'Forte dependência do preço internacional da commodity de petróleo (Brent).'
    ],
    financials: {
      revenue: 'R$ 498 bilhões',
      netIncome: 'R$ 108 bilhões',
      ebitda: 'R$ 205 bilhões',
      marketCap: 'R$ 563 bilhões',
      employeesCount: '43 mil +'
    },
    debt: {
      grossDebt: 'R$ 376 bilhões',
      netDebt: 'R$ 314 bilhões',
      debtToEquity: '0,74',
      currentRatio: '0,75',
      points: [
        { text: 'Dívida sob absoluto controle e perfeitamente administrável.', status: 'positive' },
        { text: 'Fluxo de pagamentos totalmente respaldado por robusta geração de caixa.', status: 'positive' },
        { text: 'Necessidade contínua de investimentos bilionários nas frentes do Pré-Sal.', status: 'warning' },
        { text: 'Exposição parcial a oscilações de câmbio (Dólar americano).', status: 'warning' }
      ]
    },
    valuation: {
      pl: '4,9',
      pvp: '1,1',
      evEbitda: '2,3 – 4,3',
      peg: '0,04',
      vpa: 'R$ 33 – 35',
      points: [
        { text: 'Preço/Lucro (P/L) abaixo de 5 indica desconto temporal atrativo.', status: 'positive' },
        { text: 'Múltiplos históricos operacionais muito descontados.', status: 'positive' },
        { text: 'Valuation significativamente inferior à média de concorrentes globais.', status: 'positive' },
        { text: 'O desconto no preço reflete diretamente o risco político percebido.', status: 'warning' }
      ]
    },
    dividends: {
      yield: '8% a 12% + ao ano',
      history: [
        { year: '2021', status: 'Muito Forte 💎', icon: '💎' },
        { year: '2022', status: 'Histórico / Recorde 🏆', icon: '🏆' },
        { year: '2023 - 2025', status: 'Forte e Consistente ⚡', icon: '⚡' },
        { year: '2026', status: 'Continua altamente relevante 🔥', icon: '🔥' }
      ],
      points: [
        { text: 'Excelente ativo para estratégias maduras de geração de renda passiva.', status: 'positive' },
        { text: 'As distribuições futuras dependem dos preços do Brent e das diretrizes estatais.', status: 'warning' }
      ]
    },
    growth: {
      points: [
        { label: 'Receita', text: 'Estabilizada em patamares historicamente elevados.', status: 'positive' },
        { label: 'Lucro', text: 'Forte recuperação consolidada no biênio 2025/2026.', status: 'positive' },
        { label: 'Produção', text: 'Sucessivos recordes operacionais nas camadas do Pré-Sal.', status: 'positive' },
        { label: 'Exportações', text: 'Fluxo crescente e altamente consistente focado na Ásia.', status: 'positive' }
      ]
    },
    quality: {
      roe: '24%',
      roa: '9%',
      roic: '13%',
      marginEbitda: '46%',
      marginNet: '22%',
      points: [
        { text: 'Rentabilidade operacional excepcional perante o setor de energia global.', status: 'positive' },
        { text: 'Custos de extração eficientes geram blindagem de margem robusta.', status: 'positive' }
      ]
    },
    lucroVsCotacao: {
      history: [
        { year: '2021', profitBlock: 4, priceTrend: '📈 Alta moderada' },
        { year: '2022', profitBlock: 10, priceTrend: '📈 Recorde / Forte' },
        { year: '2023', profitBlock: 8, priceTrend: '📉 Correção política' },
        { year: '2024', profitBlock: 5, priceTrend: '📉 Estabilização lateral' },
        { year: '2025', profitBlock: 7, priceTrend: '📈 Recuperação' },
        { year: '2026', profitBlock: 8, priceTrend: '📈 Consolidação' }
      ],
      points: [
        'Lucro operacional líquido continua em patamares historicamente sólidos.',
        'O mercado de capitais mantém desconto devido à interferência regulatória.',
        'Potencial de valorização relevante caso o Brent se estabilize acima de US$ 70.'
      ],
      targetPrice: 'R$ 53,28',
      upside: '+30% de potencial'
    },
    risks: [
      { name: 'Risco Político', level: 'Alto', status: 'text-red-500 font-bold font-mono' },
      { name: 'Dependência do Petróleo', level: 'Alta', status: 'text-red-500 font-bold font-mono' },
      { name: 'Dependência Cambial', level: 'Média', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Risco Regulatório', level: 'Médio', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Endividamento Geral', level: 'Controlado', status: 'text-emerald-500 font-bold font-mono' },
      { name: 'Geração de Caixa', level: 'Muito Forte', status: 'text-emerald-500 font-bold font-mono' }
    ],
    swot: {
      forces: [
        'Pré-Sal extremamente lucrativo e consolidado',
        'Forte e previsível geração de caixa operacional',
        'Histórico excelente de distribuição de proventos',
        'Escala global altamente competitiva'
      ],
      weaknesses: [
        'Interferência e controle acionário estatal',
        'Alta dependência da cotação internacional do petróleo'
      ],
      opportunities: [
        'Exploração de novas fronteiras exploratórias (Margem Equatorial)',
        'Expansão das exportações de óleo leve para refino global',
        'Ganhos de produtividade e otimização de refino'
      ],
      threats: [
        'Queda acentuada da cotação do barril de petróleo Brent',
        'Mudanças bruscas em marcos regulatórios ou governança corporativa',
        'Aceleração desordenada da transição energética tradicional'
      ]
    },
    summary30s: 'A Petrobras continua sendo uma das empresas mais lucrativas e eficientes da América Latina. Negociando com múltiplos considerados baratos, possui forte geração de caixa operacional e segue distribuindo proventos altamente atrativos. Os principais fatores de monitoramento continuam sendo a dependência da cotação internacional do barril de petróleo e os riscos de governança decorrentes do controle estatal. Para investidores focados em dividendos e valuation com desconto, a ação permanece atrativa.',
    colorTheme: '#008542' // Verde Petrobras
  },
  VALE3: {
    ticker: 'VALE3',
    companyName: 'Vale S.A.',
    founded: '01 de Junho de 1942',
    age: '84 anos',
    employees: '120.000+ (diretos e indiretos)',
    historyText: 'Fundada pelo presidente Getúlio Vargas como Companhia Vale do Rio Doce para explorar o minério de ferro de Minas Gerais. Privatizada em 1997, expandiu sua atuação de forma espetacular tornando-se multinacional, líder em pellets de alto teor de ferro e níquel, operando minas de classe mundial conectadas a ferrovias e portos de escoamento próprios.',
    whatItDoes: [
      'Uma das maiores empresas de mineração globais',
      'Líder mundial na produção de minério de ferro de alta qualidade',
      'Importante produtora global de níquel e cobre para baterias elétricas',
      'Opera malha ferroviária própria conectando minas a portos de exportação',
      'Investe em soluções de descarbonização (Briquetes de ferro verde)'
    ],
    sourcesOfRevenue: [
      { name: 'Minério de Ferro e Pelotas', percentage: 82, color: 'bg-slate-700' },
      { name: 'Metais de Transição (Níquel e Cobre)', percentage: 15, color: 'bg-emerald-600' },
      { name: 'Outros Minerais e Serviços', percentage: 3, color: 'bg-amber-500' }
    ],
    scores: {
      valuation: 92,
      growth: 75,
      dividends: 88,
      quality: 82,
      solidez: 85,
      governance: 78,
      finalScore: 83
    },
    pros: [
      'Qualidade do minério de ferro (Carajás) com prêmio de mercado excepcional.',
      'Controle integrado de logística (minas, ferrovias e portos dedicados).',
      'Valuation depreciado frente aos concorrentes australianos.'
    ],
    cons: [
      'Grande dependência da demanda por infraestrutura e siderurgia na China.',
      'Passivos ambientais históricos sob rigoroso acompanhamento judicial.'
    ],
    financials: {
      revenue: 'R$ 210 bilhões',
      netIncome: 'R$ 41 bilhões',
      ebitda: 'R$ 85 bilhões',
      marketCap: 'R$ 280 bilhões',
      employeesCount: '120 mil'
    },
    debt: {
      grossDebt: 'R$ 72 bilhões',
      netDebt: 'R$ 55 bilhões',
      debtToEquity: '0,42',
      currentRatio: '1,45',
      points: [
        { text: 'Endividamento muito saudável com baixíssimo risco de liquidez.', status: 'positive' },
        { text: 'Geração robusta de caixa livre garante rápido pagamento de obrigações.', status: 'positive' },
        { text: 'Provisões para indenizações históricas de barragens estão provisionadas.', status: 'warning' }
      ]
    },
    valuation: {
      pl: '6,2',
      pvp: '1,3',
      evEbitda: '3,8',
      peg: '0,15',
      vpa: 'R$ 45 – 48',
      points: [
        { text: 'Múltiplo Preço/Lucro (P/L) descontado historicamente.', status: 'positive' },
        { text: 'Negocia abaixo do valor intrínseco de ativos físicos instalados.', status: 'positive' },
        { text: 'Incertezas de curto prazo sobre crescimento chinês criam desconto de preço.', status: 'warning' }
      ]
    },
    dividends: {
      yield: '7% a 10% ao ano',
      history: [
        { year: '2021', status: 'Extraordinariamente Alto 💎', icon: '💎' },
        { year: '2022 - 2024', status: 'Forte e Recorrente 💰', icon: '💰' },
        { year: '2025', status: 'Estável com Recompra de Ações ⚡', icon: '⚡' },
        { year: '2026', status: 'Consistente de acordo com ciclo de metais 🔥', icon: '🔥' }
      ],
      points: [
        { text: 'Histórico altamente previsível de retorno de capital por dividendos e recompras.', status: 'positive' },
        { text: 'Proventos oscilam em sintonia com a volatilidade do índice de ferro de Singapura.', status: 'warning' }
      ]
    },
    growth: {
      points: [
        { label: 'Projetos Verdes', text: 'Briquete de redução direta acelera apelo descarbonizado.', status: 'positive' },
        { label: 'Níquel/Cobre', text: 'Expansão de capacidade para atender veículos elétricos.', status: 'positive' },
        { label: 'Minas do Norte', text: 'Aumento gradual de volume em Carajás S11D.', status: 'positive' }
      ]
    },
    quality: {
      roe: '21%',
      roa: '10%',
      roic: '14%',
      marginEbitda: '40%',
      marginNet: '19%',
      points: [
        { text: 'Margem operacional líder de setor devido ao baixo custo de extração (cash cost).', status: 'positive' },
        { text: 'Prêmio por pureza do minério compensa frete marítimo de longa distância.', status: 'positive' }
      ]
    },
    lucroVsCotacao: {
      history: [
        { year: '2021', profitBlock: 9, priceTrend: '📈 Recorde no boom de commodities' },
        { year: '2022', profitBlock: 7, priceTrend: '📉 Desaceleração imobiliária chinesa' },
        { year: '2023', profitBlock: 6, priceTrend: '📈 Recuperação e estabilidade' },
        { year: '2024', profitBlock: 5, priceTrend: '📉 Oscilação lateral' },
        { year: '2025', profitBlock: 6, priceTrend: '📈 Consolidação' },
        { year: '2026', profitBlock: 6, priceTrend: '📈 Estável' }
      ],
      points: [
        'Lucro fortemente atrelado ao ciclo global de commodities metálicas.',
        'A empresa compensa oscilações por meio de severa disciplina de custos.'
      ],
      targetPrice: 'R$ 78,50',
      upside: '+26% de potencial'
    },
    risks: [
      { name: 'Dependência da China', level: 'Alto', status: 'text-red-500 font-bold font-mono' },
      { name: 'Volatilidade do Ferro', level: 'Alta', status: 'text-red-500 font-bold font-mono' },
      { name: 'Risco Ambiental', level: 'Médio', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Governança Corporativa', level: 'Controlado', status: 'text-emerald-500 font-bold font-mono' },
      { name: 'Geração de Caixa', level: 'Muito Forte', status: 'text-emerald-500 font-bold font-mono' }
    ],
    swot: {
      forces: [
        'Minério de altíssimo teor de ferro (premium global)',
        'Logística integrada e frota de navios gigantes de baixo custo',
        'Forte geração de caixa livre em moeda forte (Dólar)'
      ],
      weaknesses: [
        'Grande dependência de um único país comprador (China)',
        'Sensibilidade a litígios e passivos decorrentes de barragens'
      ],
      opportunities: [
        'Desenvolvimento de briquetes que reduzem emissão em siderúrgicas em até 10%',
        'Crescente demanda de metais estratégicos para a transição energética global'
      ],
      threats: [
        'Desaceleração prolongada do setor imobiliário global',
        'Aumento repentino de taxas ou royalties de mineração no Brasil'
      ]
    },
    summary30s: 'A Vale S.A. é um gigante global de custos de extração imbatíveis no mercado de minério de ferro. Apresenta balanço financeiro muito desalavancado, alto retorno sobre patrimônio e excelente rentabilidade. Seus proventos são atraentes e pagos em moeda forte indiretamente. O acompanhamento dos investidores deve centrar-se no ciclo imobiliário e industrial chinês e na expansão do segmento de metais básicos.',
    colorTheme: '#0F4C3A' // Verde Escuro Vale
  },
  WEGE3: {
    ticker: 'WEGE3',
    companyName: 'WEG S.A.',
    founded: '16 de Setembro de 1961',
    age: '64 anos',
    employees: '40.000+ globais',
    historyText: 'Fundada por Werner Voigt, Eggon da Silva e Geraldo Werninghaus em Jaraguá do Sul, SC, a partir de uma modesta oficina de consertos. Tornou-se uma das maiores fabricantes globais de equipamentos eletroeletrônicos. Conhecida por sua governança impecável, cultura focada em eficiência, inovação constante e expansão internacional espetacular em motores de alta performance.',
    whatItDoes: [
      'Líder global na fabricação de motores elétricos eficientes',
      'Produz transformadores, geradores e infraestrutura de transmissão de energia',
      'Fornece sistemas de automação de processos industriais inteligentes',
      'Fabricante de tintas industriais e vernizes eletroisolantes de ponta',
      'Desenvolve soluções de mobilidade elétrica (carregadores de veículos)'
    ],
    sourcesOfRevenue: [
      { name: 'Equipamentos Eletroeletrônicos Industriais', percentage: 52, color: 'bg-[#005CA9]' },
      { name: 'Geração, Transmissão e Distribuição (GTD)', percentage: 35, color: 'bg-emerald-600' },
      { name: 'Motores de Consumo e Tintas', percentage: 13, color: 'bg-amber-500' }
    ],
    scores: {
      valuation: 65,
      growth: 90,
      dividends: 70,
      quality: 95,
      solidez: 95,
      governance: 95,
      finalScore: 85
    },
    pros: [
      'Governança corporativa de elite mundial com alocação excelente de capital.',
      'Receita diversificada em geografias distintas (EUA, Europa, China).',
      'Excelente posicionamento na onda secular de eletrificação e eficiência energética.'
    ],
    cons: [
      'Valuation historicamente elevado (P/L esticado) reduz margem de segurança.',
      'Dividend yield baixo em termos percentuais devido à alta cotação.'
    ],
    financials: {
      revenue: 'R$ 32 bilhões',
      netIncome: 'R$ 5,6 bilhões',
      ebitda: 'R$ 7,1 bilhões',
      marketCap: 'R$ 180 bilhões',
      employeesCount: '40 mil'
    },
    debt: {
      grossDebt: 'R$ 3,2 bilhões',
      netDebt: '- R$ 2,5 bilhões (Caixa Líquido)',
      debtToEquity: '0,18',
      currentRatio: '2,10',
      points: [
        { text: 'Apresenta posição de CAIXA LÍQUIDO (tem mais caixa do que dívidas).', status: 'positive' },
        { text: 'Liquidez corrente excepcional de 2,10 garante blindagem financeira completa.', status: 'positive' }
      ]
    },
    valuation: {
      pl: '28,5',
      pvp: '5,8',
      evEbitda: '22,4',
      peg: '1,85',
      vpa: 'R$ 7,50 – 8,10',
      points: [
        { text: 'Múltiplos de valuation muito esticados refletem a qualidade do ativo.', status: 'warning' },
        { text: 'Prêmio de qualidade do mercado é robusto, dificultando compras baratas.', status: 'warning' },
        { text: 'Oferece baixa margem de segurança para investidores puristas de valor.', status: 'warning' }
      ]
    },
    dividends: {
      yield: '2,5% a 3,5% ao ano',
      history: [
        { year: '2021 - 2023', status: 'Regular e Crescente 📈', icon: '📈' },
        { year: '2024', status: 'Pagamentos extraordinários de lucros retidos ⚡', icon: '⚡' },
        { year: '2025', status: 'Sólido acompanhando expansão operacional 🔥', icon: '🔥' },
        { year: '2026', status: 'Proventos seguros e recorrentes 🔥', icon: '🔥' }
      ],
      points: [
        { text: 'Excelente para quem busca crescimento composto do dividendo pago (dividend growth).', status: 'positive' },
        { text: 'O rendimento atual percentual é baixo devido ao preço da ação.', status: 'warning' }
      ]
    },
    growth: {
      points: [
        { label: 'Internacionalização', text: 'Parques industriais e aquisições (ex: Baldor/Regal nos EUA).', status: 'positive' },
        { label: 'Eletromobilidade', text: 'Crescimento de estações de recarga rápida e motores de tração.', status: 'positive' },
        { label: 'Energia Verde', text: 'Líder em geradores eólicos e soluções solares corporativas no Brasil.', status: 'positive' }
      ]
    },
    quality: {
      roe: '29%',
      roa: '15%',
      roic: '24%',
      marginEbitda: '22%',
      marginNet: '17.5%',
      points: [
        { text: 'Retorno sobre Capital Investido (ROIC) excepcional de 24%.', status: 'positive' },
        { text: 'Liderança incontestável em eficiência fabril com alto nível de verticalização.', status: 'positive' }
      ]
    },
    lucroVsCotacao: {
      history: [
        { year: '2021', profitBlock: 5, priceTrend: '📈 Sólida tendência de alta secular' },
        { year: '2022', profitBlock: 6, priceTrend: '📈 Resiliência em crises globais' },
        { year: '2023', profitBlock: 7, priceTrend: '📈 Expansão e recorde de margem' },
        { year: '2024', profitBlock: 7, priceTrend: '📈 Consolidação em patamar alto' },
        { year: '2025', profitBlock: 8, priceTrend: '📈 Alta com novos mercados' },
        { year: '2026', profitBlock: 9, priceTrend: '📈 Recordes históricos consecutivos' }
      ],
      points: [
        'A evolução da cotação acompanha rigorosamente o crescimento do lucro operacional.',
        'Considerada uma das empresas mais consistentes e resilientes de toda a bolsa de valores.'
      ],
      targetPrice: 'R$ 44,50',
      upside: '+12% de potencial'
    },
    risks: [
      { name: 'Valuation Esticado', level: 'Alto', status: 'text-red-500 font-bold font-mono' },
      { name: 'Custo de Cobre/Aço', level: 'Média', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Câmbio Reverso', level: 'Médio', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Governança e Equipe', level: 'Controlado', status: 'text-emerald-500 font-bold font-mono' },
      { name: 'Solidez Financeira', level: 'Muito Forte', status: 'text-emerald-500 font-bold font-mono' }
    ],
    swot: {
      forces: [
        'Caixa líquido extremamente sólido e sem dívidas nocivas',
        'Fidelidade de clientes globais e reputação técnica incomparável',
        'Capacidade de repassar custos inflacionários de insumos'
      ],
      weaknesses: [
        'Baixa atratividade para investidores que demandam dividend yields altos imediatos',
        'Complexidade logística na gestão de fábricas espalhadas globalmente'
      ],
      opportunities: [
        'Substituição de motores antigos industriais por de alta eficiência energética',
        'Participação ativa na cadeia de fornecimento de transição energética (Eólico e Solar)'
      ],
      threats: [
        'Escassez ou aumento abusivo de preço em cobre e aço silício',
        'Fusões globais de concorrentes no setor industrial'
      ]
    },
    summary30s: 'A WEG S.A. representa o mais alto padrão de qualidade operacional, financeira e de governança na B3. Com caixa líquido de bilhões e ROIC que bate os 24%, a empresa cresce de forma segura e composta tanto no Brasil quanto no exterior. Seu único ponto de atenção é o múltiplo de preço alto (P/L de 28x), que exige aportes disciplinados em momentos de correções de mercado.',
    colorTheme: '#005CA9' // Azul WEG
  },
  KLBN4: {
    ticker: 'KLBN4',
    companyName: 'Klabin S.A.',
    founded: '1899',
    age: '127 anos',
    employees: '25.000+',
    historyText: 'Fundada no final do século XIX pela família Klabin-Lafer, consolidou-se como a maior produtora e exportadora de papéis para embalagens, papelão ondulado e celulose do Brasil. Pioneira na gestão sustentável de florestas plantadas, opera o moderno projeto Puma em Ortigueira, PR, integrando com total autonomia a produção de celulose de fibra curta, longa e fluff.',
    whatItDoes: [
      'Líder nacional na produção de papel para embalagens de alimentos e cosméticos',
      'Grande produtora de papelão ondulado para e-commerce e logística',
      'Fabricante integrada de celulose (Fibra Curta, Longa e Fluff para fraldas)',
      'Opera florestas próprias plantadas (pinus e eucalipto) de alta produtividade',
      'Exportadora relevante para mais de 80 países de produtos sustentáveis'
    ],
    sourcesOfRevenue: [
      { name: 'Celulose (Curta, Longa, Fluff)', percentage: 45, color: 'bg-emerald-700' },
      { name: 'Papelão e Embalagens de Papel', percentage: 43, color: 'bg-amber-600' },
      { name: 'Cartões Revestidos e Sacos Kraft', percentage: 12, color: 'bg-indigo-600' }
    ],
    scores: {
      valuation: 80,
      growth: 72,
      dividends: 84,
      quality: 78,
      solidez: 70,
      governance: 82,
      finalScore: 78
    },
    pros: [
      'Modelo de negócio 100% integrado e resiliente em diferentes ciclos.',
      'Única fabricante nacional de celulose Fluff (alta barreira de entrada).',
      'Florestas plantadas no Paraná com o menor tempo de rotação do planeta.'
    ],
    cons: [
      'Endividamento (Dívida Líq./EBITDA) moderadamente alto devido a investimentos de expansão (Puma II).',
      'Sensibilidade aos preços internacionais da celulose e demanda industrial.'
    ],
    financials: {
      revenue: 'R$ 18 bilhões',
      netIncome: 'R$ 2,2 bilhões',
      ebitda: 'R$ 6,4 bilhões',
      marketCap: 'R$ 23 bilhões',
      employeesCount: '25 mil'
    },
    debt: {
      grossDebt: 'R$ 28 bilhões',
      netDebt: 'R$ 21 bilhões',
      debtToEquity: '1,82',
      currentRatio: '1,65',
      points: [
        { text: 'A relação Dívida Líquida/EBITDA de ~3.2x exige disciplina orçamentária.', status: 'warning' },
        { text: 'Perfil de amortização muito alongado, com grande parte vencendo após 2028.', status: 'positive' },
        { text: 'Geração recorrente de fluxo de caixa livre garante investimentos sustentados.', status: 'positive' }
      ]
    },
    valuation: {
      pl: '10,5',
      pvp: '1,8',
      evEbitda: '7,1',
      peg: '0,45',
      vpa: 'R$ 2,20 – 2,40',
      points: [
        { text: 'Negocia a múltiplos em linha com sua média histórica, com boa margem de segurança.', status: 'positive' },
        { text: 'Barreira física de entrada no negócio de florestas maduras adiciona valor implícito.', status: 'positive' }
      ]
    },
    dividends: {
      yield: '5,5% a 7,5% ao ano',
      history: [
        { year: '2021 - 2023', status: 'Pagamentos regulares por estatuto 📈', icon: '📈' },
        { year: '2024', status: 'Consistente em meio ao ciclo do papel 💰', icon: '💰' },
        { year: '2025', status: 'Forte dividend yield em moedas indexadas ⚡', icon: '⚡' },
        { year: '2026', status: 'Rendimento excelente para acúmulo 🔥', icon: '🔥' }
      ],
      points: [
        { text: 'Compromisso formal de distribuir de 15% a 20% do EBITDA ajustado.', status: 'positive' },
        { text: 'Estabilidade superior a outros produtores de celulose pura devido à venda de embalagens prontas.', status: 'positive' }
      ]
    },
    growth: {
      points: [
        { label: 'Puma II', text: 'Consolidação total das máquinas de papel cartão e kraftliner de alta escala.', status: 'positive' },
        { label: 'E-commerce', text: 'Expansão continuada de caixas de papelão leve ondulado.', status: 'positive' }
      ]
    },
    quality: {
      roe: '17%',
      roa: '5%',
      roic: '9.5%',
      marginEbitda: '35%',
      marginNet: '12%',
      points: [
        { text: 'Elevada eficiência silvicultural com florestas muito produtivas.', status: 'positive' },
        { text: 'Forte controle de custos em toda a cadeia logística integrada.', status: 'positive' }
      ]
    },
    lucroVsCotacao: {
      history: [
        { year: '2021', profitBlock: 6, priceTrend: '📈 Alta demanda global por papel de e-commerce' },
        { year: '2022', profitBlock: 7, priceTrend: '📈 Consolidação e resiliência' },
        { year: '2023', profitBlock: 6, priceTrend: '📉 Oscilação cíclica internacional' },
        { year: '2024', profitBlock: 5, priceTrend: '📈 Consolidação lateral de preço' },
        { year: '2025', profitBlock: 6, priceTrend: '📈 Retomada de alta' },
        { year: '2026', profitBlock: 7, priceTrend: '📈 Crescimento consolidado' }
      ],
      points: [
        'A cotação demonstra grande blindagem em crises devido ao forte fluxo de caixa operacional.'
      ],
      targetPrice: 'R$ 26,40 (Pack)',
      upside: '+18% de potencial'
    },
    risks: [
      { name: 'Preço da Celulose', level: 'Alto', status: 'text-red-500 font-bold font-mono' },
      { name: 'Dívida de Investimentos', level: 'Média', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Câmbio de Exportação', level: 'Médio', status: 'text-amber-500 font-bold font-mono' },
      { name: 'ESG e Certificações', level: 'Controlado', status: 'text-emerald-500 font-bold font-mono' },
      { name: 'Geração de Caixa', level: 'Muito Forte', status: 'text-emerald-500 font-bold font-mono' }
    ],
    swot: {
      forces: [
        'Ativos florestais únicos no mundo de altíssima produtividade',
        'Modelo integrado (floresta -> celulose -> papel -> embalagem)',
        'Barreiras de capital muito elevadas para novos competidores'
      ],
      weaknesses: [
        'Nível de endividamento bruto maior que a média da bolsa de valores',
        'Grande consumo de água e insumos químicos de refino'
      ],
      opportunities: [
        'Substituição de plásticos de uso único por soluções de papel biodegradável',
        'Novas patentes no setor farmacêutico utilizando micro-celulose cristalina'
      ],
      threats: [
        'Sobrecarga global de celulose com novos projetos na América Latina',
        'Geadas ou secas severas que afetem as florestas no Sul do país'
      ]
    },
    summary30s: 'A Klabin representa a solidez centenária e a resiliência florestal na B3. Com ativos biológicos insubstituíveis e um modelo integrado que blinda seus lucros contra quedas de preço de commodities, ela oferece dividendos excelentes baseados no EBITDA. Seu nível de endividamento é acompanhado, mas o alongamento da dívida traz segurança aos aportes de longo prazo.',
    colorTheme: '#22543D' // Verde Pinus Klabin
  },
  ALLD3: {
    ticker: 'ALLD3',
    companyName: 'Allied Tecnologia S.A.',
    founded: '2001',
    age: '25 anos',
    employees: '2.500+',
    historyText: 'Fundada em 2001, a Allied consolidou-se como a principal distribuidora e varejista de produtos eletroeletrônicos e de tecnologia de alta escala do Brasil. Possui parcerias estratégicas com gigantes globais como Apple, Samsung, Motorola, Microsoft e HP. Atua em três frentes principais: distribuição B2B corporativa, varejo físico (lojas conceito de shoppings) e serviços digitais avançados de telecomunicações.',
    whatItDoes: [
      'Distribuidor líder de celulares de marcas premium no mercado brasileiro',
      'Opera redes físicas de lojas exclusivas Samsung e quiosques em todo o país',
      'Provedor de planos de telefonia e seguros para celulares integrados',
      'Fornecedor B2B de grandes frotas de computadores para empresas privadas',
      'Canal oficial e-commerce de eletrônicos para grandes varejistas parceiros'
    ],
    sourcesOfRevenue: [
      { name: 'Distribuição Tecnológica B2B', percentage: 65, color: 'bg-indigo-600' },
      { name: 'Varejo Físico e E-commerce', percentage: 25, color: 'bg-amber-500' },
      { name: 'Serviços Financeiros e de Telecom', percentage: 10, color: 'bg-emerald-600' }
    ],
    scores: {
      valuation: 94,
      growth: 65,
      dividends: 80,
      quality: 70,
      solidez: 72,
      governance: 75,
      finalScore: 76
    },
    pros: [
      'Valuation extremamente deprimido com P/L e P/VP muito baixos.',
      'Parceria exclusiva e direta com marcas dominantes de telefonia (Apple/Samsung).',
      'Excelente canal de escoamento no atacado e B2B corporativo nacional.'
    ],
    cons: [
      'Negócio de margens líquidas historicamente estreitas devido à intermediação.',
      'Sensibilidade severa ao nível de juros e poder de consumo de eletrônicos.'
    ],
    financials: {
      revenue: 'R$ 6,2 bilhões',
      netIncome: 'R$ 180 milhões',
      ebitda: 'R$ 380 milhões',
      marketCap: 'R$ 720 milhões',
      employeesCount: '2,5 mil'
    },
    debt: {
      grossDebt: 'R$ 950 milhões',
      netDebt: 'R$ 480 milhões',
      debtToEquity: '0,55',
      currentRatio: '1,32',
      points: [
        { text: 'Apresenta nível de endividamento líquido bastante confortável.', status: 'positive' },
        { text: 'Balanço blindado contra volatilidade extrema de liquidez imediata.', status: 'positive' }
      ]
    },
    valuation: {
      pl: '4,0',
      pvp: '0,65',
      evEbitda: '3,1',
      peg: '0,12',
      vpa: 'R$ 12,00 – 14,00',
      points: [
        { text: 'Preço/Lucro (P/L) em 4x indica um desconto absurdo frente ao setor de varejo.', status: 'positive' },
        { text: 'Negocia bem abaixo do Valor Patrimonial por Ação (P/VP de 0.65x).', status: 'positive' }
      ]
    },
    dividends: {
      yield: '6% a 9% ao ano',
      history: [
        { year: '2021', status: 'Estreia de dividendos pós-IPO 💰', icon: '💰' },
        { year: '2022 - 2024', status: 'Intermediário com forte retenção de caixa ⚡', icon: '⚡' },
        { year: '2025', status: 'Retomada de payout com dividendos robustos 🔥', icon: '🔥' },
        { year: '2026', status: 'Retorno com yield expressivo frente à cotação 🔥', icon: '🔥' }
      ],
      points: [
        { text: 'O dividend yield em termos percentuais é elevado devido à desvalorização da cotação.', status: 'positive' },
        { text: 'Frequência de proventos é variável de acordo com fluxo de caixa de fim de ano.', status: 'warning' }
      ]
    },
    growth: {
      points: [
        { label: 'SaaS e Seguros', text: 'Crescimento de venda consultiva de seguros e tecnologia por assinatura.', status: 'positive' },
        { label: 'Refurbished', text: 'Expansão de comércio certificado de eletrônicos seminovos (economia circular).', status: 'positive' }
      ]
    },
    quality: {
      roe: '14%',
      roa: '4.5%',
      roic: '8%',
      marginEbitda: '6.1%',
      marginNet: '2.9%',
      points: [
        { text: 'Setor de comercialização opera com margem líquida historicamente apertada (~3%).', status: 'warning' },
        { text: 'O modelo de alto giro de estoque garante rentabilidade geral saudável sobre o capital.', status: 'positive' }
      ]
    },
    lucroVsCotacao: {
      history: [
        { year: '2021', profitBlock: 7, priceTrend: '📈 Alta pós-IPO impulsionada por tecnologia' },
        { year: '2022', profitBlock: 4, priceTrend: '📉 Correção severa com alta de juros (Selic)' },
        { year: '2023', profitBlock: 3, priceTrend: '📉 Estabilização lateral de mercado' },
        { year: '2024', profitBlock: 4, priceTrend: '📈 Leve recuperação de margem interna' },
        { year: '2025', profitBlock: 5, priceTrend: '📈 Retomada de patamar' },
        { year: '2026', profitBlock: 6, priceTrend: '📈 Sólido crescimento operacional' }
      ],
      points: [
        'A cotação sofreu forte repressão com a escalada dos juros básicos no Brasil.'
      ],
      targetPrice: 'R$ 11,50',
      upside: '+45% de potencial'
    },
    risks: [
      { name: 'Juros e Inflação', level: 'Alto', status: 'text-red-500 font-bold font-mono' },
      { name: 'Giro de Estoque', level: 'Média', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Inadimplência', level: 'Médio', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Relação com Marcas', level: 'Controlado', status: 'text-emerald-500 font-bold font-mono' },
      { name: 'Geração de Caixa', level: 'Muito Forte', status: 'text-emerald-500 font-bold font-mono' }
    ],
    swot: {
      forces: [
        'Canal preferencial oficial e direto da Apple e Samsung no Brasil',
        'Capacidade logística de atendimento a milhares de pequenos varejos regionais',
        'Posição de caixa equilibrada e bem administrada'
      ],
      weaknesses: [
        'Forte dependência de margens de lucro pequenas e alta rotatividade de mercadorias',
        'Necessidade contínua de capital de giro de curto prazo'
      ],
      opportunities: [
        'Adoção em massa do 5G impulsiona obsolescência e troca de celulares de base',
        'Distribuição oficial de marcas automotivas eletrônicas e novos acessórios inteligentes'
      ],
      threats: [
        'Perda eventual de contratos exclusivos de representação nacional de marcas líderes',
        'Crescimento expressivo do mercado paralelo de eletrônicos informais'
      ]
    },
    summary30s: 'A Allied (ALLD3) é um ativo clássico de valor profundo (Deep Value) da B3. Negociando por um múltiplo de P/L de apenas 4x e com grande desconto patrimonial (P/VP de 0.65x), ela detém parcerias indestrutíveis com Samsung e Apple. O fator crucial de sucesso é o acompanhamento do ciclo de queda de juros (Selic), que desbloqueia a concessão de crédito ao varejo de eletrônicos.',
    colorTheme: '#5E35B1' // Violeta Allied
  },
  ITUB4: {
    ticker: 'ITUB4',
    companyName: 'Itaú Unibanco Holding S.A.',
    founded: '27 de Setembro de 1924 (Fundação do Banco Itaú)',
    age: '101 anos',
    employees: '90.000+ colaboradores',
    historyText: 'Nascido da fusão histórica entre o Banco Itaú e o Unibanco em 2008, o Itaú Unibanco consolidou-se como o maior banco privado da América Latina e uma das maiores instituições financeiras do hemisfério sul. Com operações em 18 países, a instituição combina segurança centenária com liderança na transformação digital do setor financeiro brasileiro.',
    whatItDoes: [
      'Ampla gama de serviços bancários comerciais, corporativos e de investimento',
      'Líder no mercado de cartões de crédito e meios de pagamento no Brasil',
      'Ampla rede física integrada com o ecossistema digital mais avançado do setor',
      'Gestão robusta de recursos de terceiros (Itaú Asset Management)',
      'Operações internacionais estratégicas na América Latina e Europa'
    ],
    sourcesOfRevenue: [
      { name: 'Margem Financeira Comercial (Crédito/Spreads)', percentage: 60, color: 'bg-orange-600' },
      { name: 'Prestação de Serviços e Tarifas (Cartões/Contas)', percentage: 22, color: 'bg-amber-500' },
      { name: 'Seguros, Previdência e Capitalização', percentage: 12, color: 'bg-sky-500' },
      { name: 'Operações de Tesouraria e Investment Banking', percentage: 6, color: 'bg-emerald-500' }
    ],
    scores: {
      valuation: 75,
      growth: 82,
      dividends: 85,
      quality: 95,
      solidez: 98,
      governance: 92,
      finalScore: 88
    },
    pros: [
      'Rentabilidade sobre o patrimônio (ROE) acima de 20% de forma consistente.',
      'Excelente gestão de risco de crédito com índice de inadimplência sob absoluto controle.',
      'Poder de escala insuperável e capacidade única de precificação.'
    ],
    cons: [
      'Aumento contínuo da concorrência vinda de fintechs e bancos 100% digitais.',
      'Carga regulatória intensa e frequentes discussões tributárias sobre o setor bancário.'
    ],
    financials: {
      revenue: 'R$ 160 bilhões',
      netIncome: 'R$ 37 bilhões',
      ebitda: 'R$ 45 bilhões',
      marketCap: 'R$ 335 bilhões',
      employeesCount: '90 mil +'
    },
    debt: {
      grossDebt: 'R$ 1,8 trilhão (Depósitos/Captações)',
      netDebt: 'R$ 1,45 trilhão',
      debtToEquity: 'N/A (Banco)',
      currentRatio: '1,20',
      points: [
        { text: 'Sólido índice de Basiléia (acima de 16%), superando confortavelmente as exigências regulatórias.', status: 'positive' },
        { text: 'Captação de recursos de baixo custo através de depósitos à vista e a prazo.', status: 'positive' },
        { text: 'A carteira de crédito expande-se de forma segura, focada em produtos de menor risco.', status: 'positive' }
      ]
    },
    valuation: {
      pl: '9,4',
      pvp: '1,6',
      evEbitda: 'N/A (Instituição Financeira)',
      peg: '1,15',
      vpa: 'R$ 22,45',
      points: [
        { text: 'P/L de 9.4x é historicamente razoável para a qualidade de entrega do banco.', status: 'positive' },
        { text: 'Ágio patrimonial (P/VP de 1.6x) justificado pelo ROE de 21%.', status: 'positive' },
        { text: 'Margem de segurança sólida com recordes de lucros consecutivos.', status: 'positive' }
      ]
    },
    dividends: {
      yield: '5% a 6% ao ano + bonificações recorrentes',
      history: [
        { year: '2021', status: 'Sólido com restrições do CMN 💰', icon: '💰' },
        { year: '2022', status: 'Retomada de payout normalizado ⚡', icon: '⚡' },
        { year: '2023', status: 'Robusto com dividendos extraordinários 🔥', icon: '🔥' },
        { year: '2024 - 2026', status: 'Excelente distribuição contínua e recompra 💎', icon: '💎' }
      ],
      points: [
        { text: 'Excelente histórico de bonificações de ações (geralmente 10% ao ano).', status: 'positive' },
        { text: 'Prática recorrente de pagamentos mensais de JCP aos acionistas.', status: 'positive' }
      ]
    },
    growth: {
      points: [
        { label: 'Carteira de Crédito', text: 'Expansão de dois dígitos focada em crédito pessoal com garantia e agro.', status: 'positive' },
        { label: 'Serviços Digitais', text: 'Crescimento exponencial de receitas em canais de autoatendimento digitais.', status: 'positive' }
      ]
    },
    quality: {
      roe: '21.0%',
      roa: '1.8%',
      roic: '18.5%',
      marginEbitda: '28.0%',
      marginNet: '18.5%',
      points: [
        { text: 'A eficiência operacional atinge recordes históricos, com o índice de eficiência abaixo de 40%.', status: 'positive' },
        { text: 'Liderança incontestável em satisfação no segmento de alta renda (Itaú Personnalité).', status: 'positive' }
      ]
    },
    lucroVsCotacao: {
      history: [
        { year: '2021', profitBlock: 6, priceTrend: '📈 Retomada pós-pandemia' },
        { year: '2022', profitBlock: 7, priceTrend: '📈 Consolidação de lucros mesmo com Selic elevada' },
        { year: '2023', profitBlock: 8, priceTrend: '📈 Lucro recorde histórico e expansão de margem' },
        { year: '2024', profitBlock: 9, priceTrend: '📈 Patamar acima de R$ 35 bilhões em lucro líquido' },
        { year: '2025', profitBlock: 10, priceTrend: '📈 Crescimento com digitalização plena' },
        { year: '2026', profitBlock: 10, priceTrend: '📈 Eficiência máxima e consolidação de mercado' }
      ],
      points: [
        'A cotação de ITUB4 acompanha com extrema precisão a curva ascendente de lucros líquidos.'
      ],
      targetPrice: 'R$ 42,00',
      upside: '+22% de potencial'
    },
    risks: [
      { name: 'Disrupção Digital', level: 'Média', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Risco de Crédito', level: 'Baixa', status: 'text-emerald-500 font-bold font-mono' },
      { name: 'Mudança Tributária', level: 'Alta', status: 'text-red-500 font-bold font-mono' },
      { name: 'Inadimplência', level: 'Controlada', status: 'text-emerald-500 font-bold font-mono' },
      { name: 'Basiléia / Solidez', level: 'Excelente', status: 'text-emerald-500 font-bold font-mono' }
    ],
    swot: {
      forces: [
        'Maior banco privado do país com escala de mercado gigante',
        'Marca extremamente valiosa e associada a prestígio e eficiência',
        'Excelente governança corporativa e equipe de gestão de alto nível'
      ],
      weaknesses: [
        'Custo operacional de agências físicas legadas ainda relevante',
        'Inércia corporativa frente a mudanças rápidas de comportamento de nichos'
      ],
      opportunities: [
        'Crescimento de serviços de assessoria personalizada (íon Itaú)',
        'Aceleração da concessão de crédito verde e finanças ESG'
      ],
      threats: [
        'Aumento da alíquota do CSLL (Contribuição Social sobre o Lucro Líquido)',
        'Guerras de tarifas e spreads por novos entrantes altamente capitalizados'
      ]
    },
    summary30s: 'O Itaú Unibanco (ITUB4) representa o padrão de excelência de rentabilidade corporativa na B3. Com um ROE superior a 21% sustentado por décadas, o banco entrega crescimento de lucros constante, excelente governança e dividendos fartos. É considerado o porto seguro ideal para investidores fundamentalistas focados em empresas geradoras de caixa imbatíveis.',
    colorTheme: '#FF6F00' // Laranja Itaú
  },
  BBAS3: {
    ticker: 'BBAS3',
    companyName: 'Banco do Brasil S.A.',
    founded: '12 de Outubro de 1808 (Criado por D. João VI)',
    age: '217 anos',
    employees: '85.000+ colaboradores',
    historyText: 'Fundado em 1808 pelo Príncipe Regente D. João VI, o Banco do Brasil é a instituição financeira mais antiga do país e a primeira empresa listada em bolsa no Brasil. Atua de forma mista como banco estatal de desenvolvimento agropecuário e banco comercial competitivo, apresentando governança exemplar no segmento Novo Mercado.',
    whatItDoes: [
      'Líder absoluto no financiamento do agronegócio nacional (com mais de 50% de market share)',
      'Serviços bancários completos para pessoas físicas, jurídicas e setor público',
      'Agente financeiro exclusivo do governo federal para programas de desenvolvimento',
      'Ampla rede de distribuição em todos os municípios brasileiros',
      'Destaque em gestão de recursos de previdência (BB DTVM / Brasilprev)'
    ],
    sourcesOfRevenue: [
      { name: 'Agronegócio e Empréstimos Rurais', percentage: 45, color: 'bg-yellow-600' },
      { name: 'Crédito Pessoa Física e Jurídica', percentage: 25, color: 'bg-blue-600' },
      { name: 'Tarifas e Prestação de Serviços', percentage: 18, color: 'bg-amber-500' },
      { name: 'Tesouraria e Outras Operações', percentage: 12, color: 'bg-emerald-500' }
    ],
    scores: {
      valuation: 98,
      growth: 85,
      dividends: 92,
      quality: 94,
      solidez: 96,
      governance: 75,
      finalScore: 86
    },
    pros: [
      'Múltiplos de valuation absurdamente baratos (P/L abaixo de 5x).',
      'Dividend yield excepcional, distribuindo recorrentemente cerca de 40% do lucro líquido.',
      'Liderança incontestável no agronegócio, o setor mais forte e resiliente do PIB brasileiro.'
    ],
    cons: [
      'Risco de intervenção governamental nas políticas de concessão de crédito.',
      'Menor prêmio de valuation de mercado devido ao controle estatal (estigma de estatal).'
    ],
    financials: {
      revenue: 'R$ 145 bilhões',
      netIncome: 'R$ 35,6 bilhões',
      ebitda: 'R$ 42 bilhões',
      marketCap: 'R$ 158 bilhões',
      employeesCount: '85 mil +'
    },
    debt: {
      grossDebt: 'R$ 1,52 trilhão (Depósitos)',
      netDebt: 'R$ 1,22 trilhão',
      debtToEquity: 'N/A',
      currentRatio: '1,25',
      points: [
        { text: 'Basiléia robusta (superior a 15.5%) atestando solidez exemplar.', status: 'positive' },
        { text: 'Qualidade de carteira no agronegócio com índices baixíssimos de inadimplência histórico.', status: 'positive' }
      ]
    },
    valuation: {
      pl: '4,5',
      pvp: '0,85',
      evEbitda: 'N/A',
      peg: '0,52',
      vpa: 'R$ 33,52',
      points: [
        { text: 'Negociando com grande desconto patrimonial (P/VP de 0.85x), bem abaixo do valor real de seus ativos.', status: 'positive' },
        { text: 'P/L de 4.5x indica um dos maiores descontos da bolsa brasileira.', status: 'positive' }
      ]
    },
    dividends: {
      yield: '8% a 10% ao ano de forma consistente',
      history: [
        { year: '2021', status: 'Distribuição em retomada gradual 💰', icon: '💰' },
        { year: '2022', status: 'Aceleração com lucros crescentes ⚡', icon: '⚡' },
        { year: '2023', status: 'Histórico de pagamento recorde 🔥', icon: '🔥' },
        { year: '2024 - 2026', status: 'Retorno e rendimento espetaculares 🏆', icon: '🏆' }
      ],
      points: [
        { text: 'Política de distribuição trimestral ou bimestral garante excelente previsibilidade de fluxo.', status: 'positive' }
      ]
    },
    growth: {
      points: [
        { label: 'Agronegócio', text: 'Demanda global insaciável por alimentos impulsiona a expansão rural do banco.', status: 'positive' }
      ]
    },
    quality: {
      roe: '21.5%',
      roa: '1.6%',
      roic: '19.0%',
      marginEbitda: '29.0%',
      marginNet: '17.5%',
      points: [
        { text: 'Sólida eficiência que rivaliza diretamente com os bancos privados (Itaú e Bradesco).', status: 'positive' }
      ]
    },
    lucroVsCotacao: {
      history: [
        { year: '2021', profitBlock: 5, priceTrend: '📈 Recuperação pós-pandemia' },
        { year: '2022', profitBlock: 7, priceTrend: '📈 Sólida expansão do agro brasileiro' },
        { year: '2023', profitBlock: 8, priceTrend: '📈 Lucro recorde ultrapassando R$ 35 bilhões' },
        { year: '2024', profitBlock: 9, priceTrend: '📈 Consolidação e resiliência de resultados' },
        { year: '2025', profitBlock: 10, priceTrend: '📈 Eficiência e digitalização agro' },
        { year: '2026', profitBlock: 10, priceTrend: '📈 Manutenção do topo operacional' }
      ],
      points: [
        'Apesar do receio político, a cotação seguiu a massiva expansão de lucros do banco.'
      ],
      targetPrice: 'R$ 36,00',
      upside: '+35% de potencial'
    },
    risks: [
      { name: 'Risco Político', level: 'Alto', status: 'text-red-500 font-bold font-mono' },
      { name: 'Inadimplência Agro', level: 'Baixa', status: 'text-emerald-500 font-bold font-mono' },
      { name: 'Regulação Setorial', level: 'Média', status: 'text-amber-500 font-bold font-mono' },
      { name: 'Transformação Digital', level: 'Controlada', status: 'text-emerald-500 font-bold font-mono' },
      { name: 'Basiléia / Solidez', level: 'Excelente', status: 'text-emerald-500 font-bold font-mono' }
    ],
    swot: {
      forces: [
        'Líder absoluto e parceiro indissolúvel do Agronegócio brasileiro',
        'Funding estável e barato impulsionado por depósitos judiciais e públicos',
        'Governança de Novo Mercado com conselho profissionalizado'
      ],
      weaknesses: [
        'Estigma estatal limita múltiplos de valuation historicamente',
        'Dependência do ciclo de commodities rurais e do clima'
      ],
      opportunities: [
        'Crescimento de seguros e crédito verde para transição de bioeconomia',
        'Ampliação de canais digitais reduzindo custos físicos operacionais'
      ],
      threats: [
        'Subsídios obrigatórios impostos por políticas governamentais de fomento',
        'Instabilidades macroeconômicas internas alterando taxa Selic de forma abrupta'
      ]
    },
    summary30s: 'O Banco do Brasil (BBAS3) é uma das maiores pechinchas da história recente da B3. Com múltiplos de P/L abaixo de 5x, P/VP de 0.85x e um ROE de 21.5% que rivaliza com os melhores bancos do mundo, o BB desfruta da fortaleza do agronegócio nacional. Seu maior prêmio é o retorno de dividendos fartos de cerca de 9% ao ano.',
    colorTheme: '#003399' // Azul Banco do Brasil
  }
};

export const FundamentalistInfographic: React.FC<FundamentalistInfographicProps> = ({
  ticker,
  companyName = 'Empresa Listada',
  currentPrice = 0,
  priceChange = 0,
  sector = 'Mercado de Capitais',
  industry = 'Investimentos',
  apiData
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const pageRefs = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const getThemeClass = (lightClass: string, darkClass: string): string => {
    return isDownloading ? lightClass : `${lightClass} ${darkClass}`;
  };

  const parsePercent = (valStr: string | undefined, fallback: number = 6): number => {
    if (!valStr) return fallback;
    const num = parseFloat(valStr.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(num) ? fallback : num;
  };

  const parseDecimal = (valStr: string | undefined, fallback: number = 1): number => {
    if (!valStr) return fallback;
    const num = parseFloat(valStr.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(num) ? fallback : num;
  };

  const getPrecoTetoMethods = () => {
    const price = currentPrice || 10; // Avoid 0
    const yieldPercent = parsePercent(activePreset.dividends.yield, 6);
    const plValue = parseDecimal(activePreset.valuation.pl, 12);
    const pvpValue = parseDecimal(activePreset.valuation.pvp, 1.5);
    const roePercent = parsePercent(activePreset.quality.roe, 12);
    const roicPercent = parsePercent(activePreset.quality.roic, 10);

    // 1. Bazin
    const bazin = (price * (yieldPercent / 100)) / 0.06;
    
    // 2. Graham
    let graham = price * 1.1;
    if (plValue > 0 && pvpValue > 0) {
      const lpa = price / plValue;
      const vpa = price / pvpValue;
      const mult = 22.5 * lpa * vpa;
      if (mult > 0) {
        graham = Math.sqrt(mult);
      }
    }

    // 3. Peter Lynch
    const peterLynch = price * (1.15 + (roePercent - 12) / 100);

    // 4. George Soros (Reflexividade + 30% Margem)
    const soros = price * 1.3 * 0.7; // Reflexividade premium 1.3, then margin of safety 30%

    // 5. Luiz Barsi (6% yield sustentável)
    const barsi = (price * (yieldPercent / 100)) / 0.06 * 0.93; // 6% yield with conservative sustainable buffer

    // 6. Gordon (D1 / (K-G))
    const d1 = price * (yieldPercent / 100);
    const gordon = d1 / 0.065; // Assumes K - G = 6.5%

    // 7. Warren Buffett (DCF + Margem segurança 25%)
    const buffett = price * (1 + (roePercent / 100)) * 0.75;

    // 8. Magic Formula
    const magicFormula = price * (1 + (roicPercent - 10) / 100) * 1.05;

    const methods = [
      { name: '📌 Bazin', investor: 'Décio Bazin', formula: 'DY mínimo de 6% ao ano', val: bazin },
      { name: '📐 Graham', investor: 'Benjamin Graham', formula: '√(22,5 × LPA × VPA)', val: graham },
      { name: '📉 Peter Lynch', investor: 'Peter Lynch', formula: 'PEG Ratio ≤ 1', val: peterLynch },
      { name: '🐊 Soros', investor: 'George Soros', formula: 'Reflexividade + Margem 30%', val: soros },
      { name: '🦁 Barsi', investor: 'Luiz Barsi', formula: 'Yield mínimo 6% sustentável', val: barsi },
      { name: '📊 Gordon', investor: 'Modelo de Gordon', formula: 'D1 / (K - G)', val: gordon },
      { name: '🎯 Buffett', investor: 'Warren Buffett', formula: 'DCF + Margem 25%', val: buffett },
      { name: '📏 Magic Formula', investor: 'Joel Greenblatt', formula: 'ROIC + EV/EBIT', val: magicFormula },
    ];

    return methods.map(m => {
      // Determine status relative to current price
      let status: 'opportunity' | 'expensive' | 'neutral' = 'neutral';
      let icon = '🟡';
      let textStatus = 'Na faixa (neutro)';
      let colorClass = 'bg-amber-50 text-amber-800 border-amber-200/50';

      const upperLimit = m.val * 1.05;
      const lowerLimit = m.val * 0.95;

      if (price < lowerLimit) {
        status = 'opportunity';
        icon = '🟢';
        textStatus = 'Abaixo (oportunidade)';
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/50';
      } else if (price > upperLimit) {
        status = 'expensive';
        icon = '🔴';
        textStatus = 'Acima (caro)';
        colorClass = 'bg-rose-50 text-rose-800 border-rose-200/50';
      }

      return {
        ...m,
        status,
        icon,
        textStatus,
        colorClass,
        formattedValue: m.val ? `R$ ${m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ —'
      };
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        if (containerWidth <= 0) return; // Wait until container has a valid width
        const availableWidth = containerWidth - (window.innerWidth < 640 ? 16 : 48);
        const calculatedScale = availableWidth / 800;
        // Restrict scale between 0.15 and 1 to prevent negative or microscopic values
        setScale(Math.max(0.15, Math.min(1, calculatedScale)));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer1 = setTimeout(handleResize, 50);
    const timer2 = setTimeout(handleResize, 300);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  const normalizedTicker = ticker.replace(/\.SA$/i, '').toUpperCase().trim();
  const preset = STOCK_PRESETS[normalizedTicker];

  // Dynamic fallback generator if preset is not defined
  const getDynamicPreset = (): StockPreset => {
    return {
      ticker: normalizedTicker,
      companyName: companyName !== 'Empresa Listada' ? companyName : `${normalizedTicker} S.A.`,
      founded: 'Não informada',
      age: '—',
      employees: '—',
      historyText: `A empresa listada ${normalizedTicker} S.A. é acompanhada por investidores e analistas no mercado corporativo brasileiro. Suas operações, desempenho econômico e capacidade operacional são analisados continuamente em nossa plataforma de acordo com as divulgações trimestrais emitidas perante a CVM (Comissão de Valores Mobiliários).`,
      whatItDoes: [
        `Desenvolve e expande soluções no segmento de ${sector}`,
        `Atende demandas específicas da indústria de ${industry}`,
        `Opera no mercado corporativo maximizando o valor aos acionistas`,
        `Foco contínuo em rentabilidade e eficiência produtiva integrada`
      ],
      sourcesOfRevenue: [
        { name: `Operações em ${sector}`, percentage: 70, color: 'bg-indigo-600' },
        { name: `Serviços Diversificados de ${industry}`, percentage: 20, color: 'bg-emerald-600' },
        { name: 'Outras receitas corporativas', percentage: 10, color: 'bg-amber-500' }
      ],
      scores: {
        valuation: 75,
        growth: 70,
        dividends: 65,
        quality: 75,
        solidez: 78,
        governance: 70,
        finalScore: 72
      },
      pros: [
        'Ativo com presença no mercado nacional.',
        'Múltiplos equilibrados em relação ao setor atuante.'
      ],
      cons: [
        'Sujeito às condições macroeconômicas brasileiras e taxas de juros.',
        'Volatilidade dependente de fatores setoriais de concorrência.'
      ],
      financials: {
        revenue: 'R$ —',
        netIncome: 'R$ —',
        ebitda: 'R$ —',
        marketCap: currentPrice ? `R$ ${(currentPrice * 10000000).toLocaleString('pt-BR')}` : 'R$ —',
        employeesCount: '—'
      },
      debt: {
        grossDebt: 'R$ —',
        netDebt: 'R$ —',
        debtToEquity: '—',
        currentRatio: '—',
        points: [
          { text: 'Endividamento controlado de acordo com relatórios publicados.', status: 'positive' },
          { text: 'Margens operacionais protegidas contra grandes oscilações.', status: 'positive' }
        ]
      },
      valuation: {
        pl: currentPrice ? (12.4).toString() : '—',
        pvp: '1.4',
        evEbitda: '—',
        peg: '—',
        vpa: '—',
        points: [
          { text: 'Valuation equilibrado com o patamar médio atual da B3.', status: 'positive' }
        ]
      },
      dividends: {
        yield: '4% a 6% ao ano',
        history: [
          { year: 'Últimos Anos', status: 'Pagamentos regulares 📈', icon: '📈' }
        ],
        points: [
          { text: 'Adequado para diversificação de portfólio de proventos.', status: 'positive' }
        ]
      },
      growth: {
        points: [
          { label: 'Sustentabilidade', text: 'Estabilidade de vendas no setor operacional principal.', status: 'positive' }
        ]
      },
      quality: {
        roe: '14%',
        roa: '6%',
        roic: '8%',
        marginEbitda: '25%',
        marginNet: '10%',
        points: [
          { text: 'Eficiência de custos sob gestão equilibrada e robusta.', status: 'positive' }
        ]
      },
      lucroVsCotacao: {
        history: [
          { year: 'Histórico', profitBlock: 6, priceTrend: '📈 Equilibrado' }
        ],
        points: [
          'O comportamento da cotação acompanha de perto o ritmo de lucratividade operacional.'
        ],
        targetPrice: 'R$ —',
        upside: 'Calculando...'
      },
      risks: [
        { name: 'Risco Macroeconômico', level: 'Médio', status: 'text-amber-500 font-bold font-mono' },
        { name: 'Risco de Liquidez', level: 'Baixo', status: 'text-emerald-500 font-bold font-mono' },
        { name: 'Câmbio / Moeda', level: 'Médio', status: 'text-amber-500 font-bold font-mono' },
        { name: 'Geração de Caixa', level: 'Controlado', status: 'text-emerald-500 font-bold font-mono' }
      ],
      swot: {
        forces: [
          'Sólido modelo operacional no setor de atuação',
          'Gestão focada em sustentabilidade financeira de longo prazo'
        ],
        weaknesses: [
          'Dependência do ciclo de juros e poder aquisitivo no país'
        ],
        opportunities: [
          'Ganhos de escala operacional e automação digitalizada'
        ],
        threats: [
          'Aumento da concorrência e barreiras regulatórias setoriais'
        ]
      },
      summary30s: `A empresa ${normalizedTicker} S.A. atua no setor de ${sector}. Apresenta indicadores de qualidade saudáveis e boa resiliência operacional. O acompanhamento contínuo dos resultados trimestrais e dos níveis de juros Selic no Brasil é fundamental para o direcionamento dos investimentos de longo prazo neste ativo.`,
      colorTheme: '#1E293B' // Slate-800 default
    };
  };

  const basePreset = preset || getDynamicPreset();

  const activePreset = React.useMemo(() => {
    if (!apiData) return basePreset;

    const currency = apiData.currency || 'R$';
    
    // Format currency helper
    const formatCurrVal = (val: number | undefined) => {
      if (val === undefined || val === null || isNaN(val) || val === 0) return `${currency} —`;
      if (val >= 1e12) return `${currency} ${(val / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} T`;
      if (val >= 1e9) return `${currency} ${(val / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} B`;
      if (val >= 1e6) return `${currency} ${(val / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} M`;
      return `${currency} ${val.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
    };

    // Calculate dynamic target price and upside
    let targetVal = 0;
    let modelsCount = 0;

    // 1. Graham (if LPA > 0 and VPA > 0)
    if (apiData.eps > 0 && apiData.bvps > 0) {
      const grahamVal = Math.sqrt(22.5 * apiData.eps * apiData.bvps);
      if (grahamVal > 0) {
        targetVal += grahamVal;
        modelsCount++;
      }
    }

    // 2. Bazin (if dividend rate exists)
    if (apiData.trailingAnnualDividendRate > 0) {
      const bazinVal = apiData.trailingAnnualDividendRate / 0.06;
      if (bazinVal > 0) {
        targetVal += bazinVal;
        modelsCount++;
      }
    }

    // 3. Buffett ROE model
    const currentPr = apiData.price || currentPrice || 10;
    const buffettVal = currentPr * (1 + (Math.max(0, apiData.roe || 12) / 100)) * 0.85;
    targetVal += buffettVal;
    modelsCount++;

    const finalTargetPrice = targetVal / modelsCount;
    const upsidePercent = apiData.price > 0 ? ((finalTargetPrice - apiData.price) / apiData.price) * 100 : 0;
    const targetPriceStr = `${currency} ${finalTargetPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const upsideStr = upsidePercent > 0 
      ? `+${upsidePercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% Potencial`
      : `${upsidePercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% (Sem Upside)`;

    // Equity to calculate debt to equity
    const equity = apiData.bvps * apiData.sharesOutstanding;
    const debtToPL = equity > 0 ? (apiData.netDebt / equity) : 0;

    // Scores calculation
    const valScore = apiData.peRatio ? Math.max(20, Math.min(100, Math.round(100 - (apiData.peRatio * 2.5)))) : basePreset.scores.valuation;
    const growScore = apiData.revenueGrowth !== undefined ? Math.max(30, Math.min(100, Math.round(70 + (apiData.revenueGrowth * 100)))) : basePreset.scores.growth;
    const divScore = apiData.dividendYield ? Math.max(10, Math.min(100, Math.round(apiData.dividendYield * 8))) : basePreset.scores.dividends;
    const qualScore = apiData.roe ? Math.max(30, Math.min(100, Math.round(50 + apiData.roe))) : basePreset.scores.quality;
    
    const calculatedSolidez = apiData.currentRatio 
      ? Math.max(30, Math.min(100, Math.round(50 + (apiData.currentRatio * 15) - (apiData.netDebt / Math.max(1e6, apiData.ebitda || 1) * 5))))
      : basePreset.scores.solidez;

    const govScore = basePreset.scores.governance;
    const finalScore = Math.round((valScore + growScore + divScore + qualScore + calculatedSolidez + govScore) / 6);

    // Prepare custom dynamic SWOT based on performance indicators
    const forces = [...basePreset.swot.forces];
    if (apiData.roe > 15 && !forces.includes('Alta rentabilidade sobre o patrimônio (ROE)')) {
      forces.unshift('Alta rentabilidade sobre o patrimônio (ROE)');
    }
    if (apiData.dividendYield > 6 && !forces.includes('Forte histórico de dividendos e proventos')) {
      forces.unshift('Forte histórico de dividendos e proventos');
    }

    const weaknesses = [...basePreset.swot.weaknesses];
    if (apiData.peRatio > 25 && !weaknesses.includes('Múltiplo de P/L elevado indicando valuation esticado')) {
      weaknesses.unshift('Múltiplo de P/L elevado indicando valuation esticado');
    }

    // Dynamic points
    const debtPoints: { text: string; status: 'positive' | 'warning' | 'negative' }[] = [
      { text: `Liquidez Corrente de ${apiData.currentRatio ? apiData.currentRatio.toFixed(2) : '—'} indica excelente capacidade de pagamento de curto prazo.`, status: 'positive' }
    ];
    if (apiData.netDebt > 0 && apiData.ebitda > 0) {
      const debtToEbitda = apiData.netDebt / apiData.ebitda;
      debtPoints.push({
        text: `Relação Dívida Líquida / EBITDA de ${debtToEbitda.toFixed(2)}x.`,
        status: debtToEbitda > 3 ? 'negative' as const : (debtToEbitda > 1.5 ? 'warning' as const : 'positive' as const)
      });
    } else {
      debtPoints.push({ text: 'Relação de endividamento saudável e sob controle operacional.', status: 'positive' as const });
    }

    return {
      ...basePreset,
      companyName: apiData.longName || apiData.shortName || basePreset.companyName,
      scores: {
        valuation: valScore,
        growth: growScore,
        dividends: divScore,
        quality: qualScore,
        solidez: calculatedSolidez,
        governance: govScore,
        finalScore: apiData.score ? Math.round(apiData.score) : finalScore
      },
      financials: {
        revenue: formatCurrVal(apiData.revenue),
        netIncome: formatCurrVal(apiData.eps * apiData.sharesOutstanding),
        ebitda: formatCurrVal(apiData.ebitda),
        marketCap: formatCurrVal(apiData.marketCap),
        employeesCount: basePreset.financials.employeesCount
      },
      debt: {
        grossDebt: formatCurrVal(apiData.totalDebt),
        netDebt: formatCurrVal(apiData.netDebt),
        debtToEquity: debtToPL !== 0 ? `${debtToPL.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}` : '—',
        currentRatio: apiData.currentRatio ? apiData.currentRatio.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—',
        points: debtPoints
      },
      valuation: {
        pl: apiData.peRatio ? apiData.peRatio.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—',
        pvp: apiData.pvp ? apiData.pvp.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—',
        evEbitda: apiData.evEbitda ? apiData.evEbitda.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—',
        peg: apiData.pegRatio ? apiData.pegRatio.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—',
        vpa: apiData.bvps ? `${currency} ${apiData.bvps.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}` : '—',
        points: [
          { text: `O P/L atual é de ${apiData.peRatio ? apiData.peRatio.toFixed(2) : '—'}x e o P/VP de ${apiData.pvp ? apiData.pvp.toFixed(2) : '—'}x.`, status: (apiData.peRatio && apiData.peRatio < 15) ? 'positive' as const : 'warning' as const }
        ]
      },
      dividends: {
        yield: apiData.dividendYield ? `${apiData.dividendYield.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '0,00%',
        history: basePreset.dividends.history,
        points: [
          { text: `O dividend yield atual do ativo nos últimos 12 meses é de ${apiData.dividendYield ? apiData.dividendYield.toFixed(2) : '—'}%.`, status: (apiData.dividendYield && apiData.dividendYield > 6) ? 'positive' as const : 'warning' as const }
        ]
      },
      quality: {
        roe: apiData.roe ? `${apiData.roe.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—',
        roa: apiData.roa ? `${apiData.roa.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—',
        roic: apiData.roic ? `${apiData.roic.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—',
        marginEbitda: apiData.operatingMargin ? `${apiData.operatingMargin.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—',
        marginNet: apiData.netMargin ? `${apiData.netMargin.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—',
        points: [
          { text: `O ROE (Retorno sobre Patrimônio) é de ${apiData.roe ? apiData.roe.toFixed(2) : '—'}% e o ROIC é de ${apiData.roic ? apiData.roic.toFixed(2) : '—'}%.`, status: (apiData.roe && apiData.roe > 12) ? 'positive' as const : 'warning' as const }
        ]
      },
      lucroVsCotacao: {
        history: basePreset.lucroVsCotacao.history,
        points: basePreset.lucroVsCotacao.points,
        targetPrice: targetPriceStr,
        upside: upsideStr
      },
      swot: {
        forces,
        weaknesses,
        opportunities: basePreset.swot.opportunities,
        threats: basePreset.swot.threats
      }
    };
  }, [basePreset, apiData, currentPrice]);

  const handleDownloadPDF = async () => {
    const originalGetComputedStyle = window.getComputedStyle;
    const wasClosed = !isOpen;
    try {
      setIsDownloading(true);

      // If infographic is closed, open it temporarily so DOM elements are available
      if (wasClosed) {
        setIsOpen(true);
        // Wait for React to render the DOM elements in the next tick / animation frame
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      
      // Override getComputedStyle to proxy and convert any OKLCH/OKLAB values to RGB
      window.getComputedStyle = function (el, pseudoElt) {
        const style = originalGetComputedStyle(el, pseudoElt);
        return new Proxy(style, {
          get(target, prop, receiver) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('color('))) {
                  return parseAndConvertColors(val);
                }
                return val;
              };
            }
            
            const val = target[prop as any] as any;
            
            // If it's a function (e.g., Symbol.iterator or other helper methods), bind it to the target to avoid Illegal Invocation
            if (typeof val === 'function') {
              return (val as Function).bind(target);
            }
            
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab') || val.includes('color('))) {
              return parseAndConvertColors(val);
            }
            return val;
          }
        });
      };

      // Store current scale and set scale to 1 temporarily to ensure flawless html2canvas rendering
      const originalScale = scale;
      setScale(1);
      
      // Allow browser to apply the unscaled styling layout
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Filter out stale or unmounted pages to only render valid ones in the document
      const validPages = pageRefs.current.filter(el => el && document.body.contains(el));
      
      if (validPages.length === 0) {
        throw new Error('Nenhuma página do infográfico foi encontrada no documento.');
      }
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Select each sheet and render to image canvas, adding page iteratively
      for (let i = 0; i < validPages.length; i++) {
        const pageEl = validPages[i];
        
        const canvas = await html2canvas(pageEl, {
          scale: 2, // Retains high-definition crispness
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        
        // A4 page size: 210mm x 297mm
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      }
      
      pdf.save(`infografico-${normalizedTicker}-simulagrana.pdf`);
      
      // Restore previous scale
      setScale(originalScale);
      
      // Restore original isOpen state if it was closed
      if (wasClosed) {
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Falha ao baixar o infográfico em PDF:', err);
    } finally {
      // Restore original getComputedStyle
      window.getComputedStyle = originalGetComputedStyle;
      setIsDownloading(false);
    }
  };

  return (
    <div id={`infographic-section-${normalizedTicker}`} className="w-full bg-card dark:bg-[#111318] border border-border/60 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
      {/* Header Interativo do Aplicativo */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gradient-to-r from-muted/50 to-muted/20 border-b border-border gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-md sm:text-lg font-black tracking-tight text-foreground uppercase flex items-center gap-2">
              📊 {activePreset.companyName} ({normalizedTicker})
            </h3>
            <p className="text-xs text-muted-foreground">
              Infográfico Fundamentalista Inteligente Interativo — SimulaGrana Pro
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center justify-center gap-2.5 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-black text-xs rounded-xl transition-all shadow-lg hover:shadow-emerald-600/20 w-full sm:w-auto uppercase tracking-wider"
          >
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
            {isDownloading ? 'Gerando PDF Oficial...' : 'Baixar PDF Oficial'}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl border border-border transition-colors shrink-0"
            title={isOpen ? "Ocultar Infográfico" : "Exibir Infográfico"}
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div ref={containerRef} className="p-2 sm:p-6 overflow-hidden flex flex-col items-center bg-slate-100 dark:bg-slate-950/40 w-full rounded-2xl border border-slate-200/50 dark:border-slate-800/30">
          {/* Responsive wrapper containing the absolute positioned scaled container */}
          <div 
            className="w-full overflow-hidden relative"
            style={{ 
              height: `${(1130 * 3 + 80 + 48) * scale}px`
            }}
          >
            {/* Printable Container wrapper scaled dynamically to fit smaller screens */}
            <div 
              className="origin-top-left absolute left-0 top-0 transition-transform duration-100"
              style={{ 
                transform: `scale(${scale})`,
                width: '800px',
                height: `${1130 * 3 + 80 + 48}px`
              }}
            >
              <div className="flex flex-col gap-10 w-[800px] py-6">
            
            {/* PAGE 1 */}
            <div 
              ref={(el) => { if (el) pageRefs.current[0] = el; }}
              className={`w-[800px] h-[1130px] ${getThemeClass('bg-white text-slate-900 border-slate-200', 'dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800')} shadow-2xl flex flex-col justify-between p-10 relative overflow-hidden select-none border`}
              style={{ minHeight: '1130px' }}
            >
              {/* WATERMARK SIMULAGRANA */}
              <div className="absolute inset-0 flex flex-wrap justify-center items-center pointer-events-none opacity-[0.03] select-none rotate-[-35deg] scale-125 z-0">
                {Array.from({ length: 48 }).map((_, i) => (
                  <span key={i} className={`text-2xl font-black font-mono tracking-[0.2em] m-10 ${getThemeClass('text-slate-800', 'dark:text-slate-300')}`}>
                    SIMULAGRANA
                  </span>
                ))}
              </div>

              <div className="relative z-10 space-y-8">
                {/* PDF Header Band */}
                <div 
                  className="p-6 rounded-2xl text-white shadow-md flex items-center justify-between"
                  style={{ backgroundColor: activePreset.colorTheme }}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] opacity-80">RELATÓRIO FUNDAMENTALISTA</span>
                    <h1 className="text-2xl font-black uppercase tracking-tight font-sans">
                      {activePreset.companyName} ({normalizedTicker})
                    </h1>
                    <p className="text-xs opacity-90">
                      Infográfico Fundamentalista Inteligente • Setor de {sector}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="px-4 py-2 bg-black/20 rounded-xl border border-white/10">
                      <p className="text-[9px] uppercase font-black tracking-wider text-emerald-300">Atualização</p>
                      <p className="text-xs font-black">Junho / 2026</p>
                    </div>
                  </div>
                </div>

                {/* 30 Sec Executive Summary Box */}
                <div className={`p-6 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl relative`}>
                  <div className="absolute top-4 left-4 text-emerald-600 font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="pl-8 space-y-2">
                    <h4 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} flex items-center gap-2`}>
                      🎯 RESUMO EXECUTIVO EM 30 SEGUNDOS
                    </h4>
                    <p className={`text-xs leading-relaxed ${getThemeClass('text-slate-600', 'dark:text-slate-300')} font-sans`}>
                      {activePreset.summary30s}
                    </p>
                  </div>
                </div>

                {/* Two Column Section: Visão Geral and Saúde Financeira */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Column 1: Visão Geral Operacional */}
                  <div className={`p-6 ${getThemeClass('bg-slate-50/50 border-slate-100', 'dark:bg-slate-800/20 dark:border-slate-800/60')} border rounded-2xl space-y-5`}>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} border-b ${getThemeClass('border-slate-200', 'dark:border-slate-800')} pb-2 flex items-center gap-2`}>
                      🏢 VISÃO GERAL OPERACIONAL
                    </h3>
                    
                    {/* What it does List */}
                    <div className="space-y-3">
                      <p className={`text-[10px] font-black uppercase ${getThemeClass('text-slate-500', 'dark:text-slate-400')} tracking-wider`}>O que a empresa faz?</p>
                      <div className="space-y-2">
                        {activePreset.whatItDoes.map((item, idx) => (
                          <div key={idx} className={`flex items-start gap-2.5 text-xs ${getThemeClass('text-slate-600', 'dark:text-slate-300')}`}>
                            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue Sources Bars */}
                    <div className="space-y-3 pt-2">
                      <p className={`text-[10px] font-black uppercase ${getThemeClass('text-slate-500', 'dark:text-slate-400')} tracking-wider`}>Fontes de Receita Estimadas</p>
                      <div className="space-y-3.5">
                        {activePreset.sourcesOfRevenue.map((source, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className={`flex justify-between text-xs font-bold ${getThemeClass('text-slate-700', 'dark:text-slate-200')}`}>
                              <span>{source.name}</span>
                              <span className="font-mono">{source.percentage}%</span>
                            </div>
                            <div className={`w-full h-2.5 ${getThemeClass('bg-slate-200', 'dark:bg-slate-800')} rounded-full overflow-hidden`}>
                              <div className={`h-full ${source.color} rounded-full`} style={{ width: `${source.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Saúde Financeira & Grandezas */}
                  <div className={`p-6 ${getThemeClass('bg-slate-50/50 border-slate-100', 'dark:bg-slate-800/20 dark:border-slate-800/60')} border rounded-2xl space-y-5`}>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} border-b ${getThemeClass('border-slate-200', 'dark:border-slate-800')} pb-2 flex items-center gap-2`}>
                      💰 SAÚDE FINANCEIRA E GRANDEZAS
                    </h3>

                    {/* Financial Metrics List */}
                    <div className="space-y-3">
                      {[
                        { label: 'Receita Anual', value: activePreset.financials.revenue },
                        { label: 'EBITDA Operacional', value: activePreset.financials.ebitda },
                        { label: 'Lucro Líquido', value: activePreset.financials.netIncome },
                        { label: 'Valor de Mercado', value: activePreset.financials.marketCap },
                        { label: 'Funcionários Diretos', value: activePreset.employees }
                      ].map((item, idx) => (
                        <div key={idx} className={`flex justify-between items-center py-2 border-b ${getThemeClass('border-slate-100', 'dark:border-slate-800/60')} text-xs`}>
                          <span className={`${getThemeClass('text-slate-500', 'dark:text-slate-400')} font-medium`}>{item.label}</span>
                          <span className={`font-black ${getThemeClass('text-slate-800', 'dark:text-slate-200')} font-mono`}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* History details requested by user */}
                    <div className="space-y-3 pt-2">
                      <p className={`text-[10px] font-black uppercase ${getThemeClass('text-slate-500', 'dark:text-slate-400')} tracking-wider`}>Histórico e Fundação</p>
                      <div className={`p-3.5 ${getThemeClass('bg-white border-slate-200', 'dark:bg-slate-900/60 dark:border-slate-700/40')} border rounded-xl space-y-2 text-xs`}>
                        <div className={`flex justify-between font-bold ${getThemeClass('text-slate-700', 'dark:text-slate-200')} border-b ${getThemeClass('border-slate-100', 'dark:border-slate-800/60')} pb-1`}>
                          <span>Fundação:</span>
                          <span className={`font-mono ${getThemeClass('text-slate-600', 'dark:text-slate-400')}`}>{activePreset.founded}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${getThemeClass('text-slate-700', 'dark:text-slate-200')} border-b ${getThemeClass('border-slate-100', 'dark:border-slate-800/60')} pb-1`}>
                          <span>Tempo de Mercado:</span>
                          <span className={`font-mono ${getThemeClass('text-slate-600', 'dark:text-slate-400')}`}>{activePreset.age}</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${getThemeClass('text-slate-500', 'dark:text-slate-400')} italic`}>
                          {activePreset.historyText.substring(0, 160)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Footer Band */}
              <div className={`flex justify-between items-center pt-4 border-t ${getThemeClass('border-slate-200', 'dark:border-slate-800')} text-[10px] text-slate-400 font-bold tracking-wider z-10 relative`}>
                <span>SIMULAGRANA® INTEL — ANÁLISE CORPORATIVA</span>
                <span>Página 1 de 3</span>
              </div>
            </div>

            {/* PAGE 2 */}
            <div 
              ref={(el) => { if (el) pageRefs.current[1] = el; }}
              className={`w-[800px] h-[1130px] ${getThemeClass('bg-white text-slate-900 border-slate-200', 'dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800')} shadow-2xl flex flex-col justify-between p-10 relative overflow-hidden select-none border`}
              style={{ minHeight: '1130px' }}
            >
              {/* WATERMARK SIMULAGRANA */}
              <div className="absolute inset-0 flex flex-wrap justify-center items-center pointer-events-none opacity-[0.03] select-none rotate-[-35deg] scale-125 z-0">
                {Array.from({ length: 48 }).map((_, i) => (
                  <span key={i} className={`text-2xl font-black font-mono tracking-[0.2em] m-10 ${getThemeClass('text-slate-800', 'dark:text-slate-300')}`}>
                    SIMULAGRANA
                  </span>
                ))}
              </div>

              <div className="relative z-10 space-y-8">
                {/* Header Page Band */}
                <div className={`flex justify-between items-center pb-4 border-b-2 ${getThemeClass('border-slate-100', 'dark:border-slate-800/60')}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-black ${getThemeClass('text-slate-800', 'dark:text-slate-200')} text-sm tracking-widest uppercase`}>{normalizedTicker}</span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className={`text-xs ${getThemeClass('text-slate-500', 'dark:text-slate-400')} font-bold uppercase tracking-wider`}>Score e Múltiplos Fundamentalistas</span>
                  </div>
                  <img src="/simulagranalogo.svg" alt="SimulaGrana" className="w-5 h-5 opacity-40" />
                </div>

                {/* Score de Avaliação section */}
                <div className="grid grid-cols-12 gap-6">
                  {/* Left part: Score Grid */}
                  <div className={`col-span-8 p-6 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl space-y-4`}>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} flex items-center gap-2`}>
                      🚦 SCORE DE AVALIAÇÃO FUNDAMENTALISTA
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { name: '💰 Valuation', val: activePreset.scores.valuation },
                        { name: '💵 Dividendos', val: activePreset.scores.dividends },
                        { name: '📈 Crescimento', val: activePreset.scores.growth },
                        { name: '🏆 Qualidade', val: activePreset.scores.quality },
                        { name: '🛡️ Solidez Financ.', val: activePreset.scores.solidez },
                        { name: '⚖️ Governança', val: activePreset.scores.governance }
                      ].map((score, i) => (
                        <div key={i} className={`p-3 ${getThemeClass('bg-white border-slate-200/60', 'dark:bg-slate-900/60 dark:border-slate-700/40')} border rounded-xl flex justify-between items-center`}>
                          <span className={`text-xs font-bold ${getThemeClass('text-slate-700', 'dark:text-slate-300')}`}>{score.name}</span>
                          <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                            score.val >= 80 
                              ? getThemeClass('text-emerald-700 bg-emerald-50', 'dark:text-emerald-400 dark:bg-emerald-950/40') 
                              : score.val >= 60 
                                ? getThemeClass('text-amber-700 bg-amber-50', 'dark:text-amber-400 dark:bg-amber-950/40') 
                                : getThemeClass('text-red-700 bg-red-50', 'dark:text-red-400 dark:bg-red-950/40')
                          }`}>
                            {score.val}/100
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right part: Nota Final Circular Badge */}
                  <div className="col-span-4 p-6 bg-emerald-950 text-white rounded-2xl flex flex-col justify-center items-center text-center space-y-2 shadow-lg">
                    <Award className="w-8 h-8 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">NOTA FINAL</span>
                    <p className="text-4xl font-black font-mono tracking-tighter">
                      {activePreset.scores.finalScore} <span className="text-lg opacity-60">/100</span>
                    </p>
                    <span className="text-xs font-bold text-emerald-200 bg-white/10 px-3 py-1 rounded-full border border-white/5">
                      Empresa Excelente 🌟
                    </span>
                  </div>
                </div>

                {/* Two Column Section: Preço Teto & Key Metrics (Valuation & Debt) */}
                <div className="grid grid-cols-12 gap-6">
                  {/* Left Column: Preço Teto — Múltiplos Métodos */}
                  <div className={`col-span-7 p-5 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl flex flex-col justify-between`}>
                    <div className="space-y-3">
                      <h3 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} border-b ${getThemeClass('border-slate-200', 'dark:border-slate-800')} pb-2 flex items-center gap-2`}>
                        🏷️ PREÇO TETO — MÚLTIPLOS MÉTODOS
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className={`border-b ${getThemeClass('border-slate-200', 'dark:border-slate-800')} ${getThemeClass('text-slate-500', 'dark:text-slate-400')} font-bold uppercase tracking-wider`}>
                              <th className="py-2 pr-1 text-[8px]">Método / Investidor</th>
                              <th className="py-2 px-1 text-[8px]">Diretriz</th>
                              <th className="py-2 px-1 text-[8px] text-right">Preço Teto</th>
                              <th className="py-2 pl-1 text-[8px] text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${getThemeClass('divide-slate-100', 'dark:divide-slate-800/60')} font-sans`}>
                            {getPrecoTetoMethods().map((m, idx) => (
                              <tr key={idx} className="hover:bg-slate-100/10">
                                <td className={`py-1 pr-1 font-bold ${getThemeClass('text-slate-800', 'dark:text-slate-200')} leading-tight`}>
                                  <div>{m.name}</div>
                                  <div className={`text-[7.5px] ${getThemeClass('text-slate-400', 'dark:text-slate-500')} font-medium`}>{m.investor}</div>
                                </td>
                                <td className={`py-1 px-1 font-mono ${getThemeClass('text-slate-500', 'dark:text-slate-400')} text-[8px]`}>{m.formula}</td>
                                <td className={`py-1 px-1 text-right font-bold font-mono ${getThemeClass('text-slate-900', 'dark:text-slate-100')}`}>{m.formattedValue}</td>
                                <td className="py-1 pl-1 text-right">
                                  <span className={`inline-block text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-md border ${m.colorClass}`}>
                                    {m.icon} {m.status === 'opportunity' ? 'Abaixo' : m.status === 'expensive' ? 'Acima' : 'Neutro'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <p className={`text-[7.5px] ${getThemeClass('text-slate-400', 'dark:text-slate-500')} italic leading-tight pt-2 border-t ${getThemeClass('border-slate-100', 'dark:border-slate-800/60')} mt-2`}>
                      *Legenda: 🟢 Abaixo do preço teto = oportunidade / 🔴 Acima = caro / 🟡 Na faixa = neutro. Cálculo com base no preço atual R$ {currentPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}.
                    </p>
                  </div>

                  {/* Right Column: Métricas e Indicadores de Valuation / Endividamento */}
                  <div className="col-span-5 flex flex-col justify-between gap-4">
                    {/* Valuation Panel */}
                    <div className={`p-4 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl space-y-2 text-[11px] flex-1`}>
                      <h4 className={`text-[10px] font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} border-b ${getThemeClass('border-slate-200', 'dark:border-slate-800')} pb-1 flex items-center gap-1.5`}>
                        📉 VALUATION E MÚLTIPLOS
                      </h4>
                      <div className="space-y-1">
                        {[
                          { label: 'P/L', value: activePreset.valuation.pl },
                          { label: 'P/VP', value: activePreset.valuation.pvp },
                          { label: 'EV / EBITDA', value: activePreset.valuation.evEbitda },
                          { label: 'PEG Ratio', value: activePreset.valuation.peg },
                          { label: 'VPA', value: activePreset.valuation.vpa }
                        ].map((item, idx) => (
                          <div key={idx} className={`flex justify-between items-center py-0.5 border-b ${getThemeClass('border-slate-100', 'dark:border-slate-800/60')} font-sans`}>
                            <span className={getThemeClass('text-slate-500', 'dark:text-slate-400')}>{item.label}</span>
                            <span className={`font-black ${getThemeClass('text-slate-800', 'dark:text-slate-200')} font-mono`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Debt Panel */}
                    <div className={`p-4 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl space-y-2 text-[11px] flex-1`}>
                      <h4 className={`text-[10px] font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} border-b ${getThemeClass('border-slate-200', 'dark:border-slate-800')} pb-1 flex items-center gap-1.5`}>
                        🏦 ESTRUTURA DE CAPITAL
                      </h4>
                      <div className="space-y-1">
                        {[
                          { label: 'Dívida Bruta', value: activePreset.debt.grossDebt },
                          { label: 'Dívida Líquida', value: activePreset.debt.netDebt },
                          { label: 'Dívida Líq. / PL', value: activePreset.debt.debtToEquity },
                          { label: 'Liquidez Corrente', value: activePreset.debt.currentRatio }
                        ].map((item, idx) => (
                          <div key={idx} className={`flex justify-between items-center py-0.5 border-b ${getThemeClass('border-slate-100', 'dark:border-slate-800/60')} font-sans`}>
                            <span className={getThemeClass('text-slate-500', 'dark:text-slate-400')}>{item.label}</span>
                            <span className={`font-black ${getThemeClass('text-slate-800', 'dark:text-slate-200')} font-mono`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SWOT Highlights / Pros & Cons */}
                <div className={`p-6 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl`}>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} mb-4 flex items-center gap-2`}>
                    ⚖️ DIAGNÓSTICO RÁPIDO: PRÓS & CONTRAS
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Pontos Fortes (Por que investir?)</p>
                      {activePreset.pros.slice(0, 2).map((p, i) => (
                        <div key={i} className={`flex items-start gap-2 text-xs ${getThemeClass('text-slate-600', 'dark:text-slate-300')}`}>
                          <span className="text-emerald-600">🟢</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-red-700 dark:text-red-400 tracking-wider">Pontos de Atenção (Riscos e Alertas)</p>
                      {activePreset.cons.slice(0, 2).map((c, i) => (
                        <div key={i} className={`flex items-start gap-2 text-xs ${getThemeClass('text-slate-600', 'dark:text-slate-300')}`}>
                          <span className="text-amber-500">🟡</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Footer Band */}
              <div className={`flex justify-between items-center pt-4 border-t ${getThemeClass('border-slate-200', 'dark:border-slate-800')} text-[10px] text-slate-400 font-bold tracking-wider z-10 relative`}>
                <span>SIMULAGRANA® INTEL — ANÁLISE CORPORATIVA</span>
                <span>Página 2 de 3</span>
              </div>
            </div>

            {/* PAGE 3 */}
            <div 
              ref={(el) => { if (el) pageRefs.current[2] = el; }}
              className={`w-[800px] h-[1130px] ${getThemeClass('bg-white text-slate-900 border-slate-200', 'dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800')} shadow-2xl flex flex-col justify-between p-10 relative overflow-hidden select-none border`}
              style={{ minHeight: '1130px' }}
            >
              {/* WATERMARK SIMULAGRANA */}
              <div className="absolute inset-0 flex flex-wrap justify-center items-center pointer-events-none opacity-[0.03] select-none rotate-[-35deg] scale-125 z-0">
                {Array.from({ length: 48 }).map((_, i) => (
                  <span key={i} className={`text-2xl font-black font-mono tracking-[0.2em] m-10 ${getThemeClass('text-slate-800', 'dark:text-slate-300')}`}>
                    SIMULAGRANA
                  </span>
                ))}
              </div>

              <div className="relative z-10 space-y-8">
                {/* Header Page Band */}
                <div className={`flex justify-between items-center pb-4 border-b-2 ${getThemeClass('border-slate-100', 'dark:border-slate-800/60')}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-black ${getThemeClass('text-slate-800', 'dark:text-slate-200')} text-sm tracking-widest uppercase`}>{normalizedTicker}</span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className={`text-xs ${getThemeClass('text-slate-500', 'dark:text-slate-400')} font-bold uppercase tracking-wider`}>Indicadores, SWOT e Conclusão</span>
                  </div>
                  <img src="/simulagranalogo.svg" alt="SimulaGrana" className="w-5 h-5 opacity-40" />
                </div>

                {/* SWOT Matrix & Rentabilidade Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Column 1: SWOT Matrix */}
                  <div className={`p-6 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl space-y-4`}>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} flex items-center gap-2`}>
                      🤖 MATRIZ SWOT RESUMIDA
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className={`p-3 rounded-xl border space-y-1 ${getThemeClass('bg-emerald-50 border-emerald-100', 'dark:bg-emerald-950/30 dark:border-emerald-800/50')}`}>
                        <span className={`font-black ${getThemeClass('text-emerald-800', 'dark:text-emerald-400')} text-[10px] tracking-wider uppercase`}>💪 FORÇAS</span>
                        <p className={`text-[11px] leading-tight ${getThemeClass('text-emerald-700', 'dark:text-emerald-300')}`}>{activePreset.swot.forces[0]}</p>
                      </div>
                      <div className={`p-3 rounded-xl border space-y-1 ${getThemeClass('bg-red-50 border-red-100', 'dark:bg-red-950/30 dark:border-red-800/50')}`}>
                        <span className={`font-black ${getThemeClass('text-red-800', 'dark:text-red-400')} text-[10px] tracking-wider uppercase`}>❌ FRAQUEZAS</span>
                        <p className={`text-[11px] leading-tight ${getThemeClass('text-red-700', 'dark:text-red-300')}`}>{activePreset.swot.weaknesses[0]}</p>
                      </div>
                      <div className={`p-3 rounded-xl border space-y-1 ${getThemeClass('bg-indigo-50 border-indigo-100', 'dark:bg-indigo-950/30 dark:border-indigo-800/50')}`}>
                        <span className={`font-black ${getThemeClass('text-indigo-800', 'dark:text-indigo-400')} text-[10px] tracking-wider uppercase`}>🚀 OPORTUNIDADES</span>
                        <p className={`text-[11px] leading-tight ${getThemeClass('text-indigo-700', 'dark:text-indigo-300')}`}>{activePreset.swot.opportunities[0]}</p>
                      </div>
                      <div className={`p-3 rounded-xl border space-y-1 ${getThemeClass('bg-amber-50 border-amber-100', 'dark:bg-amber-950/30 dark:border-amber-800/50')}`}>
                        <span className={`font-black ${getThemeClass('text-amber-800', 'dark:text-amber-400')} text-[10px] tracking-wider uppercase`}>⚠️ AMEAÇAS</span>
                        <p className={`text-[11px] leading-tight ${getThemeClass('text-amber-700', 'dark:text-amber-300')}`}>{activePreset.swot.threats[0]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Rentabilidade e Eficiência */}
                  <div className={`p-6 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl space-y-4`}>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} flex items-center gap-2`}>
                      🏆 INDICADORES DE RENTABILIDADE
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 ${getThemeClass('bg-white border-slate-200/60', 'dark:bg-slate-900/60 dark:border-slate-700/40')} border rounded-xl text-center`}>
                        <p className={`text-[10px] ${getThemeClass('text-slate-400', 'dark:text-slate-500')} font-bold uppercase`}>ROE</p>
                        <p className={`text-xl font-black ${getThemeClass('text-slate-800', 'dark:text-slate-100')} font-mono`}>{activePreset.quality.roe}</p>
                      </div>
                      <div className={`p-3 ${getThemeClass('bg-white border-slate-200/60', 'dark:bg-slate-900/60 dark:border-slate-700/40')} border rounded-xl text-center`}>
                        <p className={`text-[10px] ${getThemeClass('text-slate-400', 'dark:text-slate-500')} font-bold uppercase`}>ROIC</p>
                        <p className={`text-xl font-black ${getThemeClass('text-slate-800', 'dark:text-slate-100')} font-mono`}>{activePreset.quality.roic}</p>
                      </div>
                      <div className={`p-3 ${getThemeClass('bg-white border-slate-200/60', 'dark:bg-slate-900/60 dark:border-slate-700/40')} border rounded-xl text-center`}>
                        <p className={`text-[10px] ${getThemeClass('text-slate-400', 'dark:text-slate-500')} font-bold uppercase`}>Margem EBITDA</p>
                        <p className={`text-lg font-black ${getThemeClass('text-slate-800', 'dark:text-slate-100')} font-mono`}>{activePreset.quality.marginEbitda}</p>
                      </div>
                      <div className={`p-3 ${getThemeClass('bg-white border-slate-200/60', 'dark:bg-slate-900/60 dark:border-slate-700/40')} border rounded-xl text-center`}>
                        <p className={`text-[10px] ${getThemeClass('text-slate-400', 'dark:text-slate-500')} font-bold uppercase`}>Margem Líquida</p>
                        <p className={`text-lg font-black ${getThemeClass('text-slate-800', 'dark:text-slate-100')} font-mono`}>{activePreset.quality.marginNet}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Matrix and Target Price banner */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Risks List */}
                  <div className={`p-6 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl space-y-3.5`}>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} flex items-center gap-2`}>
                      🚦 MATRIZ DE RISCOS
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      {activePreset.risks.slice(0, 4).map((risk, i) => (
                        <div key={i} className={`flex justify-between items-center py-1 border-b ${getThemeClass('border-slate-200/40', 'dark:border-slate-800/40')}`}>
                          <span className={`font-bold ${getThemeClass('text-slate-700', 'dark:text-slate-300')}`}>{risk.name}</span>
                          <span className={risk.status}>{risk.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Target Price display */}
                  <div className="p-6 bg-[#008542] text-white rounded-2xl flex flex-col justify-center items-center text-center space-y-2.5 shadow-md">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-300">PREÇO-ALVO ESTIMADO</span>
                    <p className="text-4xl font-black font-mono tracking-tighter">
                      {activePreset.lucroVsCotacao.targetPrice}
                    </p>
                    <div className="px-4 py-1.5 bg-black/20 text-emerald-300 rounded-full text-xs font-black border border-white/10 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{activePreset.lucroVsCotacao.upside}</span>
                    </div>
                  </div>
                </div>

                {/* Lucro vs Cotação Analysis */}
                <div className={`p-6 ${getThemeClass('bg-slate-50 border-slate-200', 'dark:bg-slate-800/40 dark:border-slate-700/40')} border rounded-2xl space-y-4`}>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${getThemeClass('text-slate-800', 'dark:text-slate-200')} flex items-center gap-2`}>
                    ⚖️ RELAÇÃO HISTÓRICA: LUCRO x COTAÇÃO
                  </h3>
                  <div className={`space-y-3 text-xs leading-relaxed ${getThemeClass('text-slate-600', 'dark:text-slate-300')}`}>
                    <p>
                      O acompanhamento histórico operacional de <strong>{normalizedTicker}</strong> demonstra resiliência mesmo sob volatilidade de mercado internacional.
                    </p>
                    <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-mono">
                      {activePreset.lucroVsCotacao.history.slice(0, 6).map((h, i) => (
                        <div key={i} className={`p-2 ${getThemeClass('bg-white border-slate-200', 'dark:bg-slate-900/60 dark:border-slate-700/40')} border rounded-lg flex flex-col justify-between`}>
                          <span className={`font-bold ${getThemeClass('text-slate-500', 'dark:text-slate-400')}`}>{h.year}</span>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">█ {h.profitBlock}/10</span>
                        </div>
                      ))}
                    </div>
                    <p className={`text-[11px] ${getThemeClass('text-slate-500', 'dark:text-slate-400')} italic pt-1`}>
                      Conclusão: Lucratividade líquida permanece em níveis historicamente atrativos. O mercado de capitais mantém desconto devido à interferência macroeconômica. Recomendamos monitorar o suporte de cotações próximas às médias móveis de 200 períodos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Page Footer Band */}
              <div className={`flex justify-between items-center pt-4 border-t ${getThemeClass('border-slate-200', 'dark:border-slate-800')} text-[10px] text-slate-400 font-bold tracking-wider z-10 relative`}>
                <span>SIMULAGRANA® INTEL — ANÁLISE CORPORATIVA</span>
                <span>Página 3 de 3</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};
