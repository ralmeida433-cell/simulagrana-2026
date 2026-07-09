const fs = require('fs');
let code = fs.readFileSync('src/contexts/FavoritesContext.tsx', 'utf8');

const regex = /setFavorites\(JSON\.parse\(saved\)\);/;

const replacement = `let parsed = JSON.parse(saved);
          let migrated = false;
          parsed = parsed.map(f => {
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
          });
          if (migrated) {
            localStorage.setItem('simulagrana_favorites', JSON.stringify(parsed));
          }
          setFavorites(parsed);`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/contexts/FavoritesContext.tsx', code);
