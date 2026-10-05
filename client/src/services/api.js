const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const token = localStorage.getItem('sk_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok && !data.success) {
    const error = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.code = data.code;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Market
  getMarketOverview: () => request('/market/overview'),
  getIndices: () => request('/market/indices'),
  getGainers: () => request('/market/gainers'),
  getLosers: () => request('/market/losers'),
  getMarketStatus: () => request('/market/status'),
  getFiiDii: () => request('/market/fii-dii'),
  getGlobalMarkets: () => request('/market/global'),
  getSectorHeatmap: () => request('/market/heatmap'),
  getCorporateCalendar: (type = 'all') => request(`/market/calendar?type=${type}`),
  getScreener: (preset = 'all') => request(`/market/screener?preset=${preset}`),

  // Stocks
  getStocks: (search = '', sector = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sector) params.append('sector', sector);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/stocks${query}`);
  },
  getStockQuote: (symbol) => request(`/stocks/${symbol}`),
  getStockHistory: (symbol, timeframe = '1D') => request(`/stocks/${symbol}/history?timeframe=${timeframe}`),
  getStockNews: (symbol) => request(`/stocks/${symbol}/news`),
  refreshStock: (symbol) => request(`/stocks/${symbol}/refresh`, { method: 'POST' }),

  // IPOs
  getIPOs: (status = 'all') => request(`/ipos?status=${status}`),
  getIPODetail: (slug) => request(`/ipos/${slug}`),
  getGMP: (slug) => request(`/ipos/${slug}/gmp`),
  refreshIPO: (slug) => request(`/ipos/${slug}/refresh`, { method: 'POST' }),
  syncLiveIPOs: () => request('/ipos/sync-live', { method: 'POST' }),

  // News
  getNews: (symbol = '', category = '') => {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    if (category) params.append('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/news${query}`);
  },

  // Watchlist
  getWatchlist: () => request('/watchlists'),
  addToWatchlist: (symbol) => request('/watchlists', { method: 'POST', body: JSON.stringify({ symbol }) }),
  removeFromWatchlist: (symbol) => request(`/watchlists/${symbol}`, { method: 'DELETE' }),

  // AI Research
  chatAI: (query, context = {}) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ query, context }) }),
  analyzeStock: (symbol) => request('/ai/stock-analysis', { method: 'POST', body: JSON.stringify({ symbol }) }),
  analyzeIPO: (slug) => request('/ai/ipo-analysis', { method: 'POST', body: JSON.stringify({ slug }) }),
  compareStocks: (symbol1, symbol2) => request('/ai/compare', { method: 'POST', body: JSON.stringify({ symbol1, symbol2 }) })
};
