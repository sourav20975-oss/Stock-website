import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import stockRoutes from './routes/stockRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import ipoRoutes from './routes/ipoRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { setupSocketIO } from './services/socketService.js';
import { connectDB } from './config/database.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().catch(err => console.warn('[MongoDB] Init error:', err.message));

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Request logging (compact)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (!req.url.startsWith('/socket.io')) {
      console.log(`[${req.method}] ${req.url} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Setup Socket.IO
setupSocketIO(server);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Stock Knowledge SaaS API',
    version: '1.0.0',
    market: 'Indian Equity & IPO Research',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ipos', ipoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/watchlists', watchlistRoutes);
app.use('/api/auth', authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err.stack || err);
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected internal error occurred. Please try again.'
  });
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Stock Knowledge SaaS Backend Active`);
  console.log(` Server URL: http://localhost:${PORT}`);
  console.log(` WebSocket:  ws://localhost:${PORT}`);
  console.log(` Market:     NSE / BSE Research Engine`);
  console.log(`=========================================`);
});
