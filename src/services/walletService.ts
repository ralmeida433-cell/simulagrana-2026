import { WalletData, Transaction, CategoryInfo } from '../types/wallet';

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-03-01', description: 'Salário', amount: 5000, category: 'Salário', type: 'income' },
  { id: '2', date: '2024-03-02', description: 'Aluguel', amount: 1500, category: 'Moradia', type: 'expense' },
  { id: '3', date: '2024-03-03', description: 'Supermercado', amount: 450, category: 'Alimentação', type: 'expense' },
  { id: '4', date: '2024-03-05', description: 'Posto de Gasolina', amount: 200, category: 'Transporte', type: 'expense' },
  { id: '5', date: '2024-03-07', description: 'Restaurante', amount: 120, category: 'Alimentação', type: 'expense' },
  { id: '6', date: '2024-03-10', description: 'Internet/TV', amount: 180, category: 'Contas e serviços', type: 'expense' },
  { id: '7', date: '2024-03-12', description: 'Netflix', amount: 55, category: 'Lazer', type: 'expense' },
  { id: '8', date: '2024-03-15', description: 'Freelance', amount: 800, category: 'Renda Extra', type: 'income' },
  { id: '9', date: '2024-03-18', description: 'Farmácia', amount: 90, category: 'Saúde', type: 'expense' },
  { id: '10', date: '2024-03-20', description: 'Shopping', amount: 300, category: 'Compras', type: 'expense' },
];

export const CATEGORIES: Record<string, { icon: string, color: string }> = {
  'Alimentação': { icon: '🍔', color: '#EF4444' },
  'Transporte': { icon: '🚗', color: '#F59E0B' },
  'Moradia': { icon: '🏠', color: '#3B82F6' },
  'Compras': { icon: '🛍️', color: '#EC4899' },
  'Lazer': { icon: '🎬', color: '#8B5CF6' },
  'Contas e serviços': { icon: '💡', color: '#06B6D4' },
  'Saúde': { icon: '🏥', color: '#10B981' },
  'Educação': { icon: '📚', color: '#6366F1' },
  'Investimentos': { icon: '💰', color: '#10B981' },
  'Salário': { icon: '💵', color: '#10B981' },
  'Renda Extra': { icon: '📈', color: '#10B981' },
  'Impostos e Taxas': { icon: '🏛️', color: '#F59E0B' },
  'Outros': { icon: '🧾', color: '#64748B' },
};

// --- Machine Learning Model (Naive Bayes Classifier) ---
class NaiveBayesClassifier {
  private categoryCounts: Record<string, number> = {};
  private wordCounts: Record<string, Record<string, number>> = {};
  private vocabulary: Set<string> = new Set();
  private totalDocuments = 0;

  train(text: string, category: string) {
    this.totalDocuments++;
    this.categoryCounts[category] = (this.categoryCounts[category] || 0) + 1;
    
    if (!this.wordCounts[category]) {
      this.wordCounts[category] = {};
    }

    const words = this.tokenize(text);
    for (const word of words) {
      this.vocabulary.add(word);
      this.wordCounts[category][word] = (this.wordCounts[category][word] || 0) + 1;
    }
  }

  classify(text: string): string {
    const words = this.tokenize(text);
    if (words.length === 0) return 'Outros';

    let bestCategory = 'Outros';
    let maxProbability = -Infinity;

    for (const category of Object.keys(this.categoryCounts)) {
      // P(Category)
      let probability = Math.log(this.categoryCounts[category] / this.totalDocuments);

      const totalWordsInCategory = Object.values(this.wordCounts[category]).reduce((a, b) => a + b, 0);

      for (const word of words) {
        const wordCount = this.wordCounts[category][word] || 0;
        // Laplace smoothing: P(Word | Category)
        probability += Math.log((wordCount + 1) / (totalWordsInCategory + this.vocabulary.size));
      }

      if (probability > maxProbability) {
        maxProbability = probability;
        bestCategory = category;
      }
    }

    // If probability is too low (meaning the words are completely unknown), fallback to 'Outros'
    // But Naive Bayes usually gives a relative best. We can just return it.
    return bestCategory;
  }

  private tokenize(text: string): string[] {
    // Remove special characters, numbers, and split by spaces
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/[0-9]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2); // Ignore very short words like "de", "e", "a"
  }
}

