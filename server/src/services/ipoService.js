let runtimeIPOs = [];
let lastExtractedAt = null;
const ipoCooldowns = new Map();
const COOLDOWN_SECONDS = 10;

// Helper to format bidding dates cleanly (e.g. "30 Sep – 6 Oct 2026")
function formatBiddingDates(openDate, closeDate) {
  if (!openDate || !closeDate || openDate === 'TBA' || closeDate === 'TBA') {
    return 'Announced';
  }
  try {
    const o = new Date(openDate);
    const c = new Date(closeDate);
    if (!isNaN(o.getTime()) && !isNaN(c.getTime())) {
      const oDay = o.getDate();
      const oMonth = o.toLocaleDateString('en-IN', { month: 'short' });
      const cDay = c.getDate();
      const cMonth = c.toLocaleDateString('en-IN', { month: 'short' });
      const cYear = c.getFullYear();

      if (o.getFullYear() === c.getFullYear()) {
        if (oMonth === cMonth) {
          return `${oDay} – ${cDay} ${cMonth} ${cYear}`;
        }
        return `${oDay} ${oMonth} – ${cDay} ${cMonth} ${cYear}`;
      }
      return `${oDay} ${oMonth} ${o.getFullYear()} – ${cDay} ${cMonth} ${cYear}`;
    }
  } catch {
    // fallback
  }
  return `${openDate} to ${closeDate}`;
}

// Helper to determine exact real status
function determineStatus(item) {
  const raw = (item.status || '').toLowerCase().trim();
  if (raw === 'open' || raw === 'lastday' || raw === 'bidding') {
    return 'open';
  }
  if (raw === 'listing' || raw === 'closed' || raw === 'allot') {
    return 'closed';
  }

  if (item.openDate && item.closeDate) {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (todayStr >= item.openDate && todayStr <= item.closeDate) {
      return 'open';
    }
    if (todayStr > item.closeDate) {
      return 'closed';
    }
    if (todayStr < item.openDate) {
      return 'upcoming';
    }
  }

  return 'upcoming';
}

// Helper to extract balanced bracket JSON string from RSC stream
function extractBalancedArray(str, startIndex) {
  let depth = 0;
  let endIdx = startIndex;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '[') depth++;
    else if (str[i] === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  return str.slice(startIndex, endIdx);
}

function extractBalancedObject(str, startIndex) {
  let depth = 0;
  let endIdx = startIndex;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  return str.slice(startIndex, endIdx);
}

