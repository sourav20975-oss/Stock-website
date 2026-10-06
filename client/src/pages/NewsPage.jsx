import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Newspaper, 
  Search, 
  RefreshCw, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Flame, 
  TrendingUp, 
  Building2, 
  Globe, 
  Sparkles, 
  X, 
  ArrowUpRight,
  Filter,
  Layers,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function NewsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [news, setNews] = useState([]);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const categories = [
    { id: 'All', label: 'All Dispatches', icon: Layers },
    { id: 'Earnings', label: 'Earnings & Results', icon: TrendingUp },
    { id: 'IPO', label: 'IPO & Listings', icon: Sparkles },
    { id: 'Macro', label: 'Macro & Policy', icon: Building2 },
    { id: 'Corporate', label: 'Corporate Actions', icon: Globe },
    { id: 'Sector', label: 'Sector Radar', icon: Activity }
  ];

  useEffect(() => {
    fetchNews();
  }, [category]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.getNews('', category === 'All' ? '' : category, 35);
      if (res.success) {
        setNews(res.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setFeedback('');
    try {
      const res = await api.getNews('', category === 'All' ? '' : category, 45, true);
      if (res.success && res.data) {
        setNews(res.data);
        setLastRefreshed(new Date());
        setFeedback(`✓ Synced ${res.data.length} live dispatches`);
        setTimeout(() => setFeedback(''), 4500);
      }
    } catch (err) {
      console.error('Error refreshing news:', err);
      setFeedback('Failed to sync wire');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyLink = (item) => {
    navigator.clipboard.writeText(item.url || `${window.location.origin}/news`);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Client-side instant keyword filter
  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) return news;
    const q = searchQuery.toLowerCase();
    return news.filter(item => 
      item.title?.toLowerCase().includes(q) ||
      item.summary?.toLowerCase().includes(q) ||
      item.source?.toLowerCase().includes(q) ||
      (item.symbols && item.symbols.some(s => s.toLowerCase().includes(q)))
    );
  }, [news, searchQuery]);

  // Dynamic counts for category pill badges
  const categoryCounts = useMemo(() => {
    const counts = { All: news.length };
    news.forEach(item => {
      if (item.category) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return counts;
  }, [news]);

  // Unique tickers mentioned
  const uniqueTickers = useMemo(() => {
    const tickerSet = new Set();
    news.forEach(item => {
      if (Array.isArray(item.symbols)) {
        item.symbols.forEach(sym => tickerSet.add(sym));
      }
    });
    return tickerSet.size;
  }, [news]);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const getSourceBadgeColor = (source = '') => {
    const s = source.toLowerCase();
    if (s.includes('mint')) return { bg: 'rgba(5, 150, 105, 0.12)', border: 'rgba(5, 150, 105, 0.3)', text: '#059669', dot: '#059669' };
    if (s.includes('economic') || s.includes('et')) return { bg: 'rgba(225, 29, 72, 0.12)', border: 'rgba(225, 29, 72, 0.3)', text: '#e11d48', dot: '#e11d48' };
    if (s.includes('reuters')) return { bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.3)', text: '#d97706', dot: '#d97706' };
    if (s.includes('moneycontrol')) return { bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.3)', text: '#0284c7', dot: '#0284c7' };
    return { bg: 'var(--surface-secondary)', border: 'var(--border)', text: 'var(--text-secondary)', dot: 'var(--primary)' };
  };

  const getCategoryTheme = (cat = '') => {
    switch (cat.toLowerCase()) {
      case 'earnings':
        return { color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)', border: 'rgba(2, 132, 199, 0.25)' };
      case 'ipo':
        return { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.25)' };
      case 'macro':
        return { color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.25)' };
      case 'corporate':
        return { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.25)' };
      case 'sector':
        return { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.25)' };
      default:
        return { color: 'var(--text-secondary)', bg: 'var(--surface-secondary)', border: 'var(--border)' };
    }
  };

  const heroItem = filteredNews.length > 0 ? filteredNews[0] : null;
  const standardNews = filteredNews.length > 1 ? filteredNews.slice(1) : [];

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. EDITORIAL HEADER & COMMAND BAR */}
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
        {/* Left: Branding & Subtitle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Newspaper size={20} />
            </div>
            <div>
              <h1 style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--text)',
                margin: 0,
                letterSpacing: '-0.3px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Indian Financial & Market Wire
              </h1>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Real-time regulatory disclosures, macroeconomic policies, corporate actions & analyst intelligence
          </p>
        </div>

        {/* Right: Live Wire Pill & Manual Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <span>LIVE WIRE ACTIVE</span>
          </div>

          {feedback && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--positive)',
              backgroundColor: 'rgba(8, 153, 129, 0.1)',
              border: '1px solid rgba(8, 153, 129, 0.25)',
              padding: '4px 10px',
              borderRadius: '6px'
            }}>
              {feedback}
            </span>
          )}

          <button
            onClick={handleManualRefresh}
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
              transition: 'all 0.2s ease'
            }}
            title="Refresh news wire"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Wire'}</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI STATS STRIP */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* KPI 1: Total Stories */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-subtle)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Newspaper size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MONITORED DISPATCHES</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{news.length} Headlines</div>
          </div>
        </div>

        {/* KPI 2: Active Tickers Mentioned */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TICKERS MENTIONED</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{uniqueTickers} Equities</div>
          </div>
        </div>

        {/* KPI 3: Macro Focus */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PRIMARY THEME</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              RBI Rate Policy & Yields
            </div>
          </div>
        </div>

        {/* KPI 4: Feed Status */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'var(--positive-bg)',
            color: 'var(--positive)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>FEED CADENCE</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
              Updated {getRelativeTime(lastRefreshed)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH DOCK */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Category Pills with Icons & Counts */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {categories.map(cat => {
            const Icon = cat.icon;
            const active = category === cat.id;
            const count = categoryCounts[cat.id] || (cat.id === 'All' ? news.length : 0);

            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  backgroundColor: active ? 'var(--primary)' : 'var(--surface)',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: active ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
                {count > 0 && (
                  <span style={{
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.25)' : 'var(--surface-secondary)',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Filter Search Input */}
        <div style={{
          position: 'relative',
          minWidth: '280px',
          flex: '0 1 340px'
        }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search headlines, tickers (e.g. Tata, RBI)..."
            style={{
              width: '100%',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '7px 32px 7px 34px',
              color: 'var(--text)',
              fontSize: '12px',
              outline: 'none',
              boxShadow: 'var(--card-shadow)',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 4. CONTENT AREA: HERO SPOTLIGHT + EDITORIAL GRID */}
      {loading ? (
        /* Shimmer Loading Skeleton Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'var(--card-shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '18px', backgroundColor: 'var(--surface-secondary)', borderRadius: '4px' }} />
                <div style={{ width: '60px', height: '14px', backgroundColor: 'var(--surface-secondary)', borderRadius: '4px' }} />
              </div>
              <div style={{ width: '100%', height: '22px', backgroundColor: 'var(--surface-secondary)', borderRadius: '4px' }} />
              <div style={{ width: '85%', height: '22px', backgroundColor: 'var(--surface-secondary)', borderRadius: '4px' }} />
              <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--surface-secondary)', borderRadius: '4px', marginTop: '6px' }} />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <div style={{ width: '50px', height: '20px', backgroundColor: 'var(--surface-secondary)', borderRadius: '4px' }} />
                <div style={{ width: '60px', height: '20px', backgroundColor: 'var(--surface-secondary)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        /* Empty Search Result State */
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-secondary)',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Search size={22} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
            No dispatches match "{searchQuery}"
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 16px auto' }}>
            Try searching for broader keywords like "Nifty", "RBI", "Tata", or switch back to All Dispatches.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setCategory('All'); }}
            style={{
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 18px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div>
          {/* 4A. TOP EDITORIAL HERO DISPATCH CARD */}
          {heroItem && (
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: 'var(--card-shadow)',
              position: 'relative',
              overflow: 'hidden',
              background: isDark 
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(19, 23, 34, 0.9) 100%)' 
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            }}>
              {/* Top Accent Strip */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, var(--primary) 0%, #8b5cf6 50%, var(--positive) 100%)'
              }} />

              {/* Header Badges */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#ef4444',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    <Flame size={12} />
                    LEAD STORY
                  </span>

                  {/* Source Pill */}
                  {(() => {
                    const badge = getSourceBadgeColor(heroItem.source);
                    return (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.text,
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '4px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: badge.dot }} />
                        {heroItem.source}
                      </span>
                    );
                  })()}

                  {/* Category Pill */}
                  {heroItem.category && (() => {
                    const catTheme = getCategoryTheme(heroItem.category);
                    return (
                      <span style={{
                        backgroundColor: catTheme.bg,
                        border: `1px solid ${catTheme.border}`,
                        color: catTheme.color,
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}>
                        {heroItem.category.toUpperCase()}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <Clock size={12} />
                  <span>{getRelativeTime(heroItem.publishedAt)}</span>
                  <span>•</span>
                  <span>{new Date(heroItem.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST</span>
                </div>
              </div>

              {/* Main Headline */}
              <h2 style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text)',
                lineHeight: 1.35,
                margin: '0 0 10px 0',
                letterSpacing: '-0.2px'
              }}>
                {heroItem.title}
              </h2>

              {/* Summary */}
              <p style={{
                fontSize: '13.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 16px 0',
                maxWidth: '920px'
              }}>
                {heroItem.summary}
              </p>

              {/* Footer: Symbols & Actions */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border)'
              }}>
                {/* Ticker Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Related Tickers:</span>
                  {heroItem.symbols && heroItem.symbols.map(sym => (
                    <Link
                      key={sym}
                      to={sym.startsWith('NIFTY') ? '/market' : `/stocks/${sym}`}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        backgroundColor: 'var(--primary-subtle)',
                        border: '1px solid var(--primary)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <span>{sym}</span>
                      <ArrowUpRight size={10} />
                    </Link>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleCopyLink(heroItem)}
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Copy dispatch link"
                  >
                    {copiedId === heroItem.id ? <Check size={13} color="var(--positive)" /> : <Copy size={13} />}
                    <span>{copiedId === heroItem.id ? 'Copied' : 'Share'}</span>
                  </button>

                  {heroItem.url && (
                    <a
                      href={heroItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <span>Read Original Dispatch</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4B. EDITORIAL 2-COLUMN RESPONSIVE GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
            gap: '16px'
          }}>
            {standardNews.map((item, idx) => {
              const badge = getSourceBadgeColor(item.source);
              const catTheme = getCategoryTheme(item.category);

              return (
                <article
                  key={item.id || idx}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    boxShadow: 'var(--card-shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                  }}
                >
                  <div>
                    {/* Source & Metadata Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '11px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.text,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: badge.dot }} />
                          {item.source}
                        </span>

                        {item.category && (
                          <span style={{
                            backgroundColor: catTheme.bg,
                            border: `1px solid ${catTheme.border}`,
                            color: catTheme.color,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9.5px',
                            textTransform: 'uppercase'
                          }}>
                            {item.category}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                        <Clock size={11} />
                        <span>{getRelativeTime(item.publishedAt)}</span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      lineHeight: 1.4,
                      margin: '0 0 8px 0',
                      letterSpacing: '-0.1px'
                    }}>
                      {item.title}
                    </h3>

                    {/* Summary */}
                    <p style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      margin: 0
                    }}>
                      {item.summary}
                    </p>
                  </div>

                  {/* Footer Row: Stock Tickers & Read More */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    marginTop: '4px'
                  }}>
                    {/* Tickers */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {item.symbols && item.symbols.map(sym => (
                        <Link
                          key={sym}
                          to={sym.startsWith('NIFTY') ? '/market' : `/stocks/${sym}`}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            backgroundColor: 'var(--primary-subtle)',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            border: '1px solid var(--primary)'
                          }}
                        >
                          <span>{sym}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Read More / External Link */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleCopyLink(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        title="Copy link"
                      >
                        {copiedId === item.id ? <Check size={12} color="var(--positive)" /> : <Copy size={12} />}
                      </button>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--primary)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>Dispatch</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
