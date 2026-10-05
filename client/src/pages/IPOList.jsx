import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  Search, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp, 
  Flame, 
  ShieldCheck, 
  Layers, 
  SlidersHorizontal,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import GMPBadge from '../components/ipo/GMPBadge';

export default function IPOList() {
  const [ipos, setIpos] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all'); // 'all', 'mainboard', 'sme'
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'gmpHigh', 'subHigh', 'sizeHigh'
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [lastSynced, setLastSynced] = useState('');

  const statusTabs = [
    { id: 'all', label: 'All Offerings' },
    { id: 'open', label: 'Open Now' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'closed', label: 'Closed / Listed' }
  ];

  useEffect(() => {
    fetchIPOs();
  }, [statusFilter]);

  const fetchIPOs = async () => {
    setLoading(true);
    try {
      const res = await api.getIPOs(statusFilter === 'all' ? '' : statusFilter);
      if (res.success) {
        setIpos(res.data);
        if (res.lastSynced) {
          setLastSynced(new Date(res.lastSynced).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (err) {
      console.error('Error fetching IPOs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLive = async () => {
    if (syncing) return;
    setSyncing(true);
    setFeedback('');

    try {
      const res = await api.syncLiveIPOs();
      if (res.success) {
        setIpos(res.data);
        setLastSynced(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        setFeedback(`✓ Synced ${res.count || res.data.length} real live IPOs`);
        setTimeout(() => setFeedback(''), 4500);
      } else {
        setFeedback('Unable to sync live data');
      }
    } catch (err) {
      setFeedback('Error extracting live IPOs');
    } finally {
      setSyncing(false);
    }
  };

  // Filter & Sort Logic
  const processedIPOs = ipos
    .filter(i => {
      // Status Tab filter
      if (statusFilter !== 'all' && i.status.toLowerCase() !== statusFilter.toLowerCase()) return false;

      // Segment filter
      if (segmentFilter === 'mainboard') {
        const seg = (i.segment || '').toLowerCase();
        if (seg.includes('sme')) return false;
      } else if (segmentFilter === 'sme') {
        const seg = (i.segment || '').toLowerCase();
        if (!seg.includes('sme')) return false;
      }

      // Search filter
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        i.companyName.toLowerCase().includes(q) ||
        (i.symbol && i.symbol.toLowerCase().includes(q)) ||
        (i.segment && i.segment.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'gmpHigh') {
        return (b.gmp?.percent || 0) - (a.gmp?.percent || 0);
      }
      if (sortBy === 'subHigh') {
        const subA = typeof a.subscription?.overall === 'number' ? a.subscription.overall : 0;
        const subB = typeof b.subscription?.overall === 'number' ? b.subscription.overall : 0;
        return subB - subA;
      }
      if (sortBy === 'sizeHigh') {
        const parseSize = (s) => parseFloat((s || '').replace(/[^0-9.]/g, '')) || 0;
        return parseSize(b.issueSize) - parseSize(a.issueSize);
      }
      return 0;
    });

  // Calculate live summary stats
  const totalCount = ipos.length;
  const openCount = ipos.filter(i => i.status === 'open').length;
  const upcomingCount = ipos.filter(i => i.status === 'upcoming').length;
  const closedCount = ipos.filter(i => i.status === 'closed').length;
  const topGmp = [...ipos].sort((a, b) => ((b.gmp?.percent || 0) - (a.gmp?.percent || 0)))[0];

  // Helper for generating initial avatars
  const getInitials = (name) => {
    if (!name) return 'IP';
    const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '16px 20px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>
              Primary Market IPO & GMP Intelligence
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: '20px',
              backgroundColor: 'var(--positive-bg)',
              border: '1px solid var(--positive-border)',
              color: 'var(--positive)',
              fontSize: '11px',
              fontWeight: 700
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--positive)', boxShadow: '0 0 6px var(--positive)' }}></span>
              LIVE NSE/BSE & GREY MARKET
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Verified draft filings, live subscription bids, and unofficial grey market premia</span>
            {lastSynced && (
              <span style={{ color: 'var(--text-muted)' }}>• Synced today at {lastSynced}</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {feedback && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--positive)',
              backgroundColor: 'var(--positive-bg)',
              border: '1px solid var(--positive-border)',
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={13} />
              {feedback}
            </span>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSyncLive}
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: syncing ? 'wait' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing Live Exchanges...' : 'Sync Live IPOs & GMP'}</span>
          </button>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 12px',
            gap: '8px'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search company, symbol, SME..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: '12px',
                width: '190px'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px'
      }}>
        {/* Card 1 */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Active Pipeline
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Mainboard & SME Offerings
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--primary)'
          }}>
            <Layers size={20} color="var(--primary)" />
          </div>
        </div>

        {/* Card 2 */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--positive-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--positive)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Open For Bidding
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--positive)', marginTop: '2px' }}>
              {openCount}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Live Order Window Active
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'var(--positive-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--positive-border)'
          }}>
            <Flame size={20} color="var(--positive)" />
          </div>
        </div>

        {/* Card 3 */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Upcoming Issues
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
              {upcomingCount}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              RHP / DRHP Approved
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'var(--surface-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)'
          }}>
            <Calendar size={20} color="var(--text-secondary)" />
          </div>
        </div>

        {/* Card 4: Top GMP */}
        {topGmp && (
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Top Sentiment Leader
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                {topGmp.companyName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Est. Listing Gain: <strong style={{ color: 'var(--positive)' }}>+{topGmp.gmp?.percent}%</strong>
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--warning-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--warning-border)'
            }}>
              <TrendingUp size={20} color="var(--warning)" />
            </div>
          </div>
        )}
      </div>

      {/* 3. Segment Filter Tabs & Sorters Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '6px 12px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--card-shadow)'
      }}>
        {/* Status Tab Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {statusTabs.map(tab => {
            const count = tab.id === 'all' ? totalCount : (tab.id === 'open' ? openCount : (tab.id === 'upcoming' ? upcomingCount : closedCount));
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  backgroundColor: isActive ? 'var(--primary-subtle)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-secondary)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 600
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side: Segment filter & Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Segment Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border)' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'mainboard', label: 'Mainboard' },
              { id: 'sme', label: 'SME' }
            ].map(seg => (
              <button
                key={seg.id}
                onClick={() => setSegmentFilter(seg.id)}
                style={{
                  background: segmentFilter === seg.id ? 'var(--surface)' : 'transparent',
                  border: 'none',
                  color: segmentFilter === seg.id ? 'var(--text)' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: segmentFilter === seg.id ? 700 : 500,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  boxShadow: segmentFilter === seg.id ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none'
                }}
              >
                {seg.label}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <SlidersHorizontal size={12} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                backgroundColor: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="default">Default Order</option>
              <option value="gmpHigh">Highest GMP (%)</option>
              <option value="subHigh">Most Subscribed</option>
              <option value="sizeHigh">Largest Issue Size</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Main Institutional Table */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow)'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <RefreshCw size={18} className="animate-spin" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Connecting to live exchange aggregators & extracting real-time GMP...</span>
          </div>
        ) : processedIPOs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>No IPO Issues Found</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>Try switching filters or click below to pull the latest primary market issues.</div>
            <button
              onClick={handleSyncLive}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Sync Live Offerings
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px'
                }}>
                  <th style={{ padding: '12px 16px' }}>Company & Segment</th>
                  <th style={{ padding: '12px 14px' }}>Price Band</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Issue Size</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Lot Size</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Live GMP (Est. Gain)</th>
                  <th style={{ padding: '12px 16px' }}>Subscription Demand</th>
                  <th style={{ padding: '12px 14px' }}>Bidding Dates</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {processedIPOs.map((ipo, idx) => {
                  const isOpen = ipo.status === 'open';
                  const isUpcoming = ipo.status === 'upcoming';
                  const initials = getInitials(ipo.companyName);
                  const isSme = (ipo.segment || '').toLowerCase().includes('sme');

                  return (
                    <tr
                      key={ipo.slug || idx}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* 1. Company & Segment with Logo / Initials Avatar */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {ipo.logoUrl ? (
                            <img
                              src={ipo.logoUrl}
                              alt={ipo.companyName}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                objectFit: 'contain',
                                background: '#ffffff',
                                padding: '2px',
                                border: '1px solid var(--border)',
                                flexShrink: 0
                              }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: isSme ? 'var(--warning-bg)' : 'var(--primary-subtle)',
                              border: isSme ? '1px solid var(--warning-border)' : '1px solid var(--primary)',
                              color: isSme ? 'var(--warning)' : 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              {initials}
                            </div>
                          )}
                          <div>
                            <Link
                              to={`/ipos/${ipo.slug}`}
                              style={{
                                color: 'var(--text)',
                                fontWeight: 600,
                                textDecoration: 'none',
                                fontSize: '13px',
                                display: 'block'
                              }}
                            >
                              {ipo.companyName}
                            </Link>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {ipo.symbol}
                              </span>
                              <span style={{
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontSize: '9.5px',
                                fontWeight: 700,
                                backgroundColor: isSme ? 'var(--warning-bg)' : 'var(--primary-subtle)',
                                color: isSme ? 'var(--warning)' : 'var(--primary)',
                                border: isSme ? '1px solid var(--warning-border)' : '1px solid var(--primary)'
                              }}>
                                {ipo.segment || 'MAINBOARD'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Price Band */}
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                        {ipo.priceBand && ipo.priceBand !== '₹0' && ipo.priceBand !== '0' ? ipo.priceBand : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Price TBA</span>
                        )}
                      </td>

                      {/* 3. Issue Size */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                        {ipo.issueSize && ipo.issueSize !== '-' ? ipo.issueSize : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>TBA</span>
                        )}
                      </td>

                      {/* 4. Lot Size */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600 }}>
                          {ipo.lotSize ? ipo.lotSize.toLocaleString('en-IN') : '-'}
                        </span>
                        {ipo.lotSize > 0 && (
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '3px' }}>shares</span>
                        )}
                      </td>

                      {/* 5. Live GMP Badge */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <GMPBadge gmp={ipo.gmp} maxPrice={ipo.maxPrice} compact />
                      </td>

                      {/* 6. Subscription Demand with Micro Bar */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {typeof ipo.subscription?.overall === 'number' && ipo.subscription.overall > 0 ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontWeight: 700, color: ipo.subscription.overall >= 1 ? 'var(--positive)' : 'var(--text)', fontSize: '12px' }}>
                                {ipo.subscription.overall}x
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {ipo.subscription.overall >= 1 ? 'Oversubscribed' : 'Subscribed'}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--surface-secondary)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px', border: '1px solid var(--border-subtle)' }}>
                              <div style={{
                                width: `${Math.min(100, (ipo.subscription.overall / 5) * 100)}%`,
                                height: '100%',
                                backgroundColor: ipo.subscription.overall >= 1 ? 'var(--positive)' : 'var(--primary)',
                                borderRadius: '2px'
                              }}></div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} />
                            <span>{ipo.subscription?.overall || 'Awaiting Bids'}</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Bidding Dates */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                        {ipo.biddingDates || `${ipo.openDate || 'TBA'} – ${ipo.closeDate || 'TBA'}`}
                      </td>

                      {/* 8. Status */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          backgroundColor: isOpen ? 'var(--positive-bg)' : (isUpcoming ? 'var(--primary-subtle)' : 'var(--surface-secondary)'),
                          color: isOpen ? 'var(--positive)' : (isUpcoming ? 'var(--primary)' : 'var(--text-secondary)'),
                          border: isOpen ? '1px solid var(--positive-border)' : (isUpcoming ? '1px solid var(--primary)' : '1px solid var(--border)')
                        }}>
                          {isOpen && (
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--positive)', boxShadow: '0 0 5px var(--positive)' }}></span>
                          )}
                          <span>{ipo.status}</span>
                        </span>
                      </td>

                      {/* 9. Action Button */}
                      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Link
                          to={`/ipos/${ipo.slug}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--surface-secondary)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>Analyze</span>
                          <ChevronRight size={12} />
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

      {/* 5. Institutional Compliance Footnote */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'var(--surface-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={14} color="var(--positive)" />
          <span>
            <strong style={{ color: 'var(--text)' }}>SEBI Compliance Notice:</strong> Grey Market Premium (GMP) is an unregulated, unofficial sentiment metric and does not constitute a trading recommendation or guaranteed listing price.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span>Primary Market Feeds: NSE • BSE • SEBI RHP Filings</span>
        </div>
      </div>

    </div>
  );
}
