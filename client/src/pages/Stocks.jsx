import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, ArrowUpRight, ArrowDownRight, Filter, Plus, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';

export default function Stocks() {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [loading, setLoading] = useState(true);
  const { isWatched, toggleWatchlist } = useWatchlist();
  const navigate = useNavigate();

  const sectors = [
    'All',
    'Information Technology',
    'Financial Services',
    'Energy & Telecom',
    'Automobile',
    'FMCG',
    'Healthcare',
    'Capital Goods'
  ];

  const popularQuickPicks = [
    'TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'TATAMOTORS', 
    'ZOMATO', 'SUZLON', 'HAL', 'ITC', 'SBIN', 'TATASTEEL', 'JIOFIN'
  ];

  useEffect(() => {
    fetchStocks();
  }, [sector]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await api.getStocks('', sector === 'All' ? '' : sector);
      if (res.success) setStocks(res.data);
    } catch (err) {
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/stocks/${search.trim().toUpperCase()}`);
  };

  const filteredStocks = stocks.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Indian Equities Directory
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Real-time quotes, technical levels, and fundamentals for NSE/BSE listed instruments
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 12px',
            gap: '8px'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search symbol or name (Press Enter)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: '13px',
                width: '230px'
              }}
            />
          </div>
        </form>
      </div>

      {/* Quick Picks */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Search:</span>
        {popularQuickPicks.map(sym => (
          <button
            key={sym}
            onClick={() => setSearch(sym)}
            style={{
              backgroundColor: search.toUpperCase() === sym ? 'var(--primary-subtle)' : 'var(--surface-secondary)',
              color: search.toUpperCase() === sym ? 'var(--primary)' : 'var(--text-secondary)',
              border: `1px solid ${search.toUpperCase() === sym ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '2px 7px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* Sector Filter Chips */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '16px'
      }}>
        {sectors.map(s => (
          <button
            key={s}
            onClick={() => setSector(s)}
            style={{
              backgroundColor: sector === s ? 'var(--primary)' : 'var(--surface)',
              color: sector === s ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${sector === s ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Stocks Table */}
      <div className="terminal-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading equity quotes...
          </div>
        ) : filteredStocks.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              No pre-loaded stock matches "{search}"
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', maxWidth: '460px', margin: '0 auto 16px' }}>
              You can instantly open and generate full technical charts, quotes, and AI research for <strong>{search.toUpperCase()}</strong> on NSE.
            </p>
            <Link
              to={`/stocks/${search.trim().toUpperCase()}`}
              className="btn-primary"
              style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '13px' }}
            >
              <span>View Quote for {search.trim().toUpperCase()}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <table className="terminal-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}></th>
                <th>Symbol</th>
                <th>Company Name</th>
                <th>Sector</th>
                <th className="num-col">LTP</th>
                <th className="num-col">Change (%)</th>
                <th className="num-col">Day Range</th>
                <th className="num-col">P/E</th>
                <th className="num-col">Market Cap</th>
                <th style={{ width: '70px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map(stock => {
                const isUp = stock.change >= 0;
                return (
                  <tr key={stock.symbol}>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => toggleWatchlist(stock.symbol)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        title={isWatched(stock.symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        <Star
                          size={14}
                          color={isWatched(stock.symbol) ? '#EAB308' : 'var(--text-muted)'}
                          fill={isWatched(stock.symbol) ? '#EAB308' : 'transparent'}
                        />
                      </button>
                    </td>
                    <td>
                      <Link to={`/stocks/${stock.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700 }}>
                        {stock.symbol}
                      </Link>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>{stock.exchange}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {stock.name}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {stock.sector}
                    </td>
                    <td className="num-col num" style={{ fontWeight: 700 }}>
                      ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="num-col num" style={{ fontWeight: 600, color: isUp ? 'var(--positive)' : 'var(--negative)' }}>
                      {isUp ? '+' : ''}{stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent}%)
                    </td>
                    <td className="num-col num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ₹{stock.low} - ₹{stock.high}
                    </td>
                    <td className="num-col num">
                      {stock.pe ? `${stock.pe}x` : '-'}
                    </td>
                    <td className="num-col num" style={{ fontSize: '12px' }}>
                      {stock.marketCap}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/stocks/${stock.symbol}`} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '11px' }}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