function normalizeIpoItem(item) {
  const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const priceMin = typeof item.priceMin === 'number' ? item.priceMin : (parseFloat(item.priceMin) || 0);
  const priceMax = typeof item.priceMax === 'number' ? item.priceMax : (parseFloat(item.priceMax) || priceMin);
  const lotSize = typeof item.lotSize === 'number' ? item.lotSize : (parseInt(item.lotSize, 10) || 1);
  const gmpVal = typeof item.gmp === 'number' ? item.gmp : (parseFloat(item.gmp) || 0);

  let gmpPct = typeof item.gmpPercent === 'number' ? item.gmpPercent : (parseFloat(item.gmpPercent) || 0);
  if ((!gmpPct || gmpPct === 0) && gmpVal && priceMax > 0) {
    gmpPct = Math.round((gmpVal / priceMax) * 1000) / 10;
  }

  const estList = typeof item.estListPrice === 'number' && item.estListPrice > 0
    ? item.estListPrice
    : (priceMax + gmpVal);

  const status = determineStatus(item);

  const priceBand = priceMin && priceMax
    ? (priceMin === priceMax ? `₹${priceMax}` : `₹${priceMin.toLocaleString('en-IN')} – ₹${priceMax.toLocaleString('en-IN')}`)
    : 'TBA';

  const issueSize = item.issueSizeCr
    ? `₹${item.issueSizeCr.toLocaleString('en-IN')} Cr`
    : (item.issueSize ? `₹${item.issueSize} Cr` : 'TBA');

  const gmpHistory = Array.isArray(item.gmpHistory) && item.gmpHistory.length > 0
    ? item.gmpHistory
    : (Array.isArray(item.gmpTrends) && item.gmpTrends.length > 0 ? item.gmpTrends : [
        {
          date: item.gmpLastUpdated || new Date().toISOString(),
          gmp: gmpVal,
          gmpPercent: gmpPct,
          source: 'Live'
        }
      ]);

  // Subscription normalizing
  const subTotal = item.subscription?.total !== undefined ? item.subscription.total : (item.subscription?.overall || '0x');
  const subRetail = item.subscription?.retail !== undefined ? item.subscription.retail : '0x';
  const subQib = item.subscription?.qib !== undefined ? item.subscription.qib : '0x';
  const subNii = item.subscription?.nii !== undefined ? item.subscription.nii : (item.subscription?.shni || '0x');

  // Formatted Financials
  let formattedFinancials = [];
  if (item.financials) {
    const f = item.financials;
    ['fy24', 'fy25', 'fy26'].forEach(yr => {
      if (f.revenue?.[yr] || f.pat?.[yr] || f.ebitda?.[yr]) {
        formattedFinancials.push({
          year: yr.toUpperCase(),
          revenue: f.revenue?.[yr] ? `₹${f.revenue[yr].toLocaleString('en-IN')} Cr` : 'N/A',
          ebitda: f.ebitda?.[yr] ? `₹${f.ebitda[yr].toLocaleString('en-IN')} Cr` : 'N/A',
          pat: f.pat?.[yr] ? `₹${f.pat[yr].toLocaleString('en-IN')} Cr` : 'N/A',
          eps: item.kpi?.prePost?.eps?.pre ? `₹${item.kpi.prePost.eps.pre}` : 'N/A',
          debtToEquity: f.debtEquity?.[yr] ? `${f.debtEquity[yr]}` : (f.debtEquity ? `${f.debtEquity}` : 'N/A')
        });
      }
    });
  }

  const cleanStrengths = (item.greenFlags || []).filter(f => f && !f.includes('=== END ==='));
  const cleanRisks = (item.redFlags || []).filter(f => f && !f.includes('=== END ==='));

  const leadMgrs = item.leadManager
    ? (Array.isArray(item.leadManager) ? item.leadManager : item.leadManager.split(';').map(m => m.trim()))
    : ['Axis Capital', 'Kotak Mahindra', 'ICICI Securities'];

  return {
    id: item.id || slug,
    companyName: item.name,
    slug,
    symbol: item.abbr || item.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
    logoUrl: item.logoUrl && item.logoUrl !== 'NA' && item.logoUrl !== '$undefined' ? item.logoUrl : null,
    segment: item.exchange || 'Mainboard',
    sector: item.sector || 'Diversified',
    status,
    priceBand,
    minPrice: priceMin,
    maxPrice: priceMax,
    issueSize,
    lotSize,
    lotSizeDisplay: `${lotSize} shares`,
    shniLotSize: item.shniLotSize || null,
    bhniLotSize: item.bhniLotSize || null,
    minInvestment: priceMax * lotSize,
    faceValue: item.faceValue || 10,
    gmp: {
      value: gmpVal,
      percent: gmpPct,
      trend: gmpVal > 0 ? 'up' : (gmpVal < 0 ? 'down' : 'neutral'),
      fetchedAt: new Date().toISOString(),
      lastReported: item.gmpLastUpdated || 'Live'
    },
    gmpHistory,
    subscription: {
      overall: subTotal,
      retail: subRetail,
      qib: subQib,
      nii: subNii,
      updatedAt: new Date().toISOString()
    },
    biddingDates: formatBiddingDates(item.openDate, item.closeDate),
    openDate: item.openDate || 'TBA',
    closeDate: item.closeDate || 'TBA',
    allotmentDate: item.allotmentDate || 'TBA',
    refundDate: item.allotmentDate || 'TBA',
    listingDate: item.listDate || 'TBA',
    estimatedListingPrice: estList,
    estimatedLotProfit: gmpVal * lotSize,
    aiPrediction: {
      predictedPrice: Math.round(estList * 100) / 100,
      estProfit: gmpVal * lotSize,
      percent: gmpPct,
      sentiment: gmpPct > 15 ? 'Very Bullish' : (gmpPct > 0 ? 'Bullish' : 'Neutral')
    },
    leadManagers: leadMgrs,
    registrar: item.registrar || 'Link Intime / KFin Technologies',
    aboutCompany: item.aboutCompany || '',
    strengths: cleanStrengths,
    risks: cleanRisks,
    financials: formattedFinancials,
    rawFinancials: item.financials || null,
    kpi: item.kpi || null,
    issueDetails: item.issueDetails || null,
    riskLevel: gmpPct > 35 ? 'High Demand' : (gmpPct > 10 ? 'Moderate' : 'Speculative'),
    isLiveExtracted: true,
    source: 'Live',
    updatedAt: new Date().toISOString()
  };
}

