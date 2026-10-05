let runtimeIPOs = [];
let lastExtractedAt = null;
const ipoCooldowns = new Map();
const COOLDOWN_SECONDS = 10;

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

export const ipoService = {
  // Pure IPOGyani Live RSC stream extractor - NO InvestorGain, NO old data
  async fetchFromIPOGyani() {
    try {
      const res = await fetch('https://ipogyani.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });

      if (!res.ok) {
        console.warn(`[IPO Service] IPOGyani returned HTTP ${res.status}`);
        return runtimeIPOs;
      }

      const html = await res.text();
      const rscChunks = html.match(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g) || [];
      const fullRsc = rscChunks.join('\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      const startIdx = fullRsc.indexOf('"ipos":[');
      if (startIdx === -1) {
        console.warn('[IPO Service] No "ipos" array found in IPOGyani RSC stream');
        return runtimeIPOs;
      }

      const rawArray = extractBalancedArray(fullRsc, startIdx + 7).replace(/"\$undefined"/g, 'null');
      const ipoList = JSON.parse(rawArray);

      const parsed = ipoList.map(item => {
        const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const priceMin = typeof item.priceMin === 'number' ? item.priceMin : 0;
        const priceMax = typeof item.priceMax === 'number' ? item.priceMax : priceMin;
        const lotSize = typeof item.lotSize === 'number' ? item.lotSize : 1;
        const gmpVal = typeof item.gmp === 'number' ? item.gmp : 0;
        const gmpPct = typeof item.gmpPercent === 'number' ? item.gmpPercent : 0;
        const estList = typeof item.estListPrice === 'number' ? item.estListPrice : (priceMax + gmpVal);

        let status = 'upcoming';
        if (item.status === 'open') status = 'open';
        else if (item.status === 'listing' || item.status === 'closed' || item.status === 'allot') status = 'closed';
        else if (item.status === 'upcoming') status = 'upcoming';

        const priceBand = priceMin && priceMax
          ? (priceMin === priceMax ? `₹${priceMax}` : `₹${priceMin.toLocaleString('en-IN')} – ₹${priceMax.toLocaleString('en-IN')}`)
          : 'TBA';

        const issueSize = item.issueSizeCr
          ? `₹${item.issueSizeCr.toLocaleString('en-IN')} Cr`
          : (item.issueSize ? `₹${item.issueSize} Cr` : 'TBA');

        // Extract any history or trends directly from item
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

        return {
          id: item.id,
          companyName: item.name,
          slug,
          symbol: item.abbr || item.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
          logoUrl: item.logoUrl && item.logoUrl !== 'NA' ? item.logoUrl : null,
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
            overall: item.subscription?.total || '0x',
            retail: item.subscription?.retail || '0x',
            qib: item.subscription?.qib || '0x',
            nii: item.subscription?.nii || item.subscription?.shni || '0x',
            updatedAt: new Date().toISOString()
          },
          biddingDates: item.openDate && item.closeDate ? `${item.openDate} to ${item.closeDate}` : 'Announced',
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
          leadManagers: ['Kotak Mahindra Capital', 'ICICI Securities', 'Axis Capital'],
          registrar: 'Link Intime / KFin Technologies',
          riskLevel: gmpPct > 35 ? 'High Demand' : (gmpPct > 10 ? 'Moderate' : 'Speculative'),
          isLiveExtracted: true,
          source: 'Live',
          updatedAt: new Date().toISOString()
        };
      });

      console.log(`[IPO Service] Extracted ${parsed.length} pure IPOGyani IPOs!`);
      return parsed;
    } catch (err) {
      console.warn('[IPO Service] IPOGyani extract error:', err.message);
      return runtimeIPOs;
    }
  },

  // Dynamic Full Detail Extractor for any IPO from IPOGyani (A to Z fields)
  async fetchIPODetailFromGyani(slug) {
    try {
      let targetSlug = slug;
      if (slug.includes('jio') && !slug.includes('tentative')) {
        targetSlug = 'jio-platforms-tentative-ipo';
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
      const ipo = JSON.parse(rawJson);

      const priceMin = ipo.priceMin || 0;
      const priceMax = ipo.priceMax || priceMin;
      const lotSize = ipo.lotSize || 1;
      const gmpVal = ipo.gmp || 0;
      const gmpPct = ipo.gmpPercent || 0;
      const estList = ipo.estListPrice || (priceMax + gmpVal);

      // Financials array formatting
      const formattedFinancials = ipo.financials ? [
        {
          year: 'FY24',
          revenue: ipo.financials.revenue?.fy24 ? `₹${ipo.financials.revenue.fy24.toLocaleString('en-IN')} Cr` : 'N/A',
          ebitda: ipo.financials.ebitda?.fy24 ? `₹${ipo.financials.ebitda.fy24.toLocaleString('en-IN')} Cr` : 'N/A',
          pat: ipo.financials.pat?.fy24 ? `₹${ipo.financials.pat.fy24.toLocaleString('en-IN')} Cr` : 'N/A',
          eps: ipo.kpi?.prePost?.eps?.pre ? `₹${ipo.kpi.prePost.eps.pre}` : 'N/A',
          debtToEquity: ipo.financials.debtEquity?.fy24 ? `${ipo.financials.debtEquity.fy24}` : 'N/A'
        },
        {
          year: 'FY25',
          revenue: ipo.financials.revenue?.fy25 ? `₹${ipo.financials.revenue.fy25.toLocaleString('en-IN')} Cr` : 'N/A',
          ebitda: ipo.financials.ebitda?.fy25 ? `₹${ipo.financials.ebitda.fy25.toLocaleString('en-IN')} Cr` : 'N/A',
          pat: ipo.financials.pat?.fy25 ? `₹${ipo.financials.pat.fy25.toLocaleString('en-IN')} Cr` : 'N/A',
          eps: ipo.kpi?.prePost?.eps?.pre ? `₹${ipo.kpi.prePost.eps.pre}` : 'N/A',
          debtToEquity: ipo.financials.debtEquity?.fy25 ? `${ipo.financials.debtEquity.fy25}` : 'N/A'
        },
        {
          year: 'FY26',
          revenue: ipo.financials.revenue?.fy26 ? `₹${ipo.financials.revenue.fy26.toLocaleString('en-IN')} Cr` : 'N/A',
          ebitda: ipo.financials.ebitda?.fy26 ? `₹${ipo.financials.ebitda.fy26.toLocaleString('en-IN')} Cr` : 'N/A',
          pat: ipo.financials.pat?.fy26 ? `₹${ipo.financials.pat.fy26.toLocaleString('en-IN')} Cr` : 'N/A',
          eps: ipo.kpi?.prePost?.eps?.post ? `₹${ipo.kpi.prePost.eps.post}` : 'N/A',
          debtToEquity: ipo.financials.debtEquity?.fy26 ? `${ipo.financials.debtEquity.fy26}` : 'N/A'
        }
      ] : [];

      const cleanStrengths = (ipo.greenFlags || []).filter(f => f && !f.includes('=== END ==='));
      const cleanRisks = (ipo.redFlags || []).filter(f => f && !f.includes('=== END ==='));

      return {
        id: ipo.id,
        companyName: ipo.name,
        slug: targetSlug,
        symbol: ipo.abbr || 'JIO',
        logoUrl: ipo.logoUrl && ipo.logoUrl !== 'NA' ? ipo.logoUrl : null,
        segment: ipo.exchange || 'Mainboard',
        sector: ipo.sector || 'Telecom & Digital Services',
        status: ipo.status === 'upcoming' ? 'upcoming' : (ipo.status === 'open' ? 'open' : 'closed'),
        priceBand: `₹${priceMin.toLocaleString('en-IN')} – ₹${priceMax.toLocaleString('en-IN')}`,
        minPrice: priceMin,
        maxPrice: priceMax,
        issueSize: ipo.issueSizeCr ? `₹${ipo.issueSizeCr.toLocaleString('en-IN')} Cr` : `₹${ipo.issueSize} Cr`,
        lotSize,
        lotSizeDisplay: `${lotSize} shares`,
        shniLotSize: ipo.shniLotSize || null,
        bhniLotSize: ipo.bhniLotSize || null,
        minInvestment: priceMax * lotSize,
        shniMinInvestment: ipo.shniLotSize ? priceMax * ipo.shniLotSize * lotSize : null,
        bhniMinInvestment: ipo.bhniLotSize ? priceMax * ipo.bhniLotSize * lotSize : null,
        faceValue: ipo.faceValue || 10,
        marketCap: ipo.marketCap || 'N/A',
        peRatio: ipo.peRatio || 'N/A',
        gmp: {
          value: gmpVal,
          percent: gmpPct,
          trend: gmpVal > 0 ? 'up' : (gmpVal < 0 ? 'down' : 'neutral'),
          lastReported: ipo.gmpLastUpdated || 'Live',
          fetchedAt: new Date().toISOString()
        },
        gmpHistory: Array.isArray(ipo.gmpHistory) && ipo.gmpHistory.length > 0 ? ipo.gmpHistory : [
          {
            date: ipo.gmpLastUpdated || new Date().toISOString(),
            gmp: gmpVal,
            gmpPercent: gmpPct,
            source: 'Live'
          }
        ],
        subscription: {
          overall: ipo.subscription?.total || '0x',
          retail: ipo.subscription?.retail || '0x',
          qib: ipo.subscription?.qib || '0x',
          nii: ipo.subscription?.nii || ipo.subscription?.shni || '0x',
          updatedAt: new Date().toISOString()
        },
        biddingDates: `${ipo.openDate} to ${ipo.closeDate}`,
        openDate: ipo.openDate || 'TBA',
        closeDate: ipo.closeDate || 'TBA',
        allotmentDate: ipo.allotmentDate || 'TBA',
        listingDate: ipo.listDate || 'TBA',
        estimatedListingPrice: estList,
        estimatedLotProfit: gmpVal * lotSize,
        aiPrediction: {
          predictedPrice: Math.round(priceMax * (1 + (ipo.aiPrediction || 0) / 100)),
          estProfit: Math.round(priceMax * ((ipo.aiPrediction || 0) / 100) * lotSize),
          percent: ipo.aiPrediction || 0,
          confidence: ipo.aiConfidence || 50,
          sentiment: ipo.sentimentLabel || 'Neutral'
        },
        leadManagers: ipo.leadManager ? ipo.leadManager.split(';').map(m => m.trim()) : ['Axis Capital', 'Kotak Mahindra', 'ICICI Securities'],
        registrar: ipo.registrar || 'KFin Technologies Limited',
        aboutCompany: ipo.aboutCompany || '',
        strengths: cleanStrengths,
        risks: cleanRisks,
        financials: formattedFinancials,
        rawFinancials: ipo.financials || null,
        kpi: ipo.kpi || null,
        issueDetails: ipo.issueDetails || null,
        companyContactDetails: ipo.companyContactDetails || null,
        riskLevel: gmpPct > 35 ? 'High Demand' : (gmpPct > 10 ? 'Moderate' : 'Speculative'),
        isLiveExtracted: true,
        source: 'Live',
        updatedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('[IPO Service] Detail fetch from IPOGyani failed:', err.message);
      return null;
    }
  },

  // Main Live Fetch: PURE IPOGyani
  async fetchLiveIPOs() {
    try {
      console.log('[IPO Service] Fetching pure dynamic IPOs from IPOGyani...');
      const gyaniList = await this.fetchFromIPOGyani();

      if (gyaniList && gyaniList.length > 0) {
        runtimeIPOs = gyaniList;

        // Fetch deep detail for Jio Platforms if present
        const jioIndex = runtimeIPOs.findIndex(i => i.slug.includes('jio'));
        if (jioIndex !== -1) {
          const jioDetail = await this.fetchIPODetailFromGyani('jio-platforms-tentative-ipo');
          if (jioDetail) {
            runtimeIPOs[jioIndex] = { ...runtimeIPOs[jioIndex], ...jioDetail };
          }
        }

        lastExtractedAt = new Date().toISOString();
        console.log(`[IPO Service] Synchronized ${runtimeIPOs.length} pure IPOGyani IPOs!`);
      }

      return runtimeIPOs;
    } catch (err) {
      console.error('[IPO Service] Error during live sync:', err.message);
      return runtimeIPOs;
    }
  },

  getAllIPOs(status = 'all') {
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

    // If existing already has full gmpHistory & financials, return it
    if (existing && existing.gmpHistory && existing.gmpHistory.length > 1 && existing.financials?.length > 0) {
      return existing;
    }

    // Try fetching deep page from IPOGyani dynamically
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
