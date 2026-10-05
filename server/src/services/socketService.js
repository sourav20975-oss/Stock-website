import { Server } from 'socket.io';
import { marketDataService } from './marketDataService.js';

export function setupSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Track active symbol subscriptions: Map<symbol, Set<socketId>>
  const activeSubscriptions = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send initial market status
    socket.emit('connection:status', {
      connected: true,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    socket.emit('market:status', marketDataService.getMarketStatus());

    // Subscribe to a specific stock
    socket.on('stock:subscribe', async ({ symbol }) => {
      if (!symbol) return;
      const cleanSymbol = symbol.toUpperCase();
      console.log(`[Socket] ${socket.id} subscribed to ${cleanSymbol}`);

      socket.join(`stock:${cleanSymbol}`);

      if (!activeSubscriptions.has(cleanSymbol)) {
        activeSubscriptions.set(cleanSymbol, new Set());
      }
      activeSubscriptions.get(cleanSymbol).add(socket.id);

      // Immediately send current quote
      try {
        const quote = await marketDataService.getStockQuote(cleanSymbol);
        const marketStatus = marketDataService.getMarketStatus();
        if (quote) {
          socket.emit('stock:update', {
            symbol: quote.symbol,
            ltp: quote.ltp,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
            high: quote.high,
            low: quote.low,
            isMarketOpen: marketStatus.isLive,
            marketStatus: marketStatus.status,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.warn('[Socket] Could not send initial quote:', err.message);
      }
    });

    // Unsubscribe from a stock
    socket.on('stock:unsubscribe', ({ symbol }) => {
      if (!symbol) return;
      const cleanSymbol = symbol.toUpperCase();
      console.log(`[Socket] ${socket.id} unsubscribed from ${cleanSymbol}`);

      socket.leave(`stock:${cleanSymbol}`);

      if (activeSubscriptions.has(cleanSymbol)) {
        activeSubscriptions.get(cleanSymbol).delete(socket.id);
        if (activeSubscriptions.get(cleanSymbol).size === 0) {
          activeSubscriptions.delete(cleanSymbol);
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      activeSubscriptions.forEach((subscribers, sym) => {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          activeSubscriptions.delete(sym);
        }
      });
    });
  });

  // Background ticker for actively subscribed stocks
  // STRICT RULE:
  // - When market is closed (after 3:30 PM, before 9:15 AM, or weekends): Zero emissions, prices remain frozen at closing LTP.
  // - When market is OPEN (09:15 AM - 03:30 PM IST): Fetches 100% REAL LIVE exchange quotes from NSE / BSE via fetchLiveQuote.
  const lastFetchMap = new Map();

  setInterval(async () => {
    if (activeSubscriptions.size === 0) return;

    const marketStatus = marketDataService.getMarketStatus();
    if (!marketStatus.isLive) {
      // Market is closed — stock prices on NSE / BSE are frozen.
      return;
    }

    const now = Date.now();
    activeSubscriptions.forEach(async (subscribers, symbol) => {
      if (subscribers.size > 0) {
        // Throttle each symbol to 4 seconds to respect API limits while delivering real live quotes
        const lastFetch = lastFetchMap.get(symbol) || 0;
        if (now - lastFetch < 4000) return;
        lastFetchMap.set(symbol, now);

        try {
          const freshQuote = await marketDataService.fetchLiveQuote(symbol);
          if (freshQuote) {
            io.to(`stock:${symbol}`).emit('stock:update', {
              symbol: freshQuote.symbol,
              ltp: freshQuote.ltp,
              change: freshQuote.change,
              changePercent: freshQuote.changePercent,
              volume: freshQuote.volume,
              high: freshQuote.high,
              low: freshQuote.low,
              open: freshQuote.open,
              isMarketOpen: true,
              marketStatus: marketStatus.status,
              isRealLive: true,
              timestamp: Date.now()
            });
          }
        } catch (err) {
          console.warn(`[Socket Live Feed] Error updating ${symbol}:`, err.message);
        }
      }
    });
  }, 2000);

  return io;
}
