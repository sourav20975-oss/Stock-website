import express from 'express';
import { marketDataService } from '../services/marketDataService.js';

const router = express.Router();

// GET /api/market/overview
router.get('/overview', async (req, res) => {
  try {
    const status = marketDataService.getMarketStatus();
    const indices = await marketDataService.getIndices();
    const { gainers, losers, high52Breakouts, low52Breakouts } = await marketDataService.getGainersAndLosers();
    const allStocks = await marketDataService.getAllStocks();

    res.json({
      success: true,
      data: {
        status,
        indices,
        gainers,
        losers,
        high52Breakouts,
        low52Breakouts,
        totalStocks: allStocks.length,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Market Overview Route Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch market overview.' });
  }
});

// GET /api/market/indices
router.get('/indices', async (req, res) => {
  const data = await marketDataService.getIndices();
  res.json({ success: true, data });
});

// GET /api/market/gainers
router.get('/gainers', async (req, res) => {
  const { gainers } = await marketDataService.getGainersAndLosers();
  res.json({ success: true, data: gainers });
});

// GET /api/market/losers
router.get('/losers', async (req, res) => {
  const { losers } = await marketDataService.getGainersAndLosers();
  res.json({ success: true, data: losers });
});

// GET /api/market/status
router.get('/status', (req, res) => {
  res.json({ success: true, data: marketDataService.getMarketStatus() });
});

export default router;
