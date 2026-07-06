export interface Vehicle {
  id: string;
  marca: string;
  modelo: string;
  versao: string;
  anoFabricacao: number;
  anoModelo: number;
  preco: number;
  km: number;
  cambio: string;
  combustivel: string;
  carroceria: string;
  cor: string;
  cidade: string;
  estado: string;
  anuncianteType: 'Loja' | 'Particular';
  fotos: string[];
  destaque?: boolean;
  opcionais: string[];
  descricao: string;
  condicao: 'Novo' | 'Seminovo' | 'Usado';
  latitude?: number;
  longitude?: number;
  endereco?: string;
  createdAt?: any;
  vendedor: {
    id?: string;
    nome: string;
    telefone: string;
    avatar?: string;
    nota?: number;
    membroDesde?: string;
    verificado?: boolean;
  };
}

export const mockVehicles: Vehicle[] = [
  {
    id: "v1",
    marca: "Toyota",
    modelo: "Corolla",
    versao: "2.0 XEI 16V FLEX",
    anoFabricacao: 2021,
    anoModelo: 2022,
    preco: 135900,
    km: 25400,
    cambio: "Automático",
    combustivel: "Flex",
    carroceria: "Sedã",
    cor: "Branco",
    cidade: "São Paulo",
    estado: "SP",
    anuncianteType: "Loja",
    destaque: true,
    condicao: 'Seminovo',
    latitude: -23.5505,
    longitude: -46.6333,
    endereco: "Centro, São Paulo - SP",
    fotos: [
      "https://images.unsplash.com/photo-1623912196024-bc6c8ff8d5bf?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550343756-302fa2dbee3b?q=80&w=800&auto=format&fit=crop"
    ],
    opcionais: ["Ar Condicionado", "Direção Elétrica", "Kit Multimídia", "Câmera de Ré", "Bancos em Couro", "Piloto Automático"],
    descricao: "Veículo em estado de zero, único dono, todas as revisões em concessionária. Excelente oportunidade!",
    vendedor: {
      nome: "Premium Motors",
      telefone: "(11) 99999-9999",
      nota: 4.8,
      membroDesde: "2018",
      verificado: true
    }
  },
  {
    id: "v2",
    marca: "Volkswagen",
    modelo: "Nivus",
    versao: "1.0 200 TSI HIGHLINE",
    anoFabricacao: 2022,
    anoModelo: 2023,
    preco: 122500,
    km: 18000,
    cambio: "Automático",
    combustivel: "Flex",
    carroceria: "SUV",
    cor: "Cinza",
    cidade: "Campinas",
    estado: "SP",
    anuncianteType: "Particular",
    destaque: false,
    condicao: 'Seminovo',
    latitude: -22.9064,
    longitude: -47.0616,
    endereco: "Cambuí, Campinas - SP",
    fotos: [
      "https://images.unsplash.com/photo-1605559424843-9e11505c23a7?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593460831649-6533036a11e8?q=80&w=800&auto=format&fit=crop"
    ],
    opcionais: ["Painel Digital", "Farol de LED", "Sensor de Estacionamento Frontal", "ACC"],
    descricao: "Carro de garagem, mal utilizado. Cheiro de novo.",
    vendedor: {
      nome: "Carlos Eduardo",
      telefone: "(19) 98888-8888",
      membroDesde: "2021",
      verificado: false
    }
  },
  {
    id: "v3",
    marca: "Jeep",
    modelo: "Compass",
    versao: "2.0 16V FLEX LONGITUDE",
    anoFabricacao: 2020,
    anoModelo: 2021,
    preco: 145000,
    km: 52000,
    cambio: "Automático",
    combustivel: "Flex",
    carroceria: "SUV",
    cor: "Preto",
    cidade: "Curitiba",
    estado: "PR",
    anuncianteType: "Loja",
    destaque: true,
    condicao: 'Usado',
    latitude: -25.429,
    longitude: -49.2671,
    endereco: "Batel, Curitiba - PR",
    fotos: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551830820-330a71b99659?q=80&w=800&auto=format&fit=crop"
    ],
    opcionais: ["Tração 4x4", "Teto Solar", "Bancos em Couro", "Central Multimídia", "Rodas de Liga Leve"],
    descricao: "SUV mais vendido da categoria, muito conservado e com laudo cautelar aprovado.",
    vendedor: {
      nome: "Vip Cars Seminovos",
      telefone: "(41) 97777-7777",
      nota: 4.5,
      membroDesde: "2015",
      verificado: true
    }
  },
  {
    id: "v4",
    marca: "Honda",
    modelo: "Civic",
    versao: "2.0 16V EXL FLEX",
    anoFabricacao: 2019,
    anoModelo: 2020,
    preco: 118000,
    km: 68000,
    cambio: "Automático",
    combustivel: "Flex",
    carroceria: "Sedã",
    cor: "Prata",
    cidade: "Belo Horizonte",
    estado: "MG",
    anuncianteType: "Particular",
    condicao: 'Usado',
    latitude: -19.9167,
    longitude: -43.9345,
    endereco: "Savassi, Belo Horizonte - MG",
    fotos: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=800&auto=format&fit=crop"
    ],
    opcionais: ["Ar-condicionado Digital", "Controle de Tração", "Freio de Estacionamento Eletrônico", "Bancos em Couro"],
    descricao: "Segundo dono, IPVA 2024 pago. Pneus novos.",
    vendedor: {
      nome: "Rafael Silva",
      telefone: "(31) 96666-6666",
      membroDesde: "2020",
      verificado: true
    }
  },
  {
    id: "v5",
    marca: "Hyundai",
    modelo: "HB20",
    versao: "1.0 COMFORT PLUS",
    anoFabricacao: 2023,
    anoModelo: 2024,
    preco: 82900,
    km: 0,
    cambio: "Manual",
    combustivel: "Flex",
    carroceria: "Hatch",
    cor: "Branco",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    anuncianteType: "Loja",
    condicao: 'Novo',
    latitude: -22.9068,
    longitude: -43.1729,
    endereco: "Barra da Tijuca, Rio de Janeiro - RJ",
    fotos: [
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1580274455191-1c62238fa333?q=80&w=800&auto=format&fit=crop"
    ],
    opcionais: ["Ar Condicionado", "Vidros Elétricos", "Direção Hidráulica"],
    descricao: "Carro ideal para o dia a dia, muito econômico.",
    vendedor: {
      nome: "Automix Store",
      telefone: "(21) 95555-5555",
      nota: 4.2,
      membroDesde: "2019",
      verificado: false
    }
  },
  {
    id: "v6",
    marca: "Chevrolet",
    modelo: "Tracker",
    versao: "1.2 TURBO PREMIER",
    anoFabricacao: 2021,
    anoModelo: 2022,
    preco: 129990,
    km: 30000,
    cambio: "Automático",
    combustivel: "Flex",
    carroceria: "SUV",
    cor: "Azul",
    cidade: "Florianópolis",
    estado: "SC",
    anuncianteType: "Particular",
    destaque: true,
    condicao: 'Seminovo',
    latitude: -27.5954,
    longitude: -48.548,
    endereco: "Beira Mar Norte, Florianópolis - SC",
    fotos: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop"
    ],
    opcionais: ["Alerta de Ponto Cego", "Wi-Fi Nativo", "Teto Solar Panorâmico", "Bancos em Couro Bi-tom"],
    descricao: "Mais completa da categoria! Cor azul perolizado.",
    vendedor: {
      nome: "Mariana Costa",
      telefone: "(48) 94444-4444",
      membroDesde: "2023",
      verificado: true
    }
  }
];

export const marcasPopulares = [
  { nome: "Toyota", logo: "https://www.car-logos.org/wp-content/uploads/2011/09/toyota.png" },
  { nome: "Volkswagen", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Volkswagen_Logo_till_1995.svg/1024px-Volkswagen_Logo_till_1995.svg.png" },
  { nome: "Fiat", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/FIAT_logo_%282020%29.svg/1200px-FIAT_logo_%282020%29.svg.png" },
  { nome: "Chevrolet", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet-logo.png/1200px-Chevrolet-logo.png" },
  { nome: "Hyundai", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/1200px-Hyundai_Motor_Company_logo.svg.png" },
  { nome: "Jeep", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Jeep_logo.svg/1200px-Jeep_logo.svg.png" }
];
