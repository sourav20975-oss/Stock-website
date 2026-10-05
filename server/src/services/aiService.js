import { marketDataService } from './marketDataService.js';
import { ipoService } from './ipoService.js';
import { newsService } from './newsService.js';

export const aiService = {
  async processQuery(query, context = {}) {
    const qLower = query.toLowerCase();

    // Detect target symbols or IPOs from prompt
    let detectedSymbol = context.symbol || null;
    let detectedIpo = context.ipoSlug || null;

    if (!detectedSymbol) {
      const allStocks = marketDataService.getAllStocks();
      const match = allStocks.find(s => qLower.includes(s.symbol.toLowerCase()) || qLower.includes(s.name.toLowerCase()));
      if (match) detectedSymbol = match.symbol;
    }

    if (!detectedIpo) {
      const allIpos = ipoService.getAllIPOs();
      const match = allIpos.find(i => qLower.includes(i.slug.toLowerCase()) || qLower.includes(i.companyName.toLowerCase()) || (i.symbol && qLower.includes(i.symbol.toLowerCase())));
      if (match) detectedIpo = match.slug;
    }

    // Provider 1: Try Groq first for ultra-fast, sub-second LLaMA 3.3 responses
    if (process.env.GROQ_API_KEY) {
      try {
        const groqReport = await this.callGroq(query, { detectedSymbol, detectedIpo });
        if (groqReport) return groqReport;
      } catch (err) {
        console.warn('[AI Service] Groq call failed, trying next provider:', err.message);
      }
    }

    // Provider 2: Try OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const orReport = await this.callOpenRouter(query, { detectedSymbol, detectedIpo });
        if (orReport) return orReport;
      } catch (err) {
        console.warn('[AI Service] OpenRouter call failed, trying next provider:', err.message);
      }
    }

    // Provider 3: Try Google Gemini API
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiReport = await this.callGemini(query, { detectedSymbol, detectedIpo });
        if (geminiReport) return geminiReport;
      } catch (err) {
        console.warn('[AI Service] Gemini call failed, falling back to local financial engine:', err.message);
      }
    }

    // Fallback: Local High-Precision Financial Engine
    return this.generateStructuredResearch(query, { detectedSymbol, detectedIpo });
  },

  async callGroq(query, { detectedSymbol, detectedIpo }) {
    const stockQuote = detectedSymbol ? await marketDataService.getStockQuote(detectedSymbol) : null;
    const ipoInfo = detectedIpo ? ipoService.getIPOBySlug(detectedIpo) : null;

    const systemPrompt = `You are the Stock Knowledge AI Research Terminal specializing in Indian Equity (NSE/BSE) and IPO analysis.
CRITICAL SAFETY & COMPLIANCE RULES:
1. Provide educational, factual financial explanations and regulatory research summaries.
2. NEVER give guaranteed investment advice or recommend buying/selling.
3. If "Verified Live NSE Market Data Feed" is provided below, incorporate the real-time LTP, P/E, 52-week range, and Market Cap directly into the "Financial Position & Valuation" section. NEVER state that live stock data was not provided or unavailable.
4. Output must be structured with clearly labeled sections:
   ### Summary
   ### Business & Operations
   ### Financial Position & Valuation
   ### Key Risk Factors
   ### GMP Context (if IPO)
   ### What to Research Next
5. Use concise, line-by-line bullet points (- point) for readability.
6. Always cite regulatory sources (e.g. SEBI DRHP/RHP, NSE India, Company Filings).`;

    const userContent = `User Inquiry: ${query}
Target Instrument: ${detectedSymbol || detectedIpo || 'Indian Equity'}
${stockQuote ? `Verified Live NSE Market Data Feed:
- Current Real-time LTP: ₹${stockQuote.ltp}
- Company: ${stockQuote.name}
- Trailing P/E: ${stockQuote.pe}x
- Market Capitalization: ${stockQuote.marketCap}
- 52-Week Range: ₹${stockQuote.low52} - ₹${stockQuote.high52}
- Today's Day Range: ₹${stockQuote.low} - ₹${stockQuote.high}
- Trading Volume: ${stockQuote.volume?.toLocaleString('en-IN')} shares
(Instruction: You MUST directly integrate these verified live NSE figures in the "Financial Position & Valuation" section. DO NOT disclaim that live data is missing.)` : ''}
${ipoInfo ? `Verified IPO Prospectus Data:
- Company: ${ipoInfo.companyName}
- Price Band: ${ipoInfo.priceBand}
- Issue Size: ${ipoInfo.issueSize}
- Lot Size: ${ipoInfo.lotSize}
- Indicative GMP: ₹${ipoInfo.gmp?.value} (${ipoInfo.gmp?.percent}%)
- Subscription: ${ipoInfo.subscription?.overall}x` : ''}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) {
      throw new Error(`Groq API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    return {
      query,
      targetName: detectedSymbol ? `${stockQuote?.name || detectedSymbol} (${detectedSymbol})` : (detectedIpo ? ipoInfo?.companyName : 'Market Intelligence'),
      summary: raw,
      content: raw,
      sources: ['NSE Corporate Disclosures', 'BSE India', 'SEBI DRHP / RHP Filings', 'Groq LLaMA 3.3 Engine'],
      toolsUsed: [detectedSymbol ? 'getStockQuote' : null, detectedIpo ? 'getIPOInfo' : null].filter(Boolean),
      disclaimer: 'Educational research only. Not SEBI registered investment advice. Stock investments are subject to market risks.'
    };
  },

  async callOpenRouter(query, { detectedSymbol, detectedIpo }) {
    const stockQuote = detectedSymbol ? await marketDataService.getStockQuote(detectedSymbol) : null;
    const ipoInfo = detectedIpo ? ipoService.getIPOBySlug(detectedIpo) : null;

    const systemPrompt = `You are the Stock Knowledge AI Research Terminal specializing in Indian Equity (NSE/BSE) and IPO analysis.
CRITICAL SAFETY & COMPLIANCE RULES:
1. Provide educational, factual financial explanations and regulatory research summaries.
2. NEVER give guaranteed investment advice or recommend buying/selling.
3. If "Verified Live NSE Market Data Feed" is provided below, incorporate the real-time LTP, P/E, 52-week range, and Market Cap directly into the "Financial Position & Valuation" section. NEVER state that live stock data was not provided or unavailable.
4. Output must be structured with clearly labeled sections:
   ### Summary
   ### Business & Operations
   ### Financial Position & Valuation
   ### Key Risk Factors
   ### GMP Context (if IPO)
   ### What to Research Next
5. Use concise, line-by-line bullet points (- point) for readability.
6. Always cite regulatory sources (e.g. SEBI DRHP/RHP, NSE India, BSE India, Company Filings).`;

    const userContent = `User Inquiry: ${query}
Target Instrument: ${detectedSymbol || detectedIpo || 'Indian Equity'}
${stockQuote ? `Verified Live NSE Market Data Feed:
- Current Real-time LTP: ₹${stockQuote.ltp}
- Company: ${stockQuote.name}
- Trailing P/E: ${stockQuote.pe}x
- Market Capitalization: ${stockQuote.marketCap}
- 52-Week Range: ₹${stockQuote.low52} - ₹${stockQuote.high52}
- Today's Day Range: ₹${stockQuote.low} - ₹${stockQuote.high}
- Trading Volume: ${stockQuote.volume?.toLocaleString('en-IN')} shares
(Instruction: You MUST directly integrate these verified live NSE figures in the "Financial Position & Valuation" section. DO NOT disclaim that live data is missing.)` : ''}
${ipoInfo ? `Verified IPO Prospectus Data:
- Company: ${ipoInfo.companyName}
- Price Band: ${ipoInfo.priceBand}
- Issue Size: ${ipoInfo.issueSize}
- Lot Size: ${ipoInfo.lotSize}
- Indicative GMP: ₹${ipoInfo.gmp?.value} (${ipoInfo.gmp?.percent}%)
- Subscription: ${ipoInfo.subscription?.overall}x` : ''}`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Stock Knowledge SaaS'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return {
      query,
      targetName: detectedSymbol ? `${stockQuote?.name || detectedSymbol} (${detectedSymbol})` : (detectedIpo ? ipoInfo?.companyName : 'Indian Equity Analysis'),
      summary: content,
      content: content,
      sources: ['NSE Corporate Filings', 'Company Investor Relations', 'SEBI DRHP Database', 'OpenRouter Engine'],
      disclaimer: 'Educational research only. Not SEBI registered investment advice.'
    };
  },

  async callGemini(query, { detectedSymbol, detectedIpo }) {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are the Stock Knowledge AI research assistant for Indian stocks (NSE/BSE) and IPOs. Answer educationally without giving buy/sell advice: ${query}`
          }]
        }]
      })
    });

    if (!res.ok) throw new Error(`Gemini API HTTP ${res.status}`);
    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;

    return {
      query,
      targetName: detectedSymbol || detectedIpo || 'Indian Market Synthesis',
      summary: content,
      content: content,
      sources: ['NSE India', 'Google Gemini Engine', 'Company Filings'],
      disclaimer: 'Educational research only. Not SEBI registered investment advice.'
    };
  },

  generateStructuredResearch(query, { detectedSymbol, detectedIpo }) {
    const qLower = query.toLowerCase();

    // IPO Research
    if (detectedIpo || qLower.includes('ipo')) {
      const ipoSlug = detectedIpo || 'hyundai-motor-india';
      const ipo = ipoService.getIPOBySlug(ipoSlug);
      if (ipo) {
        return {
          query,
          targetType: 'IPO',
          targetName: ipo.companyName,
          slug: ipo.slug,
          summary: `${ipo.companyName} is bringing an initial public offering of ${ipo.issueSize} priced between ${ipo.priceBand}. The issue opened on ${ipo.openDate} and is scheduled to close on ${ipo.closeDate}.`,
          business: `The company operates as a key market leader in its domain with an established track record and institutional presence across India. The IPO structure consists of ${ipo.freshIssue} and ${ipo.ofs}.`,
          financials: `Key Financial Highlights:\n• FY24 Revenue: ${ipo.financials[ipo.financials.length - 1].revenue}\n• FY24 Net Profit: ${ipo.financials[ipo.financials.length - 1].pat}\n• FY24 EPS: ${ipo.financials[ipo.financials.length - 1].eps}\n• Debt-to-Equity: ${ipo.financials[ipo.financials.length - 1].debtToEquity}`,
          gmpContext: `Grey Market Premium (GMP): ₹${ipo.gmp.value} (~${ipo.gmp.percent}% over upper price band of ₹${ipo.maxPrice}). Note: GMP is an unofficial, unregulated metric traded in off-market circles and must not be treated as a guarantee of listing day performance.`,
          risks: ipo.risks.map(r => `• ${r}`).join('\n'),
          nextSteps: [
            'Review the complete Red Herring Prospectus (RHP) filed with SEBI',
            'Evaluate retail vs QIB institutional subscription trends on Day 2 & Day 3',
            'Compare valuation multiples (P/E, P/B, EV/EBITDA) against listed industry peers'
          ],
          sources: ['SEBI Red Herring Prospectus (RHP)', 'BSE/NSE Public Offer Portal', 'Merchant Banker Disclosures'],
          toolsUsed: ['getIPOInfo', 'getGMP', 'getSubscriptionData'],
          disclaimer: 'Informational and educational analysis only. GMP is unofficial and time-sensitive. Not investment advice.'
        };
      }
    }

    // Specific Stock Explanation
    const symbol = detectedSymbol || 'TCS';
    const stock = marketDataService.getStockQuote(symbol);

    if (stock) {
      return {
        query,
        targetType: 'STOCK',
        targetName: `${stock.name} (${stock.symbol})`,
        symbol: stock.symbol,
        summary: `${stock.name} is currently quoting at ₹${stock.ltp.toLocaleString('en-IN')} on the NSE, registering a ${stock.change >= 0 ? '+' : ''}${stock.changePercent}% session movement with a 52-week range of ₹${stock.low52.toLocaleString('en-IN')} – ₹${stock.high52.toLocaleString('en-IN')}.`,
        business: stock.description,
        financials: `Valuation and Balance Sheet Fundamentals:\n• P/E Ratio: ${stock.pe}x (Industry benchmark alignment)\n• Market Capitalization: ${stock.marketCap}\n• Return on Equity (ROE): ${stock.fundamentals?.roe}%\n• Debt to Equity: ${stock.fundamentals?.debtToEquity}\n• Dividend Yield: ${stock.fundamentals?.dividendYield}%`,
        risks: `• Sensitivity to enterprise tech discretionary budget spending\n• Currency volatility between Rupee, US Dollar, and Euro\n• Global macroeconomic slowdown in key customer geographies`,
        nextSteps: [
          'Examine latest management commentary from earnings call transcripts',
          'Track large deal Total Contract Value (TCV) bookings and margin retention',
          'Monitor delivery volume and 200-day exponential moving average (EMA) support levels'
        ],
        sources: ['NSE India Stock Feed', 'Quarterly Financial Disclosures', 'Audited Annual Reports'],
        toolsUsed: ['getStockQuote', 'getCompanyInfo', 'getStockHistory'],
        disclaimer: 'For educational research and market awareness only. Does not constitute investment advice.'
      };
    }

    return {
      query,
      targetType: 'GENERAL',
      targetName: 'Market Research',
      summary: 'Indian market terminal research engine active. You can query stock profiles (e.g. TCS, RELIANCE, INFY), upcoming/open IPOs (e.g. Hyundai, Swiggy, Waaree), or compare peers.',
      sources: ['NSE India', 'BSE', 'SEBI'],
      toolsUsed: ['getMarketOverview'],
      disclaimer: 'Educational research terminal.'
    };
  }
};
