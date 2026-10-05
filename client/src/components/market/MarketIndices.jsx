import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function MarketIndices({ indices = [] }) {
  if (!indices || indices.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '12px',
      marginBottom: '20px'
    }}>
      {indices.map(index => {
        const isUp = index.changePercent >= 0;
        const low = index.low || (index.ltp * 0.99);
        const high = index.high || (index.ltp * 1.01);
        const rangeSpread = Math.max(0.01, high - low);
        const ltpPosPct = Math.min(100, Math.max(0, Math.round(((index.ltp - low) / rangeSpread) * 100)));
        const totalBreadth = (index.advances || 30) + (index.declines || 20);
        const advPct = Math.round(((index.advances || 30) / totalBreadth) * 100);

        return (
          <div
            key={index.symbol}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '14px 16px',
              boxShadow: 'var(--card-shadow)',
              borderLeft: `4px solid ${isUp ? 'var(--positive)' : 'var(--negative)'}`,
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
            }}
          >
            {/* Index Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.2px' }}>
                  {index.name || index.symbol}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: index.isRealLive ? 'var(--positive)' : 'var(--text-muted)',
                backgroundColor: index.isRealLive ? 'var(--positive-bg)' : 'var(--surface-secondary)',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: index.isRealLive ? 'var(--positive)' : 'var(--text-muted)'
                }} />
                {index.exchange}
              </span>
            </div>

            {/* Price & Change Badge */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '2px' }}>
              <div className="num" style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text)' }}>
                {index.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: isUp ? 'var(--positive)' : 'var(--negative)',
                backgroundColor: isUp ? 'var(--positive-bg)' : 'var(--negative-bg)',
                padding: '2px 7px',
                borderRadius: '4px'
              }}>
                {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                <span className="num">{isUp ? '+' : ''}{index.changePercent}%</span>
              </div>
            </div>

            {/* Day Range Mini Meter */}
            <div style={{ marginTop: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                <span>L: {low.toFixed(1)}</span>
                <span>H: {high.toFixed(1)}</span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--surface-secondary)',
                borderRadius: '2px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  left: `${ltpPosPct}%`,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isUp ? 'var(--positive)' : 'var(--negative)',
                  transform: 'translateX(-50%)',
                  boxShadow: `0 0 6px ${isUp ? 'var(--positive)' : 'var(--negative)'}`
                }} />
              </div>
            </div>

            {/* Market Breadth Strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10px',
              paddingTop: '6px',
              borderTop: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)'
            }}>
              <span title="Market Breadth: Advances (Stocks Up) vs Declines (Stocks Down)">
                <b style={{ color: 'var(--positive)' }}>▲ {index.advances || 32} Adv</b> / <b style={{ color: 'var(--negative)' }}>▼ {index.declines || 18} Dec</b>
              </span>
              <span className="num" style={{ fontWeight: 600, color: isUp ? 'var(--positive)' : 'var(--negative)' }}>
                {isUp ? '+' : ''}{index.change} pts
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
