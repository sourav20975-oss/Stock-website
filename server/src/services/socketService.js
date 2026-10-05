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
        if (quote) {
          socket.emit('stock:update', {
            symbol: quote.symbol,
            ltp: quote.ltp,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
            high: quote.high,
            low: quote.low,
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

  // Background ticker for actively subscribed stocks ONLY
  setInterval(() => {
    if (activeSubscriptions.size === 0) return;

    activeSubscriptions.forEach((subscribers, symbol) => {
      if (subscribers.size > 0) {
        const update = marketDataService.simulateTick(symbol);
        if (update) {
          io.to(`stock:${symbol}`).emit('stock:update', {
            ...update,
            timestamp: Date.now()
          });
        }
      }
    });
  }, 1500);

  return io;
}
