const fs = require('fs');
let code = fs.readFileSync('src/components/Favoritos.tsx', 'utf8');

code = code.replace(
  "const categories: (AssetCategory | 'Todos')[] = ['Todos', 'Ações BR', 'Ações EUA', 'ETFs', 'FIIs', 'REITs'];",
  "const categories: (AssetCategory | 'Todos')[] = Array.from(new Set(['Todos', 'Ações BR', 'Ações EUA', 'ETFs Nacionais', 'ETFs Globais', 'FIIs', 'Fiagros', 'REITs', ...favorites.map(f => f.category)]));"
);
fs.writeFileSync('src/components/Favoritos.tsx', code);
