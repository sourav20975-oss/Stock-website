import React from 'react';

const parseTimes = (val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export default function SubscriptionTable({ subscription }) {
  if (!subscription) {
    return <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Subscription data not yet active.</div>;
  }

  const rows = [
    { category: 'Qualified Institutional Buyers (QIB)', raw: subscription.qib },
    { category: 'Non-Institutional Investors (NII / HNI)', raw: subscription.nii || subscription.shni },
    { category: 'Retail Individual Investors (RII)', raw: subscription.retail },
    { category: 'Employee Reservation', raw: subscription.employee || 0 }
  ];

  const overallNum = parseTimes(subscription.overall || subscription.total || 0);
  const overallDisplay = typeof subscription.overall === 'string' && subscription.overall.toLowerCase().includes('pending')
    ? 'Pending'
    : `${overallNum.toFixed(2)}x`;

  return (
    <div className="terminal-card">
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--surface-secondary)'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
          BIDDING & SUBSCRIPTION STATUS
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Overall: <strong className="num" style={{ color: overallNum >= 1 ? 'var(--positive)' : 'var(--text)', fontSize: '12px' }}>{overallDisplay}</strong>
        </span>
      </div>

      <table className="terminal-table">
        <thead>
          <tr>
            <th>Investor Category</th>
            <th className="num-col">Demand Multiplier</th>
            <th style={{ width: '40%' }}>Absorption Bar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const num = parseTimes(r.raw);
            const pct = Math.min(100, (num / Math.max(1, overallNum || 10)) * 100);
            const displayVal = typeof r.raw === 'string' && r.raw.toLowerCase().includes('pending')
              ? 'Pending'
              : `${num.toFixed(2)}x`;

            return (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.category}</td>
                <td className="num-col num" style={{ fontWeight: 600, color: num >= 1 ? 'var(--positive)' : 'var(--text)' }}>
                  {displayVal}
                </td>
                <td>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'var(--surface-secondary)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: num >= 1 ? 'var(--positive)' : 'var(--primary)'
                    }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
