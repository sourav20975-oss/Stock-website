import { marketDataService } from './marketDataService.js';
import { ipoService } from './ipoService.js';
import { newsService } from './newsService.js';

export const aiService = {
  async processQuery(query, context = {}) {
    const qLower = (query || '').toLowerCase();

    // Detect target symbols or IPOs from prompt
    let detectedSymbol = context.symbol || null;
    let detectedIpo = context.ipoSlug || null;

    if (!detectedSymbol) {
      try {
        const allStocks = await marketDataService.getAllStocks();
        if (Array.isArray(allStocks)) {
          const match = allStocks.find(s => 
            qLower.includes(s.symbol.toLowerCase()) || 
            qLower.includes(s.name.toLowerCase())
          );
          if (match) detectedSymbol = match.symbol;
        }
      } catch (err) {
        console.warn('[AI Service] Stock detection error:', err.message);
      }
    }

    if (!detectedIpo) {
      try {
        const allIpos = ipoService.getAllIPOs();
        if (Array.isArray(allIpos)) {
          const match = allIpos.find(i => 
            qLower.includes(i.slug.toLowerCase()) || 
            qLower.includes(i.companyName.toLowerCase()) || 
            (i.symbol && qLower.includes(i.symbol.toLowerCase()))
          );
          if (match) detectedIpo = match.slug;
        }
      } catch (err) {
        console.warn('[AI Service] IPO detection error:', err.message);
      }
    }

    // Provider 1: Try Groq first for ultra-fast, sub-second responses
    if (process.env.GROQ_API_KEY) {
      try {
        const groqReport = await this.callGroq(query, { detectedSymbol, detectedIpo });
        if (groqReport && (groqReport.summary || groqReport.content)) {
          return groqReport;
        }
      } catch (err) {
        console.warn('[AI Service] Groq call failed, trying next provider:', err.message);
      }
    }

    // Provider 2: Try OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const orReport = await this.callOpenRouter(query, { detectedSymbol, detectedIpo });
        if (orReport && (orReport.summary || orReport.content)) {
          return orReport;
        }
      } catch (err) {
        console.warn('[AI Service] OpenRouter call failed, trying next provider:', err.message);
      }
    }

    // Provider 3: Try Google Gemini API
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiReport = await this.callGemini(query, { detectedSymbol, detectedIpo });
        if (geminiReport && (geminiReport.summary || geminiReport.content)) {
          return geminiReport;
        }
      } catch (err) {
        console.warn('[AI Service] Gemini call failed, falling back to local financial engine:', err.message);
      }
    }

    // Provider 4 (Fallback): Local High-Precision Financial Engine
    return await this.generateStructuredResearch(query, { detectedSymbol, detectedIpo });
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
   ### Due Diligence & What to Research Next
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
      sources: ['NSE Corporate Disclosures', 'BSE India', 'SEBI DRHP / RHP Filings', 'Groq High-Speed LLaMA Engine'],
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
3. If "Verified Live NSE Market Data Feed" is provided below, incorporate the real-time LTP, P/E, 52-week range, and Market Cap directly into the "Financial Position & Valuation" section.
4. Output must be structured with clearly labeled sections:
   ### Summary
   ### Business & Operations
   ### Financial Position & Valuation
   ### Key Risk Factors
   ### Due Diligence & What to Research Next
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
- Trading Volume: ${stockQuote.volume?.toLocaleString('en-IN')} shares` : ''}
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
            text: `You are the Stock Knowledge AI research assistant for Indian stocks (NSE/BSE) and IPOs. Answer educationally with structured markdown sections (### Summary, ### Business & Operations, ### Financial Position & Valuation, ### Key Risk Factors) without giving buy/sell advice: ${query}`
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

  async generateStructuredResearch(query, { detectedSymbol, detectedIpo }) {
    const qLower = (query || '').toLowerCase();

    // 1. IPO Research
    if (detectedIpo || qLower.includes('ipo')) {
      const allIpos = ipoService.getAllIPOs();
      const ipoSlug = detectedIpo || (allIpos[0]?.slug) || 'jio-platforms-tentative-ipo';
      const ipo = ipoService.getIPOBySlug(ipoSlug) || allIpos[0];

      if (ipo) {
        const finLatest = Array.isArray(ipo.financials) && ipo.financials.length > 0 
          ? ipo.financials[ipo.financials.length - 1] 
          : {};

        const fullMarkdown = [
          `### Executive Overview`,
          `${ipo.companyName} is offering an issue size of ${ipo.issueSize} priced in the band of ${ipo.priceBand}. The offering bidding window is scheduled from ${ipo.openDate} to ${ipo.closeDate}.`,
          `### Business & Operations`,
          ipo.aboutCompany || `The issuer operates as an established market player in the ${ipo.sector} sector with corporate infrastructure and client base across Indian exchanges.`,
          `### Financial Position & Valuation`,
          `- Revenue: ${finLatest.revenue || 'Refer prospectus'}\n- Net Profit (PAT): ${finLatest.pat || 'Refer prospectus'}\n- Return on Equity (ROE): ${ipo.kpi?.dated?.roe?.[0] ? `${ipo.kpi.dated.roe[0]}%` : 'Established'}\n- Debt-to-Equity: ${finLatest.debtToEquity || 'Balanced'}`,
          `### Indicative GMP Context`,
          `- Current Indicative GMP: ₹${ipo.gmp?.value || 0} (~${ipo.gmp?.percent || 0}% over upper band)\n- Overall Subscription Demand: ${ipo.subscription?.overall || 'Awaiting bids'}\n- Regulatory Note: Grey market premiums are strictly unofficial and indicative.`,
          `### Key Risk Factors`,
          (Array.isArray(ipo.risks) && ipo.risks.length > 0)
            ? ipo.risks.map(r => `- ${r}`).join('\n')
            : `- Exposure to input cost inflation and raw material pricing cycles\n- Competition from established domestic and multinational incumbents\n- Working capital cycle management and execution risks`,
          `### Due Diligence & What to Research Next`,
          `- Read the complete Red Herring Prospectus (RHP) filed with SEBI\n- Evaluate institutional QIB participation and anchor investor allotment\n- Compare post-issue P/E ratio against listed industry peers`,
          `### Regulatory Disclaimer`,
          `For educational and awareness research only. Not SEBI registered advisory. Stock and IPO investments are subject to market risks.`
        ].join('\n\n');

        return {
          query,
          targetType: 'IPO',
          targetName: `${ipo.companyName} (IPO)`,
          slug: ipo.slug,
          summary: fullMarkdown,
          content: fullMarkdown,
          sources: ['SEBI Red Herring Prospectus (RHP)', 'BSE/NSE Public Offer Portal', 'Merchant Banker Disclosures'],
          toolsUsed: ['getIPOInfo', 'getGMP', 'getSubscriptionData'],
          disclaimer: 'Informational and educational analysis only. GMP is unofficial and time-sensitive. Not investment advice.'
        };
      }
    }

    // 2. Stock Research
    const symbol = detectedSymbol || 'TCS';
    let stock = null;
    try {
      stock = await marketDataService.getStockQuote(symbol);
    } catch (e) {
      console.warn('[AI Service] getStockQuote error:', e.message);
    }

    if (stock) {
      const fullMarkdown = [
        `### Executive Overview`,
        `${stock.name} (${stock.symbol}) is currently quoting at ₹${stock.ltp?.toLocaleString('en-IN')} on the NSE, registering a ${stock.change >= 0 ? '+' : ''}${stock.changePercent}% movement with a 52-week trading range of ₹${stock.low52?.toLocaleString('en-IN')} – ₹${stock.high52?.toLocaleString('en-IN')}.`,
        `### Business & Operations`,
        stock.description || `${stock.name} is a benchmark heavyweight in the ${stock.sector || 'Indian Equity'} industry with institutional delivery presence and deep client footprint.`,
        `### Financial Position & Valuation`,
        `- Current LTP: ₹${stock.ltp?.toLocaleString('en-IN')}\n- Trailing P/E Multiple: ${stock.pe || 28.5}x\n- Market Capitalization: ${stock.marketCap || 'Large Cap'}\n- Return on Equity (ROE): ${stock.fundamentals?.roe || 18.5}%\n- Debt to Equity: ${stock.fundamentals?.debtToEquity || 0.35}\n- Dividend Yield: ${stock.fundamentals?.dividendYield || 1.2}%`,
        `### Key Risk Factors`,
        `- Sensitivity to macroeconomic enterprise discretionary spending and client budget cycles\n- Currency fluctuation risks across US Dollar, Euro, and Indian Rupee conversions\n- Wage inflation, talent attrition, and competitive pricing pressures in key operating verticals`,
        `### Due Diligence & What to Research Next`,
        `- Inspect quarterly audited earnings releases and management conference call transcripts\n- Track large deal Total Contract Value (TCV) win momentum and book-to-bill ratios\n- Monitor delivery volume percentage and key technical moving averages (50-EMA & 200-EMA)`,
        `### Regulatory Disclaimer`,
        `For educational market research and information only. Does not constitute investment advice or recommendation to trade.`
      ].join('\n\n');

      return {
        query,
        targetType: 'STOCK',
        targetName: `${stock.name} (${stock.symbol})`,
        symbol: stock.symbol,
        summary: fullMarkdown,
        content: fullMarkdown,
        sources: ['NSE India Stock Feed', 'Quarterly Financial Disclosures', 'Audited Annual Reports'],
        toolsUsed: ['getStockQuote', 'getCompanyInfo', 'getStockHistory'],
        disclaimer: 'For educational research and market awareness only. Does not constitute investment advice.'
      };
    }

    // 3. General Market Research Fallback
    const generalMarkdown = [
      `### Executive Overview`,
      `Stock Knowledge Institutional Research Terminal provides multi-layered equity intelligence across NSE benchmark equities and primary IPO issues.`,
      `### Market Radar & Guidance`,
      `- Research any listed equity by typing its name or symbol (e.g., TCS, RELIANCE, INFY, HDFCBANK).\n- Analyze upcoming and open IPO offerings (e.g., Acme India, Jio Platforms, Hyundai).\n- Use the Peer Valuation Arena to compare comparative multiples side-by-side.`,
      `### Regulatory Disclaimer`,
      `All market figures and metrics are strictly educational and non-advisory.`
    ].join('\n\n');

    return {
      query,
      targetType: 'GENERAL',
      targetName: 'Market Research Terminal',
      summary: generalMarkdown,
      content: generalMarkdown,
      sources: ['NSE India', 'BSE', 'SEBI'],
      toolsUsed: ['getMarketOverview'],
      disclaimer: 'Educational research terminal.'
    };
  }
};
