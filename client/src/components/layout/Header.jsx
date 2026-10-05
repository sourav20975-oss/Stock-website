import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Star, TrendingUp, User, Activity, X, Rocket, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useWatchlist } from '../../context/WatchlistContext';
import { api } from '../../services/api';
import MarketTimingBadge from './MarketTimingBadge';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { symbols: watchlistSymbols } = useWatchlist();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [ipoResults, setIpoResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [marketStatus, setMarketStatus] = useState({ status: 'Open', isLive: true });
  const searchContainerRef = useRef(null);

  useEffect(() => {
    api.getMarketStatus()
      .then(res => {
        if (res.success && res.data) setMarketStatus(res.data);
      })
      .catch(() => {});

    // Click outside to close dropdown
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setIpoResults([]);
      setShowSearchDropdown(false);
      return;
    }

    try {
      const [stocksRes, ipoRes] = await Promise.all([
        api.getStocks(val),
        api.getIPOs()
      ]);

      if (stocksRes.success) {
        setSearchResults(stocksRes.data.slice(0, 8));
      }

      if (ipoRes.success) {
        const q = val.toLowerCase();
        const matchedIpos = ipoRes.data.filter(i => 
          i.companyName.toLowerCase().includes(q) || 
          (i.symbol && i.symbol.toLowerCase().includes(q))
        );
        setIpoResults(matchedIpos.slice(0, 3));
      }

      setShowSearchDropdown(true);
    } catch (err) {
      console.warn('Search error:', err);
    }
  };

  const handleSelectStock = (symbol) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(`/stocks/${symbol.toUpperCase()}`);
  };

  const handleSelectIPO = (slug) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(`/ipos/${slug}`);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim().toUpperCase();
    if (!clean) return;

    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(`/stocks/${clean}`);
  };

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      gap: '16px'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '15px'
          }}>
            SK
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              Stock Knowledge
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Indian Equity & IPO Research
            </div>
          </div>
        </Link>
      </div>

      {/* Centered Search */}
      <div ref={searchContainerRef} style={{ flex: 1, maxWidth: '520px', position: 'relative' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 12px',
            gap: '8px'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search ANY stock or IPO (e.g. TCS, RELIANCE, ZOMATO, Hyundai)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchDropdown(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIpoResults([]);
                  setShowSearchDropdown(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </form>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 100,
            maxHeight: '380px',
            overflowY: 'auto'
          }}>
            {/* Quick Go Option if user typed anything */}
            {searchQuery.trim() && (
              <div
                onClick={() => handleSelectStock(searchQuery.trim())}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: 'var(--primary-subtle)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={15} />
                  <span>Open quote for <strong>{searchQuery.trim().toUpperCase()}</strong> on NSE</span>
                </div>
                <ArrowRight size={15} />
              </div>
            )}

            {/* Matched IPOs */}
            {ipoResults.length > 0 && (
              <div>
                <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', backgroundColor: 'var(--surface-secondary)' }}>
                  MATCHING IPOS
                </div>
                {ipoResults.map(ipo => (
                  <div
                    key={ipo.slug}
                    onClick={() => handleSelectIPO(ipo.slug)}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Rocket size={14} color="var(--primary)" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>{ipo.companyName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Band: {ipo.priceBand} • Status: {ipo.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Matched Stocks */}
            {searchResults.length > 0 ? (
              <div>
                <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', backgroundColor: 'var(--surface-secondary)' }}>
                  EQUITIES ({searchResults.length})
                </div>
                {searchResults.map(stock => (
                  <div
                    key={stock.symbol}
                    onClick={() => handleSelectStock(stock.symbol)}
                    style={{
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                        {stock.symbol} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{stock.exchange}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {stock.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="num" style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                        ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="num" style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: stock.changePercent >= 0 ? 'var(--positive)' : 'var(--negative)'
                      }}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !searchQuery.trim() ? (
              /* Popular Suggestions when search query is empty */
              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  POPULAR INDIAN STOCKS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'TATAMOTORS', 'ZOMATO', 'SUZLON', 'HAL', 'ITC', 'SBIN'].map(sym => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleSelectStock(sym)}
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 8px',
                        fontSize: '12px',
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
            ) : null}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Market Status & Timings Pill with Popover */}
        <MarketTimingBadge serverStatus={marketStatus} />

        {/* Watchlist Counter */}
        <Link
          to="/watchlist"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            textDecoration: 'none',
            color: 'var(--text)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          <Star size={14} color="#EAB308" fill="#EAB308" />
          <span className="hide-on-mobile">Watchlist</span>
          <span className="num" style={{
            backgroundColor: 'var(--surface-secondary)',
            padding: '1px 6px',
            borderRadius: '10px',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}>
            {watchlistSymbols.length}
          </span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '7px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--surface)'
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          cursor: 'pointer'
        }}>
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
