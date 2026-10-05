import React, { useState, useEffect } from 'react';
import { Globe, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export default function GlobalMarketsStrip() {
  const [globals, setGlobals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGlobalMarkets()
      .then(res => {
        if (res.success && res.data) {
          setGlobals(res.data);
        }
      })
      .catch(e => console.warn('Global markets strip error:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading && globals.length === 0) return null;

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      overflowX: 'auto',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Label Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 800,
        color: 'var(--primary)',
        textTransform: 'uppercase',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        paddingRight: '12px'
      }}>
        <Globe size={13} />
        <span>GLOBAL TAPE:</span>
      </div>

      {/* Marquee / Scrollable Items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
        {globals.map((item, idx) => {
          const isUp = item.isUp;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                {item.symbol}
              </span>
              <span style={{ color: 'var(--text-secondary)' }} className="num">
                {item.currency === 'USD' ? '$' : '₹'}{item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1px',
                fontWeight: 700,
                color: isUp ? '#089981' : '#f23645'
              }} className="num">
                {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{isUp ? '+' : ''}{item.changePercent}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
