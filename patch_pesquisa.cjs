const fs = require('fs');
let code = fs.readFileSync('src/components/Pesquisa.tsx', 'utf8');

const regex = /const getAssetCategory = \(type: string, symbol: string\): AssetCategory => \{([\s\S]*?)return 'Ações BR';\n  \};/;
const replacement = `const getAssetCategory = (type: string, symbol: string, name: string = ''): AssetCategory => {
    if (type === 'fund' && symbol.length >= 4) {
      if (name.toUpperCase().includes('FIAGRO') || name.toUpperCase().includes('AGRO')) return 'Fiagros';
      return 'FIIs';
    }
    if (type === 'etf') {
      return (symbol.endsWith('.SA') || !US_STOCK_DOMAINS[symbol.toUpperCase()]) ? 'ETFs Nacionais' : 'ETFs Globais';
    }
    if (type === 'stock' || type === 'bdr') return symbol.endsWith('.SA') || /^[A-Z0-9]{4}\\d{1,2}$/.test(symbol) ? 'Ações BR' : 'Ações EUA';
    return 'Ações BR';
  };`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/Pesquisa.tsx', code);
