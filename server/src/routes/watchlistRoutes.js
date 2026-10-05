import express from 'express';
import { marketDataService } from '../services/marketDataService.js';

const router = express.Router();

// In-memory user watchlist initialized with key default symbols
let defaultWatchlist = ['TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'TATAMOTORS'];

// GET /api/watchlists - returns user's watchlist with current stock quotes
router.get('/', (req, res) => {
  const quotes = defaultWatchlist.map(sym => marketDataService.getStockQuote(sym)).filter(Boolean);
  res.json({
    success: true,
    data: {
      name: 'Primary Watchlist',
      symbols: defaultWatchlist,
      items: quotes,
      updatedAt: new Date().toISOString()
    }
  });
});

// POST /api/watchlists - add a symbol
router.post('/', (req, res) => {
  const { symbol } = req.body;
  if (!symbol) {
    return res.status(400).json({ success: false, message: 'Stock symbol is required.' });
  }

  const clean = symbol.toUpperCase().trim();
  const exists = marketDataService.getStockQuote(clean);
  if (!exists) {
    return res.status(404).json({ success: false, message: `Symbol ${clean} is not a recognized instrument.` });
  }

  if (!defaultWatchlist.includes(clean)) {
    defaultWatchlist.push(clean);
  }

  const quotes = defaultWatchlist.map(sym => marketDataService.getStockQuote(sym)).filter(Boolean);
  res.json({
    success: true,
    message: `${clean} added to watchlist.`,
    data: {
      symbols: defaultWatchlist,
      items: quotes
    }
  });
});

// DELETE /api/watchlists/:symbol - remove a symbol
router.delete('/:symbol', (req, res) => {
  const clean = req.params.symbol.toUpperCase().trim();
  defaultWatchlist = defaultWatchlist.filter(s => s !== clean);

  const quotes = defaultWatchlist.map(sym => marketDataService.getStockQuote(sym)).filter(Boolean);
  res.json({
    success: true,
    message: `${clean} removed from watchlist.`,
    data: {
      symbols: defaultWatchlist,
      items: quotes
    }
  });
});

export default router;
