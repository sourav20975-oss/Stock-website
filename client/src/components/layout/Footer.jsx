import React from 'react';
import { Link } from 'react-router-dom';
import { getIndianMarketStatus } from '../../utils/marketTiming';
import Logo from '../common/Logo';

export default function Footer() {
  const session = getIndianMarketStatus();

  return (
    <footer style={{
      backgroundColor: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '16px 24px',
      marginTop: 'auto',
      fontSize: '12px',
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Left: Brand & Copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo size={22} subtitle={null} />
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Indian Equity Terminal
          </span>
        </div>

        {/* Center: Essential Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link to="/markets" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Markets
          </Link>
          <Link to="/ipos" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            IPO Hub
          </Link>
          <Link to="/news" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            News
          </Link>
          <Link to="/watchlist" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Watchlist
          </Link>
        </div>

        {/* Right: Quick Market Status & Disclaimer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: session.isOpen ? 'var(--positive)' : '#94a3b8',
            display: 'inline-block'
          }} />
          <span>{session.label} (09:15 – 15:30 IST)</span>
          <span>•</span>
          <span>Educational Use Only</span>
        </div>
      </div>
    </footer>
  );
}
