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

// GET /api/market/fii-dii
router.get('/fii-dii', (req, res) => {
  const data = marketDataService.getFiiDiiData();
  res.json({ success: true, data });
});

// GET /api/market/global
router.get('/global', async (req, res) => {
  const data = await marketDataService.getGlobalMarkets();
  res.json({ success: true, data });
});

// GET /api/market/heatmap
router.get('/heatmap', async (req, res) => {
  const data = await marketDataService.getSectorHeatmap();
  res.json({ success: true, data });
});

// GET /api/market/calendar
router.get('/calendar', (req, res) => {
  const { type } = req.query;
  const data = marketDataService.getCorporateCalendar(type);
  res.json({ success: true, data });
});

// GET /api/market/screener
router.get('/screener', async (req, res) => {
  const { preset } = req.query;
  const data = await marketDataService.runScreener(preset);
  res.json({ success: true, data });
});

export default router;
