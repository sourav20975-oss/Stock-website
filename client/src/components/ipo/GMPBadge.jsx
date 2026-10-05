import React from 'react';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function GMPBadge({ gmp, maxPrice, compact = false }) {
  const numVal = (gmp?.value !== null && gmp?.value !== undefined && gmp?.value !== '--') ? parseFloat(gmp.value) : null;
  const numPercent = (gmp?.percent !== null && gmp?.percent !== undefined) ? parseFloat(gmp.percent) : null;

  if (numVal === null || isNaN(numVal)) {
    return (
      <span style={{
        fontSize: '11px',
        color: '#64748b',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: '2px 7px',
        borderRadius: '4px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>—</span>
        <span>Awaiting Quotes</span>
      </span>
    );
  }

  const isPositive = numVal > 0;
  const isNeutral = numVal === 0;

  if (compact) {
    if (isNeutral) {
      return (
        <span style={{
          fontSize: '11px',
          color: '#94a3b8',
          backgroundColor: 'rgba(148, 163, 184, 0.08)',
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid rgba(148, 163, 184, 0.15)'
        }}>
          ₹0 (0.0%)
        </span>
      );
    }

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span className="num" style={{
          fontWeight: 700,
          color: isPositive ? '#089981' : '#f23645',
          fontSize: '12px'
        }}>
          {isPositive ? '+' : ''}₹{numVal}
        </span>
        <span className="num" style={{
          fontSize: '11px',
          fontWeight: 600,
          color: isPositive ? '#089981' : '#f23645',
          backgroundColor: isPositive ? 'rgba(8, 153, 129, 0.12)' : 'rgba(242, 54, 69, 0.12)',
          border: isPositive ? '1px solid rgba(8, 153, 129, 0.3)' : '1px solid rgba(242, 54, 69, 0.3)',
          padding: '1px 6px',
          borderRadius: '4px'
        }}>
          {isPositive ? '+' : ''}{numPercent !== null ? `${numPercent}%` : '0%'}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--surface-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <span>GREY MARKET PREMIUM (GMP)</span>
        </div>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--warning)',
          backgroundColor: 'var(--warning-bg)',
          padding: '2px 6px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--warning-border)'
        }}>
          Unofficial / Indicative
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span className="num" style={{
          fontSize: '22px',
          fontWeight: 700,
          color: isPositive ? 'var(--positive)' : 'var(--text)'
        }}>
          ₹{gmp.value}
        </span>
        <span className="num" style={{
          fontSize: '13px',
          fontWeight: 600,
          color: isPositive ? 'var(--positive)' : 'var(--text-muted)'
        }}>
          (~{gmp.percent}% over issue price)
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
        <span>Source: {gmp.source || 'Dealer Desk'}</span>
        <span>Updated: {new Date(gmp.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div style={{
        marginTop: '8px',
        paddingTop: '6px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '10px',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <AlertCircle size={11} color="var(--warning)" />
        <span>GMP represents unofficial street sentiment and does not guarantee listing gains.</span>
      </div>
    </div>
  );
}
