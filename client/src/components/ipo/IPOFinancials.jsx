import React from 'react';

export default function IPOFinancials({ financials = [] }) {
  if (!financials || financials.length === 0) {
    return <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Financial statement details pending release.</div>;
  }

  const metrics = [
    { label: 'Total Revenue', key: 'revenue' },
    { label: 'Operating Profit (EBITDA)', key: 'ebitda' },
    { label: 'Profit After Tax (PAT)', key: 'pat' },
    { label: 'Basic EPS (₹)', key: 'eps' },
    { label: 'Debt to Equity', key: 'debtToEquity' }
  ];

  return (
    <div className="terminal-card">
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface-secondary)',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text)'
      }}>
        RESTATED AUDITED FINANCIAL STATEMENT
      </div>

      <table className="terminal-table">
        <thead>
          <tr>
            <th>Key Metric</th>
            {financials.map(f => (
              <th key={f.year} className="num-col">{f.year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(m => (
            <tr key={m.key}>
              <td style={{ fontWeight: 500 }}>{m.label}</td>
              {financials.map(f => (
                <td key={f.year} className="num-col num" style={{ fontWeight: m.key === 'pat' || m.key === 'revenue' ? 600 : 400 }}>
                  {f[m.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
