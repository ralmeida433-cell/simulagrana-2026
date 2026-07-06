# SIMULAGRANA_CONTEXT.md
## Gerado automaticamente por análise de código em 31 de Março de 2026

## 1. VISÃO GERAL
O **SimulaGrana** é uma plataforma full-stack de simulação financeira e análise de investimentos, focada principalmente no mercado brasileiro (B3), mas com suporte a ativos internacionais (EUA). A aplicação combina calculadoras de valuation (Graham, Bazin, Barsi, Peter Lynch), simuladores de renda fixa e variável, inteligência artificial para análise de ativos e um dashboard de monitoramento de mercado em tempo real.

## 2. STACK TÉCNICA
Baseado no `package.json` e análise de código:
- **Frontend:**
  - **Framework:** React 18+ com Vite.
  - **Estilização:** Tailwind CSS (com suporte a temas Dark e Contraste).
  - **Animações:** Framer Motion (`motion/react`).
  - **Gráficos:** Recharts (Line, Bar, Area, Composed charts).
  - **Ícones:** Lucide-react.
  - **Manipulação de Datas:** date-fns.
  - **Markdown:** react-markdown.
- **Backend:**
  - **Runtime:** Node.js com Express.
  - **Execução:** tsx (TypeScript Execute).
  - **Integrações:** Axios para requisições externas.
- **IA:**
  - **SDK:** `@google/genai` (Google Gemini API).
- **Dados Financeiros:**
  - `yahoo-finance2` (Mercado Americano).
  - `ofx-js` (Parsing de extratos bancários).
  - `pdf-parse` / `pdfjs-dist` (Análise de documentos PDF).

## 3. ESTRUTURA DE PASTAS
```text
/
├── server.ts                # Servidor Express e rotas de API
├── package.json             # Dependências e scripts
├── src/
│   ├── App.tsx              # Componente principal e roteamento
│   ├── main.tsx             # Ponto de entrada React
│   ├── index.css            # Estilos globais e variáveis de tema
│   ├── components/          # Componentes de UI e Layout
│   │   ├── calculators/     # Módulos específicos de cálculo
│   │   ├── ui/              # Componentes base (shadcn/ui style)
│   │   ├── Dashboard.tsx    # Visão geral do mercado
│   │   └── Pesquisa.tsx     # Busca detalhada de ativos
│   ├── services/            # Lógica de integração com APIs
│   │   ├── aiService.ts     # Interface com Gemini API
│   │   ├── financeService.ts# Dados macro (Selic, IPCA, etc)
│   │   └── stockService.ts  # Dados de ações e FIIs
│   ├── hooks/               # Hooks customizados (ex: useMarketHistory)
│   └── lib/                 # Utilitários (formatadores, tailwind-merge)
```

## 4. MÓDULOS E PÁGINAS
- **Dashboard:** Exibe tendências de mercado (Maiores Altas/Baixas), Heatmap e um Feed de notícias gerado por IA.
- **Calculadoras de Valuation:**
  - **Graham:** Valor intrínseco baseado em lucro e valor patrimonial.
  - **Bazin:** Preço justo baseado em dividendos e yield desejado.
  - **Barsi:** Preço teto para garantir rentabilidade mínima em dividendos.
  - **Peter Lynch:** Classificação de empresas e cálculo de PEG Ratio.
- **Simuladores de Patrimônio:**
  - **Juros Compostos:** Evolução de patrimônio com aportes mensais e inflação.
  - **Renda Fixa:** Comparativo entre CDB, LCI e LCA com impostos.
  - **Número Mágico:** Cálculo de cotas necessárias para viver de renda com FIIs.
- **Calculadoras de Utilidade:**
  - **Financiamento:** Simulação SAC/PRICE com guia de amortização.
  - **Energia Solar:** Cálculo de ROI e economia com painéis fotovoltaicos.
  - **Veículo:** Comparativo entre compra, financiamento e assinatura.
  - **MEI:** Cálculo de impostos e faturamento para microempreendedores.