const classifier = new NaiveBayesClassifier();

// Initial training data for the model
const TRAINING_DATA: Array<{ text: string, category: string }> = [
  // Alimentação
  { text: 'ifood', category: 'Alimentação' },
  { text: 'restaurante', category: 'Alimentação' },
  { text: 'mercado', category: 'Alimentação' },
  { text: 'supermercado', category: 'Alimentação' },
  { text: 'padaria', category: 'Alimentação' },
  { text: 'mcdonalds', category: 'Alimentação' },
  { text: 'burger king', category: 'Alimentação' },
  { text: 'pizzaria', category: 'Alimentação' },
  { text: 'acougue', category: 'Alimentação' },
  { text: 'hortifruti', category: 'Alimentação' },
  { text: 'lanchonete', category: 'Alimentação' },
  { text: 'sorveteria', category: 'Alimentação' },
  { text: 'cafe', category: 'Alimentação' },
  { text: 'starbucks', category: 'Alimentação' },
  { text: 'carrefour', category: 'Alimentação' },
  { text: 'pao de acucar', category: 'Alimentação' },
  { text: 'extra', category: 'Alimentação' },
  { text: 'atacadao', category: 'Alimentação' },
  { text: 'assai', category: 'Alimentação' },
  { text: 'rappi', category: 'Alimentação' },
  { text: 'ze delivery', category: 'Alimentação' },

  // Transporte
  { text: 'uber', category: 'Transporte' },
  { text: '99app', category: 'Transporte' },
  { text: 'posto', category: 'Transporte' },
  { text: 'gasolina', category: 'Transporte' },
  { text: 'estacionamento', category: 'Transporte' },
  { text: 'pedagio', category: 'Transporte' },
  { text: 'metro', category: 'Transporte' },
  { text: 'onibus', category: 'Transporte' },
  { text: 'concessionaria', category: 'Transporte' },
  { text: 'oficina', category: 'Transporte' },
  { text: 'ipva', category: 'Transporte' },
  { text: 'mecanico', category: 'Transporte' },
  { text: 'pneu', category: 'Transporte' },
  { text: 'taxi', category: 'Transporte' },
  { text: 'locacao', category: 'Transporte' },
  { text: 'localiza', category: 'Transporte' },
  { text: 'movida', category: 'Transporte' },
  { text: 'sem parar', category: 'Transporte' },
  { text: 'conectcar', category: 'Transporte' },
  { text: 'veloe', category: 'Transporte' },
  { text: 'shell box', category: 'Transporte' },
  { text: 'ipiranga', category: 'Transporte' },
  { text: 'petrobras', category: 'Transporte' },

  // Moradia
  { text: 'aluguel', category: 'Moradia' },
  { text: 'condominio', category: 'Moradia' },
  { text: 'luz', category: 'Moradia' },
  { text: 'agua', category: 'Moradia' },
  { text: 'internet', category: 'Moradia' },
  { text: 'celular', category: 'Moradia' },
  { text: 'iptu', category: 'Moradia' },
  { text: 'energia', category: 'Moradia' },
  { text: 'gas', category: 'Moradia' },
  { text: 'tv a cabo', category: 'Moradia' },
  { text: 'vivo', category: 'Moradia' },
  { text: 'claro', category: 'Moradia' },
  { text: 'tim', category: 'Moradia' },
  { text: 'oi', category: 'Moradia' },
  { text: 'net', category: 'Moradia' },
  { text: 'sky', category: 'Moradia' },
  { text: 'sabesp', category: 'Moradia' },
  { text: 'enel', category: 'Moradia' },
  { text: 'light', category: 'Moradia' },
  { text: 'copel', category: 'Moradia' },
  { text: 'cemig', category: 'Moradia' },
  { text: 'leroy merlin', category: 'Moradia' },
  { text: 'telhanorte', category: 'Moradia' },

  // Saúde
  { text: 'farmacia', category: 'Saúde' },
  { text: 'hospital', category: 'Saúde' },
  { text: 'medico', category: 'Saúde' },
  { text: 'dentista', category: 'Saúde' },
  { text: 'convenio', category: 'Saúde' },
  { text: 'unimed', category: 'Saúde' },
  { text: 'amil', category: 'Saúde' },
  { text: 'droga raia', category: 'Saúde' },
  { text: 'pague menos', category: 'Saúde' },
  { text: 'drogasil', category: 'Saúde' },
  { text: 'exame', category: 'Saúde' },
  { text: 'clinica', category: 'Saúde' },
  { text: 'terapia', category: 'Saúde' },
  { text: 'psicologo', category: 'Saúde' },
  { text: 'medicamento', category: 'Saúde' },
  { text: 'sao paulo', category: 'Saúde' }, // Drogaria Sao Paulo
  { text: 'pacheco', category: 'Saúde' },

  // Educação
  { text: 'escola', category: 'Educação' },
  { text: 'faculdade', category: 'Educação' },
  { text: 'curso', category: 'Educação' },
  { text: 'livro', category: 'Educação' },
  { text: 'papelaria', category: 'Educação' },
  { text: 'mensalidade', category: 'Educação' },
  { text: 'udemy', category: 'Educação' },
  { text: 'alura', category: 'Educação' },
  { text: 'ingles', category: 'Educação' },
  { text: 'idiomas', category: 'Educação' },
  { text: 'material escolar', category: 'Educação' },
  { text: 'creche', category: 'Educação' },
  { text: 'kalunga', category: 'Educação' },

  // Compras
  { text: 'amazon', category: 'Compras' },
  { text: 'mercadolivre', category: 'Compras' },
  { text: 'shopee', category: 'Compras' },
  { text: 'magalu', category: 'Compras' },
  { text: 'americanas', category: 'Compras' },
  { text: 'casas bahia', category: 'Compras' },
  { text: 'roupa', category: 'Compras' },
  { text: 'calcado', category: 'Compras' },
  { text: 'shopping', category: 'Compras' },
  { text: 'loja', category: 'Compras' },
  { text: 'presente', category: 'Compras' },
  { text: 'eletronico', category: 'Compras' },
  { text: 'celular', category: 'Compras' },
  { text: 'computador', category: 'Compras' },
  { text: 'shein', category: 'Compras' },
  { text: 'aliexpress', category: 'Compras' },
  { text: 'renner', category: 'Compras' },
  { text: 'riachuelo', category: 'Compras' },
  { text: 'cea', category: 'Compras' },
  { text: 'zara', category: 'Compras' },
  { text: 'centauro', category: 'Compras' },
  { text: 'netshoes', category: 'Compras' },
  { text: 'kabum', category: 'Compras' },

  // Lazer
  { text: 'netflix', category: 'Lazer' },
  { text: 'spotify', category: 'Lazer' },
  { text: 'cinema', category: 'Lazer' },
  { text: 'steam', category: 'Lazer' },
  { text: 'jogos', category: 'Lazer' },
  { text: 'ingresso', category: 'Lazer' },
  { text: 'show', category: 'Lazer' },
  { text: 'teatro', category: 'Lazer' },
  { text: 'bar', category: 'Lazer' },
  { text: 'pub', category: 'Lazer' },
  { text: 'clube', category: 'Lazer' },
  { text: 'viagem', category: 'Lazer' },
  { text: 'hotel', category: 'Lazer' },
  { text: 'airbnb', category: 'Lazer' },
  { text: 'passagem', category: 'Lazer' },
  { text: 'turismo', category: 'Lazer' },
  { text: 'xbox', category: 'Lazer' },
  { text: 'playstation', category: 'Lazer' },
  { text: 'nintendo', category: 'Lazer' },
  { text: 'sympla', category: 'Lazer' },
  { text: 'eventim', category: 'Lazer' },
  { text: 'decolar', category: 'Lazer' },
  { text: '123milhas', category: 'Lazer' },
  { text: 'latam', category: 'Lazer' },
  { text: 'gol', category: 'Lazer' },
  { text: 'azul', category: 'Lazer' },

  // Salário
  { text: 'salario', category: 'Salário' },
  { text: 'pagamento', category: 'Salário' },
  { text: 'recebimento', category: 'Salário' },
  { text: 'adiantamento', category: 'Salário' },
  { text: 'decimo terceiro', category: 'Salário' },
  { text: 'ferias', category: 'Salário' },
  { text: 'bonus', category: 'Salário' },
  { text: 'plr', category: 'Salário' },
  { text: 'holerite', category: 'Salário' },
  { text: 'vencimento', category: 'Salário' },
  { text: 'pro labore', category: 'Salário' },

  // Investimentos
  { text: 'corretora', category: 'Investimentos' },
  { text: 'rico', category: 'Investimentos' },
  { text: 'xp', category: 'Investimentos' },
  { text: 'clear', category: 'Investimentos' },
  { text: 'nubank', category: 'Investimentos' },
  { text: 'tesouro', category: 'Investimentos' },
  { text: 'cdb', category: 'Investimentos' },
  { text: 'acao', category: 'Investimentos' },
  { text: 'fundo', category: 'Investimentos' },
  { text: 'b3', category: 'Investimentos' },
  { text: 'cripto', category: 'Investimentos' },
  { text: 'bitcoin', category: 'Investimentos' },
  { text: 'binance', category: 'Investimentos' },
  { text: 'banco inter', category: 'Investimentos' },
  { text: 'c6 bank', category: 'Investimentos' },
  { text: 'btg', category: 'Investimentos' },
  { text: 'avenue', category: 'Investimentos' },
  { text: 'nomad', category: 'Investimentos' },

  // Renda Extra
  { text: 'freelance', category: 'Renda Extra' },
  { text: 'uber', category: 'Renda Extra' }, // Context will depend on income/expense
  { text: 'venda', category: 'Renda Extra' },
  { text: 'rendimento', category: 'Renda Extra' },
  { text: 'dividendo', category: 'Renda Extra' },
  { text: 'aluguel recebido', category: 'Renda Extra' },
  { text: 'reembolso', category: 'Renda Extra' },
  { text: 'cashback', category: 'Renda Extra' },
  { text: 'pix recebido', category: 'Renda Extra' },

  // Impostos e Taxas
  { text: 'iof', category: 'Impostos e Taxas' },
  { text: 'tarifa', category: 'Impostos e Taxas' },
  { text: 'taxa', category: 'Impostos e Taxas' },
  { text: 'imposto', category: 'Impostos e Taxas' },
  { text: 'darf', category: 'Impostos e Taxas' },
  { text: 'multa', category: 'Impostos e Taxas' },
  { text: 'juros', category: 'Impostos e Taxas' },
  { text: 'manutencao de conta', category: 'Impostos e Taxas' },
  { text: 'anuidade', category: 'Impostos e Taxas' },
  { text: 'saque', category: 'Impostos e Taxas' },
  { text: 'ted', category: 'Impostos e Taxas' },
  { text: 'doc', category: 'Impostos e Taxas' },

  // Outros
  { text: 'pix', category: 'Outros' },
  { text: 'transferencia', category: 'Outros' },
  { text: 'deposito', category: 'Outros' },
  { text: 'pagamento titulo', category: 'Outros' },
  { text: 'boleto', category: 'Outros' },
];

