import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RefreshCw, Calendar, FileText, CheckCircle2, AlertOctagon, Calculator, Building, ExternalLink, Mail, Phone, MapPin, Target, BarChart } from 'lucide-react';
import { api } from '../services/api';
import GMPBadge from '../components/ipo/GMPBadge';
import GMPHistoryChart from '../components/ipo/GMPHistoryChart';
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
        Loading live offering prospectus, GMP history, and valuation metrics...
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

  const minInvestment = ipo.minInvestment || ((parseFloat(ipo.lotSize) || 1) * (parseFloat(ipo.maxPrice) || 0));
  const shniLots = ipo.shniLotSize || 14;
  const bhniLots = ipo.bhniLotSize || 68;
  const shniMin = ipo.shniMinInvestment || (shniLots * minInvestment);
  const bhniMin = ipo.bhniMinInvestment || (bhniLots * minInvestment);

  return (
    <div>
      {/* Header Banner */}
      <div className="terminal-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {ipo.logoUrl ? (
              <img
                src={ipo.logoUrl}
                alt={ipo.companyName}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '10px',
                  objectFit: 'contain',
                  background: '#ffffff',
                  padding: '4px',
                  border: '1px solid var(--border)'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '10px',
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text)'
              }}>
                {ipo.symbol?.slice(0, 2) || 'IPO'}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                Sector: <strong>{ipo.sector || 'Mainboard'}</strong> • Symbol: <strong>{ipo.symbol}</strong> • Issue Size: <strong>{ipo.issueSize}</strong> • Price Band: <strong>{ipo.priceBand}</strong>
              </div>
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
                {refreshing ? 'Refreshing...' : (cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Live Refresh')}
              </span>
            </button>
          </div>
        </div>

        {/* IPOGyani Dynamic Consensus Summary Bar */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          fontSize: '13px',
          color: 'var(--text)',
          lineHeight: '1.5'
        }}>
          💡 <strong>IPO Snapshot:</strong> Current Grey Market Premium (GMP) is <strong>+{ipo.gmp?.value > 0 ? `₹${ipo.gmp.value}` : '₹0'} (+{ipo.gmp?.percent || 0}%)</strong>, estimated issue size is <strong>{ipo.issueSize}</strong>, and allotment date is <strong>{ipo.allotmentDate || 'TBA'}</strong>.
        </div>
      </div>

      {/* 4-Metric Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Metric 1: GMP */}
        <div className="terminal-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Grey Market Premium (GMP)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--positive)', marginTop: '4px' }}>
            +{ipo.gmp?.value > 0 ? `₹${ipo.gmp.value}` : '₹0'}{' '}
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              (+{ipo.gmp?.percent || 0}%)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Last updated: {ipo.gmp?.lastReported ? new Date(ipo.gmp.lastReported).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
          </div>
        </div>

        {/* Metric 2: Est Listing Price */}
        <div className="terminal-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Estimated Listing Price
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
            ₹{ipo.estimatedListingPrice?.toLocaleString('en-IN') || (ipo.maxPrice + (ipo.gmp?.value || 0)).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Issue Price + Premium
          </div>
        </div>

        {/* Metric 3: Est Profit per Lot */}
        <div className="terminal-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Est. Profit (1 Lot)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--positive)', marginTop: '4px' }}>
            +₹{((ipo.gmp?.value || 0) * (ipo.lotSize || 1)).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Based on {ipo.lotSize} shares lot
          </div>
        </div>

        {/* Metric 4: AI Prediction */}
        <div className="terminal-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            AI Predicted Price
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
            ₹{ipo.aiPrediction?.predictedPrice ? ipo.aiPrediction.predictedPrice.toLocaleString('en-IN') : ipo.maxPrice}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Sentiment: <strong>{ipo.aiPrediction?.sentiment || 'Neutral'}</strong> ({ipo.aiPrediction?.percent || 0}%)
          </div>
        </div>
      </div>

      {/* NEW: GMP History Trend Graph & Day-Wise Breakdown Section */}
      <GMPHistoryChart
        history={ipo.gmpHistory || []}
        lotSize={ipo.lotSize || 1}
        issuePrice={ipo.maxPrice || 0}
      />

      {/* Grid: GMP Badge & Lot Calculations vs Issue Parameters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 2fr)',
        gap: '20px',
        marginBottom: '20px'
      }} className="ipo-detail-grid">
        {/* Left: Unofficial GMP Badge & Lot Calculation Cards */}
        <div>
          <GMPBadge gmp={ipo.gmp} maxPrice={ipo.maxPrice} />

          {/* Retail & HNI Lot Sizes Table Box */}
          <div className="terminal-card" style={{ padding: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
              <Calculator size={15} color="var(--primary)" />
              <span>INVESTMENT & LOT SIZE TIERS</span>
            </div>

            {/* Retail Tier */}
            <div style={{
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                <span>Retail (Min - 1 Lot)</span>
                <span className="num" style={{ color: 'var(--primary)' }}>₹{minInvestment.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Lot Size: {ipo.lotSize} shares</span>
                <span>Cut-off: ₹{ipo.maxPrice?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* sHNI Tier */}
            <div style={{
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                <span>Small HNI (sHNI)</span>
                <span className="num">₹{shniMin.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>{shniLots} Lots ({shniLots * ipo.lotSize} shares)</span>
                <span>Min ₹2 Lakhs</span>
              </div>
            </div>

            {/* bHNI Tier */}
            <div style={{
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                <span>Big HNI (bHNI)</span>
                <span className="num">₹{bhniMin.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>{bhniLots} Lots ({bhniLots * ipo.lotSize} shares)</span>
                <span>Min ₹10 Lakhs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Issue Structure & Key Dates */}
        <div className="terminal-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
            OFFERING TIMELINE & ISSUE STRUCTURE
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Price Band:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.priceBand}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Issue Size:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.issueSize}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Fresh Issue:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.freshIssue || '100% Fresh Issue'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Offer for Sale (OFS):</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.ofs || 'Nil'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Market Cap (Est):</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.marketCap || 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>P/E Ratio:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.peRatio || 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Face Value:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>₹{ipo.faceValue || 10}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Listing Exchanges:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>NSE & BSE ({ipo.segment})</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Bidding Opens:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.openDate}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Bidding Closes:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.closeDate}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Allotment Date:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.allotmentDate}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Tentative Listing:</span>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>{ipo.listingDate}</div>
            </div>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <div>Lead Managers: <strong style={{ color: 'var(--text)' }}>{Array.isArray(ipo.leadManagers) ? ipo.leadManagers.slice(0, 3).join(', ') : 'Axis Capital, Kotak, ICICI'}</strong></div>
            <div style={{ marginTop: '4px' }}>Registrar: <strong style={{ color: 'var(--text)' }}>{ipo.registrar || 'Link Intime / KFin'}</strong></div>
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

      {/* Company Overview & Contact Info (A to Z) */}
      {(ipo.aboutCompany || ipo.companyContactDetails) && (
        <div className="terminal-card" style={{ padding: '18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
            <Building size={16} color="var(--primary)" />
            <span>COMPANY PROFILE & CONTACT DETAILS</span>
          </div>
          {ipo.aboutCompany && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '14px' }}>
              {ipo.aboutCompany}
            </p>
          )}
          {ipo.companyContactDetails && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
              fontSize: '12px'
            }}>
              {ipo.companyContactDetails.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExternalLink size={13} color="var(--primary)" />
                  <a href={ipo.companyContactDetails.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                    {ipo.companyContactDetails.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {ipo.companyContactDetails.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Mail size={13} />
                  <span>{ipo.companyContactDetails.email}</span>
                </div>
              )}
              {ipo.companyContactDetails.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Phone size={13} />
                  <span>{ipo.companyContactDetails.phone}</span>
                </div>
              )}
              {ipo.companyContactDetails.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)', gridColumn: 'span 2' }}>
                  <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{ipo.companyContactDetails.address}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Objects of Issue */}
      {ipo.issueDetails?.ipoObjectives && ipo.issueDetails.ipoObjectives.length > 0 && (
        <div className="terminal-card" style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
            <Target size={16} color="var(--primary)" />
            <span>OBJECTS OF THE ISSUE (FUND UTILIZATION)</span>
          </div>
          <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {ipo.issueDetails.ipoObjectives.map((obj, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{obj}</li>
            ))}
          </ul>
        </div>
      )}

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
            <span>BUSINESS STRENGTHS (GREEN FLAGS)</span>
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
            <span>CRITICAL RISK FACTORS (RED FLAGS)</span>
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
