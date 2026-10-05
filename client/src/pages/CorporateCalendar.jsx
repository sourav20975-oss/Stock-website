import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  DollarSign, 
  BarChart2, 
  Layers, 
  Globe2, 
  AlertCircle, 
  ArrowRight, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function CorporateCalendar() {
  const [activeTab, setActiveTab] = useState('earnings'); // 'earnings', 'dividends', 'splitsAndBonus', 'economic'
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getCorporateCalendar('all')
      .then(res => {
        if (res.success && res.data) {
          setCalendarData(res.data);
        }
      })
      .catch(err => console.warn('Failed to load corporate calendar:', err))
      .finally(() => setLoading(false));
  }, []);

  const getFilteredItems = (items = []) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item => 
      (item.symbol && item.symbol.toLowerCase().includes(q)) ||
      (item.company && item.company.toLowerCase().includes(q)) ||
      (item.event && item.event.toLowerCase().includes(q))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header Bar */}
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
              Corporate Actions & Economic Calendar
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'var(--surface-secondary)',
              color: 'var(--text)',
              border: '1px solid var(--border)'
            }}>
              Q2/Q3 FY27 Disclosures
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Key corporate announcements, quarterly earnings schedules, dividend payout ex-dates, and RBI policy meetings.
          </p>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '6px 12px',
          width: '260px'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search company or event..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              color: 'var(--text)',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'earnings', label: 'Quarterly Earnings (Results)', icon: BarChart2, count: calendarData?.earnings?.length || 0 },
          { id: 'dividends', label: 'Dividends & Ex-Dates', icon: DollarSign, count: calendarData?.dividends?.length || 0 },
          { id: 'splitsAndBonus', label: 'Bonus & Stock Splits', icon: Layers, count: calendarData?.splitsAndBonus?.length || 0 },
          { id: 'economic', label: 'Macro & Central Bank Dates', icon: Globe2, count: calendarData?.economic?.length || 0 }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                color: isSelected ? '#ffffff' : 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--surface-secondary)',
                color: isSelected ? '#ffffff' : 'var(--text-muted)'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      <div className="terminal-card" style={{ overflow: 'hidden' }}>
        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Stock</th>
                  <th style={{ padding: '12px 14px' }}>Result Date</th>
                  <th style={{ padding: '12px 14px' }}>Quarter Period</th>
                  <th style={{ padding: '12px 14px' }}>Consensus Estimate EPS</th>
                  <th style={{ padding: '12px 16px' }}>Street Expectations & Notes</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Terminal</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredItems(calendarData?.earnings).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <Link to={`/stocks/${item.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '13.5px' }}>
                        {item.symbol}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.company}
                      </div>
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 600 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--surface-secondary)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: 'var(--text)'
                      }}>
                        <CalendarIcon size={12} color="var(--primary)" />
                        {item.date}
                      </span>
                    </td>
                    <td style={{ padding: '14px 14px', color: 'var(--text-secondary)' }}>
                      {item.quarter}
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 700, color: 'var(--primary)' }} className="num">
                      {item.estimateEps}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {item.consensus}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <Link
                        to={`/stocks/${item.symbol}`}
                        style={{
                          textDecoration: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: 'var(--surface-secondary)',
                          color: 'var(--primary)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        Analyze
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dividends Tab */}
        {activeTab === 'dividends' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Stock</th>
                  <th style={{ padding: '12px 14px' }}>Dividend Amount</th>
                  <th style={{ padding: '12px 14px' }}>Ex-Dividend Date</th>
                  <th style={{ padding: '12px 14px' }}>Record Date</th>
                  <th style={{ padding: '12px 14px' }}>Annual Yield</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trade</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredItems(calendarData?.dividends).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <Link to={`/stocks/${item.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '13.5px' }}>
                        {item.symbol}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.company}
                      </div>
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 700, color: '#10b981' }}>
                      {item.dividend}
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 600, color: '#f59e0b' }}>
                      {item.exDate}
                    </td>
                    <td style={{ padding: '14px 14px', color: 'var(--text-secondary)' }}>
                      {item.recordDate}
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 700 }} className="num">
                      {item.yield}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <Link
                        to={`/stocks/${item.symbol}`}
                        style={{
                          textDecoration: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: 'var(--surface-secondary)',
                          color: 'var(--primary)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Splits & Bonus Tab */}
        {activeTab === 'splitsAndBonus' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Stock</th>
                  <th style={{ padding: '12px 14px' }}>Action Type</th>
                  <th style={{ padding: '12px 14px' }}>Ratio</th>
                  <th style={{ padding: '12px 14px' }}>Effective Date</th>
                  <th style={{ padding: '12px 16px' }}>Regulatory Status</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredItems(calendarData?.splitsAndBonus).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <Link to={`/stocks/${item.symbol}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '13.5px' }}>
                        {item.symbol}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.company}
                      </div>
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 700, color: 'var(--primary)' }}>
                      {item.action}
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 700 }} className="num">
                      {item.ratio}
                    </td>
                    <td style={{ padding: '14px 14px', color: 'var(--text-secondary)' }}>
                      {item.effectiveDate}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: item.status === 'Approved' ? 'rgba(8, 153, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: item.status === 'Approved' ? '#089981' : '#f59e0b'
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Economic Events Tab */}
        {activeTab === 'economic' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Event Description</th>
                  <th style={{ padding: '12px 14px' }}>Scheduled Date</th>
                  <th style={{ padding: '12px 14px' }}>Country</th>
                  <th style={{ padding: '12px 14px' }}>Market Impact</th>
                  <th style={{ padding: '12px 16px' }}>Consensus Expectation</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredItems(calendarData?.economic).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text)' }}>
                      {item.event}
                    </td>
                    <td style={{ padding: '14px 14px', color: 'var(--text-secondary)' }}>
                      {item.date}
                    </td>
                    <td style={{ padding: '14px 14px', color: 'var(--text-muted)' }}>
                      {item.country}
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: item.impact.includes('High') ? 'rgba(242, 54, 69, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: item.impact.includes('High') ? '#f23645' : '#f59e0b'
                      }}>
                        {item.impact}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {item.expectation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
