import { seedNews } from '../data/seedData.js';

let cachedNews = null;
let lastNewsFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function cleanXmlText(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function detectCategory(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  if (text.includes('ipo') || text.includes('gmp') || text.includes('listing') || text.includes('bidding') || text.includes('drhp') || text.includes('allotment')) {
    return 'IPO & Listings';
  }
  if (text.includes('q1') || text.includes('q2') || text.includes('q3') || text.includes('q4') || text.includes('profit') || text.includes('pat') || text.includes('ebitda') || text.includes('revenue') || text.includes('earnings') || text.includes('result') || text.includes('target price')) {
    return 'Earnings & Results';
  }
  if (text.includes('rbi') || text.includes('inflation') || text.includes('gdp') || text.includes('fed') || text.includes('repo') || text.includes('rate cut') || text.includes('policy') || text.includes('crude') || text.includes('rupee') || text.includes('yield')) {
    return 'Macro & Policy';
  }
  if (text.includes('dividend') || text.includes('bonus') || text.includes('split') || text.includes('agm') || text.includes('acquisition') || text.includes('merger') || text.includes('stake') || text.includes('board meeting') || text.includes('buyback')) {
    return 'Corporate Actions';
  }
  if (text.includes('it ') || text.includes('bank') || text.includes('auto') || text.includes('metal') || text.includes('pharma') || text.includes('realty') || text.includes('energy') || text.includes('fmcg') || text.includes('sector')) {
    return 'Sector Radar';
  }
  return 'Market';
}

function extractSymbols(title, summary) {
  const text = `${title} ${summary}`.toUpperCase();
  const known = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT', 'TATAMOTORS', 'TATASTEEL', 'ZOMATO', 'PAYTM', 'JIO', 'NYKAA', 'NIFTY', 'SENSEX', 'BSE', 'NSE'];
  const found = known.filter(k => text.includes(k));
  if (found.length === 0) return ['NIFTY 50', 'NSE'];
  return found.slice(0, 3);
}

async function fetchFromEconomicTimes() {
  try {
    const url = 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    return items.map((item, idx) => {
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const imgMatch = item.match(/<enclosure[^>]*url="([^"]+)"/);

      const title = cleanXmlText(titleMatch ? titleMatch[1] : 'Market News');
      const summary = cleanXmlText(descMatch ? descMatch[1] : '');
      const url = cleanXmlText(linkMatch ? linkMatch[1] : '');
      const pubDate = cleanXmlText(pubDateMatch ? pubDateMatch[1] : '');
      const image = imgMatch ? imgMatch[1] : null;

      let publishedAt = new Date().toISOString();
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) publishedAt = d.toISOString();
      }

      return {
        id: `et_${idx}_${Date.now()}`,
        title,
        summary: summary || title,
        url,
        image,
        source: 'The Economic Times',
        publishedAt,
        symbols: extractSymbols(title, summary),
        category: detectCategory(title, summary)
      };
    });
  } catch (err) {
    console.warn('[News Service] ET RSS fetch error:', err.message);
    return [];
  }
}

async function fetchFromGoogleNews() {
  try {
    const url = 'https://news.google.com/rss/search?q=NSE+BSE+stock+market+India+OR+NIFTY+OR+Sensex&hl=en-IN&gl=IN&ceid=IN:en';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    return items.slice(0, 30).map((item, idx) => {
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      const fullTitle = cleanXmlText(titleMatch ? titleMatch[1] : 'Market Dispatch');
      const sourceName = cleanXmlText(sourceMatch ? sourceMatch[1] : 'Market Wire');
      const cleanTitle = fullTitle.replace(/ - [^-]+$/, '').trim();
      const url = cleanXmlText(linkMatch ? linkMatch[1] : '');
      const pubDate = cleanXmlText(pubDateMatch ? pubDateMatch[1] : '');

      let publishedAt = new Date().toISOString();
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) publishedAt = d.toISOString();
      }

      return {
        id: `gn_${idx}_${Date.now()}`,
        title: cleanTitle,
        summary: fullTitle,
        url,
        image: null,
        source: sourceName || 'Livemint',
        publishedAt,
        symbols: extractSymbols(cleanTitle, ''),
        category: detectCategory(cleanTitle, '')
      };
    });
  } catch (err) {
    console.warn('[News Service] Google News RSS error:', err.message);
    return [];
  }
}

export const newsService = {
  async getNews(symbol = '', category = '', limit = 25, forceRefresh = false) {
    const shouldFetch = forceRefresh || !cachedNews || (Date.now() - lastNewsFetchTime > CACHE_TTL_MS);

    if (shouldFetch) {
      console.log('[News Service] Syncing real-time market wires...');
      try {
        const [etArticles, gnArticles] = await Promise.all([
          fetchFromEconomicTimes(),
          fetchFromGoogleNews()
        ]);

        const combinedLive = [...etArticles, ...gnArticles];

        // Deduplicate by normalized title
        const seen = new Set();
        const unique = [];
        for (const art of combinedLive) {
          const norm = art.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);
          if (norm && !seen.has(norm)) {
            seen.add(norm);
            unique.push(art);
          }
        }

        if (unique.length > 0) {
          // Sort by publishedAt descending
          unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
          cachedNews = unique;
          lastNewsFetchTime = Date.now();
          console.log(`[News Service] Synchronized ${unique.length} live Indian financial news dispatches!`);
        }
      } catch (err) {
        console.warn('[News Service] Live news wire sync failed:', err.message);
      }
    }

    let result = (cachedNews && cachedNews.length > 0) ? cachedNews : seedNews;

    if (symbol) {
      const s = symbol.toUpperCase();
      result = result.filter(item => item.symbols && item.symbols.some(sym => sym.toUpperCase() === s));
    }

    if (category && category !== 'All') {
      result = result.filter(item => item.category?.toLowerCase() === category.toLowerCase());
    }

    return result.slice(0, limit);
  },

  async syncWire() {
    return this.getNews('', '', 50, true);
  }
};
