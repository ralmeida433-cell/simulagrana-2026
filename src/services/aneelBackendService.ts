import axios from 'axios';

export interface AneelTariff {
  concessionaria: string;
  uf: string;
  tarifa_cheia: number;
  fio_b: number;
  bandeira: string;
  data_atualizacao: string;
}

// Resource IDs from ANEEL Open Data (these are examples, usually need to be looked up)
// For this implementation, we will use the CKAN API to search for the latest residential tariffs
const ANEEL_API_BASE = 'https://dados.aneel.gov.br/api/3/action';
const TARIFF_RESOURCE_ID = 'fcf2906b-27ad-4b9d-a4af-3435a448c049'; // Example ID for "Tarifas de Distribuidoras"

const CONCESSIONAIRE_FALLBACKS: Record<string, string[]> = {
  'AC': ['ENERGISA AC'],
  'AL': ['EQUATORIAL AL'],
  'AM': ['AMAZONAS ENERGIA'],
  'AP': ['CEA'],
  'BA': ['COELBA'],
  'CE': ['ENEL CE'],
  'DF': ['NEOENERGIA BRASÍLIA'],
  'ES': ['EDP ES'],
  'GO': ['EQUATORIAL GO'],
  'MA': ['EQUATORIAL MA'],
  'MG': ['CEMIG', 'ENERGISA MG', 'DMED'],
  'MS': ['ENERGISA MS'],
  'MT': ['ENERGISA MT'],
  'PA': ['EQUATORIAL PA'],
  'PB': ['ENERGISA PB'],
  'PE': ['CELPE'],
  'PI': ['EQUATORIAL PI'],
  'PR': ['COPEL'],
  'RJ': ['LIGHT', 'ENEL RJ'],
  'RN': ['COSERN'],
  'RO': ['ENERGISA RO'],
  'RR': ['RORAIMA ENERGIA'],
  'RS': ['RGE', 'CEEE-D', 'EQUATORIAL RS'],
  'SC': ['CELESC'],
  'SE': ['ENERGISA SE'],
  'SP': ['ENEL SP', 'CPFL PAULISTA', 'CPFL PIRATININGA', 'ELEKTRO', 'EDP SP'],
  'TO': ['ENERGISA TO'],
};

export async function getConcessionaires(uf: string): Promise<string[]> {
  const ufUpper = uf.toUpperCase();
  try {
    const sql = `SELECT DISTINCT "SigAgente" from "${TARIFF_RESOURCE_ID}" WHERE "SigUF" = '${ufUpper}' AND "NomClasse" = 'Residencial' ORDER BY "SigAgente" ASC`;
    const response = await axios.get(`${ANEEL_API_BASE}/datastore_search_sql`, {
      params: { sql },
      timeout: 5000 // 5 seconds timeout
    });

    const records = response.data.result.records;
    if (records && records.length > 0) {
      return records.map((r: any) => r.SigAgente);
    }
  } catch (error) {
    console.error(`Error fetching concessionaires for ${ufUpper}:`, error);
  }

  // Always return fallbacks if API fails or returns empty
  return CONCESSIONAIRE_FALLBACKS[ufUpper] || [];
}

