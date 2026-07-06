# 💰 SimulaGrana

**SimulaGrana** é uma plataforma completa de simulação e análise financeira, desenvolvida para ajudar investidores e entusiastas das finanças a tomarem decisões baseadas em dados, metodologias comprovadas e inteligência artificial.

---

## 🚀 Funcionalidades Principais

### 📈 Investimentos & Ações
- **Valuation Graham**: Calcule o valor intrínseco de ações usando a fórmula de Benjamin Graham.
- **Dividendos Bazin**: Identifique oportunidades de dividendos com o método de Décio Bazin.
- **Peter Lynch (PEG Ratio)**: Avalie o crescimento de empresas com a métrica de Peter Lynch.
- **Método Luiz Barsi**: Simule a estratégia do maior investidor individual do Brasil.
- **Magic Number FII**: Descubra quantas cotas de um FII você precisa para que os dividendos comprem uma nova cota.
- **Análise Fundamentalista**: Dados detalhados de ações e FIIs em tempo real.
- **Análise de FIIs (IA)**: Use o poder do Google Gemini para analisar relatórios e dados de Fundos Imobiliários.

### 🏦 Renda Fixa & Aposentadoria
- **Simulador de Renda Fixa**: Compare CDB, LCI e LCA com taxas reais.
- **Tesouro Direto**: Projeções detalhadas para títulos do Tesouro Nacional.
- **Juros Compostos**: Visualize o poder do tempo sobre o seu dinheiro.

### 🚗 Bens & Financiamentos
- **Depreciação de Veículos**: Entenda a desvalorização do seu carro ao longo do tempo.
- **Elétrico vs Gasolina**: Compare a economia real entre veículos a combustão e elétricos.
- **Simulador de Financiamento**: Analise parcelas, juros e amortizações.
- **Energia Solar**: Calcule o payback e a economia de instalar painéis solares.

### 💼 Negócios & Ferramentas
- **Simulador Tributário Pro (MEI)**: Gestão e simulação de impostos para Microempreendedores Individuais.
- **Conectar Carteira**: Integração via Pluggy para visualizar suas contas e transações reais.
- **Guia de Amortização Didático**: Explicações claras sobre a diferença entre reduzir prazo vs. prestação.
- **Dashboard em Tempo Real**: Acompanhe Selic, IPCA, Dólar e principais índices do mercado.
- **Modo Criador**: Ferramentas integradas para gravação de tela e áudio, ideal para produtores de conteúdo financeiro.

---

## 💰 Monetização & AdSense

O **SimulaGrana** foi projetado seguindo as melhores práticas para aprovação no Google AdSense:

1.  **Conteúdo de Valor**: Ferramentas úteis e exclusivas que retêm o usuário.
2.  **Páginas Legais**: Links para [Política de Privacidade](/privacy) e [Termos de Uso](/terms) integrados.
3.  **Aviso Legal**: Disclaimer financeiro obrigatório presente em todas as páginas.
4.  **UX Limpa**: Espaços reservados para anúncios que não prejudicam a usabilidade.

Para ativar o AdSense:
1.  Adicione seu `data-ad-client` no arquivo `index.html`.
2.  Insira os blocos de anúncios nos componentes desejados (ex: `Sidebar` ou `Footer`).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Express](https://expressjs.com/), [Node.js](https://nodejs.org/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **IA**: [Google Gemini API](https://ai.google.dev/)
- **Dados Financeiros**: Yahoo Finance, Brapi, AwesomeAPI, Banco Central do Brasil.
- **Open Finance**: [Pluggy](https://pluggy.ai/)
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## ⚙️ Configuração Local

### Pré-requisitos
- Node.js (v18 ou superior)
- NPM ou Yarn

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/ralmeida433-cell/Sumulagrana.git
   cd Sumulagrana
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto e adicione suas chaves:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   BRAPI_TOKEN=seu_token_aqui
   PLUGGY_CLIENT_ID=seu_id_aqui
   PLUGGY_CLIENT_SECRET=seu_secret_aqui
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

O aplicativo estará disponível em `http://localhost:3000`.

---

## 📦 Deploy

O projeto está configurado para deploy na **Vercel**. 
As rotas de API são tratadas como *Serverless Functions* através do arquivo `server.ts`.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## ⚠️ Aviso Legal

O **SimulaGrana** é uma ferramenta educacional e de simulação. As informações apresentadas não constituem recomendação de compra, venda ou manutenção de ativos financeiros. Decisões de investimento devem ser tomadas com base em sua própria análise ou com o auxílio de um profissional certificado.
