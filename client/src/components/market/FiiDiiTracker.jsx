import React, { useState, useEffect } from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, TrendingUp, ShieldCheck, BarChart3, HelpCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function FiiDiiTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFiiDii()
      .then(res => {
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .catch(e => console.warn('Failed to load FII/DII data:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return null;
  }

  const isFiiNetBuy = data.fiiCash.netValue >= 0;
  const isDiiNetBuy = data.diiCash.netValue >= 0;

  return (
    <div className="terminal-card" style={{ padding: '18px 20px' }}>
      
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'var(--primary-subtle)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Landmark size={15} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)' }}>
              FII & DII Institutional Money Flow
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Daily Cash & Derivatives disclosures ({data.date})
            </div>
          </div>
        </div>

        <span style={{
          fontSize: '10.5px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)'
        }}>
          {data.asOf}
        </span>
      </div>

      {/* 2. Main FII & DII Split Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '12px',
        marginBottom: '14px'
      }}>
        {/* FII Box */}
        <div style={{
          backgroundColor: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              FOREIGN INSTITUTIONS (FII / FPI)
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: isFiiNetBuy ? 'rgba(8, 153, 129, 0.15)' : 'rgba(242, 54, 69, 0.15)',
              color: isFiiNetBuy ? '#089981' : '#f23645'
            }}>
              {data.fiiCash.sentiment}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: isFiiNetBuy ? '#089981' : '#f23645' }} className="num">
              {isFiiNetBuy ? '+' : ''}₹{data.fiiCash.netValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Cr
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
            <span>Gross Buy: <strong>₹{data.fiiCash.buyValue.toLocaleString('en-IN')} Cr</strong></span>
            <span>Gross Sell: <strong>₹{data.fiiCash.sellValue.toLocaleString('en-IN')} Cr</strong></span>
          </div>
        </div>

        {/* DII Box */}
        <div style={{
          backgroundColor: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              DOMESTIC INSTITUTIONS (DII / MFs)
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: isDiiNetBuy ? 'rgba(8, 153, 129, 0.15)' : 'rgba(242, 54, 69, 0.15)',
              color: isDiiNetBuy ? '#089981' : '#f23645'
            }}>
              {data.diiCash.sentiment}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: isDiiNetBuy ? '#089981' : '#f23645' }} className="num">
              {isDiiNetBuy ? '+' : ''}₹{data.diiCash.netValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Cr
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
            <span>Gross Buy: <strong>₹{data.diiCash.buyValue.toLocaleString('en-IN')} Cr</strong></span>
            <span>Gross Sell: <strong>₹{data.diiCash.sellValue.toLocaleString('en-IN')} Cr</strong></span>
          </div>
        </div>
      </div>

      {/* 3. 5-Day Trend & Derivative Sentiment Strip */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '10px 14px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        fontSize: '11.5px'
      }}>
        {/* Derivatives Long/Short */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>FII Index F&O Long/Short Ratio:</span>
          <span style={{ fontWeight: 800, color: data.fiiDerivatives.longShortRatio >= 1 ? '#089981' : '#f23645' }}>
            {data.fiiDerivatives.longShortRatio} ({data.fiiDerivatives.longPercent}% Long)
          </span>
        </div>

        {/* 5-Day Cumulative */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Month-to-Date Net Flow:</span>
          <span style={{ fontWeight: 800, color: data.monthlyCumulative.netInstitutionalFlow >= 0 ? '#089981' : '#f23645' }} className="num">
            {data.monthlyCumulative.netInstitutionalFlow >= 0 ? '+' : ''}₹{data.monthlyCumulative.netInstitutionalFlow.toLocaleString('en-IN')} Cr
          </span>
        </div>
      </div>

    </div>
  );
}