export const ipoService = {
  // Pure Live Data Extractor: Direct API first, with RSC stream fallback
  async fetchFromIPOGyani() {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/html, */*'
    };

    // 1. Primary: Direct JSON REST API
    try {
      const res = await fetch('https://ipogyani.com/api/ipos', { headers });
      if (res.ok) {
        const jsonList = await res.json();
        if (Array.isArray(jsonList) && jsonList.length > 0) {
          const parsed = jsonList.map(normalizeIpoItem);
          console.log(`[IPO Service] Extracted ${parsed.length} live IPOs via /api/ipos`);
          return parsed;
        }
      } else {
        console.warn(`[IPO Service] /api/ipos returned status ${res.status}`);
      }
    } catch (err) {
      console.warn('[IPO Service] /api/ipos fetch failed, attempting HTML fallback:', err.message);
    }

    // 2. Secondary Fallback: HTML Next.js RSC Stream
    try {
      const res = await fetch('https://ipogyani.com/', { headers });
      if (res.ok) {
        const html = await res.text();
        const rscChunks = html.match(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g) || [];
        const fullRsc = rscChunks.join('\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        const startIdx = fullRsc.indexOf('"ipos":[');
        if (startIdx !== -1) {
          const rawArray = extractBalancedArray(fullRsc, startIdx + 7).replace(/"\$undefined"/g, 'null');
          const ipoList = JSON.parse(rawArray);
          if (Array.isArray(ipoList) && ipoList.length > 0) {
            const parsed = ipoList.map(normalizeIpoItem);
            console.log(`[IPO Service] Extracted ${parsed.length} live IPOs via HTML RSC fallback`);
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('[IPO Service] HTML fallback also failed:', err.message);
    }

    return runtimeIPOs;
  },

  // Dynamic Full Detail Extractor for any IPO
  async fetchIPODetailFromGyani(slug) {
    try {
      let targetSlug = slug;
      if (slug.includes('jio') && !slug.includes('tentative')) {
        targetSlug = 'jio-platforms-tentative-ipo';
      }

      // Check if runtime already has this IPO with complete details
      const existing = runtimeIPOs.find(i => i.slug === targetSlug || (targetSlug.includes('jio') && i.slug.includes('jio')));
      if (existing && existing.issueDetails && existing.gmpHistory?.length > 1) {
        return existing;
      }

      const res = await fetch(`https://ipogyani.com/ipo/${targetSlug}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });

      if (!res.ok) return null;

      const html = await res.text();
      const rscChunks = html.match(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g) || [];
      const fullRsc = rscChunks.join('\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      const startIdx = fullRsc.indexOf('{"ipo":{');
      if (startIdx === -1) return null;

      const rawJson = extractBalancedObject(fullRsc, startIdx + 7).replace(/"\$undefined"/g, 'null');
      const rawIpo = JSON.parse(rawJson);

      return normalizeIpoItem({ ...rawIpo, slug: targetSlug });
    } catch (err) {
      console.warn('[IPO Service] Detail fetch failed:', err.message);
      return null;
    }
  },

  // Main Live Fetch
  async fetchLiveIPOs() {
    try {
      console.log('[IPO Service] Fetching dynamic live IPOs...');
      const list = await this.fetchFromIPOGyani();

      if (list && list.length > 0) {
        runtimeIPOs = list;

        // Fetch deep detail for Jio Platforms if present
        const jioIndex = runtimeIPOs.findIndex(i => i.slug.includes('jio'));
        if (jioIndex !== -1 && (!runtimeIPOs[jioIndex].gmpHistory || runtimeIPOs[jioIndex].gmpHistory.length <= 1)) {
          const jioDetail = await this.fetchIPODetailFromGyani('jio-platforms-tentative-ipo');
          if (jioDetail) {
            runtimeIPOs[jioIndex] = { ...runtimeIPOs[jioIndex], ...jioDetail };
          }
        }

        lastExtractedAt = new Date().toISOString();
        console.log(`[IPO Service] Synchronized ${runtimeIPOs.length} live IPOs!`);
      }

      return runtimeIPOs;
    } catch (err) {
      console.error('[IPO Service] Error during live sync:', err.message);
      return runtimeIPOs;
    }
  },

  getAllIPOs(status = 'all') {
    // Auto-refresh in background if cache is older than 60 seconds
    if (!lastExtractedAt || (Date.now() - new Date(lastExtractedAt).getTime() > 60000)) {
      this.fetchLiveIPOs().catch(() => {});
    }

    if (!status || status === 'all') {
      return runtimeIPOs;
    }
    return runtimeIPOs.filter(ipo => ipo.status.toLowerCase() === status.toLowerCase());
  },

  getIPOBySlug(slug) {
    if (!slug) return null;
    const clean = slug.toLowerCase().trim();
    const ipo = runtimeIPOs.find(i =>
      i.slug === clean ||
      i.symbol?.toLowerCase() === clean ||
      (clean.includes('jio') && i.slug.includes('jio'))
    );
    if (ipo) return ipo;

    return runtimeIPOs.find(i => i.companyName.toLowerCase().includes(clean)) || null;
  },

  async getIPOBySlugAsync(slug) {
    if (!slug) return null;
    const existing = this.getIPOBySlug(slug);

    if (existing && existing.gmpHistory && existing.gmpHistory.length > 1 && existing.financials?.length > 0) {
      return existing;
    }

    const dynamicDetail = await this.fetchIPODetailFromGyani(slug);
    if (dynamicDetail) {
      const idx = runtimeIPOs.findIndex(i => i.slug === dynamicDetail.slug || (slug.includes('jio') && i.slug.includes('jio')));
      if (idx !== -1) {
        runtimeIPOs[idx] = { ...runtimeIPOs[idx], ...dynamicDetail };
        return runtimeIPOs[idx];
      } else {
        runtimeIPOs.unshift(dynamicDetail);
        return dynamicDetail;
      }
    }

    return existing;
  },

  getGMP(slug) {
    const ipo = this.getIPOBySlug(slug);
    if (!ipo) return null;
    return {
      companyName: ipo.companyName,
      slug: ipo.slug,
      priceBand: ipo.priceBand,
      maxPrice: ipo.maxPrice,
      gmp: ipo.gmp,
      gmpHistory: ipo.gmpHistory || [],
      lastReported: ipo.gmp.lastReported,
      disclaimer: 'Grey Market Premium (GMP) is strictly unofficial and indicative.'
    };
  },

  async refreshIPO(slug, clientIp = '127.0.0.1') {
    const key = `ipo_${slug}_${clientIp}`;
    const last = ipoCooldowns.get(key);
    const now = Date.now();

    if (last) {
      const elapsed = (now - last) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - elapsed);
        return {
          success: false,
          code: 'RATE_LIMITED',
          message: `Please wait ${remaining}s before refreshing IPO data.`,
          retryAfter: remaining
        };
      }
    }

    ipoCooldowns.set(key, now);

    // Refresh live
    await this.fetchLiveIPOs();

    const ipo = await this.getIPOBySlugAsync(slug);
    if (!ipo) {
      return { success: false, code: 'NOT_FOUND', message: 'IPO not found.' };
    }

    return {
      success: true,
      data: ipo,
      updatedAt: ipo.updatedAt
    };
  },

  getLastSyncTime() {
    return lastExtractedAt || new Date().toISOString();
  }
};

// Immediate background sync on launch
ipoService.fetchLiveIPOs().catch(err => {
  console.warn('[IPO Service] Initial background fetch postponed:', err.message);
});

// Automatic continuous background polling: Auto-fetch new IPOs and live GMP every 60s
const AUTO_SYNC_INTERVAL_MS = 60 * 1000;
setInterval(() => {
  ipoService.fetchLiveIPOs().catch(err => {
    console.warn('[IPO Service] Auto-sync background interval error:', err.message);
  });
}, AUTO_SYNC_INTERVAL_MS);

