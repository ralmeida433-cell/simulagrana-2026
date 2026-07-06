import axios from 'axios';

const PLUGGY_API_URL = 'https://api.pluggy.ai';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getPluggyToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.PLUGGY_CLIENT_ID || process.env.VITE_PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET || process.env.VITE_PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PLUGGY_CLIENT_ID or PLUGGY_CLIENT_SECRET not configured');
  }

  const response = await axios.post(`${PLUGGY_API_URL}/auth`, {
    clientId,
    clientSecret,
  });

  cachedToken = response.data.apiKey;
  // Tokens usually last 24h, but let's refresh every 12h to be safe
  tokenExpiry = Date.now() + 12 * 60 * 60 * 1000;
  return cachedToken;
}

export async function createConnectToken(itemId?: string) {
  const token = await getPluggyToken();
  const response = await axios.post(
    `${PLUGGY_API_URL}/connect_token`,
    { itemId },
    { headers: { 'X-API-KEY': token } }
  );
  return response.data;
}

export async function getPluggyItem(itemId: string) {
  const token = await getPluggyToken();
  const response = await axios.get(`${PLUGGY_API_URL}/items/${itemId}`, {
    headers: { 'X-API-KEY': token },
  });
  return response.data;
}

export async function getPluggyAccounts(itemId: string) {
  const token = await getPluggyToken();
  const response = await axios.get(`${PLUGGY_API_URL}/accounts`, {
    params: { itemId },
    headers: { 'X-API-KEY': token },
  });
  return response.data.results;
}

export async function getPluggyTransactions(accountId: string) {
  const token = await getPluggyToken();
  const response = await axios.get(`${PLUGGY_API_URL}/transactions`, {
    params: { accountId },
    headers: { 'X-API-KEY': token },
  });
  return response.data.results;
}