- **Pesquisa:** Ferramenta de busca profunda que traz dados fundamentalistas, históricos e análise de IA para qualquer ticker da B3 ou EUA.

## 5. APIS E INTEGRAÇÕES
- **Brapi (brapi.dev):** Principal fonte para dados da B3 (Ações, FIIs, Índices, Radar, Heatmap).
- **AwesomeAPI:** Cotação de moedas em tempo real (USD-BRL).
- **BCB (Banco Central do Brasil):** Séries temporais de Selic, IPCA, INPC e Salário Mínimo.
- **Yahoo Finance:** Dados de mercado internacional e fallback para indicadores específicos.
- **Google Gemini:** Geração de análises fundamentalistas, resumos de notícias e extração de dados de PDFs.
- **TradingView:** Fallback para logotipos de empresas via CDN.

## 6. VARIÁVEIS DE AMBIENTE
Identificadas no código:
- `BRAPI_TOKEN` / `VITE_BRAPI_TOKEN`: Token para acesso à API Brapi.
- `GEMINI_API_KEY`: Chave para os serviços de Inteligência Artificial.
- `NODE_ENV`: Define o ambiente de execução (development/production).

## 7. IDENTIDADE VISUAL
- **Cores Base:**
  - **Primary:** `#00c17c` (Verde esmeralda financeiro).
  - **Background:** Tons de cinza ultra-claro (Light) e azul-escuro profundo (Dark).
- **Tipografia:**
  - **Heading/Sans:** 'DM Sans' e 'Geist Variable'.
- **Temas:** Implementação via classes CSS (`.dark`, `.theme-contrast`) e variáveis OKLCH para alta fidelidade de cor.

## 8. LÓGICAS DE CÁLCULO
- **Fórmula de Graham:** `Raiz Quadrada de (22.5 * Lucro por Ação * Valor Patrimonial por Ação)`.
- **Preço Justo Bazin:** `Dividendos Anuais / (Yield Desejado / 100)`.
- **Preço Teto Barsi:** `(Preço Atual * Dividend Yield Atual) / Yield Alvo`.
- **PEG Ratio (Lynch):** `P/L / Taxa de Crescimento Anual (CAGR)`.
- **Juros Compostos:** `M = P(1 + i)^n + PMT[((1 + i)^n - 1) / i]`.
- **Renda Fixa:** Aplicação da tabela regressiva de IR (22.5% a 15%) baseada no prazo em dias.

## 9. PADRÕES DE CÓDIGO
- **Componentização:** Uso intensivo de componentes funcionais e hooks (`useState`, `useMemo`, `useEffect`).
- **Resiliência de API:** Implementação de `AbortController` e timeouts em requisições críticas para evitar travamentos de UI.
- **Acessibilidade:** Suporte a modo de alto contraste e atalhos de teclado (Ctrl+I, Ctrl+D, F11).
- **Visualização:** Abstração de gráficos complexos usando Recharts com wrappers responsivos.
- **Segurança:** Chaves de API nunca expostas diretamente no código-fonte (uso de `.env`).

## 10. PROBLEMAS CONHECIDOS / NOTAS TÉCNICAS
- **Dependência de Token:** Calculadoras de ações falham silenciosamente ou mostram avisos se o `BRAPI_TOKEN` não estiver configurado.
- **Limites de API:** Algumas rotas do Banco Central podem sofrer instabilidade (tratado com `DEFAULT_DATA` no `financeService`).
- **Cálculos Simplificados:** Algumas métricas (como o score de consistência no Bazin) utilizam lógicas simplificadas ou parciais baseadas nos dados disponíveis.
- **Timeout de Radar:** A busca de dados do radar no servidor tem um timeout de 10s para evitar gargalos com a API Brapi.

## 11. COMO USAR ESTE ARQUIVO
Este documento serve como a "Fonte da Verdade" para o desenvolvimento e manutenção do SimulaGrana. Qualquer alteração estrutural ou adição de nova lógica de cálculo deve ser refletida aqui para manter a documentação sincronizada com o código.
