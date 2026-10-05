import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RefreshCw, Calendar, FileText, CheckCircle2, AlertOctagon, Calculator, Building } from 'lucide-react';
import { api } from '../services/api';
import GMPBadge from '../components/ipo/GMPBadge';
import SubscriptionTable from '../components/ipo/SubscriptionTable';
import IPOFinancials from '../components/ipo/IPOFinancials';
import AIResearchWidget from '../components/ai/AIResearchWidget';

export default function IPODetails() {
  const { slug } = useParams();
  const [ipo, setIpo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchIPO();
  }, [slug]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const fetchIPO = async () => {
    setLoading(true);
    try {
      const res = await api.getIPODetail(slug);
      if (res.success) setIpo(res.data);
    } catch (err) {
      console.error('Error fetching IPO detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing || cooldownSeconds > 0) return;
    setRefreshing(true);
    setFeedback('');

    try {
      const res = await api.refreshIPO(slug);
      if (res.success && res.data) {
        setIpo(res.data);
        setCooldownSeconds(15);
        setFeedback('✓ Updated latest subscription & GMP');
        setTimeout(() => setFeedback(''), 4000);
      }
    } catch (err) {
      if (err.code === 'RATE_LIMITED' && err.data?.retryAfter) {
        setCooldownSeconds(err.data.retryAfter);
        setFeedback(`Please wait ${err.data.retryAfter}s`);
      } else {
        setFeedback('Unable to refresh IPO data');
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !ipo) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading IPO offering prospectus and Grey Market Premium details...
      </div>
    );
  }

  if (!ipo) {
    return (
      <div className="terminal-card" style={{ padding: '30px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>IPO Issue Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Could not find prospectus details for '{slug}'.
        </p>
      </div>
    );
  }

  const minInvestment = (parseFloat(ipo.lotSize) || 50) * (parseFloat(ipo.maxPrice) || 100);

  return (
    <div>
      {/* Header Banner */}
      <div className="terminal-card" style={{ padding: '18px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                {ipo.companyName}
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: ipo.status === 'open' ? 'var(--positive-bg)' : 'var(--surface-secondary)',
                color: ipo.status === 'open' ? 'var(--positive)' : 'var(--text-secondary)',
                border: `1px solid ${ipo.status === 'open' ? 'var(--positive-border)' : 'var(--border)'}`
              }}>
                {ipo.status}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Symbol: <strong>{ipo.symbol}</strong> • Issue Size: <strong>{ipo.issueSize}</strong> • Price Band: <strong>{ipo.priceBand}</strong>
            </div>
          </div>

          {/* Refresh Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback && (
              <span style={{ fontSize: '11px', color: feedback.includes('✓') ? 'var(--positive)' : 'var(--warning)', fontWeight: 500 }}>
                {feedback}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || cooldownSeconds > 0}
              className="btn-secondary"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span>
                {refreshing ? 'Refreshing...' : (cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Refresh Data')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: GMP Badge & Issue Parameters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 2fr)',
        gap: '20px',
        marginBottom: '20px'
      }} className="ipo-detail-grid">
        {/* Left: Unofficial GMP Badge */}
        <div>
          <GMPBadge gmp={ipo.gmp} maxPrice={ipo.maxPrice} />

          {/* Lot Size Calculator Box */}
          <div className="terminal-card" style={{ padding: '14px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              <Calculator size={14} color="var(--primary)" />
              <span>RETAIL LOT CALCULATION</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Minimum Lot Size:</span>
              <strong className="num">{ipo.lotSize} shares</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cut-off Price:</span>
              <strong className="num">₹{ipo.maxPrice}</strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              paddingTop: '6px',
              borderTop: '1px solid var(--border)',
              marginTop: '6px'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Min. Investment (1 Lot):</span>
              <strong className="num" style={{ color: 'var(--primary)' }}>₹{minInvestment.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Right: Issue Structure & Key Dates */}
        <div className="terminal-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
            ISSUE STRUCTURE & TIMELINE
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Fresh Issue:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.freshIssue || 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Offer for Sale (OFS):</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.ofs || 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Face Value:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.faceValue}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Listing Exchanges:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>NSE & BSE Mainboard</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Bidding Closes:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.closeDate}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Tentative Listing:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.listingDate}</div>
            </div>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Registrar: <strong>{ipo.registrar || 'Link Intime / KFin'}</strong></span>
          </div>
        </div>
      </div>

      {/* Subscription Status & Restated Financials */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <SubscriptionTable subscription={ipo.subscription} />
        <IPOFinancials financials={ipo.financials} />
      </div>

      {/* Strengths & Key Risks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Strengths */}
        <div className="terminal-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--positive)', marginBottom: '10px' }}>
            <CheckCircle2 size={16} />
            <span>BUSINESS STRENGTHS</span>
          </div>
          <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {ipo.strengths?.map((s, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{s}</li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="terminal-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--negative)', marginBottom: '10px' }}>
            <AlertOctagon size={16} />
            <span>CRITICAL RISK FACTORS</span>
          </div>
          <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {ipo.risks?.map((r, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI IPO Research Analysis */}
      <div>
        <AIResearchWidget initialIpoSlug={ipo.slug} />
      </div>
    </div>
  );
}