export async function getAneelData(query: string): Promise<AneelTariff | null> {
  let bandeira = 'VERDE';
  try {
    // 1. Fetch current Tariff Flag (Bandeira)
    // Usually available at a specific endpoint or scraped
    // For 2026 simulation, we'll default to VERDE if API fails
    try {
      const flagResponse = await axios.get('https://www.aneel.gov.br/bandeira-tarifaria', { timeout: 3000 });
      if (flagResponse.data.includes('AMARELA')) bandeira = 'AMARELA';
      else if (flagResponse.data.includes('VERMELHA PATAMAR 1')) bandeira = 'VERMELHA P1';
      else if (flagResponse.data.includes('VERMELHA PATAMAR 2')) bandeira = 'VERMELHA P2';
    } catch (e) {
      console.warn("Failed to fetch current flag, using default.");
    }

    // 2. Fetch Tariffs from ANEEL Open Data
    // We search for the concessionaire or UF in the dataset
    const sql = `SELECT * from "${TARIFF_RESOURCE_ID}" WHERE ("SigAgente" LIKE '%${query.toUpperCase()}%' OR "SigUF" = '${query.toUpperCase()}') AND "NomClasse" = 'Residencial' AND "SubClasse" = 'Residencial' ORDER BY "DatGeracao" DESC LIMIT 1`;
    
    try {
      const response = await axios.get(`${ANEEL_API_BASE}/datastore_search_sql`, {
        params: { sql },
        timeout: 5000
      });

      const records = response.data?.result?.records;

      if (records && records.length > 0) {
        const record = records[0];
        
        // ANEEL data often has TUSD and TE separated.
        // VlrTUSD and VlrTE are usually the base values.
        // We need to apply taxes (ICMS, PIS, COFINS) which vary by state.
        // For simplicity in this module, we'll use a standard tax multiplier if not provided in the record.
        const taxMultiplier = 1.25; // Average 25% tax
        
        const tusd = parseFloat(record.VlrTUSD || 0);
        const te = parseFloat(record.VlrTE || 0);
        const fioB = parseFloat(record.VlrFioB || 0);

        return {
          concessionaria: record.SigAgente,
          uf: record.SigUF,
          tarifa_cheia: Number(((tusd + te) * taxMultiplier).toFixed(4)),
          fio_b: Number((fioB * taxMultiplier).toFixed(4)),
          bandeira,
          data_atualizacao: new Date().toISOString().split('T')[0]
        };
      }
    } catch (e) {
      console.warn("Failed to fetch from ANEEL API, using fallback.");
    }

    // Fallback data if API doesn't return specific records (for demo/robustness)
    const fallbacks: Record<string, any> = {
      // States
      'MG': { concessionaria: 'CEMIG', tarifa: 0.92, fio_b: 0.28 },
      'SP': { concessionaria: 'ENEL SP', tarifa: 0.88, fio_b: 0.25 },
      'RJ': { concessionaria: 'LIGHT', tarifa: 0.95, fio_b: 0.30 },
      'PR': { concessionaria: 'COPEL', tarifa: 0.82, fio_b: 0.22 },
      'RS': { concessionaria: 'RGE', tarifa: 0.85, fio_b: 0.24 },
      'SC': { concessionaria: 'CELESC', tarifa: 0.78, fio_b: 0.20 },
      'BA': { concessionaria: 'COELBA', tarifa: 0.89, fio_b: 0.26 },
      'CE': { concessionaria: 'ENEL CE', tarifa: 0.87, fio_b: 0.24 },
      
      // Specific Concessionaires
      'CEMIG': { concessionaria: 'CEMIG', tarifa: 0.92, fio_b: 0.28 },
      'ENEL SP': { concessionaria: 'ENEL SP', tarifa: 0.88, fio_b: 0.25 },
      'CPFL PAULISTA': { concessionaria: 'CPFL PAULISTA', tarifa: 0.86, fio_b: 0.23 },
      'CPFL PIRATININGA': { concessionaria: 'CPFL PIRATININGA', tarifa: 0.87, fio_b: 0.24 },
      'ELEKTRO': { concessionaria: 'ELEKTRO', tarifa: 0.85, fio_b: 0.22 },
      'LIGHT': { concessionaria: 'LIGHT', tarifa: 0.95, fio_b: 0.30 },
      'ENEL RJ': { concessionaria: 'ENEL RJ', tarifa: 0.96, fio_b: 0.31 },
      'RGE': { concessionaria: 'RGE', tarifa: 0.85, fio_b: 0.24 },
      'CEEE-D': { concessionaria: 'CEEE-D', tarifa: 0.84, fio_b: 0.23 },
      'COPEL': { concessionaria: 'COPEL', tarifa: 0.82, fio_b: 0.22 },
      'CELESC': { concessionaria: 'CELESC', tarifa: 0.78, fio_b: 0.20 },
      'EQUATORIAL AL': { concessionaria: 'EQUATORIAL AL', tarifa: 0.89, fio_b: 0.26 },
      'AMAZONAS ENERGIA': { concessionaria: 'AMAZONAS ENERGIA', tarifa: 0.91, fio_b: 0.27 },
      'CEA': { concessionaria: 'CEA', tarifa: 0.88, fio_b: 0.25 },
      'COELBA': { concessionaria: 'COELBA', tarifa: 0.89, fio_b: 0.26 },
      'ENEL CE': { concessionaria: 'ENEL CE', tarifa: 0.87, fio_b: 0.24 },
      'NEOENERGIA BRASÍLIA': { concessionaria: 'NEOENERGIA BRASÍLIA', tarifa: 0.85, fio_b: 0.24 },
      'EDP ES': { concessionaria: 'EDP ES', tarifa: 0.86, fio_b: 0.23 },
      'EQUATORIAL GO': { concessionaria: 'EQUATORIAL GO', tarifa: 0.88, fio_b: 0.25 },
      'EQUATORIAL MA': { concessionaria: 'EQUATORIAL MA', tarifa: 0.90, fio_b: 0.27 },
      'ENERGISA MG': { concessionaria: 'ENERGISA MG', tarifa: 0.91, fio_b: 0.28 },
      'DMED': { concessionaria: 'DMED', tarifa: 0.85, fio_b: 0.24 },
      'ENERGISA MS': { concessionaria: 'ENERGISA MS', tarifa: 0.89, fio_b: 0.26 },
      'ENERGISA MT': { concessionaria: 'ENERGISA MT', tarifa: 0.90, fio_b: 0.27 },
      'EQUATORIAL PA': { concessionaria: 'EQUATORIAL PA', tarifa: 0.92, fio_b: 0.28 },
      'ENERGISA PB': { concessionaria: 'ENERGISA PB', tarifa: 0.88, fio_b: 0.25 },
      'CELPE': { concessionaria: 'CELPE', tarifa: 0.89, fio_b: 0.26 },
      'EQUATORIAL PI': { concessionaria: 'EQUATORIAL PI', tarifa: 0.91, fio_b: 0.27 },
      'COSERN': { concessionaria: 'COSERN', tarifa: 0.87, fio_b: 0.24 },
      'ENERGISA RO': { concessionaria: 'ENERGISA RO', tarifa: 0.89, fio_b: 0.26 },
      'RORAIMA ENERGIA': { concessionaria: 'RORAIMA ENERGIA', tarifa: 0.88, fio_b: 0.25 },
      'EQUATORIAL RS': { concessionaria: 'EQUATORIAL RS', tarifa: 0.86, fio_b: 0.24 },
      'ENERGISA SE': { concessionaria: 'ENERGISA SE', tarifa: 0.87, fio_b: 0.24 },
      'EDP SP': { concessionaria: 'EDP SP', tarifa: 0.86, fio_b: 0.23 },
      'ENERGISA TO': { concessionaria: 'ENERGISA TO', tarifa: 0.89, fio_b: 0.26 },
    };

    const queryUpper = query.toUpperCase();
    const fallback = fallbacks[queryUpper];
    if (fallback) {
      return {
        ...fallback,
        uf: fallback.uf || queryUpper,
        tarifa_cheia: fallback.tarifa,
        bandeira,
        data_atualizacao: new Date().toISOString().split('T')[0]
      };
    }

    // If no fallback found, return a generic one
    return {
      concessionaria: queryUpper,
      uf: 'BR',
      tarifa_cheia: 0.92,
      fio_b: 0.25,
      bandeira,
      data_atualizacao: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error fetching ANEEL data:', error);
    return null;
  }
}
