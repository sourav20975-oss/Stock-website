import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Search, 
  Activity, 
  Zap, 
  Award, 
  ShieldCheck, 
  Flame, 
  SlidersHorizontal,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import MarketIndices from '../components/market/MarketIndices';
import { useTheme } from '../context/ThemeContext';

export default function Market() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const tabFromUrl = searchParams.get('tab') || 'indices';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  // Keep state and URL in sync
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'indices';
    setActiveTab(currentTab);
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'indices') {
      navigate('/market', { replace: true });
    } else {
      navigate(`/market?tab=${newTab}`, { replace: true });
    }
  };

  const fetchOverview = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.getMarketOverview();
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error('Market overview fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const sectors = useMemo(() => [
    { name: 'NIFTY IT', change: '+0.81%', changePercent: 0.81, isUp: true, pe: '29.4x', topStock: 'TCS (+1.38%)', breadth: '7/3' },
    { name: 'NIFTY AUTO', change: '+1.45%', changePercent: 1.45, isUp: true, pe: '24.2x', topStock: 'TATAMOTORS (+2.34%)', breadth: '11/4' },
    { name: 'NIFTY BANK', change: '+0.55%', changePercent: 0.55, isUp: true, pe: '16.8x', topStock: 'HDFCBANK (+0.42%)', breadth: '8/4' },
    { name: 'NIFTY PHARMA', change: '+0.32%', changePercent: 0.32, isUp: true, pe: '34.1x', topStock: 'SUNPHARMA (+0.75%)', breadth: '6/4' },
    { name: 'NIFTY FMCG', change: '-0.24%', changePercent: -0.24, isUp: false, pe: '42.5x', topStock: 'ITC (+4.67%)', breadth: '4/11' },
    { name: 'NIFTY OIL & GAS', change: '+0.70%', changePercent: 0.70, isUp: true, pe: '14.5x', topStock: 'RELIANCE (+0.54%)', breadth: '9/6' },
    { name: 'NIFTY METAL', change: '-0.52%', changePercent: -0.52, isUp: false, pe: '13.9x', topStock: 'TATASTEEL (-0.85%)', breadth: '3/12' },
    { name: 'NIFTY REALTY', change: '+1.12%', changePercent: 1.12, isUp: true, pe: '38.4x', topStock: 'DLF (+1.95%)', breadth: '8/2' }
  ], []);

  // Filtered lists for Gainers and Losers
  const filteredGainers = useMemo(() => {
    if (!overview?.gainers) return [];
    if (!searchQuery.trim()) return overview.gainers;
    const q = searchQuery.toLowerCase();
    return overview.gainers.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }, [overview, searchQuery]);

  const filteredLosers = useMemo(() => {
    if (!overview?.losers) return [];
    if (!searchQuery.trim()) return overview.losers;
    const q = searchQuery.toLowerCase();
    return overview.losers.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }, [overview, searchQuery]);

  const highBreakouts = overview?.high52Breakouts || [];
  const lowBreakouts = overview?.low52Breakouts || [];

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* 1. EDITORIAL MARKET TERMINAL HEADER */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Activity size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>
                Indian Market Terminals & Live Indices
              </h1>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Institutional view of benchmark NSE / BSE indices, sector breadths, and live momentum movers
          </div>
        </div>

        {/* Live Status & Refresh Command */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            backgroundColor: 'var(--positive-bg)',
            border: '1px solid var(--positive-border)',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--positive)'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--positive)',
              boxShadow: '0 0 8px var(--positive)',
              animation: 'pulse 1.5s infinite'
            }} />
            <span>REAL-TIME NSE / BSE FEEDS</span>
          </div>

          <button
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Sync Live Exchange Quotes"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Market'}</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME INDICES CARDS (YAHOO FINANCE LIVE FEED) */}
      {overview?.indices && <MarketIndices indices={overview.indices} />}

      {/* 3. TABS NAVIGATION & QUICK FILTER BAR */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '20px',
        paddingBottom: '2px'
      }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => handleTabChange('indices')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'indices' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: activeTab === 'indices' ? 700 : 500,
              color: activeTab === 'indices' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '-2px',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart3 size={15} />
            <span>Benchmark Indices</span>
          </button>

          <button
            onClick={() => handleTabChange('movers')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'movers' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: activeTab === 'movers' ? 700 : 500,
              color: activeTab === 'movers' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '-2px',
              transition: 'all 0.15s ease'
            }}
          >
            <TrendingUp size={15} />
            <span>Top Movers (Gainers & Losers)</span>
          </button>

          <button
            onClick={() => handleTabChange('sectors')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'sectors' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: activeTab === 'sectors' ? 700 : 500,
              color: activeTab === 'sectors' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '-2px',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={15} />
            <span>Sector Heatmap</span>
          </button>

          <button
            onClick={() => handleTabChange('breakouts')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'breakouts' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: activeTab === 'breakouts' ? 700 : 500,
              color: activeTab === 'breakouts' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '-2px',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={15} color="#eab308" />
            <span>52-Week Breakouts</span>
          </button>
        </div>

        {/* Search Filter Input (for movers/indices) */}
        {(activeTab === 'movers' || activeTab === 'indices') && (
          <div style={{ position: 'relative', width: '240px', marginBottom: '6px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or name..."
              style={{
                width: '100%',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 10px 6px 30px',
                fontSize: '12px',
                color: 'var(--text)'
              }}
            />
          </div>
        )}
      </div>

      {/* 4. TAB 1: MAJOR INDICES EXPANDED DATA TABLE */}
      {activeTab === 'indices' && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                <th style={{ padding: '12px 16px' }}>INDEX NAME</th>
                <th style={{ padding: '12px 16px' }}>EXCHANGE</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>LAST TRADED PRICE</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>PTS CHANGE</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>CHANGE %</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>DAY'S SPREAD (LOW - HIGH)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>BREADTH (ADV / DEC)</th>
              </tr>
            </thead>
            <tbody>
              {overview?.indices?.map(idx => {
                const isUp = idx.changePercent >= 0;
                return (
                  <tr
                    key={idx.symbol}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text)' }}>{idx.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{idx.symbol}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        padding: '2px 7px',
                        borderRadius: '4px'
                      }}>
                        {idx.exchange}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: '14.5px', color: 'var(--text)' }}>
                      ₹{idx.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: isUp ? 'var(--positive)' : 'var(--negative)' }}>
                      {isUp ? '+' : ''}{idx.change}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{
                        backgroundColor: isUp ? 'var(--positive-bg)' : 'var(--negative-bg)',
                        color: isUp ? 'var(--positive)' : 'var(--negative)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '12px'
                      }}>
                        {isUp ? '+' : ''}{idx.changePercent}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      ₹{idx.low?.toFixed(2)} - ₹{idx.high?.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{ color: 'var(--positive)', fontWeight: 700 }}>{idx.advances} Adv</span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                      <span style={{ color: 'var(--negative)', fontWeight: 700 }}>{idx.declines} Dec</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. TAB 2: TOP MOVERS (GAINERS & LOSERS LIVE DOCK) */}
      {activeTab === 'movers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
          
          {/* TOP GAINERS CARD */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{
              padding: '14px 18px',
              backgroundColor: 'var(--positive-bg)',
              borderBottom: '1px solid var(--positive-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--positive)" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--positive)', letterSpacing: '0.3px' }}>
                  MARKET TOP GAINERS ({filteredGainers.length})
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--positive)', fontWeight: 700 }}>
                Bullish Momentum
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'left' }}>
                    <th style={{ padding: '8px 14px' }}>COMPANY</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right' }}>LTP (₹)</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right' }}>GAIN %</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGainers.map(stock => (
                    <tr
                      key={stock.symbol}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <Link to={`/stocks/${stock.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 800, fontSize: '13px' }}>
                          {stock.symbol}
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {stock.name}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--text)', fontSize: '13.5px' }}>
                        ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{
                          backgroundColor: 'var(--positive-bg)',
                          color: 'var(--positive)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '11.5px'
                        }}>
                          +{stock.changePercent}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <Link
                          to={`/stocks/${stock.symbol}`}
                          style={{
                            backgroundColor: 'var(--primary-subtle)',
                            color: 'var(--primary)',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>Terminal</span>
                          <ArrowUpRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOP LOSERS CARD */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{
              padding: '14px 18px',
              backgroundColor: 'var(--negative-bg)',
              borderBottom: '1px solid var(--negative-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingDown size={18} color="var(--negative)" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--negative)', letterSpacing: '0.3px' }}>
                  MARKET TOP LOSERS ({filteredLosers.length})
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--negative)', fontWeight: 700 }}>
                Bearish Pressure
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'left' }}>
                    <th style={{ padding: '8px 14px' }}>COMPANY</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right' }}>LTP (₹)</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right' }}>DECLINE %</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLosers.map(stock => (
                    <tr
                      key={stock.symbol}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <Link to={`/stocks/${stock.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 800, fontSize: '13px' }}>
                          {stock.symbol}
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {stock.name}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--text)', fontSize: '13.5px' }}>
                        ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{
                          backgroundColor: 'var(--negative-bg)',
                          color: 'var(--negative)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '11.5px'
                        }}>
                          {stock.changePercent}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <Link
                          to={`/stocks/${stock.symbol}`}
                          style={{
                            backgroundColor: 'var(--surface-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>Terminal</span>
                          <ArrowUpRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 3: SECTOR HEATMAP & PERFORMANCE MATRIX */}
      {activeTab === 'sectors' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px'
          }}>
            {sectors.map(sec => (
              <div
                key={sec.name}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: 'var(--card-shadow)',
                  borderLeft: `4px solid ${sec.isUp ? 'var(--positive)' : 'var(--negative)'}`,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
                    {sec.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: 'var(--surface-secondary)',
                    color: 'var(--text-muted)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    P/E {sec.pe}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: sec.isUp ? 'var(--positive)' : 'var(--negative)'
                  }}>
                    {sec.change}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Breadth: {sec.breadth}
                  </span>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Lead Catalyst:</span>
                  <b style={{ color: 'var(--text)' }}>{sec.topStock}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB 4: 52-WEEK BREAKOUT RADAR (NEW HIGH / LOW BREAKOUTS) */}
      {activeTab === 'breakouts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
          
          {/* 52-Week High Breakouts */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{
              padding: '14px 18px',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              borderBottom: '1px solid rgba(234, 179, 8, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="#eab308" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ca8a04', letterSpacing: '0.3px' }}>
                  52-WEEK HIGH BREAKOUT RADAR
                </span>
              </div>
              <span style={{ fontSize: '10px', color: '#ca8a04', fontWeight: 700 }}>
                Near 52W Peak (&lt;4% spread)
              </span>
            </div>

            <div style={{ padding: '8px 12px' }}>
              {highBreakouts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Scanning Nifty 500 for fresh 52-week breakout candidates...
                </div>
              ) : (
                highBreakouts.map(stock => (
                  <div
                    key={stock.symbol}
                    style={{
                      padding: '10px 8px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <Link to={`/stocks/${stock.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 800, fontSize: '13px' }}>
                        {stock.symbol}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {stock.name} • 52W High: ₹{stock.high52}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '13.5px' }}>
                        ₹{stock.ltp.toFixed(2)}
                      </div>
                      <span style={{ fontSize: '10px', color: '#ca8a04', fontWeight: 700 }}>
                        {Math.round(((stock.high52 - stock.ltp) / stock.high52) * 100)}% to All-Time High
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 52-Week Low Breakouts */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{
              padding: '14px 18px',
              backgroundColor: 'var(--surface-secondary)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="var(--primary)" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.3px' }}>
                  52-WEEK LOW VALUE ACCUMULATION
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                Near 52W Support Floor
              </span>
            </div>

            <div style={{ padding: '8px 12px' }}>
              {lowBreakouts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Scanning for value floor reversion candidates...
                </div>
              ) : (
                lowBreakouts.map(stock => (
                  <div
                    key={stock.symbol}
                    style={{
                      padding: '10px 8px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <Link to={`/stocks/${stock.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 800, fontSize: '13px' }}>
                        {stock.symbol}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {stock.name} • 52W Low: ₹{stock.low52}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '13.5px' }}>
                        ₹{stock.ltp.toFixed(2)}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                        At 52-Week Value Floor
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
