import express from 'express';
import { newsService } from '../services/newsService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { symbol, category, limit, forceRefresh } = req.query;
  const isForce = forceRefresh === 'true' || forceRefresh === '1';
  const news = await newsService.getNews(
    symbol,
    category,
    limit ? parseInt(limit, 10) : 25,
    isForce
  );
  res.json({
    success: true,
    count: news.length,
    lastSynced: new Date().toISOString(),
    data: news
  });
});

router.post('/sync', async (req, res) => {
  try {
    const news = await newsService.syncWire();
    res.json({
      success: true,
      count: news.length,
      lastSynced: new Date().toISOString(),
      message: `Successfully synchronized ${news.length} real-time market news dispatches!`,
      data: news
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'News sync failed: ' + err.message });
  }
});

export default router;
