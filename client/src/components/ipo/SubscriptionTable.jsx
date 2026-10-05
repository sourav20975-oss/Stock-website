import React from 'react';

export default function SubscriptionTable({ subscription }) {
  if (!subscription) {
    return <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Subscription data not yet active.</div>;
  }

  const rows = [
    { category: 'Qualified Institutional Buyers (QIB)', times: subscription.qib || 0 },
    { category: 'Non-Institutional Investors (NII / HNI)', times: subscription.nii || 0 },
    { category: 'Retail Individual Investors (RII)', times: subscription.retail || 0 },
    { category: 'Employee Reservation', times: subscription.employee || 0 }
  ];

  const overall = subscription.overall || 0;

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
          Overall: <strong className="num" style={{ color: overall >= 1 ? 'var(--positive)' : 'var(--text)', fontSize: '12px' }}>{overall}x</strong>
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
            const pct = Math.min(100, (r.times / Math.max(1, overall || 10)) * 100);
            return (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.category}</td>
                <td className="num-col num" style={{ fontWeight: 600, color: r.times >= 1 ? 'var(--positive)' : 'var(--text)' }}>
                  {r.times.toFixed(2)}x
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
                      backgroundColor: r.times >= 1 ? 'var(--positive)' : 'var(--primary)'
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
