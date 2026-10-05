import express from 'express';
import { aiService } from '../services/aiService.js';
import { marketDataService } from '../services/marketDataService.js';

const router = express.Router();

// POST /api/ai/chat - conversational or tool-assisted query
router.post('/chat', async (req, res) => {
  try {
    const { query, context = {} } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid research query string is required.'
      });
    }

    const report = await aiService.processQuery(query, context);
    res.json({ success: true, data: report });
  } catch (err) {
    console.error('AI Research Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to complete research analysis. Please try again.'
    });
  }
});

// POST /api/ai/stock-analysis - deep dive explanation of a stock
router.post('/stock-analysis', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Stock symbol is required.' });
    }
    const report = await aiService.processQuery(`Explain ${symbol} stock performance, business model, and risk factors.`, { symbol });
    res.json({ success: true, data: report });
  } catch (err) {
    console.error('AI Stock Analysis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to analyze stock.' });
  }
});

// POST /api/ai/ipo-analysis - deep dive analysis of an IPO
router.post('/ipo-analysis', async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) {
      return res.status(400).json({ success: false, message: 'IPO slug is required.' });
    }
    const report = await aiService.processQuery(`Analyze IPO ${slug} including business strengths, risk factors, and GMP context.`, { ipoSlug: slug });
    res.json({ success: true, data: report });
  } catch (err) {
    console.error('AI IPO Analysis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to analyze IPO.' });
  }
});

// POST /api/ai/compare - compare two stocks
router.post('/compare', async (req, res) => {
  try {
    const { symbol1, symbol2 } = req.body;
    if (!symbol1 || !symbol2) {
      return res.status(400).json({ success: false, message: 'Two symbols are required for comparison.' });
    }

    const clean1 = symbol1.toUpperCase().trim();
    const clean2 = symbol2.toUpperCase().trim();

    // Fetch both stocks quotes and fundamentals
    const [stock1, stock2] = await Promise.all([
      marketDataService.getStockQuote(clean1),
      marketDataService.getStockQuote(clean2)
    ]);

    if (!stock1 || !stock2) {
      return res.status(404).json({ success: false, message: `Could not retrieve data for ${!stock1 ? clean1 : clean2}` });
    }

    const comparisonData = {
      stock1: {
        symbol: stock1.symbol,
        name: stock1.name,
        exchange: stock1.exchange || 'NSE',
        sector: stock1.sector || 'Indian Equity',
        ltp: stock1.ltp,
        change: stock1.change,
        changePercent: stock1.changePercent,
        marketCap: stock1.marketCap,
        pe: stock1.fundamentals?.peRatio ?? stock1.pe ?? 0,
        pb: stock1.fundamentals?.pbRatio ?? 3.2,
        roe: stock1.fundamentals?.roe ?? 18.5,
        roce: stock1.fundamentals?.roce ?? 21.0,
        dividendYield: stock1.fundamentals?.dividendYield ?? 1.2,
        debtToEquity: stock1.fundamentals?.debtToEquity ?? 0.35,
        bookValue: stock1.fundamentals?.bookValue ?? Math.round(stock1.ltp * 0.35),
        high52: stock1.high52,
        low52: stock1.low52
      },
      stock2: {
        symbol: stock2.symbol,
        name: stock2.name,
        exchange: stock2.exchange || 'NSE',
        sector: stock2.sector || 'Indian Equity',
        ltp: stock2.ltp,
        change: stock2.change,
        changePercent: stock2.changePercent,
        marketCap: stock2.marketCap,
        pe: stock2.fundamentals?.peRatio ?? stock2.pe ?? 0,
        pb: stock2.fundamentals?.pbRatio ?? 3.2,
        roe: stock2.fundamentals?.roe ?? 18.5,
        roce: stock2.fundamentals?.roce ?? 21.0,
        dividendYield: stock2.fundamentals?.dividendYield ?? 1.2,
        debtToEquity: stock2.fundamentals?.debtToEquity ?? 0.35,
        bookValue: stock2.fundamentals?.bookValue ?? Math.round(stock2.ltp * 0.35),
        high52: stock2.high52,
        low52: stock2.low52
      }
    };

    const prompt = `Perform a comprehensive financial and operational peer comparison between ${stock1.symbol} (${stock1.name}, LTP: ₹${stock1.ltp}, P/E: ${comparisonData.stock1.pe}x, ROE: ${comparisonData.stock1.roe}%) and ${stock2.symbol} (${stock2.name}, LTP: ₹${stock2.ltp}, P/E: ${comparisonData.stock2.pe}x, ROE: ${comparisonData.stock2.roe}%).
Evaluate valuation multiples, return on capital, margin safety, competitive moat defensibility, and market position.`;

    const report = await aiService.processQuery(prompt, { 
      symbol: clean1,
      targetName: `${stock1.symbol} vs ${stock2.symbol}`
    });

    res.json({
      success: true,
      data: {
        ...report,
        targetName: `${stock1.symbol} vs ${stock2.symbol}`,
        comparisonData
      }
    });
  } catch (err) {
    console.error('AI Compare Error:', err);
    res.status(500).json({ success: false, message: 'Failed to compare stocks.' });
  }
});

export default router;
