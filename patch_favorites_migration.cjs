const fs = require('fs');
let code = fs.readFileSync('src/contexts/FavoritesContext.tsx', 'utf8');

const regex = /const unique = merged\.filter\(\(item, index, self\) =>\s*self\.findIndex\(t => t\.ticker === item\.ticker\) === index\s*\);/;

const replacement = `let unique = merged.filter((item, index, self) => 
             self.findIndex(t => t.ticker === item.ticker) === index
          );
          
          // Migrate categories
          let migrated = false;
          unique = unique.map(f => {
            let newCat = f.category;
            if (f.category === 'ETFs') {
               newCat = (f.ticker.endsWith('.SA') || /^[A-Z0-9]{4}\\d{1,2}$/.test(f.ticker)) ? 'ETFs Nacionais' : 'ETFs Globais';
            } else if (f.category === 'FIIs' && f.name) {
               if (f.name.toUpperCase().includes('FIAGRO') || f.name.toUpperCase().includes('AGRO')) {
                 newCat = 'Fiagros';
               }
            }
            if (newCat !== f.category) {
              migrated = true;
              return { ...f, category: newCat };
            }
            return f;
          });`;

code = code.replace(regex, replacement);

const regex2 = /if \(unique\.length > firestoreFavs\.length\) \{/;
const replacement2 = `if (unique.length > firestoreFavs.length || migrated) {`;
code = code.replace(regex2, replacement2);

fs.writeFileSync('src/contexts/FavoritesContext.tsx', code);
