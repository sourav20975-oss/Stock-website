import { seedNews } from '../data/seedData.js';

let cachedGNews = null;
let lastGNewsFetch = 0;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 mins cache

export const newsService = {
  async getNews(symbol = '', category = '', limit = 10) {
    const apiKey = process.env.GNEWS_API_KEY;

    // Fetch from live GNews if key is configured and cache expired
    if (apiKey && Date.now() - lastGNewsFetch > CACHE_DURATION_MS) {
      try {
        const query = symbol ? `${symbol} stock India` : 'Indian stock market OR NSE OR BSE OR IPO';
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=10&apikey=${apiKey}`;
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.articles && data.articles.length > 0) {
            cachedGNews = data.articles.map((art, index) => ({
              id: `gn_${index}`,
              title: art.title,
              summary: art.description,
              url: art.url,
              source: art.source?.name || 'Financial Express',
              publishedAt: art.publishedAt || new Date().toISOString(),
              symbols: symbol ? [symbol.toUpperCase()] : ['NIFTY 50', 'NSE'],
              category: category || 'Market'
            }));
            lastGNewsFetch = Date.now();
            console.log(`[News Service] Fetched ${cachedGNews.length} live articles from GNews.`);
          }
        }
      } catch (err) {
        console.warn('[News Service] GNews API fetch failed, falling back to internal curated news:', err.message);
      }
    }

    let combined = cachedGNews && cachedGNews.length > 0 ? [...cachedGNews, ...seedNews] : seedNews;

    if (symbol) {
      const s = symbol.toUpperCase();
      combined = combined.filter(item => item.symbols && item.symbols.some(sym => sym.toUpperCase() === s));
    }

    if (category && category !== 'All') {
      combined = combined.filter(item => item.category?.toLowerCase() === category.toLowerCase());
    }

    return combined.slice(0, limit);
  }
};
