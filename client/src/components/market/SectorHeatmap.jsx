import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Layers, ArrowUpRight, ArrowDownRight, RefreshCw, Info } from 'lucide-react';
import { api } from '../../services/api';

export default function SectorHeatmap() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredStock, setHoveredStock] = useState(null);

  useEffect(() => {
    api.getSectorHeatmap()
      .then(res => {
        if (res.success && res.data) {
          setSectors(res.data);
        }
      })
      .catch(e => console.warn('Failed to load sector heatmap:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading && sectors.length === 0) {
    return null;
  }

  // Get background color based on changePercent
  const getTileBg = (pct) => {
    if (pct >= 3.0) return 'rgba(8, 153, 129, 0.9)';
    if (pct >= 1.5) return 'rgba(8, 153, 129, 0.75)';
    if (pct > 0) return 'rgba(8, 153, 129, 0.55)';
    if (pct === 0) return 'rgba(148, 163, 184, 0.3)';
    if (pct <= -3.0) return 'rgba(242, 54, 69, 0.9)';
    if (pct <= -1.5) return 'rgba(242, 54, 69, 0.75)';
    return 'rgba(242, 54, 69, 0.55)';
  };

  return (
    <div className="terminal-card" style={{ padding: '18px 20px' }}>
      
      {/* 1. Header & Legend */}
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
            <LayoutGrid size={15} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)' }}>
              Market Sector Heatmap
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Relative performance of benchmark equities grouped by industry
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
          <span>-3%</span>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(242, 54, 69, 0.9)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(242, 54, 69, 0.55)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(148, 163, 184, 0.3)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(8, 153, 129, 0.55)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(8, 153, 129, 0.9)' }} />
          <span>+3%</span>
        </div>
      </div>

      {/* 2. Sector Clusters Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px'
      }}>
        {sectors.map((sec, secIdx) => {
          return (
            <div
              key={secIdx}
              style={{
                backgroundColor: 'var(--surface-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Sector Title Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {sec.sector}
                </span>
                <span style={{ color: sec.isUp ? '#089981' : '#f23645' }} className="num">
                  {sec.isUp ? '+' : ''}{sec.avgChange}% avg
                </span>
              </div>

              {/* Stock Tiles in this Sector */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '6px'
              }}>
                {sec.stocks.map((stk, stkIdx) => {
                  const bg = getTileBg(stk.changePercent);

                  return (
                    <Link
                      key={stkIdx}
                      to={`/stocks/${stk.symbol}`}
                      onMouseEnter={() => setHoveredStock(stk)}
                      onMouseLeave={() => setHoveredStock(null)}
                      style={{
                        textDecoration: 'none',
                        backgroundColor: bg,
                        color: '#ffffff',
                        padding: '8px 6px',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '52px',
                        transition: 'transform 0.15s ease, filter 0.15s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1.0)'}
                    >
                      <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.02em', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        {stk.symbol}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.95 }} className="num">
                        {stk.changePercent >= 0 ? '+' : ''}{stk.changePercent}%
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Info Tooltip Bar */}
      {hoveredStock && (
        <div style={{
          marginTop: '10px',
          padding: '8px 14px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          fontSize: '11.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <strong style={{ color: 'var(--text)' }}>{hoveredStock.symbol}</strong> ({hoveredStock.name})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>LTP: <strong className="num">₹{hoveredStock.ltp.toFixed(2)}</strong></span>
            <span style={{ color: hoveredStock.changePercent >= 0 ? '#089981' : '#f23645', fontWeight: 700 }} className="num">
              {hoveredStock.changePercent >= 0 ? '+' : ''}{hoveredStock.changePercent}%
            </span>
            <span style={{ color: 'var(--text-muted)' }}>M.Cap: {hoveredStock.marketCap}</span>
          </div>
        </div>
      )}

    </div>
  );
}
