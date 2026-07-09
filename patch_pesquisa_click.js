const fs = require('fs');
let code = fs.readFileSync('src/components/Pesquisa.tsx', 'utf8');

code = code.replace(/getAssetCategory\(assetData\.type, assetData\.symbol\)/g, "getAssetCategory(assetData.type, assetData.symbol, assetData.longName || assetData.shortName)");
fs.writeFileSync('src/components/Pesquisa.tsx', code);
