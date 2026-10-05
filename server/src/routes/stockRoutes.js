import express from 'express';
import { marketDataService } from '../services/marketDataService.js';
import { newsService } from '../services/newsService.js';

const router = express.Router();

// GET /api/stocks - list with search & sector filtering
router.get('/', async (req, res) => {
  const { search, sector } = req.query;
  const stocks = await marketDataService.getAllStocks(search, sector);
  res.json({ success: true, count: stocks.length, data: stocks });
});

// GET /api/stocks/:symbol - single stock quote (real live exchange feed)
router.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const quote = await marketDataService.getStockQuote(symbol);
  if (!quote) {
    return res.status(404).json({
      success: false,
      code: 'STOCK_NOT_FOUND',
      message: `Stock '${symbol}' was not found.`
    });
  }
  res.json({ success: true, data: quote });
});

// GET /api/stocks/:symbol/history - historical candlestick data (real live feed)
router.get('/:symbol/history', async (req, res) => {
  const { symbol } = req.params;
  const { timeframe = '1D' } = req.query;
  const history = await marketDataService.getHistoricalCandles(symbol, timeframe);
  if (!history) {
    return res.status(404).json({
      success: false,
      code: 'HISTORY_NOT_FOUND',
      message: `Historical data for '${symbol}' was not found.`
    });
  }
  res.json({ success: true, data: history });
});

// GET /api/stocks/:symbol/news - symbol specific news
router.get('/:symbol/news', async (req, res) => {
  const { symbol } = req.params;
  const news = await newsService.getNews(symbol);
  res.json({ success: true, count: news.length, data: news });
});

// POST /api/stocks/:symbol/refresh - manual refresh with server-side 15s cooldown
router.post('/:symbol/refresh', async (req, res) => {
  const { symbol } = req.params;
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const result = await marketDataService.refreshStock(symbol, clientIp);

  if (!result.success) {
    if (result.code === 'RATE_LIMITED') {
      return res.status(429).json(result);
    }
    return res.status(404).json(result);
  }

  res.json(result);
});

export default router;
