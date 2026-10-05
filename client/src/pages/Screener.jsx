import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Filter, 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  Zap, 
  Flame, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  RefreshCw,
  Star,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';

export default function Screener() {
  const { isWatched, toggleWatchlist } = useWatchlist();

  const [preset, setPreset] = useState('52w-high'); // '52w-high', 'dividend', 'value', 'volume', 'momentum', 'oversold', 'all'
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [sortBy, setSortBy] = useState('changePercent'); // 'changePercent', 'pe', 'dividendYield', 'volume'

  const presets = [
    { id: '52w-high', label: '52W High Breakouts', icon: Flame, color: '#f59e0b', desc: 'Stocks trading within 4% of their yearly highs' },
    { id: 'dividend', label: 'High Dividend Yield', icon: DollarSign, color: '#10b981', desc: 'Consistent cash cows yielding over 2.0% dividends' },
    { id: 'value', label: 'Value Bargains (Low P/E)', icon: Sparkles, color: '#38bdf8', desc: 'High ROE (>14%) with modest price-to-earnings (<22)' },
    { id: 'volume', label: 'Volume Shockers', icon: Zap, color: '#a855f7', desc: 'Equities with high institutional volume turnover' },
    { id: 'momentum', label: 'Intraday Momentum', icon: TrendingUp, color: '#089981', desc: 'Stocks gaining over +1.5% in the session' },
    { id: 'all', label: 'All Equities', icon: Filter, color: 'var(--primary)', desc: 'Explore all active listed benchmark companies' }
  ];

  const fetchScreenerData = async (activePreset) => {
    setLoading(true);
    try {
      const res = await api.getScreener(activePreset);
      if (res.success && res.data) {
        setStocks(res.data);
      }
    } catch (err) {
      console.warn('Screener fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenerData(preset);
  }, [preset]);

  // Extract distinct sectors
  const sectors = ['All', ...new Set(stocks.map(s => s.sector).filter(Boolean))];

  // Client filtering & sorting
  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(search.toLowerCase()) || 
                          s.name.toLowerCase().includes(search.toLowerCase());
    const matchesSector = sectorFilter === 'All' || s.sector === sectorFilter;
    return matchesSearch && matchesSector;
  }).sort((a, b) => {
    if (sortBy === 'changePercent') return b.changePercent - a.changePercent;
    if (sortBy === 'dividendYield') return (b.dividendYield || 0) - (a.dividendYield || 0);
    if (sortBy === 'pe') return (a.pe || 999) - (b.pe || 999);
    if (sortBy === 'volume') return (b.volume || 0) - (a.volume || 0);
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header & Title */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              Stock Screener & Market Scanners
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)'
            }}>
              NSE / BSE Real-time
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Scan Indian equities using quantitative criteria: breakout momentum, valuation multiples, and dividend cash flows.
          </p>
        </div>

        <button
          onClick={() => fetchScreenerData(preset)}
          disabled={loading}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Screener</span>
        </button>
      </div>

      {/* 2. Preset Filter Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {presets.map(p => {
          const Icon = p.icon;
          const isSelected = preset === p.id;

          return (
            <div
              key={p.id}
              onClick={() => setPreset(p.id)}
              style={{
                backgroundColor: isSelected ? 'var(--surface)' : 'var(--surface-secondary)',
                border: isSelected ? `2px solid ${p.color}` : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Icon size={16} color={p.color} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--text)' : 'var(--text-secondary)' }}>
                  {p.label}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {p.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Search & Quick Filters Bar */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search filtered stocks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '12.5px',
              color: 'var(--text)'
            }}
          />
        </div>

        {/* Sector & Sort Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Sector:</span>
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              style={{
                backgroundColor: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              {sectors.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                backgroundColor: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              <option value="changePercent">% Day Change</option>
              <option value="dividendYield">Dividend Yield</option>
              <option value="pe">P/E Ratio (Low to High)</option>
              <option value="volume">Trading Volume</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Results Data Table */}
      <div className="terminal-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 10px auto', display: 'block', color: 'var(--primary)' }} />
            <span>Scanning live NSE market database...</span>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No stocks matched your active filter criteria. Try choosing another scanner preset.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Stock</th>
                  <th style={{ padding: '12px 12px' }}>Sector</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Price (LTP)</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Day Change</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', minWidth: '130px' }}>52W Range</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>P/E Multiple</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Div. Yield</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>ROE</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((s, i) => {
                  const isUp = s.changePercent >= 0;
                  const rangeSpan = (s.high52 - s.low52) || 1;
                  const rangePct = Math.max(0, Math.min(100, Math.round(((s.ltp - s.low52) / rangeSpan) * 100)));

                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => toggleWatchlist(s.symbol)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title={isWatched(s.symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
                          >
                            <Star
                              size={15}
                              color={isWatched(s.symbol) ? '#EAB308' : 'var(--text-muted)'}
                              fill={isWatched(s.symbol) ? '#EAB308' : 'transparent'}
                            />
                          </button>
                          <div>
                            <Link to={`/stocks/${s.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '13px' }}>
                              {s.symbol}
                            </Link>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {s.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px', color: 'var(--text-secondary)' }}>
                        {s.sector}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700 }} className="num">
                        ₹{s.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontWeight: 700,
                          color: isUp ? '#089981' : '#f23645'
                        }} className="num">
                          {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          <span>{isUp ? '+' : ''}{s.changePercent}%</span>
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                            <span>₹{s.low52}</span>
                            <span>₹{s.high52}</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--surface-secondary)', borderRadius: '2px', position: 'relative' }}>
                            <div style={{
                              position: 'absolute',
                              left: `${rangePct}%`,
                              top: '-3px',
                              width: '4px',
                              height: '10px',
                              borderRadius: '2px',
                              backgroundColor: s.is52wNear ? '#f59e0b' : 'var(--primary)'
                            }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right' }} className="num">
                        {s.pe ? s.pe.toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600, color: s.dividendYield >= 2 ? '#10b981' : 'var(--text)' }} className="num">
                        {s.dividendYield ? `${s.dividendYield}%` : '—'}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600 }} className="num">
                        {s.roe ? `${s.roe}%` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Link
                          to={`/stocks/${s.symbol}`}
                          style={{
                            textDecoration: 'none',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'var(--primary)',
                            color: '#ffffff'
                          }}
                        >
                          Trade
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
