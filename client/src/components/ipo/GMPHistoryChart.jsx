import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Activity, BarChart2 } from 'lucide-react';

export default function GMPHistoryChart({ history = [], lotSize = 1, issuePrice = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="terminal-card" style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Historical GMP trend tracking is awaiting initial grey market trades.
        </div>
      </div>
    );
  }

  // Format and chronological order (oldest to newest for graph)
  const sortedForGraph = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  // Reverse chronological for table (newest first)
  const sortedForTable = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Compute graph coordinates
  const values = sortedForGraph.map(h => typeof h.gmp === 'number' ? h.gmp : parseFloat(h.gmp) || 0);
  const maxVal = Math.max(...values, 10);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const points = sortedForGraph.map((h, i) => {
    const val = typeof h.gmp === 'number' ? h.gmp : parseFloat(h.gmp) || 0;
    const x = paddingX + (i / Math.max(1, sortedForGraph.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
    return { x, y, val, item: h };
  });

  const pathD = points.length === 1
    ? `M ${paddingX} ${points[0].y} L ${width - paddingX} ${points[0].y}`
    : points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

  const areaD = points.length === 1
    ? ''
    : `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const formatDate = (dStr) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  const formatShortDate = (dStr) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
      return dStr;
    }
  };

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div className="terminal-card" style={{ padding: '18px', marginBottom: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '12px',
        marginBottom: '16px',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--primary)" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
            GREY MARKET PREMIUM (GMP) TREND & TIMELINE
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(8, 153, 129, 0.1)',
            color: 'var(--positive)',
            border: '1px solid rgba(8, 153, 129, 0.25)'
          }}>
            Historical Trend
          </span>
        </div>
        {activePoint && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {formatDate(activePoint.item.date)}:{' '}
            <strong style={{ color: activePoint.val > 0 ? 'var(--positive)' : 'var(--text)', fontSize: '13px' }}>
              +{activePoint.val > 0 ? `₹${activePoint.val}` : '₹0'}{' '}
              ({activePoint.item.gmpPercent || 0}%)
            </strong>
          </div>
        )}
      </div>

      {/* SVG Interactive Chart */}
      <div style={{ width: '100%', overflowX: 'auto', marginBottom: '20px' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block' }}
        >
          <defs>
            <linearGradient id="gmpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#089981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#089981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="var(--border)" />

          {/* Value labels on Y axis */}
          <text x={paddingX - 6} y={paddingY + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">₹{maxVal}</text>
          <text x={paddingX - 6} y={height / 2 + 3} fill="var(--text-muted)" fontSize="10" textAnchor="end">₹{Math.round((maxVal + minVal) / 2)}</text>
          <text x={paddingX - 6} y={height - paddingY + 3} fill="var(--text-muted)" fontSize="10" textAnchor="end">₹{minVal}</text>

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#gmpGradient)" />}

          {/* Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#089981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 6 : 4}
                fill="#089981"
                stroke="var(--surface)"
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
              {/* Date label at bottom */}
              <text
                x={p.x}
                y={height - 6}
                fill={hoveredIdx === i ? 'var(--text)' : 'var(--text-muted)'}
                fontSize="10"
                textAnchor="middle"
                fontWeight={hoveredIdx === i ? 700 : 500}
              >
                {formatShortDate(p.item.date)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Date-Wise Breakdown Table */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '10px'
        }}>
          <Calendar size={14} color="var(--primary)" />
          <span>DAY-WISE GREY MARKET PREMIUM HISTORY</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="terminal-table" style={{ width: '100%', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Date</th>
                <th className="num-col">IPO GMP (₹)</th>
                <th className="num-col">Sub/Gain (%)</th>
                <th className="num-col">Est. Listing Price</th>
                <th className="num-col">Est. Profit (1 Lot)</th>
                <th style={{ textAlign: 'center' }}>Movement</th>
              </tr>
            </thead>
            <tbody>
              {sortedForTable.map((item, idx) => {
                const gmpVal = typeof item.gmp === 'number' ? item.gmp : parseFloat(item.gmp) || 0;
                const gmpPct = typeof item.gmpPercent === 'number' ? item.gmpPercent : parseFloat(item.gmpPercent) || 0;
                const estPrice = issuePrice > 0 ? issuePrice + gmpVal : (item.estListPrice || (1350 + gmpVal));
                const lotProfit = gmpVal * (lotSize || 1);

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {formatDate(item.date)}
                    </td>
                    <td className="num-col num" style={{ fontWeight: 700, color: gmpVal > 0 ? 'var(--positive)' : 'var(--text)' }}>
                      +{gmpVal > 0 ? `₹${gmpVal}` : '₹0'}
                    </td>
                    <td className="num-col num" style={{ fontWeight: 600, color: gmpVal > 0 ? 'var(--positive)' : 'var(--text-secondary)' }}>
                      +{gmpPct}%
                    </td>
                    <td className="num-col num" style={{ fontWeight: 600, color: 'var(--text)' }}>
                      ₹{estPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="num-col num" style={{ fontWeight: 700, color: lotProfit > 0 ? 'var(--positive)' : 'var(--text)' }}>
                      +₹{lotProfit.toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: gmpVal > 0 ? 'rgba(8, 153, 129, 0.1)' : 'var(--surface-secondary)',
                        color: gmpVal > 0 ? 'var(--positive)' : 'var(--text-secondary)',
                        border: gmpVal > 0 ? '1px solid rgba(8, 153, 129, 0.25)' : '1px solid var(--border)'
                      }}>
                        {gmpVal > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                        <span>{gmpVal > 0 ? 'Bullish' : 'Flat'}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
