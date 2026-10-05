import express from 'express';
import { ipoService } from '../services/ipoService.js';

const router = express.Router();

// GET /api/ipos - list all IPOs, with optional status query
router.get('/', async (req, res) => {
  const { status } = req.query;
  const ipos = ipoService.getAllIPOs(status);

  // If first request has only default seed data, attempt background or immediate live sync
  if (ipos.length <= 5 && !ipoService.getLastSyncTime().includes(':')) {
    await ipoService.fetchLiveIPOs();
  }

  const latest = ipoService.getAllIPOs(status);
  res.json({
    success: true,
    count: latest.length,
    lastSynced: ipoService.getLastSyncTime(),
    data: latest
  });
});

// POST /api/ipos/sync-live - trigger immediate live scrape of current IPOs & GMP
router.post('/sync-live', async (req, res) => {
  try {
    const data = await ipoService.fetchLiveIPOs();
    res.json({
      success: true,
      count: data.length,
      lastSynced: ipoService.getLastSyncTime(),
      message: `Successfully synchronized ${data.length} real live IPOs with real-time GMP!`,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Sync failed: ' + err.message });
  }
});

// GET /api/ipos/upcoming
router.get('/upcoming', (req, res) => {
  const ipos = ipoService.getAllIPOs('upcoming');
  res.json({ success: true, count: ipos.length, data: ipos });
});

// GET /api/ipos/open
router.get('/open', (req, res) => {
  const ipos = ipoService.getAllIPOs('open');
  res.json({ success: true, count: ipos.length, data: ipos });
});

// GET /api/ipos/closed
router.get('/closed', (req, res) => {
  const ipos = ipoService.getAllIPOs('closed');
  res.json({ success: true, count: ipos.length, data: ipos });
});

// GET /api/ipos/:slug
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const ipo = ipoService.getIPOBySlug(slug);
  if (!ipo) {
    return res.status(404).json({
      success: false,
      code: 'IPO_NOT_FOUND',
      message: `IPO with identifier '${slug}' was not found.`
    });
  }
  res.json({ success: true, data: ipo });
});

// GET /api/ipos/:slug/gmp - Grey Market Premium with explicit disclaimer
router.get('/:slug/gmp', (req, res) => {
  const { slug } = req.params;
  const gmpData = ipoService.getGMP(slug);
  if (!gmpData) {
    return res.status(404).json({
      success: false,
      code: 'IPO_NOT_FOUND',
      message: `IPO with identifier '${slug}' was not found.`
    });
  }
  res.json({ success: true, data: gmpData });
});

// POST /api/ipos/:slug/refresh - manual refresh with cooldown
router.post('/:slug/refresh', (req, res) => {
  const { slug } = req.params;
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const result = ipoService.refreshIPO(slug, clientIp);

  if (!result.success) {
    if (result.code === 'RATE_LIMITED') {
      return res.status(429).json(result);
    }
    return res.status(404).json(result);
  }

  res.json(result);
});

export default router;