// Train the model
TRAINING_DATA.forEach(data => {
  classifier.train(data.text, data.category);
});

export const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase().trim();
  
  // 1. Fast path for exact matches
  for (const data of TRAINING_DATA) {
    if (desc.includes(data.text)) {
      return data.category;
    }
  }

  // 2. Machine Learning Classification (Naive Bayes)
  const predictedCategory = classifier.classify(desc);
  
  return predictedCategory;
};

export const getMockWalletData = (): WalletData => {
  const totalIncome = MOCK_TRANSACTIONS
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalExpenses = MOCK_TRANSACTIONS
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const categoryTotals: Record<string, number> = {};
  MOCK_TRANSACTIONS.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const categories: CategoryInfo[] = Object.entries(categoryTotals).map(([name, total]) => ({
    name,
    total,
    icon: CATEGORIES[name]?.icon || '🧾',
    color: CATEGORIES[name]?.color || '#64748B',
  }));

  return {
    balance: totalIncome - totalExpenses,
    totalIncome,
    totalExpenses,
    transactions: MOCK_TRANSACTIONS,
    categories,
    goals: [
      { id: '1', title: 'Reserva de Emergência', targetAmount: 10000, currentAmount: 3500 },
      { id: '2', title: 'Viagem Fim de Ano', targetAmount: 5000, currentAmount: 1200 },
    ],
    insights: [
      "Seus gastos com Alimentação estão 15% acima da média do mês passado.",
      "Você economizou R$ 400 em Transporte este mês. Bom trabalho!",
      "Reduzindo R$ 150 mensais em Lazer, você atingiria sua meta de Reserva de Emergência 2 meses antes.",
    ]
  };
};
