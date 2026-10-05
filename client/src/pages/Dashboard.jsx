import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Star, 
  Rocket, 
  Newspaper, 
  TrendingUp, 
  TrendingDown,
  Layers,
  Sparkles,
  Bot,
  Activity,
  Search,
  ExternalLink,
  ChevronRight,
  Flame,
  ShieldCheck,
  Zap,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import MarketIndices from '../components/market/MarketIndices';
import GMPBadge from '../components/ipo/GMPBadge';
import FreshnessIndicator from '../components/common/FreshnessIndicator';
import { useWatchlist } from '../context/WatchlistContext';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [ipos, setIpos] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moversTab, setMoversTab] = useState('gainers'); // 'gainers' | 'losers' | 'breakouts'
  const [moversSearch, setMoversSearch] = useState('');
  const [aiSearchSymbol, setAiSearchSymbol] = useState('');

  const { isWatched, toggleWatchlist } = useWatchlist();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [ovRes, ipoRes, newsRes] = await Promise.all([
        api.getMarketOverview(),
        api.getIPOs(),
        api.getNews('', '', 6)
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (ipoRes.success) setIpos(ipoRes.data);
      if (newsRes.success) setNews(newsRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Quick sectors ribbon
  const sectors = useMemo(() => [
    { name: 'NIFTY AUTO', change: '+1.45%', isUp: true },
    { name: 'NIFTY IT', change: '+0.81%', isUp: true },
    { name: 'NIFTY BANK', change: '+0.55%', isUp: true },
    { name: 'NIFTY OIL & GAS', change: '+0.70%', isUp: true },
    { name: 'NIFTY REALTY', change: '+1.12%', isUp: true },
    { name: 'NIFTY FMCG', change: '-0.24%', isUp: false },
    { name: 'NIFTY METAL', change: '-0.52%', isUp: false },
    { name: 'NIFTY PHARMA', change: '+0.32%', isUp: true }
  ], []);

  // Filtered Movers
  const currentMoversList = useMemo(() => {
    if (!overview) return [];
    let list = [];
    if (moversTab === 'gainers') list = overview.gainers || [];
    else if (moversTab === 'losers') list = overview.losers || [];
    else list = overview.high52Breakouts || [];

    if (!moversSearch.trim()) return list;
    const q = moversSearch.toLowerCase();
    return list.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }, [overview, moversTab, moversSearch]);

  // Market Breadth calculation based on Nifty 50 or top indices
  const breadthStats = useMemo(() => {
    const nifty = overview?.indices?.find(idx => idx.symbol.includes('50')) || overview?.indices?.[0];
    const advances = nifty?.advances || 34;
    const declines = nifty?.declines || 16;
    const total = advances + declines;
    const advPercent = Math.round((advances / (total || 1)) * 100);
    const decPercent = 100 - advPercent;
    return {
      advances,
      declines,
      advPercent,
      decPercent,
      ratio: (advances / (declines || 1)).toFixed(2)
    };
  }, [overview]);

  // Top gainer and loser
  const topGainer = overview?.gainers?.[0];
  const topLoser = overview?.losers?.[0];

  // Top IPO with highest GMP
  const topGmpIpo = useMemo(() => {
    if (!ipos || ipos.length === 0) return null;
    return [...ipos].sort((a, b) => {
      const valA = typeof a.gmp === 'object' ? (a.gmp?.value || 0) : (Number(a.gmp) || 0);
      const valB = typeof b.gmp === 'object' ? (b.gmp?.value || 0) : (Number(b.gmp) || 0);
      return valB - valA;
    })[0];
  }, [ipos]);

  const handleAiLaunch = (e) => {
    e.preventDefault();
    const clean = aiSearchSymbol.trim().toUpperCase() || 'TATAMOTORS';
    navigate(`/ai?symbol=${clean}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. Terminal Header & Market Breadth Command Bar */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Title & Live Status */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              Market Terminal Overview
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'var(--positive-bg)',
              color: 'var(--positive)',
              border: '1px solid var(--positive-border)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--positive)' }} />
              Live Terminal
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Real-time Indian Equity, F&O benchmark feeds & Primary Market intelligence
          </div>
        </div>

        {/* Market Breadth & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Breadth Bar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '200px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
              <span style={{ color: 'var(--positive)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                ▲ {breadthStats.advances} Advances ({breadthStats.advPercent}%)
              </span>
              <span style={{ color: 'var(--negative)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                ▼ {breadthStats.declines} Declines ({breadthStats.decPercent}%)
              </span>
            </div>
            <div style={{
              height: '6px',
              width: '100%',
              backgroundColor: 'var(--negative)',
              borderRadius: '3px',
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div style={{
                width: `${breadthStats.advPercent}%`,
                backgroundColor: 'var(--positive)',
                height: '100%',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing || loading}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text)'
            }}
            title="Fetch latest quotes"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Market'}</span>
          </button>
        </div>
      </div>

      {/* 2. Benchmark Indices Hero Strip */}
      {overview?.indices && (
        <MarketIndices indices={overview.indices} />
      )}

      {/* 3. 4-Pillar Financial Bento Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px'
      }}>
        {/* Card 1: Market Tone & Sentiment */}
        <div className="terminal-card interactive-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              MARKET BREADTH
            </span>
            <Activity size={15} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--positive)' }}>
              Bullish Momentum
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              ({breadthStats.ratio}x A/D)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Nifty 50 buyers outnumber sellers across cash segments.
          </div>
        </div>

        {/* Card 2: Top Day Gainer Spotlight */}
        <div className="terminal-card interactive-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              TOP NSE GAINER
            </span>
            <TrendingUp size={15} color="var(--positive)" />
          </div>
          {topGainer ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Link to={`/stocks/${topGainer.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '16px' }}>
                  {topGainer.symbol}
                </Link>
                <span className="num" style={{ color: 'var(--positive)', fontWeight: 700, fontSize: '14px' }}>
                  +{topGainer.changePercent}%
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                ₹{topGainer.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })} • Vol: {(topGainer.volume / 100000).toFixed(1)}L
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading gainer data...</div>
          )}
        </div>

        {/* Card 3: Top IPO GMP Hotspot */}
        <div className="terminal-card interactive-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              HOTTEST IPO GMP
            </span>
            <Rocket size={15} color="var(--primary)" />
          </div>
          {topGmpIpo ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <Link to={`/ipos/${topGmpIpo.slug}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {topGmpIpo.companyName}
                </Link>
                <GMPBadge gmp={topGmpIpo.gmp} maxPrice={topGmpIpo.maxPrice} compact />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Band: {topGmpIpo.priceBand} • Est. Listing: ₹{(topGmpIpo.estimatedListingPrice || 0).toLocaleString('en-IN')}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scanning primary market...</div>
          )}
        </div>

        {/* Card 4: AI Valuation Terminal Launcher */}
        <div className="terminal-card interactive-card" style={{ padding: '14px 16px', backgroundColor: 'var(--surface-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              AI INTELLIGENCE DESK
            </span>
            <Bot size={15} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
              Peer & Valuation Engine
            </span>
            <Link to="/ai" style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              Launch →
            </Link>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Deep balance sheet audits & Gemini financial analysis.
          </div>
        </div>
      </div>

      {/* 4. Quick Sector Performance Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap'
        }}>
          <Layers size={13} color="var(--primary)" />
          <span>SECTORS:</span>
        </div>
        {sectors.map(sec => (
          <Link
            key={sec.name}
            to="/market?tab=sectors"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              textDecoration: 'none',
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontWeight: 600 }}>{sec.name}</span>
            <span className="num" style={{
              fontWeight: 600,
              color: sec.isUp ? 'var(--positive)' : 'var(--negative)',
              fontSize: '11px'
            }}>
              {sec.change}
            </span>
          </Link>
        ))}
      </div>

      {/* 5. Main 2-Column Terminal Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
        gap: '20px',
        alignItems: 'start'
      }}>

        {/* LEFT COLUMN: Top Movers Dock + Active IPOs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Market Movers Terminal Widget */}
          <div className="terminal-card">
            {/* Header with Tab Navigation & Search */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--surface-secondary)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              {/* Tab Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setMoversTab('gainers')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: moversTab === 'gainers' ? 'var(--surface)' : 'transparent',
                    color: moversTab === 'gainers' ? 'var(--positive)' : 'var(--text-secondary)',
                    boxShadow: moversTab === 'gainers' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <TrendingUp size={14} />
                  <span>Top Gainers ({overview?.gainers?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMoversTab('losers')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: moversTab === 'losers' ? 'var(--surface)' : 'transparent',
                    color: moversTab === 'losers' ? 'var(--negative)' : 'var(--text-secondary)',
                    boxShadow: moversTab === 'losers' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <TrendingDown size={14} />
                  <span>Top Losers ({overview?.losers?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMoversTab('breakouts')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: moversTab === 'breakouts' ? 'var(--surface)' : 'transparent',
                    color: moversTab === 'breakouts' ? 'var(--primary)' : 'var(--text-secondary)',
                    boxShadow: moversTab === 'breakouts' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Sparkles size={14} />
                  <span>52W Highs ({overview?.high52Breakouts?.length || 0})</span>
                </button>
              </div>

              {/* Filter Search */}
              <div style={{ position: 'relative', width: '160px' }}>
                <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '8px' }} />
                <input
                  type="text"
                  placeholder="Filter movers..."
                  value={moversSearch}
                  onChange={(e) => setMoversSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px 4px 26px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="terminal-table">
                <thead>
                  <tr>
                    <th>Symbol & Company</th>
                    <th className="num-col">LTP</th>
                    <th className="num-col">Change %</th>
                    <th className="num-col hide-on-mobile">Day High / Low</th>
                    <th className="num-col hide-on-mobile">Volume</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {currentMoversList.length > 0 ? (
                    currentMoversList.slice(0, 7).map(stock => {
                      const isUp = stock.changePercent >= 0;
                      return (
                        <tr key={stock.symbol}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Link
                                to={`/stocks/${stock.symbol}`}
                                style={{
                                  textDecoration: 'none',
                                  color: 'var(--text)',
                                  fontWeight: 700,
                                  fontSize: '13px'
                                }}
                              >
                                {stock.symbol}
                              </Link>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'var(--surface-secondary)', padding: '1px 5px', borderRadius: '3px' }}>
                                {stock.exchange || 'NSE'}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {stock.name}
                            </div>
                          </td>

                          <td className="num-col num" style={{ fontWeight: 700, fontSize: '13px' }}>
                            ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="num-col num" style={{
                            color: isUp ? 'var(--positive)' : 'var(--negative)',
                            fontWeight: 700,
                            fontSize: '13px'
                          }}>
                            {isUp ? '+' : ''}{stock.changePercent}%
                          </td>

                          <td className="num-col num hide-on-mobile" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span>H: ₹{(stock.high || stock.ltp).toLocaleString('en-IN')}</span>
                            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>|</span>
                            <span>L: ₹{(stock.low || stock.ltp).toLocaleString('en-IN')}</span>
                          </td>

                          <td className="num-col num hide-on-mobile" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {stock.volume ? (stock.volume / 100000).toFixed(1) + ' L' : '—'}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => toggleWatchlist(stock.symbol)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px' }}
                              title={isWatched(stock.symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
                            >
                              <Star
                                size={14}
                                color={isWatched(stock.symbol) ? '#EAB308' : 'var(--text-muted)'}
                                fill={isWatched(stock.symbol) ? '#EAB308' : 'transparent'}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No records matching filter in this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Link */}
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Showing top active symbols • Real-time quotes
              </span>
              <Link
                to={moversTab === 'losers' ? '/market?tab=movers' : moversTab === 'breakouts' ? '/market?tab=breakouts' : '/market?tab=movers'}
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Full Movers Terminal</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Active & Upcoming IPOs Live Radar */}
          <div className="terminal-card">
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--surface-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Rocket size={16} color="var(--primary)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  PRIMARY MARKET & LIVE IPO GMP RADAR
                </span>
              </div>
              <Link to="/ipos" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                View All {ipos.length} IPOs →
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="terminal-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Price Band</th>
                    <th className="num-col">Lot Size</th>
                    <th className="num-col">Live GMP</th>
                    <th>Timeline</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ipos.slice(0, 5).map(ipo => (
                    <tr key={ipo.slug}>
                      <td>
                        <Link to={`/ipos/${ipo.slug}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600 }}>
                          {ipo.companyName}
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Issue: {ipo.issueSize}</div>
                      </td>

                      <td className="num" style={{ fontWeight: 600 }}>
                        {ipo.priceBand}
                      </td>

                      <td className="num-col num" style={{ color: 'var(--text-secondary)' }}>
                        {ipo.lotSize} shares
                      </td>

                      <td className="num-col">
                        <GMPBadge gmp={ipo.gmp} maxPrice={ipo.maxPrice} compact />
                      </td>

                      <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {ipo.openDate} – {ipo.closeDate}
                      </td>

                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor: ipo.status === 'open' ? 'var(--positive-bg)' : 'var(--surface-secondary)',
                          color: ipo.status === 'open' ? 'var(--positive)' : 'var(--text-secondary)',
                          border: `1px solid ${ipo.status === 'open' ? 'var(--positive-border)' : 'var(--border)'}`
                        }}>
                          {ipo.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/ipos/${ipo.slug}`} className="btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}>
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Valuation Quick Launcher + News Dispatches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Quick AI Valuation Launcher Widget */}
          <div className="terminal-card" style={{
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)' 
              : 'linear-gradient(135deg, rgba(224, 242, 254, 0.6) 0%, rgba(255, 255, 255, 0.95) 100%)',
            padding: '18px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                padding: '6px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex'
              }}>
                <Bot size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  AI Financial Research Desk
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Instant Balance Sheet & Moat Diagnosis
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0 14px' }}>
              Evaluate fundamentals, historical P/E bands, and competitor valuations powered by Gemini AI.
            </p>

            <form onSubmit={handleAiLaunch} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter stock (e.g. TCS, HDFCBANK)..."
                value={aiSearchSymbol}
                onChange={(e) => setAiSearchSymbol(e.target.value)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '7px 14px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Audit</span>
                <ChevronRight size={13} />
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Picks:</span>
              {['TATAMOTORS', 'RELIANCE', 'INFY', 'ZOMATO'].map(sym => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => navigate(`/ai?symbol=${sym}`)}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 7px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    cursor: 'pointer'
                  }}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Market Dispatches & Live News */}
          <div className="terminal-card">
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--surface-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Newspaper size={15} color="var(--primary)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  MARKET DISPATCHES & HEADLINES
                </span>
              </div>
              <Link to="/news" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                All News →
              </Link>
            </div>

            <div style={{
              maxHeight: '430px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {news.slice(0, 5).map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'background-color 0.1s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{item.source} • {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span style={{
                      backgroundColor: 'var(--surface-secondary)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      {item.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>
                    {item.title}
                  </div>

                  {item.summary && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.summary}
                    </div>
                  )}

                  {item.symbols && item.symbols.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', marginTop: '2px' }}>
                      {item.symbols.map(sym => (
                        <Link
                          key={sym}
                          to={`/stocks/${sym}`}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--primary)',
                            backgroundColor: 'var(--primary-subtle)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            textDecoration: 'none'
                          }}
                        >
                          {sym}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Compact Bottom Footer */}
            <div style={{
              padding: '8px 14px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface-secondary)',
              textAlign: 'center',
              fontSize: '11px'
            }}>
              <Link to="/news" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                View All Financial News Dispatches →
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
