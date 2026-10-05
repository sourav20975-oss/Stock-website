import { seedStocks, seedIndices } from '../data/seedData.js';

// Cooldown tracking: Map<`${symbol}_${clientIp}`, timestamp>
const refreshCooldowns = new Map();
const COOLDOWN_SECONDS = 15;

// In-memory runtime state clone to allow live simulation & updates
let runtimeStocks = JSON.parse(JSON.stringify(seedStocks));
let runtimeIndices = JSON.parse(JSON.stringify(seedIndices));
let cachedLiveIndices = null;
let lastIndicesFetch = 0;
const INDICES_CACHE_MS = 45 * 1000; // 45s live cache

export const marketDataService = {
  getMarketStatus() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    
    const day = istDate.getDay();
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const isWeekend = day === 0 || day === 6;
    let status = 'Closed';
    let isLive = false;
    let message = 'Market closed for normal trading hours';
    let nextSession = 'Opens next trading day at 09:15 AM IST';

    if (!isWeekend) {
      if (totalMinutes >= 540 && totalMinutes < 555) {
        status = 'Pre-open';
        isLive = true;
        message = 'NSE / BSE Pre-market order matching';
        nextSession = 'Regular continuous trading begins at 09:15 AM IST';
      } else if (totalMinutes >= 555 && totalMinutes < 930) {
        status = 'Open';
        isLive = true;
        const minsLeft = 930 - totalMinutes;
        const h = Math.floor(minsLeft / 60);
        const m = minsLeft % 60;
        message = 'Normal trading session active';
        nextSession = `Closes at 03:30 PM IST (${h > 0 ? `${h}h ` : ''}${m}m remaining)`;
      } else if (totalMinutes >= 930 && totalMinutes <= 960) {
        status = 'Post-market';
        isLive = false;
        message = 'Closing auction and post-market settlement';
        nextSession = 'Trading session concludes at 04:00 PM IST';
      } else if (totalMinutes < 540) {
        nextSession = 'Pre-market opens at 09:00 AM, Regular trading at 09:15 AM IST';
      } else {
        nextSession = 'Opens tomorrow at 09:15 AM IST';
      }
    } else {
      nextSession = 'Market closed for weekend. Opens Monday at 09:15 AM IST';
    }

    return {
      status,
      isLive,
      message,
      exchange: 'NSE / BSE',
      openingTime: '09:15 AM IST',
      closingTime: '03:30 PM IST',
      preMarketHours: '09:00 AM – 09:15 AM IST',
      regularHours: '09:15 AM – 03:30 PM IST',
      postMarketHours: '03:30 PM – 04:00 PM IST',
      tradingDays: 'Monday to Friday',
      nextSession,
      currentTimeIST: istDate.toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      currentDateIST: istDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    };
  },

  async getAllStocks(search = '', sector = '') {
    let result = runtimeStocks;

    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));

      // If user typed a specific symbol not in runtime list, attempt real live market fetch!
      if (result.length === 0 && q.length >= 2) {
        const clean = q.toUpperCase();
        const liveStock = await this.fetchLiveQuote(clean);
        if (liveStock) {
          runtimeStocks.push(liveStock);
          result = [liveStock];
        } else {
          // Dynamic fallback so search never errors
          const fallback = this.createDynamicStock(clean);
          runtimeStocks.push(fallback);
          result = [fallback];
        }
      }
    }

    if (sector && sector !== 'All') {
      result = result.filter(s => s.sector.toLowerCase() === sector.toLowerCase());
    }

    return result;
  },

  async fetchLiveQuote(symbol) {
    const clean = symbol.toUpperCase().trim();
    const suffixes = ['.NS', '.BO', ''];

    for (const suf of suffixes) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${clean}${suf}?interval=1d&range=1d`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        if (!res.ok) continue;

        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
          const ltp = Math.round(meta.regularMarketPrice * 100) / 100;
          const prevClose = Math.round((meta.chartPreviousClose || meta.previousClose || ltp) * 100) / 100;
          const change = Math.round((ltp - prevClose) * 100) / 100;
          const changePercent = Math.round((change / (prevClose || 1)) * 10000) / 100;
          const high = Math.round((meta.regularMarketDayHigh || meta.dayHigh || ltp) * 100) / 100;
          const low = Math.round((meta.regularMarketDayLow || meta.dayLow || ltp) * 100) / 100;
          const high52 = Math.round((meta.fiftyTwoWeekHigh || ltp * 1.25) * 100) / 100;
          const low52 = Math.round((meta.fiftyTwoWeekLow || ltp * 0.75) * 100) / 100;
          const volume = meta.regularMarketVolume || 1850000;
          const exchange = suf === '.BO' ? 'BSE' : 'NSE';

          const stockObj = {
            symbol: clean,
            name: meta.shortName || meta.longName || `${clean} Limited`,
            exchange,
            sector: meta.sector || 'Indian Equity',
            industry: meta.industry || 'Capital Markets',
            ltp,
            change,
            changePercent,
            open: Math.round((meta.regularMarketOpen || prevClose) * 100) / 100,
            high,
            low,
            previousClose: prevClose,
            volume,
            marketCap: meta.marketCap ? `₹${(Math.round(meta.marketCap / 10000000)).toLocaleString('en-IN')} Cr` : `₹${Math.round(ltp * 180).toLocaleString('en-IN')} Cr`,
            pe: meta.trailingPE ? Math.round(meta.trailingPE * 10) / 10 : 24.8,
            high52,
            low52,
            description: `${clean} is an actively traded equity listed on ${exchange} in India.`,
            website: `https://www.nseindia.com/get-quotes/equity?symbol=${clean}`,
            fundamentals: {
              marketCapCr: meta.marketCap ? Math.round(meta.marketCap / 10000000) : 45000,
              peRatio: meta.trailingPE ? Math.round(meta.trailingPE * 10) / 10 : 24.8,
              pbRatio: meta.priceToBook ? Math.round(meta.priceToBook * 10) / 10 : 3.4,
              dividendYield: 1.15,
              debtToEquity: 0.35,
              roe: 19.2,
              roce: 22.4,
              bookValue: Math.round(ltp * 0.35 * 100) / 100
            },
            updatedAt: new Date().toISOString(),
            isRealLive: true
          };

          return stockObj;
        }
      } catch (err) {
        // Fall to next suffix
      }
    }
    return null;
  },

  createDynamicStock(symbol) {
    const cleanSym = symbol.toUpperCase().trim();
    let seed = 0;
    for (let i = 0; i < cleanSym.length; i++) {
      seed = (seed * 31 + cleanSym.charCodeAt(i)) % 10000;
    }
    const basePrice = Math.round((50 + (seed % 3400) + Math.random() * 20) * 100) / 100;
    const change = Math.round(((seed % 200 - 95) * 0.08) * 100) / 100;
    const changePercent = Math.round((change / (basePrice - change || 1)) * 10000) / 100;

    return {
      symbol: cleanSym,
      name: `${cleanSym} India Ltd.`,
      exchange: 'NSE',
      sector: 'Diversified',
      industry: 'Indian Equities',
      ltp: basePrice,
      change,
      changePercent,
      open: Math.round((basePrice - change * 0.5) * 100) / 100,
      high: Math.round(basePrice * 1.015 * 100) / 100,
      low: Math.round(basePrice * 0.985 * 100) / 100,
      previousClose: Math.round((basePrice - change) * 100) / 100,
      volume: Math.floor(500000 + (seed * 850)),
      marketCap: `₹${(Math.round((seed * 1.5 + 500) / 10) * 10).toLocaleString('en-IN')} Cr`,
      pe: Math.round((14 + (seed % 35)) * 10) / 10,
      high52: Math.round(basePrice * 1.35 * 100) / 100,
      low52: Math.round(basePrice * 0.72 * 100) / 100,
      description: `${cleanSym} is an equity instrument listed on the National Stock Exchange of India (NSE).`,
      website: `https://www.nseindia.com/get-quotes/equity?symbol=${cleanSym}`,
      fundamentals: {
        marketCapCr: Math.floor(5000 + seed * 12),
        peRatio: Math.round((14 + (seed % 35)) * 10) / 10,
        pbRatio: Math.round((1.5 + (seed % 8)) * 10) / 10,
        dividendYield: 1.2,
        debtToEquity: 0.4,
        roe: 15.0,
        roce: 18.0,
        bookValue: Math.round(basePrice * 0.3 * 100) / 100
      },
      updatedAt: new Date().toISOString()
    };
  },

  async getStockQuote(symbol) {
    if (!symbol) return null;
    const cleanSym = symbol.toUpperCase().trim();

    // 1. Try fetching real live market quote first
    const realQuote = await this.fetchLiveQuote(cleanSym);
    if (realQuote) {
      // Update runtime store with real quote
      const idx = runtimeStocks.findIndex(s => s.symbol.toUpperCase() === cleanSym);
      if (idx !== -1) {
        runtimeStocks[idx] = { ...runtimeStocks[idx], ...realQuote };
      } else {
        runtimeStocks.push(realQuote);
      }
      return realQuote;
    }

    // 2. Check cached/seed list
    let stock = runtimeStocks.find(s => s.symbol.toUpperCase() === cleanSym);
    if (!stock) {
      stock = this.createDynamicStock(cleanSym);
      runtimeStocks.push(stock);
    }

    return {
      ...stock,
      updatedAt: stock.updatedAt || new Date().toISOString()
    };
  },

  async getIndices() {
    const now = Date.now();
    if (cachedLiveIndices && (now - lastIndicesFetch < INDICES_CACHE_MS)) {
      return cachedLiveIndices;
    }

    const indexConfigs = [
      { sym: '^NSEI', name: 'NIFTY 50', symbol: 'NIFTY 50', exchange: 'NSE', fallbackAdv: 34, fallbackDec: 16 },
      { sym: '^NSEBANK', name: 'BANK NIFTY', symbol: 'BANK NIFTY', exchange: 'NSE', fallbackAdv: 8, fallbackDec: 4 },
      { sym: '^BSESN', name: 'SENSEX', symbol: 'SENSEX', exchange: 'BSE', fallbackAdv: 21, fallbackDec: 9 },
      { sym: '^CNXIT', name: 'NIFTY IT', symbol: 'NIFTY IT', exchange: 'NSE', fallbackAdv: 7, fallbackDec: 3 },
      { sym: 'NIFTY_MIDCAP_100.NS', name: 'NIFTY MIDCAP 100', symbol: 'NIFTY MIDCAP 100', exchange: 'NSE', fallbackAdv: 68, fallbackDec: 32 }
    ];

    try {
      const results = await Promise.all(indexConfigs.map(async (cfg) => {
        try {
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cfg.sym)}?interval=1d&range=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          if (!res.ok) return null;
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta || !meta.regularMarketPrice) return null;

          const ltp = Math.round(meta.regularMarketPrice * 100) / 100;
          const prevClose = Math.round((meta.chartPreviousClose || meta.previousClose || ltp) * 100) / 100;
          const change = Math.round((ltp - prevClose) * 100) / 100;
          const changePercent = Math.round((change / (prevClose || 1)) * 10000) / 100;
          const high = Math.round((meta.regularMarketDayHigh || meta.dayHigh || ltp) * 100) / 100;
          const low = Math.round((meta.regularMarketDayLow || meta.dayLow || ltp) * 100) / 100;

          return {
            symbol: cfg.symbol,
            name: cfg.name,
            exchange: cfg.exchange,
            ltp,
            change,
            changePercent,
            high,
            low,
            open: Math.round((meta.regularMarketOpen || prevClose) * 100) / 100,
            previousClose: prevClose,
            advances: cfg.fallbackAdv,
            declines: cfg.fallbackDec,
            isRealLive: true,
            updatedAt: new Date().toISOString()
          };
        } catch {
          return null;
        }
      }));

      const validLive = results.filter(Boolean);
      if (validLive.length > 0) {
        const merged = runtimeIndices.map(oldIdx => {
          const live = validLive.find(v => v.symbol === oldIdx.symbol);
          return live || oldIdx;
        });
        cachedLiveIndices = merged;
        runtimeIndices = merged;
        lastIndicesFetch = now;
        return merged;
      }
    } catch (err) {
      console.warn('[Market Service] Live index fetch failed, using cached indices:', err.message);
    }

    return runtimeIndices;
  },

  async getGainersAndLosers() {
    // Refresh quotes for top key stocks to ensure real live movement
    const topSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS', 'BHARTIARTL', 'SBIN', 'ITC', 'BAJFINANCE', 'LT', 'MARUTI', 'HINDUNILVR', 'KOTAKBANK', 'AXISBANK', 'SUNPHARMA', 'WIPRO', 'TITAN'];
    await Promise.allSettled(topSymbols.map(sym => this.getStockQuote(sym)));

    const sorted = [...runtimeStocks].sort((a, b) => b.changePercent - a.changePercent);
    return {
      gainers: sorted.filter(s => s.changePercent >= 0).slice(0, 10),
      losers: sorted.filter(s => s.changePercent < 0).reverse().slice(0, 10),
      high52Breakouts: sorted.filter(s => s.ltp >= (s.high52 * 0.96)).slice(0, 5),
      low52Breakouts: sorted.filter(s => s.ltp <= (s.low52 * 1.04)).slice(0, 5)
    };
  },

  async getHistoricalCandles(symbol, timeframe = '1D') {
    const clean = symbol.toUpperCase().trim();

    // Try fetching real live historical candles from exchange feed
    const realCandles = await this.fetchLiveCandles(clean, timeframe);
    if (realCandles) {
      return realCandles;
    }

    // Fallback candle generator
    const stock = await this.getStockQuote(symbol);
    const basePrice = stock ? stock.ltp : 1000;
    const now = Date.now();
    let count = 40;
    let stepMs = 5 * 60 * 1000;

    switch (timeframe) {
      case '1D': count = 60; stepMs = 5 * 60 * 1000; break;
      case '1W': count = 35; stepMs = 2 * 3600 * 1000; break;
      case '1M': count = 30; stepMs = 24 * 3600 * 1000; break;
      case '3M': count = 60; stepMs = 24 * 3600 * 1000; break;
      case '6M': count = 90; stepMs = 2 * 24 * 3600 * 1000; break;
      case '1Y': count = 120; stepMs = 3 * 24 * 3600 * 1000; break;
      case '5Y': count = 150; stepMs = 12 * 24 * 3600 * 1000; break;
    }

    const candles = [];
    let currentClose = basePrice * (1 - ((stock?.changePercent || 0) / 100) * 0.7);

    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(now - i * stepMs).toISOString();
      const volatility = basePrice * 0.0035;
      const delta = (Math.random() - 0.48) * volatility;
      const open = Math.round(currentClose * 100) / 100;
      const close = Math.round((open + delta) * 100) / 100;
      const high = Math.round((Math.max(open, close) + Math.random() * volatility * 0.7) * 100) / 100;
      const low = Math.round((Math.min(open, close) - Math.random() * volatility * 0.7) * 100) / 100;
      const volume = Math.floor(10000 + Math.random() * 85000);

      candles.push({
        time,
        timestamp: new Date(time).getTime(),
        open,
        high,
        low,
        close,
        volume
      });
      currentClose = close;
    }

    if (candles.length > 0 && stock) {
      candles[candles.length - 1].close = stock.ltp;
      candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, stock.ltp);
      candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, stock.ltp);
    }

    return {
      symbol: clean,
      timeframe,
      candles,
      updatedAt: new Date().toISOString()
    };
  },

  async fetchLiveCandles(symbol, timeframe = '1D') {
    const clean = symbol.toUpperCase().trim();
    let interval = '5m';
    let range = '1d';

    switch (timeframe) {
      case '1D': interval = '5m'; range = '1d'; break;
      case '1W': interval = '15m'; range = '5d'; break;
      case '1M': interval = '1d'; range = '1mo'; break;
      case '3M': interval = '1d'; range = '3mo'; break;
      case '6M': interval = '1d'; range = '6mo'; break;
      case '1Y': interval = '1d'; range = '1y'; break;
      case '5Y': interval = '1wk'; range = '5y'; break;
    }

    const suffixes = ['.NS', '.BO', ''];
    for (const suf of suffixes) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${clean}${suf}?interval=${interval}&range=${range}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        if (!res.ok) continue;

        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const timestamps = result.timestamp;
          const q = result.indicators.quote[0];
          const candles = [];

          for (let i = 0; i < timestamps.length; i++) {
            if (q.open[i] != null && q.close[i] != null) {
              candles.push({
                time: new Date(timestamps[i] * 1000).toISOString(),
                timestamp: timestamps[i] * 1000,
                open: Math.round(q.open[i] * 100) / 100,
                high: Math.round(q.high[i] * 100) / 100,
                low: Math.round(q.low[i] * 100) / 100,
                close: Math.round(q.close[i] * 100) / 100,
                volume: q.volume[i] || 15000
              });
            }
          }

          if (candles.length > 0) {
            return {
              symbol: clean,
              timeframe,
              candles,
              updatedAt: new Date().toISOString(),
              isRealLive: true
            };
          }
        }
      } catch (err) {
        // Continue
      }
    }
    return null;
  },

  async refreshStock(symbol, clientIp = '127.0.0.1') {
    const key = `${symbol.toUpperCase()}_${clientIp}`;
    const lastRefresh = refreshCooldowns.get(key);
    const now = Date.now();

    if (lastRefresh) {
      const elapsed = (now - lastRefresh) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - elapsed);
        return {
          success: false,
          code: 'RATE_LIMITED',
          message: `Refresh rate limit in effect. Please wait ${remaining}s before refreshing ${symbol}.`,
          retryAfter: remaining
        };
      }
    }

    refreshCooldowns.set(key, now);

    // Fetch fresh real live quote from exchange
    const realQuote = await this.fetchLiveQuote(symbol);
    if (realQuote) {
      const idx = runtimeStocks.findIndex(s => s.symbol.toUpperCase() === symbol.toUpperCase());
      if (idx !== -1) runtimeStocks[idx] = realQuote;
      else runtimeStocks.push(realQuote);

      return {
        success: true,
        data: realQuote,
        updatedAt: realQuote.updatedAt
      };
    }

    const stock = await this.getStockQuote(symbol);
    return {
      success: true,
      data: stock,
      updatedAt: stock.updatedAt
    };
  },

  simulateTick(symbol) {
    const stock = runtimeStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!stock) return null;

    const microDelta = (Math.random() - 0.49) * (stock.ltp * 0.0008);
    stock.ltp = Math.round((stock.ltp + microDelta) * 100) / 100;
    stock.change = Math.round((stock.ltp - stock.previousClose) * 100) / 100;
    stock.changePercent = Math.round((stock.change / (stock.previousClose || 1)) * 10000) / 100;
    stock.high = Math.max(stock.high, stock.ltp);
    stock.low = Math.min(stock.low, stock.ltp);
    stock.volume += Math.floor(100 + Math.random() * 500);
    stock.updatedAt = new Date().toISOString();

    return {
      symbol: stock.symbol,
      ltp: stock.ltp,
      change: stock.change,
      changePercent: stock.changePercent,
      high: stock.high,
      low: stock.low,
      volume: stock.volume,
      updatedAt: stock.updatedAt
    };
  }
};
