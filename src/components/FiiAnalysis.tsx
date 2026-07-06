import { useState, FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, AlertCircle, BarChart3, Building2, FileText, Download, BrainCircuit, Volume2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { isAIConfigured, generateContentWithRetry } from '../services/aiService';
import ReportAudioPlayer from './ReportAudioPlayer';
import { cn } from '../lib/utils';
import { AssetComparisonChart } from './shared/AssetComparisonChart';
import { AssetPrice } from './shared/AssetPrice';

interface FIIDocument {
  title: string;
  date: string;
  url: string;
  type: 'relatorio' | 'fato_relevante' | 'outro';
}

export default function FiiAnalysis() {
  const { user, profile, login } = useAuth();
  const [ticker, setTicker] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ticker') || '';
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string>('');
  const [sources, setSources] = useState<{uri: string, title: string}[]>([]);
  const [documents, setDocuments] = useState<FIIDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null);
  const [docAnalysis, setDocAnalysis] = useState<string>('');
  const [docError, setDocError] = useState<string>('');
  const [docAnalysisError, setDocAnalysisError] = useState<string>('');
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);

  // Initial search on mount
  useEffect(() => {
    if (ticker) {
      doSearch(ticker);
    }
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTicker = params.get('ticker');
      if (urlTicker && urlTicker !== ticker) {
        setTicker(urlTicker);
        doSearch(urlTicker);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [ticker]);
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!ticker || ticker.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        return;
      }

      setIsSearchingSuggestions(true);
      try {
        const res = await fetch(`/api/fin/search/${encodeURIComponent(ticker)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter only FIIs if possible, but for now just show suggestions
          setSuggestions(data);
          if (document.activeElement === inputRef.current) {
            setShowSuggestions(true);
          }
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsSearchingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [ticker]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch(e as any);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[activeSuggestionIndex];
        isSelectingRef.current = true;
        setTicker(selected.ticker);
        setShowSuggestions(false);
        inputRef.current?.blur();
        doSearch(selected.ticker);
      } else {
        handleSearch(e as any);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const doSearch = async (targetTicker: string) => {
    if (!targetTicker) return;

    setLoading(true);
    setError('');
    setStockData(null);
    setAnalysis('');
    setAnalysisError('');
    setSources([]);

    try {
      // 1. Fetch stock data
      const cleanTicker = targetTicker.trim().toUpperCase();
      const formattedTicker = cleanTicker.endsWith('.SA') 
        ? cleanTicker 
        : `${cleanTicker}.SA`;
        
      const response = await fetch(`/api/fin/${formattedTicker}`);
      
      if (!response.ok) {
        throw new Error('Dados do FII não encontrados ou indisponíveis.');
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta inválida do servidor de dados.');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setStockData(data);

      // 2. Fetch Documents
      fetchDocuments(cleanTicker);

      // 3. Generate AI Analysis conditionally
      if (!user) {
        setAnalysisError('AUTH_REQUIRED');
      } else if (profile?.aiCreditsRemaining !== undefined && profile.aiCreditsRemaining <= 0) {
        setAnalysisError('CREDITS_EXHAUSTED');
      } else {
        await generateAnalysis(data);
      }

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  // Reactive effect: if user logs in after searching, automatically run the analysis if credits allow
  useEffect(() => {
    if (user && stockData && !analysis && (analysisError === 'AUTH_REQUIRED' || !analysisError)) {
      if (profile?.aiCreditsRemaining !== undefined && profile.aiCreditsRemaining > 0) {
        setAnalysisError('');
        generateAnalysis(stockData);
      } else if (profile?.aiCreditsRemaining !== undefined && profile.aiCreditsRemaining <= 0) {
        setAnalysisError('CREDITS_EXHAUSTED');
      }
    }
  }, [user, profile, stockData, analysis, analysisError]);

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    doSearch(ticker);
  };

  const fetchDocuments = async (ticker: string) => {
    setLoadingDocs(true);
    setDocuments([]);
    setDocError('');
    
    const cleanTicker = ticker.trim().toUpperCase().replace(/\.SA$/, '');
    
    try {
      const response = await fetch(`/api/companies/${cleanTicker}/announcements`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Ticker not found on Investidor10, just show empty state
          return;
        }
        throw new Error('Não foi possível carregar os documentos.');
      }
      
      const data = await response.json();
      
      if (data.announcements && data.announcements.length > 0) {
        setDocuments(data.announcements);
      }
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
      setDocError('Erro ao buscar documentos oficiais.');
    } finally {
      setLoadingDocs(false);
    }
  };

  const analyzeDocument = async (doc: FIIDocument) => {
    if (!user) {
      try {
        await login();
      } catch (err) {
        console.error("Login failed:", err);
      }
      return;
    }
    if (profile?.aiCreditsRemaining !== undefined && profile.aiCreditsRemaining <= 0) {
      setDocAnalysisError('⚠️ Seu limite diário de 5 análises de IA foi atingido. Ele será renovado amanhã!');
      return;
    }
    if (!isAIConfigured()) return;
    
    setAnalyzingDoc(doc.url);
    setDocAnalysis('');
    setDocAnalysisError('');
    
    try {
      // 1. Extract text from PDF via server
      const extractResponse = await fetch('/api/fii/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: doc.url })
      });
      
      const extractData = await extractResponse.json();
      
      if (!extractResponse.ok) {
        throw new Error('Servidor de PDF indisponível ou documento protegido.');
      }
      
      // 2. Analyze text with Gemini
      const prompt = `
Atue como um analista financeiro sênior especializado na interpretação de relatórios de Fundos Imobiliários (FIIs). Sua função é analisar o conteúdo do documento abaixo e gerar um parecer profissional, claro, objetivo e acessível, utilizando uma linguagem simples, adequada até mesmo para leitores leigos no mercado financeiro.

--- TEXTO DO DOCUMENTO (${doc.title}) ---
${extractData.text}
--- FIM DO TEXTO ---

DIRETRIZES DE COMUNICAÇÃO:
1. Linguagem Simples e Didática: Utilize termos de fácil compreensão. Sempre que empregar termos técnicos (ex.: dividend yield, vacância, P/VP, cap rate, amortização), inclua uma breve explicação entre parênteses ou em uma nota.
2. Objetividade e Clareza: Destaque apenas os pontos mais relevantes do relatório. Evite excesso de jargões financeiros e informações desnecessárias.
3. Interpretação dos Dados: Não apenas apresente números; explique o que eles significam para o investidor. Sempre que possível, compare os resultados com períodos anteriores mencionados no texto.
4. Tom e Estilo: Profissional, imparcial e educativo. Evite recomendações explícitas de compra ou venda. Utilize listas e subtítulos para facilitar a leitura.

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO (Use Markdown):

### Resumo Executivo:
Forneça uma visão geral do desempenho do fundo no período analisado.

### Principais Indicadores:
Utilize uma lista com marcadores (•). Apresente e explique as métricas encontradas (ex: Dividend Yield, Vacância, P/VP, Receita, Lucro). Explique o que cada uma indica sobre a saúde do fundo de forma simples.

### Pontos Positivos:
Utilize uma lista com marcadores (•). Destaque os aspectos que contribuíram favoravelmente para o desempenho do fundo.

### Pontos de Atenção:
Utilize uma lista com marcadores (•). Aponte riscos, quedas de desempenho, vacância elevada, concentração de inquilinos ou eventos relevantes que exijam cautela.

### Conclusão:
Apresente uma síntese interpretativa do cenário atual e as perspectivas futuras para o fundo com base nos dados analisados.

"Analise os dados fornecidos e gere um relatório mensal claro, objetivo e de fácil compreensão, destacando os principais pontos positivos, riscos e conclusões, sempre com linguagem acessível ao público leigo."
`;

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: prompt
      });

      setDocAnalysis(response.text || 'Não foi possível gerar a análise do documento.');
      
      // Scroll to analysis
      setTimeout(() => {
        const element = document.getElementById('doc-analysis-result');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error('Erro ao analisar documento:', err);
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota')) {
        setDocAnalysisError('⚠️ Limite de requisições da IA atingido (Cota Excedida). Por favor, aguarde alguns minutos e tente novamente.');
      } else {
        setDocAnalysisError(err.message || 'Erro ao processar documento.');
      }
      
      // Scroll to error
      setTimeout(() => {
        const element = document.getElementById('doc-analysis-error');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setAnalyzingDoc(null);
    }
  };

  const generateAnalysis = async (data: any) => {
    if (!isAIConfigured()) {
      setAnalysis('A chave da API do Gemini não foi configurada. Por favor, configure a variável de ambiente VITE_GEMINI_API_KEY (ou GEMINI_API_KEY) no seu servidor ou em Configurações.');
      return;
    }

    try {
      const prompt = `
Você é um analista fundamentalista sênior especializado em Fundos Imobiliários (FIIs) e Fiagros no mercado brasileiro (B3), com certificação CNPI e mais de 15 anos de experiência.
Sua análise deve ser profunda, crítica e técnica, focada em prover valor real para a tomada de decisão do investidor, equilibrando retorno, segurança e risco.

Fundo: ${data.name} - ${data.ticker}

Dados de Mercado Atuais:
- Preço Atual: ${data.currency} ${data.price}
- P/VP: ${data.pvp?.toFixed(2)}
- Dividend Yield: ${data.dividendYield?.toFixed(2)}%
- Valor de Mercado: ${data.currency} ${((data.marketCap || 0) / 1e6).toFixed(2)} Milhões
- Liquidez Diária: ${data.volume?.toLocaleString('pt-BR')}

Instruções para a Análise:
1. **Busca na Web (Obrigatório):** Utilize a ferramenta de busca para encontrar os relatórios gerenciais e fatos relevantes mais recentes (FNET/B3 e CVM).
2. **Utilize o Checklist Completo abaixo** para embasar sua análise.

✅ Checklist Completo para Análise de FIIs
📊 1. Valuation (P/VP): < 0,90 (desconto atrativo, avaliar riscos); 0,90 – 1,10 (justo); > 1,10 (ágio, analisar qualidade).
💰 2. Rendimento (Dividendos): Avaliar DY anualizado vs CDI/Selic e pares. Verificar consistência (12-24 meses), previsibilidade e se a origem é de receitas recorrentes.
📈 3. Liquidez: Volume Médio Diário preferencialmente > R$ 1 milhão. Maior número de cotistas indica maior estabilidade.
🏢 4. Qualidade dos Ativos: Localização consolidada, alto padrão construtivo e bom estado de conservação.
🧾 5. Diversificação: Imóveis/devedores, geográfica, inquilinos e segmentos de atuação.
🏬 6. Vacância: Física e Financeira preferencialmente baixas. WAULT longo aumenta previsibilidade.
📑 7. Qualidade dos Contratos: Atípicos (maior segurança), Típicos (exigem análise de risco). Índices de reajuste (IPCA/IGP-M).
🏦 8. Endividamento e Alavancagem: LTV idealmente < 30%. Custo da dívida compatível com retorno. Evitar concentração de vencimentos no curto prazo.
📄 9. FIIs de Papel (CRIs): Qualidade e rating, indexadores (IPCA+, CDI+), LTV < 70%, garantias (alienação fiduciária) e risco de crédito (diversificação).
🧑💼 10. Gestão e Governança: Histórico do gestor, transparência e alinhamento de interesses.
📊 11. Indicadores Específicos: Logístico (localização, vacância), Lajes (inquilinos, WAULT), Shoppings (vendas/m², fluxo), Papel (rating, garantias), Híbridos (equilíbrio).
🧑💼 12. Taxas: Administração (0,20%-0,80% competitiva, 0,80%-1,20% aceitável, >1,20% requer justificativa). Gestão (Tijolo 0,50%-1,00%, Papel 0,80%-1,50%). Performance (20% sobre benchmark com high water mark).

Estrutura da Resposta (Markdown):

# Análise Fundamentalista: ${data.ticker}

### 1. Tese de Investimento e Segmento
### 2. Valuation e Indicadores de Preço
### 3. Sustentabilidade dos Dividendos e Caixa
### 4. Análise do Portfólio, Vacância e Contratos
### 5. Endividamento (LTV) e Riscos de Crédito
### 6. Taxas, Gestão e Governança
### 7. Fatos Relevantes e Movimentações Recentes
### 8. Checklist de Risco (Resumo)
Apresente o checklist preenchido para este fundo:
- [ ] P/VP com desconto atrativo ou compatível
- [ ] Dividend Yield sólido e recorrente
- [ ] Alta liquidez
- [ ] Baixa vacância
- [ ] Boa diversificação
- [ ] LTV controlado
- [ ] Gestão qualificada e transparente
- [ ] WAULT longo
- [ ] Contratos indexados à inflação
- [ ] Taxas compatíveis com o mercado
### 9. Conclusão do Analista
- **Nota (0-10):** [Sua nota]
- **Classificação:** [Alta Aderência / Aderência Moderada / Baixa Aderência]
- **Veredito:** [Resumo crítico final]

Seja honesto e direto. Se o fundo for ruim, aponte os motivos claramente.
`;

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      setAnalysis(response.text || 'Não foi possível gerar a análise.');
      
      // Extract URLs
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedSources = chunks
          .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
          .map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title
          }));
        
        // Remove duplicates based on URI
        const uniqueSources = Array.from(new Map(extractedSources.map(item => [item.uri, item])).values());
        setSources(uniqueSources);
      }
    } catch (err: any) {
      console.error('Erro ao gerar análise:', err);
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota')) {
        setAnalysis('⚠️ Limite de requisições da IA atingido (Cota Excedida). Por favor, aguarde alguns minutos e tente novamente.');
      } else {
        setAnalysis('Erro ao gerar análise com IA. Verifique sua conexão ou tente novamente mais tarde.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">Análise Fundamentalista de FIIs</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Digite um ticker de Fundo Imobiliário para análise com IA</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => ticker.length >= 2 && setShowSuggestions(true)}
              placeholder="Ex: MXRF11, HGLG11, KNCR11"
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-slate-900 placeholder-slate-400 uppercase dark:text-slate-100  dark:border-slate-800  dark:bg-slate-800 "
              required
            />
            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                {isSearchingSuggestions ? (
                  <div className="p-4 flex items-center justify-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm font-medium">Buscando ativos...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map((item, index) => (
                      <button
                        key={`${item.ticker}-${index}`}
                        type="button"
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                          index === activeSuggestionIndex ? "bg-slate-50 dark:bg-slate-800" : ""
                        )}
                        onClick={() => {
                          isSelectingRef.current = true;
                          setTicker(item.ticker);
                          setShowSuggestions(false);
                          inputRef.current?.blur();
                          doSearch(item.ticker);
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden shrink-0">
                          {item.logourl ? (
                            <img src={item.logourl} alt={item.ticker} className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          ) : (
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.ticker.substring(0, 2)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{item.ticker}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                              {item.exchange || item.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{item.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm font-medium">
                    Nenhum ativo encontrado para "{ticker}"
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !ticker}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analisando...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Analisar</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {stockData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Dados Brutos */}
          <div className="col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                {stockData.logourl ? (
                  <img 
                    src={stockData.logourl} 
                    alt={`Logo ${stockData.ticker}`} 
                    className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-border shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <div className={`w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg shadow-sm ${stockData.logourl ? 'hidden' : ''}`}>
                  {stockData.ticker.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 ">{stockData.ticker}</h3>
                  <p className="text-sm text-slate-500">{stockData.name}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-slate-500 text-sm">Cotação Atual</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 "><AssetPrice price={stockData.price} currency={stockData.currency} ticker={stockData.ticker} /></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-slate-500 text-sm">P/VP</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 ">{stockData.pvp?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-slate-500 text-sm">Dividend Yield</span>
                  <span className="font-bold text-indigo-600">{stockData.dividendYield?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-slate-500 text-sm">Valor de Mercado</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 ">{stockData.currency} {((stockData.marketCap || 0) / 1e6).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-slate-500 text-sm">Liquidez Diária</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 ">{stockData.volume?.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-slate-500 text-sm">VPA (Valor Patrimonial)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 ">{stockData.currency} {stockData.bvps?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-slate-500 text-sm">Setor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 ">{stockData.industry || stockData.sector || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Patrimônio Líquido</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 ">{stockData.currency} {((stockData.marketCap || 0) / 1e6).toFixed(2)}M</span>
                </div>
              </div>
            </div>

            {/* Alertas Rápidos */}
            <div className="bg-amber-50 p-4 sm:p-6 rounded-2xl border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 text-amber-800 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <h4 className="font-bold text-sm uppercase tracking-wider">Checklist de Risco</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-300">
                  <div className={`w-2 h-2 rounded-full ${stockData.pvp > 1.1 ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span>P/VP: {stockData.pvp > 1.1 ? 'Ágio elevado' : stockData.pvp < 0.9 ? 'Desconto atraente' : 'Preço justo'}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-300">
                  <div className={`w-2 h-2 rounded-full ${stockData.dividendYield < 8 ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <span>Yield: {stockData.dividendYield < 8 ? 'Abaixo da média' : 'Rendimento sólido'}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-300">
                  <div className={`w-2 h-2 rounded-full ${stockData.volume < 500000 ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span>Liquidez: {stockData.volume < 500000 ? 'Baixa (Risco)' : 'Alta liquidez'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Análise da IA */}
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 h-full dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-border">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 ">Parecer do Especialista em FIIs (IA)</h3>
              </div>
              
              {analysis ? (
                <div className="space-y-8">
                  <div className="prose prose-slate dark:prose-invert prose-indigo max-w-none">
                    <Markdown>{analysis}</Markdown>
                  </div>
                  
                  <ReportAudioPlayer text={analysis} title={`Análise de ${ticker.toUpperCase()}`} colorTheme="emerald" />
                  
                  {/* Seção de Documentos */}
                  <div className="pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider dark:text-slate-200 ">Documentos Oficiais Recentes</h4>
                      {loadingDocs && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                    </div>
                    
                    {docError && !analyzingDoc && (
                      <div className="p-4 mb-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-center gap-2 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        {docError}
                      </div>
                    )}
                    
                    {documents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {documents.map((doc, idx) => (
                          <div key={idx} className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 p-2 rounded-lg ${doc.type === 'fato_relevante' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-foreground line-clamp-2">{doc.title}</p>
                                  <p className="text-xs text-slate-500">{doc.date}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-auto pt-2">
                              <button
                                onClick={() => setSelectedDocUrl(doc.url)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Ler
                              </button>
                              <button
                                onClick={() => analyzeDocument(doc)}
                                disabled={!!analyzingDoc}
                                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                              >
                                {analyzingDoc === doc.url ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <BrainCircuit className="w-3.5 h-3.5" />
                                )}
                                Analisar IA
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !loadingDocs && !docError && (
                      <p className="text-sm text-slate-500 italic">Nenhum documento recente encontrado automaticamente.</p>
                    )}
                  </div>

                  {/* Visualizador de PDF */}
                  {selectedDocUrl && (
                    <div className="pt-8 border-t border-border animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <FileText className="w-5 h-5" />
                          </div>
                          <h4 className="text-lg font-bold text-foreground">Visualização do Documento</h4>
                        </div>
                        <button 
                          onClick={() => setSelectedDocUrl(null)}
                          className="text-sm text-slate-500 hover:text-slate-800 font-medium"
                        >
                          Fechar Visualizador
                        </button>
                      </div>
                      <div className="aspect-[3/4] w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                        <iframe 
                          src={`/api/fii/proxy-pdf?url=${encodeURIComponent(selectedDocUrl)}`}
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                          className="w-full h-full border-none relative z-10 bg-white"
                          title="PDF Viewer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900 z-0">
                          <div className="max-w-xs">
                            <Loader2 className="w-8 h-8 text-indigo-500 mx-auto mb-4 animate-spin" />
                            <p className="text-slate-500 text-sm">
                              Carregando documento...
                            </p>
                            <p className="text-slate-400 text-xs mt-2">
                              Se o documento não aparecer em alguns segundos, tente o botão abaixo.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-center">
                        <a 
                          href={selectedDocUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline"
                        >
                          <Download className="w-4 h-4" />
                          Abrir em nova aba / Download Direto
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Resultado da Análise do Documento */}
                  {docAnalysisError && (
                    <div id="doc-analysis-error" className="pt-8 border-t border-border animate-in fade-in slide-in-from-top-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-red-800">Erro na Análise do Documento</p>
                          <p className="text-sm text-red-700">{docAnalysisError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {docAnalysis && (
                    <div id="doc-analysis-result" className="pt-8 border-t border-border animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                          <BrainCircuit className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-bold text-foreground">Análise Detalhada do Documento</h4>
                      </div>
                      
                      <div className="bg-indigo-50/50 p-4 sm:p-6 rounded-2xl border border-indigo-100 dark:bg-slate-800/50 dark:border-indigo-900/30">
                        <div className="prose prose-sm sm:prose-base prose-slate prose-indigo max-w-none dark:prose-invert">
                          <Markdown>{docAnalysis}</Markdown>
                        </div>
                        
                        <div className="mt-8">
                          <ReportAudioPlayer 
                            text={docAnalysis} 
                            title={`Análise de Documento - ${ticker.toUpperCase()}`} 
                            colorTheme="emerald" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {sources.length > 0 && (
                    <div className="pt-6 border-t border-border">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider dark:text-slate-200 ">Fontes Consultadas (Busca Web)</h4>
                      <ul className="space-y-2">
                        {sources.map((source, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-500 mt-1 text-xs">🔗</span>
                            <a 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline line-clamp-1"
                            >
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : analysisError === 'AUTH_REQUIRED' ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 max-w-md mx-auto h-full min-h-[300px]">
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-2xl text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100 dark:border-amber-500/25">
                    🔒
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Faça login para ver o Parecer da IA</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    Para visualizar o parecer automatizado completo e detalhado deste FII com busca na web em tempo real, você precisa estar cadastrado e logado.
                  </p>
                  <button
                    onClick={() => login()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    <span>Entrar no SimulaGrana</span>
                  </button>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Você ganhará 5 créditos diários grátis para usar nossa Inteligência Artificial!
                  </p>
                </div>
              ) : analysisError === 'CREDITS_EXHAUSTED' ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 max-w-md mx-auto h-full min-h-[300px]">
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center text-2xl text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-500/25 animate-bounce">
                    ⚠️
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Limite de IA Atingido</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    Seus 5 créditos de Inteligência Artificial para hoje foram totalmente consumidos.
                    Sua cota diária de pareceres será restaurada para mais 5 amanhã!
                  </p>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                    Sua cota renova à meia-noite (Horário de Brasília)
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p>O especialista está analisando relatórios e fatos relevantes...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {stockData && stockData.historicalPrices && stockData.historicalPrices.length > 0 && (
         <AssetComparisonChart stockData={stockData} ipcaAnual={4.5} />
      )}
    </div>
  );
}
