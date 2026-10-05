import express from 'express';
import { newsService } from '../services/newsService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { symbol, category, limit } = req.query;
  const news = await newsService.getNews(symbol, category, limit ? parseInt(limit, 10) : 10);
  res.json({ success: true, count: news.length, data: news });
});

export default router;
